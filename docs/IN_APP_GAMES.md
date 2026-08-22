# In-app family games — Claude Code brief

Read this, then `GAMEFINDER_FAMILY_PLATFORM.md` §4 (scoring) and the engines already in `src/lib/minigames/`. **Do not rewrite Bank, chess.js, or the +N rule.** Wire new games through the existing session pipeline.

Branch to start from: **`claude/gamefinder-visual-audit-bnrp06`** (PR #1) *or* merge `grok-export` first if this file is not on your branch.

This commit already added drop-in engines (not wired):

| File | Game | Status |
|---|---|---|
| `src/lib/minigames/yacht.ts` | Yacht (Yahtzee rules, PD name) | **complete engine** |
| `src/lib/minigames/reversi.ts` | Reversi | **complete engine** |
| `src/lib/minigames/mancala.ts` | Mancala / Kalah | **complete engine** |
| `src/lib/minigames/types.ts` | `hold` / `score` / `place` actions; Connect Four label → **Four in a Row** | live |

---

## 0. Non-negotiables

- Winner **+N**, N = `playerIds.length` (bots count, bots get 0). Draws 0. Idempotent via `family_score_events` if you added it in Slice 0.
- Server-authoritative. Client sends intent only.
- Dice: `src/lib/dice.ts` `rollD6()` — CSPRNG + rejection sampling. Never `Math.random()`.
- Bank stays **fullscreen felt**. New boards stay **cream product pages** (`max-w-3xl px-4`, header visible). Seat 0 fox, seat 1 moss.
- **Legal:** do not ship Uno, Skip-Bo, Phase 10, Yahtzee, Connect Four, Monopoly, Flip 7 as those names. Mechanics OK under original names (Yacht, Four in a Row, Crazy Eights). Chess / Checkers / Tic-Tac-Toe / Reversi / Mancala are PD.
- Don’t add Azul / TTR / Wingspan as engines. Catalog only.

---

## 1. How a game plugs in (copy this)

Existing path:

1. `MINI_GAMES` + `MiniGameType` in `types.ts`
2. Pure `initX` / `applyX` → `EngineResult`
3. `initState` / `applyAction` in `apply.ts`
4. `playMiniAction` in `server.ts` (auth, version, dice, finishIfNeeded)
5. Board in `components/minigames/boards.tsx`
6. Switch in `routes/play.$sessionId.tsx`
7. Optional bot in `bots.ts`

`createMiniSession` already generic. `StartGame` already iterates `MINI_GAMES`.

### 1.1 types.ts — add three keys

```ts
export type MiniGameType =
  | "bank" | "connect4" | "checkers" | "chess" | "tictactoe"
  | "yacht" | "reversi" | "mancala";
```

```ts
yacht:   { label: "Yacht",   blurb: "Five dice. Thirteen boxes.", min: 1, max: 6, passPhone: true },
reversi: { label: "Reversi", blurb: "Flip the row. Own the board.", min: 2, max: 2, passPhone: false },
mancala: { label: "Mancala", blurb: "Sow stones. Land in your store.", min: 2, max: 2, passPhone: false },
```

`MiniAction` already has `{ type: "place"; at: number }`, `{ type: "hold"; dice: boolean[] }`, `{ type: "score"; category: string }`.

### 1.2 apply.ts — dispatch

```ts
import { applyYacht, initYacht } from "./yacht";
import { applyReversi, initReversi } from "./reversi";
import { applyMancala, initMancala } from "./mancala";

// initState:
if (type === "yacht") return initYacht(playerIds, names);
if (type === "reversi") return initReversi();
if (type === "mancala") return initMancala();

// applyAction — change dice param to number[] | [number, number]:
if (type === "yacht") return applyYacht(state as YachtState, action, actorId, playerIds, dice);
if (type === "reversi") return applyReversi(state as ReversiState, action, seat, playerIds);
if (type === "mancala") return applyMancala(state as MancalaState, action, seat, playerIds);
```

### 1.3 server.ts — five dice + turn locks

Today `playMiniAction` does `const dice = action.type === "roll" ? roll2d6() : undefined`.

Change to:

```ts
import { rollD6, roll2d6 } from "@/lib/dice";

const dice =
  action.type !== "roll" ? undefined
  : row.game_type === "yacht" ? [rollD6(), rollD6(), rollD6(), rollD6(), rollD6()]
  : roll2d6();
```

Turn-lock list: add `"place" | "hold" | "score"`.

`bot-step`: today Bank-only. After Yacht works vs humans, add `nextYachtBotAction` (roll until `rollsLeft===0` or a Yacht, then `score` with `yachtBotScore(state)`).

Pass-phone: Yacht is `passPhone: true` like Bank (one device). Reversi/Mancala false.

### 1.4 play.$sessionId.tsx

```tsx
{view.gameType === "yacht" ? <YachtBoard view={view} busy={busy} act={act} /> : null}
{view.gameType === "reversi" ? <ReversiBoard view={view} busy={busy} act={act} /> : null}
{view.gameType === "mancala" ? <MancalaBoard view={view} busy={busy} act={act} /> : null}
```

Yacht is **not** fullscreen felt. Cream page. Five dice + 13-box pad.

---

## 2. Yacht (build this first — highest play)

BGA: Yahtzee ~245k plays/month (Oct 2025), often top-5. Families already know the sheet. We ship it as **Yacht**.

Engine: `src/lib/minigames/yacht.ts`

- 13 boxes, 3 rolls, hold bits, upper bonus +35 at 63
- Actions: `roll` (needs 5 dice from server), `hold { dice: boolean[5] }`, `score { category }`
- Finish when every seat has 13 boxes. Highest `yachtTotal`. Tie → `winnerId: null`

**UI (cream page, Fraunces totals, `tabular-nums`):**

- 5 ivory dice buttons; tap to toggle hold (fox ring when held)
- Roll CTA `rollsLeft` times; then disabled
- 13 boxes: empty = button showing *would-score*; filled = ink
- Split upper / lower; show “Bonus +35” when upper ≥ 63
- Seat scores on top via existing `SeatDots`

Bot: after 3rd roll call `yachtBotScore(state)` → `{ type: "score", category }`. Easy bot scores after 1–2 rolls if a yacht/large is already there.

Min 1 player so a kid can play Yacht vs nobody (solo). If `playerIds.length===1`, winner is them iff you want +1 — **keep N = length**, so solo win is +1. Fine.

---

## 3. Reversi + Mancala (kids, PD, small)

Engines are done. UI notes:

**Reversi** — 8×8 moss/cream. Discs fox / night. On your turn, mark `legalReversi(state, seat)` with a 6px fox dot. `act({ type: "place", at: i })`. Last flip can skip opponent (`lastLine` already says “go again”).

**Mancala** — two rows of 6 pits + stores at ends. P0 (fox) sits bottom, pits 0–5 left→right, store index 6 on the right. P1 pits 12→7 visually (their left is your right). Animate is optional; if skip animation, at least increment store with `tabular-nums`. Extra turn when last stone hits store.

---

## 4. Polish the five that already exist

### Bank — keep felt; add open BANK

Official Thunderhive: **anyone unbanked may BANK after a roll**, once per round. Engine already allows `bankPoints(state, playerId)` for any id in `after-roll`. UI today is sequential auto-pass.

Do this in `bank-table.tsx` (no engine rewrite):

- After a roll, 2.8s window: every unbanked **human** sees a BANK pill (not only the roller)
- Bots still use `nextBankBotAction` (already loops live bots)
- Then auto-pass as now
- Join-in-progress: `MINI_GAMES.bank.joinable` is already `true`. Add `joinMiniSession` as in the family-platform brief. Joiner sits out **this** round (`bankedIds` += them, score 0)

Bust overlay must keep showing **0** ~2s (already).

### Four in a Row (was Connect Four)

Label already **Four in a Row**. Add a 220ms CSS drop (translateY) on the new disc. Colorblind: fox/moss + hole vs filled, not red/yellow. Optional best-of-3 later; not required.

### Checkers

English draughts: mandatory capture, **no flying kings**, jump ends on promotion. If a quiet move is attempted while a jump exists, throw `"Must capture"` and pulse the jumping piece. Highlight jump origins.

### Chess

`chessMoves(fen, from)` already exists. `ChessBoard` must:

1. Last-move highlight (store last `from`/`to` in state **or** parse `lastLine` SAN — better: add `lastFrom`/`lastTo` onto `ChessState` in `applyChess`)
2. Legal-move dots on select (default on)
3. Check glow if `new Chess(fen).inCheck()`
4. Promotion picker if a pawn hits last rank (don’t silently queen — `action.promotion`)
5. White = `text-fox`, black = `text-night`

Bots: minimax depth 1/2 only. No Stockfish.

### Tic-Tac-Toe — first to 3

Wrap `TttState`:

```ts
export type TttState = {
  cells: (0 | 1 | null)[];
  turn: 0 | 1;
  wins: [number, number];
  target: 3;
};
```

On a board win: `wins[w]+=1`, if `wins[w]>=3` finish session; else reset `cells`, loser of the board starts (or winner — pick **loser starts**). Family +N **once per match**. Update blurb to “First to three boards.”

---

## 5. After those — only if Slice 0–3 are green

| Next | Why | Name |
|---|---|---|
| Can’t Stop clone | BGA all-time giant (~15M plays) | **The Climb** — new art, not “Can’t Stop” |
| Dots and Boxes | paper nostalgia | Dots |
| Memory | ages 4+ | Memory (fox-face cards) |
| Gomoku | five-in-a-row, no gravity | Gomoku |
| Backgammon | later; doubling cube is real work | — |

**Do not build:** Uno, Skip-Bo, Phase 10, Flip 7, Azul, Ticket to Ride, Catan, Wingspan engines.

---

## 6. Server dice helper (add to `src/lib/dice.ts`)

```ts
export function rollNd6(n: number): number[] {
  return Array.from({ length: n }, () => rollD6());
}
```

---

## 7. Yacht board sketch (paste into `boards.tsx`)

Keep tokens; no hex. `view.state as YachtState`.

```tsx
export function YachtBoard({ view, act, busy }: {
  view: SessionView; act: (a: MiniAction) => void; busy: boolean;
}) {
  const s = view.state as YachtState;
  const seat = view.players.find((p) => p.userId === view.you)?.seat ?? 0;
  const mine = view.you === view.currentTurnUserId && view.status === "active";
  const open = s.phase === "rolled" && mine;
  return (
    <div>
      <div className="flex gap-2">
        {s.dice.map((d, i) => (
          <button key={i} type="button" disabled={!open}
            onClick={() => {
              const held = s.held.slice();
              held[i] = !held[i];
              act({ type: "hold", dice: held });
            }}
            className={cn(
              "grid h-14 w-14 place-items-center rounded-card bg-card font-display text-2xl shadow-card",
              s.held[i] && "ring-2 ring-fox",
            )}>{d}</button>
        ))}
      </div>
      <Button className="mt-4" disabled={busy || !mine || s.rollsLeft <= 0 || s.phase === "game-over"}
        onClick={() => act({ type: "roll" })}>
        Roll ({s.rollsLeft} left)
      </Button>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {YACHT_CATS.map((cat) => {
          const filled = s.scores[seat][cat];
          const preview = open && filled == null ? yachtValue(cat, s.dice) : null;
          return (
            <li key={cat}>
              <button type="button" disabled={busy || !open || filled != null}
                onClick={() => act({ type: "score", category: cat })}
                className="flex min-h-11 w-full items-center justify-between rounded-card bg-card px-3 text-sm shadow-card">
                <span>{YACHT_LABELS[cat]}</span>
                <span className="font-display tabular-nums">{filled ?? preview ?? "—"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

---

## 8. Test

- Yacht 2p: fill 13 boxes each, +2 to winner, reload scores unchanged
- Yacht hold: unheld dice change on roll 2, held stay
- Reversi: illegal empty tap rejected; legal dots only
- Mancala: extra turn on store; capture opposite
- Bank 7 still zeros the pot
- Four in a Row label in StartGame
- Guest wizard still works signed-out

---

## 9. Suggested PR title

`feat(play): wire Yacht, Reversi, Mancala + Four in a Row rename`

One PR. Don’t mix with notifications/joinable Bank unless Slice 0 is already merged.
