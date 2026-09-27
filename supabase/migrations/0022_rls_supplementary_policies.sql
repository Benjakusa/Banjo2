-- ============================================================================
-- 0022 — RLS supplementary policies (hand-written, extends 0020)
--
-- doc 05 (§3–§4) enables RLS on every table and defines 84 policies, but the policy set stops at
-- the "headline" tables: `artists`, `bands`, `albums`, the join tables, the evidence tables and the
-- identity/ops tables are left with RLS enabled and **no policy**, which doc 05 calls "the intended
-- failure mode" (readable by nobody).
--
-- Phase 1's exit criteria cannot be met that way — "a signed-in user can search a seeded catalogue,
-- open a song page, play audio, and see artist/band/musician/album pages" and "anonymous browsing
-- works for published content only" (doc 10 §1) — so this migration adds the missing policies using
-- exactly the idioms of doc 05: `private.is_public(status, deleted_at)`, `private.has_permission()`,
-- explicit `to anon` / `to authenticated`, and no policy that would expose a draft or a
-- rights-restricted asset (ADR-12).
--
-- After this migration no table is policy-less: scripts/test-migrations.sh enforces that, and
-- supabase/tests/rls-policy-allowlist.txt documents the (now empty) deliberate exceptions.
-- ============================================================================

-- Polymorphic tables (entity_histories, entity_translations, citations, field_assertions) reference
-- an entity by (entity_type, entity_id). doc 05 leaves the polymorphic cases to the client; a public
-- reader must not be able to read draft content through them, so the check is centralised here.
create or replace function private.entity_is_public(p_entity_type entity_type, p_entity_id uuid)
returns boolean
language sql
stable
security invoker
as $$
  select case p_entity_type
    when 'song' then exists (select 1 from songs s
      where s.id = p_entity_id and private.is_public(s.status, s.deleted_at))
    when 'recording' then exists (select 1 from recordings r
      where r.id = p_entity_id and private.is_public(r.status, r.deleted_at))
    when 'album' then exists (select 1 from albums a
      where a.id = p_entity_id and private.is_public(a.status, a.deleted_at))
    when 'artist' then exists (select 1 from artists a
      where a.id = p_entity_id and private.is_public(a.status, a.deleted_at))
    when 'band' then exists (select 1 from bands b
      where b.id = p_entity_id and private.is_public(b.status, b.deleted_at))
    when 'person' then exists (select 1 from people p
      where p.id = p_entity_id and private.is_public(p.status, p.deleted_at))
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Public entity pages: albums, artists, bands (mirrors songs_select_public)
-- ---------------------------------------------------------------------------

create policy albums_select_public on albums
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy albums_select_staff on albums
  for select to authenticated using (private.is_staff());

create policy albums_write_staff on albums
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy artists_select_public on artists
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy artists_select_staff on artists
  for select to authenticated using (private.is_staff());

create policy artists_write_staff on artists
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy bands_select_public on bands
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy bands_select_staff on bands
  for select to authenticated using (private.is_staff());

create policy bands_write_staff on bands
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

-- ---------------------------------------------------------------------------
-- 2. Join tables: visible exactly when their public parent is visible
-- ---------------------------------------------------------------------------

create policy album_tracks_select_public on album_tracks
  for select to anon, authenticated
  using (exists (select 1 from albums a
                 where a.id = album_id and private.is_public(a.status, a.deleted_at)));

create policy album_tracks_write_staff on album_tracks
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy song_genres_select_public on song_genres
  for select to anon, authenticated
  using (exists (select 1 from songs s
                 where s.id = song_id and private.is_public(s.status, s.deleted_at)));

create policy song_genres_write_staff on song_genres
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy song_composers_select_public on song_composers
  for select to anon, authenticated
  using (exists (select 1 from songs s
                 where s.id = song_id and private.is_public(s.status, s.deleted_at)));

create policy song_composers_write_staff on song_composers
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy song_musicians_select_public on song_musicians
  for select to anon, authenticated
  using (exists (select 1 from songs s
                 where s.id = song_id and private.is_public(s.status, s.deleted_at)));

create policy song_musicians_write_staff on song_musicians
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy song_albums_select_public on song_albums
  for select to anon, authenticated
  using (exists (select 1 from songs s
                 where s.id = song_id and private.is_public(s.status, s.deleted_at)));

create policy song_albums_write_staff on song_albums
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy recording_credits_select_public on recording_credits
  for select to anon, authenticated
  using (exists (select 1 from recordings r
                 where r.id = recording_id and private.is_public(r.status, r.deleted_at)));

create policy recording_credits_write_staff on recording_credits
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy artist_bands_select_public on artist_bands
  for select to anon, authenticated
  using (
    exists (select 1 from artists a
            where a.id = artist_id and private.is_public(a.status, a.deleted_at))
    or exists (select 1 from bands b
               where b.id = band_id and private.is_public(b.status, b.deleted_at))
  );

create policy artist_bands_write_staff on artist_bands
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy musician_instruments_select_public on musician_instruments
  for select to anon, authenticated
  using (exists (select 1 from people p
                 where p.id = person_id and private.is_public(p.status, p.deleted_at)));

create policy musician_instruments_write_staff on musician_instruments
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

-- ---------------------------------------------------------------------------
-- 3. Evidence and storytelling tables (doc 02 §2.4, §2.5)
-- ---------------------------------------------------------------------------

create policy entity_histories_select_public on entity_histories
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy entity_histories_select_staff on entity_histories
  for select to authenticated using (private.is_staff());

create policy entity_histories_write_staff on entity_histories
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

-- The translation row is visible only when the entity it translates is published (doc 02 §11 keeps
-- `security_invoker` views honest; this keeps the table-level policy honest).
create policy entity_translations_select_public on entity_translations
  for select to anon, authenticated
  using (private.entity_is_public(entity_type, entity_id));

create policy entity_translations_select_staff on entity_translations
  for select to authenticated using (private.is_staff());

create policy entity_translations_write_staff on entity_translations
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy historical_events_select_public on historical_events
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy historical_events_select_staff on historical_events
  for select to authenticated using (private.is_staff());

create policy historical_events_write_staff on historical_events
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy timelines_select_public on timelines
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy timelines_write_staff on timelines
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy timeline_items_select_public on timeline_items
  for select to anon, authenticated
  using (exists (select 1 from timelines t
                 where t.id = timeline_id and private.is_public(t.status, t.deleted_at)));

create policy timeline_items_write_staff on timeline_items
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

-- Photographs, documents and interviews carry their own rights_status: an item may be catalogued and
-- readable while its asset stays restricted, but metadata for `rights_unknown` never goes public
-- (ADR-12, doc 09 §4).
create policy photographs_select_public on photographs
  for select to anon, authenticated
  using (
    private.is_public(status, deleted_at)
    and rights_status not in ('rights_unknown','disputed','removed','restricted')
  );

create policy photographs_write_staff on photographs
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy documents_select_public on documents
  for select to anon, authenticated
  using (
    private.is_public(status, deleted_at)
    and rights_status not in ('rights_unknown','disputed','removed','restricted')
  );

create policy documents_write_staff on documents
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy interviews_select_public on interviews
  for select to anon, authenticated
  using (
    private.is_public(status, deleted_at)
    and rights_status not in ('rights_unknown','disputed','removed','restricted')
  );

create policy interviews_write_staff on interviews
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

-- ---------------------------------------------------------------------------
-- 4. Vocabulary tables not covered by doc 05 §4.2
-- ---------------------------------------------------------------------------

create policy languages_select_all on languages
  for select to anon, authenticated using (true);

create policy regions_select_all on regions
  for select to anon, authenticated using (true);

create policy instruments_select_all on instruments
  for select to anon, authenticated using (true);

create policy labels_select_all on labels
  for select to anon, authenticated using (true);

create policy studios_select_all on studios
  for select to anon, authenticated using (true);

create policy recording_venues_select_all on recording_venues
  for select to anon, authenticated using (true);

create policy languages_write_staff on languages
  for all to authenticated
  using (private.has_permission('config.manage')) with check (private.has_permission('config.manage'));

create policy regions_write_staff on regions
  for all to authenticated
  using (private.has_permission('config.manage')) with check (private.has_permission('config.manage'));

create policy instruments_write_staff on instruments
  for all to authenticated
  using (private.has_permission('config.manage')) with check (private.has_permission('config.manage'));

create policy labels_write_staff on labels
  for all to authenticated
  using (private.has_permission('content.review')) with check (private.has_permission('content.review'));

create policy studios_write_staff on studios
  for all to authenticated
  using (private.has_permission('content.review')) with check (private.has_permission('content.review'));

create policy recording_venues_write_staff on recording_venues
  for all to authenticated
  using (private.has_permission('content.review')) with check (private.has_permission('content.review'));

-- ---------------------------------------------------------------------------
-- 5. Rights records: rights team only (doc 05 §7 tests that an analyst gets 0 rows)
-- ---------------------------------------------------------------------------

create policy licenses_select_rights on licenses
  for select to authenticated using (private.is_rights_manager());

create policy rights_declarations_select_rights on rights_declarations
  for select to authenticated using (private.is_rights_manager());

create policy rights_declarations_select_declarant on rights_declarations
  for select to authenticated using (declarant_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Identity: staff may read, only Edge Functions (service role) may write.
--    doc 05 §1: "Role grants and revocations are audited"; the grant itself happens in a server
--    runtime where `audit_logs` can be written in the same transaction.
-- ---------------------------------------------------------------------------

create policy roles_select_staff on roles
  for select to authenticated using (private.is_staff());

create policy permissions_select_staff on permissions
  for select to authenticated using (private.is_staff());

create policy role_permissions_select_staff on role_permissions
  for select to authenticated using (private.is_staff());

create policy user_roles_select_own on user_roles
  for select to authenticated using (user_id = auth.uid() or private.is_staff());

create policy user_permissions_select_own on user_permissions
  for select to authenticated using (user_id = auth.uid() or private.is_staff());

-- Users may see their own account-status history (shown in the app, doc 07 §4); support staff see it
-- through `users.view`.
create policy account_status_history_select_own on account_status_history
  for select to authenticated
  using (user_id = auth.uid() or private.has_permission('users.view'));

-- ---------------------------------------------------------------------------
-- 7. Media-adjacent and operational tables
-- ---------------------------------------------------------------------------

-- Duplicate triage is reviewer work: "exact-duplicate uploads are detected and routed to reviewers,
-- never silently duplicated" (doc 10 Phase 4), so hashes and candidates are staff-readable only.
create policy fingerprints_select_staff on fingerprints
  for select to authenticated using (private.is_staff());

create policy duplicate_candidates_select_staff on duplicate_candidates
  for select to authenticated using (private.is_staff());

create policy duplicate_candidates_update_staff on duplicate_candidates
  for update to authenticated
  using (private.is_staff()) with check (private.is_staff());

-- Clients read the minimum supported version (doc 07 §1 `core/config`).
create policy app_releases_select_public on app_releases
  for select to anon, authenticated using (true);

create policy app_releases_write_admin on app_releases
  for all to authenticated
  using (private.has_permission('config.manage')) with check (private.has_permission('config.manage'));

-- Feature flags: clients see enabled flags only; admins see and change all of them (doc 08 §7).
create policy feature_flags_select_public on feature_flags
  for select to anon, authenticated using (is_enabled);

create policy feature_flags_select_admin on feature_flags
  for select to authenticated using (private.has_permission('config.manage'));

create policy feature_flags_write_admin on feature_flags
  for all to authenticated
  using (private.has_permission('config.manage')) with check (private.has_permission('config.manage'));

-- Job health (§69) and analytics rollups (§68) are console concerns with their own permissions.
create policy job_queue_select_system on job_queue
  for select to authenticated using (private.has_permission('system.admin'));

create policy job_queue_update_system on job_queue
  for update to authenticated
  using (private.has_permission('system.admin')) with check (private.has_permission('system.admin'));

create policy system_health_snapshots_select_system on system_health_snapshots
  for select to authenticated using (private.has_permission('system.admin'));

create policy analytics_events_daily_select_analyst on analytics_events_daily
  for select to authenticated using (private.has_permission('analytics.view'));

create policy rate_limit_counters_select_system on rate_limit_counters
  for select to authenticated using (private.has_permission('system.admin'));
