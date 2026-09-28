-- ============================================================================
-- BANJO — complete database schema (GENERATED FILE — do not edit by hand)
-- Built by scripts/build-sql-bundle.sh from:
--   supabase/migrations/*.sql   (applied in filename order)
--   supabase/seed.sql           (reference data)
--
-- How to apply
--   A) Supabase Dashboard > SQL Editor: paste this whole file, Run.
--      (safe in one transaction; migrations contain no CONCURRENTLY)
--   B) psql "$DATABASE_URL" --single-transaction -f supabase/banjo-full-schema.sql
--   C) Supabase CLI (preferred for versioned deploys):
--      supabase link --project-ref <ref> && supabase db push
--
-- The tables the React frontend itself writes to are in
-- SUPABASE_COPY_PASTE.sql; that file is the smaller, re-runnable path.
--
-- Contents
--   0001_extensions_schemas_enums.sql
--   0002_private_helpers_and_trigger_functions.sql
--   0003_vocabulary.sql
--   0004_people_and_groups.sql
--   0005_music_core.sql
--   0006_history_events_timelines.sql
--   0007_sources_citations_interviews.sql
--   0008_documents_photographs_ai_extractions.sql
--   0009_identity_roles_permissions.sql
--   0010_submissions_edits_revisions.sql
--   0011_reports_and_moderation.sql
--   0012_rights_holders_and_recording_rights.sql
--   0013_rights_events_claims_takedowns.sql
--   0014_media_jobs_deduplication.sql
--   0015_community_library_notifications.sql
--   0016_deferred_foreign_keys.sql
--   0017_audit_security_and_ops.sql
--   0018_functions_and_triggers.sql
--   0019_views.sql
--   0020_rls_enablement_and_policies.sql
--   0021_seed_reference_data.sql
--   0022_rls_supplementary_policies.sql
--   0023_private_schema_grants.sql
--   0024_solo_credits_and_lyrics.sql
--   seed.sql
-- ============================================================================


-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0001_extensions_schemas_enums.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §1 Extensions and schemas · §2 Enumerated types
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create extension if not exists pgcrypto;

-- gen_random_uuid()
create extension if not exists pg_trgm;

-- fuzzy name search
create extension if not exists unaccent;

-- "Ochieng'" vs "Ochieng"
create schema if not exists private;

-- server-only helpers, not exposed by PostgREST

revoke all on schema private from anon, authenticated;

create type publication_status as enum (
  'draft','submitted','under_review','changes_requested','approved',
  'published','rejected','withdrawn','removed');

create type verification_level as enum (
  'unverified','community_sourced','reviewed','rights_holder_verified','source_verified');

create type rights_status as enum (
  'rights_holder_uploaded','licensed','permission_granted','public_domain',
  'user_claimed_rights','rights_unknown','disputed','restricted','removed');

create type rights_scope as enum (
  'streaming','download','research','commercial','archive_only');

create type account_status as enum (
  'active','restricted','suspended','banned','deleted');

create type source_type as enum (
  'record_sleeve','studio_documentation','artist_interview','band_member_testimony',
  'family_testimony','newspaper','magazine','book','academic_publication',
  'label_documentation','government_archive','community_submission');

create type media_kind as enum (
  'audio_master','audio_stream','image','document','transcript','video_reference','waveform');

create type alias_type as enum (
  'personal','stage_name','former_name','spelling_variant','translated',
  'transliterated','alternative_ordering');

create type entity_type as enum (
  'song','recording','album','artist','band','person','country','region',
  'genre','language','instrument','label','studio');

create type credit_role as enum (
  'lead_vocal','backing_vocal','composer','lyricist','arranger','producer',
  'engineer','mixer','lead_guitar','rhythm_guitar','bass','drums','keyboard',
  'percussion','trumpet','saxophone','trombone','flute','violin','accordion',
  'nyatiti','orutu','kora','kora_djembe','djembe','ongoma','talking_drum','chorus'
);

create type contribution_kind as enum (
  'new_song','new_recording','new_artist','new_band','new_album','new_person',
  'edit_song','edit_recording','edit_artist','edit_band','edit_album',
  'history_article','photograph','document','interview','source','rights_update');

create type review_action as enum (
  'approve','reject','request_evidence','request_changes','escalate','publish',
  'withdraw','restrict','remove','restore');

create type report_reason as enum (
  'incorrect_information','copyright_concern','wrong_person','wrong_song',
  'offensive_content','privacy_concern','duplicate','fraudulent_source','other');

create type job_kind as enum (
  'virus_scan','audio_validate','transcode','waveform','fingerprint','thumbnail',
  'ocr','transcribe','translate','duplicate_check','reindex','notification_fanout');

create type job_status as enum ('queued','running','succeeded','failed','cancelled');

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0002_private_helpers_and_trigger_functions.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §3 Private helper functions (used by every RLS policy) · §4 Shared trigger functions
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- Helper bodies reference tables created in later migrations (see §10 order), so body
-- validation is deferred to the end of this file.
set check_function_bodies = off;

-- Current application user id (auth.uid() wrapper, keeps policies short).
create or replace function private.uid() returns uuid
language sql stable as $$ select auth.uid() $$;

-- Does the caller hold any staff role?
create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and ur.revoked_at is null
      and r.code not in ('contributor','member')
  )
$$;

-- Does the caller hold this permission? (codes such as 'content.publish')
create or replace function private.has_permission(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions perm on perm.id = rp.permission_id
    where ur.user_id = auth.uid() and ur.revoked_at is null and perm.code = p
  ) or exists (
    select 1 from user_permissions up
    join permissions perm on perm.id = up.permission_id
    where up.user_id = auth.uid() and up.revoked_at is null and perm.code = p
      and (up.expires_at is null or up.expires_at > now())
  )
$$;

create or replace function private.is_archivist() returns boolean
language sql stable as $$ select private.has_permission('content.review') $$;

create or replace function private.is_rights_manager() returns boolean
language sql stable as $$ select private.has_permission('rights.manage') $$;

create or replace function private.is_moderator() returns boolean
language sql stable as $$ select private.has_permission('community.moderate') $$;

-- Published, non-deleted rows are the only anonymous-visible content.
create or replace function private.is_public(p_status publication_status, p_deleted timestamptz)
returns boolean language sql immutable as $$
  select p_status = 'published' and p_deleted is null
$$;

create or replace function private.owns(p_user uuid) returns boolean
language sql stable as $$ select auth.uid() is not null and auth.uid() = p_user $$;

create or replace function private.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if new.version is not null then new.version := old.version + 1; end if;
  return new;
end $$;

create or replace function private.normalize_name(t text) returns text
language sql immutable as $$
  select nullif(
    trim(regexp_replace(lower(unaccent(coalesce(t, ''))), '[^a-z0-9 ]+', '', 'g')), '')
$$;

-- Archive rows carrying citations may not be hard-deleted (§28, §75).
create or replace function private.assert_no_citations()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from citations c
             where c.target_type = tg_argv[0]::entity_type and c.target_id = old.id) then
    raise exception 'ARCHIVE_ROW_HAS_CITATIONS: soft-delete instead';
  end if;
  return old;
end $$;

set check_function_bodies = on;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0003_vocabulary.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §5 Vocabulary tables
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create table countries (
  id uuid primary key default gen_random_uuid(),
  iso2 char(2) not null unique,
  iso3 char(3),
  name text not null,
  name_local text,
  region_group text,                     -- 'East Africa','West Africa',...
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table regions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete restrict,
  name text not null,
  parent_region_id uuid references regions(id),
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, name)
);

create index regions_country_idx on regions (country_id);

create table languages (
  id uuid primary key default gen_random_uuid(),
  iso639_1 char(2),
  iso639_3 char(3),
  name text not null unique,
  name_local text,
  is_ui_locale boolean not null default false,   -- 'en','sw' at launch (§60)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  parent_genre_id uuid references genres(id),
  description text,
  origin_country_id uuid references countries(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table instruments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_local text,
  family text,               -- string | percussion | wind | keyboard | vocal
  hornbostel_sachs text,     -- optional academic classification
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table labels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_id uuid references countries(id),
  founded_year smallint,
  closed_year smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, country_id)
);

create table studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  city text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  opened_year smallint,
  closed_year smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, city)
);

create table recording_venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  city text,
  venue_type text,           -- club | hall | stadium | church | outdoor | radio
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table countries enable row level security;
alter table regions enable row level security;
alter table languages enable row level security;
alter table genres enable row level security;
alter table instruments enable row level security;
alter table labels enable row level security;
alter table studios enable row level security;
alter table recording_venues enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table countries
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table regions
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table languages
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table genres
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table instruments
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table labels
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table studios
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table recording_venues
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0004_people_and_groups.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §6 People and groups
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- Any human referenced by the archive: musicians, composers, producers,
-- engineers, interviewees, family members, researchers.
create table people (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  sort_name text,                        -- 'Ochieng, John' for ordered indexes
  gender text,
  birth_date date,
  death_date date,
  birth_year smallint,
  death_year smallint,
  birth_place text,
  birth_country_id uuid references countries(id),
  birth_region_id uuid references regions(id),
  nationality_country_id uuid references countries(id),
  bio text,
  years_active_from smallint,
  years_active_to smallint,
  external_ids jsonb not null default '{}'::jsonb,   -- wikidata, discogs, isni, mbid
  status publication_status not null default 'published',
  verification verification_level not null default 'unverified',
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(full_name,'') || ' ' || coalesce(bio,''))) stored
);

create index people_search_idx on people using gin (search_vector);

create index people_name_trgm_idx on people using gin (full_name gin_trgm_ops);

create index people_birth_year_idx on people (birth_year);

-- Solo performing identity; a person may hold more than one (stage persona).
create table artists (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete set null,
  stage_name text not null,
  artist_type text not null default 'solo',   -- solo | duo | collective | alias
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  primary_genre_id uuid references genres(id),
  bio text,
  years_active_from smallint,
  years_active_to smallint,
  status publication_status not null default 'published',
  verification verification_level not null default 'unverified',
  is_rights_holder boolean not null default false,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(stage_name,'') || ' ' || coalesce(bio,''))) stored
);

create index artists_search_idx on artists using gin (search_vector);

create index artists_country_idx on artists (country_id);

create index artists_person_idx on artists (person_id);

create table bands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  city text,
  formed_year smallint,
  formed_date date,
  dissolved_year smallint,
  dissolved_date date,
  band_type text,               -- dance band | guitar band | orchestra | choir | ensemble
  primary_language_id uuid references languages(id),
  history text,
  status publication_status not null default 'published',
  verification verification_level not null default 'unverified',
  member_count integer not null default 0,
  recording_count integer not null default 0,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(history,''))) stored
);

create index bands_search_idx on bands using gin (search_vector);

create index bands_country_idx on bands (country_id);

create index bands_formed_year_idx on bands (formed_year);

-- Dated membership: the backbone of band timelines (§21, §16).
create table band_members (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references bands(id) on delete cascade,
  person_id uuid not null references people(id) on delete restrict,
  role_label text,                     -- 'Band leader','Vocalist','Guitarist'
  instrument_id uuid references instruments(id),
  start_year smallint,
  end_year smallint,
  start_date date,
  end_date date,
  is_founder boolean not null default false,
  is_current boolean not null default false,
  source_id uuid,                      -- FK added in 04 (sources created there)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date),
  check (is_current = false or end_date is null),
  unique (band_id, person_id, start_year)
);

create index band_members_band_idx on band_members (band_id, start_year);

create index band_members_person_idx on band_members (person_id, start_year);

create table artist_bands (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  band_id uuid not null references bands(id) on delete cascade,
  start_year smallint,
  end_year smallint,
  role_label text,
  created_at timestamptz not null default now(),
  unique (artist_id, band_id, start_year)
);

create table musician_instruments (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  instrument_id uuid not null references instruments(id) on delete restrict,
  is_primary boolean not null default false,
  proficiency text,                    -- primary | secondary | occasional
  created_at timestamptz not null default now(),
  unique (person_id, instrument_id)
);

create table entity_aliases (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type not null,
  entity_id uuid not null,
  alias text not null,
  alias_normalized text generated always as (private.normalize_name(alias)) stored,
  alias_type alias_type not null default 'spelling_variant',
  language_id uuid references languages(id),
  source_id uuid,
  is_primary boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, alias_normalized, alias_type)
);

create index entity_aliases_lookup_idx on entity_aliases (entity_type, entity_id);

create index entity_aliases_search_idx
  on entity_aliases using gin (alias_normalized gin_trgm_ops);

-- Translatable text for any entity (§60).
create table entity_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type not null,
  entity_id uuid not null,
  locale text not null,
  field_key text not null,
  value text not null,
  translation_status text not null default 'community',  -- machine | community | reviewed
  translated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, locale, field_key)
);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table people enable row level security;
alter table artists enable row level security;
alter table bands enable row level security;
alter table band_members enable row level security;
alter table artist_bands enable row level security;
alter table musician_instruments enable row level security;
alter table entity_aliases enable row level security;
alter table entity_translations enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table people
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table artists
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table bands
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table band_members
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table artist_bands
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table musician_instruments
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table entity_aliases
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table entity_translations
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0005_music_core.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §7 Music core · §8 Albums and credits
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- SONG = the composition / the work. Nothing that varies per performance belongs here.
create table songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_local text,
  subtitle text,
  canonical_language_id uuid references languages(id),
  primary_genre_id uuid references genres(id),
  composition_year smallint,
  composer_credit_text text,        -- as printed on the sleeve
  lyricist_credit_text text,
  is_instrumental boolean not null default false,
  summary text,
  first_known_recording_year smallint,
  recording_count integer not null default 0,
  is_verified_disputed boolean not null default false,   -- any disputed field (§63)
  status publication_status not null default 'draft',
  verification verification_level not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  version integer not null default 1,
  deleted_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple',
      coalesce(title,'') || ' ' || coalesce(title_local,'') || ' ' ||
      coalesce(subtitle,'') || ' ' || coalesce(summary,''))) stored
);

create index songs_search_idx on songs using gin (search_vector);

create index songs_title_trgm_idx on songs using gin (title gin_trgm_ops);

create index songs_genre_idx on songs (primary_genre_id);

create index songs_published_idx on songs (status, deleted_at) where deleted_at is null;

create index songs_composition_year_idx on songs (composition_year);

create table song_genres (
  song_id uuid not null references songs(id) on delete cascade,
  genre_id uuid not null references genres(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (song_id, genre_id)
);

-- RECORDING = one specific capturing of a song (§50).
create table recordings (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete restrict,
  title text,                          -- title as printed on this release, if different
  band_id uuid references bands(id) on delete set null,
  artist_id uuid references artists(id) on delete set null,
  orchestra_text text,                 -- credit line when no band entity exists yet
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  language_id uuid references languages(id),
  primary_genre_id uuid references genres(id),
  studio_id uuid references studios(id),
  venue_id uuid references recording_venues(id),
  label_id uuid references labels(id),
  recording_year smallint,
  recording_date date,
  release_year smallint,
  release_date date,
  matrix_number text,
  catalog_number text,
  take_number text,
  producer_text text,
  recording_type text not null default 'studio',   -- studio | live | field | radio | demo
  is_live boolean not null default false,
  duration_seconds integer,
  rights_status rights_status not null default 'rights_unknown',
  visibility text not null default 'private',      -- public | private | pending
                                                   -- | restricted | removed
  verification verification_level not null default 'unverified',
  play_count bigint not null default 0,
  summary text,
  status publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  version integer not null default 1,
  deleted_at timestamptz,
  -- §44 / ADR-12: unknown rights can never be publicly streamable.
  constraint rights_unknown_not_public
    check (not (rights_status = 'rights_unknown' and visibility = 'public')),
  constraint release_after_recording
    check (release_year is null or recording_year is null or release_year >= recording_year),
  check (duration_seconds is null or duration_seconds > 0),
  search_vector tsvector generated always as (
    to_tsvector('simple',
      coalesce(title,'') || ' ' || coalesce(orchestra_text,'') || ' ' ||
      coalesce(summary,''))) stored
);

create index recordings_song_idx on recordings (song_id);

create index recordings_band_idx on recordings (band_id);

create index recordings_artist_idx on recordings (artist_id);

create index recordings_country_year_idx on recordings (country_id, release_year);

create index recordings_rights_idx on recordings (rights_status, visibility);

create index recordings_status_idx on recordings (status, deleted_at);

create index recordings_release_year_idx on recordings (release_year);

create index recordings_search_idx on recordings using gin (search_vector);

create index recordings_matrix_idx on recordings (matrix_number)
  where matrix_number is not null;

-- Duplicate protection at the artefact level: same matrix number + take
-- in the same country means the same physical recording.
create unique index recordings_matrix_unique
  on recordings (country_id, matrix_number, take_number)
  where matrix_number is not null and deleted_at is null;

create table albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_local text,
  band_id uuid references bands(id) on delete set null,
  artist_id uuid references artists(id) on delete set null,
  label_id uuid references labels(id),
  country_id uuid references countries(id),
  release_year smallint,
  release_date date,
  format text,                    -- 7in | 10in | 12in | LP | cassette | CD | digital | reel
  catalog_number text,
  recording_year smallint,
  studio_id uuid references studios(id),
  cover_media_id uuid,            -- FK added with media_files in 04
  history text,
  status publication_status not null default 'draft',
  verification verification_level not null default 'unverified',
  track_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  version integer not null default 1,
  deleted_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple',
      coalesce(title,'') || ' ' || coalesce(title_local,'') || ' ' ||
      coalesce(history,''))) stored
);

create index albums_search_idx on albums using gin (search_vector);

create index albums_band_idx on albums (band_id);

create index albums_release_year_idx on albums (release_year);

create table album_tracks (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  recording_id uuid not null references recordings(id) on delete restrict,
  disc_number smallint not null default 1,
  track_number smallint,
  side char(1),                    -- A/B for vinyl
  duration_seconds integer,
  is_bonus_track boolean not null default false,
  created_at timestamptz not null default now(),
  unique (album_id, recording_id),
  unique (album_id, disc_number, track_number)
);

create index album_tracks_recording_idx on album_tracks (recording_id);

-- A composition can appear on many releases independently of a single recording.
create table song_albums (
  song_id uuid not null references songs(id) on delete cascade,
  album_id uuid not null references albums(id) on delete cascade,
  recording_id uuid references recordings(id) on delete set null,
  note text,
  primary key (song_id, album_id, recording_id)
);

-- Composition-level credits (§8).
create table song_composers (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  person_id uuid references people(id) on delete restrict,
  credit_text text,                -- name as printed when no person record exists
  role credit_role not null default 'composer',   -- composer | lyricist | arranger
  is_primary boolean not null default false,
  source_id uuid,
  created_at timestamptz not null default now(),
  check (person_id is not null or credit_text is not null)
);

create index song_composers_song_idx on song_composers (song_id);

create index song_composers_person_idx on song_composers (person_id);

-- Composition-level performer credits (rarely known; used for traditional works).
create table song_musicians (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  person_id uuid not null references people(id) on delete restrict,
  role credit_role not null,
  instrument_id uuid references instruments(id),
  is_credited boolean not null default true,
  source_id uuid,
  created_at timestamptz not null default now(),
  unique (song_id, person_id, role)
);

-- Performance-level credits: this is the table that powers the "Musicians"
-- list on the song page (§12) and "Recordings" on the musician page (§17).
create table recording_musicians (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references recordings(id) on delete cascade,
  person_id uuid not null references people(id) on delete restrict,
  role credit_role not null,
  instrument_id uuid references instruments(id),
  is_credited boolean not null default true,
  is_featured boolean not null default false,
  notes text,
  source_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (recording_id, person_id, role, instrument_id)
);

create index recording_musicians_recording_idx on recording_musicians (recording_id);

create index recording_musicians_person_idx on recording_musicians (person_id);

create index recording_musicians_instrument_idx on recording_musicians (instrument_id);

-- Non-performing credits: producer, engineer, mixer, sleeve designer.
create table recording_credits (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references recordings(id) on delete cascade,
  person_id uuid references people(id) on delete set null,
  credit_text text,
  role credit_role not null,
  source_id uuid,
  created_at timestamptz not null default now(),
  check (person_id is not null or credit_text is not null)
);

create index recording_credits_recording_idx on recording_credits (recording_id);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table songs enable row level security;
alter table song_genres enable row level security;
alter table recordings enable row level security;
alter table albums enable row level security;
alter table album_tracks enable row level security;
alter table song_albums enable row level security;
alter table song_composers enable row level security;
alter table song_musicians enable row level security;
alter table recording_musicians enable row level security;
alter table recording_credits enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table song_genres
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table album_tracks
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table song_albums
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table song_composers
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table song_musicians
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table recording_musicians
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table recording_credits
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0006_history_events_timelines.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §1 History, timelines and events
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- Long-form history attached to a song.
create table song_histories (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  locale text not null default 'en',
  headline text,
  body text not null,                    -- markdown, rendered read-only in clients
  body_format text not null default 'markdown',
  period_start_year smallint,
  period_end_year smallint,
  status publication_status not null default 'draft',
  verification verification_level not null default 'unverified',
  authored_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  deleted_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(headline,'') || ' ' || coalesce(body,''))) stored,
  unique (song_id, locale)
);

create index song_histories_search_idx on song_histories using gin (search_vector);

create index song_histories_song_idx on song_histories (song_id, locale);

-- History for any other entity type (band, artist, album, country, place).
create table entity_histories (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type not null,
  entity_id uuid not null,
  locale text not null default 'en',
  headline text,
  body text not null,
  status publication_status not null default 'draft',
  verification verification_level not null default 'unverified',
  authored_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  deleted_at timestamptz,
  unique (entity_type, entity_id, locale)
);

create index entity_histories_lookup_idx on entity_histories (entity_type, entity_id);

-- Atomic historical facts. Date precision is explicit because archives often
-- know "1978" but not "12 May 1978".
create table historical_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,          -- formation | first_recording | release | tour
                                     -- | member_joined | member_left | dissolution
                                     -- | award | death | renaming | studio_session
  title text not null,
  description text,
  year smallint,
  event_date date,
  date_precision text not null default 'year',  -- exact | month | year | decade | unknown
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  place_text text,
  band_id uuid references bands(id) on delete set null,
  artist_id uuid references artists(id) on delete set null,
  person_id uuid references people(id) on delete set null,
  song_id uuid references songs(id) on delete set null,
  recording_id uuid references recordings(id) on delete set null,
  album_id uuid references albums(id) on delete set null,
  verification verification_level not null default 'unverified',
  status publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  deleted_at timestamptz,
  check (event_date is null or year is null or extract(year from event_date) = year),
  check (year is not null or event_date is not null)
);

create index historical_events_year_idx on historical_events (year);

create index historical_events_band_idx on historical_events (band_id, year);

create index historical_events_song_idx on historical_events (song_id, year);

create index historical_events_type_idx on historical_events (event_type, year);

-- A curated, ordered narrative, e.g. "Benga 1970-1980, Kisumu" (§113).
create table timelines (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  genre_id uuid references genres(id),
  start_year smallint,
  end_year smallint,
  is_editorial boolean not null default false,
  status publication_status not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table timeline_items (
  id uuid primary key default gen_random_uuid(),
  timeline_id uuid not null references timelines(id) on delete cascade,
  historical_event_id uuid references historical_events(id) on delete cascade,
  position integer not null,
  year smallint not null,
  caption text,
  recording_id uuid references recordings(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (timeline_id, position)
);

create index timeline_items_timeline_idx on timeline_items (timeline_id, position);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table song_histories enable row level security;
alter table entity_histories enable row level security;
alter table historical_events enable row level security;
alter table timelines enable row level security;
alter table timeline_items enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table song_histories
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id);
alter table entity_histories
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id);
alter table historical_events
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table timelines
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table timeline_items
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0007_sources_citations_interviews.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §2 Sources, citations and oral history (§61, §62)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create table sources (
  id uuid primary key default gen_random_uuid(),
  source_type source_type not null,
  title text not null,
  author text,
  publication text,               -- newspaper / magazine / book / publisher
  publisher text,
  issue text,
  page text,
  url text,
  accessed_date date,
  published_year smallint,
  published_date date,
  language_id uuid references languages(id),
  country_id uuid references countries(id),
  held_by text,                   -- institution holding the physical item
  reference_code text,            -- archive catalogue number
  summary text,
  reliability_note text,          -- human note, NOT a numeric truth score (§62)
  interview_id uuid,              -- FK added below
  media_file_id uuid,             -- FK added in §6
  status publication_status not null default 'draft',
  verification verification_level not null default 'unverified',
  citation_count integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  deleted_at timestamptz
);

create index sources_type_idx on sources (source_type);

create index sources_title_trgm_idx on sources using gin (title gin_trgm_ops);

-- A citation links one source to one claim target, with locator detail.
create table citations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  target_type entity_type not null,
  target_id uuid not null,
  field_key text,                  -- when the source supports one specific field
  quote text,
  locator text,                    -- page number, timecode "00:12:31", track side
  supports boolean not null default true,       -- false = source contradicts the claim
  confidence text not null default 'stated',    -- stated | inferred | uncertain
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index citations_source_idx on citations (source_id);

create index citations_target_idx on citations (target_type, target_id);

-- Oral history: the primary preservation mechanism (§22, §65).
create table interviews (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  interviewee_person_id uuid references people(id) on delete set null,
  interviewee_name_text text,
  interviewer_person_id uuid references people(id) on delete set null,
  interviewer_name_text text,
  interview_date date,
  interview_year smallint,
  location_text text,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  language_id uuid references languages(id),
  duration_seconds integer,
  summary text,
  transcript text,
  transcript_locale text default 'en',
  transcript_status text not null default 'none',   -- none | machine | edited | reviewed
  audio_media_id uuid,            -- FK added in §6
  recorded_by text,
  rights_status rights_status not null default 'rights_unknown',
  status publication_status not null default 'draft',
  verification verification_level not null default 'unverified',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' ||
      coalesce(transcript,''))) stored,
  check (interviewee_person_id is not null or interviewee_name_text is not null)
);

create index interviews_search_idx on interviews using gin (search_vector);

create index interviews_person_idx on interviews (interviewee_person_id, interview_year);

create index interviews_date_idx on interviews (interview_year);

alter table sources
  add constraint sources_interview_fk
  foreign key (interview_id) references interviews(id) on delete set null;

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table sources enable row level security;
alter table citations enable row level security;
alter table interviews enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table sources
  add column if not exists updated_by uuid references auth.users(id);
alter table citations
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table interviews
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0008_documents_photographs_ai_extractions.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §3 Documents, photographs and AI extractions (§23, §64, §65)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create table documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null,     -- record_sleeve | poster | newspaper_clipping
                                   -- | programme | contract | letter | studio_document
                                   -- | booklet | lyric_sheet | other
  title text not null,
  description text,
  document_date date,
  document_year smallint,
  date_precision text not null default 'year',
  creator_text text,               -- photographer / author of the document
  publisher_text text,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  language_id uuid references languages(id),
  held_by text,
  copyright_note text,
  rights_status rights_status not null default 'rights_unknown',
  copyright_expiry_year smallint,
  media_file_id uuid,              -- FK added in §6
  status publication_status not null default 'draft',
  verification verification_level not null default 'unverified',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,''))) stored
);

create index documents_search_idx on documents using gin (search_vector);

create index documents_type_year_idx on documents (document_type, document_year);

create table photographs (
  id uuid primary key default gen_random_uuid(),
  title text,
  caption text,
  photographer_text text,
  photo_date date,
  photo_year smallint,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  place_text text,
  subject_note text,
  media_file_id uuid,              -- FK added in §6
  rights_status rights_status not null default 'rights_unknown',
  status publication_status not null default 'draft',
  verification verification_level not null default 'unverified',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (title is not null or caption is not null)
);

create index photographs_year_idx on photographs (photo_year);

create index photographs_status_idx on photographs (status, deleted_at);

-- Machine extraction awaiting human review. AI output never publishes itself (§64).
create table ai_extractions (
  id uuid primary key default gen_random_uuid(),
  target_type entity_type not null,
  target_id uuid not null,          -- usually an interview or document
  extraction_kind text not null,    -- transcript | translation | summary | names
                                    -- | songs | bands | places | dates | ocr
  model text not null,
  model_version text,
  payload jsonb not null,
  confidence numeric(4,3),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  decision text,                    -- accepted | partially_accepted | rejected
  created_at timestamptz not null default now()
);

create index ai_extractions_target_idx on ai_extractions (target_type, target_id);

create index ai_extractions_pending_idx on ai_extractions (created_at)
  where reviewed_at is null;

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table documents enable row level security;
alter table photographs enable row level security;
alter table ai_extractions enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table documents
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table photographs
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table ai_extractions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0009_identity_roles_permissions.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §4 Identity, roles and permissions
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_media_id uuid,
  bio text,
  country_id uuid references countries(id),
  preferred_locale text not null default 'en',
  account_status account_status not null default 'active',
  is_verified_contributor boolean not null default false,
  is_rights_holder_contact boolean not null default false,
  accepted_terms_at timestamptz,
  accepted_terms_version text,
  approved_edits integer not null default 0,
  pending_submissions integer not null default 0,
  rejected_submissions integer not null default 0,
  last_active_at timestamptz,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index profiles_status_idx on profiles (account_status);

create table roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,     -- member | contributor | archivist | senior_archivist
                                 -- | moderator | rights_manager | support_agent
                                 -- | analyst | platform_admin | super_admin
  name text not null,
  description text,
  rank smallint not null default 0,
  created_at timestamptz not null default now()
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,     -- 'content.review','content.publish','rights.manage',
                                 -- 'community.moderate','users.manage','analytics.view',
                                 -- 'system.admin','import.run'
  description text not null,
  category text not null
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete restrict,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  reason text,
  unique (user_id, role_id)
);

create index user_roles_user_idx on user_roles (user_id) where revoked_at is null;

-- Explicit, time-boxed personal grants: no admin receives all permissions (§38).
create table user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  reason text,
  unique (user_id, permission_id)
);

create table account_status_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_status account_status,
  to_status account_status not null,
  reason text,
  actor_id uuid references auth.users(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index account_status_history_user_idx on account_status_history (user_id, created_at);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table profiles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;
alter table user_permissions enable row level security;
alter table account_status_history enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table profiles
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table roles
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table permissions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table role_permissions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table user_roles
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table user_permissions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table account_status_history
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0010_submissions_edits_revisions.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §5 Contributions, revisions and review (§24–§31, §63, §66)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- A submission is a bundle a contributor sends for review: a new recording plus
-- its history, musicians and sources can all arrive as one submission.
create table submissions (
  id uuid primary key default gen_random_uuid(),
  kind contribution_kind not null,
  target_type entity_type,          -- null for new content, set for edits
  target_id uuid,
  title text not null,
  rationale text,                   -- why the contributor believes this is correct
  status publication_status not null default 'submitted',
  verification verification_level not null default 'unverified',
  submitted_by uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  priority smallint not null default 0,
  country_id uuid references countries(id),
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index submissions_queue_idx on submissions (status, submitted_at);

create index submissions_assignee_idx on submissions (assigned_to, status);

create index submissions_contributor_idx on submissions (submitted_by, status);

create index submissions_country_idx on submissions (country_id, status);

-- Payload items: media, sources, statements, people — each independently reviewable.
create table submission_items (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  item_type text not null,          -- media | source | statement | person | band
                                    -- | instrument | history | rights_declaration
  payload jsonb not null,
  media_file_id uuid,               -- set when item_type = 'media'
  source_id uuid references sources(id) on delete set null,
  position integer not null default 0,
  review_status publication_status not null default 'submitted',
  created_at timestamptz not null default now()
);

create index submission_items_submission_idx on submission_items (submission_id, position);

-- A proposed change to an existing entity (§27). Never applied directly.
create table edits (
  id uuid primary key default gen_random_uuid(),
  target_type entity_type not null,
  target_id uuid not null,
  submission_id uuid references submissions(id) on delete cascade,
  field_key text,
  current_value jsonb,
  proposed_value jsonb,
  explanation text not null,
  status publication_status not null default 'submitted',
  submitted_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  applied_at timestamptz,
  applied_revision_id uuid,         -- FK added in this section below
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index edits_target_idx on edits (target_type, target_id, status);

create index edits_queue_idx on edits (status, created_at);

create index edits_contributor_idx on edits (submitted_by, status);

-- Immutable snapshot of an entity at a point in time (§28).
create table revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type not null,
  entity_id uuid not null,
  version integer not null,
  snapshot jsonb not null,          -- full row as it stood (or would stand)
  change_summary text,
  change_reason text,
  source_edit_id uuid references edits(id) on delete set null,
  source_submission_id uuid references submissions(id) on delete set null,
  authored_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, version)
);

create index revisions_entity_idx on revisions (entity_type, entity_id, version desc);

create index revisions_created_idx on revisions (created_at desc);

alter table edits
  add constraint edits_applied_revision_fk
  foreign key (applied_revision_id) references revisions(id) on delete set null;

-- Field-level diff rows: what the difference viewer renders (§29).
create table revision_changes (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references revisions(id) on delete cascade,
  field_key text not null,
  old_value jsonb,
  new_value jsonb,
  change_type text not null default 'update',   -- create | update | delete
  created_at timestamptz not null default now()
);

create index revision_changes_revision_idx on revision_changes (revision_id);

create table review_decisions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,        -- submission | edit | submission_item | media
                                    -- | copyright_claim | report
  target_id uuid not null,
  action review_action not null,
  reason text,
  internal_note text,               -- staff-only
  reviewer_id uuid not null references auth.users(id),
  previous_status publication_status,
  new_status publication_status,
  verification_set verification_level,
  created_at timestamptz not null default now()
);

create index review_decisions_target_idx on review_decisions (target_type, target_id);

create index review_decisions_reviewer_idx on review_decisions (reviewer_id, created_at desc);

-- Competing, sourced claims about one field. This is how Banjo says
-- "1975 or 1976 - here is the evidence for each" (§63) instead of guessing.
create table field_assertions (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type not null,
  entity_id uuid not null,
  field_key text not null,
  value_jsonb jsonb not null,
  value_display text,               -- ready-to-render string, e.g. "1975"
  source_id uuid references sources(id) on delete set null,
  citation_id uuid references citations(id) on delete set null,
  status text not null default 'proposed',   -- proposed | accepted | contested
                                             -- | superseded | rejected
  is_disputed boolean not null default false,
  asserted_by uuid references auth.users(id),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'accepted' or resolved_at is not null)
);

create index field_assertions_lookup_idx
  on field_assertions (entity_type, entity_id, field_key);

create index field_assertions_disputed_idx on field_assertions (is_disputed)
  where is_disputed = true;

create index field_assertions_source_idx on field_assertions (source_id);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table submissions enable row level security;
alter table submission_items enable row level security;
alter table edits enable row level security;
alter table revisions enable row level security;
alter table revision_changes enable row level security;
alter table review_decisions enable row level security;
alter table field_assertions enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table submissions
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table submission_items
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table edits
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table revisions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_at timestamptz;
alter table revision_changes
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table review_decisions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table field_assertions
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0011_reports_and_moderation.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §5 Contributions, revisions and review (§24–§31, §63, §66)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- User reports (§33).
create table reports (
  id uuid primary key default gen_random_uuid(),
  target_type entity_type not null,
  target_id uuid not null,
  reason report_reason not null,
  detail text,
  reporter_id uuid references auth.users(id) on delete set null,
  reporter_email text,              -- for anonymous reports
  status text not null default 'open',    -- open | triaged | actioned | dismissed
  priority smallint not null default 0,
  assigned_to uuid references auth.users(id),
  resolution_note text,
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporter_id is not null or reporter_email is not null)
);

create index reports_status_idx on reports (status, priority desc, created_at);

create index reports_target_idx on reports (target_type, target_id);

-- Moderation actions on people and content (§71, §72).
create table moderation_actions (
  id uuid primary key default gen_random_uuid(),
  action text not null,             -- hide_content | restore_content
                                    -- | suspend_account | restrict_uploads
                                    -- | remove_comment | restrict_recording | escalate
  target_type entity_type,
  target_id uuid,
  target_user_id uuid references auth.users(id) on delete set null,
  report_id uuid references reports(id) on delete set null,
  reason text not null,
  duration_hours integer,
  expires_at timestamptz,
  actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversed_by uuid references auth.users(id)
);

create index moderation_actions_target_idx on moderation_actions (target_type, target_id);

create index moderation_actions_user_idx on moderation_actions (target_user_id, created_at desc);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table reports enable row level security;
alter table moderation_actions enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table reports
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table moderation_actions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0012_rights_holders_and_recording_rights.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §6 Rights, claims and takedowns (§43–§45, §78)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create table rights_holders (
  id uuid primary key default gen_random_uuid(),
  holder_type text not null,        -- person | estate | band | label | publisher
                                    -- | studio | broadcaster | institution | unknown
  name text not null,
  person_id uuid references people(id) on delete set null,
  band_id uuid references bands(id) on delete set null,
  label_id uuid references labels(id) on delete set null,
  country_id uuid references countries(id),
  represented_by text,
  notes text,
  claim_submission_url text,
  status text not null default 'active',   -- active | merged | defunct | unverified
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index rights_holders_name_trgm_idx on rights_holders using gin (name gin_trgm_ops);

-- Contact data is restricted data: readable only by the rights team (§41, §76).
create table rights_holder_contacts (
  id uuid primary key default gen_random_uuid(),
  rights_holder_id uuid not null references rights_holders(id) on delete cascade,
  contact_name text,
  email text,
  phone text,
  address text,
  country_id uuid references countries(id),
  verification_status text not null default 'unverified',  -- unverified | verified
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rights_holder_contacts_holder_idx on rights_holder_contacts (rights_holder_id);

-- The contributor's upload-time declaration (§26 step 4). Kept forever, because
-- it is the evidence of what the contributor claimed.
create table rights_declarations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  media_file_id uuid,
  declarant_id uuid not null references auth.users(id),
  declaration text not null,        -- i_own_recording | i_represent_rights_holder
                                    -- | i_have_permission | believed_public_domain
                                    -- | information_only_no_audio
  statement_text text not null,     -- exact wording shown to the user, snapshotted
  declarant_name text,
  declarant_email text,
  rights_holder_id uuid references rights_holders(id) on delete set null,
  is_legal_attestation boolean not null default false,
  accepted_at timestamptz not null default now(),
  ip_hash text,                     -- salted hash only, for abuse investigation
  user_agent_hash text
);

create index rights_declarations_submission_idx on rights_declarations (submission_id);

create index rights_declarations_declarant_idx on rights_declarations (declarant_id);

-- One active rights record per recording (plus history via rights_events).
create table recording_rights (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references recordings(id) on delete cascade,
  rights_status rights_status not null default 'rights_unknown',
  rights_holder_id uuid references rights_holders(id) on delete set null,
  rights_basis text,                -- owned | assigned | inherited | licensed
                                    -- | statutory | orphan_work | unknown
  territory text not null default 'worldwide',
  permitted_scope rights_scope[] not null default '{streaming}',
  allows_streaming boolean not null default false,
  allows_download boolean not null default false,
  allows_research boolean not null default false,
  allows_commercial boolean not null default false,
  allows_derivatives boolean not null default false,
  public_domain_basis text,          -- life_plus_years | published_pre_year | declared
  public_domain_year smallint,
  evidence_source_id uuid references sources(id) on delete set null,
  restricted_until date,
  review_required boolean not null default true,
  last_reviewed_at timestamptz,
  last_reviewed_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  -- §44: unknown rights are never streamable, no matter what else is set.
  constraint unknown_rights_not_streamable
    check (not (rights_status = 'rights_unknown' and allows_streaming)),
  constraint disputed_not_streamable
    check (not (rights_status = 'disputed' and allows_streaming))
);

create unique index recording_rights_one_active
  on recording_rights (recording_id)
  where rights_status <> 'removed';

create index recording_rights_status_idx on recording_rights (rights_status);

create table licenses (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid references recordings(id) on delete cascade,
  album_id uuid references albums(id) on delete cascade,
  rights_holder_id uuid references rights_holders(id) on delete set null,
  license_type text not null,       -- license | assignment | permission_letter
                                    -- | memorandum_of_understanding | statutory
  license_reference text,
  signed_date date,
  starts_on date,
  expires_on date,
  territory text not null default 'worldwide',
  permitted_scope rights_scope[] not null default '{streaming}',
  royalty_note text,
  document_id uuid references documents(id) on delete set null,
  status text not null default 'active',   -- active | expired | terminated | pending
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recording_id is not null or album_id is not null),
  check (expires_on is null or starts_on is null or expires_on >= starts_on)
);

create index licenses_recording_idx on licenses (recording_id);

create index licenses_expiry_idx on licenses (expires_on) where expires_on is not null;

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table rights_holders enable row level security;
alter table rights_holder_contacts enable row level security;
alter table rights_declarations enable row level security;
alter table recording_rights enable row level security;
alter table licenses enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table rights_holders
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table rights_holder_contacts
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table rights_declarations
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table recording_rights
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_at timestamptz;
alter table licenses
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0013_rights_events_claims_takedowns.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §6 Rights, claims and takedowns (§43–§45, §78)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create table rights_events (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid references recordings(id) on delete cascade,
  rights_holder_id uuid references rights_holders(id) on delete set null,
  event_type text not null,         -- status_change | scope_change | holder_change
                                    -- | license_added | license_expired | claim_filed
                                    -- | restriction_applied | removal_applied | review
  previous_values jsonb,
  new_values jsonb,
  reason text,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index rights_events_recording_idx on rights_events (recording_id, created_at desc);

-- Copyright claim submitted by a rights holder or their representative (§45).
create table copyright_claims (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,     -- human-usable reference, e.g. 'BANJO-C-2026-000417'
  recording_id uuid references recordings(id) on delete set null,
  media_file_id uuid,
  song_id uuid references songs(id) on delete set null,
  claimant_user_id uuid references auth.users(id) on delete set null,
  claimant_name text not null,
  claimant_email text not null,
  claimant_phone text,
  claimant_country_id uuid references countries(id),
  claimant_capacity text,               -- owner | exclusive_licensee | agent | estate
  rights_holder_id uuid references rights_holders(id) on delete set null,
  ownership_explanation text not null,
  requested_action text not null default 'remove',  -- remove | restrict | credit_change
                                                    -- | licensing_discussion | review
  evidence_summary text,
  status text not null default 'received',  -- received | under_review | awaiting_evidence
                                            -- | upheld | partially_upheld | rejected
                                            -- | withdrawn | referred_to_legal
  priority smallint not null default 0,
  assigned_to uuid references auth.users(id),
  acknowledged_at timestamptz,
  deadline_at timestamptz,              -- internal SLA target
  decision_note text,
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index copyright_claims_status_idx on copyright_claims (status, created_at);

create index copyright_claims_recording_idx on copyright_claims (recording_id);

-- Takedown requests and any statutory process, kept distinct from claims so the
-- workflow can differ per jurisdiction (§45, §111).
create table takedown_requests (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  copyright_claim_id uuid references copyright_claims(id) on delete set null,
  recording_id uuid references recordings(id) on delete set null,
  requester_name text not null,
  requester_email text not null,
  legal_basis text not null,            -- copyright | privacy | defamation
                                        -- | data_protection | other
  jurisdiction_country_id uuid references countries(id),
  statement text not null,
  evidence_document_id uuid references documents(id) on delete set null,
  status text not null default 'received',  -- received | under_review | actioned
                                            -- | rejected | withdrawn
  content_restricted_at timestamptz,    -- when we acted, if we did
  content_restored_at timestamptz,
  assigned_to uuid references auth.users(id),
  decision_note text,
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index takedown_requests_status_idx on takedown_requests (status, created_at);

-- Disagreement over ownership between two parties (e.g. two estates).
create table rights_disputes (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  recording_id uuid references recordings(id) on delete set null,
  song_id uuid references songs(id) on delete set null,
  primary_holder_id uuid references rights_holders(id) on delete set null,
  challenger_holder_id uuid references rights_holders(id) on delete set null,
  summary text not null,
  status text not null default 'open',   -- open | investigating | mediated
                                         -- | resolved | escalated_to_legal
  interim_action text default 'restrict',-- restrict | maintain | remove
  resolution text,
  assigned_to uuid references auth.users(id),
  opened_by uuid references auth.users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index rights_disputes_status_idx on rights_disputes (status, opened_at);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table rights_events enable row level security;
alter table copyright_claims enable row level security;
alter table takedown_requests enable row level security;
alter table rights_disputes enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table rights_events
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table copyright_claims
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table takedown_requests
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table rights_disputes
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0014_media_jobs_deduplication.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §7 Media, jobs and deduplication (§47–§49, §90)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create table media_files (
  id uuid primary key default gen_random_uuid(),
  media_kind media_kind not null,
  storage_provider text not null default 'r2',
  storage_bucket text not null,
  storage_key text not null,              -- authoritative object identity
  original_filename text,
  mime_type text not null,                -- sniffed, never trusted from the client
  declared_mime_type text,                -- what the client claimed
  file_size_bytes bigint not null,
  sha256 text not null,                   -- duplicate detection (§48)
  md5 text,
  duration_seconds integer,
  bitrate_kbps integer,
  sample_rate_hz integer,
  channels smallint,
  codec text,
  image_width integer,
  image_height integer,
  page_count integer,
  waveform_key text,
  checksum_verified boolean not null default false,
  virus_scan_status text not null default 'pending',  -- pending | clean | infected
                                                      -- | failed | skipped
  virus_scan_detail text,
  validation_status text not null default 'pending',  -- pending | valid | invalid
  validation_detail text,
  is_original_master boolean not null default false,
  is_primary boolean not null default false,
  uploaded_by uuid references auth.users(id),
  upload_session_id uuid,
  recorded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint media_size_positive check (file_size_bytes > 0),
  constraint only_master_is_original
    check (media_kind = 'audio_master' or is_original_master = false)
);

create index media_files_sha256_idx on media_files (sha256);

create index media_files_kind_idx on media_files (media_kind, created_at desc);

create index media_files_uploader_idx on media_files (uploaded_by, created_at desc);

create index media_files_scan_idx on media_files (virus_scan_status)
  where virus_scan_status <> 'clean';

-- Links media to recordings and enforces exactly one primary asset per role.
create table recording_media (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references recordings(id) on delete cascade,
  media_file_id uuid not null references media_files(id) on delete cascade,
  role text not null,                     -- master | stream | artwork | waveform
                                          -- | lyric_sheet | document
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (recording_id, media_file_id, role)
);

create unique index recording_media_one_primary
  on recording_media (recording_id, role) where is_primary = true;

create index recording_media_media_idx on recording_media (media_file_id);

-- Streaming derivatives produced by the processing pipeline (§53, §90).
create table audio_derivatives (
  id uuid primary key default gen_random_uuid(),
  media_file_id uuid not null references media_files(id) on delete cascade,
  quality_tier text not null,             -- high | standard | low
  codec text not null,                    -- aac | mp3 | opus
  bitrate_kbps integer not null,
  storage_key text not null,
  file_size_bytes bigint,
  duration_seconds integer,
  is_hls boolean not null default false,
  status text not null default 'ready',   -- queued | processing | ready | failed
  created_at timestamptz not null default now(),
  unique (media_file_id, quality_tier, codec)
);

create index audio_derivatives_media_idx on audio_derivatives (media_file_id);

create table upload_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_file_id uuid references media_files(id) on delete cascade,
  submission_id uuid references submissions(id) on delete set null,
  storage_key text not null,
  r2_upload_id text,                      -- S3 multipart upload id
  total_parts integer,
  uploaded_parts integer not null default 0,
  bytes_uploaded bigint not null default 0,
  expected_size_bytes bigint,
  expected_sha256 text,
  status text not null default 'initiated',  -- initiated | uploading | completed
                                             -- | aborted | expired
  expires_at timestamptz not null default (now() + interval '7 days'),
  completed_at timestamptz,
  last_error text,
  client_platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index upload_sessions_user_idx on upload_sessions (user_id, status);

create index upload_sessions_expiry_idx on upload_sessions (expires_at)
  where status in ('initiated','uploading');

alter table media_files
  add constraint media_files_upload_session_fk
  foreign key (upload_session_id) references upload_sessions(id) on delete set null;

-- Audio fingerprinting (§48). The table exists from day one so the pipeline has a
-- destination; population happens in Phase 4.
create table fingerprints (
  id uuid primary key default gen_random_uuid(),
  media_file_id uuid not null references media_files(id) on delete cascade,
  algorithm text not null default 'chromaprint',
  algorithm_version text,
  fingerprint bytea not null,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  unique (media_file_id, algorithm)
);

-- Probable duplicate pairs, triaged by a human before anything is merged (§48).
create table duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  match_type text not null,               -- exact_hash | near_hash | fingerprint
                                          -- | metadata | matrix_number
  left_media_file_id uuid references media_files(id) on delete cascade,
  right_media_file_id uuid references media_files(id) on delete cascade,
  left_recording_id uuid references recordings(id) on delete cascade,
  right_recording_id uuid references recordings(id) on delete cascade,
  similarity numeric(5,4),
  status text not null default 'open',    -- open | merged | distinct | ignored
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (left_media_file_id is not null or left_recording_id is not null),
  check (left_media_file_id is distinct from right_media_file_id
      or left_recording_id is distinct from right_recording_id)
);

create index duplicate_candidates_status_idx on duplicate_candidates (status, created_at);

create index duplicate_candidates_left_idx on duplicate_candidates (left_media_file_id);

create index duplicate_candidates_right_idx on duplicate_candidates (right_media_file_id);

-- Postgres-backed work queue. Workers claim rows with SKIP LOCKED so several
-- workers can run safely (§90, Phase 4).
create table job_queue (
  id uuid primary key default gen_random_uuid(),
  job_kind job_kind not null,
  status job_status not null default 'queued',
  priority smallint not null default 100,
  payload jsonb not null default '{}'::jsonb,
  attempts smallint not null default 0,
  max_attempts smallint not null default 5,
  run_after timestamptz not null default now(),
  locked_by text,
  locked_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  last_error text,
  result jsonb,
  dedupe_key text,
  created_at timestamptz not null default now()
);

create unique index job_queue_dedupe_idx on job_queue (dedupe_key)
  where dedupe_key is not null and status in ('queued','running');

create index job_queue_claim_idx on job_queue (status, priority, run_after)
  where status = 'queued';

create index job_queue_kind_idx on job_queue (job_kind, status);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table media_files enable row level security;
alter table recording_media enable row level security;
alter table audio_derivatives enable row level security;
alter table upload_sessions enable row level security;
alter table fingerprints enable row level security;
alter table duplicate_candidates enable row level security;
alter table job_queue enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table media_files
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table recording_media
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table audio_derivatives
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table upload_sessions
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table fingerprints
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table duplicate_candidates
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table job_queue
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0015_community_library_notifications.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §8 Community, library and notifications (§70, §92–§94)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type entity_type not null,
  target_id uuid not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index bookmarks_user_idx on bookmarks (user_id, created_at desc);

create table follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type entity_type not null,
  target_id uuid not null,
  notify_new_recordings boolean not null default true,
  notify_new_history boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index follows_user_idx on follows (user_id);

create index follows_target_idx on follows (target_type, target_id);

-- Playlists reference recordings; they never copy audio (§93).
create table playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,   -- null = editorial
  title text not null,
  slug text,
  description text,
  cover_media_id uuid,
  is_public boolean not null default false,
  is_editorial boolean not null default false,
  country_id uuid references countries(id),
  genre_id uuid references genres(id),
  item_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (owner_id is not null or is_editorial)
);

create index playlists_owner_idx on playlists (owner_id, created_at desc);

create index playlists_public_idx on playlists (is_public, created_at desc);

create table playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references playlists(id) on delete cascade,
  recording_id uuid not null references recordings(id) on delete cascade,
  position integer not null,
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (playlist_id, recording_id),
  unique (playlist_id, position)
);

create index playlist_items_recording_idx on playlist_items (recording_id);

create table recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type entity_type not null,
  target_id uuid not null,
  viewed_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index recently_viewed_user_idx on recently_viewed (user_id, viewed_at desc);

-- Aggregated play events. No raw IP or device identifier is stored here (§68, §76).
create table play_events (
  id bigserial primary key,
  recording_id uuid not null references recordings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_session_hash text,
  country_id uuid references countries(id),
  quality_tier text,
  seconds_played integer,
  completed boolean not null default false,
  platform text,                    -- android | ios | web
  played_at timestamptz not null default now()
);

create index play_events_recording_idx on play_events (recording_id, played_at desc);

create index play_events_day_idx on play_events (played_at);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,               -- submission_approved | submission_rejected
                                    -- | evidence_requested | edit_applied
                                    -- | claim_received | claim_decided
                                    -- | recording_published | reply_to_contribution
                                    -- | follow_new_content | account_notice
  title text not null,
  body text,
  action_url text,
  target_type entity_type,
  target_id uuid,
  is_read boolean not null default false,
  read_at timestamptz,
  pushed_at timestamptz,
  push_status text,                 -- queued | sent | failed | skipped
  channel text not null default 'in_app',   -- in_app | push | email
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, is_read, created_at desc);

create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  in_app boolean not null default true,
  push boolean not null default true,
  email boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, kind)
);

create table badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  criterion text,                   -- human-readable rule description
  is_active boolean not null default true
);

-- Badges recognise work; they are not a competitive ranking (§30).
create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_by uuid references auth.users(id),
  awarded_at timestamptz not null default now(),
  note text,
  unique (user_id, badge_id)
);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table bookmarks enable row level security;
alter table follows enable row level security;
alter table playlists enable row level security;
alter table playlist_items enable row level security;
alter table recently_viewed enable row level security;
alter table play_events enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table bookmarks
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table follows
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table playlists
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table playlist_items
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table recently_viewed
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table play_events
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table notifications
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table notification_preferences
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table badges
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table user_badges
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0016_deferred_foreign_keys.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §8 Community, library and notifications (§70, §92–§94)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- deviation: doc 04 §10 lists deferred FKs as 0015 and community tables as 0016, but the
-- document body order must be preserved: `playlists_cover_fk` targets `playlists`, which is
-- created in the community section. Content is unchanged, only the file number moves.

alter table albums             add constraint albums_cover_fk
  foreign key (cover_media_id) references media_files(id) on delete set null;

alter table profiles           add constraint profiles_avatar_fk
  foreign key (avatar_media_id) references media_files(id) on delete set null;

alter table playlists          add constraint playlists_cover_fk
  foreign key (cover_media_id) references media_files(id) on delete set null;

alter table sources            add constraint sources_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table interviews         add constraint interviews_audio_fk
  foreign key (audio_media_id) references media_files(id) on delete set null;

alter table documents          add constraint documents_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table photographs        add constraint photographs_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table copyright_claims   add constraint claims_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table rights_declarations add constraint declarations_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table submission_items   add constraint submission_items_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table band_members       add constraint band_members_source_fk
  foreign key (source_id) references sources(id) on delete set null;

alter table recording_musicians add constraint recording_musicians_source_fk
  foreign key (source_id) references sources(id) on delete set null;

alter table song_musicians     add constraint song_musicians_source_fk
  foreign key (source_id) references sources(id) on delete set null;

alter table song_composers     add constraint song_composers_source_fk
  foreign key (source_id) references sources(id) on delete set null;

alter table recording_credits  add constraint recording_credits_source_fk
  foreign key (source_id) references sources(id) on delete set null;

alter table entity_aliases     add constraint entity_aliases_source_fk
  foreign key (source_id) references sources(id) on delete set null;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0017_audit_security_and_ops.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §9 Audit, security and operational tables (§47, §69, §73)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- Append-only. No UPDATE and no DELETE policy is ever created for any user role.
create table audit_logs (
  id bigserial primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,             -- recording.rights_changed | edit.approved
                                    -- | user.role_granted | recording.removed
  target_type text,
  target_id uuid,
  before_values jsonb,
  after_values jsonb,
  reason text,
  request_id text,
  ip_hash text,
  user_agent text,
  source text,                      -- admin_web | mobile | edge_function | worker
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on audit_logs (actor_id, created_at desc);

create index audit_logs_target_idx on audit_logs (target_type, target_id, created_at desc);

create index audit_logs_action_idx on audit_logs (action, created_at desc);

create table security_events (
  id bigserial primary key,
  event_type text not null,         -- auth_failure | rate_limited | suspicious_upload
                                    -- | malware_detected | blocked_file_type
                                    -- | account_lockout | permission_denied
                                    -- | mass_download | ip_reputation
  severity text not null default 'info',   -- info | warning | high | critical
  user_id uuid references auth.users(id) on delete set null,
  ip_hash text,
  user_agent text,
  detail jsonb,
  handled_by uuid references auth.users(id),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create index security_events_severity_idx on security_events (severity, created_at desc);

create index security_events_type_idx on security_events (event_type, created_at desc);

-- Sliding-window counters used by Edge Functions for rate limiting (§47).
create table rate_limit_counters (
  bucket_key text not null,          -- e.g. 'submission:create:<user_id>'
  window_start timestamptz not null,
  count integer not null default 0,
  limit_value integer not null,
  blocked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (bucket_key, window_start)
);

create index rate_limit_blocked_idx on rate_limit_counters (blocked_until)
  where blocked_until is not null;

-- Daily rollups for the analytics dashboard (§68). Raw events are never exposed.
create table analytics_events_daily (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  metric text not null,             -- active_users | new_users | searches | plays
                                    -- | uploads_submitted | uploads_published
                                    -- | edit_approvals | review_backlog
                                    -- | upload_success_rate
  dimension_key text not null default 'all',   -- country iso2, genre id, platform
  value numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (day, metric, dimension_key)
);

create index analytics_events_daily_idx on analytics_events_daily (metric, day desc);

create table system_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  api_healthy boolean,
  db_healthy boolean,
  storage_healthy boolean,
  cdn_healthy boolean,
  queue_depth integer,
  failed_jobs_24h integer,
  auth_failures_24h integer,
  storage_bytes bigint,
  egress_bytes bigint,
  details jsonb
);

create table app_releases (
  id uuid primary key default gen_random_uuid(),
  platform text not null,           -- android | ios | web
  version text not null,
  build_number integer not null,
  is_minimum_supported boolean not null default false,
  released_at timestamptz not null default now(),
  notes text,
  unique (platform, version, build_number)
);

create table feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  is_enabled boolean not null default false,
  rollout_percentage smallint not null default 0,
  audience text not null default 'all',   -- all | staff | contributors | beta_testers
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  check (rollout_percentage between 0 and 100)
);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table audit_logs enable row level security;
alter table security_events enable row level security;
alter table rate_limit_counters enable row level security;
alter table analytics_events_daily enable row level security;
alter table system_health_snapshots enable row level security;
alter table app_releases enable row level security;
alter table feature_flags enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table audit_logs
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table security_events
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table rate_limit_counters
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table analytics_events_daily
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table system_health_snapshots
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table app_releases
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_at timestamptz;
alter table feature_flags
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0018_functions_and_triggers.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

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

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0019_views.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

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

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0020_rls_enablement_and_policies.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §3 RLS enablement (migration 0020, in full) · §4 Policies
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- Music
alter table songs enable row level security;

alter table recordings enable row level security;

alter table albums enable row level security;

alter table album_tracks enable row level security;

alter table artists enable row level security;

alter table bands enable row level security;

alter table people enable row level security;

alter table band_members enable row level security;

alter table artist_bands enable row level security;

alter table musician_instruments enable row level security;

alter table song_composers enable row level security;

alter table song_musicians enable row level security;

alter table recording_musicians enable row level security;

alter table recording_credits enable row level security;

alter table entity_aliases enable row level security;

alter table entity_translations enable row level security;

alter table song_genres enable row level security;

alter table song_albums enable row level security;

-- Vocabulary
alter table countries enable row level security;

alter table regions enable row level security;

alter table languages enable row level security;

alter table genres enable row level security;

alter table instruments enable row level security;

alter table labels enable row level security;

alter table studios enable row level security;

alter table recording_venues enable row level security;

-- Archive
alter table song_histories enable row level security;

alter table entity_histories enable row level security;

alter table historical_events enable row level security;

alter table timelines enable row level security;

alter table timeline_items enable row level security;

alter table sources enable row level security;

alter table citations enable row level security;

alter table interviews enable row level security;

alter table documents enable row level security;

alter table photographs enable row level security;

alter table ai_extractions enable row level security;

alter table field_assertions enable row level security;

-- Identity and contribution
alter table profiles enable row level security;

alter table roles enable row level security;

alter table permissions enable row level security;

alter table role_permissions enable row level security;

alter table user_roles enable row level security;

alter table user_permissions enable row level security;

alter table account_status_history enable row level security;

alter table submissions enable row level security;

alter table submission_items enable row level security;

alter table edits enable row level security;

alter table revisions enable row level security;

alter table revision_changes enable row level security;

alter table review_decisions enable row level security;

alter table reports enable row level security;

alter table moderation_actions enable row level security;

-- Rights
alter table rights_holders enable row level security;

alter table rights_holder_contacts enable row level security;

alter table rights_declarations enable row level security;

alter table recording_rights enable row level security;

alter table licenses enable row level security;

alter table rights_events enable row level security;

alter table copyright_claims enable row level security;

alter table takedown_requests enable row level security;

alter table rights_disputes enable row level security;

-- Media and jobs
alter table media_files enable row level security;

alter table recording_media enable row level security;

alter table audio_derivatives enable row level security;

alter table upload_sessions enable row level security;

alter table fingerprints enable row level security;

alter table duplicate_candidates enable row level security;

alter table job_queue enable row level security;

-- Community
alter table bookmarks enable row level security;

alter table follows enable row level security;

alter table playlists enable row level security;

alter table playlist_items enable row level security;

alter table recently_viewed enable row level security;

alter table play_events enable row level security;

alter table notifications enable row level security;

alter table notification_preferences enable row level security;

alter table badges enable row level security;

alter table user_badges enable row level security;

-- Audit and ops
alter table audit_logs enable row level security;

alter table security_events enable row level security;

alter table rate_limit_counters enable row level security;

alter table analytics_events_daily enable row level security;

alter table system_health_snapshots enable row level security;

alter table app_releases enable row level security;

alter table feature_flags enable row level security;

-- Songs
create policy songs_select_public on songs
  for select to anon, authenticated
  using (private.is_public(status, deleted_at));

create policy songs_select_staff on songs
  for select to authenticated
  using (private.is_staff());

create policy songs_insert_staff on songs
  for insert to authenticated
  with check (private.has_permission('content.create'));

create policy songs_update_staff on songs
  for update to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

-- Recordings: published AND public AND rights permit listening.
create policy recordings_select_public on recordings
  for select to anon, authenticated
  using (
    private.is_public(status, deleted_at)
    and visibility = 'public'
    and rights_status not in
        ('rights_unknown','disputed','removed','restricted')
  );

create policy recordings_select_contributor_own on recordings
  for select to authenticated
  using (created_by = auth.uid());

create policy recordings_select_staff on recordings
  for select to authenticated
  using (private.is_staff());

create policy recordings_write_staff on recordings
  for update to authenticated
  using (private.has_permission('content.publish'))
  with check (private.has_permission('content.publish'));

create policy countries_select_all on countries
  for select to anon, authenticated using (true);

create policy countries_write_staff on countries
  for all to authenticated
  using (private.has_permission('config.manage'))
  with check (private.has_permission('config.manage'));

create policy genres_select_all on genres
  for select to anon, authenticated using (true);

create policy genres_write_staff on genres
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy people_select_public on people
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy people_write_staff on people
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy band_members_select_public on band_members
  for select to anon, authenticated
  using (exists (select 1 from bands b
                 where b.id = band_id and private.is_public(b.status, b.deleted_at)));

create policy recording_musicians_select_public on recording_musicians
  for select to anon, authenticated
  using (exists (select 1 from recordings r
                 where r.id = recording_id and private.is_public(r.status, r.deleted_at)));

create policy entity_aliases_select_all on entity_aliases
  for select to anon, authenticated using (true);

create policy entity_aliases_write_staff on entity_aliases
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy song_histories_select_public on song_histories
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy song_histories_select_own_draft on song_histories
  for select to authenticated using (authored_by = auth.uid());

create policy song_histories_write_staff on song_histories
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy sources_select_public on sources
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy sources_select_staff on sources
  for select to authenticated using (private.is_staff());

create policy sources_insert_contributor on sources
  for insert to authenticated
  with check (private.has_permission('edit.suggest') and status = 'submitted');

create policy citations_select_public on citations
  for select to anon, authenticated using (deleted_at is null);

create policy citations_insert_contributor on citations
  for insert to authenticated with check (private.has_permission('edit.suggest'));

-- Evidence for contested claims must be visible to everyone (§63).
create policy field_assertions_select_public on field_assertions
  for select to anon, authenticated using (true);

create policy field_assertions_insert_contributor on field_assertions
  for insert to authenticated
  with check (private.has_permission('edit.suggest') or private.is_archivist());

create policy field_assertions_update_staff on field_assertions
  for update to authenticated
  using (private.is_archivist()) with check (private.is_archivist());

-- AI output is staff-only until a human accepts it (§64).
create policy ai_extractions_select_staff on ai_extractions
  for select to authenticated using (private.is_staff());

create policy submissions_insert_contributor on submissions
  for insert to authenticated
  with check (submitted_by = auth.uid()
              and private.has_permission('submission.create')
              and status in ('draft','submitted'));

create policy submissions_select_own on submissions
  for select to authenticated using (submitted_by = auth.uid());

create policy submissions_select_reviewer on submissions
  for select to authenticated using (private.is_archivist());

create policy submissions_update_reviewer on submissions
  for update to authenticated
  using (private.is_archivist()) with check (private.is_archivist());

-- A contributor may withdraw their own submission but can never approve it.
create policy submissions_update_own_withdraw on submissions
  for update to authenticated
  using (submitted_by = auth.uid()
         and status in ('draft','submitted','changes_requested'))
  with check (submitted_by = auth.uid() and status in ('draft','withdrawn'));

create policy submission_items_select_own on submission_items
  for select to authenticated
  using (exists (select 1 from submissions s
                 where s.id = submission_id and s.submitted_by = auth.uid()));

create policy submission_items_select_reviewer on submission_items
  for select to authenticated using (private.is_archivist());

create policy edits_insert_contributor on edits
  for insert to authenticated
  with check (submitted_by = auth.uid()
              and private.has_permission('edit.suggest')
              and status = 'submitted');

create policy edits_select_own on edits
  for select to authenticated using (submitted_by = auth.uid());

create policy edits_select_reviewer on edits
  for select to authenticated using (private.is_archivist());

create policy edits_update_reviewer on edits
  for update to authenticated
  using (private.is_archivist()) with check (private.is_archivist());

-- Revisions are publicly readable once approved; never client-writable (§28).
create policy revisions_select_public on revisions
  for select to anon, authenticated using (is_approved = true);

create policy revisions_select_staff on revisions
  for select to authenticated using (private.is_staff());

create policy revision_changes_select_public on revision_changes
  for select to anon, authenticated
  using (exists (select 1 from revisions r
                 where r.id = revision_id and r.is_approved));

-- Decisions exist in the database but are written only by Edge Functions.
create policy review_decisions_select_staff on review_decisions
  for select to authenticated using (private.is_staff());

-- Public contributor profile: bio and counters only, never contact data.
create policy profiles_select_all on profiles
  for select to anon, authenticated
  using (deleted_at is null and account_status <> 'deleted');

create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_update_staff on profiles
  for update to authenticated
  using (private.has_permission('users.manage'))
  with check (private.has_permission('users.manage'));

-- No client insert policy: profiles are created by an auth trigger.

create policy bookmarks_all_own on bookmarks
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy follows_all_own on follows
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy recently_viewed_all_own on recently_viewed
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy playlists_select_public on playlists
  for select to anon, authenticated
  using ((is_public and deleted_at is null) or is_editorial);

create policy playlists_all_own on playlists
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy playlists_editorial_staff on playlists
  for all to authenticated
  using (private.has_permission('content.publish'))
  with check (private.has_permission('content.publish'));

create policy playlist_items_select_public on playlist_items
  for select to anon, authenticated
  using (exists (select 1 from playlists p
                 where p.id = playlist_id
                   and ((p.is_public and p.deleted_at is null) or p.is_editorial)));

create policy playlist_items_all_own on playlist_items
  for all to authenticated
  using (exists (select 1 from playlists p
                 where p.id = playlist_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from playlists p
                     where p.id = playlist_id and p.owner_id = auth.uid()));

create policy notifications_all_own on notifications
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notification_preferences_all_own on notification_preferences
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Play events are written by Edge Functions only; a user may never read another
-- user's listening history.
create policy play_events_select_own on play_events
  for select to authenticated using (user_id = auth.uid());

create policy user_badges_select_all on user_badges
  for select to anon, authenticated using (true);

create policy badges_select_all on badges
  for select to anon, authenticated using (true);

-- Uploaders see their own media; the public sees only media attached to a
-- recording they are permitted to read.
create policy media_files_select_own on media_files
  for select to authenticated using (uploaded_by = auth.uid());

create policy media_files_select_published on media_files
  for select to anon, authenticated
  using (deleted_at is null
         and virus_scan_status = 'clean'
         and exists (select 1 from recording_media rm
                     join recordings r on r.id = rm.recording_id
                     where rm.media_file_id = media_files.id
                       and private.is_public(r.status, r.deleted_at)));

create policy recording_media_select_published on recording_media
  for select to anon, authenticated
  using (exists (select 1 from recordings r
                 where r.id = recording_id
                   and private.is_public(r.status, r.deleted_at)));

create policy audio_derivatives_select_published on audio_derivatives
  for select to anon, authenticated
  using (exists (select 1 from media_files mf
                 join recording_media rm on rm.media_file_id = mf.id
                 join recordings r on r.id = rm.recording_id
                 where mf.id = audio_derivatives.media_file_id
                   and private.is_public(r.status, r.deleted_at)
                   and r.visibility = 'public'
                   and r.rights_status not in
                       ('rights_unknown','disputed','removed','restricted')));

create policy upload_sessions_all_own on upload_sessions
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Rights: the public sees the status summary; contacts and evidence are staff-only.
create policy recording_rights_select_public on recording_rights
  for select to anon, authenticated using (true);

create policy recording_rights_write_rights_team on recording_rights
  for all to authenticated
  using (private.is_rights_manager()) with check (private.is_rights_manager());

create policy rights_holders_select_public on rights_holders
  for select to anon, authenticated using (deleted_at is null);

create policy rights_holders_write_rights_team on rights_holders
  for all to authenticated
  using (private.is_rights_manager()) with check (private.is_rights_manager());

-- Restricted data (§41, §76).
create policy rights_holder_contacts_select_team on rights_holder_contacts
  for select to authenticated using (private.is_rights_manager());

create policy rights_holder_contacts_write_team on rights_holder_contacts
  for all to authenticated
  using (private.is_rights_manager()) with check (private.is_rights_manager());

-- A claimant may file and follow a case, but never decide it.
create policy copyright_claims_insert_any on copyright_claims
  for insert to authenticated with check (claimant_user_id = auth.uid());

create policy copyright_claims_select_own on copyright_claims
  for select to authenticated using (claimant_user_id = auth.uid());

create policy copyright_claims_select_team on copyright_claims
  for select to authenticated using (private.is_rights_manager());

create policy takedown_requests_select_team on takedown_requests
  for select to authenticated using (private.is_rights_manager());

create policy rights_disputes_select_team on rights_disputes
  for select to authenticated using (private.is_rights_manager());

create policy rights_events_select_team on rights_events
  for select to authenticated using (private.is_rights_manager());

-- Audit and moderation.
create policy audit_logs_select_staff on audit_logs
  for select to authenticated using (private.is_staff());

create policy security_events_select_admin on security_events
  for select to authenticated using (private.has_permission('system.admin'));

create policy reports_insert_any on reports
  for insert to anon, authenticated
  with check (reporter_id is null or reporter_id = auth.uid());

create policy reports_select_own on reports
  for select to authenticated using (reporter_id = auth.uid());

create policy reports_select_moderator on reports
  for select to authenticated
  using (private.is_moderator() or private.is_rights_manager());

create policy moderation_actions_select_moderator on moderation_actions
  for select to authenticated using (private.is_moderator());

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0021_seed_reference_data.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- 0021 — Seed data (reference/vocabulary only). Idempotent: safe to re-run.
--
-- doc 04 §10 fixes this migration as "seed data: countries, languages, genres, instruments, roles,
-- permissions, badges, feature flags, app_releases (idempotent)".
--
-- What belongs here: data the platform cannot function without, in every environment, including
-- production (doc 05 §1 permission codes, doc 09 §4 vocabulary, doc 10 Phase 5 "adding a country
-- requires seed data only — no schema change").
-- What does NOT belong here: the demo/reference dataset — that is supabase/seed.sql (dev only).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Countries and regions (doc 10 Phase 5 expansion sequence: Kenya first, then East, West,
--    Southern, Central and North Africa). Adding a country later must need seed data only.
-- ---------------------------------------------------------------------------
insert into countries (iso2, iso3, name, name_local, region_group, is_active)
select v.iso2, v.iso3, v.name, v.name_local, v.region_group, true
from (values
  ('KE', 'KEN', 'Kenya',        'Kenya',        'East Africa'),
  ('UG', 'UGA', 'Uganda',       'Uganda',       'East Africa'),
  ('TZ', 'TZA', 'Tanzania',     'Tanzania',     'East Africa'),
  ('RW', 'RWA', 'Rwanda',       'Rwanda',       'East Africa'),
  ('BI', 'BDI', 'Burundi',      'Burundi',      'East Africa'),
  ('ET', 'ETH', 'Ethiopia',     'ኢትዮጵያ',       'East Africa'),
  ('SO', 'SOM', 'Somalia',      'Soomaaliya',   'East Africa'),
  ('SS', 'SSD', 'South Sudan',  'South Sudan',  'East Africa'),
  ('NG', 'NGA', 'Nigeria',      'Nigeria',      'West Africa'),
  ('GH', 'GHA', 'Ghana',        'Ghana',        'West Africa'),
  ('SN', 'SEN', 'Senegal',      'Sénégal',      'West Africa'),
  ('CI', 'CIV', 'Côte d''Ivoire', 'Côte d''Ivoire', 'West Africa'),
  ('ML', 'MLI', 'Mali',         'Mali',         'West Africa'),
  ('ZA', 'ZAF', 'South Africa', 'South Africa', 'Southern Africa'),
  ('ZW', 'ZWE', 'Zimbabwe',     'Zimbabwe',     'Southern Africa'),
  ('MZ', 'MOZ', 'Mozambique',   'Moçambique',   'Southern Africa'),
  ('BW', 'BWA', 'Botswana',     'Botswana',     'Southern Africa'),
  ('NA', 'NAM', 'Namibia',      'Namibia',      'Southern Africa'),
  ('CD', 'COD', 'DR Congo',     'République démocratique du Congo', 'Central Africa'),
  ('CM', 'CMR', 'Cameroon',     'Cameroun',     'Central Africa'),
  ('GA', 'GAB', 'Gabon',        'Gabon',        'Central Africa'),
  ('AO', 'AGO', 'Angola',       'Angola',       'Central Africa'),
  ('EG', 'EGY', 'Egypt',        'مصر',          'North Africa'),
  ('MA', 'MAR', 'Morocco',      'المغرب',        'North Africa'),
  ('DZ', 'DZA', 'Algeria',      'الجزائر',       'North Africa'),
  ('TN', 'TUN', 'Tunisia',      'تونس',         'North Africa')
) as v(iso2, iso3, name, name_local, region_group)
where not exists (select 1 from countries c where c.iso2 = v.iso2);

insert into regions (country_id, name, slug)
select c.id, v.name, v.slug
from (values
  ('KE', 'Nairobi',   'nairobi'),
  ('KE', 'Mombasa',   'mombasa'),
  ('KE', 'Kisumu',    'kisumu'),
  ('KE', 'Nakuru',    'nakuru'),
  ('KE', 'Kakamega',  'kakamega'),
  ('KE', 'Nyeri',     'nyeri'),
  ('KE', 'Garissa',   'garissa'),
  ('TZ', 'Dar es Salaam', 'dar-es-salaam'),
  ('TZ', 'Zanzibar',  'zanzibar'),
  ('UG', 'Kampala',   'kampala'),
  ('NG', 'Lagos',     'lagos'),
  ('GH', 'Accra',     'accra'),
  ('ZA', 'Gauteng',   'gauteng')
) as v(country_iso2, name, slug)
join countries c on c.iso2 = v.country_iso2
where not exists (
  select 1 from regions r where r.country_id = c.id and r.name = v.name
);

-- ---------------------------------------------------------------------------
-- 2. Languages (doc 03 §5). `is_ui_locale` marks the launch locales: en + sw (ADR-14, Q3).
-- ---------------------------------------------------------------------------
insert into languages (iso639_1, iso639_3, name, name_local, is_ui_locale)
select v.iso1, v.iso3, v.name, v.name_local, v.is_ui
from (values
  ('en', 'eng', 'English',                'English',        true),
  ('sw', 'swa', 'Kiswahili',              'Kiswahili',      true),
  (null, 'luo', 'Dholuo',                 'Dholuo',         false),
  (null, 'kik', 'Gikuyu',                 'Gĩkũyũ',         false),
  (null, 'luy', 'Luhya',                  'Luhya',          false),
  (null, 'kam', 'Kikamba',                'Kikamba',        false),
  (null, 'som', 'Somali',                 'Soomaali',       false),
  (null, 'amh', 'Amharic',                'አማርኛ',           false),
  (null, 'hau', 'Hausa',                  'Hausa',          false),
  (null, 'yor', 'Yoruba',                 'Yorùbá',         false),
  (null, 'ibo', 'Igbo',                   'Igbo',           false),
  (null, 'zul', 'isiZulu',                'isiZulu',        false),
  (null, 'xho', 'isiXhosa',               'isiXhosa',       false),
  (null, 'lin', 'Lingala',                'Lingála',        false),
  (null, 'wol', 'Wolof',                  'Wolof',          false),
  (null, 'ara', 'Arabic',                 'العربية',         false),
  ('fr', 'fra', 'French',                 'Français',       false),
  ('pt', 'por', 'Portuguese',             'Português',      false)
) as v(iso1, iso3, name, name_local, is_ui)
where not exists (select 1 from languages l where l.name = v.name);

-- ---------------------------------------------------------------------------
-- 3. Genres and instruments (doc 02 §2.1 vocabulary; doc 10 Phase 5 forbids "Kenya-only"
--    assumptions, so the vocabulary spans the continent from the start).
-- ---------------------------------------------------------------------------
insert into genres (name, description, origin_country_id)
select v.name, v.description, c.id
from (values
  ('Benga',        'Kenyan guitar style rooted in Luo nyatiti rhythms; the reference genre for Phase 1.', 'KE'),
  ('Ohangla',      'Luo dance music built on nyatiti, orutu and drums.',                                'KE'),
  ('Taarab',       'Swahili coastal orchestral style of Mombasa and Zanzibar.',                          'KE'),
  ('Genge',        'Nairobi hip-hop-influenced street genre.',                                           'KE'),
  ('Kapuka',       'Kenyan pop/hip-hop hybrid.',                                                         'KE'),
  ('Bongo Flava',  'Tanzanian hip-hop and R&B hybrid.',                                                   'TZ'),
  ('Soukous',      'Congolese dance music, guitar-led.',                                                 'CD'),
  ('Rhumba',       'Congolese-rooted dance band style played across East Africa.',                       'CD'),
  ('Highlife',     'Ghanaian guitar-band and horn tradition.',                                           'GH'),
  ('Juju',         'Yoruba guitar and percussion tradition.',                                            'NG'),
  ('Afrobeat',     'West African funk and horn-driven style.',                                           'NG'),
  ('Mbalax',       'Senegalese dance music with sabar drums.',                                            'SN'),
  ('Chimurenga',   'Zimbabwean guitar-band style.',                                                      'ZW'),
  ('Kwaito',       'South African electronic street style.',                                             'ZA'),
  ('Makossa',      'Cameroonian bass-led dance style.',                                                   'CM'),
  ('Gospel',       'African gospel and choral traditions.',                                              null),
  ('Traditional',  'Traditional repertoire documented without a modern genre label.',                     null)
) as v(name, description, country_iso2)
left join countries c on c.iso2 = v.country_iso2
where not exists (select 1 from genres g where g.name = v.name);

insert into instruments (name, name_local, family, hornbostel_sachs)
select v.name, v.name_local, v.family, v.hs
from (values
  ('Nyatiti',        'Nyatiti',        'string',  '321.5'),
  ('Orutu',          'Orutu',          'string',  '321.5'),
  ('Ongoma',         'Ongoma',         'string',  '321.5'),
  ('Kora',           'Kora',           'string',  '323.1'),
  ('Kalimba',        'Kalimba',        'idiophone','122.1'),
  ('Djembe',         'Djembe',         'membranophone', '211.2'),
  ('Talking drum',   'Dondo',          'membranophone', '211.2'),
  ('Ngoma',          'Ngoma',          'membranophone', '211.2'),
  ('Percussion',     null,             'idiophone','1'),
  ('Guitar',         null,             'string',  '321.3'),
  ('Bass',           null,             'string',  '321.3'),
  ('Drums',          null,             'membranophone', '211.1'),
  ('Keyboard',       null,             'electrophone', '5'),
  ('Trumpet',        null,             'wind',    '423.2'),
  ('Saxophone',      null,             'wind',    '422.2'),
  ('Trombone',       null,             'wind',    '423.2'),
  ('Flute',          null,             'wind',    '421'),
  ('Violin',         null,             'string',  '321.3'),
  ('Accordion',      null,             'wind',    '412.1'),
  ('Vocals',         null,             'vocal',   null)
) as v(name, name_local, family, hs)
where not exists (select 1 from instruments i where i.name = v.name);

-- ---------------------------------------------------------------------------
-- 4. Roles and permissions (doc 05 §1). "No role implies every permission except super_admin; staff
--    permissions are granted individually and revocably."
-- ---------------------------------------------------------------------------
insert into roles (code, name, description, rank)
select v.code, v.name, v.description, v.rank
from (values
  ('member',           'Member',             'Registered listener: published content and their own library.',   10),
  ('contributor',      'Contributor',        'Member plus submissions, edit suggestions and reports.',            20),
  ('archivist',        'Archivist',          'Reviews content, publishes approved records.',                       30),
  ('senior_archivist', 'Senior archivist',   'Historical verification, merges, verification levels.',              40),
  ('moderator',        'Moderator',          'Community and abuse handling, content hiding.',                      50),
  ('rights_manager',   'Rights manager',     'Claims, rights status and restrictions.',                            60),
  ('support_agent',    'Support agent',      'User support: view and notify users only.',                          70),
  ('analyst',          'Analyst',            'Aggregate statistics only.',                                         80),
  ('platform_admin',   'Platform admin',     'Users, content and configuration management.',                       90),
  ('super_admin',      'Super admin',        'Full control, including system administration.',                    100)
) as v(code, name, description, rank)
where not exists (select 1 from roles r where r.code = v.code);

insert into permissions (code, description, category)
select v.code, v.description, v.category
from (values
  ('content.create',      'Create catalogue content',          'content'),
  ('content.review',      'Review submitted content',          'content'),
  ('content.publish',     'Publish or withdraw content',       'content'),
  ('content.merge',       'Merge duplicate entities',          'content'),
  ('content.hide',        'Hide content from public view',     'content'),
  ('verification.set',    'Set verification levels',           'content'),
  ('edit.suggest',        'Suggest an edit',                   'contribution'),
  ('submission.create',   'Submit recordings and new entities', 'contribution'),
  ('rights.manage',       'Manage rights records',             'rights'),
  ('rights.restrict',     'Restrict or remove recordings',     'rights'),
  ('claims.decide',       'Decide copyright claims',           'rights'),
  ('takedown.decide',     'Decide takedown requests',          'rights'),
  ('community.moderate',  'Moderate community behaviour',      'community'),
  ('users.view',          'View user accounts',                'users'),
  ('users.manage',        'Manage users, roles and statuses',  'users'),
  ('users.notify',        'Send notifications to users',       'users'),
  ('analytics.view',      'View aggregate analytics',          'analytics'),
  ('config.manage',       'Manage configuration and taxonomy', 'system'),
  ('import.run',          'Run bulk imports',                  'system'),
  ('system.admin',        'System administration',             'system'),
  ('report.create',       'Report a problem with content',      'community'),
  ('report.triage',       'Triage reports',                     'community'),
  ('newsletter.send',     'Send newsletters',                   'users')
) as v(code, description, category)
where not exists (select 1 from permissions p where p.code = v.code);

-- Role → permission grants, exactly as the matrix in doc 05 §1 describes them.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code = any (
  case r.code
    when 'contributor'      then array['submission.create','edit.suggest','report.create']
    when 'archivist'        then array['content.review','content.publish']
    when 'senior_archivist' then array['content.review','content.publish','content.merge','verification.set']
    when 'moderator'        then array['community.moderate','content.hide','report.triage']
    when 'rights_manager'   then array['rights.manage','rights.restrict','claims.decide','takedown.decide']
    when 'support_agent'    then array['users.view','users.notify']
    when 'analyst'          then array['analytics.view']
    when 'platform_admin'   then array['users.manage','users.view','users.notify','analytics.view',
                                      'config.manage','import.run','report.triage','newsletter.send',
                                      'content.create','content.review','content.publish','content.merge',
                                      'content.hide','verification.set']
    when 'super_admin'      then array(select code from permissions)
    else array[]::text[]
  end
)
where not exists (
  select 1 from role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);

-- ---------------------------------------------------------------------------
-- 5. Contributor badges (doc 02 §2.6) — motivation for sourced, reviewable contributions.
-- ---------------------------------------------------------------------------
insert into badges (code, name, description, criterion)
select v.code, v.name, v.description, v.criterion
from (values
  ('first_contribution',  'First contribution',  'First accepted submission or edit.',                'submissions_accepted >= 1'),
  ('ten_contributions',   'Ten contributions',   'Ten accepted submissions or edits.',                 'submissions_accepted >= 10'),
  ('sourced_historian',   'Sourced historian',   'Five accepted history articles with citations.',     'history_accepted_with_sources >= 5'),
  ('source_verified',     'Primary source',      'Contributed evidence that raised a field to source_verified.', 'verification_set_source_verified >= 1'),
  ('rights_holder',       'Rights holder',       'Verified rights holder account (doc 09 §4).',        'rights_holder_verified'),
  ('duplicate_hunter',    'Duplicate hunter',    'Reported a confirmed duplicate (doc 09 §3).',        'duplicates_confirmed >= 1'),
  ('translator',          'Translator',          'Approved translation into a launch locale.',         'translations_approved >= 1')
) as v(code, name, description, criterion)
where not exists (select 1 from badges b where b.code = v.code);

-- ---------------------------------------------------------------------------
-- 6. Feature flags (doc 10 §8: "Feature flag created if the change is risky").
--    V1 explicitly excludes offline audio (ADR-11) and Typesense (Phase 4), so those flags ship
--    disabled and the clients must respect the database value, not a build constant.
-- ---------------------------------------------------------------------------
insert into feature_flags (key, description, is_enabled, rollout_percentage, audience)
select v.key, v.description, v.is_enabled, v.rollout, v.audience
from (values
  ('claims_portal',        'Public copyright claim and takedown filing (doc 09 §5).',        true,  100, 'all'),
  ('swahili_ui',           'Swahili interface locale (ADR-14, Q3).',                        true,  100, 'all'),
  ('data_saver_mode',      'Lower audio tier and compressed imagery (doc 07 §6).',          true,  100, 'all'),
  ('waveform_player',      'Waveform rendering in the player (Phase 4, doc 07 §5).',        false,   0, 'all'),
  ('offline_audio_download','Offline audio downloads — explicitly out of V1 (ADR-11).',     false,   0, 'all'),
  ('typesense_search',     'Typesense-backed search instead of Postgres FTS (Phase 4).',    false,   0, 'staff'),
  ('bulk_import',          'CSV/JSON bulk import console (doc 08 §5).',                     false,   0, 'staff'),
  ('interview_transcripts','Transcript display for interviews (doc 10 Phase 2).',           true,  100, 'all')
) as v(key, description, is_enabled, rollout, audience)
where not exists (select 1 from feature_flags f where f.key = v.key);

-- ---------------------------------------------------------------------------
-- 7. App releases — the minimum supported version gate for mobile clients (doc 07 §1).
-- ---------------------------------------------------------------------------
insert into app_releases (platform, version, build_number, is_minimum_supported, released_at, notes)
select v.platform, v.version, v.build, v.is_min, v.released_at::timestamptz, v.notes
from (values
  ('android', '1.0.0', 1, true,  '2026-01-01T00:00:00Z', 'Phase 1 prototype client.'),
  ('ios',     '1.0.0', 1, true,  '2026-01-01T00:00:00Z', 'Phase 1 prototype client.'),
  ('web',     '1.0.0', 1, true,  '2026-01-01T00:00:00Z', 'Public archive (banjo.africa).'),
  ('admin',   '1.0.0', 1, true,  '2026-01-01T00:00:00Z', 'Staff console (admin.banjo.africa).')
) as v(platform, version, build, is_min, released_at, notes)
where not exists (
  select 1 from app_releases ar where ar.platform = v.platform and ar.version = v.version
);

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0022_rls_supplementary_policies.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

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

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0023_private_schema_grants.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- 0023 — Let the API roles reach the read-only helpers in `private`.
--
-- Doc 03 §3 revokes `private` from `anon`/`authenticated` so the schema stays off the PostgREST
-- surface — which it still is: PostgREST routes the `public` schema only, so this grant creates no
-- endpoint. What it does fix: read paths that are evaluated as the *requesting* role while running
-- under RLS cannot reach the helper functions without schema `usage`:
--   * `public.search_catalogue()` (doc 06 §5, `GET /search`) calls `private.normalize_name()` and
--     `private.fuzzy_name_match()` in its scoring and fuzzy-fallback predicates;
--   * views flagged `security_invoker` (PostgreSQL 15+, our production target) inline the same two
--     helpers as `anon`/`authenticated`.
-- Before this grant both fail with "permission denied for schema private" for every API role —
-- RLS policy expressions are unaffected (they already worked; see supabase/tests/phase1_slice.sql).
--
-- Scope: schema `usage` only — no `create`, no function grants beyond the EXECUTE-to-PUBLIC
-- default every function already gets at creation. That default was harmless precisely because the
-- schema itself was unreachable; every directly callable function in `private` is a pure predicate
-- or reads only the caller's own `auth.uid()` rows (`is_public`, `entity_is_public`, `has_permission`,
-- `is_staff`, `is_archivist`, `is_moderator`, `is_rights_manager`, `owns`, `uid`, `normalize_name`,
-- `fuzzy_name_match`). Every state-changing helper (`set_updated_at`, `log_*`, `recalc_*`,
-- `enforce_*`, `handle_new_user`, `prevent_hard_delete_archive_rows`, `assert_no_citations`,
-- `maintain_band_member_interval`) returns `trigger` and cannot be called as a function at all.

grant usage on schema private to anon, authenticated, service_role;

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> 0024_solo_credits_and_lyrics.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- 0024 — Solo Credits and Lyrics
-- ============================================================================

-- Extend the credit_role enum with solo role values
-- These values identify when a musician plays a solo; is_soloist boolean
-- on recording_musicians is the primary flag, but role values provide
-- additional categorisation (e.g. "solo_guitar" vs "lead_guitar").
-- Document: relying on is_soloist is the canonical flag; role values are
-- informational categorisation. Keeping lead_guitar for backward compat.
alter type credit_role add value if not exists 'solo_guitar';
alter type credit_role add value if not exists 'solo_saxophone';
alter type credit_role add value if not exists 'solo_trumpet';
alter type credit_role add value if not exists 'solo_keyboard';
alter type credit_role add value if not exists 'solo_other';

-- Add is_soloist and solo_order columns to recording_musicians
-- (notes column already exists; we add the two new columns)
alter table recording_musicians
  add column if not exists is_soloist boolean not null default false;

alter table recording_musicians
  add column if not exists solo_order integer;

-- Add index that still allows same instrument by different people,
-- plus an index on (recording_id, is_soloist, solo_order) for soloist filtering.
-- The existing unique (recording_id, person_id, role, instrument_id) is kept as-is;
-- it already permits same instrument by different people since person_id differentiates.
create index if not exists recording_musicians_solo_idx
  on recording_musicians (recording_id, is_soloist, solo_order);

-- New table: recording_musician_solos — individual solo passages
create table if not exists recording_musician_solos (
  id uuid primary key default gen_random_uuid(),
  recording_musician_id uuid not null references recording_musicians(id) on delete cascade,
  start_sec numeric not null,
  end_sec numeric not null,
  label text,                     -- e.g. "2nd guitar solo", "bridge"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Add RLS and audit columns (created_by, updated_by, version, deleted_at)
alter table recording_musician_solos enable row level security;

-- Mirror RLP policies from recording_musicians (doc 04 §10)
-- RLS policies are defined per-table; they are already on recording_musicians.
-- New rows for recording_musician_solos enter through the submissions/revisions
-- flow (0010_submissions_edits_revisions.sql), so every add/change/remove of a
-- soloist is a revision that appears in History and the diff viewer.

-- Default/update audit columns on recording_musicians (if not already present)
alter table recording_musicians
  add column if not exists created_at timestamptz not null default now();
alter table recording_musicians
  add column if not exists updated_at timestamptz not null default now();
alter table recording_musicians
  add column if not exists created_by uuid references auth.users(id);
alter table recording_musicians
  add column if not exists updated_by uuid references auth.users(id);
alter table recording_musicians
  add column if not exists version integer not null default 1;
alter table recording_musicians
  add column if not exists deleted_at timestamptz;

-- Update existing rows: set is_soloist where role starts with 'solo_'
-- (role is the credit_role enum, so it needs an explicit text cast for LIKE;
-- window functions are not allowed directly in UPDATE, so rank in a subquery)
update recording_musicians rm
set is_soloist = true,
    solo_order = sub.rn
from (
  select recording_id, person_id,
         row_number() over (partition by recording_id order by person_id) as rn
  from (select distinct recording_id, person_id
        from recording_musicians
        where role::text like 'solo_%') soloists
) sub
where rm.recording_id = sub.recording_id
  and rm.person_id = sub.person_id;

-- Grant usage on the extended enum to public roles so PostgREST can resolve them
grant usage on schema public to anon, authenticated;
grant usage on type credit_role to anon, authenticated;

comment on table recording_musician_solos is 'Individual solo passages within a recording_musician credit;
  each row = one solo span (startSec-endSec) for one person on one recording.';
comment on column recording_musician_solos.label is 'Human-readable label for the solo passage, e.g. "1st guitar solo", "bridge solo", "2nd saxophone solo".';
comment on column recording_musicians.is_soloist is 'True when this musician plays a solo on this recording.';
comment on column recording_musicians.solo_order is 'Order of this musician''s solo relative to other soloists on the same recording (1 = first solo heard).';
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
-- >>> seed.sql
-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

-- ============================================================================
-- Development seed — the Phase 1 reference dataset.
--
-- doc 10 §10.4: "build the Phase 1 vertical slice end to end: search → song page → playback →
-- revision history, with one seeded band from Kenyan benga as the reference dataset."
--
-- The dataset uses REAL Luo benga songs and artists from the 1970s, drawn from
-- documented Kenyan benga history. The specific metadata (matrix numbers,
-- exact recording dates) are illustrative for development purposes and should
-- be verified against the original pressings before any public assertion.
--
-- It exercises every rule in the blueprint:
--   * a published, rights-cleared, playable recording          (doc 09 §4)
--   * a published recording with rights_unknown → never streamable, hidden from anon (ADR-12)
--   * a draft recording → invisible to anonymous readers       (doc 05 §4.1, RLS test)
--   * a disputed release year ("1973 or 1974") with two sources (doc 02 §1.2, §63)
--   * a revision history back to version 1                      (ADR-04)
--
-- Idempotent: safe to re-run. Apply with `npm run db:seed`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Accounts (fictional) — one per role the RLS suite exercises (doc 05 §7)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
select v.id::uuid, v.email, jsonb_build_object('display_name', v.display_name, 'locale', 'en')
from (values
  ('11111111-1111-1111-1111-111111111111', 'archivist@banjo.test',     'Achieng Archivist'),
  ('22222222-2222-2222-2222-222222222222', 'rights@banjo.test',        'Rights Manager'),
  ('33333333-3333-3333-3333-333333333333', 'analyst@banjo.test',       'Analytics Analyst'),
  ('44444444-4444-4444-4444-444444444444', 'contributor-a@banjo.test', 'Contributor A'),
  ('55555555-5555-5555-5555-555555555555', 'member@banjo.test',        'Listener Member'),
  ('66666666-6666-6666-6666-666666666666', 'contributor-b@banjo.test', 'Contributor B'),
  ('77777777-7777-7777-7777-777777777777', 'superadmin@banjo.test',    'Platform Owner')
) as v(id, email, display_name)
where not exists (select 1 from auth.users u where u.email = v.email);

insert into user_roles (user_id, role_id, reason)
select v.user_id::uuid, r.id, 'development seed'
from (values
  ('11111111-1111-1111-1111-111111111111', 'archivist'),
  ('22222222-2222-2222-2222-222222222222', 'rights_manager'),
  ('33333333-3333-3333-3333-333333333333', 'analyst'),
  ('44444444-4444-4444-4444-444444444444', 'contributor'),
  ('55555555-5555-5555-5555-555555555555', 'member'),
  ('66666666-6666-6666-6666-666666666666', 'contributor'),
  ('77777777-7777-7777-7777-777777777777', 'super_admin')
) as v(user_id, role_code)
join roles r on r.code = v.role_code
where not exists (
  select 1 from user_roles ur where ur.user_id = v.user_id::uuid and ur.role_id = r.id
);

-- ---------------------------------------------------------------------------
-- 2. The reference band: D.O. Misiani & Shirati Jazz (doc 10 §10.4)
--    Daniel Owino Misiani (1940–2006) pioneered the benga genre and led
--    Shirati Jazz / D.O.7 Shirati Luo Voice Jazz Band through the 1970s.
--    Reference: "The King of History – Classic 1970s Benga Beats From Kenya"
-- ---------------------------------------------------------------------------
insert into bands (id, name, country_id, region_id, city, formed_year, band_type, primary_language_id, history, status, verification)
select
  'aaaaaaa1-0000-4000-8000-000000000001'::uuid,
  'D.O. Misiani & Shirati Jazz',
  c.id,
  rg.id,
  'Nairobi',
  1967,
  'guitar band',
  l.id,
  'Daniel Owino Misiani (1940–2006) pioneered the benga genre and led Shirati Jazz (also known as D.O.7 Shirati Luo Voice Jazz Band) from the late 1960s through the 1970s and beyond. The band defined the classic benga sound with Misiani''s chattering guitar and hyperactive bass lines. Key 1970s recordings include "Lala Salama", "Amuka Salama", "Giko Piny", "Wang Ni To Iringo", "Kiseru", and "Safari Ya Garissa".',
  'published',
  'reviewed'
from countries c
left join regions rg on rg.country_id = c.id and rg.name = 'Nairobi'
left join languages l on l.name = 'Kiswahili'
where c.iso2 = 'KE'
  and not exists (select 1 from bands b where b.id = 'aaaaaaa1-0000-4000-8000-000000000001');

insert into people (id, full_name, sort_name, birth_year, death_year, nationality_country_id, bio, status, verification)
select v.id::uuid, v.full_name, v.sort_name, v.birth_year, v.death_year, c.id, v.bio, 'published', 'reviewed'
from (values
  ('bbbbbbb1-0000-4000-8000-000000000001', 'Daniel Owino Misiani', 'Misiani, Daniel Owino', 1940, 2006, 'Band leader, lead guitar, vocalist. Pioneered the benga genre; led Shirati Jazz through the 1970s. Known as "The King of History".'),
  ('bbbbbbb1-0000-4000-8000-000000000002', 'Ochieng Nelly Mengo', 'Mengo, Ochieng Nelly', 1942, null, 'Veteran benga artist and one of the creators of the benga sound in the 1960s. Hits include "Samuel Aketch", "Monica Abio", "Otina Sambusa".'),
  ('bbbbbbb1-0000-4000-8000-000000000003', 'George Ramogi', 'Ramogi, George', 1945, 1997, 'Benga and rumba musician; pioneer of the genre. Known for narrative songs such as "Ajali ya Sondu" and "Rapar Jonam".'),
  ('bbbbbbb1-0000-4000-8000-000000000004', 'Ochieng Kabaselleh', 'Kabaselleh, Ochieng', 1950, 1998, 'Born Hajullas Nyapanji in Asembo Kokise, Siaya. Recorded his first hit at fifteen. Blended Kenyan and Congolese rumba into "Mbuta Dance". Hits include "Eliza", "Nyar-Gombe", "Achi Maria".')
) as v(id, full_name, sort_name, birth_year, death_year, bio)
cross join (select id from countries where iso2 = 'KE') c
where not exists (select 1 from people p where p.full_name = v.full_name);

insert into band_members (band_id, person_id, role_label, instrument_id, start_year, end_year, is_founder, is_current)
select
  'aaaaaaa1-0000-4000-8000-000000000001'::uuid,
  p.id,
  v.role_label,
  i.id,
  v.start_year,
  v.end_year,
  v.is_founder,
  v.end_year is null
from (values
  ('Daniel Owino Misiani', 'Band leader, lead guitar, vocals', 'Guitar', 1967, 2006, true),
  ('Ochieng Nelly Mengo', 'Guitar, vocals', 'Guitar', 1967, 1975, false),
  ('George Ramogi', 'Guitar, vocals', 'Guitar', 1970, 1978, false),
  ('Ochieng Kabaselleh', 'Guitar, vocals', 'Guitar', 1972, 1980, false)
) as v(person_name, role_label, instrument_name, start_year, end_year, is_founder)
join people p on p.full_name = v.person_name
left join instruments i on i.name = v.instrument_name
where not exists (
  select 1 from band_members bm
  where bm.band_id = 'aaaaaaa1-0000-4000-8000-000000000001' and bm.person_id = p.id
);

-- Spelling variant seen on 1970s pressings: the reason `entity_aliases` exists (doc 01 §2.4).
insert into entity_aliases (entity_type, entity_id, alias, alias_type)
select 'band', 'aaaaaaa1-0000-4000-8000-000000000001'::uuid, 'D.O.7 Shirati Luo Voice Jazz Band', 'spelling_variant'
where not exists (
  select 1 from entity_aliases ea
  where ea.entity_type = 'band' and ea.entity_id = 'aaaaaaa1-0000-4000-8000-000000000001'
    and ea.alias = 'D.O.7 Shirati Luo Voice Jazz Band'
);

insert into entity_aliases (entity_type, entity_id, alias, alias_type)
select 'band', 'aaaaaaa1-0000-4000-8000-000000000001'::uuid, 'Shirati Jazz', 'spelling_variant'
where not exists (
  select 1 from entity_aliases ea
  where ea.entity_type = 'band' and ea.entity_id = 'aaaaaaa1-0000-4000-8000-000000000001'
    and ea.alias = 'Shirati Jazz'
);

-- ---------------------------------------------------------------------------
-- 3. Songs — the composition layer (ADR-01: song ≠ recording)
--    10 real Luo benga compositions from the 1970s.
-- ---------------------------------------------------------------------------
insert into songs (id, title, title_local, canonical_language_id, primary_genre_id, composition_year, composer_credit_text, summary, status, verification, is_verified_disputed)
select
  v.id::uuid, v.title, v.title_local, l.id, g.id, v.composition_year, v.composer_text, v.summary,
  'published', 'reviewed', v.is_disputed
from (values
  ('ccccccc1-0000-4000-8000-000000000001', 'Lala Salama', null, 1973, 'D.O. Misiani', 'Classic benga composition by D.O. Misiani & Shirati Jazz, released in 1973. A staple of the classic 1970s benga repertoire.', false),
  ('ccccccc1-0000-4000-8000-000000000002', 'Amuka Salama', null, 1974, 'D.O. Misiani', 'Benga composition whose release year is documented differently across sources: some discographies list 1974, others 1975.', true),
  ('ccccccc1-0000-4000-8000-000000000003', 'Giko Piny', null, 1975, 'D.O. Misiani', 'From The King of History compilation. A Misiani composition using riddling (ngero) to comment on political life.', false),
  ('ccccccc1-0000-4000-8000-000000000004', 'Wang Ni To Iringo', null, 1975, 'D.O. Misiani', 'A prophetic song castigating Idi Amin''s leadership; the title means "This time you must flee".', false),
  ('ccccccc1-0000-4000-8000-000000000005', 'Kiseru', null, 1976, 'D.O. Misiani', 'Released as "Kiseru Pek Chalo Kidi" in 1976, an instant hit. Kiseru is a Luo clan from Shirati, Tanzania, associated with a mythical reputation for powerful traditional medicine.', false),
  ('ccccccc1-0000-4000-8000-000000000006', 'Safari Ya Garissa', null, 1975, 'D.O. Misiani', 'Benga instrumental from The King of History sessions. Released January 1, 1975 on the album The King of History.', false),
  ('ccccccc1-0000-4000-8000-000000000007', 'Harusi Ya MK', null, 1975, 'D.O. Misiani', 'Swahili-language benga track from the classic 1970s repertoire; "Harusi Ya MK" refers to a wedding celebration.', false),
  ('ccccccc1-0000-4000-8000-000000000008', 'Christina Jaber', null, 1977, 'D.O. Misiani', 'Benga composition from The King of History compilation. Misiani''s narrative style in full flow.', false),
  ('ccccccc1-0000-4000-8000-000000000009', 'Sheroline', null, 1977, 'D.O. Misiani', 'Named after a woman; a mid-1970s benga love song in Misiani''s signature style.', false),
  ('ccccccc1-0000-4000-8000-000000000010', 'Jaa', null, 1976, 'D.O. Misiani', 'Released as a 7" single in 1976 on the D.O.7 label. A dance-floor benga staple.', false)
) as v(id, title, title_local, composition_year, composer_text, summary, is_disputed)
left join languages l on l.name = 'Kiswahili'
left join genres g on g.name = 'Benga'
where not exists (select 1 from songs s where s.id = v.id::uuid);

insert into song_composers (song_id, person_id, role, is_primary)
select s.id, p.id, 'composer', true
from songs s
join people p on p.full_name = 'Daniel Owino Misiani'
where s.id in (
  'ccccccc1-0000-4000-8000-000000000001', 'ccccccc1-0000-4000-8000-000000000002',
  'ccccccc1-0000-4000-8000-000000000003', 'ccccccc1-0000-4000-8000-000000000004',
  'ccccccc1-0000-4000-8000-000000000005', 'ccccccc1-0000-4000-8000-000000000006',
  'ccccccc1-0000-4000-8000-000000000007', 'ccccccc1-0000-4000-8000-000000000008',
  'ccccccc1-0000-4000-8000-000000000009', 'ccccccc1-0000-4000-8000-000000000010'
)
  and not exists (select 1 from song_composers sc where sc.song_id = s.id and sc.person_id = p.id);

-- ---------------------------------------------------------------------------
-- 4. Media (binaries live in R2; only metadata and keys are in Postgres — ADR-02)
--    storage_key format is fixed by doc 09 §1: audio/{iso2}/{year}/{recording_id}/…
-- ---------------------------------------------------------------------------
insert into media_files (id, media_kind, storage_bucket, storage_key, original_filename, mime_type, file_size_bytes, sha256, duration_seconds, bitrate_kbps, sample_rate_hz, channels, codec, is_original_master, is_primary, checksum_verified, virus_scan_status, validation_status, uploaded_by)
select v.id::uuid, v.kind::media_kind, 'banjo-media-dev', v.key, v.filename, v.mime, v.size, v.sha, v.duration, v.bitrate, 44100, 2, v.codec, v.is_master, v.is_primary, true, 'clean', 'valid', '44444444-4444-4444-4444-444444444444'::uuid
from (values
  -- Lala Salama (1973) — recording ddddddd1-...0010
  ('ddddddd1-0000-4000-8000-000000000001', 'audio_master', 'audio/ke/1973/ddddddd1-0000-4000-8000-000000000010/master.wav', 'lala-salama-master.wav', 'audio/wav', 52428800, 'sha256-master-lala-salama', 245, 1411, 'pcm_s16le', true, false),
  ('ddddddd1-0000-4000-8000-000000000002', 'audio_stream', 'audio/ke/1973/ddddddd1-0000-4000-8000-000000000010/stream/high.aac', 'lala-salama-high.aac', 'audio/mp4', 4194304, 'sha256-high-lala-salama', 245, 320, 'aac', false, true),
  ('ddddddd1-0000-4000-8000-000000000003', 'audio_stream', 'audio/ke/1973/ddddddd1-0000-4000-8000-000000000010/stream/standard.aac', 'lala-salama-standard.aac', 'audio/mp4', 2097152, 'sha256-standard-lala-salama', 245, 160, 'aac', false, false),
  ('ddddddd1-0000-4000-8000-000000000004', 'audio_stream', 'audio/ke/1973/ddddddd1-0000-4000-8000-000000000010/stream/low.aac', 'lala-salama-low.aac', 'audio/mp4', 838860, 'sha256-low-lala-salama', 245, 64, 'aac', false, false),
  -- Amuka Salama (1974) — recording ddddddd1-...0020 (rights_unknown, private)
  ('ddddddd1-0000-4000-8000-000000000005', 'audio_master', 'audio/ke/1974/ddddddd1-0000-4000-8000-000000000020/master.wav', 'amuka-salama-master.wav', 'audio/wav', 41943040, 'sha256-master-amuka-salama', 218, 1411, 'pcm_s16le', true, false),
  -- Giko Piny (1975) — recording ddddddd1-...0030
  ('ddddddd1-0000-4000-8000-000000000006', 'audio_master', 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000030/master.flac', 'giko-piny-master.flac', 'audio/flac', 31457280, 'sha256-master-giko-piny', 286, 900, 'flac', true, false),
  -- Wang Ni To Iringo (1975) — recording ddddddd1-...0040
  ('ddddddd1-0000-4000-8000-000000000008', 'audio_master', 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000040/master.flac', 'wang-ni-to-iringo-master.flac', 'audio/flac', 29360128, 'sha256-master-wang-ni-to-iringo', 272, 900, 'flac', true, false),
  -- Kiseru (1976) — recording ddddddd1-...0050
  ('ddddddd1-0000-4000-8000-000000000009', 'audio_master', 'audio/ke/1976/ddddddd1-0000-4000-8000-000000000050/master.flac', 'kiseru-master.flac', 'audio/flac', 35651584, 'sha256-master-kiseru', 330, 900, 'flac', true, false),
  -- Safari Ya Garissa (1975) — recording ddddddd1-...0060
  ('ddddddd1-0000-4000-8000-000000000010', 'audio_master', 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000060/master.flac', 'safari-ya-garissa-master.flac', 'audio/flac', 33554432, 'sha256-master-safari-garissa', 311, 900, 'flac', true, false),
  -- Harusi Ya MK (1975) — recording ddddddd1-...0070
  ('ddddddd1-0000-4000-8000-000000000011', 'audio_master', 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000070/master.flac', 'harusi-ya-mk-master.flac', 'audio/flac', 30408704, 'sha256-master-harusi-ya-mk', 283, 900, 'flac', true, false),
  -- Christina Jaber (1977) — recording ddddddd1-...0080
  ('ddddddd1-0000-4000-8000-000000000012', 'audio_master', 'audio/ke/1977/ddddddd1-0000-4000-8000-000000000080/master.flac', 'christina-jaber-master.flac', 'audio/flac', 28311552, 'sha256-master-christina-jaber', 262, 900, 'flac', true, false),
  -- Sheroline (1977) — recording ddddddd1-...0090
  ('ddddddd1-0000-4000-8000-000000000013', 'audio_master', 'audio/ke/1977/ddddddd1-0000-4000-8000-000000000090/master.flac', 'sheroline-master.flac', 'audio/flac', 27262976, 'sha256-master-sheroline', 252, 900, 'flac', true, false),
  -- Jaa (1976) — recording ddddddd1-...0100
  ('ddddddd1-0000-4000-8000-000000000014', 'audio_master', 'audio/ke/1976/ddddddd1-0000-4000-8000-000000000100/master.flac', 'jaa-master.flac', 'audio/flac', 34603008, 'sha256-master-jaa', 320, 900, 'flac', true, false),
  -- Band cover image
  ('ddddddd1-0000-4000-8000-000000000007', 'image', 'image/band/aaaaaaa1-0000-4000-8000-000000000001/ddddddd1-0000-4000-8000-000000000007/medium.webp', 'shirati-jazz-sleeve.webp', 'image/webp', 262144, 'sha256-shirati-cover', null, null, null, false, true)
) as v(id, kind, key, filename, mime, size, sha, duration, bitrate, codec, is_master, is_primary)
where not exists (select 1 from media_files mf where mf.id = v.id::uuid);

-- ---------------------------------------------------------------------------
-- 5. Recordings
--    R1 published + rights cleared  (playable; the happy path of the slice)
--    R2 published + rights_unknown + visibility 'private' — documented in the archive,
--        never streamable and never publicly visible (ADR-12, doc 02 §5)
--    R3 published + disputed year   (doc 02 §1.2: "1973 or 1974")
--    R4 draft                       (invisible to anonymous readers)
-- ---------------------------------------------------------------------------
insert into recordings (id, song_id, title, band_id, country_id, language_id, primary_genre_id, recording_year, release_year, matrix_number, recording_type, is_live, duration_seconds, rights_status, visibility, verification, status, summary)
select
  v.id::uuid, v.song_id::uuid, v.title, 'aaaaaaa1-0000-4000-8000-000000000001'::uuid, c.id, l.id, g.id,
  v.recording_year, v.release_year, v.matrix, 'studio', false, v.duration,
  v.rights::rights_status, v.visibility, v.verification::verification_level, v.status::publication_status, v.summary
from (values
  ('ddddddd1-0000-4000-8000-000000000010', 'ccccccc1-0000-4000-8000-000000000001', 'Lala Salama (1973)', 1973, 1973, 'SR-001', 245, 'rights_holder_uploaded', 'public', 'reviewed', 'published', 'Classic benga single. Rights cleared for streaming.'),
  ('ddddddd1-0000-4000-8000-000000000020', 'ccccccc1-0000-4000-8000-000000000002', 'Amuka Salama (1974)', 1974, 1974, 'SR-004', 218, 'rights_unknown', 'private', 'community_sourced', 'published', 'Press copy with unknown provenance: documented, never streamable.'),
  ('ddddddd1-0000-4000-8000-000000000030', 'ccccccc1-0000-4000-8000-000000000003', 'Giko Piny', 1975, 1975, 'SR-009', 286, 'public_domain', 'public', 'source_verified', 'published', 'From The King of History sessions. Statutory public domain basis recorded.'),
  ('ddddddd1-0000-4000-8000-000000000040', 'ccccccc1-0000-4000-8000-000000000004', 'Wang Ni To Iringo', 1975, 1975, 'SR-012', 272, 'public_domain', 'public', 'source_verified', 'published', 'Prophetic song castigating Idi Amin. Public domain basis recorded.'),
  ('ddddddd1-0000-4000-8000-000000000050', 'ccccccc1-0000-4000-8000-000000000005', 'Kiseru', 1976, 1976, 'SR-015', 330, 'rights_holder_uploaded', 'public', 'reviewed', 'published', '1976 hit single. Rights cleared for streaming.'),
  ('ddddddd1-0000-4000-8000-000000000060', 'ccccccc1-0000-4000-8000-000000000006', 'Safari Ya Garissa', 1975, 1975, 'SR-018', 311, 'public_domain', 'public', 'source_verified', 'published', 'Instrumental from The King of History sessions. Public domain basis recorded.'),
  ('ddddddd1-0000-4000-8000-000000000070', 'ccccccc1-0000-4000-8000-000000000007', 'Harusi Ya MK', 1975, 1975, 'SR-021', 283, 'rights_holder_uploaded', 'public', 'reviewed', 'published', 'Swahili-language benga track. Rights cleared for streaming.'),
  ('ddddddd1-0000-4000-8000-000000000080', 'ccccccc1-0000-4000-8000-000000000008', 'Christina Jaber', 1977, 1977, 'SR-024', 262, 'rights_holder_uploaded', 'public', 'reviewed', 'published', 'From The King of History compilation. Rights cleared for streaming.'),
  ('ddddddd1-0000-4000-8000-000000000090', 'ccccccc1-0000-4000-8000-000000000009', 'Sheroline', 1977, 1977, 'SR-027', 252, 'public_domain', 'public', 'source_verified', 'published', 'Mid-1970s benga love song. Public domain basis recorded.'),
  ('ddddddd1-0000-4000-8000-000000000100', 'ccccccc1-0000-4000-8000-000000000010', 'Jaa', 1976, 1976, 'SR-030', 320, 'rights_holder_uploaded', 'public', 'reviewed', 'published', '1976 7" single on D.O.7 label. Rights cleared for streaming.'),
  ('ddddddd1-0000-4000-8000-000000000110', 'ccccccc1-0000-4000-8000-000000000001', 'Lala Salama (alternate take)', 1973, null, 'SR-001B', 252, 'user_claimed_rights', 'private', 'unverified', 'draft', 'Draft: unreviewed alternate take, invisible to the public.')
) as v(id, song_id, title, recording_year, release_year, matrix, duration, rights, visibility, verification, status, summary)
cross join (select id from countries where iso2 = 'KE') c
left join languages l on l.name = 'Kiswahili'
left join genres g on g.name = 'Benga'
where not exists (select 1 from recordings r where r.id = v.id::uuid);

insert into recording_media (recording_id, media_file_id, role, is_primary)
select v.recording_id::uuid, v.media_id::uuid, v.role, v.is_primary
from (values
  -- Lala Salama
  ('ddddddd1-0000-4000-8000-000000000010', 'ddddddd1-0000-4000-8000-000000000001', 'master', true),
  ('ddddddd1-0000-4000-8000-000000000010', 'ddddddd1-0000-4000-8000-000000000002', 'stream', true),
  ('ddddddd1-0000-4000-8000-000000000010', 'ddddddd1-0000-4000-8000-000000000003', 'stream', false),
  ('ddddddd1-0000-4000-8000-000000000010', 'ddddddd1-0000-4000-8000-000000000004', 'stream', false),
  -- Giko Piny
  ('ddddddd1-0000-4000-8000-000000000030', 'ddddddd1-0000-4000-8000-000000000006', 'master', true),
  -- Wang Ni To Iringo
  ('ddddddd1-0000-4000-8000-000000000040', 'ddddddd1-0000-4000-8000-000000000008', 'master', true),
  -- Kiseru
  ('ddddddd1-0000-4000-8000-000000000050', 'ddddddd1-0000-4000-8000-000000000009', 'master', true),
  -- Safari Ya Garissa
  ('ddddddd1-0000-4000-8000-000000000060', 'ddddddd1-0000-4000-8000-000000000010', 'master', true),
  -- Harusi Ya MK
  ('ddddddd1-0000-4000-8000-000000000070', 'ddddddd1-0000-4000-8000-000000000011', 'master', true),
  -- Christina Jaber
  ('ddddddd1-0000-4000-8000-000000000080', 'ddddddd1-0000-4000-8000-000000000012', 'master', true),
  -- Sheroline
  ('ddddddd1-0000-4000-8000-000000000090', 'ddddddd1-0000-4000-8000-000000000013', 'master', true),
  -- Jaa
  ('ddddddd1-0000-4000-8000-000000000100', 'ddddddd1-0000-4000-8000-000000000014', 'master', true)
) as v(recording_id, media_id, role, is_primary)
where not exists (
  select 1 from recording_media rm
  where rm.recording_id = v.recording_id::uuid and rm.media_file_id = v.media_id::uuid
);
-- R2's master (`…0005`) is deliberately NOT linked: enforce_rights_before_publish treats linked
-- audio on a published recording as streamable audio (doc 02 §5), so the rights_unknown entry
-- stays metadata-only. The transfer itself sits in media_files until the rights are cleared.

insert into audio_derivatives (media_file_id, quality_tier, codec, bitrate_kbps, storage_key, file_size_bytes, duration_seconds, status)
select v.media_id::uuid, v.tier, 'aac', v.bitrate, v.key, v.size, 245, 'ready'
from (values
  ('ddddddd1-0000-4000-8000-000000000001', 'high',     320, 'audio/ke/1973/ddddddd1-0000-4000-8000-000000000010/stream/high.aac', 4194304),
  ('ddddddd1-0000-4000-8000-000000000001', 'standard', 160, 'audio/ke/1973/ddddddd1-0000-4000-8000-000000000010/stream/standard.aac', 2097152),
  ('ddddddd1-0000-4000-8000-000000000001', 'low',       64, 'audio/ke/1973/ddddddd1-0000-4000-8000-000000000010/stream/low.aac', 838860)
) as v(media_id, tier, bitrate, key, size)
where not exists (
  select 1 from audio_derivatives ad where ad.media_file_id = v.media_id::uuid and ad.quality_tier = v.tier
);

-- ---------------------------------------------------------------------------
-- 6. Rights records (doc 09 §4). R1, R3–R10 are streamable. R2 carries an explicit rights row
--    that grants archive-only access: the row exists so no read path can treat "missing" as
--    "cleared", and the check constraints keep allows_streaming false (ADR-12).
-- ---------------------------------------------------------------------------
insert into rights_holders (id, holder_type, name, country_id, notes, status)
select 'eeeeeee1-0000-4000-8000-000000000001'::uuid, 'estate', 'D.O. Misiani Estate', c.id, 'Development fixture; verification lives on rights_holder_contacts (ADR-04).', 'verified'
from (select id from countries where iso2 = 'KE') c
where not exists (select 1 from rights_holders rh where rh.id = 'eeeeeee1-0000-4000-8000-000000000001');

insert into recording_rights (recording_id, rights_status, rights_holder_id, rights_basis, territory, permitted_scope, allows_streaming, allows_download, allows_research, allows_commercial, allows_derivatives, last_reviewed_at, notes)
select
  v.recording_id::uuid, v.rights::rights_status, v.holder::uuid, v.basis, 'KE', array[v.scope::rights_scope],
  v.streaming, v.download, true, v.commercial, false, now(), v.notes
from (values
  ('ddddddd1-0000-4000-8000-000000000010', 'rights_holder_uploaded', 'eeeeeee1-0000-4000-8000-000000000001', 'Estate submitted the master and signed the contributor agreement.', 'streaming', true, false, false, 'Cleared for streaming on Banjo.'),
  ('ddddddd1-0000-4000-8000-000000000020', 'rights_unknown',        null, 'Press copy: origin and rights holder unknown; documented for research only.', 'archive_only', false, false, false, 'Never streamable (ADR-12); scope limited to the archive.'),
  ('ddddddd1-0000-4000-8000-000000000030', 'public_domain',        null, 'Copyright term expired; statutory basis recorded with year.', 'streaming', true, false, false, 'Public domain basis documented by the archivist.'),
  ('ddddddd1-0000-4000-8000-000000000040', 'public_domain',        null, 'Copyright term expired; statutory basis recorded with year.', 'streaming', true, false, false, 'Public domain basis documented by the archivist.'),
  ('ddddddd1-0000-4000-8000-000000000050', 'rights_holder_uploaded', 'eeeeeee1-0000-4000-8000-000000000001', 'Estate submitted the master and signed the contributor agreement.', 'streaming', true, false, false, 'Cleared for streaming on Banjo.'),
  ('ddddddd1-0000-4000-8000-000000000060', 'public_domain',        null, 'Copyright term expired; statutory basis recorded with year.', 'streaming', true, false, false, 'Public domain basis documented by the archivist.'),
  ('ddddddd1-0000-4000-8000-000000000070', 'rights_holder_uploaded', 'eeeeeee1-0000-4000-8000-000000000001', 'Estate submitted the master and signed the contributor agreement.', 'streaming', true, false, false, 'Cleared for streaming on Banjo.'),
  ('ddddddd1-0000-4000-8000-000000000080', 'rights_holder_uploaded', 'eeeeeee1-0000-4000-8000-000000000001', 'Estate submitted the master and signed the contributor agreement.', 'streaming', true, false, false, 'Cleared for streaming on Banjo.'),
  ('ddddddd1-0000-4000-8000-000000000090', 'public_domain',        null, 'Copyright term expired; statutory basis recorded with year.', 'streaming', true, false, false, 'Public domain basis documented by the archivist.'),
  ('ddddddd1-0000-4000-8000-000000000100', 'rights_holder_uploaded', 'eeeeeee1-0000-4000-8000-000000000001', 'Estate submitted the master and signed the contributor agreement.', 'streaming', true, false, false, 'Cleared for streaming on Banjo.')
) as v(recording_id, rights, holder, basis, scope, streaming, download, commercial, notes)
where not exists (select 1 from recording_rights rr where rr.recording_id = v.recording_id::uuid);

-- enforce_rights_before_publish only runs when `status` is written, and every recording was
-- inserted before its media and rights rows existed. Touch the status column once so the guard
-- validates the final state of each seeded recording (published + linked audio ⇒ streamable
-- rights; otherwise metadata-only). With housekeeping excluded from revision tracking the touch
-- must not create revisions either — scripts/db-test.sh asserts both.
update recordings set status = status;

-- ---------------------------------------------------------------------------
-- 7. Sources, citations and the disputed release year (doc 02 §1.2, doc 09 §7)
--    "Two or more competing sourced assertions ⇒ the field is marked disputed in the UI.
--     The UI shows both values with their sources and no implicit winner."
-- ---------------------------------------------------------------------------
insert into sources (id, source_type, title, author, publisher, published_year, reliability_note, summary, status, verification)
select v.id::uuid, v.kind::source_type, v.title, v.author, v.publisher, v.year, v.reliability, v.summary, 'published', 'reviewed'
from (values
  ('fffffff1-0000-4000-8000-000000000001', 'record_sleeve', 'The King of History sleeve notes', 'D.O. Misiani', 'Shirati Jazz / Universal Music Kenya', 1975, 'primary', 'Sleeve from The King of History compilation states a 1975 release.'),
  ('fffffff1-0000-4000-8000-000000000002', 'band_member_testimony', 'Interview with a Shirati Jazz member, 1998', 'Banjo Archive (fictional)', 'Nairobi', 1998, 'secondary', 'Band member recalls recording Amuka Salama in 1974, a year before the pressing.')
) as v(id, kind, title, author, publisher, year, reliability, summary)
where not exists (select 1 from sources s where s.id = v.id::uuid);

insert into citations (source_id, target_type, target_id, field_key, locator, quote, supports, confidence)
select 'fffffff1-0000-4000-8000-000000000001'::uuid, 'song', 'ccccccc1-0000-4000-8000-000000000002'::uuid, 'release_year', 'sleeve, rear panel',
       'Pressed 1975 — Shirati Jazz catalogue SR-004', true, 'high'
where not exists (
  select 1 from citations ci where ci.source_id = 'fffffff1-0000-4000-8000-000000000001' and ci.target_id = 'ccccccc1-0000-4000-8000-000000000002'
);
insert into citations (source_id, target_type, target_id, field_key, locator, quote, supports, confidence)
select 'fffffff1-0000-4000-8000-000000000002'::uuid, 'song', 'ccccccc1-0000-4000-8000-000000000002'::uuid, 'release_year', '00:14:20',
       'We cut it the year before the pressing, in 1974.', true, 'medium'
where not exists (
  select 1 from citations ci where ci.source_id = 'fffffff1-0000-4000-8000-000000000002' and ci.target_id = 'ccccccc1-0000-4000-8000-000000000002'
);

insert into field_assertions (entity_type, entity_id, field_key, value_jsonb, value_display, source_id, citation_id, status, is_disputed, asserted_by, resolved_by, resolved_at, resolution_note)
select 'song', 'ccccccc1-0000-4000-8000-000000000002'::uuid, 'release_year',
       to_jsonb(v.year), v.year::text, v.source_id::uuid,
       (select ci.id from citations ci where ci.source_id = v.source_id::uuid and ci.target_id = 'ccccccc1-0000-4000-8000-000000000002' limit 1),
       v.status, true, '11111111-1111-1111-1111-111111111111'::uuid, v.resolved_by::uuid, v.resolved_at, v.note
from (values
  (1975, 'fffffff1-0000-4000-8000-000000000001', 'accepted',  '11111111-1111-1111-1111-111111111111', now()::timestamp, 'Displayed value: the sleeve is the artefact of record.'),
  (1974, 'fffffff1-0000-4000-8000-000000000002', 'contested', null, null, 'Member testimony disagrees; both values are shown and neither is deleted (doc 02 §1.2).')
) as v(year, source_id, status, resolved_by, resolved_at, note)
where not exists (
  select 1 from field_assertions fa
  where fa.entity_type = 'song' and fa.entity_id = 'ccccccc1-0000-4000-8000-000000000002'
    and fa.field_key = 'release_year' and fa.value_display = v.year::text
);

-- ---------------------------------------------------------------------------
-- 8. Long-form history with a citation (doc 10 Phase 2) — published, so the song page shows it.
-- ---------------------------------------------------------------------------
insert into song_histories (id, song_id, locale, headline, body, body_format, period_start_year, period_end_year, status, verification, authored_by, approved_by, approved_at)
select
  'fffffff1-0000-4000-8000-000000000010'::uuid,
  'ccccccc1-0000-4000-8000-000000000002'::uuid,
  'en',
  'Amuka Salama: the disputed press date',
  E'Shirati Jazz recorded the song in Nairobi in the mid-1970s. The sleeve of the SR-004 pressing states 1975; a band member interviewed in 1998 recalled 1974.\n\nBoth claims are recorded as assertions with their sources.',
  'markdown', 1974, 1975, 'published', 'reviewed',
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  now()
where not exists (select 1 from song_histories h where h.id = 'fffffff1-0000-4000-8000-000000000010');

insert into historical_events (id, event_type, title, description, year, date_precision, country_id, band_id, verification, status)
select 'fffffff1-0000-4000-8000-000000000020'::uuid, 'formation', 'D.O. Misiani forms Shirati Jazz',
       'Daniel Owino Misiani forms the band that would define classic benga.', 1967, 'year', c.id,
       'aaaaaaa1-0000-4000-8000-000000000001'::uuid, 'reviewed', 'published'
from (select id from countries where iso2 = 'KE') c
where not exists (select 1 from historical_events e where e.id = 'fffffff1-0000-4000-8000-000000000020');

insert into historical_events (id, event_type, title, description, year, date_precision, country_id, band_id, verification, status)
select 'fffffff1-0000-4000-8000-000000000021'::uuid, 'release', 'Lala Salama released',
       'Shirati Jazz releases "Lala Salama", one of the defining benga singles of the 1970s.', 1973, 'year', c.id,
       'aaaaaaa1-0000-4000-8000-000000000001'::uuid, 'reviewed', 'published'
from (select id from countries where iso2 = 'KE') c
where not exists (select 1 from historical_events e where e.id = 'fffffff1-0000-4000-8000-000000000021');

insert into timelines (id, title, slug, description, country_id, genre_id, start_year, end_year, is_editorial, status)
select 'fffffff1-0000-4000-8000-000000000030'::uuid, 'Benga in Nairobi', 'benga-nairobi',
       'Reference timeline for the Phase 1 slice: the classic 1970s benga era.', c.id, g.id, 1967, 1980, true, 'published'
from (select id from countries where iso2 = 'KE') c
cross join (select id from genres where name = 'Benga') g
where not exists (select 1 from timelines t where t.id = 'fffffff1-0000-4000-8000-000000000030');

insert into timeline_items (timeline_id, historical_event_id, position, year, caption)
select 'fffffff1-0000-4000-8000-000000000030'::uuid, 'fffffff1-0000-4000-8000-000000000020'::uuid, 1, 1967,
       'D.O. Misiani forms Shirati Jazz.'
where not exists (
  select 1 from timeline_items ti
  where ti.timeline_id = 'fffffff1-0000-4000-8000-000000000030'
    and ti.historical_event_id = 'fffffff1-0000-4000-8000-000000000020'
);

insert into timeline_items (timeline_id, historical_event_id, position, year, caption)
select 'fffffff1-0000-4000-8000-000000000030'::uuid, 'fffffff1-0000-4000-8000-000000000021'::uuid, 2, 1973,
       'Lala Salama released.'
where not exists (
  select 1 from timeline_items ti
  where ti.timeline_id = 'fffffff1-0000-4000-8000-000000000030'
    and ti.historical_event_id = 'fffffff1-0000-4000-8000-000000000021'
);

-- ---------------------------------------------------------------------------
-- 9. Contributor activity: a submission, an edit awaiting review, a report, a bookmark and a play
--    event — so the console, the queue and the library screens have real rows to work with.
-- ---------------------------------------------------------------------------
insert into submissions (id, kind, target_type, target_id, title, rationale, status, verification, submitted_by, country_id)
select 'fffffff1-0000-4000-8000-000000000040'::uuid, 'new_recording', 'recording',
       'ddddddd1-0000-4000-8000-000000000010'::uuid, 'Alternate take of Lala Salama (1973)',
       'A family tape holds a second take; the upload will follow the standard media pipeline.',
       'submitted', 'community_sourced', '44444444-4444-4444-4444-444444444444'::uuid, c.id
from (select id from countries where iso2 = 'KE') c
where not exists (select 1 from submissions s where s.id = 'fffffff1-0000-4000-8000-000000000040');

insert into submission_items (submission_id, item_type, payload, position)
select 'fffffff1-0000-4000-8000-000000000040'::uuid, 'statement',
       jsonb_build_object('note', 'Second take, same session, transferred from a cassette.', 'declared_year', 1973), 0
where not exists (
  select 1 from submission_items si where si.submission_id = 'fffffff1-0000-4000-8000-000000000040'
);

insert into edits (id, target_type, target_id, submission_id, field_key, current_value, proposed_value, explanation, status, submitted_by)
select 'fffffff1-0000-4000-8000-000000000050'::uuid, 'song', 'ccccccc1-0000-4000-8000-000000000002'::uuid,
       null, 'primary_genre_id', to_jsonb((select id::text from genres where name = 'Benga')),
       to_jsonb((select id::text from genres where name = 'Rhumba')),
       'The 1975 pressing credits a rhumba-style arrangement; suggesting the genre be widened.',
       'submitted', '66666666-6666-6666-6666-666666666666'::uuid
where not exists (select 1 from edits e where e.id = 'fffffff1-0000-4000-8000-000000000050');

insert into reports (id, target_type, target_id, reason, detail, reporter_id, status)
select 'fffffff1-0000-4000-8000-000000000060'::uuid, 'song', 'ccccccc1-0000-4000-8000-000000000002'::uuid,
       'incorrect_information', 'The sleeve says 1975 but my copy is stamped 1974.',
       '55555555-5555-5555-5555-555555555555'::uuid, 'open'
where not exists (select 1 from reports r where r.id = 'fffffff1-0000-4000-8000-000000000060');

insert into bookmarks (user_id, target_type, target_id)
select '55555555-5555-5555-5555-555555555555'::uuid, 'song', 'ccccccc1-0000-4000-8000-000000000001'::uuid
where not exists (
  select 1 from bookmarks b
  where b.user_id = '55555555-5555-5555-5555-555555555555'::uuid
    and b.target_id = 'ccccccc1-0000-4000-8000-000000000001'::uuid
);

insert into play_events (recording_id, user_id, seconds_played, completed, platform, country_id)
select 'ddddddd1-0000-4000-8000-000000000010'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 245, true,
       'web', (select id from countries where iso2 = 'KE')
where not exists (select 1 from play_events pe where pe.recording_id = 'ddddddd1-0000-4000-8000-000000000010');

-- Job queue rows: the console's system-health screen (doc 08 §3, §69) reads these.
insert into job_queue (job_kind, status, priority, payload, dedupe_key)
select v.kind::job_kind, v.status::job_status, 100, v.payload::jsonb, v.dedupe
from (values
  ('reindex', 'queued', '{"scope":"catalogue"}', 'reindex:seed'),
  ('transcode', 'failed', '{"recording_id":"ddddddd1-0000-4000-8000-000000000060"}', 'transcode:safari-garissa')
) as v(kind, status, payload, dedupe)
where not exists (select 1 from job_queue jq where jq.dedupe_key = v.dedupe);
