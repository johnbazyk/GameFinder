import { normalizeVault, type VaultSnapshot } from "./vault-policy";

export type VaultOwner = string | null;
export type LocalVault = VaultSnapshot & { ownerId: VaultOwner };
export type VaultArchives = Record<string, VaultSnapshot>;
export const GUEST_VAULT = "guest:";
export const accountVaultKey = (owner: VaultOwner) =>
  owner === null ? GUEST_VAULT : "account:" + owner;

// Switch the active shelf without merging one account's collection into another.
// The outgoing snapshot remains available on this device to its original owner.
export function switchVault(local: LocalVault, archives: VaultArchives, owner: VaultOwner) {
  if (local.ownerId === owner)
    return { vault: { ...normalizeVault(local), ownerId: owner }, archives };
  const saved = { ...archives, [accountVaultKey(local.ownerId)]: normalizeVault(local) };
  const target = saved[accountVaultKey(owner)] ?? { owned: [], wishlist: [] };
  return { vault: { ...normalizeVault(target), ownerId: owner }, archives: saved };
}

// A cloud read is the baseline, not a permanent union that resurrects deletions.
export function mergeVaultDelta(base: VaultSnapshot, local: VaultSnapshot, cloud: VaultSnapshot) {
  const merge = (before: string[], after: string[], remote: string[]) => {
    const removed = new Set(before.filter((id) => !after.includes(id)));
    const added = after.filter((id) => !before.includes(id));
    return [...new Set([...remote.filter((id) => !removed.has(id)), ...added])];
  };
  return normalizeVault({
    owned: merge(base.owned, local.owned, cloud.owned),
    wishlist: merge(base.wishlist, local.wishlist, cloud.wishlist),
  });
}
export function sameVault(a: VaultSnapshot, b: VaultSnapshot) {
  return (
    a.owned.length === b.owned.length &&
    a.wishlist.length === b.wishlist.length &&
    a.owned.every((id) => b.owned.includes(id)) &&
    a.wishlist.every((id) => b.wishlist.includes(id))
  );
}
