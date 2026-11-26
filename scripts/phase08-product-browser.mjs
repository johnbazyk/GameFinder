/** Disposable isolated auth-off development browser; no external requests. */
import { chromium } from "playwright";
import assert from "node:assert/strict";
// Requires a FRESH disposable in-memory server, not the subscription test server.
const base = "http://127.0.0.1:8110";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  page.setDefaultTimeout(30000);
  page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
  await page.route("**/*", (r) =>
    r
      .request()
      .url()
      .startsWith(base + "/")
      ? r.continue()
      : r.abort(),
  );
  const go = async (path) => {
    assert.equal((await page.goto(base + path, { waitUntil: "domcontentloaded" })).status(), 200);
  };
  await go("/vault");
  await page.getByRole("heading", { name: "What's on your shelf?" }).waitFor();
  await page.getByRole("button", { name: "Wishlist", exact: true }).click();
  await page.getByRole("button", { name: "Add to Wishlist", exact: true }).click();
  await page.getByRole("textbox", { name: "Search the catalog" }).fill("Splendor");
  await page.getByRole("button", { name: "Details for Splendor", exact: true }).click();
  await page.getByText("How it plays", { exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "GameFinder Vibes" }).count(), 0);
  await page.getByText("Mechanics:", { exact: true }).waitFor();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add to Wishlist", exact: true })
    .click();
  await page.getByRole("button", { name: "Wishlisted", exact: true }).waitFor();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("link", { name: "Splendor", exact: true }).waitFor();
  console.log("PASS empty wishlist catalog search, expanded profile, addition");
  await page.getByRole("link", { name: "Splendor", exact: true }).click();
  await page.getByRole("button", { name: "Add to Vault", exact: true }).click();
  await page.getByRole("button", { name: "In Your Vault", exact: true }).waitFor();
  await go("/vault");
  await page.getByRole("link", { name: "Splendor", exact: true }).waitFor();
  await page.getByRole("button", { name: "Wishlist", exact: true }).click();
  assert.equal(await page.getByRole("link", { name: "Splendor", exact: true }).count(), 0);
  console.log("PASS move Wishlist to Owned");
  await go("/discover");
  await page.getByRole("button", { name: "Any number of players", exact: true }).waitFor();
  await page.getByText("Featured Games", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: /Skip/ }).count(), 0);
  await page.getByRole("button", { name: "More players" }).click();
  await page.getByRole("button", { name: "More players" }).waitFor();
  await page.getByRole("button", { name: "Any number of players", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "More players" }).count(), 1);
  await page.getByRole("searchbox").fill("Splendor");
  await page
    .getByRole("link", { name: /Splendor/ })
    .first()
    .waitFor();
  console.log("PASS Discover title search and optional count");
  await go("/vault");
  await page.getByRole("button", { name: "Scan Games", exact: true }).click();
  await page.getByText("Scan details", { exact: true }).waitFor();
  const photo = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 400;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 800, 400);
    ctx.fillStyle = "black";
    ctx.font = "bold 90px Arial";
    ctx.fillText("CATAN", 40, 150);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.locator("input[type=file][multiple]").setInputFiles({
    name: "synthetic.png",
    mimeType: "image/png",
    buffer: Buffer.from(photo, "base64"),
  });
  await page.getByText("Finn is exploring your shelf…", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Close scanner" }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  console.log("PASS Finn scanning state and cancellation");
} finally {
  await browser.close();
}
