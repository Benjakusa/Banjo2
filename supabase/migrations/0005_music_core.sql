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
