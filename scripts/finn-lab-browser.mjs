/** Disposable local-only browser acceptance. Requires a fresh auth-off lab on port 8093, no API key or external database. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = "http://127.0.0.1:8093";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === base ? r.continue() : r.abort(),
  );
  await page.goto(base + "/internal/flags");
  await page.getByRole("heading", { name: "Subscription testing" }).waitFor();
  await page.getByRole("button", { name: "Premium", exact: true }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent.trim() === "Premium" && b.getAttribute("aria-pressed") === "true",
    ),
  );
  await page.goto(base + "/game/13/teach");
  await page.getByRole("heading", { name: "Learn with Finn", exact: true }).waitFor();
  await page.getByText(/Not independently verified against your edition/).waitFor();
  await page.getByRole("button", { name: "Start the lesson" }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("audio")].some((a) => a.currentTime > 0 && !a.paused),
  );
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await page.getByRole("heading", { name: "Set the table", exact: true }).waitFor();
  const question = page.getByRole("textbox", { name: "Your rules question" });
  await question.fill("How do I set up?");
  await page.getByRole("button", { name: "Ask Finn", exact: true }).click();
  await page.getByText(/Quick-start guide · Set the table · Check your edition/).waitFor();
  await question.fill("What happens on a seven?");
  await page.getByRole("button", { name: "Ask Finn", exact: true }).click();
  await page
    .getByText(/Catan quick-start answer · Check your edition|Related guide passage/)
    .waitFor();
  await question.fill("Can I tunnel underground?");
  await page.getByRole("button", { name: "Ask Finn", exact: true }).click();
  await page.getByText(/couldn’t find that ruling/).waitFor();
  await page.goto(base + "/game/41114/teach");
  await page.getByText(/Finn cannot identify this game reliably/).waitFor();
  assert.equal(await page.getByRole("textbox", { name: "Your rules question" }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Start the lesson" }).count(), 0);
  await page.goto(base + "/internal/flags");
  await page.getByRole("button", { name: "Free", exact: true }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent.trim() === "Free" && b.getAttribute("aria-pressed") === "true",
    ),
  );
  await page.goto(base + "/game/13/teach");
  await page.getByRole("heading", { name: "Learn with Finn is Premium" }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS Premium access, audio playback, chapter navigation, guide answer, Catan answer, unknown ruling, ambiguous identity, Free gate",
  );
} finally {
  await browser.close();
}
