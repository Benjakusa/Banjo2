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
