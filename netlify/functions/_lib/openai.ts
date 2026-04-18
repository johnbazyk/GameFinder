const EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/embeddings";

interface EmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { total_tokens: number };
}

export async function embedBatch(
  texts: string[],
): Promise<{ embeddings: number[][]; usage: { total_tokens: number } }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");
  if (texts.length === 0) {
    return { embeddings: [], usage: { total_tokens: 0 } };
  }

  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`openai embeddings http ${res.status}: ${body.slice(0, 200)}`);
  }

  const payload = (await res.json()) as EmbeddingResponse;
  const embeddings = payload.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);

  if (embeddings.length !== texts.length) {
    throw new Error(
      `openai embeddings count mismatch: expected ${texts.length}, got ${embeddings.length}`,
    );
  }
  return { embeddings, usage: payload.usage };
}
