#!/usr/bin/env bash
#
# Verification suite for the Phase 1 reference dataset (supabase/seed.sql).
#
#   npm run db:test                  # verify the local reference database
#   BANJO_DB=banjo_mine npm run db:test
#   npm run db:test -- --no-reseed   # read-only: skip the idempotency re-run
#
# It asserts the rules the dataset exists to prove:
#   1. every row the seed inserts is present
#   2. exactly one rights_unknown recording: private, no linked audio, archive_only
#      and never streamable                                       (ADR-12, doc 09 §4)
#   3. nothing is published with audio but without streamable rights — the state
#      enforce_rights_before_publish rejects                (doc 05 §4.1, migration 0018)
#   4. both sides of the disputed release year survive and the song stays flagged
#      disputed                                                  (doc 02 §1.2, seed §7)
#   5. ADR-04: the closing `update recordings set status = status` creates no
#      revision — proved by counting revisions around the statement
#   6. as role anon the draft and the rights_unknown recording stay invisible
#   7. the seed is idempotent: a second run changes no counts
#
# Exit status is 0 only when every check passes.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 2

TARGET="${DATABASE_URL:-${BANJO_DB:-banjo_seed_v2}}"
RESEED=1
[ "${1:-}" = "--no-reseed" ] && RESEED=0

# The rows the dataset is built around (seed §5, §7).
PLAYABLE='ddddddd1-0000-4000-8000-000000000010'       # SR-001,  published, public, streamable
RIGHTS_UNKNOWN='ddddddd1-0000-4000-8000-000000000020' # SR-004,  rights_unknown, private, no audio
DRAFT='ddddddd1-0000-4000-8000-000000000110'          # SR-001B, draft, never visible to anon
DISPUTED_SONG='ccccccc1-0000-4000-8000-000000000002'  # Amuka Salama: 1974 or 1975

fail=0; checks=0; failed=0

# check <description>, SQL on stdin — passes when the block raises no exception.
check() {
  local desc="$1" out
  checks=$((checks + 1))
  out=$(psql "$TARGET" -qtA -v ON_ERROR_STOP=1 -f - 2>&1)
  if [ $? -eq 0 ]; then
    printf '  ok   %s\n' "$desc"
    printf '%s\n' "$out" | sed 's/^psql:[^:]*:[0-9]*: NOTICE:  //; s/^NOTICE:  //; /^$/d; s/^/       /'
  else
    printf '  FAIL %s\n' "$desc"
    printf '%s\n' "$out" | grep -E 'ERROR|DETAIL|HINT' | head -4 | sed 's/^/       /'
    fail=1; failed=$((failed + 1))
  fi
}

# expect_eq <description> <actual> <expected>
expect_eq() {
  checks=$((checks + 1))
  if [ "$2" = "$3" ]; then
    printf '  ok   %s (%s)\n' "$1" "$2"
  else
    printf '  FAIL %s — expected %s, found %s\n' "$1" "$3" "$2"
    fail=1; failed=$((failed + 1))
  fi
}

# Row counts as role anon, so the RLS policies decide the answer.
anon_count() {
  psql "$TARGET" -qtA -v ON_ERROR_STOP=1 -c "set role anon; select count(*) from $1 where $2" 2>&1
}

printf '\ndb:test — Phase 1 reference dataset (target: %s)\n\n' "$TARGET"

if ! psql "$TARGET" -qtc 'select 1' >/dev/null 2>&1; then
  printf 'db:test FAILED — cannot reach "%s"\n' "$TARGET" >&2
  printf '  Build it first (supabase/README.md), or set DATABASE_URL / BANJO_DB.\n' >&2
  exit 1
fi

check "every row the seed inserts is present" <<'SQL'
do $$
declare
  m constant text := '%-0000-4000-8000-%';
  total integer := 0;
  counted integer := 0;
  r record;
begin
  for r in
    select * from (values
      ('accounts',          (select count(*) from auth.users where email like '%@banjo.test'), 7),
      ('user_roles',        (select count(*) from user_roles ur where exists (
                               select 1 from auth.users u where u.id = ur.user_id and u.email like '%@banjo.test')), 7),
      ('bands',             (select count(*) from bands          where id::text            like m),  1),
      ('people',            (select count(*) from people         where id::text            like m),  4),
      ('band_members',      (select count(*) from band_members   where band_id::text       like m),  4),
      ('aliases',           (select count(*) from entity_aliases where entity_id::text     like m),  2),
      ('songs',             (select count(*) from songs          where id::text            like m), 10),
      ('song_composers',    (select count(*) from song_composers where song_id::text       like m), 10),
      ('recordings',        (select count(*) from recordings     where id::text            like m), 11),
      ('media_files',       (select count(*) from media_files    where id::text            like m), 14),
      ('recording_media',   (select count(*) from recording_media  where recording_id::text  like m), 12),
      ('audio_derivatives', (select count(*) from audio_derivatives where media_file_id::text like m), 3),
      ('rights_holders',    (select count(*) from rights_holders   where id::text            like m), 1),
      ('recording_rights',  (select count(*) from recording_rights where recording_id::text  like m), 10),
      ('sources',           (select count(*) from sources          where id::text            like m),  2),
      ('citations',         (select count(*) from citations        where target_id::text     like m),  2),
      ('field_assertions',  (select count(*) from field_assertions where entity_id::text     like m),  2),
      ('song_histories',    (select count(*) from song_histories   where song_id::text       like m),  1),
      ('historical_events', (select count(*) from historical_events
                              where song_id::text      like m or band_id::text      like m
                                 or person_id::text    like m or recording_id::text like m),  2),
      ('timelines',         (select count(*) from timelines        where id::text            like m),  1),
      ('timeline_items',    (select count(*) from timeline_items   where timeline_id::text   like m),  2),
      ('submissions',       (select count(*) from submissions      where id::text            like m),  1),
      ('submission_items',  (select count(*) from submission_items where submission_id::text like m),  1),
      ('edits',             (select count(*) from edits            where target_id::text     like m),  1),
      ('reports',           (select count(*) from reports          where target_id::text     like m),  1),
      ('bookmarks',         (select count(*) from bookmarks        where target_id::text     like m),  1),
      ('play_events',       (select count(*) from play_events      where recording_id::text  like m),  1),
      ('job_queue',         (select count(*) from job_queue        where dedupe_key like '%:seed'
                                                                      or dedupe_key = 'transcode:safari-garissa'), 2),
      -- 26 creates (10 songs, 11 recordings, 4 people, 1 band) plus the 11
      -- counter-trigger updates the recordings provoke (see the next checks).
      ('revisions',         (select count(*) from revisions        where entity_id::text    like m), 37)
    ) as t(relation, found, expected)
  loop
    if r.found <> r.expected then
      raise exception 'seed row count for %: expected %, found %', r.relation, r.expected, r.found;
    end if;
    total := total + r.found;
    counted := counted + 1;
  end loop;
  raise notice '% seeded rows across % tables', total, counted;
end $$;
SQL

check "one rights_unknown recording: private, no audio, archive_only, never streamable" <<'SQL'
do $$
declare m constant text := '%-0000-4000-8000-%';
begin
  if (select count(*) from recordings where id::text like m and rights_status = 'rights_unknown') <> 1 then
    raise exception 'expected exactly one rights_unknown recording, found %',
      (select count(*) from recordings where id::text like m and rights_status = 'rights_unknown');
  end if;
  if (select count(*) from recordings
       where id::text like m and rights_status = 'rights_unknown' and visibility = 'private') <> 1 then
    raise exception 'the rights_unknown recording must stay private to signed-out readers';
  end if;
  if exists (select 1 from recording_media rm join media_files mf on mf.id = rm.media_file_id
              where rm.recording_id = 'ddddddd1-0000-4000-8000-000000000020'::uuid
                and mf.media_kind in ('audio_master', 'audio_stream')) then
    raise exception 'the rights_unknown recording must have no linked audio to stream';
  end if;
  if not exists (select 1 from recording_rights rr
                  where rr.recording_id = 'ddddddd1-0000-4000-8000-000000000020'::uuid
                    and rr.rights_status = 'rights_unknown'
                    and rr.permitted_scope = '{archive_only}'::rights_scope[]
                    and rr.allows_streaming = false) then
    raise exception 'the rights_unknown recording needs an archive_only, non-streamable rights row';
  end if;
  -- Exactly the state enforce_rights_before_publish refuses on write: any
  -- published recording holding audio without a streamable rights basis.
  if exists (
    select 1 from recordings r
     where r.status = 'published'
       and exists (select 1 from recording_media rm join media_files mf on mf.id = rm.media_file_id
                    where rm.recording_id = r.id and mf.media_kind in ('audio_master', 'audio_stream'))
       and not exists (select 1 from recording_rights rr
                        where rr.recording_id = r.id
                          and rr.allows_streaming
                          and rr.rights_status not in ('rights_unknown', 'disputed', 'restricted', 'removed'))) then
    raise exception 'a published recording has audio but no streamable rights';
  end if;
  raise notice 'the 10 published recordings pass the guard the seed trips on purpose';
end $$;
SQL

check "the disputed release year keeps both values, with no implicit winner" <<'SQL'
do $$
begin
  if (select count(*) from field_assertions
       where entity_id = 'ccccccc1-0000-4000-8000-000000000002'::uuid
         and field_key = 'release_year') <> 2 then
    raise exception 'the disputed song needs exactly two sourced release_year assertions';
  end if;
  if (select count(distinct value_display) from field_assertions
       where entity_id = 'ccccccc1-0000-4000-8000-000000000002'::uuid
         and field_key = 'release_year') <> 2 then
    raise exception 'both competing values must survive — one of them was overwritten';
  end if;
  if not exists (select 1 from field_assertions
                  where entity_id = 'ccccccc1-0000-4000-8000-000000000002'::uuid
                    and field_key = 'release_year' and value_display = '1975'
                    and status = 'accepted' and resolved_at is not null) then
    raise exception 'the 1975 assertion must be the accepted one, with resolved_at set';
  end if;
  if not exists (select 1 from field_assertions
                  where entity_id = 'ccccccc1-0000-4000-8000-000000000002'::uuid
                    and field_key = 'release_year' and value_display = '1974'
                    and status = 'contested' and resolved_at is null) then
    raise exception 'the 1974 assertion must stay contested and unresolved';
  end if;
  if (select is_verified_disputed from songs
       where id = 'ccccccc1-0000-4000-8000-000000000002'::uuid) is not true then
    raise exception 'the song must be flagged is_verified_disputed';
  end if;
  raise notice '1975 accepted and 1974 contested, each with its own source';
end $$;
SQL

check "ADR-04: the housekeeping status touch creates no revision" <<'SQL'
do $$
declare
  m constant text := '%-0000-4000-8000-%';
  before_count integer;
  after_count integer;
begin
  if exists (select 1 from revisions where change_summary like 'update: status%') then
    raise exception 'a status-only revision exists — housekeeping is tracked as an edit';
  end if;
  if (select count(*) from revisions where entity_type = 'recording' and entity_id::text like m) <> 11 then
    raise exception 'each seeded recording needs exactly one revision (its create), found %',
      (select count(*) from revisions where entity_type = 'recording' and entity_id::text like m);
  end if;
  if exists (select 1 from revisions
              where entity_type = 'recording' and entity_id::text like m and change_summary <> 'create') then
    raise exception 'seeded recordings must only ever have create revisions';
  end if;
  -- Run the seed's closing statement again: re-validating every recording must
  -- stay invisible to the revision log (migration 0021 excludes housekeeping).
  select count(*) into before_count from revisions;
  update recordings set status = status;
  select count(*) into after_count from revisions;
  if after_count <> before_count then
    raise exception 'update recordings set status = status created % revision(s)', after_count - before_count;
  end if;
  raise notice 'the touch re-validated 11 recordings and created 0 of % revisions', before_count;
end $$;
SQL

# 6. What a signed-out reader gets: the nine public recordings, all ten songs,
#    the band, and no audio for the recording whose rights are unknown.
MARKER="id::text like '%-0000-4000-8000-%'"
expect_eq "anon sees the published public recordings and songs" \
  "$(anon_count recordings "$MARKER") recordings, $(anon_count songs "$MARKER") songs" \
  "9 recordings, 10 songs"
expect_eq "anon sees the playable recording but neither the draft nor the withheld one" \
  "$(anon_count recordings "id = '$PLAYABLE'")/$(anon_count recordings "id = '$DRAFT'")/$(anon_count recordings "id = '$RIGHTS_UNKNOWN'")" \
  "1/0/0"
expect_eq "anon never reaches the withheld audio (12 of 14 media rows)" \
  "$(anon_count media_files "$MARKER") of $(psql "$TARGET" -qtA -c "select count(*) from media_files where $MARKER")" \
  "12 of 14"

# 7. Idempotency: the seed can be applied again without changing a single count.
if [ "$RESEED" -eq 1 ]; then
  checks=$((checks + 1))
  before_fp=$(bash scripts/db-seed.sh --fingerprint)
  if bash scripts/db-seed.sh --quiet; then
    after_fp=$(bash scripts/db-seed.sh --fingerprint)
    if [ "$before_fp" = "$after_fp" ]; then
      printf '  ok   idempotent: a second seed run changed no counts\n'
    else
      printf '  FAIL idempotent: a second seed run changed counts:\n'
      diff <(printf '%s\n' "$before_fp") <(printf '%s\n' "$after_fp") | sed 's/^/       /'
      fail=1; failed=$((failed + 1))
    fi
  else
    printf '  FAIL idempotent: re-running supabase/seed.sql failed\n'
    fail=1; failed=$((failed + 1))
  fi
else
  printf '  skip idempotency re-run (--no-reseed): the database was left untouched\n'
fi

if [ "$fail" -ne 0 ]; then
  printf '\ndb:test FAILED — %d of %d checks failed (target: %s)\n' "$failed" "$checks" "$TARGET"
  exit 1
fi

printf '\ndb:test OK  (%d checks, target: %s)\n' "$checks" "$TARGET"
printf '  seeded rows: %s\n' "$(bash scripts/db-seed.sh --fingerprint | paste -sd, - | sed 's/,/, /g')"



