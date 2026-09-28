-- ============================================================================
-- BANJO frontend tables — copy & paste this whole file into
-- Supabase Dashboard > SQL Editor > New Query > Run.
-- Safe to re-run (idempotent, no secrets inside).
-- Creates the 3 tables the React app actually calls via supabase-js:
--   app_submissions, app_audit_logs, app_copyright_cases
-- ============================================================================

-- 1) SUBMISSIONS (moderation queue: edits + new recordings) ------------------
create table if not exists public.app_submissions (
  id text primary key,
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
  sources_provided text not null default '',
  review_notes text not null default '',
  created_at timestamptz not null default now()
);

-- 2) AUDIT LOGS (immutable trail for approvals + copyright decisions) --------
create table if not exists public.app_audit_logs (
  id text primary key,
  who text not null default '',
  action text not null default '',
  target text not null default '',
  timestamp text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- 3) COPYRIGHT CASES (rights reports / takedown requests) --------------------
create table if not exists public.app_copyright_cases (
  id text primary key,
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
create index if not exists app_audit_logs_created_idx on public.app_audit_logs (created_at desc);
create index if not exists app_copyright_cases_status_idx on public.app_copyright_cases (status);

-- Enable RLS + open policies (app uses the anon key directly, no login) ------
-- These tables hold community contributions only — no passwords/keys inside.
alter table public.app_submissions enable row level security;
alter table public.app_audit_logs enable row level security;
alter table public.app_copyright_cases enable row level security;

drop policy if exists "public read" on public.app_submissions;
create policy "public read" on public.app_submissions
  for select to anon, authenticated using (true);

drop policy if exists "public insert" on public.app_submissions;
create policy "public insert" on public.app_submissions
  for insert to anon, authenticated with check (true);

drop policy if exists "public update" on public.app_submissions;
create policy "public update" on public.app_submissions
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "public read" on public.app_audit_logs;
create policy "public read" on public.app_audit_logs
  for select to anon, authenticated using (true);

drop policy if exists "public insert" on public.app_audit_logs;
create policy "public insert" on public.app_audit_logs
  for insert to anon, authenticated with check (true);

drop policy if exists "public read" on public.app_copyright_cases;
create policy "public read" on public.app_copyright_cases
  for select to anon, authenticated using (true);

drop policy if exists "public insert" on public.app_copyright_cases;
create policy "public insert" on public.app_copyright_cases
  for insert to anon, authenticated with check (true);

drop policy if exists "public update" on public.app_copyright_cases;
create policy "public update" on public.app_copyright_cases
  for update to anon, authenticated using (true) with check (true);

-- Verify (should return 3 rows, all true) -------------------------------------
select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('app_submissions','app_audit_logs','app_copyright_cases')
order by tablename;
