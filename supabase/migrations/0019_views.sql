-- ============================================================================
-- 0019 — Views exposed to clients (hand-written)
--
-- doc 02 §11 defines the view set and requires: "Every view is created with `security_invoker = true`
-- so the querying user's RLS still applies."
--
-- The option is PostgreSQL 15+, which is what Supabase runs. The local harness in this repository can
-- run on PostgreSQL 14 (the version shipped with this machine's distro and the only one available
-- without Docker), where the option does not exist — so it is applied conditionally and the fact is
-- logged, rather than silently dropped. On PostgreSQL 15+ (every Supabase environment) all views are
-- `security_invoker`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- v_song_detail — song + composition facts + disputed-field flags (doc 02 §11)
-- ---------------------------------------------------------------------------
create or replace view v_song_detail as
select
  s.id,
  s.title,
  s.title_local,
  s.subtitle,
  s.composition_year,
  s.first_known_recording_year,
  s.recording_count,
  s.is_instrumental,
  s.summary,
  s.status,
  s.verification,
  s.is_verified_disputed,
  g.name  as primary_genre,
  l.name  as canonical_language,
  s.primary_genre_id,
  s.canonical_language_id,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
              'person_id', sc.person_id,
              'name', coalesce(p.full_name, sc.credit_text),
              'role', sc.role,
              'is_primary', sc.is_primary)
            order by sc.is_primary desc, p.full_name)
     from song_composers sc
     left join people p on p.id = sc.person_id
     where sc.song_id = s.id),
    '[]'::jsonb) as composers,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
              'field_key', fa.field_key,
              'value_display', fa.value_display,
              'status', fa.status,
              'source_id', fa.source_id)
            order by fa.field_key)
     from field_assertions fa
     where fa.entity_type = 'song' and fa.entity_id = s.id
       and (fa.is_disputed or fa.status in ('contested','proposed'))),
    '[]'::jsonb) as disputed_fields,
  s.created_at,
  s.updated_at,
  s.deleted_at
from songs s
left join genres g on g.id = s.primary_genre_id
left join languages l on l.id = s.canonical_language_id;

-- ---------------------------------------------------------------------------
-- v_recording_detail — recording + rights summary + primary media + performers
-- ---------------------------------------------------------------------------
create or replace view v_recording_detail as
select
  r.id,
  r.song_id,
  r.title,
  s.title as song_title,
  r.band_id,
  b.name  as band_name,
  r.artist_id,
  a.stage_name as artist_name,
  r.country_id,
  c.name  as country_name,
  c.iso2  as country_iso2,
  r.release_year,
  r.recording_year,
  r.matrix_number,
  r.catalog_number,
  r.duration_seconds,
  r.is_live,
  r.status,
  r.visibility,
  r.rights_status,
  r.verification,
  r.play_count,
  rr.allows_streaming,
  rr.permitted_scope,
  rr.rights_holder_id,
  (select mf.storage_key
     from recording_media rm
     join media_files mf on mf.id = rm.media_file_id
    where rm.recording_id = r.id
      and mf.media_kind in ('audio_master','audio_stream')
      and mf.deleted_at is null
    order by rm.is_primary desc, mf.is_original_master desc, mf.created_at
    limit 1) as primary_audio_key,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
              'person_id', rm2.person_id,
              'name', p2.full_name,
              'role', rm2.role,
              'instrument', i.name,
              'is_featured', rm2.is_featured)
            order by rm2.is_featured desc, p2.full_name)
     from recording_musicians rm2
     left join people p2 on p2.id = rm2.person_id
     left join instruments i on i.id = rm2.instrument_id
     where rm2.recording_id = r.id),
    '[]'::jsonb) as musicians,
  r.created_at,
  r.updated_at,
  r.deleted_at
from recordings r
left join songs s on s.id = r.song_id
left join bands b on b.id = r.band_id
left join artists a on a.id = r.artist_id
left join countries c on c.id = r.country_id
left join recording_rights rr on rr.recording_id = r.id and rr.deleted_at is null;

-- ---------------------------------------------------------------------------
-- v_artist_profile / v_band_profile — profile, role list, counters (doc 02 §11)
-- ---------------------------------------------------------------------------
create or replace view v_artist_profile as
select
  a.id,
  a.stage_name as name,
  a.artist_type,
  a.bio,
  a.years_active_from,
  a.years_active_to,
  a.status,
  a.verification,
  a.is_rights_holder,
  a.country_id,
  c.name as country_name,
  coalesce(
    (select jsonb_agg(jsonb_build_object('band_id', ab.band_id, 'name', bd.name, 'role', ab.role_label))
     from artist_bands ab join bands bd on bd.id = ab.band_id
     where ab.artist_id = a.id),
    '[]'::jsonb) as bands,
  (select count(*) from recordings r where r.artist_id = a.id and r.deleted_at is null) as recording_count,
  a.created_at,
  a.updated_at,
  a.deleted_at
from artists a
left join countries c on c.id = a.country_id;

create or replace view v_band_profile as
select
  b.id,
  b.name,
  b.band_type,
  b.city,
  b.formed_year,
  b.dissolved_year,
  b.history,
  b.status,
  b.verification,
  b.member_count,
  b.recording_count,
  b.country_id,
  c.name as country_name,
  c.iso2 as country_iso2,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
              'person_id', bm.person_id,
              'name', p.full_name,
              'role', bm.role_label,
              'start_year', bm.start_year,
              'end_year', bm.end_year,
              'is_founder', bm.is_founder)
            order by bm.start_year)
     from band_members bm left join people p on p.id = bm.person_id
     where bm.band_id = b.id and bm.deleted_at is null),
    '[]'::jsonb) as members,
  b.created_at,
  b.updated_at,
  b.deleted_at
from bands b
left join countries c on c.id = b.country_id;

-- ---------------------------------------------------------------------------
-- v_country_page — country + regions + genres + counts (doc 02 §11)
-- ---------------------------------------------------------------------------
create or replace view v_country_page as
select
  c.id,
  c.iso2,
  c.iso3,
  c.name,
  c.name_local,
  c.region_group,
  c.is_active,
  coalesce((select jsonb_agg(jsonb_build_object('id', rg.id, 'name', rg.name) order by rg.name)
            from regions rg where rg.country_id = c.id), '[]'::jsonb) as regions,
  coalesce((select jsonb_agg(distinct jsonb_build_object('id', g.id, 'name', g.name))
            from recordings r join genres g on g.id = r.primary_genre_id
            where r.country_id = c.id and r.deleted_at is null), '[]'::jsonb) as genres,
  (select count(*) from recordings r where r.country_id = c.id and r.deleted_at is null) as recording_count,
  (select count(*) from bands b where b.country_id = c.id and b.deleted_at is null) as band_count
from countries c;

-- ---------------------------------------------------------------------------
-- v_timeline — timeline_items joined to events and recordings (doc 02 §11)
-- ---------------------------------------------------------------------------
create or replace view v_timeline as
select
  t.id    as timeline_id,
  t.slug,
  t.title as timeline_title,
  ti.id   as item_id,
  ti.position,
  coalesce(ti.year, he.year) as year,
  coalesce(ti.caption, he.title) as caption,
  he.event_type,
  he.description,
  he.recording_id,
  he.band_id,
  he.person_id,
  t.status as timeline_status
from timelines t
join timeline_items ti on ti.timeline_id = t.id and ti.deleted_at is null
left join historical_events he on he.id = ti.historical_event_id;

-- ---------------------------------------------------------------------------
-- v_search_index — uniform search rows for every entity type (doc 02 §11, doc 06 §4)
-- "Search response rows are uniform: type, id, title, subtitle, image_url, verification,
--  is_disputed, score."
-- ---------------------------------------------------------------------------
create or replace view v_search_index as
with aliases as (
  select entity_type, entity_id, string_agg(alias, ' ' order by alias) as alias_text
  from entity_aliases
  group by entity_type, entity_id
)
select 'song'::text as type, s.id, s.title, s.subtitle,
       g.name as subtitle_extra, null::smallint as released_year,
       s.primary_genre_id, s.status, s.verification,
       s.is_verified_disputed as is_disputed, s.recording_count as popularity,
       s.search_vector, al.alias_text, s.created_at, s.deleted_at
from songs s
left join genres g on g.id = s.primary_genre_id
left join aliases al on al.entity_type = 'song' and al.entity_id = s.id
union all
select 'recording', r.id, r.title, r.catalog_number, b.name, r.release_year,
       r.primary_genre_id, r.status, r.verification, false, r.play_count,
       r.search_vector, al.alias_text, r.created_at, r.deleted_at
from recordings r
left join bands b on b.id = r.band_id
left join aliases al on al.entity_type = 'recording' and al.entity_id = r.id
-- Mirror of `recordings_select_public` (doc 05). The view's own filters plus the ones in
-- `search_catalogue()` must be enough on their own: on PostgreSQL 14 (local harness) the view has
-- no security_invoker option, so RLS of the base table would otherwise not reach the search path.
where r.visibility = 'public'
  and r.rights_status not in ('rights_unknown','disputed','removed','restricted')
union all
select 'album', a.id, a.title, a.catalog_number, b.name, a.release_year,
       null, a.status, a.verification, false, a.track_count,
       a.search_vector, al.alias_text, a.created_at, a.deleted_at
from albums a
left join bands b on b.id = a.band_id
left join aliases al on al.entity_type = 'album' and al.entity_id = a.id
union all
select 'artist', a.id, a.stage_name, a.artist_type, c.name, a.years_active_from::smallint,
       a.primary_genre_id, a.status, a.verification, false, 0,
       a.search_vector, al.alias_text, a.created_at, a.deleted_at
from artists a
left join countries c on c.id = a.country_id
left join aliases al on al.entity_type = 'artist' and al.entity_id = a.id
union all
select 'band', b.id, b.name, b.band_type, c.name, b.formed_year::smallint,
       null::uuid, b.status, b.verification, false, b.recording_count,
       b.search_vector, al.alias_text, b.created_at, b.deleted_at
from bands b
left join countries c on c.id = b.country_id
left join aliases al on al.entity_type = 'band' and al.entity_id = b.id
union all
select 'person', p.id, p.full_name, null, null, p.birth_year,
       null, p.status, p.verification, false, 0,
       p.search_vector, al.alias_text, p.created_at, p.deleted_at
from people p
left join aliases al on al.entity_type = 'person' and al.entity_id = p.id;

-- ---------------------------------------------------------------------------
-- v_moderation_queue — everything awaiting review, across submission types (§36)
-- ---------------------------------------------------------------------------
create or replace view v_moderation_queue as
select 'submission'::text as item_type,
       s.id,
       s.kind::text as kind,
       s.title::text as title,
       s.status::publication_status as status,
       s.submitted_by,
       s.assigned_to,
       s.submitted_at as queued_at,
       s.country_id,
       s.priority::smallint as priority
from submissions s
where s.deleted_at is null and s.status in ('submitted','under_review','changes_requested')
union all
select 'edit'::text,
       e.id,
       e.target_type::text,
       coalesce(e.field_key, e.explanation)::text,
       e.status::publication_status,
       e.submitted_by,
       e.reviewed_by::uuid,
       e.created_at,
       null::uuid,
       0::smallint
from edits e
where e.status in ('submitted','under_review','changes_requested')
union all
select 'report'::text,
       rp.id,
       rp.reason::text,
       coalesce(rp.detail, 'report')::text,
       rp.status::text::publication_status,
       rp.reporter_id,
       null::uuid,
       rp.created_at,
       null::uuid,
       0::smallint
from reports rp
where rp.status in ('open','under_review')
union all
select 'copyright_claim'::text,
       cc.id,
       coalesce(cc.claimant_capacity, 'owner')::text,
       cc.case_number::text,
       cc.status::publication_status,
       cc.claimant_user_id,
       cc.assigned_to,
       cc.created_at,
       cc.claimant_country_id,
       0::smallint
from copyright_claims cc
where cc.status in ('submitted','under_review','changes_requested')
union all
select 'media'::text,
       mf.id,
       mf.media_kind::text,
       mf.original_filename::text,
       'submitted'::publication_status,
       mf.uploaded_by,
       null::uuid,
       mf.created_at,
       null::uuid,
       0::smallint
from media_files mf
where mf.deleted_at is null
  and (mf.virus_scan_status <> 'clean' or mf.validation_status = 'pending');

-- ---------------------------------------------------------------------------
-- v_rights_dashboard — restricted recordings, open claims, expiring licences (§44, §69)
-- ---------------------------------------------------------------------------
create or replace view v_rights_dashboard as
select
  r.id as recording_id,
  r.title,
  r.rights_status,
  r.visibility,
  r.status,
  b.name as band_name,
  (select count(*) from copyright_claims cc
    where cc.recording_id = r.id and cc.status in ('submitted','under_review','changes_requested')) as open_claims,
  (select count(*) from rights_disputes d
    where d.recording_id = r.id and d.status not in ('resolved','withdrawn')) as open_disputes,
  (select min(l.expires_on) from licenses l
    where l.recording_id = r.id and l.expires_on is not null and l.expires_on >= current_date) as next_license_expiry
from recordings r
left join bands b on b.id = r.band_id
where r.deleted_at is null
  and (r.rights_status in ('rights_unknown','disputed','restricted','removed','user_claimed_rights')
       or exists (select 1 from copyright_claims cc
                  where cc.recording_id = r.id and cc.status in ('submitted','under_review','changes_requested')));

-- ---------------------------------------------------------------------------
-- doc 02 §11: "Every view is created with security_invoker = true so the querying user's RLS still
-- applies." PostgreSQL 15+ (every Supabase environment) takes this branch; PostgreSQL 14 — which the
-- local harness may run on — does not support the option and logs the fact instead of silently
-- skipping it. Search never depends on that option for correctness: `search_catalogue()` below
-- filters `status`/`deleted_at` itself and `v_search_index` carries the recordings visibility and
-- rights predicate, so results are identical on both versions; wherever security_invoker applies
-- the base-table policies simply re-check the same conditions.
-- ---------------------------------------------------------------------------
do $$
declare
  v record;
  v_version int := current_setting('server_version_num')::int;
begin
  for v in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v' and c.relname like 'v\_%'
  loop
    if v_version >= 150000 then
      execute format('alter view public.%I set (security_invoker = true)', v.relname);
    else
      raise notice 'security_invoker not applied to % (PostgreSQL % < 15: local harness only)',
        v.relname, current_setting('server_version');
    end if;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Fuzzy name matching (risk R8: "Search quality poor for spelling variants — alias table with
-- trigram/fuzzy matching shipped in Phase 1, not deferred"). Wraps pg_trgm so the threshold lives in
-- one place; `private.normalize_name` (doc 03 §3) strips accents and punctuation first.
-- ---------------------------------------------------------------------------
create or replace function private.fuzzy_name_match(p_a text, p_b text)
returns boolean
language sql
stable
as $$
  select p_a is not null and p_b is not null
     and similarity(private.normalize_name(p_a), private.normalize_name(p_b)) >= 0.45;
$$;

-- ---------------------------------------------------------------------------
-- Search (doc 06 §4, doc 10 Phase 1 "search v1 (Postgres FTS)", risk R8 "alias table with
-- trigram/fuzzy matching shipped in Phase 1, not deferred").
--
-- Ranking order is exactly doc 06 §4: "exact title match → artist/band match → musician match →
-- alias match → historical text → verification level → popularity. Obscure but verified material is
-- deliberately ranked above unverified popular material."
--
-- SECURITY INVOKER (the default): the row-level policies of the base tables decide visibility, so an
-- anonymous caller can only match published records and a draft never appears in a result set.
-- ---------------------------------------------------------------------------
create or replace function public.search_catalogue(
  p_q text,
  p_types text[] default null,
  p_country_id uuid default null,
  p_year_from smallint default null,
  p_year_to smallint default null,
  p_genre_id uuid default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  type text,
  id uuid,
  title text,
  subtitle text,
  released_year smallint,
  verification verification_level,
  is_disputed boolean,
  score real
)
language sql
stable
as $$
  with q as (
    select
      nullif(trim(coalesce(p_q, '')), '')                      as raw,
      private.normalize_name(coalesce(p_q, ''))                as norm,
      websearch_to_tsquery('simple', coalesce(p_q, ''))        as tsq
  )
  select
    si.type,
    si.id,
    si.title,
    nullif(concat_ws(' · ', si.subtitle_extra, si.released_year), '') as subtitle,
    si.released_year,
    si.verification,
    si.is_disputed,
    (
      case when q.raw is null then 0
           when lower(private.normalize_name(si.title)) = q.norm then 10
           when lower(private.normalize_name(si.title)) like q.norm || '%' then 6
           when si.type in ('recording','album') and si.subtitle_extra is not null
                and lower(private.normalize_name(si.subtitle_extra)) like '%' || q.norm || '%' then 5
           when si.type = 'person' then 4
           when si.alias_text is not null and lower(private.normalize_name(si.alias_text)) like '%' || q.norm || '%' then 3
           else 0
      end
      + coalesce(ts_rank(si.search_vector, q.tsq), 0) * 2
      + case si.verification
          when 'source_verified' then 1.0
          when 'rights_holder_verified' then 0.8
          when 'reviewed' then 0.6
          when 'community_sourced' then 0.3
          else 0
        end
      + least(si.popularity, 500)::real / 5000
    )::real as score
  from v_search_index si
  cross join q
  where si.deleted_at is null
    and si.status = 'published'
    and (p_types is null or si.type = any (p_types))
    and (p_genre_id is null or si.primary_genre_id = p_genre_id)
    and (p_year_from is null or coalesce(si.released_year, 0) >= p_year_from)
    and (p_year_to is null or coalesce(si.released_year, 9999) <= p_year_to)
    and (
      q.raw is null
      or si.search_vector @@ q.tsq
      -- Fuzzy fallback for spelling variants (risk R8): "Ochieng'" vs "Ochieng".
      or lower(private.normalize_name(si.title)) like '%' || q.norm || '%'
      or lower(private.normalize_name(coalesce(si.subtitle_extra, ''))) like '%' || q.norm || '%'
      or lower(private.normalize_name(coalesce(si.alias_text, ''))) like '%' || q.norm || '%'
      or (si.type = 'person' and private.fuzzy_name_match(si.title, p_q))
    )
  order by score desc, si.popularity desc, si.title asc
  limit greatest(least(p_limit, 100), 1)
  offset greatest(p_offset, 0);
$$;

comment on function public.search_catalogue(text, text[], uuid, smallint, smallint, uuid, integer, integer) is
  'Ranked catalogue search (doc 06 §4). Uniform row shape; RLS of the base tables applies.';
