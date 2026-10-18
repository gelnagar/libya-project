// Fetch OCR text for Libya-relevant CREST + JPRS items from archive.org's mirror.
// Resumable (skips ids already in docs.jsonl.gz), 3 concurrent, polite, dedupes by text hash.
import fs from 'node:fs'; import zlib from 'node:zlib'; import crypto from 'node:crypto';
const UA = 'TripoliOpenSource-research/1.0 (historical research; contact gsea2020@mymail.pomona.edu)';
const DIR = 'archive/crest', OUT = `${DIR}/docs.jsonl.gz`, T0 = Date.now(), BUDGET = 5.3 * 3600e3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(u, as = 'text') {
  for (let k = 0; k < 4; k++) {
    try { const r = await fetch(u, { headers: { 'user-agent': UA } });
      if (r.ok) return as === 'json' ? await r.json() : await r.text();
      if (r.status === 404) return null; await sleep(4000 * (k + 1)); } catch { await sleep(4000 * (k + 1)); }
  } return null;
}
async function scrape(q) {
  const items = []; let cursor = null;
  do { const r = await get(`https://archive.org/services/search/v1/scrape?q=${encodeURIComponent(q)}&fields=identifier,title,date&count=10000${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`, 'json');
    if (!r) break; items.push(...(r.items || [])); cursor = r.cursor; await sleep(1000); } while (cursor);
  return items;
}
const TERMS = ['Libya', 'Libyan', 'Libyans', 'Tripoli', 'Benghazi', 'Qadhafi', 'Qadhdhafi', 'Qaddafi', 'Gadhafi', 'Gaddafi', 'Kadhafi', 'Qathafi', 'Jamahiriya', 'Jalloud', 'Jallud', 'Wheelus', 'Rabta', 'Tarhuna', '"El Dorado Canyon"', '"Revolutionary Command Council"', 'Aziziyah', 'Aziziya', 'Azizia', '"Abu Salim"', 'Mitiga', '"Okba Ben Nafi"', '"Uqba bin Nafi"', 'Tajura', 'Tajoura', '"Ain Zara"', 'Misratah', 'Misurata', 'Sirte', 'Surt', 'Kufra', 'Sabha', 'Sebha', 'Zuwarah', 'Zawiyah', 'Gharyan', 'Fezzan', 'Cyrenaica', 'Tripolitania'];
const T = `(${TERMS.join(' OR ')})`;
const RX = /liby|tripoli|qadh|qadd|gadh|gadd|kadh|qath|jamahir|jall?oud|jallud|wheelus|rabta|tarhun|aziziy|azizia|abu salim|mitiga|okba|uqba|tajou?ra|ain zara|misra|misura|sirte|benghazi|banghazi|kufra|sebha|sabha|zuwar|zawiy|gharyan|fezzan|cyrenaica|tripolitania/i;

const seen = new Map(); const hashes = new Set();
if (fs.existsSync(OUT)) for (const l of zlib.gunzipSync(fs.readFileSync(OUT)).toString().split('\n')) { if (!l) continue; const d = JSON.parse(l); seen.set(d.id, d); if (d.hash) hashes.add(d.hash); }
console.log('already have', seen.size);

const crest = await scrape(`collection:ciareadingroom AND title:${T}`);
const jprs = await scrape(`collection:ufiche-test-documents AND (title:"Near East" OR title:Libya OR title:"North Africa")`);
const nis = await scrape(`collection:ciareadingroom AND title:("NATIONAL INTELLIGENCE SURVEY" AND (LIBYA OR "49"))`);
const queue = [];
for (const it of nis) queue.push({ ...it, src: 'nis', full: true });
for (const it of crest) queue.push({ ...it, src: 'crest' });
for (const it of jprs) queue.push({ ...it, src: 'jprs' });
const todo = queue.filter((q, i, a) => !seen.has(q.identifier) && a.findIndex((x) => x.identifier === q.identifier) === i);
console.log('listed', queue.length, 'todo', todo.length);

function excerpt(t) { // merge ±1500-char windows around Libya terms
  const g = new RegExp(RX.source, 'gi'); const win = []; let m;
  while ((m = g.exec(t))) { const a = Math.max(0, m.index - 1500), b = Math.min(t.length, m.index + 1500); if (win.length && a <= win[win.length - 1][1]) win[win.length - 1][1] = b; else win.push([a, b]); }
  return win.map(([a, b]) => t.slice(a, b)).join('\n[…]\n');
}
const added = []; let errors = 0, dups = 0, empty = 0;
async function work(it) {
  const meta = await get(`https://archive.org/metadata/${it.identifier}`, 'json');
  const f = (meta?.files || []).find((x) => /_djvu\.txt$/.test(x.name));
  if (!f) { errors++; seen.set(it.identifier, { id: it.identifier, status: 'no-text' }); return; }
  let t = await get(`https://archive.org/download/${it.identifier}/${encodeURIComponent(f.name)}`);
  if (t == null) { errors++; return; }
  t = t.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const pages = meta?.metadata?.imagecount || null;
  let text = it.src === 'jprs' ? excerpt(t) : t;
  if (!it.full && text.length > 60000) text = text.slice(0, 60000) + '\n[…truncated]';
  if (text.length < 40) { empty++; }
  const hash = crypto.createHash('sha1').update(text.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4000)).digest('hex').slice(0, 16);
  if (text.length >= 200 && hashes.has(hash)) { dups++; seen.set(it.identifier, { id: it.identifier, status: 'dup', hash }); return; }
  hashes.add(hash);
  const rdp = (it.identifier.match(/document-(.+)$/) || [])[1];
  const rec = { id: it.identifier, src: it.src, title: String(it.title || '').replace(/^CIA Reading Room [^:]+:\s*/, ''), date: String(it.date || '').slice(0, 10), pages, fullChars: t.length, chars: text.length, hash,
    ia: `https://archive.org/details/${it.identifier}`, cia: it.src !== 'jprs' && rdp ? `https://www.cia.gov/readingroom/document/${rdp}` : null, text };
  seen.set(it.identifier, rec); added.push(rec);
}
let i = 0;
async function lane() { while (i < todo.length && Date.now() - T0 < BUDGET) { const it = todo[i++]; await work(it); await sleep(700); if (added.length && added.length % 200 === 0) save(); } }
function save() {
  const lines = [...seen.values()].map((d) => JSON.stringify(d)).join('\n') + '\n';
  fs.writeFileSync(OUT, zlib.gzipSync(lines));
  const docs = [...seen.values()].filter((d) => d.text != null);
  fs.writeFileSync(`${DIR}/fetch-status.json`, JSON.stringify({ at: new Date().toISOString(), listed: queue.length, have: docs.length, todoLeft: todo.length - i, errors, dups, empty,
    bySrc: docs.reduce((a, d) => (a[d.src] = (a[d.src] || 0) + 1, a), {}), totalChars: docs.reduce((a, d) => a + d.chars, 0), minutes: Math.round((Date.now() - T0) / 6e4) }, null, 1));
}
await Promise.all([lane(), lane(), lane()]);
save();
console.log(fs.readFileSync(`${DIR}/fetch-status.json`, 'utf8'));
