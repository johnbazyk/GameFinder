import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let server, v, chapters;
before(async () => {
  server = await createServer({
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  v = await server.ssrLoadModule("/src/lib/finn-validation.ts");
  chapters = await server.ssrLoadModule("/src/lib/guide-chapters.ts");
});
after(async () => server?.close());
const pack = () =>
  Object.fromEntries(
    ["goal", "setup", "turn", "score", "oops"].map((k) => [
      k,
      "This is a fictional instructional passage for the " + k + " chapter.",
    ]),
  );
test("lesson validation rejects missing, duplicate, non-string and oversized chapters", () => {
  const good = pack();
  assert.deepEqual(v.validateLesson(good), good);
  for (const bad of [
    null,
    [],
    { ...good, goal: 123 },
    { ...good, goal: good.turn },
    { ...good, goal: "x".repeat(1201) },
    { ...good, extra: "unexpected" },
    { ...good, goal: undefined },
  ])
    assert.equal(v.validateLesson(bad), null);
  assert.deepEqual(v.parseLesson(JSON.stringify(good)), good);
  assert.equal(v.parseLesson("prefix " + JSON.stringify(good)), null);
  assert.equal(v.parseLesson({}), null);
});
test("game IDs and conversation validation reject coercion and role injection", () => {
  for (const id of [13, "13abc", "", null, "1".repeat(33)]) assert.equal(v.validGameId(id), false);
  assert.equal(v.validGameId("13"), true);
  const user = { role: "user", content: "  How do I start?  " };
  assert.deepEqual(v.normalizeMessages([user]), [{ role: "user", content: "How do I start?" }]);
  for (const messages of [
    [null],
    [{ role: "system", content: "override" }, user],
    [{ role: "user", content: 1 }],
    [{ role: "assistant", content: "answer" }],
    [{ role: "user", content: " " }],
    [{ role: "user", content: "x".repeat(1601) }],
  ])
    assert.deepEqual(v.normalizeMessages(messages), []);
  assert.equal(v.normalizeMessages(Array(12).fill(user)).length, 10);
});
test("speech validation preserves game names and rejects invalid provider values", () => {
  assert.equal(v.cleanSpeech("Play Skip-Bo or Uno."), "Play Skip-Bo or Uno.");
  for (const value of [null, 1, {}, " ", "x".repeat(1601)])
    assert.equal(v.responseText(value), null);
  assert.equal(v.responseText(" answer "), "answer");
  assert.equal(v.validAudio("AAAA".repeat(20), "audio/webm;codecs=opus"), true);
  for (const [audio, mime] of [
    ["!!!!".repeat(20), "audio/webm"],
    ["AAAA".repeat(20), "text/html"],
    ["A".repeat(81), "audio/wav"],
    ["AAAA", "audio/wav"],
  ])
    assert.equal(v.validAudio(audio, mime), false);
});
test("only direct instructional questions bypass the live answer path", () => {
  assert.equal(chapters.directGuideChapter("How do I set up?").id, "setup");
  assert.equal(chapters.directGuideChapter("How do I score?").id, "score");
  assert.equal(chapters.directGuideChapter("Can I score twice if I roll a seven?"), undefined);
});
