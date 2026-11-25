import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { before, after, test } from "node:test";
import { createServer } from "vite";

let server, games, guides, find, merge;
before(async () => {
  server = await createServer({ configFile: false, server: { middlewareMode: true } });
  const modules = await Promise.all(
    ["catalog", "written-guides", "box-titles", "scan-review"].map((name) =>
      server.ssrLoadModule("/src/lib/" + name + ".ts"),
    ),
  );
  games = modules[0].GAMES;
  guides = modules[1].guides;
  find = (text) =>
    modules[2]
      .findBoxTitles(text, games)
      .map((game) => game.name)
      .sort();
  merge = modules[3].mergeScanRows;
});
after(async () => server?.close());

test("every browsable game has an individual quick start and a playable asset", () => {
  const files = new Set();
  for (const game of games) {
    const guide = guides[game.name];
    assert.ok(guide, game.name);
    for (const field of ["setup", "turn", "win"]) assert.ok(guide[field].trim(), game.name);
    assert.ok(statSync("public" + guide.audio).size > 1000, game.name);
    assert.ok(!files.has(guide.audio), game.name);
    files.add(guide.audio);
  }
});

test("read catalog titles among box text and keep distinct editions", () => {
  assert.deepEqual(find("KLAUS TEUBER’S CATAN • THE BOARD GAME"), ["Catan"]);
  assert.deepEqual(find("THE SETTLERS OF CATAN"), ["Catan"]);
  assert.deepEqual(find("CAT AN"), ["Catan"]);
  assert.deepEqual(find("Ticket to\nRide"), ["Ticket to Ride"]);
  assert.deepEqual(find("Catan Junior"), []);
  assert.deepEqual(find("CATAN 5–6 PLAYER EXTENSION"), []);
  assert.deepEqual(find("WYRMSRANJ\nMYSTERIUML"), ["Mysterium", "Wyrmspan"]);
  assert.deepEqual(find("CLE\nWYRM\nMYSTERIOUS"), []);
  assert.deepEqual(find("FICRET 10 RIDE"), ["Ticket to Ride"]);
  assert.deepEqual(find("FICRET 10 RIDE RAILS & SAILS"), []);
  assert.deepEqual(find("IICRET 19 RIDE,"), ["Ticket to Ride"]);
  assert.deepEqual(find("SETTLERS]\nCATANE"), ["Catan"]);
  assert.deepEqual(find("SETTLERS\nCATA\n5–6 PLAYER EXTENSION"), []);
  assert.deepEqual(find("CATA"), []);
  assert.deepEqual(find("CATANIA"), []);
  assert.deepEqual(find("AZUL SUMMER PAVILION"), ["Azul: Summer Pavilion"]);
  assert.deepEqual(find("Outfoxed! | CATAN THE GAME"), ["Catan", "Outfoxed!"]);
});

test("later shelf photos preserve review decisions and only contribute new games", () => {
  const hit = (id, name) => ({ bggId: id, name, confidence: "high" });
  const catan = hit("13", "Catan"),
    azul = hit("230802", "Azul");
  const unknown = { ...hit(null, "New Game"), confidence: "unknown" };
  const rows = merge([], [catan, unknown, unknown], []);
  rows[0].selected = false;
  const result = merge(rows, [catan, azul, unknown], ["230802"]);
  assert.deepEqual(
    result.map((row) => [row.name, row.selected]),
    [
      ["Catan", false],
      ["New Game", false],
      ["Azul", false],
    ],
  );
});

test("all five Finn chapters have game-specific text and separate recordings", async () => {
  const { chapters, chapterAudio, guidePassage } = await server.ssrLoadModule(
    "/src/lib/guide-chapters.ts",
  );
  assert.deepEqual(
    chapters.map((chapter) => chapter.id),
    ["goal", "setup", "turn", "score", "oops"],
  );
  const recordings = new Set();
  for (const game of games) {
    const guide = guides[game.name];
    assert.equal(new Set(chapters.map((chapter) => guide[chapter.field])).size, 5, game.name);
    for (const chapter of chapters) {
      assert.ok(guide[chapter.field]?.trim(), game.name);
      const path = chapterAudio(guide, chapter);
      assert.ok(statSync("public" + path).size > 1000, path);
      assert.ok(!recordings.has(path), path);
      recordings.add(path);
    }
  }
  assert.equal(guidePassage(guides.Catan, "How do I set up?").id, "setup");
  assert.equal(guidePassage(guides.Catan, "What happens on a seven?").id, "oops");
  assert.equal(guidePassage(guides.Wingspan, "How do I score?").id, "score");
  assert.equal(guidePassage(guides.Catan, "Can I tunnel underground?"), undefined);
});

test("quarter turns preserve every corner of a rectangular photo", async () => {
  const { rotateScanPhoto } = await server.ssrLoadModule("/src/lib/scan-photo.ts");
  const photo = { width: 90, height: 40 };
  const previous = globalThis.document;
  try {
    for (const turn of [1, -1, 2]) {
      let offset, angle, drawn;
      globalThis.document = {
        createElement: () => ({
          getContext: () => ({
            translate(x, y) {
              offset = [x, y];
            },
            rotate(value) {
              angle = value;
            },
            drawImage(image) {
              drawn = image;
            },
          }),
        }),
      };
      const out = rotateScanPhoto(photo, turn);
      assert.equal(drawn, photo);
      assert.equal(angle, (turn * Math.PI) / 2);
      const corners = [
        [0, 0],
        [90, 0],
        [0, 40],
        [90, 40],
      ].map(([x, y]) => [
        Math.round(offset[0] + x * Math.cos(angle) - y * Math.sin(angle)) || 0,
        Math.round(offset[1] + x * Math.sin(angle) + y * Math.cos(angle)) || 0,
      ]);
      assert.deepEqual(
        corners.sort(),
        [
          [0, 0],
          [out.width, 0],
          [0, out.height],
          [out.width, out.height],
        ].sort(),
      );
    }
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test("provider responses require consistent catalog identity and valid data", async () => {
  const { validateScanHits } = await server.ssrLoadModule("/src/lib/scan-validation.ts");
  const catalog = [
    { bggId: "13", name: "Catan" },
    { bggId: "2", name: "Other" },
  ];
  const hits = validateScanHits(
    [
      null,
      42,
      { name: 123 },
      { name: "" },
      { bggId: "13", name: "Other", confidence: "high" },
      { bggId: "13", name: "Catan", confidence: "high", possibleExpansion: true },
      { bggId: "13", name: "The Settlers of Catan", confidence: "high" },
      { bggId: null, name: "Catan", confidence: "high" },
      { bggId: "unknown", name: "Catan", confidence: "high" },
    ],
    catalog,
  );
  assert.deepEqual(
    hits.map((h) => [h.bggId, h.confidence]),
    [
      [null, "unknown"],
      [null, "unknown"],
      ["13", "high"],
      ["13", "review"],
      [null, "unknown"],
    ],
  );
});

test("explicit Catan expansion evidence survives separate OCR crops", async () => {
  const { conflictingBaseTitles } = await server.ssrLoadModule("/src/lib/box-titles.ts");
  assert.deepEqual(conflictingBaseTitles("CATAN\n5–6 PLAYER EXTENSION"), ["catan"]);
  assert.deepEqual(conflictingBaseTitles("CATAN JUNIOR"), ["catan"]);
  assert.deepEqual(conflictingBaseTitles("CATAN THE BOARD GAME"), []);
  assert.deepEqual(conflictingBaseTitles("WINGSPAN"), []);
});
