-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §3 Private helper functions (used by every RLS policy) · §4 Shared trigger functions
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- Helper bodies reference tables created in later migrations (see §10 order), so body
-- validation is deferred to the end of this file.
set check_function_bodies = off;

-- Current application user id (auth.uid() wrapper, keeps policies short).
create or replace function private.uid() returns uuid
language sql stable as $$ select auth.uid() $$;

-- Does the caller hold any staff role?
create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and ur.revoked_at is null
      and r.code not in ('contributor','member')
  )
$$;

-- Does the caller hold this permission? (codes such as 'content.publish')
create or replace function private.has_permission(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions perm on perm.id = rp.permission_id
    where ur.user_id = auth.uid() and ur.revoked_at is null and perm.code = p
  ) or exists (
    select 1 from user_permissions up
    join permissions perm on perm.id = up.permission_id
    where up.user_id = auth.uid() and up.revoked_at is null and perm.code = p
      and (up.expires_at is null or up.expires_at > now())
  )
$$;

create or replace function private.is_archivist() returns boolean
language sql stable as $$ select private.has_permission('content.review') $$;

create or replace function private.is_rights_manager() returns boolean
language sql stable as $$ select private.has_permission('rights.manage') $$;

create or replace function private.is_moderator() returns boolean
language sql stable as $$ select private.has_permission('community.moderate') $$;

-- Published, non-deleted rows are the only anonymous-visible content.
create or replace function private.is_public(p_status publication_status, p_deleted timestamptz)
returns boolean language sql immutable as $$
  select p_status = 'published' and p_deleted is null
$$;

create or replace function private.owns(p_user uuid) returns boolean
language sql stable as $$ select auth.uid() is not null and auth.uid() = p_user $$;

create or replace function private.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if new.version is not null then new.version := old.version + 1; end if;
  return new;
end $$;

create or replace function private.normalize_name(t text) returns text
language sql immutable as $$
  select nullif(
    trim(regexp_replace(lower(unaccent(coalesce(t, ''))), '[^a-z0-9 ]+', '', 'g')), '')
$$;

-- Archive rows carrying citations may not be hard-deleted (§28, §75).
create or replace function private.assert_no_citations()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from citations c
             where c.target_type = tg_argv[0]::entity_type and c.target_id = old.id) then
    raise exception 'ARCHIVE_ROW_HAS_CITATIONS: soft-delete instead';
  end if;
  return old;
end $$;

set check_function_bodies = on;
