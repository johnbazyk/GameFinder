export const LESSON_IDS = ["goal", "setup", "turn", "score", "oops"] as const;
export type LessonId = (typeof LESSON_IDS)[number];
export type LessonPack = Record<LessonId, string>;

export function cleanSpeech(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim()
    .slice(0, 1200);
}
export function validateLesson(value: unknown): LessonPack | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  if (Object.keys(obj).length !== LESSON_IDS.length) return null;
  const pack = {} as LessonPack;
  for (const id of LESSON_IDS) {
    const raw = obj[id];
    if (typeof raw !== "string" || raw.length > 1200) return null;
    const text = cleanSpeech(raw);
    if (text.length < 40) return null;
    pack[id] = text;
  }
  return new Set(Object.values(pack)).size === LESSON_IDS.length ? pack : null;
}
export function parseLesson(raw: unknown) {
  if (typeof raw !== "string" || raw.length > 10000) return null;
  try {
    return validateLesson(
      JSON.parse(
        raw
          .trim()
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, ""),
      ),
    );
  } catch {
    return null;
  }
}
export function validGameId(value: unknown): value is string {
  return typeof value === "string" && /^\d{1,32}$/.test(value);
}
export function normalizeMessages(
  value: unknown,
): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(value)) return [];
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const row of value.slice(-10)) {
    if (!row || !["user", "assistant"].includes(row.role) || typeof row.content !== "string")
      return [];
    const content = row.content.trim();
    if (!content || content.length > 1600) return [];
    out.push({ role: row.role, content });
  }
  return out.at(-1)?.role === "user" ? out : [];
}
export function responseText(value: unknown, max = 1600): string | null {
  if (typeof value !== "string" || !value.trim() || value.length > max) return null;
  return value.trim();
}
export function validAudio(base64: unknown, mime: unknown) {
  return (
    typeof base64 === "string" &&
    base64.length >= 80 &&
    base64.length <= 1800000 &&
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64) &&
    typeof mime === "string" &&
    /^audio\/(?:webm|ogg|wav|mp4|mpeg)(?:;\s*codecs=[\w.-]+)?$/i.test(mime)
  );
}
