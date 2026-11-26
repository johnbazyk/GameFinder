import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { Camera, Images, X } from "lucide-react";
import { toast } from "sonner";
import { openScanPhoto, remoteScanImage } from "@/lib/scan-photo";
import { identifyShelf, remoteScanAvailable, type ScanHit } from "@/lib/scan";
import { resolveScanEvidence } from "@/lib/scan-evidence";
import { readLocalBarcodes } from "@/lib/scan-barcode";
import { GAMES, CATALOG_EXTERNAL_ID_CONFLICTS } from "@/lib/catalog";
import { mergeScanRows, type ScanRow } from "@/lib/scan-review";
import { boxTitleKey } from "@/lib/box-titles";
import type { createBoxReader } from "@/lib/box-ocr";
import { useAppStore } from "@/lib/store";
import { FREE_VAULT_LIMIT } from "@/lib/types";
import { Button } from "./ui/button";
import { GameCharacterDetails } from "./game-character-details";
import { getGame } from "@/lib/scoring";
import { DEFAULT_WIZARD } from "@/lib/store";
import { FinnProcessing } from "./finn-processing";
import { AddGameDialog } from "./add-game-dialog";

export function ScanGames({ open, onClose }: { open: boolean; onClose: () => void }) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const stopLocal = useRef<(() => void) | null>(null);
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [report, setReport] = useState("");
  const diagnostics = import.meta.env.DEV;
  const [manual, setManual] = useState(false);
  const [remoteAvailable, setRemoteAvailable] = useState(false);
  const [remoteConsent, setRemoteConsent] = useState(false);
  useEffect(() => {
    setRemoteAvailable(false);
    setRemoteConsent(false);
    if (!open) return;
    let active = true;
    void remoteScanAvailable()
      .then((value) => {
        if (active) setRemoteAvailable(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [open]);
  const owned = useAppStore((s) => s.owned);
  const ready = useAppStore((s) => s.entitlementReady);
  const premium = useAppStore((s) => s.isPremium);
  const available = premium ? Infinity : Math.max(0, FREE_VAULT_LIMIT - owned.length);
  const selected = rows.filter((row) => row.selected && !(row.bggId && owned.includes(row.bggId)));
  useEffect(() => () => request.current?.abort(), []);

  if (!open) return null;
  function close() {
    request.current?.abort();
    request.current = null;
    stopLocal.current = null;
    setProgress("");
    setMessage("");
    setReport("");
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
    let readerUnavailable = false;
    let unopened = 0;
    let unavailable = 0;
    let partial = 0;
    let empty = 0;
    try {
      for (let index = 0; index < files.length; index++) {
        signal.throwIfAborted();
        setProgress(`Reading photo ${index + 1} of ${files.length}…`);
        const file = files[index];
        const passes: string[] = [];
        let phoneStatus = "Reader unavailable";
        if (diagnostics) setReport("");
        const photo = await openScanPhoto(file).catch(() => null);
        if (signal.aborted) {
          if (photo) photo.width = photo.height = 0;
          signal.throwIfAborted();
        }
        if (!photo) {
          if (diagnostics && !signal.aborted) setReport("Photo could not be opened.");
          unopened++;
          continue;
        }
        const dimensions = photo.width + " × " + photo.height;
        const barcodeTask = readLocalBarcodes(photo, signal);

        const remoteTask =
          remoteAvailable && remoteConsent
            ? Promise.resolve()
                .then(() => {
                  signal.throwIfAborted();
                  return identifyShelf({
                    data: { image: remoteScanImage(photo), consent: true },
                    signal,
                  });
                })
                .catch(() => null)
            : Promise.resolve(null);
        const localHits: ScanHit[] = [];
        const conflicts = new Set<string>();
        let reader: Awaited<ReturnType<typeof createBoxReader>> | undefined;
        const localController = new AbortController();
        const abortLocal = () => localController.abort();
        signal.addEventListener("abort", abortLocal, { once: true });
        let stopped = false;
        let finishLocal: () => void = () => {};
        const localStopped = new Promise<null>((resolve) => {
          finishLocal = () => resolve(null);
        });
        const stop = () => {
          stopped = true;
          localController.abort();
          reader?.close();
          reader = undefined;
          finishLocal();
        };
        stopLocal.current = stop;
        const timer = window.setTimeout(stop, 90000);

        const localTask = (async () => {
          if (readerUnavailable) return null;
          if (!reader) {
            try {
              const { createBoxReader } = await import("@/lib/box-ocr");
              const nextReader = await createBoxReader(localController.signal);
              if (stopped || signal.aborted) {
                nextReader.close();
                return null;
              }
              reader = nextReader;
            } catch {
              if (!stopped && !signal.aborted) readerUnavailable = true;
              return null;
            }
          }
          try {
            phoneStatus = "Stopped during text recognition";
            await reader.read(
              photo,
              (hit) => {
                if (!stopped && !signal.aborted) localHits.push(hit);
              },
              (stage, text, titles) => {
                if (stopped || signal.aborted) return;
                setProgress(`Reading photo ${index + 1} of ${files.length} · ${stage}`);
                if (diagnostics) {
                  passes.push(
                    stage +
                      " · " +
                      (titles.join(", ") || "no match") +
                      "\n" +
                      text.trim().slice(0, 2000),
                  );
                }
              },
              (id) => {
                if (!stopped && !signal.aborted) conflicts.add(id);
              },
            );
            phoneStatus = "Completed";
            return true;
          } catch {
            reader?.close();
            reader = undefined;
            return null;
          }
        })().catch(() => null);
        const [remote, local, barcodes] = await Promise.race([
          Promise.all([remoteTask, Promise.race([localTask, localStopped]), barcodeTask]),
          cancelled,
        ]).finally(() => {
          window.clearTimeout(timer);
          signal.removeEventListener("abort", abortLocal);
          if (request.current === controller) stopLocal.current = null;
          reader?.close();
          reader = undefined;
          photo.width = photo.height = 0;
        });
        signal.throwIfAborted();
        if (diagnostics) {
          const names = (items: ScanHit[]) => items.map((hit) => hit.name).join(", ") || "none";
          setReport(
            [
              "Photo " + (index + 1) + " · " + dimensions,
              "Phone reader · " + phoneStatus + " · " + passes.length + " passes",
              "Phone matches · " + names(localHits),
              "Server matches · " + (remote?.ok ? names(remote.hits) : "unavailable"),
              "Barcode reader · " +
                (barcodes.supported
                  ? barcodes.count + " valid codes · " + names(barcodes.hits)
                  : "unavailable"),
              ...passes,
            ].join("\n\n"),
          );
        }
        const blocked = new Set([
          ...conflicts,
          ...CATALOG_EXTERNAL_ID_CONFLICTS.map((c) => c.externalId),
        ]);
        const hits = resolveScanEvidence(
          [
            ...localHits.map((hit) => ({ source: "ocr" as const, hit })),
            ...(remote?.ok ? remote.hits.map((hit) => ({ source: "visual" as const, hit })) : []),
            ...barcodes.hits.map((hit) => ({ source: "barcode" as const, hit })),
          ],
          GAMES,
          blocked,
        );
        if (hits.length) {
          if (local === null) partial++;
          setRows((prev) => mergeScanRows(prev, hits, useAppStore.getState().owned));
        } else if (!remote?.ok && local === null) {
          unavailable++;
        } else {
          empty++;
        }
      }
      signal.throwIfAborted();
      setMessage(
        [
          unopened
            ? `Couldn’t open ${unopened} photo${unopened === 1 ? "" : "s"}. Try a JPEG or PNG copy.`
            : "",
          unavailable
            ? `The scanner couldn’t finish ${unavailable} photo${unavailable === 1 ? "" : "s"}. Try the same photo again.`
            : "",
          partial ? "Scanning stopped early. You can review the titles found so far." : "",
          empty ? `No titles recognized in ${empty} photo${empty === 1 ? "" : "s"}.` : "",
          empty ? "Add another angle or search for a missing title." : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
    } catch {
      if (!signal.aborted) setMessage("Scanning stopped. Your matches are ready to review.");
    } finally {
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
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="app-modal-overlay fixed inset-0 z-50 bg-night/40" />
        <Dialog.Content
          aria-label="Scan games"
          aria-describedby={undefined}
          onPointerDownOutside={(event) => event.preventDefault()}
          className="app-bottom-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col gap-3 rounded-t-2xl bg-background p-4 shadow-lift sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        >
          <header className="flex items-center justify-between">
            <Dialog.Title className="font-display text-xl">
              {progress ? "Finn is scanning" : rows.length ? "Review games found" : "Scan games"}
            </Dialog.Title>
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
          {progress ? (
            <FinnProcessing title="Finn is exploring your shelf…" detail={progress} />
          ) : (
            <>
              {!rows.length && (
                <p className="text-sm">
                  Photograph a box or add several shelf photos. Review the games together. By
                  default, recognition stays on this device. GameFinder does not save the photos to
                  your Vault.
                </p>
              )}
              {remoteAvailable && (
                <label className="flex items-start gap-2 rounded-card bg-muted p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={remoteConsent}
                    disabled={!!progress}
                    onChange={(event) => setRemoteConsent(event.target.checked)}
                  />
                  <span>
                    Optional external recognition: send selected photos to xAI to help identify
                    games. Provider processing is subject to its privacy terms. Leave unchecked to
                    scan locally.
                  </span>
                </label>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={!!progress}
                  onClick={() => camera.current?.click()}
                >
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
                {message}
              </p>
            </>
          )}
          {progress && (
            <button
              type="button"
              className="text-sm font-semibold text-sky"
              onClick={() => stopLocal.current?.()}
            >
              Finish reading this photo
            </button>
          )}
          {diagnostics && (
            <details className="text-sm">
              <summary>Scan details</summary>
              <pre className="max-h-[25dvh] overflow-auto whitespace-pre-wrap select-text">
                {report || "Choose a photo to see what the scanner reads."}
              </pre>
            </details>
          )}
          {!progress && rows.length > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span>
                  {rows.length} found · {selected.length} selected
                </span>
                <button
                  disabled={!rows.some(canSelect)}
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
                              ? "Unverified identity · Check before adding as custom game"
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
                    {row.bggId && getGame(row.bggId) && (
                      <details className="mb-2 text-sm">
                        <summary className="cursor-pointer font-semibold text-sky">
                          Game details
                        </summary>
                        <GameCharacterDetails
                          game={getGame(row.bggId)!}
                          context={{
                            ...DEFAULT_WIZARD,
                            players: null,
                            ageBand: null,
                            maxTimeMin: null,
                          }}
                          compact
                        />
                      </details>
                    )}
                  </li>
                ))}
              </ul>
              <Button disabled={!ready || !!progress || !selected.length} onClick={addSelected}>
                Add selected to Vault
              </Button>
            </>
          )}
          <button
            type="button"
            disabled={!!progress}
            className="text-sm font-semibold text-sky"
            onClick={() => setManual(true)}
          >
            Search or add a missing title
          </button>
          <AddGameDialog open={manual} onClose={() => setManual(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
