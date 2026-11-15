# All-Libya build: progress

The plan is the PRD "Libya: Open Source — product requirements" (https://claude.ai/artifact/WTFJfEp5QseMHHa9DqW2qJ).
This file is the hand-over between work sessions: read it first, do the next unticked chunk, tick it, commit.

Standing rules for every chunk
- Work on branch `libya` (cut from `more-sources`). Do not push to `main`, start a paid run, or change the live
  database: those wait for the owner. Commit after each chunk with a plain message.
- Research rules in CLAUDE.md apply everywhere: nothing invented, every item traceable to a fetched source,
  positions only where a source gives one.
- Look and behaviour follow the workstation specification already in `public/workstation.css` (tokens, 1px borders,
  no shadows, mono for numbers) and the analyst standard: dated, sourced, graded, formal wording.
- Each chunk ends with a check that is written down here: what was run and what it showed.

## Chunk 0. Finish the current collection work
- [x] Cable re-download finished. 4,938 Embassy Tripoli telegrams listed (1973-79); 444 downloaded (the ones whose subject line suggested security, arrests, the university, the embassy and so on); 386 have text, 58 pages had none.
      156 of the 386 mention a kind of place (prison, street, square, hospital...); only 13 use a Tripoli place name from the map's list.
- [x] Cost to read: at the last run's rate by the script's own count ($0.00041 a document) the 386 cost about $0.16 and all 4,938 about $2. The script's price figures are unverified, so treat these as a floor. Waiting for the owner (see below).

## Phase A. Foundations
- [x] A1 Claim model (`scripts/build-claims.mjs`, `archive/model/`): 620 subjects, 547 sources, 1,122 claims; loads into SQLite with no orphan rows.
      Original wording: one schema for place, event, person, source, claim (level, reviewer, date). SQL file + JSON
      export; documented in CLAUDE.md
- [x] A2 Migrate Tripoli. Check run: `node scripts/build-claims.mjs --check` rebuilt 103 pins, 172 areas, 173 unplaced items and 172 connections from the model; 0 differ; 19 of 19 panel lines are claims. `node scripts/check-model.mjs`: all 110 stored quotations found word for word in their stored source. Finding: 161 of 271 pin claims cite a source but never stored the supporting words; those need passages before they meet evidence rule 1.
      Original wording: every pin and unplaced item reproduced from claims with nothing lost
      (check: counts match; 30 sampled entries have their quoted passage in a stored source)
- [x] A3 Provenance (`scripts/lib/provenance.mjs`, `scripts/wayback.mjs`): 227 of 547 cited sources have a stored copy with a checksum (225 when first written; 227 on the audit of 15 Nov). Fetch dates were only recorded for Wikipedia and the cables; older collectors did not record them. Archived copies: 39 are on archive.org already; a Wayback lookup for the rest runs with `node scripts/wayback.mjs` (free), then `node scripts/build-claims.mjs`.
      Original wording: fetch date, checksum, archived copy where there is one
- [x] A4 Grades: source reliability A-F by type of source (243 B, 256 C, 48 not classified = F), entry credibility 1-6 by evidence level and corroboration (157 confirmed, 299 probably true, 157 possibly true, 509 cannot be judged). Every grade is marked as a default from a rule; overrides go in `archive/model/grades.json`. Shown beside each citation on the map (checked in the browser: Abu Salim lists C1, F1, B1...). The 48 unclassified hosts need the owner's grade.
      Original wording: reliability of the source (A–F) and credibility of the item (1–6),
      shown on each claim; evidence wording fixed (documented / reported / suspected)
- [x] A5b One region at a time: each pin has a region (`tripoli` unless its file says otherwise); a new region's pins go in `public/data/regions/<id>.js` with a script tag in index.html; only the open region is drawn, listed, counted and put on the timeline; opening a place in another region switches to it. Checked in the browser with a two-pin fixture (`scripts/fixtures/region-fixture.js`, copied into public/data/regions/ only for the test): Tripoli showed 68 of 103 with the fixture hidden; switching showed 2 of 2 in map, table, status bar and timeline; opening Abu Salim switched back. Loading is at page start, not on demand: fine for a pilot region, to revisit when the data is large.
- [x] A5 Regions (first part). Done: `region` on every model record; `scripts/build-regions.mjs` writes six regions with town positions taken from Wikipedia articles and a count of stored documents naming each (C1 done here: Benghazi 881, Fezzan 477, Cyrenaica 466, Greater Tripolitania 399, Sirte 261; Tripoli 6,776); country view on the map (key 0, or the Libya crumb) with one marker per region and a region sheet. Checked in the browser by script: six region markers, pins hidden at country zoom, crumbs read Libya / Regions; NOT checked by eye (the screenshot timed out). Still to do (A5b): load a region's pins on demand from `public/data/regions/<id>/`; needs the marker code in app.js turned into an add-a-list function, tested with a fixture.
      Original wording: a `region` on every record, per-region data files loaded on demand,
      country view with counts per region
- [x] A6 Security. Built: strict script policy in `public/_headers` (scripts only from the site itself; inline scripts of stats, requests and schematic pages moved to files); daily AI spending ceiling enforced in the Worker (`DAILY_AI_LIMIT_USD`, default 3); wrong-password counting moved from KV to D1 by keyed hash; constant-time password comparison; request size limit; new family reports held until the owner approves them on the requests page; visitors never receive the contributor's name or the "who told you" field.
      Checks: `node scripts/test-worker.mjs` 39 passed, 0 failed. Every page loaded from a local server sending the real headers (map, 3D street view, statistics, requests, review, schematic) with no policy violation in the console.
      Not covered: the sign-in page is produced by the Worker and carries no script policy yet; the policy was tested locally, not on Cloudflare.
      Behaviour change for the owner to accept: reports added from now on are hidden from visitors until approved (existing ones stay visible).
      Original wording: strict script policy (move inline scripts in stats/requests pages to files); spending ceiling
      per day in the Worker; failed-password counting moved off KV; contributor names hidden from visitors;
      family reports held for owner review before visitors see them; tests for each
- [x] A7 Funnel and cost strip on the review page (`archive/review/funnel.json`, `archive/crest/cost-ledger.json`): collected 15,214 (4,494 more cables listed, not downloaded), read 5,856 (documents with a real extraction; 5,627 of them rated relevant, 135 more rows are "placeholder", 5,991 rows in all; the cost ledger counts 5,963 documents sent, and the first CIA/JPRS file holds 28 more rows than its ledger line, origin not recorded), candidates 2,280 (funnel file; 2,009 was an earlier count), decided 0, reading cost $2.48 by the script's own count over three runs. Checked on the local review page: six figures shown, speeches filter lists 65 with venue, occasion and transcript rows; tests still 39 of 39.
      Original wording: Cost and funnel report page for the owner (documents found, read, candidates, decided; cost per entry)

## Phase B. Clear the Tripoli backlog
- [x] B1 `node scripts/review-export.mjs approvals.json` (the review page's owner export) writes drafts with each item's sources, quoted passages and a list of what is still missing (position, years, wording). Places and events are never published by it. Checked with 8 made-up approvals (test only, removed afterwards): 3 drafts written, sources that lack the name flagged as such.
      Original wording: approved items become draft entries with their sources, for the owner to check
- [x] B2 Approved speeches go to `public/data/speeches.js` with their transcripts in `public/data/docs/`. On the map: a Speeches button in the rail (shown only when there are any) opens a dated list; a venue's own panel gets a section "Speeches recorded here". Checked in the browser with 5 test speeches (removed afterwards): list showed 5, Green Square panel showed 3, Abu Salim none, transcript file served. Live count is 0 until the owner approves speeches in the review queue.
      Original wording: approved speeches shown at their venue with the transcript, by date
- [ ] B3 Cables read (needs the owner's go-ahead on cost) and added to the queue

## Phase C. Benghazi pilot
- [x] C1 Done under A5: the order in the plan holds (Benghazi first).
- [x] C2 Place-name lookup for every planned region (`scripts/build-gazetteer.mjs`, `archive/model/gazetteer/`): named places within 10 km of each town from Wikipedia's nearby-articles list, with position, Arabic name where there is one, and the article as source. Benghazi 24, Greater Tripolitania 51, Cyrenaica 31, Sirte 13, Fezzan 21. Read through the Benghazi list: it mixes buildings (library, cathedral, stadium, port, hospital) with battles and a ship, so entries need a kind filter before they are used to place anything. Not yet used by the review queue.
      Original wording: place names and spellings from sources, positions only where a source gives one
- [~] C3 Free part done for every region: the 5,627 documents already read were sorted by the town each place or event names (`scripts/lib/regions.mjs`). Review candidates outside Tripoli: Benghazi 110, Fezzan 57, Greater Tripolitania 51, Cyrenaica 50, Sirte 28 (296 in all), with a region filter on the review page. Names that are only a town are dropped. Paid part (reading the unread documents that name these towns) waits for the owner.
      Original wording: Run filter, extraction (go-ahead needed), review queue for Benghazi
- [~] C4 Tools and the written check done; the independent half of the sample check waits for a person.
      Safety: `node scripts/safety-check.mjs benghazi` over the 110 Benghazi candidates (no pins yet): 94 raise nothing; 0 private persons in a security or informer role; 0 private homes; 5 name victims already named in published sources (allowed, with limits); 5 are after 2011 (Benghazi 2012, Operation Dignity 2014: left out); 1 coup-plot leader named only by a hostile Cairo paper (not to be used without a second source). Written up in `archive/regions/benghazi-safety.md`.
      Sample: `node scripts/sample-check.mjs benghazi` draws 30 by a fixed hash and re-reads every cited document from the stored copy: 35 of 36 quoted passages found word for word, 0 not found, 1 citation with no passage quoted; the entry's name or a distinctive word of it in the passage for 30; the year borne out for 28. Entries with a verbatim passage that carries the name: 28 of 30. Sheet for the checker: `archive/review/sample-benghazi.md` (rebuilt by the command, not committed).
      Not done: the plan's pass mark is an independent check of each fact by a person; the machine part shows only that the quotations are real. The sample is of candidates because no Benghazi entries are written yet; run both commands again on the written pins.
      Original wording: Written safety check for the region; 30-entry sample check

## Phase D. Remaining regions (one at a time, same steps as C)
- [ ] D1 Greater Tripolitania  - [ ] D2 Cyrenaica  - [ ] D3 Sirte and the central coast  - [ ] D4 Fezzan and the south
      First pass (2026-11-14), free steps only, on the review candidates: `node scripts/safety-check.mjs <region>` and `node scripts/sample-check.mjs <region>`.
      | Region | Candidates | Raise nothing | Private role | Named victims | After 2011 | Quoted passages found word for word |
      |---|---|---|---|---|---|---|
      | Greater Tripolitania | 51 | 40 | 0 | 2 | 7 | 32 of 34 citations (2 with none quoted) |
      | Cyrenaica | 50 | 41 | 0 | 1 | 7 | 28 of 31 (3 with none quoted) |
      | Sirte | 28 | 24 | 0 | 0 | 2 | 37 of 40 (3 with none quoted) |
      | Fezzan | 57 | 46 | 0 | 0 | 9 | 36 of 41 (5 with none quoted) |
      No quoted passage was missing from its stored source in any region. One point to carry into the written checks: Greater Tripolitania names Farahat 'Ammar Jlab, sentenced to death at Zuwarah in 1984 and called a "Muslim Brotherhood agent" by the regime's own report; if used, that label must be attributed to the regime, not stated. The "home" test gave false hits on "House of Representatives" and "return home of a unit" and was narrowed. Each region still needs its paid reading (C3), written entries, and its own written check before it is ticked.

## Phase F. PRD features that were in no chunk (found by the audit of 15 Nov 2026)
The chunk list above covered the PRD's phases A to E but left out requirements stated elsewhere in the PRD. Each is unticked; none needs the owner except where marked.
- [ ] F1 Evidence rule 8 (PRD s5): an entry at level "documented" that alleges a killing needs two independent sources. Nothing in the code enforces it yet. Add a check to `build-claims.mjs --check` that lists the entries that break it.
- [ ] F2 Evidence rule 9 and PRD s12: every claim records who approved it and when. Today every migrated claim has reviewer "owner" and a null review date (`scripts/build-claims.mjs`).
- [ ] F3 PRD s12 target "100% of entries have a stored, checksummed source". Measured 15 Nov: 227 of 547 cited sources stored; 161 of 271 pin claims never stored their supporting passage. A2 and A3 are ticked because their own tests passed, not because this target is met.
- [ ] F4 Share links that keep the selected place, period and layers (PRD s10). No code for it in `app.js`.
- [ ] F5 Entry page showing each claim: source, quoted passage, level, date reviewed (PRD s10). Grades are shown beside citations; the quoted passage and review date are not.
- [ ] F6 Search across Arabic and English spelling variants (PRD s10; the table filter matches Arabic names, the encyclopedia does not).
- [ ] F7 Offline copy of a region (PRD s10): no service worker exists.
- [ ] F8 Self-hosted fonts (PRD s9). Every page, including the new `corrections.html`, still loads Inter and JetBrains Mono from Google Fonts, so Google sees each visitor's address.
- [ ] F9 Weekly funnel and cost report, list of rejected candidates with reasons, review time per candidate (PRD s10 and s12). The review page shows the funnel and cost strip (A7); nothing is reported weekly and review time is not measured.
- [ ] F10 Pipeline stages 1 and 3 of PRD s8: name lists in Arabic, French and Italian, "new since the last run", and an OCR-quality score. The Tripoli-in-Lebanon filter exists in some collectors only.
- [ ] F11 Reports and review data in D1 with a row per record (PRD s13); family reports are still one KV value. Needs the owner's go-ahead because it moves live data.
- [ ] F12 Custom domain so the address stops showing the owner's account name (PRD s13). Needs the owner.

## Phase E. Public opening
- [~] E1 Country view done under A5. Correction and removal route done. Hosting: settled (Workers Paid, 100,000 files); proved only by the first deploy over 20,000 files, which needs a push to main.
      Hosting (2026-11-15): the owner confirmed the account is on Workers Paid, whose limit is 100,000 static files per Worker version; public/ holds 15,858. The Workers Builds API shows 103 builds of tripoli-atlas-ai; the four failures (21 Oct 2026) were refused with code 10304, "37,275 static asset files ... exceeds the Workers Free limit of 20,000", so the account was on the free plan then. The old ceiling of about 16,300 came from that period and was too low even for the free plan; no 18,055-file failure is in the build log. Region data and more satellite tiles now fit; no spending is needed.
      Route: `public/corrections.html` (anyone; states what will be corrected or removed and that requests are answered) posts `{ correction: { kind, item, name, text, contact } }` to the Worker, which stores it in D1 table `corrections` (created by the Worker on first use; no manual database step), limits each address to 5 a day by keyed hash, and never shows requests to visitors. The owner lists them on requests.html and marks them answered. Every place panel ends with a link to the page, filled in with that entry.
      Checks: `node scripts/test-worker.mjs` 47 passed, 0 failed (8 new: a visitor can send one; an empty one is refused; the sixth in a day from one address is refused; another address still can; stored by hash, not address; visitors cannot read them; the owner sees the contact but not the hash; the owner can mark one answered). In the browser with the real security headers: the page loads with no policy violation, the entry and "removal" are filled in from the link; on the map, Abu Salim's panel carries one link to `corrections.html?item=abusalim&name=Abu%20Salim%20prison`. public/ holds 15,858 files.
      Not checked: sending from the page to a live Worker (the local server takes no POST), and the owner's list in a browser (the owner API needs the password and the live Worker). The page states no reply time, because none has been agreed.
      Original wording: Country view, correction and removal route, hosting sized for the data (tiles and region data off the free-plan file limit)

## Architecture decisions (settled unless the owner says otherwise)
- Source of truth today: `public/data/*.js`. The claim model in `archive/model/` is generated from it and proved lossless. The switch to "model is the source, public/data is generated" has NOT been made; it is the one large decision left (after the owner starts approving items).
- One region at a time on the map; a region's pins live in `public/data/regions/<id>.js`, loaded at page start.
- Research pipeline: collect (scripts/lib/fetcher.mjs) -> filter by place name (free) -> read with the small model (paid, owner's go-ahead) -> build-review (free) -> owner review page -> review-export drafts -> written entry.
- Review data in D1 (`cand`, `decision`, `meta`); family reports still in one KV value (move to D1 is open).
- Grades are rule-based defaults with owner overrides in one JSON file.
- Shell code reaches the map only through `window.ATLAS_API`.
- Hosting: Workers Paid, 100,000 files per version (settled 15 Nov 2026). Open: moving reports to D1; when to switch the source of truth.

## Log
- 2026-11-15 (second pass): `scripts/check-secrets.mjs` and a pre-push hook; `scripts/preflight.mjs` (one command: syntax, Worker tests, claim model, secrets, file count, headers, and documents against data); `PUSH-CHECKLIST.md`; the funnel's "read" figure made honest (see A7); two unused secrets removed from the live Worker.
- 2026-11-15: audit of documents against code, data and Cloudflare. Fixed in the repo: a stripped-entry-id bug in the corrections route (found by the audit; test added, proven to fail on the old code), the Worker now adds the region column to an older review table, README (architecture, counts), SETUP-AI.md, CLAUDE.md, `CF_PLAN`. Added Phase F for PRD requirements no chunk covered. Worker tests now 49.
- 2026-11-14: E1 correction and removal route (page, Worker route, owner list, 8 tests).
- 2026-11-14: C4 tools (`scripts/safety-check.mjs`, `scripts/sample-check.mjs`, shared `scripts/lib/stored.mjs`) and the Benghazi safety check written. D1-D4 not started: each needs its region's paid reading (C3) and written entries first.
- 2026-11-13 (10:51 run): B1, B2, C2 done; C3 free part done for all regions.
- 2026-11-13 (5:51 run): chunks 0, A1, A2, A3, A4, A6 done; A5 part done; C1 done. Archived copies now on record for 439 of 547 cited sources.
- 2026-11-13: speeches finder, shared downloader, cable collector written on `more-sources`; UN sites forbid
  automated collection (archive/SOURCES.md).

## Waiting for the owner
- Corrections page: it promises answers but gives no reply time. Set one (for example two weeks), or keep it open? Requests reach you on requests.html only; no email alert was added.
- Benghazi sample check, human half: someone other than the person who wrote the entries checks the 30 entries on `archive/review/sample-benghazi.md` (run `node scripts/sample-check.mjs benghazi` first). Best done after the Benghazi entries are written, not on raw candidates.
- In the review queue, reject the five Benghazi candidates dated after 2011 ("after the period of the map"); see `archive/regions/benghazi-safety.md`.
- The summary requested for 6 pm on 13 Nov is not recorded as delivered. `PUSH-CHECKLIST.md` is now the summary of what is ready, what the push changes and what is untested; this list is the decisions.
- Reload the live review queue: the candidate table gained a region column, so load the new SQL (`node scripts/build-review.mjs --sql out.sql`, then wrangler d1 execute) in the same step as pushing the Worker.
- Read the Embassy Tripoli cables with the extraction model? 386 are downloaded (about $0.16 by the script's count); the other 4,494 would need downloading first (about 3 hours, free) and about $2 to read.
- Push to main: speeches in the review queue, cable collector, shared downloader (branch `more-sources`), and everything on branch `libya`.
- Family reports now wait for your approval before visitors see them, and visitors no longer see who added a report. Accept this change?
- Daily AI ceiling is set to $3 a day by default. Keep, change, or switch off?
- Push to main: follow `PUSH-CHECKLIST.md` (the order matters: change the family password first; do not roll back to a version older than that). `node scripts/preflight.mjs` is the one-command check.
- Live Worker settings that only the owner can set (dashboard): `CREDIT_LOADED` (it holds placeholder text, so the low-credit warning cannot work: set the dollars loaded, or delete it) and, optionally, `RESEND_API_KEY` and `ALERT_EMAIL` (without them no email alert is sent). `ALLOWED_ORIGINS` can be cleared once the old GitHub Pages copy is unpublished. The two USGS secrets were removed from the Worker on 15 Nov 2026 (they stay in GitHub Actions). `CF_PLAN` is set to paid in `wrangler.jsonc` and goes live with the push.
- Security items for the owner are in `AUDIT.md` (git-ignored); act on its section 0 first.
- The PRD itself is out of date in section 13 (it still describes the site as held back by the free plan) and section 2 (12 Nov figures). A suggestion was laid in the document for section 13; section 2 is dated, so left as a record.
- 48 source websites are graded F (not classified); list in `archive/model/sources.json`. Grade them, or leave as F?
- UN human-rights cases cannot be collected by machine (archive/SOURCES.md). Download the Libya cases by hand, or leave them out?
