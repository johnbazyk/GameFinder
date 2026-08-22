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
- Schema contract: `migrations/` (additive only)

## Develop

```sh
npm install
npm run dev        # http://localhost:8080, PGLite, auth against local DB
npm run typecheck
npm test
```

## Deploy

Merges to `main` build on Netlify via `netlify.toml` (nitro `netlify` preset,
publish `dist`, Node 22). Required env: `DATABASE_URL`, `BETTER_AUTH_URL`,
`BETTER_AUTH_SECRET`, `VITE_AUTH_ENABLED=true`.
