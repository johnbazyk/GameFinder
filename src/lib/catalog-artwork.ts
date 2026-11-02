import type { CatalogProviderId } from "./catalog-foundation";
import type { ProviderFieldProvenance } from "./catalog-ingestion";

export type ScopedValue = { status: "known"; value: string } | { status: "unknown"; value: null };

export type ArtworkEditionScope = {
  edition: ScopedValue;
  printing: ScopedValue;
  language: ScopedValue;
  market: ScopedValue;
};

export type ArtworkGameIdentity = {
  stagingId: string;
  gamefinderId: string | null;
};

export type ArtworkCandidate = {
  id: string;
  game: ArtworkGameIdentity;
  scope: ArtworkEditionScope;
  source: {
    provider: CatalogProviderId;
    originalImageReference: string | null;
    provenance: ProviderFieldProvenance | null;
  };
  rights: {
    rightsHolder: string | null;
    permissionReference: string | null;
    commercialDisplay: "unknown" | "pending" | "allowed" | "denied" | "revoked";
    cachingHosting: "unknown" | "pending" | "allowed" | "denied" | "revoked";
    resizingTransformation: "unknown" | "pending" | "allowed" | "denied" | "revoked";
    attribution: { required: boolean | null; text: string | null };
    expiresAt: string | null;
    revokedAt: string | null;
  };
  review: {
    verification: "unverified" | "verified" | "disputed";
    approval: "pending" | "approved" | "rejected";
    reviewerId: string | null;
    reviewedAt: string | null;
  };
  image: {
    availability: "unknown" | "available" | "unavailable";
    width: number | null;
    height: number | null;
    format: string | null;
    fileSizeBytes: number | null;
    quality: "unknown" | "low" | "standard" | "high";
  };
};

export type ArtworkSelection =
  | {
      status: "selected";
      artwork: ArtworkCandidate;
      cachingPermitted: boolean;
      transformationPermitted: boolean;
    }
  | {
      status:
        | "missing"
        | "rights-unresolved"
        | "approval-pending"
        | "approval-rejected"
        | "image-unavailable"
        | "edition-mismatch"
        | "identity-mismatch";
      artwork: null;
      cachingPermitted: false;
      transformationPermitted: false;
    };

function scopeMatches(left: ArtworkEditionScope, right: ArtworkEditionScope): boolean {
  const fields: (keyof ArtworkEditionScope)[] = ["edition", "printing", "language", "market"];
  return fields.every(
    (field) =>
      left[field].status === "known" &&
      right[field].status === "known" &&
      left[field].value === right[field].value,
  );
}

function targetsSameGame(left: ArtworkGameIdentity, right: ArtworkGameIdentity): boolean {
  if (left.gamefinderId !== null || right.gamefinderId !== null) {
    return left.gamefinderId !== null && left.gamefinderId === right.gamefinderId;
  }
  return left.stagingId === right.stagingId;
}

function rightsAllowCommercialDisplay(artwork: ArtworkCandidate, now: string): boolean {
  return (
    artwork.rights.commercialDisplay === "allowed" &&
    Boolean(artwork.rights.permissionReference?.trim()) &&
    artwork.rights.attribution.required !== null &&
    (!artwork.rights.attribution.required || Boolean(artwork.rights.attribution.text?.trim())) &&
    artwork.rights.revokedAt === null &&
    (artwork.rights.expiresAt === null || Date.parse(artwork.rights.expiresAt) > Date.parse(now))
  );
}

export function selectApprovedArtwork(
  game: ArtworkGameIdentity,
  scope: ArtworkEditionScope,
  candidates: readonly ArtworkCandidate[],
  now = new Date().toISOString(),
): ArtworkSelection {
  const matchingGame = candidates.filter((candidate) => targetsSameGame(candidate.game, game));
  if (!matchingGame.length) {
    return {
      status: candidates.some(
        (candidate) =>
          candidate.game.stagingId === game.stagingId &&
          candidate.game.gamefinderId !== game.gamefinderId,
      )
        ? "identity-mismatch"
        : "missing",
      artwork: null,
      cachingPermitted: false,
      transformationPermitted: false,
    };
  }
  const matchingEdition = matchingGame.filter((candidate) => scopeMatches(candidate.scope, scope));
  if (!matchingEdition.length) {
    return {
      status: "edition-mismatch",
      artwork: null,
      cachingPermitted: false,
      transformationPermitted: false,
    };
  }
  const verifiedAndApproved = matchingEdition.filter(
    (candidate) =>
      candidate.review.verification === "verified" &&
      candidate.review.approval === "approved" &&
      Boolean(candidate.review.reviewerId?.trim()) &&
      Number.isFinite(Date.parse(candidate.review.reviewedAt ?? "")),
  );
  const displayAuthorized = verifiedAndApproved.filter((candidate) =>
    rightsAllowCommercialDisplay(candidate, now),
  );
  const available = displayAuthorized
    .filter(
      (candidate) =>
        candidate.image.availability === "available" &&
        Boolean(candidate.source.originalImageReference?.trim()),
    )
    .sort((left, right) => {
      const leftQuality = { high: 3, standard: 2, low: 1, unknown: 0 }[left.image.quality];
      const rightQuality = { high: 3, standard: 2, low: 1, unknown: 0 }[right.image.quality];
      return rightQuality - leftQuality || left.id.localeCompare(right.id);
    });
  if (!available.length) {
    const status = matchingEdition.some((candidate) => candidate.review.approval === "rejected")
      ? "approval-rejected"
      : matchingEdition.some((candidate) => !rightsAllowCommercialDisplay(candidate, now))
        ? "rights-unresolved"
        : displayAuthorized.length > 0
          ? "image-unavailable"
          : "approval-pending";
    return {
      status,
      artwork: null,
      cachingPermitted: false,
      transformationPermitted: false,
    };
  }
  const artwork = available[0];
  return {
    status: "selected",
    artwork,
    cachingPermitted: artwork.rights.cachingHosting === "allowed",
    transformationPermitted: artwork.rights.resizingTransformation === "allowed",
  };
}

export function artworkPublicationReadiness(
  game: ArtworkGameIdentity,
  scope: ArtworkEditionScope,
  candidates: readonly ArtworkCandidate[],
  now?: string,
): { ready: boolean; missingAuthenticArtwork: boolean; selection: ArtworkSelection } {
  const selection = selectApprovedArtwork(game, scope, candidates, now);
  return {
    ready: selection.status === "selected",
    missingAuthenticArtwork: selection.status !== "selected",
    selection,
  };
}
