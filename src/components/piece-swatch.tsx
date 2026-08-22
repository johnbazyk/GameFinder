import { PIECE_COLORS } from "@/lib/piece-color";
import { cn } from "@/lib/utils";

export function PieceSwatch({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        Your color
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {PIECE_COLORS.map((c) => {
          const on = value === c.hex;
          return (
            <li key={c.id}>
              <button
                type="button"
                aria-label={c.label}
                aria-pressed={on}
                onClick={() => onChange(c.hex)}
                className={cn(
                  "grid size-11 place-items-center rounded-full transition-transform duration-150 ease-out active:scale-[0.96]",
                  on ? "ring-2 ring-fox ring-offset-2 ring-offset-background" : "ring-1 ring-border",
                )}
              >
                <span className="size-8 rounded-full" style={{ background: c.hex }} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
