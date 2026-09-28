#!/usr/bin/env bash
#
# Apply supabase/seed.sql to a database.
#
#   npm run db:seed                                            # the local reference DB
#   BANJO_DB=banjo_mine npm run db:seed                        # a different local database
#   DATABASE_URL=postgres://user@host:5432/db npm run db:seed  # any PostgreSQL, including a
#                                                              # hosted project's connection URL
#
# Supabase provides auth.users and auth.uid(); on a bare PostgreSQL install those
# must be stubbed first (supabase/README.md records how the local reference
# database below was built).
#
# The seed is idempotent — every statement is guarded by `where not exists` —
# and its closing `update recordings set status = status` is housekeeping: it
# makes the publish guard re-validate each recording and is expected to create
# no revision at all (ADR-04). Re-running therefore changes nothing.
#
# `--fingerprint` prints the census of seeded rows and exits without writing
# anything; scripts/db-test.sh compares it before and after its idempotency run.
# `--quiet` applies the seed and says nothing unless it fails.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 2

TARGET="${DATABASE_URL:-${BANJO_DB:-banjo_seed_v2}}"
SEED="supabase/seed.sql"

# Every seed id is a UUID containing "-0000-4000-8000-", so counting by that
# marker keeps the census meaningful on a database that also holds other rows.
census() {
  psql "$TARGET" -qtA -v ON_ERROR_STOP=1 <<'SQL'
select relation || '=' || n from (
  select 'accounts'               as relation, count(*) as n from auth.users where email like '%@banjo.test'
  union all select 'user_roles',        count(*) from user_roles ur where exists (
                                          select 1 from auth.users u
                                           where u.id = ur.user_id and u.email like '%@banjo.test')
  union all select 'bands',             count(*) from bands            where id::text           like '%-0000-4000-8000-%'
  union all select 'people',            count(*) from people           where id::text           like '%-0000-4000-8000-%'
  union all select 'band_members',      count(*) from band_members     where band_id::text      like '%-0000-4000-8000-%'
  union all select 'aliases',           count(*) from entity_aliases   where entity_id::text    like '%-0000-4000-8000-%'
  union all select 'songs',             count(*) from songs            where id::text           like '%-0000-4000-8000-%'
  union all select 'song_composers',    count(*) from song_composers   where song_id::text      like '%-0000-4000-8000-%'
  union all select 'recordings',        count(*) from recordings       where id::text           like '%-0000-4000-8000-%'
  union all select 'media_files',       count(*) from media_files      where id::text           like '%-0000-4000-8000-%'
  union all select 'recording_media',   count(*) from recording_media  where recording_id::text like '%-0000-4000-8000-%'
  union all select 'audio_derivatives', count(*) from audio_derivatives where media_file_id::text like '%-0000-4000-8000-%'
  union all select 'rights_holders',    count(*) from rights_holders   where id::text           like '%-0000-4000-8000-%'
  union all select 'recording_rights',  count(*) from recording_rights where recording_id::text like '%-0000-4000-8000-%'
  union all select 'sources',           count(*) from sources          where id::text           like '%-0000-4000-8000-%'
  union all select 'citations',         count(*) from citations        where target_id::text    like '%-0000-4000-8000-%'
  union all select 'field_assertions',  count(*) from field_assertions where entity_id::text    like '%-0000-4000-8000-%'
  union all select 'song_histories',    count(*) from song_histories   where song_id::text      like '%-0000-4000-8000-%'
  union all select 'historical_events', count(*) from historical_events
                                         where song_id::text      like '%-0000-4000-8000-%'
                                            or band_id::text      like '%-0000-4000-8000-%'
                                            or person_id::text    like '%-0000-4000-8000-%'
                                            or recording_id::text like '%-0000-4000-8000-%'
  union all select 'timelines',         count(*) from timelines        where id::text           like '%-0000-4000-8000-%'
  union all select 'timeline_items',    count(*) from timeline_items   where timeline_id::text  like '%-0000-4000-8000-%'
  union all select 'submissions',       count(*) from submissions      where id::text           like '%-0000-4000-8000-%'
  union all select 'submission_items',  count(*) from submission_items where submission_id::text like '%-0000-4000-8000-%'
  union all select 'edits',             count(*) from edits            where target_id::text    like '%-0000-4000-8000-%'
  union all select 'reports',           count(*) from reports          where target_id::text    like '%-0000-4000-8000-%'
  union all select 'bookmarks',         count(*) from bookmarks        where target_id::text    like '%-0000-4000-8000-%'
  union all select 'play_events',       count(*) from play_events      where recording_id::text like '%-0000-4000-8000-%'
  union all select 'job_queue',         count(*) from job_queue        where dedupe_key like '%:seed'
                                                                          or dedupe_key = 'transcode:safari-garissa'
  union all select 'revisions',         count(*) from revisions        where entity_id::text    like '%-0000-4000-8000-%'
) s order by relation;
SQL
}

case "${1:-}" in
  --fingerprint) census; exit $? ;;
  --quiet)       QUIET=1 ;;
  '')            QUIET=0 ;;
  *) echo "db-seed: unknown option $1 (try --fingerprint or --quiet)" >&2; exit 2 ;;
esac

if [ ! -f "$SEED" ]; then
  echo "db-seed: missing $SEED" >&2
  exit 2
fi

if ! psql "$TARGET" -qtc 'select 1' >/dev/null 2>&1; then
  cat >&2 <<'EOF'
db-seed: cannot reach the target database

  Point the script at a database that exists:
    createdb banjo_mine && BANJO_DB=banjo_mine npm run db:seed
    DATABASE_URL=postgres://user@host:5432/db npm run db:seed
EOF
  exit 1
fi

before=$(census) || exit 1

if ! psql "$TARGET" -q -v ON_ERROR_STOP=1 --single-transaction -f "$SEED"; then
  echo "db-seed: FAILED — $SEED was rolled back, $TARGET is unchanged" >&2
  exit 1
fi

after=$(census) || exit 1

if [ "$QUIET" -eq 0 ]; then
  if [ "$before" = "$after" ]; then
    printf 'db-seed: %s — nothing changed (already seeded; the seed is idempotent)\n' "$TARGET"
  else
    printf 'db-seed: %s — rows changed:\n' "$TARGET"
    diff <(printf '%s\n' "$before") <(printf '%s\n' "$after") | sed 's/^/  /'
  fi
  printf '  now: %s\n' "$(printf '%s\n' "$after" | paste -sd, - | sed 's/,/, /g')"
fi

