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
