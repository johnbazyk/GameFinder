import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { DicePair, THROW_MS } from "@/components/dice-pair";
import { Button } from "@/components/ui/button";
import type { BankState } from "@/lib/bank";
import { ranked, stillIn } from "@/lib/bank";
import { isBot, nextBankBotAction } from "@/lib/minigames/bots";
import { PLAYER_COLORS } from "@/lib/types";
import type { SessionView } from "@/lib/minigames/server";
import type { MiniAction } from "@/lib/minigames/types";
import { cn } from "@/lib/utils";

const BANK_WINDOW_MS = 8000;

function clackDice() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  for (let i = 0; i < 5; i++) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = i % 2 ? "triangle" : "square";
    osc.frequency.value = 140 + Math.random() * 220 + i * 18;
    g.gain.setValueAtTime(0.0001, now + i * 0.07);
    g.gain.exponentialRampToValueAtTime(0.08, now + i * 0.07 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.09);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now + i * 0.07);
    osc.stop(now + i * 0.07 + 0.1);
  }
  const thud = ctx.createOscillator();
  const tg = ctx.createGain();
  thud.type = "sine";
  thud.frequency.setValueAtTime(90, now + 0.82);
  thud.frequency.exponentialRampToValueAtTime(42, now + 1.02);
  tg.gain.setValueAtTime(0.0001, now + 0.82);
  tg.gain.exponentialRampToValueAtTime(0.16, now + 0.84);
  tg.gain.exponentialRampToValueAtTime(0.0001, now + 1.12);
  thud.connect(tg);
  tg.connect(ctx.destination);
  thud.start(now + 0.82);
  thud.stop(now + 1.14);
}

export function BankTable({
  view,
  busy,
  act,
}: {
  view: SessionView;
  busy: boolean;
  act: (a: MiniAction) => void;
}) {
  const state = view.state as BankState;
  const [held, setHeld] = useState<[number, number]>(state.dice ?? [1, 1]);
  const [spinning, setSpinning] = useState(false);
  const [passIn, setPassIn] = useState<number | null>(null);
  const lastRoll = useRef(`${state.dice?.[0] ?? 0}-${state.dice?.[1] ?? 0}-${state.rollsThisRound}`);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!state.dice) return;
    const key = `${state.dice[0]}-${state.dice[1]}-${state.rollsThisRound}`;
    if (key === lastRoll.current) return;
    lastRoll.current = key;
    setHeld(state.dice);
    setSpinning(true);
    clackDice();
    const t = window.setTimeout(() => setSpinning(false), THROW_MS);
    return () => window.clearTimeout(t);
  }, [state.dice?.[0], state.dice?.[1], state.rollsThisRound]);

  useEffect(() => {
    if (view.status !== "active" || busy || spinning) return;
    if (!nextBankBotAction(state)) return;
    const hold =
      state.phase === "busted" || state.phase === "round-over" ? 2400 : 700;
    const t = window.setTimeout(() => act({ type: "bot-step" }), hold);
    return () => window.clearTimeout(t);
  }, [view.version, view.status, busy, spinning, state.phase, state.currentIdx, state.bankedIds.join(",")]);

  const busted = state.phase === "busted";
  const pot = busted ? 0 : Number(state.bank) || 0;
  const current = state.players[state.currentIdx];
  const live = stillIn(state);
  const over = view.status === "finished" || state.phase === "game-over";
  const waiting = state.phase === "after-roll";
  const canRoll = state.phase === "need-roll" && !spinning && !busy;
  const myTurn = !isBot(current?.id ?? "") && (view.settings.passPhone || view.you === view.currentTurnUserId);
  const youAreIn = Boolean(view.you) && live.some((p) => p.id === view.you) && !isBot(view.you);
  const canCashOut =
    youAreIn &&
    !spinning &&
    !busy &&
    !busted &&
    !over &&
    pot > 0 &&
    (state.phase === "need-roll" || state.phase === "after-roll");
  const awaitingHumanPass =
    waiting && !spinning && !busy && !nextBankBotAction(state) && myTurn;

  useEffect(() => {
    if (!awaitingHumanPass) {
      setPassIn(null);
      return;
    }
    const started = Date.now();
    const delay = BANK_WINDOW_MS;
    setPassIn(Math.ceil(delay / 1000));
    const tick = window.setInterval(() => {
      const left = delay - (Date.now() - started);
      setPassIn(Math.max(0, Math.ceil(left / 1000)));
    }, 200);
    const t = window.setTimeout(() => act({ type: "pass" }), delay);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(tick);
    };
  }, [awaitingHumanPass, view.version]);

  const leave = (
    view.groupId === "lab" ? (
      <Link to="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-muted-foreground">
        Leave
      </Link>
    ) : (
      <Link
        to="/circle/$groupId"
        params={{ groupId: view.groupId }}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-muted-foreground"
      >
        Leave
      </Link>
    )
  );

  return (
    <div className="bank-screen">
      <div className="bank-chrome">
        {leave}
        <span className="bank-chip">
          {state.round}/{state.totalRounds}
        </span>
        <span className={cn("bank-chip", busted ? "is-bust" : state.rollsThisRound >= 3 && "is-danger")}>
          {over ? "Final" : busted ? "Bust" : state.rollsThisRound < 3 ? "Safe" : "Danger"}
        </span>
      </div>

      {over ? (
        <div className="bank-over">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fox">Final accounts</p>
          <ol className="mt-4 space-y-3">
            {ranked(state).map((p, i) => (
              <li key={p.id} className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">
                  {i + 1}. {p.name}
                </span>
                <span className="font-display text-4xl tabular-nums">{p.score}</span>
              </li>
            ))}
          </ol>
          {view.winnerId ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {state.players.find((p) => p.id === view.winnerId)?.name} wins
              {view.pointsAwarded ? ` · +${view.pointsAwarded} family` : ""}.
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Draw. No family points.</p>
          )}
          {view.groupId === "lab" ? (
            <Button className="mt-6 w-full" size="xl" onClick={() => act({ type: "next-round" })}>
              Play again
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="bank-center">
            <div className="bank-table-bed">
              <div className={cn("bank-pot", busted && "is-bust")}>
                <p className="bank-pot-kicker">{busted ? "Bust" : "In the pot"}</p>
                <p className="bank-pot-value">{pot}</p>
              </div>
              <DicePair values={held} throwing={spinning} ink={current?.color} />
            </div>
            <p className="bank-line">{state.lastLine}</p>
          </div>

          <ul className="bank-seats">
            {state.players.map((p, i) => {
              const mine = p.id === current?.id;
              const out = state.bankedIds.includes(p.id);
              return (
                <li
                  key={p.id}
                  className={cn("bank-seat", mine && !out && "is-turn", out && "is-sat")}
                >
                  <p className="flex items-center gap-1.5 truncate text-xs font-bold tracking-wide">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: p.color || PLAYER_COLORS[i % PLAYER_COLORS.length] }}
                    />
                    <span className="truncate">{p.name}</span>
                    {isBot(p.id) ? <span className="font-semibold text-muted-foreground">bot</span> : null}
                  </p>
                  <p className="font-display text-4xl tabular-nums leading-none">{p.score}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {out ? "Banked" : mine ? "Rolling" : "In"}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="bank-dock">
            {canCashOut ? (
              <Button
                className="w-full"
                size="xl"
                disabled={busy}
                onClick={() => act({ type: "bank", playerId: view.you })}
              >
                Bank {pot}
                {passIn != null ? ` · ${passIn}` : ""}
              </Button>
            ) : null}
            {canRoll && myTurn ? (
              <Button
                className="w-full"
                size="xl"
                variant={canCashOut ? "secondary" : "default"}
                disabled={busy}
                onClick={() => act({ type: "roll" })}
              >
                Roll
              </Button>
            ) : null}
            {canRoll && isBot(current?.id ?? "") ? (
              <p className="text-center text-sm text-muted-foreground">{current?.name} is rolling…</p>
            ) : null}
            {waiting && myTurn && !canCashOut ? (
              <p className="text-center text-sm text-muted-foreground">Passing the dice…</p>
            ) : null}
            {busted ? (
              <p className="text-center text-sm font-semibold text-berry">
                Seven. The pot is gone. Next round in a moment.
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
