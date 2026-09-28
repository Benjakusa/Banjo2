-- ============================================================================
-- 0024 — Solo Credits and Lyrics
-- ==========================================================================--

-- Extend the credit_role enum with solo role values
-- These values identify when a musician plays a solo; is_soloist boolean
-- on recording_musicians is the primary flag, but role values provide
-- additional categorisation (e.g. "solo_guitar" vs "lead_guitar").
-- Document: relying on is_soloist is the canonical flag; role values are
-- informational categorisation. Keeping lead_guitar for backward compat.
create type extension credit_role_ext as enum (
  'solo_guitar',
  'solo_saxophone',
  'solo_trumpet',
  'solo_keyboard',
  'solo_other'
);

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
update recording_musicians
set is_soloist = true,
  solo_order = row_number() over (partition by recording_id order by person_id)
from (select distinct on (recording_id, person_id) recording_id, person_id, role
      from recording_musicians
      where role like 'solo_%'
      order by recording_id, person_id, role) sub
where recording_musicians.recording_id = sub.recording_id
  and recording_musicians.person_id = sub.person_id;

-- Grant usage on the extended enum to public roles so PostgREST can resolve them
grant usage on schema public to anon, authenticated;
grant type credit_role_ext to anon, authenticated;

comment on table recording_musician_solos is 'Individual solo passages within a recording_musician credit;
  each row = one solo span (startSec-endSec) for one person on one recording.';
comment on column recording_musician_solos.label is 'Human-readable label for the solo passage, e.g. "1st guitar solo", "bridge solo", "2nd saxophone solo".';
comment on column recording_musicians.is_soloist is 'True when this musician plays a solo on this recording.';
comment on column recording_musicians.solo_order is 'Order of this musician''s solo relative to other soloists on the same recording (1 = first solo heard).';