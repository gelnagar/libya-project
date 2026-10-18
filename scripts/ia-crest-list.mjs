// Enumerate Libya-relevant CREST items on archive.org's ciareadingroom mirror (+ JPRS NENA), via the Scrape API.
// Polite: sequential, ~1 req/s. Writes archive/crest/ia-list.json and stats.
import fs from 'node:fs';
const UA = 'TripoliOpenSource-research/1.0 (historical research; contact gsea2020@mymail.pomona.edu)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function j(u) { for (let k = 0; k < 4; k++) { try { const r = await fetch(u, { headers: { 'user-agent': UA } }); if (r.ok) return await r.json(); await sleep(3000 * (k + 1)); } catch { await sleep(3000); } } return null; }
async function scrape(q, fields = 'identifier,title,date') {
  const items = []; let cursor = null, total = null;
  do {
    const u = `https://archive.org/services/search/v1/scrape?q=${encodeURIComponent(q)}&fields=${fields}&count=10000${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`;
    const r = await j(u); if (!r) break;
    total = r.total; items.push(...(r.items || [])); cursor = r.cursor; await sleep(1000);
  } while (cursor);
  return { total, items };
}
const T = '(Libya OR Libyan OR Libyans OR Tripoli OR Benghazi OR Qadhafi OR Qadhdhafi OR Qaddafi OR Gadhafi OR Gaddafi OR Kadhafi OR Qathafi OR Jamahiriya OR Jalloud OR Jallud OR Wheelus OR Rabta OR Tarhuna OR "El Dorado Canyon" OR LARF OR "Revolutionary Command Council")';
const out = { at: new Date().toISOString() };
const all = await j(`https://archive.org/advancedsearch.php?q=collection%3Aciareadingroom&rows=0&output=json`);
out.collectionTotal = all?.response?.numFound;
const crest = await scrape(`collection:ciareadingroom AND title:${T}`);
const jprs = await scrape(`(collection:ufiche-test-documents OR collection:jprs) AND (title:"Near East" OR title:Libya OR title:"North Africa")`);
const gaz = await scrape(`collection:ciareadingroom AND title:(gazetteer OR "national intelligence survey") AND title:(Libya OR Libyan OR "North Africa")`);
out.crestTitleHits = crest.total; out.jprsHits = jprs.total; out.gazHits = gaz.total;
// Year histogram
const yr = {}; for (const it of crest.items) { const y = String(it.date || '').slice(0, 4); yr[y] = (yr[y] || 0) + 1; }
out.byYear = yr;
// Inspect a few items' files (is OCR text present?)
out.samples = [];
for (const it of crest.items.slice(0, 4)) {
  const m = await j(`https://archive.org/metadata/${it.identifier}`); await sleep(1000);
  out.samples.push({ id: it.identifier, title: it.title, files: (m?.files || []).map((f) => [f.name, f.format, f.size]).slice(0, 12), meta: Object.fromEntries(Object.entries(m?.metadata || {}).filter(([k]) => !/^(identifier|mediatype|collection|uploader|publicdate|addeddate|scanner)$/.test(k)).map(([k, v]) => [k, String(v).slice(0, 200)])) });
}
fs.writeFileSync('archive/crest/ia-list.json', JSON.stringify({ crest: crest.items, jprs: jprs.items, gazetteer: gaz.items }, null, 0));
fs.writeFileSync('archive/crest/ia-stats.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 5000));
