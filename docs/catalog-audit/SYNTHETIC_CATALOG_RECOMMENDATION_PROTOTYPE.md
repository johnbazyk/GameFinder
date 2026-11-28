# Synthetic catalog recommendation prototype

This is a non-production demonstration of the catalog-to-recommendation seam in
[`catalog-recommendation-prototype.ts`](../../src/lib/catalog-recommendation-prototype.ts).
It is not imported by the application, exposed by a route, or connected to user storage.
Run its end-to-end checks with:

```sh
node --test scripts/catalog-recommendation-prototype.test.mjs
```

## Flow and boundaries

Twelve fictional source candidates are staged with the existing ingestion contract.
Only fixed, explicitly synthetic identity, fact, metadata-rights, human-review, and
owner-review fixtures can pass the local publication check. Candidate-supplied
approval-shaped properties are discarded by the existing staging function. Missing
or conflicting required facts, unresolved identity, or invalid reviews keep a
candidate out of the published fixture catalog. These simulated decisions are test
data, not real reviewer authority or production approval.

Published records use distinct, hard-coded `gf:<UUID>` identities. Those IDs drive
catalog membership, synthetic ownership, result identity, edition relationships,
and reroll exclusions. They do not use or populate a `bggId`. The compatibility
examples use a separate `synthetic-legacy` namespace: only a unique verified alias
resolves; the modeled `41114` collision remains ambiguous, an unverified proposal
does not resolve, and an orphan remains reportable. The `gfc_...` custom-game
example stays owner-scoped. The approved 05E1 ledger and 05E2 queue are read-only
and their reserved identities are not reused.

Recommendation eligibility reuses `catalogHardEligible` and
`catalogRecommendationScore`. Player range, publisher minimum age, adult-content
status, and the maximum listed duration are hard filters. A requested Vibe or exact
Vibe target without an explicit fixture score is not a match. The six GameFinder
Vibes are GameFinder-owned synthetic ratings, not provider ratings. Results are
sorted deterministically by score, title, then GameFinder ID; owned, unowned, and
excluded IDs remain separate.

For the default request (4 players, ages 8–10, up to 60 minutes, Family Vibe), the
preview returns three owned and three unowned results:

| Ownership | Fictional game / edition             | Score | Artwork                              |
| --------- | ------------------------------------ | ----: | ------------------------------------ |
| Owned     | Cloud Kite Festival — First Edition  |  66.2 | Synthetic fixture selected           |
| Owned     | Glow Orchard — First Edition         |  65.0 | Synthetic fixture selected           |
| Owned     | Skyline Foundry — First Edition      |  58.4 | Synthetic fixture selected           |
| Unowned   | Festival of Tides — First Edition    |  41.6 | Synthetic fixture selected           |
| Unowned   | Skyline Foundry — Second Edition     |  39.2 | Placeholder; image rights unresolved |
| Unowned   | Boroughs and Bridges — First Edition |  36.0 | Synthetic fixture selected           |

The expansion is catalog-published but not recommended as a standalone game. Two
same-title editions have separate identities and relationships. Artwork is selected
separately by GameFinder identity and exact edition, printing, language, and market.
Only explicitly synthetic test artwork with display permission, human review,
availability, and current rights can be selected. Metadata permission does not
grant image permission. Missing or unauthorized artwork produces an explicit
original GameFinder placeholder result; it is not represented as an authentic cover.

## Before any real catalog publication

Real use still requires independently evidenced and reviewed permanent identities;
field-level publisher or otherwise authorized evidence for hard-filter facts;
separately approved metadata rights; and image-specific commercial display,
hosting, transformation, attribution, expiry, and revocation decisions. It also
requires an authorized server-side publication workflow, reviewed legacy aliases,
and a separately tested backward-compatible migration plan. No BGG API, live
provider, real artwork, production approval endpoint, user record, or application
recommendation behavior is used by this prototype.
