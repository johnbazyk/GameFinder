import { RATING_ANCHORS, STANDARD_VERSION } from "../rating-anchors-design";
import type { Assessment, RatingKey, RatingRecord } from "../rating-policy";
import { DESIGN_ASSESSMENTS } from "./design-assessments";

export const DESIGN_KEYS = [
  "luck",
  "strategy",
  "skill",
  "social",
  "complexity",
  "replayability",
  "resourceMgmt",
  "dexterity",
  "family",
  "party",
  "board",
] as const satisfies readonly RatingKey[];
export type DesignAssessment = {
  legacyId: string;
  title: string;
  edition: string;
  players: number[];
  // Explicit authored judgments. Never calculated from legacy rubric or BGG ratings.
  values: readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  // First reason is the default when no tagged preference applies.
  matchReasons: NonNullable<RatingRecord["matchReasons"]>;
  source: string;
  evidence: string;
  familyEvidence: string;
};

export function buildDesignRecord(row: DesignAssessment): RatingRecord {
  const ratings: Partial<Record<RatingKey, Assessment>> = {};
  DESIGN_KEYS.forEach((key, index) => {
    const value = row.values[index];
    const anchors = RATING_ANCHORS[key].anchors as Record<string, string>;
    const observation = key === "family" ? row.familyEvidence : row.evidence;
    ratings[key] = {
      value,
      status: "proposed",
      evidenceBasis: "rules",
      sources: [{ url: row.source, observation }],
      rationale: `${row.title}: ${observation} Design inference for ${key}: ${anchors[String(value)]}`,
      neighboringAnchor: `Selected ${value}: ${anchors[String(value)]} Adjacent anchors for calibration: ${[
        value - 0.5,
        value + 0.5,
      ]
        .filter((v) => anchors[String(v)])
        .map((v) => `${v}: ${anchors[String(v)]}`)
        .join(" | ")}`,
      assessor: "OpenAI assistant — rules-based inference; no human review or playtest claimed",
      assessedAt: "2026-11-15",
      beta: {
        eligible: true,
        reason:
          "Design-based provisional baseline authorized for beta; source mechanics inform anchored judgments.",
        at: "2026-11-15",
        version: STANDARD_VERSION,
      },
      blockers: [],
    };
  });
  return {
    id: `design-baseline:${row.legacyId}:${row.title}`,
    version: STANDARD_VERSION,
    legacyId: row.legacyId,
    expectedTitle: row.title,
    edition: row.edition,
    mode: "Standard",
    playerCounts: row.players,
    matchReasons: row.matchReasons,
    scope: "design-baseline",
    ratings,
    family: {},
  };
}

export const DESIGN_CATALOG: readonly RatingRecord[] = DESIGN_ASSESSMENTS.map(buildDesignRecord);
