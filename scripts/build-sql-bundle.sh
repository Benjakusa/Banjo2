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
# The bundle is generated, never hand-edited. Re-run this script after adding
# a migration so the paste-ready file cannot drift.
#
set -uo pipefail

cd "$(dirname "$0")/.." || exit 2

OUT="supabase/banjo-full-schema.sql"
MIGRATIONS=(supabase/migrations/*.sql)

if [ ! -e "${MIGRATIONS[0]}" ]; then
  echo "No migrations found in supabase/migrations/" >&2
  exit 1
fi

{
  echo "-- ============================================================================"
  echo "-- BANJO — complete database schema (GENERATED FILE — do not edit by hand)"
  echo "-- Built by scripts/build-sql-bundle.sh from:"
  echo "--   supabase/migrations/*.sql   (applied in filename order)"
  echo "--   supabase/seed.sql           (reference data)"
  echo "--"
  echo "-- How to apply"
  echo "--   A) Supabase Dashboard > SQL Editor: paste this whole file, Run."
  echo "--      (safe in one transaction; migrations contain no CONCURRENTLY)"
  echo "--   B) psql \"\$DATABASE_URL\" --single-transaction -f supabase/banjo-full-schema.sql"
  echo "--   C) Supabase CLI (preferred for versioned deploys):"
  echo "--      supabase link --project-ref <ref> && supabase db push"
  echo "--"
  echo "-- The tables the React frontend itself writes to are in"
  echo "-- SUPABASE_COPY_PASTE.sql; that file is the smaller, re-runnable path."
  echo "--"
  echo "-- Contents"
  for f in "${MIGRATIONS[@]}" supabase/seed.sql; do
    printf -- '--   %s\n' "$(basename "$f")"
  done
  echo "-- ============================================================================"
  echo

  for f in "${MIGRATIONS[@]}" supabase/seed.sql; do
    echo
    echo "-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
    echo "-- >>> $(basename "$f")"
    echo "-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
    echo
    cat "$f"
  done
} > "$OUT" || exit 1

echo "Wrote $OUT ($(wc -l < "$OUT") lines from ${#MIGRATIONS[@]} migrations + seed)"
