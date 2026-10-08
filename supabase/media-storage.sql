-- Run in the Supabase SQL Editor after SUPABASE_COPY_PASTE.sql.
-- Legacy pending-review audio stays private. New archive uploads are written
-- to a separate public bucket after a contributor makes a rights declaration.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('banjo-pending-audio', 'banjo-pending-audio', false, 104857600,
   array['audio/mpeg','audio/wav','audio/x-wav','audio/flac','audio/x-flac','audio/mp4','audio/aac','audio/ogg','audio/webm','video/mp4','video/webm','video/ogg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- New uploads are published directly after a contributor makes a rights
-- declaration. Keep these separate from older pending-review audio so changing
-- this bucket's visibility does not expose existing review files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('banjo-archive-audio', 'banjo-archive-audio', true, 104857600,
   array['audio/mpeg','audio/wav','audio/x-wav','audio/flac','audio/x-flac','audio/mp4','audio/aac','audio/ogg','audio/webm','video/mp4','video/webm','video/ogg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "contributors upload own pending audio" on storage.objects;
create policy "contributors upload own pending audio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'banjo-pending-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owners and staff read pending audio" on storage.objects;
create policy "owners and staff read pending audio" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'banjo-pending-audio'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.app_profiles p
        where p.user_id = auth.uid()
          and p.role in ('super_admin','platform_admin','senior_archivist','archivist','moderator','rights_manager')
      )
    )
  );

drop policy if exists "owners and staff delete pending audio" on storage.objects;
create policy "owners and staff delete pending audio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'banjo-pending-audio'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.app_profiles p
        where p.user_id = auth.uid()
          and p.role in ('super_admin','platform_admin','senior_archivist','archivist','moderator','rights_manager')
      )
    )
  );

drop policy if exists "public read published archive audio" on storage.objects;
create policy "public read published archive audio" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'banjo-archive-audio');

drop policy if exists "contributors upload own archive audio" on storage.objects;
create policy "contributors upload own archive audio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'banjo-archive-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owners and staff delete archive audio" on storage.objects;
create policy "owners and staff delete archive audio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'banjo-archive-audio'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.app_profiles p
        where p.user_id = auth.uid()
          and p.role in ('super_admin','platform_admin','senior_archivist','archivist','moderator','rights_manager')
      )
    )
  );
