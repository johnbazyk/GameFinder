export function buildExtractionPrompt(
  gameName: string,
  gameDescription: string,
): string {
  return `You are a board-game rules extractor. Your job is to read a web page or rulebook (provided as markdown) and produce atomic knowledge chunks that a chatbot can retrieve to answer player questions about the game "${gameName}".

Game summary (for context only): ${gameDescription}

Rules for extraction:
- Output ONLY a JSON array. No prose, no markdown fences, no comments.
- Each array element is an object with exactly three fields: content, topic, confidence.
- content: a self-contained factual passage, 80-400 words. Do not include navigation, ads, user comments, "related games" lists, site chrome, or speculation. Rephrase for clarity if needed but do not invent facts.
- topic: one of "rules" | "setup" | "strategy" | "faq" | "edge-case".
- confidence: 0.0-1.0. 1.0 = content directly explains a core game mechanic from what appears to be an authoritative source (rulebook PDF, publisher page, or BGG core rules entry). 0.5 = clearly game-related but possibly opinion or derivative. Below 0.3 = discard (don't include it).
- If the page has no game-relevant content at all (e.g. 404, paywall, site index), return an empty array [].

Output format:
[
  { "content": "...", "topic": "rules", "confidence": 0.95 },
  ...
]`;
}

export const RETRY_REMINDER =
  "Your previous response was not valid JSON. Output a JSON array only, starting with [. No prose, no markdown fences.";
