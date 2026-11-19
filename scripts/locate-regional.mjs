// Phase 2 of the regional positions (owner's go-ahead, 18 Nov 2026): proposes a position of its own for regional entries that are
// placed only by town (pos 'town'), where a source gives one. Proposes only; nothing on the map moves until a person approves an
// entry in archive/model/positions.json, which scripts/write-regional.mjs then applies.
//   node scripts/locate-regional.mjs            (uses the stored documents, the gazetteers and Wikipedia article pages; free)
//   node scripts/locate-regional.mjs --offline  (no network: stored documents and gazetteers only, plus earlier Wikipedia look-ups)
// How a position is found, strongest first. Each needs the entry's own words to name the place; no position is guessed.
//   doc-coord   a document the entry rests on prints map coordinates (US imagery reports: "COORDINATES 32-07-14N 020-03-07E")
//               within 25 km of the town. One position (or several within 2 km of each other) is proposed; several further apart
//               are shown as "ambiguous" with the text around each, for a person to choose or refuse.
//   gazetteer   a place the entry names has the same name, word for word after spelling folds, as a place in the region's
//               gazetteer (archive/model/gazetteer, positions from Wikipedia articles), and that place is not the town centre.
//   wikipedia   the named place is the title of an English Wikipedia article (or redirects to one) whose title matches the name
//               word for word, and the article's coordinates are within 30 km of the town. Article pages only (/wiki/<title>):
//               robots.txt forbids the Wikipedia and Wikidata APIs and the OpenStreetMap search service to this fetcher.
// Words for the kind of place are compared as one class (airport, airfield, air base and airstrip are one; port and harbour are
// one), and "facilities", "area" and "site" are ignored, so "Benina airfield" matches "Benina International Airport".
// Writes archive/review/positions-proposed.json and archive/review/positions-sheet.md (the sheet a person marks), and keeps the
// Wikipedia look-ups (title, address, coordinates, checksum, date) in archive/review/positions-wiki.json so a rerun is offline.
import fs from 'node:fs'; import zlib from 'node:zlib'; import vm from 'node:vm';
import { get, stats } from './lib/fetcher.mjs';
import { km, clip, TOWN_RE, words, same, classOnly, wiki, saveWiki, titlesFor, R_BY, COORD, dms, article as articleOf } from './lib/places.mjs';
const article = (t) => articleOf(t, OFFLINE);

const OFFLINE = process.argv.includes('--offline');

// ---------- the places an entry names ----------
const FAC = '(?:international airport|airport|air ?base|airfield|airstrip|barracks|naval base|military college|college|university|institute|hospital|stadium|square|street|avenue|prison|jail|camp|refinery|terminal|petrochemical complex|plant|factory|mill|hotel|mosque|palace|museum|fortress|castle|lighthouse|port|harbou?r|oasis|lake)';
const LEAD = "(?:(?:[A-Z][\\w'\\u2019-]*|al|el|ad|an|as|ash|at|of|the|\\d+(?:st|nd|rd|th)?)\\s+){1,5}";
const RX_A = new RegExp('\\b' + LEAD + FAC + '\\b(?:\\s+(?:North|South|East|West))?', 'g');
const RX_B = new RegExp('\\b' + FAC + '\\s+of\\s+(?:(?:[A-Z][\\w\'\\u2019-]*|al|el|the)\\s?){1,4}', 'gi');
function phrases(texts) {
  const out = [];
  for (const t of texts) { const s = String(t || ''); for (const rx of [RX_A, RX_B]) for (const m of s.matchAll(rx)) out.push(m[0].replace(/^(?:the|of)\s+/i, '').replace(/[\s,.;:]+$/, '')); }
  return [...new Set(out.filter((p) => p.length >= 5 && p.length <= 70))];
}

// ---------- inputs ----------
const W = {}; W.window = W;
for (const f of fs.readdirSync('public/data/regions').filter((x) => x.endsWith('.js') && !x.startsWith('_'))) vm.runInNewContext(fs.readFileSync('public/data/regions/' + f, 'utf8'), W);
const entries = (W.ATLAS_SITES || []).filter((s) => s.pos === 'town');
const CAND = fs.existsSync('archive/review/candidates.json') ? new Map(JSON.parse(fs.readFileSync('archive/review/candidates.json', 'utf8')).map((c) => [c.id, c])) : new Map();
const docs = new Map();
for (const f of ['docs', 'docs-other']) { const p = `archive/crest/${f}.jsonl.gz`; if (!fs.existsSync(p)) continue;
  for (const l of zlib.gunzipSync(fs.readFileSync(p)).toString().split('\n')) { if (!l) continue; const d = JSON.parse(l); docs.set(d.id, d); } }
const docByUrl = (u) => { const m = /cia\.gov\/readingroom\/document\/([^?#/]+)/.exec(u || ''); return m ? docs.get('cia-readingroom-document-' + m[1]) : null; };
const GAZ = {}; for (const f of fs.readdirSync('archive/model/gazetteer').filter((x) => x.endsWith('.json'))) { const g = JSON.parse(fs.readFileSync('archive/model/gazetteer/' + f, 'utf8')); GAZ[g.region] = g.places || []; }
const TOWNS = {}; for (const r of JSON.parse(fs.readFileSync('archive/model/regions.json', 'utf8')).regions) TOWNS[r.id] = r.towns || [];
const townOf = (s) => (TOWNS[s.region] || []).find((t) => km(t.lat, t.lon, s.lat, s.lon) < 0.3) || null;

function docCoords(docList, town) {
  const found = [];
  for (const d of docList) { if (!d || !d.text) continue;
    const all = [...d.text.matchAll(COORD)], distinct = new Set(all.map((m) => m[0].replace(/O/g, '0'))).size; // a list of many sites is not tied to one entry
    for (const m of all) { const lat = dms(m[1], m[2], m[3]), lon = dms(m[4], m[5], m[6]), dist = km(town.lat, town.lon, lat, lon);
      if (dist <= 25) found.push({ lat: +lat.toFixed(5), lon: +lon.toFixed(5), dist: +dist.toFixed(1), raw: m[0], doc: d, inDoc: distinct, at: m.index, context: clip(d.text.slice(Math.max(0, m.index - 300), m.index + 40), 340) }); } }
  const uniq = []; for (const f of found) if (!uniq.some((u) => km(u.lat, u.lon, f.lat, f.lon) < 0.05)) uniq.push(f);
  return uniq;
}


// ---------- run ----------
const out = [];
for (const s of entries) {
  const town = townOf(s); if (!town) { out.push({ id: s.id, region: s.region, name: s.name, status: 'none', why: 'not on a recorded town centre' }); continue; }
  const c = s.id.startsWith('c-') ? CAND.get(s.id.slice(2)) : null;
  // The entry's own subject: its title, and for a generated entry the site and place the reading recorded. Only these can give a
  // proposal. Places named only in the supporting passages may be incidental (the 1977 Benghazi hanging also mentions an execution
  // at the port), so they are shown as possible, never proposed.
  const primary = phrases([s.name, c && c.site, c && c.place]); if (c && c.kind === 'place') primary.unshift(c.name.replace(/\s*\(.*?\)\s*/g, ' ').trim());
  const secondary = phrases(c ? (c.items || []).map((x) => x.detail) : [s.relevance, s.text]).filter((p) => !primary.includes(p));
  const docList = c ? (c.items || []).map((x) => docs.get(x.doc)) : (s.sources || []).map((x) => docByUrl(x.u));
  const rec = { id: s.id, region: s.region, town: town.name, name: s.name, layer: s.layer, year: s.y0 || null, named: [...new Set(primary)], alsoNamed: [...new Set(secondary)], status: 'none', proposal: null, options: [] };

  // 1. coordinates printed in the documents: proposed when one position (or several within 2 km) is near the town and the document
  //    is not a list of many sites (more than 3 coordinates in all); otherwise shown for a person to choose
  const dc = docCoords(docList.filter(Boolean), town);
  if (dc.length) {
    const spread = Math.max(...dc.map((a) => Math.max(...dc.map((b) => km(a.lat, a.lon, b.lat, b.lon))))), list = dc.some((f) => f.inDoc > 3);
    rec.options.push(...dc.map((f) => ({ method: 'doc-coord', lat: f.lat, lon: f.lon, r: Math.max(1, Math.ceil(spread * 2) / 2), fromTown: f.dist, raw: f.raw, coordsInDoc: f.inDoc, src: { t: clip(f.doc.title || f.doc.id, 120) + ' (coordinates printed in the document)', u: f.doc.cia || f.doc.ia || f.doc.url || '' }, docHash: f.doc.hash || null, context: f.context })));
    if (spread <= 2 && !list) { rec.status = 'proposed'; rec.proposal = rec.options[0]; } else rec.status = 'ambiguous';
  }
  // 2 and 3. the named places, against the gazetteer and Wikipedia
  if (rec.status !== 'proposed') {
    for (const p of [...rec.named, ...rec.alsoNamed]) {
      const ws = words(p, s.region), own = rec.named.includes(p);
      // a bare kind of place ("the airfield", "at the port") says which facility only when the town is named with it ("Benghazi port")
      if (!ws.length || (classOnly(ws) && !(TOWN_RE[s.region] || []).some((re) => new RegExp(re.source, 'i').test(p)))) continue;
      const gz = (GAZ[s.region] || []).find((g) => same(words(g.name, s.region), ws) && !classOnly(ws) && km(g.lat, g.lon, town.lat, town.lon) > 0.3 && km(g.lat, g.lon, town.lat, town.lon) <= 30 && !/battle|war|attack|siege|fatalit|destroyer/i.test(g.name + ' ' + (g.kind || '')));
      if (gz) { rec.options.push({ method: own ? 'gazetteer' : 'possible', named: p, lat: gz.lat, lon: gz.lon, r: R_BY(ws, p), fromTown: +km(gz.lat, gz.lon, town.lat, town.lon).toFixed(1), src: { t: 'Wikipedia: ' + gz.name, u: gz.source }, ...(own ? {} : { note: 'named only in a supporting passage' }) }); continue; }
      for (const title of titlesFor(p, s.region, town)) {
        const a = await article(title); if (!a || a.lat == null || a.disamb) continue;
        const d = km(a.lat, a.lon, town.lat, town.lon), tw = words(a.title, s.region);
        if (d > 30 || d < 0.3) continue;
        if (!same(tw, ws)) { rec.options.push({ method: 'wikipedia-near', named: p, title: a.title, lat: a.lat, lon: a.lon, fromTown: +d.toFixed(1), src: { t: 'Wikipedia: ' + a.title, u: a.url }, note: 'title words differ from the name in the entry; shown for a person to judge, not proposed' }); continue; }
        rec.options.push({ method: own ? 'wikipedia' : 'possible', named: p, title: a.title, lat: a.lat, lon: a.lon, r: R_BY(ws, p), fromTown: +d.toFixed(1), src: { t: 'Wikipedia: ' + a.title, u: a.url }, ...(own ? {} : { note: 'named only in a supporting passage' }) });
        break;
      }
    }
    const firm = rec.options.filter((o) => o.method === 'gazetteer' || o.method === 'wikipedia');
    const places = []; for (const o of firm) if (!places.some((q) => km(q.lat, q.lon, o.lat, o.lon) < 1)) places.push(o);
    if (rec.status === 'ambiguous') { /* keep: the documents disagree; the named-place options are listed beside them */ }
    else if (places.length === 1) { rec.status = 'proposed'; rec.proposal = places[0]; }
    else if (places.length > 1) rec.status = 'ambiguous';
  }
  out.push(rec);
}
saveWiki();

const n = (st) => out.filter((r) => r.status === st).length;
const byMethod = out.filter((r) => r.proposal).reduce((m, r) => { m[r.proposal.method] = (m[r.proposal.method] || 0) + 1; return m; }, {});
fs.writeFileSync('archive/review/positions-proposed.json', JSON.stringify({ at: new Date().toISOString(), note: 'Proposals only. Nothing moves until a person approves an entry in archive/model/positions.json.', entries: out.length, proposed: n('proposed'), ambiguous: n('ambiguous'), none: n('none'), byMethod, list: out }, null, 1));

// the sheet a person marks
const L = [`# Regional positions: proposals for a person to check`, '',
  `Generated ${new Date().toISOString().slice(0, 10)} by \`node scripts/locate-regional.mjs\`. ${out.length} entries are placed only by town. ${n('proposed')} have a proposed position of their own, ${n('ambiguous')} have more than one possible position, ${n('none')} have none (they stay at the town centre).`, '',
  'To approve, copy the entry id into `archive/model/positions.json` as described in its note, with your initials and the date, then run `node scripts/write-regional.mjs`. Refuse by leaving it out. Check: does the source really describe the place this entry is about, and is the point on the right facility (open the link)?', '',
  `Methods: doc-coord = coordinates printed in a document the entry rests on; gazetteer / wikipedia = the place the entry names has a Wikipedia article of the same name with coordinates.`, ''];
for (const st of ['proposed', 'ambiguous']) {
  L.push(`## ${st === 'proposed' ? 'Proposed' : 'More than one possible position (choose or refuse)'}`, '');
  for (const r of out.filter((x) => x.status === st).sort((a, b) => a.region.localeCompare(b.region) || a.town.localeCompare(b.town))) {
    L.push(`### ${r.id} · ${r.region} · ${r.town}`, `**${r.name}**${r.year ? ' (' + r.year + ')' : ''}`, '');
    const show = st === 'proposed' ? [r.proposal] : r.options.filter((o) => o.method === 'doc-coord' || o.method === 'gazetteer' || o.method === 'wikipedia');
    for (const o of show) {
      L.push(`- ${o.method}${o.named ? ' for "' + o.named + '"' : ''}: ${o.lat}, ${o.lon} (${o.fromTown} km from the town centre, radius ${o.r} km) [map](https://www.openstreetmap.org/?mlat=${o.lat}&mlon=${o.lon}#map=15/${o.lat}/${o.lon})`);
      L.push(`  source: [${o.src.t}](${o.src.u})${o.raw ? ' · printed as `' + o.raw + '`' : ''}`);
      if (o.context) L.push(`  text before it: "${o.context.replace(/"/g, "'")}"`);
    }
    L.push('');
  }
}
// near misses: a Wikipedia article close to the town whose title is not word for word the name in the entry (e.g. "Benghazi airport"
// and "Benina International Airport"). Not proposed; a person may approve one if the documents make the identity clear.
const NEAR = (o) => o.method === 'wikipedia-near' || o.method === 'possible';
const near = out.filter((x) => x.status === 'none' && x.options.some(NEAR));
L.push('## Possible, not proposed (the article title differs from the name, or the place is named only in a supporting passage)', '');
for (const r of near) { const o = r.options.find(NEAR); L.push(`- ${r.id} · ${r.town} · ${clip(r.name, 90)}: ${o.method === 'possible' ? 'a supporting passage names' : 'the entry says'} "${o.named}"; article [${o.title}](${o.src.u}) at ${o.lat}, ${o.lon}, ${o.fromTown} km from the town centre`); }
L.push('');
L.push('## No position found (stay at the town centre)', '', ...out.filter((x) => x.status === 'none' && !near.includes(x)).map((r) => `- ${r.id} · ${r.town} · ${clip(r.name, 90)}${r.named.length ? ' (named: ' + r.named.slice(0, 3).join('; ') + ')' : ''}`), '');
fs.writeFileSync('archive/review/positions-sheet.md', L.join('\n'));
console.log(`${out.length} town-level entries: ${n('proposed')} proposed (${JSON.stringify(byMethod)}), ${n('ambiguous')} ambiguous, ${n('none')} none`);
console.log(`Wikipedia: ${Object.keys(wiki).length} titles looked up so far; this run ${stats.requests} requests, ${stats.blocked} refused by robots.txt`);
console.log('Wrote archive/review/positions-proposed.json and archive/review/positions-sheet.md');
