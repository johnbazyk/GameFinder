import Anthropic from "@anthropic-ai/sdk";
import { buildExtractionPrompt, RETRY_REMINDER } from "./extraction-prompt";

export interface ExtractedChunk {
  content: string;
  topic: "rules" | "setup" | "strategy" | "faq" | "edge-case";
  confidence: number;
}

export interface ExtractUsage {
  input_tokens: number;
  output_tokens: number;
}

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 16000;
const VALID_TOPICS = new Set(["rules", "setup", "strategy", "faq", "edge-case"]);

function extractTextBlock(message: Anthropic.Message): string {
  for (const block of message.content) {
    if (block.type === "text") return block.text;
  }
  return "";
}

function validateChunks(raw: unknown): ExtractedChunk[] {
  if (!Array.isArray(raw)) {
    throw new Error("extraction response is not a JSON array");
  }
  const out: ExtractedChunk[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const content = obj.content;
    const topic = obj.topic;
    const confidence = obj.confidence;
    if (typeof content !== "string" || content.length === 0) continue;
    if (typeof topic !== "string" || !VALID_TOPICS.has(topic)) continue;
    if (typeof confidence !== "number" || !Number.isFinite(confidence)) continue;
    out.push({
      content,
      topic: topic as ExtractedChunk["topic"],
      confidence: Math.max(0, Math.min(1, confidence)),
    });
  }
  return out;
}

async function callHaiku(
  client: Anthropic,
  systemPrompt: string,
  markdown: string,
  retryReminder?: string,
): Promise<{ text: string; usage: ExtractUsage }> {
  const userContent = retryReminder
    ? `${retryReminder}\n\n---\n\n${markdown}`
    : markdown;

  const message = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: systemPrompt,
    messages: [
      { role: "user", content: userContent },
      { role: "assistant", content: "[" },
    ],
  });

  // Prefill means the assistant response starts after "[". Re-prepend it so
  // the concatenation is a parseable JSON array.
  const text = "[" + extractTextBlock(message);
  return {
    text,
    usage: {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
    },
  };
}

export async function extractChunks(
  rawMarkdown: string,
  gameName: string,
  gameDescription: string,
): Promise<{ chunks: ExtractedChunk[]; usage: ExtractUsage }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  const client = new Anthropic({ apiKey });
  const systemPrompt = buildExtractionPrompt(gameName, gameDescription);

  const totalUsage: ExtractUsage = { input_tokens: 0, output_tokens: 0 };

  // First attempt.
  const first = await callHaiku(client, systemPrompt, rawMarkdown);
  totalUsage.input_tokens += first.usage.input_tokens;
  totalUsage.output_tokens += first.usage.output_tokens;
  try {
    return { chunks: validateChunks(JSON.parse(first.text)), usage: totalUsage };
  } catch {
    // fall through to retry
  }

  // Retry once with a terser reminder.
  const second = await callHaiku(client, systemPrompt, rawMarkdown, RETRY_REMINDER);
  totalUsage.input_tokens += second.usage.input_tokens;
  totalUsage.output_tokens += second.usage.output_tokens;
  try {
    return { chunks: validateChunks(JSON.parse(second.text)), usage: totalUsage };
  } catch (err) {
    const preview = second.text.slice(0, 500);
    throw new Error(
      `extraction JSON parse failed after retry: ${err instanceof Error ? err.message : String(err)} | first 500 chars: ${preview}`,
    );
  }
}
