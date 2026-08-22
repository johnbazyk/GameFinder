import { applyRoll, bankPoints, createBank, nextRound, passDice, ranked, type BankState } from "@/lib/bank";
import type { EngineResult, MiniAction, MiniGameType } from "./types";
import { PLAYER_COLORS } from "@/lib/types";
import { botColor, botLabel, isBot } from "./bots";
import { applyC4, initC4, type C4State } from "./connect4";
import { applyCheckers, initCheckers, type CheckersState } from "./checkers";
import { applyChess, initChess, type ChessState } from "./chess";
import { applyTtt, initTtt, type TttState } from "./tictactoe";
import { applyShed, initShed, type ShedState } from "./shed";
import { applyStockpile, initStockpile, type StockpileState } from "./stockpile";

export function initState(
  type: MiniGameType,
  playerIds: string[],
  names: string[],
  settings: { rounds?: number },
  colors?: string[],
) {
  if (type === "bank") {
    return createBank(
      playerIds.map((id, i) => ({
        id,
        name: isBot(id) ? botLabel(id) : (names[i] ?? "Player"),
        color: isBot(id)
          ? botColor(id)
          : colors?.[i] || PLAYER_COLORS[i % PLAYER_COLORS.length],
        score: 0,
      })),
      (settings.rounds === 10 || settings.rounds === 20 ? settings.rounds : 15) as 10 | 15 | 20,
    );
  }
  if (type === "connect4") return initC4();
  if (type === "checkers") return initCheckers();
  if (type === "chess") return initChess();
  if (type === "shed") return initShed(playerIds.length);
  if (type === "stockpile") {
    const size = settings.rounds === 10 || settings.rounds === 20 || settings.rounds === 30 ? settings.rounds : 20;
    return initStockpile(
      playerIds.length,
      playerIds.map((id, i) => (isBot(id) ? botLabel(id) : names[i] ?? "Player")),
      playerIds.map((id, i) => (isBot(id) ? botColor(id) : colors?.[i] || PLAYER_COLORS[i % PLAYER_COLORS.length])),
      size,
    );
  }
  return initTtt();
}

export function applyAction(
  type: MiniGameType,
  state: unknown,
  action: MiniAction,
  actorId: string,
  playerIds: string[],
  dice?: [number, number],
): EngineResult {
  const seat = playerIds.indexOf(actorId);
  if (seat < 0) throw new Error("Not in this game");

  if (type === "bank") {
    let s = state as BankState;
    if (action.type === "roll") {
      if (s.players[s.currentIdx]?.id !== actorId) throw new Error("Not your roll");
      if (!dice) throw new Error("Dice missing");
      s = applyRoll(s, dice[0], dice[1]);
      if (s.phase === "busted") s = { ...s, bank: 0 };
      return {
        state: s,
        currentTurnUserId: s.players[s.currentIdx]?.id ?? null,
        finished: s.phase === "game-over",
        winnerId: s.phase === "game-over" ? ranked(s)[0]?.id ?? null : null,
        lastLine: s.lastLine,
        dice,
      };
    }
    if (action.type === "bank") {
      s = bankPoints(s, actorId);
    } else if (action.type === "pass") {
      if (s.players[s.currentIdx]?.id !== actorId) throw new Error("Not your pass");
      s = passDice(s);
    } else if (action.type === "next-round") {
      s = nextRound(s);
    } else throw new Error("Illegal");
    let winnerId: string | null = null;
    if (s.phase === "game-over") {
      const list = ranked(s);
      if (list.length >= 2 && list[0].score === list[1].score) winnerId = null;
      else winnerId = list[0]?.id ?? null;
    }
    return {
      state: s,
      currentTurnUserId: s.players[s.currentIdx]?.id ?? null,
      finished: s.phase === "game-over",
      winnerId,
      lastLine: s.lastLine,
    };
  }
  if (type === "connect4") return applyC4(state as C4State, action, seat, playerIds);
  if (type === "checkers") return applyCheckers(state as CheckersState, action, seat, playerIds);
  if (type === "chess") return applyChess(state as ChessState, action, actorId, playerIds);
  if (type === "shed") return applyShed(state as ShedState, action, seat, playerIds);
  if (type === "stockpile") return applyStockpile(state as StockpileState, action, seat, playerIds);
  return applyTtt(state as TttState, action, seat, playerIds);
}
