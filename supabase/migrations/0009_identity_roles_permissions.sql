-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §4 Identity, roles and permissions
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_media_id uuid,
  bio text,
  country_id uuid references countries(id),
  preferred_locale text not null default 'en',
  account_status account_status not null default 'active',
  is_verified_contributor boolean not null default false,
  is_rights_holder_contact boolean not null default false,
  accepted_terms_at timestamptz,
  accepted_terms_version text,
  approved_edits integer not null default 0,
  pending_submissions integer not null default 0,
  rejected_submissions integer not null default 0,
  last_active_at timestamptz,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index profiles_status_idx on profiles (account_status);

create table roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,     -- member | contributor | archivist | senior_archivist
                                 -- | moderator | rights_manager | support_agent
                                 -- | analyst | platform_admin | super_admin
  name text not null,
  description text,
  rank smallint not null default 0,
  created_at timestamptz not null default now()
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,     -- 'content.review','content.publish','rights.manage',
                                 -- 'community.moderate','users.manage','analytics.view',
                                 -- 'system.admin','import.run'
  description text not null,
  category text not null
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete restrict,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  reason text,
  unique (user_id, role_id)
);

create index user_roles_user_idx on user_roles (user_id) where revoked_at is null;

-- Explicit, time-boxed personal grants: no admin receives all permissions (§38).
create table user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  reason text,
  unique (user_id, permission_id)
);

create table account_status_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_status account_status,
  to_status account_status not null,
  reason text,
  actor_id uuid references auth.users(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index account_status_history_user_idx on account_status_history (user_id, created_at);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table profiles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;
alter table user_permissions enable row level security;
alter table account_status_history enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table profiles
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table roles
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table permissions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table role_permissions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table user_roles
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table user_permissions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table account_status_history
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
