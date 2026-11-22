import { useEffect, useRef, useState } from "react";
import { prepareScanPhoto } from "@/lib/scan-photo";
import { Camera, Search, X } from "lucide-react";
import { toast } from "sonner";
import { identifyShelf, type ScanHit } from "@/lib/scan";
import { getGame } from "@/lib/scoring";
import { useAppStore } from "@/lib/store";
import { FREE_VAULT_LIMIT } from "@/lib/types";
import { GameCover } from "./game-cover";
import { Button } from "./ui/button";
import { AddGameDialog } from "./add-game-dialog";

type Row = ScanHit & { selected: boolean };

export function ScanGames({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [manual, setManual] = useState(false);
  const request = useRef<AbortController | null>(null);
  const [message, setMessage] = useState("");
  const owned = useAppStore((s) => s.owned);
  const addOwned = useAppStore((s) => s.addOwned);
  const isPremium = useAppStore((s) => s.isPremium);
  const setUpgradePrompt = useAppStore((s) => s.setUpgradePrompt);

  useEffect(() => () => request.current?.abort(), []);

  if (!open) return null;

  function close() {
    request.current?.abort();
    setBusy(false);
    setRows(null);
    setManual(false);
    onClose();
  }

  async function onFile(file: File) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setRows(null);
    setMessage("");
    let photo: string;
    try {
      photo = await prepareScanPhoto(file);
    } catch {
      if (!controller.signal.aborted) {
        setMessage("This photo could not be opened. Try a JPEG or PNG.");
        setRows([]);
        setBusy(false);
      }
      return;
    }
    try {
      if (controller.signal.aborted) return;
      const remote = await identifyShelf({
        data: { image: photo },
        signal: controller.signal,
      }).catch(() => null);
      if (controller.signal.aborted) return;
      let hits = remote?.ok ? remote.hits : [];
      if (!hits.some((hit) => hit.bggId)) {
        const { readBoxTitles } = await import("@/lib/box-ocr");
        const local = await readBoxTitles(photo, controller.signal);
        const ids = new Set(local.map((hit) => hit.name.toLowerCase()));
        hits = [...local, ...hits.filter((hit) => !ids.has(hit.name.toLowerCase()))];
      }
      if (controller.signal.aborted) return;
      setMessage("No catalog titles found. Try a closer photo with the box titles upright.");
      setRows(
        hits.map((hit) => ({
          ...hit,
          selected:
            hit.confidence === "high" && Boolean(hit.bggId) && !owned.includes(hit.bggId ?? ""),
        })),
      );
    } catch {
      if (!controller.signal.aborted) {
        setMessage("Scanning is unavailable. Try again or search by title.");
        setRows([]);
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  function addSelected() {
    const picked = (rows ?? []).filter((r) => r.selected && r.bggId);
    const room = isPremium ? picked.length : Math.max(0, FREE_VAULT_LIMIT - owned.length);
    if (!isPremium && picked.length > room) {
      setUpgradePrompt(
        `You selected ${picked.length} games. Free vaults hold up to ${FREE_VAULT_LIMIT} games. Add ${room} now, or upgrade to GameFinder Premium for unlimited vault storage.`,
      );
    }
    let added = 0;
    for (const r of picked) {
      if (!r.bggId) continue;
      const res = addOwned(r.bggId);
      if (res === "limit") break;
      if (res === "ok") added += 1;
    }
    if (added) toast(`Added ${added} to your vault.`);
    close();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/40 sm:items-center sm:p-6">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl bg-background shadow-lift sm:rounded-2xl">
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="font-display text-xl">
            {rows?.length ? "Review Games Found" : "Scan Games"}
          </h2>
          <button
            type="button"
            onClick={close}
            className="grid size-10 place-items-center rounded-button hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
            e.target.value = "";
          }}
        />

        {!rows ? (
          <div className="px-4 pb-8 pt-4">
            <p className="text-sm text-muted-foreground">
              Photograph one box, a whole shelf, or a table. Finn identifies what's visible, then
              you confirm. Photos are not stored.
            </p>
            <Button
              size="xl"
              className="mt-6 w-full"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="size-5" />
              {busy ? "Identifying…" : "Take or upload a photo"}
            </Button>
            <button
              type="button"
              className="mt-4 w-full text-center text-sm font-semibold text-sky"
              onClick={() => setManual(true)}
            >
              Can't scan it? Search by title.
            </button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <ul className="flex-1 overflow-y-auto px-3 pb-4">
              {rows.length === 0 ? (
                <li className="px-2 py-8 text-center text-sm text-muted-foreground">{message}</li>
              ) : (
                rows.map((row, i) => {
                  const game = row.bggId ? getGame(row.bggId) : undefined;
                  const inVault = row.bggId ? owned.includes(row.bggId) : false;
                  return (
                    <li key={`${row.name}-${i}`} className="flex items-center gap-3 px-1 py-2">
                      {game ? (
                        <GameCover game={game} className="h-14 w-10" />
                      ) : (
                        <div className="h-14 w-10 rounded-[10px] bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {inVault
                            ? "Already in vault"
                            : row.confidence === "high"
                              ? "High confidence"
                              : row.confidence === "review"
                                ? "Needs review"
                                : "Could not identify"}
                          {row.possibleExpansion ? " · Possible expansion" : ""}
                        </p>
                      </div>
                      {row.bggId && !inVault ? (
                        <input
                          type="checkbox"
                          className="size-5 accent-fox"
                          checked={row.selected}
                          onChange={(e) =>
                            setRows((cur) =>
                              (cur ?? []).map((r, idx) =>
                                idx === i ? { ...r, selected: e.target.checked } : r,
                              ),
                            )
                          }
                        />
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>
            <div className="space-y-2 border-t border-border px-4 py-4">
              <Button
                className="w-full"
                size="lg"
                disabled={!rows.some((row) => row.selected)}
                onClick={addSelected}
              >
                Add Selected to Vault
              </Button>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => {
                    setRows(null);
                    inputRef.current?.click();
                  }}
                >
                  Scan again
                </Button>
                <Button className="flex-1" variant="ghost" onClick={() => setManual(true)}>
                  <Search className="size-4" />
                  Search manually
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AddGameDialog open={manual} onClose={() => setManual(false)} />
    </div>
  );
}
