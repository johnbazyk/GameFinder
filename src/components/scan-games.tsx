import { useEffect, useRef, useState } from "react";
import { Camera, Images, X } from "lucide-react";
import { toast } from "sonner";
import { openScanPhoto, remoteScanImage } from "@/lib/scan-photo";
import { identifyShelf } from "@/lib/scan";
import { mergeScanRows, type ScanRow } from "@/lib/scan-review";
import { boxTitleKey } from "@/lib/box-titles";
import type { createBoxReader } from "@/lib/box-ocr";
import { useAppStore } from "@/lib/store";
import { FREE_VAULT_LIMIT } from "@/lib/types";
import { Button } from "./ui/button";
import { AddGameDialog } from "./add-game-dialog";

export function ScanGames({ open, onClose }: { open: boolean; onClose: () => void }) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState(false);
  const owned = useAppStore((s) => s.owned);
  const premium = useAppStore((s) => s.isPremium);
  const available = premium ? Infinity : Math.max(0, FREE_VAULT_LIMIT - owned.length);
  const selected = rows.filter((row) => row.selected && !(row.bggId && owned.includes(row.bggId)));
  useEffect(() => () => request.current?.abort(), []);

  if (!open) return null;
  function close() {
    request.current?.abort();
    request.current = null;
    setProgress("");
    setMessage("");
    setRows([]);
    setManual(false);
    onClose();
  }

  async function scan(files: File[]) {
    if (!files.length || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const signal = controller.signal;
    const cancelled = new Promise<never>((_, reject) =>
      signal.addEventListener("abort", () => reject(signal.reason), { once: true }),
    );
    // Cancellation may happen while the browser is still decoding a file.
    void cancelled.catch(() => {});
    let reader: Awaited<ReturnType<typeof createBoxReader>> | undefined;
    let readerUnavailable = false;
    let unread = 0;
    let empty = 0;
    try {
      for (let index = 0; index < files.length; index++) {
        signal.throwIfAborted();
        setProgress(`Reading photo ${index + 1} of ${files.length}…`);
        const file = files[index];
        const photo = await openScanPhoto(file).catch(() => null);
        if (!photo) {
          unread++;
          continue;
        }
        const remoteTask = Promise.resolve()
          .then(() => {
            signal.throwIfAborted();
            return identifyShelf({ data: { image: remoteScanImage(photo) }, signal });
          })
          .catch(() => null);
        const localTask = (async () => {
          if (readerUnavailable) return null;
          if (!reader) {
            try {
              const { createBoxReader } = await import("@/lib/box-ocr");
              reader = await createBoxReader(signal);
            } catch {
              readerUnavailable = true;
              return null;
            }
          }
          return reader.read(photo);
        })().catch(() => null);
        const [remote, local] = await Promise.race([
          Promise.all([remoteTask, localTask]),
          cancelled,
        ]);
        signal.throwIfAborted();
        const hits = [...(remote?.ok ? remote.hits : []), ...(local ?? [])];
        if (hits.length) {
          setRows((prev) => mergeScanRows(prev, hits, useAppStore.getState().owned));
        } else if (!remote?.ok && local === null) {
          unread++;
        } else {
          empty++;
        }
      }
      signal.throwIfAborted();
      setMessage(
        [
          unread ? `Couldn’t read ${unread} photo${unread === 1 ? "" : "s"}.` : "",
          empty ? `No titles recognized in ${empty} photo${empty === 1 ? "" : "s"}.` : "",
          unread || empty ? "Add another angle or search for a missing title." : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
    } catch {
      if (!signal.aborted) setMessage("Scanning stopped. Your matches are ready to review.");
    } finally {
      reader?.close();
      if (request.current === controller) {
        request.current = null;
        setProgress("");
      }
    }
  }

  function pick(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    input.value = "";
    void scan(files);
  }

  function addSelected() {
    const store = useAppStore.getState();
    if (!selected.length) return;
    if (selected.length > available) {
      store.setUpgradePrompt(
        `You have room for ${available} more games. Select fewer games or use Premium for an unlimited Vault.`,
      );
      return;
    }
    let added = 0;
    for (const row of selected) {
      let id = row.bggId;
      if (!id) {
        const existing = useAppStore
          .getState()
          .customGames.find((game) => boxTitleKey(game.title) === boxTitleKey(row.name));
        id = (existing ?? store.addCustomGame(row.name)).id;
      }
      if (store.addOwned(id) === "ok") added++;
    }
    toast(`Added ${added} to your vault.`);
    close();
  }
  const canSelect = (row: ScanRow) =>
    row.bggId
      ? !owned.includes(row.bggId)
      : !!row.name.trim() &&
        row.name.trim().length <= 120 &&
        !/^(unknown|unidentified)( box| game)?$/i.test(row.name);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/40 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-label="Scan games"
        className="flex max-h-[92dvh] w-full max-w-lg flex-col gap-3 rounded-t-2xl bg-background p-4 shadow-lift sm:rounded-2xl"
      >
        <header className="flex items-center justify-between">
          <h2 className="font-display text-xl">
            {rows.length ? "Review games found" : "Scan games"}
          </h2>
          <button
            onClick={close}
            aria-label="Close scanner"
            className="grid size-10 place-items-center"
          >
            <X />
          </button>
        </header>
        <input
          className="hidden"
          type="file"
          accept="image/*"
          capture="environment"
          ref={camera}
          onChange={(e) => pick(e.target)}
        />
        <input
          className="hidden"
          type="file"
          accept="image/*"
          multiple
          ref={gallery}
          onChange={(e) => pick(e.target)}
        />
        {!rows.length && (
          <p className="text-sm">
            Photograph a box or add several shelf photos. Review the games together. Photos are
            discarded after scanning.
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!!progress} onClick={() => camera.current?.click()}>
            <Camera />
            Take photo
          </Button>
          <Button
            variant="secondary"
            disabled={!!progress}
            onClick={() => gallery.current?.click()}
          >
            <Images />
            Add photos
          </Button>
        </div>
        <p role="status" className="empty:hidden text-sm text-muted-foreground">
          {progress || message}
        </p>
        {rows.length > 0 && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span>{selected.length} selected</span>
              <button
                onClick={() => {
                  const all = rows.filter(canSelect).every((r) => r.selected);
                  setRows((prev) =>
                    prev.map((row) => ({ ...row, selected: !all && canSelect(row) })),
                  );
                }}
                className="font-semibold text-sky"
              >
                {rows.filter(canSelect).length && rows.filter(canSelect).every((r) => r.selected)
                  ? "Clear selection"
                  : "Select all"}
              </button>
            </div>
            <ul className="min-h-0 overflow-y-auto divide-y divide-border">
              {rows.map((row) => (
                <li key={row.bggId ?? row.name}>
                  <label className="flex items-center justify-between gap-3 py-2">
                    <span>
                      <span className="block font-semibold">{row.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.bggId && owned.includes(row.bggId)
                          ? "Already in vault"
                          : !row.bggId
                            ? "Outside catalog · Add as custom game"
                            : row.confidence === "high"
                              ? "Catalog match"
                              : "Check this match"}
                      </span>
                    </span>
                    {canSelect(row) && (
                      <input
                        type="checkbox"
                        className="size-5 accent-fox"
                        checked={row.selected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRows((prev) =>
                            prev.map((r) => (r === row ? { ...r, selected: checked } : r)),
                          );
                        }}
                      />
                    )}
                  </label>
                </li>
              ))}
            </ul>
            <Button disabled={!!progress || !selected.length} onClick={addSelected}>
              Add selected to Vault
            </Button>
          </>
        )}
        <button
          type="button"
          className="text-sm font-semibold text-sky"
          onClick={() => setManual(true)}
        >
          Search or add a missing title
        </button>
      </div>
      <AddGameDialog open={manual} onClose={() => setManual(false)} />
    </div>
  );
}
