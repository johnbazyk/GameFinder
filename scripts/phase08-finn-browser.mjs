/** Local, isolated, auth-off browser acceptance. No provider calls. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = "http://127.0.0.1:8110";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(30000);
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === base ? r.continue() : r.abort(),
  );
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("finn-fixture")) {
      localStorage.setItem(
        "gamefinder-v2",
        JSON.stringify({ version: 2, state: { owned: ["3931"], vaultOwnerId: "dev-user" } }),
      );
      sessionStorage.setItem("finn-fixture", "1");
    }
  });
  const go = async (path) => {
    assert.ok((await page.goto(base + path, { waitUntil: "domcontentloaded" })).status() < 400);
    await page.locator("[data-app-footer]").waitFor({ state: "attached" });
  };
  const mode = async (name) => {
    await go("/profile");
    await page.getByRole("heading", { name: "Subscription testing" }).waitFor();
    await page.getByRole("button", { name, exact: true }).click();
    await page
      .locator('[data-ad-plan="' + name.toLowerCase() + '"]')
      .waitFor({ state: "attached" });
  };
  const rect = async (loc) => {
    await loc.waitFor();
    const r = await loc.boundingBox();
    assert.ok(r);
    return r;
  };
  await mode("Free");
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [1280, 800],
  ]) {
    await page.setViewportSize({ width, height });
    await go("/");
    const hero = await rect(page.getByAltText("Finn waving hello", { exact: true }));
    const find = await rect(page.getByRole("button", { name: "Find a Game", exact: true }));
    const surprise = await rect(page.getByRole("button", { name: "Surprise Me", exact: true }));
    const footer = await rect(page.locator("[data-app-footer]"));
    assert.ok(hero.width > 112 && Math.abs(hero.width - hero.height) < 1);
    assert.ok(hero.y + hero.height <= find.y);
    assert.ok(
      surprise.y + surprise.height <= footer.y + 1,
      JSON.stringify({ width, height, surprise, footer }),
    );
    assert.ok(find.y + find.height <= surprise.y);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    await page.getByRole("button", { name: "Surprise Me", exact: true }).click();
    const small = await rect(page.getByAltText("Finn holding a die", { exact: true }));
    assert.equal(small.width, width < 640 ? 80 : 96);
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await go("/profile");
    const large = await rect(page.getByAltText("Finn with a checklist", { exact: true }));
    assert.equal(large.width, width < 640 ? 176 : 208);
    assert.ok(hero.width >= large.width || height < 600);
    await go("/results");
    const empty = await rect(
      page.getByAltText("Finn looking through a magnifying glass", { exact: true }),
    );
    assert.equal(empty.width, width < 640 ? 176 : 208);
    console.log(
      "PASS Free",
      width,
      height,
      "hero",
      hero.width,
      "buttons clear footer; profile, surprise and empty state",
    );
  }
  await mode("Premium");
  await page.setViewportSize({ width: 320, height: 568 });
  await go("/");
  await page.locator('[data-ad-plan="premium"]').waitFor({ state: "attached" });
  assert.equal(await page.locator('[aria-label="Advertisement"]').count(), 0);
  const b = await rect(page.getByRole("button", { name: "Surprise Me", exact: true }));
  const f = await rect(page.locator("[data-app-footer]"));
  assert.ok(b.y + b.height <= f.y + 1);
  console.log("PASS Premium small-screen Home");
  await go("/profile");
  await page.getByRole("button", { name: "Actual", exact: true }).click();
  await page.getByRole("button", { name: "Actual", exact: true }).waitFor();
  console.log("ALL PASS");
} finally {
  await browser.close();
}
