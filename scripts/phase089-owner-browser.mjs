/** Disposable auth-off local server; no external requests or customer data. */
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
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === base ? r.continue() : r.abort(),
  );
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("phase089-seeded")) {
      localStorage.setItem(
        "gamefinder-v2",
        JSON.stringify({
          version: 2,
          state: { vaultOwnerId: "dev-user", owned: ["3931", "13", "266192", "230802", "9209"] },
        }),
      );
      sessionStorage.setItem("phase089-seeded", "1");
    }
  });
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("gamefinder-v2")).state);
  const go = async (path) => {
    assert.equal((await page.goto(base + path, { waitUntil: "domcontentloaded" })).status(), 200);
    await page
      .getByRole("status")
      .filter({ hasText: "Loading your table" })
      .waitFor({ state: "hidden" });
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
  const banner = page.getByRole("complementary", { name: "Advertisement" });
  await mode("Free");
  for (const path of [
    "/",
    "/vault",
    "/discover",
    "/profile",
    "/wizard",
    "/results",
    "/game/3931",
    "/recently-played",
    "/scoreboard",
    "/table-setup",
    "/premium",
  ]) {
    await go(path);
    await banner.waitFor();
    assert.equal(await banner.count(), 1, path);
  }
  console.log("PASS one Free banner on 11 normal routes");
  await go("/discover");
  await page.getByText("Featured Games", { exact: true }).waitFor();
  const more = page.getByRole("button", { name: "More players" });
  await more.waitFor();
  assert.equal(await page.getByRole("button", { name: "Fewer players" }).isDisabled(), true);
  await more.click();
  await page.getByText("1", { exact: true }).first().waitFor();
  await more.click();
  await page.getByText("2", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Any number of players" }).click();
  assert.equal(
    await page.getByRole("button", { name: "Any number of players" }).getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(await page.getByRole("button", { name: "Set player count" }).count(), 0);
  console.log("PASS always-visible Discover count and featured list");
  await go("/game/3931");
  await page.getByText("How it plays", { exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "GameFinder Vibes" }).count(), 0);
  console.log("PASS spider graph retained without Vibe score list");
  await go("/");
  await page.getByRole("button", { name: "Surprise Me", exact: true }).click();
  const a = (await state()).lastSurpriseId;
  assert.ok((await state()).owned.includes(a));
  await page.getByRole("button", { name: "Surprise me again", exact: true }).click();
  const b = (await state()).lastSurpriseId;
  assert.ok((await state()).owned.includes(b));
  assert.notEqual(a, b);
  console.log("PASS Surprise Me owned only and avoids previous pick");
  await go("/wizard");
  await page.getByRole("button", { name: "Fewer players" }).click();
  await page.getByRole("button", { name: "Fewer players" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "8–10", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "30 minutes or less", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Sniff it out" }).click();
  await page.getByRole("heading", { name: "Finn found your games" }).waitFor();
  const result = (await state()).lastResults;
  assert.equal(result.appliedFilters.players, 2);
  assert.equal(result.appliedFilters.ageBand, "8-10");
  assert.equal(result.appliedFilters.maxTimeMin, 30);
  const matches = [...result.ownedTop, ...result.unownedTop];
  assert.ok(matches.length);
  for (const g of matches) {
    assert.ok(g.players.min <= 2 && g.players.max >= 2);
    assert.ok(g.age.publisher <= 8);
    assert.ok(g.playtime.max <= 30);
  }
  await page.getByRole("button", { name: "Sniff again" }).click();
  const next = (await state()).lastResults;
  assert.ok(
    [...next.ownedTop, ...next.unownedTop].every((g) => !matches.some((a) => a.bggId === g.bggId)),
  );
  console.log("PASS Find a Game hard constraints and no-repeat reroll");
  await mode("Premium");
  for (const path of [
    "/",
    "/vault",
    "/discover",
    "/profile",
    "/wizard",
    "/results",
    "/game/3931",
    "/recently-played",
    "/scoreboard",
    "/table-setup",
    "/premium",
  ]) {
    await go(path);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await banner.waitFor({ state: "hidden" });
  }
  console.log("PASS Premium banner absent on 11 normal routes");
  await go("/wizard");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.getByRole("button", { name: "Advanced exact-score filters" }).click();
  await page.getByRole("checkbox", { name: "Strategy", exact: true }).check();
  await page.getByRole("combobox", { name: "Strategy comparison" }).selectOption("exact");
  await page.getByRole("spinbutton", { name: "Strategy score" }).fill("4");
  await page.getByRole("button", { name: "Sniff it out" }).click();
  await page.getByRole("heading", { name: "Finn found your games" }).waitFor();
  assert.deepEqual((await state()).lastResults.appliedFilters.ratingTargets.strategy, {
    kind: "exact",
    value: 4,
  });
  console.log("PASS Premium exact-score filter applied");
  await go("/game/3931/score");
  await page.getByRole("heading", { name: "Connect Four scorecard" }).waitFor();
  for (const name of ["Test Alice", "Test Bob"]) {
    await page.getByPlaceholder("Add a name").fill(name);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("button", { name, exact: true }).click();
  }
  const resultSection = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Result", exact: true }) });
  await resultSection.getByRole("button", { name: "Test Alice", exact: true }).click();
  await page.getByRole("button", { name: "Save to the ledger" }).click();
  await page.getByRole("heading", { name: "This game, forever" }).waitFor();
  const s = await state();
  assert.equal(s.scoreSessions.length, 1);
  assert.equal(s.plays[0].bggId, "3931");
  await go("/scoreboard");
  await page.getByRole("heading", { name: "Lifetime standings" }).waitFor();
  const standing = page.locator("ol li").filter({ hasText: "Test Alice" });
  await standing.waitFor();
  assert.match(await standing.innerText(), /1\s*wins/i);
  await go("/recently-played");
  await page.getByRole("heading", { name: "Scored games" }).waitFor();
  await page.getByText("Connect Four", { exact: true }).first().waitFor();
  await page.getByText(/Test Alice ·/).waitFor();
  console.log("PASS score save, winner standings, recently played after reload");
  await mode("Actual");
  console.log("ALL PASS");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
