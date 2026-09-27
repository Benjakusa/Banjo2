-- ============================================================================
-- Development seed — the Phase 1 reference dataset.
--
-- doc 10 §10.4: "build the Phase 1 vertical slice end to end: search → song page → playback →
-- revision history, with one seeded band from Kenyan benga as the reference dataset."
--
-- The dataset is deliberately synthetic: the band, people and recordings below are fictional, so the
-- archive never asserts an unsourced historical claim about real musicians (§32, §63). It exists to
-- exercise every rule in the blueprint, and each item is labelled with the rule it exercises:
--
--   * a published, rights-cleared, playable recording          (doc 09 §4)
--   * a published recording with rights_unknown → never streamable, hidden from anon (ADR-12)
--   * a draft recording → invisible to anonymous readers       (doc 05 §4.1, RLS test)
--   * a disputed release year ("1975 or 1976") with two sources (doc 02 §1.2, §63)
--   * a revision history back to version 1                      (ADR-04)
--
-- Idempotent: safe to re-run. Apply with `npm run db:seed`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Accounts (fictional) — one per role the RLS suite exercises (doc 05 §7)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
select v.id::uuid, v.email, jsonb_build_object('display_name', v.display_name, 'locale', 'en')
from (values
  ('11111111-1111-1111-1111-111111111111', 'archivist@banjo.test',     'Achieng Archivist'),
  ('22222222-2222-2222-2222-222222222222', 'rights@banjo.test',        'Rights Manager'),
  ('33333333-3333-3333-3333-333333333333', 'analyst@banjo.test',       'Analytics Analyst'),
  ('44444444-4444-4444-4444-444444444444', 'contributor-a@banjo.test', 'Contributor A'),
  ('55555555-5555-5555-5555-555555555555', 'member@banjo.test',        'Listener Member'),
  ('66666666-6666-6666-6666-666666666666', 'contributor-b@banjo.test', 'Contributor B'),
  ('77777777-7777-7777-7777-777777777777', 'superadmin@banjo.test',    'Platform Owner')
) as v(id, email, display_name)
where not exists (select 1 from auth.users u where u.email = v.email);

insert into user_roles (user_id, role_id, reason)
select v.user_id::uuid, r.id, 'development seed'
from (values
  ('11111111-1111-1111-1111-111111111111', 'archivist'),
  ('22222222-2222-2222-2222-222222222222', 'rights_manager'),
  ('33333333-3333-3333-3333-333333333333', 'analyst'),
  ('44444444-4444-4444-4444-444444444444', 'contributor'),
  ('55555555-5555-5555-5555-555555555555', 'member'),
  ('66666666-6666-6666-6666-666666666666', 'contributor'),
  ('77777777-7777-7777-7777-777777777777', 'super_admin')
) as v(user_id, role_code)
join roles r on r.code = v.role_code
where not exists (
  select 1 from user_roles ur where ur.user_id = v.user_id::uuid and ur.role_id = r.id
);

-- ---------------------------------------------------------------------------
-- 2. The reference band: a fictional Kenyan benga group (doc 10 §10.4)
-- ---------------------------------------------------------------------------
insert into bands (id, name, country_id, region_id, city, formed_year, band_type, primary_language_id, history, status, verification)
select
  'aaaaaaa1-0000-4000-8000-000000000001'::uuid,
  'Victoria Stars Band',
  c.id,
  rg.id,
  'Nairobi',
  1972,
  'guitar band',
  l.id,
  'Fictional benga band used as the Phase 1 reference dataset.',
  'published',
  'reviewed'
from countries c
left join regions rg on rg.country_id = c.id and rg.name = 'Nairobi'
left join languages l on l.name = 'Kiswahili'
where c.iso2 = 'KE'
  and not exists (select 1 from bands b where b.id = 'aaaaaaa1-0000-4000-8000-000000000001');

insert into people (id, full_name, sort_name, birth_year, nationality_country_id, bio, status, verification)
select v.id::uuid, v.full_name, v.sort_name, v.birth_year, c.id, v.bio, 'published', 'reviewed'
from (values
  ('bbbbbbb1-0000-4000-8000-000000000001', 'Ochieng Odhiambo', 'Odhiambo, Ochieng', 1944, 'Band leader, lead guitar (fictional).'),
  ('bbbbbbb1-0000-4000-8000-000000000002', 'Akinyi Wanjiru',   'Wanjiru, Akinyi',   1951, 'Lead vocalist (fictional).'),
  ('bbbbbbb1-0000-4000-8000-000000000003', 'Otieno Kamau',     'Kamau, Otieno',     1948, 'Bass and nyatiti (fictional).'),
  ('bbbbbbb1-0000-4000-8000-000000000004', 'Wanjala Nekesa',   'Nekesa, Wanjala',   1956, 'Drums and percussion (fictional).')
) as v(id, full_name, sort_name, birth_year, bio)
cross join (select id from countries where iso2 = 'KE') c
where not exists (select 1 from people p where p.full_name = v.full_name);

insert into band_members (band_id, person_id, role_label, instrument_id, start_year, end_year, is_founder, is_current)
select
  'aaaaaaa1-0000-4000-8000-000000000001'::uuid,
  p.id,
  v.role_label,
  i.id,
  v.start_year,
  v.end_year,
  v.is_founder,
  v.end_year is null
from (values
  ('Ochieng Odhiambo', 'Band leader, lead guitar', 'Guitar',  1972, null::int, true),
  ('Akinyi Wanjiru',   'Lead vocalist',            'Vocals',  1974, null,      false),
  ('Otieno Kamau',     'Bass, nyatiti',            'Nyatiti', 1972, 1980,      true),
  ('Wanjala Nekesa',   'Drums',                    'Drums',   1976, null,      false)
) as v(person_name, role_label, instrument_name, start_year, end_year, is_founder)
join people p on p.full_name = v.person_name
left join instruments i on i.name = v.instrument_name
where not exists (
  select 1 from band_members bm
  where bm.band_id = 'aaaaaaa1-0000-4000-8000-000000000001' and bm.person_id = p.id
);

-- Spelling variant seen on 1970s sleeve notes: the reason `entity_aliases` exists (doc 01 §2.4).
insert into entity_aliases (entity_type, entity_id, alias, alias_type)
select 'band', 'aaaaaaa1-0000-4000-8000-000000000001'::uuid, 'Victoria Star Band', 'spelling_variant'
where not exists (
  select 1 from entity_aliases ea
  where ea.entity_type = 'band' and ea.entity_id = 'aaaaaaa1-0000-4000-8000-000000000001'
    and ea.alias = 'Victoria Star Band'
);

-- ---------------------------------------------------------------------------
-- 3. Songs — the composition layer (ADR-01: song ≠ recording)
-- ---------------------------------------------------------------------------
insert into songs (id, title, title_local, canonical_language_id, primary_genre_id, composition_year, composer_credit_text, summary, status, verification, is_verified_disputed)
select
  v.id::uuid, v.title, v.title_local, l.id, g.id, v.composition_year, v.composer_text, v.summary,
  'published', 'reviewed', v.is_disputed
from (values
  ('ccccccc1-0000-4000-8000-000000000001', 'Example',      'Mfano',        1974, 'Ochieng Odhiambo', 'The reference composition of the Phase 1 slice.', false),
  ('ccccccc1-0000-4000-8000-000000000002', 'Kisumu Night', 'Usiku wa Kisumu', 1975, 'Ochieng Odhiambo', 'Composition whose release year is disputed between two sources.', true),
  ('ccccccc1-0000-4000-8000-000000000003', 'Lake Lullaby', null,            1976, 'Traditional',      'Instrumental originally performed on nyatiti.', false)
) as v(id, title, title_local, composition_year, composer_text, summary, is_disputed)
left join languages l on l.name = 'Kiswahili'
left join genres g on g.name = 'Benga'
where not exists (select 1 from songs s where s.id = v.id::uuid);

insert into song_composers (song_id, person_id, role, is_primary)
select s.id, p.id, 'composer', true
from songs s
join people p on p.full_name = 'Ochieng Odhiambo'
where s.id in ('ccccccc1-0000-4000-8000-000000000001', 'ccccccc1-0000-4000-8000-000000000002')
  and not exists (select 1 from song_composers sc where sc.song_id = s.id and sc.person_id = p.id);

-- ---------------------------------------------------------------------------
-- 4. Media (binaries live in R2; only metadata and keys are in Postgres — ADR-02)
--    storage_key format is fixed by doc 09 §1: audio/{iso2}/{year}/{recording_id}/…
-- ---------------------------------------------------------------------------
insert into media_files (id, media_kind, storage_bucket, storage_key, original_filename, mime_type, file_size_bytes, sha256, duration_seconds, bitrate_kbps, sample_rate_hz, channels, codec, is_original_master, is_primary, checksum_verified, virus_scan_status, validation_status, uploaded_by)
select v.id::uuid, v.kind::media_kind, 'banjo-media-dev', v.key, v.filename, v.mime, v.size, v.sha, v.duration, v.bitrate, 44100, 2, v.codec, v.is_master, v.is_primary, true, 'clean', 'valid', '44444444-4444-4444-4444-444444444444'::uuid
from (values
  ('ddddddd1-0000-4000-8000-000000000001', 'audio_master', 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000010/master.wav', 'example-master.wav', 'audio/wav', 52428800, 'sha256-master-example', 214, 1411, 'pcm_s16le', true, false),
  ('ddddddd1-0000-4000-8000-000000000002', 'audio_stream', 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000010/stream/high.aac', 'example-high.aac', 'audio/mp4', 4194304, 'sha256-high-example', 214, 320, 'aac', false, true),
  ('ddddddd1-0000-4000-8000-000000000003', 'audio_stream', 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000010/stream/standard.aac', 'example-standard.aac', 'audio/mp4', 2097152, 'sha256-standard-example', 214, 160, 'aac', false, false),
  ('ddddddd1-0000-4000-8000-000000000004', 'audio_stream', 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000010/stream/low.aac', 'example-low.aac', 'audio/mp4', 838860, 'sha256-low-example', 214, 64, 'aac', false, false),
  ('ddddddd1-0000-4000-8000-000000000005', 'audio_master', 'audio/ke/1976/ddddddd1-0000-4000-8000-000000000020/master.wav', 'kisumu-night-master.wav', 'audio/wav', 41943040, 'sha256-master-kisumu-night', 198, 1411, 'pcm_s16le', true, false),
  ('ddddddd1-0000-4000-8000-000000000006', 'audio_master', 'audio/ke/1978/ddddddd1-0000-4000-8000-000000000030/master.flac', 'lake-lullaby-master.flac', 'audio/flac', 31457280, 'sha256-master-lake-lullaby', 176, 900, 'flac', true, false),
  ('ddddddd1-0000-4000-8000-000000000007', 'image', 'image/band/aaaaaaa1-0000-4000-8000-000000000001/ddddddd1-0000-4000-8000-000000000007/medium.webp', 'sleeve.webp', 'image/webp', 262144, 'sha256-band-cover', null, null, null, false, true)
) as v(id, kind, key, filename, mime, size, sha, duration, bitrate, codec, is_master, is_primary)
where not exists (select 1 from media_files mf where mf.id = v.id::uuid);

-- ---------------------------------------------------------------------------
-- 5. Recordings
--    R1 published + rights cleared  (playable; the happy path of the slice)
--    R2 published + rights_unknown + visibility 'private' — documented in the archive,
--        never streamable and never publicly visible (ADR-12, doc 02 §5)
--    R3 published + disputed year   (doc 02 §1.2: "1975 or 1976")
--    R4 draft                       (invisible to anonymous readers)
-- ---------------------------------------------------------------------------
insert into recordings (id, song_id, title, band_id, country_id, language_id, primary_genre_id, recording_year, release_year, matrix_number, recording_type, is_live, duration_seconds, rights_status, visibility, verification, status, summary)
select
  v.id::uuid, v.song_id::uuid, v.title, 'aaaaaaa1-0000-4000-8000-000000000001'::uuid, c.id, l.id, g.id,
  v.recording_year, v.release_year, v.matrix, 'studio', false, v.duration,
  v.rights::rights_status, v.visibility, v.verification::verification_level, v.status::publication_status, v.summary
from (values
  ('ddddddd1-0000-4000-8000-000000000010', 'ccccccc1-0000-4000-8000-000000000001', 'Example (studio, 1975)', 1975, 1975, 'VSB-001', 214, 'rights_holder_uploaded', 'public', 'reviewed', 'published', 'Rights holder upload, cleared for streaming.'),
  ('ddddddd1-0000-4000-8000-000000000020', 'ccccccc1-0000-4000-8000-000000000002', 'Kisumu Night (1976 press)', 1976, 1976, 'VSB-004', 198, 'rights_unknown', 'private', 'community_sourced', 'published', 'Anonymous press copy: documented, never streamable.'),
  ('ddddddd1-0000-4000-8000-000000000030', 'ccccccc1-0000-4000-8000-000000000003', 'Lake Lullaby', 1978, 1978, 'VSB-009', 176, 'public_domain', 'public', 'source_verified', 'published', 'Nyatiti instrumental, statutory public domain basis recorded.'),
  ('ddddddd1-0000-4000-8000-000000000040', 'ccccccc1-0000-4000-8000-000000000001', 'Example (alternate take)', 1975, null, 'VSB-001B', 219, 'user_claimed_rights', 'private', 'unverified', 'draft', 'Draft: unreviewed alternate take, invisible to the public.')
) as v(id, song_id, title, recording_year, release_year, matrix, duration, rights, visibility, verification, status, summary)
cross join (select id from countries where iso2 = 'KE') c
left join languages l on l.name = 'Kiswahili'
left join genres g on g.name = 'Benga'
where not exists (select 1 from recordings r where r.id = v.id::uuid);

insert into recording_media (recording_id, media_file_id, role, is_primary)
select v.recording_id::uuid, v.media_id::uuid, v.role, v.is_primary
from (values
  ('ddddddd1-0000-4000-8000-000000000010', 'ddddddd1-0000-4000-8000-000000000001', 'master', true),
  ('ddddddd1-0000-4000-8000-000000000010', 'ddddddd1-0000-4000-8000-000000000002', 'stream', true),
  ('ddddddd1-0000-4000-8000-000000000010', 'ddddddd1-0000-4000-8000-000000000003', 'stream', false),
  ('ddddddd1-0000-4000-8000-000000000010', 'ddddddd1-0000-4000-8000-000000000004', 'stream', false),
  ('ddddddd1-0000-4000-8000-000000000030', 'ddddddd1-0000-4000-8000-000000000006', 'master', true)
) as v(recording_id, media_id, role, is_primary)
where not exists (
  select 1 from recording_media rm
  where rm.recording_id = v.recording_id::uuid and rm.media_file_id = v.media_id::uuid
);
-- R2's master (`…0005`) is deliberately NOT linked: enforce_rights_before_publish treats linked
-- audio on a published recording as streamable audio (doc 02 §5), so the rights_unknown entry
-- stays metadata-only. The transfer itself sits in media_files until the rights are cleared.

insert into audio_derivatives (media_file_id, quality_tier, codec, bitrate_kbps, storage_key, file_size_bytes, duration_seconds, status)
select v.media_id::uuid, v.tier, 'aac', v.bitrate, v.key, v.size, 214, 'ready'
from (values
  ('ddddddd1-0000-4000-8000-000000000001', 'high',     320, 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000010/stream/high.aac', 4194304),
  ('ddddddd1-0000-4000-8000-000000000001', 'standard', 160, 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000010/stream/standard.aac', 2097152),
  ('ddddddd1-0000-4000-8000-000000000001', 'low',       64, 'audio/ke/1975/ddddddd1-0000-4000-8000-000000000010/stream/low.aac', 838860)
) as v(media_id, tier, bitrate, key, size)
where not exists (
  select 1 from audio_derivatives ad where ad.media_file_id = v.media_id::uuid and ad.quality_tier = v.tier
);

-- ---------------------------------------------------------------------------
-- 6. Rights records (doc 09 §4). R1 and R3 are streamable. R2 carries an explicit rights row that
--    grants archive-only access: the row exists so no read path can treat "missing" as "cleared",
--    and the check constraints keep allows_streaming false (ADR-12).
-- ---------------------------------------------------------------------------
insert into rights_holders (id, holder_type, name, country_id, notes, status)
select 'eeeeeee1-0000-4000-8000-000000000001'::uuid, 'band', 'Victoria Stars Band Estate (fictional)', c.id, 'Development fixture; verification lives on rights_holder_contacts (ADR-04).', 'verified'
from (select id from countries where iso2 = 'KE') c
where not exists (select 1 from rights_holders rh where rh.id = 'eeeeeee1-0000-4000-8000-000000000001');

insert into recording_rights (recording_id, rights_status, rights_holder_id, rights_basis, territory, permitted_scope, allows_streaming, allows_download, allows_research, allows_commercial, allows_derivatives, last_reviewed_at, notes)
select
  v.recording_id::uuid, v.rights::rights_status, v.holder::uuid, v.basis, 'KE', array[v.scope::rights_scope],
  v.streaming, v.download, true, v.commercial, false, now(), v.notes
from (values
  ('ddddddd1-0000-4000-8000-000000000010', 'rights_holder_uploaded', 'eeeeeee1-0000-4000-8000-000000000001', 'Band leader submitted the master and signed the contributor agreement.', 'streaming', true, false, false, 'Cleared for streaming on Banjo.'),
  ('ddddddd1-0000-4000-8000-000000000020', 'rights_unknown',        null, 'Anonymous press copy: origin and rights holder unknown; documented for research only.', 'archive_only', false, false, false, 'Never streamable (ADR-12); scope limited to the archive.'),
  ('ddddddd1-0000-4000-8000-000000000030', 'public_domain',        null, 'Copyright term expired; statutory basis recorded with year.', 'streaming', true, false, false, 'Public domain basis documented by the archivist.')
) as v(recording_id, rights, holder, basis, scope, streaming, download, commercial, notes)
where not exists (select 1 from recording_rights rr where rr.recording_id = v.recording_id::uuid);

-- enforce_rights_before_publish only runs when `status` is written, and every recording was
-- inserted before its media and rights rows existed. Touch the status column once so the guard
-- validates the final state of each seeded recording (published + linked audio ⇒ streamable
-- rights; otherwise metadata-only). With housekeeping excluded from revision tracking the touch
-- must not create revisions either — scripts/db-test.sh asserts both.
update recordings set status = status;

-- ---------------------------------------------------------------------------
-- 7. Sources, citations and the disputed release year (doc 02 §1.2, doc 09 §7)
--    "Two or more competing sourced assertions ⇒ the field is marked disputed in the UI.
--     The UI shows both values with their sources and no implicit winner."
-- ---------------------------------------------------------------------------
insert into sources (id, source_type, title, author, publisher, published_year, reliability_note, summary, status, verification)
select v.id::uuid, v.kind::source_type, v.title, v.author, v.publisher, v.year, v.reliability, v.summary, 'published', 'reviewed'
from (values
  ('fffffff1-0000-4000-8000-000000000001', 'record_sleeve', 'VSB-004 sleeve notes', 'Victoria Stars Band', 'Sungura Records (fictional)', 1976, 'primary', 'Sleeve states a 1976 pressing date.'),
  ('fffffff1-0000-4000-8000-000000000002', 'band_member_testimony', 'Interview with Otieno Kamau, 1998', 'Banjo Archive (fictional)', 'Church of Christ in Africa, Nairobi', 1998, 'secondary', 'Band member recalls recording the song in 1975, 22 years after the fact.')
) as v(id, kind, title, author, publisher, year, reliability, summary)
where not exists (select 1 from sources s where s.id = v.id::uuid);

insert into citations (source_id, target_type, target_id, field_key, locator, quote, supports, confidence)
select 'fffffff1-0000-4000-8000-000000000001'::uuid, 'song', 'ccccccc1-0000-4000-8000-000000000002'::uuid, 'release_year', 'sleeve, rear panel',
       'Pressed 1976 — Sungura Records catalogue VSB-004', true, 'high'
where not exists (
  select 1 from citations ci where ci.source_id = 'fffffff1-0000-4000-8000-000000000001' and ci.target_id = 'ccccccc1-0000-4000-8000-000000000002'
);
insert into citations (source_id, target_type, target_id, field_key, locator, quote, supports, confidence)
select 'fffffff1-0000-4000-8000-000000000002'::uuid, 'song', 'ccccccc1-0000-4000-8000-000000000002'::uuid, 'release_year', '00:14:20',
       'We cut it the year before the pressing, in 1975.', true, 'medium'
where not exists (
  select 1 from citations ci where ci.source_id = 'fffffff1-0000-4000-8000-000000000002' and ci.target_id = 'ccccccc1-0000-4000-8000-000000000002'
);

insert into field_assertions (entity_type, entity_id, field_key, value_jsonb, value_display, source_id, citation_id, status, is_disputed, asserted_by, resolved_by, resolved_at, resolution_note)
select 'song', 'ccccccc1-0000-4000-8000-000000000002'::uuid, 'release_year',
       to_jsonb(v.year), v.year::text, v.source_id::uuid,
       (select ci.id from citations ci where ci.source_id = v.source_id::uuid and ci.target_id = 'ccccccc1-0000-4000-8000-000000000002' limit 1),
       v.status, true, '11111111-1111-1111-1111-111111111111'::uuid, v.resolved_by::uuid, v.resolved_at, v.note
from (values
  (1976, 'fffffff1-0000-4000-8000-000000000001', 'accepted',  '11111111-1111-1111-1111-111111111111', now()::timestamp, 'Displayed value: the sleeve is the artefact of record.'),
  (1975, 'fffffff1-0000-4000-8000-000000000002', 'contested', null, null, 'Member testimony disagrees; both values are shown and neither is deleted (doc 02 §1.2).')
) as v(year, source_id, status, resolved_by, resolved_at, note)
where not exists (
  select 1 from field_assertions fa
  where fa.entity_type = 'song' and fa.entity_id = 'ccccccc1-0000-4000-8000-000000000002'
    and fa.field_key = 'release_year' and fa.value_display = v.year::text
);

-- ---------------------------------------------------------------------------
-- 8. Long-form history with a citation (doc 10 Phase 2) — published, so the song page shows it.
-- ---------------------------------------------------------------------------
insert into song_histories (id, song_id, locale, headline, body, body_format, period_start_year, period_end_year, status, verification, authored_by, approved_by, approved_at)
select
  'fffffff1-0000-4000-8000-000000000010'::uuid,
  'ccccccc1-0000-4000-8000-000000000002'::uuid,
  'en',
  'Kisumu Night: the disputed press date',
  E'The band recorded the song in Nairobi in the mid-1970s. The sleeve of the VSB-004 pressing states 1976; a band member interviewed in 1998 recalled 1975.\n\nBoth claims are recorded as assertions with their sources.',
  'markdown', 1975, 1976, 'published', 'reviewed',
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  now()
where not exists (select 1 from song_histories h where h.id = 'fffffff1-0000-4000-8000-000000000010');

insert into historical_events (id, event_type, title, description, year, date_precision, country_id, band_id, verification, status)
select 'fffffff1-0000-4000-8000-000000000020'::uuid, 'formation', 'Victoria Stars Band forms in Nairobi',
       'Fictional reference event for the Phase 1 timeline.', 1972, 'year', c.id,
       'aaaaaaa1-0000-4000-8000-000000000001'::uuid, 'reviewed', 'published'
from (select id from countries where iso2 = 'KE') c
where not exists (select 1 from historical_events e where e.id = 'fffffff1-0000-4000-8000-000000000020');

insert into timelines (id, title, slug, description, country_id, genre_id, start_year, end_year, is_editorial, status)
select 'fffffff1-0000-4000-8000-000000000030'::uuid, 'Benga in Nairobi', 'benga-nairobi',
       'Reference timeline for the Phase 1 slice.', c.id, g.id, 1972, 1980, true, 'published'
from (select id from countries where iso2 = 'KE') c
cross join (select id from genres where name = 'Benga') g
where not exists (select 1 from timelines t where t.id = 'fffffff1-0000-4000-8000-000000000030');

insert into timeline_items (timeline_id, historical_event_id, position, year, caption)
select 'fffffff1-0000-4000-8000-000000000030'::uuid, 'fffffff1-0000-4000-8000-000000000020'::uuid, 1, 1972,
       'The band forms in Nairobi.'
where not exists (
  select 1 from timeline_items ti
  where ti.timeline_id = 'fffffff1-0000-4000-8000-000000000030'
    and ti.historical_event_id = 'fffffff1-0000-4000-8000-000000000020'
);

-- ---------------------------------------------------------------------------
-- 9. Contributor activity: a submission, an edit awaiting review, a report, a bookmark and a play
--    event — so the console, the queue and the library screens have real rows to work with.
-- ---------------------------------------------------------------------------
insert into submissions (id, kind, target_type, target_id, title, rationale, status, verification, submitted_by, country_id)
select 'fffffff1-0000-4000-8000-000000000040'::uuid, 'new_recording', 'recording',
       'ddddddd1-0000-4000-8000-000000000010'::uuid, 'Alternate take of Example (1975)',
       'A family tape holds a second take; the upload will follow the standard media pipeline.',
       'submitted', 'community_sourced', '44444444-4444-4444-4444-444444444444'::uuid, c.id
from (select id from countries where iso2 = 'KE') c
where not exists (select 1 from submissions s where s.id = 'fffffff1-0000-4000-8000-000000000040');

insert into submission_items (submission_id, item_type, payload, position)
select 'fffffff1-0000-4000-8000-000000000040'::uuid, 'statement',
       jsonb_build_object('note', 'Second take, same session, transferred from a cassette.', 'declared_year', 1975), 0
where not exists (
  select 1 from submission_items si where si.submission_id = 'fffffff1-0000-4000-8000-000000000040'
);

insert into edits (id, target_type, target_id, submission_id, field_key, current_value, proposed_value, explanation, status, submitted_by)
select 'fffffff1-0000-4000-8000-000000000050'::uuid, 'song', 'ccccccc1-0000-4000-8000-000000000002'::uuid,
       null, 'primary_genre_id', to_jsonb((select id::text from genres where name = 'Benga')),
       to_jsonb((select id::text from genres where name = 'Rhumba')),
       'The 1976 pressing credits a rhumba-style arrangement; suggesting the genre be widened.',
       'submitted', '66666666-6666-6666-6666-666666666666'::uuid
where not exists (select 1 from edits e where e.id = 'fffffff1-0000-4000-8000-000000000050');

insert into reports (id, target_type, target_id, reason, detail, reporter_id, status)
select 'fffffff1-0000-4000-8000-000000000060'::uuid, 'song', 'ccccccc1-0000-4000-8000-000000000002'::uuid,
       'incorrect_information', 'The sleeve says 1976 but my copy is stamped 1975.',
       '55555555-5555-5555-5555-555555555555'::uuid, 'open'
where not exists (select 1 from reports r where r.id = 'fffffff1-0000-4000-8000-000000000060');

insert into bookmarks (user_id, target_type, target_id)
select '55555555-5555-5555-5555-555555555555'::uuid, 'song', 'ccccccc1-0000-4000-8000-000000000001'::uuid
where not exists (
  select 1 from bookmarks b
  where b.user_id = '55555555-5555-5555-5555-555555555555'::uuid
    and b.target_id = 'ccccccc1-0000-4000-8000-000000000001'::uuid
);

insert into play_events (recording_id, user_id, seconds_played, completed, platform, country_id)
select 'ddddddd1-0000-4000-8000-000000000010'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 214, true,
       'web', (select id from countries where iso2 = 'KE')
where not exists (select 1 from play_events pe where pe.recording_id = 'ddddddd1-0000-4000-8000-000000000010');

-- Job queue rows: the console's system-health screen (doc 08 §3, §69) reads these.
insert into job_queue (job_kind, status, priority, payload, dedupe_key)
select v.kind::job_kind, v.status::job_status, 100, v.payload::jsonb, v.dedupe
from (values
  ('reindex', 'queued', '{"scope":"catalogue"}', 'reindex:seed'),
  ('transcode', 'failed', '{"recording_id":"ddddddd1-0000-4000-8000-000000000030"}', 'transcode:lake-lullaby')
) as v(kind, status, payload, dedupe)
where not exists (select 1 from job_queue jq where jq.dedupe_key = v.dedupe);
