export const GAMES = [
  { slug: "catan", label: "Catan", emoji: "🏰" },
  { slug: "ticket-to-ride", label: "Ticket to Ride", emoji: "🚂" },
  { slug: "qwixx", label: "Qwixx", emoji: "🎲" },
  { slug: "skip-bo", label: "Skip-Bo", emoji: "🃏" },
  { slug: "phase-10", label: "Phase 10", emoji: "🔢" },
  { slug: "jokers-and-marbles", label: "Jokers & Marbles", emoji: "🎯" },
] as const;

export type GameSlug = (typeof GAMES)[number]["slug"];

export function isGameSlug(value: string): value is GameSlug {
  return GAMES.some((g) => g.slug === value);
}

export function gameBySlug(slug: GameSlug) {
  return GAMES.find((g) => g.slug === slug)!;
}
