# Finn voice coach

## Current source status

GameFinder does not store or ingest rulebooks. Finn's current lessons and
table-talk answers are general AI output, not verified against an authorized
rulebook. The UI labels them accordingly, and the server prompt prohibits Finn
from claiming that a response is official or verified. The API response
contract identifies these answers as `general`. Quick-start passages and prerecorded
answers are not independently verified against each edition.

For legacy catalog entries, Finn receives the game title and, when available,
explicitly unverified quick-start notes. Other legacy catalog metadata is not
used as authoritative rule evidence. GameFinder's original game Stockpile has an internally authored
description. An ambiguous legacy BGG ID is rejected for Finn until the catalog
conflict is resolved.

## Modes and voice

- **Teach** offers a five-part spoken lesson: goal, setup, turn, scoring, and
  common mistakes.
- **Table** is for short, live-play questions.
- Microphone input uses xAI speech-to-text; replies may be read with xAI
  text-to-speech.
- Generated lesson text may be cached locally for up to 14 days. Valid cache hits
  do not trigger paid refreshes. This is AI output, not a publisher source or a rulebook copy.

## Rulebook rights

The catalog can store official publisher reference links and rights metadata.
An official URL does not itself permit document storage, parsing, AI retrieval,
or redistribution. Permission is tracked independently for storage, parsing,
AI retrieval, and display; all scopes default to false. Finn cannot treat a
source as usable unless it is an official publisher source, authorization is
documented, and the required permission scopes are granted.

There is no rulebook download, scraping, parsing, embedding, RAG, or model
training in this checkpoint. Use only short, original fictional rulebook
examples in automated tests.

## Relevant files

| File                                     | Role                                                               |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `src/lib/coach.ts`                       | Finn server functions, prompt, and answer-source contract          |
| `src/components/finn-coach.tsx`          | Teach/Table UI, microphone, and playback                           |
| `src/lib/catalog-foundation.ts`          | Catalog provenance, provider policy, and rulebook permission types |
| `migrations/0006_catalog_foundation.sql` | Catalog and rulebook metadata schema with restrictive defaults     |
| `src/routes/game.$id.index.tsx`          | Game details and Finn entry point                                  |


## Phase 05 stabilization — verification

Base: Phase 04 remote commit 2b3c1d4.

- Ambiguous external game IDs block server teaching and local teaching surfaces, including written guides, recording controls and table questions.
- Direct lesson-topic questions use existing quick-start material before live requests; approximate matches are labeled related passages rather than rulings.
- General AI answers and recorded instructional notes carry explicit source limitations. The Catan preview is labeled a quick-start answer, not an official ruling.
- Generated lessons require five distinct nonempty string chapters; malformed messages, game IDs, provider text, and audio inputs are rejected. Provider requests have a 25-second timeout.
- Cached lessons use a new validation-version key, reject invalid or future-dated entries, and avoid automatic refresh. Existing in-flight deduplication is retained.
- Audio failure exposes written fallback and retry; stale playback errors are guarded; unmount pauses audio and releases recording resources.
- Game names remain intact in generic speech processing. All five server endpoints retain authentication and Premium authorization.

Verification: TypeScript passed; 18 targeted tests passed; full regression 412 total, 401 passed, zero failed, 11 PostgreSQL cases skipped. Isolated Chrome browser acceptance at 390 x 844 passed Premium access, recorded audio playback, next chapter, direct guide answer, Catan answer, unsupported question, ambiguous game block and Free gate. Browser script: scripts/finn-lab-browser.mjs. Run only on a disposable auth-off local lab at port 8093 with empty DATABASE_URL and XAI_API_KEY, GAMEFINDER_LOCAL_TEST_PLAN=1, and settled Vite optimization.

No live paid provider requests or production deployments were made. This phase establishes structural and behavioral safeguards, not independent rules certification. Prompt safeguards cannot guarantee factual correctness. Physical-device microphone and live provider behavior, distributed rate limits and monetary usage caps, full edition mapping, independently reviewed written/audio rules, and authorized rulebook retrieval remain release dependencies. PostgreSQL integration remains unverified in this environment.
