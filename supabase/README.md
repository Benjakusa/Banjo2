# Banjo — database scripts

Everything the frontend needs, and everything the archive is designed to grow into,
lives in this folder. Two paths exist on purpose: a small re-runnable file for the
three tables the React app writes to today, and the full versioned schema.

## Which file do I run?

| Goal | File | How |
| --- | --- | --- |
| Get sign-in-independent contribution flows working **now** | [`../SUPABASE_COPY_PASTE.sql`](../SUPABASE_COPY_PASTE.sql) | Paste into Dashboard → SQL Editor → Run. Re-runnable. |
| Stand up the whole archive schema | [`banjo-full-schema.sql`](banjo-full-schema.sql) — all 24 migrations + seed concatenated | Paste into SQL Editor, or `psql "$DATABASE_URL" --single-transaction -f supabase/banjo-full-schema.sql` |
| Versioned deploys / CI | [`migrations/`](migrations/) | `supabase link --project-ref <ref> && supabase db push` |

`banjo-full-schema.sql` is **generated** — never edit it. Rebuild after adding a
migration with `npm run sql:bundle` (`scripts/build-sql-bundle.sh`).

## What the React app actually touches

`src/context/BanjoContext.tsx` only calls three tables, all created by
`SUPABASE_COPY_PASTE.sql`, all with RLS open to the `anon` key (public read,
public insert, and update for moderation decisions):

| Table | Written by | Columns the app sends |
| --- | --- | --- |
| `app_submissions` | new-recording + edit submissions, moderation decisions | `id, type, title, contributor_name, contributor_email, priority, status, proposed_data, sources_provided`; updates `status, review_notes` |
| `app_audit_logs` | every approve/reject/copyright decision | `id, who, action, target, timestamp, notes` |
| `app_copyright_cases` | "report a problem" + rights console | `id, recording_id, recording_title, artist_or_band, claimant_name, claimant_email, claim_type, status, filed_date, summary`; updates `status` |

The rest of the schema (people, songs, recordings, rights, media jobs, RLS on
162 policies) is the archival model the app will progressively adopt.

## Migration inventory

| # | File | Contents |
| --- | --- | --- |
| 0001 | `0001_extensions_schemas_enums.sql` | pgcrypto / pg_trgm / unaccent, `private` schema, all enumerated types |
| 0002 | `0002_private_helpers_and_trigger_functions.sql` | private helpers used by every RLS policy + shared trigger functions |
| 0003 | `0003_vocabulary.sql` | vocabulary tables (countries, languages, instruments, genres…) |
| 0004 | `0004_people_and_groups.sql` | people and groups |
| 0005 | `0005_music_core.sql` | songs, recordings, albums, credits |
| 0006 | `0006_history_events_timelines.sql` | history articles, timelines, events |
| 0007 | `0007_sources_citations_interviews.sql` | sources, citations, oral-history interviews |
| 0008 | `0008_documents_photographs_ai_extractions.sql` | documents, photographs, AI extractions |
| 0009 | `0009_identity_roles_permissions.sql` | profiles, roles, permissions |
| 0010 | `0010_submissions_edits_revisions.sql` | contributions, revisions, review flow |
| 0011 | `0011_reports_and_moderation.sql` | reports and moderation |
| 0012 | `0012_rights_holders_and_recording_rights.sql` | rights holders, per-recording rights |
| 0013 | `0013_rights_events_claims_takedowns.sql` | rights events, claims, takedowns |
| 0014 | `0014_media_jobs_deduplication.sql` | media files, processing jobs, dedup |
| 0015 | `0015_community_library_notifications.sql` | bookmarks, library, notifications |
| 0016 | `0016_deferred_foreign_keys.sql` | deferred FK constraints |
| 0017 | `0017_audit_security_and_ops.sql` | audit log, security and ops tables |
| 0018 | `0018_functions_and_triggers.sql` | integrity functions and triggers |
| 0019 | `0019_views.sql` | 9 client-facing views (`security_invoker = true`) |
| 0020 | `0020_rls_enablement_and_policies.sql` | RLS enablement + headline policy set |
| 0021 | `0021_seed_reference_data.sql` | reference data (countries, languages, genres, instruments, roles, badges, flags) — idempotent |
| 0022 | `0022_rls_supplementary_policies.sql` | policies for the remaining tables |
| 0023 | `0023_private_schema_grants.sql` | `usage` on `private` so RLS read paths can reach the helpers |
| 0024 | `0024_solo_credits_and_lyrics.sql` | solo credit roles, `is_soloist` / `solo_order`, `recording_musician_solos` |
| — | `seed.sql` | Phase 1 reference dataset — D.O. Misiani & Shirati Jazz, Kenyan benga 1970s (one band, end-to-end slice) |

## Verified locally

Every script here was applied to a clean PostgreSQL 14 instance (Supabase's
`auth.users`, `auth.uid()` and the `anon` / `authenticated` / `service_role`
roles stubbed in):

* `migrations/0001` → `0024` apply in order with no errors → **87 tables, 162 policies**.
* `banjo-full-schema.sql` applies as **one transaction** (`--single-transaction`) → same 87/162, seed rows loaded (20 instruments, 26 countries, 17 genres).
* After the reference dataset was swapped to real 1970s benga (D.O. Misiani &
  Shirati Jazz), `seed.sql` was re-verified on a clean instance: it loads in one
  transaction, a second run changes no row counts, the closing
  `update recordings set status = status` re-validates every recording through
  `enforce_rights_before_publish` **without creating a revision** (ADR-04), and as
  role `anon` the draft plus the `rights_unknown` recording stay invisible
  (9 of 11 recordings, 10 songs).
* `SUPABASE_COPY_PASTE.sql` applies **twice** in a row (idempotent) and works on a
  plain Postgres with no Supabase default privileges — the GRANTs are stated explicitly.
* As role `anon`, the exact payloads the app sends insert, select and update
  successfully through the RLS policies on all three `app_*` tables.

Migrations are versioned, not idempotent — run them once, in order, on a fresh
database (`supabase db push` tracks them in `supabase_migrations.schema_migrations`).
Only `SUPABASE_COPY_PASTE.sql`, `0021` and `seed.sql` are safe to re-run.

### Fixes made while verifying

`0024_solo_credits_and_lyrics.sql` could not run at all before this pass:

* `create type extension credit_role_ext as enum (…)` — not valid PostgreSQL.
  Replaced with `alter type credit_role add value if not exists …` for the five
  solo values, which is what the file's own comments describe.
* `where role like 'solo_%'` — `role` is an enum, so it needs `role::text like`.
* `set solo_order = row_number() over (…)` — window functions are not allowed in
  `UPDATE`; the ranking now happens in a subquery that the UPDATE joins to.
