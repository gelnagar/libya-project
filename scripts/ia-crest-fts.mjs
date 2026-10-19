// Aggressive CREST discovery: full-text (OCR) search of the archive.org ciareadingroom mirror, plus wider title/description queries.
// Finds documents whose TITLE does not mention Libya but whose text does. Writes archive/crest/ia-extra.json (consumed by ia-crest-fetch.mjs).
import fs from 'node:fs';
const UA = 'TripoliOpenSource-research/1.0 (historical research; contact gsea2020@mymail.pomona.edu)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(u, as = 'text') { for (let k = 0; k < 4; k++) { try { const r = await fetch(u, { headers: { 'user-agent': UA } }); if (r.ok) return as === 'json' ? await r.json() : await r.text(); if (r.status === 404) return null; await sleep(3000 * (k + 1)); } catch { await sleep(3000 * (k + 1)); } } return null; }
const ID = /cia-readingroom-document-[A-Za-z0-9_.\-]+/g;
const PHRASES = ['"Abu Salim"', '"Tripoli prison"', '"Libyan prison"', '"Qadhafi" prison', '"Qadhdhafi" prison', '"Black Horse"', '"Ain Zara"', '"Tajura"', '"Tajoura"', 'Janzur', 'Gargaresh', 'Hadba', '"Bab al-Aziziyah"', 'Aziziyah barracks', '"Qadhafi" executed', '"Qadhafi" hanged', '"Libyan" coup Tripoli', '"Tripoli" riot', '"Tripoli" bomb', '"Libyan security" detained', '"political prisoners" Libya', '"Libya" torture', '"Libya" "internal security"', '"Libyan" "revolutionary committees"', 'Rabta', 'Tarhuna', '"Sidi Bilal"', '"Okba Ben Nafi"', 'Mitiga', '"Tripoli" "military prison"', '"Libya" dissident killed', '"Libyan exiles"', '"National Front for the Salvation of Libya"', '"Libya" mutiny', '"Libya" "people\'s bureau"', 'Qadhafi', 'Qaddafi', 'Gadhafi', 'Libya'];
const found = new Map(); const log = { at: new Date().toISOString(), queries: {} };
async function fts(q, pages) {
  let n = 0;
  for (let p = 1; p <= pages; p++) {
    const u = `https://archive.org/services/search/beta/page_production/?service_backend=fts&user_query=${encodeURIComponent(q)}&hits_per_page=100&page=${p}&filters=${encodeURIComponent('collection:ciareadingroom')}`;
    const t = await get(u); if (!t) break;
    if (!log.sample) log.sample = t.slice(0, 1500);
    const ids = [...new Set(t.match(ID) || [])].map((s) => s.replace(/[.\-]+$/, '').replace(/_djvu.*$/, ''));
    if (!ids.length) break;
    let fresh = 0; for (const id of ids) if (!found.has(id)) { found.set(id, { identifier: id, q }); fresh++; }
    n += ids.length; await sleep(1200);
    if (!fresh && p > 2) break;
  }
  log.queries[q] = n;
}
for (const q of PHRASES) await fts(q, q === 'Libya' || q.startsWith('Qa') || q === 'Gadhafi' ? 40 : 15);
// wider title / description / subject queries through the scrape API
async function scrape(q) { const items = []; let cursor = null; do { const r = await get(`https://archive.org/services/search/v1/scrape?q=${encodeURIComponent(q)}&fields=identifier,title,date&count=10000${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`, 'json'); if (!r) break; items.push(...(r.items || [])); cursor = r.cursor; await sleep(1000); } while (cursor); return items; }
const WIDE = ['collection:ciareadingroom AND (description:(Libya OR Libyan OR Tripoli OR Qadhafi OR Qaddafi OR Gadhafi) OR subject:(Libya OR Libyan OR Qadhafi))',
  'collection:ciareadingroom AND title:(Maghreb OR "North Africa" OR "Arab terrorism" OR "state-sponsored" OR "Chad" OR Lockerbie OR "Pan Am" OR "La Belle" OR Sanctions OR "Gulf of Sidra" OR "Sidra")',
  'collection:ciareadingroom AND title:("national intelligence survey" OR "NIS" OR "Intelligence Memorandum" OR "Special Report") AND title:(Arab OR Africa OR terrorism)'];
let w = 0; for (const q of WIDE) { const it = await scrape(q); w += it.length; for (const x of it) if (!found.has(x.identifier)) found.set(x.identifier, { identifier: x.identifier, title: x.title, date: x.date, q: 'wide' }); }
log.wide = w; log.total = found.size;
fs.writeFileSync('archive/crest/ia-extra.json', JSON.stringify([...found.values()]));
fs.writeFileSync('archive/crest/ia-fts-log.json', JSON.stringify(log, null, 1));
console.log(JSON.stringify(log, null, 1).slice(0, 4000));
