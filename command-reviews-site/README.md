# Command Corporation — Customer Proof Page

A single-file customer reviews site for Command Corporation (cmdsecure.ai),
modeled on the HoosierSecurityReviews.com build: video testimonials with
full transcripts, written reviews linked to source, a 13-question FAQ, and
hand-written structured data. No website builder, no plugins, no monthly fee.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The entire site. Everything lives in this one file. |
| `check.mjs` | Self-check. Run `node check.mjs` — it refuses to pass while placeholders remain, and catches the specific mistakes that bit the original build. |
| `llms.txt` | Plain-text company summary for AI assistants. `check.mjs` verifies it hasn't drifted from the page. |
| `robots.txt` / `sitemap.xml` | Standard crawler files. Update the domain in both if you don't use `reviews.cmdsecure.ai`. |

## What's already real (verified from public sources)

- Company name, East Granby CT base, New Hampton NH office
- Founded 1991, family owned and operated
- Service area: CT, MA, NH
- Phone (860) 653-1717
- Services list, links to BBB / Yelp / Facebook profiles
- 13-question FAQ, structured data (LocalBusiness + page markup), disclosure language

**Verify the address before publishing.** Directory listings show both
"4 Creamery Brook" and "59 Rainbow Road" in East Granby. The page and
`llms.txt` currently say 4 Creamery Brook — correct it in *both* files if
that's wrong (check.mjs will catch a mismatch of key facts, not the street).

## What you must fill in (marked `[REPLACE: …]` and outlined in yellow)

Nothing on this page is invented. Every review slot is a template, because
publishing reviews requires the real text, verified on the live listing.

1. **Written reviews (6 slots).** Copy a card, change five things: stars,
   text, name, source + date, link to the original. Add more by copying a
   whole card.
2. **Video testimonials (3 slots).** YouTube video ID, customer name,
   customer-since year, corrected transcript.
3. **Google Business Profile link** in "Verify us yourself".
4. **CT license number(s)** in FAQ #1, and the central-station answer in FAQ #5.
5. **The measured-number stat** (4th stat box) — or delete that box entirely.
6. **Canonical URL** in `<head>` if not using `reviews.cmdsecure.ai`.

Then delete the draft ribbon (the `.draft-ribbon` div and its CSS block)
and remove the `placeholder-flag` classes as each slot gets real content.

### Adding a measured number

The strongest thing on the Hoosier page was two service numbers almost
nobody publishes. Command has the data to do the same (Workiz /
ServiceChannel in the Nightfall warehouse). Rules, or delete the box:

- Measure to a **confirmed fix**, not a first phone call.
- State the **measurement window** on the page ("all 2025 service tickets").
- Verify the number against the source system before publishing it.

## Rules that are not optional

- **Never invent or paraphrase a review.** Verbatim text, linked to source.
- **Check every reviewer name against the staff list.** Publishing an
  employee's review as a customer testimonial violates the FTC's 2024
  review rule. (The original build found two on its own profile.)
- **Read the star count off the live listing** for each review. Copy-pasted
  review pages showed five stars on every review, including a furious one.
- **Never publish an auto-caption unread.** YouTube turned "Hoosier" into
  "Hooters" and inserted a negative that reversed a sentence. Fix
  transcripts by ear.
- **Customer-since years come from the first invoice on the account**, not
  the CRM "date acquired" field — on the original build 1,685 records
  shared the same fake date. Count how many records share a value before
  trusting a date field.
- **Confirm a featured customer is still active** (has been invoiced
  recently) before putting them on the page.
- **Get consent** before publishing any name, employer, or contact detail
  that isn't already public on a review platform.

## Launch checklist

1. Fill every `[REPLACE]` slot, or delete the slot.
2. `node check.mjs` → must pass with zero failures. (`node check.mjs --draft`
   while still working.)
3. **Preview from a real URL, not by double-clicking the file.** A page
   opened from disk has no origin, so YouTube embeds throw Error 153.
   That cost the original build two investigations. `npx serve` or any
   host works.
4. Check video orientation: measure the actual thumbnail. Four of nine
   Hoosier videos were portrait; a "shorts" URL tells you nothing. Add
   class `portrait` to the thumb button for vertical video.
5. Upload, then immediately run the live URL through **Google's Rich
   Results Test**. The original build had 21 invalid items that nothing
   local caught. Fix and re-test.
6. Add the property in **Google Search Console** and request indexing.
7. **Link to this page from cmdsecure.ai's main navigation or footer.**
   This is the highest-impact, easiest-to-skip step: a page nobody links
   to can sit unindexed for weeks (or forever). A subdomain
   (`reviews.cmdsecure.ai`) or a path (`cmdsecure.ai/reviews/`) starts
   with far more authority than a brand-new domain.
8. Watch Search Console for the page outranking the homepage for
   "command corporation" — if it happens, soften the H1.
9. Log reference requests and "found you through the reviews page"
   mentions for 90 days, so next time the value claim is measured instead
   of "insufficient data".

## Optional: review/aggregate-rating structured data

Once real reviews are in, you can add `AggregateRating` and per-`Review`
markup to the JSON-LD — but only with values read off the live profiles
that day, and note that Google generally ignores self-serving review
markup on LocalBusiness pages. The FAQ and LocalBusiness markup are the
durable wins; treat review markup as a bonus.

## Maintenance

To add a review later: open `index.html`, copy one review card, paste it
at the **top** of the review grid (newest first), change five things, run
`node check.mjs`, re-upload one file. No coding, no login, nothing to patch.
