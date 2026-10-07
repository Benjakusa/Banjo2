#!/usr/bin/env bash
#
# SQL bundle builder for Banjo.
#
# supabase/migrations/*.sql are applied in filename order; that is the
# authoritative, versioned path (Supabase CLI, or by hand in the dashboard).
# This script also produces one paste-ready file for people who just want the
# whole schema in the SQL Editor in a single pass:
#
#   supabase/banjo-full-schema.sql   = every migration (in order) + seed.sql
#
# Pass --with-seed to append the development reference dataset
# (supabase/seed.sql) — anything you paste into a live project should not
# contain demo rows, so that is not the default:
#
#   npm run sql:bundle -- --with-seed     # development dataset included
#   npm run sql:bundle                    # clean schema, no demo rows
#
# The bundle is generated, never hand-edited. Re-run this script after adding
# a migration so the paste-ready file cannot drift.
#
set -uo pipefail

cd "$(dirname "$0")/.." || exit 2

OUT="supabase/banjo-full-schema.sql"
MIGRATIONS=(supabase/migrations/*.sql)

INCLUDE_SEED=0
case "${1:-}" in
  --with-seed) INCLUDE_SEED=1 ;;
  --no-seed)   INCLUDE_SEED=0 ;;
  '')          ;;
  *) echo "build-sql-bundle: unknown option $1 (try --with-seed)" >&2; exit 2 ;;
esac

FILES=("${MIGRATIONS[@]}")
if [ "$INCLUDE_SEED" -eq 1 ]; then
  FILES+=(supabase/seed.sql)
fi

if [ ! -e "${MIGRATIONS[0]}" ]; then
  echo "No migrations found in supabase/migrations/" >&2
  exit 1
fi

{
  echo "-- ============================================================================"
  echo "-- BANJO — complete database schema (GENERATED FILE — do not edit by hand)"
  echo "-- Built by scripts/build-sql-bundle.sh from:"
  echo "--   supabase/migrations/*.sql   (applied in filename order)"
  if [ "$INCLUDE_SEED" -eq 1 ]; then
    echo "--   supabase/seed.sql           (Phase 1 development dataset: demo"
    echo "--                               accounts and demo recordings)"
  else
    echo "--   (no seed.sql: a clean schema, no demo accounts, no demo rows)"
  fi
  echo "--"
  echo "-- How to apply"
  echo "--   A) Supabase Dashboard > SQL Editor: paste this whole file, Run."
  echo "--      (safe in one transaction; migrations contain no CONCURRENTLY)"
  echo "--   B) psql \"\$DATABASE_URL\" --single-transaction -f supabase/banjo-full-schema.sql"
  echo "--   C) Supabase CLI (preferred for versioned deploys):"
  echo "--      supabase link --project-ref <ref> && supabase db push"
  echo "--"
  echo "-- Rebuild with --with-seed only for local development work."
  echo "--"
  echo "-- The tables the React frontend itself reads and writes are created by"
  echo "-- SUPABASE_COPY_PASTE.sql; that file is the smaller, re-runnable path."
  echo "--"
  echo "-- Contents"
  for f in "${FILES[@]}"; do
    printf -- '--   %s\n' "$(basename "$f")"
  done
  echo "-- ============================================================================"
  echo

  for f in "${FILES[@]}"; do
    echo
    echo "-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
    echo "-- >>> $(basename "$f")"
    echo "-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
    echo
    cat "$f"
  done
} > "$OUT" || exit 1

if [ "$INCLUDE_SEED" -eq 1 ]; then
  echo "Wrote $OUT ($(wc -l < "$OUT") lines from ${#MIGRATIONS[@]} migrations + seed)"
else
  echo "Wrote $OUT ($(wc -l < "$OUT") lines from ${#MIGRATIONS[@]} migrations, no seed)"
fi
