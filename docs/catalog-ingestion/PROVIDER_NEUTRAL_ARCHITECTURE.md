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
