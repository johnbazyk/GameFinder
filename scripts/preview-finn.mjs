import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createServer } from "vite";

const directory = "src/assets/finn-catan-preview";
const voice = "Fpv7tRpijRKcLHlr0BAF";

function isMp3(bytes) {
  return (
    bytes.length > 1000 &&
    (bytes.toString("ascii", 0, 3) === "ID3" || (bytes[0] === 255 && (bytes[1] & 224) === 224))
  );
}

async function generate() {
  const vite = await createServer({
    configFile: false,
    server: { middlewareMode: true, watch: null },
  });
  let clips;
  try {
    const { guides } = await vite.ssrLoadModule("/src/lib/written-guides.ts");
    const { chapters } = await vite.ssrLoadModule("/src/lib/guide-chapters.ts");
    const { sevenAnswer } = await vite.ssrLoadModule("/src/lib/catan-voice-preview.ts");
    clips = chapters.map(({ id, field }) => [id, guides.Catan[field]]);
    clips.push(["seven", sevenAnswer]);
  } finally {
    await vite.close();
  }

  await mkdir(directory, { recursive: true });
  for (const [id, text] of clips) {
    const path = directory + "/" + id + ".mp3";
    const existing = await readFile(path).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    if (existing && isMp3(existing)) continue;
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key)
      throw new Error("Set ELEVENLABS_API_KEY in your terminal to generate Finn’s recordings.");
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/" + voice + "?output_format=mp3_44100_128",
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
        signal: AbortSignal.timeout(90000),
      },
    );
    if (!response.ok) {
      const detail = (await response.json().catch(() => null))?.detail;
      throw new Error(
        "ElevenLabs returned HTTP " +
          response.status +
          " for " +
          id +
          (typeof detail?.status === "string" ? " (" + detail.status + ")" : "") +
          ". Check your key, voice access and credits, then rerun to resume.",
      );
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!isMp3(bytes)) throw new Error("ElevenLabs returned invalid audio for " + id);
    const temp = path + "." + randomUUID() + ".tmp";
    try {
      await writeFile(temp, bytes);
      await rename(temp, path);
    } finally {
      await rm(temp, { force: true });
    }
    console.log("Saved Finn’s " + id + " recording.");
  }
  console.log("Finn’s six recordings are ready. Open Catan → Teach me.");
}

generate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
