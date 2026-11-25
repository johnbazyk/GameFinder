/**
 * Local-only acceptance test. Run against the isolated, explicitly enabled
 * auth-off development server. Never point this at a deployed environment.
 * Uses a disposable browser context, no real accounts or provider calls.
 */
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const base = "http://127.0.0.1:8097";
const ids = [
  ...new Set(
    [
      ...readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8").matchAll(
        /bggId: "(\d+)"/g,
      ),
    ].map((x) => x[1]),
  ),
]
  .filter((x) => !["13", "178900"].includes(x))
  .slice(0, 50);
assert.equal(ids.length, 50);
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(30000);
  await page.route("**/*", (route) =>
    route.request().url().startsWith(base) ? route.continue() : route.abort(),
  );
  await page.addInitScript((ids) => {
    if (!sessionStorage.getItem("fixture-seeded")) {
      localStorage.setItem(
        "gamefinder-v2",
        JSON.stringify({ state: { owned: ids, vaultOwnerId: "dev-user" }, version: 2 }),
      );
      sessionStorage.setItem("fixture-seeded", "1");
    }
  }, ids);
  const go = async (path) => {
    const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
    assert.equal(response.status(), 200);
  };
  const mode = async (m) => {
    await go("/internal/flags");
    await page.getByRole("heading", { name: "Subscription testing" }).waitFor();
    await page.getByRole("button", { name: m, exact: true }).click();
    await page.waitForFunction(
      (m) =>
        [...document.querySelectorAll("button")].some(
          (b) => b.textContent.trim() === m && b.getAttribute("aria-pressed") === "true",
        ),
      m,
    );
    console.log("PASS mode", m);
  };
  const count = async (n) => {
    await page.waitForFunction(
      (n) => JSON.parse(localStorage.getItem("gamefinder-v2") || "{}").state?.owned?.length === n,
      n,
    );
  };
  const advanceWizard = async () => {
    await go("/wizard");
    for (const [before, after] of [
      ["How many people are playing?", "How old is the youngest player?"],
      ["How old is the youngest player?", "How much time do you want to play?"],
      ["How much time do you want to play?", "What kind of game are you in the mood for?"],
    ]) {
      await page.getByRole("heading", { name: before, exact: true }).waitFor();
      // SSR can expose a button before hydration attaches its click handler.
      const next = page.getByRole("button", { name: "Skip", exact: true });
      for (let attempt = 0; attempt < 5; attempt++) {
        await next.click();
        if (
          await page
            .getByRole("heading", { name: after, exact: true })
            .waitFor({ timeout: 2000 })
            .then(
              () => true,
              () => false,
            )
        )
          break;
        if (attempt === 4) throw new Error("Wizard did not advance from " + before);
      }
    }
  };
  await mode("Free");
  await go("/premium");
  await page
    .getByText(
      "Checkout is disabled until Stripe pricing and subscription management are configured.",
    )
    .waitFor();
  assert.equal(await page.getByRole("button", { name: /Monthly.*4\.99/ }).isDisabled(), true);
  assert.equal(await page.getByRole("button", { name: /Annual.*44\.99/ }).isDisabled(), true);
  console.log("PASS locked pricing");
  await go("/vault");
  await count(50);
  await page.getByText(/50\s*\/\s*50 owned/).waitFor();
  await page.getByText("Ad · GameFinder Free", { exact: true }).waitFor();
  console.log("PASS Free Vault and banner");
  await go("/game/13");
  await page.getByRole("button", { name: "Add to Vault", exact: true }).click();
  console.log(
    "AFTER ADD",
    await page.evaluate(() => ({
      count: JSON.parse(localStorage.getItem("gamefinder-v2") || "{}").state?.owned?.length,
      text: document.body.innerText.slice(-1000),
    })),
  );
  await page.getByText("Free vaults hold up to 50 games.", { exact: false }).waitFor();
  await count(50);
  console.log("PASS Free 51st game rejected");
  await go("/scoreboard");
  await page.getByRole("heading", { name: "Scores & Win History is Premium" }).waitFor();
  console.log("PASS Free scoreboard locked");
  await advanceWizard();
  await page.getByRole("button", { name: "Premium · Exact-score filters" }).waitFor();
  console.log("PASS Free exact filters locked");
  await go("/game/13/teach");
  await page.getByRole("heading", { name: "Learn with Finn is Premium" }).waitFor();
  console.log("PASS Free Finn locked");
  await mode("Premium");
  await go("/vault");
  await page.getByText(/^50 owned/).waitFor();
  assert.equal(await page.getByText("Ad · GameFinder Free", { exact: true }).count(), 0);
  console.log("PASS Premium banner hidden");
  await go("/game/13");
  await page.getByRole("button", { name: "Add to Vault", exact: true }).click();
  console.log(
    "AFTER ADD",
    await page.evaluate(() => ({
      count: JSON.parse(localStorage.getItem("gamefinder-v2") || "{}").state?.owned?.length,
      text: document.body.innerText.slice(-1000),
    })),
  );
  await page.getByRole("button", { name: "In Your Vault" }).waitFor();
  await count(51);
  await go("/vault");
  await page.getByText(/^51 owned/).waitFor();
  console.log("PASS Premium 51st game accepted");
  await go("/scoreboard");
  await page.getByRole("heading", { name: "Lifetime standings" }).waitFor();
  console.log("PASS Premium scoreboard");
  await advanceWizard();
  await page.getByRole("button", { name: "Advanced exact-score filters", exact: true }).click();
  console.log("PASS Premium advanced control opened");
  await go("/game/13/teach");
  await page.getByRole("heading", { name: "Learn with Finn" }).waitFor();
  console.log("PASS Premium Finn unlocked");
  await mode("Free");
  await go("/vault");
  await count(51);
  await page.getByText(/51\s*\/\s*50 owned/).waitFor();
  console.log("PASS downgrade preserves all 51");
  await go("/game/178900");
  await page.getByRole("button", { name: "Add to Vault", exact: true }).click();
  console.log(
    "AFTER ADD",
    await page.evaluate(() => ({
      count: JSON.parse(localStorage.getItem("gamefinder-v2") || "{}").state?.owned?.length,
      text: document.body.innerText.slice(-1000),
    })),
  );
  await page.getByText("Free vaults hold up to 50 games.", { exact: false }).waitFor();
  await count(51);
  console.log("PASS downgrade additional game blocked");
  await mode("Actual");
  console.log("ALL PASS");
} finally {
  await browser.close();
}
