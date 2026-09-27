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
