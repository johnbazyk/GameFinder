import type { BankState } from "@/lib/bank";
import { stillIn } from "@/lib/bank";
import type { MiniAction } from "./types";

export type BotId = "bot:finn" | "bot:sly" | "bot:rook";

export type BotDef = {
  id: BotId;
  name: string;
  style: string;
  color: string;
};

export const HOUSE_BOTS: BotDef[] = [
  { id: "bot:finn", name: "Finn", style: "Banks early. Hates a 7.", color: "#4a6b4d" },
  { id: "bot:sly", name: "Sly", style: "Rides the pot. Greedy.", color: "#7fa8c9" },
  { id: "bot:rook", name: "Rook", style: "Counts. Banks a lead.", color: "#8b5a2b" },
];

export function isBot(id: string) {
  return id.startsWith("bot:");
}

export function botById(id: string): BotDef | undefined {
  return HOUSE_BOTS.find((b) => b.id === id);
}

export function botLabel(id: string) {
  return botById(id)?.name ?? "House";
}

export function botColor(id: string) {
  return botById(id)?.color ?? "#4a6b4d";
}

/** One legal house action, or null if a human has to go. */
export function nextBankBotAction(state: BankState): { actorId: string; action: MiniAction } | null {
  if (state.phase === "busted" || state.phase === "round-over") {
    return { actorId: state.players[state.currentIdx]?.id ?? state.players[0].id, action: { type: "next-round" } };
  }
  if (state.phase === "after-roll") {
    const live = stillIn(state);
    for (const p of live) {
      if (isBot(p.id) && wantsBank(p.id, state)) {
        return { actorId: p.id, action: { type: "bank", playerId: p.id } };
      }
    }
    const current = state.players[state.currentIdx];
    if (current && isBot(current.id) && !state.bankedIds.includes(current.id)) {
      return { actorId: current.id, action: { type: "pass" } };
    }
    return null;
  }
  if (state.phase === "need-roll") {
    const current = state.players[state.currentIdx];
    if (current && isBot(current.id)) return { actorId: current.id, action: { type: "roll" } };
  }
  return null;
}

function wantsBank(id: string, state: BankState): boolean {
  if (state.bank <= 0) return false;
  const me = state.players.find((p) => p.id === id);
  if (!me) return false;
  const remaining = stillIn(state).length;
  const danger = state.rollsThisRound >= 3;
  const pot = state.bank;
  const lead = Math.max(...state.players.map((p) => p.score));
  const myTotal = me.score + pot;

  if (!danger) {
    // First three rolls can't bust. Sit unless the pot already looks like a night.
    return pot >= 140;
  }

  if (id === "bot:finn") {
    if (remaining === 1) return true;
    if (pot >= 16) return true;
    if (pot >= 10 && state.bankedIds.length > 0) return true;
    return false;
  }
  if (id === "bot:sly") {
    if (remaining === 1) return true;
    if (pot >= 50) return true;
    if (state.rollsThisRound >= 10 && pot >= 24) return true;
    return false;
  }
  // Rook: take a lead, or a pot that's fat enough to be worth the 1-in-6 bust.
  if (remaining === 1) return true;
  if (myTotal >= lead + 12 && pot >= 12) return true;
  if (pot >= 28) return true;
  if (state.bankedIds.length >= Math.max(1, state.players.length - 2) && pot >= 18) return true;
  return false;
}
