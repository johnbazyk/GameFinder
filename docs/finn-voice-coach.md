# Finn voice coach

## Current source status

GameFinder does not store or ingest rulebooks. Finn's current lessons and
table-talk answers are general AI output, not verified against an authorized
rulebook. The UI labels them accordingly, and the server prompt prohibits Finn
from claiming that a response is official or verified. The API response
contract identifies these answers as `general`.

For legacy catalog entries, the AI prompt receives the game title only. The
remaining legacy catalog fields have unverified provenance and are not added to
Finn's context. GameFinder's original game Stockpile has an internally authored
description. An ambiguous legacy BGG ID is rejected for Finn until the catalog
conflict is resolved.

## Modes and voice

- **Teach** offers a five-part spoken lesson: goal, setup, turn, scoring, and
  common mistakes.
- **Table** is for short, live-play questions.
- Microphone input uses xAI speech-to-text; replies may be read with xAI
  text-to-speech.
- Generated lesson text may be cached locally. This is AI output, not a
  publisher source or a rulebook copy.

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
