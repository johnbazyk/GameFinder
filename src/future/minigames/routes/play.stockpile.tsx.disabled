import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StockpileTable } from "@/components/minigames/stockpile-table";
import { applyAction, initState } from "@/lib/minigames/apply";
import { botColor, isBot } from "@/lib/minigames/bots";
import { nextStockpileBotAction, type StockpileState } from "@/lib/minigames/stockpile";
import { useAppStore } from "@/lib/store";
import { DEFAULT_PIECE_COLOR } from "@/lib/piece-color";
import type { SessionView } from "@/lib/minigames/server";
import type { MiniAction } from "@/lib/minigames/types";

export const Route = createFileRoute("/play/stockpile")({ component: StockpileLab });

const YOU = "you";
const SEATS = [YOU, "bot:finn", "bot:sly", "bot:rook"] as const;
const NAMES = ["You", "Finn", "Sly", "Rook"];
const STOCK = 10 as const;

function colorsForYou(hex: string) {
  return [hex, botColor("bot:finn"), botColor("bot:sly"), botColor("bot:rook")];
}

function fresh(pieceColor: string): SessionView {
  const state = initState("stockpile", [...SEATS], NAMES, { rounds: STOCK }, colorsForYou(pieceColor)) as StockpileState;
  return {
    id: "lab-stockpile",
    groupId: "lab",
    gameType: "stockpile",
    status: "active",
    currentTurnUserId: SEATS[state.turn] ?? YOU,
    settings: { passPhone: false, rounds: STOCK },
    state,
    winnerId: null,
    pointsAwarded: null,
    version: 1,
    lastLine: state.lastLine,
    players: SEATS.map((id, i) => ({
      userId: id,
      name: NAMES[i],
      seat: i,
      color: colorsForYou(pieceColor)[i],
    })),
    you: YOU,
    dice: null,
  };
}

function StockpileLab() {
  const pieceColor = useAppStore((s) => s.pieceColor) || DEFAULT_PIECE_COLOR;
  const [view, setView] = useState<SessionView>(() => fresh(pieceColor));
  const [busy, setBusy] = useState(false);
  const ids = useMemo(() => [...SEATS], []);

  useEffect(() => {
    setView((prev) => {
      const state = prev.state as StockpileState;
      const colors = state.colors.map((c, i) => (i === 0 ? pieceColor : c));
      return {
        ...prev,
        state: { ...state, colors },
        players: prev.players.map((p) => (p.userId === YOU ? { ...p, color: pieceColor } : p)),
      };
    });
  }, [pieceColor]);

  const act = useCallback(
    (action: MiniAction) => {
      setBusy(true);
      setView((prev) => {
        const state = prev.state as StockpileState;
        if (state.winner != null && action.type === "next-round") return fresh(pieceColor);
        let actor = prev.you;
        let next = action;
        if (action.type === "bot-step") {
          const botId = ids[state.turn];
          if (!botId || !isBot(botId)) return prev;
          const step = nextStockpileBotAction(state);
          if (!step) return prev;
          actor = botId;
          next = step;
        }
        try {
          const result = applyAction("stockpile", state, next, actor, ids);
          const nextState = result.state as StockpileState;
          return {
            ...prev,
            state: nextState,
            currentTurnUserId: result.currentTurnUserId,
            status: result.finished ? "finished" : "active",
            winnerId: result.winnerId,
            lastLine: result.lastLine,
            version: prev.version + 1,
          };
        } catch {
          return prev;
        }
      });
      window.setTimeout(() => setBusy(false), 40);
    },
    [ids, pieceColor],
  );

  return <StockpileTable view={view} busy={busy} act={act} />;
}
