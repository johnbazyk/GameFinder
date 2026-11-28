// Synthetic accounts in a disposable auth-enabled embedded DB only.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.GAMEFINDER_TEST_ORIGIN ?? "http://localhost:8099";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  await page.route("**/*", (r) =>
    r
      .request()
      .url()
      .startsWith(base + "/")
      ? r.continue()
      : r.abort(),
  );
  const go = async (path) => {
    await page.goto(base + path, { waitUntil: "domcontentloaded" });
    await page
      .getByRole("status")
      .filter({ hasText: "Loading your table" })
      .waitFor({ state: "hidden" });
  };
  const sign = async (name, create) => {
    await go("/login");
    if (create) {
      await page.getByRole("button", { name: "New here? Create an account" }).click();
      await page.getByRole("textbox", { name: "Display name" }).fill(name);
    }
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill(name.toLowerCase() + "@example.invalid");
    await page.getByLabel("Password", { exact: true }).fill("SyntheticFixtureOnly123!");
    await page
      .getByRole("button", { name: create ? "Create account" : "Sign in", exact: true })
      .click();
    await page.waitForURL(base + "/");
    await go("/profile");
    await page.getByRole("heading", { name, exact: true }).waitFor();
  };
  const leave = async () => {
    await go("/profile");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL(base + "/");
    await go("/profile");
    await page.getByRole("link", { name: "Sign in", exact: true }).waitFor();
  };
  const add = async (title) => {
    await go("/vault");
    await page.getByRole("button", { name: "Can't scan it? Search by title." }).click();
    const dialog = page.getByRole("dialog", { name: "Search by title" });
    await dialog.getByRole("textbox", { name: "Search the catalog" }).fill(title);
    await dialog
      .getByRole("listitem")
      .filter({ hasText: title })
      .first()
      .getByRole("button", { name: "Add", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: title, exact: true }).waitFor();
  };
  const absent = async (title) => {
    await go("/vault");
    await page.getByRole("heading", { level: 1 }).waitFor();
    assert.equal(await page.getByRole("link", { name: title, exact: true }).count(), 0);
  };
  const synced = async (id) => {
    await page.waitForFunction((id) => {
      const state = JSON.parse(localStorage.getItem("gamefinder-v2") ?? "{}").state;
      return state?.vaultBaselines?.["account:" + state.vaultOwnerId]?.owned?.includes(id);
    }, id);
  };
  await sign("FixtureAlpha", true);
  await add("Catan");
  await synced("13");
  await leave();
  await absent("Catan");
  await add("Azul");
  await sign("FixtureBeta", true);
  await absent("Catan");
  await absent("Azul");
  await add("Wingspan");
  await synced("266192");
  await leave();
  await go("/vault");
  await page.getByRole("link", { name: "Azul", exact: true }).waitFor();
  await sign("FixtureAlpha", false);
  await go("/vault");
  await page.getByRole("link", { name: "Catan", exact: true }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Wingspan", exact: true }).count(), 0);
  assert.equal(await page.getByRole("link", { name: "Azul", exact: true }).count(), 0);
  console.log(
    "PASS two authenticated accounts, guest shelf, server-acknowledged saves and sign-out recovery",
  );
  await context.close();
} finally {
  await browser.close();
}
