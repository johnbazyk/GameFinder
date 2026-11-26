import type { ScanHit } from "./scan";

export type BarcodeReference = { gtin: string; bggId: string; name: string; source: string };
/** Only publisher/authorized, edition-specific product mappings belong here. */
export const APPROVED_BARCODE_REFERENCES: readonly BarcodeReference[] = [];

export function normalizeGtin(raw: string): string | null {
  const code = raw.trim();
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return null;
  const digits = code.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check ? code.padStart(14, "0") : null;
}
export function matchBarcode(raw: string, refs: readonly BarcodeReference[]): ScanHit | null {
  const key = normalizeGtin(raw);
  if (!key) return null;
  const matches = refs.filter((r) => r.source.trim() && normalizeGtin(r.gtin) === key);
  if (matches.length !== 1) return null;
  const { bggId, name } = matches[0];
  return { bggId, name, confidence: "review" };
}
export async function readLocalBarcodes(photo: HTMLCanvasElement, signal: AbortSignal) {
  const Detector = (
    globalThis as typeof globalThis & {
      BarcodeDetector?: new (options: { formats: string[] }) => {
        detect(image: HTMLCanvasElement): Promise<{ rawValue: string }[]>;
      };
    }
  ).BarcodeDetector;
  if (!Detector) return { supported: false, count: 0, hits: [] as ScanHit[] };
  try {
    signal.throwIfAborted();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const detection = new Detector({ formats: ["ean_8", "ean_13", "upc_a"] }).detect(photo);
    const detected = await Promise.race([
      detection,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Barcode timeout")), 2500);
      }),
    ]).finally(() => clearTimeout(timer));
    signal.throwIfAborted();
    const codes = [
      ...new Set(
        detected.map((d) => normalizeGtin(d.rawValue)).filter((v): v is string => v !== null),
      ),
    ];
    return {
      supported: true,
      count: codes.length,
      hits: codes
        .map((c) => matchBarcode(c, APPROVED_BARCODE_REFERENCES))
        .filter((h): h is ScanHit => h !== null),
    };
  } catch {
    return { supported: false, count: 0, hits: [] as ScanHit[] };
  }
}
