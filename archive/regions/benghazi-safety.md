# Safety check: Benghazi

Written 14 November 2026, before any Benghazi entry is published. Plan section 9 asks, before each region opens:
who could be harmed by this region's entries, and what was left out for that reason.

## What was checked

Nothing for Benghazi is on the map yet. The check covers the 110 review candidates (95 events, 15 places) that the
review queue holds for the region, built from documents already read. Run:

    node scripts/safety-check.mjs benghazi

The script lists every person whom the reading model found in a cited document and whose name also appears in the
candidate's own words or quoted passages, and classes each one by the role the model gave. It also looks for
pointers to private homes and for events after 2011. Output: `archive/review/safety-benghazi.json` (not in the
repository; it can be rebuilt). The script reads only stored files and makes no network or AI calls.

Result: 94 of 110 candidates raise nothing. None names a private person in a security, informer or enforcement
role. None points to a private home.

## Findings and what follows from them

1. **Named victims (5 candidates).** Three people are named:
   - Omar Dabob and Muhammed Ben Saoud, students hanged in Benghazi on 7 April 1977.
   - Al-Sadek Hamed Al-Shuwehdy, engineer, hanged at the Benghazi basketball stadium on 5 June 1984.
   - Fathi Terbil, lawyer, arrested on 15 February 2011.

   Each is named in the published source the candidate cites, so the rule ("victims are named only where already
   named in a published source or with the family's consent") allows the name. Families are still alive in
   Benghazi. Use the names as the sources print them, with no detail beyond what the sources give: no family
   members, no addresses, and no claims about who denounced them.
2. **Events after 2011 (5 candidates).** Four describe the attack on the U.S. facility in Benghazi on 11–12 September
   2012. One describes the start of Operation Dignity in May 2014. They fall outside the map's period (1969–2011) and
   belong to conflicts whose parties are still active. **Left out.** Reject them in the review queue with the reason
   "after the period of the map".
3. **One contested attribution.** A candidate dated 5 August 1975 says the leader of a foiled coup plot was
   "Maj. Abd al-Fattah Yunis, commander of the republican guard in Benghazi". The only source is a Cairo newspaper,
   relayed by a Jordanian one, at a time when Egypt and Libya were openly hostile. The man named later became a
   senior public official, so the rule on public officials does not bar the name. But a single hostile press report
   that names a person as a plotter is exactly the "false or misattributed entry harms a named person" risk in the
   plan. **Not to be used** unless a second, independent source names the same leader. If it is used, word it as
   "reported by the Cairo daily Al-Jumhuriyah" and give no other source.
4. **Public officials named in U.S. records.** A 2 December 1969 cable records that LTC Aadim al-Hawwaaz, a former
   defence minister, asked a U.S. officer for money. Another entry names Major Hasan Ashkal, travelling with
   Qadhafi in April 1977. Both men are public officials named in official documents, which the rule allows. Word
   these as what the cable or report says, not as fact.
5. **Unnamed groups.** Several candidates speak of "20 guard officers", "four officers" or "a group of 30 soldiers".
   They name nobody. Do not add names to them from other material unless a source ties the names to the same event.

## What a reviewer outside the family should look at

- The five victim entries, once written, read against their sources.
- That the 2012 and 2014 candidates were rejected and appear nowhere.
- The 1975 entry: absent, or worded as a single press report.

## Limits of this check

- It sees only the people the reading model listed. A name the model missed is not flagged. The written entries
  must be read again by a person before publication.
- Roles come from the model's own wording. "Unclassified" people (seven, all foreign officials or historical
  rulers) were read by hand and raise no concern.
- Candidates are not entries. Run this check again on the written pins (`public/data/regions/benghazi.js`), and keep
  this file up to date, before the region opens.
