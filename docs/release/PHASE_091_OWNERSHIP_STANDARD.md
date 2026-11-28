# GameFinder ownership and recommendation governing standard — Phase 09.1

Owner-approved product policy (2026-11-27).

- Vault: explicitly confirmed owned games only. No automatic starter collection.
- Wishlist: desired unowned games only; owned status wins conflicts. Acquiring a wishlisted game removes it from Wishlist. Removing ownership does not automatically wishlist it. Never delete existing owned titles just because they could have originated from an earlier starter shelf.
- Featured: up to three unowned curated games; stable weekly rotation, replace when acquired. Wishlist remains eligible. Curated popularity pool is provisional pending Phase 11 validation.
- Discover: up to three unowned eligible games after filters, including separately labeled fallback alternatives. Preserve hard constraints, exact targets and no forced results.
- Similar Games: up to three unowned games ranked by Phase 09 similarity policy; reference game may be owned or unowned. Exclude the reference, ambiguous identities and missing required assessments.
- Find: up to three owned plus three unowned, preserving existing hard-filter and reroll rules.
- Surprise Me: one owned game.
- Manual catalog search and explicit Browse All are retrieval, not recommendations: retain all matching games, owned or unowned. Changing a filter returns to recommendation mode.
- Ownership eligibility precedes ranking/selection; affiliate compensation must not influence rankings.
- Normalize local persistence, account synchronization and database writes; enforce one collection state per account/game at the database level. Migration 0008 removes conflicting wishlist rows only, then adds unique index. No production migration authorized by this phase.

Phase 09.1 candidate tests: 19 targeted tests passed (8 new). Full regression/build and browser acceptance recorded separately after execution. Weekly rotation cadence is an implementation default, not a popularity validation. Scanner, rubric, monetization, voice and advertising architecture unchanged.

Verification complete locally: TypeScript passed; full standard suite 455 passed, zero failures, 11 PostgreSQL tests skipped pending CI; beta production build passed. Dedicated browser suite ALL PASS (five scenarios covering starter shelf removal, acquisition replacement, Wishlist transfer, filtered Discover versus explicit retrieval, Similar Games replacement). Migration verified on disposable PGlite. Owner acceptance and integrated GitHub PostgreSQL checks pending. Production migration not executed.
