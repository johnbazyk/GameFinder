import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SHED_COLORS,
  canPlay,
  labelCard,
  type ShedCard,
  type ShedColor,
  type ShedState,
} from "@/lib/minigames/shed";
import type { SessionView } from "@/lib/minigames/server";
import type { MiniAction } from "@/lib/minigames/types";
import { cn } from "@/lib/utils";

function CardFace({
  card,
  active,
  onClick,
}: {
  card: ShedCard;
  active?: boolean;
  onClick?: () => void;
}) {
  const wild = card.kind === "wild" || card.kind === "plus4";
  const bg = wild ? undefined : SHED_COLORS[card.color ?? 0];
  const inner = (
    <span className={cn("play-card", wild && "is-wild")} style={bg ? { background: bg } : undefined}>
      {labelCard(card)}
    </span>
  );
  if (!onClick) return inner;
  return (
    <button type="button" onClick={onClick} disabled={!active} className={cn(!active && "opacity-40")}>
      {inner}
    </button>
  );
}

export function ShedTable({
  view,
  busy,
  act,
}: {
  view: SessionView;
  busy: boolean;
  act: (a: MiniAction) => void;
}) {
  const state = view.state as ShedState;
  const seat = view.players.find((p) => p.userId === view.you)?.seat ?? 0;
  const yourTurn = view.you === view.currentTurnUserId && view.status === "active";
  const hand = state.hands[seat] ?? [];
  const discard = state.discard.at(-1);
  const [wildFor, setWildFor] = useState<number | null>(null);

  function play(i: number, wild?: ShedColor) {
    const card = hand[i];
    if (!card) return;
    if ((card.kind === "wild" || card.kind === "plus4") && wild == null) {
      setWildFor(i);
      return;
    }
    setWildFor(null);
    act({ type: "play-card", i, wild });
  }

  return (
    <div className="shed-table">
      <div className="flex justify-center gap-4 text-sm text-muted-foreground">
        {view.players.map((p, i) => (
          <span key={p.userId} className={cn(i === state.turn && "font-semibold text-fox")}>
            {p.name} · {state.hands[i]?.length ?? 0}
          </span>
        ))}
      </div>

      <div className="shed-discard">
        {discard ? <CardFace card={discard} /> : <p className="text-sm text-muted-foreground">No discard yet</p>}
      </div>
      {state.wildColor != null ? (
        <p className="text-center text-xs font-bold uppercase tracking-wide text-fox">
          Color is {["fox", "moss", "sky", "berry"][state.wildColor]}
        </p>
      ) : null}
      {state.pendingDraw > 0 ? (
        <p className="text-center text-sm font-semibold text-berry">Draw {state.pendingDraw} or stack a +2 / +4</p>
      ) : null}

      {wildFor != null ? (
        <div className="flex justify-center gap-2">
          {SHED_COLORS.map((hex, i) => (
            <button
              key={hex}
              type="button"
              className="size-10 rounded-full"
              style={{ background: hex }}
              aria-label={`Set color ${i}`}
              onClick={() => play(wildFor, i as ShedColor)}
            />
          ))}
        </div>
      ) : null}

      <div className="play-hand">
        {hand.map((card, i) => (
          <CardFace
            key={card.id}
            card={card}
            active={yourTurn && !busy && canPlay(state, card)}
            onClick={() => play(i)}
          />
        ))}
      </div>

      <Button
        className="w-full"
        variant="secondary"
        disabled={!yourTurn || busy}
        onClick={() => act({ type: "draw" })}
      >
        {state.pendingDraw > 0 ? `Draw ${state.pendingDraw}` : "Draw"}
      </Button>
    </div>
  );
}
