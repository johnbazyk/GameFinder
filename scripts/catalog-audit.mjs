import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const AUDIT_VIBES = ["luck", "strategy", "dexterity", "family", "party", "board"];
export const AUDIT_RUBRIC_DIMENSIONS = [
  "luck",
  "strategy",
  "skill",
  "social",
  "complexity",
  "replayability",
  "resourceMgmt",
];

const HARD_FILTER_FIELDS = [
  ["players", "Minimum/maximum players"],
  ["publisherMinimumAge", "Publisher minimum age"],
  ["maximumListedPlaytimeMinutes", "Maximum listed playtime"],
  ["adultContent", "Adult-content classification"],
];

const SEVERITY_RANK = { none: 0, info: 1, low: 2, medium: 3, high: 4, critical: 5 };
const EDITION_IN_TITLE = /\((?:\d+(?:st|nd|rd|th)|second|third|fourth)\)/i;

function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isNumberInRange(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function sourceVerification(sources, field) {
  const source = sources.find((item) => item.field === field);
  if (!source) return "missing source record";
  if (!["independent", "third-party-licensed"].includes(source.sourceClass)) {
    return `${source.sourceClass} is not qualifying external verification`;
  }
  if (source.verification !== "verified") return `legacy ${source.verification}`;
  if (!source.sourceUrl) return "verified status lacks source URL";
  return "verified";
}

function provenanceEntry(sources, sourceField, present, note = "") {
  if (!present) {
    return {
      sourceClass: "missing",
      verification: "missing",
      sourceUrl: null,
      lastVerified: null,
      note,
    };
  }
  const source = sources.find((item) => item.field === sourceField);
  return {
    sourceClass: source?.sourceClass ?? "legacy-unknown",
    verification: source?.verification ?? "unverified",
    sourceUrl: source?.sourceUrl ?? null,
    lastVerified: source?.lastVerified ?? null,
    note,
  };
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function escapeMarkdown(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function issue(severity, text) {
  return { severity, text };
}

export function auditCatalog(
  games,
  {
    visibleInternalIds = new Set(games.map((game) => game.internalId)),
    rulebookReferences = [],
    rulebookCanBeUsedByFinn = () => false,
  } = {},
) {
  const externalIds = new Map();
  const internalIds = new Map();
  const numericExternalIds = new Map();
  for (const game of games) {
    if (typeof game.bggId === "string" && game.bggId.trim()) {
      const entries = externalIds.get(game.bggId) ?? [];
      entries.push(game);
      externalIds.set(game.bggId, entries);
      if (/^\d+$/.test(game.bggId)) {
        const numericEntries = numericExternalIds.get(game.bggId) ?? [];
        numericEntries.push(game);
        numericExternalIds.set(game.bggId, numericEntries);
      }
    }
    if (typeof game.internalId === "string" && game.internalId.trim()) {
      const entries = internalIds.get(game.internalId) ?? [];
      entries.push(game);
      internalIds.set(game.internalId, entries);
    }
  }

  const potentialAliasCollisions = [];
  const potentialAliasCollisionsById = new Map();
  for (const game of games) {
    const bggId = typeof game.bggId === "string" ? game.bggId.trim() : "";
    const numericPrefix = bggId.match(/^(\d+)-/)?.[1];
    if (!numericPrefix) continue;
    for (const numericGame of numericExternalIds.get(numericPrefix) ?? []) {
      const collision = {
        numericBggId: numericPrefix,
        numericTitle: numericGame.name,
        aliasBggId: bggId,
        aliasTitle: game.name,
      };
      potentialAliasCollisions.push(collision);
      for (const id of [numericPrefix, bggId]) {
        const collisions = potentialAliasCollisionsById.get(id) ?? [];
        collisions.push(collision);
        potentialAliasCollisionsById.set(id, collisions);
      }
    }
  }

  const authoredIds = new Set(games.map((game) => game.bggId));
  const rows = games.map((game) => {
    const sources = game.catalogRecord?.sources ?? [];
    const issues = [];
    const structuralErrors = [];
    const identityErrors = [];
    const addStructuralError = (text) => {
      structuralErrors.push(text);
      issues.push(issue("high", text));
    };
    const addIdentityError = (text) => {
      identityErrors.push(text);
      addStructuralError(text);
    };
    const title = typeof game.name === "string" ? game.name.trim() : "";
    const bggId = typeof game.bggId === "string" ? game.bggId.trim() : "";
    const isVisible = visibleInternalIds.has(game.internalId);
    const isDuplicateExternalId = (externalIds.get(bggId)?.length ?? 0) > 1;
    const isDuplicateInternalId = (internalIds.get(game.internalId)?.length ?? 0) > 1;
    const aliasCollisionPairs = potentialAliasCollisionsById.get(bggId) ?? [];

    if (!title) addIdentityError("Missing or invalid title.");
    if (
      typeof game.internalId !== "string" ||
      !/^gf:legacy:[a-z0-9-]+:[^\s:]+$/.test(game.internalId)
    ) {
      addIdentityError("Missing or invalid internal GameFinder ID.");
    }
    if (!bggId) addIdentityError("Missing external BGG identifier.");
    if (isDuplicateInternalId) {
      issues.push(issue("critical", `Duplicate internal GameFinder ID: ${game.internalId}.`));
    }
    if (isDuplicateExternalId) {
      issues.push(issue("critical", `Duplicate BGG identifier: ${bggId}.`));
    }
    for (const collision of aliasCollisionPairs) {
      issues.push(
        issue(
          "medium",
          `Potential BGG identifier collision: "${collision.aliasBggId}" for ${collision.aliasTitle} shares numeric prefix "${collision.numericBggId}" with ${collision.numericTitle}; verify both identities.`,
        ),
      );
    }
    if (bggId && !/^\d+$/.test(bggId)) {
      issues.push(
        issue("medium", `BGG identifier "${bggId}" is not numeric; verify or classify as a local alias.`),
      );
    }

    const players = game.players;
    if (
      !players ||
      !isIntegerInRange(players.min, 1, 100) ||
      !isIntegerInRange(players.max, 1, 100) ||
      players.min > players.max ||
      !Array.isArray(players.best) ||
      players.best.some(
        (value) => !isIntegerInRange(value, players.min, players.max),
      )
    ) {
      addStructuralError("Invalid player range or best-player values.");
    }

    const playtime = game.playtime;
    if (
      !playtime ||
      !isNumberInRange(playtime.min, 1, 100_000) ||
      !isNumberInRange(playtime.max, 1, 100_000) ||
      !isNumberInRange(playtime.avg, 1, 100_000) ||
      playtime.min > playtime.max ||
      playtime.avg < playtime.min ||
      playtime.avg > playtime.max
    ) {
      issues.push(
        issue(
          "high",
          "Contradictory playtime: minimum, average, and maximum must be positive and average must lie within the listed range.",
        ),
      );
      structuralErrors.push("Invalid or contradictory playtime values.");
    }

    if (
      !game.age ||
      !isIntegerInRange(game.age.publisher, 0, 120) ||
      !isIntegerInRange(game.age.community, 0, 120)
    ) {
      addStructuralError("Invalid publisher or community age value.");
    } else if (game.age.publisher !== game.age.community) {
      issues.push(
        issue(
          "medium",
          `Publisher/community age differs (${game.age.publisher} vs ${game.age.community}); disagreement is not itself proof of error.`,
        ),
      );
    }

    const rubric = game.rubric;
    if (
      !rubric ||
      AUDIT_RUBRIC_DIMENSIONS.some((dimension) => !isNumberInRange(rubric[dimension], 0, 100))
    ) {
      addStructuralError("Missing or out-of-range rubric dimension (expected each 0-100).");
    }
    if (!isNumberInRange(game.bggRating, 0, 10)) {
      addStructuralError("Missing or out-of-range BGG rating (expected 0-10).");
    }
    if (game.adultContent != null && typeof game.adultContent !== "boolean") {
      addStructuralError("Adult-content flag is not boolean.");
    }

    const yearIsMissing = game.yearPublished == null || game.yearPublished === 0;
    const yearIsValid = yearIsMissing || isIntegerInRange(game.yearPublished, 1000, 2200);
    if (!yearIsValid) addIdentityError("Structurally invalid publication year.");
    if (yearIsMissing) {
      issues.push(issue("medium", "Publication year is unknown in the existing source record."));
    }
    if (!game.publisher) {
      issues.push(issue("medium", "Publisher is not represented in the existing source record."));
    }
    if (!game.edition) {
      issues.push(
        issue(
          "medium",
          `Structured edition is missing${EDITION_IN_TITLE.test(title) ? " although the title suggests an edition label" : ""}.`,
        ),
      );
    }

    const adultContentEffective =
      typeof game.adultContent === "boolean" ? game.adultContent : game.adultContentDerived;
    if (typeof game.adultContent !== "boolean") {
      issues.push(
        issue(
          "medium",
          "Adult-content status is not explicitly recorded; the current app derives/defaults a value without per-game evidence.",
        ),
      );
    }

    const rulebook = rulebookReferences.find(
      (reference) =>
        reference.catalogGameId === game.internalId ||
        (!isDuplicateExternalId && reference.bggId === bggId),
    );
    const rulebookAuthorized = Boolean(rulebook && rulebookCanBeUsedByFinn(rulebook));
    const rulebookTeachingReady = Boolean(
      rulebookAuthorized &&
        rulebook?.officialSourceUrl &&
        rulebook.edition &&
        rulebook.version &&
        rulebook.retrievalCapabilityVerified === true,
    );
    if (!rulebook) {
      issues.push(issue("medium", "No authoritative rulebook reference is recorded."));
    } else if (!rulebookAuthorized) {
      issues.push(
        issue(
          "high",
          "Rulebook permission for storage, parsing, and AI retrieval is not established.",
        ),
      );
    }

    const expansionIssues = [];
    for (const expansion of game.expansions ?? []) {
      if (!authoredIds.has(expansion.bggId)) {
        const text = `Unresolved expansion reference: ${expansion.name} (${expansion.bggId}).`;
        expansionIssues.push(text);
        issues.push(issue("medium", text));
      }
    }

    const fieldVerification = Object.fromEntries(
      HARD_FILTER_FIELDS.map(([field]) => [
        field,
        sourceVerification(sources, field),
      ]),
    );
    fieldVerification.playersMinimum = sourceVerification(sources, "players");
    fieldVerification.playersMaximum = sourceVerification(sources, "players");
    const allHardFilterFieldsVerified =
      Object.values(fieldVerification).length > 0 &&
      Object.values(fieldVerification).every((status) => status === "verified");
    const allVibesPresent =
      game.computedVibeScores &&
      AUDIT_VIBES.every((vibe) => isNumberInRange(game.computedVibeScores[vibe], 0, 5));
    const fieldProvenance = {
      title: provenanceEntry(sources, "title", Boolean(title)),
      bggId: provenanceEntry(sources, "externalIds.bgg", Boolean(bggId)),
      publisher: provenanceEntry(sources, "publisher", Boolean(game.publisher)),
      publicationYear: provenanceEntry(
        sources,
        "yearPublished",
        !yearIsMissing && yearIsValid,
      ),
      edition: provenanceEntry(sources, "edition", Boolean(game.edition)),
      "players.minimum": provenanceEntry(
        sources,
        "players",
        isIntegerInRange(players?.min, 1, 100),
      ),
      "players.maximum": provenanceEntry(
        sources,
        "players",
        isIntegerInRange(players?.max, 1, 100),
      ),
      "age.publisher": provenanceEntry(
        sources,
        "publisherMinimumAge",
        isIntegerInRange(game.age?.publisher, 0, 120),
      ),
      "age.community": provenanceEntry(
        sources,
        "communityAge",
        isIntegerInRange(game.age?.community, 0, 120),
      ),
      "playtime.maximum": provenanceEntry(
        sources,
        "maximumListedPlaytimeMinutes",
        isNumberInRange(playtime?.max, 1, 100_000),
      ),
      "playtime.minimum": provenanceEntry(
        sources,
        "minimumListedPlaytimeMinutes",
        isNumberInRange(playtime?.min, 1, 100_000),
      ),
      "playtime.average": provenanceEntry(
        sources,
        "averagePlaytimeMinutes",
        isNumberInRange(playtime?.avg, 1, 100_000),
      ),
      adultContent: provenanceEntry(
        sources,
        "adultContent",
        typeof game.adultContent === "boolean",
        typeof game.adultContent === "boolean"
          ? ""
          : "Current app derives/defaults a value without per-game evidence.",
      ),
      bggRating: provenanceEntry(sources, "bggRating", isNumberInRange(game.bggRating, 0, 10)),
      mechanics: provenanceEntry(sources, "mechanics", Array.isArray(game.mechanics)),
      categories: provenanceEntry(sources, "categories", Array.isArray(game.categories)),
      designer: provenanceEntry(sources, "designer", Boolean(game.designer)),
      description: provenanceEntry(sources, "description", Boolean(game.description)),
      rubric: provenanceEntry(
        sources,
        "rubric",
        Boolean(rubric) && AUDIT_RUBRIC_DIMENSIONS.every((dimension) => isNumberInRange(rubric[dimension], 0, 100)),
      ),
      vibeScores: provenanceEntry(
        sources,
        "vibeScores",
        Boolean(allVibesPresent),
        "Calculated from legacy rubric; not calibrated or independently validated.",
      ),
      vibeTags: provenanceEntry(
        sources,
        "vibes",
        Array.isArray(game.vibes) && game.vibes.length > 0,
        "Automatic and any authored tags are merged; tag-level origin is not retained.",
      ),
      rulebook: provenanceEntry(
        sources,
        "rulebook",
        Boolean(rulebook),
        rulebook ? "Permission must be reviewed by use scope." : "",
      ),
      relationships: provenanceEntry(
        sources,
        "relationships",
        Boolean(game.relationships?.length || game.expansions?.length),
      ),
    };
    const vibesValidated = Boolean(game.vibeScoresValidated && allVibesPresent);
    const localLabels = [...(game.categories ?? []), ...(game.mechanics ?? [])].join(" ");
    const potentialVibeInconsistencies = [];
    if (/party game/i.test(localLabels) && game.computedVibeScores?.party < 3) {
      potentialVibeInconsistencies.push(
        `Local Party Game label but calculated Party score is ${game.computedVibeScores.party}.`,
      );
    }
    if (
      /abstract strategy|board game|grid movement|line drawing|pattern building|tile placement|map addition|modular board/i.test(
        localLabels,
      ) &&
      game.computedVibeScores?.board < 3
    ) {
      potentialVibeInconsistencies.push(
        `Local board/abstract-mechanic label but calculated Board-Based score is ${game.computedVibeScores.board}.`,
      );
    }
    if (
      /action \/ dexterity|dexterity|flicking|stacking/i.test(localLabels) &&
      game.computedVibeScores?.dexterity < 3
    ) {
      potentialVibeInconsistencies.push(
        `Local dexterity-mechanic label but calculated Dexterity score is ${game.computedVibeScores.dexterity}.`,
      );
    }
    for (const text of potentialVibeInconsistencies) issues.push(issue("low", text));

    const maxSeverity = issues.reduce(
      (current, entry) =>
        SEVERITY_RANK[entry.severity] > SEVERITY_RANK[current] ? entry.severity : current,
      "none",
    );
    const discoverableReadiness =
      isDuplicateExternalId || isDuplicateInternalId || identityErrors.length > 0
        ? "Blocked by critical issue"
        : aliasCollisionPairs.length > 0 || (bggId && !/^\d+$/.test(bggId))
          ? "Needs review"
          : "Provisionally usable";
    const recommendableReadiness =
      allHardFilterFieldsVerified && vibesValidated && structuralErrors.length === 0
        ? "Verified"
        : "Needs review";
    const teachableReadiness = rulebookTeachingReady ? "Verified" : "Blocked by critical issue";
    const manualVibesCannotBeSeparated =
      Array.isArray(game.vibes) && game.vibes.length > 0
        ? "Stored tags merge authored and automatic tags; per-tag provenance unavailable."
        : "";
    const missingVerification = [
      ...Object.entries(fieldVerification)
        .filter(([, status]) => status !== "verified")
        .map(([field]) => field),
      ...(yearIsValid ? ["publication year source"] : []),
      "title and external-identifier source",
      "rubric authoring/evidence",
      "six Vibe score calibration",
      "publisher",
      "edition when applicable",
      ...(!rulebookAuthorized ? ["rulebook source/version and permission"] : []),
    ];

    return {
      game,
      title,
      bggId,
      visible: isVisible,
      duplicateExternalId: isDuplicateExternalId,
      identifierCollisionFindings: [
        ...(isDuplicateExternalId ? [`Duplicate BGG identifier: ${bggId}.`] : []),
        ...aliasCollisionPairs.map(
          (collision) =>
            `Potential numeric-prefix collision: ${collision.numericBggId} / ${collision.aliasBggId}.`,
        ),
      ],
      internalId: game.internalId ?? "",
      publisher: game.publisher ?? "",
      yearPublished: yearIsMissing ? "" : game.yearPublished,
      edition: game.edition ?? "",
      baseExpansionStatus: game.baseExpansionStatus ?? "not structurally classified",
      playerMinimum: players?.min ?? "",
      playerMaximum: players?.max ?? "",
      bestPlayers: players?.best ?? [],
      publisherAge: game.age?.publisher ?? "",
      communityAge: game.age?.community ?? "",
      playtimeMinimum: playtime?.min ?? "",
      playtimeMaximum: playtime?.max ?? "",
      playtimeAverage: playtime?.avg ?? "",
      adultContentExplicit: typeof game.adultContent === "boolean" ? game.adultContent : "",
      adultContentEffective: typeof adultContentEffective === "boolean" ? adultContentEffective : "",
      rubric,
      computedVibeScores: game.computedVibeScores ?? {},
      provenanceStatus: "Legacy unverified; no supporting source URLs in catalog records.",
      fieldProvenance,
      hardFilterVerification: fieldVerification,
      structuralStatus: structuralErrors.length === 0 ? "Passes structural checks" : "Fails structural checks",
      discoverableReadiness,
      recommendableReadiness,
      teachableReadiness,
      severity: maxSeverity,
      structuralErrors,
      issues,
      criticalIssues: issues
        .filter((entry) => entry.severity === "critical")
        .map((entry) => entry.text),
      identityErrors,
      missingVerification: Array.from(new Set(missingVerification)),
      unresolvedExpansionReferences: expansionIssues,
      rulebookSource: rulebook?.officialSourceUrl ?? "",
      rulebookEdition: rulebook?.edition ?? "",
      rulebookVersion: rulebook?.version ?? "",
      rulebookErrataFaqReferences: Array.isArray(rulebook?.errataFaqReferences)
        ? rulebook.errataFaqReferences
        : [],
      rulebookPermissionScope: rulebook?.permissionScope ?? null,
      rulebookPermissionStatus: rulebook?.copyrightStatus ?? "not recorded",
      rulebookFinnCapability: rulebookTeachingReady
        ? "authorized source and retrieval capability verified"
        : "not available",
      manualVibesCannotBeSeparated,
      potentialVibeInconsistencies,
      nextAction:
        isDuplicateExternalId || isDuplicateInternalId
          ? "Resolve identifier ownership with authoritative evidence; do not reassign existing user references."
          : aliasCollisionPairs.length
            ? "Verify both BGG identities for the numeric-prefix collision against authoritative sources before treating either record as discoverable."
          : structuralErrors.length
            ? "Correct structural contradictions only after checking the authoritative edition/source."
            : !allHardFilterFieldsVerified
              ? "Verify hard-filter fields against the exact edition and record field-level source, date, and license."
              : !vibesValidated
                ? "Manually calibrate and independently review all six Vibe scores before recommendation readiness."
                : !rulebookAuthorized
                  ? "Locate the official edition-matched rules source and document use permissions before Finn retrieval."
                  : "Review provenance, edition, and relationship records before promoting readiness.",
    };
  });

  const countStatuses = (field) =>
    Object.fromEntries(
      ["Verified", "Provisionally usable", "Needs review", "Blocked by critical issue"].map(
        (status) => [status, rows.filter((row) => row[field] === status).length],
      ),
    );
  const allIds = rows.map((row) => row.bggId);
  return {
    rows,
    summary: {
      authoredRecords: rows.length,
      visibleRecords: rows.filter((row) => row.visible).length,
      uniqueInternalIds: new Set(rows.map((row) => row.internalId)).size,
      uniqueBggIds: new Set(allIds).size,
      duplicateBggGroups: Array.from(externalIds.entries())
        .filter(([, entries]) => entries.length > 1)
        .map(([id, entries]) => ({ id, titles: entries.map((entry) => entry.name) })),
      potentialAliasCollisions,
      potentialAliasCollisionRecords: rows.filter(
        (row) => row.identifierCollisionFindings.some((text) => text.includes("Potential numeric-prefix collision")),
      ).length,
      structurallyValid: rows.filter((row) => row.structuralStatus === "Passes structural checks").length,
      structurallyInvalid: rows.filter((row) => row.structuralStatus !== "Passes structural checks").length,
      provisionallyDiscoverable: rows.filter((row) => row.discoverableReadiness === "Provisionally usable").length,
      verifiedHardFilterRecords: rows.filter((row) =>
        Object.values(row.hardFilterVerification).every((status) => status === "verified"),
      ).length,
      validatedVibeRecords: rows.filter((row) => row.game.vibeScoresValidated === true).length,
      authorizedRulebookRecords: rows.filter(
        (row) => row.rulebookFinnCapability === "authorized source and retrieval capability verified",
      ).length,
      discoverableReadiness: countStatuses("discoverableReadiness"),
      recommendableReadiness: countStatuses("recommendableReadiness"),
      teachableReadiness: countStatuses("teachableReadiness"),
      seriousIssueRecords: rows.filter((row) =>
        row.issues.some((entry) => entry.severity === "critical" || entry.severity === "high"),
      ).length,
      ageDisagreements: rows
        .filter(
          (row) =>
            row.publisherAge !== "" &&
            row.communityAge !== "" &&
            row.publisherAge !== row.communityAge,
        )
        .map((row) => ({
          title: row.title,
          bggId: row.bggId,
          publisherAge: row.publisherAge,
          communityAge: row.communityAge,
        })),
      visibleAgeDisagreementCount: rows.filter(
        (row) =>
          row.visible &&
          row.publisherAge !== "" &&
          row.communityAge !== "" &&
          row.publisherAge !== row.communityAge,
      ).length,
      nonNumericBggIds: rows
        .filter((row) => row.bggId && !/^\d+$/.test(row.bggId))
        .map((row) => ({ title: row.title, bggId: row.bggId })),
      playtimeContradictions: rows
        .filter((row) => row.structuralErrors.some((text) => text.includes("playtime")))
        .map((row) => ({
          title: row.title,
          bggId: row.bggId,
          playtimeMinimum: row.playtimeMinimum,
          playtimeMaximum: row.playtimeMaximum,
          playtimeAverage: row.playtimeAverage,
        })),
      unresolvedExpansionReferences: rows.flatMap((row) =>
        row.unresolvedExpansionReferences.map((text) => ({ title: row.title, text })),
      ),
      missingPublishers: rows.filter((row) => !row.publisher).length,
      missingStructuredEditions: rows.filter((row) => !row.edition).length,
      missingPublicationYears: rows.filter((row) => row.yearPublished === "").length,
      editionTitleCues: rows
        .filter((row) => row.issues.some((entry) => entry.text.includes("title suggests an edition label")))
        .map((row) => ({ title: row.title, bggId: row.bggId })),
      unclassifiedGameKinds: rows.filter(
        (row) =>
          row.baseExpansionStatus === "not structurally classified" ||
          row.baseExpansionStatus === "not classified by structured relationship" ||
          row.baseExpansionStatus === "possibly expansion (category label)",
      ).length,
      adultContentExplicitRecords: rows.filter((row) => row.adultContentExplicit !== "").length,
      adultContentCurrentlyPositiveRecords: rows.filter(
        (row) => row.adultContentEffective === true,
      ).length,
      adultContentDefaultedFalseRecords: rows.filter(
        (row) => row.adultContentExplicit === "" && row.adultContentEffective === false,
      ).length,
      adultContentCuratedPositives: rows
        .filter((row) => row.adultContentExplicit === "" && row.adultContentEffective === true)
        .map((row) => ({ title: row.title, bggId: row.bggId })),
      unverifiedRatings: rows.length,
      rubricDimensionCount: AUDIT_RUBRIC_DIMENSIONS.length,
      manuallyAuthoredRubricValues: rows.length * AUDIT_RUBRIC_DIMENSIONS.length,
      rulebookReferences: rulebookReferences.length,
      boardScoreBuckets: Object.fromEntries(
        [...new Set(rows.map((row) => row.computedVibeScores.board))]
          .sort((a, b) => a - b)
          .map((score) => [
            score,
            rows.filter((row) => row.computedVibeScores.board === score).length,
          ]),
      ),
      potentialVibeReviewCandidates: rows
        .filter((row) => row.potentialVibeInconsistencies.length > 0)
        .map((row) => ({
          title: row.title,
          bggId: row.bggId,
          findings: row.potentialVibeInconsistencies,
        })),
    },
  };
}

export function renderCatalogAuditCsv(audit) {
  const headers = [
    "title",
    "bgg_id",
    "internal_gamefinder_id",
    "currently_visible",
    "publisher",
    "publisher_verification",
    "publication_year",
    "publication_year_verification",
    "edition",
    "edition_verification",
    "base_or_expansion_status",
    "identifier_collision_findings",
    "players_minimum",
    "players_maximum",
    "players_best",
    "publisher_minimum_age",
    "community_age",
    "playtime_minimum_minutes",
    "playtime_maximum_minutes",
    "playtime_average_minutes",
    "adult_content_explicit_value",
    "adult_content_current_logic_value",
    ...AUDIT_RUBRIC_DIMENSIONS.map((dimension) => `rubric_${dimension}`),
    ...AUDIT_VIBES.map((vibe) => `vibe_${vibe}`),
    "provenance_status",
    "field_provenance",
    "hard_filter_field_verification",
    "structural_status",
    "discoverable_readiness",
    "recommendable_readiness",
    "teachable_readiness",
    "severity",
    "critical_issues",
    "all_issues",
    "potential_vibe_inconsistencies",
    "missing_verification",
    "rulebook_source",
    "rulebook_edition",
    "rulebook_version",
    "official_errata_faq_references",
    "rulebook_permission_scope",
    "rulebook_permission_status",
    "finn_rules_retrieval_capability",
    "recommended_next_action",
  ];
  const lines = [headers.map(csvCell).join(",")];
  for (const row of audit.rows) {
    const values = [
      row.title,
      row.bggId,
      row.internalId,
      row.visible,
      row.publisher,
      row.publisher ? "legacy unverified" : "missing",
      row.yearPublished,
      "legacy unverified",
      row.edition,
      row.edition ? "legacy unverified" : "missing",
      row.baseExpansionStatus,
      row.identifierCollisionFindings.join("; "),
      row.playerMinimum,
      row.playerMaximum,
      row.bestPlayers.join(";"),
      row.publisherAge,
      row.communityAge,
      row.playtimeMinimum,
      row.playtimeMaximum,
      row.playtimeAverage,
      row.adultContentExplicit,
      row.adultContentEffective,
      ...AUDIT_RUBRIC_DIMENSIONS.map((dimension) => row.rubric?.[dimension] ?? ""),
      ...AUDIT_VIBES.map((vibe) => row.computedVibeScores[vibe] ?? ""),
      row.provenanceStatus,
      JSON.stringify(row.fieldProvenance),
      JSON.stringify(row.hardFilterVerification),
      row.structuralStatus,
      row.discoverableReadiness,
      row.recommendableReadiness,
      row.teachableReadiness,
      row.severity,
      row.criticalIssues.join("; "),
      row.issues.map((entry) => entry.text).join("; "),
      row.potentialVibeInconsistencies.join("; "),
      row.missingVerification.join("; "),
      row.rulebookSource,
      row.rulebookEdition,
      row.rulebookVersion,
      row.rulebookErrataFaqReferences.join("; "),
      JSON.stringify(row.rulebookPermissionScope),
      row.rulebookPermissionStatus,
      row.rulebookFinnCapability,
      row.nextAction,
    ];
    lines.push(values.map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function renderCatalogAuditMarkdown(audit) {
  const { summary, rows } = audit;
  const ageRows = summary.ageDisagreements
    .map(
      (entry) =>
        `| ${escapeMarkdown(entry.title)} | ${entry.bggId} | ${entry.publisherAge} | ${entry.communityAge} |`,
    )
    .join("\n");
  const duplicateRows = summary.duplicateBggGroups
    .map((group) => `| ${group.id} | ${group.titles.map(escapeMarkdown).join("; ")} |`)
    .join("\n");
  const aliasList = summary.nonNumericBggIds.map((row) => `\`${row.bggId}\` (${row.title})`).join(", ");
  const aliasCollisionRows = summary.potentialAliasCollisions
    .map(
      (row) =>
        `| ${row.numericBggId} / ${row.aliasBggId} | ${escapeMarkdown(row.numericTitle)} / ${escapeMarkdown(row.aliasTitle)} |`,
    )
    .join("\n");
  const contradictionList = summary.playtimeContradictions
    .map((row) => `\`${row.title}\` (\`${row.bggId}\`; ${row.playtimeMinimum}-${row.playtimeMaximum} min listed, ${row.playtimeAverage} min average)`)
    .join(", ");
  const expansionRows = summary.unresolvedExpansionReferences
    .map((entry) => `| ${escapeMarkdown(entry.title)} | ${escapeMarkdown(entry.text.replace(/^Unresolved expansion reference: /, ""))} |`)
    .join("\n");
  const sampleByCategory = [
    ["Family", "Ticket to Ride"],
    ["Party", "Codenames"],
    ["Strategy", "Terraforming Mars"],
    ["Dexterity", "Rhino Hero"],
    ["Card", "UNO Attack!"],
    ["Board-based", "Chess"],
  ];
  const reviewGames = sampleByCategory
    .map(([category, title]) => {
      const row = rows.find((item) => item.title === title);
      return row ? `| ${category} | ${escapeMarkdown(row.title)} | Review the local mechanics/categories against sources and blind human ratings. |` : "";
    })
    .filter(Boolean)
    .join("\n");

  return `# Existing catalog trustworthiness audit

Generated by \`npm run audit:catalog\` from the complete authored catalog in \`src/lib/catalog.ts\`. This is a structural and provenance audit only: it makes no external requests and does not verify facts from AI knowledge. No catalog data was changed by generating this report.

## Executive baseline

| Measure | Result |
|---|---:|
| Authored source records | ${summary.authoredRecords} |
| Currently visible records after existing external-ID deduplication | ${summary.visibleRecords} |
| Unique internal GameFinder IDs | ${summary.uniqueInternalIds} |
| Unique BGG identifier values | ${summary.uniqueBggIds} |
| Records in potential numeric-prefix BGG-ID collision pairs | ${summary.potentialAliasCollisionRecords} |
| Passing automated structural checks | ${summary.structurallyValid} |
| Failing automated structural checks | ${summary.structurallyInvalid} |
| Provisionally discoverable | ${summary.provisionallyDiscoverable} |
| Records with verified provenance for every hard-filter input | ${summary.verifiedHardFilterRecords} |
| Records with validated six-Vibe scores | ${summary.validatedVibeRecords} |
| Authorized rulebook-backed Finn capability | ${summary.authorizedRulebookRecords} |
| Records with critical/high structural or identity findings | ${summary.seriousIssueRecords} |
| Publisher missing as a structured field | ${summary.missingPublishers} |
| Publication year unknown in source | ${summary.missingPublicationYears} |
| Structured edition missing | ${summary.missingStructuredEditions} |
| Records without structured base/expansion classification | ${summary.unclassifiedGameKinds} |
| Adult-content values explicitly present in source | ${summary.adultContentExplicitRecords} |
| Adult-content positives from current value/curated logic | ${summary.adultContentCurrentlyPositiveRecords} |
| Adult-content records defaulted false by current logic | ${summary.adultContentDefaultedFalseRecords} |
| Rulebook references present in current catalog source | ${summary.rulebookReferences} |
| Authored publisher/community age disagreements (not automatically errors) | ${summary.ageDisagreements.length} |
| Those disagreements among currently visible runtime records | ${summary.visibleAgeDisagreementCount} |

These are not "verified completion" percentages. The 142 BGG identifier values are distinct strings, not confirmed unique real-world game identities. Structural validity means only that types, ranges, and internal consistency pass automated checks. The current legacy catalog has no field-level citations or independent verification records. Consequently, **0 games meet the verified hard-filter metadata standard, 0 have validated Vibe ratings, and 0 have authorized rulebook-backed teaching capability**. User Vault access and recommendation behavior have not been changed.

## Acceptance-level status

| Level | Verified | Provisionally usable | Needs review | Blocked by critical issue |
|---|---:|---:|---:|---:|
| Discoverable | ${summary.discoverableReadiness.Verified} | ${summary.discoverableReadiness["Provisionally usable"]} | ${summary.discoverableReadiness["Needs review"]} | ${summary.discoverableReadiness["Blocked by critical issue"]} |
| Recommendable | ${summary.recommendableReadiness.Verified} | ${summary.recommendableReadiness["Provisionally usable"]} | ${summary.recommendableReadiness["Needs review"]} | ${summary.recommendableReadiness["Blocked by critical issue"]} |
| Teachable | ${summary.teachableReadiness.Verified} | ${summary.teachableReadiness["Provisionally usable"]} | ${summary.teachableReadiness["Needs review"]} | ${summary.teachableReadiness["Blocked by critical issue"]} |

Status meanings: **Verified** requires explicit evidence and authorization where applicable; **Provisionally usable** means the structure is usable while facts remain explicitly unverified; **Needs review** indicates identity/source-format or acceptance evidence is incomplete; **Blocked by critical issue** indicates an identity/structural conflict or missing prerequisite for that readiness level. Readiness does not control Vault inclusion.

## Reconciliation with the earlier catalog counts

The approved foundation source has **143 top-level rows** in \`RAW\`. The legacy \`auditCatalogQuality()\` method counts \`RAW.length\` for source-row ratings and iterates \`RAW\` for age disagreements; it therefore yields 143 authored rows and 50 age disagreements. This agrees with the audit's \`AUTHORED_GAMES\` extraction: it maps each \`RAW\` row exactly once. Its special \`318184\` case replaces that row's fields with The Guild of Merchant Explorers (\`367041\`); it does not append another record. The same 143-row source count is present in the Checkpoint 04A recovery snapshot and the approved foundation commit.

The old documentation's **144 authored / 143 visible** figures are incorrect for those checked-in sources. The runtime \`GAMES\` list retains the first \`41114\` row and excludes Sleeping Queens, yielding 142 visible rows from 143 authored. No authored record is omitted by this audit: the CSV contains 143 rows, including Sleeping Queens once with \`currently_visible=false\`.

The old **49** age-disagreement figure is the count for the 142 visible runtime records. The complete authored source has 50; the one additional row is omitted Sleeping Queens (publisher age 8, community age 5). The legacy source audit loops over \`RAW\` and returns 50, while the visible-only count is 49. These differences are structural count-scope differences, not evidence that either age value is wrong.

## Current identity and data-quality findings

### Duplicate external identifier

| BGG ID | Conflicting authored titles |
|---|---|
${duplicateRows || "| None | |"}

The app's current \`GAMES\` construction silently retains the first record for a duplicate BGG ID. This means the authored count exceeds the visible count by one. Do not silently reassign either external or existing user-owned ID. Verify ownership against authoritative/licensed sources and plan any correction as an explicit reference migration.

### Non-numeric BGG identifier values

These values do not match the conventional numeric external-ID shape and need confirmation as real provider identifiers or intentional local aliases: ${aliasList || "none"}.

### Potential numeric-prefix identifier collisions

| Numeric ID / non-numeric alias | Conflicting authored titles |
|---|---|
${aliasCollisionRows || "| None | |"}

The numeric IDs and alias strings are not proven to be duplicates; without source checks they are unresolved identity ambiguities. All ${summary.potentialAliasCollisionRecords} affected records are marked **Needs review**, not provisionally discoverable. Verify each pair against authoritative/licensed sources before treating either row as a confirmed identity. This is separate from the exact duplicate \`41114\` collision above.

### Contradictory playtime

${contradictionList || "No range/average contradictions detected."} This structural inconsistency requires edition/source review; it is not corrected here.

### Expansion references not present in the authored catalog

| Parent title | Unresolved expansion |
|---|---|
${expansionRows || "| None | |"}

This is a local reference-integrity finding only; no external lookup was performed.

### Publisher, year, edition, and relationship identity

- Publisher is not modeled on the legacy \`Game\` records; all ${summary.authoredRecords} need a field and evidence before a publisher can be asserted.
- Publication year is missing on ${summary.missingPublicationYears} record(s); populated values remain legacy/unverified and lack field-level source URLs.
- Structured edition is absent on all ${summary.authoredRecords}. Titles that mention edition cues are not treated as verified edition metadata.
- A title-only edition cue appears on ${summary.editionTitleCues.length} record(s): ${summary.editionTitleCues.map((row) => `\`${row.title}\` (\`${row.bggId}\`)`).join(", ") || "none"}. This is a review prompt, not a confirmed edition.
- Base-game/expansion relationships are not comprehensively represented as structured records. Existing expansion pointers are incomplete; all identities and editions require review.
- The legacy ID \`41114\` is shared by The Resistance and Sleeping Queens. Current first-row dedup keeps The Resistance visible and omits Sleeping Queens; both authored rows are included in the CSV.

## Publisher/community age differences

These ${summary.ageDisagreements.length} rows differ. A difference is a research queue, **not proof that either value is wrong**. Verify the exact market/edition against publisher packaging or official product documentation and preserve community estimates separately.

| Game | BGG ID | Publisher age in source | Community age in source |
|---|---:|---:|---:|
${ageRows}

## Hard-filter and provenance status

Player ranges, publisher minimum age, maximum listed playtime, and adult-content classification are populated in legacy source records, but population is not verification. The existing field-source conversion labels legacy data \`legacy-unknown/unverified\`; it has no independent source URLs, dates, or license terms. In particular, omitted adult-content flags flow through current app logic as false (apart from a small hard-coded positive list), which is an unsupported default for trustworthiness purposes. This audit reports that current behavior without altering it.

No legacy record has an explicit \`adultContent\` value. Current logic marks these four curated IDs positive: ${summary.adultContentCuratedPositives.map((row) => `\`${row.title}\` (\`${row.bggId}\`)`).join(", ")}. It treats the other ${summary.adultContentDefaultedFalseRecords} absent values as false. Neither the positive overrides nor the implicit false values have field-level evidence in this source; all require policy/source review.

Field-level status is included in the CSV's \`field_provenance\` column. For populated legacy fields the source class is \`legacy-unknown\` and verification is \`unverified\`; source URL and verification date are absent. Publisher, structured edition, rulebook, and some other fields are explicitly \`missing\`. The current model does not attach a distinct provenance record to community age or computed Vibe outputs; the audit records those as unverified/derived rather than silently promoting them. No populated field is classified as verified independent or authorized/licensed third-party data. The \`GameFinder\` provider label in the converter is not itself a factual source.

The BGG rating values have no supporting citation, timestamp, or rights record. Their presence does not establish accuracy or permission for commercial display/use. Numeric validity is not factual verification.

## Vibe/rubric methodology review

The catalog manually authors seven \`r(...)\` rubric values per record (luck, strategy, skill, social, complexity, replayability, resource management); the ${summary.manuallyAuthoredRubricValues} existing rubric values have no per-value source, author rationale, confidence, or calibration data. The six user-facing Vibes are calculated by \`traitScore\` in \`src/lib/vibes.ts\`; the raw optional \`vibes\` tags are merged with threshold-derived tags during catalog construction, and the normalized source does not preserve per-tag authorship.

Current formulas (clamped/rounded to 0-5):

- Luck = rubric luck / 20; Strategy = rubric strategy / 20; Party = rubric social / 20.
- Dexterity uses mechanics/category/name keyword matching; matched games receive at least 3.6 from skill/18, otherwise skill/40. A keyword can dominate the rating.
- Family combines inverse complexity, publisher-age threshold, social threshold, and an average-playtime penalty. Unverified age and playtime therefore affect the soft score.
- Board-Based assigns 4.3 to a short keyword list, 1.4 to a short card-party/bluffing list, and 2.6 to everything else. The broad fallback creates false precision and weak discrimination.

The formulas are deterministic but are **not a consistently calibrated measurement method**: scales have no behavioral anchors; dimensions mix different constructs; keyword lists are incomplete; family combines hard-filter variables; board scores use fixed category buckets; and there is no empirical or human inter-rater validation. Mechanics/Vibe mismatches should be treated as candidate reviews, not automatically changed values.

### Proposed human validation sample

Use representatives already in the source; these are candidates, not claims that their metadata or ratings are correct. Review the correct edition's rules/components, score each trait independently using a documented 0-5 anchor rubric, capture reviewer/evidence/confidence, then adjudicate disagreement before calibrating.

| Coverage | Candidate | Validation task |
|---|---|---|
${reviewGames}

For scaling to thousands of records: define anchored behavioral criteria for 0-5; separate factual metadata from subjective ratings; use two or more independent raters for an initial stratified set; measure agreement and flag low-agreement games; store rubric version, individual ratings, rationale, source/evidence, reviewer, and date; periodically blind re-rate drift samples. Do not train or auto-fill scores from keywords, provider ratings, or AI output. Retain the six approved Vibes unchanged.

### Local-label consistency flags (review candidates only)

The audit compares a few local category/mechanic labels to current calculated outputs only to surface human-review candidates. These are not assertions about game rules:

${summary.potentialVibeReviewCandidates
    .map(
      (row) =>
        `- \`${row.title}\` (\`${row.bggId}\`): ${row.findings.join(" ")}`,
    )
    .join("\n") || "No local-label candidates flagged."}

The Board-Based calculation currently emits only ${Object.entries(summary.boardScoreBuckets)
    .map(([score, count]) => `\`${score}\` for ${count}`)
    .join(", ")} records across the authored source. Its 2.6 fallback and narrow keyword map are particularly important to validate; a low score is not evidence that the game lacks a board.

## Rulebooks, content rights, and Finn

There are no rulebook references in the current catalog. No record establishes authoritative source, exact edition/version, errata/FAQ, or permission scope. Current code correctly requires authorization for storage/parsing/AI retrieval before Finn can use a rulebook reference, but no verified authorized source/retrieval capability is represented here. **No public PDF link would establish those rights.** Do not download rulebooks/artwork or activate ingestion.

Required separate rights checks include BGG identifiers and ratings, product metadata and images, and each rulebook's storage, parsing, AI retrieval, display, caching, retention, and redistribution. Existing repository literals do not establish licensing.

## Recommended correction order

1. Freeze legacy IDs and resolve the exact \`41114\` collision plus all seven numeric-prefix alias pairs with authoritative identity evidence; preserve existing user references.
2. Resolve the contradictory Sheriff of Nottingham playtime against its exact edition and official publisher source.
3. Validate the remaining external identifiers and incomplete expansion links without live API access; keep unverified values pending.
4. Add structured publisher, year, edition, and base/expansion relationships with field-level source, date, evidence class, verification status, and license review.
5. Verify hard-filter inputs against edition-specific publisher materials; document adult-content methodology and do not infer "false" from missing data.
6. Define and calibrate the six Vibes with a human review protocol; do not bulk rewrite ratings.
7. Establish rights and edition-matched rulebook/errata references before considering Finn retrieval.

## Unrelated baseline test failures

- \`scripts/migration-plan.test.mjs\` currently expects the root \`migrations/\` directory to be empty, but the repository contains the tracked SQL migrations \`0001_auth.sql\` through \`0006_catalog_foundation.sql\`. This expectation failure is unrelated to the audit; neither that test nor the migrations were changed.
- \`scripts/with-app-env.test.mjs\` expects template auth settings from \`.grok/app-env.json\`, which is absent in this workspace.
- Grok PWA metadata tests expect generic fixture titles and cards, while the repository's \`site.json\` supplies GameFinder-specific metadata. These environment/fixture mismatches were not altered.

## Repeatability and limitations

Run \`npm run audit:catalog\` to regenerate this Markdown and \`existing-games-review.csv\`. The tool reads the authored source rows (including records currently omitted by ID deduplication), performs local structural/provenance checks, and makes no network requests. Human/source review remains required for correctness, licensing, readiness promotion, and subjective ratings. It intentionally does not rewrite \`catalog.ts\`, migrate data, alter recommendation behavior, remove games from Vaults, or enable integrations.
`;
}

export async function collectCurrentCatalogAudit() {
  const { createServer } = await import("vite");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const [catalog, foundation, vibes] = await Promise.all([
      server.ssrLoadModule("/src/lib/catalog.ts"),
      server.ssrLoadModule("/src/lib/catalog-foundation.ts"),
      server.ssrLoadModule("/src/lib/vibes.ts"),
    ]);
    const authored = catalog.AUTHORED_GAMES.map((game) => ({
      ...game,
      internalId: foundation.legacyCatalogId(game),
      catalogRecord: foundation.catalogRecordFromGame(game),
      computedVibeScores: Object.fromEntries(
        AUDIT_VIBES.map((vibe) => [vibe, vibes.traitScore(game, vibe)]),
      ),
      adultContentDerived: vibes.hasAdultContent(game),
      baseExpansionStatus: game.categories.some((category) => /expansion/i.test(category))
        ? "possibly expansion (category label)"
        : "not classified by structured relationship",
    }));
    const visibleInternalIds = new Set(
      catalog.GAMES.map((game) => foundation.legacyCatalogId(game)),
    );
    const rulebookReferences = [];
    return auditCatalog(authored, {
      visibleInternalIds,
      rulebookReferences,
      rulebookCanBeUsedByFinn: foundation.rulebookReferenceCanBeUsedByFinn,
    });
  } finally {
    await server.close();
  }
}

export async function writeCurrentCatalogAudit(outputDirectory) {
  const audit = await collectCurrentCatalogAudit();
  const directory = outputDirectory ?? resolve(dirname(fileURLToPath(import.meta.url)), "../docs/catalog-audit");
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, "EXISTING_CATALOG_AUDIT.md"), renderCatalogAuditMarkdown(audit));
  writeFileSync(resolve(directory, "existing-games-review.csv"), renderCatalogAuditCsv(audit));
  return audit.summary;
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === pathToFileURL(thisFile).href) {
  writeCurrentCatalogAudit().then(
    (summary) => console.log(JSON.stringify(summary, null, 2)),
    (error) => {
      console.error("[catalog-audit] Failed to generate audit reports.", error);
      process.exitCode = 1;
    },
  );
}
