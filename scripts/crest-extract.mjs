// Haiku extraction over CREST/JPRS texts (archive/crest/docs.jsonl.gz) -> archive/crest/extract.jsonl
//   node scripts/crest-extract.mjs --sample 30   # quick demo: regular API, 4 at a time, prints cost
//   node scripts/crest-extract.mjs --batch       # everything left: Message Batches API (50% off), polls to completion
// Resumable: ids already in extract.jsonl are skipped. Needs ANTHROPIC_API_KEY.
import fs from 'node:fs'; import zlib from 'node:zlib'; import vm from 'node:vm';
const KEY = process.env.ANTHROPIC_API_KEY; if (!KEY) { console.error('ANTHROPIC_API_KEY missing'); process.exit(2); }
const MODEL = process.env.EXTRACT_MODEL || 'claude-haiku-5-5';
const DIR = 'archive/crest', SET = process.env.SET === 'other' ? 'other' : 'crest';
const OUT = `${DIR}/${SET === 'other' ? 'extract-other' : 'extract'}.jsonl`, DOCS = `${DIR}/${SET === 'other' ? 'docs-other' : 'docs'}.jsonl.gz`;
const args = process.argv.slice(2), SAMPLE = args.includes('--sample') ? +args[args.indexOf('--sample') + 1] || 30 : 0, BATCH = args.includes('--batch');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };

// Known places, so Haiku can link to existing ids
const W = {}; for (const f of ['public/data/sites.js', 'public/data/areas.js']) { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(f, 'utf8'), c); Object.assign(W, c.window); }
const known = [...(W.ATLAS_SITES || []).map((s) => `${s.id}: ${s.name}${s.aliases ? ' / ' + s.aliases.slice(0, 4).join(' / ') : ''}`),
  ...(W.ATLAS_AREAS || []).map((a) => `${a.id}: ${a.name}${a.aliases?.length ? ' / ' + a.aliases.slice(0, 4).join(' / ') : ''} [${a.kind}]`)].join('\n');

const SYSTEM = `You read declassified U.S. government documents (CIA reading room/CREST, FBIS and JPRS translations, National Intelligence Surveys) for "Tripoli: Open Source", a historical map of Tripoli, Libya under Gaddafi (1969-2011): prisons, security and intelligence sites, military bases, weapons programs, the 1986 U.S. raid, killings and repression, landmarks, and the people involved.

Extract only what the document actually says. Never invent coordinates, dates, numbers or names. OCR errors are common: correct obvious spelling slips in names, but do not guess at illegible text. Prefer specifics (named buildings, units, streets, dates, death tolls) over generalities.

relevance: 0 = nothing about Libya itself (e.g. only Libya's foreign deals elsewhere); 1 = Libya background or foreign policy; 2 = Libyan regime, security, military, economy or society with some specifics; 3 = specific facts about places, events or people in or near Tripoli.

For places, set site_id to an id from this list ONLY when it is clearly the same place; otherwise null. Set lat/lon only if the document states coordinates.

Known places (id: names):
${known}`;

const TOOL = { name: 'record', description: 'Structured facts from one document.', input_schema: { type: 'object', additionalProperties: false, required: ['relevance', 'summary', 'kind', 'places', 'events', 'people', 'facts', 'links'], properties: {
  relevance: { type: 'integer', enum: [0, 1, 2, 3] },
  summary: { type: 'string', description: 'One or two plain sentences: what the document says, for a family audience.' },
  date: { type: 'string', description: 'Document date YYYY-MM-DD, YYYY-MM or YYYY if stated or clear; else empty.' },
  kind: { type: 'string', enum: ['intelligence assessment', 'imagery analysis', 'press translation', 'speech', 'news clipping', 'cable or memo', 'survey or reference', 'other'] },
  places: { type: 'array', maxItems: 15, items: { type: 'object', additionalProperties: false, required: ['name', 'site_id', 'in_tripoli', 'detail'], properties: {
    name: { type: 'string' }, site_id: { type: ['string', 'null'] }, in_tripoli: { type: 'boolean', description: 'In Tripoli or its suburbs (within ~40 km).' },
    lat: { type: 'number' }, lon: { type: 'number' }, detail: { type: 'string', description: 'What the document says about this place, one sentence.' } } } },
  events: { type: 'array', maxItems: 10, items: { type: 'object', additionalProperties: false, required: ['date', 'what'], properties: {
    date: { type: 'string' }, what: { type: 'string' }, place: { type: 'string' }, site_id: { type: ['string', 'null'] }, killed: { type: ['integer', 'null'] } } } },
  people: { type: 'array', maxItems: 12, items: { type: 'object', additionalProperties: false, required: ['name', 'role'], properties: { name: { type: 'string' }, role: { type: 'string' } } } },
  facts: { type: 'array', maxItems: 8, items: { type: 'string' }, description: 'Specific facts about facilities, units, weapons, prisons, numbers.' },
  links: { type: 'array', maxItems: 8, items: { type: 'object', additionalProperties: false, required: ['a', 'b', 'why'], properties: {
    a: { type: 'string', description: 'site_id or place name' }, b: { type: 'string' }, why: { type: 'string', description: 'The evidenced connection, one sentence.' } } } },
  quote: { type: 'string', description: 'Most informative verbatim sentence, max 250 characters, or empty.' } } } };

const RX = /liby|tripoli|qadh|qadd|gadh|gadd|aziziy|azizia|abu salim|mitiga|wheelus|okba|tajou?ra|jamahir/gi;
function trim(t, max = 24000) { // keep the head + windows around key terms
  if (t.length <= max) return t;
  const head = t.slice(0, 6000), win = []; let m; RX.lastIndex = 6000;
  while ((m = RX.exec(t))) { const a = Math.max(6000, m.index - 1200), b = Math.min(t.length, m.index + 1200); if (win.length && a <= win[win.length - 1][1]) win[win.length - 1][1] = b; else win.push([a, b]); }
  let s = head; for (const [a, b] of win) { if (s.length > max) break; s += '\n[…]\n' + t.slice(a, b); } return s.slice(0, max);
}
const params = (d) => ({ model: MODEL, max_tokens: 1800,
  system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
  tools: [TOOL], tool_choice: { type: 'tool', name: 'record' },
  messages: [{ role: 'user', content: `Title: ${d.title}\nDate (catalog): ${d.date || 'unknown'}\nSource: ${({ jprs: 'JPRS translation volume (Libya-related excerpts only)', 'jprs-old': 'JPRS translation volume (Libya sections)', nis: 'CIA National Intelligence Survey', wikipedia: 'Wikipedia article (background reference, not an eyewitness source)', fbis: 'FBIS Daily Report, translated Libyan and regional radio and press', frus: 'Foreign Relations of the United States (State Department document)', gov: 'U.S. presidential library document', countrystudy: 'Library of Congress Libya country study (1987)' })[d.src] || 'CIA reading room (CREST)'}\n\n<document>\n${trim(d.text)}\n</document>` }] });

// Inputs
// If the full fetch has not saved yet, sample mode fetches its own small set from the mirror list (polite, sequential).
async function sampleDocs(n) {
  const L = JSON.parse(fs.readFileSync(`${DIR}/ia-list.json`, 'utf8')).crest;
  const pick = L.filter((x) => /NATIONAL INTELLIGENCE|LIBYA|QADH|QADD|GADH/i.test(x.title)).slice(0, 200);
  const step = Math.max(1, Math.floor(pick.length / n)); const out = [];
  for (let i = 0; i < pick.length && out.length < n; i += step) {
    const it = pick[i]; const ua = { 'user-agent': 'TripoliOpenSource-research/1.0 (historical research; contact gsea2020@mymail.pomona.edu)' };
    const meta = await (await fetch(`https://archive.org/metadata/${it.identifier}`, { headers: ua })).json().catch(() => null);
    const f = (meta?.files || []).find((x) => /_djvu\.txt$/.test(x.name)); if (!f) continue;
    const rr = await fetch(`https://archive.org/download/${it.identifier}/${encodeURIComponent(f.name)}`, { headers: ua }); if (!rr.ok) continue;
    const t = await rr.text();
    out.push({ id: it.identifier, src: 'crest', title: String(it.title || '').replace(/^CIA Reading Room [^:]+:\s*/, ''), date: String(it.date || '').slice(0, 10), text: t.replace(/\s+/g, ' ').trim().slice(0, 60000) });
    await sleep(3000);
  }
  return out;
}
const docs = fs.existsSync(DOCS)
  ? zlib.gunzipSync(fs.readFileSync(DOCS)).toString().split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((d) => d.text && d.text.length >= 80)
  : (SAMPLE ? (await sampleDocs(SAMPLE)).filter((d) => d.text.length >= 80) : (() => { throw new Error('docs.jsonl.gz not there yet'); })());
let oldJ = new Set(); try { oldJ = new Set(JSON.parse(fs.readFileSync('archive/gov/catalog.json', 'utf8')).map((g) => g.id.replace(/^jprs-/, ''))); } catch {}
const done = new Set(fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).id) : []);
const junk = (t) => /Internal Server Error|<html|<\/head>|502 Bad Gateway|503 Service/i.test(t.slice(0, 600));
let todo = docs.filter((d) => !junk(d.text) && !done.has(d.id) && !(d.src === 'jprs' && oldJ.has(d.id)));
// Sample: rank-diverse pick (NIS first, then spread across the list)
if (SAMPLE) { const step = Math.max(1, Math.floor(todo.length / SAMPLE)); todo = todo.filter((d, i) => d.src === 'nis' || i % step === 0).slice(0, SAMPLE); }
console.log('docs', docs.length, 'done', done.size, 'skipped old JPRS', docs.filter((d) => d.src === 'jprs' && oldJ.has(d.id)).length, 'todo', todo.length);

const usage = { in: 0, out: 0, cw: 0, cr: 0, n: 0, fail: 0 }; const errors = [];
const writeStatus = (extra) => fs.writeFileSync(`${DIR}/${SET === 'other' ? 'extract-other-status' : 'extract-status'}.json`, JSON.stringify({ at: new Date().toISOString(), model: MODEL, docs: docs.length, todo: todo.length, ok: usage.n, failed: usage.fail, errors: errors.slice(0, 5), ...extra }, null, 1));
process.on('uncaughtException', (e) => { errors.push('uncaught: ' + e.message); writeStatus({ crashed: true }); process.exit(1); });
function keep(id, msg, batch) {
  const u = msg.usage || {}; usage.in += u.input_tokens || 0; usage.out += u.output_tokens || 0; usage.cw += u.cache_creation_input_tokens || 0; usage.cr += u.cache_read_input_tokens || 0;
  const tu = (msg.content || []).find((c) => c.type === 'tool_use'); if (!tu) { usage.fail++; return; }
  usage.n++; fs.appendFileSync(OUT, JSON.stringify({ id, model: MODEL, ...tu.input }) + '\n');
}
function cost(batch) { const f = batch ? 0.5 : 1; return f * (usage.in * 0.10 + usage.out * 0.50 + usage.cw * 0.125 + usage.cr * 0.01) / 1e6; }

if (!BATCH) {
  let i = 0;
  async function lane() { while (i < todo.length) { const d = todo[i++];
    for (let k = 0; k < 4; k++) { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: H, body: JSON.stringify(params(d)) });
      if (r.ok) { keep(d.id, await r.json()); break; } const t = await r.text(); errors.push(`${d.id} HTTP ${r.status}: ${t.slice(0, 300)}`); console.log('err', r.status, t.slice(0, 200)); if (r.status === 400 || r.status === 401) { usage.fail++; break; } await sleep(5000 * (k + 1)); } } }
  await Promise.all([lane(), lane(), lane(), lane()]);
} else {
  for (let s = 0; s < todo.length; s += 5000) {
    const chunk = todo.slice(s, s + 5000);
    const r = await fetch('https://api.anthropic.com/v1/messages/batches', { method: 'POST', headers: H, body: JSON.stringify({ requests: chunk.map((d, j) => ({ custom_id: 'd' + (s + j), params: params(d) })) }) });
    const b = await r.json(); if (!b.id) { console.log('batch create failed', JSON.stringify(b).slice(0, 400)); process.exit(1); }
    console.log('batch', b.id); const idOf = Object.fromEntries(chunk.map((d, j) => ['d' + (s + j), d.id]));
    let st = b; while (st.processing_status !== 'ended') { await sleep(30000); st = await (await fetch(`https://api.anthropic.com/v1/messages/batches/${b.id}`, { headers: H })).json(); console.log(st.processing_status, JSON.stringify(st.request_counts)); }
    const res = await (await fetch(st.results_url, { headers: H })).text();
    for (const l of res.split('\n').filter(Boolean)) { const x = JSON.parse(l); if (x.result?.type === 'succeeded') keep(idOf[x.custom_id], x.result.message, true); else usage.fail++; }
  }
}
const rel = {}; if (fs.existsSync(OUT)) for (const l of fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean)) { const x = JSON.parse(l); rel[x.relevance] = (rel[x.relevance] || 0) + 1; }
const stat = { set: SET, errors: errors.slice(0, 5), at: new Date().toISOString(), mode: BATCH ? 'batch' : 'sample', model: MODEL, ...usage, costUSD: +cost(BATCH).toFixed(4), perDocUSD: usage.n ? +(cost(BATCH) / usage.n).toFixed(5) : null, relevanceSoFar: rel, remaining: docs.length - done.size - usage.n };
fs.writeFileSync(`${DIR}/${SET === 'other' ? 'extract-other-status' : 'extract-status'}.json`, JSON.stringify(stat, null, 1)); console.log(stat);
