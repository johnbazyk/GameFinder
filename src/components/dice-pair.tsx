import type { CSSProperties } from "react";
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

function Stone({ value }: { value: number }) {
  const n = value >= 1 && value <= 6 ? value : 1;
  return (
    <div className="die-stone" aria-hidden>
      {PIPS[n].map(([c, r], i) => (
        <span key={i} className="die-pip" style={{ gridColumn: c, gridRow: r }} />
      ))}
    </div>
  );
}

export function CubeDie({
  value,
  throwing,
  lane = "a",
  ink,
}: {
  value: number;
  throwing: boolean;
  lane?: "a" | "b";
  ink?: string;
}) {
  return (
    <div
      className={cn("die-throw", throwing && (lane === "a" ? "is-throw-a" : "is-throw-b"))}
      style={ink ? ({ "--die-ink": ink } as CSSProperties) : undefined}
    >
      <span className="die-shadow" />
      <Stone value={value} />
    </div>
  );
}

export function DicePair({
  values,
  throwing,
  ink,
}: {
  values: [number, number];
  throwing: boolean;
  ink?: string;
}) {
  return (
    <div className="dice-run">
      <CubeDie value={values[0]} throwing={throwing} lane="a" ink={ink} />
      <CubeDie value={values[1]} throwing={throwing} lane="b" ink={ink} />
    </div>
  );
}

export function Die({
  value,
  spinning,
  ink,
}: {
  value: number;
  spinning: boolean;
  size?: "md" | "lg";
  ink?: string;
}) {
  return <CubeDie value={value} throwing={spinning} lane="a" ink={ink} />;
}
