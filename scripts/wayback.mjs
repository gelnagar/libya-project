// Looks up an archived copy of every cited source on the Internet Archive's Wayback Machine, so a citation
// survives the original page changing or disappearing. Free; one request per source, spaced out; resumable.
//   node scripts/wayback.mjs [max]
// Writes archive/model/wayback.json  { "<source address>": "<archived address>" | false }  (false = none found)
// It only looks up copies that already exist. It does not ask the Archive to save anything.
import fs from 'node:fs';
import { get } from './lib/fetcher.mjs';
const FILE = 'archive/model/wayback.json', max = +process.argv[2] || 1000;
const cache = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const sources = JSON.parse(fs.readFileSync('archive/model/sources.json', 'utf8')).filter((s) => s.url && !/(^|\.)archive\.org$/.test(s.origin || '') && !(s.url in cache));
let n = 0, hit = 0;
for (const s of sources.slice(0, max)) {
  const j = await get('https://archive.org/wayback/available?url=' + encodeURIComponent(s.url), { as: 'json', gap: 1500 });
  if (!j) continue; // not answered: try again next run
  const c = j.archived_snapshots && j.archived_snapshots.closest;
  cache[s.url] = c && c.available ? c.url.replace(/^http:/, 'https:') : false; if (cache[s.url]) hit++;
  if (++n % 20 === 0) fs.writeFileSync(FILE, JSON.stringify(cache, null, 1));
}
fs.writeFileSync(FILE, JSON.stringify(cache, null, 1));
const all = Object.values(cache);
console.log(`looked up ${n} (found ${hit}); in total ${all.filter(Boolean).length} of ${all.length} sources have an archived copy; ${sources.length - n} still to look up`);
