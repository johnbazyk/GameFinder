# GameFinder visual-consistency audit — in-app games vs product chrome

Scope: Bank (felt table), Connect Four, Checkers, Chess, Tic-Tac-Toe, compared against
Home, Wizard, Circle, Vault, and the scorecards/scoreboard. Source: the Grok Build audit
pack (design tokens in `src/styles.css` `@theme`, CVA `Button`, `app-shell.tsx`).
Report only — no code changes.

Overall: the games are much closer to the system than expected. Every felt color is a
`color-mix` of tokens (no raw hex in game JSX), scores use `font-display` +
`tabular-nums` like the scoreboard, copy voice matches, and StartGame reuses the exact
card/selection patterns from the scorecards. The real problems are three structural
misses, not a style drift.

---

## Must-fix (breaks the GameFinder look)

1. **`.bank-over` is used but never defined.**
   `bank-table.tsx` renders the final-standings screen in `<div className="bank-over">`,
   but `styles.css` has no `.bank-over` rule (it defines `bank-screen`, `bank-chrome`,
   `bank-center`, `bank-seats`, `bank-seat`, `bank-dock`, `bank-vault`, `bank-chip`).
   The "Final accounts" list — the emotional payoff screen where family points land —
   renders as an unstyled div flush against the felt's inset ring border, with no
   padding, no centering, no max-width. Needs a real rule (padding, centered column,
   probably `max-width` like `.bank-line`).

2. **Non-Bank play screens lose the app container entirely.**
   `app-shell.tsx` sets `hideHeader` for all of `/play`, and when the header is hidden,
   `<main>` becomes `w-full p-0` instead of `mx-auto max-w-3xl px-4 pt-5`. That is
   correct for Bank's fixed fullscreen felt, but chess/checkers/Connect Four/tic-tac-toe
   in `play.$sessionId.tsx` are ordinary product pages (breadcrumb link, fox eyebrow,
   Fraunces `h1`, cards) — and they now render with **zero horizontal padding and no
   max-width**: text and boards sit flush against the screen edge, unlike every other
   screen in the app. `/play/bank` (the "Bank lives at a table" door) has the same
   problem below 384px wide (`max-w-sm` with no `px`). Either scope the `p-0` treatment
   to the Bank session only, or give the board screens their own padded container.

3. **Chess pieces disappear in dark mode.**
   The chess squares are hardcoded light (`bg-cream` / `bg-moss/50` — correct, a board
   shouldn't theme-flip), but the piece glyphs have **no explicit text color**, so they
   inherit `--color-foreground`, which in `.dark` is `#fbf6ef` — the same value as
   `bg-cream`. White-square pieces become cream-on-cream. The board needs
   `text-night` (or explicit per-side colors) so it stays legible in both themes. Note
   both sides currently render in one color, distinguished only by outline vs filled
   glyph shapes — thin even in light mode; see Should-fix #5.

## Should-fix (drifts from the app)

4. **"Leave" tap target on the Bank felt.** It's a bare text link (`text-sm`, ~20px
   tall) in `bank-chrome`. The app's own rule is ≥44px, and the equivalent control in
   the Wizard (back button) is `size-11`. Give it a `min-h-11` hit area (visual can stay
   a quiet text link).

5. **Piece-color language differs per game and never ties to player identity.**
   Connect Four is fox-vs-moss, Checkers is night-vs-fox, Chess is monochrome glyphs.
   Meanwhile everywhere else in the product a player *is* their color — Bank seat dots
   use `p.color`/`PLAYER_COLORS`, the scorecards and scoreboard color names with
   `p.color`. On the boards there is no visible mapping of "which color am I?" — the
   turn line is plain text. Pick one seat→color convention (e.g., seat 0 = fox,
   seat 1 = night across all boards), and echo it next to the player names on the play
   screen with the same color-dot pattern Bank seats already use.

6. **Connect Four's seven "Drop" text buttons.** Seven identical `text-xs` "Drop" pills
   across the top reads as placeholder copy; the app's compact-action pattern is a
   lucide icon (`ArrowRight`, `Plus`, etc.). A down-arrow icon per column (keeping the
   44px `h-11` height, which is right) would match the system and drop the repetition.

7. **Board square tap targets on narrow phones.** Once the container padding from
   Must-fix #2 is restored, an 8-column board inside `px-4` is (width−32)/8 —
   under 44px below ~385px viewports. Consider letting the checkers/chess board bleed
   (`-mx-4` / full-bleed exception) so squares keep ≥44px on small phones.

8. **Dead styles from the earlier Bank layout.** `DicePair` (in `dice-pair.tsx`) is
   exported but never imported; `.bank-felt`, `.bank-felt::before`, and `.die-2d` in
   `styles.css` are defined but unused (only `Die`/`.die-ivory` and `.die-2d-spin`
   survive). Prune them — dead patterns get copied by the next feature.

## Questions for Grok Build (product calls)

A. **Felt vs cream (the known tension):** recommendation is **keep the fullscreen
   felt**. It's built entirely from tokens (moss/night/cream mixes, fox in the rim
   shadow), uses Fraunces + `tabular-nums` for the money, and "the product is paper,
   the table is felt" is a coherent story. The only chrome decision left is whether the
   top row (Leave / round chip / status chip) stays felt-native or becomes a thin cream
   product bar — felt-native looks right, but it's a call.

B. **Where do the mini-boards live?** Right now they're neither product nor table:
   product-style typography with the chrome stripped and no padding (Must-fix #2). Two
   coherent options: (1) boards are normal product pages — restore header (and keep nav
   hidden mid-game), padded cream container; or (2) boards get their own lightweight
   table treatment like Bank. Which is intended? Option 1 is the cheap, consistent one.

C. **Canonical CTA shape:** the Button component is `rounded-button` (0.875rem), but
   `/play/bank` and Circle's signed-out card use hand-rolled `rounded-full bg-fox` pill
   links for primary CTAs. Two primary-CTA shapes now exist. Which is canonical? (If
   pills win for links, consider a `pill` Button variant so it's tokenized.)

D. **Is the chip pattern exempt from the 44px rule?** Game-type chips in StartGame are
   `py-1.5` (~34px) — the same as Vault's tabs and Circle's family/friends chips, so
   the games are *consistent* with the app here, but all of them violate the stated
   ≥44px rule, and StartGame's own rounds chips are `min-h-11` while its game chips are
   not. Either bless small chips officially or bump the pattern to `min-h-11` app-wide.

E. **Fraunces tabular figures:** scores everywhere rely on `font-display` +
   `tabular-nums`. Worth confirming the loaded Fraunces subset actually ships the
   `tnum` feature/lining figures, or big scores (Bank vault, seat scores, scoreboard
   wins) won't align the way the class promises.

## Leave alone (intentional, and good)

- **The felt palette itself.** Every value is a `color-mix` of `--color-moss`,
  `--color-night`, `--color-cream`, `--color-fox`, `--color-berry`. No raw hex in any
  game JSX; seat dots fall back to `PLAYER_COLORS`. This is exactly the token
  discipline the pack asks for.
- **Copy voice.** "Don't be the 7." "Seven. The pot is gone. Next round in a moment."
  "Final accounts." "They don't take family points when they win." All of it sits
  naturally next to "The ledger remembers forever" and "Nights together." Don't flatten
  it.
- **Dice.** `.die-ivory` gradient from cream tokens, pip grid, tumble animation with a
  `prefers-reduced-motion` kill switch, `aria-hidden`. Keep as-is.
- **Score typography.** `font-display` + `tabular-nums` on Bank vault/seats matches the
  scoreboard and score-pad exactly.
- **StartGame patterns.** Member/bot rows (`rounded-card bg-card shadow-card`, selected
  `bg-fox/10 ring-1 ring-fox`) mirror the scorecard seat pickers precisely.
- **No emoji in chrome.** Chess unicode glyphs are game content, not chrome — fine.
- **Smaller radii inside the felt** (`bank-seat` 1rem, chips 999px vs `radius-card`
  1.25rem): reads as deliberate "table texture vs paper card" contrast, and the felt is
  a different material anyway. Keep.
- **`hideHeader`/`hideNav` on `/play` for Bank itself** — correct per the design rule;
  the problem is only the collateral damage to the board games (Must-fix #2).
