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
