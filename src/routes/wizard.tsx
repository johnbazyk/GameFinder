import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Dices } from "lucide-react";
import { FoxAvatar } from "@/components/fox-avatar";
import { Button } from "@/components/ui/button";
import { VibeGrid } from "@/components/vibe-grid";
import { AgeBands, PlayerPicker, TimeChips } from "@/components/wizard-controls";
import { useAppStore } from "@/lib/store";
import { pickTonight, runWizard } from "@/lib/scoring";
import type { VibeId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { VIBE_META } from "@/lib/vibes";
import { useFlag } from "@/lib/flags";

export const Route = createFileRoute("/wizard")({ component: WizardPage });

const STEPS = [
  { key: "players", title: "How many people are playing?", hint: "Count everyone at the table." },
  { key: "age", title: "How old is the youngest player?", hint: "Younger-rated games still qualify." },
  {
    key: "time",
    title: "How much time do you want to play?",
    hint: "We'll match the listed playtime for each game.",
  },
  {
    key: "vibe",
    title: "What kind of game are you in the mood for?",
    hint: "Choose as many as you want, or skip this step.",
  },
] as const;

function WizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [sniffing, setSniffing] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const wizard = useAppStore((s) => s.wizard);
  const setWizard = useAppStore((s) => s.setWizard);
  const setResults = useAppStore((s) => s.setResults);
  const isPremium = useAppStore((s) => s.isPremium);
  const setUpgradePrompt = useAppStore((s) => s.setUpgradePrompt);
  const advancedOn = useFlag("advanced_filters");

  const last = step === STEPS.length - 1;

  function finish() {
    setSniffing(true);
    useAppStore.setState({ shownIds: [] });
    const { owned, wishlist, plays, vibeWeights, wizard: ctx, recPool } = useAppStore.getState();
    const result = runWizard(
      ctx,
      { owned: recPool?.ids.length ? recPool.ids : owned, wishlist, plays, vibeWeights },
    );
    setResults(result);
    window.setTimeout(() => navigate({ to: "/results" }), 900);
  }

  function skip() {
    if (step === 0) setWizard({ players: null });
    if (step === 1) setWizard({ ageBand: null });
    if (step === 2) setWizard({ maxTimeMin: null, timeOver60: false });
    if (step === 3) setWizard({ vibes: [], exactTraits: null });
    if (last) finish();
    else setStep((s) => s + 1);
  }

  function surpriseFromAnswers() {
    const { owned, wishlist, plays, vibeWeights, wizard: ctx, recPool } = useAppStore.getState();
    const pick = pickTonight(ctx, {
      owned: recPool?.ids.length ? recPool.ids : owned,
      wishlist,
      plays,
      vibeWeights,
    });
    if (!pick) {
      navigate({ to: "/vault" });
      return;
    }
    navigate({ to: "/game/$id", params: { id: pick.bggId } });
  }

  function toggleVibe(id: VibeId) {
    const cur = wizard.vibes;
    setWizard({
      vibes: cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id],
    });
  }

  if (sniffing) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center">
        <FoxAvatar mood="sniffing" size="hero" caption="Sniffing the shelf…" />
        <p className="mt-2 text-sm text-muted-foreground">Hold on — Finn's almost there.</p>
      </div>
    );
  }

  const current = STEPS[step];

  return (
    <div className="flex min-h-[70dvh] flex-col pb-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep((s) => s - 1))}
          className="grid size-11 place-items-center rounded-button hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex flex-1 justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-8 bg-fox" : i < step ? "w-4 bg-fox/50" : "w-4 bg-border",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={skip}
          className="h-11 px-2 text-sm font-semibold text-sky"
        >
          Skip
        </button>
      </div>

      <h1 className="mt-2 font-display text-3xl">{current.title}</h1>
      <p className="mt-1 text-muted-foreground">{current.hint}</p>

      <div className="mt-8 flex-1">
        {step === 0 && (
          <PlayerPicker
            value={wizard.players}
            onChange={(players) => setWizard({ players })}
          />
        )}
        {step === 1 && (
          <AgeBands
            value={wizard.ageBand}
            onChange={(ageBand) => setWizard({ ageBand })}
          />
        )}
        {step === 2 && (
          <TimeChips
            value={wizard.maxTimeMin}
            over60={wizard.timeOver60}
            onChange={(maxTimeMin, timeOver60) => setWizard({ maxTimeMin, timeOver60 })}
          />
        )}
        {step === 3 && (
          <div className="space-y-4">
            <VibeGrid selected={wizard.vibes} onToggle={toggleVibe} />
            {advancedOn ? (
            <button
              type="button"
              className="text-sm font-semibold text-sky"
              onClick={() => {
                if (!isPremium) {
                  setUpgradePrompt(
                    "Advanced exact-score filters are part of GameFinder Premium.",
                  );
                  return;
                }
                setAdvanced((v) => !v);
              }}
            >
              Advanced filters
            </button>
            ) : null}
            {advanced && isPremium ? (
              <div className="space-y-3 rounded-card bg-card p-4 ring-1 ring-border">
                <p className="text-sm text-muted-foreground">
                  Target a score from 1–5. Exact matches rank first.
                </p>
                {(Object.keys(VIBE_META) as VibeId[]).map((id) => (
                  <label key={id} className="flex items-center gap-3 text-sm">
                    <span className="w-28 font-semibold">{VIBE_META[id].label}</span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.5}
                      value={wizard.exactTraits?.[id] ?? 3}
                      onChange={(e) =>
                        setWizard({
                          exactTraits: {
                            ...(wizard.exactTraits ?? {}),
                            [id]: Number(e.target.value),
                          },
                        })
                      }
                      className="flex-1 accent-fox"
                    />
                    <span className="w-8 tabular-nums">{wizard.exactTraits?.[id] ?? "—"}</span>
                  </label>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setWizard({ exactTraits: null })}
                >
                  Clear exact scores
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="sticky bottom-4 mt-8">
        <Button size="xl" className="w-full" onClick={() => (last ? finish() : setStep((s) => s + 1))}>
          {last ? "Sniff it out" : "Next"}
          <ArrowRight className="size-5" />
        </Button>
        <button
          type="button"
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-sky"
          onClick={surpriseFromAnswers}
        >
          <Dices className="size-4" />
          Surprise me with these answers
        </button>
      </div>
    </div>
  );
}
