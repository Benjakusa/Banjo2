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
