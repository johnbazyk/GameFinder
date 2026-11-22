import { createWorker, OEM, PSM } from "tesseract.js";
import { standaloneGames } from "./catalog";
import { boxTitleKey } from "./box-titles";
import type { ScanHit } from "./scan";

// Assets come from this app. The fallback reads the photo on the device.
export async function readBoxTitles(image: string, signal: AbortSignal): Promise<ScanHit[]> {
  const base = new URL(import.meta.env.BASE_URL + "scan-ocr/", location.origin);
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: new URL("worker.min.js", base).href,
    corePath: new URL("tesseract-core-lstm.wasm.js", base).href,
    langPath: base.href,
    workerBlobURL: false,
  });
  try {
    signal.throwIfAborted();
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const result = await worker.recognize(image);
    signal.throwIfAborted();
    const lines = new Set(result.data.text.split(/\r?\n|\s*\|\s*| {2,}/).map(boxTitleKey));
    return standaloneGames()
      .filter((game) => lines.has(boxTitleKey(game.name)))
      .map((game) => ({ bggId: game.bggId, name: game.name, confidence: "review" }));
  } finally {
    await worker.terminate();
  }
}
