# Rating standard 0.3 beta implementation

This branch adds an explicitly enabled rating path. Default deployments retain the legacy path until opted in; legacy estimates are labeled separately and are not converted to canonical ratings. No BGG provider or commercial permission is enabled.

## Run in Codespaces

```bash
npm ci
npm run dev:ratings:beta
```

Open the forwarded port 8080. For a deployed preview use `npm run build:ratings:beta` or set `VITE_GAMEFINDER_RATINGS_MODE=beta` at build time. `reviewed` enables the reviewed-only path; omitted configuration retains the legacy application. Never use a server-only runtime flag to assume a prebuilt browser bundle changed mode.

## First smoke checks

- Find: 2 players, ages 8–10, maximum 15 minutes, Family + Strategy + Spatial Play → the scoped Connect Four proposal qualifies. If it is owned it appears in the owned pool; otherwise the unowned pool.
- Find: 3 players, ages 8–10, maximum 30 minutes, Family + Dexterity + Party → the scoped Jenga proposal qualifies.
- The same requests in reviewed mode have no matching reviewed pilot ratings.
- Add an incompatible vibe or change to an unsupported player/age context: no silent fallback.
- Open a result: profile context comes from that result, shows 1–5 and Provisional, names the assessed edition and provides source links. Missing dimensions produce a list rather than a fabricated radar polygon.
- Advanced filters retain premium gating; Range, At least and Exactly have explicit operators. Existing saved exact targets preserve equality. Invalid targets yield no match; no widening.
- After play, submit feedback on the game page. It stays in browser storage (latest 200 entries), can be exported, and never writes into rating records. No server collection or automatic beta-team transmission is implemented.

## Architecture and limitations

- `rating-anchors-03.ts` contains all 99 anchors (11 distinct constructs × 9 levels), transcribed from the authorized standard. Luck and Strategy use one key each across dimensions/vibes.
- `rating-policy.ts` resolves scope, evidence, version, status and explicit beta eligibility, then applies AND semantics. Source/identity authorization remains independent of scoring. This validation does not prove the truth of source claims.
- `rating-pilot.ts` contains only Connect Four (Hasbro classic drop-only, two players) and Jenga (Hasbro 2000, three players). The mapping names the edition being assessed; it does not identify a user's physical copy. Users must confirm edition/mode. The `gf:beta-pilot:*` IDs are temporary, not permanent published identities. Sources are independent rules; existing catalog keys are retained for collections.
- Family has separate 8–10 estimates for those two scopes. Other ages and unassessed titles remain unknown. No Under 6 Family estimate is supplied because that UI band lacks an explicit lower bound.
- Legacy age, time and player checks remain in front of rating checks, including the reviewed-facts adapter. This change does not certify the entire legacy metadata catalog. Pilot scope narrows the players supported by its ratings; no selected vibes requires no rating package.
- Ranking uses stable seeded variety within separate owned/unowned pools. The wizard creates a session seed; rerolls retain it and exclude previous IDs. There is no popularity, score-average or ownership bonus. An evidenced best-player-count preference is deferred because the pilot lacks reviewed best-count provenance.
- Historical `rating-standards.ts` and `catalog-rating-gate.ts` remain the old synthetic publication boundary; they are not the 0.3 application resolver. Their intentionally unapproved fixtures are not auto-promoted. A future published-catalog adapter must explicitly adopt 0.3; this branch does not loosen provider/artwork gates.
- The physical-board component tag is documented in the standard but not yet populated or displayed. Spatial Play uses the existing `board` key; it is not inferred from components.
- This is a two-title beta implementation, not import of all 25 proposals, not human validation, and not a public deployment. No automated review promotion or feedback-based score averaging is implemented.

## Verification

```bash
npm run typecheck
npm run test:ratings
node --test scripts/rating-profile-render.test.mjs
node --test --test-concurrency=1 'scripts/**/*.test.mjs'
npm run build:ratings:beta
```

`rating-beta-browser.mjs` is an interactive smoke test using Playwright and a Chromium executable; set CHROMIUM_PATH if needed. In this execution environment Chromium could not launch because Unix socket creation was prohibited. Server-render assertions check scoped values/labels and missing-data display, but are not a replacement for browser interaction or visual QA. Review the Codespace preview before merging.

## Recorded validation for this branch

TypeScript and beta production build passed. The final focused run passed 47 tests (including 14 policy tests and one profile-render test). A broader suite run identified two stale label expectations, now corrected and rerun, plus 14 unrelated failures. Those same 14 failures were reproduced on the unchanged parent checkpoint in auth-environment, Grok PWA metadata and migration-layout tests (71 baseline tests: 57 pass, 14 fail). Eleven PostgreSQL integration cases were skipped without a configured test database. The full suite is not green. Browser interaction remains unverified because Chromium socket creation was denied in this environment.
