import { createWorker, OEM, PSM } from "tesseract.js";
import { diagonalScanPhoto, enhancedScanPhoto, rotateScanPhoto, scanTitleBand } from "./scan-photo";
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
      function* temporary(canvas: HTMLCanvasElement) {
        try {
          yield canvas;
        } finally {
          canvas.width = canvas.height = 0;
        }
      }
      function* views() {
        for (const turn of [0, 1, -1, 2] as const) {
          const upright = turn === 0 ? photo : rotateScanPhoto(photo, turn);
          try {
            yield upright;
            yield* temporary(scanTitleBand(upright, false));
            yield* temporary(scanTitleBand(upright, true));
          } finally {
            if (upright !== photo) upright.width = upright.height = 0;
          }
        }
        for (const mode of ["red", "detail", "warm", "green"] as const) {
          const enhanced = enhancedScanPhoto(photo, mode);
          try {
            yield enhanced;
            yield* temporary(rotateScanPhoto(enhanced, -1));
            yield* temporary(rotateScanPhoto(enhanced, 1));
            yield* temporary(rotateScanPhoto(enhanced, 2));
          } finally {
            enhanced.width = enhanced.height = 0;
          }
        }
      }
      async function recognize(view: HTMLCanvasElement, deskew = false) {
        signal.throwIfAborted();
        const result = await worker.recognize(view, { rotateAuto: deskew });
        for (const game of findBoxTitles(result.data.text, GAMES)) {
          hits.set(game.bggId, { bggId: game.bggId, name: game.name, confidence: "review" });
        }
      }
      for (const view of views()) await recognize(view);
      if (!hits.size) {
        const diagonal = diagonalScanPhoto(photo);
        try {
          await recognize(diagonal, true);
          for (const turn of [1, -1, 2] as const) {
            for (const view of temporary(rotateScanPhoto(diagonal, turn))) await recognize(view, true);
          }
        } finally {
          diagonal.width = diagonal.height = 0;
        }
      }
      return [...hits.values()];
    },
  };
}
