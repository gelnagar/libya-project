# Libya project

## Tripoli detention sites, 1969–1989

**Live map:** https://gelnagar.github.io/libya-project/

The map runs full screen on phones and computers. Tap any marker to read why it matters, with sources.

**Map styles:** dark, satellite, streets, terrain.

**History (curated):** prisons and detention sites, security and police, military installations, the 1986 US airstrikes, massacres and mass killings, Gaddafi's residences and seats of power, landmarks and events, district names in English and Arabic, uncertainty rings, and a coordinate grid. Filter by period: before 1969, 1969–1989, after 1989. Selecting a place draws lines to linked places.

**Ask about any spot:** right-click (computer), press and hold (phone), or tap ◎ then tap the map.

**Chat guide:** a question box at the bottom of the map. It answers, moves the map to places it mentions, and offers to send requests to Gordon when something is missing. Requests are read at `requests.html`.

**Suggested questions:** 20 per place in `data/questions.js`, shown three at a time.

**Today, from OpenStreetMap (loads live as you zoom in):** residential, commercial and industrial zones; buildings; present-day military areas; water wells, towers and reservoirs; oil and gas facilities.

**Ask AI:** optional. See [SETUP-AI.md](SETUP-AI.md). The API key stays in a private Cloudflare relay and is never stored in this repository.

Settings (⚙) has a larger-text option.

`schematic.html` is the earlier single-image version of the map.

### Files

| File | What it holds |
| --- | --- |
| `index.html` | Page layout and styling |
| `app.js` | Map behaviour |
| `data/sites.js` | Historical sites, links, briefs and sources. Edit this to add or correct places |
| `data/questions.js` | Suggested questions for each place, spot and map feature |
| `data/config.js` | Address of the AI relay |
| `worker/worker.js` | The AI relay that holds the API key and stores requests |
| `requests.html` | Owner page for reading family requests |
| `vendor/leaflet/` | Leaflet 1.9.4 mapping library |

### Evidence levels

| Level | Meaning |
| --- | --- |
| Documented, 1969–1989 | Reported for the period by Amnesty International or similar sources |
| Testimony, area only | A former detainee names it for the 1980s; position is approximate |
| Suspected, period unverified | A facility existed in Tripoli, but no source found ties it to 1969–1989 |
| Context site | Linked to arrests or detention but not itself a prison |

### Sites

| Site | Level |
| --- | --- |
| Abu Salim prison | Documented (completed 1984) |
| Jdeida prison | Testimony, area only |
| Bab al-Aziziya compound | Context site (May 1984 attack and arrests) |
| Maktab al-Nasser | Suspected |
| Hadba al-Khadra | Suspected |
| Ain Zara prison | Suspected |

Sites in the record with no usable location: the Black Horse prison (Italian era, replaced by Abu Salim), the military intelligence prison in Tripoli, the 7 April prison in Benghazi, and unnamed secret detention centres.

### Sources

- Abu Salim prison, Wikipedia: https://en.wikipedia.org/wiki/Abu_Salim_prison
- Human Rights Solidarity Organization, Abu Salim annex: https://hrsly.com/en/annex-1-the-abu-salim-prison-massacre/
- Amnesty International, Libya: further information on political detention (1992): https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190031992en.pdf
- Abubaker Shareef interview, Tarikhi: https://tarikhi.org/interview/abubaker-shareef/
- Maktab al-Nasser prison, Wikipedia: https://en.wikipedia.org/wiki/Maktab_al-Nasser_prison
- Human Rights Watch, Tripoli arrests (2011): https://www.hrw.org/node/97287
- USIP, Prisons and Detention in Libya: https://www.usip.org/sites/default/files/PW119-Prisons-and-Detention-in-Libya.pdf
- Amnesty International, Libya: gross human rights violations (1997): https://www.refworld.org/reference/countryrep/amnesty/1997/91542
