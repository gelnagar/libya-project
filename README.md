# Libya project

## Tripoli detention sites, 1969–1989

**Live map:** https://gelnagar.github.io/libya-project/ (once GitHub Pages is turned on for this repo, see below).

`index.html` is a single-file interactive map of known and suspected prisons and detention sites in and near Tripoli during the first two decades of Gaddafi's rule. Open it in any browser. No build step is needed.

The base map is a rough schematic of the coastline and a few landmarks. It is not survey-grade. Dashed rings around each marker show how uncertain its position is.

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

### Editing

Site data lives in the `SITES` array near the top of the script in `index.html`. Each entry has a name, evidence level, longitude, latitude, uncertainty radius in km, and descriptive text. Add or correct entries there.

### Sources

- Abu Salim prison, Wikipedia: https://en.wikipedia.org/wiki/Abu_Salim_prison
- Human Rights Solidarity Organization, Abu Salim annex: https://hrsly.com/en/annex-1-the-abu-salim-prison-massacre/
- Amnesty International, Libya: further information on political detention (1992): https://www.amnesty.org/ar/wp-content/uploads/2021/06/mde190031992en.pdf
- Abubaker Shareef interview, Tarikhi: https://tarikhi.org/interview/abubaker-shareef/
- Maktab al-Nasser prison, Wikipedia: https://en.wikipedia.org/wiki/Maktab_al-Nasser_prison
- Human Rights Watch, Tripoli arrests (2011): https://www.hrw.org/node/97287
- USIP, Prisons and Detention in Libya: https://www.usip.org/sites/default/files/PW119-Prisons-and-Detention-in-Libya.pdf
- Amnesty International, Libya: gross human rights violations (1997): https://www.refworld.org/reference/countryrep/amnesty/1997/91542

Check any site against primary sources before relying on it for research or legal work.

### Publishing the live map

GitHub shows `index.html` as source code. To run it as a page, open the repo's Settings → Pages, set Source to "Deploy from a branch", choose branch `main` and folder `/ (root)`, and save. The page appears at the live-map link above within a minute or two.
