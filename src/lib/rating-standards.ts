import { DIMENSIONS, VIBE_IDS, type Dimension, type VibeId } from "./types";

/**
 * 05E7 scoring-standard draft.
 *
 * These are ordinal, anchored ratings, not mathematical ratios.
 * The original seven-dimensional anchor texts must be recovered
 * and approved before this draft becomes a publishing standard.
 *
 * Do not migrate or relabel existing legacy scores automatically.
 */
export const RATING_LEVELS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export type RatingLevel = (typeof RATING_LEVELS)[number];

export const RATING_STANDARD_VERSION = "05E7-draft-1" as const;

export function isRatingLevel(value: unknown): value is RatingLevel {
  return typeof value === "number" && RATING_LEVELS.some((level) => level === value);
}

/**
 * Conceptual descriptions only.
 * These do NOT replace the original 63 operational anchors.
 */
export const DIMENSION_CONCEPTS: Record<Dimension, string> = {
  luck: "Influence of uncontrollable chance on decisions, events, and outcomes.",
  strategy: "Importance of deliberate planning, anticipation, adaptation, and tactical decisions.",
  skill: "Importance of learnable individual performance and execution to success.",
  social:
    "Extent of meaningful communication, negotiation, cooperation, or interpersonal interaction.",
  complexity: "Cognitive and procedural demands of understanding and applying the rules.",
  replayability: "Degree of meaningful variation and continued engagement across repeated plays.",
  resourceMgmt:
    "Importance of allocating, conserving, exchanging, or optimizing limited resources.",
};

export type VibeDefinition = {
  description: string;
  assessmentFocus: string;
  anchors: Record<RatingLevel, string>;
};

/**
 * Proposed operational anchors for the six Find-a-Game Vibes.
 *
 * Each rating describes observable gameplay characteristics.
 * These remain drafts until reviewed and calibrated.
 */
export const VIBE_RUBRIC: Record<VibeId, VibeDefinition> = {
  luck: {
    description:
      "How strongly unpredictable chance and randomness characterize the playing experience.",
    assessmentFocus:
      "Assess the prominence and consequences of chance, not merely whether dice or cards exist.",
    anchors: {
      1: "No meaningful random events influence play after any initial setup.",
      1.5: "Rare random events occur but have negligible impact on meaningful decisions.",
      2: "Chance occasionally influences secondary opportunities, while player decisions dominate.",
      2.5: "Chance regularly changes available options, but players can usually control the consequences.",
      3: "Chance affects meaningful decisions during typical sessions and creates noticeable uncertainty.",
      3.5: "Chance frequently changes tactical opportunities and requires substantial adaptation.",
      4: "Chance strongly shapes game states and can substantially alter the consequences of planning.",
      4.5: "Random outcomes dominate much of the game's tension and frequently determine advantage.",
      5: "Chance is the defining gameplay experience and largely determines outcomes despite player choices.",
    },
  },

  strategy: {
    description:
      "How strongly the experience emphasizes meaningful planning, tactical decisions, and anticipation.",
    assessmentFocus:
      "Assess recurring consequential decisions, planning horizons, and the effect of decision quality.",
    anchors: {
      1: "Gameplay offers no meaningful strategic decisions or planning.",
      1.5: "Only rare or nearly automatic decisions require anticipation.",
      2: "Occasional choices involve simple tradeoffs with limited consequences.",
      2.5: "Recurring decisions involve short-term tradeoffs, but sustained planning has limited value.",
      3: "Meaningful planning and tactical choices affect progress throughout a typical game.",
      3.5: "Players repeatedly anticipate consequences, adapt plans, and manage interacting decisions.",
      4: "Longer-term planning and tactical adaptation are major determinants of success.",
      4.5: "Most phases require connected decisions, competing strategies, and responses to opponents.",
      5: "Deep, sustained, consequential planning defines gameplay, with multiple viable strategic paths.",
    },
  },

  dexterity: {
    description:
      "How strongly physical coordination, precision, reflexes, and motor execution define gameplay.",
    assessmentFocus:
      "Assess required motor performance and its impact on outcomes, not ordinary handling of pieces.",
    anchors: {
      1: "Physical manipulation is administrative; coordination and reflexes have no gameplay role.",
      1.5: "Minor physical execution occurs but does not meaningfully affect success.",
      2: "An occasional physical or timed task influences limited portions of play.",
      2.5: "Physical execution recurs, but errors are generally minor or easily corrected.",
      3: "Coordination, timing, or precision regularly influences performance and success.",
      3.5: "Sustained motor control and reflexes are important during many gameplay phases.",
      4: "Physical execution is a major determinant of outcomes and distinguishes experienced players.",
      4.5: "Demanding physical skill is required through most of the playing experience.",
      5: "High-level physical execution defines the game and is the primary determinant of success.",
    },
  },

  family: {
    description:
      "How well the experience supports meaningful participation across different ages and experience levels.",
    assessmentFocus:
      "Assess shared agency, accessibility, and engagement in mixed-experience groups. Do not equate Family with low Complexity or publisher age alone.",
    anchors: {
      1: "Mixed-age or mixed-experience participants cannot typically participate meaningfully together.",
      1.5: "Meaningful mixed-group participation requires extensive rule changes or constant assistance.",
      2: "Mixed groups can participate, but less-experienced players have severely limited agency.",
      2.5: "Mixed groups can play together with recurring guidance or notable participation imbalance.",
      3: "Mixed-experience groups can participate meaningfully with manageable assistance.",
      3.5: "The game supports sustained participation and consequential decisions across experience levels.",
      4: "Accessibility and meaningful engagement are consistently strong across mixed groups.",
      4.5: "Game mechanisms actively support balanced participation without eliminating meaningful choices.",
      5: "Inclusive, consequential participation across diverse ages and experience levels is a defining strength.",
    },
  },

  party: {
    description:
      "How strongly the experience encourages lively group engagement, shared entertainment, and social energy.",
    assessmentFocus:
      "Assess group energy, shared attention, humor, and participation. Distinguish this from the general Social Interaction dimension.",
    anchors: {
      1: "Gameplay is primarily private or solitary and creates almost no shared social energy.",
      1.5: "Social moments are rare, incidental, and unrelated to the main experience.",
      2: "Occasional shared reactions occur, but most play remains individually focused.",
      2.5: "Recurring group moments occur, although lively interaction remains secondary.",
      3: "Group engagement and shared entertainment regularly contribute to the experience.",
      3.5: "Frequent collective reactions, conversation, or performances shape the session's atmosphere.",
      4: "Lively shared activity is central during much of the game.",
      4.5: "The game consistently generates strong collective energy, participation, and memorable group moments.",
      5: "Shared social energy and collective entertainment fundamentally define the entire experience.",
    },
  },

  board: {
    description:
      "How essential a board, map, grid, route, spatial layout, or tile structure is to the game's primary mechanics.",
    assessmentFocus:
      "Assess functional spatial dependence rather than whether a physical board happens to be included.",
    anchors: {
      1: "No spatial board, map, grid, or layout contributes to meaningful gameplay.",
      1.5: "A spatial surface is decorative or used only for incidental bookkeeping.",
      2: "A spatial display supports play, but removing it would barely affect decisions.",
      2.5: "Spatial arrangement influences recurring secondary decisions or progress tracking.",
      3: "Board position, paths, or tile placement regularly affect meaningful gameplay choices.",
      3.5: "Spatial relationships are central to several important mechanics and decisions.",
      4: "Most meaningful decisions depend strongly on a board, map, grid, or spatial arrangement.",
      4.5: "Spatial structure organizes nearly all major actions and interactions.",
      5: "An evolving spatial structure is indispensable to the game's defining mechanics and decisions.",
    },
  },
};

export type RatingEvidence = {
  sourceKind:
    "publisher-material" | "official-rulebook" | "structured-playtest" | "documented-analysis";
  reference: string;
  observation: string;
};

export type RatingAssessment = {
  score: RatingLevel | null;
  status: "unassessed" | "proposed" | "approved";
  evidence: RatingEvidence[];
  reviewerId: string | null;
  reviewedAt: string | null;
  approverId: string | null;
  approvedAt: string | null;
};

export type CompleteRatingAssessment = {
  gamefinderId: string;
  rubricVersion: string;
  dimensions: Record<Dimension, RatingAssessment>;
  vibes: Record<VibeId, RatingAssessment>;
};

export type RatingReadiness = {
  validStructure: boolean;
  publishable: boolean;
  blockers: string[];
};

/**
 * The original 63 anchors have not yet been independently
 * recovered and approved. Never claim the full scoring
 * standard has been locked while this is false.
 */
export const ORIGINAL_DIMENSION_ANCHORS_LOCKED = false;

function checkAssessment(
  assessment: RatingAssessment | undefined,
  label: string,
  blockers: string[],
): void {
  if (!assessment) {
    blockers.push(`${label}: missing assessment`);
    return;
  }

  if (assessment.score !== null && !isRatingLevel(assessment.score)) {
    blockers.push(`${label}: invalid rating`);
  }

  if (assessment.status !== "approved") {
    blockers.push(`${label}: assessment not approved`);
    return;
  }

  if (assessment.score === null) {
    blockers.push(`${label}: no approved numerical rating`);
  }

  if (
    !assessment.evidence.length ||
    assessment.evidence.some((item) => !item.reference.trim() || !item.observation.trim())
  ) {
    blockers.push(`${label}: evidence missing or incomplete`);
  }

  if (!assessment.reviewerId || !assessment.reviewedAt) {
    blockers.push(`${label}: reviewer information missing`);
  }

  if (!assessment.approverId || !assessment.approvedAt) {
    blockers.push(`${label}: approval information missing`);
  }
}

export function evaluateRatingReadiness(record: CompleteRatingAssessment): RatingReadiness {
  const blockers: string[] = [];

  if (!record.gamefinderId.startsWith("gf:")) {
    blockers.push("Invalid GameFinder identity");
  }

  if (record.rubricVersion !== RATING_STANDARD_VERSION) {
    blockers.push("Scoring standard version mismatch");
  }

  for (const dimension of DIMENSIONS) {
    checkAssessment(record.dimensions[dimension], `dimension.${dimension}`, blockers);
  }

  for (const vibe of VIBE_IDS) {
    checkAssessment(record.vibes[vibe], `vibe.${vibe}`, blockers);
  }

  if (!ORIGINAL_DIMENSION_ANCHORS_LOCKED) {
    blockers.push("Original seven-dimension anchors are not yet locked");
  }

  return {
    validStructure: blockers.length === 0,
    publishable: false,
    blockers,
  };
}
