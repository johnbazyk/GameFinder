/**
 * Yacht — public-domain Yahtzee cousin. Same 13 boxes, original name/art.
 * Pure engine. Server rolls 5d6 via playMiniAction (same path as Bank).
 */
import type { EngineResult, MiniAction } from "./types";

export const YACHT_CATS = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
  "threekind",
  "fourkind",
  "fullhouse",
  "small",
  "large",
  "yacht",
  "chance",
] as const;

export type YachtCat = (typeof YACHT_CATS)[number];

export const YACHT_LABELS: Record<YachtCat, string> = {
  ones: "Aces",
  twos: "Twos",
  threes: "Threes",
  fours: "Fours",
  fives: "Fives",
  sixes: "Sixes",
  threekind: "3 of a kind",
  fullhouse: "Full house",
  fourkind: "4 of a kind",
  small: "Small straight",
  large: "Large straight",
  yacht: "Yacht",
  chance: "Chance",
};

export type YachtScores = Partial<Record<YachtCat, number>>;

export type YachtState = {
  playerIds: string[];
  names: string[];
  scores: YachtScores[];
  current: number;
  dice: number[];
  held: boolean[];
  rollsLeft: number;
  phase: "need-roll" | "rolled" | "game-over";
  lastLine: string;
};

export function initYacht(playerIds: string[], names: string[]): YachtState {
  return {
    playerIds,
    names,
    scores: playerIds.map(() => ({})),
    current: 0,
    dice: [1, 2, 3, 4, 5],
    held: [false, false, false, false, false],
    rollsLeft: 3,
    phase: "need-roll",
    lastLine: "Roll. Keep. Fill a box. Upper 63 earns +35.",
  };
}

function counts(dice: number[]) {
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) c[d] += 1;
  return c;
}

function hasRun(faces: number[], len: number) {
  const set = new Set(faces);
  for (let start = 1; start <= 7 - len; start++) {
    let ok = true;
    for (let i = 0; i < len; i++) if (!set.has(start + i)) ok = false;
    if (ok) return true;
  }
  return false;
}

export function yachtValue(cat: YachtCat, dice: number[]): number {
  const c = counts(dice);
  const sum = dice.reduce((a, b) => a + b, 0);
  const face = { ones: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6 } as const;
  if (cat in face) {
    const f = face[cat as keyof typeof face];
    return c[f] * f;
  }
  if (cat === "chance") return sum;
  if (cat === "threekind") return c.some((n) => n >= 3) ? sum : 0;
  if (cat === "fourkind") return c.some((n) => n >= 4) ? sum : 0;
  if (cat === "fullhouse") return c.includes(3) && c.includes(2) ? 25 : 0;
  if (cat === "small") return hasRun(dice, 4) ? 30 : 0;
  if (cat === "large") return hasRun(dice, 5) ? 40 : 0;
  if (cat === "yacht") return c.some((n) => n === 5) ? 50 : 0;
  return 0;
}

export function upperTotal(s: YachtScores) {
  return (s.ones ?? 0) + (s.twos ?? 0) + (s.threes ?? 0) + (s.fours ?? 0) + (s.fives ?? 0) + (s.sixes ?? 0);
}

export function yachtTotal(s: YachtScores) {
  let n = 0;
  for (const cat of YACHT_CATS) n += s[cat] ?? 0;
  if (upperTotal(s) >= 63) n += 35;
  return n;
}

function boxesLeft(s: YachtScores) {
  return YACHT_CATS.filter((c) => s[c] == null).length;
}

export function applyYacht(
  state: YachtState,
  action: MiniAction,
  actorId: string,
  playerIds: string[],
  diceRoll?: number[],
): EngineResult {
  if (state.phase === "game-over") throw new Error("Game over");
  const seat = playerIds.indexOf(actorId);
  if (seat !== state.current) throw new Error("Not your turn");

  if (action.type === "resign") {
    const winnerId = playerIds.find((id) => id !== actorId) ?? null;
    return {
      state,
      currentTurnUserId: null,
      finished: true,
      winnerId: playerIds.length === 2 ? winnerId : null,
      lastLine: "Resigned.",
    };
  }

  if (action.type === "roll") {
    if (state.rollsLeft <= 0) throw new Error("No rolls left");
    if (!diceRoll || diceRoll.length !== 5) throw new Error("Dice missing");
    const dice = state.dice.map((d, i) => (state.phase === "need-roll" || !state.held[i] ? diceRoll[i] : d));
    const rollsLeft = state.phase === "need-roll" ? 2 : state.rollsLeft - 1;
    const next: YachtState = {
      ...state,
      dice,
      rollsLeft,
      held: state.phase === "need-roll" ? [false, false, false, false, false] : state.held,
      phase: "rolled",
      lastLine: `${state.names[seat]} rolled ${dice.join("·")}.`,
    };
    return {
      state: next,
      currentTurnUserId: actorId,
      finished: false,
      winnerId: null,
      lastLine: next.lastLine,
    };
  }

  if (action.type === "hold") {
    if (state.phase !== "rolled") throw new Error("Roll first");
    const held = Array.isArray(action.dice) && action.dice.length === 5 ? action.dice.map(Boolean) : state.held;
    return {
      state: { ...state, held, lastLine: "Held." },
      currentTurnUserId: actorId,
      finished: false,
      winnerId: null,
      lastLine: "Held.",
    };
  }

  if (action.type === "score") {
    if (state.phase !== "rolled") throw new Error("Roll first");
    const cat = action.category as YachtCat;
    if (!YACHT_CATS.includes(cat)) throw new Error("Unknown box");
    if (state.scores[seat][cat] != null) throw new Error("Box filled");
    const value = yachtValue(cat, state.dice);
    const scores = state.scores.map((row, i) => (i === seat ? { ...row, [cat]: value } : row));
    const done = boxesLeft(scores[seat]) === 0 && scores.every((row) => boxesLeft(row) === 0);
    if (done) {
      const totals = scores.map(yachtTotal);
      const best = Math.max(...totals);
      const winners = totals.flatMap((n, i) => (n === best ? [playerIds[i]] : []));
      const next: YachtState = {
        ...state,
        scores,
        phase: "game-over",
        lastLine: winners.length > 1 ? "Tied. No family points." : `${state.names[scores.findIndex((_, i) => playerIds[i] === winners[0])]} wins Yacht.`,
      };
      return {
        state: next,
        currentTurnUserId: null,
        finished: true,
        winnerId: winners.length === 1 ? winners[0] : null,
        lastLine: next.lastLine,
      };
    }
    const nextSeat = (seat + 1) % playerIds.length;
    const next: YachtState = {
      ...state,
      scores,
      current: nextSeat,
      dice: [1, 2, 3, 4, 5],
      held: [false, false, false, false, false],
      rollsLeft: 3,
      phase: "need-roll",
      lastLine: `${state.names[seat]} scored ${YACHT_LABELS[cat]} for ${value}. ${state.names[nextSeat]}'s dice.`,
    };
    return {
      state: next,
      currentTurnUserId: playerIds[nextSeat],
      finished: false,
      winnerId: null,
      lastLine: next.lastLine,
    };
  }

  throw new Error("Illegal");
}

/** Pick an empty box for a bot: take a Yacht if present, else best remaining value. */
export function yachtBotScore(state: YachtState): YachtCat {
  const open = YACHT_CATS.filter((c) => state.scores[state.current][c] == null);
  let best: YachtCat = open[0];
  let n = -1;
  for (const c of open) {
    const v = yachtValue(c, state.dice);
    if (v > n) {
      n = v;
      best = c;
    }
  }
  if (n === 0 && open.includes("chance") === false) {
    const upper = open.filter((c) => ["ones", "twos", "threes", "fours", "fives", "sixes"].includes(c));
    if (upper.length) best = upper[upper.length - 1];
  }
  return best;
}
