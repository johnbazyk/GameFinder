# Restricted beta acceptance protocol (proposed)

## Setup

Use a separate staging deployment and database; synthetic accounts and synthetic game records first. Do not copy production personal data. Keep checkout, portal, live webhook, BGG provider and paid AI calls disabled. Before any external invite, close the applicable gates in RELEASE_GATES.md and obtain owner approval. Do not recruit children or collect children's details during this proposed first beta. Any real photo testing must use consenting adults' game shelves without faces, addresses, documents or identifying details.

## Acceptance matrix

| ID | Scenario | Required result |
|---|---|---|
| A01 | Create two disposable accounts and sign in/out on one browser | No previous account content visible; independent Vaults/history |
| A02 | Add/remove on two browsers, offline retry and delayed save | No resurrected deletions, silent loss or wrong-account writes |
| A03 | Legacy guest collection and manual game | Preserved; clear transfer/recovery behavior; no automatic disclosure |
| A04 | Free 50th/51st, Premium expansion, downgrade | Capacity policy correct; no collection or score deletion |
| A05 | Find: players, youngest age, time, Vibes, reroll, no-match | Constraints honored using declared metadata; no false certainty |
| A06 | Scan fronts/spines, rotation, multiple images, glare, unknown title | Review before add; wrong/ambiguous matches not silently committed; manual fallback |
| A07 | Local scan default; inspect network | No photo sent to backend/provider without approved explicit opt-in |
| A08 | Finn unavailable/ambiguous/unsupported, playback and cancellation | Source limitations visible; no invented verified ruling; fallback works |
| A09 | Mobile 320/390 px, iOS Safari, Android Chrome, desktop | No clipping or horizontal overflow; legible controls and safe-area layout |
| A10 | Keyboard and screen-reader navigation, nested dialogs | Named controls, visible focus, trap/return focus, Escape and no blocked navigation |
| A11 | Database/auth failure and reconnect | Clear non-sensitive error; saved data retained; retry works |
| A12 | Checkout disabled and portal disabled | No charges or provider calls; pricing correct |
| A13 | Approved Stripe test-mode flows (later isolated stage) | Initial enrollment, renewal, failures, cancellation, refunds, resubscription, duplicates |
| A14 | Privacy/export/deletion request | Documented, actionable response and verified data disposition |
| A15 | Back up, migrate, restore and roll back in staging | Data intact; exact release and migration versions recorded |

Record candidate commit, environment label (no credentials), device/browser, fixture ID, case, expected/observed result, pass/fail/blocked, reproducibility and redacted evidence. Never include session cookies, secrets, raw payment details or identifiable photos in issue reports.

## Proposed defect policy

P0: security, unauthorized payment, cross-account disclosure, irreversible loss — stop testing and isolate affected service. P1: core flow blocked, incorrect hard-filter decision, persistent sync failure — block affected scope until fixed. P2: recoverable defect with workaround — document and assess owner acceptance. P3: cosmetic improvement — backlog. Retest affected flows and the full regression suite after fixes.

No target number of testers, external invitation date or commercial launch date is implied. Owner chooses cohort, support channel and timing after gates are closed.
