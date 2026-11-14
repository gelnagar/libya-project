// A place-name list for each region: named places near each town of the plan, with a position and the article
// the position comes from. It is a lookup for research, not map content: it lets a name found in a document be
// matched to a known place, and gives a sourced position to propose. Nothing in it is a finding about the past.
//   node scripts/build-gazetteer.mjs [region ...]      default: every region except tripoli
// Source: Wikipedia's "articles near a point" list (MediaWiki API), 10 km around each town, plus each article's
// Arabic title where there is one. Positions are Wikipedia's (reference work, reliability C in the model).
// Writes archive/model/gazetteer/<region>.json
import fs from 'node:fs';
import { get } from './lib/fetcher.mjs';
import { REGIONS } from './lib/regions.mjs';

const API = 'https://en.wikipedia.org/w/api.php?', opt = { as: 'json', gap: 900, robots: false }; // the API is Wikipedia's route for programs
const regs = JSON.parse(fs.readFileSync('archive/model/regions.json', 'utf8')).regions;
const want = process.argv.slice(2).length ? process.argv.slice(2) : REGIONS.map((r) => r.id).filter((id) => id !== 'tripoli');
fs.mkdirSync('archive/model/gazetteer', { recursive: true });

for (const id of want) {
  const reg = regs.find((r) => r.id === id); if (!reg) { console.log('unknown region', id); continue; }
  const found = new Map();
  for (const t of reg.towns) {
    if (t.lat == null) continue;
    const j = await get(API + new URLSearchParams({ format: 'json', formatversion: '2', action: 'query', list: 'geosearch', gscoord: t.lat + '|' + t.lon, gsradius: '10000', gslimit: '500' }), opt);
    for (const g of (j && j.query && j.query.geosearch) || []) if (!found.has(g.pageid)) found.set(g.pageid, { name: g.title, lat: +g.lat.toFixed(5), lon: +g.lon.toFixed(5), town: t.name, km: +(g.dist / 1000).toFixed(1), pageid: g.pageid });
  }
  // Arabic titles and what kind of thing each article is, 50 pages a request
  const ids = [...found.keys()];
  for (let i = 0; i < ids.length; i += 50) {
    const j = await get(API + new URLSearchParams({ format: 'json', formatversion: '2', action: 'query', prop: 'langlinks|info|description', lllang: 'ar', inprop: 'url', pageids: ids.slice(i, i + 50).join('|') }), opt);
    for (const p of (j && j.query && j.query.pages) || []) { const f = found.get(p.pageid); if (!f) continue; f.ar = p.langlinks && p.langlinks[0] ? p.langlinks[0].title : null; f.source = p.fullurl || null; f.kind = p.description || null; }
  }
  const list = [...found.values()].map(({ pageid, ...x }) => x).sort((a, b) => a.town.localeCompare(b.town) || a.km - b.km);
  fs.writeFileSync(`archive/model/gazetteer/${id}.json`, JSON.stringify({ region: id, at: new Date().toISOString(), note: 'Lookup list for research. Positions are from the Wikipedia article in "source". Not map content.', places: list }, null, 1));
  console.log(`${id.padEnd(13)} ${String(list.length).padStart(4)} named places near ${reg.towns.filter((t) => t.lat != null).length} towns; with an Arabic name ${list.filter((x) => x.ar).length}`);
}
