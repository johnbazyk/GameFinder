import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { isBot } from "@/lib/minigames/bots";
import {
  canPlace,
  labelStock,
  nextStockpileBotAction,
  top,
  type StockCard,
  type StockpileState,
} from "@/lib/minigames/stockpile";
import type { SessionView } from "@/lib/minigames/server";
import type { MiniAction } from "@/lib/minigames/types";
import { cn, whose } from "@/lib/utils";

type Pick =
  | { src: "stock" }
  | { src: "hand"; i: number }
  | { src: "discard"; i: number };

function band(n?: number) {
  if (n == null) return "is-empty";
  if (n === 0) return "is-wild";
  if (n <= 4) return "is-low";
  if (n <= 8) return "is-mid";
  return "is-high";
}

function Face({
  card,
  ghost,
  selected,
  hot,
  onClick,
  tall,
  hand,
  count,
}: {
  card?: StockCard;
  ghost?: string;
  selected?: boolean;
  hot?: boolean;
  onClick?: () => void;
  tall?: boolean;
  hand?: boolean;
  count?: number;
}) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      aria-label={card ? `Card ${labelStock(card)}` : ghost || "empty"}
      className={cn(
        "stock-card",
        band(card?.n),
        tall && "is-tall",
        hand && "is-hand",
        selected && "is-sel",
        hot && "is-hot",
        !card && "is-empty",
      )}
    >
      <span>{card ? labelStock(card) : ghost}</span>
      {count && count > 1 ? <em>{count}</em> : null}
    </button>
  );
}

export function StockpileTable({
  view,
  busy,
  act,
}: {
  view: SessionView;
  busy: boolean;
  act: (a: MiniAction) => void;
}) {
  const state = view.state as StockpileState;
  const seat = view.players.find((p) => p.userId === view.you)?.seat ?? 0;
  const yourTurn = view.you === view.currentTurnUserId && view.status === "active" && !isBot(view.you);
  const [pick, setPick] = useState<Pick | null>(null);
  const over = view.status === "finished" || state.winner != null;
  const current = view.players[state.turn];

  useEffect(() => {
    if (over || busy) return;
    const id = view.players[state.turn]?.userId;
    if (!id || !isBot(id)) return;
    if (!nextStockpileBotAction(state)) return;
    const t = window.setTimeout(() => act({ type: "bot-step" }), 520);
    return () => window.clearTimeout(t);
  }, [view.version, view.status, busy, state.turn, state.drawn, state.lastLine]);

  function playTo(pile: number) {
    if (!pick || !yourTurn || busy) return;
    if (pick.src === "stock") act({ type: "play-stock", pile });
    else if (pick.src === "hand") act({ type: "play-hand", i: pick.i, pile });
    else act({ type: "play-discard", from: pick.i, pile });
    setPick(null);
  }

  function parkTo(pile: number) {
    if (!pick || pick.src !== "hand" || !yourTurn || busy) return;
    act({ type: "park", i: pick.i, pile });
    setPick(null);
  }

  const pickedCard =
    pick?.src === "stock"
      ? top(state.stocks[seat] ?? [])
      : pick?.src === "hand"
        ? state.hands[seat]?.[pick.i]
        : pick?.src === "discard"
          ? top(state.discards[seat]?.[pick.i] ?? [])
          : undefined;

  return (
    <div className="stock-screen">
      <div className="bank-chrome">
        {view.id === "lab-stockpile" ? (
          <Link to="/" className="text-sm font-semibold text-sky">
            Home
          </Link>
        ) : (
          <Link to="/circle/$groupId" params={{ groupId: view.groupId }} className="text-sm font-semibold text-sky">
            Table
          </Link>
        )}
        <p className="font-display text-xl">Stockpile</p>
        <span className="text-xs font-bold uppercase tracking-wide text-fox">
          {state.stocks[seat]?.length ?? 0} left
        </span>
      </div>
      <Link
        to="/game/$id/table"
        params={{ id: "1269" }}
        className="text-center text-sm font-semibold text-sky"
      >
        Teach me with Finn
      </Link>

      <p className="stock-line">
        {over
          ? state.winner != null
            ? `${state.names[state.winner] ?? view.players[state.winner]?.name} emptied their stock.`
            : "Game over."
          : `${whose(current?.name ?? "Someone", "turn")} — ${state.lastLine}`}
      </p>

      <div className="stock-rivals">
        {view.players.map((p, i) =>
          i === seat ? null : (
            <div key={p.userId} className={cn("stock-rival", i === state.turn && "is-turn")}>
              <span className="stock-rival-name" style={{ color: p.color }}>
                {p.name}
              </span>
              <div className="stock-rival-row">
                <Face card={top(state.stocks[i] ?? [])} ghost="—" count={state.stocks[i]?.length} />
                {(state.discards[i] ?? []).map((pile, d) => (
                  <Face key={d} card={top(pile)} ghost="·" />
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      <div className="stock-builds-wrap">
        <p className="stock-kicker">Build — 1 up to 12, then clear</p>
        <div className="stock-builds">
          {state.build.map((pile, i) => (
            <Face
              key={i}
              card={top(pile)}
              ghost={String(state.need[i])}
              count={pile.length}
              hot={Boolean(yourTurn && pickedCard && canPlace(pickedCard, state.need[i]))}
              onClick={
                yourTurn && pickedCard && canPlace(pickedCard, state.need[i]) ? () => playTo(i) : undefined
              }
            />
          ))}
        </div>
      </div>

      <div className="stock-you">
        <div className="stock-col">
          <p className="stock-kicker">Your stock</p>
          <Face
            card={top(state.stocks[seat] ?? [])}
            ghost="—"
            tall
            count={state.stocks[seat]?.length}
            selected={pick?.src === "stock"}
            onClick={
              yourTurn && top(state.stocks[seat] ?? [])
                ? () => setPick(pick?.src === "stock" ? null : { src: "stock" })
                : undefined
            }
          />
        </div>
        <div className="stock-col grow">
          <p className="stock-kicker">Park a hand card to end the turn</p>
          <div className="stock-discards">
            {state.discards[seat]?.map((pile, i) => (
              <Face
                key={i}
                card={top(pile)}
                ghost="+"
                count={pile.length}
                selected={pick?.src === "discard" && pick.i === i}
                hot={pick?.src === "hand"}
                onClick={() => {
                  if (!yourTurn) return;
                  if (pick?.src === "hand") {
                    parkTo(i);
                    return;
                  }
                  if (!top(pile)) return;
                  setPick(pick?.src === "discard" && pick.i === i ? null : { src: "discard", i });
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="play-hand">
        {(state.hands[seat] ?? []).map((card, i) => (
          <Face
            key={card.id}
            card={card}
            selected={pick?.src === "hand" && pick.i === i}
            hand
            onClick={yourTurn ? () => setPick(pick?.src === "hand" && pick.i === i ? null : { src: "hand", i }) : undefined}
          />
        ))}
      </div>
      {yourTurn && (state.hands[seat]?.length ?? 0) < 5 ? (
        <Button className="stock-draw" variant="secondary" disabled={busy} onClick={() => act({ type: "draw" })}>
          Draw to 5 — you have {state.hands[seat]?.length ?? 0}
        </Button>
      ) : (
        <p className="stock-hint">
          Hand {state.hands[seat]?.length ?? 0}/5. Tap a card, then a glowing build. Park one to end the turn.
        </p>
      )}

      {over && view.id === "lab-stockpile" ? (
        <Button className="mt-1 w-full" onClick={() => act({ type: "next-round" })}>
          Play again
        </Button>
      ) : null}
    </div>
  );
}
