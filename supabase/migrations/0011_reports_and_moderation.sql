-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §5 Contributions, revisions and review (§24–§31, §63, §66)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- User reports (§33).
create table reports (
  id uuid primary key default gen_random_uuid(),
  target_type entity_type not null,
  target_id uuid not null,
  reason report_reason not null,
  detail text,
  reporter_id uuid references auth.users(id) on delete set null,
  reporter_email text,              -- for anonymous reports
  status text not null default 'open',    -- open | triaged | actioned | dismissed
  priority smallint not null default 0,
  assigned_to uuid references auth.users(id),
  resolution_note text,
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporter_id is not null or reporter_email is not null)
);

create index reports_status_idx on reports (status, priority desc, created_at);

create index reports_target_idx on reports (target_type, target_id);

-- Moderation actions on people and content (§71, §72).
create table moderation_actions (
  id uuid primary key default gen_random_uuid(),
  action text not null,             -- hide_content | restore_content
                                    -- | suspend_account | restrict_uploads
                                    -- | remove_comment | restrict_recording | escalate
  target_type entity_type,
  target_id uuid,
  target_user_id uuid references auth.users(id) on delete set null,
  report_id uuid references reports(id) on delete set null,
  reason text not null,
  duration_hours integer,
  expires_at timestamptz,
  actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversed_by uuid references auth.users(id)
);

create index moderation_actions_target_idx on moderation_actions (target_type, target_id);

create index moderation_actions_user_idx on moderation_actions (target_user_id, created_at desc);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table reports enable row level security;
alter table moderation_actions enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table reports
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table moderation_actions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
