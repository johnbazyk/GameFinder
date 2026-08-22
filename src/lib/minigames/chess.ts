import { Chess, type Square } from "chess.js";
import type { EngineResult, MiniAction } from "./types";

export type ChessState = {
  fen: string;
  offerDrawFrom: string | null;
};

export function initChess(): ChessState {
  return { fen: new Chess().fen(), offerDrawFrom: null };
}

export function applyChess(
  state: ChessState,
  action: MiniAction,
  actorId: string,
  playerIds: string[],
): EngineResult {
  const game = new Chess(state.fen);
  const white = playerIds[0];
  const black = playerIds[1];
  const actorIsWhite = actorId === white;
  const turnWhite = game.turn() === "w";
  if (action.type === "resign") {
    return {
      state,
      currentTurnUserId: null,
      finished: true,
      winnerId: actorId === white ? black : white,
      lastLine: "Resigned.",
    };
  }
  if (action.type === "offer-draw") {
    if ((turnWhite && !actorIsWhite) || (!turnWhite && actorIsWhite)) throw new Error("Not your turn");
    return {
      state: { ...state, offerDrawFrom: actorId },
      currentTurnUserId: actorId === white ? black : white,
      finished: false,
      winnerId: null,
      lastLine: "Draw offered.",
    };
  }
  if (action.type === "accept-draw") {
    if (!state.offerDrawFrom || state.offerDrawFrom === actorId) throw new Error("No offer");
    return {
      state,
      currentTurnUserId: null,
      finished: true,
      winnerId: null,
      lastLine: "Draw agreed. No family points.",
    };
  }
  if (action.type === "decline-draw") {
    return {
      state: { ...state, offerDrawFrom: null },
      currentTurnUserId: turnWhite ? white : black,
      finished: false,
      winnerId: null,
      lastLine: "Draw declined.",
    };
  }
  if (action.type !== "move") throw new Error("Illegal");
  if ((turnWhite && !actorIsWhite) || (!turnWhite && actorIsWhite)) throw new Error("Not your turn");
  const files = "abcdefgh";
  const from = `${files[action.from % 8]}${8 - Math.floor(action.from / 8)}` as Square;
  const to = `${files[action.to % 8]}${8 - Math.floor(action.to / 8)}` as Square;
  const mv = game.move({
    from,
    to,
    promotion: (action.promotion as "q" | "r" | "b" | "n") ?? "q",
  });
  if (!mv) throw new Error("Illegal move");
  if (game.isCheckmate()) {
    return {
      state: { fen: game.fen(), offerDrawFrom: null },
      currentTurnUserId: null,
      finished: true,
      winnerId: actorId,
      lastLine: "Checkmate.",
    };
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
    return {
      state: { fen: game.fen(), offerDrawFrom: null },
      currentTurnUserId: null,
      finished: true,
      winnerId: null,
      lastLine: "Draw. No family points.",
    };
  }
  const next = game.turn() === "w" ? white : black;
  return {
    state: { fen: game.fen(), offerDrawFrom: null },
    currentTurnUserId: next,
    finished: false,
    winnerId: null,
    lastLine: game.inCheck() ? "Check." : mv.san,
  };
}

export function chessBoard(fen: string) {
  return new Chess(fen).board();
}

export function chessMoves(fen: string, fromSq: number) {
  const game = new Chess(fen);
  const files = "abcdefgh";
  const from = `${files[fromSq % 8]}${8 - Math.floor(fromSq / 8)}` as Square;
  return game.moves({ square: from, verbose: true }).map((m) => {
    const file = m.to.charCodeAt(0) - 97;
    const rank = 8 - Number(m.to[1]);
    return rank * 8 + file;
  });
}
