# Sources: what may be collected, and how

Checked 13 November 2026. Every collector goes through `scripts/lib/fetcher.mjs`, which reads each site's
robots.txt and obeys it. A site that forbids automated collection is not collected, whatever its content is worth.

## Collected

| Source | What | Rights | Collector |
|---|---|---|---|
| U.S. Embassy Tripoli telegrams, 1973–1979 | State Department Central Foreign Policy Files, declassified and released by the U.S. National Archives. Read from the "Kissinger Cables" and "Carter Cables" sets of the Public Library of US Diplomacy. | U.S. government works, public domain | `scripts/collect-cables.mjs` |
| FBIS and JPRS translations | Libyan radio, news agency and press, translated by the U.S. government | U.S. government works, public domain | `collect-fbis.mjs`, `collect-gov.mjs` |
| CIA reading room | Declassified CIA records (Internet Archive mirror) | U.S. government works, public domain | `ia-crest-*.mjs` |

Speeches given in Tripoli are drawn from the FBIS, JPRS and CIA texts above by `scripts/build-speeches.mjs`.

## Not collected, and why

| Source | Reason | What would be needed |
|---|---|---|
| UN Human Rights Committee case law (juris.ohchr.org, tbinternet.ohchr.org) | robots.txt forbids all automated access | Download the Libya cases by hand, or ask OHCHR for a data export |
| UN Official Document System (documents.un.org) | robots.txt forbids `/doc` and `/api` | As above |
| UN Digital Library (digitallibrary.un.org) | Records may be read (5 s delay), but search is forbidden, so cases cannot be found by machine | A hand-made list of document symbols; each record can then be fetched |
| WorldLII, Centre for Civil and Political Rights | robots.txt allows search engines but refuses AI collection (`ai-train=no`, AI crawlers blocked by name). These texts would be read by an AI model, so they are left alone | Permission from the site |
| U.S. National Archives catalogue (catalog.archives.gov) | robots.txt forbids all; an API exists but needs a key | A free NARA API key, kept out of the repository |
| "Cablegate" (leaked 2003–2010 State Department cables) | Technically reachable, deliberately not read: never officially released | The owner's decision |

UN documents issued under an official symbol are, by the UN's own administrative instruction on copyright
(ST/AI/189/Add.9/Rev.2), not copyrighted. That is from memory and was not re-checked here; confirm it before
showing UN text on the site.
