-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §5 Contributions, revisions and review (§24–§31, §63, §66)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- A submission is a bundle a contributor sends for review: a new recording plus
-- its history, musicians and sources can all arrive as one submission.
create table submissions (
  id uuid primary key default gen_random_uuid(),
  kind contribution_kind not null,
  target_type entity_type,          -- null for new content, set for edits
  target_id uuid,
  title text not null,
  rationale text,                   -- why the contributor believes this is correct
  status publication_status not null default 'submitted',
  verification verification_level not null default 'unverified',
  submitted_by uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  priority smallint not null default 0,
  country_id uuid references countries(id),
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index submissions_queue_idx on submissions (status, submitted_at);

create index submissions_assignee_idx on submissions (assigned_to, status);

create index submissions_contributor_idx on submissions (submitted_by, status);

create index submissions_country_idx on submissions (country_id, status);

-- Payload items: media, sources, statements, people — each independently reviewable.
create table submission_items (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  item_type text not null,          -- media | source | statement | person | band
                                    -- | instrument | history | rights_declaration
  payload jsonb not null,
  media_file_id uuid,               -- set when item_type = 'media'
  source_id uuid references sources(id) on delete set null,
  position integer not null default 0,
  review_status publication_status not null default 'submitted',
  created_at timestamptz not null default now()
);

create index submission_items_submission_idx on submission_items (submission_id, position);

-- A proposed change to an existing entity (§27). Never applied directly.
create table edits (
  id uuid primary key default gen_random_uuid(),
  target_type entity_type not null,
  target_id uuid not null,
  submission_id uuid references submissions(id) on delete cascade,
  field_key text,
  current_value jsonb,
  proposed_value jsonb,
  explanation text not null,
  status publication_status not null default 'submitted',
  submitted_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  applied_at timestamptz,
  applied_revision_id uuid,         -- FK added in this section below
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index edits_target_idx on edits (target_type, target_id, status);

create index edits_queue_idx on edits (status, created_at);

create index edits_contributor_idx on edits (submitted_by, status);

-- Immutable snapshot of an entity at a point in time (§28).
create table revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type not null,
  entity_id uuid not null,
  version integer not null,
  snapshot jsonb not null,          -- full row as it stood (or would stand)
  change_summary text,
  change_reason text,
  source_edit_id uuid references edits(id) on delete set null,
  source_submission_id uuid references submissions(id) on delete set null,
  authored_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, version)
);

create index revisions_entity_idx on revisions (entity_type, entity_id, version desc);

create index revisions_created_idx on revisions (created_at desc);

alter table edits
  add constraint edits_applied_revision_fk
  foreign key (applied_revision_id) references revisions(id) on delete set null;

-- Field-level diff rows: what the difference viewer renders (§29).
create table revision_changes (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references revisions(id) on delete cascade,
  field_key text not null,
  old_value jsonb,
  new_value jsonb,
  change_type text not null default 'update',   -- create | update | delete
  created_at timestamptz not null default now()
);

create index revision_changes_revision_idx on revision_changes (revision_id);

create table review_decisions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,        -- submission | edit | submission_item | media
                                    -- | copyright_claim | report
  target_id uuid not null,
  action review_action not null,
  reason text,
  internal_note text,               -- staff-only
  reviewer_id uuid not null references auth.users(id),
  previous_status publication_status,
  new_status publication_status,
  verification_set verification_level,
  created_at timestamptz not null default now()
);

create index review_decisions_target_idx on review_decisions (target_type, target_id);

create index review_decisions_reviewer_idx on review_decisions (reviewer_id, created_at desc);

-- Competing, sourced claims about one field. This is how Banjo says
-- "1975 or 1976 - here is the evidence for each" (§63) instead of guessing.
create table field_assertions (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type not null,
  entity_id uuid not null,
  field_key text not null,
  value_jsonb jsonb not null,
  value_display text,               -- ready-to-render string, e.g. "1975"
  source_id uuid references sources(id) on delete set null,
  citation_id uuid references citations(id) on delete set null,
  status text not null default 'proposed',   -- proposed | accepted | contested
                                             -- | superseded | rejected
  is_disputed boolean not null default false,
  asserted_by uuid references auth.users(id),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'accepted' or resolved_at is not null)
);

create index field_assertions_lookup_idx
  on field_assertions (entity_type, entity_id, field_key);

create index field_assertions_disputed_idx on field_assertions (is_disputed)
  where is_disputed = true;

create index field_assertions_source_idx on field_assertions (source_id);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table submissions enable row level security;
alter table submission_items enable row level security;
alter table edits enable row level security;
alter table revisions enable row level security;
alter table revision_changes enable row level security;
alter table review_decisions enable row level security;
alter table field_assertions enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table submissions
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table submission_items
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table edits
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table revisions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_at timestamptz;
alter table revision_changes
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table review_decisions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table field_assertions
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
