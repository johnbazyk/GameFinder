import type { Game, Rubric, VibeId, WizardContext } from "./types";
import { AGE_BANDS, hasAdultContent, traitScore } from "./vibes";

export type CatalogProviderId = "bgg" | "gamefinder" | "user" | "mock";
export type CatalogFactStatus = "verified" | "unverified" | "disputed" | "missing";
export type CatalogSourceClass =
  "independent" | "third-party-licensed" | "user-entered" | "legacy-unknown" | "mock";

export type ExternalGameId = {
  provider: CatalogProviderId;
  value: string;
};

export type CatalogFactSource = {
  field: string;
  provider: CatalogProviderId;
  sourceClass: CatalogSourceClass;
  verification: CatalogFactStatus;
  lastVerified: string | null;
  sourceUrl?: string;
};

export type CatalogRelationship = {
  relation: "base-game" | "expansion" | "edition";
  catalogGameId: string | null;
  externalIds: ExternalGameId[];
  title: string;
};

export type CatalogGameRecord = {
  id: string;
  title: string;
  alternateTitles: string[];
  publisher: string | null;
  yearPublished: number | null;
  edition: string | null;
  relationships: CatalogRelationship[];
  externalIds: ExternalGameId[];
  players: { minimum: number | null; maximum: number | null; best: number[] };
  publisherMinimumAge: number | null;
  maximumListedPlaytimeMinutes: number | null;
  adultContent: boolean | null;
  categories: string[];
  mechanics: string[];
  rubric: Partial<Rubric>;
  vibeScores: Partial<Record<VibeId, number>>;
  sources: CatalogFactSource[];
  missingFields: string[];
  disputedFields: string[];
  origin: "legacy-catalog" | "user-entered" | "independent-research" | "licensed-provider" | "mock";
};

export type RulebookPermissionScope = {
  storage: boolean;
  parsing: boolean;
  aiRetrieval: boolean;
  display: boolean;
};

export type RulebookReference = {
  id: string;
  catalogGameId: string;
  edition: string | null;
  publisher: string | null;
  officialSourceUrl: string;
  documentTitle: string;
  language: string;
  version: string | null;
  publicationDate: string | null;
  lastVerifiedDate: string | null;
  sourceClassification: "official-publisher" | "third-party" | "user-provided" | "fictional-test";
  copyrightStatus:
    | "unknown"
    | "official-link-available"
    | "permission-pending"
    | "authorized"
    | "denied"
    | "revoked";
  permissionScope: RulebookPermissionScope;
};

export type CatalogProviderPolicy = {
  enabled: boolean;
  maxResults: number;
  requestsPerMinute: number;
  cacheRetentionMs: number;
  cacheEnabled: boolean;
  commercialUseAuthorized: boolean;
  aiUseAuthorized: boolean;
  tokenEnvironmentVariable: string | null;
};

export type CatalogProvider<TResponse = unknown> = {
  id: CatalogProviderId;
  policy: CatalogProviderPolicy;
  searchByTitle(title: string, limit?: number): Promise<TResponse[]>;
  retrieveByExternalId(externalId: string): Promise<TResponse>;
  normalize(response: TResponse): CatalogGameRecord;
  identifyPossibleRelations(response: TResponse): CatalogRelationship[];
  reportMissingInformation(response: TResponse): string[];
};

export class CatalogProviderError extends Error {
  constructor(
    readonly code: "disabled" | "unavailable" | "invalid-request" | "invalid-response",
    message: string,
  ) {
    super(message);
    this.name = "CatalogProviderError";
  }
}

export function legacyCatalogId(game: Pick<Game, "bggId" | "name">): string {
  const slug =
    game.name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "game";
  return `gf:legacy:${slug}:${game.bggId}`;
}

export function createCatalogGameId(): string {
  return `gf:${crypto.randomUUID()}`;
}

export function catalogRecordFromGame(game: Game): CatalogGameRecord {
  const fields = [
    "title",
    "yearPublished",
    "players",
    "publisherMinimumAge",
    "maximumListedPlaytimeMinutes",
    "categories",
    "mechanics",
    "rubric",
    "externalIds.bgg",
  ];
  return {
    id: legacyCatalogId(game),
    title: game.name,
    alternateTitles: [],
    publisher: null,
    yearPublished: game.yearPublished || null,
    edition: null,
    relationships: (game.expansions ?? []).map((expansion) => ({
      relation: "expansion",
      catalogGameId: null,
      externalIds: [{ provider: "bgg", value: expansion.bggId }],
      title: expansion.name,
    })),
    externalIds: [{ provider: "bgg", value: game.bggId }],
    players: {
      minimum: game.players.min,
      maximum: game.players.max,
      best: [...game.players.best],
    },
    publisherMinimumAge: game.age.publisher || null,
    maximumListedPlaytimeMinutes: game.playtime.max || null,
    adultContent: game.adultContent ?? (hasAdultContent(game) ? true : null),
    categories: [...game.categories],
    mechanics: [...game.mechanics],
    rubric: { ...game.rubric },
    vibeScores: {
      luck: traitScore(game, "luck"),
      strategy: traitScore(game, "strategy"),
      dexterity: traitScore(game, "dexterity"),
      family: traitScore(game, "family"),
      party: traitScore(game, "party"),
      board: traitScore(game, "board"),
    },
    sources: fields.map((field) =>
      field === "externalIds.bgg"
        ? {
            field,
            provider: "bgg" as const,
            sourceClass: "legacy-unknown" as const,
            verification: "unverified" as const,
            lastVerified: null,
          }
        : {
            field,
            provider: "gamefinder" as const,
            sourceClass: "legacy-unknown" as const,
            verification: "unverified" as const,
            lastVerified: null,
          },
    ),
    missingFields: ["publisher", "edition"],
    disputedFields: [],
    origin: "legacy-catalog",
  };
}

export function unifiedCatalogRecords(
  legacyGames: Game[],
  userGames: CatalogGameRecord[],
): CatalogGameRecord[] {
  const records = [...legacyGames.map(catalogRecordFromGame), ...userGames];
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) {
      throw new Error(`Duplicate internal catalog ID: ${record.id}`);
    }
    seen.add(record.id);
  }
  return records;
}

export function searchCatalogRecords(
  records: CatalogGameRecord[],
  title: string,
): CatalogGameRecord[] {
  const query = title.trim().toLocaleLowerCase();
  if (!query) return [...records];
  return records.filter((record) =>
    [record.title, ...record.alternateTitles].some((value) =>
      value.toLocaleLowerCase().includes(query),
    ),
  );
}

export function createCustomCatalogGame(
  title: string,
  id = `gfc_${crypto.randomUUID()}`,
): CatalogGameRecord {
  const trimmed = title.trim().slice(0, 120);
  if (!trimmed) throw new Error("A custom game needs a title.");
  if (!/^gfc_[a-zA-Z0-9-]{8,80}$/.test(id)) {
    throw new Error("A custom game needs a valid stable internal ID.");
  }
  return {
    id,
    title: trimmed,
    alternateTitles: [],
    publisher: null,
    yearPublished: null,
    edition: null,
    relationships: [],
    externalIds: [],
    players: { minimum: null, maximum: null, best: [] },
    publisherMinimumAge: null,
    maximumListedPlaytimeMinutes: null,
    adultContent: null,
    categories: [],
    mechanics: [],
    rubric: {},
    vibeScores: {},
    sources: [
      {
        field: "title",
        provider: "user",
        sourceClass: "user-entered",
        verification: "unverified",
        lastVerified: null,
      },
    ],
    missingFields: [
      "publisher",
      "yearPublished",
      "edition",
      "players",
      "publisherMinimumAge",
      "maximumListedPlaytimeMinutes",
      "adultContent",
      "categories",
      "mechanics",
      "rubric",
    ],
    disputedFields: [],
    origin: "user-entered",
  };
}

export function isCustomCatalogGame(value: unknown): value is CatalogGameRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<CatalogGameRecord>;
  const isText = (item: unknown, limit = 160) => typeof item === "string" && item.length <= limit;
  const isTextList = (items: unknown, limit: number) =>
    Array.isArray(items) && items.length <= limit && items.every((item) => isText(item));
  const isNullableNumber = (item: unknown, min: number, max: number) =>
    item == null ||
    (typeof item === "number" && Number.isFinite(item) && item >= min && item <= max);
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return false;
  }
  return (
    serialized != null &&
    serialized.length <= 16_384 &&
    typeof record.id === "string" &&
    /^gfc_[a-zA-Z0-9-]{8,80}$/.test(record.id) &&
    typeof record.title === "string" &&
    record.title.trim().length > 0 &&
    record.title.length <= 120 &&
    record.origin === "user-entered" &&
    isTextList(record.alternateTitles, 20) &&
    (record.publisher == null || isText(record.publisher, 120)) &&
    isNullableNumber(record.yearPublished, 0, 9999) &&
    (record.edition == null || isText(record.edition, 120)) &&
    Array.isArray(record.relationships) &&
    record.relationships.length <= 100 &&
    record.relationships.every(
      (relationship) =>
        relationship != null &&
        ["base-game", "expansion", "edition"].includes(relationship.relation) &&
        (relationship.catalogGameId == null || isText(relationship.catalogGameId, 120)) &&
        isText(relationship.title, 120) &&
        Array.isArray(relationship.externalIds) &&
        relationship.externalIds.length <= 20 &&
        relationship.externalIds.every(
          (external) =>
            ["bgg", "gamefinder", "user", "mock"].includes(external.provider) &&
            isText(external.value, 120) &&
            external.value.length > 0,
        ),
    ) &&
    Array.isArray(record.externalIds) &&
    record.externalIds.length <= 20 &&
    record.externalIds.every(
      (external) =>
        external != null &&
        ["bgg", "gamefinder", "user", "mock"].includes(external.provider) &&
        isText(external.value, 120) &&
        external.value.length > 0,
    ) &&
    Boolean(
      record.players &&
      typeof record.players === "object" &&
      isNullableNumber(record.players.minimum, 1, 100) &&
      isNullableNumber(record.players.maximum, 1, 100) &&
      Array.isArray(record.players.best) &&
      record.players.best.length <= 100 &&
      record.players.best.every((item) => isNullableNumber(item, 1, 100)),
    ) &&
    isNullableNumber(record.publisherMinimumAge, 0, 120) &&
    isNullableNumber(record.maximumListedPlaytimeMinutes, 1, 100_000) &&
    (record.adultContent == null || typeof record.adultContent === "boolean") &&
    isTextList(record.categories, 100) &&
    isTextList(record.mechanics, 100) &&
    Boolean(
      record.rubric &&
      typeof record.rubric === "object" &&
      Object.values(record.rubric).every((item) => isNullableNumber(item, 0, 100)),
    ) &&
    Boolean(
      record.vibeScores &&
      typeof record.vibeScores === "object" &&
      Object.values(record.vibeScores).every((item) => isNullableNumber(item, 0, 5)),
    ) &&
    Array.isArray(record.sources) &&
    record.sources.length <= 100 &&
    record.sources.every(
      (source) =>
        source != null &&
        isText(source.field) &&
        ["bgg", "gamefinder", "user", "mock"].includes(source.provider) &&
        ["independent", "third-party-licensed", "user-entered", "legacy-unknown", "mock"].includes(
          source.sourceClass,
        ) &&
        ["verified", "unverified", "disputed", "missing"].includes(source.verification) &&
        (source.lastVerified == null || isText(source.lastVerified, 40)) &&
        (source.sourceUrl == null || isText(source.sourceUrl, 2048)),
    ) &&
    isTextList(record.missingFields, 100) &&
    isTextList(record.disputedFields, 100)
  );
}

export function catalogHardEligible(game: CatalogGameRecord, context: WizardContext): boolean {
  if (context.players != null) {
    if (
      game.players.minimum == null ||
      game.players.maximum == null ||
      context.players < game.players.minimum ||
      context.players > game.players.maximum
    ) {
      return false;
    }
  }

  if (context.ageBand) {
    const band = AGE_BANDS.find((item) => item.id === context.ageBand);
    if (context.ageBand !== "adults") {
      if (
        game.publisherMinimumAge == null ||
        game.publisherMinimumAge > (band?.youngestAge ?? -1) ||
        game.adultContent !== false
      ) {
        return false;
      }
    }
  }

  if (context.timeOver60) {
    if (game.maximumListedPlaytimeMinutes == null || game.maximumListedPlaytimeMinutes <= 60) {
      return false;
    }
  } else if (context.maxTimeMin != null) {
    if (
      game.maximumListedPlaytimeMinutes == null ||
      game.maximumListedPlaytimeMinutes > context.maxTimeMin
    ) {
      return false;
    }
  }

  return true;
}

export function catalogVibePreferenceScore(
  game: CatalogGameRecord,
  vibes: VibeId[],
): number | null {
  const scores = vibes.flatMap((vibe) => {
    const score = game.vibeScores[vibe];
    return typeof score === "number" && Number.isFinite(score) ? [score] : [];
  });
  if (!scores.length) return null;
  const hits3 = scores.filter((score) => score >= 3).length;
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return hits3 * 12 + average * 6;
}

export function findExternalIdConflicts(
  records: CatalogGameRecord[],
  provider: CatalogProviderId,
  value: string,
): CatalogGameRecord[] {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return [];
  return records.filter((record) =>
    record.externalIds.some(
      (external) =>
        external.provider === provider && external.value.trim().toLowerCase() === normalized,
    ),
  );
}

export function rulebookReferenceCanBeUsedByFinn(source: RulebookReference): boolean {
  return (
    source.sourceClassification === "official-publisher" &&
    source.copyrightStatus === "authorized" &&
    source.permissionScope.aiRetrieval &&
    source.permissionScope.parsing &&
    source.permissionScope.storage
  );
}

export function createRulebookReference(
  input: Omit<RulebookReference, "permissionScope" | "copyrightStatus"> &
    Partial<Pick<RulebookReference, "permissionScope" | "copyrightStatus">>,
): RulebookReference {
  return {
    ...input,
    copyrightStatus: input.copyrightStatus ?? "permission-pending",
    permissionScope: {
      storage: input.permissionScope?.storage ?? false,
      parsing: input.permissionScope?.parsing ?? false,
      aiRetrieval: input.permissionScope?.aiRetrieval ?? false,
      display: input.permissionScope?.display ?? false,
    },
  };
}

export const BGG_PROVIDER_POLICY: CatalogProviderPolicy = {
  enabled: false,
  maxResults: 20,
  requestsPerMinute: 10,
  cacheRetentionMs: 0,
  cacheEnabled: false,
  commercialUseAuthorized: false,
  aiUseAuthorized: false,
  tokenEnvironmentVariable: "BGG_API_TOKEN",
};

export type BggMockResponse = {
  externalId: string;
  title: string;
  minimumPlayers: number | null;
  maximumPlayers: number | null;
  relationships?: CatalogRelationship[];
};

const BGG_LOCAL_MOCKS: BggMockResponse[] = [
  {
    externalId: "mock-0001",
    title: "Lantern Orchard",
    minimumPlayers: 2,
    maximumPlayers: 4,
  },
  {
    externalId: "mock-0002",
    title: "Cloud Harbor",
    minimumPlayers: null,
    maximumPlayers: null,
  },
];

function missingMockFields(response: BggMockResponse): string[] {
  const missing = [
    "publisher",
    "yearPublished",
    "edition",
    "publisherMinimumAge",
    "maximumListedPlaytimeMinutes",
    "adultContent",
    "categories",
    "mechanics",
    "rubric",
    "vibeScores",
  ];
  if (response.minimumPlayers == null) missing.push("players.minimum");
  if (response.maximumPlayers == null) missing.push("players.maximum");
  return missing;
}

function assertBggMockResponse(value: unknown): asserts value is BggMockResponse {
  if (!value || typeof value !== "object") {
    throw new CatalogProviderError("invalid-response", "The provider response is invalid.");
  }
  const response = value as Partial<BggMockResponse>;
  if (
    typeof response.externalId !== "string" ||
    response.externalId.length === 0 ||
    response.externalId.length > 120 ||
    typeof response.title !== "string" ||
    response.title.trim().length === 0 ||
    response.title.length > 120 ||
    !(
      response.minimumPlayers == null ||
      (Number.isInteger(response.minimumPlayers) && response.minimumPlayers > 0)
    ) ||
    !(
      response.maximumPlayers == null ||
      (Number.isInteger(response.maximumPlayers) && response.maximumPlayers > 0)
    ) ||
    (response.minimumPlayers != null &&
      response.maximumPlayers != null &&
      response.minimumPlayers > response.maximumPlayers) ||
    (response.relationships != null &&
      (!Array.isArray(response.relationships) || response.relationships.length > 100))
  ) {
    throw new CatalogProviderError("invalid-response", "The provider response is incomplete.");
  }
}

export function createBggMockProvider(
  options: { useLocalMocks?: boolean } = {},
): CatalogProvider<BggMockResponse> {
  const useLocalMocks = options.useLocalMocks ?? false;
  const requireMockProvider = () => {
    if (!useLocalMocks) {
      throw new CatalogProviderError("disabled", "The BGG provider is disabled.");
    }
  };
  return {
    id: "bgg",
    policy: BGG_PROVIDER_POLICY,
    async searchByTitle(title, limit = BGG_PROVIDER_POLICY.maxResults) {
      requireMockProvider();
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.length > 120 ||
        !Number.isInteger(limit) ||
        limit < 1
      ) {
        throw new CatalogProviderError(
          "invalid-request",
          "A valid title and result limit are required.",
        );
      }
      const query = title.trim().toLowerCase();
      return BGG_LOCAL_MOCKS.filter((record) => record.title.toLowerCase().includes(query)).slice(
        0,
        Math.min(limit, BGG_PROVIDER_POLICY.maxResults),
      );
    },
    async retrieveByExternalId(externalId) {
      requireMockProvider();
      if (typeof externalId !== "string" || !externalId.trim() || externalId.length > 120) {
        throw new CatalogProviderError("invalid-request", "A valid external ID is required.");
      }
      const record = BGG_LOCAL_MOCKS.find((item) => item.externalId === externalId);
      if (!record) throw new CatalogProviderError("unavailable", "No local mock record found.");
      return record;
    },
    normalize(response) {
      assertBggMockResponse(response);
      const game = createCustomCatalogGame(response.title);
      return {
        ...game,
        id: `gf:mock:bgg:${response.externalId}`,
        externalIds: [{ provider: "bgg", value: response.externalId }],
        players: {
          minimum: response.minimumPlayers,
          maximum: response.maximumPlayers,
          best: [],
        },
        sources: [
          {
            field: "title",
            provider: "mock",
            sourceClass: "mock",
            verification: "unverified",
            lastVerified: null,
          },
          {
            field: "players",
            provider: "mock",
            sourceClass: "mock",
            verification: "unverified",
            lastVerified: null,
          },
        ],
        missingFields: missingMockFields(response),
        origin: "mock",
      };
    },
    identifyPossibleRelations(response) {
      assertBggMockResponse(response);
      return [...(response.relationships ?? [])];
    },
    reportMissingInformation(response) {
      assertBggMockResponse(response);
      return missingMockFields(response);
    },
  };
}

export function isExternalIdConflictFree(
  records: CatalogGameRecord[],
  candidate: CatalogGameRecord,
): boolean {
  return candidate.externalIds.every(
    (external) => findExternalIdConflicts(records, external.provider, external.value).length === 0,
  );
}
