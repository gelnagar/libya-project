// US Embassy Tripoli telegrams, 1973-1979, from the State Department's Central Foreign Policy Files.
// These were declassified and released by the U.S. National Archives; the copies read here are the ones in the
// "Kissinger Cables" and "Carter Cables" sets of the Public Library of US Diplomacy (search.wikileaks.org/plusd).
// Rights: works of the U.S. government, public domain. The leaked 2003-2010 "Cablegate" set is deliberately NOT read:
// it was never officially released, and using it is the owner's decision to make.
//   node scripts/collect-cables.mjs --index          list every cable sent from Tripoli (archive/cables/index.json)
//   node scripts/collect-cables.mjs --fetch [N]      download the text of up to N not yet stored (default 300)
// Output: archive/cables/docs.jsonl.gz, one record per cable, each with its address, fetch time and checksum.
// Resumable. Requests are spaced 2.5 s apart; robots.txt is obeyed (lib/fetcher.mjs).
import fs from 'node:fs';
import { get, record, loadDocs, saveDocs, strip, stats, TRIPOLI, lebanonOnly } from './lib/fetcher.mjs';

const DIR = 'archive/cables', INDEX = `${DIR}/index.json`, DOCS = `${DIR}/docs.jsonl.gz`;
const SEARCH = 'https://search.wikileaks.org/plusd/', SETS = ['ps', 'cc', 'fp', 'ee']; // Kissinger, Carter 1-3
const args = process.argv.slice(2), GAP = { gap: 2500 };
fs.mkdirSync(DIR, { recursive: true });

function rows(html) {
  const out = [];
  for (const m of html.matchAll(/<tr id="([0-9A-Za-z_]+)"[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...m[2].matchAll(/<td[^>]*?(?:title="([^"]*)")?[^>]*>([\s\S]*?)<\/td>/g)].map((c) => [c[1] || '', strip(c[2])]);
    if (cells.length < 4) continue;
    const d = new Date(cells[1][1] + ' UTC');
    out.push({ id: m[1], classification: cells[0][0], date: isNaN(d) ? '' : d.toISOString().slice(0, 10), subject: cells[2][1], from: cells[3][1], to: cells[4] ? cells[4][1] : '' });
  }
  return out;
}
async function index() {
  const q = SETS.map((s) => 'qproject[]=' + s).join('&') + '&q=&qforigin=' + encodeURIComponent('Libya##Tripoli') + '&qsort=tasc';
  const page = await get(SEARCH + '?' + q, GAP); if (!page) throw new Error('search page not available');
  const par = (k) => { const m = new RegExp('"' + k + '":\\s*(?:\'([^\']*)\'|([^,\\n]+))').exec(page) || []; return m[1] != null ? m[1] : (m[2] || '').trim(); };
  let token = (/result_token = "(\d+)"/.exec(page) || [])[1];
  const all = new Map(); rows(page).forEach((r) => all.set(r.id, r));
  // the same request the page's own "next 100" button makes
  while (token) {
    const u = SEARCH + 'sphinxer_do.php?' + new URLSearchParams({ format: 'html', command: 'doc_list_from_query', project: par('project'), subp: par('subp'), qcanonical: par('qcanonical'), qcanonical_seal: par('qcanonical_seal'),
      qtfrom: par('qtfrom'), qtto: par('qtto'), qsort: par('qsort'), token, qlimit: '100', s: '' });
    const j = await get(u, { ...GAP, as: 'json', headers: { 'X-Requested-With': 'XMLHttpRequest', Referer: SEARCH } });
    if (!j || !j.content) break;
    const got = rows('<table>' + j.content + '</table>'), before = all.size; got.forEach((r) => all.set(r.id, r));
    process.stdout.write(`\r${all.size} cables listed`);
    if ((typeof j.length === 'number' ? j.length : got.length) < 100 || !got.length || !j.token) break; // the service's own count says when the list ends
    token = j.token;
  }
  const list = [...all.values()].sort((a, b) => (a.date + a.id < b.date + b.id ? -1 : 1));
  fs.writeFileSync(INDEX, JSON.stringify({ at: new Date().toISOString(), source: SEARCH, sets: SETS, origin: 'Tripoli, Libya', cables: list }));
  const by = {}; list.forEach((c) => { const y = c.date.slice(0, 4) || '?'; by[y] = (by[y] || 0) + 1; });
  console.log(`\nlisted ${list.length} cables sent from Tripoli`, JSON.stringify(by));
}
async function fetchTexts(max) {
  if (!fs.existsSync(INDEX)) throw new Error('run --index first');
  const list = JSON.parse(fs.readFileSync(INDEX, 'utf8')).cables, docs = loadDocs(DOCS);
  // most likely to name a place first: subjects about security, arrests, the city, the embassy's own surroundings
  const HOT = /prison|arrest|detain|detention|execut|hang|trial|court|police|security|intelligence|demonstrat|riot|attack|bomb|shoot|kill|student|university|embassy|barracks|camp|base|airport|wheelus|okba|aziziy|square|street|mosque|hospital|expuls|confiscat|nationaliz|coup|plot|opposition|dissident|human rights|revolutionary committee|people'?s committee/i;
  const todo = list.filter((c) => !docs.has('cable-' + c.id)).sort((a, b) => (HOT.test(b.subject) ? 1 : 0) - (HOT.test(a.subject) ? 1 : 0));
  let n = 0, empty = 0;
  for (const c of todo.slice(0, max)) {
    const url = 'https://wikileaks.org/plusd/cables/' + c.id + '.html', html = await get(url, GAP);
    if (!html) { empty++; continue; }
    const parts = [...html.matchAll(/<div[^>]*class="[^"]*text-content[^"]*"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => strip(m[1])).filter((t) => t.length > 20);
    // a cable page has two text blocks: the message, and a block of archive header fields ("Capture Date: ..."); keep the message
    const text = parts.filter((t) => !/Capture Date:|Disposition Action:/.test(t.slice(0, 400))).sort((a, b) => b.length - a.length)[0] || '';
    docs.set('cable-' + c.id, record({ id: 'cable-' + c.id, src: 'cable', title: 'Embassy Tripoli telegram: ' + (c.subject || c.id), date: c.date, url, text,
      rights: 'U.S. government work, public domain; declassified and released by the U.S. National Archives', extra: { classification: c.classification, to: c.to, ref: c.id.replace(/_[a-z]$/, '') } }));
    if (++n % 25 === 0) { saveDocs(DOCS, docs); process.stdout.write(`\r${n} fetched`); }
  }
  saveDocs(DOCS, docs);
  const all = [...docs.values()], withText = all.filter((d) => d.chars > 200), trip = withText.filter((d) => TRIPOLI.test(d.text.replace(/^[\s\S]{0,400}?(?=\n)/, '')) && !lebanonOnly(d.text, d.title));
  fs.writeFileSync(`${DIR}/status.json`, JSON.stringify({ at: new Date().toISOString(), listed: list.length, stored: all.length, withText: withText.length, chars: withText.reduce((s, d) => s + d.chars, 0), requests: stats }, null, 1));
  console.log(`\nfetched now ${n} (${empty} unavailable); stored ${all.length} of ${list.length}; with text ${withText.length}; ${Math.round(withText.reduce((s, d) => s + d.chars, 0) / 1000)}k characters`);
}
if (args.includes('--index')) await index();
else if (args.includes('--fetch')) await fetchTexts(+args[args.indexOf('--fetch') + 1] || 300);
else console.log('usage: --index | --fetch [N]');
