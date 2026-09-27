-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Source: §8 Community, library and notifications (§70, §92–§94)
-- Regenerate with: npm run migrations:generate  (tools/generate-migrations.mjs)
-- Every statement below is copied verbatim from the technical blueprint; the generator only
-- adds this header and the RLS enablement lines required by doc 04 §10 rule 4.
-- ============================================================================

-- deviation: doc 04 §10 lists deferred FKs as 0015 and community tables as 0016, but the
-- document body order must be preserved: `playlists_cover_fk` targets `playlists`, which is
-- created in the community section. Content is unchanged, only the file number moves.

alter table albums             add constraint albums_cover_fk
  foreign key (cover_media_id) references media_files(id) on delete set null;

alter table profiles           add constraint profiles_avatar_fk
  foreign key (avatar_media_id) references media_files(id) on delete set null;

alter table playlists          add constraint playlists_cover_fk
  foreign key (cover_media_id) references media_files(id) on delete set null;

alter table sources            add constraint sources_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table interviews         add constraint interviews_audio_fk
  foreign key (audio_media_id) references media_files(id) on delete set null;

alter table documents          add constraint documents_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table photographs        add constraint photographs_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table copyright_claims   add constraint claims_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table rights_declarations add constraint declarations_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table submission_items   add constraint submission_items_media_fk
  foreign key (media_file_id) references media_files(id) on delete set null;

alter table band_members       add constraint band_members_source_fk
  foreign key (source_id) references sources(id) on delete set null;

alter table recording_musicians add constraint recording_musicians_source_fk
  foreign key (source_id) references sources(id) on delete set null;

alter table song_musicians     add constraint song_musicians_source_fk
  foreign key (source_id) references sources(id) on delete set null;

alter table song_composers     add constraint song_composers_source_fk
  foreign key (source_id) references sources(id) on delete set null;

alter table recording_credits  add constraint recording_credits_source_fk
  foreign key (source_id) references sources(id) on delete set null;

alter table entity_aliases     add constraint entity_aliases_source_fk
  foreign key (source_id) references sources(id) on delete set null;
