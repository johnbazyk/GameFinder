import { VIBE_IDS } from "./types";

import {
  assertPublishedCatalogSnapshot,
  type PublishedCatalogSnapshot,
} from "./catalog-published-view";

import {
  evaluateRatingReadiness,
  ORIGINAL_DIMENSION_ANCHORS_LOCKED,
  RATING_STANDARD_VERSION,
  type CompleteRatingAssessment,
} from "./rating-standards";

export type CatalogRatingAuditRow = {
  gamefinderId: string;
  title: string;
  ready: boolean;
  blockers: string[];
};

export type CatalogRatingAudit = {
  standardVersion: string;
  totalGames: number;
  readyGames: number;
  blockedGames: number;
  publishable: boolean;
  globalBlockers: string[];
  rows: CatalogRatingAuditRow[];
};

/**
 * Independently audits the 13-rating assessment packages for a
 * published-catalog snapshot.
 *
 * Does not modify games, ratings, ownership, or identities.
 * Does not automatically approve anything.
 */
export function auditCatalogRatingCoverage(
  snapshot: PublishedCatalogSnapshot,
  assessments: readonly CompleteRatingAssessment[],
  now = new Date().toISOString(),
): CatalogRatingAudit {
  assertPublishedCatalogSnapshot(snapshot, now);

  const globalBlockers: string[] = [];

  if (!ORIGINAL_DIMENSION_ANCHORS_LOCKED) {
    globalBlockers.push("The original seven-dimension anchors are not yet approved.");
  }

  const sourceIds = new Set(snapshot.records.map((record) => record.gamefinderId));

  const assessmentGroups = new Map<string, CompleteRatingAssessment[]>();

  for (const assessment of assessments) {
    const id = assessment.gamefinderId;
    const existing = assessmentGroups.get(id) ?? [];
    existing.push(assessment);
    assessmentGroups.set(id, existing);

    if (!sourceIds.has(id)) {
      globalBlockers.push(`Assessment references a game absent from the snapshot: ${id}`);
    }
  }

  const rows: CatalogRatingAuditRow[] = snapshot.records.map((record) => {
    const blockers: string[] = [];
    const matching = assessmentGroups.get(record.gamefinderId) ?? [];

    if (matching.length === 0) {
      blockers.push("Missing 13-rating assessment package.");
    }

    if (matching.length > 1) {
      blockers.push("Duplicate assessment packages.");
    }

    if (matching.length === 1) {
      const assessment = matching[0];
      const readiness = evaluateRatingReadiness(assessment);

      blockers.push(...readiness.blockers);

      // A validated Vibe rating must be the same rating
      // that the recommendation engine will actually receive.
      for (const vibe of VIBE_IDS) {
        const approvedScore = assessment.vibes?.[vibe]?.score;
        const publishedScore = record.vibeScores[vibe];

        if (
          approvedScore !== null &&
          approvedScore !== undefined &&
          publishedScore !== approvedScore
        ) {
          blockers.push(`${vibe}: catalog rating differs from approved assessment.`);
        }
      }
    }

    return {
      gamefinderId: record.gamefinderId,
      title: record.displayMetadata.title,
      ready: blockers.length === 0,
      blockers: [...new Set(blockers)],
    };
  });

  const readyGames = rows.filter((row) => row.ready).length;
  const blockedGames = rows.length - readyGames;

  return {
    standardVersion: RATING_STANDARD_VERSION,
    totalGames: rows.length,
    readyGames,
    blockedGames,
    publishable: globalBlockers.length === 0 && blockedGames === 0 && rows.length > 0,
    globalBlockers,
    rows,
  };
}

/**
 * Fail-closed gate for future release workflows.
 *
 * The current synthetic preview and legacy app do not invoke
 * this gate. They remain intentionally separate.
 */
export function assertCatalogRatingsApproved(
  snapshot: PublishedCatalogSnapshot,
  assessments: readonly CompleteRatingAssessment[],
  now?: string,
): void {
  const audit = auditCatalogRatingCoverage(snapshot, assessments, now);

  if (!audit.publishable) {
    const reasons = [
      ...audit.globalBlockers,
      ...audit.rows.flatMap((row) => row.blockers.map((blocker) => `${row.title}: ${blocker}`)),
    ];

    throw new Error("Catalog scoring approval blocked: " + reasons.slice(0, 12).join(" | "));
  }
}

/**
 * Audit ratings embedded directly in catalog records.
 *
 * Existing test fixtures may omit rating packages, but the
 * audit must report those omissions as publication blockers.
 */
export function auditEmbeddedCatalogRatingCoverage(
  snapshot: PublishedCatalogSnapshot,
  now = new Date().toISOString(),
): CatalogRatingAudit {
  const assessments = snapshot.records.flatMap((record) =>
    record.ratingAssessment === undefined ? [] : [record.ratingAssessment],
  );

  return auditCatalogRatingCoverage(snapshot, assessments, now);
}

/**
 * Strict scored-catalog boundary.
 *
 * All 13 approved ratings must be embedded in every record.
 * A valid old-style fixture is not automatically an approved
 * scored catalog.
 */
export function assertScoredPublishedCatalogSnapshot(
  source: unknown,
  now = new Date().toISOString(),
): asserts source is import("./catalog-published-view").ScoredPublishedCatalogSnapshot {
  assertPublishedCatalogSnapshot(source, now);

  const audit = auditEmbeddedCatalogRatingCoverage(source, now);

  if (!audit.publishable) {
    const reasons = [
      ...audit.globalBlockers,
      ...audit.rows.flatMap((row) => row.blockers.map((reason) => `${row.title}: ${reason}`)),
    ];

    throw new Error("Scored catalog publication blocked: " + reasons.slice(0, 12).join(" | "));
  }
}
