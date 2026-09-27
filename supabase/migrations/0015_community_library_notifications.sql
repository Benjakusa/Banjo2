-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §8 Community, library and notifications (§70, §92–§94)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type entity_type not null,
  target_id uuid not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index bookmarks_user_idx on bookmarks (user_id, created_at desc);

create table follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type entity_type not null,
  target_id uuid not null,
  notify_new_recordings boolean not null default true,
  notify_new_history boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index follows_user_idx on follows (user_id);

create index follows_target_idx on follows (target_type, target_id);

-- Playlists reference recordings; they never copy audio (§93).
create table playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,   -- null = editorial
  title text not null,
  slug text,
  description text,
  cover_media_id uuid,
  is_public boolean not null default false,
  is_editorial boolean not null default false,
  country_id uuid references countries(id),
  genre_id uuid references genres(id),
  item_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (owner_id is not null or is_editorial)
);

create index playlists_owner_idx on playlists (owner_id, created_at desc);

create index playlists_public_idx on playlists (is_public, created_at desc);

create table playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references playlists(id) on delete cascade,
  recording_id uuid not null references recordings(id) on delete cascade,
  position integer not null,
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (playlist_id, recording_id),
  unique (playlist_id, position)
);

create index playlist_items_recording_idx on playlist_items (recording_id);

create table recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type entity_type not null,
  target_id uuid not null,
  viewed_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index recently_viewed_user_idx on recently_viewed (user_id, viewed_at desc);

-- Aggregated play events. No raw IP or device identifier is stored here (§68, §76).
create table play_events (
  id bigserial primary key,
  recording_id uuid not null references recordings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_session_hash text,
  country_id uuid references countries(id),
  quality_tier text,
  seconds_played integer,
  completed boolean not null default false,
  platform text,                    -- android | ios | web
  played_at timestamptz not null default now()
);

create index play_events_recording_idx on play_events (recording_id, played_at desc);

create index play_events_day_idx on play_events (played_at);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,               -- submission_approved | submission_rejected
                                    -- | evidence_requested | edit_applied
                                    -- | claim_received | claim_decided
                                    -- | recording_published | reply_to_contribution
                                    -- | follow_new_content | account_notice
  title text not null,
  body text,
  action_url text,
  target_type entity_type,
  target_id uuid,
  is_read boolean not null default false,
  read_at timestamptz,
  pushed_at timestamptz,
  push_status text,                 -- queued | sent | failed | skipped
  channel text not null default 'in_app',   -- in_app | push | email
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, is_read, created_at desc);

create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  in_app boolean not null default true,
  push boolean not null default true,
  email boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, kind)
);

create table badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  criterion text,                   -- human-readable rule description
  is_active boolean not null default true
);

-- Badges recognise work; they are not a competitive ranking (§30).
create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_by uuid references auth.users(id),
  awarded_at timestamptz not null default now(),
  note text,
  unique (user_id, badge_id)
);

-- RLS enabled in the same migration that creates each table (doc 04 §10 rule 4).
alter table bookmarks enable row level security;
alter table follows enable row level security;
alter table playlists enable row level security;
alter table playlist_items enable row level security;
alter table recently_viewed enable row level security;
alter table play_events enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;

-- Universal columns (doc 02 §2.2, doc 03 §6). The blueprint omits them from the table bodies
-- for brevity and states they are "not optional"; they are added here, in the same migration
-- as their table, before the RLS migration that depends on them.
alter table bookmarks
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table follows
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table playlists
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;
alter table playlist_items
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table recently_viewed
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table play_events
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table notifications
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table notification_preferences
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table badges
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
alter table user_badges
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz;
