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
    } catch {}
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
  await page.getByText("How it plays · standard 0.3").waitFor();
  await page.getByLabel("Rating player count").fill("2");
  await page.getByText("Family age context").locator("select").selectOption("8-10");
  assert.match(await page.locator("body").innerText(), /Strategy: 4 \/ 5 · Provisional/);
  await page.getByText("After playing: did this match the vibe?").click();
  await page.getByLabel("We played this edition and mode").check();
  await page.getByText("Save feedback on this device", { exact: true }).click();
  await page.getByText("Saved on this device.", { exact: false }).waitFor();
  const feedback = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("gamefinder-rating-feedback-03")),
  );
  assert.equal(feedback.length, 1);
  assert.equal(feedback[0].standardVersion, "0.3");
  await page.goto("http://127.0.0.1:8080/discover");
  await page.getByText("Beta: ratings are provisional", { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log(
    "Browser smoke passed: mobile profile, scoped scores, local feedback, Discover disclosure, no page exceptions.",
  );
} finally {
  await browser?.close();
  child.kill("SIGTERM");
  console.log(log.slice(-1500));
}
