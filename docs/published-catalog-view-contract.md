# Provider-neutral published-catalog view contract

`src/lib/catalog-published-view.ts` defines a read-only snapshot of already-published
catalog records. It separates imported candidates, review/publication decisions, the
sanitized published view, and the final Find/Discover presentation entries. The view
contains permanent `gf:<UUID>` identity, approved display metadata, relationships,
field-level verified-or-unknown facts, all six explicit Vibe values, a record revision,
source identity, legacy aliases, and a separately evaluated artwork decision. Provider
payloads, internal review records, and candidate approval fields are not part of this
contract.

`createSyntheticPublishedCatalogSnapshot()` is a closed fixture-only factory (it takes
no records or provider data) in
`catalog-recommendation-prototype.ts`. It filters only the existing fictional fixtures
that pass the existing synthetic identity, fact, metadata-rights, human-review, and
owner-review gate. It then maps those accepted records into the neutral contract and
evaluates artwork with `selectApprovedArtwork`. It cannot accept provider records or
client-supplied approval data. The older raw synthetic snapshot remains available only
to the prototype tests; the shared adapter does not import or inspect it.

Both `find()` and `discover()` consume the same neutral snapshot, hard-filter
implementation, Vibe completeness rules, and catalog score function. Find adds only
ownership grouping and GameFinder-ID exclusions. Discover adds only title search.
Neither converts legacy keys to identities except through unique, verified aliases;
ambiguous, unverified, and orphaned references stay unresolved. `gfc_...` custom games
remain explicitly owner-only. UI presentation entries expose only the selected artwork
reference, attribution, authenticity label, or a clearly identified placeholder; they do
not expose permission references, review details, or caching/transformation rights.

The shared contract and adapter perform structural and consistency validation; they
do not grant publication authority. A caller able to construct an entire valid-looking
snapshot can still forge data. The neutral snapshot must therefore be obtained only
from an authenticated, server-side published-catalog reader before any real use.
Booleans, TypeScript types, JSON fields, hashes, or client-supplied tokens are not an
authorization boundary. This checkpoint includes no authenticated reader, production
authorization, database access, migration, or deployment.

## Requirements for a future server reader

Before it supplies a real snapshot, a server-side source must enforce an independently
authorized publication decision and guarantee:

- independently reviewed, non-conflicting identity and a valid permanent GameFinder ID;
- complete provenance and field-level reviewed hard-filter facts;
- approved, current metadata permissions for the displayed fields;
- a consistent publication revision with no duplicate canonical identities;
- edition/printing/language/market-specific artwork matching, human review, display
  rights, attribution, current expiry/revocation state, and separate caching and
  transformation permissions;
- legacy aliases separated from publication and never resolved when disputed or
  ambiguous.

The adapter consumes the normalized artwork decision and preserves an explicit
original-GameFinder-placeholder fallback; it does not fetch or substitute images.
Metadata permission never authorizes artwork.

## Still out of scope

All records here are simulation-only and fictional. No proposed 05E1 identity is
published and no 05E2 simulated review becomes genuine approval. The adapter is not
connected to Find, Discover, Wizard, Results, Vault, scores, history, production
catalog loading, BGG, or user storage. Genuine publication requires a separately
authorized server source and review workflow. Real Find/Discover integration should
follow only after that boundary exists; a development-only visual preview can then
consume the same neutral snapshot without activating production routes.
