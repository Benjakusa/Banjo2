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
