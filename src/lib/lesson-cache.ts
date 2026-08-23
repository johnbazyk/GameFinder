import { askFinnLesson, type LessonPack } from "@/lib/coach";

const KEY = "gf-lesson-packs-v1";
const TTL_MS = 14 * 24 * 60 * 60 * 1000;
const inflight = new Map<string, Promise<LessonPack | null>>();
const refreshed = new Set<string>();
let queue: Promise<void> = Promise.resolve();

type Row = { at: number; pack: LessonPack };
type Store = Record<string, Row>;

function readStore(): Store {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota — drop oldest */
    const entries = Object.entries(store).sort((a, b) => a[1].at - b[1].at);
    const slim = Object.fromEntries(entries.slice(-8));
    try {
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch {
      /* give up */
    }
  }
}

export function peekLesson(gameId: string): LessonPack | null {
  const row = readStore()[gameId];
  if (!row?.pack) return null;
  if (Date.now() - row.at > TTL_MS) return null;
  return row.pack;
}

async function fetchPack(gameId: string): Promise<LessonPack | null> {
  const existing = inflight.get(gameId);
  if (existing) return existing;
  const run = (async () => {
    const res = await askFinnLesson({ data: { gameId } });
    if (!res.ok) return null;
    const store = readStore();
    store[gameId] = { at: Date.now(), pack: res.pack };
    writeStore(store);
    refreshed.add(gameId);
    return res.pack;
  })();
  inflight.set(gameId, run);
  try {
    return await run;
  } finally {
    inflight.delete(gameId);
  }
}

/** Instant cache hit, then a quiet refresh once per session. */
export async function ensureLesson(gameId: string): Promise<LessonPack | null> {
  const hit = peekLesson(gameId);
  if (hit) {
    if (!refreshed.has(gameId)) {
      refreshed.add(gameId);
      void fetchPack(gameId);
    }
    return hit;
  }
  return fetchPack(gameId);
}

/** One-at-a-time warmup for tonight's recs. Skips titles already cached. */
export function prefetchLessons(gameIds: string[]) {
  const ids = [...new Set(gameIds.filter(Boolean))].slice(0, 4);
  for (const id of ids) {
    if (peekLesson(id) || inflight.has(id)) continue;
    queue = queue.then(() => fetchPack(id).then(() => undefined)).catch(() => undefined);
  }
}
