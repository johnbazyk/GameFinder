/** Disposable development server only; no provider requests or real accounts. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = "http://127.0.0.1:8110";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  page.setDefaultTimeout(30000);
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === base ? r.continue() : r.abort(),
  );
  const go = async (path) => {
    const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
    assert.ok(response.status() < 400);
    await page.locator("[data-app-footer]").waitFor({ state: "attached" });
  };
  const mode = async (name) => {
    await go("/profile");
    await page.getByRole("heading", { name: "Subscription testing" }).waitFor();
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForFunction(
      (name) =>
        [...document.querySelectorAll("button")].some(
          (b) => b.textContent.trim() === name && b.getAttribute("aria-pressed") === "true",
        ),
      name,
    );
  };
  const ad = page.locator('[aria-label="Advertisement"]');
  const routes = [
    "/",
    "/vault",
    "/discover",
    "/profile",
    "/wizard",
    "/results",
    "/game/3931",
    "/game/3931/teach",
    "/game/3931/score",
    "/game/3931/table",
    "/recently-played",
    "/scoreboard",
    "/table-setup",
    "/premium",
    "/circle",
    "/internal/flags",
    "/login",
    "/signup",
    "/invite/invalid-fixture",
  ];
  const quick = process.env.GAMEFINDER_BANNER_QUICK === "1";
  const widths = [320, 390, 1280];
  const paths = (width) =>
    quick && width !== 390 ? ["/", "/vault", "/wizard", "/game/3931", "/profile"] : routes;
  await mode("Free");
  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of paths(width)) {
      await go(path);
      await page.locator('[data-ad-plan="free"]').waitFor();
      await ad.waitFor();
      assert.equal(await ad.count(), 1, path);
      const geometry = await page.evaluate(() => {
        const a = document.querySelector('[aria-label="Advertisement"]'),
          r = a.getBoundingClientRect(),
          footer = document.querySelector("[data-app-footer]");
        const nav = footer.querySelector("nav");
        const n = nav?.getBoundingClientRect();
        return {
          inside: footer.contains(a),
          bottom: r.bottom,
          height: r.height,
          viewport: innerHeight,
          navBottom: n?.height ? n.bottom : null,
          top: r.top,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      });
      assert.ok(geometry.inside);
      assert.equal(geometry.height, 50);
      assert.ok(Math.abs(geometry.bottom - geometry.viewport) < 2);
      assert.ok(geometry.navBottom === null || geometry.navBottom <= geometry.top + 1);
      assert.equal(geometry.overflow, false, path);
    }
    await go("/wizard");
    await ad.waitFor();
    const next = page.getByRole("button", { name: "Next", exact: true });
    await next.scrollIntoViewIfNeeded();
    assert.ok(
      (await next.boundingBox()).y + (await next.boundingBox()).height <=
        (await ad.boundingBox()).y + 1,
    );
    await go("/vault");
    await ad.waitFor();
    await page.getByRole("button", { name: "Scan Games", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Scan games" });
    await dialog.waitFor();
    const rect = await dialog.boundingBox();
    assert.ok(rect.y + rect.height <= (await ad.boundingBox()).y + 1);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    console.log(
      "PASS Free footer geometry, " + paths(width).length + " routes, wizard, scan dialog",
      width,
    );
  }
  await mode("Premium");
  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of paths(width)) {
      await go(path);
      await page.locator('[data-ad-plan="premium"]').waitFor({ state: "attached" });
      await page.waitForFunction(
        () =>
          !document.querySelector(".app-has-ad") &&
          !document.querySelector('[aria-label="Advertisement"]'),
      );
      assert.equal(await ad.count(), 0, path);
      assert.equal(await page.locator(".app-ad-space").count(), 0, path);
    }
    console.log("PASS Premium zero ad slots on " + paths(width).length + " routes", width);
  }
  await mode("Actual");
  console.log("ALL PASS");
} finally {
  await browser.close();
}
