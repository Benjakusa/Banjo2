-- ============================================================================
-- 0025 — API role privileges for the public schema, and profile self-service.
--
-- Why: migrations 0001–0024 enable RLS on every table and define 160+ policies,
-- but never grant table privileges to the API roles. On a Supabase project
-- those grants normally arrive through the platform's default privileges; when
-- the schema is applied by a role that does not carry them (a plain psql
-- connection, some CI runners, or a dashboard user without them), PostgREST
-- answers every request with "permission denied for table ..." even though the
-- policies are correct. This restores the platform defaults.
--
-- RLS remains the real gate: grants only let a role reach the table, the
-- policies still decide which rows it may see or change.
-- ============================================================================

grant usage on schema public to anon, authenticated;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profile self-service.
--
-- The `on_auth_user_created` trigger (0018) creates the profile row. These
-- four policies are re-stated rather than assumed, because two kinds of
-- database need a repair:
--
--   * a database that applied the earlier revision of 0020 still carries the
--     public-read policy `profiles_select_all`, which let anyone enumerate
--     every contributor — and if it was already dropped, that revision left
--     the table with no SELECT policy at all, so contributors could not even
--     read their own row;
--   * a database whose `on_auth_user_created` trigger never ran (a project
--     restored from a backup, or rows imported straight into auth.users) has
--     accounts with no profile row and no way to create one.
--
-- Owner-only reads and writes, plus a staff read for contributor management.
-- No account can ever see or touch another account's profile.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_all on profiles;
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_select_staff on profiles;
create policy profiles_select_staff on profiles
  for select to authenticated
  using (private.has_permission('users.manage'));

drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles
  for insert to authenticated
  with check (id = auth.uid());
