# Area profiles

`areas.json` is the source for `public/data/areas.js` (built by `scripts/build-areas.mjs`).
Each profile: id, name, ar (Arabic), aliases, kind (neighbourhood | district | town | military | landmark | prison | government),
lat, lon (from OpenStreetMap place nodes unless noted), r (radius in km used to decide which area a point is in),
summary, history, era (Gaddafi era 1969–2011), today, uncertain, sources [{t, u}].
Write only what a source supports; put open questions in `uncertain`.
