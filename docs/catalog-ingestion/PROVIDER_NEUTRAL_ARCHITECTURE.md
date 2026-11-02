# Provider-neutral catalog and artwork

## Architecture

GameFinder owns permanent `gf:<UUID>` identities; provider identifiers and legacy aliases remain separate, namespaced references. `catalog-foundation.ts` already models catalog records, relationships, provenance, external-ID conflicts, hard-filter eligibility, and permanent IDs. `catalog-ingestion.ts` adds an import-only candidate contract beside that foundation; it does not replace `Game`, authored catalog rows, reviewed-fact corrections, or user-created `gfc_...` records.

Each provider response contains raw claims only. Staging assigns a temporary ID and resets identity, fact approval, and metadata-rights review to unknown/pending; a permanent GameFinder ID can be added only through separate reconciliation. Refreshes retain the original import time and staging reference, append history, and require identity/fact/rights review again. Unknowns remain null with explicit missing/unverified state. Provider ratings are kept separate from GameFinder's six-Vibe values. Edition, printing, language, market, relationships, player limits, publisher age, published duration, mechanics, and categories have typed fields. The candidate validator quarantines mismatched identities, duplicate identifiers, contradictory claims, incomplete required hard-filter facts, and unresolved metadata rights. Validation is not publication; no publish/write operation is provided.

The existing reviewed-facts application adapter remains disabled and empty. Candidate staging does not feed or mutate it.

## Artwork rights and matching

`catalog-artwork.ts` models artwork independently from metadata licensing. Each candidate is tied to a staged/permanent game identity and exact edition, printing, language, and market; source, original reference, known rights holder, permission reference, display/caching/transformation permissions, attribution, expiry/revocation, review, availability, and quality are separate fields.

Selection requires the same game and known exact edition scope, verified and approved artwork, available image data, and commercial-display permission that has not expired or been revoked. Display permission does not imply caching/hosting or resizing permission. Missing or unresolved covers produce an explicit readiness result (`missingAuthenticArtwork`); this future publication-readiness signal is not connected to current catalog visibility. No third-party artwork is downloaded or proxied.

## Staging to publication

1. An authorized provider returns candidates; imports are staged only.
2. Reconcile identity using evidence; never infer identity from a numeric-looking ID or title similarity. Assign permanent IDs separately.
3. Validate source claims and reviewed facts field-by-field. Conflicts remain quarantined; missing hard-filter facts stay unknown.
4. Review metadata terms/rights and artwork rights independently. An image URL in provider data is not an approval.
5. Obtain required human and owner approval, then use a separately reviewed publication process. This checkpoint does not implement that process or change Find, Discover, Vault, or existing visibility.

## Providers and authorization

The provider interface supports future BGG, publisher-supplied, suitably licensed open-data, and GameFinder-curated adapters. The deterministic synthetic adapter is local-only and uses invented records. The existing BGG provider policy remains disabled; there are no live adapters, credentials, or network calls here.

An approved BGG integration would require a commercial license reviewed for each intended metadata use and a separately documented image license/permission. Any BGG authorization must be enforced server-side, with metadata and image permissions checked independently; it must not enable an unauthorized proxy, scrape, or bulk download. If BGG access is denied, GameFinder can continue with publisher-authorized information, appropriately licensed open datasets, and curated entries under the same staging and rights gates.

## Historical IDs and user data

Do not rewrite authored IDs or infer that existing numeric IDs are correct provider identities. Keep the known Resistance/Sleeping Queens collision, seven suffixed-ID cases, historical `318184` ambiguity, suspected incorrect IDs, and legacy provenance unresolved until reviewed. Vaults, wishlist, play history, scores, and existing routes continue using their current keys. Permanent-ID assignment and any reference migration require a separate reviewed plan; ambiguous references must not be merged.

## Small next steps for bulk import

1. Confirm metadata and artwork permission scopes for one chosen source; define retention, attribution, and revocation handling.
2. Specify a versioned provider adapter and server-side authorization boundary, without enabling it until permissions are approved.
3. Prepare a small synthetic-to-authorized-source pilot with duplicate/edition/conflict reports, human review, explicit artwork clearance, and an owner-approved rollback plan.
4. Only after pilot approval, plan a separate permanent-ID/reference migration and an administrative review workflow. No bulk import, migration, or user-facing catalog changes are in scope here.

## Synthetic batch demonstration

`catalog-batch-ingestion.ts` processes deterministic synthetic candidates in bounded batches (1–1,000 records each). The runner keys staging records by provider namespace and provider record ID; replaying unchanged claims is idempotent, while changed claims refresh the same staging record, append the changed field's before/after claims and provenance to history, and reset fact, identity-review, rights, and approval state. Duplicate external identifiers and conflicting identities remain separate, visible records and are reported; title similarity never merges candidates. Malformed inputs produce per-record error results while later records continue.

The report separates received/processed outcomes from quarantined staged-record counts, lists duplicate IDs and per-record validation/artwork diagnostics, and reports metadata and artwork readiness independently. Every imported record remains staged. There is no publication function or connection to the active catalog, reviewed-facts registry, recommendation pool, or user data.

The serializable checkpoint contains only a version, an input-consistency checksum, the batch size, a progress cursor, and completed-batch count. Candidate records, import outcomes, diagnostics, review decisions, rights, artwork, and report counters are not stored in it. On resume, the runner validates the checkpoint shape/configuration and compares its checksum to the independently supplied ordered input, then reconstructs the processed prefix by running the original source records through normal staging again. The cursor is only a progress hint: even if an attacker advances it, the prefix is rebuilt from source input with identity, fact, rights, and approval defaults reset. Malformed or mismatched checkpoints fail closed. Resume may replay work and therefore takes longer; this correctness-first tradeoff is acceptable for the synthetic demonstration.

The checksum detects accidental input/configuration mismatches; it is not a signature, MAC, or authorization mechanism. An attacker can alter serialized checkpoint contents, so hashes cannot establish who reviewed a fact, assigned an identity, granted rights, or approved artwork. Recovery never loads those trust-bearing values from the checkpoint. This is a local synthetic/test mechanism, not production-grade security or durable persistence. Production approvals will require a separate trusted server-side persistence and authorization boundary with authenticated actors, audit history, permission-expiry/revocation enforcement, and atomic recovery. A production importer will additionally need durable staging/checkpoints, provider pagination/cursors, concurrency and retry policy, retention controls, observability, and operational recovery procedures.

Synthetic test-only review states exercise gates; imports themselves do not create review evidence, rights clearance, or approval. Artwork assessment separately requires exact edition scope, verified/approved review, a usable image reference, and commercial-display permission; caching, hosting, transformation, attribution, expiration, and revocation remain distinct. Low quality is surfaced without imposing a production threshold. Synthetic references and clearances are fixtures, not real covers or permissions.

Before a licensed BGG adapter: secure and review the commercial agreement; define server-side authorization and permitted fields, rate limits, retention, and audit controls; document metadata rights separately from image display, caching, transformation, and attribution rights; then build an adapter and test it only with authorized access. If denied, publisher-authorized, suitably licensed open, and GameFinder-curated providers remain viable through the same candidate contract.

Before production ingestion, add durable staging/checkpoint storage, schema/version migration, authorization and permission-expiry/revocation enforcement, human review tooling, observability, and rollback. Before permanent-ID migration, separately reconcile legacy identities and aliases, resolve known collisions, map every Vault/history/score reference, and test a reviewed reversible migration. Production publication additionally requires approved identity, verified hard-filter facts with evidence, cleared metadata rights, separately approved eligible artwork, human review, owner approval, and an explicit publication/rollback process.
