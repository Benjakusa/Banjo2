# Banjo — database scripts

Everything the frontend needs, and everything the archive is designed to grow into,
lives in this folder. Two paths exist on purpose: a small re-runnable file for the
tables the React app reads and writes today, and the full versioned schema.

## Which file do I run?

| Goal | File | How |
| --- | --- | --- |
| Get contribution flows, per-account profiles and the live catalogue working **now** | [`../SUPABASE_COPY_PASTE.sql`](../SUPABASE_COPY_PASTE.sql) | Paste into Dashboard → SQL Editor → Run. Re-runnable. |
| Enable audio uploads | [`media-storage.sql`](media-storage.sql) | Run after `SUPABASE_COPY_PASTE.sql` in Supabase SQL Editor. New audio is published immediately after the contributor selects a rights declaration; legacy pending-review files remain private. |
| Stand up the whole archive schema | [`banjo-full-schema.sql`](banjo-full-schema.sql) — all 25 migrations concatenated, **no demo rows** | Paste into SQL Editor, or `psql "$DATABASE_URL" --single-transaction -f supabase/banjo-full-schema.sql` |
| Versioned deploys / CI | [`migrations/`](migrations/) | `supabase link --project-ref <ref> && supabase db push` |

`banjo-full-schema.sql` is **generated** — never edit it. Rebuild after adding a
migration with `npm run sql:bundle` (`scripts/build-sql-bundle.sh`). The bundle is
built **without** `seed.sql`, so a demo account can never end up in a live project;
`npm run sql:bundle -- --with-seed` appends the Phase 1 development dataset for
local work only.

## What the React app actually touches

`src/lib/archiveRepo.ts` (used by `src/context/BanjoContext.tsx`) reads and writes
the six tables created by `SUPABASE_COPY_PASTE.sql`:

| Table | Used for | RLS |
| --- | --- | --- |
| `app_archive_items` | the whole catalogue: recordings, songs, musicians, bands, albums, oral histories, documents — one JSONB payload per entity | public read; signed-in authors can update their own items; archivists can update or delete any item |
| `app_profiles` | one private profile per account, primary key = account id, so two accounts can never share a row | owner only; owners cannot edit their role, verification status or moderation counters |
| `app_submissions` | edit suggestions, legacy recording submissions, moderation decisions | contributors can read their own; archivists and moderators can review all; only staff can decide |
| `app_audit_logs` | an entry for every approve/reject/copyright decision | staff only; no public report inserts |
| `app_problem_reports` | public archive issue reports | anyone may file; designated staff can read |
| `app_copyright_cases` | copyright reports + rights console | anyone may file; rights staff can read and resolve |

Nothing is seeded: a new project starts with an empty catalogue and no accounts.
The publisher's own data — including profiles — is created by real accounts as
people sign up and contribute. Staff roles must be provisioned by an administrator
through a trusted database operation; the client cannot grant itself staff access.
The upload flow requires the Supabase storage buckets and policies in `media-storage.sql`;
it is intentionally unavailable in local/offline mode. New recording submissions are
published directly to the catalogue and public audio bucket after a contributor selects
a rights declaration; they do not wait for archivist approval. This means uploaded audio
is publicly accessible immediately, so enable the flow only if that is acceptable for
your archive and rights process. Older audio in `banjo-pending-audio` remains private.

The full schema (people, songs, recordings, rights, media jobs, 164 policies) is
the archival model the app will progressively adopt; it is **not** required for the
app to run.

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
| 0025 | `0025_api_privileges_and_profile_self_service.sql` | table privileges for the API roles, and owner-only profile read/write policies (idempotent) |
| — | `seed.sql` | Phase 1 reference dataset — D.O. Misiani & Shirati Jazz, Kenyan benga 1970s (one band, end-to-end slice). Development only; not part of the generated bundle |

## Verified locally

Every script here was applied to a clean PostgreSQL 14 instance (Supabase's
`auth.users`, `auth.uid()` and the `anon` / `authenticated` / `service_role`
roles stubbed in):

* `migrations/0001` → `0025` apply in order with no errors → **87 tables, 164 policies**.
* `banjo-full-schema.sql` (the generated bundle, built **without** `seed.sql`)
  applies as **one transaction** (`--single-transaction`) → same 87/164, with zero
  profiles, songs, recordings, bands or people; the reference vocabulary still
  loads with the schema (26 countries, 17 genres, 10 roles, 23 permissions).
* `0025` re-applies cleanly on top of the full schema (every policy is dropped
  before it is created), and it repairs the two states a database can be in:
  a legacy `profiles_select_all` public-read policy on `profiles` is dropped, and
  accounts whose trigger-created profile row is missing can create their own.
* Profile isolation, re-run on both a legacy database repaired with `0025` and a
  clean bundle install, as roles `anon` / `authenticated`:
  two accounts (`auth.uid()` stubbed per request) each see exactly **one**
  `app_profiles` row — their own; inserting a second row for the same account
  fails on the primary key; inserting, updating or deleting another account's row
  is refused (RLS error, `UPDATE 0`, `DELETE 0`); `anon` cannot read either
  `app_profiles` or `profiles` (0 rows) and cannot write the catalogue, the
  moderation queue or the audit trail; `anon` *can* read the catalogue and *file*
  a rights report; signed-in authors can update their own catalogue rows, while
  archivist roles can update or delete any row. Submission rows are scoped to
  their contributor except for staff review; public problem reports are stored
  separately and never written into the audit trail.
* After the reference dataset was swapped to real 1970s benga (D.O. Misiani &
  Shirati Jazz), `seed.sql` was re-verified on a clean instance: it loads in one
  transaction, a second run changes no row counts, the closing
  `update recordings set status = status` re-validates every recording through
  `enforce_rights_before_publish` **without creating a revision** (ADR-04), and as
  role `anon` the draft plus the `rights_unknown` recording stay invisible
  (9 of 11 recordings, 10 songs).
* `SUPABASE_COPY_PASTE.sql` applies **twice** in a row (idempotent) and works on a
  plain Postgres with no Supabase default privileges — the GRANTs are stated explicitly.
* As role `anon`, the catalogue is readable and a rights or problem report can be
  filed, while profiles, submissions, audit logs and staff case queues remain
  protected by row policies.

Migrations are versioned, not idempotent — run them once, in order, on a fresh
database (`supabase db push` tracks them in `supabase_migrations.schema_migrations`).
Only `SUPABASE_COPY_PASTE.sql`, `0021` and `seed.sql` are safe to re-run.

## Applying and verifying the seed

`seed.sql` is the Phase 1 reference dataset. Two wrappers make it runnable and
checkable without remembering the `psql` incantations:

| Command | What it does |
| --- | --- |
| `npm run db:seed` | applies `seed.sql` in **one transaction** (`--single-transaction`, `ON_ERROR_STOP`), then prints which row counts changed |
| `npm run db:test` | asserts the dataset is intact: row counts, the `rights_unknown` invariant, the publish guard, the disputed release year, ADR-04 revision hygiene, `anon` visibility, and that a second seed run changes nothing |
| `npm run db:test -- --no-reseed` | the read-only half of the suite: skips the idempotency re-run, its only writer |
| `bash scripts/db-seed.sh --fingerprint` | the census of seeded rows alone, which `db:test` compares around its re-run |

Both resolve their target as `DATABASE_URL` → `BANJO_DB` → `banjo_seed_v2`, so
the database this pass was verified on is the default:

```sh
createdb banjo_seed_v2          # stub auth.* and apply the migrations once, then
npm run db:seed && npm run db:test
```

The census counts only rows whose UUIDs carry the dataset's `-0000-4000-8000-`
marker, so it stays meaningful on a database that also holds unrelated rows. On
the local reference database: `db:test OK  (8 checks)` — 153 seeded rows across
29 tables.

**Seeding is one-way.** Re-running this dataset is a no-op, but an *older*
dataset cannot be upgraded by re-seeding: applying it over the previous
synthetic rows fails loudly (`duplicate key value violates unique constraint
"people_pkey"`, because `people` is matched on `full_name` while `bands`,
`songs` and `recordings` are matched on `id`) and rolls back, leaving the
database untouched. Moving an older database onto this dataset needs a clean
schema.

### Fixes made while verifying

`0024_solo_credits_and_lyrics.sql` could not run at all before this pass:

* `create type extension credit_role_ext as enum (…)` — not valid PostgreSQL.
  Replaced with `alter type credit_role add value if not exists …` for the five
  solo values, which is what the file's own comments describe.
* `where role like 'solo_%'` — `role` is an enum, so it needs `role::text like`.
* `set solo_order = row_number() over (…)` — window functions are not allowed in
  `UPDATE`; the ranking now happens in a subquery that the UPDATE joins to.
