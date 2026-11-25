/** Local auth-off lab only; disposable browser, no external traffic or provider calls. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = "http://127.0.0.1:8092";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.origin === base ? route.continue() : route.abort();
  });
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("recommendation-fixture")) {
      localStorage.setItem(
        "gamefinder-v2",
        JSON.stringify({ version: 2, state: { owned: ["3931"] } }),
      );
      sessionStorage.setItem("recommendation-fixture", "1");
    }
  });
  await page.goto(base + "/wizard");
  for (const next of [
    "How old is the youngest player?",
    "How much time do you want to play?",
    "What kind of game are you in the mood for?",
  ]) {
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: "Skip", exact: true }).click();
      if (
        await page
          .getByRole("heading", { name: next, exact: true })
          .waitFor({ timeout: 2000 })
          .then(
            () => true,
            () => false,
          )
      )
        break;
      if (i === 4) throw Error("Wizard did not advance: " + next);
    }
  }
  await page.getByRole("button", { name: /Party/ }).first().click();
  const warning = page.getByRole("button", { name: "Dismiss sync warning" });
  if (await warning.isVisible()) await warning.click();
  await page.getByRole("button", { name: "Sniff it out" }).click();
  const vault = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "From Your Vault" }) });
  await vault
    .getByRole("heading", { name: "Connect Four" })
    .waitFor()
    .catch(async (e) => {
      console.log(
        "DEBUG",
        page.url(),
        await page.locator("body").innerText(),
        await page.evaluate(() => {
          const s = JSON.parse(localStorage.getItem("gamefinder-v2") || "{}").state;
          return {
            owned: s?.owned,
            wizard: s?.wizard,
            result: s?.lastResults?.ownedTop?.map((g) => g.name),
          };
        }),
      );
      throw e;
    });
  await vault.getByText(/Closest available/).waitFor();
  await vault.getByText(/Below selected Vibe threshold: Party/).waitFor();
  const titles = async () => page.locator("article h3").allTextContents();
  const first = await titles();
  assert.equal(first.length, 4);
  assert.equal(new Set(first).size, 4);
  await page.reload();
  await vault.getByRole("heading", { name: "Connect Four" }).waitFor();
  assert.deepEqual(await titles(), first);
  if (await warning.isVisible()) await warning.click();
  await page.getByRole("button", { name: "Sniff again" }).click();
  await vault.getByText(/seen all matching games/).waitFor();
  assert.ok((await titles()).every((t) => !first.includes(t)));
  await page.goto(base + "/discover");
  await page.getByRole("heading", { name: "What are you looking for?" }).first().waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log(
    "PASS wizard, closest-match disclosure, 1+3 results, refresh, no-repeat reroll, Discover mobile layout",
  );
} finally {
  await browser.close();
}
