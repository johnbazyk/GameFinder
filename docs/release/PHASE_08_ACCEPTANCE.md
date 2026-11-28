# Phase 08 — Product corrections integration candidate

Baseline: 9b48310e1a9ff7c4811d365fa55aacb44e2e99e5. Branch: stabilization/08-product-corrections.

## Local evidence
- TypeScript and production beta build passed.
- Full automated inventory: 452 cases; 441 passed, 0 failed, 11 PostgreSQL-only cases skipped locally. CI must independently run all 11 against PostgreSQL 16. Phase 07 results do not certify Phase 08.
- Profile subscription browser: Free/Premium/Actual modes, pricing lock, ads, 50/51-game limit, downgrade preservation, scoreboard, exact filters and Finn passed.
- Product browser: empty Wishlist, expanded Splendor details, move to Owned, Discover title and optional players, scanner Finn and cancellation passed before final browsing-state refinements. One transient dependency optimization error recovered. Latest browsing-state refinements passed TypeScript and automated suite; repeat browser checks on integrated version.
- Eight additional automated tests cover evidence aggregation, conflicts, split text, barcode checks, expansion veto and Discover hard constraints.
- Browser tests use disposable auth-off loopback servers, synthetic data, blocked external traffic. Restart the server between subscription and product suites. Do not run Vite build and dev concurrently.

## Scope and open gates
- This candidate is for owner testing, not public deployment. Free cap remains 50; paid activation unchanged.
- Local scanner uses OCR and optional platform barcode detection; approved barcode reference table is empty. No barcode-to-game coverage is claimed.
- Visual provider remains gated and unapproved. No licensed reference-image matching implemented. No external image transfer in tests. No real-photo accuracy, latency or precision claim.
- All recognized candidates require explicit selection. Game identity conflicts/expansion evidence can suppress candidates rather than guessing.
- Search state is in-memory, cleared on account switch/reload. Scroll restoration enabled; real device verification pending.
- Finn processing on scanner, app initialization, recommendations, guide and rules requests. Account cloud sync feedback and full recovery/celebration integration remain open.
- Owner build-version display not yet implemented.
- No production changes, paid provider calls, photo retention, or deployment authorized.

## Real-photo benchmark
Use owner-provided, consented photos locally; record expected catalog identities and editions before scanning. Include single boxes (Catan, Codenames, Splendor, Carcassonne), shelves with exact visible count, alternate orientations, glare, partial obstruction, expansions, uncatalogued games and blank negatives. No reference images may be retained or repurposed without rights. Record per-photo true positives, false positives, missed titles, unknowns, processing time, device, and method. Compute recall = TP/(TP+FN), precision = TP/(TP+FP); do not present tiny fixture results as production performance. Proposed gates: single-box recall >=95%, shelf recall >=90%, high-confidence precision >=99% on a representative held-out set. No calibrated high-confidence tier yet. Provider approval, rights, cost and data handling must precede any external visual testing.

## Integration
Use the exact baseline and a clean branch. Apply the binary patch with git apply --check first; typecheck and test before committing. Push only the Phase 08 branch; CI workflow runs standard and disposable PostgreSQL suites. No merge or deployment until owner acceptance.
