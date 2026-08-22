/** Reversi (Othello mechanics, public-domain name). 8×8, seat 0 = fox/black. */
import type { EngineResult, MiniAction } from "./types";

export const REV_N = 8;
const DIRS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export type ReversiState = {
  cells: number[]; // 0 empty, 1 seat0, 2 seat1
  turn: 0 | 1;
};

export function initReversi(): ReversiState {
  const cells = Array(64).fill(0);
  cells[27] = 2;
  cells[28] = 1;
  cells[35] = 1;
  cells[36] = 2;
  return { cells, turn: 0 };
}

function at(cells: number[], r: number, c: number) {
  if (r < 0 || c < 0 || r >= REV_N || c >= REV_N) return -1;
  return cells[r * REV_N + c];
}

function flips(cells: number[], r: number, c: number, who: number): number[] {
  if (at(cells, r, c) !== 0) return [];
  const out: number[] = [];
  const foe = who === 1 ? 2 : 1;
  for (const [dr, dc] of DIRS) {
    const line: number[] = [];
    let rr = r + dr;
    let cc = c + dc;
    while (at(cells, rr, cc) === foe) {
      line.push(rr * REV_N + cc);
      rr += dr;
      cc += dc;
    }
    if (line.length && at(cells, rr, cc) === who) out.push(...line);
  }
  return out;
}

export function legalReversi(state: ReversiState, seat: 0 | 1): number[] {
  const who = seat + 1;
  const spots: number[] = [];
  for (let i = 0; i < 64; i++) {
    if (flips(state.cells, Math.floor(i / 8), i % 8, who).length) spots.push(i);
  }
  return spots;
}

function count(cells: number[], who: number) {
  return cells.filter((x) => x === who).length;
}

export function applyReversi(
  state: ReversiState,
  action: MiniAction,
  actorSeat: number,
  playerIds: string[],
): EngineResult {
  if (action.type === "resign") {
    return {
      state,
      currentTurnUserId: null,
      finished: true,
      winnerId: playerIds[actorSeat === 0 ? 1 : 0],
      lastLine: "Resigned.",
    };
  }
  if (action.type !== "place" && action.type !== "move") throw new Error("Illegal");
  if (state.turn !== actorSeat) throw new Error("Not your turn");
  const i = action.type === "place" ? action.at : action.to;
  const who = actorSeat + 1;
  const r = Math.floor(i / 8);
  const c = i % 8;
  const take = flips(state.cells, r, c, who);
  if (!take.length) throw new Error("Illegal disc");
  const cells = state.cells.slice();
  cells[i] = who;
  for (const t of take) cells[t] = who;
  const nextSeat = (1 - actorSeat) as 0 | 1;
  const nextLegal = legalReversi({ cells, turn: nextSeat }, nextSeat);
  const myLegal = legalReversi({ cells, turn: actorSeat as 0 | 1 }, actorSeat as 0 | 1);
  let turn: 0 | 1 = nextSeat;
  let line = "Flipped.";
  if (!nextLegal.length && myLegal.length) {
    turn = actorSeat as 0 | 1;
    line = "Opponent has no move. Go again.";
  }
  if (!nextLegal.length && !myLegal.length) {
    const a = count(cells, 1);
    const b = count(cells, 2);
    const winnerId = a === b ? null : a > b ? playerIds[0] : playerIds[1];
    return {
      state: { cells, turn: state.turn },
      currentTurnUserId: null,
      finished: true,
      winnerId,
      lastLine: winnerId ? `${a}–${b}.` : `Draw ${a}–${a}. No family points.`,
    };
  }
  return {
    state: { cells, turn },
    currentTurnUserId: playerIds[turn],
    finished: false,
    winnerId: null,
    lastLine: line,
  };
}
