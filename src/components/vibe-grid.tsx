import { Brain, Dices, Hand, Home, LayoutGrid, PartyPopper } from "lucide-react";
import type { VibeId } from "@/lib/types";
import { VIBE_META } from "@/lib/vibes";
import { cn } from "@/lib/utils";

const ICONS = {
  dices: Dices,
  brain: Brain,
  hand: Hand,
  home: Home,
  party: PartyPopper,
  layout: LayoutGrid,
} as const;

export function VibeGrid({
  selected,
  onToggle,
}: {
  selected: VibeId[];
  onToggle: (id: VibeId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {(Object.keys(VIBE_META) as VibeId[]).map((id) => {
        const meta = VIBE_META[id];
        const Icon = ICONS[meta.icon];
        const on = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={cn(
              "flex min-h-[7.5rem] flex-col items-start gap-2 rounded-card border p-4 text-left transition-transform duration-150 ease-out active:scale-[0.96]",
              on
                ? "border-fox bg-fox/10 shadow-card ring-2 ring-fox"
                : "border-border bg-card hover:border-fox/40",
            )}
          >
            <Icon className={cn("size-6", on ? "text-fox" : "text-muted-foreground")} />
            <span className="font-display text-lg leading-none">{meta.label}</span>
            <span className="text-xs text-muted-foreground">{meta.tagline}</span>
          </button>
        );
      })}
    </div>
  );
}
