export type MiniGameType = "bank" | "connect4" | "checkers" | "chess" | "tictactoe" | "shed";

export const MINI_GAMES: Record<
  MiniGameType,
  { label: string; blurb: string; min: number; max: number; passPhone: boolean; joinable?: boolean }
> = {
  bank: {
    label: "Bank",
    blurb: "Shared pot. Don't be the 7.",
    min: 2,
    max: 8,
    passPhone: true,
    joinable: true,
  },
  connect4: {
    label: "Four in a Row",
    blurb: "Drop a disc. Make four.",
    min: 2,
    max: 2,
    passPhone: false,
  },
  checkers: {
    label: "Checkers",
    blurb: "English draughts. Captures are mandatory.",
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
  shed: {
    label: "Shed",
    blurb: "Match color or number. Empty your hand.",
    min: 2,
    max: 6,
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
  | { type: "place"; at: number }
  | { type: "hold"; dice: boolean[] }
  | { type: "score"; category: string }
  | { type: "play-card"; i: number; wild?: 0 | 1 | 2 | 3 }
  | { type: "draw" }
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
  dice?: [number, number] | number[];
};
