import { useId } from "react";
import { DIMENSIONS, type Game, type WizardContext } from "@/lib/types";
import { APPLICATION_RATING_MODE } from "@/lib/rating-policy";
import { gameRating, ratingRecord } from "@/lib/application-ratings";
const labels: Record<string, string> = {
  luck: "Luck",
  strategy: "Strategy",
  skill: "Skill",
  social: "Social interaction",
  complexity: "Complexity",
  replayability: "Replayability",
  resourceMgmt: "Resource management",
};
export function RatingProfile({
  game,
  initialContext,
}: {
  game: Game;
  initialContext: WizardContext;
}) {
  // Display one canonical profile even when an older search context is restored.
  const ctx: WizardContext = {
    ...initialContext,
    ratingMode:
      APPLICATION_RATING_MODE === "reviewed" || initialContext.ratingMode === "reviewed"
        ? "reviewed"
        : "beta",
  };
  const chartId = useId();
  const record = ratingRecord(game);
  const values = DIMENSIONS.map((k) => gameRating(game, k, ctx));
  const complete = values.every((r) => r.value !== null);
  const point = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7;
    return `${200 + Math.cos(a) * v * 21},${164 + Math.sin(a) * v * 21}`;
  };
  return (
    <section className="mt-8 space-y-4 rounded-card bg-card p-4 shadow-card">
      <h2 className="font-display text-xl">How it plays</h2>
      {values.some((r) => r.label === "Provisional") && (
        <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold">
          Provisional profile
        </span>
      )}
      {complete ? (
        <svg
          role="img"
          aria-labelledby={`${chartId}-title ${chartId}-description`}
          viewBox="0 0 400 320"
          className="mx-auto w-full max-w-md"
        >
          <title id={`${chartId}-title`}>Game character · scale 1 to 5</title>
          <desc id={`${chartId}-description`}>
            {DIMENSIONS.map((k, i) => `${labels[k]}: ${values[i].value} out of 5`).join("; ")}.
            Higher means more of a characteristic, not a better game.
            {record
              ? ` Assessed for ${record.edition}, ${record.mode}, ${ctx.players} players.`
              : ""}
          </desc>
          {[1, 2, 3, 4, 5].map((n) => (
            <polygon
              key={n}
              points={DIMENSIONS.map((_, i) => point(i, n)).join(" ")}
              fill={n === 1 ? "var(--color-cream)" : "none"}
              stroke="var(--color-night)"
              strokeOpacity={n === 5 ? 0.2 : 0.09}
              strokeWidth="1"
            />
          ))}
          {DIMENSIONS.map((k, i) => {
            const [x, y] = point(i, 5).split(",");
            return (
              <line
                key={k}
                x1="200"
                y1="164"
                x2={x}
                y2={y}
                stroke="var(--color-night)"
                strokeOpacity=".08"
              />
            );
          })}
          <polygon
            points={values.map((v, i) => point(i, v.value!)).join(" ")}
            fill="var(--color-fox)"
            fillOpacity=".18"
            stroke="var(--color-fox)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {values.map((v, i) => {
            const [x, y] = point(i, v.value!).split(",");
            return (
              <circle
                key={DIMENSIONS[i]}
                cx={x}
                cy={y}
                r="3.5"
                fill="var(--color-fox)"
                stroke="var(--color-card)"
                strokeWidth="1.5"
              >
                <title>{`${labels[DIMENSIONS[i]]}: ${v.value} / 5`}</title>
              </circle>
            );
          })}
          {[1, 2, 3, 4, 5].map((n) => (
            <text
              key={n}
              data-scale-tick={n}
              x="194"
              y={164 - n * 21 + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--color-ink-muted)"
              stroke="var(--color-card)"
              strokeWidth="3"
              paintOrder="stroke"
              strokeLinejoin="round"
            >
              {n}
            </text>
          ))}
          {DIMENSIONS.map((k, i) => {
            const positions = [
              [200, 31, "middle"],
              [302, 77, "start"],
              [320, 193, "start"],
              [263, 292, "middle"],
              [137, 292, "middle"],
              [80, 193, "end"],
              [98, 77, "end"],
            ] as const;
            const [x, y, anchor] = positions[i];
            const words =
              k === "resourceMgmt"
                ? ["Resource", "management"]
                : k === "social"
                  ? ["Social", "interaction"]
                  : [labels[k]];
            return (
              <text
                key={k}
                x={x}
                y={y}
                textAnchor={anchor}
                fontSize="11"
                fontWeight="600"
                fill="var(--color-night)"
              >
                {words.map((word, j) => (
                  <tspan key={word} x={x} dy={j ? 13 : 0}>
                    {word}
                  </tspan>
                ))}
              </text>
            );
          })}
        </svg>
      ) : (
        <p className="rounded-xl bg-muted p-4 text-sm">Profile not yet available for this group.</p>
      )}
    </section>
  );
}
