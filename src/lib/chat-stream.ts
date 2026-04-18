export type DoneEvent = {
  type: "done";
  session_id: string;
  message_id: string;
  similarity_top: number;
  retrieved_chunk_ids: string[];
  is_fallback: boolean;
  estimated_cost_usd: number;
};

export type ChatEvent =
  | { type: "delta"; content: string }
  | DoneEvent
  | { type: "error"; message: string };

export type ChatStreamResult =
  | { ok: true }
  | { ok: false; status: number; body: unknown };

export async function streamChat(
  input: { session_id: string; game_slug: string; message: string },
  onEvent: (ev: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<ChatStreamResult> {
  const res = await fetch("/.netlify/functions/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!res.ok || !res.body) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    return { ok: false, status: res.status, body };
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let evType = "message";
      let data = "";
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) evType = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;
      try {
        const parsed = JSON.parse(data);
        if (evType === "delta" || evType === "done" || evType === "error") {
          onEvent({ type: evType, ...parsed } as ChatEvent);
        }
      } catch {
        // ignore malformed
      }
    }
  }
  return { ok: true };
}
