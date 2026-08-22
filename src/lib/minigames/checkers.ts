import type { EngineResult, MiniAction } from "./types";

/** 0 empty, 1 black man, 2 black king, 3 red man, 4 red king. Black = seat 0. */
export type CheckersState = {
  board: number[][];
  turn: 0 | 1;
  must: [number, number] | null;
};

const DIRS = [
  [1, -1],
  [1, 1],
  [-1, -1],
  [-1, 1],
];

function inb(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}
function dark(r: number, c: number) {
  return (r + c) % 2 === 1;
}
function side(p: number): 0 | 1 | null {
  if (p === 1 || p === 2) return 0;
  if (p === 3 || p === 4) return 1;
  return null;
}
function king(p: number) {
  return p === 2 || p === 4;
}

export function initCheckers(): CheckersState {
  const board = Array.from({ length: 8 }, () => Array(8).fill(0));
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (!dark(r, c)) continue;
      if (r < 3) board[r][c] = 1;
      if (r > 4) board[r][c] = 3;
    }
  }
  return { board, turn: 0, must: null };
}

type Jump = { from: [number, number]; to: [number, number]; over: [number, number] };

function pieceDirs(p: number) {
  if (king(p)) return DIRS;
  return p === 1 ? [DIRS[0], DIRS[1]] : [DIRS[2], DIRS[3]];
}

function jumpsFrom(board: number[][], r: number, c: number): Jump[] {
  const p = board[r][c];
  const me = side(p);
  if (me == null) return [];
  const out: Jump[] = [];
  for (const [dr, dc] of pieceDirs(p)) {
    const or_ = r + dr;
    const oc = c + dc;
    const tr = r + dr * 2;
    const tc = c + dc * 2;
    if (!inb(tr, tc) || !inb(or_, oc)) continue;
    const mid = board[or_][oc];
    if (side(mid) != null && side(mid) !== me && board[tr][tc] === 0 && dark(tr, tc)) {
      out.push({ from: [r, c], to: [tr, tc], over: [or_, oc] });
    }
  }
  return out;
}

function stepsFrom(board: number[][], r: number, c: number) {
  const p = board[r][c];
  const out: [number, number][] = [];
  for (const [dr, dc] of pieceDirs(p)) {
    const tr = r + dr;
    const tc = c + dc;
    if (inb(tr, tc) && board[tr][tc] === 0 && dark(tr, tc)) out.push([tr, tc]);
  }
  return out;
}

function allJumps(board: number[][], turn: 0 | 1, must: [number, number] | null): Jump[] {
  if (must) return jumpsFrom(board, must[0], must[1]);
  const all: Jump[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (side(board[r][c]) === turn) all.push(...jumpsFrom(board, r, c));
    }
  }
  return all;
}

function hasMove(board: number[][], turn: 0 | 1) {
  if (allJumps(board, turn, null).length) return true;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (side(board[r][c]) === turn && stepsFrom(board, r, c).length) return true;
    }
  }
  return false;
}

function idx(from: number) {
  return [Math.floor(from / 8), from % 8] as [number, number];
}

export function applyCheckers(
  state: CheckersState,
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
  if (action.type !== "move") throw new Error("Illegal");
  if (state.turn !== actorSeat) throw new Error("Not your turn");
  const [fr, fc] = idx(action.from);
  const [tr, tc] = idx(action.to);
  const p = state.board[fr][fc];
  if (side(p) !== actorSeat) throw new Error("Not your piece");
  if (state.must && (state.must[0] !== fr || state.must[1] !== fc)) {
    throw new Error("Finish the jump");
  }
  const board = state.board.map((row) => row.slice());
  const jumps = allJumps(board, actorSeat as 0 | 1, state.must);
  const hit = jumps.find((j) => j.from[0] === fr && j.from[1] === fc && j.to[0] === tr && j.to[1] === tc);
  if (jumps.length && !hit) throw new Error("Must capture");
  if (!hit) {
    const steps = stepsFrom(board, fr, fc);
    if (!steps.some(([r, c]) => r === tr && c === tc)) throw new Error("Illegal move");
  }
  board[fr][fc] = 0;
  if (hit) board[hit.over[0]][hit.over[1]] = 0;
  let landed = p;
  const crown = (actorSeat === 0 && tr === 7) || (actorSeat === 1 && tr === 0);
  if (crown) landed = actorSeat === 0 ? 2 : 4;
  board[tr][tc] = landed;
  if (hit && !crown) {
    const more = jumpsFrom(board, tr, tc);
    if (more.length) {
      return {
        state: { board, turn: actorSeat as 0 | 1, must: [tr, tc] },
        currentTurnUserId: playerIds[actorSeat],
        finished: false,
        winnerId: null,
        lastLine: "Jump again.",
      };
    }
  }
  const next = (1 - actorSeat) as 0 | 1;
  if (!hasMove(board, next)) {
    return {
      state: { board, turn: next, must: null },
      currentTurnUserId: null,
      finished: true,
      winnerId: playerIds[actorSeat],
      lastLine: "No moves left.",
    };
  }
  return {
    state: { board, turn: next, must: null },
    currentTurnUserId: playerIds[next],
    finished: false,
    winnerId: null,
    lastLine: hit ? "Captured." : "Moved.",
  };
}
