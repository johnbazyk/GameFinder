# GameFinder application catalog integration — 05E6

## Application

The existing GameFinder application on port 8080 is the sole user
interface. Find, Vault, Discover, and Profile retain their original
navigation and screen structure.

## Current integration

Find and Discover use the same provider-neutral recommendation scoring
foundation via catalog-legacy-bridge.ts.

The existing reviewed-facts eligibility pipeline remains active.
Legacy game records keep their original storage keys for compatibility
with Vault, play logs, score histories, and game-detail routes.

Legacy compatibility identities are not permanent published identities.

## Published catalog

The new published-catalog validator, identity architecture, source
provenance, artwork decisions, and read-only view adapter remain
available and unchanged.

No synthetic fixture is promoted to a production catalog.
No unreviewed legacy record is presented as verified or licensed.

## BGG preparation

BGG remains a preferred future source, not an enabled provider.

Before replacing the legacy source:

- Obtain and review commercial API authorization.
- Confirm metadata and artwork rights separately.
- Build a trusted server-side published-catalog source.
- Resolve legacy IDs to permanent identities with collision review.
- Test a reversible migration of owned, wishlisted, play, and score data.
- Preserve GameFinder's existing interface.

This checkpoint does not perform a user-data migration.
