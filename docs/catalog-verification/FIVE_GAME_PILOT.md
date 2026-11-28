# Five-game metadata verification pilot

**Checkpoint 05B2 research record — proposed values are not applied.** The pilot is limited to the five existing catalog records below. No runtime record, ID, score, or user data was changed.

## Result at a glance

- **Games in scope:** 5; all five appear below and in `five-game-verification.csv`.
- **Primary-source claim rows:** 15 CSV rows are marked `PRIMARY SOURCE CLAIM — EDITION MATCH PENDING`: 13 player/age/listed-duration claims, one Wingspan release-year claim, and one Wingspan product-identity claim. These are publisher statements about listed products, not verified claims for the legacy records. A separate Wingspan expansion relationship is recorded as `PRIMARY SOURCE CLAIM — ID MATCH PENDING`. The two Codenames statements (`8+` and `15 min`) are explicitly not treated as numeric maximum players or maximum duration.
- **Fields verified for the represented legacy editions:** 0. Exact edition matching and independent field review are incomplete; rights/terms review is a separate pending gate for any collection or reuse.
- **Game-level statuses:** all remain **PENDING SOURCE REVIEW**; none is **FULLY VERIFIED**, **VIBE VALIDATED**, or **FINN TEACHABLE**.
- **Proposed corrections applied:** 0.

The links for Czech Games Edition, HABA, Leder Games, and CMON were retrieved and relevant on the final link check (2026-10-30). Stonemaier Games' three cited pages could not be retrieved on that final recheck because of transport/DNS/TLS failures; the pilot claims reflect the earlier publisher-source research report and remain unverified for the legacy records. Link availability is not evidence of reuse permission. No BGG API, restricted-site scraping, PDF/rulebook download, artwork download, or external catalog import was used.

## Codenames (`178900`)

**Existing catalog snapshot:** title Codenames; year 2015; 2–8 players; 15–30 minutes, average 22; publisher age 14; community age 10. No publisher field, exact edition, or explicit adult-content value is present.

**Primary evidence retrieved:** Czech Games Edition, [Codenames product page](https://www.czechgames.com/games/codenames), accessed 2026-10-30. The page labels this the “new edition,” describes revised word list/art/insert/rulebook, and lists 4–8+ players, age 10+, length 15 min, and release date Q3 2025. These claims are specific to the page's new edition, not evidence for the 2015 catalog record.

**Finding:** an edition mismatch is demonstrable. The page cannot justify changing the legacy record's 2–8 range, 14 publisher age, or 15–30 duration. “15 min” is an advertised length, not an explicit maximum. Its “4–8+” wording does not establish a numeric maximum either. Publication year 2015 remains unsupported for the exact represented edition. Current publisher page explicitly tags the game as a Party Game; that is not evidence for GameFinder Party Vibe or other subjective scores.

**Proposals:** leave all existing values unchanged; mark identity/edition and legacy hard-filter values pending edition-matched source review. Identify which printing/market the 2015 record was intended to represent. Independently review social interaction before any Party rating proposal.

**Adult content:** unknown. No scoped content review was performed; the publisher age recommendation is not evidence of absence.

## Wingspan (`266192`)

**Existing catalog snapshot:** title Wingspan; year 2019; 1–5 players; 40–70 minutes, average 55; publisher age 10; community age 8. The record lists European Expansion (`290448`) as an expansion relationship.

**Primary evidence retrieved:**

- Stonemaier Games, [Wingspan product page](https://stonemaiergames.com/games/wingspan/), accessed 2026-10-30. It states worldwide retailer release on March 8, 2019; 1–5 players; 40–70 minutes; and a separate 5-minute setup time. It does not state a minimum age.
- Stonemaier Games, [Wingspan European Expansion product page](https://stonemaiergames.com/games/wingspan/wingspan-european-expansion/), accessed 2026-10-30. It identifies this as the first Wingspan expansion, says it requires the base game, and states release November 22, 2019; with the base game, 1–5 players and 40–70 minutes.
- Stonemaier Games, [Wingspan Asia product page](https://stonemaiergames.com/games/wingspan/wingspan-asia/), accessed 2026-10-30. It identifies Asia as the third expansion and says it can be standalone for 1–2 players or support 6–7 with the base game. This page does not mention Apiary.

These pages were retrieved in the source review even though a separate fetch attempt from this session failed. A publisher claim for a listed product is not proof that the legacy record's edition is that product.

**Finding:** earlier publisher-source research reports a base-game release date in 2019, 1–5 players, and 40–70 minutes, which align with the legacy year/range. The exact represented edition/market remains unidentified, and the links could not be revalidated in the final check. The publisher page does not supply a minimum age. A published range supports its listed upper endpoint as a `maximum_listed` value if edition-matched; it does not guarantee an absolute limit on actual play. The European Expansion relationship is corroborated in the earlier publisher research, but its source page gives no BGG ID; the existing `290448` key is not independently verified. The possible external-ID namespace concern remains: Apiary's `266192-asia` resembles Wingspan's legacy key `266192`. Stonemaier's Wingspan Asia page was reported to describe a distinct Wingspan expansion but not Apiary. This evidence does not establish that either identifier is correct or that the records are duplicates.

**Proposals:** no correction. Match the catalog record to the publisher's base-game product and verify the external ID separately. Retain the publisher-confirmed expansion relation as a source observation, not an authorized metadata update; verify the external ID for European Expansion independently. Do not infer identity or merge from `266192-asia`.

**Adult content:** unknown.

## Rhino Hero (`209418`)

**Existing catalog snapshot:** title Rhino Hero; year 2011; 2–5 players; 5–15 minutes, average 10; publisher and community ages 5. Existing descriptors include “Stacking,” “Action / Dexterity,” “Animals,” and “Children's Game.”

**Primary evidence retrieved:** HABA USA, [Rhino Hero product page](https://www.habausa.com/products/rhino-hero), accessed 2026-10-30. It lists ages 5+, 2–5 players, and 5–15 minutes; it describes building a 3D skyscraper by placing walls and roof cards and says this tests steadiness/precision. The page does not state a publication year or identify a numbered edition/version. It links instructions, but the PDF was not opened or downloaded.

**Finding:** three official page specifications match the legacy values (player range, publisher age, advertised duration), but the represented record's 2011 edition has not been matched to this current HABA listing. These are source-backed claims only for the retrieved product page, not verified claims for the legacy edition. A published 5–15 minute range supports 15 minutes as its listed upper endpoint, not as a guaranteed maximum on actual play. The physical tower-building described is relevant evidence for a future Dexterity evaluation, but it does not validate the current 3.6 calculated score.

**Proposals:** no metadata correction. Identify the exact 2011/market edition and confirm the current page describes the same product. If matched, preserve the source wording for duration as advertised, not as an independently established upper bound. A Vibe review should assess how much physical steadiness materially affects outcomes.

**Adult content:** unknown.

## Root (`237182`)

**Existing catalog snapshot:** title Root; year 2018; 2–4 players; 60–90 minutes, average 75; publisher age 10; community age 13.

**Primary evidence retrieved:**

- Leder Games, [Root product page](https://ledergames.com/products/root-a-game-of-woodland-might-and-right), accessed 2026-10-30. It lists 2–4 players, age 14+, and 60–90 minutes; the page identifies the product and gives base-game components/credits. It does not state a publication year.
- Leder Games, [New to Root? product chart](https://ledergames.com/pages/new-to-root), accessed 2026-10-30. It describes the base game as standalone for 2–4 players and lists expansion relationships; it does not state age or year.

**Finding:** the publisher's current product listing supports 2–4 players, age 14+, and 60–90 minutes for that listing, but does not identify the exact edition/market represented by the 2018 record. **Priority discrepancy:** this current official 14+ recommendation conflicts with the legacy publisher age of 10. Do not silently replace 10: confirm the exact edition and market first. The source provenance for the separate community age 13 remains unavailable. Keep publisher and community recommendations as distinct claim types. The 14+ listing does not establish adult content. The published 60–90 range supports 90 as the listed upper endpoint, not an absolute limit on actual play.

**Proposals:** do not change the legacy age. Resolve the 2018 edition/market, verify whether the current 14+ listing applies to it, and obtain provenance for the community age. Keep both claims distinct; do not choose one as “correct” absent evidence.

**Adult content:** unknown. “Fighting”/“Wargame” catalog categories do not establish graphic or disturbing content.

## Sheriff of Nottingham (`157969`)

**Existing catalog snapshot:** title Sheriff of Nottingham; year 2014; 3–5 players; listed duration 60–60 minutes, average 55; publisher age 13; community age 10.

**Primary evidence retrieved:** CMON, [Sheriff of Nottingham 2nd Edition product page](https://www.cmon.com/products/sheriff-of-nottingham-2nd-edition/), accessed 2026-10-30. It explicitly describes the second edition, updated rules, and included modules/expansions (6th Merchant, Black Market, Sheriff’s Deputies). The retrieved page text did not give player count, age, duration, or publication year.

**Finding:** this primary source identifies a 2nd Edition product, not necessarily the 2014 edition represented by the existing record. It does not substantiate the legacy row's hard-filter values. The stored 60–60 range and 55 average have unclear source and scope; they are not enough to determine whether either value is wrong. The retrieved publisher page gives no duration or player count. Keep minimum, maximum-listed, typical, and estimated durations distinct; do not infer a maximum from a single advertised duration. Resolve edition before comparing durations.

**Proposals:** no correction. Determine whether the legacy record represents the first edition or the current second edition, then obtain edition-matched player/age/duration evidence. Store advertised duration separately from any actual maximum; do not treat 55 minutes as a verified average.

**Adult content:** unknown.

## Common unresolved fields and acceptance

The CSV carries one row per factual field and each of the six Vibes for each game (90 rows total). Source claim, existing value, proposed value, edition, source/link-access information, evidence status, confidence, conflicting evidence, licensing status, and reviewer approval are represented independently. Unsupported source/evidence fields contain explicit `UNKNOWN` or `PENDING` values. No row proposes an applied correction; every disposition is `NO CHANGE`.

For all five games: no authorized content review was completed; no adult-content absence is claimed; no independent Vibe raters participated; rights/terms for storage and reuse remain pending; and no record meets any of the three acceptance statuses. A documented `ABSENT WITHIN SCOPE` result would describe only the reviewed edition and materials; it would not guarantee absence of all potentially objectionable content. Before stricter age filtering, human owners must approve category/severity thresholds, age-band behavior, handling of `UNKNOWN`/`DISPUTED`, sufficient review scope, reviewer/adjudicator authority, and user-facing communication. No filter change is proposed here.

## Readiness assessment

The pilot demonstrates useful safeguards: preserve the legacy value, distinguish edition-specific claims, record source claims without silently applying them, and keep rights and subjective Vibes separate. It does **not** yet demonstrate a completed repeatable verification workflow for all required fields. Czech Games Edition, HABA, Leder Games, and CMON links were reachable on the final check; the three Stonemaier links were not retrievable then and remain marked for recheck. Sources omit some specifications and exact legacy-edition matching is incomplete. The workflow is suitable for a supervised next research round, but **not ready to scale to the remaining 138 games for verification or metadata changes** until edition matching, rights review, and independent reviewer capacity are established.
