import type { Sql } from "./db";
import { normalizeVault, assertVaultCapacity, type VaultSnapshot } from "./vault-policy";
import { mergeVaultDelta } from "./account-vault";
import { hasPremiumPlan, resolveAccountPremium } from "./premium-entitlement.server";

/** Caller must provide an atomic transaction and lock the account row first. */
export async function replaceVaultSnapshot(
  sql: Sql,
  userId: string,
  input: VaultSnapshot & { baseline?: VaultSnapshot },
) {
  let data = normalizeVault(input);
  const profile = await sql<{
    plan: string;
  }>`select plan from profiles where user_id = ${userId} for update`;
  if (!profile.length) throw new Error("Vault account unavailable");
  const current = await sql<{
    bgg_id: string;
    list: string;
  }>`select bgg_id, list from vault_games where user_id = ${userId}`;
  const remote = {
    owned: current.filter((row) => row.list === "owned").map((row) => row.bgg_id),
    wishlist: current.filter((row) => row.list === "wishlist").map((row) => row.bgg_id),
  };
  if (input.baseline) data = mergeVaultDelta(normalizeVault(input.baseline), data, remote);
  const premium =
    userId === "dev-user" ? await hasPremiumPlan(userId) : await resolveAccountPremium(sql, userId);
  assertVaultCapacity(remote.owned, data.owned, premium);
  await sql`delete from vault_games where user_id = ${userId}`;
  for (const [list, ids] of [
    ["owned", data.owned],
    ["wishlist", data.wishlist],
  ] as const) {
    if (ids.length)
      await sql`insert into vault_games (user_id, bgg_id, list) select ${userId}, value, ${list} from jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb) as value`;
  }
  return { ok: true as const, ...data };
}
