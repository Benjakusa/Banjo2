-- ============================================================================
-- BANJO application tables — copy & paste this whole file into
-- Supabase Dashboard > SQL Editor > New Query > Run.
-- Safe to re-run (idempotent, no secrets inside).
--
-- These are the tables the React app reads and writes directly through
-- supabase-js. They are deliberately simple: one JSONB payload per archive
-- entity, one private profile row per account. The full archival schema in
-- supabase/migrations/ is the long-term model; this file is the path the app
-- runs on today.
--
--   app_archive_items   the whole catalogue: recordings, songs, musicians,
--                       bands, albums, oral histories, documents
--   app_profiles        one private profile per account, keyed by the account
--                       id — two accounts can never share a profile row
--   app_submissions     moderation queue (edit suggestions and legacy items)
--   app_audit_logs      immutable trail for approvals + rights decisions
--   app_problem_reports public archive issue reports, readable by staff
--   app_copyright_cases reports / takedown requests
--
-- Nothing is seeded: every row is created by a real account as people
-- contribute. An empty project simply starts with an empty catalogue.
-- ============================================================================

-- 1) ARCHIVE CATALOGUE --------------------------------------------------------
-- One row per entity. `kind` is the discriminator; `payload` is the entity as
-- the app models it. New items come from signed-in contributors.
create table if not exists public.app_archive_items (
  id text primary key,
  kind text not null check (kind in ('recording','song','musician','band','album','oral_history','document')),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_archive_items_kind_idx on public.app_archive_items (kind);

-- 2) PROFILES -----------------------------------------------------------------
-- The primary key IS the account id, so a profile row is unique per account by
-- construction and no two profiles can share data. RLS below limits every
-- statement to the row whose user_id equals the caller's auth.uid().
create table if not exists public.app_profiles (
  user_id uuid primary key,
  email text not null default '',
  display_name text not null default '',
  role text not null default 'listener',
  avatar_url text not null default '',
  bio text not null default '',
  verified_status boolean not null default false,
  saved_recording_ids text[] not null default '{}',
  bookmarked_pages jsonb not null default '[]'::jsonb,
  playlists jsonb not null default '[]'::jsonb,
  contributions_count integer not null default 0,
  songs_submitted integer not null default 0,
  edits_submitted integer not null default 0,
  edits_approved integer not null default 0,
  pending_review integer not null default 0,
  rejected_edits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- On Supabase, tie the row to the account so deleting an account removes its
-- profile. Skipped on a plain PostgreSQL instance, where auth.users is absent.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users')
     and not exists (
       select 1 from pg_constraint
       where conname = 'app_profiles_user_id_fkey'
         and conrelid = 'public.app_profiles'::regclass
     ) then
    alter table public.app_profiles
      add constraint app_profiles_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end
$$;

-- 3) SUBMISSIONS (moderation queue: edits + new recordings) ------------------
create table if not exists public.app_submissions (
  id text primary key,
  contributor_id uuid,
  type text not null default 'edit',
  title text not null default '',
  contributor_name text not null default '',
  contributor_email text not null default '',
  target_id text,
  target_title text,
  target_type text,
  priority text not null default 'normal',
  status text not null default 'pending',
  current_data jsonb not null default '{}'::jsonb,
  proposed_data jsonb not null default '{}'::jsonb,
  rights_declaration text not null default '',
  sources_provided text not null default '',
  review_notes text not null default '',
  created_at timestamptz not null default now()
);

-- 4) AUDIT LOGS (immutable trail for approvals + copyright decisions) --------
create table if not exists public.app_audit_logs (
  id text primary key,
  who text not null default '',
  action text not null default '',
  target text not null default '',
  timestamp text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.app_problem_reports (
  id text primary key,
  target_title text not null default '',
  reason text not null default '',
  notes text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

-- 5) COPYRIGHT CASES (rights reports / takedown requests) --------------------
create table if not exists public.app_copyright_cases (
  id text primary key,
  case_number text not null default '',
  recording_id text not null default 'rec-001',
  recording_title text not null default '',
  artist_or_band text not null default '',
  claimant_name text not null default '',
  claimant_email text not null default '',
  claim_type text not null default 'ownership',
  status text not null default 'open',
  filed_date text not null default '',
  summary text not null default '',
  evidence text not null default '',
  assigned_to text,
  created_at timestamptz not null default now()
);

-- Helpful indexes -------------------------------------------------------------
create index if not exists app_submissions_status_idx on public.app_submissions (status);
create index if not exists app_submissions_created_idx on public.app_submissions (created_at desc);
alter table public.app_submissions add column if not exists contributor_id uuid;
alter table public.app_submissions add column if not exists rights_declaration text not null default '';
alter table public.app_copyright_cases add column if not exists case_number text not null default '';
create index if not exists app_audit_logs_created_idx on public.app_audit_logs (created_at desc);
create index if not exists app_copyright_cases_status_idx on public.app_copyright_cases (status);

-- Privileges ------------------------------------------------------------------
-- Supabase grants these automatically through its default privileges; stated
-- explicitly so the script also works on a plain PostgreSQL instance and on
-- projects where the API roles were never granted the schema.
grant usage on schema public to anon, authenticated;

-- Catalogue: anyone may read; only signed-in accounts may contribute.
grant select on public.app_archive_items to anon, authenticated;
grant insert, update, delete on public.app_archive_items to authenticated;

-- Profiles: signed-in accounts only. RLS narrows this to their own row.
-- Role and contribution counters are server-managed; owners can only update
-- their public details and personal library.
grant select, insert, delete on public.app_profiles to authenticated;
revoke update on public.app_profiles from authenticated;
grant update (display_name, avatar_url, bio, saved_recording_ids,
              bookmarked_pages, playlists, updated_at)
  on public.app_profiles to authenticated;

-- Moderation queue: signed-in accounts only.
grant select, insert, update on public.app_submissions to authenticated;
grant select, insert on public.app_audit_logs to authenticated;
grant select on public.app_problem_reports to authenticated;
grant insert on public.app_problem_reports to anon, authenticated;

-- Rights reports may be filed without an account; reading and resolving them
-- needs one.
grant select, insert, update on public.app_copyright_cases to authenticated;
grant insert on public.app_copyright_cases to anon;

-- Enable RLS ------------------------------------------------------------------
alter table public.app_archive_items enable row level security;
alter table public.app_profiles enable row level security;
alter table public.app_submissions enable row level security;
alter table public.app_audit_logs enable row level security;
alter table public.app_problem_reports enable row level security;
alter table public.app_copyright_cases enable row level security;

-- Policies: catalogue ---------------------------------------------------------
drop policy if exists "archive items public read" on public.app_archive_items;
create policy "archive items public read" on public.app_archive_items
  for select to anon, authenticated using (true);

drop policy if exists "archive items contributor insert" on public.app_archive_items;
create policy "archive items contributor insert" on public.app_archive_items
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "archive items contributor update" on public.app_archive_items;
create policy "archive items contributor update" on public.app_archive_items
  for update to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.app_profiles p
               where p.user_id = auth.uid()
                 and p.role in ('super_admin','platform_admin','senior_archivist','archivist'))
  )
  with check (
    created_by = auth.uid()
    or exists (select 1 from public.app_profiles p
               where p.user_id = auth.uid()
                 and p.role in ('super_admin','platform_admin','senior_archivist','archivist'))
  );

drop policy if exists "archive items contributor delete" on public.app_archive_items;
create policy "archive items contributor delete" on public.app_archive_items
  for delete to authenticated using (
    exists (select 1 from public.app_profiles p
            where p.user_id = auth.uid()
              and p.role in ('super_admin','platform_admin','senior_archivist','archivist'))
  );

-- Policies: profiles ----------------------------------------------------------
-- A profile row is readable and writable by its owner and nobody else.
-- The auth schema (and auth.uid()) only exists on Supabase; on a plain
-- PostgreSQL instance these policies are skipped.
create or replace function public.app_profiles_restrict_self_role()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and new.user_id = auth.uid() then
    if tg_op = 'INSERT' then
      if new.role not in ('listener', 'contributor', 'analyst') then
        new.role := 'listener';
      end if;
      new.verified_status := false;
      new.contributions_count := 0;
      new.songs_submitted := 0;
      new.edits_submitted := 0;
      new.edits_approved := 0;
      new.pending_review := 0;
      new.rejected_edits := 0;
    elsif new.role is distinct from old.role then
      raise exception 'Profile roles are assigned by Banjo administrators';
    end if;
  end if;
  return new;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'auth') then
    execute 'drop policy if exists "own profile read" on public.app_profiles';
    execute 'create policy "own profile read" on public.app_profiles
               for select to authenticated using (user_id = auth.uid())';
    execute 'drop policy if exists "own profile insert" on public.app_profiles';
    execute 'create policy "own profile insert" on public.app_profiles
               for insert to authenticated with check (user_id = auth.uid())';
    execute 'drop policy if exists "own profile update" on public.app_profiles';
    execute 'create policy "own profile update" on public.app_profiles
               for update to authenticated using (user_id = auth.uid())
               with check (user_id = auth.uid())';
    execute 'drop policy if exists "own profile delete" on public.app_profiles';
    execute 'create policy "own profile delete" on public.app_profiles
               for delete to authenticated using (user_id = auth.uid())';
    execute 'drop trigger if exists app_profiles_restrict_self_role on public.app_profiles';
    execute 'create trigger app_profiles_restrict_self_role
               before insert or update on public.app_profiles
               for each row execute function public.app_profiles_restrict_self_role()';
  else
    raise notice 'Skipping app_profiles RLS policies: no auth schema (plain PostgreSQL).';
  end if;
end
$$;

-- Policies: moderation queue --------------------------------------------------
drop policy if exists "submissions read" on public.app_submissions;
create policy "submissions read" on public.app_submissions
  for select to authenticated using (
    contributor_id = auth.uid()
    or exists (select 1 from public.app_profiles p
               where p.user_id = auth.uid()
                 and p.role in ('super_admin','platform_admin','senior_archivist','archivist','moderator'))
  );

drop policy if exists "submissions insert" on public.app_submissions;
create policy "submissions insert" on public.app_submissions
  for insert to authenticated with check (contributor_id = auth.uid() and status = 'pending');

drop policy if exists "submissions update" on public.app_submissions;
create policy "submissions update" on public.app_submissions
  for update to authenticated
  using (exists (select 1 from public.app_profiles p
                 where p.user_id = auth.uid()
                   and p.role in ('super_admin','platform_admin','senior_archivist','archivist','moderator')))
  with check (exists (select 1 from public.app_profiles p
                      where p.user_id = auth.uid()
                        and p.role in ('super_admin','platform_admin','senior_archivist','archivist','moderator')));

drop policy if exists "audit logs read" on public.app_audit_logs;
create policy "audit logs read" on public.app_audit_logs
  for select to authenticated using (
    exists (select 1 from public.app_profiles p
            where p.user_id = auth.uid()
              and p.role in ('super_admin','platform_admin','senior_archivist','archivist','moderator','rights_manager'))
  );

drop policy if exists "audit logs insert" on public.app_audit_logs;
create policy "audit logs insert" on public.app_audit_logs
  for insert to authenticated with check (
    exists (select 1 from public.app_profiles p
            where p.user_id = auth.uid()
              and p.role in ('super_admin','platform_admin','senior_archivist','archivist','moderator','rights_manager'))
  );

drop policy if exists "problem reports staff read" on public.app_problem_reports;
create policy "problem reports staff read" on public.app_problem_reports
  for select to authenticated using (
    exists (select 1 from public.app_profiles p
            where p.user_id = auth.uid()
              and p.role in ('super_admin','platform_admin','senior_archivist','archivist','moderator','rights_manager','support_agent'))
  );

drop policy if exists "problem reports public insert" on public.app_problem_reports;
create policy "problem reports public insert" on public.app_problem_reports
  for insert to anon, authenticated with check (true);

drop policy if exists "copyright cases read" on public.app_copyright_cases;
create policy "copyright cases read" on public.app_copyright_cases
  for select to authenticated using (
    exists (select 1 from public.app_profiles p
            where p.user_id = auth.uid()
              and p.role in ('super_admin','platform_admin','senior_archivist','archivist','moderator','rights_manager'))
  );

drop policy if exists "copyright cases report" on public.app_copyright_cases;
create policy "copyright cases report" on public.app_copyright_cases
  for insert to anon, authenticated with check (status = 'open' and assigned_to is null);

drop policy if exists "copyright cases update" on public.app_copyright_cases;
create policy "copyright cases update" on public.app_copyright_cases
  for update to authenticated
  using (exists (select 1 from public.app_profiles p
                 where p.user_id = auth.uid()
                   and p.role in ('super_admin','platform_admin','senior_archivist','archivist','rights_manager')))
  with check (exists (select 1 from public.app_profiles p
                      where p.user_id = auth.uid()
                        and p.role in ('super_admin','platform_admin','senior_archivist','archivist','rights_manager')));

-- Verify (6 rows, all true) ----------------------------------------------------
select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('app_archive_items','app_profiles','app_submissions','app_audit_logs','app_problem_reports','app_copyright_cases')
order by tablename;
