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
- [ ] A3 Provenance on every stored source: fetch date, checksum, archived copy where there is one
- [ ] A4 Source grading the way analysts do it: reliability of the source (A–F) and credibility of the item (1–6),
      shown on each claim; evidence wording fixed (documented / reported / suspected)
- [ ] A5 Region support in data and map: a `region` on every record, per-region data files loaded on demand,
      country view with counts per region
- [ ] A6 Security: strict script policy (move inline scripts in stats/requests pages to files); spending ceiling
      per day in the Worker; failed-password counting moved off KV; contributor names hidden from visitors;
      family reports held for owner review before visitors see them; tests for each
- [ ] A7 Cost and funnel report page for the owner (documents found, read, candidates, decided; cost per entry)

## Phase B. Clear the Tripoli backlog
- [ ] B1 Review-queue export: approved items become draft entries with their sources, for the owner to check
- [ ] B2 Speeches layer: approved speeches shown at their venue with the transcript, by date
- [ ] B3 Cables read (needs the owner's go-ahead on cost) and added to the queue

## Phase C. Benghazi pilot
- [ ] C1 Count what the stored documents say about each region (free) to confirm the order of regions
- [ ] C2 Gazetteer for Benghazi: place names and spellings from sources, positions only where a source gives one
- [ ] C3 Run filter, extraction (go-ahead needed), review queue for Benghazi
- [ ] C4 Written safety check for the region; 30-entry sample check

## Phase D. Remaining regions (one at a time, same steps as C)
- [ ] D1 Greater Tripolitania  - [ ] D2 Cyrenaica  - [ ] D3 Sirte and the central coast  - [ ] D4 Fezzan and the south

## Phase E. Public opening
- [ ] E1 Country view, correction and removal route, hosting sized for the data (tiles and region data off the
      free-plan file limit)

## Log
- 2026-11-13: speeches finder, shared downloader, cable collector written on `more-sources`; UN sites forbid
  automated collection (archive/SOURCES.md).

## Waiting for the owner
- Read the Embassy Tripoli cables with the extraction model? 386 are downloaded (about $0.16 by the script's count); the other 4,494 would need downloading first (about 3 hours, free) and about $2 to read.
- Push to main: speeches in the review queue, cable collector, shared downloader (branch `more-sources`), and everything on branch `libya`.
- UN human-rights cases cannot be collected by machine (archive/SOURCES.md). Download the Libya cases by hand, or leave them out?
