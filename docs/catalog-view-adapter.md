# Read-only catalog view adapter

`src/lib/catalog-view-adapter.ts` maps the synthetic publication snapshot to UI-ready
Find and Discover results. Both methods use the same entry conversion, hard eligibility,
Vibe-score completeness checks, catalog scoring function, deterministic ordering, and
artwork matcher. Find splits eligible results by ownership and applies exclusions by
permanent GameFinder ID; Discover adds title search without changing eligibility or score.
Neither method substitutes rejected or excluded games. Rejection reasons and exhausted
recommendation pools are returned explicitly.

The view uses `gf:<UUID>` as its sole catalog identity. Edition remains a distinct
display attribute. Legacy identifiers are represented only as a separate compatibility
status: only a unique verified alias resolves, while ambiguous, unverified, and absent
references remain unresolved. The adapter does not migrate or read Vault, scores, or
play history.

The input accepted today is specifically the fixture-only snapshot emitted by
`createSyntheticCatalogPublicationSnapshot()`. The adapter clones and validates its
synthetic provenance, explicit review records, required facts, staging validation,
identity references, and edition-scoped artwork. Artwork is selected only through
`selectApprovedArtwork`; when its identity, edition scope, rights, permission dates,
or other required checks fail, the result contains the original GameFinder placeholder.
These synthetic permissions are not commercial or production authorizations.

## Trust and production boundary

This checkpoint has no publication API, server authorization, database source, route,
feature flag, or application import. Its boundary is a development/test fixture contract,
not a security mechanism: static fixture markers and client-side validation cannot
authenticate a caller or make client-supplied approvals authoritative. Do not pass
arbitrary provider data to this adapter or use it to authorize production records.

A future server-published catalog source must enforce publication authorization
server-side; return only independently reviewed, complete, non-conflicting facts under
permanent GameFinder IDs; keep legacy-reference resolution separate from publication;
and include edition-specific artwork scope with explicit, current rights and attribution
requirements. Find and Discover should consume that one published source through the
same adapter rather than independently interpreting provider records. Production
integration, persistence, real identity activation, and live artwork are out of scope.
