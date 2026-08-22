import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Die } from "@/components/dice-pair";
import { Button } from "@/components/ui/button";
import type { BankState } from "@/lib/bank";
import { ranked, stillIn } from "@/lib/bank";
import { isBot, nextBankBotAction } from "@/lib/minigames/bots";
import { PLAYER_COLORS } from "@/lib/types";
import type { SessionView } from "@/lib/minigames/server";
import type { MiniAction } from "@/lib/minigames/types";
import { cn } from "@/lib/utils";

const BANK_WINDOW_MS = 2800;

function clackDice() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 180 + Math.random() * 90 + i * 40;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.01 + i * 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12 + i * 0.05);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now + i * 0.05);
    osc.stop(now + 0.16 + i * 0.05);
  }
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
    setSpinning(true);
    clackDice();
    const t = window.setTimeout(() => {
      setHeld(state.dice ?? [1, 1]);
      setSpinning(false);
    }, 680);
    return () => window.clearTimeout(t);
  }, [state.dice?.[0], state.dice?.[1], state.rollsThisRound]);

  useEffect(() => {
    if (view.status !== "active" || busy || spinning) return;
    if (!nextBankBotAction(state)) return;
    const hold =
      state.phase === "busted" || state.phase === "round-over" ? 2400 : 850;
    const t = window.setTimeout(() => act({ type: "bot-step" }), hold);
    return () => window.clearTimeout(t);
  }, [view.version, view.status, busy, spinning, state.phase, state.currentIdx, state.bankedIds.join(",")]);

  const busted = state.phase === "busted";
  const pot = busted ? 0 : state.bank;
  const current = state.players[state.currentIdx];
  const live = stillIn(state);
  const over = view.status === "finished" || state.phase === "game-over";
  const waiting = state.phase === "after-roll";
  const canRoll = state.phase === "need-roll" && !spinning && !busy;
  const myTurn = !isBot(current?.id ?? "") && (view.settings.passPhone || view.you === view.currentTurnUserId);
  const humanCanBank =
    waiting && !spinning && !busy && live.some((p) => p.id === view.you) && !isBot(view.you);
  const awaitingHumanPass =
    waiting && !spinning && !busy && !nextBankBotAction(state) && myTurn;

  useEffect(() => {
    if (!awaitingHumanPass) {
      setPassIn(null);
      return;
    }
    const started = Date.now();
    const delay = humanCanBank ? BANK_WINDOW_MS : 450;
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
  }, [awaitingHumanPass, humanCanBank, view.version]);

  return (
    <div className="bank-screen">
      <div className="bank-chrome">
        <Link
          to="/circle/$groupId"
          params={{ groupId: view.groupId }}
          className="inline-flex min-h-11 min-w-11 items-center text-sm font-bold text-cream/80"
        >
          Leave
        </Link>
        <span className="bank-chip">{state.round}/{state.totalRounds}</span>
        <span className={cn("bank-chip", busted && "is-bust")}>
          {over ? "Final" : busted ? "Bust" : state.rollsThisRound < 3 ? "Safe" : "Danger"}
        </span>
      </div>

      {over ? (
        <div className="bank-over">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cream/70">Final accounts</p>
          <ol className="mt-3 space-y-3">
            {ranked(state).map((p, i) => (
              <li key={p.id} className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-cream">
                  {i + 1}. {p.name}
                </span>
                <span className="font-display text-4xl tabular-nums text-cream">{p.score}</span>
              </li>
            ))}
          </ol>
          {view.winnerId ? (
            <p className="mt-4 text-sm text-cream/80">
              {state.players.find((p) => p.id === view.winnerId)?.name} wins
              {view.pointsAwarded ? ` · +${view.pointsAwarded} family` : ""}.
            </p>
          ) : (
            <p className="mt-4 text-sm text-cream/80">Draw. No family points.</p>
          )}
        </div>
      ) : (
        <>
          <div className="bank-center">
            <div className={cn("bank-vault", busted && "is-bust")}>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cream/70">
                {busted ? "Bust" : "Bank"}
              </p>
              <p className="font-display text-5xl tabular-nums leading-none text-cream">{pot}</p>
            </div>
            <div className="flex justify-center gap-3">
              <Die value={held[0]} spinning={spinning} size="lg" />
              <Die value={held[1]} spinning={spinning} size="lg" />
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
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color || PLAYER_COLORS[i % PLAYER_COLORS.length] }} />
                    <span className="truncate">{p.name}</span>
                    {isBot(p.id) ? <span className="font-semibold opacity-70">bot</span> : null}
                  </p>
                  <p className="font-display text-4xl tabular-nums leading-none">{p.score}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">
                    {out ? "Banked" : mine ? "Rolling" : "In"}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="bank-dock">
            {canRoll && myTurn ? (
              <Button className="w-full" size="xl" disabled={busy} onClick={() => act({ type: "roll" })}>
                Roll
              </Button>
            ) : null}
            {canRoll && isBot(current?.id ?? "") ? (
              <p className="text-center text-sm text-cream/85">{current?.name} is rolling…</p>
            ) : null}
            {humanCanBank ? (
              <Button
                className="w-full"
                size="xl"
                variant="secondary"
                disabled={busy}
                onClick={() => act({ type: "bank", playerId: view.you })}
              >
                Bank {state.bank}
                {passIn != null ? ` · ${passIn}` : ""}
              </Button>
            ) : null}
            {waiting && !humanCanBank && !isBot(current?.id ?? "") ? (
              <p className="text-center text-sm text-cream/85">Passing the dice…</p>
            ) : null}
            {busted ? (
              <p className="text-center text-sm font-semibold text-cream">
                Seven. The pot is gone. Next round in a moment.
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
