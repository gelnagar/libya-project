// Builds the owner's review queue from what the extraction model already read (no AI calls, no network).
//   node scripts/build-review.mjs [--sql out.sql]
// Reads  archive/crest/extract*.jsonl (model output) and archive/crest/docs*.jsonl.gz (the stored source texts).
// Writes archive/review/candidates.json, and with --sql a file of INSERTs for the D1 table `cand`
//   (load it with: npx wrangler d1 execute tripoli-atlas-stats --remote --file out.sql -y).
// A candidate is a place not yet on the map, or a dated event in Tripoli, with every document that mentions it.
// For each mention the script looks the name up in the stored text and keeps the passage around it, so the
// reviewer reads the source's own words; a mention whose name is not in the text is marked "not found".
import fs from 'node:fs'; import zlib from 'node:zlib'; import vm from 'node:vm'; import crypto from 'node:crypto';

const DIR = 'archive/crest', arr = (v) => (Array.isArray(v) ? v : []);
const fold = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`ʿʾ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const clip = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

const W = {}; for (const f of ['public/data/sites.js', 'public/data/areas.js']) { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(f, 'utf8'), c); Object.assign(W, c.window); }
const SITES = W.ATLAS_SITES || [], AREAS = W.ATLAS_AREAS || [];
const NAME = {}; SITES.forEach((s) => { NAME[s.id] = s.name; }); AREAS.forEach((a) => { NAME[a.id] = NAME[a.id] || a.name; });
const onMap = new Set([...SITES, ...AREAS].flatMap((x) => [x.name, ...(x.aliases || [])]).map(fold));

const docs = new Map();
for (const f of ['docs', 'docs-other']) { const p = `${DIR}/${f}.jsonl.gz`; if (!fs.existsSync(p)) continue;
  for (const l of zlib.gunzipSync(fs.readFileSync(p)).toString().split('\n')) { if (!l) continue; const d = JSON.parse(l); docs.set(d.id, d); } }

const STOP = new Set('the of and in at near a an to for on by from with tripoli libya libyan city area district street road former new old al el'.split(' '));
const GENERIC = new Set(['tripoli', 'tripoli libya', 'city of tripoli', 'libya', 'tripolitania', 'tripoli area', 'downtown tripoli', 'central tripoli', 'tripoli city', 'the capital']);
const SPECIFIC = /prison|jail|camp|barrack|base|airfield|airport|hospital|school|universit|ministry|headquarter|hq\b|embassy|mosque|square|street|road|port|harbou?r|hotel|station|compound|depot|dump|factory|refinery|cemeter|court|palace|stadium|radio|bridge/i;

// the passage in the stored text that carries the name: whole phrase first, then its most distinctive word
function passage(doc, phrase, extra) {
  const text = doc && doc.text; if (!text) return { found: 'no-text', text: '' };
  const low = text.toLowerCase().replace(/[‘’`]/g, "'"), tries = [];
  const clean = String(phrase || '').replace(/\(.*?\)/g, ' ').replace(/["“”]/g, '').replace(/[‘’`]/g, "'").replace(/\s+/g, ' ').trim();
  if (clean.length >= 4) tries.push([clean.toLowerCase(), 'exact']);
  const first = clean.split(',')[0].trim(); if (first.length >= 4 && first !== clean) tries.push([first.toLowerCase(), 'exact']);
  const words = (clean + ' ' + (extra || '')).split(/[^A-Za-z0-9À-ɏ-]+/).filter((w) => w.length >= 6 && !STOP.has(w.toLowerCase()) && !/^(people|peoples|military|general|national|government|libyan?s?|american|embassy|during|against|station|headquarters)$/i.test(w)).sort((a, b) => b.length - a.length);
  for (const w of words.slice(0, 4)) tries.push([w.toLowerCase(), 'word']);
  for (const [needle, how] of tries) {
    const i = low.indexOf(needle); if (i < 0) continue;
    const a = Math.max(0, i - 320), b = Math.min(text.length, i + needle.length + 380);
    return { found: how, hit: text.slice(i, i + needle.length), text: (a ? '…' : '') + text.slice(a, b).replace(/\s+/g, ' ').trim() + (b < text.length ? '…' : '') };
  }
  return { found: 'none', text: '' };
}
function recId(d) { return (d.src === 'jprs' ? 'jprs2-' : 'crest-') + d.id.replace(/^cia-readingroom-document-|^ufiche-test-document_/, ''); }
function item(x, d, detail, phrase, extra) {
  const p = passage(d, phrase, extra);
  return { doc: x.id, rec: d && d.cia !== undefined ? recId(d) : null, title: clip(d ? d.title : x.id, 160), date: /^\d{4}/.test(x.date || '') ? x.date : '', url: d ? (d.cia || d.url || d.ia || '') : '', mirror: d && d.ia ? d.ia : '',
    rel: x.relevance || 0, detail: clip(detail, 420), found: p.found, hit: p.hit || '', passage: clip(p.text, 760) };
}

const places = new Map(), events = new Map();
let read = 0;
for (const f of ['extract', 'extract-other']) { const p = `${DIR}/${f}.jsonl`; if (!fs.existsSync(p)) continue;
  for (const l of fs.readFileSync(p, 'utf8').split('\n')) { if (!l) continue; let x; try { x = JSON.parse(l); } catch { continue; }
    if (!(x.relevance >= 1)) continue; read++;
    const d = docs.get(x.id);
    for (const pl of arr(x.places)) {
      if (!pl || !pl.name || !pl.in_tripoli || (pl.site_id && NAME[pl.site_id])) continue;
      const key = fold(String(pl.name).replace(/,?\s*(tripoli|libya)\s*$/i, ''));
      if (!key || GENERIC.has(key) || GENERIC.has(fold(pl.name)) || onMap.has(key) || onMap.has(fold(pl.name))) continue;
      const g = places.get(key) || { kind: 'place', key, names: {}, items: [] }; places.set(key, g);
      g.names[pl.name] = (g.names[pl.name] || 0) + 1;
      if (!g.items.some((i) => i.doc === x.id)) g.items.push(item(x, d, pl.detail, pl.name));
    }
    for (const e of arr(x.events)) {
      if (!e || !e.what || !/^\d{4}-\d\d-\d\d$/.test(e.date || '')) continue;
      const site = e.site_id && NAME[e.site_id] ? e.site_id : null;
      if (!site && !/tripoli/i.test((e.place || '') + ' ' + e.what)) continue;
      const key = e.date + '|' + (site || fold(e.place || 'tripoli'));
      const g = events.get(key) || { kind: 'event', key, date: e.date, site, place: e.place || '', killed: null, whats: [], items: [] }; events.set(key, g);
      if (e.killed != null && e.killed !== '') g.killed = g.killed == null ? String(e.killed) : g.killed;
      g.whats.push(e.what);
      if (!g.items.some((i) => i.doc === x.id)) g.items.push(item(x, d, e.what, e.place && !/^tripoli$/i.test(e.place) ? e.place : '', e.what));
    }
  } }

// events already told by a pin: same place and the event year inside the pin's years
function already(g) {
  const y = +g.date.slice(0, 4);
  return SITES.filter((s) => (g.site && (s.id === g.site || s.profile === g.site)) && s.y0 != null && y >= s.y0 && y <= (s.y1 || s.y0)).map((s) => s.name).slice(0, 4);
}
const out = [];
for (const g of places.values()) {
  const name = Object.keys(g.names).sort((a, b) => g.names[b] - g.names[a] || a.length - b.length)[0];
  const nd = g.items.length, rel = Math.max(...g.items.map((i) => i.rel)), ok = g.items.filter((i) => i.found === 'exact').length;
  out.push({ kind: 'place', name, also: Object.keys(g.names).filter((n) => n !== name).slice(0, 5), date: g.items.map((i) => i.date).filter(Boolean).sort()[0] || '',
    docs: nd, found: ok, score: nd * 3 + rel * 2 + (ok ? 3 : 0) + (SPECIFIC.test(name) ? 2 : 0), near: [], items: g.items.sort((a, b) => b.rel - a.rel).slice(0, 6), key: 'p|' + g.key });
}
for (const g of events.values()) {
  const what = g.whats.sort((a, b) => b.length - a.length)[0];
  const nd = g.items.length, rel = Math.max(...g.items.map((i) => i.rel)), ok = g.items.filter((i) => i.found !== 'none' && i.found !== 'no-text').length;
  out.push({ kind: 'event', name: clip(what, 150), also: [], date: g.date, site: g.site, place: g.site ? NAME[g.site] : g.place, killed: g.killed,
    docs: nd, found: ok, score: nd * 3 + rel * 2 + (ok ? 2 : 0) + (g.killed ? 3 : 0) + (g.site ? 2 : 0), near: already(g), items: g.items.sort((a, b) => b.rel - a.rel).slice(0, 6), key: 'e|' + g.key });
}
out.forEach((c) => { c.id = crypto.createHash('sha1').update(c.key).digest('hex').slice(0, 12); delete c.key; });
out.sort((a, b) => b.score - a.score || (a.date < b.date ? -1 : 1));

fs.mkdirSync('archive/review', { recursive: true });
fs.writeFileSync('archive/review/candidates.json', JSON.stringify(out));
const n = (k) => out.filter((c) => c.kind === k).length, nf = out.filter((c) => !c.found).length;
console.log(`documents with extraction: ${read}; candidates: ${out.length} (${n('place')} places, ${n('event')} events); name not found in any stored text: ${nf}; two or more documents: ${out.filter((c) => c.docs > 1).length}`);

const si = process.argv.indexOf('--sql');
if (si > 0) {
  const q = (v) => "'" + String(v == null ? '' : v).replace(/'/g, "''") + "'";
  const rows = out.map((c) => `INSERT OR REPLACE INTO cand (id, kind, name, date, docs, found, score, data) VALUES (${q(c.id)}, ${q(c.kind)}, ${q(c.name)}, ${q(c.date)}, ${c.docs}, ${c.found}, ${c.score}, ${q(JSON.stringify(c))});`);
  fs.writeFileSync(process.argv[si + 1], [
    'CREATE TABLE IF NOT EXISTS cand (id TEXT PRIMARY KEY, kind TEXT NOT NULL, name TEXT, date TEXT, docs INTEGER, found INTEGER, score INTEGER, data TEXT);',
    'CREATE TABLE IF NOT EXISTS decision (id TEXT PRIMARY KEY, verdict TEXT NOT NULL, reason TEXT, note TEXT, at INTEGER);',
    'CREATE INDEX IF NOT EXISTS cand_score ON cand(score DESC);'
  ].concat(rows).join('\n') + '\n');
  console.log('wrote', process.argv[si + 1], rows.length, 'rows');
}
