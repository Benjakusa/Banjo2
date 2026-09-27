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
