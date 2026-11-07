# Read-only catalog view adapter

`src/lib/catalog-view-adapter.ts` consumes the provider-neutral snapshot defined in
[`published-catalog-view-contract.md`](./published-catalog-view-contract.md). Find and
Discover share the same record mapping, hard-filter eligibility, missing-Vibe handling,
catalog scoring, deterministic ordering, and artwork decision. Find adds ownership
separation and permanent-ID reroll exclusions; Discover adds read-only title search.

The adapter consumes sanitized published-view records, not staged candidates or
provider payloads. Runtime validation checks identity shape, snapshot/record revision
consistency, required structure, explicit fact states, Vibe ranges, relationships,
legacy aliases, and artwork identity/scope/rights fields. These checks are defensive
consistency checks—not proof of authorization. Only a future authenticated,
server-side publication reader can supply real published records.

The sole source used here is the fixed synthetic fixture gate. It emits fictional
records, simulation-only artwork decisions, and `gf:<UUID>` identities; it is not
connected to the application, user data, a production catalog, or BGG. See the contract
document for server-source requirements and remaining integration boundaries.
