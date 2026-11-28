/** Isolated owner-test server, no external traffic. */
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
  });
  page.setDefaultTimeout(30000);
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === base ? r.continue() : r.abort(),
  );
  const go = async (path) => {
    await page.goto(base + path, { waitUntil: "domcontentloaded" });
    await page.locator("[data-app-footer]").waitFor({ state: "attached" });
  };
  const recommendation = page.getByRole("list", { name: "Discover recommendations" });
  const ids = async (list) =>
    list.locator("a[href*='/game/']").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  const wishlistButton = page.getByRole("button", { name: "Add to Wishlist", exact: true });
  await go("/vault");
  await page.getByRole("heading", { name: "What's on your shelf?" }).waitFor();
  assert.equal(await page.getByText(/starter shelf/i).count(), 0);
  console.log("PASS no automatic starter shelf");
  await go("/discover");
  await recommendation.waitFor();
  const first = await ids(recommendation);
  assert.equal(first.length, 3);
  await recommendation.locator("a").first().click();
  await wishlistButton.waitFor();
  await wishlistButton.click();
  await page.getByRole("button", { name: "Remove from Wishlist", exact: true }).waitFor();
  await page.getByRole("button", { name: "Add to Vault", exact: true }).click();
  await page.getByRole("button", { name: "In Your Vault", exact: true }).waitFor();
  assert.equal(await wishlistButton.count(), 0);
  assert.equal(
    await page.getByRole("button", { name: "Remove from Wishlist", exact: true }).count(),
    0,
  );
  await go("/discover");
  await recommendation.waitFor();
  const next = await ids(recommendation);
  assert.equal(next.length, 3);
  assert.ok(!next.includes(first[0]));
  console.log("PASS featured ownership replacement and profile Wishlist controls");
  await go("/vault");
  await page.getByRole("button", { name: "Wishlist", exact: true }).click();
  assert.equal(await page.locator('a[href="' + first[0] + '"]').count(), 0);
  console.log("PASS Wishlist transfer");
  await go("/discover");
  await page.getByRole("button", { name: "More players" }).click();
  await page.getByRole("button", { name: "More players" }).click();
  await recommendation.waitFor();
  assert.equal((await ids(recommendation)).length, 3);
  assert.ok(!(await ids(recommendation)).includes(first[0]));
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Browse all", exact: true }).click();
  const all = page.getByRole("list", { name: "Catalog matches" });
  await all.waitFor();
  assert.ok((await ids(all)).includes(first[0]));
  console.log("PASS filtered Discover excludes owned, explicit Browse All retrieves owned");
  await go("/game/3931");
  const similar = page.locator('[aria-label="Similar game recommendations"]');
  await similar.waitFor();
  const similarBefore = await ids(similar);
  assert.equal(similarBefore.length, 3);
  assert.ok(!similarBefore.includes(first[0]));
  await similar.locator("a").first().click();
  await page.getByRole("button", { name: "Add to Vault", exact: true }).click();
  await page.getByRole("button", { name: "In Your Vault", exact: true }).waitFor();
  await go("/game/3931");
  await similar.waitFor();
  const similarAfter = await ids(similar);
  assert.equal(similarAfter.length, 3);
  assert.ok(!similarAfter.includes(similarBefore[0]));
  console.log("PASS Similar Games excludes and replaces owned candidates");
  console.log("ALL PASS");
} finally {
  await browser.close();
}
