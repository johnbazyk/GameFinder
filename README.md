# GameFinder

A warm, family-focused board-game companion: a "what should we play tonight?"
wizard for guests, and for signed-in families — shared tables, in-app
mini-games (Bank, Connect Four, Checkers, Chess, Tic-Tac-Toe), and a lifetime
family scoreboard (+N to the winner, N = seats at the table).

Built with TanStack Start, React 19, Tailwind v4, and Better Auth.
Production runs on Netlify with Supabase Postgres as the system of record;
local dev falls back to embedded PGLite when `DATABASE_URL` is unset.

- Product brief: `GAMEFINDER_FAMILY_PLATFORM.md`
- Infrastructure runbook: `docs/SLICE0.md`
- Catalog and content-rights plan: `docs/catalog-and-content-rights.md`
- Schema contract: `migrations/` (additive only)

## Develop

```sh
npm install
npm run dev        # http://localhost:8080, PGLite, auth against local DB
npm run typecheck
npm test
```

Apply additive database migrations to the configured production database with
`npm run db:migrate` before deploying code that uses the new schema.

## Deploy

Merges to `main` build on Netlify via `netlify.toml` (nitro `netlify` preset,
publish `dist`, Node 22). Required env: `DATABASE_URL`, `BETTER_AUTH_URL`,
`BETTER_AUTH_SECRET`, `VITE_AUTH_ENABLED=true`.

## Shared beta workspace

Use the johnbazyk/GameFinder repository and the `codex/rating-standard-03-beta` branch for beta edits and review. Open that branch in one Codespace. In its terminal, use `git status -sb` to confirm the branch, then `npm run dev` for the preview. Commit and push source changes to the beta branch. Review its pull request against the default branch before releasing.

Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build` before release. With port 8080 free and Chromium installed, run `node scripts/rating-beta-browser.mjs` for a mobile Find and Vault check. Set CHROMIUM_PATH if Chromium is installed elsewhere.
