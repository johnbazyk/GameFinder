export type MiniGameType = "bank" | "connect4" | "checkers" | "chess" | "tictactoe";

export const MINI_GAMES: Record<
  MiniGameType,
  { label: string; blurb: string; min: number; max: number; passPhone: boolean }
> = {
  bank: {
    label: "Bank",
    blurb: "Shared pot. Don't be the 7.",
    min: 2,
    max: 8,
    passPhone: true,
  },
  connect4: {
    label: "Connect Four",
    blurb: "Four in a row.",
    min: 2,
    max: 2,
    passPhone: false,
  },
  checkers: {
    label: "Checkers",
    blurb: "English draughts.",
    min: 2,
    max: 2,
    passPhone: false,
  },
  chess: {
    label: "Chess",
    blurb: "Full rules. Resign or offer a draw.",
    min: 2,
    max: 2,
    passPhone: false,
  },
  tictactoe: {
    label: "Tic-Tac-Toe",
    blurb: "Three in a row.",
    min: 2,
    max: 2,
    passPhone: false,
  },
};

export type MiniAction =
  | { type: "roll" }
  | { type: "bank"; playerId?: string }
  | { type: "pass" }
  | { type: "next-round" }
  | { type: "drop"; col: number }
  | { type: "move"; from: number; to: number; promotion?: string }
  | { type: "bot-step" }
  | { type: "resign" }
  | { type: "offer-draw" }
  | { type: "accept-draw" }
  | { type: "decline-draw" };

export type EngineResult = {
  state: unknown;
  currentTurnUserId: string | null;
  finished: boolean;
  winnerId: string | null;
  lastLine: string;
  dice?: [number, number];
};
