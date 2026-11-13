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
- [ ] Cable re-download finished; count cables with text, and those naming a specific place
- [ ] Estimate what reading them would cost; commit `more-sources`; report to the owner

## Phase A. Foundations
- [ ] A1 Claim model: one schema for place, event, person, source, claim (level, reviewer, date). SQL file + JSON
      export; documented in CLAUDE.md
- [ ] A2 Migrate Tripoli: every pin and unplaced item reproduced from claims with nothing lost
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
