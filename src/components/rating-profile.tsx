import { useId, useState } from "react";
import { DIMENSIONS, VIBE_IDS, type Game, type WizardContext, type AgeBand } from "@/lib/types";
import { VIBE_META } from "@/lib/vibes";
import { gameRating, ratingRecord } from "@/lib/application-ratings";
import { STANDARD_VERSION, type RatingKey } from "@/lib/rating-policy";
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
  const [ctx, setCtx] = useState(initialContext);
  const chartId = useId();
  const record = ratingRecord(game);
  const values = DIMENSIONS.map((k) => gameRating(game, k, ctx));
  const complete = values.every((r) => r.value !== null);
  const [played, setPlayed] = useState(false);
  const [fit, setFit] = useState("Partly");
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState("");
  const [youngest, setYoungest] = useState("");
  const [help, setHelp] = useState("");
  const [familiarity, setFamiliarity] = useState("");
  const [characteristic, setCharacteristic] = useState<RatingKey>("party");
  const point = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7;
    return `${200 + Math.cos(a) * v * 21},${164 + Math.sin(a) * v * 21}`;
  };
  function saveFeedback() {
    if (
      !played ||
      ctx.players === null ||
      !Number.isInteger(ctx.players) ||
      ctx.players < 1 ||
      ctx.players > 13 ||
      (characteristic === "family" &&
        (!youngest ||
          !Number.isInteger(Number(youngest)) ||
          Number(youngest) < 1 ||
          Number(youngest) > 120 ||
          !help ||
          !familiarity))
    ) {
      setSaved("Confirm that you played, player count, and Family details when applicable.");
      return;
    }
    const payload = {
      at: new Date().toISOString(),
      standardVersion: STANDARD_VERSION,
      gameId: game.bggId,
      edition: record?.edition,
      mode: record?.mode,
      context: ctx,
      played,
      fit,
      characteristic,
      reason,
      youngestAge: youngest ? Number(youngest) : null,
      assistance: help || null,
      familiarity: familiarity || null,
      scores: Object.fromEntries(
        [...DIMENSIONS, ...VIBE_IDS].map((k) => [k, gameRating(game, k, ctx)]),
      ),
    };
    try {
      const parsed = JSON.parse(localStorage.getItem("gamefinder-rating-feedback-03") ?? "[]");
      const entries = Array.isArray(parsed) ? parsed : [];
      localStorage.setItem(
        "gamefinder-rating-feedback-03",
        JSON.stringify([...entries.slice(-199), payload]),
      );
      setSaved(
        "Saved on this device. Export to share with the beta team. Ratings have not changed.",
      );
    } catch {
      setSaved("Could not save feedback on this device.");
    }
  }
  function exportFeedback() {
    try {
      const blob = new Blob([localStorage.getItem("gamefinder-rating-feedback-03") ?? "[]"], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gamefinder-beta-feedback.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSaved("Could not export feedback.");
    }
  }
  return (
    <section className="mt-8 space-y-4 rounded-card bg-card p-4 shadow-card">
      <h2 className="font-display text-xl">How it plays</h2>
      <p className="text-sm text-muted-foreground">
        A quick picture of the game’s character—not an overall quality score.
      </p>
      {values.some((r) => r.label === "Provisional") && (
        <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold">
          Provisional profile
        </span>
      )}
      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer">Edition and player context</summary>
        <div className="mt-3 space-y-3">
          <p className="text-sm">
            {record
              ? `Assessed edition: ${record.edition}; ${record.mode}. Confirm this matches your game. Proposed ratings are rules-based, not observed play.`
              : "This game has not been assessed under the new standard. Your collection is unchanged."}
          </p>
          <label className="block">
            Players{" "}
            <input
              aria-label="Rating player count"
              className="w-16"
              type="number"
              min="1"
              max="13"
              value={ctx.players ?? ""}
              onChange={(e) =>
                setCtx({ ...ctx, players: e.target.value ? e.target.valueAsNumber : null })
              }
            />
          </label>
          <label className="block">
            Family age context{" "}
            <select
              value={ctx.ageBand ?? ""}
              onChange={(e) => setCtx({ ...ctx, ageBand: (e.target.value as AgeBand) || null })}
            >
              <option value="">Choose context</option>
              {["under6", "6-7", "8-10", "11-13", "14-17", "adults"].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs">
            Changing this profile context does not change your saved search filters. High ratings
            describe more of a characteristic, not overall quality.
          </p>
        </div>
      </details>
      {complete ? (
        <svg
          role="img"
          aria-labelledby={`${chartId}-title ${chartId}-description`}
          viewBox="0 0 400 340"
          className="mx-auto w-full max-w-lg"
        >
          <title id={`${chartId}-title`}>Game character · scale 1 to 5</title>
          <desc id={`${chartId}-description`}>
            {DIMENSIONS.map((k, i) => `${labels[k]}: ${values[i].value} out of 5`).join("; ")}.
            Higher means more of a characteristic, not a better game.
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
                <title>
                  {labels[DIMENSIONS[i]]}: {v.value} / 5
                </title>
              </circle>
            );
          })}
          {[1, 3, 5].map((n) => (
            <text key={n} x="206" y={164 - n * 21 - 4} fontSize="10" fill="var(--color-ink-muted)">
              {n}
            </text>
          ))}
          {DIMENSIONS.map((k, i) => {
            const [x, y] = point(i, 6.25).split(",");
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
                textAnchor="middle"
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
        <p className="rounded-xl bg-muted p-4 text-sm">
          Profile not yet available for this player context. Unassessed characteristics are never
          shown as zero.
        </p>
      )}
      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer">About this profile</summary>
        <p className="mt-3">
          Standard {STANDARD_VERSION}. Provisional profiles are based on rules and await play
          feedback. Replayability describes renewed gameplay challenges, not guaranteed enjoyment.
        </p>
        {record &&
          [...DIMENSIONS, "dexterity", "family", "party", "board"].map((k) => {
            const r = gameRating(game, k as RatingKey, ctx);
            if (!r.assessment) return null;
            return (
              <details key={k} className="mt-3">
                <summary className="cursor-pointer">
                  {labels[k] ?? VIBE_META[k as keyof typeof VIBE_META]?.label}
                </summary>
                <p className="mt-2">{r.assessment.rationale}</p>
                {r.assessment.sources.map((source) => (
                  <a
                    key={source.url}
                    className="block underline"
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Rules source
                  </a>
                ))}
              </details>
            );
          })}
      </details>
      <details>
        <summary>After playing: did this match the vibe?</summary>
        <div className="mt-3 space-y-3">
          <label className="block">
            <input type="checkbox" checked={played} onChange={(e) => setPlayed(e.target.checked)} />{" "}
            We played this edition and mode
          </label>
          <label className="block">
            Fit{" "}
            <select value={fit} onChange={(e) => setFit(e.target.value)}>
              {["Yes", "Partly", "No"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block">
            Characteristic{" "}
            <select
              value={characteristic}
              onChange={(e) => setCharacteristic(e.target.value as RatingKey)}
            >
              {[...DIMENSIONS, "dexterity", "family", "party", "board"].map((k) => (
                <option key={k} value={k}>
                  {labels[k] ?? VIBE_META[k as keyof typeof VIBE_META]?.label}
                </option>
              ))}
            </select>
          </label>
          {characteristic === "family" && (
            <>
              <label className="block">
                Youngest age{" "}
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={youngest}
                  onChange={(e) => setYoungest(e.target.value)}
                />
              </label>
              <label className="block">
                Help{" "}
                <select value={help} onChange={(e) => setHelp(e.target.value)}>
                  <option value="">Choose</option>
                  {["None", "Occasional", "Frequent", "Adult made decisions"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                Familiarity{" "}
                <select value={familiarity} onChange={(e) => setFamiliarity(e.target.value)}>
                  <option value="">Choose</option>
                  {["First play", "Played before"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="block">
            Optional explanation{" "}
            <textarea maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <button type="button" onClick={saveFeedback}>
            Save feedback on this device
          </button>
          <button type="button" className="ml-3" onClick={exportFeedback}>
            Export feedback
          </button>
          <p role="status">{saved}</p>
          <p className="text-xs">
            Feedback stays in this browser until you export and share it. It never changes canonical
            ratings automatically.
          </p>
        </div>
      </details>
    </section>
  );
}
