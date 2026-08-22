import type { Dimension, Game, MatchLabel, VibeId, WizardContext } from "./types";
import { AGE_BANDS, traitScore } from "./vibes";
import { VIBE_META } from "./vibes";

function playerBit(ctx: WizardContext, game: Game): string | null {
  if (ctx.players == null) return null;
  if (ctx.players >= 13) return "fits a big group";
  if (game.players.best.includes(ctx.players)) return "fits your player count";
  return "works at your player count";
}

function timeBit(ctx: WizardContext): string | null {
  if (ctx.timeOver60) return "is a longer session";
  if (ctx.maxTimeMin != null) return `works within ${ctx.maxTimeMin} minutes`;
  return null;
}

function ageBit(ctx: WizardContext): string | null {
  if (!ctx.ageBand) return null;
  const band = AGE_BANDS.find((b) => b.id === ctx.ageBand);
  if (!band) return null;
  if (ctx.ageBand === "adults") return "is fine for an adults-only table";
  return `is okay for a youngest player of ${band.label.toLowerCase()}`;
}

export function explainMatch(
  game: Game,
  ctx: WizardContext,
  label: MatchLabel,
): { why: string; topDims: Dimension[] } {
  const bits = [playerBit(ctx, game), timeBit(ctx), ageBit(ctx)].filter(Boolean) as string[];
  const vibeNames = ctx.vibes.map((v) => VIBE_META[v].label);
  if (vibeNames.length) {
    bits.push(`matches your ${vibeNames.join(" + ")} vibe`);
  }
  const head =
    label === "excellent"
      ? "Excellent Match"
      : label === "strong"
        ? "Strong Match"
        : label === "good"
          ? "Good Match"
          : "Closest Available Match";
  const body = bits.length
    ? bits.join(", ").replace(/, ([^,]*)$/, ", and $1")
    : "Fits tonight's table.";
  const capped = body.charAt(0).toUpperCase() + body.slice(1);
  return { why: `${head}. ${capped}.`, topDims: [] };
}

export function vibeHits(game: Game, vibes: VibeId[], threshold = 3): number {
  return vibes.filter((v) => traitScore(game, v) >= threshold).length;
}
