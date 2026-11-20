// Checks the positions found by reading (archive/review/positions-reviewed.json) against the stored texts, without a model.
//   node scripts/review-positions.mjs
// Why: on 20 Nov 2026 the owner saw the regional pins still bunched on town centres and asked for the sites to be worked out with
// Claude's own (session) reading rather than another paid run. Each record in positions-reviewed.json names a site, a quotation
// from a stored document of the entry, and a position source: coordinates printed in a stored document, or an English Wikipedia
// article whose page gives coordinates (kept in archive/review/positions-wiki.json). This script checks, for each record:
//   - the entry is a regional pin;
//   - the quotation is in the stored text of one of the entry's own documents (spaces and quotation marks folded);
//   - printed coordinates are in the stored text of the named document as written, and so is docQuote (the site's line there);
//     OCR slips O->0 and S->5 are read as digits, nothing else;
//   - a Wikipedia position comes from the kept look-up of that article (coordinates present, not a disambiguation page);
//   - the position is 0.3 to 30 km from the town the entry is filed under (or up to `far` km where the record says why).
// It writes `checked` into each record. Only a record that passes is offered to scripts/approve-positions.mjs.
import fs from 'node:fs'; import zlib from 'node:zlib'; import vm from 'node:vm';
import { km, clip, wiki } from './lib/places.mjs';

const FILE = 'archive/review/positions-reviewed.json';
const R = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const W = {}; W.window = W;
for (const f of fs.readdirSync('public/data/regions').filter((x) => x.endsWith('.js') && !x.startsWith('_'))) vm.runInNewContext(fs.readFileSync('public/data/regions/' + f, 'utf8'), W);
const byId = new Map((W.ATLAS_SITES || []).filter((s) => s.region && s.region !== 'tripoli').map((s) => [s.id, s]));
const CAND = fs.existsSync('archive/review/candidates.json') ? new Map(JSON.parse(fs.readFileSync('archive/review/candidates.json', 'utf8')).map((c) => [c.id, c]))
  : new Map(Object.entries(JSON.parse(fs.readFileSync('archive/review/positions-inputs.json', 'utf8')).entries));
const docs = new Map();
for (const f of ['docs', 'docs-other']) { const p = `archive/crest/${f}.jsonl.gz`; if (!fs.existsSync(p)) continue;
  for (const l of zlib.gunzipSync(fs.readFileSync(p)).toString().split('\n')) { if (!l) continue; const d = JSON.parse(l); docs.set(d.id, d); } }
const docByUrl = (u) => { const m = /cia\.gov\/readingroom\/document\/([^?#/]+)/.exec(u || ''); return m ? docs.get('cia-readingroom-document-' + m[1]) : null; };
const docsOf = (s) => { const c = s.id.startsWith('c-') ? CAND.get(s.id.slice(2)) : null; return (c ? (c.items || []).map((x) => docs.get(x.doc)) : (s.sources || []).map((x) => docByUrl(x.u))).filter((d) => d && d.text); };
const fold = (t) => String(t || '').replace(/[‘’`ʿʾ]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').toLowerCase();
const TOWNS = {}; for (const r of JSON.parse(fs.readFileSync('archive/model/regions.json', 'utf8')).regions) TOWNS[r.id] = r.towns || [];

export const parsePrinted = (p) => {
  const t = String(p).replace(/\s+/g, '').replace(/[OS]/g, (c) => (c === 'O' ? '0' : '5'));
  const m = /^(\d{2})-(\d{2})-(\d{2})N0*(\d{1,3})-(\d{2})-(\d{2})E$/.exec(t); if (!m) return null;
  const v = (d, mi, s) => +(+d + +mi / 60 + +s / 3600).toFixed(5); return { lat: v(m[1], m[2], m[3]), lon: v(m[4], m[5], m[6]) };
};

let pass = 0, fail = 0;
for (const [id, rec] of Object.entries(R.records)) {
  const bad = (why) => { rec.checked = { ok: false, why }; fail++; console.log('FAIL ' + id + ': ' + why); };
  const s = byId.get(id); if (!s) { bad('not a regional pin'); continue; }
  const own = docsOf(s), q = fold(rec.quote);
  const hit = own.find((d) => fold(d.text).includes(q)); if (!q || !hit) { bad('quotation not in the stored text of the entry\'s documents'); continue; }
  // the town the entry is filed under: its current position if it is still on a town centre, else the nearest town of its region
  const town = (TOWNS[s.region] || []).map((t) => ({ t, d: km(s.lat, s.lon, t.lat, t.lon) })).sort((a, b) => a.d - b.d)[0].t;
  let pos, src, method, extra = {};
  if (rec.printed) {
    const d = docs.get(rec.doc); if (!d || !d.text) { bad('document ' + rec.doc + ' not stored'); continue; }
    if (!fold(d.text).includes(fold(rec.printed))) { bad('printed coordinates not in the stored text of ' + rec.doc); continue; }
    if (d !== hit && !fold(d.text).includes(fold(rec.docQuote || ''))) { bad('docQuote missing or not in ' + rec.doc); continue; }
    pos = parsePrinted(rec.printed); if (!pos) { bad('printed coordinates cannot be read: ' + rec.printed); continue; }
    method = 'reviewed-coord'; src = { t: clip(d.title || d.id, 120) + ' (coordinates printed in the document)', u: d.cia || d.ia || d.url || '' }; extra = { printed: rec.printed };
  } else if (rec.article) {
    const a = wiki[rec.article.replace(/ /g, '_')]; if (!a || a.lat == null || a.disamb) { bad('no kept Wikipedia look-up with coordinates for ' + rec.article); continue; }
    pos = { lat: a.lat, lon: a.lon }; method = 'reviewed-wikipedia'; src = { t: 'Wikipedia: ' + a.title, u: a.url }; extra = { named: rec.site };
  } else { bad('no position source (printed or article)'); continue; }
  const d = km(town.lat, town.lon, pos.lat, pos.lon), far = rec.far || 30;
  if (d < 0.3 || d > far) { bad(`position is ${d.toFixed(1)} km from ${town.name} (allowed 0.3 to ${far})`); continue; }
  if (!/^https?:\/\//.test(src.u)) { bad('position source has no address'); continue; }
  rec.checked = { ok: true, region: s.region, name: s.name, method, lat: pos.lat, lon: pos.lon, r: rec.r || 1, fromTown: +d.toFixed(1), town: town.name, quoteDoc: hit.id, src, ...extra };
  pass++; console.log('PASS ' + id + ' -> ' + pos.lat + ', ' + pos.lon + ' (' + d.toFixed(1) + ' km from ' + town.name + '; ' + src.t + ')');
}
fs.writeFileSync(FILE, JSON.stringify(R, null, 1) + '\n');
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
