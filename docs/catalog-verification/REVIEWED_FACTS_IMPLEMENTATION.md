# Reviewed-facts foundation and Root shadow test

**Checkpoint 05B4A — review-only implementation.** This is an in-memory TypeScript model and pure resolver. It adds no storage, migration, catalog edit, ID assignment, or live recommendation behavior. Shadow comparisons use only GameFinder's static authored catalog, not user Vaults or cloud data.

## Data structure and gates

`src/lib/reviewed-facts.ts` defines one proposal per field. Each record contains:

- A temporary `review:<slug>` reference and an exact identity reference (`legacy-bgg` or existing `custom-game` key); neither is a permanent GameFinder ID.
- Explicit product, edition, and market strings. Unknown scope must be written as unknown rather than omitted.
- A field, typed value, units, and field semantics. Supported fields are publisher minimum age, minimum/maximum players, listed maximum playtime, and scoped adult-content classification.
- A factual status (`VERIFIED`, `PROVISIONAL`, `UNKNOWN`, or `DISPUTED`), source reference/URL/publisher/classification, access result/date, and researcher marker.
- Separate human-review, catalog-owner approval, and rights/terms-review states; previous legacy value plus whether it was known; and a correction-proposal reference.

`UNKNOWN` requires a null value. A playtime maximum accepts only a publisher-listed range endpoint or an explicit upper bound. An absent/unknown adult-content value remains `UNKNOWN`, not false or cleared.

The resolver is pure: it validates field/unit/semantics and identity/scope; rejects missing or ambiguous identities, stale prior values, missing primary source evidence, conflicts, and non-VERIFIED claims; and requires a human reviewer, explicit owner approval, and a separately recorded rights disposition for the stated use. A VERIFIED factual claim by itself—including an AI-assisted research claim—cannot produce an effective publication value. Blocked proposals return the original legacy value unchanged with reasons. The resolver does not write or connect to persistent storage.

The identity candidate helper uses exact typed keys only and marks both sides of any numeric-key/`<numeric-key>-suffix` pair ambiguous. It never uses title similarity, numeric prefixes, suffixes, or automatic alias conversion to assign identity. The known `41114` Resistance/Sleeping Queens collision remains ambiguous; absent or ambiguous keys such as historical `318184` remain unresolved; all seven suspected numeric-prefix pairs are marked ambiguous, not normalized or assigned. Existing custom-game keys are recognized only as exact `custom-game` references. No permanent identity registry is implied.

Rights status is a recorded gate, not a license grant or legal conclusion. `cleared-for-stated-use` requires a named use and reviewer in the proposal record; actual rights, source terms, and legal disposition remain separate matters.

## Root evidence and decision state

The current [Leder Games Root listing](https://ledergames.com/products/root-a-game-of-woodland-might-and-right) is supplied for this checkpoint as independently retrieved and confirmed to state **2–4 players, ages 14+, and 60–90 minutes**. The accessible page extraction in this work session exposed components and credits but not that specification block; the claim is therefore recorded as a **current-listing claim**, not as a newly reproduced field in this implementation.

The historical catalog row is `Root` / legacy key `237182`, age 10, 2–4 players, 60–90 minutes. Its printing and market are unresolved. The current listing's edition and market are also unspecified, so the 14+ fact does not match the legacy row's scope. The model preserves legacy age 10 and blocks this edition transfer. No human reviewer, owner correction approval, or commercial-rights clearance is recorded. Root's adult-content status remains **UNKNOWN**; 14+ is not an adult-content classification.

The source claim and shadow simulation are test fixtures only. No correction has been applied or approved for publication.

## Deterministic shadow comparison

The simulation evaluates 142 current static catalog entries through the existing `passesHardConstraints` function. It changes only Root's age in a hypothetical scenario or excludes Root from hypothetical under-14 confirmed matches. It does not feed Find, Discover, ranking, or other application behavior.

| Scenario                             | Legacy / no intervention | Hypothetical age 14 | Disputed-age under-14 exclusion |
| ------------------------------------ | -----------------------: | ------------------: | ------------------------------: |
| Ages 8–10; no player/time limit      |          71; Root absent |       71; no change |                   71; no change |
| Ages 11–13; no player/time limit     |         99; Root present |    98; Root removed |                98; Root removed |
| Ages 14–17; no player/time limit     |        138; Root present |      138; no change |                  138; no change |
| Adults Only; no player/time limit    |        142; Root present |      142; no change |                  142; no change |
| Ages 11–13; 2 players                |         89; Root present |    88; Root removed |                88; Root removed |
| Ages 11–13; 4 players                |         89; Root present |    88; Root removed |                88; Root removed |
| Ages 11–13; 1 player / 5 players     |     10 / 54; Root absent |           no change |                       no change |
| Ages 14–17; 4 players; 60-minute cap |          91; Root absent |           no change |                       no change |
| Ages 14–17; 4 players; 90-minute cap |        104; Root present |      104; no change |                  104; no change |

The existing age-band implementation uses each band's lower age boundary. Thus Root's legacy age 10 does **not** pass the 8–10 band (the effective minimum is 8), but it does pass 11–13. A hypothetical 14+ value or temporary under-14 exclusion removes exactly one candidate from the 11–13 scenarios where Root otherwise meets player/time constraints. No games are added, and all other candidates remain unchanged. The “no intervention” case equals current legacy behavior in all scenarios.

Counts describe eligibility in the authored static catalog only—not recommendation impressions, user choices, Vault contents, or actual user behavior. The static Root `adultContent` property is absent. Existing runtime handling treats missing as not explicitly adult, but this shadow report records the factual content status as UNKNOWN and does not assert suitability. That legacy behavior is unchanged and remains a product-policy risk.

## Owner decisions before a live correction

1. Identify the historical Root printing and market, or obtain publisher confirmation that age guidance applies to the relevant field across the editions. Confirm the current listing facts against the displayed primary source.
2. Decide whether to approve an age-14 correction for the exact legacy scope. If unresolved, explicitly approve or reject a reversible Root-only under-14 treatment. Neither option is active now.
3. Decide the intended source/data use and complete the appropriate terms/rights review. Factual accuracy alone does not grant copying, caching, or commercial-use rights.
4. Keep adult-content suitability UNKNOWN until a scoped review is approved and completed; decide its separate user-facing treatment before changing age/content filtering.

The review foundation is ready to prepare and test one owner-reviewed correction, but **Root is not ready for a live correction** until its edition scope, source evidence, and owner decision are resolved. No claim in this checkpoint is owner-approved for publication.

## Rollback and integrity

Nothing is persisted in this checkpoint, so rollback is to remove this review-only module, its test, and this document; the catalog, migrations, and user data remain untouched. If a later checkpoint adds an overlay, keep the legacy value immutable, retain the proposal/evidence history, disable the overlay first to restore legacy behavior, and test that Vault, play-history, score-session, group-play, and custom-game references remain byte-for-byte unchanged. Never reverse-map or merge user references as part of a metadata rollback.
