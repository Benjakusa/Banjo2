-- ============================================================================
-- 0021 — Seed data (reference/vocabulary only). Idempotent: safe to re-run.
--
-- doc 04 §10 fixes this migration as "seed data: countries, languages, genres, instruments, roles,
-- permissions, badges, feature flags, app_releases (idempotent)".
--
-- What belongs here: data the platform cannot function without, in every environment, including
-- production (doc 05 §1 permission codes, doc 09 §4 vocabulary, doc 10 Phase 5 "adding a country
-- requires seed data only — no schema change").
-- What does NOT belong here: the demo/reference dataset — that is supabase/seed.sql (dev only).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Countries and regions (doc 10 Phase 5 expansion sequence: Kenya first, then East, West,
--    Southern, Central and North Africa). Adding a country later must need seed data only.
-- ---------------------------------------------------------------------------
insert into countries (iso2, iso3, name, name_local, region_group, is_active)
select v.iso2, v.iso3, v.name, v.name_local, v.region_group, true
from (values
  ('KE', 'KEN', 'Kenya',        'Kenya',        'East Africa'),
  ('UG', 'UGA', 'Uganda',       'Uganda',       'East Africa'),
  ('TZ', 'TZA', 'Tanzania',     'Tanzania',     'East Africa'),
  ('RW', 'RWA', 'Rwanda',       'Rwanda',       'East Africa'),
  ('BI', 'BDI', 'Burundi',      'Burundi',      'East Africa'),
  ('ET', 'ETH', 'Ethiopia',     'ኢትዮጵያ',       'East Africa'),
  ('SO', 'SOM', 'Somalia',      'Soomaaliya',   'East Africa'),
  ('SS', 'SSD', 'South Sudan',  'South Sudan',  'East Africa'),
  ('NG', 'NGA', 'Nigeria',      'Nigeria',      'West Africa'),
  ('GH', 'GHA', 'Ghana',        'Ghana',        'West Africa'),
  ('SN', 'SEN', 'Senegal',      'Sénégal',      'West Africa'),
  ('CI', 'CIV', 'Côte d''Ivoire', 'Côte d''Ivoire', 'West Africa'),
  ('ML', 'MLI', 'Mali',         'Mali',         'West Africa'),
  ('ZA', 'ZAF', 'South Africa', 'South Africa', 'Southern Africa'),
  ('ZW', 'ZWE', 'Zimbabwe',     'Zimbabwe',     'Southern Africa'),
  ('MZ', 'MOZ', 'Mozambique',   'Moçambique',   'Southern Africa'),
  ('BW', 'BWA', 'Botswana',     'Botswana',     'Southern Africa'),
  ('NA', 'NAM', 'Namibia',      'Namibia',      'Southern Africa'),
  ('CD', 'COD', 'DR Congo',     'République démocratique du Congo', 'Central Africa'),
  ('CM', 'CMR', 'Cameroon',     'Cameroun',     'Central Africa'),
  ('GA', 'GAB', 'Gabon',        'Gabon',        'Central Africa'),
  ('AO', 'AGO', 'Angola',       'Angola',       'Central Africa'),
  ('EG', 'EGY', 'Egypt',        'مصر',          'North Africa'),
  ('MA', 'MAR', 'Morocco',      'المغرب',        'North Africa'),
  ('DZ', 'DZA', 'Algeria',      'الجزائر',       'North Africa'),
  ('TN', 'TUN', 'Tunisia',      'تونس',         'North Africa')
) as v(iso2, iso3, name, name_local, region_group)
where not exists (select 1 from countries c where c.iso2 = v.iso2);

insert into regions (country_id, name, slug)
select c.id, v.name, v.slug
from (values
  ('KE', 'Nairobi',   'nairobi'),
  ('KE', 'Mombasa',   'mombasa'),
  ('KE', 'Kisumu',    'kisumu'),
  ('KE', 'Nakuru',    'nakuru'),
  ('KE', 'Kakamega',  'kakamega'),
  ('KE', 'Nyeri',     'nyeri'),
  ('KE', 'Garissa',   'garissa'),
  ('TZ', 'Dar es Salaam', 'dar-es-salaam'),
  ('TZ', 'Zanzibar',  'zanzibar'),
  ('UG', 'Kampala',   'kampala'),
  ('NG', 'Lagos',     'lagos'),
  ('GH', 'Accra',     'accra'),
  ('ZA', 'Gauteng',   'gauteng')
) as v(country_iso2, name, slug)
join countries c on c.iso2 = v.country_iso2
where not exists (
  select 1 from regions r where r.country_id = c.id and r.name = v.name
);

-- ---------------------------------------------------------------------------
-- 2. Languages (doc 03 §5). `is_ui_locale` marks the launch locales: en + sw (ADR-14, Q3).
-- ---------------------------------------------------------------------------
insert into languages (iso639_1, iso639_3, name, name_local, is_ui_locale)
select v.iso1, v.iso3, v.name, v.name_local, v.is_ui
from (values
  ('en', 'eng', 'English',                'English',        true),
  ('sw', 'swa', 'Kiswahili',              'Kiswahili',      true),
  (null, 'luo', 'Dholuo',                 'Dholuo',         false),
  (null, 'kik', 'Gikuyu',                 'Gĩkũyũ',         false),
  (null, 'luy', 'Luhya',                  'Luhya',          false),
  (null, 'kam', 'Kikamba',                'Kikamba',        false),
  (null, 'som', 'Somali',                 'Soomaali',       false),
  (null, 'amh', 'Amharic',                'አማርኛ',           false),
  (null, 'hau', 'Hausa',                  'Hausa',          false),
  (null, 'yor', 'Yoruba',                 'Yorùbá',         false),
  (null, 'ibo', 'Igbo',                   'Igbo',           false),
  (null, 'zul', 'isiZulu',                'isiZulu',        false),
  (null, 'xho', 'isiXhosa',               'isiXhosa',       false),
  (null, 'lin', 'Lingala',                'Lingála',        false),
  (null, 'wol', 'Wolof',                  'Wolof',          false),
  (null, 'ara', 'Arabic',                 'العربية',         false),
  ('fr', 'fra', 'French',                 'Français',       false),
  ('pt', 'por', 'Portuguese',             'Português',      false)
) as v(iso1, iso3, name, name_local, is_ui)
where not exists (select 1 from languages l where l.name = v.name);

-- ---------------------------------------------------------------------------
-- 3. Genres and instruments (doc 02 §2.1 vocabulary; doc 10 Phase 5 forbids "Kenya-only"
--    assumptions, so the vocabulary spans the continent from the start).
-- ---------------------------------------------------------------------------
insert into genres (name, description, origin_country_id)
select v.name, v.description, c.id
from (values
  ('Benga',        'Kenyan guitar style rooted in Luo nyatiti rhythms; the reference genre for Phase 1.', 'KE'),
  ('Ohangla',      'Luo dance music built on nyatiti, orutu and drums.',                                'KE'),
  ('Taarab',       'Swahili coastal orchestral style of Mombasa and Zanzibar.',                          'KE'),
  ('Genge',        'Nairobi hip-hop-influenced street genre.',                                           'KE'),
  ('Kapuka',       'Kenyan pop/hip-hop hybrid.',                                                         'KE'),
  ('Bongo Flava',  'Tanzanian hip-hop and R&B hybrid.',                                                   'TZ'),
  ('Soukous',      'Congolese dance music, guitar-led.',                                                 'CD'),
  ('Rhumba',       'Congolese-rooted dance band style played across East Africa.',                       'CD'),
  ('Highlife',     'Ghanaian guitar-band and horn tradition.',                                           'GH'),
  ('Juju',         'Yoruba guitar and percussion tradition.',                                            'NG'),
  ('Afrobeat',     'West African funk and horn-driven style.',                                           'NG'),
  ('Mbalax',       'Senegalese dance music with sabar drums.',                                            'SN'),
  ('Chimurenga',   'Zimbabwean guitar-band style.',                                                      'ZW'),
  ('Kwaito',       'South African electronic street style.',                                             'ZA'),
  ('Makossa',      'Cameroonian bass-led dance style.',                                                   'CM'),
  ('Gospel',       'African gospel and choral traditions.',                                              null),
  ('Traditional',  'Traditional repertoire documented without a modern genre label.',                     null)
) as v(name, description, country_iso2)
left join countries c on c.iso2 = v.country_iso2
where not exists (select 1 from genres g where g.name = v.name);

insert into instruments (name, name_local, family, hornbostel_sachs)
select v.name, v.name_local, v.family, v.hs
from (values
  ('Nyatiti',        'Nyatiti',        'string',  '321.5'),
  ('Orutu',          'Orutu',          'string',  '321.5'),
  ('Ongoma',         'Ongoma',         'string',  '321.5'),
  ('Kora',           'Kora',           'string',  '323.1'),
  ('Kalimba',        'Kalimba',        'idiophone','122.1'),
  ('Djembe',         'Djembe',         'membranophone', '211.2'),
  ('Talking drum',   'Dondo',          'membranophone', '211.2'),
  ('Ngoma',          'Ngoma',          'membranophone', '211.2'),
  ('Percussion',     null,             'idiophone','1'),
  ('Guitar',         null,             'string',  '321.3'),
  ('Bass',           null,             'string',  '321.3'),
  ('Drums',          null,             'membranophone', '211.1'),
  ('Keyboard',       null,             'electrophone', '5'),
  ('Trumpet',        null,             'wind',    '423.2'),
  ('Saxophone',      null,             'wind',    '422.2'),
  ('Trombone',       null,             'wind',    '423.2'),
  ('Flute',          null,             'wind',    '421'),
  ('Violin',         null,             'string',  '321.3'),
  ('Accordion',      null,             'wind',    '412.1'),
  ('Vocals',         null,             'vocal',   null)
) as v(name, name_local, family, hs)
where not exists (select 1 from instruments i where i.name = v.name);

-- ---------------------------------------------------------------------------
-- 4. Roles and permissions (doc 05 §1). "No role implies every permission except super_admin; staff
--    permissions are granted individually and revocably."
-- ---------------------------------------------------------------------------
insert into roles (code, name, description, rank)
select v.code, v.name, v.description, v.rank
from (values
  ('member',           'Member',             'Registered listener: published content and their own library.',   10),
  ('contributor',      'Contributor',        'Member plus submissions, edit suggestions and reports.',            20),
  ('archivist',        'Archivist',          'Reviews content, publishes approved records.',                       30),
  ('senior_archivist', 'Senior archivist',   'Historical verification, merges, verification levels.',              40),
  ('moderator',        'Moderator',          'Community and abuse handling, content hiding.',                      50),
  ('rights_manager',   'Rights manager',     'Claims, rights status and restrictions.',                            60),
  ('support_agent',    'Support agent',      'User support: view and notify users only.',                          70),
  ('analyst',          'Analyst',            'Aggregate statistics only.',                                         80),
  ('platform_admin',   'Platform admin',     'Users, content and configuration management.',                       90),
  ('super_admin',      'Super admin',        'Full control, including system administration.',                    100)
) as v(code, name, description, rank)
where not exists (select 1 from roles r where r.code = v.code);

insert into permissions (code, description, category)
select v.code, v.description, v.category
from (values
  ('content.create',      'Create catalogue content',          'content'),
  ('content.review',      'Review submitted content',          'content'),
  ('content.publish',     'Publish or withdraw content',       'content'),
  ('content.merge',       'Merge duplicate entities',          'content'),
  ('content.hide',        'Hide content from public view',     'content'),
  ('verification.set',    'Set verification levels',           'content'),
  ('edit.suggest',        'Suggest an edit',                   'contribution'),
  ('submission.create',   'Submit recordings and new entities', 'contribution'),
  ('rights.manage',       'Manage rights records',             'rights'),
  ('rights.restrict',     'Restrict or remove recordings',     'rights'),
  ('claims.decide',       'Decide copyright claims',           'rights'),
  ('takedown.decide',     'Decide takedown requests',          'rights'),
  ('community.moderate',  'Moderate community behaviour',      'community'),
  ('users.view',          'View user accounts',                'users'),
  ('users.manage',        'Manage users, roles and statuses',  'users'),
  ('users.notify',        'Send notifications to users',       'users'),
  ('analytics.view',      'View aggregate analytics',          'analytics'),
  ('config.manage',       'Manage configuration and taxonomy', 'system'),
  ('import.run',          'Run bulk imports',                  'system'),
  ('system.admin',        'System administration',             'system'),
  ('report.create',       'Report a problem with content',      'community'),
  ('report.triage',       'Triage reports',                     'community'),
  ('newsletter.send',     'Send newsletters',                   'users')
) as v(code, description, category)
where not exists (select 1 from permissions p where p.code = v.code);

-- Role → permission grants, exactly as the matrix in doc 05 §1 describes them.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code = any (
  case r.code
    when 'contributor'      then array['submission.create','edit.suggest','report.create']
    when 'archivist'        then array['content.review','content.publish']
    when 'senior_archivist' then array['content.review','content.publish','content.merge','verification.set']
    when 'moderator'        then array['community.moderate','content.hide','report.triage']
    when 'rights_manager'   then array['rights.manage','rights.restrict','claims.decide','takedown.decide']
    when 'support_agent'    then array['users.view','users.notify']
    when 'analyst'          then array['analytics.view']
    when 'platform_admin'   then array['users.manage','users.view','users.notify','analytics.view',
                                      'config.manage','import.run','report.triage','newsletter.send',
                                      'content.create','content.review','content.publish','content.merge',
                                      'content.hide','verification.set']
    when 'super_admin'      then array(select code from permissions)
    else array[]::text[]
  end
)
where not exists (
  select 1 from role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);

-- ---------------------------------------------------------------------------
-- 5. Contributor badges (doc 02 §2.6) — motivation for sourced, reviewable contributions.
-- ---------------------------------------------------------------------------
insert into badges (code, name, description, criterion)
select v.code, v.name, v.description, v.criterion
from (values
  ('first_contribution',  'First contribution',  'First accepted submission or edit.',                'submissions_accepted >= 1'),
  ('ten_contributions',   'Ten contributions',   'Ten accepted submissions or edits.',                 'submissions_accepted >= 10'),
  ('sourced_historian',   'Sourced historian',   'Five accepted history articles with citations.',     'history_accepted_with_sources >= 5'),
  ('source_verified',     'Primary source',      'Contributed evidence that raised a field to source_verified.', 'verification_set_source_verified >= 1'),
  ('rights_holder',       'Rights holder',       'Verified rights holder account (doc 09 §4).',        'rights_holder_verified'),
  ('duplicate_hunter',    'Duplicate hunter',    'Reported a confirmed duplicate (doc 09 §3).',        'duplicates_confirmed >= 1'),
  ('translator',          'Translator',          'Approved translation into a launch locale.',         'translations_approved >= 1')
) as v(code, name, description, criterion)
where not exists (select 1 from badges b where b.code = v.code);

-- ---------------------------------------------------------------------------
-- 6. Feature flags (doc 10 §8: "Feature flag created if the change is risky").
--    V1 explicitly excludes offline audio (ADR-11) and Typesense (Phase 4), so those flags ship
--    disabled and the clients must respect the database value, not a build constant.
-- ---------------------------------------------------------------------------
insert into feature_flags (key, description, is_enabled, rollout_percentage, audience)
select v.key, v.description, v.is_enabled, v.rollout, v.audience
from (values
  ('claims_portal',        'Public copyright claim and takedown filing (doc 09 §5).',        true,  100, 'all'),
  ('swahili_ui',           'Swahili interface locale (ADR-14, Q3).',                        true,  100, 'all'),
  ('data_saver_mode',      'Lower audio tier and compressed imagery (doc 07 §6).',          true,  100, 'all'),
  ('waveform_player',      'Waveform rendering in the player (Phase 4, doc 07 §5).',        false,   0, 'all'),
  ('offline_audio_download','Offline audio downloads — explicitly out of V1 (ADR-11).',     false,   0, 'all'),
  ('typesense_search',     'Typesense-backed search instead of Postgres FTS (Phase 4).',    false,   0, 'staff'),
  ('bulk_import',          'CSV/JSON bulk import console (doc 08 §5).',                     false,   0, 'staff'),
  ('interview_transcripts','Transcript display for interviews (doc 10 Phase 2).',           true,  100, 'all')
) as v(key, description, is_enabled, rollout, audience)
where not exists (select 1 from feature_flags f where f.key = v.key);

-- ---------------------------------------------------------------------------
-- 7. App releases — the minimum supported version gate for mobile clients (doc 07 §1).
-- ---------------------------------------------------------------------------
insert into app_releases (platform, version, build_number, is_minimum_supported, released_at, notes)
select v.platform, v.version, v.build, v.is_min, v.released_at::timestamptz, v.notes
from (values
  ('android', '1.0.0', 1, true,  '2026-01-01T00:00:00Z', 'Phase 1 prototype client.'),
  ('ios',     '1.0.0', 1, true,  '2026-01-01T00:00:00Z', 'Phase 1 prototype client.'),
  ('web',     '1.0.0', 1, true,  '2026-01-01T00:00:00Z', 'Public archive (banjo.africa).'),
  ('admin',   '1.0.0', 1, true,  '2026-01-01T00:00:00Z', 'Staff console (admin.banjo.africa).')
) as v(platform, version, build, is_min, released_at, notes)
where not exists (
  select 1 from app_releases ar where ar.platform = v.platform and ar.version = v.version
);
