# GameFinder 0.4-design: provisional catalog baseline

This implements the owner's decision to rate game designs from rules and published information, independently of individual children. All assessments remain provisional AI-authored judgments. Rules describe concrete mechanics; selecting an ordinal anchor still involves interpretation. This release is not evidence of unbiased measurement, inter-rater reliability, observed play, or human review.

## Scale and constructs

Ratings run from 1 to 5 in 0.5 steps. Higher means more of the named characteristic, not better quality. Seven dimensions and six selection vibes share Luck and Strategy, leaving eleven distinct values. The seven-dimensional chart and selection filters read the same records. No BGG popularity score or old 0–100 value is converted into a new assessment.

The prior 0.3 anchors remain unchanged except Family. `rating-anchors-design.ts` defines Family as structural support for shared participation: procedural, reading and calculation burdens; meaningful turn access; waiting, elimination and recovery. It is not an age recommendation, thematic-content rating, or forecast of a particular child's performance. Existing age, player, time and adult-content constraints remain in force separately.

## Coverage and evidence

`src/lib/ratings/design-assessments.ts` contains 143 explicitly authored profiles, covering 142 active catalog entries and one entry currently hidden by an existing ID collision. The existing standalone recommendation catalog contains 135 entries. Coverage does not promote placeholders to verified identities or repair catalog facts automatically.

Each row stores a reference URL, paraphrased mechanics, separate Family evidence, the assessed edition, supported player counts, and eleven values. References include publisher instructions, published rulebook copies, rule extracts and publisher descriptions. Source depth varies: this is not a claim that 143 full rulebooks were independently audited. Source material supports the mechanics; scores and anchor selection are GameFinder's provisional interpretations. No human review, playtest, or publisher endorsement is implied.

The record builder adds the selected and adjacent anchors, assessor identity and assessment date. Adjacent-anchor text is calibration context, not an independent second assessment. Evidence summaries apply to the design as a whole; a later review should strengthen axis-specific rationale where a half-point distinction remains uncertain.

## Scope

A profile is the baseline for its explicitly named standard edition and mode. Browsing without a player selection shows the baseline. Selecting an unsupported player count or a different explicit edition/mode does not fabricate a profile. Ratings are not independently calibrated at every supported player count. Expansions, house rules and alternate editions need their own assessments.

Important examples: UNO Spin uses original J3719 rules; UNO Dice uses W5807 two-player rules; My First UNO uses the Sofia the First BGG47 product instructions; Love Letter uses the 2019 base rules; Santorini excludes god powers; Final Girl covers core mechanisms, not every Feature Film; Root's base two-player setup requires the supported faction combination. A generic catalog title does not verify which physical edition a household owns.

Sleeping Queens and The Resistance share legacy ID 41114 in the authored catalog. Profiles bind by both ID and exact title to avoid assigning one game's assessment to another. This release does not migrate saved vault identities; Sleeping Queens remains hidden by the existing catalog deduplication.

## Application behavior

Provisional design profiles are the default. Old saved `legacy` modes cannot restore a second rating display. The explicit reviewed-only mode still requires review evidence and excludes these provisional assessments.

Selected vibes require at least 3; exact/range targets retain their explicit semantics. Find and Discover use the same eligibility policy. Recommendations return up to three owned and three unowned qualifying games, retaining hard constraints and reroll exclusions. There is no summed quality score or BGG popularity ranking; qualifying games use stable seeded variety. Missing assessments do not satisfy selected rating targets. With no rating target, ordinary catalog hard constraints still govern eligibility.

The UI retains one seven-axis graph, integer ticks 1–5, half-point plotting, and a short provisional label. Evidence stays in the data rather than expanding the consumer interface. Personal rating overrides are not implemented by this patch.

## Verification and remaining work

Automated checks cover all authored identities, eleven valid half-point values, provisional status, strict reviewed-mode exclusion, age-independent Family with separate hard age checks, supported scopes, all active game profiles rendering, shared Find/Discover filtering, and three-plus-three/reroll behavior. Passing software tests confirms implementation contracts, not the validity of every judgment.

Review priorities: ambiguous editions, sparse publisher descriptions, player-count effects, and axis-specific boundary decisions. Beta feedback may motivate revised evidence-backed records; it must not silently overwrite the governing anchors or shared ratings. BGG integration remains disabled; no BGG import or AI model training is added.
