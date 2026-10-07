-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §3 RLS enablement (migration 0020, in full) · §4 Policies
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- Music
alter table songs enable row level security;

alter table recordings enable row level security;

alter table albums enable row level security;

alter table album_tracks enable row level security;

alter table artists enable row level security;

alter table bands enable row level security;

alter table people enable row level security;

alter table band_members enable row level security;

alter table artist_bands enable row level security;

alter table musician_instruments enable row level security;

alter table song_composers enable row level security;

alter table song_musicians enable row level security;

alter table recording_musicians enable row level security;

alter table recording_credits enable row level security;

alter table entity_aliases enable row level security;

alter table entity_translations enable row level security;

alter table song_genres enable row level security;

alter table song_albums enable row level security;

-- Vocabulary
alter table countries enable row level security;

alter table regions enable row level security;

alter table languages enable row level security;

alter table genres enable row level security;

alter table instruments enable row level security;

alter table labels enable row level security;

alter table studios enable row level security;

alter table recording_venues enable row level security;

-- Archive
alter table song_histories enable row level security;

alter table entity_histories enable row level security;

alter table historical_events enable row level security;

alter table timelines enable row level security;

alter table timeline_items enable row level security;

alter table sources enable row level security;

alter table citations enable row level security;

alter table interviews enable row level security;

alter table documents enable row level security;

alter table photographs enable row level security;

alter table ai_extractions enable row level security;

alter table field_assertions enable row level security;

-- Identity and contribution
alter table profiles enable row level security;

alter table roles enable row level security;

alter table permissions enable row level security;

alter table role_permissions enable row level security;

alter table user_roles enable row level security;

alter table user_permissions enable row level security;

alter table account_status_history enable row level security;

alter table submissions enable row level security;

alter table submission_items enable row level security;

alter table edits enable row level security;

alter table revisions enable row level security;

alter table revision_changes enable row level security;

alter table review_decisions enable row level security;

alter table reports enable row level security;

alter table moderation_actions enable row level security;

-- Rights
alter table rights_holders enable row level security;

alter table rights_holder_contacts enable row level security;

alter table rights_declarations enable row level security;

alter table recording_rights enable row level security;

alter table licenses enable row level security;

alter table rights_events enable row level security;

alter table copyright_claims enable row level security;

alter table takedown_requests enable row level security;

alter table rights_disputes enable row level security;

-- Media and jobs
alter table media_files enable row level security;

alter table recording_media enable row level security;

alter table audio_derivatives enable row level security;

alter table upload_sessions enable row level security;

alter table fingerprints enable row level security;

alter table duplicate_candidates enable row level security;

alter table job_queue enable row level security;

-- Community
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

-- Audit and ops
alter table audit_logs enable row level security;

alter table security_events enable row level security;

alter table rate_limit_counters enable row level security;

alter table analytics_events_daily enable row level security;

alter table system_health_snapshots enable row level security;

alter table app_releases enable row level security;

alter table feature_flags enable row level security;

-- Songs
create policy songs_select_public on songs
  for select to anon, authenticated
  using (private.is_public(status, deleted_at));

create policy songs_select_staff on songs
  for select to authenticated
  using (private.is_staff());

create policy songs_insert_staff on songs
  for insert to authenticated
  with check (private.has_permission('content.create'));

create policy songs_update_staff on songs
  for update to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

-- Recordings: published AND public AND rights permit listening.
create policy recordings_select_public on recordings
  for select to anon, authenticated
  using (
    private.is_public(status, deleted_at)
    and visibility = 'public'
    and rights_status not in
        ('rights_unknown','disputed','removed','restricted')
  );

create policy recordings_select_contributor_own on recordings
  for select to authenticated
  using (created_by = auth.uid());

create policy recordings_select_staff on recordings
  for select to authenticated
  using (private.is_staff());

create policy recordings_write_staff on recordings
  for update to authenticated
  using (private.has_permission('content.publish'))
  with check (private.has_permission('content.publish'));

create policy countries_select_all on countries
  for select to anon, authenticated using (true);

create policy countries_write_staff on countries
  for all to authenticated
  using (private.has_permission('config.manage'))
  with check (private.has_permission('config.manage'));

create policy genres_select_all on genres
  for select to anon, authenticated using (true);

create policy genres_write_staff on genres
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy people_select_public on people
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy people_write_staff on people
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy band_members_select_public on band_members
  for select to anon, authenticated
  using (exists (select 1 from bands b
                 where b.id = band_id and private.is_public(b.status, b.deleted_at)));

create policy recording_musicians_select_public on recording_musicians
  for select to anon, authenticated
  using (exists (select 1 from recordings r
                 where r.id = recording_id and private.is_public(r.status, r.deleted_at)));

create policy entity_aliases_select_all on entity_aliases
  for select to anon, authenticated using (true);

create policy entity_aliases_write_staff on entity_aliases
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy song_histories_select_public on song_histories
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy song_histories_select_own_draft on song_histories
  for select to authenticated using (authored_by = auth.uid());

create policy song_histories_write_staff on song_histories
  for all to authenticated
  using (private.has_permission('content.review'))
  with check (private.has_permission('content.review'));

create policy sources_select_public on sources
  for select to anon, authenticated using (private.is_public(status, deleted_at));

create policy sources_select_staff on sources
  for select to authenticated using (private.is_staff());

create policy sources_insert_contributor on sources
  for insert to authenticated
  with check (private.has_permission('edit.suggest') and status = 'submitted');

create policy citations_select_public on citations
  for select to anon, authenticated using (deleted_at is null);

create policy citations_insert_contributor on citations
  for insert to authenticated with check (private.has_permission('edit.suggest'));

-- Evidence for contested claims must be visible to everyone (§63).
create policy field_assertions_select_public on field_assertions
  for select to anon, authenticated using (true);

create policy field_assertions_insert_contributor on field_assertions
  for insert to authenticated
  with check (private.has_permission('edit.suggest') or private.is_archivist());

create policy field_assertions_update_staff on field_assertions
  for update to authenticated
  using (private.is_archivist()) with check (private.is_archivist());

-- AI output is staff-only until a human accepts it (§64).
create policy ai_extractions_select_staff on ai_extractions
  for select to authenticated using (private.is_staff());

create policy submissions_insert_contributor on submissions
  for insert to authenticated
  with check (submitted_by = auth.uid()
              and private.has_permission('submission.create')
              and status in ('draft','submitted'));

create policy submissions_select_own on submissions
  for select to authenticated using (submitted_by = auth.uid());

create policy submissions_select_reviewer on submissions
  for select to authenticated using (private.is_archivist());

create policy submissions_update_reviewer on submissions
  for update to authenticated
  using (private.is_archivist()) with check (private.is_archivist());

-- A contributor may withdraw their own submission but can never approve it.
create policy submissions_update_own_withdraw on submissions
  for update to authenticated
  using (submitted_by = auth.uid()
         and status in ('draft','submitted','changes_requested'))
  with check (submitted_by = auth.uid() and status in ('draft','withdrawn'));

create policy submission_items_select_own on submission_items
  for select to authenticated
  using (exists (select 1 from submissions s
                 where s.id = submission_id and s.submitted_by = auth.uid()));

create policy submission_items_select_reviewer on submission_items
  for select to authenticated using (private.is_archivist());

create policy edits_insert_contributor on edits
  for insert to authenticated
  with check (submitted_by = auth.uid()
              and private.has_permission('edit.suggest')
              and status = 'submitted');

create policy edits_select_own on edits
  for select to authenticated using (submitted_by = auth.uid());

create policy edits_select_reviewer on edits
  for select to authenticated using (private.is_archivist());

create policy edits_update_reviewer on edits
  for update to authenticated
  using (private.is_archivist()) with check (private.is_archivist());

-- Revisions are publicly readable once approved; never client-writable (§28).
create policy revisions_select_public on revisions
  for select to anon, authenticated using (is_approved = true);

create policy revisions_select_staff on revisions
  for select to authenticated using (private.is_staff());

create policy revision_changes_select_public on revision_changes
  for select to anon, authenticated
  using (exists (select 1 from revisions r
                 where r.id = revision_id and r.is_approved));

-- Decisions exist in the database but are written only by Edge Functions.
create policy review_decisions_select_staff on review_decisions
  for select to authenticated using (private.is_staff());

-- Users can only view their own profile.
create policy profiles_select_own on profiles
  for select to authenticated
  using (id = auth.uid());

-- Staff who may manage users can read every profile (the moderation and
-- contributor-management screens need names, avatars and roles).
create policy profiles_select_staff on profiles
  for select to authenticated
  using (private.has_permission('users.manage'));

-- The earlier public-read policy is gone; drop it on databases where it was
-- already applied.
drop policy if exists profiles_select_all on profiles;

create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_update_staff on profiles
  for update to authenticated
  using (private.has_permission('users.manage'))
  with check (private.has_permission('users.manage'));

-- No client insert policy here: profiles are created by an auth trigger.
-- 0025 adds `profiles_insert_own` as the recovery path for accounts whose
-- trigger-created row is missing.

create policy bookmarks_all_own on bookmarks
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy follows_all_own on follows
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy recently_viewed_all_own on recently_viewed
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy playlists_select_public on playlists
  for select to anon, authenticated
  using ((is_public and deleted_at is null) or is_editorial);

create policy playlists_all_own on playlists
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy playlists_editorial_staff on playlists
  for all to authenticated
  using (private.has_permission('content.publish'))
  with check (private.has_permission('content.publish'));

create policy playlist_items_select_public on playlist_items
  for select to anon, authenticated
  using (exists (select 1 from playlists p
                 where p.id = playlist_id
                   and ((p.is_public and p.deleted_at is null) or p.is_editorial)));

create policy playlist_items_all_own on playlist_items
  for all to authenticated
  using (exists (select 1 from playlists p
                 where p.id = playlist_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from playlists p
                     where p.id = playlist_id and p.owner_id = auth.uid()));

create policy notifications_all_own on notifications
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notification_preferences_all_own on notification_preferences
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Play events are written by Edge Functions only; a user may never read another
-- user's listening history.
create policy play_events_select_own on play_events
  for select to authenticated using (user_id = auth.uid());

create policy user_badges_select_all on user_badges
  for select to anon, authenticated using (true);

create policy badges_select_all on badges
  for select to anon, authenticated using (true);

-- Uploaders see their own media; the public sees only media attached to a
-- recording they are permitted to read.
create policy media_files_select_own on media_files
  for select to authenticated using (uploaded_by = auth.uid());

create policy media_files_select_published on media_files
  for select to anon, authenticated
  using (deleted_at is null
         and virus_scan_status = 'clean'
         and exists (select 1 from recording_media rm
                     join recordings r on r.id = rm.recording_id
                     where rm.media_file_id = media_files.id
                       and private.is_public(r.status, r.deleted_at)));

create policy recording_media_select_published on recording_media
  for select to anon, authenticated
  using (exists (select 1 from recordings r
                 where r.id = recording_id
                   and private.is_public(r.status, r.deleted_at)));

create policy audio_derivatives_select_published on audio_derivatives
  for select to anon, authenticated
  using (exists (select 1 from media_files mf
                 join recording_media rm on rm.media_file_id = mf.id
                 join recordings r on r.id = rm.recording_id
                 where mf.id = audio_derivatives.media_file_id
                   and private.is_public(r.status, r.deleted_at)
                   and r.visibility = 'public'
                   and r.rights_status not in
                       ('rights_unknown','disputed','removed','restricted')));

create policy upload_sessions_all_own on upload_sessions
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Rights: the public sees the status summary; contacts and evidence are staff-only.
create policy recording_rights_select_public on recording_rights
  for select to anon, authenticated using (true);

create policy recording_rights_write_rights_team on recording_rights
  for all to authenticated
  using (private.is_rights_manager()) with check (private.is_rights_manager());

create policy rights_holders_select_public on rights_holders
  for select to anon, authenticated using (deleted_at is null);

create policy rights_holders_write_rights_team on rights_holders
  for all to authenticated
  using (private.is_rights_manager()) with check (private.is_rights_manager());

-- Restricted data (§41, §76).
create policy rights_holder_contacts_select_team on rights_holder_contacts
  for select to authenticated using (private.is_rights_manager());

create policy rights_holder_contacts_write_team on rights_holder_contacts
  for all to authenticated
  using (private.is_rights_manager()) with check (private.is_rights_manager());

-- A claimant may file and follow a case, but never decide it.
create policy copyright_claims_insert_any on copyright_claims
  for insert to authenticated with check (claimant_user_id = auth.uid());

create policy copyright_claims_select_own on copyright_claims
  for select to authenticated using (claimant_user_id = auth.uid());

create policy copyright_claims_select_team on copyright_claims
  for select to authenticated using (private.is_rights_manager());

create policy takedown_requests_select_team on takedown_requests
  for select to authenticated using (private.is_rights_manager());

create policy rights_disputes_select_team on rights_disputes
  for select to authenticated using (private.is_rights_manager());

create policy rights_events_select_team on rights_events
  for select to authenticated using (private.is_rights_manager());

-- Audit and moderation.
create policy audit_logs_select_staff on audit_logs
  for select to authenticated using (private.is_staff());

create policy security_events_select_admin on security_events
  for select to authenticated using (private.has_permission('system.admin'));

create policy reports_insert_any on reports
  for insert to anon, authenticated
  with check (reporter_id is null or reporter_id = auth.uid());

create policy reports_select_own on reports
  for select to authenticated using (reporter_id = auth.uid());

create policy reports_select_moderator on reports
  for select to authenticated
  using (private.is_moderator() or private.is_rights_manager());

create policy moderation_actions_select_moderator on moderation_actions
  for select to authenticated using (private.is_moderator());
