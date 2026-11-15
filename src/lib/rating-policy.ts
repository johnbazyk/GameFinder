import {
  DIMENSIONS,
  VIBE_IDS,
  type AgeBand,
  type Dimension,
  type VibeId,
  type WizardContext,
} from "./types";
import { STANDARD_VERSION } from "./rating-anchors-03";
export { STANDARD_VERSION };
export type RatingKey = Dimension | Exclude<VibeId, "luck" | "strategy">;
export type RatingMode = "legacy" | "reviewed" | "beta";
export const APPLICATION_RATING_MODE: RatingMode =
  import.meta.env.VITE_GAMEFINDER_RATINGS_MODE === "beta"
    ? "beta"
    : import.meta.env.VITE_GAMEFINDER_RATINGS_MODE === "reviewed"
      ? "reviewed"
      : "legacy";
export const RATING_KEYS = [...new Set([...DIMENSIONS, ...VIBE_IDS])] as RatingKey[];
export function validRating(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 1 && v <= 5 && Number.isInteger(v * 2);
}
export type RatingTarget =
  | { kind: "atLeast"; value: number }
  | { kind: "exact"; value: number }
  | { kind: "range"; min: number; max: number };
export type Assessment = {
  value: number | null;
  status: "proposed" | "reviewed";
  evidenceBasis: "rules" | "observed-play" | "repeated-play";
  sources: { url: string; observation: string }[];
  rationale: string;
  neighboringAnchor: string;
  assessor: string;
  assessedAt: string;
  review?: { by: string; at: string };
  beta?: { eligible: boolean; reason: string; at: string; version: string };
  blockers: string[];
};
export type RatingRecord = {
  id: string;
  version: string;
  legacyId: string;
  expectedTitle: string;
  edition: string;
  mode: string;
  playerCounts: number[];
  ratings: Partial<Record<RatingKey, Assessment>>;
  family: Partial<
    Record<
      AgeBand,
      Assessment & {
        ageMin: number;
        ageMax: number;
        language: string;
        assistance: string;
        taskEvidence: [string, string, string, string, string];
      }
    >
  >;
};
export type RatingContext = {
  players: number | null;
  ageBand: AgeBand | null;
  edition: string;
  mode: string;
};
export type ResolvedRating = {
  value: number | null;
  label: "Provisional" | "Reviewed" | "Not assessed";
  blockers: string[];
  assessment?: Assessment;
};
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const date = (v: unknown) => text(v) && Number.isFinite(Date.parse(v));
const obj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
export function assessmentBlockers(a: unknown, mode: RatingMode): string[] {
  if (!obj(a)) return ["Missing assessment"];
  const b: string[] = [];
  if (!validRating(a.value)) b.push("Missing or invalid rating");
  if (
    !Array.isArray(a.sources) ||
    !a.sources.length ||
    a.sources.some(
      (s: unknown) => !obj(s) || !text(s.observation) || !text(s.url) || !/^https:\/\//.test(s.url),
    )
  )
    b.push("Missing source evidence");
  if (!text(a.rationale) || !text(a.neighboringAnchor) || !text(a.assessor) || !date(a.assessedAt))
    b.push("Incomplete assessment rationale");
  if (
    typeof a.evidenceBasis !== "string" ||
    !["rules", "observed-play", "repeated-play"].includes(a.evidenceBasis)
  )
    b.push("Unknown evidence basis");
  if (!Array.isArray(a.blockers) || a.blockers.length) b.push("Unresolved evidence or scope");
  if (a.status === "reviewed") {
    if (!obj(a.review) || !text(a.review.by) || !date(a.review.at)) b.push("Missing human review");
  } else if (a.status === "proposed" && mode === "beta") {
    if (
      !obj(a.beta) ||
      a.beta.eligible !== true ||
      a.beta.version !== STANDARD_VERSION ||
      !text(a.beta.reason) ||
      !date(a.beta.at)
    )
      b.push("Not eligible for provisional beta use");
  } else b.push("Assessment is not reviewed");
  return b;
}
const ages: Partial<Record<AgeBand, [number, number]>> = {
  "6-7": [6, 7],
  "8-10": [8, 10],
  "11-13": [11, 13],
  "14-17": [14, 17],
};
export function resolveRating(
  record: RatingRecord | undefined,
  key: RatingKey,
  context: RatingContext,
  mode: RatingMode,
): ResolvedRating {
  const missing = (blockers: string[]): ResolvedRating => ({
    value: null,
    label: "Not assessed",
    blockers,
  });
  if (!record || record.version !== STANDARD_VERSION)
    return missing(["Missing or stale assessment package"]);
  if (
    record.edition !== context.edition ||
    record.mode !== context.mode ||
    context.players === null ||
    !Array.isArray(record.playerCounts) ||
    !record.playerCounts.includes(context.players)
  )
    return missing(["Choose an assessed edition, mode and player count"]);
  let a = record.ratings?.[key];
  if (key === "family") {
    const range = context.ageBand ? ages[context.ageBand] : undefined;
    const family = context.ageBand ? record.family?.[context.ageBand] : undefined;
    if (
      !range ||
      !family ||
      family.ageMin > range[0] ||
      family.ageMax < range[1] ||
      !Number.isFinite(family.ageMin) ||
      !Number.isFinite(family.ageMax) ||
      !text(family.language) ||
      !text(family.assistance) ||
      !Array.isArray(family.taskEvidence) ||
      family.taskEvidence.length !== 5 ||
      !family.taskEvidence.every(text)
    )
      return missing(["Family needs a supported age context and participation evidence"]);
    a = family;
  }
  const blockers = assessmentBlockers(a, mode);
  if (blockers.length || !a) return missing(blockers);
  return {
    value: a.value,
    label: a.status === "proposed" ? "Provisional" : "Reviewed",
    blockers: [],
    assessment: a,
  };
}
export function validTarget(t: unknown): t is RatingTarget {
  if (!obj(t)) return false;
  return t.kind === "range"
    ? validRating(t.min) && validRating(t.max) && t.min <= t.max
    : (t.kind === "exact" || t.kind === "atLeast") && validRating(t.value);
}
export function matchesTarget(value: number, t: RatingTarget): boolean {
  if (!validRating(value) || !validTarget(t)) return false;
  return t.kind === "range"
    ? value >= t.min && value <= t.max
    : t.kind === "exact"
      ? value === t.value
      : value >= t.value;
}
export function selectedTargets(ctx: WizardContext): Partial<Record<VibeId, RatingTarget>> | null {
  const targets: Partial<Record<VibeId, RatingTarget>> = {};
  for (const v of ctx.vibes) {
    if (!VIBE_IDS.includes(v)) return null;
    targets[v] = { kind: "atLeast", value: 3 };
  }
  for (const [key, value] of Object.entries(ctx.exactTraits ?? {})) {
    if (!VIBE_IDS.includes(key as VibeId) || !validRating(value)) return null;
    targets[key as VibeId] = { kind: "exact", value };
  }
  for (const [key, value] of Object.entries(ctx.ratingTargets ?? {})) {
    if (!VIBE_IDS.includes(key as VibeId) || !validTarget(value)) return null;
    targets[key as VibeId] = value;
  }
  return targets;
}
export function matchesRatings(
  record: RatingRecord | undefined,
  ctx: WizardContext,
  scope: RatingContext,
  mode: RatingMode,
): boolean {
  const targets = selectedTargets(ctx);
  if (!targets) return false;
  return Object.entries(targets).every(([v, t]) => {
    const r = resolveRating(record, v as VibeId, scope, mode);
    return r.value !== null && matchesTarget(r.value, t!);
  });
}
export function seededOrder(id: string, seed: string): number {
  let h = 2166136261;
  for (const c of seed + "|" + id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
