# GameFinder Rating Standard

**Provisional beta edition 0.3 • November 14, 2026**

Owner: Lane Bitner. Revision authorized in conversation. Status: authorized working standard for development and explicitly labeled beta use. Independent human calibration is deferred; empirical validation and production migration have not been completed. No assessment becomes human-reviewed automatically.

## Read this first: governing standard

This short opening is the decision guide. The assessor handbook below provides anchor details; the developer section specifies implementation checks. Original source documents remain unchanged in the historical appendices.

**Purpose:** Help a group choose what to play now, using understandable game descriptions and the group's stated constraints. High scores mean more of a characteristic or a stronger contextual fit, not overall quality.

| Layer | Role | Rule |
|---|---|---|
| Seven dimensions | Describe gameplay on a consistent 1–5 profile | Luck, Skill, Strategy, Social Interaction, Complexity, Replayability, Resource Management |
| Six vibes | Match the desired experience | Luck, Strategy, Dexterity, Family, Party, Spatial Play |
| Eleven game types | Overlapping descriptive tags | No automatic ratings and no extra required wizard steps |

### The rules that govern the product

1. **Use one scale:** 1–5, with supported half points. These are ordered categories, not ratios, percentages, or measured equal intervals. Unknown is null. Whole-number anchors lead; half points require a reason.
2. **Share identical meanings:** Luck and Strategy are each assessed once and referenced by both profiles. The other four vibes are assessed independently. Skill does not generate Dexterity; Social does not generate Party; easy rules do not generate Family. There are 13 logical fields and 11 distinct constructs; context-specific records may add assessments.
3. **Declare scope:** Edition, mode, player count, and relevant age context travel with the evidence. A Family score describes shared participation for specified ages, never all families universally.
4. **Use evidence appropriate to the claim:** Rules substantiate mechanics; play observations support participation and engagement; repeated play supports replayability. Record sources and limitations. AI can prepare a proposed assessment but cannot manufacture observation or independent review.
5. **Filter before ranking:** Players, age/content, and listed maximum time remain independent constraints. Every selected standard vibe must have an applicable policy-eligible score of at least 3.0: reviewed for the reviewed-only path, or documented provisional assessments in the explicitly enabled beta path (Section 6). No selected vibes means no vibe threshold. Unknown selected ratings cannot qualify.
6. **Be explicit about advanced choices:** At least, Range, and Exactly have different meanings. A range is the preferred advanced browsing interaction; exact equality remains available. Never silently relax constraints to fill three results.
7. **Keep ranking separate:** Pilot with best-player-count fit followed by reproducible variety within owned/unowned pools. No overall rubric total, popularity boost, affiliate influence, or untested preference weights in this baseline.
8. **Explain the actual decision:** The same scoped assessment values and evidence labels power filters, explanations, and chart labels. Display 1–5 and disclose missing evidence/context. Preserve users' collections and reroll behavior.
9. **Test before claiming trust:** Verify software behavior and gather beta feedback now; defer independent reviewer calibration until feasible, and complete it before claiming inter-reviewer reliability. A long rubric and passing tests are insufficient evidence of useful recommendations.
10. **Correct transparently:** Keep original assessments, disagreements, revisions, source provenance, and rubric versions. Reassess affected records when meaning changes. Freeze a version for consistent use, while allowing documented evidence-driven improvements.

### What changes now

Version 0.3 applies the 25-game stress-test findings and the owner's decision to continue without independent human scoring for now. Party requires a specific shared-entertainment mechanism. Spatial Play replaces the Board label; physical-board presence is a separate factual tag. Skill and Resources require distinct supporting mechanisms. Family may receive an age-scoped, rules-based provisional estimate; observation remains a stronger evidence basis. Beta use is separate from human review. Keep 1–5 half-points and the provisional 3.0 cutoff. These are document and policy changes, not a claim that application code has been changed.

### What is evidence-backed, and what remains a design choice

Clear construct definitions, testing interpretation, independent assessment, and transparent limitations are supported by measurement-development principles. The specific seven dimensions, six vibes, half-point scale, 3.0 cutoff, Family context policy, and pilot ranking order are GameFinder design choices inherited or refined from the owner's direction. They require local testing; external sources do not validate them automatically. Sources and their limits appear after the developer checks.

## 2. Common assessment rules

Assess the specified product under its standard rules. Exclude expansions and house rules unless explicitly included. For mechanics, consider ordinary competent play; for Family accessibility, declare either a rules-based novice-participant estimate or an actual observation protocol. Never describe an estimate as an observed session. Do not substitute elite play, one assessor's favorite group, popularity, marketing, age labels, or title keywords for evidence.

High Luck does not automatically cap Strategy. Complexity concerns rules burden, not planning depth. Skill concerns execution rather than choosing a plan; reviewers must state which task they mean. Replayability concerns renewed consequential situations, not promises of endless enjoyment or the amount of first-use campaign content. Resource Management requires identifiable scarcity and allocation tradeoffs; merely taking a turn is insufficient.

Approval of an assessment means evidence was reviewed under this version and scope. It does not mean scientific certainty. In workflow code, an existing `approved` status may represent this review, but user-facing claims must remain accurate. Structural validity, evidence review, applicability, and provider authorization are separate checks.

## Assessor handbook

### How to apply the anchors

Whole-number anchors are the primary reference points. Half points are supported intermediate categories, not averages of reviewers or extra decimal precision. For a half point, explain why the lower whole-number anchor understates the evidence and the next whole-number anchor overstates it. Unresolved uncertainty remains proposed; do not round upward to qualify. A 3.0 has a category-specific meaning and does not imply equal amounts across different characteristics.

## 3. Seven dimension anchors — calibration edition

### 3.1 Luck — also the Luck vibe

**Definition:** The extent to which random mechanisms influence meaningful game states and outcomes, considering how effectively decisions can mitigate them. Random draws and dice count; hidden player intentions alone do not. Setup randomness counts when it materially changes opportunity or advantage. Assess randomness relative to meaningful control, not the presence of dice or cards.

| Score | Anchor |
|---|---|
| 1 | No consequential random mechanism affects setup or play. |
| 1.5 | Rare or minor random effects have negligible influence on advantage or outcomes. |
| 2 | Randomness changes occasional opportunities; decisions usually control its consequences. |
| 2.5 | Randomness regularly changes options, but mitigation generally preserves the influence of good decisions. |
| 3 | Chance and decisions both materially influence advantage and outcomes; mitigation is useful but incomplete. |
| 3.5 | Random events frequently alter important advantages despite competent mitigation. |
| 4 | Random events exert strong influence on important advantages; decisions can manage some consequences but cannot reliably neutralize them. |
| 4.5 | Most decisive advantages depend on random outcomes; player choices offer little control. |
| 5 | Random mechanisms determine the result; players have no meaningful outcome-changing choices or execution. |

**Required Luck evidence:** Name the random mechanism and whether it changes setup, options, or resolution. Record shared versus unequal exposure and mitigation. Do not score from the presence of shuffled cards alone. Hidden intentions are not randomness. Motor error alone is not chance; material/physical uncertainty without a rule-defined randomizer remains a disclosed boundary, not an invented probability estimate.

### 3.2 Skill

**Definition:** The contribution of cognitive or physical execution—memory, observation, recognition, accuracy, coordination, timing, and reflexes—to success. Separate executing a task from selecting a plan. Untimed memory and observation can count; speed is not mandatory. Merely handling pieces does not count.

| Score | Anchor |
|---|---|
| 1 | Execution demands do not meaningfully differentiate success. |
| 1.5 | Basic awareness or execution provides occasional minor advantages. |
| 2 | Isolated recognition, memory, accuracy, or motor tasks offer modest advantages. |
| 2.5 | Execution tasks recur and affect progress, but other mechanisms usually determine success. |
| 3 | Execution quality regularly and materially affects results. |
| 3.5 | Execution quality shapes many consequential actions and results. |
| 4 | Execution quality is central to success across much of play. |
| 4.5 | Outcomes depend predominantly on execution quality, with limited compensation from other mechanisms. |
| 5 | Performance on execution tasks is the defining and overwhelmingly determining basis of success. |

**Required Skill evidence:** Name the execution task and the rule-level consequence of performing it well. Distinguish retrieval, recognition, memory or motor execution from choosing/evaluating a plan. “Experienced players win” is insufficient. If the only evidence repeats the Strategy rationale, retain null or hold the estimate out of beta use until a distinct basis exists. Untimed tasks can count; cognitive speed never automatically establishes Dexterity.

### 3.3 Strategy — also the Strategy vibe

**Definition:** The degree to which success depends on consequential planning, anticipation, adaptation, and connected decisions. Includes short-term tactics and longer-term plans. Opponents are not required: planning against a system can qualify. Randomness does not cap this rating.

| Score | Anchor |
|---|---|
| 1 | No meaningful planning choices affect outcomes. |
| 1.5 | Choices are largely automatic, with little benefit from anticipation. |
| 2 | Simple immediate tradeoffs or blocking decisions matter; future consequences are limited. |
| 2.5 | Repeated tactical choices allow modest planning across upcoming actions. |
| 3 | Connected choices and short plans materially affect success throughout play. |
| 3.5 | Consistent anticipation, adaptation, and coordinated choices offer substantial advantage. |
| 4 | Multi-turn plans and competing priorities are central to success. |
| 4.5 | Interacting strategic layers require sustained tradeoffs, adaptation, and evaluation of alternative plans. |
| 5 | Deep, sustained planning across multiple viable approaches defines play; decision quality remains consequential throughout. |

### 3.4 Social Interaction

**Definition:** The extent to which meaningful interpersonal engagement shapes play, including communication, cooperation, negotiation, bluffing, persuasion, and interpreting other players. Mechanical interference alone is not equivalent to communication. Silent signaling and reading intentions can qualify; optional conversation unrelated to play does not.

| Score | Anchor |
|---|---|
| 1 | Play requires no meaningful interpersonal engagement; tasks are solo or parallel. |
| 1.5 | Brief incidental exchanges occur without shaping decisions. |
| 2 | Occasional interpersonal engagement influences limited choices; most play is individually resolved. |
| 2.5 | Recurring exchanges or interpretation of others matter in specific portions of play. |
| 3 | Communication, joint choices, or interpretation of intentions regularly changes decisions and results. |
| 3.5 | Cooperation, negotiation, bluffing, or interpersonal interpretation shapes many important decisions. |
| 4 | Sustained interpersonal engagement is central across most phases. |
| 4.5 | Most consequential decisions depend on communication or psychological interplay. |
| 5 | Interpersonal engagement is the primary mechanism through which the game is played and resolved. |

**Boundary rule:** Rate interpersonal engagement, not merely the ability to obstruct another player. Record blocking or direct conflict separately as descriptive mechanics. This clarification changes some historical anchors; reassess affected ratings rather than relabeling them.

### 3.5 Complexity

**Definition:** The burden of learning, recalling, and correctly executing the rules and procedures. Rate rules burden rather than strategic depth, theme, or box size. Teach time is corroborating evidence, not a universal cutoff.

| Score | Anchor |
|---|---|
| 1 | One simple procedure and clear outcome; almost no exceptions or ongoing rule tracking. |
| 1.5 | A few straightforward rules can be retained after a brief demonstration. |
| 2 | Several simple procedures or occasional exceptions require modest recall. |
| 2.5 | Multiple recurring procedures interact, but normal turns become manageable with brief guidance. |
| 3 | Several connected systems require a substantive explanation and occasional reminders or references. |
| 3.5 | Layered procedures, terminology, or phase differences create sustained rules demands. |
| 4 | Multiple interacting systems and recurring exceptions require substantial rules tracking. |
| 4.5 | Extensive exceptions, asymmetric rules, or detailed procedures create frequent reference needs. |
| 5 | Very extensive interdependent rules and procedures demand sustained preparation, reference, and management. |

### 3.6 Replayability

**Definition:** The capacity for repeated plays of the assessed product to offer meaningfully different decisions, challenges, or interactions. Distinguish variability from merely different random results. Fixed setup does not imply low replayability. Do not count unowned expansions or claim universal enjoyment.

| Score | Anchor |
|---|---|
| 1 | Once experienced or solved, the product offers essentially no new meaningful challenge without replacement/reset content. |
| 1.5 | A small amount of repeated play is supported before the same solutions or decisions recur. |
| 2 | Some variation exists, but meaningful approaches or challenges are quickly exhausted. |
| 2.5 | Several distinct experiences are supported, with repetition increasingly limiting new decisions. |
| 3 | Repeated sessions offer meaningful variation through decisions, setups, challenges, or interaction. |
| 3.5 | Multiple sources of variation regularly generate new consequential situations. |
| 4 | Broad decision or challenge variation supports sustained repeat play within the assessed product. |
| 4.5 | Deep interacting variability supports extensive exploration and changing approaches. |
| 5 | The core system supports an exceptionally broad, renewable space of consequential situations across repeated play. |

For campaign or consumable products, record content longevity separately; many hours of first-use content do not automatically imply replayability. Display an explanation: “Renewed gameplay challenges—not a prediction of how often your family will enjoy replaying.” Record structural inference separately from repeated-play observations. Low renewed challenge is not low enjoyment.

### 3.7 Resource Management

**Definition:** The importance of allocating, conserving, exchanging, or optimizing scarce assets such as cards, currency, actions, time budgets, space, or energy. Scarcity must create consequential tradeoffs. Simply having turns or holding cards is insufficient.

| Score | Anchor |
|---|---|
| 1 | No consequential allocation of scarce resources is required. |
| 1.5 | Simple use of available assets involves little scarcity or opportunity cost. |
| 2 | Occasional allocation choices create modest tradeoffs. |
| 2.5 | Regular spend/save/use decisions matter but remain straightforward. |
| 3 | Sustained management of a resource pool materially affects success. |
| 3.5 | Timing and efficiency of resource use create substantial advantages. |
| 4 | Strongly interacting resource decisions, conversions, or competing uses require careful balancing. |
| 4.5 | Persistent scarcity and layered opportunity costs drive major decisions. |
| 5 | Resource allocation and optimization organize nearly all defining decisions and success conditions. |

One resource can produce deep management; multiple currencies are not mandatory for high ratings.

**Required Resources evidence:** Identify the pool/budget, its competing uses, and at least one allocation mechanism (spend, save, reserve, replenish, exchange, convert, or distribute). A normal turn, occupied square, or mere inventory of cards is insufficient. Space or actions count only when a distinct budget/allocation tradeoff is evidenced. A mechanism may support both Strategy and Resources when the rationales explain different properties; do not award a second score merely because choices are limited.

## 4. Six vibe anchors

Luck and Strategy use Sections 3.1 and 3.3 under the shared-score policy. Assess the following four independently.

### 4.1 Dexterity

**Definition:** How strongly outcome-relevant motor execution defines play: precision, coordination, balancing, timing, and physical reaction. Slow controlled movement qualifies. Cognitive speed alone does not; a timer or “real-time” label alone is insufficient.

| Score | Anchor |
|---|---|
| 1 | Piece handling is administrative and motor execution does not affect success. |
| 1.5 | Minor motor demands occur with negligible outcome consequences. |
| 2 | Occasional motor tasks affect limited portions of play. |
| 2.5 | Motor execution recurs but has secondary influence on results. |
| 3 | Coordination, timing, or precision regularly affects success. |
| 3.5 | Motor execution shapes many important actions and materially affects results. |
| 4 | Motor performance is central to the main gameplay loop and outcomes. |
| 4.5 | Most consequential play depends on motor execution, with little compensation through other mechanisms. |
| 5 | Physical execution is the defining and primary basis of success. |

Difficulty and centrality are different: an accessible physical game can strongly fit Dexterity. Recognition-plus-motor games require evidence distinguishing the two contributions.

### 4.2 Family

**Definition:** Fit for meaningful shared play between children and adults with mixed gaming experience, under standard rules. Assess independent participation, turn engagement, manageable learning demands, and opportunities to contribute.

**Assessment context:** Family means meaningful mixed-generation participation within a documented supported age context. It does not imply suitability for every age. Use the app's child age bands as assessment contexts; record actual ages, experience, reading/numeracy demands, assistance, mode, and player count. For observed evidence, include a novice child at the youngest age claimed and a rules-familiar adult. For a provisional estimate, describe that as an assumed target group, with actual ages/observations left null. The Under 6 interface needs a bounded minimum age before a universal claim can be supported; use an explicit lower age bound and an assessed scope meanwhile; do not imply coverage of all children younger than six. Teen/adult participation can be assessed separately. An adults-only request has no implicit child Family assessment.

Use the same participation criteria below across contexts. A Family 4 for ages 11–13 is not evidence of Family 4 for ages 6–7. Resolve the assessment applicable to the selected age context; never average across bands, choose the highest score, or treat a missing context as a low score. A single Family badge must disclose its assessed age context. If Family is selected without age context, ask for it or show the explicit supported context before claiming a match. If that is too much friction in user testing, revise the product rule explicitly rather than inventing a universal score.

An age/content failure excludes the game at the separate eligibility stage. Do not assign Family 1 merely because an otherwise accessible game is outside the selected age range. Assess participation only within the stated suitable scope.
| Score | Anchor |
|---|---|
| 1 | Within the stated suitable age context, participation demands prevent meaningful shared standard play. |
| 1.5 | Shared play requires extensive simplification or adults effectively making children's decisions. |
| 2 | Children can perform some tasks but require frequent assistance and have limited independent agency. |
| 2.5 | Children make some meaningful choices but recurring guidance or long disengagement limits participation. |
| 3 | The group can play meaningfully with occasional assistance and manageable differences in participation. |
| 3.5 | Children generally participate independently after introduction; most phases sustain shared engagement. |
| 4 | Clear procedures, manageable turns, and meaningful contributions support consistent participation across the group. |
| 4.5 | Mechanisms actively support broad participation and recovery from mistakes with minimal ongoing help. |
| 5 | Independent, sustained, consequential participation across the assessed group is a defining design strength. |

Do not equate Family with guaranteed equal winning chances, low conflict, low Complexity, or short total playtime. An age-inappropriate title should not receive a high Family score from an ease-of-rules formula. Structured mixed-age observations are needed for strong accessibility claims.

**Rules-based provisional Family route:** For the claimed age range and player count, document all five: (1) reading/language and numeracy tasks, (2) rules/procedure burden, (3) opportunities for each participant to contribute, (4) elimination/waiting and recovery from mistakes, (5) expected adult assistance. Cite rules for the tasks and mark the developmental/participation interpretation as a hypothesis. Explain the selected anchor and its nearest alternative. Publisher age alone and an easy-rules formula cannot supply the score. Use the anchors as predicted participation for provisional records, not statements of observed ability. No arbitrary ceiling or default 3 is imposed. Missing material evidence keeps the rating null or beta-ineligible. Separately enforce documented age/content eligibility; the estimate does not authorize a younger age. Display, for example: “Provisional Family fit for ages 8–10; occasional help expected; not yet play-tested.”

### 4.3 Party

**Definition:** How centrally recurring expressive interaction, conversation, performance, or shared reactions form the intended group experience. Shared attention to solving a strategic or cooperative problem alone is insufficient. Quiet expression can qualify; noise, adult themes, large groups and guaranteed laughter are not required.

| Score | Anchor |
|---|---|
| 1 | No meaningful designed expressive or shared-reaction activity. |
| 1.5 | Such moments are incidental and infrequent. |
| 2 | Occasional shared reactions or expression supplement another primary task. |
| 2.5 | Recurring expressive or reaction moments support play but remain secondary. |
| 3 | A recurring expressive, conversational, performative or shared-reaction mechanism is central to the intended experience, with meaningful downtime or uneven participation. |
| 3.5 | That mechanism shapes many phases and repeatedly involves the group. |
| 4 | That mechanism is central throughout most play, with limited designed disengagement. |
| 4.5 | Nearly all phases provide expressive or shared-reaction involvement, including outside one's turn. |
| 5 | Broad ongoing expressive or shared-reaction participation defines the core loop. |

For 3+, name the qualifying mechanism, who participates, and its recurrence. Necessary tactical communication alone does not pass. Communication that is itself the expressive challenge (such as giving and interpreting word clues) may pass. A physical performance with shared suspense can pass when supported by the design, not merely imagined laughter. Cooperation, negotiation, simultaneous play or a publisher's Party tag never supplies a score automatically. Record supported player count, elimination, familiarity/language demands and limitations. Rules-based values predict design fit; beta observations test actual experience.

### 4.4 Spatial Play

**Definition:** Dependence on a structured spatial representation—board, map, grid, routes, tiles, or spatially arranged cards—for meaningful decisions. Materials do not determine the rating. A score track alone is bookkeeping unless positions create consequential choices. Include consequential physical support relationships. Exclude identity lookup, decorative layout and scalar answer displays; moving a dial to report a conceptual answer alone does not qualify.

| Score | Anchor |
|---|---|
| 1 | No structured spatial relationships affect meaningful decisions. |
| 1.5 | A surface or layout is decorative or incidental bookkeeping. |
| 2 | A layout aids organization but removing its spatial relationships would barely change decisions. |
| 2.5 | Spatial relationships influence recurring secondary choices. |
| 3 | Movement, placement, adjacency, or paths regularly affect consequential choices. |
| 3.5 | Spatial relationships are central to several major mechanics. |
| 4 | Most major choices depend on position, connectivity, distance, or spatial control. |
| 4.5 | Structured spatial relationships organize nearly all major actions and interactions. |
| 5 | Spatial relationships are indispensable to the defining decisions and core gameplay loop. |

Use **Spatial Play** as the scored label. The internal key may remain `board` for compatibility, with the new standard version attached; do not relabel old scores without reassessment. Record physical-board presence separately as a sourced, nullable factual tag (`usesPhysicalBoard`), never a score or shortcut to qualification. Define a board as a purpose-built rigid/foldable play surface; record mats, towers and card grids separately as components rather than forcing an unknown fact. Customer comprehension of the new label remains a beta question.

A fixed board can score 5. Spatially constructed word grids can qualify without a printed board. Physical stacking counts only where support/position governs choices. Removing or rearranging a layout while preserving all identities is a useful diagnostic: if decisions remain effectively unchanged, the layout may be organizational rather than spatial. This diagnostic is not the sole rule.

## 5. Eleven game types

Retain as descriptive, overlapping tags. They do not supply or override numerical scores. Category examples in the original document are illustrative historical entries, not verified calibration scores. Classification should use the specified edition/mode and actual rules.

| Type | Qualification rule |
|---|---|
| Abstract Strategy | Core strategic position/placement play with minimal theme and minimal consequential randomness; record borderline cases rather than forcing membership. |
| Tactical/Strategic | Consequential planning and tactical choice are central design features. |
| Social Deduction | Inference about concealed player identity, allegiance, intention, or actions drives interpersonal play. Hidden roles are common, not universally required. |
| Party | Designed around shared group entertainment; apply the Party rubric for numeric fit. |
| Family/Kid | Intended or evidenced accessibility for children/families; record age context. This broad legacy tag is not proof of high Family vibe fit. |
| Dexterity/Action | Motor execution is central to play. |
| Resource Management/Economic | Scarcity, allocation, exchange, or optimization is central. Economic theme alone is insufficient. |
| Puzzle/Logic | Solving patterns, constraints, or deductions is central; a single correct answer is not mandatory. |
| Cooperative | Participants share a primary win/loss objective against a challenge or system; mark traitor/semi-cooperative modes explicitly. |
| Trivia/Knowledge | Recall or application of external knowledge is a core challenge. |
| Team-Based | Opposing teams with shared team outcomes form the assessed primary mode. |

Cooperative and Team-Based are participation-format tags; the others describe experience or mechanics. These tags are not mutually exclusive and are not proposed as eleven additional Find a Game filters.

## 6. Assessment and approval workflow

### Required record

Each assessment records game identity; edition; mode; assessed player-count range; rules/expansions included; standard version; rating key and value (or null); status (unassessed/proposed/reviewed; existing code may call reviewed `approved`); evidence references; gameplay observations; rationale explaining the chosen anchor and its neighbors; assessor/date; reviewer/date; unresolved limitations. Family assessments also record ages and assistance conditions; Replayability assessments record repeat-play basis.

Separate evidence basis (rules, observed play, repeated play) from workflow status (unassessed, proposed, reviewed). “Reviewed” means a human checked the cited evidence, not independent validation. Store the applicable rubric version and unresolved limitations. Do not show a confidence percentage without a validated estimation method.

Rules can substantiate mechanics. Observed play is especially important for accessibility, engagement, and repeated-play claims. Reviews and marketing can identify leads but do not alone establish approval. Do not imply a playtest occurred when the assessment is rules-based. AI-generated rationales remain proposed until a human reviews the supporting evidence.

Approval requires complete applicable evidence, valid values, resolved scope, and the approved standard version. One person may assess and approve during founder-led operation if disclosed; this is not independent validation. A missing field must generate a useful blocker, not a runtime exception.

### Explicit provisional beta policy

The owner authorizes a beta route; this does not promote AI proposals to human-reviewed status. Keep `status=proposed` for AI assessments and a separate `betaEligible` decision with reason/date/standard version. No invented reviewer identity or observation date. Define evidence basis per rating: rules-based inference, observed play, or repeated play. Approval of this document is not approval of every game assessment.

An assessment is beta-eligible only when its value is valid, current edition/mode/player/age scope applies, evidence and neighboring-anchor rationale are present, material source/definition questions are resolved, and the provisional label can be shown. Unsupported actual-experience claims, unresolved qualification boundaries and missing material facts block the affected rating. Unrelated missing dimensions do not block a selected-vibe match; show an incomplete profile honestly. Hard age/content/time/player constraints and provider/content authorization remain separate gates. No score creates permission to use BGG or artwork.

Reviewed-only mode requires reviewed assessments. Explicit beta mode accepts either reviewed assessments or proposed assessments with `betaEligible=true`. Beta never silently turns on in a reviewed-only deployment. Filters, charts, and explanations resolve the same scoped record and show “Provisional” wherever a provisional assessment is used. Source detail may sit behind “How this was rated.” Do not call these ratings verified, validated, accurate to half a point, or evidence of superiority.

### Lightweight beta feedback

After a real session, offer an optional “Did this match the vibe?” (Yes / Partly / No), then the characteristic that felt wrong and an optional short explanation. Family follow-up asks youngest age, game familiarity and assistance (none / occasional / frequent / adult made decisions). Ask for age in years, not names or birthdates. Capture edition/mode/player count, selected filters, displayed score and rubric version, whether played, and relevant accessibility context when volunteered. Store feedback separately from canonical assessments; never average responses directly into ratings or claim independent reliability from user satisfaction.

Triage incorrect facts and hard-filter failures first, then scope errors, repeated characteristic mismatches and 2.5/3.0 boundaries. One credible factual correction can justify action; repeated opinion is a review signal, not automatic truth. Record evidence, before/after values, rationale and version; reassess affected cases and rerun relevant checks. Independent scoring can come later. Do not silently broaden searches: explain an empty result and let the user explicitly choose which filter to relax.

### Beta development now; independent calibration later

Use an initial 25–30-game pilot covering deterministic planning, chance, motor execution, recognition/memory, mixed-age participation, social deduction, party play, resource allocation, and spatial cards/tiles. This is a practical pilot size, not a statistically powered validation sample. Include cases near 2.5/3.0 and multiple modes/player counts.

When independent review becomes feasible, two reviewers receive the same evidence and independently score before discussion. This is deferred, not a prerequisite for documented provisional beta use. Record original scores permanently before adjudication. Report per characteristic: exact agreement, agreement within 0.5, the distribution of differences, and agreement on qualification at 3.0. Report counts and denominators; do not pool all characteristics to hide a weak one. An ordinal agreement statistic may supplement these results with uncertainty where expertise/sample size permit. Reviewer agreement alone does not establish that a construct is useful or correct.

Before promoting affected ratings to the reviewed path, adjudicate every qualification disagreement and every difference of 1 point or more. During beta, unresolved definition/qualification issues block that particular assessment from filtering; ordinary disclosed experiential uncertainty does not automatically block a well-supported estimate. Do not simply average scores. Rewrite ambiguous anchors and repeat independent assessment on fresh cases; retain unresolved constructs as provisional. Self-review may prepare pilot records but cannot demonstrate inter-reviewer consistency. No universal reliability cutoff is claimed here.

Run a separate small household pilot (initial planning target: 10–15 households, varied ages and gaming experience). Ask users to explain labels in their own words, then select games for real sessions. Record time to choose, selected versus rejected suggestions, reasons, perceived fit after play, empty results, assistance, and age/time/player mismatches. Where feasible, alternate the rubric-assisted experience with the same catalog's basic age/time/player filtering; keep catalogs and constraints comparable. Seek evidence that vibes improve choices without adding excessive effort. These planning targets are design choices, not research-established thresholds.

**Evidence reporting:** Publish the beta scope, corrections, remaining limitations and available feedback. Report original agreement results and household findings only once collected; explicitly state when absent. Every known hard-filter defect must be resolved; every released rating must have resolved scope and evidence. Expand gradually only after review of that report. Do not advertise scientific validation or superiority on the basis of this document, passing code tests, or an adjudicated sample alone.

Use fictional cases below to test logic. Real games become calibration examples only after assessment; source-document examples are not automatic approvals.

| Fictional case | Expected decision |
|---|---|
| No choices; random draws solely decide winner | Luck 5 is supported; Strategy 1 is supported. |
| Deep multi-turn planning plus consequential random events | High Strategy and high Luck may coexist. |
| Fast recognition with ordinary untimed piece handling | Skill may be high; Dexterity is not automatically high. |
| Slow balancing is the main success task | High Dexterity is possible without speed. |
| Quiet group expression with sustained shared attention | High Party is possible without noise or guaranteed laughter. |
| Cards form an indispensable grid with positional choices | High Spatial Play is possible without a printed board. |
| Family 4, Strategy 2.5; both selected | Does not qualify for the standard combined filter. |
| Family 4; Party unassessed; both selected | Does not qualify; unknown is not a passing score. |

## 7. Filtering, ranking, and explanation contract

### Standard Find a Game

Apply player count, selected age/content restrictions, and maximum listed playtime first. Preserve those independent constraints. Family is not an age substitute. Require a policy-eligible applicable rating of at least **3.0 for every selected vibe** (AND semantics). Eligibility follows the explicit reviewed-only or provisional-beta policy in Section 6. No selected vibes means no vibe threshold, not “must score 3 on all six.”

Unknown, invalid, stale, out-of-scope or policy-ineligible selected-vibe ratings cannot pass. A documented beta-eligible proposal can pass only in explicit beta mode. Return fewer results or an honest empty state when necessary; do not silently relax requirements to fill three slots. Offer Adjust Filters. Existing 3-owned/3-unowned grouping and reroll exclusions remain.

### Advanced filters: make the requested operation explicit

Standard selection continues to require every selected vibe at 3.0 or above. Advanced controls must explicitly distinguish:

- **At least:** score is at or above the chosen level.
- **Range:** score is between both displayed endpoints, inclusively.
- **Exactly:** score equals the chosen allowed half-point value.

Use a clearly displayed range as the preferred advanced browsing interaction; retain Exactly for users deliberately requesting equality. A selected range or exact target replaces the default 3.0 minimum for that same vibe, including deliberate low-Luck requests. Other selected vibes still require 3.0. No silent widening, nearest-match fallback, or conversion of existing saved exact targets into ranges. “Closest to” can be explored separately later but is not a hard filter in this edition. This is a product policy, not a claim that half-point categories are objectively precise measurements.

### Ranking

Only eligible games are ranked. No ownership bonus, popularity score, preference, affiliate consideration, or rating average may compensate for failing a constraint. Ranking cannot alter the descriptive ratings.

**Pilot ranking policy:** Keep owned and unowned results in separate pools. Within each pool, prefer an evidenced best-player-count match; retain other eligible games. Use a stable, seeded order among otherwise tied games for a session, with reroll exclusions preserved. Selected-vibe threshold compliance establishes eligibility, not a mandate to maximize each selected rating. This intentionally simple baseline makes added ranking rules testable.

Do not use popularity, affiliate revenue, or an ownership bonus to rank within these pools in the calibration baseline. Later ranking changes require a stated hypothesis and comparison with this baseline using selection usefulness and user feedback. There is no claim this baseline is optimal. The earlier +18 ownership, +8 best-count, BGG rating, and vibe-average formulas remain historical code facts, not the approved target behavior. Personal preferences must never change descriptive ratings; no new personalization coefficients are established here.

### Display and explanations

The spider chart displays the seven dimension ratings with labeled ticks 1 through 5, consistent axes, and underlying values unchanged. Proposed geometry uses a zero baseline only as an unlabeled plotting origin so a rating of 1 remains visibly above the center; 0 is not an assessable value. Missing dimensions must display “Not rated,” never a fabricated polygon point. A partial profile should use a list or incomplete visualization with explicit missing indicators.

Show vibe fit separately from dimension ratings. Do not label the recommendation-ranking number as a rubric rating or percentage match without a separately approved conversion. Generate explanations from the same assessed values used for filtering. In exact mode, a deliberately low target is a successful match; do not describe it as a poor match merely for being below 3.

## Developer appendix

## 8. Implementation and migration requirements

1. Keep the original documents unchanged. Record the approved standard version and a change log.
2. Establish a shared rating-level type and runtime validator for all canonical assessments. Separate structural validity from approval/publishability. Implement publishability from explicit gates, rather than a permanent hard-coded false or an unguarded true.
3. Store edition/mode-scoped, versioned assessments. Derive all selected-vibe values from policy-eligible scoped assessments; preserve references for shared Luck/Strategy and age-scoped Family records. Numeric vibe badges come from qualifying policy-eligible ratings and retain evidence labels. Descriptive game-type and component tags are separate sourced facts, never generators of scores.
4. Rename dimension preference types clearly (for example, DimensionPreferenceWeights). Do not treat equal default personal preferences as the original rubric weights.
5. Remove keyword/formula vibe inference from the approved scoring path. Legacy records may remain available for collection browsing with ratings clearly labeled legacy/unassessed; they must not impersonate approved ratings.
6. Never blindly divide 0–100 legacy dimension values by 20. Convert only where documented provenance proves the exact original mapping and values conform to the approved anchors. Otherwise reassess. Do not round computed 4.3 or 2.6 vibe estimates into supposedly approved half-point ratings.
7. Apply one eligibility policy to Find, Discover when filters are active, and pickTonight. Inspect the reviewed-facts adapter before claiming the whole application complies. Surprise Me remains an owned-game randomizer unless a filter context is explicitly part of its product flow.
8. Update exact-target behavior, match labels, explanations, and chart scale together. Replace tests that preserve obsolete heuristics with tests for approved behavior; retain age/time, ownership, reroll, and identity regression coverage.
9. Exercise the beta path on a small documented provisional catalog before expanding; exercise the reviewed-only path separately. Keep a reversible checkpoint and provenance for old and new values. Do not fabricate assessments to avoid empty results.

### Additional beta acceptance cases

- A proposed record fails reviewed-only mode even if beta-eligible; it passes beta mode only with valid applicable evidence, scope, standard version and beta eligibility.
- Approval of the standard alone never changes a record's status to reviewed.
- A Family estimate for ages 8–10 cannot satisfy ages 6–7. Unknown Family never becomes an automatic 3. An adult-only context does not invent a child assessment.
- A selected provisional score appears with the same value and “Provisional” label in filtering, explanations and profile display.
- A physical-board fact never overrides a failing Spatial Play value. Tactical cooperation alone never establishes Party 3+.
- Feedback is stored separately and cannot directly change canonical scores or thresholds.
- An empty result stays empty until the user explicitly changes constraints. Beta eligibility never bypasses hard filters or provider authorization.

### Minimum acceptance cases

- Reject 0, 3.7, 5.5, NaN, infinity, and numerical strings as canonical ratings; accept all nine specified levels.
- Missing evidence/ratings produce clear blockers and no crash. A structurally correct unapproved assessment can be structurally valid yet not publishable.
- Family 4 / Strategy 2.5 fails when both vibes are selected; Family 4 / Strategy 3 passes the vibe gate if policy-eligible/applicable.
- Missing any selected rating fails; no selected vibes do not require unrelated scores.
- Exact Luck 2 matches reviewed 2, not 1.5 or 2.5. Range Luck 1.5–2.5 includes both endpoints and 2. A simultaneous Party selection still requires Party 3+. Saved exact targets retain exact semantics.
- Family reviewed for ages 11–13 cannot satisfy a request for ages 6–7; missing applicable context blocks the Family match with an explanation. A separate age failure never becomes an invented Family rating.
- Ranking is reproducible for a session seed and never changes eligibility; unknown best-player-count evidence receives no invented best-match status.
- Popularity and ownership never rescue a failed filter. Missing popularity does not change descriptive ratings.
- Skill and Dexterity may differ; Social and Party may differ; shared Luck/Strategy cannot diverge under this policy.
- Age and maximum-listed-time boundaries remain enforced. Multiple selected vibes use AND semantics.
- Rerolls exclude prior IDs and stop at exhaustion; fewer than three qualifying games are returned honestly.
- Chart labels/tooltips show 1–5 values; missing scores are never drawn as zero; legacy values are not silently relabeled.

## 9. Evidence, validation limits, and BGG dependency

Sources checked November 14, 2026. These sources inform design principles or provider requirements; none validates GameFinder's proposed scores.

| Source | Supported point | Limit of application |
|---|---|---|
| [BGG Weight](https://boardgamegeek.com/wiki/page/Weight) | BGG documents multiple interpretations of weight | Supports clarifying our constructs, not claiming our accuracy is better |
| [Quantic Foundry model development](https://quanticfoundry.com/2016/09/21/board-game-profile-v2/) | Its motivation model was revised using factor analysis and responses from over 40,000 gamers | A player-motivation survey is not validation of our game-assessment rubric |
| [COSMIN content-validity Delphi study](https://pmc.ncbi.nlm.nih.gov/articles/PMC5891557/) | Relevance, comprehensiveness, and comprehensibility are key content-validity considerations | Developed for patient-reported measures; we borrow general review questions, not clinical certification or numerical cutoffs |
| [Board Game Stats filters](https://www.bgstatsapp.com/explanations/advanced-filter/) | Existing products support practical collection/context filtering | A comparator for the pilot, not evidence our additional vibes improve choices |
| [BGG API guidance](https://boardgamegeek.com/using_the_xml_api) | Registration/authorization is required; replies may take a week or more; paid benefits and advertising make an application commercial | No guaranteed turnaround or approval. Check the actual authorization scope before enabling the provider |

### Evidence questions for every proposed revision

Is the definition relevant to the intended decision? Does it omit a material aspect? Do assessors and users understand it as intended? Can reviewers distinguish neighboring anchors using the same evidence? Does its use improve selection without unacceptable friction? Keep answers and counterexamples with the calibration report.

### BGG while approval is pending

Continue rubric development, fictional acceptance cases, and a small catalog supported by independently obtained, appropriately usable rules and observations. Keep BGG integration disabled pending applicable authorization. Application approval, commercial permission, and permission for particular assets/content must not be conflated. GameFinder's own ratings need their own provenance and validation regardless of metadata provider.

BGG says a response can take a week or more. The submission date is not known here. If approximately two weeks pass without a response, one concise status follow-up is a reasonable project practice, not a BGG deadline. Check application status and the original correspondence. Disclose subscriptions, ads, and intended affiliate use when describing monetization; do not assume a token alone resolves every intended use. No email has been sent as part of this revision.

## 10. Revision record

**0.3 — November 14, 2026:** Owner-authorized provisional beta development. Tightened Party, Skill, Resources and Luck evidence boundaries; renamed scored Board to Spatial Play and separated physical-board facts; clarified Replayability as renewed challenge; permitted documented age-scoped provisional Family estimates; separated beta eligibility from human review; deferred independent scoring; added lightweight feedback, explicit widening and beta acceptance cases. Retained the 1–5 half-point scale, 3.0 provisional cutoff, AND semantics, hard constraints, ranking baseline and source appendices. The stress-test report includes a 0.3 reassessment alongside the original 0.2 audit. No application migration or beta observation is claimed.


Version 0.2 implemented the earlier critique: a short governing layer, shared identical constructs, clearer execution anchors, age-scoped Family assessment, explicit advanced operations, a simple testable ranking baseline, independent calibration, household feedback, and source/claim boundaries. The 0.1 decision table is retired. Original source wording below is historical, not active policy where it conflicts with the working standard above.

The source categories and 1–5 half-point scale are retained. Luck/Strategy are harmonized; Social is clarified as interpersonal engagement; Complexity as rules burden; Replayability as renewed challenge within the assessed product; Resource Management as consequential scarce-asset allocation. Physical Skill is presented as Dexterity, Party as designed shared engagement, and Board as functional spatial dependence. These are explicit refinements subject to calibration, not assertions that the original sources contained the revised wording.

## Appendix A. Original Game Rubrics.docx text

Historical source transcription; original wording retained, formatting simplified. Use the working policy above for calibration; these historical anchors are not active instructions where they conflict.

Rubric 1: Game Components

1. Luck

Definition:
The extent to which a game’s outcome is influenced by random or unpredictable events rather than player decision-making. Includes dice, shuffled cards, random draws, surprise effects, etc.

| Score | Descriptor |
| --- | --- |
| 1.0 | Purely deterministic; no randomness at all (e.g., Chess). |
| 1.5 | Very rarely do minor random events affect results. |
| 2.0 | Some chance elements, but outcomes still largely skill-based. |
| 2.5 | Moderate randomness—luck influences turns but not dominance. |
| 3.0 | Balanced luck and decisions; both can tip the game. |
| 3.5 | Luck often alters key outcomes even with good play. |
| 4.0 | Random events regularly override strategy or skill. |
| 4.5 | Game is dominated by randomness, though still engaging. |
| 5.0 | Outcome is entirely luck-based (e.g., Candy Land). |

2. Skill

Definition:
Measures the importance of real-time cognitive or physical performance: speed, memory, observation, dexterity, or mental agility.

| Score | Descriptor |
| --- | --- |
| 1.0 | No performance needed; decisions are leisurely or automated. |
| 1.5 | Slight benefits from reflexes or basic awareness. |
| 2.0 | Occasional boosts from alertness or matching skills. |
| 2.5 | Steady rewards for fast hands or sharp minds. |
| 3.0 | Skill matters—practice improves results. |
| 3.5 | High-speed recognition or timing gives real edge. |
| 4.0 | Mastery of speed or dexterity greatly improves success. |
| 4.5 | Excellent players dominate through sharp execution. |
| 5.0 | Pure performance; fastest or most accurate always wins. |

3. Strategy

Definition:
How much the game rewards planning, foresight, and long-term decision-making. Includes ability to form plans, adapt, and outthink others.

| Score | Descriptor |
| --- | --- |
| 1.0 | No strategy—random or reactive only. |
| 1.5 | Very basic choices with limited depth. |
| 2.0 | Some short-term tactics or blocking moves. |
| 2.5 | Players can begin to plan a few steps ahead. |
| 3.0 | Strategy helps win, but not essential. |
| 3.5 | Good strategy often trumps weaker plays. |
| 4.0 | Players must plan ahead and weigh multiple factors. |
| 4.5 | Multiple paths to victory and strategic layers. |
| 5.0 | High-level, deeply strategic; long-term plans win the day. |

4. Social Interaction

Definition:
How much a game requires or encourages interpersonal communication—talking, bluffing, persuasion, cooperation, conflict, or alliance-making.

| Score | Descriptor |
| --- | --- |
| 1.0 | No interaction; solo or parallel play. |
| 1.5 | Very limited interaction; players don’t affect one another. |
| 2.0 | Occasional passive or rule-based interaction. |
| 2.5 | Some turns require negotiation or observation. |
| 3.0 | Players regularly engage or interfere with one another. |
| 3.5 | Alliances, blocking, or light bluffing shape the game. |
| 4.0 | Heavy player involvement; table talk matters. |
| 4.5 | High psychological interplay; social manipulation required. |
| 5.0 | Purely social; gameplay is driven entirely by discussion (e.g., Mafia). |

5. Complexity

Definition:
The difficulty of learning, remembering, and executing rules. Includes the depth of systems, number of components, interactions, and player responsibility.

| Score | Descriptor |
| --- | --- |
| 1.0 | Incredibly simple, could be learned in under 30 seconds. |
| 1.5 | Very easy, understandable by nearly anyone quickly. |
| 2.0 | Still simple but has some rules or exceptions. |
| 2.5 | Entry-level strategy game complexity. |
| 3.0 | Mid-weight; takes 10–20 minutes to teach. |
| 3.5 | Layers of rules and some advanced terminology. |
| 4.0 | High cognitive load; must manage multiple mechanics. |
| 4.5 | Very deep systems with exceptions and reference needs. |
| 5.0 | Complex enough for advanced players only (e.g., Twilight Imperium). |

6. Replayability

Definition:
How fun, interesting, or variable the game is after repeated plays. Includes dynamic setups, strategy diversity, player-driven outcomes, and emotional variability.

| Score | Descriptor |
| --- | --- |
| 1.0 | Almost no replay value—same experience every time. |
| 1.5 | Fun once or twice, but quickly repetitive. |
| 2.0 | Enjoyable occasionally, but limited new content. |
| 2.5 | May hold interest for a few sessions or with varied players. |
| 3.0 | Good for rotation; still fun with group or time gaps. |
| 3.5 | Variable outcomes; new choices emerge regularly. |
| 4.0 | Expansions, mechanics, or setups support lots of play. |
| 4.5 | Highly dynamic; group and strategy always evolve. |
| 5.0 | Endless replayability—every session feels fresh. |

7. Resource Management

Definition:
How much players must track, allocate, and optimize limited in-game assets (cards, currency, actions, time, space, or energy).

| Score | Descriptor |
| --- | --- |
| 1.0 | No resource management—just react or respond. |
| 1.5 | Simple hand or token use without real pressure. |
| 2.0 | Light decision-making with cards or actions. |
| 2.5 | Regular but straightforward choices: spend, save, or risk. |
| 3.0 | You must manage a pool of resources consistently. |
| 3.5 | Efficiency matters—good use of resources improves results. |
| 4.0 | Multiple resources or conversions to balance. |
| 4.5 | Tense, layered decisions with shortfalls and trade-offs. |
| 5.0 | Central to the game—juggling resources drives every decision. |

Rubric 2: Game Types

1. Abstract Strategy Games


Definition:
Games with minimal or no theme, where the gameplay is purely based on strategic movement or placement. These games are deterministic, with no or extremely limited luck or hidden information.

Key Features:

Focus on spatial control, logic, and long-term planning

Often two-player

Rarely use cards, dice, or randomness

Clear win conditions through position or capture

Examples: Chess, Checkers, Blokus, Quoridor, Goblet!, Iota

Clarification:
If the game’s decisions are strategic but include thematic elements or randomization, it likely belongs in strategy or tactical games instead.

2. Tactical/Strategic Games

Definition:
Games that emphasize decision-making, planning, and optimization, often with variable setups or mechanics. They may include themes but focus more on outwitting or outmaneuvering opponents or systems.

Key Features:

Often include resource management, territory control, or card drafting

Some include minor random elements, but strategy dominates

Long-term and short-term decisions matter

Examples: Azul, Carcassonne, Splendor, Wingspan, Port Royal, Ticket to Ride

Clarification:
Games with stronger economic engines go into the resource/economic category; games with pure long-term strategy but no theme are abstract.

3. Social Deduction Games

Definition:
Games where players must use conversation, observation, or deduction to uncover hidden roles, alliances, or actions. They often involve bluffing, lying, or subtle behavioral clues.

Key Features:

Players are secretly assigned roles or goals

Gameplay often revolves around suspicion and discussion

Elimination may occur, but not always

Examples: One Night Ultimate Werewolf, The Chameleon, Coup, Secret Hitler

Clarification:
Games with bluffing but no hidden roles might better fit party or negotiation categories.

4. Party Games

Definition:
Designed for large groups, often playable with mixed ages or experience levels. Emphasize social interaction, humor, or quick turns, and typically have simple rules.

Key Features:

Often team-based or free-for-all

Light rule complexity

May reward creativity, fast thinking, or social wit

Examples: Telestrations, Hot Seat, Things..., Hues and Cues, Double Ditto, Happy Salmon

Clarification:
If there's a social deception component, also consider the social deduction category. If there's a scoring engine or long-term play, it might lean toward light strategy.

5. Family/Kid Games

Definition:
Games designed to be accessible for young children or families, with simplified rules, visual aids, and shorter game time. Learning is intuitive and often supported by luck elements to balance age gaps.

Key Features:

Easy to learn and teach

Fun across wide age ranges

May rely more on luck than strategy

Usually low in conflict or player elimination

Examples: Candy Land, Go Fish, Old Maid, Pop the Pig, Perfection, Hyper Jump

Clarification:
Some family games are also party games or dexterity games, depending on the structure and energy level.

6. Dexterity/Action Games

Definition:
Games that require physical precision, timing, or coordination. Often fast-paced and great for groups that enjoy kinesthetic challenges.

Key Features:

Real-time or turn-based physical tasks

May involve stacking, flicking, slapping, balancing

Mistakes often result in penalties or consequences

Examples: Jenga, Tenzi, Bop-It, Slingz, Topple, Quick Cups

Clarification:
Dexterity elements combined with strategy or logic (e.g., Gravity Maze) might also be classified under puzzle or spatial reasoning.

7. Resource Management / Economic Games

Definition:
Games where players must carefully manage limited resources, currencies, time, or inventory to maximize efficiency and gain victory.

Key Features:

Includes actions like collecting, converting, spending, trading

Often includes a market, supply/demand mechanic, or action points

Success is based on optimizing choices

Examples: Catan, Catan Jr., Quacks of Quedlinburg, Magic Maze, Reign of Dragoness, Project L

Clarification:
Games with heavy economic themes and long playtimes may also fit under strategy games, but resource tension should be the focus to qualify here.

8. Puzzle/Logic Games

Definition:
Games that challenge players with pattern recognition, deduction, or problem-solving. They may be solo or multiplayer and often involve a “right” answer.

Key Features:

Minimal player interaction; focus is on solving challenges

May involve spatial manipulation, logic grids, or deduction

Replayability depends on puzzle variation

Examples: Kanoodle, Gravity Maze, Izzi, Set, Memory Match, Simon

Clarification:
If the puzzle is embedded in a thematic story or social setting, consider dual-labeling with adventure or party categories.

9. Cooperative Games

Definition:
All players work together toward a shared goal, often against the game itself. Requires team communication, strategic planning, and collaborative execution.

Key Features:

Players win or lose together

Often includes threats, crises, or timed challenges

Some roles may be asymmetric or specialized

Examples: Pandemic, Harry Potter Hogwarts Battle, Magic Maze, The Fox in the Forest Duet

Clarification:
Some co-op games allow a hidden traitor — these may overlap with social deduction (e.g., Dead of Winter).

10. Trivia/Knowledge Games

Definition:
Games that test players' recall of facts, cultural knowledge, or quick mental associations. Winning depends on what you know, not how you play.

Key Features:

Questions with right/wrong answers

May involve time limits or random difficulty

Often themed (e.g., movies, history, science)

Examples: Trivial Pursuit, Name 5, Guess in 10, Harry Potter Trivia, Think 'N Sync

Clarification:
Games that reward speed of recall and matching rather than knowledge depth might also fit in party or skill categories.

11. Team-Based Games

Definition:
Games designed for two or more teams competing against each other, where teamwork is essential to success. Typically found in party, trivia, or deduction formats but unified by the team structure.

Key Features:

Players are divided into opposing teams

Victory is shared within the team

May involve communication, guessing, or timed play

Turns or actions often alternate between teams

Examples: Codenames, Guesstures, Catch Phrase, Pictionary, Taboo

Clarification: A game should only be classified here if team play is the primary format—not just a variant.


## Appendix B. Original Simple Rubric.pdf text

Historical source transcription with original wording. Page breaks and whitespace are simplified.

```text

                                        Simple Rubric

1. Luck

Definition: The extent to which outcomes in a game are determined by random chance rather
than player decisions or skill.
Luck can stem from dice rolls, shuffled cards, spins, hidden information, or random draws.
NOT to be confused with: Strategy or Skill. A game can involve some choice, but if those
choices are regularly overpowered by randomness, it leans toward Luck.

Score Description
1     Outcomes are fully determined by player decisions; almost no randomness involved.
1.5 Very light luck—maybe a tie-breaker or opening condition involves chance.
      Small random elements (e.g., draw order, dice for minor events), but strategy clearly
2
      dominates.
      Balanced mix of chance and control. Outcomes can go either way depending on luck and
2.5
      planning.
      Randomness affects gameplay regularly, but players still make meaningful decisions to
3
      mitigate it.
3.5 Many actions are luck-driven, but players can influence or react strategically.
4     Most of the gameplay revolves around luck, though basic tactics may help.
4.5 Almost entirely based on luck, with very few ways to influence results.
      Completely luck-based. Players have little or no agency over outcome (e.g., War, Chutes
5
      & Ladders).


2. Strategy

Definition: The degree to which the game requires thoughtful planning, forward-thinking, and
decision-making over time.
Strategy often includes resource management, positional play, timing, and risk/reward judgment.
NOT to be confused with: Luck or Skill. Strategy is about mental planning, not reacting quickly
or moving dexterously.

Score Description
1     No strategy needed. Just follow instructions or play randomly.
1.5 Players make basic choices, but they rarely affect outcomes.
2     Some decisions matter, but gameplay doesn’t reward long-term planning.
2.5 Requires tactical thinking with light long-term strategy.
      Good decisions significantly influence success, but other elements (luck, social play)
3
      compete.
3.5 Clear rewards for consistent strategic choices. Some adaptability is key.

Score Description
4     Strong emphasis on multi-turn planning and complex decision trees.
4.5 Strategic thinking is essential; one bad plan can cost you the game.
      Deep, layered strategy with little to no randomness. The most strategic player almost
5
      always wins.


3. Skill (Physical Ability)

Definition: The degree to which physical dexterity, hand-eye coordination, or reaction speed
affect a player’s success.
NOT to be confused with: Strategy (mental planning) or Party (fast-paced social engagement).
Skill is about how well your body performs the task.

Score Description
1     No physical skill involved. Sit, think, play.
1.5 Minimal movement like flipping a card or rolling a die.
2     Some motor control or timing matters but is not critical to success.
2.5 Physical actions affect outcome but are not make-or-break.
3     Reaction time, precision, or motor skill regularly influence results.
3.5 Skillful players consistently outperform others in dexterity.
4     Physical ability is central to success, though there may be a light strategy layer.
4.5 Extremely dependent on rapid physical responses. Tiny motor differences matter.
      Entirely skill-based: speed, reflexes, or coordination dictate outcomes (e.g., Dutch Blitz,
5
      Jungle Speed).


4. Family

Definition: How accessible and enjoyable the game is for a mixed-age, multi-skill group
(typically parents and children).
This includes ease of learning, short playtime, inclusive themes, and forgiving mechanics that
allow younger or casual players to participate meaningfully.
NOT to be confused with Party games, which are often more energetic, silly, or adult-themed.
Family games are about intergenerational play and accessibility.

Score Description
1     Not suited for families—long, complex, adult-oriented.
1.5 Can technically be played with families but not recommended due to themes or difficulty.
2     Younger players can play with assistance; not ideal for all ages.
2.5 Approachable for older kids and teens; some simpler roles available.
3     Good family fit if players are patient or experienced.

Score Description
      Works well across a broad age range, but some moments might lose younger kids’
3.5
      interest.
4     Very accessible and enjoyable for families with kids ages 7+.
4.5 Clear rules, short turns, everyone gets to play and contribute.
      Ideal family game: fun, fair, fast, and friendly across all ages (e.g., Outfoxed, Ticket to
5
      Ride: First Journey).


5. Party

Definition: The extent to which a game is designed for group energy, laughter, quick rounds, and
social chaos.
Party games are about having fun together more than winning. They tend to support many
players, have simple rules, and focus on humor, communication, or action.
**NOT to be confused with Family (calmer, intergenerational) or Skill (focused performance).

Score Description
1     Not a good party game—slow, strategic, or quiet.
1.5 Possible with a small group, but not very engaging in social settings.
2     Can work as a party game, but better alternatives exist.
2.5 Sometimes used in parties but not designed for it.
3     Fun with the right crowd; still has downtime or complex rules.
3.5 Very fun socially, but best with specific group sizes or familiarity.
4     Engaging, funny, and fast-paced for most groups.
4.5 Excellent for large groups, laughs guaranteed, minimal downtime.
      Purpose-built party game: fast, hilarious, easy, and inclusive (e.g., Telestrations,
5
      Wavelength).


6. Board

Definition: The degree to which a game relies on a physical board layout with structured
spatial movement or positioning as a core mechanic.
Includes modular tiles, fixed maps, or tracks. This category considers how critical a board is to
how the game plays.
**NOT to be confused with card-based games, dexterity games, or party games without a map or
spatial path.

Score Description
1     No board or spatial layout; components are abstract or card-only.
1.5 A central space exists but doesn’t impact gameplay.

Score Description
2     Has a board, but its layout is minor or purely decorative.
2.5 A board exists and contributes moderately to the experience.
3     Movement or placement on the board is common but not dominant.
3.5 Spatial decisions matter, but the game could work in another format.
4     Board layout is crucial to gameplay decisions (e.g., blocking, route planning).
4.5 Strategic or tactical movement is central; the board is essential.
      The board defines the entire experience. Everything revolves around spatial layout and
5
      navigation (e.g., Catan, Ticket to Ride).


```
