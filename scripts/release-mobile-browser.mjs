// Disposable local lab only. No real accounts, external requests or payments.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = "http://127.0.0.1:8098";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", (route) =>
      route
        .request()
        .url()
        .startsWith(base + "/")
        ? route.continue()
        : route.abort(),
    );
    const go = async (path) => {
      const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
      assert.equal(response.status(), 200);
      await page
        .getByRole("status")
        .filter({ hasText: "Loading your table" })
        .waitFor({ state: "hidden" });
    };
    await go("/vault");
    const scanner = page.getByRole("button", { name: "Scan Games", exact: true });
    await scanner.waitFor();
    await scanner.click();
    const dialog = page.getByRole("dialog", { name: "Scan games" });
    await dialog.waitFor();
    assert.equal(await dialog.getByText(/recognition stays on this device/).count(), 1);
    assert.equal(await dialog.getByText(/Optional external recognition/).count(), 0);
    await dialog.getByRole("button", { name: "Search or add a missing title" }).click();
    const manual = page.getByRole("dialog", { name: "Search by title" });
    await manual.waitFor();
    await manual.getByRole("textbox", { name: "Search the catalog" }).fill("Catan");
    await page.keyboard.press("Escape");
    await manual.waitFor({ state: "hidden" });
    await dialog.waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    for (const path of ["/", "/vault", "/discover", "/profile", "/premium"]) {
      await go(path);
      await page.getByRole("heading", { level: 1 }).first().waitFor();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      assert.equal(overflow, false, width + "px " + path + " horizontal overflow");
      console.log("PASS", width, path);
    }
    assert.deepEqual(errors, []);
    console.log("PASS dialogs and local-only scan", width);
    await context.close();
  }
} finally {
  await browser.close();
}
