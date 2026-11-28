/** Isolated browser OCR acceptance test; authored synthetic title labels, no user photos or paid services. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";
import { resolve } from "node:path";
const server = await createServer({
  configFile: false,
  publicDir: resolve("public"),
  server: { host: "127.0.0.1", port: 8097, strictPort: true },
  optimizeDeps: { include: ["tesseract.js"] },
});
await server.listen();
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  page.on("requestfailed", (r) => console.log("REQUEST FAILED", r.url(), r.failure()?.errorText));
  page.on("response", (r) => {
    if (r.status() >= 400) console.log("HTTP", r.status(), r.url());
  });
  page.on("console", (m) => {
    if (m.type() === "error") console.log("BROWSER", m.text());
  });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/scanner-fixture.html" && url.hostname === "127.0.0.1")
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Scanner lab</title>",
      });
    return url.hostname === "127.0.0.1" && route.request().method() === "GET"
      ? route.continue()
      : route.abort();
  });
  await page.goto("http://127.0.0.1:8097/scanner-fixture.html", { waitUntil: "domcontentloaded" });
  const result = await page.evaluate(async () => {
    const { createBoxReader } = await import("/src/lib/box-ocr.ts");
    const { rotateScanPhoto } = await import("/src/lib/scan-photo.ts");
    const controller = new AbortController();
    const reader = await createBoxReader(controller.signal);
    const outcomes = [];
    const make = (labels) => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 800, 400);
      ctx.fillStyle = "black";
      ctx.font = "bold 70px Arial";
      labels.forEach((label, index) => ctx.fillText(label, 40, 110 + index * 140));
      return canvas;
    };
    try {
      for (const turn of [0, 1, -1, 2]) {
        const original = make(["WINGSPAN", "CATAN"]);
        const photo = turn ? rotateScanPhoto(original, turn) : original;
        const hits = new Set();
        const stages = new Set();
        const start = performance.now();
        const found = await reader.read(
          photo,
          (hit) => hits.add(hit.name),
          (stage) => stages.add(stage),
        );
        outcomes.push({
          turn,
          names: [...hits].sort(),
          returned: found.length,
          stages: [...stages],
          ms: Math.round(performance.now() - start),
        });
        photo.width = photo.height = original.width = original.height = 0;
      }
      for (const kind of ["diagonal", "mixed", "empty", "expansion"]) {
        const photo = document.createElement("canvas");
        photo.width = 900;
        photo.height = 700;
        const ctx = photo.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 900, 700);
        ctx.fillStyle = "black";
        ctx.font = "bold 65px Arial";
        if (kind === "diagonal") {
          ctx.translate(450, 350);
          ctx.rotate(Math.PI / 4);
          ctx.fillText("WINGSPAN", -190, 0);
        } else if (kind === "mixed") {
          ctx.fillText("CATAN", 40, 100);
          ctx.translate(670, 180);
          ctx.rotate(Math.PI / 2);
          ctx.fillText("WINGSPAN", 0, 0);
        } else if (kind === "expansion") {
          ctx.font = "bold 46px Arial";
          ctx.fillText("CATAN 5-6 PLAYER EXTENSION", 20, 150);
        }
        const start = performance.now();
        const found = await reader.read(photo);
        outcomes.push({
          kind,
          names: found.map((h) => h.name).sort(),
          ms: Math.round(performance.now() - start),
        });
        photo.width = photo.height = 0;
      }
    } finally {
      reader.close();
    }
    return outcomes;
  });
  for (const item of result) console.log(JSON.stringify(item));
  for (const item of result) {
    if (item.kind) {
      const expected = {
        diagonal: ["Wingspan"],
        mixed: ["Catan", "Wingspan"],
        empty: [],
        expansion: [],
      }[item.kind];
      assert.deepEqual(item.names, expected, item.kind);
      continue;
    }
    assert.deepEqual(item.names, ["Catan", "Wingspan"]);
    assert.ok(item.names.includes("Catan"), "Catan missing at turn " + item.turn);
    assert.ok(item.names.includes("Wingspan"), "Wingspan missing at turn " + item.turn);
    assert.equal(item.returned, item.names.length);
    assert.ok(item.stages.some((s) => s.startsWith("Shelf region")));
    assert.ok(item.stages.some((s) => s.startsWith("Diagonal")));
  }
} finally {
  await browser.close();
  await server.close();
}
