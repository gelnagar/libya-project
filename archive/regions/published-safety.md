# Safety check: published entries outside Tripoli

Written 19 November 2026, after the regional entries went live on 19 November 2026 (deploys of commits 2072ce90 and
d8dcd3a8). Plan section 9 asks, for each region: who could be harmed by its entries, and what was left out for that
reason. `benghazi-safety.md` answered this for the Benghazi review candidates before anything was published. This
file answers it for what visitors now see in all five regions.

## What was checked

The 202 published pins outside Tripoli: Benghazi 76, Fezzan 42, Greater Tripolitania 33, Cyrenaica 30, Sirte 21.
They come from the hand-written files (`public/data/regions/<region>.js`) and the generated ones
(`<region>-more.js`, `scripts/write-regional.mjs`). Run:

    node scripts/safety-check.mjs <region>

On 19 November 2026 the script was changed to read the published pins as well as the review candidates. Before, it read
only the hand-written file and missed the generated one. It also now finds each pin's documents from its source
links, looked up in the stored documents' own addresses. 262 of the pins' 263 source links resolved to a stored
document. For each pin it lists every person whom the reading model found in those documents and whose name also
appears in the pin's own name or text. It classes each person by role, and it looks for pointers to private homes and
for dates after 2011. The script reads only stored files and makes no network or AI calls. Its output,
`archive/review/safety-<region>.json`, is git-ignored and can be rebuilt.

Two further checks were run by hand over the same 202 pins:

- every pin text containing a word for a killing (executed, hanged, shot dead, killed, murdered, assassinated,
  tortured, sentenced to death, disappeared, abducted, kidnapped);
- a search of the pin files for the people named in `benghazi-safety.md` (Omar Dabob, Muhammed Ben Saoud,
  Al-Sadek Hamed Al-Shuwehdy, Fathi Terbil) and for Farahat 'Ammar Jlab (Greater Tripolitania).

## Result

| Region | Published pins | Flagged by the script | After 2011 | Private home |
|---|---|---|---|---|
| Benghazi | 76 | 1 | 0 | 0 |
| Greater Tripolitania | 33 | 0 | 0 | 0 |
| Cyrenaica | 30 | 0 | 0 | 0 |
| Sirte | 21 | 0 | 0 | 0 |
| Fezzan | 42 | 1 | 0 | 0 |

No published pin names a private person in a security, informer or enforcement role, points to a private home, or is
dated after 2011. None of the five people above is named in any published pin.

The two flags, read in full:

1. `c-4b6d976c1593` (Benghazi, 1979; Libya closed the PLO office in Benghazi). Names Ibrahim Tubawi, assistant to the
   PLO chief in Libya, as expelled. He is named in his public role as a PLO official, and the source names him.
   Kept.
2. `c-ac57651fb925` (Fezzan, 1981; rally at Sabha). The flag is the unnamed secretary of the Central Sabha Basic
   People's Congress, an office-holder speaking at a public rally. No name is given. Kept.

Ten pins mention a killing. Read one by one:

- They name only public figures: Khamis Gaddafi and Mutassim Gaddafi (2011), and Colonel Hassan Ishkal, head of the
  Sirte military region (1985).
- Otherwise they give numbers without names: coup plotters arrested and executed, a mutiny "with more than 400 killed
  (as alleged in article)", and 11 killed in the 2006 consulate protest in Benghazi.
- `bn-1977-hangings` (Benghazi, April 1977) reports that three students were hanged in public. It is graded
  testimony, rests on two opposition statements translated by JPRS and two Wikipedia articles, says so in its text,
  and names none of the students.

## Later change

20 November 2026: three undated generated entries describing events after 2011 were withdrawn (the 2012 attack on the U.S.
facility in Benghazi, a racetrack named in a 2012 report on it, and a 2021 football match). They had passed because the
after-2011 rule needs a date; `scripts/write-regional.mjs` now drops an undated entry when every year it mentions is after 2011.
None of the three named a private person. 201 pins remain (Benghazi 73).

## Limits

- This is a machine pass followed by my reading of what it flagged. It is not the independent check (C4), which needs
  a person other than the one who wrote the entries.
- The people check depends on the reading model having listed a person for the document. A person who appears in a
  pin's text but was not listed by the model is caught only by the hand search for killing words, not by role.
- The generated entries are a machine draft. Some sentences come close to the source's wording and carry its
  framing. Where a source is partisan the entry says "reportedly" or "as alleged", but this was not checked
  sentence by sentence.
