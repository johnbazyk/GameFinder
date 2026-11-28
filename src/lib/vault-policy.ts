import { FREE_VAULT_LIMIT } from "./types";
export type VaultSnapshot = { owned: string[]; wishlist: string[] };
export function normalizeVault(input: VaultSnapshot): VaultSnapshot {
  if (!Array.isArray(input?.owned) || !Array.isArray(input?.wishlist))
    throw new Error("Invalid Vault snapshot");
  const ids = (values: string[]) => {
    if (values.some((id) => typeof id !== "string" || !id.trim() || id.length > 256))
      throw new Error("Invalid Vault game id");
    return Array.from(new Set(values));
  };
  const owned = ids(input.owned);
  const set = new Set(owned);
  return { owned, wishlist: ids(input.wishlist).filter((id) => !set.has(id)) };
}
export function assertVaultCapacity(previous: string[], next: string[], premium: boolean) {
  if (premium || next.length <= FREE_VAULT_LIMIT) return;
  const prior = new Set(previous);
  if (next.some((id) => !prior.has(id)))
    throw new Error("Free vaults hold up to 50 games. Existing games are preserved.");
}
