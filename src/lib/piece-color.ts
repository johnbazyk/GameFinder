export const PIECE_COLORS = [
  { id: "fox", hex: "#e8642b", label: "Fox" },
  { id: "moss", hex: "#4a6b4d", label: "Moss" },
  { id: "sky", hex: "#7fa8c9", label: "Sky" },
  { id: "berry", hex: "#a63d57", label: "Berry" },
  { id: "gold", hex: "#c9a227", label: "Gold" },
  { id: "teal", hex: "#2a6f6f", label: "Teal" },
  { id: "plum", hex: "#6b4a8f", label: "Plum" },
  { id: "walnut", hex: "#8b5a2b", label: "Walnut" },
] as const;

export type PieceColorHex = (typeof PIECE_COLORS)[number]["hex"];

export const DEFAULT_PIECE_COLOR: PieceColorHex = "#e8642b";

export function isPieceColor(value: string): value is PieceColorHex {
  return PIECE_COLORS.some((c) => c.hex === value);
}

export function normalizePieceColor(value: unknown, fallback = DEFAULT_PIECE_COLOR): PieceColorHex {
  const v = String(value ?? "").trim().toLowerCase();
  const hit = PIECE_COLORS.find((c) => c.hex === v);
  return hit?.hex ?? fallback;
}
