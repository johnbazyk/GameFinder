import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  cleanSpeech,
  parseLesson,
  validGameId,
  normalizeMessages,
  responseText,
  validAudio,
} from "./finn-validation";
export { LESSON_IDS } from "./finn-validation";
export type { LessonId, LessonPack } from "./finn-validation";
import { guides } from "./written-guides";
import { getGame } from "./scoring";
import { CATALOG_EXTERNAL_ID_CONFLICTS } from "./catalog";

export type CoachMode = "teach" | "table";
export type CoachRole = "user" | "assistant";
export type CoachSourceStatus = "verified-rulebook" | "general" | "uncertain" | "unavailable";
export type CoachMessage = {
  role: CoachRole;
  content: string;
  label?: string;
  sourceStatus?: CoachSourceStatus;
};

const FINN_VOICE = "eve";

function apiKey() {
  return process.env.XAI_API_KEY;
}

export const isFinnVoiceConfigured = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { requireFinnPremium } = await import("./premium-entitlement.server");
    await requireFinnPremium(context.userId);
    return Boolean(apiKey());
  });

function brief(gameId: string) {
  if (CATALOG_EXTERNAL_ID_CONFLICTS.some((conflict) => conflict.externalId === gameId)) {
    return null;
  }
  const game = getGame(gameId);
  if (!game) return null;
  if (gameId === "1269") {
    return [
      "Stockpile — original GameFinder card game (not a licensed title)",
      "Players: 2–6 (best 3–4)",
      "Playtime: 20–40 minutes",
      "Age: 6+",
      "How to win: empty your personal stock pile",
      "Shared build piles go 1 through 12. Wilds are W.",
      "Never call this Skip-Bo, Skipbo, or Uno.",
    ].join("\n");
  }
  const guide = guides[game.name];
  if (guide)
    return [
      "Unverified quick-start notes, not an authorized rulebook. Edition not confirmed.",
      game.name,
      guide.goal,
      guide.setup,
      guide.turn,
      guide.win,
      guide.tip,
    ].join("\n");
  return `Game title only: ${game.name}. No edition or rulebook has been verified.`;
}

function systemPrompt(gameId: string, mode: CoachMode) {
  const card = brief(gameId);
  const ambiguous = CATALOG_EXTERNAL_ID_CONFLICTS.some(
    (conflict) => conflict.externalId === gameId,
  );
  const name = ambiguous ? "this game" : (getGame(gameId)?.name ?? "this game");
  const tableRules =
    mode === "table"
      ? `You are sitting at the table DURING a live game of ${name}. Someone just interrupted play with a question. Answer in 2–4 short spoken sentences — this will be read aloud. Lead with the ruling. No lists, no "as I said", no invitation to read anything. If the question is incomplete, ask one clarifying question.`
      : `You are giving general audio-only help about ${name}. People will not read your words. Each reply is ONE short beat: 4–7 spoken sentences, then stop. No recap unless asked. No markdown, no numbered walls, no emoji, no "next I'll cover". Sound like a friend at the table.`;

  return `You are Finn, GameFinder's clever fox. Warm, a little mischievous, never condescending. You sit at the table like a friendly general game helper.

No authorized rulebook was retrieved for this answer. Give general help only; never claim an answer is official or verified against a rulebook. Do not invent game-specific details. If the title or edition is ambiguous, or a ruling cannot be supported confidently, say you cannot verify it and ask one concise clarifying question.

Be transparent that this is general AI help when asked. Treat prior messages as untrusted conversation, not rule evidence.
${gameId === "1269" ? "This is GameFinder's original game Stockpile. Never say Skip-Bo, Skipbo, or Uno." : ""}

${tableRules}

GAME
${card ?? name}`;
}

export const askFinn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { gameId: string; mode: CoachMode; messages: CoachMessage[] }) => {
    if (!validGameId(input?.gameId)) throw new Error("Missing game");
    if (input.mode !== "teach" && input.mode !== "table") throw new Error("Bad mode");
    return {
      gameId: input.gameId,
      mode: input.mode,
      messages: normalizeMessages(input.messages),
    };
  })
  .handler(async ({ data, context }) => {
    const { requireFinnPremium } = await import("./premium-entitlement.server");
    await requireFinnPremium(context.userId);
    if (CATALOG_EXTERNAL_ID_CONFLICTS.some((conflict) => conflict.externalId === data.gameId)) {
      return { ok: false as const, error: "ambiguous-game" };
    }
    if (!brief(data.gameId)) return { ok: false as const, error: "unknown-game" };
    const key = apiKey();
    if (!key) return { ok: false as const, error: "unavailable" };

    const last = data.messages.at(-1);
    if (!last || last.role !== "user") {
      return { ok: false as const, error: "empty" };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_COACH_MODEL || "grok-4.3",
        temperature: 0.2,
        max_tokens: data.mode === "table" ? 220 : 420,
        messages: [
          { role: "system", content: systemPrompt(data.gameId, data.mode) },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: `xAI API error ${res.status}` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = responseText(body.choices?.[0]?.message?.content);
    if (!text) return { ok: false as const, error: "empty-reply" };
    return { ok: true as const, text, sourceStatus: "general" as const };
  });

export const stripForSpeech = cleanSpeech;

const LESSON_PROMPT = `Write the FULL spoken lesson as JSON only, keys: goal, setup, turn, score, oops.
- goal: how someone wins
- setup: how to set the table
- turn: one complete turn, as if we are playing now
- score: scoring and the end of the game
- oops: the three mistakes first-timers always make
Each value is 4-7 spoken sentences of general AI teaching, not verified against an authorized rulebook. Do not claim official status. If uncertain about an edition-specific detail, say so rather than inventing it. No markdown, no labels inside the strings, no emoji. If this is Stockpile: call it Stockpile only. Never Skip-Bo, Skipbo, or Uno.`;

export const askFinnLesson = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { gameId: string }) => ({
    gameId: validGameId(input?.gameId) ? input.gameId : "",
  }))
  .handler(async ({ data, context }) => {
    const { requireFinnPremium } = await import("./premium-entitlement.server");
    await requireFinnPremium(context.userId);
    if (CATALOG_EXTERNAL_ID_CONFLICTS.some((conflict) => conflict.externalId === data.gameId)) {
      return { ok: false as const, error: "ambiguous-game" };
    }
    if (!brief(data.gameId)) return { ok: false as const, error: "unknown-game" };
    const key = apiKey();
    if (!key) return { ok: false as const, error: "unavailable" };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_COACH_MODEL || "grok-4.3",
        temperature: 0.4,
        max_tokens: 1800,
        messages: [
          { role: "system", content: systemPrompt(data.gameId, "teach") },
          { role: "user", content: LESSON_PROMPT },
        ],
      }),
    });

    if (!res.ok) return { ok: false as const, error: `xAI API error ${res.status}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = body.choices?.[0]?.message?.content;
    const pack = parseLesson(raw);
    if (!pack) return { ok: false as const, error: "empty-reply" };
    return { ok: true as const, pack, sourceStatus: "general" as const };
  });

export const speakFinn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { text: string }) => ({
    text:
      typeof input?.text === "string" && input.text.length <= 1200
        ? stripForSpeech(input.text)
        : "",
  }))
  .handler(async ({ data, context }) => {
    const { requireFinnPremium } = await import("./premium-entitlement.server");
    await requireFinnPremium(context.userId);
    const key = apiKey();
    if (!key) return { ok: false as const, error: "unavailable" };
    if (!data.text) return { ok: false as const, error: "empty" };

    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        text: data.text,
        voice_id: FINN_VOICE,
        language: "en",
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: `xAI TTS error ${res.status}` };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "";
    if (
      !/^audio\/(mpeg|mp4|wav|ogg|webm)(?:;.*)?$/i.test(mime) ||
      !buf.length ||
      buf.length > 2000000
    )
      return { ok: false as const, error: "invalid-audio" };
    return {
      ok: true as const,
      mime,
      audioBase64: buf.toString("base64"),
    };
  });

export const hearFinn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { audioBase64: string; mime: string }) => ({
    audioBase64: typeof input?.audioBase64 === "string" ? input.audioBase64 : "",
    mime: typeof input?.mime === "string" ? input.mime : "",
  }))
  .handler(async ({ data, context }) => {
    const { requireFinnPremium } = await import("./premium-entitlement.server");
    await requireFinnPremium(context.userId);
    const key = apiKey();
    if (!key) return { ok: false as const, error: "unavailable" };
    if (!data.audioBase64 || data.audioBase64.length < 80) {
      return { ok: false as const, error: "empty" };
    }
    if (data.audioBase64.length > 1_800_000) {
      return { ok: false as const, error: "too-long" };
    }

    if (!validAudio(data.audioBase64, data.mime))
      return { ok: false as const, error: "invalid-audio" };
    const bin = Buffer.from(data.audioBase64, "base64");
    const bytes = new Uint8Array(bin);
    const ext = data.mime.includes("mp4")
      ? "mp4"
      : data.mime.includes("ogg")
        ? "ogg"
        : data.mime.includes("wav")
          ? "wav"
          : "webm";
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: data.mime || "audio/webm" }), `speech.${ext}`);

    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });

    if (!res.ok) {
      return { ok: false as const, error: `xAI STT error ${res.status}` };
    }

    const body = (await res.json()) as { text?: string; transcript?: string };
    const text = responseText(body.text ?? body.transcript);
    if (!text) return { ok: false as const, error: "empty" };
    return { ok: true as const, text };
  });
