# GameFinder release gate register — Phase 07

Baseline: integrated Phase 06 commit 6e93930. This register is an operational proposal, not owner approval to release. A passing automated suite is not a launch authorization.

## Release stages

| Stage | Permitted scope | Required exit evidence |
|---|---|---|
| Local lab | Disposable fixtures, no real accounts, no paid provider | Typecheck, regression, isolated browser flows |
| Private staging | Owner-controlled staging DB and test accounts only | Verified TLS, migrations, authenticated isolation, recovery and production build acceptance |
| Restricted invited beta | Consenting adult testers; only cleared content and features | Rights and privacy review, support and deletion process, device acceptance, owner sign-off |
| Commercial release | Public use and paid plans | All critical gates below closed, live provider approvals, billing test-mode acceptance, production rollback rehearsed, explicit owner authorization |

Do not promote a build based solely on a local test pass. Public URLs, registration and paid providers are not activated by this document.

## Gate register

| ID | Requirement | Status | Closure evidence |
|---|---|---|---|
| SEC-01 | Verified remote DB TLS; no process-wide disable | Code corrected; staging open | Successful TLS-verified staging connection and migration; trusted provider CA if needed |
| SEC-02 | Public diagnostics and exception redaction | Targeted tests passed | Deployed health returns only readiness; production error and auth failure paths inspected |
| SEC-03 | Production auth, no shared dev account or embedded persistence | Preflight added; staging open | Explicit auth configuration, persistent DB, successful real session and anonymous denial |
| DATA-01 | Account isolation, cross-tab, stale requests, offline edits | Two-account local compiled browser passed; staging open | Two authenticated test accounts, signed-out transitions, delayed responses, offline recovery and no cross-account writes |
| DATA-02 | Guest and local archives, export, deletion, retention | Open | Owner-approved transfer and recovery, account deletion/export process, device retention disclosure |
| PRIV-01 | Photo recognition privacy | Local default implemented; provider approval open | No image transmission on default path; explicit opt-in; provider retention and rights verified before external activation |
| PRIV-02 | AI text/audio and cost controls | Open | Retention review, explicit disclosure, quotas, abuse controls, microphone acceptance |
| PRIV-03 | Privacy terms, age policy, support and incident response | Open | Approved published notices and operational procedures; jurisdiction-specific legal review |
| CAT-01 | Provider rights and catalog source/edition accuracy | Open | BGG written approval and field permissions, edition evidence, verified metadata, conflict resolution |
| CAT-02 | Ratings calibration and child suitability | Open | Human review and approved field/edition-scoped eligibility policy; no unverified claims marketed as guarantees |
| CAT-03 | Artwork, guide and audio rights | Open | Clearance for each published asset and usage; remove or replace uncleared material before external beta |
| FINN-01 | Rule accuracy and edition support | Open | Independent review of guides/recordings, authorized retrieval if used, clear uncertainty and safe fallback |
| BILL-01 | Checkout, renewal, cancellation and portal | Locked | Test-mode end-to-end enrollment including abandoned redirects, deduplication, resubscribe, refunds/disputes and verified API contracts |
| BILL-02 | Commercial activation | Locked | Separate explicit owner approval after BILL-01, production pricing, tax, customer support and cancellation review |
| QA-01 | Mobile/browser/accessibility and actual photo acceptance | Local Chrome 18/18 passed; device testing open | iOS Safari, Android Chrome, desktop, keyboard and assistive technology checks; real shelf photos with consent |
| OPS-01 | Staging migration, backup, restore, rollback | Open | Disposable Postgres integration suite, backup and restore rehearsal, release candidate hash and owner approval |
| OPS-02 | Observability and support | Open | Redacted errors, alert response, support owner/channel, severity triage and incident drill |

Catalog details are maintained in docs/catalog-and-content-rights.md and docs/catalog-verification/. Billing requirements are maintained in docs/billing-account-lifecycle.md. Finn requirements are maintained in docs/finn-voice-coach.md. Existing rubric, Vibes, pricing and Vault limits remain unchanged.

## Go/no-go

An unresolved critical security, identity, data loss, privacy, content-rights, child-suitability or payment defect is a no-go for the affected external release scope. Disabling a feature is acceptable only if it also blocks its backend, its public claims accurately reflect availability, and the owner accepts the reduced scope. No external beta invitation until approved scope and closure evidence are recorded.
