import type { EngineResult, MiniAction } from "./types";

export type TttState = {
  cells: (0 | 1 | null)[];
  turn: 0 | 1;
};

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function initTtt(): TttState {
  return { cells: Array(9).fill(null), turn: 0 };
}

function winnerOf(cells: TttState["cells"]): 0 | 1 | "draw" | null {
  for (const [a, b, c] of LINES) {
    if (cells[a] != null && cells[a] === cells[b] && cells[b] === cells[c]) return cells[a];
  }
  if (cells.every((x) => x != null)) return "draw";
  return null;
}

export function applyTtt(
  state: TttState,
  action: MiniAction,
  actorSeat: number,
  playerIds: string[],
): EngineResult {
  if (action.type === "resign") {
    const winnerId = playerIds[actorSeat === 0 ? 1 : 0];
    return {
      state,
      currentTurnUserId: null,
      finished: true,
      winnerId,
      lastLine: "Resigned.",
    };
  }
  if (action.type !== "move") throw new Error("Illegal");
  if (state.turn !== actorSeat) throw new Error("Not your turn");
  const i = action.to;
  if (i < 0 || i > 8 || state.cells[i] != null) throw new Error("Taken");
  const cells = state.cells.slice() as TttState["cells"];
  cells[i] = actorSeat as 0 | 1;
  const w = winnerOf(cells);
  if (w === "draw") {
    return {
      state: { cells, turn: state.turn },
      currentTurnUserId: null,
      finished: true,
      winnerId: null,
      lastLine: "Draw. No family points.",
    };
  }
  if (w === 0 || w === 1) {
    return {
      state: { cells, turn: state.turn },
      currentTurnUserId: null,
      finished: true,
      winnerId: playerIds[w],
      lastLine: "Three in a row.",
    };
  }
  const next = (1 - actorSeat) as 0 | 1;
  return {
    state: { cells, turn: next },
    currentTurnUserId: playerIds[next],
    finished: false,
    winnerId: null,
    lastLine: "Marked.",
  };
}
