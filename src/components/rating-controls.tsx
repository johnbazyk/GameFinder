import type { VibeId, WizardContext } from "@/lib/types";
import { VIBE_IDS } from "@/lib/types";
import { VIBE_META } from "@/lib/vibes";
import { APPLICATION_RATING_MODE, type RatingTarget } from "@/lib/rating-policy";
export function RatingNotice() {
  return APPLICATION_RATING_MODE === "legacy" ? null : (
    <p className="my-3 rounded-card bg-muted p-3 text-sm">
      {APPLICATION_RATING_MODE === "beta"
        ? "Beta: ratings are provisional rules-based assessments, not playtest results."
        : "Only human-reviewed ratings qualify."}{" "}

    </p>
  );
}
export function RatingTargets({
  context,
  onChange,
}: {
  context: WizardContext;
  onChange: (patch: Partial<WizardContext>) => void;
}) {
  function update(id: VibeId, t: RatingTarget | undefined) {
    const targets = { ...context.ratingTargets };
    const exact = { ...context.exactTraits };
    delete exact[id];
    if (t) targets[id] = t;
    else delete targets[id];
    onChange({ ratingTargets: targets, exactTraits: exact });
  }
  return (
    <fieldset className="space-y-3 rounded-card bg-card p-4">
      <legend>Advanced vibe filters</legend>
      <p className="text-sm">
        Range endpoints are included. Exactly means equality, not nearest match. Values are
        provisional categories.
      </p>
      {VIBE_IDS.map((id) => {
        const t =
          context.ratingTargets?.[id] ??
          (context.exactTraits?.[id] !== undefined
            ? { kind: "exact" as const, value: context.exactTraits[id]! }
            : undefined);
        return (
          <div key={id} className="flex flex-wrap items-center gap-2">
            <label>
              <input
                type="checkbox"
                checked={!!t}
                onChange={(e) =>
                  update(id, e.target.checked ? { kind: "range", min: 1, max: 5 } : undefined)
                }
              />{" "}
              {VIBE_META[id].label}
            </label>
            {t && (
              <>
                <select
                  aria-label={`${VIBE_META[id].label} comparison`}
                  value={t.kind}
                  onChange={(e) =>
                    update(
                      id,
                      e.target.value === "range"
                        ? { kind: "range", min: 1, max: 5 }
                        : { kind: e.target.value as "exact" | "atLeast", value: 3 },
                    )
                  }
                >
                  <option value="range">Range</option>
                  <option value="atLeast">At least</option>
                  <option value="exact">Exactly</option>
                </select>
                {t.kind === "range" ? (
                  <>
                    <input
                      aria-label={`${VIBE_META[id].label} minimum`}
                      className="w-16"
                      type="number"
                      min="1"
                      max="5"
                      step="0.5"
                      value={t.min}
                      onChange={(e) => update(id, { ...t, min: e.target.valueAsNumber })}
                    />
                    <span>to</span>
                    <input
                      aria-label={`${VIBE_META[id].label} maximum`}
                      className="w-16"
                      type="number"
                      min="1"
                      max="5"
                      step="0.5"
                      value={t.max}
                      onChange={(e) => update(id, { ...t, max: e.target.valueAsNumber })}
                    />
                  </>
                ) : (
                  <input
                    aria-label={`${VIBE_META[id].label} score`}
                    className="w-16"
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={t.value}
                    onChange={(e) => update(id, { ...t, value: e.target.valueAsNumber })}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
      <button type="button" onClick={() => onChange({ ratingTargets: {}, exactTraits: null })}>
        Clear advanced filters
      </button>
    </fieldset>
  );
}
