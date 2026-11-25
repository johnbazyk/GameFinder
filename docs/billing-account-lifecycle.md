# Phase 06 — Billing and account lifecycle stabilization

Base: dd5f339 (integrated Phase 05). Pricing remains USD 4.99 monthly and 44.99 annually. Free Vault limit remains 50; existing over-limit collections survive downgrade. No purchase activation or production migration is authorized by this package.

## Implementation

- Device-local account shelves, play history and custom games are partitioned on account change. Guest and legacy unassigned shelves are preserved separately rather than automatically attributed to a signed-in user.
- Vault writes verify expected authenticated identity; use a persisted cloud baseline, transactional delta merge and serialized client requests. Catalog writes also verify expected account. Existing capacity restrictions and rollback are preserved.
- Managed subscription records override legacy manually granted plan flags, including paid-through expiry and cancellation. Legacy accounts without a billing record retain existing behavior. Premium UI periodically refreshes and server authorization remains authoritative.
- Additive migration 0007 adds a unique account/customer/subscription ledger and webhook receipts with row level security. Apply migration before deploying code against an existing Postgres database.
- Stripe HMAC verification uses raw payload, bounded timestamp tolerance and timing-safe comparison. Event reconciliation retrieves current subscription and invoice evidence, deduplicates receipts transactionally, and rejects unrelated or unbound identities.
- Checkout confirmation code uses the ledger rather than a permanent plan write. Portal code resolves customer from authenticated account only. Both remain hard-disabled. Webhook has separate explicit test-only configuration gate; live mode is rejected. No actual Stripe requests or charges were made.

## Verification

TypeScript passed. Full automated suite: 434 tests, 423 passed, zero failed, 11 skipped (external PostgreSQL). Local disabled webhook HTTP response: 503 as intended. Chrome at 390 x 844: scripts/subscription-lab-browser.mjs passed all assertions, including pricing, Free/Premium feature gates, advertising, 51st game, and downgrade preservation. First browser run was interrupted by Vite optimizer reload; warmed rerun passed (exit 0). Lab uses disposable auth-off account, embedded database, no Stripe or AI credentials. Not equivalent to authenticated multi-account or live provider acceptance.

## Release blockers / decisions not to infer from passing tests

- Checkout and portal stay disabled; do not flip the constant merely because tests passed. End-to-end Stripe test-mode enrollment, portal configuration, webhook delivery, idempotent checkout session creation, duplicate subscription prevention, initial enrollment independent of browser redirect, resubscription/replacement, refund/dispute handling, API-version contract and verified price/amount policy still require dedicated acceptance. Live activation requires explicit approval. Current one-binding ledger deliberately rejects replacement identity. The receipt/ledger tests simulate provider data; they do not certify Stripe API behavior.
- Existing local shelves with unknown ownership are preserved in the guest slot. No explicit guest-to-account transfer/recovery interface is provided yet. Local archives are not encrypted; account switching isolates normal UI state, not access by someone inspecting the same browser storage. Authenticated account switching, cross-tab races, offline reconnect, delayed requests, hydration/session transitions and unsynced custom-catalog recovery need real browser acceptance. Local history partitioning is not cloud history backup.
- PostgreSQL integration was skipped; migrate and test a disposable staging database before any production deployment. No production database changes or payments were made. No claim of launch readiness.
