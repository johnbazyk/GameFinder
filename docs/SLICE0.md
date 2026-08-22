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

## Also done (after the Grok export landed)

- **App code merged** from `grok-export` (full TanStack Start app, 144 files,
  complete `catalog.ts`/`scorecards.ts`). The old chat prototype is gone.
- **Production auth gate** (`src/lib/auth/server.ts`): the shared Grok preview
  OAuth client is now used ONLY when `DATABASE_URL` is unset (sandbox/local).
  With a real database: email/password is the sign-in method, an explicit
  per-app `GROK_AUTH_*` client is still honored, and startup **throws** if
  `BETTER_AUTH_SECRET` is missing (fail closed).
- **Login page** hides the Google/X broker buttons outside `*.grok-sandbox.com`
  (they'd dead-end against the preview client's callback allowlist);
  `VITE_GROK_AUTH_ENABLED=true` re-enables them for a real broker client.
- **Netlify build**: nitro preset switches to `netlify` when Netlify's build env
  is present (`vite.config.ts`); `netlify.toml` publishes `dist`, Node 22.
  Validated locally: typecheck clean, `NETLIFY=1 npm run build` green.
- **`DATABASE_URL`** set on Netlify by the owner (secret). The project's shared
  Transaction pooler is `aws-0-us-east-1.pooler.supabase.com:6543` with user
  `postgres.gposxgncsktonuhlgbpg` — the first deploy failed with
  "(ENOTFOUND) tenant/user … not found" because the URL pointed at the `aws-1`
  cluster. Do not use the "Dedicated pooler" (`db.<ref>.supabase.co:6543`)
  from Netlify: that host is IPv6-only and Netlify egress is IPv4. If a deploy
  ever logs a TLS error from `pg`, append `?sslmode=require`.
- Known pre-existing: 14 sandbox-scaffolding test failures
  (`grok-pwa-plugin.test.mjs`, `check-auth-invariant.test.mjs`) — they expect
  the sandbox's `.grok/` env files, which are deliberately not exported.
  Identical failures on the pristine `grok-export` commit; app tests pass.

## Decisions (per brief §17, defaults taken)

1. Production domain: `https://gamefinderapp.netlify.app` (existing Netlify site).
2. Auth: email + password this week; Google later.
3. Notifications: in-app inbox first, Web Push via outbox — Slice 2.
4. Scoring: **N = `playerIds.length` including bots, unchanged.** Frozen.

Note on numbering: RLS took `0004`, so notifications become
`migrations/0005_notifications.sql` and presence `0006` (or one file).

## Environment (final)

The Netlify site carries exactly four variables: `DATABASE_URL` (secret,
uppercase — a lowercase `database_url` silently no-ops, the app reads
`process.env.DATABASE_URL`), `BETTER_AUTH_SECRET` (secret), `BETTER_AUTH_URL`,
`VITE_AUTH_ENABLED`. All old chat-app variables are deleted. Proof the app
really reached Postgres: the `_migrations` table exists in Supabase — a green
build alone does not prove it, because the migrate step skips cleanly when
`DATABASE_URL` is absent.

## Exit criterion

Sign in with email/password on production, create a group, play Bank vs Finn to
the end, see the `family_scores` row — then redeploy Netlify and confirm the row
is still there.
