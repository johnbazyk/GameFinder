# Phase 07 local acceptance record

Base: integrated Phase 06 commit 6e93930. This is a stabilization candidate, not public beta or commercial release authorization.

## Verified locally

- TypeScript passed after restoration of the original login implementation and accessibility labels.
- Latest completed full automated suite: 444 cases, 433 passed, 0 failed, 11 PostgreSQL cases skipped. The suite ran before the final login restoration/build configuration corrections; repeat in integration.
- Mobile Chrome acceptance: five pages plus nested dialogs at 320, 390 and 1280 px, 18/18 checks passed. Auth-off disposable local lab; not real iOS/Android or assistive-technology certification.
- Final auth-enabled production-mode node-server build completed. Inline server bundling resolved an invalid generated namespace export; compiled hook packaged three PGlite runtime assets. Health returned HTTP 200 with {"ok":true}; anonymous session endpoint returned HTTP 200. No deployment.
- Final compiled browser test passed: two synthetic authenticated accounts, separate guest shelf, server-acknowledged saves, sign-out and return to first account. Earlier attempts failed due to outdated Vite dependencies, missing bundled assets and an unexpected login placeholder (restored from Phase 06). Server logs include aborted HTTP connections during navigation; browser assertions passed, root cause of aborted connections not established.
- Public health and auth error redaction; verified database TLS; no insecure remote fallback; account read/write identity checks; external scanner off by default, with explicit approval and per-session consent if later enabled. Existing provider retention/rights must still be independently verified.
- Local disposable PostgreSQL runner shell syntax checked; actual execution blocked by missing Docker on Mac. GitHub workflow prepared to execute all 11 real PostgreSQL 16 tests, including a server restart. Do not interpret skipped cases as passes.

## Integration and release gates

Push candidate branch only; GitHub Actions must complete PostgreSQL verification before final stabilization acceptance. The workflow creates and removes an isolated labeled loopback PostgreSQL container; no production credentials are needed. A failing job requires investigation and correction, not weakening assertions. If Actions is unavailable, use the same runner in a Docker-enabled Codespace. This suite exercises catalog staging, not all production runtime migration/billing/auth integration paths.

Netlify preset output and deployed runtime are not verified by the local node-server build. Stage on a separate persistent DB with verified TLS and appropriate CA; validate schema/migrations, real multi-browser/offline behavior, real devices, rights, privacy/terms, support, backups and billing acceptance per RELEASE_GATES.md. No migration, public registration, provider activation, deployment or payment is authorized. Restricted adult beta scope remains a proposal subject to owner approval. Existing approved pricing, Vault policy, ratings rubric and Vibes unchanged.
