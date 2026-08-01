#!/usr/bin/env node
/*
 * Self-check for the Command Corporation customer proof page.
 *
 * Usage:
 *   node check.mjs           -> publish mode: fails on any placeholder or draft marker
 *   node check.mjs --draft   -> draft mode: allows placeholders, still checks structure
 *
 * Every check below exists because the equivalent mistake actually happened
 * on the build this page is modeled on. Reading the page does not catch
 * these; only a machine does.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFT = process.argv.includes("--draft");
const file = path.join(__dirname, "index.html");
const html = fs.readFileSync(file, "utf8");

let failures = 0;
let warnings = 0;

function fail(msg) { failures++; console.log("  FAIL  " + msg); }
function warn(msg) { warnings++; console.log("  warn  " + msg); }
function ok(msg)   { console.log("  ok    " + msg); }

console.log((DRAFT ? "DRAFT" : "PUBLISH") + " check on " + file + "\n");

/* 1. Placeholders. The page must not ship with template text. */
const placeholders = html.match(/\[REPLACE[^\]]*\]/g) || [];
if (placeholders.length > 0) {
  const msg = placeholders.length + " [REPLACE] placeholder(s) remain. First few: " +
    placeholders.slice(0, 3).join(" | ");
  DRAFT ? warn(msg) : fail(msg);
} else {
  ok("no [REPLACE] placeholders");
}

/* 2. Draft ribbon must be gone before publish. */
if (html.includes("draft-ribbon")) {
  DRAFT ? warn("draft ribbon still present (fine in draft mode)")
        : fail("draft ribbon still present — delete the .draft-ribbon div and its CSS block");
} else {
  ok("draft ribbon removed");
}
if (html.includes("placeholder-flag") && !DRAFT) {
  fail('class "placeholder-flag" still present on ' +
    (html.match(/placeholder-flag/g) || []).length + " element(s) — remove it once real content is in");
} else if (!html.includes("placeholder-flag")) {
  ok("no placeholder-flag classes");
}

/* 3. Nested HTML comments. A comment containing comment syntax broke the
      original page and survived several human reviews. */
const commentBodies = html.match(/<!--([\s\S]*?)-->/g) || [];
let nested = 0;
for (const c of commentBodies) {
  const body = c.slice(4, -3);
  if (body.includes("<!--") || body.includes("-->")) nested++;
}
nested ? fail(nested + " HTML comment(s) contain comment syntax inside them")
       : ok("no nested comment syntax in " + commentBodies.length + " comments");

/* 4. Section counts. A rebuild once silently deleted a whole section; the
      only tell was a count going down. Update EXPECTED when you
      intentionally add or remove items. */
const EXPECTED = {
  "top-level sections (section.block/.cta + stats band)": {
    count: (html.match(/<section class="block/g) || []).length +
           (html.match(/<section class="cta"/g) || []).length +
           (html.match(/class="stats"/g) || []).length,
    min: 6,
  },
  "video cards":   { count: (html.match(/class="video-card/g) || []).length,  min: 3 },
  "review cards":  { count: (html.match(/class="review-card/g) || []).length, min: 6 },
  "FAQ entries":   { count: (html.match(/<details class="faq">/g) || []).length, min: 13 },
  "transcripts":   { count: (html.match(/class="transcript"/g) || []).length, min: 3 },
};
for (const [name, { count, min }] of Object.entries(EXPECTED)) {
  count >= min ? ok(name + ": " + count + " (expected >= " + min + ")")
               : fail(name + ": " + count + " but expected at least " + min + " — did an edit delete something?");
}

/* 5. Every review card needs a link back to its original source. */
const reviewCards = (html.match(/class="review-card/g) || []).length;
const sourceLinks = (html.match(/data-source-url/g) || []).length;
sourceLinks >= reviewCards
  ? ok("every review card has a source link (" + sourceLinks + "/" + reviewCards + ")")
  : fail((reviewCards - sourceLinks) + " review card(s) missing a data-source-url link to the original review");

/* 6. Star ratings. Copy-pasting a reviews page once produced five stars on
      every review, including a furious one. Identical stars everywhere is
      a smell, not proof — verify each one on the live listing. */
const starVals = [...html.matchAll(/data-stars="([^"]*)"/g)].map((m) => m[1]);
if (starVals.length && starVals.every((v) => v === starVals[0]) && starVals.length >= 6) {
  warn('all ' + starVals.length + ' reviews show identical star value "' + starVals[0] +
    '" — confirm each rating on the live listing, not from a copy-paste');
} else if (starVals.length) {
  ok("star ratings vary or are few enough to have been hand-checked");
}
/* Star glyphs should match the declared number. */
let starMismatch = 0;
for (const m of html.matchAll(/data-stars="(\d)"[^>]*>([^<]*)</g)) {
  const declared = parseInt(m[1], 10);
  const glyphs = (m[2].match(/★/g) || []).length;
  if (glyphs !== declared) starMismatch++;
}
starMismatch ? fail(starMismatch + " review(s) where the ★ glyphs don't match data-stars")
             : ok("star glyphs match declared ratings");

/* 7. Structured data must parse as JSON. */
const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
if (!ldBlocks.length) fail("no JSON-LD structured data block found");
for (const [i, m] of ldBlocks.entries()) {
  try { JSON.parse(m[1]); ok("JSON-LD block " + (i + 1) + " parses"); }
  catch (e) { fail("JSON-LD block " + (i + 1) + " is invalid JSON: " + e.message); }
}

/* 8. Duplicate ids. */
const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
dupes.length ? fail("duplicate id(s): " + [...new Set(dupes)].join(", "))
             : ok("no duplicate ids");

/* 9. Canonical URL should not point at a placeholder or localhost. */
const canon = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1] || "";
if (!canon) fail("no canonical link tag");
else if (/REPLACE|localhost|example\./.test(canon)) fail("canonical URL looks unfinished: " + canon);
else ok("canonical URL: " + canon);

/* 10. Cross-file drift: facts that must agree between index.html and llms.txt.
       Supporting files rot while the main file gets rebuilt. */
const llmsPath = path.join(__dirname, "llms.txt");
if (fs.existsSync(llmsPath)) {
  const llms = fs.readFileSync(llmsPath, "utf8");
  const facts = ["1991", "East Granby", "(860) 653-1717", "Connecticut", "New Hampshire", "Massachusetts"];
  for (const f of facts) {
    const inHtml = html.includes(f);
    const inLlms = llms.includes(f);
    if (inHtml && !inLlms) fail('fact "' + f + '" is in index.html but missing from llms.txt (files drifting)');
    else if (!inHtml && inLlms) fail('fact "' + f + '" is in llms.txt but missing from index.html (files drifting)');
    else ok('fact "' + f + '" consistent across files');
  }
} else {
  warn("llms.txt not found next to index.html");
}

console.log("\n" + (failures ? "RESULT: " + failures + " failure(s), " + warnings + " warning(s) — do not upload."
                             : "RESULT: passed with " + warnings + " warning(s)." +
                               (DRAFT ? "" : " Safe to upload — then run Google's Rich Results Test on the LIVE url.")));
process.exit(failures ? 1 : 0);
