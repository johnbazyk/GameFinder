import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let server, v;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  v = await server.ssrLoadModule("/src/lib/account-vault.ts");
});
after(async () => server?.close());
const shelf = (owned = [], wishlist = []) => ({ owned, wishlist });
test("account changes isolate and preserve guest and each signed-in shelf", () => {
  const guest = { ...shelf(["guest-game"]), ownerId: null };
  const a = v.switchVault(guest, {}, "A");
  assert.deepEqual(a.vault, { ...shelf(), ownerId: "A" });
  const b = v.switchVault({ ...shelf(["a-game"]), ownerId: "A" }, a.archives, "B");
  assert.deepEqual(b.vault, { ...shelf(), ownerId: "B" });
  const back = v.switchVault({ ...shelf(["b-game"]), ownerId: "B" }, b.archives, "A");
  assert.deepEqual(back.vault, { ...shelf(["a-game"]), ownerId: "A" });
  assert.deepEqual(v.switchVault(back.vault, back.archives, null).vault, guest);
});
test("delta merge keeps remote additions and removals and applies local changes", () => {
  assert.deepEqual(
    v.mergeVaultDelta(shelf(["a", "b", "c"]), shelf(["b", "c", "d"]), shelf(["a", "c", "e"])),
    shelf(["c", "e", "d"]),
  );
  assert.deepEqual(v.mergeVaultDelta(shelf(["a"]), shelf(["a"]), shelf()), shelf());
});
test("owned takes precedence over wishlist after concurrent changes", () => {
  assert.deepEqual(
    v.mergeVaultDelta(shelf([], ["a"]), shelf(["a"]), shelf([], ["a", "b"])),
    shelf(["a"], ["b"]),
  );
});
test("snapshot comparison is independent of ordering", () => {
  assert.equal(v.sameVault(shelf(["a", "b"]), shelf(["b", "a"])), true);
  assert.equal(v.sameVault(shelf(["a"]), shelf(["b"])), false);
});
