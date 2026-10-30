# GameFinder catalog acceptance policy v1

**Checkpoint 05B3 proposal.** This policy defines research and approval states; it does not authorize metadata edits or change runtime recommendations. Product-owner approval is required before adopting the policy or changing filter behavior.

## Practical acceptance levels

Apply a status to each field and to identity separately. A game-level badge must not hide a field-level gap.

| Status | Meaning | Use in hard-filter matches |
|---|---|---|
| **VERIFIED** | Exact fact and applicable product scope are supported by suitable evidence; conflicts are resolved or explicitly out of scope; the catalog owner approved the field and its provenance. | Eligible for its intended filter only after owner approval of deployment. Does not imply rights clearance or verify other fields. |
| **PROVISIONAL** | A credible source supports a claim for a stated product/listing, but applicability, field semantics, source review, or owner approval remains open. Record exactly what is supported and what is not. | Not represented as confirmed. Use only in a clearly separated, owner-approved “may fit / needs confirmation” experience; never silently satisfy a hard constraint. |
| **UNKNOWN** | Evidence is absent, unavailable, insufficient, or the field is not specified. | Does not satisfy a hard-filter requirement that needs the field. Does not mean false, safe, or unsuitable. |
| **DISPUTED** | Credible claims conflict, or identity/edition makes application ambiguous. | Block confirmed eligibility for the disputed field until resolved; retain all claims. No automatic selection or merge. |

`SUPPORTED BY PRIMARY SOURCE` is an evidence observation, not an approval status. `VERIFIED` does not mean every game fact, Vibe, license, or rulebook is verified. Full factual verification is achieved only when identity is resolved and every required factual hard-filter field is VERIFIED. Vibe validation and Finn teachability are separate states.

## Identity granularity and continuity

Maintain distinct concepts; do not mint or assign permanent GameFinder IDs as part of this policy work.

| Level | Identity and when it is sufficient |
|---|---|
| **Game-level identity** | The continuing designed game/concept, distinct from a publisher SKU, printing, language, or expansion. Use only to relate records, not as evidence that specifications are unchanged. |
| **Base-game identity** | The publisher's standalone/base product, including its supported core rules and components. Accept a publisher's base-game listing when the source explicitly identifies it as the base/standalone game and no contradictory product identity is present. |
| **Edition/rules revision** | A distinct published version when rules, components, player range, age, duration, content, or market specification changes or may change. Record stated edition/revision/version and market. If a relevant field differs, keep that field edition-specific. |
| **Regional edition** | Record market/language when a publisher or licensed regional partner changes rules, components, ratings, or specifications. A translation/reprint can share a base-game identity, but claims must remain market-specific until equivalence is evidenced. |
| **Expansion** | A separate product identity linked to its required base game(s). Never inherit base-game players, age, duration, content, external IDs, or Vibes unless the source explicitly defines a combined mode and the record is scoped to it. Standalone-capable expansions need their own modes/specifications. |
| **Reprint** | May share the relevant base-game and field-level scope only when continuity is evidenced. “Same title” or “same designer” is insufficient. |

### Evidence for cross-edition continuity

A current publisher page may verify a field on an older record only when an auditable evidence chain ties the older product to the current listing and supports that particular field. A unique historical printing is not required where the evidence demonstrates field-specific continuity. Suitable evidence can include:

- an explicit publisher statement that a reprint/revision uses unchanged rules or specifications;
- matching publisher product/SKU identifiers plus edition/market-matched official specifications and a documented reprint history;
- official old and current product sheets, packaging/specifications, or versioned rules that can be compared for the relevant field;
- an official change log or direct written publisher confirmation identifying which fields changed and which remained unchanged.

Record the evidence and field-by-field conclusion. A product code match alone is insufficient if the publisher reuses codes or the edition/market is uncertain. Evidence that player count remained unchanged does not establish that age, duration, content, or rules also remained unchanged.

Use a **general base-game listing** for a fact only if it explicitly denotes the base game and either the record is that listed product or continuity for that fact is documented. Require an **edition-specific record** when specifications materially differ, credible editions cannot be distinguished, or a recommendation could be unsafe/misleading if the wrong edition is used. If applicability cannot be established, the fact remains PROVISIONAL, UNKNOWN, or DISPUTED—not VERIFIED.

## Evidence and provenance

1. **Primary, scope-matched:** publisher specification/product page, packaging, versioned rules/specification, official release note, or written publisher confirmation. Record exact claim, URL/document, publisher, market, version, access date, and access result.
2. **Authoritative supporting:** official regional publisher/distributor documentation where publisher relationship and product scope are clear.
3. **Secondary:** discovery or conflict evidence only; not enough to verify a publisher fact unless a future approved policy explicitly accepts that source class for that field.
4. **Legacy catalog, search snippets, AI output, popularity, and unsourced repetition:** leads only.

For each claim store the existing value, proposed/source-stated value, field and units, identity scope, source reliability, link access, confidence/rationale, conflicts, researcher/research date, human review status, owner approval status, and separate rights status. Unknown cells are explicit. Do not invent dates, reviewers, citations, or source statements.

Automation may check schema, range consistency, required citations/status fields, exact source URL availability, duplicate keys, and whether values match the cited text. Automation cannot establish edition continuity, judge content suitability, adjudicate credible conflicts, approve a correction, or validate subjective Vibes.

## Playtime and the hard maximum-time filter

Keep these concepts separately named in research records:

- **Published range:** if the publisher explicitly gives a range, its upper endpoint is `maximum_listed`. That is a listed upper bound, not a guarantee of actual duration.
- **Explicit upper-bound statement:** wording such as “up to 30 minutes” may support `maximum_listed=30` when the source clearly applies it to the identified game/edition and states a maximum rather than a typical target.
- **Single advertised duration:** record as `advertised_duration`; unless the publisher defines it as a maximum, it does not satisfy `maximum_listed`.
- **Typical/average duration (`typical_duration`):** record only with source wording and method; it is not a maximum.
- **Independent estimate (`estimated_duration`):** keep separate from publisher-listed duration, with method, sample/scope, and estimator. It is not a published maximum.
- **Unknown maximum-listed:** use UNKNOWN when no qualifying publisher upper endpoint exists. Do not fill it from typical, average, estimate, or a single ambiguous advertised value.

### Recommended eligibility behavior (requires product-owner approval)

Preserve the approved hard-filter meaning: “maximum playtime” matches only a VERIFIED `maximum_listed` value. If a player asks for a time cap and a game's maximum-listed duration is UNKNOWN, it must not appear in confirmed matches. Do not exclude that game from recommendations that did not select a time cap.

For usefulness, offer an explicitly separate, owner-approved “possibly fits—duration is advertised/typical, not a listed maximum” section or opt-in relaxed mode. Never mix that result into confirmed matches or imply a time guarantee. If this distinction cannot be presented clearly, prefer withholding uncertain games from a selected hard time cap over false confidence. Do not change current `listedPlaytime` behavior until the owner approves a migration and UX plan.

This preserves useful catalog coverage when no time filter is selected while accepting that a strict time cap may return fewer confirmed matches. Unknown must not be silently promoted to the listed maximum just to increase coverage. Product-owner approval is required before changing behavior. Until then, legacy values remain legacy/unverified and must not be newly described as VERIFIED.

## Publisher age and adult-content suitability

These are separate dimensions:

- **Publisher recommended minimum age** is a product recommendation for a specific listing/edition/market. It is not a statutory rating, a complexity score, or proof of content absence.
- **Complexity/difficulty** describes rules and strategic demands. It is not adult content and does not replace publisher age.
- **Content suitability** describes reviewed content within a named scope, audience, and method. It must not be inferred from age, category, family branding, or absence of warnings.
- **Explicit adult-content flags** record defined content categories and evidence; they do not imply that all other categories were reviewed.

Use the content checklist proposed in `VERIFICATION_STANDARD.md`: explicit sexual content, nudity, graphic violence, gore, disturbing imagery, strong language, slurs, adult/traumatic subjects (including war, death, coercion, discrimination), gambling, alcohol, tobacco, controlled substances, and named other potentially age-sensitive themes. Record each as present/absent-within-scope/not-reviewed/unknown/disputed, and identify the edition and materials actually reviewed. “Absent within scope” is not a guarantee against every objectionable element.

### Recommended unknown/disputed handling (requires product-owner approval)

- If the user selected a **publisher-age band**, only a VERIFIED age recommendation for the applicable edition can establish the age threshold. Unknown/disputed age is not a confirmed match.
- If the user selected a **content-sensitive exclusion**, only a scoped content review can establish absence. Unknown/disputed content must not be treated as `false` or “suitable.” Prefer excluding it from confirmed matches; optionally display it separately with a clear uncertainty label and user choice, if approved.
- Without an age/content-sensitive selection, UNKNOWN alone should not automatically erase catalog discoverability. Do not present an unknown as cleared or safe.
- Do not automatically classify every family game as safe. Do not classify complexity as adult content.

Do **not** immediately exclude the entire unverified legacy catalog. Stage any rollout: first run a non-blocking/shadow comparison; then apply field statuses to a small owner-approved slice; compare confirmed-result counts, coverage, and candidate changes for representative age/content queries; retain a clearly labeled legacy/unverified transition path where needed; and expand only after the owner reviews the measurements and uncertainty UX. A legacy value may continue its existing behavior during an approved transition, but must not be relabeled VERIFIED or presented as a verified suitability claim. Provide an explicit, useful uncertain-candidate path rather than silently dropping all unverified games or presenting them as cleared.

Before any stricter age-filter runtime change, the owner must approve category/severity thresholds, age-band behavior, handling of UNKNOWN/DISPUTED, staged rollout/legacy treatment, the uncertainty UX, coverage trade-offs, and correction/rollback tests. This proposal changes no runtime behavior.

## Rights and source-use separation

Track separately: (1) factual claim and verification; (2) source authenticity/reliability and access; (3) website/API contractual terms; (4) any licensed third-party dataset's contract, field scope, attribution, retention, commercial and derivative-product rights; (5) permission/rights for copying, storage, display, caching, commercial use, bulk extraction, and onward/AI use; and (6) rulebook/artwork rights and processing scopes.

Public access or accurate facts do not authorize copying protected text/artwork or bulk extraction. Nor should GameFinder assume every independently researched factual specification needs an individually negotiated publisher license. The legal treatment of individual facts, compilations/databases, terms, and jurisdiction can differ; this document is not a legal conclusion. Assess applicable terms, jurisdiction, amount/form of material, and intended use; escalate uncertain or material commercial/bulk-use questions to legal review. No BGG commercial integration, bulk import, artwork reuse, or rulebook ingestion is authorized here.

## Human review, approval, and publication

1. **Research capture:** a researcher (including an AI-assisted researcher) records source claims and limitations. The assistant is not an independent human reviewer.
2. **Automatic checks:** validate required fields, URLs/access dates, types, units, contradictions, provenance completeness, and status transitions. These checks do not approve facts.
3. **Primary-source supported:** label the claim and scope; keep PROVISIONAL until applicability and human review are complete.
4. **Human review:** record reviewer decisions separately from source facts and rights assessments. The catalog owner checks identity, source relevance, transcription, semantics, conflicts, and field-level disposition. With one current owner, that person may approve; do not manufacture an additional reviewer or claim a second review. As capacity grows, add an independent reviewer for material conflicts, sensitive content, or high-impact changes.
5. **Owner approval:** the product/catalog owner must explicitly approve each proposed correction before deployment. Record the actual approver and date, or `PENDING`. Owner approval does not alter source evidence and does not grant source rights.
6. **Publication:** separately confirm rights/terms for intended use, migration/reference safety, tests, and rollback. Publish only approved fields. Preserve previous values and evidence.

Vibes remain exactly Luck, Strategy, Dexterity, Family, Party, and Board-Based. Factual source specifications cannot validate subjective scores. Keep the 0–5 anchored proposal in `VIBE_CALIBRATION_PROPOSAL.md`; score changes require a human-approved method and recorded rationale. No live scoring changes are authorized.
