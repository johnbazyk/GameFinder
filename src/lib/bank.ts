/** Bank — family dice game. Shared pot, pass two dice, shout BANK before a 7. */

import { whose } from "@/lib/utils";

export const BANK_BGG_ID = "412804";

export type BankRounds = 10 | 15 | 20;

export type BankPhase =
  | "setup"
  | "need-roll"
  | "after-roll"
  | "busted"
  | "round-over"
  | "game-over";

export type BankPlayer = {
  id: string;
  name: string;
  color: string;
  score: number;
};

export type BankState = {
  players: BankPlayer[];
  totalRounds: BankRounds;
  round: number;
  bank: number;
  rollsThisRound: number;
  currentIdx: number;
  starterIdx: number;
  bankedIds: string[];
  phase: BankPhase;
  dice: [number, number] | null;
  lastLine: string;
};

export function createBank(players: BankPlayer[], totalRounds: BankRounds): BankState {
  return {
    players: players.map((p) => ({ ...p, score: 0 })),
    totalRounds,
    round: 1,
    bank: 0,
    rollsThisRound: 0,
    currentIdx: 0,
    starterIdx: 0,
    bankedIds: [],
    phase: "need-roll",
    dice: null,
    lastLine: "First three rolls are safe. A 7 is worth 70. Then it gets mean.",
  };
}

export function stillIn(state: BankState) {
  return state.players.filter((p) => !state.bankedIds.includes(p.id));
}

export function applyRoll(state: BankState, d1: number, d2: number): BankState {
  if (state.phase !== "need-roll") return state;
  const a = Number(d1);
  const b = Number(d2);
  const sum = a + b;
  const doubles = a === b;
  const safe = Number(state.rollsThisRound) < 3;
  let bank = Number(state.bank) || 0;
  let lastLine = "";
  let phase: BankPhase = "after-roll";
  const roller = state.players[state.currentIdx]?.name ?? "Someone";

  if (safe) {
    if (sum === 7) {
      bank += 70;
      lastLine = `${roller} rolled a 7 — that's 70 while it's still safe.`;
    } else {
      bank += sum;
      lastLine = doubles
        ? `${roller} rolled doubles ${a}s. Face value only this early: +${sum}.`
        : `${roller} rolled ${a} and ${b}. +${sum} in the bank.`;
    }
  } else if (sum === 7) {
    return {
      ...state,
      dice: [a, b],
      bank: 0,
      rollsThisRound: Number(state.rollsThisRound) + 1,
      phase: "busted",
      lastLine: `${roller} rolled a 7. The bank is empty. Anyone who hadn't banked scores nothing this round.`,
    };
  } else if (doubles) {
    bank = bank * 2;
    lastLine = `${roller} rolled doubles ${a}s. The bank doubles to ${bank}.`;
  } else {
    bank += sum;
    lastLine = `${roller} rolled ${a} and ${b}. Bank is ${bank}.`;
  }

  return {
    ...state,
    dice: [a, b],
    bank,
    rollsThisRound: Number(state.rollsThisRound) + 1,
    phase,
    lastLine,
  };
}

export function bankPoints(state: BankState, playerId: string): BankState {
  if (state.phase !== "after-roll" && state.phase !== "need-roll") return state;
  if (state.bankedIds.includes(playerId)) return state;
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;
  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, score: p.score + state.bank } : p,
  );
  const bankedIds = [...state.bankedIds, playerId];
  const remaining = players.filter((p) => !bankedIds.includes(p.id));
  if (remaining.length === 0) {
    return {
      ...state,
      players,
      bankedIds,
      phase: state.round >= state.totalRounds ? "game-over" : "round-over",
      lastLine: `${player.name} banked ${state.bank}. Everyone's in — round over.`,
    };
  }
  const current = remaining.some((p) => p.id === state.players[state.currentIdx]?.id)
    ? state.currentIdx
    : nextIndex(state, remaining);
  return {
    ...state,
    players,
    bankedIds,
    currentIdx: current,
    lastLine: `${player.name} banked ${state.bank} and sits the rest of the round.`,
  };
}

export function passDice(state: BankState): BankState {
  if (state.phase !== "after-roll") return state;
  const remaining = stillIn(state);
  if (remaining.length === 0) {
    return {
      ...state,
      phase: state.round >= state.totalRounds ? "game-over" : "round-over",
      lastLine: "Everyone's in — round over.",
    };
  }
  const current = state.players[state.currentIdx];
  const stillHere = remaining.some((p) => p.id === current?.id);
  // If the roller already banked, currentIdx already points at the next seat.
  const idx = stillHere ? nextIndex(state, remaining) : state.currentIdx;
  const next = state.players[idx];
  return {
    ...state,
    currentIdx: idx,
    phase: "need-roll",
    lastLine: `${whose(next.name, "dice")}.`,
  };
}

export function nextRound(state: BankState): BankState {
  if (state.phase !== "busted" && state.phase !== "round-over") return state;
  if (state.round >= state.totalRounds) {
    return { ...state, phase: "game-over", lastLine: "That's the last round." };
  }
  const starterIdx = (state.starterIdx + 1) % state.players.length;
  return {
    ...state,
    round: state.round + 1,
    bank: 0,
    rollsThisRound: 0,
    starterIdx,
    currentIdx: starterIdx,
    bankedIds: [],
    phase: "need-roll",
    dice: null,
    lastLine: `Round ${state.round + 1}. First three rolls are safe again.`,
  };
}

function nextIndex(state: BankState, remaining: BankPlayer[]) {
  const n = state.players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (state.currentIdx + i) % n;
    if (remaining.some((p) => p.id === state.players[idx].id)) return idx;
  }
  return state.currentIdx;
}

export { rollD6 } from "./dice";

export function ranked(state: BankState) {
  return [...state.players].sort((a, b) => b.score - a.score);
}
