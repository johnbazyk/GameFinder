import { Chess } from "chess.js";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chessMoves } from "@/lib/minigames/chess";
import type { C4State } from "@/lib/minigames/connect4";
import { C4_COLS, C4_ROWS } from "@/lib/minigames/connect4";
import type { CheckersState } from "@/lib/minigames/checkers";
import type { ChessState } from "@/lib/minigames/chess";
import type { TttState } from "@/lib/minigames/tictactoe";
import type { SessionView } from "@/lib/minigames/server";
import type { MiniAction } from "@/lib/minigames/types";
import { PLAYER_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

const BOARD_BLEED =
  "w-[calc(100%+2rem)] -mx-4 overflow-hidden sm:mx-auto sm:w-full sm:max-w-sm sm:rounded-card sm:shadow-card";

function twoTone(view: SessionView) {
  return {
    me: view.you,
    mine: view.players.find((p) => p.userId === view.you)?.seat === 0,
    names: view.players,
    yourTurn: view.you === view.currentTurnUserId && view.status === "active",
  };
}

function playerColor(view: SessionView, seat: number) {
  return view.players.find((p) => p.seat === seat)?.color ?? PLAYER_COLORS[seat % PLAYER_COLORS.length];
}

export function TttBoard({
  view,
  act,
  busy,
}: {
  view: SessionView;
  act: (a: MiniAction) => void;
  busy: boolean;
}) {
  const state = view.state as TttState;
  const { yourTurn } = twoTone(view);
  return (
    <div className="grid grid-cols-3 gap-2">
      {state.cells.map((cell, i) => (
        <button
          key={i}
          type="button"
          disabled={busy || !yourTurn || cell != null || view.status !== "active"}
          onClick={() => act({ type: "move", from: i, to: i })}
          className="grid aspect-square min-h-11 place-items-center rounded-card bg-card font-display text-4xl shadow-card disabled:opacity-70"
        >
          {cell == null ? "" : (
            <span style={{ color: playerColor(view, cell) }}>{cell === 0 ? "X" : "O"}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Connect4Board({
  view,
  act,
  busy,
}: {
  view: SessionView;
  act: (a: MiniAction) => void;
  busy: boolean;
}) {
  const state = view.state as C4State;
  const { yourTurn } = twoTone(view);
  return (
    <div className="rounded-card bg-sky/30 p-2">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${C4_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: C4_COLS }, (_, c) => (
          <button
            key={`t-${c}`}
            type="button"
            className="grid h-11 place-items-center rounded-full bg-card text-sky"
            disabled={busy || !yourTurn || view.status !== "active"}
            onClick={() => act({ type: "drop", col: c })}
            aria-label={`Drop in column ${c + 1}`}
          >
            <ChevronDown className="size-5" strokeWidth={2.4} />
          </button>
        ))}
        {Array.from({ length: C4_ROWS }, (_, r) =>
          Array.from({ length: C4_COLS }, (_, c) => {
            const v = state.grid[r][c];
            return (
              <div
                key={`${r}-${c}`}
                className={cn("aspect-square rounded-full", v === 0 && "bg-cream")}
                style={v ? { background: playerColor(view, v - 1) } : undefined}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

export function CheckersBoard({
  view,
  act,
  busy,
}: {
  view: SessionView;
  act: (a: MiniAction) => void;
  busy: boolean;
}) {
  const state = view.state as CheckersState;
  const { yourTurn } = twoTone(view);
  const [sel, setSel] = useState<number | null>(null);
  const seat = view.players.find((p) => p.userId === view.you)?.seat ?? 0;

  function click(i: number) {
    if (!yourTurn || busy || view.status !== "active") return;
    const r = Math.floor(i / 8);
    const c = i % 8;
    const p = state.board[r][c];
    const mine = seat === 0 ? p === 1 || p === 2 : p === 3 || p === 4;
    if (sel == null) {
      if (mine) setSel(i);
      return;
    }
    if (sel === i) {
      setSel(null);
      return;
    }
    if (mine) {
      setSel(i);
      return;
    }
    act({ type: "move", from: sel, to: i });
    setSel(null);
  }

  return (
    <div className={cn("grid grid-cols-8", BOARD_BLEED)}>
      {state.board.flatMap((row, r) =>
        row.map((p, c) => {
          const i = r * 8 + c;
          const dark = (r + c) % 2 === 1;
          return (
            <button
              key={i}
              type="button"
              onClick={() => click(i)}
              className={cn(
                "grid aspect-square min-h-11 place-items-center",
                dark ? "bg-moss/70" : "bg-cream-deep",
                sel === i && "ring-2 ring-inset ring-fox",
              )}
            >
              {p ? (
                <span
                  className={cn(
                    "size-[70%] rounded-full",
                    (p === 2 || p === 4) && "ring-2 ring-cream",
                  )}
                  style={{ background: playerColor(view, p === 1 || p === 2 ? 0 : 1) }}
                />
              ) : null}
            </button>
          );
        }),
      )}
    </div>
  );
}

const GLYPH: Record<string, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

export function ChessBoard({
  view,
  act,
  busy,
}: {
  view: SessionView;
  act: (a: MiniAction) => void;
  busy: boolean;
}) {
  const state = view.state as ChessState;
  const { yourTurn } = twoTone(view);
  const [sel, setSel] = useState<number | null>(null);
  const legal = sel == null ? [] : chessMoves(state.fen, sel);
  const board = new Chess(state.fen).board();
  const seat = view.players.find((p) => p.userId === view.you)?.seat ?? 0;
  const flipped = seat === 1;

  function click(i: number) {
    if (!yourTurn || busy || view.status !== "active") return;
    if (sel == null) {
      setSel(i);
      return;
    }
    if (sel === i) {
      setSel(null);
      return;
    }
    if (legal.includes(i)) {
      act({ type: "move", from: sel, to: i, promotion: "q" });
      setSel(null);
      return;
    }
    setSel(i);
  }

  const order = Array.from({ length: 64 }, (_, i) => i);
  const cells = flipped ? [...order].reverse() : order;

  return (
    <div>
      <div className={cn("grid grid-cols-8", BOARD_BLEED)}>
        {cells.map((i) => {
          const r = Math.floor(i / 8);
          const c = i % 8;
          const piece = board[r][c];
          const glyph = piece ? GLYPH[piece.color === "w" ? piece.type.toUpperCase() : piece.type] : "";
          const light = (r + c) % 2 === 0;
          const white = piece?.color === "w";
          return (
            <button
              key={i}
              type="button"
              onClick={() => click(i)}
              className={cn(
                "grid aspect-square min-h-11 place-items-center text-2xl leading-none",
                light ? "bg-cream" : "bg-moss/50",
                sel === i && "ring-2 ring-inset ring-fox",
                legal.includes(i) && "ring-2 ring-inset ring-sky",
              )}
            >
              {glyph ? (
                <span style={{ color: white ? playerColor(view, 0) : playerColor(view, 1) }}>{glyph}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {state.offerDrawFrom && state.offerDrawFrom !== view.you ? (
        <div className="mt-3 flex gap-2">
          <Button onClick={() => act({ type: "accept-draw" })}>Accept draw</Button>
          <Button variant="outline" onClick={() => act({ type: "decline-draw" })}>
            No
          </Button>
        </div>
      ) : view.status === "active" ? (
        <div className="mt-3 flex gap-2">
          <Button variant="outline" disabled={busy || !yourTurn} onClick={() => act({ type: "offer-draw" })}>
            Offer draw
          </Button>
          <Button variant="berry" disabled={busy} onClick={() => act({ type: "resign" })}>
            Resign
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function SeatDots({
  players,
}: {
  players: { userId: string; name: string; seat: number; color?: string }[];
}) {
  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      {[...players]
        .sort((a, b) => a.seat - b.seat)
        .map((p) => (
          <span key={p.userId} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: p.color || PLAYER_COLORS[p.seat % PLAYER_COLORS.length] }}
            />
            {p.name}
          </span>
        ))}
    </span>
  );
}
