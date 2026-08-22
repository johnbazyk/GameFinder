import { cn } from "@/lib/utils";

const PIPS: Record<number, [number, number][]> = {
  1: [[2, 2]],
  2: [
    [1, 1],
    [3, 3],
  ],
  3: [
    [1, 1],
    [2, 2],
    [3, 3],
  ],
  4: [
    [1, 1],
    [1, 3],
    [3, 1],
    [3, 3],
  ],
  5: [
    [1, 1],
    [1, 3],
    [2, 2],
    [3, 1],
    [3, 3],
  ],
  6: [
    [1, 1],
    [1, 2],
    [1, 3],
    [3, 1],
    [3, 2],
    [3, 3],
  ],
};

export function Die({
  value,
  spinning,
  size = "md",
}: {
  value: number;
  spinning: boolean;
  size?: "md" | "lg";
}) {
  const n = value >= 1 && value <= 6 ? value : 1;
  return (
    <div
      className={cn("die-ivory", size === "lg" && "die-ivory-lg", spinning && "die-2d-spin")}
      aria-hidden
    >
      {PIPS[n].map(([c, r], i) => (
        <span key={i} className="die-pip" style={{ gridColumn: c, gridRow: r }} />
      ))}
    </div>
  );
}
