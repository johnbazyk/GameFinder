import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let server, resolve, barcode, find;
const catalog = [
  { bggId: "1", name: "Splendor" },
  { bggId: "2", name: "Carcassonne" },
  { bggId: "3", name: "Catan" },
];
before(async () => {
  server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    cacheDir: "node_modules/.vite-phase08-unit",
  });
  ({ resolveScanEvidence: resolve } = await server.ssrLoadModule("/src/lib/scan-evidence.ts"));
  barcode = await server.ssrLoadModule("/src/lib/scan-barcode.ts");
  ({ findBoxTitles: find } = await server.ssrLoadModule("/src/lib/box-titles.ts"));
});
after(async () => server?.close());
const ev = (source, id, name, more = {}) => ({
  source,
  hit: { bggId: id, name, confidence: "high", ...more },
});
test("independent recognition signals deduplicate but never bypass review", () => {
  const r = resolve(
    [ev("ocr", "1", "Splendor"), ev("visual", "1", "Splendor"), ev("ocr", "1", "Splendor")],
    catalog,
  );
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].sources, ["ocr", "visual"]);
  assert.equal(r[0].confidence, "review");
});
test("wrong provider identifiers and expansions never resolve to a base game", () => {
  for (const e of [
    ev("visual", "1", "Catan"),
    ev("visual", "3", "Catan", { possibleExpansion: true }),
  ]) {
    assert.equal(resolve([e], catalog)[0].bggId, null);
  }
});
test("blocked or duplicate identities are not accepted", () => {
  assert.deepEqual(resolve([ev("ocr", "3", "Catan")], catalog, new Set(["3"])), []);
  assert.equal(
    resolve([ev("ocr", "3", "Catan")], [...catalog, { bggId: "3", name: "Other" }])[0].bggId,
    null,
  );
});
test("distinctive split lettering uses exact whole-title identity", () => {
  assert.deepEqual(
    find("SPL ENDOR\nCAR CASSONNE", catalog)
      .map((g) => g.name)
      .sort(),
    ["Carcassonne", "Splendor"],
  );
  assert.deepEqual(find("I LOVE SPL ENDOR", catalog), []);
});
test("GTIN checksum and authorized product mapping are required", () => {
  assert.equal(barcode.normalizeGtin("036000291452"), "00036000291452");
  assert.equal(barcode.normalizeGtin("036000291453"), null);
  const ref = {
    gtin: "036000291452",
    bggId: "1",
    name: "Synthetic game",
    source: "Synthetic fixture only",
  };
  assert.equal(barcode.matchBarcode(ref.gtin, [ref]).bggId, "1");
  assert.equal(barcode.matchBarcode(ref.gtin, []), null);
  assert.equal(barcode.matchBarcode(ref.gtin, [ref, ref]), null);
  assert.equal(barcode.APPROVED_BARCODE_REFERENCES.length, 0);
});

test("expansion evidence vetoes same-title base recognition across sources", () => {
  const r = resolve(
    [ev("ocr", "3", "Catan"), ev("visual", "3", "Catan", { possibleExpansion: true })],
    catalog,
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].bggId, null);
});
