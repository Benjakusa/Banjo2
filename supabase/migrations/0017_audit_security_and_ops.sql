-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §9 Audit, security and operational tables (§47, §69, §73)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- Append-only. No UPDATE and no DELETE policy is ever created for any user role.
create table audit_logs (
  id bigserial primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,             -- recording.rights_changed | edit.approved
                                    -- | user.role_granted | recording.removed
  target_type text,
  target_id uuid,
  before_values jsonb,
  after_values jsonb,
  reason text,
  request_id text,
  ip_hash text,
  user_agent text,
  source text,                      -- admin_web | mobile | edge_function | worker
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on audit_logs (actor_id, created_at desc);

create index audit_logs_target_idx on audit_logs (target_type, target_id, created_at desc);

create index audit_logs_action_idx on audit_logs (action, created_at desc);

create table security_events (
  id bigserial primary key,
  event_type text not null,         -- auth_failure | rate_limited | suspicious_upload
                                    -- | malware_detected | blocked_file_type
                                    -- | account_lockout | permission_denied
                                    -- | mass_download | ip_reputation
  severity text not null default 'info',   -- info | warning | high | critical
  user_id uuid references auth.users(id) on delete set null,
  ip_hash text,
  user_agent text,
  detail jsonb,
  handled_by uuid references auth.users(id),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create index security_events_severity_idx on security_events (severity, created_at desc);

create index security_events_type_idx on security_events (event_type, created_at desc);

-- Sliding-window counters used by Edge Functions for rate limiting (§47).
create table rate_limit_counters (
  bucket_key text not null,          -- e.g. 'submission:create:<user_id>'
  window_start timestamptz not null,
  count integer not null default 0,
  limit_value integer not null,
  blocked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (bucket_key, window_start)
);

create index rate_limit_blocked_idx on rate_limit_counters (blocked_until)
  where blocked_until is not null;

-- Daily rollups for the analytics dashboard (§68). Raw events are never exposed.
create table analytics_events_daily (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  metric text not null,             -- active_users | new_users | searches | plays
                                    -- | uploads_submitted | uploads_published
                                    -- | edit_approvals | review_backlog
                                    -- | upload_success_rate
  dimension_key text not null default 'all',   -- country iso2, genre id, platform
  value numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (day, metric, dimension_key)
);

create index analytics_events_daily_idx on analytics_events_daily (metric, day desc);

create table system_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  api_healthy boolean,
  db_healthy boolean,
  storage_healthy boolean,
  cdn_healthy boolean,
  queue_depth integer,
  failed_jobs_24h integer,
  auth_failures_24h integer,
  storage_bytes bigint,
  egress_bytes bigint,
  details jsonb
);

create table app_releases (
  id uuid primary key default gen_random_uuid(),
  platform text not null,           -- android | ios | web
  version text not null,
  build_number integer not null,
  is_minimum_supported boolean not null default false,
  released_at timestamptz not null default now(),
  notes text,
  unique (platform, version, build_number)
);

create table feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  is_enabled boolean not null default false,
  rollout_percentage smallint not null default 0,
  audience text not null default 'all',   -- all | staff | contributors | beta_testers
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  check (rollout_percentage between 0 and 100)
);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table audit_logs enable row level security;
alter table security_events enable row level security;
alter table rate_limit_counters enable row level security;
alter table analytics_events_daily enable row level security;
alter table system_health_snapshots enable row level security;
alter table app_releases enable row level security;
alter table feature_flags enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table audit_logs
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table security_events
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table rate_limit_counters
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table analytics_events_daily
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table system_health_snapshots
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table app_releases
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_at timestamptz;
alter table feature_flags
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
