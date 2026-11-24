import { createWorker, OEM, PSM } from "tesseract.js";
import { diagonalScanPhoto, enhancedScanPhoto, rotateScanPhoto, scanTitleBand, shelfRegions } from "./scan-photo";
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
    async read(photo: HTMLCanvasElement, onHit?: (hit: ScanHit) => void): Promise<ScanHit[]> {
      const hits = new Map<string, ScanHit>();
      function* temporary(canvas: HTMLCanvasElement) {
        try {
          yield canvas;
        } finally {
          canvas.width = canvas.height = 0;
        }
      }
      let readingTurn: 0 | 1 | -1 | 2 = 0;
      const directionHits = new Map<0 | 1 | -1 | 2, Set<string>>();
      function* views() {
        for (const turn of [0, 1, -1, 2] as const) {
          readingTurn = turn;
          const upright = turn === 0 ? photo : rotateScanPhoto(photo, turn);
          try {
            yield upright;
            yield* temporary(scanTitleBand(upright, false));
            yield* temporary(scanTitleBand(upright, true));
          } finally {
            if (upright !== photo) upright.width = upright.height = 0;
          }
        }
        for (const mode of ["compactRed", "redInk", "red", "detail", "warm", "green"] as const) {
          const enhanced = enhancedScanPhoto(photo, mode);
          try {
            for (const turn of [0, -1, 1, 2] as const) {
              readingTurn = turn;
              if (turn === 0) yield enhanced;
              else yield* temporary(rotateScanPhoto(enhanced, turn));
            }
          } finally {
            enhanced.width = enhanced.height = 0;
          }
        }
      }
      async function recognize(view: HTMLCanvasElement, deskew = false) {
        signal.throwIfAborted();
        const result = await worker.recognize(view, { rotateAuto: deskew });
        for (const game of findBoxTitles(result.data.text, GAMES)) {
          const ids = directionHits.get(readingTurn) ?? new Set<string>();
          ids.add(game.bggId);
          directionHits.set(readingTurn, ids);
          if (!hits.has(game.bggId)) {
            const hit: ScanHit = { bggId: game.bggId, name: game.name, confidence: "review" };
            hits.set(game.bggId, hit);
            onHit?.(hit);
          }
        }
      }
      for (const view of views()) await recognize(view);
      if (hits.size >= 2) {
        // Limit extra mobile OCR work to the two orientations with the most catalog evidence.
        const directions = [...directionHits].sort((a, b) => b[1].size - a[1].size).slice(0, 2);
        for (const [turn] of directions) {
          readingTurn = turn;
          const upright = turn === 0 ? photo : rotateScanPhoto(photo, turn);
          try {
            for (const region of shelfRegions(upright)) await recognize(region);
          } finally {
            if (upright !== photo) upright.width = upright.height = 0;
          }
        }
      }
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
