/** Disposable auth-off local server; no external calls. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = "http://127.0.0.1:8110";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    serviceWorkers: "block",
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(30000);
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === base ? r.continue() : r.abort(),
  );
  const go = async (path) => {
    await page.goto(base + path, { waitUntil: "domcontentloaded" });
    await page.locator("[data-app-footer]").waitFor({ state: "attached" });
  };
  await go("/profile");
  await page.getByRole("heading", { name: "Subscription testing" }).waitFor();
  await page.getByRole("button", { name: "Free", exact: true }).click();
  await page.locator('[data-ad-plan="free"]').waitFor({ state: "attached" });
  await go("/discover");
  const rec = page.getByRole("list", { name: "Discover recommendations" });
  await rec.waitFor();
  assert.equal(await rec.getByRole("listitem").count(), 3);
  await page.getByRole("button", { name: "More players" }).click();
  await page.getByRole("button", { name: "More players" }).click();
  assert.equal(await rec.getByRole("listitem").count(), 3);
  await page.getByRole("button", { name: "Browse all matches" }).click();
  const all = page.getByRole("list", { name: "Catalog matches" });
  await all.waitFor();
  assert.ok((await all.getByRole("listitem").count()) > 3);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("searchbox").fill("a");
  await all.waitFor();
  assert.ok((await all.getByRole("listitem").count()) > 20);
  console.log("PASS three Featured, three filtered, complete filtered browse and title search");
  await go("/game/3931");
  const similar = page.locator('[aria-label="Similar game recommendations"]');
  await similar.waitFor();
  assert.equal(await similar.getByRole("link").count(), 3);
  assert.equal(await similar.getByText(/In vault|Wishlisted|Not owned/).count(), 3);
  console.log("PASS three Similar Games and ownership labels");
  await go("/vault");
  await page
    .getByRole("button", { name: /Search by title/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  const input = dialog.getByRole("textbox", { name: "Search the catalog" });
  await input.waitFor();
  assert.equal(await input.evaluate((el) => document.activeElement === el), false);
  await input.fill("a");
  assert.ok((await dialog.getByRole("button", { name: /Details for/ }).count()) > 20);
  assert.ok(await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize) >= 16));
  assert.equal(await input.evaluate((el) => getComputedStyle(el).touchAction), "manipulation");
  assert.ok(await page.evaluate(() => Math.abs(visualViewport.scale - 1) < 0.02));
  console.log("PASS complete Vault search, 16px field, no forced focus and touch policy");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 568 });
    const box = await dialog.boundingBox();
    assert.ok(box.x >= -1 && box.x + box.width <= width + 1);
    assert.ok(box.y >= -1);
    assert.ok(
      await dialog
        .locator("ul")
        .evaluate((el) => el.clientHeight > 0 && el.scrollHeight > el.clientHeight),
    );
  }
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await go("/profile");
  await page.getByRole("textbox", { name: "Display name" }).waitFor();
  const sizes = await page
    .locator("input:not([type=hidden]),textarea,select")
    .evaluateAll((els) =>
      els
        .filter(
          (e) =>
            e.getBoundingClientRect().height > 0 &&
            !["checkbox", "radio", "range", "color"].includes(e.type),
        )
        .map((e) => parseFloat(getComputedStyle(e).fontSize)),
    );
  assert.ok(sizes.length && sizes.every((v) => v >= 16));
  await go("/table-setup");
  await page.locator("input:visible").first().waitFor();
  const tableSizes = await page
    .locator("input:visible")
    .evaluateAll((els) =>
      els
        .filter((e) => !["checkbox", "radio", "range", "color"].includes(e.type))
        .map((e) => parseFloat(getComputedStyle(e).fontSize)),
    );
  assert.ok(tableSizes.length && tableSizes.every((v) => v >= 16));
  console.log("PASS compact dialog and profile/table input sizing");
  await go("/profile");
  await page.getByRole("button", { name: "Actual", exact: true }).click();
  console.log("ALL PASS");
} finally {
  await browser.close();
}
