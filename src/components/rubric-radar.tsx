import type { Rubric } from "@/lib/types";
import { DIMENSIONS } from "@/lib/types";

const LABELS: Record<string, string> = {
  luck: "Luck",
  strategy: "Strategy",
  skill: "Skill",
  social: "Social",
  complexity: "Weight",
  replayability: "Replay",
  resourceMgmt: "Engine",
};

export function RubricRadar({ rubric }: { rubric: Rubric }) {
  const cx = 110;
  const cy = 110;
  const r = 78;
  const n = DIMENSIONS.length;
  const pts = DIMENSIONS.map((d, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const mag = (rubric[d] / 100) * r;
    return [cx + Math.cos(angle) * mag, cy + Math.sin(angle) * mag] as const;
  });
  const axes = DIMENSIONS.map((_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  });
  const labelPos = DIMENSIONS.map((d, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return {
      d,
      x: cx + Math.cos(angle) * (r + 22),
      y: cy + Math.sin(angle) * (r + 22),
    };
  });

  return (
    <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[280px]">
      {[0.35, 0.65, 1].map((s) => (
        <polygon
          key={s}
          points={axes
            .map(([x, y]) => `${cx + (x - cx) * s},${cy + (y - cy) * s}`)
            .join(" ")}
          fill="none"
          className="stroke-border"
          strokeWidth="1"
        />
      ))}
      {axes.map(([x, y], i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          className="stroke-border"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="#E8642B"
        fillOpacity="0.4"
        stroke="#E8642B"
        strokeWidth="2"
      />
      {labelPos.map(({ d, x, y }) => (
        <text
          key={d}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          fontSize="10"
          fontFamily="Nunito Sans, sans-serif"
        >
          {LABELS[d]}
        </text>
      ))}
    </svg>
  );
}
