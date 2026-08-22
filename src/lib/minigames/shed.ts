/** Shed — family shedding game. Match color or rank. Empty your hand. Not Uno. */

import type { EngineResult, MiniAction } from "./types";

export const SHED_COLORS = ["#e8642b", "#4a6b4d", "#7fa8c9", "#a63d57"] as const;
export type ShedColor = 0 | 1 | 2 | 3;
export type ShedKind = "num" | "skip" | "rev" | "plus2" | "wild" | "plus4";

export type ShedCard = {
  id: number;
  color: ShedColor | null;
  kind: ShedKind;
  n?: number;
};

export type ShedState = {
  hands: ShedCard[][];
  deck: ShedCard[];
  discard: ShedCard[];
  turn: number;
  dir: 1 | -1;
  pendingDraw: number;
  wildColor: ShedColor | null;
  winner: number | null;
  lastLine: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): ShedCard[] {
  const cards: ShedCard[] = [];
  let id = 1;
  for (let c = 0 as ShedColor; c < 4; c = (c + 1) as ShedColor) {
    for (let n = 1; n <= 9; n++) {
      cards.push({ id: id++, color: c, kind: "num", n });
      cards.push({ id: id++, color: c, kind: "num", n });
    }
    for (const kind of ["skip", "rev", "plus2"] as const) {
      cards.push({ id: id++, color: c, kind });
      cards.push({ id: id++, color: c, kind });
    }
  }
  for (let i = 0; i < 4; i++) cards.push({ id: id++, color: null, kind: "wild" });
  for (let i = 0; i < 4; i++) cards.push({ id: id++, color: null, kind: "plus4" });
  return shuffle(cards);
}

function top(state: ShedState): ShedCard {
  return state.discard[state.discard.length - 1];
}

function playColor(state: ShedState): ShedColor | null {
  return state.wildColor ?? top(state).color;
}

export function canPlay(state: ShedState, card: ShedCard): boolean {
  if (state.pendingDraw > 0) {
    return card.kind === "plus2" || card.kind === "plus4";
  }
  if (card.kind === "wild" || card.kind === "plus4") return true;
  const color = playColor(state);
  const t = top(state);
  if (card.color != null && card.color === color) return true;
  if (card.kind === "num" && t.kind === "num" && card.n === t.n) return true;
  if (card.kind !== "num" && card.kind === t.kind) return true;
  return false;
}

export function labelCard(card: ShedCard) {
  if (card.kind === "wild") return "Wild";
  if (card.kind === "plus4") return "+4";
  if (card.kind === "plus2") return "+2";
  if (card.kind === "skip") return "Skip";
  if (card.kind === "rev") return "Flip";
  return String(card.n ?? "");
}

export function initShed(playerCount: number): ShedState {
  const n = Math.max(2, Math.min(6, playerCount));
  const deck = buildDeck();
  const hands: ShedCard[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < 7; i++) {
    for (let p = 0; p < n; p++) {
      const c = deck.pop();
      if (c) hands[p].push(c);
    }
  }
  let starter = deck.pop();
  while (starter && (starter.kind === "wild" || starter.kind === "plus4")) {
    deck.unshift(starter);
    starter = deck.pop();
  }
  return {
    hands,
    deck,
    discard: starter ? [starter] : [],
    turn: 0,
    dir: 1,
    pendingDraw: 0,
    wildColor: null,
    winner: null,
    lastLine: "Match color or number. Empty your hand.",
  };
}

function refill(state: ShedState) {
  if (state.deck.length) return state;
  const keep = state.discard.pop();
  const rest = shuffle(state.discard);
  return { ...state, deck: rest, discard: keep ? [keep] : [] };
}

function drawN(state: ShedState, seat: number, n: number): ShedState {
  let s = state;
  const hand = [...s.hands[seat]];
  for (let i = 0; i < n; i++) {
    s = refill(s);
    const c = s.deck.pop();
    if (!c) break;
    hand.push(c);
    s = { ...s, deck: s.deck };
  }
  const hands = s.hands.map((h, i) => (i === seat ? hand : h));
  return { ...s, hands };
}

function nextSeat(state: ShedState, from = state.turn, skip = 0) {
  const n = state.hands.length;
  let t = from;
  for (let i = 0; i <= skip; i++) t = (t + state.dir + n) % n;
  return t;
}

export function applyShed(
  state: ShedState,
  action: MiniAction,
  seat: number,
  playerIds: string[],
): EngineResult {
  if (state.winner != null) {
    return {
      state,
      currentTurnUserId: playerIds[state.winner] ?? null,
      finished: true,
      winnerId: playerIds[state.winner] ?? null,
      lastLine: state.lastLine,
    };
  }
  if (seat !== state.turn) throw new Error("Wait your turn");

  let s = state;

  if (action.type === "draw") {
    if (s.pendingDraw > 0) {
      const n = s.pendingDraw;
      s = drawN(s, seat, n);
      s = {
        ...s,
        pendingDraw: 0,
        turn: nextSeat(s),
        lastLine: `Drew ${n}. Next.`,
      };
    } else {
      s = drawN(s, seat, 1);
      const drawn = s.hands[seat].at(-1);
      if (drawn && canPlay({ ...s, pendingDraw: 0 }, drawn)) {
        s = { ...s, lastLine: "Drew a card. Play it or pass the turn." };
      } else {
        s = { ...s, turn: nextSeat(s), lastLine: "Drew. Next." };
      }
    }
  } else if (action.type === "play-card") {
    const i = Number(action.i);
    const card = s.hands[seat][i];
    if (!card) throw new Error("No such card");
    if (!canPlay(s, card)) throw new Error("That doesn't match");
    if ((card.kind === "wild" || card.kind === "plus4") && action.wild == null) {
      throw new Error("Pick a color");
    }
    const hand = s.hands[seat].filter((_, idx) => idx !== i);
    const hands = s.hands.map((h, idx) => (idx === seat ? hand : h));
    s = { ...s, hands, discard: [...s.discard, card], wildColor: null };
    if (hand.length === 0) {
      s = { ...s, winner: seat, lastLine: "Hand empty. That's the game." };
      return {
        state: s,
        currentTurnUserId: playerIds[seat] ?? null,
        finished: true,
        winnerId: playerIds[seat] ?? null,
        lastLine: s.lastLine,
      };
    }
    if (card.kind === "wild" || card.kind === "plus4") {
      s = { ...s, wildColor: action.wild as ShedColor };
    }
    if (card.kind === "plus2") s = { ...s, pendingDraw: s.pendingDraw + 2 };
    if (card.kind === "plus4") s = { ...s, pendingDraw: s.pendingDraw + 4 };
    if (card.kind === "rev") {
      s = { ...s, dir: s.dir === 1 ? -1 : 1 };
      if (s.hands.length === 2) s = { ...s, turn: nextSeat(s, seat, 1) };
      else s = { ...s, turn: nextSeat(s, seat) };
    } else if (card.kind === "skip") {
      s = { ...s, turn: nextSeat(s, seat, 1) };
    } else {
      s = { ...s, turn: nextSeat(s, seat) };
    }
    s = { ...s, lastLine: `Played ${labelCard(card)}.` };
  } else if (action.type === "resign") {
    const other = playerIds.find((_, i) => i !== seat) ?? playerIds[0];
    s = { ...s, winner: playerIds.indexOf(other), lastLine: "Resigned." };
    return {
      state: s,
      currentTurnUserId: other,
      finished: true,
      winnerId: other,
      lastLine: s.lastLine,
    };
  } else {
    throw new Error("Illegal");
  }

  return {
    state: s,
    currentTurnUserId: playerIds[s.turn] ?? null,
    finished: false,
    winnerId: null,
    lastLine: s.lastLine,
  };
}
