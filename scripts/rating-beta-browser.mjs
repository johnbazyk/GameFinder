import { spawn } from "node:child_process";
import { chromium } from "playwright";
import assert from "node:assert/strict";
const child = spawn(
  "node",
  [
    "scripts/with-app-env.mjs",
    "node",
    "node_modules/vite/bin/vite.js",
    "dev",
    "--host",
    "127.0.0.1",
    "--strictPort",
    "--port",
    "8080",
  ],
  {
    env: { ...process.env, VITE_GAMEFINDER_RATINGS_MODE: "beta" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let log = "";
child.stdout.on("data", (x) => {
  log += x;
});
child.stderr.on("data", (x) => {
  log += x;
});
let browser;
try {
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) throw Error("Server exited: " + log);
    try {
      const r = await fetch("http://127.0.0.1:8080/wizard");
      if (r.ok) break;
    } catch { /* Vite is starting. */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:8080/game/3931");
  await page.getByRole("img", { name: /Game character/ }).waitFor();
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("gamefinder-v2") ?? '{"state":{}}');
    data.version = 1;
    data.state.owned = ["3931"];
    data.state.lastResults = { ownedTop: [], unownedTop: [] };
    localStorage.setItem("gamefinder-v2", JSON.stringify(data));
  });
  await page.goto("http://127.0.0.1:8080/wizard");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: /Party/ }).first().click();
  await page.getByRole("button", { name: "Sniff it out" }).click();
  const vault = page.locator("section").filter({ has: page.getByRole("heading", { name: "From Your Vault" }) });
  await vault.getByRole("heading", { name: "Connect Four" }).waitFor();
  await vault.getByText(/Closest available/).waitFor();
  assert.equal(await page.locator("article").count(), 4);
  await page.reload();
  await vault.getByRole("heading", { name: "Connect Four" }).waitFor();
  await page.getByRole("button", { name: "Sniff again" }).click();
  await vault.getByText(/seen all matching games/).waitFor();
  await page.goto("http://127.0.0.1:8080/discover");
  await page.getByRole("heading", { name: "What are you looking for?" }).first().waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log("Mobile profile, saved Vault, Find fallback, refresh, reroll and Discover passed.");
} finally {
  await browser?.close();
  child.kill("SIGTERM");
  console.log(log.slice(-1500));
}
