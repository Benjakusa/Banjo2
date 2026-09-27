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
