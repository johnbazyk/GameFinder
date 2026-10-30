# Reviewed-facts recommendation integration

**Checkpoint 05B4B proposal and inactive adapter.** No production correction is authorized or active.

## Shared integration point

Find's four-question wizard calls `runWizard`; Discover calls `discoverGames`. Both paths select eligible games through `eligibleGames` in `src/lib/scoring.ts`, which applies the shared `passesHardConstraints` checks before Vibe ranking. Sniff Again calls the same wizard path. Surprise Me directly chooses from owned legacy IDs and does not apply age/time filters.

The smallest shared integration point is the catalog input to `eligibleGames` in `scoring.ts`. A single application-controlled adapter there serves Find, Discover, and Sniff Again without duplicating filter logic or changing UI components. Surprise Me remains on its existing owned-game behavior. The optional adapter argument is dependency injection for tests; user-facing routes call the fixed application adapter and do not provide browser data.

## Trust boundary and inactive state

Production may read reviewed facts only from a checked-in, application-controlled registry—not browser/local-storage/account data or environment-provided records. The registry is empty in this checkpoint and the integration flag is a code constant set to disabled. Setting an environment variable alone cannot enable facts. A record also must pass the reviewed-facts resolver, exact identity/scope checks, source and previous-value checks, and independent human, owner, and intended-use rights gates. The production adapter takes no fact/registry argument; the lower-level pure overlay helper is used with synthetic records only in tests.

Synthetic fixtures belong only in tests and are marked with `test-fixture` references; they are not imported by the production registry. User-created records cannot claim publisher verification. No approval or permission is created by this checkpoint.

## Integration and rollback

The adapter is inactive by default and returns the original catalog array unchanged. When a future application-controlled record is approved, the adapter can apply only its exact field to an immutable copy of the matching game, while preserving the original catalog value for rollback. Ambiguous IDs (including both sides of numeric-prefix pairs), missing scope, disputed facts, stale legacy values, and missing evidence fail closed. No ID normalization, merges, storage writes, or migrations occur.

Rollback is to remove/disable the application-controlled entry and deploy; the original catalog value remains the fallback. No user references are rewritten. Production activation requires a separate owner-approved checkpoint, explicit identity/edition evidence, rights disposition for intended use, before/after Find and Discover tests, coverage review, and rollback verification.

## Root shadow requirements and remaining risks

Root's 14+ is a current-listing claim only; historical edition applicability remains unresolved and adult-content status remains UNKNOWN. The live registry therefore contains no Root fact. Synthetic-only tests pass isolated adapters into the actual `runWizard` and `discoverGames` pipelines and compare legacy behavior, hypothetical age 14, and temporary under-14 withholding. On the actual standalone recommendation catalog (135 games), eligible counts are 69 (ages 8–10), 96 (11–13), 131 (14–17), and 135 (Adults Only). The hypothetical correction and temporary safeguard each remove only Root from 11–13, reducing that case to 95; all other listed counts and candidates remain unchanged.

With player/time constraints, ages 11–13 yield 86 candidates at 2 players and 87 at 4 players; either Root treatment removes one candidate in each case. Root is already excluded at 1 or 5 players. For ages 14–17 and 4 players, a 60-minute cap yields 89 candidates (Root is already excluded), while a 90-minute cap yields 99 (Root remains eligible in every mode). The Find owned/unowned test confirms the single Root candidate moves out of whichever pool it belongs to only under the hypothetical correction; other pool members are unchanged. These are deterministic static-catalog scenarios, not real-user outcomes. Synthetic fixtures are never emitted as application facts or used by user-facing routes.

Remaining risks include the legacy engine's current treatment of missing adult-content data as not explicitly adult, and the lack of edition/market metadata on the runtime `Game` type. Any future correction must provide an explicit, trusted target scope rather than infer one from title or BGG ID alone.

## Catalog-count reconciliation

The 05B4A shadow report counted all **142** unique records in `GAMES`. The live recommendation paths use `standaloneGames()`, which has always filtered for numeric BGG IDs and excludes categories matching “expansion”; the current result is **135** records. The seven excluded records are all nonnumeric identifiers, and none has an expansion category:

| Legacy/review key   | Game                                  |
| ------------------- | ------------------------------------- |
| `31260-revised`     | Agricola: All Creatures Big and Small |
| `233078-short`      | Dune (2019)                           |
| `266810-architects` | Architects of the West Kingdom        |
| `266192-asia`       | Apiary                                |
| `199792-bellfaire`  | The Search for Planet X               |
| `13-junior`         | Outfoxed!                             |
| `21790-pitch`       | PitchCar                              |

This is the existing numeric-ID eligibility rule, not expansion classification and not a 05B4B regression. The approved 05B4A baseline has the same `isStandaloneGame()` and `standaloneGames()` implementation; 05B4B changes only the scoring input adapter and does not edit the catalog. `eligibleGames()` starts from the 135 standalone records, then applies the shared hard constraints. With no player or time limit and the Adults Only band, all 135 pass; the age-band counts **69 / 96 / 131 / 135** are likewise the results of those same constraints over that pool. With the production adapter disabled, its return value is the original game array, and tests compare Find and Discover outputs against the unadapted pipeline.

No IDs or catalog records were changed to reconcile these counts. The seven keys remain excluded until a separate identity/eligibility decision; this checkpoint does not convert them or expand the recommendation pool.

## Existing `pickTonight()` hard-constraint risk

`pickTonight()` first uses `runWizard()` and therefore gets constraint-filtered owned results, but if none remain it falls back to `pickSurprise(user.owned)`. `pickSurprise()` intentionally selects from owned catalog IDs without applying player, age, or playtime filters. Thus the automatic fallback can return a game that violates the selected constraints. This implementation exists in the approved 05B4A parent and is unchanged by 05B4B.

Reproductions use synthetic one-game owned lists, so the fallback choice is deterministic:

| Selected constraint | Owned game                                 | Result                                                                        |
| ------------------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| 2 players           | Catan (`13`; minimum 3)                    | `pickTonight()` returns Catan although `passesHardConstraints()` is false     |
| Ages 8–10           | Codenames (`178900`; publisher minimum 14) | `pickTonight()` returns Codenames although `passesHardConstraints()` is false |
| 60-minute maximum   | Catan (`13`; listed maximum 120)           | `pickTonight()` returns Catan although `passesHardConstraints()` is false     |

There are no current source call sites for `pickTonight()`. The Home “Surprise Me” button calls `pickSurprise()` directly and explicitly tells users that it chooses randomly from the Vault without applying filters; that standalone feature is intentional and is not the automatic fallback scenario. Find, Discover, and the store's wizard refresh use the constraint-filtered recommendation paths.

**Priority: HIGH for the next checkpoint.** Safest fix: make `pickTonight()` return only `result.ownedTop[0]` (or `undefined` when no owned game satisfies the filters). Keep `pickSurprise()` as the separate, explicitly unfiltered user action; do not silently substitute it in a constraint-respecting path. Add deterministic tests for player-count, age, and maximum-playtime violations; verify eligible owned choices still work, excluded/avoided choices are not returned, no-match returns `undefined`, and the separately labeled Surprise Me feature remains unfiltered. This behavior is preexisting and intentionally not changed in 05B4B.
