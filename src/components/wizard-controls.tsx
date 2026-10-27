import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_PLAYER_COUNT, type AgeBand } from "@/lib/types";
import { AGE_BANDS } from "@/lib/vibes";
import { TIME_OPTIONS } from "@/lib/wizard-options";

export { WIZARD_QUESTIONS } from "@/lib/wizard-options";

export function PlayerPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number) => void;
}) {
  const n = value ?? 4;
  const label = n >= MAX_PLAYER_COUNT ? "13+" : String(n);
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="grid size-14 place-items-center rounded-button bg-card ring-1 ring-border"
          onClick={() => onChange(Math.max(1, n - 1))}
          aria-label="Fewer players"
        >
          <Minus className="size-5" />
        </button>
        <div className="min-w-24 text-center">
          <div className="font-display text-6xl tabular-nums leading-none">{label}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {n === 1 ? "player" : "players"}
          </div>
        </div>
        <button
          type="button"
          className="grid size-14 place-items-center rounded-button bg-card ring-1 ring-border"
          onClick={() => onChange(Math.min(MAX_PLAYER_COUNT, n + 1))}
          aria-label="More players"
        >
          <Plus className="size-5" />
        </button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        1 to 13+. Past 13, most party games just scale.
      </p>
    </div>
  );
}

export function AgeBands({
  value,
  onChange,
}: {
  value: AgeBand | null;
  onChange: (band: AgeBand) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {AGE_BANDS.map((b) => {
        const on = value === b.id;
        return (
          <button
            key={b.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(b.id)}
            className={cn(
              "min-h-16 rounded-card px-4 py-3 text-left font-display text-xl transition-transform duration-150 active:scale-[0.96]",
              on ? "bg-fox text-cream shadow-card" : "bg-card text-foreground ring-1 ring-border",
            )}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

export function TimeChips({
  value,
  over60,
  onChange,
}: {
  value: number | null;
  over60: boolean;
  onChange: (n: number | null, over60: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {TIME_OPTIONS.map((option) => {
        const on = option.over60 ? over60 : !over60 && value === option.value;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.value, option.over60)}
            className={cn(
              "min-h-14 rounded-card px-4 py-3 text-left text-sm font-semibold transition-transform duration-150 active:scale-[0.96]",
              on ? "bg-fox text-cream shadow-card" : "bg-card text-foreground ring-1 ring-border",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
