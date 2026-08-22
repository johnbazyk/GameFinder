/** Stockpile — Skip-Bo rules, original name. Empty your stock. Build 1–12. */

import type { EngineResult, MiniAction } from "./types";

export type StockCard = { id: number; n: number }; // 1–12, 0 = wild

export type StockpileState = {
  names: string[];
  colors: string[];
  stocks: StockCard[][];
  hands: StockCard[][];
  discards: StockCard[][][];
  build: StockCard[][];
  need: number[];
  deck: StockCard[];
  grave: StockCard[];
  turn: number;
  drawn: boolean;
  winner: number | null;
  lastLine: string;
  stockSize: number;
};

const WILDS = 18;
const EACH = 12;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deck(): StockCard[] {
  const cards: StockCard[] = [];
  let id = 1;
  for (let n = 1; n <= 12; n++) {
    for (let k = 0; k < EACH; k++) cards.push({ id: id++, n });
  }
  for (let k = 0; k < WILDS; k++) cards.push({ id: id++, n: 0 });
  return shuffle(cards);
}

export function labelStock(card: StockCard | undefined) {
  if (!card) return "";
  return card.n === 0 ? "W" : String(card.n);
}

export function top(pile: StockCard[]) {
  return pile[pile.length - 1];
}

export function canPlace(card: StockCard, need: number) {
  return card.n === 0 || card.n === need;
}

export function initStockpile(
  playerCount: number,
  names: string[],
  colors: string[],
  stockSize = 20,
): StockpileState {
  const n = Math.max(2, Math.min(6, playerCount));
  const size = stockSize === 10 || stockSize === 30 ? stockSize : 20;
  let d = deck();
  const stocks: StockCard[][] = [];
  const hands: StockCard[][] = [];
  const discards: StockCard[][][] = [];
  for (let p = 0; p < n; p++) {
    stocks.push(d.splice(0, size));
    hands.push([]);
    discards.push([[], [], [], []]);
  }
  const state: StockpileState = {
    names: names.slice(0, n),
    colors: colors.slice(0, n),
    stocks,
    hands,
    discards,
    build: [[], [], [], []],
    need: [1, 1, 1, 1],
    deck: d,
    grave: [],
    turn: 0,
    drawn: false,
    winner: null,
    lastLine: "Empty your stock. Build 1 to 12. Wilds are W.",
    stockSize: size,
  };
  return { ...fillHand(state, 0), drawn: true };
}

function refillDeck(s: StockpileState): StockpileState {
  if (s.deck.length) return s;
  if (!s.grave.length) return s;
  return { ...s, deck: shuffle(s.grave), grave: [] };
}

function take(s: StockpileState, n: number): { s: StockpileState; cards: StockCard[] } {
  let cur = s;
  const cards: StockCard[] = [];
  for (let i = 0; i < n; i++) {
    cur = refillDeck(cur);
    const c = cur.deck[0];
    if (!c) break;
    cards.push(c);
    cur = { ...cur, deck: cur.deck.slice(1) };
  }
  return { s: cur, cards };
}

function fillHand(s: StockpileState, seat: number): StockpileState {
  const need = 5 - s.hands[seat].length;
  if (need <= 0) return s;
  const { s: next, cards } = take(s, need);
  const hands = next.hands.map((h, i) => (i === seat ? [...h, ...cards] : h));
  return { ...next, hands };
}

function startTurn(s: StockpileState): StockpileState {
  if (s.drawn || s.winner != null) return s;
  return { ...fillHand(s, s.turn), drawn: true };
}

function placeOnBuild(s: StockpileState, seat: number, card: StockCard, pile: number): StockpileState {
  if (pile < 0 || pile > 3) throw new Error("No such pile");
  if (!canPlace(card, s.need[pile])) throw new Error("That doesn't fit");
  const build = s.build.map((p, i) => (i === pile ? [...p, card] : p));
  const need = [...s.need];
  need[pile] += 1;
  let grave = s.grave;
  if (need[pile] === 13) {
    grave = [...grave, ...build[pile]];
    build[pile] = [];
    need[pile] = 1;
  }
  let next: StockpileState = { ...s, build, need, grave, lastLine: `Played ${labelStock(card)}.` };
  if (next.stocks[seat].length === 0) {
    return { ...next, winner: seat, lastLine: "Stock empty. That's the game." };
  }
  if (next.hands[seat].length === 0) next = fillHand(next, seat);
  return next;
}

function nextSeat(s: StockpileState) {
  return (s.turn + 1) % s.stocks.length;
}

export function applyStockpile(
  state: StockpileState,
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

  let s = startTurn(state);

  if (action.type === "play-stock") {
    const pile = Number(action.pile);
    const card = top(s.stocks[seat]);
    if (!card) throw new Error("Stock is empty");
    const stocks = s.stocks.map((st, i) => (i === seat ? st.slice(0, -1) : st));
    s = placeOnBuild({ ...s, stocks }, seat, card, pile);
  } else if (action.type === "play-hand") {
    const i = Number(action.i);
    const pile = Number(action.pile);
    const card = s.hands[seat][i];
    if (!card) throw new Error("No such card");
    const hands = s.hands.map((h, idx) => (idx === seat ? h.filter((_, j) => j !== i) : h));
    s = placeOnBuild({ ...s, hands }, seat, card, pile);
  } else if (action.type === "play-discard") {
    const from = Number(action.from);
    const pile = Number(action.pile);
    const stack = s.discards[seat][from] ?? [];
    const card = top(stack);
    if (!card) throw new Error("Empty discard");
    const discards = s.discards.map((row, idx) =>
      idx === seat ? row.map((p, j) => (j === from ? p.slice(0, -1) : p)) : row,
    );
    s = placeOnBuild({ ...s, discards }, seat, card, pile);
  } else if (action.type === "park") {
    const i = Number(action.i);
    const pile = Number(action.pile);
    if (pile < 0 || pile > 3) throw new Error("No such pile");
    const card = s.hands[seat][i];
    if (!card) throw new Error("No such card");
    const hands = s.hands.map((h, idx) => (idx === seat ? h.filter((_, j) => j !== i) : h));
    const discards = s.discards.map((row, idx) =>
      idx === seat ? row.map((p, j) => (j === pile ? [...p, card] : p)) : row,
    );
    const nxt = nextSeat(s);
    s = fillHand(
      {
        ...s,
        hands,
        discards,
        turn: nxt,
        drawn: true,
        lastLine: `Parked ${labelStock(card)}.`,
      },
      nxt,
    );
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

  const finished = s.winner != null;
  return {
    state: s,
    currentTurnUserId: playerIds[finished ? s.winner! : s.turn] ?? null,
    finished,
    winnerId: finished ? playerIds[s.winner!] ?? null : null,
    lastLine: s.lastLine,
  };
}

export function nextStockpileBotAction(state: StockpileState): MiniAction | null {
  if (state.winner != null) return null;
  const s = startTurn(state);
  const seat = s.turn;
  const stock = top(s.stocks[seat]);
  if (stock) {
    const pile = s.need.findIndex((n) => canPlace(stock, n));
    if (pile >= 0) return { type: "play-stock", pile };
  }
  for (let d = 0; d < 4; d++) {
    const card = top(s.discards[seat][d] ?? []);
    if (!card) continue;
    const pile = s.need.findIndex((n) => canPlace(card, n));
    if (pile >= 0) return { type: "play-discard", from: d, pile };
  }
  for (let i = 0; i < s.hands[seat].length; i++) {
    const card = s.hands[seat][i];
    const pile = s.need.findIndex((n) => canPlace(card, n));
    if (pile >= 0) return { type: "play-hand", i, pile };
  }
  const hand = s.hands[seat];
  if (!hand.length) return null;
  const shortest = s.discards[seat].reduce(
    (best, p, i) => (p.length < s.discards[seat][best].length ? i : best),
    0,
  );
  return { type: "park", i: hand.length - 1, pile: shortest };
}
