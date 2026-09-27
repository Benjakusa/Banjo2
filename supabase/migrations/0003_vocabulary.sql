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
