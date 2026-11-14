import type { Game, VibeId, WizardContext } from "./types";
import { VIBE_IDS } from "./types";
import {
  catalogRecommendationScore,
  legacyCatalogId,
  type CatalogRecommendationRecord,
} from "./catalog-foundation";
import { hasAdultContent, traitScore } from "./vibes";

/**
 * Compatibility bridge for the existing GameFinder catalog.
 *
 * Legacy records retain their existing BGG-based storage keys.
 * A legacy projection is NOT a verified published catalog record,
 * a permanent GameFinder identity, or proof of content rights.
 *
 * Once an authorized published catalog is available, the application
 * can use the published catalog adapter without reusing these
 * temporary compatibility identities as permanent identities.
 */
export function legacyGameToRecommendationRecord(game: Game): CatalogRecommendationRecord {
  const vibeScores = Object.fromEntries(
    VIBE_IDS.map((vibe) => [vibe, traitScore(game, vibe)]),
  ) as Record<VibeId, number>;

  return {
    id: legacyCatalogId(game),
    title: game.name,
    edition: null,
    relationships: [],
    players: {
      minimum: game.players.min,
      maximum: game.players.max,
      best: [...game.players.best],
    },
    publisherMinimumAge: game.age.publisher,
    maximumListedPlaytimeMinutes: game.playtime.max,
    adultContent: hasAdultContent(game),
    bggRating: game.bggRating,
    vibeScores,
  };
}

/**
 * Use the new provider-neutral recommendation formula while retaining
 * legacy record handling, reviewed-facts filtering, and UI contracts.
 */
export function scoreLegacyGameWithCatalogFoundation(
  game: Game,
  context: WizardContext,
  owned = false,
): number {
  return catalogRecommendationScore(legacyGameToRecommendationRecord(game), context, owned);
}
