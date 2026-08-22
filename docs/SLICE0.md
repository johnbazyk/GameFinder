# Slice 0 — Production Postgres + auth the family owns

Status of the survivability slice from `GAMEFINDER_FAMILY_PLATFORM.md` §10.
Goal: family scores live in Supabase Postgres, auth runs on infrastructure the
family owns, and restarting Netlify does not wipe the ledger.

## What is done

- **Supabase project** `gamefinder` (ref `gposxgncsktonuhlgbpg`, us-east-1,
  Postgres 17) in the CMD Secure org. This is the system of record.
- **Migrations 0001–0003** (Better Auth tables, social layer, mini-games +
  family_scores) applied to that project, byte-identical to the sandbox files.
  They live in `migrations/` in this repo — the contract. Additive only; never
  rewrite 0001–0003.
- **0004_rls.sql** — RLS enabled on every family table with **no policies**:
  Option A from the brief. The app reaches Postgres only server-side via
  `DATABASE_URL` (table owner, bypasses RLS); the Supabase anon key is denied
  by default and must never be used for game data.
- **Netlify env** on `gamefinderapp` (site `48dfbaaa-1fab-482f-96e3-979b8026ab3e`):
  `BETTER_AUTH_SECRET` (generated, stored as secret), `BETTER_AUTH_URL`,
  `VITE_AUTH_ENABLED=true`.

## Blocked — needs one manual step each

1. **Export the app code from Grok Build to this repo.** `main` still holds the
   pre-Grok chat prototype. The TanStack Start app (wizard, Bank, boards,
   scoring) exists only in the Grok sandbox; the audit pack's dumps are
   intentionally incomplete (`catalog.ts`, `scorecards.ts` truncated), so it
   cannot be reconstructed here without rewriting — which the brief forbids.
   Push the sandbox workspace to a branch of `johnbazyk/GameFinder`; slices 1–3
   (score events, notifications, joinable Bank) start the moment it lands.
2. **`DATABASE_URL` on Netlify.** Needs the database password, which only the
   dashboard can issue. Supabase Dashboard → project `gamefinder` → Connect →
   **Transaction pooler** (port 6543), then set it on Netlify as a secret:

   ```
   DATABASE_URL=postgresql://postgres.gposxgncsktonuhlgbpg:<DB_PASSWORD>@<pooler-host>:6543/postgres?pgbouncer=true
   ```

   Use the **direct** URI (port 5432, host `db.gposxgncsktonuhlgbpg.supabase.co`)
   only for running migrations.

## Decisions (per brief §17, defaults taken)

1. Production domain: `https://gamefinderapp.netlify.app` (existing Netlify site).
2. Auth: email + password this week; Google later.
3. Notifications: in-app inbox first, Web Push via outbox — Slice 2.
4. Scoring: **N = `playerIds.length` including bots, unchanged.** Frozen.

Note on numbering: RLS took `0004`, so notifications become
`migrations/0005_notifications.sql` and presence `0006` (or one file).

## Exit criterion

Sign in with email/password on production, create a group, play Bank vs Finn to
the end, see the `family_scores` row — then redeploy Netlify and confirm the row
is still there.
