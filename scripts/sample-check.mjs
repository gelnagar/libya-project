// The 30-entry sample check for a region (plan: "30 sample entries pass an independent check against their sources
// with no error of fact"). Free: no network, no AI calls.
//   node scripts/sample-check.mjs <region> [count=30]
// Draws a fixed sample (the same region always gives the same entries, so a second checker sees the same list) from
// the region's map pins if it has any, otherwise from its review candidates. For each entry the machine part re-reads
// the stored copy of every cited document, not the copy in candidates.json, and records:
//   passage   the quoted passage is found word for word in the stored text
//   name      the entry's name (or its most distinctive word) is in that passage
//   date      the entry's year appears in the passage or the document's own date
// The human part is left blank for an independent checker: is each fact in the entry what the source says?
// Writes archive/review/sample-<region>.json (machine results) and archive/review/sample-<region>.md (the sheet).
import fs from 'node:fs'; import vm from 'node:vm'; import crypto from 'node:crypto';
import { storedDocs, flat } from './lib/stored.mjs';

const region = process.argv[2], want = +(process.argv[3] || 30);
if (!region) { console.log('usage: node scripts/sample-check.mjs <region> [count]'); process.exit(2); }
const all = JSON.parse(fs.readFileSync('archive/review/candidates.json', 'utf8')); const cands = (all.candidates || all).filter((c) => c.region === region);
let pins = []; const pf = `public/data/regions/${region}.js`;
if (fs.existsSync(pf)) { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(pf, 'utf8'), ctx); pins = Object.values(ctx.window).flat().filter((x) => x && x.region === region); }
const from = pins.length >= want ? 'pins' : 'candidates';
if (from === 'pins') { console.log('map pins carry written entries; check them against their sources by hand with the sheet'); }
const pool = from === 'pins' ? pins.map((p) => ({ id: p.id, kind: 'pin', name: p.name, date: String(p.y0 || ''), items: [] , sources: p.sources })) : cands;
// fixed order: by a hash of region and id, so the sample does not depend on file order or on the day it is run
const rank = (id) => crypto.createHash('sha256').update(region + '|' + id).digest('hex');
const sample = pool.slice().sort((a, b) => rank(a.id) < rank(b.id) ? -1 : 1).slice(0, want);

const docs = storedDocs(), STOP = /^(benghazi|banghazi|libya|libyan|tripoli|people|government|reported|against|during|qadhdhafi|qadhafi)$/i;
const rows = sample.map((c) => {
  const year = (c.date || '').slice(0, 4), words = flat(c.name).split(/[^a-z0-9'-]+/).filter((w) => w.length >= 6 && !STOP.test(w)).sort((a, b) => b.length - a.length);
  const items = (c.items || []).map((i) => {
    const d = docs.get(i.doc), text = d ? flat(d.text) : '', pass = flat(i.passage).replace(/^…|…$/g, '').trim();
    const passage = !d ? 'no stored copy' : !text ? 'no text' : !pass ? 'none quoted' : text.includes(pass) ? 'found' : 'NOT FOUND';
    const name = !pass ? '-' : pass.includes(flat(c.name)) ? 'name' : words.some((w) => pass.includes(w)) ? 'word' : 'no';
    const date = !year ? '-' : pass.includes(year) || String(i.date || (d && d.date) || '').startsWith(year) ? 'yes' : 'no';
    return { doc: i.doc, title: i.title, url: i.url, passage, name, date, quoted: i.passage };
  });
  return { id: c.id, kind: c.kind, date: c.date || '', name: c.name, items };
});
const allItems = rows.flatMap((r) => r.items), n = (k, v) => allItems.filter((i) => i[k] === v).length;
const summary = { region, from, entries: rows.length, citations: allItems.length, passageFound: n('passage', 'found'), passageNotFound: n('passage', 'NOT FOUND'),
  noStoredCopy: n('passage', 'no stored copy'), nameInPassage: n('name', 'name') + n('name', 'word'), dateBorne: n('date', 'yes'),
  entriesWithAVerbatimPassage: rows.filter((r) => r.items.some((i) => i.passage === 'found' && i.name !== 'no')).length };
fs.writeFileSync(`archive/review/sample-${region}.json`, JSON.stringify({ summary, rows }, null, 1));
fs.writeFileSync(`archive/review/sample-${region}.md`, [
  `# Sample check: ${region}`, '', `${rows.length} entries drawn from the region's ${from} by a fixed hash, so any checker gets the same list.`,
  'Machine part done (columns Passage, Name, Date). Human part: open each source, read the passage, and mark every fact in the entry (who, what, where, when, how many) as correct, wrong or not in the source.',
  'Pass: no entry has a fact marked wrong. An entry whose facts are "not in the source" fails too, until a source that says it is cited.', '',
  `Machine results: ${summary.passageFound} of ${summary.citations} quoted passages found word for word in the stored copy; ${summary.passageNotFound} not found; ${summary.noStoredCopy} with no stored copy.`, '',
  ...rows.flatMap((r, k) => [`## ${k + 1}. ${r.date ? r.date + ' — ' : ''}${r.name}`, '', `Kind: ${r.kind}. Id: \`${r.id}\``, '', '| Source | Passage | Name | Date |', '|---|---|---|---|',
    ...r.items.map((i) => `| ${i.url ? `[${i.title.replace(/\|/g, '/')}](${i.url})` : i.title.replace(/\|/g, '/')} | ${i.passage} | ${i.name} | ${i.date} |`), '',
    'Checker: facts correct? ☐ yes ☐ no — note:', '']),
].join('\n'));
console.log(JSON.stringify(summary));
