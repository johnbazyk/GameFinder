import { createWorker, OEM, PSM } from "tesseract.js";
import { rotateScanPhoto, scanTitleBand } from "./scan-photo";
import { GAMES } from "./catalog";
import { findBoxTitles } from "./box-titles";
import type { ScanHit } from "./scan";

export async function createBoxReader(signal: AbortSignal) {
  const base = new URL(import.meta.env.BASE_URL + "scan-ocr/", location.origin);
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: new URL("worker.min.js", base).href,
    corePath: new URL("tesseract-core-lstm.wasm.js", base).href,
    langPath: base.href,
    workerBlobURL: false,
    // Jobs propagate decoding failures through the returned promise.
    errorHandler: () => {},
  });
  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    signal.removeEventListener("abort", close);
    void worker.terminate();
  }
  signal.addEventListener("abort", close, { once: true });
  try {
    signal.throwIfAborted();
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
  } catch (error) {
    close();
    throw error;
  }
  return {
    close,
    async read(photo: HTMLCanvasElement): Promise<ScanHit[]> {
      const hits = new Map<string, ScanHit>();
      function* views() {
        yield photo;
        yield scanTitleBand(photo, false);
        yield scanTitleBand(photo, true);
        yield rotateScanPhoto(photo, 1);
        yield rotateScanPhoto(photo, -1);
      }
      for (const view of views()) {
        signal.throwIfAborted();
        const result = await worker.recognize(view);
        for (const game of findBoxTitles(result.data.text, GAMES)) {
          hits.set(game.bggId, { bggId: game.bggId, name: game.name, confidence: "review" });
        }
      }
      return [...hits.values()];
    },
  };
}
