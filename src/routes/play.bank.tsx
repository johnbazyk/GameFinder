import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BankTable } from "@/components/minigames/bank-table";
import { applyAction, initState } from "@/lib/minigames/apply";
import { botColor, nextBankBotAction } from "@/lib/minigames/bots";
import { useAppStore } from "@/lib/store";
import { DEFAULT_PIECE_COLOR } from "@/lib/piece-color";
import type { SessionView } from "@/lib/minigames/server";
import type { MiniAction } from "@/lib/minigames/types";
import type { BankState } from "@/lib/bank";
import { roll2d6 } from "@/lib/dice";

export const Route = createFileRoute("/play/bank")({ component: BankLab });

const YOU = "you";
const SEATS = [YOU, "bot:finn", "bot:sly", "bot:rook"] as const;
const NAMES = ["You", "Finn", "Sly", "Rook"];
const ROUNDS = 10 as const;

function colorsForYou(hex: string) {
  return [hex, botColor("bot:finn"), botColor("bot:sly"), botColor("bot:rook")];
}

function fresh(pieceColor: string): SessionView {
  const state = initState("bank", [...SEATS], NAMES, { rounds: ROUNDS }, colorsForYou(pieceColor)) as BankState;
  return {
    id: "lab-bank",
    groupId: "lab",
    gameType: "bank",
    status: "active",
    currentTurnUserId: state.players[state.currentIdx]?.id ?? YOU,
    settings: { passPhone: true, rounds: ROUNDS },
    state,
    winnerId: null,
    pointsAwarded: null,
    version: 1,
    lastLine: state.lastLine,
    players: state.players.map((p, i) => ({
      userId: p.id,
      name: p.name,
      seat: i,
      color: p.color,
    })),
    you: YOU,
    dice: null,
  };
}

function BankLab() {
  const pieceColor = useAppStore((s) => s.pieceColor) || DEFAULT_PIECE_COLOR;
  const [view, setView] = useState<SessionView>(() => fresh(pieceColor));

  useEffect(() => {
    setView((prev) => {
      const state = prev.state as BankState;
      const players = state.players.map((p) =>
        p.id === YOU ? { ...p, color: pieceColor } : p,
      );
      return {
        ...prev,
        state: { ...state, players },
        players: prev.players.map((p) =>
          p.userId === YOU ? { ...p, color: pieceColor } : p,
        ),
      };
    });
  }, [pieceColor]);
  const [busy, setBusy] = useState(false);
  const ids = useMemo(() => [...SEATS], []);

  const act = useCallback((action: MiniAction) => {
    setBusy(true);
    setView((prev) => {
      const state = prev.state as BankState;
      if (state.phase === "game-over" && action.type === "next-round") return fresh(pieceColor);

      let actor = prev.you;
      let next = action;
      if (action.type === "bot-step") {
        const step = nextBankBotAction(state);
        if (!step) return prev;
        actor = step.actorId;
        next = step.action;
      } else if (action.type === "bank") {
        actor = action.playerId ?? prev.you;
      } else if (action.type === "roll" || action.type === "pass" || action.type === "next-round") {
        actor = state.players[state.currentIdx]?.id ?? prev.you;
      }

      try {
        const dice = next.type === "roll" ? roll2d6() : undefined;
        const result = applyAction("bank", state, next, actor, ids, dice);
        const nextState = result.state as BankState;
        return {
          ...prev,
          state: nextState,
          currentTurnUserId: result.currentTurnUserId,
          status: result.finished ? "finished" : "active",
          winnerId: result.winnerId,
          lastLine: result.lastLine,
          dice: result.dice ?? nextState.dice,
          version: prev.version + 1,
          players: nextState.players.map((p, i) => ({ userId: p.id, name: p.name, seat: i, color: p.color })),
        };
      } catch {
        return prev;
      }
    });
    window.setTimeout(() => setBusy(false), 40);
  }, [ids, pieceColor]);

  return <BankTable view={view} busy={busy} act={act} />;
}
