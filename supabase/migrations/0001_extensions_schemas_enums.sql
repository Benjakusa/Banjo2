-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §1 Extensions and schemas · §2 Enumerated types
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

create extension if not exists pgcrypto;

-- gen_random_uuid()
create extension if not exists pg_trgm;

-- fuzzy name search
create extension if not exists unaccent;

-- "Ochieng'" vs "Ochieng"
create schema if not exists private;

-- server-only helpers, not exposed by PostgREST

revoke all on schema private from anon, authenticated;

create type publication_status as enum (
  'draft','submitted','under_review','changes_requested','approved',
  'published','rejected','withdrawn','removed');

create type verification_level as enum (
  'unverified','community_sourced','reviewed','rights_holder_verified','source_verified');

create type rights_status as enum (
  'rights_holder_uploaded','licensed','permission_granted','public_domain',
  'user_claimed_rights','rights_unknown','disputed','restricted','removed');

create type rights_scope as enum (
  'streaming','download','research','commercial','archive_only');

create type account_status as enum (
  'active','restricted','suspended','banned','deleted');

create type source_type as enum (
  'record_sleeve','studio_documentation','artist_interview','band_member_testimony',
  'family_testimony','newspaper','magazine','book','academic_publication',
  'label_documentation','government_archive','community_submission');

create type media_kind as enum (
  'audio_master','audio_stream','image','document','transcript','video_reference','waveform');

create type alias_type as enum (
  'personal','stage_name','former_name','spelling_variant','translated',
  'transliterated','alternative_ordering');

create type entity_type as enum (
  'song','recording','album','artist','band','person','country','region',
  'genre','language','instrument','label','studio');

create type credit_role as enum (
  'lead_vocal','backing_vocal','composer','lyricist','arranger','producer',
  'engineer','mixer','lead_guitar','rhythm_guitar','bass','drums','keyboard',
  'percussion','trumpet','saxophone','trombone','flute','violin','accordion',
  'nyatiti','orutu','kora','kora_djembe','djembe','ongoma','talking_drum','chorus'
);

create type contribution_kind as enum (
  'new_song','new_recording','new_artist','new_band','new_album','new_person',
  'edit_song','edit_recording','edit_artist','edit_band','edit_album',
  'history_article','photograph','document','interview','source','rights_update');

create type review_action as enum (
  'approve','reject','request_evidence','request_changes','escalate','publish',
  'withdraw','restrict','remove','restore');

create type report_reason as enum (
  'incorrect_information','copyright_concern','wrong_person','wrong_song',
  'offensive_content','privacy_concern','duplicate','fraudulent_source','other');

create type job_kind as enum (
  'virus_scan','audio_validate','transcode','waveform','fingerprint','thumbnail',
  'ocr','transcribe','translate','duplicate_check','reindex','notification_fanout');

create type job_status as enum ('queued','running','succeeded','failed','cancelled');
