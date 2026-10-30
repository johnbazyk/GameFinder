# GameFinder Vibe calibration proposal

**Proposed methodology only; not yet approved for production use.** No Vibe formula, score, or runtime behavior is changed here. The five games' current calculated outputs are legacy calculations, not independently validated judgments. The six user-facing Vibes remain Luck, Strategy, Dexterity, Family, Party, and Board-Based.

## Six user-facing dimensions

Rate the play experience of the identified edition, not popularity, quality, sales, or how much a reviewer likes it. Use an integer from 0 to 5. Ratings describe the typical intended play, with a short rationale and an evidence confidence; they are not precise measurements. Do not assign half-points until a future calibration review demonstrates that finer distinctions are repeatable.

| Vibe | What it measures | 0 anchor | 1 anchor | 2 anchor | 3 anchor | 4 anchor | 5 anchor |
|---|---|---|---|---|---|---|---|
| **Luck** | How strongly random outcomes outside player control affect decisions or results. | No material random outcomes. | Rare/incidental randomness; choices dominate. | Noticeable random inputs, usually mitigable. | Frequent randomness materially shapes turns. | Random outcomes often override good plans. | Chance overwhelmingly determines outcomes; agency is minimal. |
| **Strategy** | Depth and consequence of planning, trade-offs, and adaptation. | No meaningful strategic decisions. | Few simple choices with little lasting consequence. | Regular choices, mostly local/short term. | Consequential choices require some planning/adaptation. | Deep interdependent planning and opponent adaptation. | Sustained, highly consequential multi-step planning is central. |
| **Dexterity** | Physical precision, coordination, or controlled movement required by the core play. | No meaningful physical precision. | Incidental handling only. | Occasional physical skill affects outcomes. | Repeated precision/coordination challenges. | Physical execution is a major repeated challenge. | Fine motor/physical execution is the dominant skill test. |
| **Family** | Ease of shared participation across a broad range of ages/experience, including accessibility of rules and social demands. | Strong barriers make broad mixed-experience play unlikely. | Significant prerequisites or narrow audience. | Mixed groups can participate with substantial support. | Generally accessible to mixed-age/experience groups. | Welcoming to a broad group with little adaptation. | Exceptionally easy to include a very broad group in the core experience. |
| **Party** | Social interaction, communication, performance, bluffing, or group energy as a central source of play. | Little meaningful social interaction. | Mostly solitary/quiet decisions. | Some discussion or interaction, but not central. | Regular interaction shapes play. | Social exchange is central and sustained. | Group communication/performance is the defining activity. |
| **Board-Based** | How much spatial play on a shared physical/digital board, map, or tableau drives decisions. | No board/map/tableau role. | Board is incidental reference. | Board matters in some decisions. | Spatial layout is regularly important. | Shared board/map is central to planning. | Spatial board state is the dominant decision space. |

### Interpretation safeguards

- “Family” is not a synonym for low complexity, child-targeted art, or a low publisher age. Judge inclusion and play experience; retain age as a separate factual field.
- “Party” is not merely the catalog category “Party Game.” Judge what players actually do together.
- “Board-Based” refers to the decision role of a board/map/tableau, not the mere presence of a board or the fact that the product is a board game.
- “Dexterity” is not a proxy for general skill. Physical precision must matter in play.
- “Luck” concerns randomness and player control; uncertain human opponents alone do not automatically make a game luck-heavy.
- “Strategy” does not equal complexity or component count.
- Use rules/components and a reasoned description of typical play as evidence. Publisher descriptions inform but do not dictate subjective ratings.

## Reviewer protocol

1. Freeze the game/edition and rubric version before rating. Record exact edition and any variants included/excluded.
2. At least two reviewers independently rate all six dimensions before seeing each other's ratings. Record reviewer identity, integer rating, rationale tied to observable mechanics/play, confidence (`LOW`, `MEDIUM`, `HIGH`), and evidence/source.
3. Use a single shared scope and score the core game, not an expansion unless explicitly rating a combined product.
4. Compare ratings. Any difference greater than one point, or any low-confidence rating, prompts a documented discussion and evidence check. Preserve original ratings; record an adjudicated proposal separately.
5. Do not claim inter-rater reliability from five games or from invented/retrospective reviewer scores. Do not publish a validated score until the approved review process is complete.
6. Reassess after material edition/rules changes; retain old edition-specific decisions for traceability.

## Existing implementation and limitations

The current implementation computes six outputs from seven manually authored dimensions (`luck`, `strategy`, `skill`, `social`, `complexity`, `replayability`, `resourceMgmt`). It is a heuristic conversion, not the proposed anchored review. Current conversion weaknesses include:

- The inputs have no documented field-level evidence, reviewer, confidence, or rubric version.
- `skill` is used as a proxy for Dexterity, despite not establishing physical precision.
- Family mixes complexity, publisher age, social score, and playtime; the outcome can encode unrelated factual claims.
- Party largely reflects the subjective `social` input and can appear validated by a category label.
- Board-Based uses mechanic/category keyword buckets and a broad default, not a consistent observation of board centrality.
- Numeric precision in derived outputs is not supported by an independent calibration study.

No changes to these rules are authorized by this proposal.

## Five pilot games: current calculated values

These are direct outputs of the unchanged `traitScore` implementation for the current catalog records. They are shown only as a reproducibility baseline, **not** as new evaluations or validated scores. Current runtime helper `hasAdultContent` returns false for each because no explicit flag is set; that legacy fallback is not evidence that content is absent.

| Game (legacy key) | Luck | Strategy | Dexterity | Family | Party | Board-Based | Preliminary manual-review question |
|---|---:|---:|---:|---:|---:|---:|---|
| Codenames (`178900`) | 2.0 | 1.3 | 1.3 | 4.0 | 4.6 | 1.4 | Does clue-giving/word association make social communication central, and does the current high Party output describe actual group play rather than its category? |
| Wingspan (`266192`) | 1.8 | 3.5 | 1.4 | 3.2 | 1.5 | 2.6 | How much do card/dice randomness and the personal tableau shape decisions? Rate base game separately from European Expansion. |
| Rhino Hero (`209418`) | 1.5 | 0.5 | 3.6 | 5.0 | 3.8 | 2.6 | Does repeated card/tower placement require physical precision that materially affects outcomes, and is that the core Dexterity signal? |
| Root (`237182`) | 1.0 | 4.3 | 2.0 | 2.3 | 2.8 | 4.3 | How central are asymmetric planning, map position, and negotiation, and does the age/complexity gap affect mixed-group accessibility? |
| Sheriff of Nottingham (`157969`) | 1.5 | 1.5 | 1.4 | 3.6 | 4.4 | 1.4 | Is bluffing/negotiation the central social experience, and is the current Party result appropriate for the exact edition and group context? |

**Pilot ratings: none proposed or validated.** Publisher specifications do not independently establish subjective Vibe scores. First obtain human approval of the anchors, edition scope, evidence expectations, and disagreement process; then resolve edition identity and carry out the independent-review protocol before considering replacement scores. See `FIVE_GAME_PILOT.md` for factual research status.
