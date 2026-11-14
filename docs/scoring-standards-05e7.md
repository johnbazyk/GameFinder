# GameFinder Scoring Standards — 05E7 Working Draft

## Status

DRAFT — NOT APPROVED FOR CATALOG PUBLICATION.

This checkpoint establishes the structure and a proposed six-Vibe rubric.
It does not replace or certify the original seven-dimensional rubric.

## Universal scale

Permitted values: 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0.

These are anchored ordinal assessments, not ratio measurements.
A score of 4.0 does not mean twice as much as a score of 2.0.

Unassessed scores remain null. They must never be interpreted as zero.

## System A — Seven dimensions

Luck; Strategy; Skill; Social Interaction; Complexity;
Replayability; Resource Management.

These are seven equally important, independent dimensions used to
describe the game and populate its seven-axis spider graph.

The original 63 anchors from the established rubric must be recovered,
compared, approved, and versioned before publication enforcement.

Legacy 0–100 values must be retained unchanged until a reviewed
migration is accepted. They must not automatically be described as
approved 1–5 ratings.

## System B — Six Find-a-Game Vibes

Luck; Strategy; Dexterity; Family; Party; Board-Based.

Operational descriptions and all 54 proposed anchors are maintained
in src/lib/rating-standards.ts.

The six Vibes must be assessed separately from the seven dimensions.
Dimension ratings and game facts may inform an assessment but cannot
automatically substitute for it.

## Recommendation behavior

Hard constraints: supported players, youngest-player age, maximum
listed playtime, and adult-content safety.

Soft preferences: the six Vibes.

A selected Vibe rated 3.0 or higher is a strong qualifying preference.
A rating below 3.0 may rank lower as a closer alternative. Vibes do
not silently override hard constraints.

Exact-score Premium matching uses the approved 1–5 Vibe scores.

## Review and publication

Each game needs 13 supported ratings, a scoring-standard version,
documented evidence, reviewer identity, review date, approver identity,
and approval date.

Before deployment:

1. Recover and approve the 63 original dimension anchors.
2. Review, calibrate, and approve the 54 proposed Vibe anchors.
3. Validate examples and adjacent half-point decisions.
4. Integrate rating validation into the published-catalog gate.
5. Test legacy-data migration and preserve saved user references.

The current readiness helper is preparatory, not yet wired into the
published-catalog validator. The existing 8080 user interface and
real game scores remain unchanged.

## 05E7B — Rating publication gate

src/lib/catalog-rating-gate.ts audits complete 13-rating assessment
packages against approved published-catalog game identities.

The gate rejects:

- Missing rating packages
- Duplicate assessment identities
- Assessments for games absent from the publication
- Missing approvals or supporting evidence
- Invalid rating values
- Mismatches between assessed and published Vibe scores
- Unapproved original seven-dimension scoring anchors

The gate is deliberately NOT yet wired into the existing
published-catalog production boundary. Existing fictional
fixtures, legacy scores, and the GameFinder 8080 interface
remain unchanged.

Integration into production publication remains blocked
until the scoring specification is formally approved.

## 05E7C — Permanent scored-catalog structure

A new versioned scored-catalog type holds the original
seven dimensions and the six Find-a-Game Vibes within
one complete assessment package.

The compatibility catalog type permits older fixtures
without ratings. The strict scored-catalog boundary
requires complete rating packages and approved evidence.

The existing nine fictional fixtures continue working,
but cannot pass the new strict scored-catalog gate.

Legacy 0–100 values are not converted or overwritten.
No existing GameFinder user data is migrated.
No interface or spider-chart changes occur in 05E7C.

The strict gate is an available integration boundary,
not yet active on the live 8080 application.
