# GameFinder catalog verification standard

**Checkpoint 05B2 pilot standard — proposed, not yet approved for production use.**
No catalog record or recommendation behavior is changed by this document.

## Status vocabulary

Record a status for each individual field, not just for the game:

- **PENDING SOURCE REVIEW** — no admissible evidence has been reviewed.
- **SUPPORTED — REVIEW PENDING** — a primary source supports the proposed value, but independent reviewer approval is incomplete.
- **VERIFIED** — the exact identity/edition and adequate primary evidence are recorded, and review is approved. Rights status remains a separate decision and is never implied by this status.
- **DISPUTED** — credible sources conflict or the source does not identify the represented edition.
- **UNKNOWN** — the field does not apply or evidence is insufficient; do not substitute a default.
- **NOT AUTHORIZED FOR REUSE** — evidence may support a factual conclusion, but terms do not permit the proposed storage/display/use.

Status is field-specific. A document can be factually reliable without giving GameFinder permission to copy, store, display, or commercially reuse its data. Record `licensing_status` separately from factual `verification_status`. Do not promote a game to **FULLY VERIFIED** unless identity, edition, all required factual fields, and review gates pass. **VIBE VALIDATED** and **FINN TEACHABLE** are independent statuses and require their own gates.

## Source hierarchy and research limits

1. **Primary, edition-matched evidence:** publisher product page, official product specification, box/packaging specification, edition insert, official catalog, or direct written publisher confirmation. Prefer a source that identifies the exact edition and the exact field.
2. **Other authoritative primary evidence:** official distributor/manufacturer record or official regional publisher page, if the relationship and edition are clear. Record regional/market differences rather than silently treating them as one edition.
3. **Secondary references:** use only to locate a discrepancy or a primary source. A secondary listing does not independently verify a publisher claim. Label it secondary, preserve its claim and URL, and keep the field pending until resolved by admissible evidence.
4. **Legacy code, search snippets, AI output, popularity, and repeated unsourced claims:** discovery leads only; never verification evidence.

No live BGG API or restricted-site scraping is part of this workflow. Do not download rulebooks or artwork for the pilot. A publicly reachable PDF or product page does not itself authorize reuse.

## Field-level evidence record

For each claim, retain:

- game candidate and legacy key, without treating that key as verified;
- field name and the exact existing GameFinder value;
- proposed value and units/semantics;
- exact source URL, source organization/publisher, and source/document title;
- source-link access result and date checked, separately from source reliability;
- edition/version and region covered (or explicitly `UNKNOWN`);
- access date in ISO `YYYY-MM-DD`;
- verification status, reviewer, review date, and approval state;
- confidence with a short rationale (confidence describes evidence strength, not legal rights);
- conflicting claims and why they remain unresolved;
- source reliability notes;
- separate licensing/terms status and permitted use scope;
- correction disposition: proposal only, accepted for future change, rejected, or pending.

Never leave an unknown source as a fabricated URL or infer an edition from title similarity. Preserve the source's wording and units sufficiently to audit the conclusion, but avoid storing copyrighted prose beyond short factual observations.

## Identity and edition gate

Establish the product represented before copying metadata:

1. Match the title and product type to an official publisher source.
2. Record publisher, publication/release year as stated, market/region, edition label, and any revision/version explicitly evidenced.
3. Determine whether the record is a base game, expansion, standalone product, or edition variant from an official relationship or packaging source.
4. Compare the external identifier as a separate claim. A numeric shape or title match is not proof of provider identity. Keep suspicious aliases unresolved.
5. If editions differ on players, age, duration, content, or rules, keep the claim edition-specific and do not collapse editions without an approved model.
6. If evidence points to more than one product, mark identity **DISPUTED** and block fact promotion and automated reference mapping.

## Factual hard-filter fields

- **Minimum and maximum players:** use the exact edition's publisher-published supported range. Do not infer the maximum from a party mode, components, or community reports. Store min/max separately and preserve any qualified modes (team/solo) in notes.
- **Publisher minimum age:** transcribe the publisher's age recommendation as an age recommendation, not a legal age rating or a guarantee of content absence. Keep community age separate and label it as secondary/unverified unless independently sourced.
- **Playtime:** preserve separate `minimum`, `maximum_listed`, `typical`, and `estimated` values, including the source's label and units. A single advertised value such as “15 minutes” does not establish a maximum. An explicit publisher-listed range may support its published upper endpoint as `maximum_listed`, but that endpoint is not an absolute limit on actual play. Do not infer a maximum from a typical/average/estimated value. If no qualifying upper endpoint is published, keep `maximum_listed` **UNKNOWN**; do not imply that any listed or average duration bounds actual play.
- **Publication year:** distinguish design/publication year from edition release, reprint, and regional release year. Record what the source labels and the exact edition/market.
- **Publisher and external ID:** verify the named publishing entity and identifier independently; preserve publisher/imprint and provider namespace exactly as sourced.
- **Conflict handling:** retain both claims, sources, editions, and units. Do not average, pick the newer-looking result, or overwrite the legacy value without reviewed evidence.

## Adult-content classification proposal

This is a proposed content-review scope, not a production taxonomy or a claim that the five games have been assessed. Do not infer absence from a low publisher age, a family category, or omitted warnings.

### Outcomes

- **PRESENT:** reviewer observed or an adequate source explicitly confirms one or more defined content flags.
- **ABSENT WITHIN SCOPE:** an authorized, adequate review of the defined game material found none of the listed flags. This is a documented, bounded review result—not a guarantee that a game contains no potentially objectionable content and not a universal “safe for everyone” claim.
- **UNKNOWN:** relevant material was not adequately reviewed, the source is incomplete, or content scope is unclear.
- **DISPUTED:** credible reports conflict or reviewers disagree pending adjudication.

Do not collapse `UNKNOWN` or `DISPUTED` to `false`. A blank legacy value remains unknown for verification even if runtime code currently derives `false`.

### Content dimensions to review

For each exact edition, record a separate reviewed/not-reviewed/unknown outcome and evidence note for every category: (1) explicit sexual content; (2) nudity; (3) graphic violence; (4) gore; (5) disturbing imagery; (6) strong language; (7) slurs; (8) adult or traumatic subject matter, including war, death, coercion, or discrimination; (9) gambling mechanics or depiction; (10) alcohol; (11) tobacco; (12) controlled-substance use or promotion; and (13) other potentially age-sensitive themes, with each additional theme named. Record the materials actually reviewed (rules, cards, board, packaging, illustrations, etc.), their edition, and any access gaps. Distinguish simulated gameplay mechanics from real-world endorsement. Complexity, rules burden, and strategic difficulty are **not** adult content.

### Evidence and review

For **PRESENT**, identify the exact edition and record an authorized source or reviewer observation, content dimension, context, and confidence. For **ABSENT WITHIN SCOPE**, require systematic review of the complete applicable components and text/artwork or an explicit, edition-matched, sufficiently comprehensive publisher content declaration. A low age recommendation alone is insufficient. If permissions do not permit retaining the underlying content, retain only the minimal permitted classification and citation.

Require one trained reviewer and a second independent reviewer for the initial pilot. Record both decisions separately; disagreements remain **DISPUTED** until a named adjudicator documents a reasoned resolution. This process is proposed; no reviewer agreement or content assessment is claimed in this checkpoint.

Before implementing stricter age filtering, human decision-makers must approve: the exact category checklist and severity threshold that counts as adult content; which age bands apply each threshold; how `UNKNOWN` and `DISPUTED` affect eligibility (including whether to exclude, warn, or preserve existing behavior); what evidence/material coverage is sufficient for `ABSENT WITHIN SCOPE`; who can independently review and adjudicate; and how verified classifications are communicated and revised. No such filter behavior is authorized or changed by this proposal.

## Six Vibes: separation from factual verification

Luck, Strategy, Dexterity, Family, Party, and Board-Based are subjective GameFinder preference dimensions, not publisher facts. Publisher information can provide context but cannot validate these ratings. Use the proposed behavioral anchors in `VIBE_CALIBRATION_PROPOSAL.md`; record rubric version, edition, two independent reviewers, rationale, confidence, disagreement, and approval. Do not use BGG/popularity scores or AI-generated ratings as substitutes.

## Rights and reuse review

Maintain distinct fields for:

- factual source/evidence and factual verification;
- source reliability and edition fit;
- rights/terms status for collection and storage;
- display, attribution, commercial use, caching/retention, and onward/AI use scope.

A source can be authoritative while its terms prohibit copying or commercial reuse. A successful page fetch establishes source access only—not permission to copy, cache, or bulk reuse. Record link access, factual source verification, and licensing/terms permission as separate statuses. Mark rights as `PENDING REVIEW` until the applicable terms and intended use are reviewed by the responsible rights owner. No artwork or rulebook permissions are claimed here. If collection or reuse is not approved, do not store the field value in production merely because it is true; keep only permitted audit notes/citation metadata.

## Approval, disputes, and release gates

1. Researcher records the proposed field claim and evidence; researcher cannot mark their own unsupported inference verified.
2. A second reviewer checks source authenticity, exact edition, field semantics, transcription, and conflicting evidence.
3. The responsible rights reviewer separately records permission/terms for intended use.
4. Disputes and identity ambiguities remain visible and block automatic correction or reference mapping.
5. A data steward approves the complete game-level state and a change proposal; approval does not itself deploy metadata.
6. Before deployment, tests must demonstrate legacy references remain resolvable, ambiguity is quarantined, Vault/history/score rows are preserved, and recommendation behavior changes only as separately approved.

**FULLY VERIFIED** requires identity/edition resolution and accepted evidence plus reviewer approval for every required factual field. It does not imply licensing permission; rights/terms status remains separately recorded, and production storage/use must wait for the applicable rights clearance. **VIBE VALIDATED** requires the approved calibration protocol and completed independent review. **FINN TEACHABLE** requires authorized edition-specific rulebook rights and retrieval that is implemented and tested. These states must never be inferred from each other.
