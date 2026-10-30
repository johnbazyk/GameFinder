# Permanent game identity and safe migration plan

**Checkpoint:** 05B1 design and read-only simulation
**Status:** Proposal only. No catalog IDs, metadata, user records, or database rows were changed. No migration is included.

## Executive recommendation

Give each curated catalog identity a one-time, immutable GameFinder UUID, independent of title, edition labels, publishers, and provider IDs. Keep `bggId` and other provider identifiers as separately sourced external references. Retain every existing BGG-keyed value as an exact legacy alias until its mapping is evidenced. Resolve an alias automatically only when its mapping is verified and uniquely identifies one permanent record; otherwise quarantine that individual reference for explicit resolution.

Use the existing UUID-style `createCatalogGameId()` (`gf:<UUID>`) for curated identities, recording each generated value once in the registry; preserve existing user-created `gfc_...` IDs. Do not derive permanent IDs from title slugs, BGG IDs, publisher, or edition. This proposal does not assign permanent IDs to the current catalog: inventing a registry now without reviewed identity evidence could bless the same errors we are trying to contain.

## Existing identity architecture

### Curated catalog and application behavior

- `Game` in `src/lib/types.ts` has `bggId` as its only game key. Catalog URLs, `getGame`, recommendation membership/exclusions, Find/Discover results, scans, covers, feedback, and scorecard lookup use that key directly.
- `GAMES` is built from authored `RAW` rows and keeps the first row for each exact BGG-ID string. The second `41114` row is therefore omitted from visible catalog behavior.
- `CatalogGameRecord` in `src/lib/catalog-foundation.ts` already separates `id` from `externalIds` and can represent `base-game`, `expansion`, and `edition` relationships. But `catalogRecordFromGame()` fills `id` with `legacyCatalogId()`, which derives a slug from the mutable title and appends the mutable BGG ID. That value is not a permanent identity.
- `createCatalogGameId()` generates `gf:<UUID>`, but the curated `Game` records do not currently store that ID. User-created records already have stable `gfc_<UUID>` IDs; account cloud sync keys those records by owner and ID.
- Legacy expansion relationships currently have `catalogGameId: null` and retain only an external BGG ID and title. The relationship shape can support editions, but legacy game data has no structured publisher or edition identity.
- `migrations/0006_catalog_foundation.sql` defines owner-scoped custom `catalog_games` and `catalog_external_ids`. It does not create the permanent global curated catalog or rewrite legacy references. No migration is proposed or applied here.

### User-data references found by code/schema inspection

No local storage contents, cloud rows, user IDs, Vault exports, or other private user data were read. The inventory below lists code/schema fields only.

| Surface                                    | Existing key/reference                                                                           | Consequence of changing BGG ID/title                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Local Vault and wishlist (`gamefinder-v2`) | `owned[]`, `wishlist[]` contain BGG-ID strings for curated games; custom entries use custom IDs  | Changing an ID can make an owned/wishlisted game stop resolving.                                                                      |
| Cloud Vault (`vault_games`)                | `bgg_id`; account sync reads and replaces owned/wishlist lists using those strings               | A bad crosswalk can move, drop, or mislabel saved ownership.                                                                          |
| Local play feedback                        | `PlayLog.bggId`                                                                                  | Past feedback may display as a raw ID or be attributed to another game.                                                               |
| Score history                              | `ScoreSession.bggId`; score-sheet filtering and scorecard selection use it                       | Historical scores, winner summaries, and links can detach or use the wrong scorecard.                                                 |
| Group play history                         | `group_plays.bgg_id`, returned as `GroupPlayRow.bggId`                                           | Shared group records can become orphaned or misidentified.                                                                            |
| Recommendations and rerolls                | Owned/wishlist inputs, `shownIds`, result `Game.bggId` values, `lastSurpriseId`, `recPool.ids`   | Membership, exclusions, rerolls, and Surprise Me can change if keys change.                                                           |
| Recently Played / pending prompt           | Renders `PlayLog` and score-session BGG IDs; prompt stores `bggId` and a title snapshot          | History may stop resolving; the saved prompt title does not prove identity.                                                           |
| Routes and Find/Discover                   | `/game/$id`, links, scan results, recommendation cards, and `getGame(id)` use BGG IDs            | Existing links and scanned selections may break on ID changes.                                                                        |
| Expansion/edition references               | `Game.expansions[].bggId`; catalog relationships can carry external IDs                          | Relationships can point nowhere or attach to the wrong edition.                                                                       |
| Saved game-night context                   | Current shared shelf is a transient `recPool` of Vault IDs; group plays are persisted separately | No separate persisted board-game-night ID table was found. `game_sessions.game_type` identifies a mini-game type, not a catalog game. |
| Custom user-entered games                  | `CatalogGameRecord.id` is a generated `gfc_...` ID; cloud records are scoped by owner and ID     | Preserve these IDs and ownership; never merge a custom record into a curated identity solely by title or BGG match.                   |

Titles also appear in display snapshots and metadata, but title matching must not be used to reassign user history. Both the external ID and title can be wrong or change independently.

## Permanent identity model proposal

1. **Permanent record ID:** assign each reviewed curated identity a one-time `gf:<UUID>` value using the existing UUID generator, then freeze it in an explicit checked-in identity registry and, when a future global catalog schema is approved, as the primary key. Never regenerate it from mutable attributes. A UUID is a GameFinder key, not a claim that the game facts are verified.
2. **External IDs:** model each provider ID as `{ provider, value, verification, evidenceRef, lastVerified }`. A syntactically valid numeric BGG ID is not verified identity evidence. Do not impose global uniqueness on unreviewed values; retain conflicts for human review.
3. **Legacy aliases:** keep a namespace separate from provider IDs for historical keys, such as `legacy-bgg`, `legacy-internal`, and `legacy-user`. Store exact strings, candidate permanent IDs, evidence, status, and resolution history. Require an evidence reference before any mapping is marked verified. Do not treat a legacy alias as a current provider ID merely because the old application called it `bggId`.
4. **Conflict handling:** a legacy key with more than one candidate remains ambiguous. Resolve only per reference (or with a documented, authorized batch decision that has the same evidence for every affected row); never select the first candidate as a migration policy.
5. **Editions and expansions:** represent editions as distinct permanent records when they have distinct identity/metadata/experience; link edition/base/expansion relations using permanent IDs. Keep unresolved links explicitly unresolved; titles and provider IDs are supporting labels, not relationship keys.
6. **User-created games:** preserve each existing `gfc_...` ID and owner scope. A user may explicitly link a custom record to a curated identity later, but do not merge records or transfer Vault/history automatically.
7. **Future providers:** use provider-namespaced IDs with independent source and rights status. Provider replacement or correction changes only an external-ID assertion, not the permanent catalog ID.

Compatibility implementation should be staged: add identity to catalog records while retaining old fields; dual-read stable IDs and exact legacy keys; migrate only uniquely verified references; keep ambiguous/orphan references visible for review; then stop writing legacy keys only after a measured compatibility period. Do not change recommendation behavior as part of identity migration.

## Known identity conflicts and proposed handling

No live provider, BGG, publisher, or other external source was consulted. The current source provides no evidence that any listed BGG value is authoritative. **Every proposed disposition below is unverified.** “Numeric” describes string shape only, not validity.

### Exact duplicated key

| Existing key | Authored records                | Current runtime result                                                            | Safe proposal                                                                                                                                                                                                                                                   |
| ------------ | ------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bgg:41114`  | The Resistance; Sleeping Queens | Exact duplicate; first-row dedup retains The Resistance and omits Sleeping Queens | Reserve separate permanent-ID candidates, mark the shared historical alias disputed/ambiguous, and keep all references unresolved until authoritative identity evidence and reference-specific resolution exist. Do not move records to either game by default. |

### Possible numeric-prefix/suffixed-alias pairs

These are seven **possible** collisions covering 14 records. The suffix does not establish a BGG ID, a local alias, or that the games are duplicates. Neither value should be normalized or reassigned.

| Numeric-looking current value / title   | Suffixed current value / title                          | Classification from available evidence                   | Proposed correction                                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `31260` / Agricola                      | `31260-revised` / Agricola: All Creatures Big and Small | Unresolved; suffix status unknown                        | Keep both legacy strings exact. Review each as a separate permanent-ID candidate; verify provider IDs and game/edition relationship before registering any BGG external ID. |
| `233078` / Twilight Imperium (4th)      | `233078-short` / Dune (2019)                            | Unresolved; both identity and edition need source review | Keep both keys exact. Do not infer the suffixed value from the title; verify each identity and edition independently.                                                       |
| `266810` / Paladins of the West Kingdom | `266810-architects` / Architects of the West Kingdom    | Unresolved; suffix status unknown                        | Keep both keys exact. Verify each provider identifier independently; do not strip the suffix or merge.                                                                      |
| `266192` / Wingspan                     | `266192-asia` / Apiary                                  | Unresolved; suffix status unknown                        | Keep both keys exact. Verify each identity independently; do not infer that `-asia` is a provider ID or edition.                                                            |
| `199792` / Everdell                     | `199792-bellfaire` / The Search for Planet X            | Unresolved; suffix status unknown                        | Keep both keys exact. Verify each identity independently; do not infer that `-bellfaire` is a provider ID or edition.                                                       |
| `13` / Catan                            | `13-junior` / Outfoxed!                                 | Unresolved; suffix status unknown                        | Keep both keys exact. Verify provider identity before any alias/crosswalk decision.                                                                                         |
| `21790` / Crokinole                     | `21790-pitch` / PitchCar                                | Unresolved; suffix status unknown                        | Keep both keys exact. Verify provider identity before any alias/crosswalk decision.                                                                                         |

For each pair, the eventual migration should register exact old keys as aliases only after review. If authoritative evidence confirms a current external ID, record it as a new verified provider assertion on the intended permanent record. If two rows prove to be the same identity, preserve the retired record ID as a redirect/alias and resolve user references explicitly; if they are different games, assign each its own ID. No resolution is currently supported.

### Guild of Merchant Explorers transformation

The authored row still has source key `318184` and title Wonderland's War, but `AUTHORED_GAMES` transforms that row into The Guild of Merchant Explorers with key `367041`. The current catalog has zero rows under `318184`; `scorecards.ts` still contains a `318184` Wonderland's War scorecard, and another authored Wonderland's War record exists under `291572`. This is a historical key/title mismatch and possible orphan, not proof of what any user's saved `318184` means.

**Proposal:** do not map `318184` to the Guild, to the `291572` row, or to any user record without historical/source evidence. Quarantine it as an orphan requiring explicit review. Preserve `367041` as its own exact legacy reference for the current Guild row. Review the transformation and scorecard in a separately approved correction before adding a permanent identity crosswalk.

## Read-only dry-run results

Run `npm run audit:catalog-identity` to inspect the authored catalog and print a JSON inventory. It loads only catalog source code and derived local metadata. It does not read local storage, query the database, export user information, make network calls, write files, or update catalog records.

Current source inventory:

- 143 authored catalog rows; 142 runtime-visible rows.
- 143 unique current `legacyCatalogId` strings; these are derived keys, not permanent IDs.
- 142 distinct legacy BGG-key strings; the duplicated `41114` accounts for the difference.
- One exact duplicate group (`41114`) and seven possible numeric-prefix pairs affecting 14 records.
- `318184` has no current authored row after the Guild transformation.
- Code surfaces include local Vault/wishlist, local history and score sessions, cloud Vault, group plays, routes/lookups, recommendation state, and relationships. User data was not queried, so the number of real user references, orphaned records, and migration rows is deliberately **unknown**.

The executable simulator is `simulateIdentityMigration()` in `scripts/catalog-identity-dry-run.mjs`. It accepts explicit permanent identity candidates and references, validates unique permanent IDs, exact alias matching, relation targets, and per-reference decisions, and returns a plan without persistence APIs. Its built-in example uses synthetic fixtures only: 5 references yield 1 verified unique candidate, 1 ambiguous key, 1 single unverified alias needing review, and 2 orphans (including `318184`). It proposes at most the single verified unique mapping; it writes zero records. This is a behavior demonstration, **not an estimate of actual user-data impact**.

An unverified or malformed provider identifier is never auto-mapped. A per-reference explicit choice is accepted in the simulator only when its target is one of the recorded candidates and includes a decision ID. That fixture illustrates the required decision boundary; it is not an implemented user workflow.

## Safe future migration sequence

1. Approve an identity registry format and assign UUIDs only after review establishes the distinct game/edition rows. Record the reviewer, date, evidence, status, and immutable registry change.
2. Build an inventory in the authorized target environment using aggregate counts by exact old key and reference surface. Do not export user identities or unrelated account data. Include local-only records only with user consent and a separately reviewed local migration.
3. Produce a **read-only** per-key/per-reference plan. Require source/evidence and explicit resolution for ambiguous aliases, `318184`, missing identities, and any unverified suffix. Report before/after counts and unresolved totals.
4. Back up the affected tables and deploy additive nullable identity fields/alias tables with the existing server-only/RLS boundaries. No destructive rename, delete, or uniqueness constraint should precede conflict resolution.
5. In a transaction, backfill only verified, unique mappings; preserve original BGG strings and a reversible audit log. Stop the migration if source counts, reference counts, or uniqueness invariants differ from the approved plan.
6. Canary-read and compare old/new resolution for Vault, history, scores, group plays, routing, and recommendations. Keep ambiguous/orphan rows visible as unresolved; never silently drop them or choose a candidate.
7. Dual-read old and new identifiers, monitor unresolved counts, then dual-write only under an approved compatibility plan. Remove old-key writes/columns only after an explicit deprecation review.

## Rollback and recovery

- Make changes additive first. Retain old key values and the exact mapping decisions, including who/what authorized each one.
- Take a restorable backup and record row counts/checksums per affected relation before any real migration.
- Use a transaction with preconditions; abort rather than partially migrate on unexpected duplicates or counts.
- Roll back by restoring the pre-migration alias/reference state from the backup or reversing the recorded per-reference mapping. Never attempt rollback by guessing from titles or current BGG IDs.
- Keep ambiguous records untouched during both forward migration and rollback. Validate routing and record resolution before resuming account sync, so a failed resolver cannot overwrite the user's legacy Vault.

No production migration, cloud query, or live integration is part of 05B1.

## Checkpoint 05B2 metadata-verification pilot proposal

Proposed **15-game** pilot, selected for identity conflicts, age/playtime concerns, edition/expansion context, family/party/strategy/dexterity coverage, and adult-content classification. This is a queue only. The table names what must be verified for every candidate; no value is considered verified.

| Pilot candidate                                         | Coverage reason / identity review                                                            | Verify for this game                                                                                                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codenames (`178900`)                                    | Party; publisher/community age disagreement                                                  | Exact identity/edition; publisher; player range; publisher age; maximum playtime; adult classification; source/license provenance; six Vibes                                           |
| Ticket to Ride (`9209`)                                 | Family                                                                                       | Exact identity/edition; publisher; player range; publisher age; maximum playtime; adult classification; source/license provenance; six Vibes                                           |
| Terraforming Mars (`167791`)                            | Strategy; unresolved Prelude expansion reference                                             | Base edition and expansion relation; publisher; player range; publisher age; maximum playtime; adult classification; provenance; six Vibes                                             |
| Rhino Hero (`209418`)                                   | Dexterity                                                                                    | Exact identity/edition; publisher; player range; publisher age; maximum playtime; adult classification; provenance; six Vibes                                                          |
| Root (`237182`)                                         | Strategy; publisher/community age disagreement                                               | Exact edition; publisher; player range; publisher age; maximum playtime; adult classification; provenance; six Vibes                                                                   |
| Wingspan (`266192`)                                     | Family/strategy; age disagreement; European Expansion link; possible `266192-asia` collision | Resolve identity pair and expansion relation; publisher/edition; player range; publisher age; maximum playtime; adult classification; provenance; six Vibes                            |
| Sheriff of Nottingham (`157969`)                        | 60–60 listed versus 55 average playtime contradiction                                        | Exact edition; publisher; player range; publisher age; verified maximum playtime; adult classification; provenance; six Vibes                                                          |
| The Resistance (`41114`)                                | Exact duplicate ID                                                                           | Resolve both conflicting identities and affected references; then verify publisher/edition, player range, publisher age, maximum playtime, adult classification, provenance, six Vibes |
| Sleeping Queens (`41114`)                               | Exact duplicate ID; currently omitted by runtime deduplication                               | Resolve both conflicting identities and affected references; then verify publisher/edition, player range, publisher age, maximum playtime, adult classification, provenance, six Vibes |
| Twilight Imperium (4th) (`233078`)                      | Edition cue in title; possible `233078-short` collision                                      | Verify identity and exact edition, publisher, player range, publisher age, maximum playtime, adult classification, provenance, six Vibes                                               |
| Dune (2019) (`233078-short`)                            | Possible `233078` collision                                                                  | Verify the suffixed value's namespace and identity; publisher/edition, player range, publisher age, maximum playtime, adult classification, provenance, six Vibes                      |
| Secret Hitler (`188834`)                                | Adult-content classification review                                                          | Exact identity/edition; publisher; player range; publisher age; maximum playtime; explicit adult-content decision and criteria; provenance; six Vibes                                  |
| Sagrada (`199561`)                                      | Family/board; local label/Vibe review candidate                                              | Exact identity/edition; publisher; player range; publisher age; maximum playtime; adult classification; provenance; six Vibes                                                          |
| Agricola (`31260`)                                      | Possible `31260-revised` collision; strategy                                                 | Verify identity and provider-ID namespace; publisher/edition; player range; publisher age; maximum playtime; adult classification; provenance; six Vibes                               |
| Agricola: All Creatures Big and Small (`31260-revised`) | Possible `31260` collision; family/strategy                                                  | Verify identity and suffixed-ID namespace; publisher/edition; player range; publisher age; maximum playtime; adult classification; provenance; six Vibes                               |

Use publisher packaging/product documentation for publisher, edition, player count, minimum age, and listed maximum playtime when it identifies the exact edition. Record the precise URL/document, access date, source class, license/use status, and field-by-field claims. Adult-content classification needs an approved, explicit, documented content standard; missing flags must remain unknown until reviewed. Six Vibe values require the separate human calibration protocol; publisher metadata or BGG ratings do not validate subjective preference scores. Do not use the BGG API, infer facts from title similarity, or download rulebooks/artwork for this pilot.

## Unresolved approvals and risks

- Which independently authorized source(s) and rights terms may establish identity and metadata for this commercial catalog?
- What exact evidence will qualify a legacy alias as verified, and who can approve a per-user ambiguous reference?
- What is the approved adult-content classification rubric, including unknown and disputed cases?
- What user-facing experience should handle orphaned/ambiguous Vault, history, and score references without exposing or misassigning private data?
- Does any prior deployment or local export contain `318184` references, and what was its intended identity? Do not query or migrate private data until scope and approval are explicit.
- Should editions be separate discoverable/recommendable records or edition variants grouped under a base identity? This must be decided before pilot IDs are assigned.
- How will permanent curated IDs be distributed and validated across clients, server code, and database environments without making the slug/BGG key primary again?

The proposal protects data by separating permanent identity from editable metadata, keeping historical keys verbatim, requiring evidence before automatic mapping, and making ambiguous user references a stop condition—not a best-effort match.
