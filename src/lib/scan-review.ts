import { boxTitleKey } from "./box-titles";
import type { ScanHit } from "./scan";

export type ScanRow = ScanHit & { selected: boolean };
export function mergeScanRows(previous: ScanRow[], hits: ScanHit[], owned: string[]) {
  const key = (hit: ScanHit) => hit.bggId ?? "custom:" + boxTitleKey(hit.name);
  const rows = new Map(previous.map((row) => [key(row), row]));
  for (const hit of hits) {
    if (!hit.name.trim() || rows.has(key(hit))) continue;
    rows.set(key(hit), {
      ...hit,
      selected: hit.confidence === "high" && !!hit.bggId && !owned.includes(hit.bggId),
    });
  }
  return [...rows.values()];
}
