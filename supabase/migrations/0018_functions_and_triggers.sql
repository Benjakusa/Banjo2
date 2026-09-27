-- ============================================================================
-- 0018 — Functions and triggers (hand-written)
--
-- doc 02 §9 lists the integrity triggers the platform requires, and doc 04 §10 fixes this as
-- migration 0018. The statements are written here rather than extracted from the blueprint because
-- doc 03 §4 only ships the shared helpers (`private.set_updated_at`, `private.assert_no_citations`);
-- the behaviour of each trigger below is specified in doc 02 §9 and implemented literally.
--
-- Ordering matters: this migration runs after every table exists (0017) and before the views (0019)
-- and the RLS policies (0020), so a failed trigger never leaves a policy pointing at nothing.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. `set_updated_at` on every table that carries `updated_at` (doc 02 §9)
--    The helper is `private.set_updated_at()` from doc 03 §4: it stamps updated_at, stamps
--    updated_by with the caller and increments `version` — the basis of "every substantive edit
--    creates an immutable revision" (ADR-04).
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and exists (
        select 1 from pg_attribute a
        where a.attrelid = c.oid and a.attname = 'updated_at' and a.attnum > 0 and not a.attisdropped
      )
    order by c.relname
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', r.relname);
    execute format(
      'create trigger set_updated_at before update on public.%I '
      'for each row execute function private.set_updated_at()', r.relname);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. A profile row for every new account
--    doc 04 §4 defines `profiles` with `id` = auth.users(id) and doc 08 §2 gates the console on
--    profiles.account_status, so the row must exist from the moment the account does.
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name, preferred_locale, account_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, 'contributor'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'locale', 'en'),
    'active'
  )
  on conflict (id) do nothing;
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Rights guards (doc 02 §9, ADR-12)
-- ---------------------------------------------------------------------------

-- rights_unknown / disputed / restricted / removed may never be public, whatever the API does.
create or replace function private.enforce_rights_unknown_not_public()
returns trigger
language plpgsql
as $$
begin
  if new.visibility = 'public'
     and new.rights_status in ('rights_unknown','disputed','restricted','removed') then
    raise exception 'ERR_RIGHTS_UNKNOWN_NOT_PUBLIC: rights_status=% cannot be public', new.rights_status
      using errcode = 'check_violation',
            hint = 'Set rights_status to a streamable value first (doc 09 §4).';
  end if;
  return new;
end
$$;

create trigger enforce_rights_unknown_not_public
  before insert or update of rights_status, visibility on recordings
  for each row execute function private.enforce_rights_unknown_not_public();

-- Publication of audio requires a rights record: "publishing audio without a rights record is
-- impossible at the database level" (doc 10, Phase 3 exit criteria).
create or replace function private.enforce_rights_before_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_audio boolean;
  rights_ok boolean;
  media_ok boolean;
begin
  if new.status <> 'published' then
    return new;
  end if;

  select exists (
    select 1
    from recording_media rm
    join media_files mf on mf.id = rm.media_file_id
    where rm.recording_id = new.id
      and mf.deleted_at is null
      and mf.media_kind in ('audio_master','audio_stream')
  ) into has_audio;

  if not has_audio then
    -- Metadata-only entries are legitimate: an orphaned composition can be documented without audio.
    return new;
  end if;

  select exists (
    select 1 from recording_rights rr
    where rr.recording_id = new.id
      and rr.deleted_at is null
      and rr.allows_streaming
      and rr.rights_status not in ('rights_unknown','disputed','restricted','removed')
  ) into rights_ok;

  if not rights_ok then
    raise exception 'ERR_RIGHTS_NOT_PERMITTED: recording % has audio but no streamable rights record', new.id
      using errcode = 'check_violation';
  end if;

  select not exists (
    select 1
    from recording_media rm
    join media_files mf on mf.id = rm.media_file_id
    where rm.recording_id = new.id
      and mf.deleted_at is null
      and mf.media_kind in ('audio_master','audio_stream')
      and (mf.virus_scan_status <> 'clean' or mf.validation_status <> 'valid')
  ) into media_ok;

  if not media_ok then
    raise exception 'ERR_MEDIA_NOT_VALIDATED: recording % has audio that is not scanned and validated', new.id
      using errcode = 'check_violation',
            hint = 'Publish after the media pipeline finishes (doc 09 §3).';
  end if;

  return new;
end
$$;

create trigger enforce_rights_before_publish
  before insert or update of status on recordings
  for each row execute function private.enforce_rights_before_publish();

-- ---------------------------------------------------------------------------
-- 4. `log_revision_on_content_change` (doc 02 §9, ADR-04, doc 10 Phase 2)
--    "Every substantive edit creates an immutable revision" and "revision history is browsable back
--    to version 1 and cannot be destructively edited". Housekeeping columns are excluded so a
--    version bump does not look like an edit.
-- ---------------------------------------------------------------------------
create or replace function private.log_revision_on_content_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity_type entity_type := tg_argv[0]::entity_type;
  v_after jsonb;
  v_before jsonb;
  v_revision_id uuid;
  v_version integer;
  v_key text;
  v_summary text;
begin
  v_after := to_jsonb(new) - 'updated_at' - 'updated_by' - 'search_vector';
  v_before := case when tg_op = 'UPDATE'
    then to_jsonb(old) - 'updated_at' - 'updated_by' - 'search_vector'
    else null end;

  -- Housekeeping must not look like an edit (ADR-04, doc 02 §9). `set_updated_at` runs BEFORE this
  -- trigger, so every write bumps `version`; a touch that changed no tracked column therefore has
  -- to produce no revision at all, and `version` never appears in a change summary or diff row.
  if tg_op = 'UPDATE' and (v_before - 'version') = (v_after - 'version') then
    return new; -- nothing substantive changed
  end if;

  select coalesce(max(version), 0) + 1 into v_version
  from revisions where entity_type = v_entity_type and entity_id = new.id;

  select string_agg(k, ', ' order by k) into v_summary
  from (
    select distinct key k
    from jsonb_each(v_after) a
    left join jsonb_each(coalesce(v_before, '{}'::jsonb)) b using (key)
    where key <> 'version'
      and (v_before is null or a.value is distinct from b.value)
  ) changed;

  insert into revisions (entity_type, entity_id, version, snapshot, change_summary, authored_by, is_approved)
  values (
    v_entity_type, new.id, v_version, v_after,
    case when tg_op = 'INSERT' then 'create' else format('update: %s', coalesce(v_summary, 'no tracked column')) end,
    auth.uid(),
    coalesce((v_after->>'status') = 'published', false)
  )
  returning id into v_revision_id;

  for v_key in
    select distinct key from (
      select key from jsonb_each(v_after)
      union all
      select key from jsonb_each(coalesce(v_before, '{}'::jsonb))
    ) all_keys
  loop
    if v_key <> 'version' and
       (v_before is null or (v_after->v_key) is distinct from (v_before->v_key)) then
      insert into revision_changes (revision_id, field_key, old_value, new_value, change_type)
      values (
        v_revision_id,
        v_key,
        case when v_before is null then null else v_before->v_key end,
        v_after->v_key,
        case when v_before is null then 'create' else 'update' end
      );
    end if;
  end loop;

  return new;
end
$$;

-- Attach to the editorial entities whose history must survive every edit.
do $$
declare
  t text;
begin
  foreach t in array array['songs','recordings','albums','artists','bands','people'] loop
    execute format('drop trigger if exists log_revision_on_content_change on public.%I', t);
    execute format(
      'create trigger log_revision_on_content_change after insert or update on public.%I '
      'for each row execute function private.log_revision_on_content_change(%L)',
      t, case t when 'people' then 'person' else rtrim(t, 's') end);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 5. Counters (doc 02 §9, doc 01 §6: "denormalized counters maintained by triggers")
-- ---------------------------------------------------------------------------
create or replace function private.recalc_song_recording_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_song uuid;
begin
  foreach v_song in array array[
    case when tg_op in ('UPDATE','DELETE') then old.song_id else null end,
    case when tg_op in ('INSERT','UPDATE') then new.song_id else null end
  ] loop
    continue when v_song is null;
    update songs s
       set recording_count = (select count(*) from recordings r
                              where r.song_id = v_song and r.deleted_at is null),
           first_known_recording_year = coalesce(
             s.first_known_recording_year,
             (select min(r.release_year) from recordings r
              where r.song_id = v_song and r.deleted_at is null and r.release_year is not null))
     where s.id = v_song;
  end loop;
  return null;
end
$$;

create trigger recalc_song_recording_count
  after insert or update of song_id, deleted_at or delete on recordings
  for each row execute function private.recalc_song_recording_count();

create or replace function private.recalc_band_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_band uuid;
begin
  foreach v_band in array array[
    case when tg_op in ('UPDATE','DELETE') then old.band_id else null end,
    case when tg_op in ('INSERT','UPDATE') then new.band_id else null end
  ] loop
    continue when v_band is null;
    update bands b
       set member_count = coalesce((
             select count(*) from band_members bm
             where bm.band_id = v_band and bm.deleted_at is null
               and (bm.end_year is null or bm.end_year >= extract(year from now())::int)
           ), 0)
     where b.id = v_band;
  end loop;
  return null;
end
$$;

create trigger recalc_band_member_count
  after insert or update of band_id, end_year, deleted_at or delete on band_members
  for each row execute function private.recalc_band_counters();

create or replace function private.recalc_band_recording_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_band uuid;
begin
  foreach v_band in array array[
    case when tg_op in ('UPDATE','DELETE') then old.band_id else null end,
    case when tg_op in ('INSERT','UPDATE') then new.band_id else null end
  ] loop
    continue when v_band is null;
    update bands b
       set recording_count = (select count(*) from recordings r
                              where r.band_id = v_band and r.deleted_at is null)
     where b.id = v_band;
  end loop;
  return null;
end
$$;

create trigger recalc_band_recording_count
  after insert or update of band_id, deleted_at or delete on recordings
  for each row execute function private.recalc_band_recording_count();

create or replace function private.recalc_album_track_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_album uuid;
begin
  foreach v_album in array array[
    case when tg_op in ('UPDATE','DELETE') then old.album_id else null end,
    case when tg_op in ('INSERT','UPDATE') then new.album_id else null end
  ] loop
    continue when v_album is null;
    update albums a
       set track_count = (select count(*) from album_tracks at
                          where at.album_id = v_album and at.deleted_at is null)
     where a.id = v_album;
  end loop;
  return null;
end
$$;

create trigger recalc_album_track_count
  after insert or update of album_id, deleted_at or delete on album_tracks
  for each row execute function private.recalc_album_track_count();

-- ---------------------------------------------------------------------------
-- 6. `log_audit_on_admin_action` (doc 02 §9, doc 08 §6)
--    "Every privileged mutation writes to audit_logs with who, what, when, where, before, after,
--    reason" and "audit_logs is append-only from the application's perspective". The function is
--    SECURITY DEFINER because no client role has an insert policy on audit_logs — the trigger is the
--    only writer besides Edge Functions.
-- ---------------------------------------------------------------------------
create or replace function private.log_audit_on_admin_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  v_after jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  v_row jsonb := coalesce(v_after, v_before);
  v_actor uuid := auth.uid();
  v_role text;
begin
  select r.code into v_role
  from user_roles ur
  join roles r on r.id = ur.role_id
  where ur.user_id = v_actor and ur.revoked_at is null
  order by r.rank
  limit 1;

  insert into audit_logs (
    actor_id, actor_role, action, target_type, target_id,
    before_values, after_values, reason, source
  ) values (
    v_actor,
    v_role,
    lower(tg_op),
    tg_table_name,
    nullif(v_row->>'id', '')::uuid,
    v_before,
    v_after,
    coalesce(v_row->>'reason', v_row->>'resolution_note', v_row->>'change_reason'),
    case when v_actor is null then 'system' else 'admin_console' end
  );
  return null;
end
$$;

do $$
declare
  t text;
begin
  -- doc 08 §6 "Required coverage": rights, publish/withdraw, hide/restore, roles, account status,
  -- media restriction, claims, feature flags.
  foreach t in array array[
    'recordings', 'recording_rights', 'licenses', 'user_roles', 'user_permissions',
    'profiles', 'media_files', 'moderation_actions', 'copyright_claims',
    'takedown_requests', 'rights_disputes', 'feature_flags', 'app_releases',
    'field_assertions', 'reports', 'submissions', 'edits', 'review_decisions',
    'documents', 'photographs', 'interviews', 'song_histories', 'entity_histories'
  ] loop
    execute format('drop trigger if exists log_audit_on_admin_action on public.%I', t);
    execute format(
      'create trigger log_audit_on_admin_action after insert or update or delete on public.%I '
      'for each row execute function private.log_audit_on_admin_action()', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 7. `maintain_band_member_interval` (doc 02 §9)
--    "Rejects overlapping or undated membership intervals" — membership data is historical
--    evidence, so an undated row is not acceptable and two overlapping stints for the same person in
--    the same band would make the line-up unreconstructable.
-- ---------------------------------------------------------------------------
create or replace function private.maintain_band_member_interval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start int := coalesce(extract(year from new.start_date)::int, new.start_year);
  v_end int := coalesce(extract(year from new.end_date)::int, new.end_year);
begin
  if v_start is null then
    raise exception 'ERR_VALIDATION: band membership needs a start year or start date'
      using errcode = 'check_violation', column = 'start_year';
  end if;
  if v_end is not null and v_end < v_start then
    raise exception 'ERR_VALIDATION: band membership ends (%) before it starts (%)', v_end, v_start
      using errcode = 'check_violation', column = 'end_year';
  end if;
  if exists (
    select 1 from band_members bm
    where bm.band_id = new.band_id
      and bm.person_id = new.person_id
      and bm.deleted_at is null
      and bm.id <> coalesce(new.id, gen_random_uuid())
      and coalesce(extract(year from bm.start_date)::int, bm.start_year) <= coalesce(v_end, 9999)
      and coalesce(extract(year from bm.end_date)::int, bm.end_year, 9999) >= v_start
  ) then
    raise exception 'ERR_CONFLICT: % already has an overlapping membership in this band', new.person_id
      using errcode = 'unique_violation',
            hint = 'Close the previous stint before opening a new one (doc 02 §9).';
  end if;
  return new;
end
$$;

create trigger maintain_band_member_interval
  before insert or update of band_id, person_id, start_year, end_year, start_date, end_date
  on band_members
  for each row execute function private.maintain_band_member_interval();

-- ---------------------------------------------------------------------------
-- 8. `prevent_hard_delete_archive_rows` (doc 02 §9, ADR-09)
--    "Deletes are soft by default; audit records are append-only." A row that is cited as evidence
--    cannot disappear: doc 09 §5 promises that "a claim never deletes history".
-- ---------------------------------------------------------------------------
create or replace function private.prevent_hard_delete_archive_rows()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity_type entity_type := tg_argv[0]::entity_type;
begin
  if exists (
    select 1 from citations c
    where c.target_type = v_entity_type and c.target_id = old.id
  ) then
    raise exception 'ARCHIVE_ROW_HAS_CITATIONS: soft-delete instead (deleted_at)'
      using errcode = 'restrict_violation';
  end if;

  if exists (
    select 1 from entity_histories h
    where h.entity_type = v_entity_type and h.entity_id = old.id and h.deleted_at is null
  ) then
    raise exception 'ARCHIVE_ROW_HAS_HISTORY: soft-delete instead (deleted_at)'
      using errcode = 'restrict_violation';
  end if;

  if v_entity_type = 'song' and exists (
    select 1 from song_histories h where h.song_id = old.id and h.deleted_at is null
  ) then
    raise exception 'ARCHIVE_ROW_HAS_HISTORY: soft-delete instead (deleted_at)'
      using errcode = 'restrict_violation';
  end if;

  return old;
end
$$;

do $$
declare
  t text;
begin
  foreach t in array array['songs','recordings','albums','artists','bands','people'] loop
    execute format('drop trigger if exists prevent_hard_delete_archive_rows on public.%I', t);
    execute format(
      'create trigger prevent_hard_delete_archive_rows before delete on public.%I '
      'for each row execute function private.prevent_hard_delete_archive_rows(%L)',
      t, case t when 'people' then 'person' else rtrim(t, 's') end);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 9. Note on `update_search_vector` (doc 02 §9)
--    No trigger is needed: every `search_vector` column in the schema is a
--    `generated always as (...) stored` column (songs, recordings, albums, artists, bands, people,
--    documents, interviews, song_histories), so PostgreSQL recomputes it on write by construction and
--    the GIN indexes can never drift. scripts/test-migrations.sh asserts the generated columns exist.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 10. The job queue claim pattern
--     doc 04 §7 documents the claim query as an illustration (with a `$1` placeholder) rather than as
--     DDL. It lives here so every worker — Edge Function or background job — uses the same
--     SKIP LOCKED semantics instead of re-implementing them:
--       "Workers claim rows with SKIP LOCKED so several workers can run safely."
-- ---------------------------------------------------------------------------
create or replace function public.claim_jobs(p_worker text, p_limit integer default 1)
returns setof job_queue
language sql
volatile
security definer
set search_path = public
as $$
  update job_queue j
     set status = 'running',
         locked_by = p_worker,
         locked_at = now(),
         started_at = now(),
         attempts = attempts + 1
   where j.id in (
     select id from job_queue
     where status = 'queued' and run_after <= now()
     order by priority asc, run_after asc
     for update skip locked
     limit greatest(p_limit, 1)
   )
  returning j.*;
$$;

revoke all on function public.claim_jobs(text, integer) from public, anon, authenticated;
grant execute on function public.claim_jobs(text, integer) to service_role;

-- Workers that die mid-job must not block the queue forever (doc 04 §7 `max_attempts`).
create or replace function public.fail_job(p_job_id uuid, p_error text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update job_queue
     set status = (case when attempts >= max_attempts then 'failed' else 'queued' end)::job_status,
         last_error = p_error,
         locked_by = null,
         locked_at = null,
         finished_at = case when attempts >= max_attempts then now() else null end,
         run_after = case when attempts >= max_attempts then run_after
                          else now() + (least(attempts, 6) * interval '30 seconds') end
   where id = p_job_id;
$$;

revoke all on function public.fail_job(uuid, text) from public, anon, authenticated;
grant execute on function public.fail_job(uuid, text) to service_role;
