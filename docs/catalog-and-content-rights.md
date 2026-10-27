# Catalog and content-rights foundation

The existing curated catalog remains the source for current recommendations and
routes. Its BGG IDs continue to be the compatibility keys for existing Vault,
play-history, score-session, and cloud-vault records. New catalog records use a
GameFinder-owned stable ID; provider IDs are separate external identifiers.
Legacy IDs are not rewritten or automatically merged.

User-entered games can be stored with incomplete metadata. Unknown player counts,
publisher age, listed playtime, adult-content status, and GameFinder rubric
values stay unknown. A missing value cannot satisfy a selected hard filter.
Missing or unverified fields are not treated as verified facts.

The BGG provider is disabled. Its local-only fixtures are fictional test data;
the adapter contains no HTTP client or scraping behavior. Provider policy leaves
requests, caching, commercial use, and AI use disabled until separately approved.

## Catalog audit

BGG ID `41114` is present in the authored source data for both _The Resistance_
and _Sleeping Queens_. The existing catalog de-duplicates on BGG ID and keeps
the first entry, so the latter is currently omitted. Do not change the ID,
rewrite a Vault entry, or silently choose a replacement: first determine which
records, routes, play logs, score sessions, and cloud rows refer to that legacy
key, then plan an explicit compatibility migration.

The source audit currently sees 144 authored rows and 143 visible catalog
entries. It found:

- No invalid player-count ranges, rubric values, age values, or ratings by
  numeric bounds.
- One playtime inconsistency: _Sheriff of Nottingham_ lists 60–60 minutes but
  an average of 55. Verify against the intended edition before correcting it.
- 49 publisher/community age disagreements. Keep the publisher age as the hard
  filter input already used by the app; verify each discrepancy independently
  rather than averaging or overwriting values.
- No publisher or structured edition field on any legacy row. The title
  _Twilight Imperium (4th)_ contains an edition label, but it is not represented
  as structured metadata.
- Two expansion references, _European Expansion_ (`290448`) and _Prelude_
  (`219265`), that do not resolve to a local catalog entry.
- All 144 source-row community ratings lack field-level verification and
  licensing provenance.

No values were changed to address these findings. Before a migration, validate
the proposed publisher/edition/age/playtime/relationship corrections from
independently authorized sources. Keep old BGG-keyed user records intact; if
the `41114` conflict is corrected, introduce a new internal ID and an explicit
legacy-key resolution flow rather than moving existing records silently.

## Rulebooks and Finn

Only official publisher links and rights metadata may be recorded in this
checkpoint. A public URL is not permission to store, parse, retrieve with AI, or
redistribute the document. Each permission scope defaults to false. Finn's
current answers are general AI answers, not verified against an authorized
rulebook. No rulebook ingestion, embeddings, retrieval, or model training is
implemented.

Before enabling any provider or rulebook workflow, obtain and document answers
to these licensing questions:

- Is the intended commercial use and the specific provider/API permitted?
- Which fields may be collected, normalized, displayed, or attributed, and what
  attribution wording is required?
- May records be cached; for how long; and what deletion, refresh, and retention
  rules apply?
- May records be retained after a license ends, and how must they be purged?
- May any provider-derived data be sent to an AI service or used in prompts?
- Are official rulebook links stable and approved for display?
- Does permission cover storage, parsing, indexing, embeddings, AI retrieval,
  generated answers, and end-user display separately?
- Are cover images, thumbnails, logos, and other artwork licensed for this
  commercial use?
- Are there request limits, authentication requirements, or commercial access
  terms that affect throttling, caching, or availability?

Do not activate a live integration until the answers, attribution, allowed
retention, and permission scope have been reviewed and recorded.
