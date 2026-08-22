import type { EngineResult, MiniAction } from "./types";

export const C4_COLS = 7;
export const C4_ROWS = 6;

export type C4State = {
  grid: number[][]; // 0 empty, 1 seat0, 2 seat1; row 0 is top
  turn: 0 | 1;
};

export function initC4(): C4State {
  return {
    grid: Array.from({ length: C4_ROWS }, () => Array(C4_COLS).fill(0)),
    turn: 0,
  };
}

function dropRow(grid: number[][], col: number) {
  for (let r = C4_ROWS - 1; r >= 0; r--) if (grid[r][col] === 0) return r;
  return -1;
}

function hasFour(grid: number[][], r: number, c: number, who: number) {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of dirs) {
    let n = 1;
    for (const sign of [1, -1]) {
      let rr = r + dr * sign;
      let cc = c + dc * sign;
      while (rr >= 0 && rr < C4_ROWS && cc >= 0 && cc < C4_COLS && grid[rr][cc] === who) {
        n += 1;
        rr += dr * sign;
        cc += dc * sign;
      }
    }
    if (n >= 4) return true;
  }
  return false;
}

export function applyC4(
  state: C4State,
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
  if (action.type !== "drop") throw new Error("Illegal");
  if (state.turn !== actorSeat) throw new Error("Not your turn");
  const col = action.col;
  if (col < 0 || col >= C4_COLS) throw new Error("Off the board");
  const row = dropRow(state.grid, col);
  if (row < 0) throw new Error("Column full");
  const grid = state.grid.map((r) => r.slice());
  const who = actorSeat + 1;
  grid[row][col] = who;
  if (hasFour(grid, row, col, who)) {
    return {
      state: { grid, turn: state.turn },
      currentTurnUserId: null,
      finished: true,
      winnerId: playerIds[actorSeat],
      lastLine: "Four in a row.",
    };
  }
  if (grid.every((r) => r.every((x) => x !== 0))) {
    return {
      state: { grid, turn: state.turn },
      currentTurnUserId: null,
      finished: true,
      winnerId: null,
      lastLine: "Draw. No family points.",
    };
  }
  const next = (1 - actorSeat) as 0 | 1;
  return {
    state: { grid, turn: next },
    currentTurnUserId: playerIds[next],
    finished: false,
    winnerId: null,
    lastLine: "Dropped.",
  };
}
