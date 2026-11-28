import {
  CATALOG_PROVIDER_IDS,
  validatePermanentCatalogIdentityRegistry,
  type CatalogProviderId,
  type PermanentCatalogIdentity,
} from "./catalog-foundation";
import { FREE_VAULT_LIMIT } from "./types";

export type CollectionClaim = { provider: CatalogProviderId; externalId: string; title: string };
export type CollectionPreviewRow = {
  index: number;
  claim: CollectionClaim | null;
  gamefinderId: string | null;
  status:
    "invalid" | "unresolved" | "ambiguous" | "review" | "already-owned" | "duplicate" | "ready";
};

/** Read-only planning against independently reviewed identities. Never authorizes provider access or writes a Vault. */
export function previewCollectionImport(
  input: readonly unknown[],
  identities: readonly PermanentCatalogIdentity[],
  ownedIds: readonly string[],
  premium: boolean,
) {
  if (!Array.isArray(input) || input.length > 10000) throw new Error("Invalid collection size");
  validatePermanentCatalogIdentityRegistry(identities);
  const owned = new Set(ownedIds);
  const selected = new Set<string>();
  const index = new Map<string, PermanentCatalogIdentity[]>();
  for (const identity of identities) {
    for (const external of identity.externalIds) {
      const key = JSON.stringify([external.provider, external.value]);
      const matches = index.get(key) ?? [];
      if (!matches.includes(identity)) matches.push(identity);
      index.set(key, matches);
    }
  }
  const rows: CollectionPreviewRow[] = Array.from(input, (raw, i) => {
    const row: CollectionPreviewRow = {
      index: i,
      claim: null,
      gamefinderId: null,
      status: "invalid",
    };
    if (!raw || typeof raw !== "object") return row;
    const value = raw as Partial<CollectionClaim>;
    if (
      !CATALOG_PROVIDER_IDS.includes(value.provider as CatalogProviderId) ||
      typeof value.externalId !== "string" ||
      !value.externalId.trim() ||
      value.externalId.length > 256 ||
      typeof value.title !== "string" ||
      !value.title.trim() ||
      value.title.length > 240
    )
      return row;
    const claim = { provider: value.provider!, externalId: value.externalId, title: value.title };
    row.claim = claim;
    const candidates = index.get(JSON.stringify([claim.provider, claim.externalId])) ?? [];
    if (!candidates.length) return { ...row, status: "unresolved" };
    if (candidates.length !== 1) return { ...row, status: "ambiguous" };
    const identity = candidates[0];
    const matching = identity.externalIds.filter(
      (id) => id.provider === claim.provider && id.value === claim.externalId,
    );
    if (
      identity.status !== "verified" ||
      identity.conflictStatus !== "none" ||
      !matching.every(
        (id) => id.status === "verified" && identity.evidence.some((e) => e.id === id.evidenceRef),
      )
    )
      return { ...row, status: "review" };
    // Title discrepancies are reviewable, never silently mapped by approximate text.
    const normalize = (s: string) => s.normalize("NFKC").trim().toLowerCase();
    if (normalize(claim.title) !== normalize(identity.title)) return { ...row, status: "review" };
    row.gamefinderId = identity.id;
    if (owned.has(identity.id)) return { ...row, status: "already-owned" };
    if (selected.has(identity.id)) return { ...row, status: "duplicate" };
    selected.add(identity.id);
    return { ...row, status: "ready" };
  });
  const available = premium ? null : Math.max(0, FREE_VAULT_LIMIT - owned.size);
  return {
    rows,
    eligibleIds: [...selected],
    available,
    requiresSelection: available !== null && selected.size > available,
  };
}

/** Recompute from current trusted inputs at confirmation; never trust a previously rendered preview.
 * This produces a proposed additive snapshot only, not a persistence operation.
 */
export function planConfirmedCollectionImport(
  input: readonly unknown[],
  identities: readonly PermanentCatalogIdentity[],
  ownedIds: readonly string[],
  premium: boolean,
  selectedIds: readonly string[],
) {
  if (!Array.isArray(selectedIds) || selectedIds.some((id) => typeof id !== "string")) {
    throw new Error("Invalid collection selection");
  }
  const preview = previewCollectionImport(input, identities, ownedIds, premium);
  const eligible = new Set(preview.eligibleIds);
  const owned = new Set(ownedIds);
  const selection = [...new Set(selectedIds)];
  if (selection.some((id) => !eligible.has(id) && !owned.has(id))) {
    throw new Error("Collection selection is no longer eligible");
  }
  // Owned selections are only idempotent when they still resolve from this collection.
  const resolved = new Set(
    preview.rows
      .filter(
        (row) =>
          row.status === "already-owned" || row.status === "ready" || row.status === "duplicate",
      )
      .map((row) => row.gamefinderId),
  );
  if (selection.some((id) => !resolved.has(id)))
    throw new Error("Collection selection is no longer eligible");
  const additions = selection.filter((id) => !owned.has(id));
  if (preview.available !== null && additions.length > preview.available) {
    throw new Error("Collection selection exceeds current Vault capacity");
  }
  return { additions, nextOwnedIds: [...owned, ...additions] };
}
