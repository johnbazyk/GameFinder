/**
 * Mancala (Kalah). 6 pits each + stores.
 * Indices: 0–5 P0 pits, 6 P0 store, 7–12 P1 pits, 13 P1 store.
 */
import type { EngineResult, MiniAction } from "./types";

export type MancalaState = {
  pits: number[];
  turn: 0 | 1;
};

export function initMancala(): MancalaState {
  const pits = Array(14).fill(4);
  pits[6] = 0;
  pits[13] = 0;
  return { pits, turn: 0 };
}

function sow(pits: number[], start: number, turn: 0 | 1) {
  const skip = turn === 0 ? 13 : 6;
  let stones = pits[start];
  const next = pits.slice();
  next[start] = 0;
  let i = start;
  while (stones > 0) {
    i = (i + 1) % 14;
    if (i === skip) continue;
    next[i] += 1;
    stones -= 1;
  }
  return { pits: next, last: i };
}

export function applyMancala(
  state: MancalaState,
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
  if (action.type !== "move" && action.type !== "place") throw new Error("Illegal");
  if (state.turn !== actorSeat) throw new Error("Not your turn");
  const pit = action.type === "place" ? action.at : action.from;
  const mine = actorSeat === 0 ? pit >= 0 && pit <= 5 : pit >= 7 && pit <= 12;
  if (!mine || state.pits[pit] === 0) throw new Error("Empty pit");
  const store = actorSeat === 0 ? 6 : 13;
  const { pits, last } = sow(state.pits, pit, actorSeat as 0 | 1);
  // Capture: last stone in own empty pit, opposite has stones.
  const myPits = actorSeat === 0 ? last <= 5 : last >= 7 && last <= 12;
  if (last !== store && myPits && pits[last] === 1) {
    const opp = 12 - last;
    if (pits[opp] > 0) {
      pits[store] += pits[opp] + 1;
      pits[opp] = 0;
      pits[last] = 0;
    }
  }
  const p0empty = [0, 1, 2, 3, 4, 5].every((i) => pits[i] === 0);
  const p1empty = [7, 8, 9, 10, 11, 12].every((i) => pits[i] === 0);
  if (p0empty || p1empty) {
    const sweep0 = [0, 1, 2, 3, 4, 5].reduce((a, i) => a + pits[i], 0);
    const sweep1 = [7, 8, 9, 10, 11, 12].reduce((a, i) => a + pits[i], 0);
    pits[6] += sweep0;
    pits[13] += sweep1;
    for (const i of [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]) pits[i] = 0;
    const a = pits[6];
    const b = pits[13];
    return {
      state: { pits, turn: state.turn },
      currentTurnUserId: null,
      finished: true,
      winnerId: a === b ? null : a > b ? playerIds[0] : playerIds[1],
      lastLine: a === b ? `Draw ${a}–${a}. No family points.` : `${Math.max(a, b)}–${Math.min(a, b)}.`,
    };
  }
  const extra = last === store;
  const turn = extra ? (actorSeat as 0 | 1) : ((1 - actorSeat) as 0 | 1);
  return {
    state: { pits, turn },
    currentTurnUserId: playerIds[turn],
    finished: false,
    winnerId: null,
    lastLine: extra ? "Landed in store — go again." : "Sown.",
  };
}
