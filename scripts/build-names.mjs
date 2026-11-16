// F10: the name lists (PRD s8 stage 1), in English and Arabic. No AI, no network, nothing translated by this script.
//   node scripts/build-names.mjs
// A name list gives, for each place, area, event or candidate, the names a source uses, so a name found in a document can be matched
// to what is already on the map, and the review page and later the search can match one place under several spellings.
// Every form is copied from a place that already carries it:
//   archive/model/subjects.json      the map's own names, Arabic names (`ar`) and the aliases the area profiles list
//   archive/model/gazetteer/*.json   each region's named places, with the Arabic title of the Wikipedia article where there is one
//   archive/review/candidates.json   other forms the documents used for a candidate (`also`)
// Languages: English and Arabic. A French or Italian form is kept only when a document spells the name that way (it arrives as a
// variant with its source, not as a translation). Where no Arabic form exists the entry says so (`ar: null`) and is listed in the
// coverage report: a gap is shown, never filled by guessing.
// Writes archive/model/names.json (tracked) and prints the coverage.
import fs from 'node:fs'; import vm from 'node:vm';

const fold = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`ʿʾ]/g, '').replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();
const ARABIC = /[؀-ۿ]/;
const nf = {}; vm.runInNewContext(fs.readFileSync('public/name-fold.js', 'utf8'), { window: nf, globalThis: nf });
const key = (t) => (ARABIC.test(t) ? String(t).replace(/[ً-ْـ]/g, '').trim() : fold(nf.ATLAS_NAMEFOLD ? nf.ATLAS_NAMEFOLD(t) : t)); // Arabic: marks and tatweel removed; Latin: spelling variants folded

const entries = [], byKey = new Map();
function add(e) { entries.push(e); for (const n of [e.en, e.ar, ...e.variants]) { const k = key(n); if (!k) continue; if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(e.id); } }

const subjects = JSON.parse(fs.readFileSync('archive/model/subjects.json', 'utf8'));
for (const s of subjects) {
  if (s.class === 'connection' || s.class === 'unplaced' || !s.name) continue;
  add({ id: s.uid, from: 'map', class: s.class, region: s.region || null, en: s.name, ar: s.ar || null, variants: [...new Set((s.aliases || []).filter((a) => a && a !== s.name))], source: 'the map entry' });
}
let gz = 0;
if (fs.existsSync('archive/model/gazetteer')) for (const f of fs.readdirSync('archive/model/gazetteer').filter((x) => x.endsWith('.json'))) {
  const g = JSON.parse(fs.readFileSync('archive/model/gazetteer/' + f, 'utf8'));
  for (const p of g.places || []) { add({ id: 'gaz:' + g.region + ':' + fold(p.name).replace(/ /g, '-'), from: 'gazetteer', class: 'gazetteer', region: g.region, en: p.name, ar: p.ar || null, variants: [], source: p.source || null }); gz++; }
}
let cv = 0;
if (fs.existsSync('archive/review/candidates.json')) for (const c of JSON.parse(fs.readFileSync('archive/review/candidates.json', 'utf8'))) {
  if (c.kind === 'speech' || !(c.also || []).length) continue;
  add({ id: 'cand:' + c.id, from: 'candidate', class: c.kind, region: c.region, en: c.name, ar: null, variants: [...new Set(c.also.filter((a) => a && a !== c.name))], source: 'the documents that mention it' }); cv++;
}

// the same name under different spellings pointing at different entries: a person should look (it may be one place twice)
const shared = [...byKey.entries()].filter(([, ids]) => new Set(ids).size > 1).map(([k, ids]) => ({ key: k, ids: [...new Set(ids)] }));
const cover = (cls) => { const a = entries.filter((e) => e.class === cls); return { entries: a.length, withArabic: a.filter((e) => e.ar).length, withVariants: a.filter((e) => e.variants.length).length }; };
const classes = [...new Set(entries.map((e) => e.class))], coverage = Object.fromEntries(classes.map((c) => [c, cover(c)]));
const missing = entries.filter((e) => e.from === 'map' && e.class !== 'event' && !e.ar).map((e) => ({ id: e.id, class: e.class, en: e.en }));
fs.writeFileSync('archive/model/names.json', JSON.stringify({ at: new Date().toISOString(), languages: ['en', 'ar'], note: 'Forms copied from the map, the gazetteers and the documents; none translated here. ar null = no Arabic form known.', coverage, sharedKeys: shared.length, entries }, null, 1));
fs.writeFileSync('archive/review/names-missing-arabic.json', JSON.stringify({ at: new Date().toISOString(), note: 'Map places and areas with no Arabic name on record. Add one only from a source (a sign, a document, an Arabic Wikipedia title).', count: missing.length, missing }, null, 1));
console.log(`${entries.length} entries (map ${entries.filter((e) => e.from === 'map').length}, gazetteer ${gz}, candidates with other forms ${cv})`);
for (const [c, v] of Object.entries(coverage)) console.log('  ' + c.padEnd(10), `${v.entries} entries, ${v.withArabic} with an Arabic name, ${v.withVariants} with other spellings`);
console.log(`${shared.length} spellings are shared by more than one entry (see names.json via sharedKeys; first five):`); for (const s of shared.slice(0, 5)) console.log('  ' + s.key + ' -> ' + s.ids.join(', '));
console.log(`${missing.length} map places and areas have no Arabic name on record: archive/review/names-missing-arabic.json`);
