// H1 Phase 3 (owner's go-ahead, 19 Nov 2026; model Claude Haiku 5.5, chosen by the owner on 18 Nov 2026): a paid, two-stage reading
// that looks for the site of each regional entry still placed only by town, and checks every proposed position a second time.
//   node scripts/read-positions.mjs --dry            build every request and print the volume and price; no API call
//   node scripts/read-positions.mjs                  run both stages (needs ANTHROPIC_API_KEY); resumable
//   node scripts/read-positions.mjs --only <id>      one entry
// Stage 1, reader: the model reads the stored text of the documents the entry rests on and reports the specific site the documents
//   name for it, with a quotation copied from the document. Its answer is then checked without the model: the quotation must be in
//   the stored text, the site's name must be in the quotation, and a position is taken only from (a) map coordinates printed in that
//   document, also in the stored text and within 25 km of the town, or (b) an English Wikipedia article whose title matches the site's
//   name word for word, 0.3 to 30 km from the town. The model never supplies a coordinate.
// Stage 2, checker: a separate call, which is not shown the reader's answer or reasoning, gets the entry, the passage around the
//   quotation taken from the stored text, and the position's source (the printed coordinates, or the Wikipedia article's title and
//   opening paragraph), and answers whether the passage puts this entry at this place and whether the source describes that place.
//   It also checks the 18 positions that scripts/locate-regional.mjs proposed without a model.
// Only a position that passes the checks of both stages is marked verified. Output: archive/review/positions-read.json (every answer,
// the checks, the cost) and the sections added to archive/review/positions-sheet.md by scripts/locate-regional.mjs on its next run.
import fs from 'node:fs'; import zlib from 'node:zlib'; import vm from 'node:vm';
import { km, clip, TOWN_RE, words, same, classOnly, wiki, saveWiki, titlesFor, R_BY, COORD, dms, article } from './lib/places.mjs';

const args = process.argv.slice(2), DRY = args.includes('--dry'), ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const KEY = process.env.ANTHROPIC_API_KEY; if (!DRY && !KEY && !process.argv.includes('--inputs')) { console.error('ANTHROPIC_API_KEY missing'); process.exit(2); }
const MODEL = process.env.EXTRACT_MODEL || 'claude-haiku-5-5';
const CEILING = 2.0; // US dollars: the run stops if its own count passes this (the estimate is about $0.20)
const OUT = 'archive/review/positions-read.json';
const H = { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// ---------- inputs (as scripts/locate-regional.mjs) ----------
const W = {}; W.window = W;
for (const f of fs.readdirSync('public/data/regions').filter((x) => x.endsWith('.js') && !x.startsWith('_'))) vm.runInNewContext(fs.readFileSync('public/data/regions/' + f, 'utf8'), W);
const byId = new Map((W.ATLAS_SITES || []).map((s) => [s.id, s]));
// candidates.json is git-ignored, so a run in GitHub Actions reads positions-inputs.json: the same fields, for the regional entries only
// (written locally with --inputs, before a run there)
const INPUTS = 'archive/review/positions-inputs.json', HAVE_CAND = fs.existsSync('archive/review/candidates.json');
const CAND = HAVE_CAND ? new Map(JSON.parse(fs.readFileSync('archive/review/candidates.json', 'utf8')).map((c) => [c.id, c]))
  : new Map(Object.entries(JSON.parse(fs.readFileSync(INPUTS, 'utf8')).entries));
if (args.includes('--inputs')) {
  const ids = JSON.parse(fs.readFileSync('archive/review/positions-proposed.json', 'utf8')).list.filter((r) => r.id.startsWith('c-')).map((r) => r.id.slice(2)), out = {};
  for (const id of ids) { const c = CAND.get(id); if (c) out[id] = { id, kind: c.kind, name: c.name, site: c.site || '', place: c.place || '', items: (c.items || []).map((x) => ({ doc: x.doc, detail: x.detail || '', passage: x.passage || '' })) }; }
  fs.writeFileSync(INPUTS, JSON.stringify({ note: 'The fields of archive/review/candidates.json (git-ignored) that scripts/read-positions.mjs needs, for the regional entries already written up in public/data/regions/*-more.js only. Written by node scripts/read-positions.mjs --inputs.', entries: out }, null, 1) + '\n');
  console.log('wrote ' + INPUTS + ': ' + Object.keys(out).length + ' entries'); process.exit(0);
}
const docs = new Map();
for (const f of ['docs', 'docs-other']) { const p = `archive/crest/${f}.jsonl.gz`; if (!fs.existsSync(p)) continue;
  for (const l of zlib.gunzipSync(fs.readFileSync(p)).toString().split('\n')) { if (!l) continue; const d = JSON.parse(l); docs.set(d.id, d); } }
const docByUrl = (u) => { const m = /cia\.gov\/readingroom\/document\/([^?#/]+)/.exec(u || ''); return m ? docs.get('cia-readingroom-document-' + m[1]) : null; };
const TOWNS = {}; for (const r of JSON.parse(fs.readFileSync('archive/model/regions.json', 'utf8')).regions) TOWNS[r.id] = r.towns || [];
const PROP = JSON.parse(fs.readFileSync('archive/review/positions-proposed.json', 'utf8'));
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { read: {}, check: {} };
const docsOf = (s) => { const c = s.id.startsWith('c-') ? CAND.get(s.id.slice(2)) : null; return (c ? (c.items || []).map((x) => docs.get(x.doc)) : (s.sources || []).map((x) => docByUrl(x.u))).filter((d) => d && d.text); };
const entryText = (s) => { const c = s.id.startsWith('c-') ? CAND.get(s.id.slice(2)) : null;
  return [s.name, s.y0 ? 'Year: ' + s.y0 + (s.y1 && s.y1 !== s.y0 ? '-' + s.y1 : '') : '', clip(s.text, 900), c && c.site ? 'Site recorded by the first reading: ' + c.site : '', c && c.place ? 'Place recorded by the first reading: ' + c.place : ''].filter(Boolean).join('\n'); };

// the document text sent: whole when short; otherwise the opening and windows around the town's name and the entry's own words
const PER_ENTRY = 200000; // characters, so each request stays under 100,000 tokens (Haiku 5.5's lower price band)
function trimDoc(text, rx, max) {
  if (text.length <= max) return text;
  const head = 3000, win = []; let m; const R = new RegExp(rx.source, 'gi'); R.lastIndex = head;
  while ((m = R.exec(text))) { const a = Math.max(head, m.index - 2500), b = Math.min(text.length, m.index + 2500); if (win.length && a <= win[win.length - 1][1]) win[win.length - 1][1] = b; else win.push([a, b]); }
  let s = text.slice(0, head); for (const [a, b] of win) { if (s.length > max) break; s += '\n[…]\n' + text.slice(a, b); } return s.slice(0, max);
}

// ---------- the two prompts ----------
const KINDS = ['airfield or air base', 'port or harbour', 'barracks or military base', 'missile or radar site', 'prison or detention centre', 'university or school', 'hospital', 'hotel', 'square, street or quarter', 'government or party building', 'oil, gas or industrial facility', 'other', 'none'];
const READ_SYS = `You help place entries on a historical map of Libya (1969-2011) correctly. Each entry is filed under a town because its sources name the town. Your task: say whether the documents it rests on name the specific site, within or near that town, where the entry's event happened or which the entry is about (an airfield, a barracks, a prison, a square, a factory and so on).

Rules:
- Use only what the documents say. Do not supply a site from your own knowledge. If the documents name only the town, or the site cannot be told from them, answer found = false.
- The site must be the entry's own subject. A site mentioned in passing, or the scene of a different event in the same document, does not count.
- The documents are OCR text of declassified U.S. government papers; spelling errors are common. Copy the quotation exactly as it appears in the text, errors included, so it can be found again by a computer. 40 to 400 characters, one continuous stretch, no ellipses.
- If the document prints map coordinates for that site, copy them exactly as printed (for example 32-07-14N 020-03-07E); otherwise leave it empty. Never work out coordinates yourself.`;
const READ_TOOL = { name: 'report', description: 'Where the entry took place, as the documents say.', input_schema: { type: 'object', additionalProperties: false,
  required: ['found', 'site', 'kind', 'doc', 'quote', 'coordinates', 'reason'], properties: {
    found: { type: 'boolean', description: 'true only if the documents name the specific site of this entry' },
    site: { type: 'string', description: 'the site\'s name as the document writes it (OCR corrected only for obvious slips); empty if none' },
    kind: { type: 'string', enum: KINDS },
    doc: { type: 'integer', description: 'number of the document the quotation is from (1, 2, ...); 0 if none' },
    quote: { type: 'string', description: 'verbatim stretch of that document naming the site and tying it to the entry; empty if none' },
    coordinates: { type: 'string', description: 'map coordinates printed in the document for this site, exactly as printed; empty if none' },
    reason: { type: 'string', description: 'one sentence: why this is, or why no site can be told' } } } };

const CHECK_SYS = `You are the second, independent check before a pin on a historical map of Libya is moved from a town centre to a specific site. Another reader proposed the site; you are not told its reasoning. Judge only from the text given. Be strict: when the passage does not clearly put this entry at this place, answer "no" or "unclear". A wrong position is worse than none.`;
const CHECK_TOOL = { name: 'verdict', description: 'Your judgement of the proposed position.', input_schema: { type: 'object', additionalProperties: false,
  required: ['passage_places_entry', 'source_is_same_place', 'reason'], properties: {
    passage_places_entry: { type: 'string', enum: ['yes', 'no', 'unclear'], description: 'Does the passage say that this entry (its event, or the place it is about) is at the proposed place?' },
    source_is_same_place: { type: 'string', enum: ['yes', 'no', 'unclear'], description: 'Does the position source describe that same place (same facility, same town), and for printed coordinates, do they belong to it and not to another site in a list?' },
    reason: { type: 'string', description: 'one or two sentences' } } } };

// ---------- the API ----------
const usage = { in: 0, out: 0, calls: 0, fail: 0 };
const cost = () => (usage.in * 0.10 + usage.out * 0.50) / 1e6;
async function call(system, tool, content, maxTokens) {
  if (cost() > CEILING) throw new Error('cost ceiling reached: $' + cost().toFixed(3));
  const body = JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, tools: [tool], tool_choice: { type: 'tool', name: tool.name }, messages: [{ role: 'user', content }] });
  for (let k = 0; k < 4; k++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: H, body });
    if (r.ok) { const m = await r.json(); usage.calls++; usage.in += m.usage?.input_tokens || 0; usage.out += m.usage?.output_tokens || 0;
      const tu = (m.content || []).find((c) => c.type === 'tool_use'); if (!tu) { usage.fail++; return null; } return tu.input; }
    const t = await r.text(); console.log('HTTP', r.status, t.slice(0, 200)); if (r.status === 400 || r.status === 401 || r.status === 403) { usage.fail++; return null; }
    await sleep(5000 * (k + 1));
  }
  usage.fail++; return null;
}

// ---------- stage 1 ----------
function readRequest(s, town) {
  const ds = docsOf(s), rx = new RegExp([...(TOWN_RE[s.region] || []).map((r) => r.source), ...words(s.name, s.region).filter((w) => /^[a-z]{4,}$/.test(w))].join('|') || town.name, 'i');
  const per = Math.floor(PER_ENTRY / Math.max(1, ds.length));
  const body = ds.map((d, i) => `<document number="${i + 1}" title="${String(d.title || d.id).replace(/"/g, "'")}" date="${d.date || 'unknown'}">\n${trimDoc(d.text, rx, per)}\n</document>`).join('\n\n');
  return { ds, content: `Entry (filed under ${town.name}, ${s.region}):\n${entryText(s)}\n\nThe documents it rests on:\n\n${body}` };
}
function coordsIn(text) { return [...String(text || '').matchAll(COORD)].map((m) => ({ raw: m[0], lat: dms(m[1], m[2], m[3]), lon: dms(m[4], m[5], m[6]) })); }

async function resolve(s, town, ans, ds) {
  // checks of the reader's answer that need no model
  const chk = { quoteInDoc: false, siteInQuote: false, position: null, why: '' };
  if (!ans || !ans.found) { chk.why = 'no site named'; return chk; }
  const d = ds[ans.doc - 1]; if (!d) { chk.why = 'document number out of range'; return chk; }
  const nt = norm(d.text), nq = norm(ans.quote);
  chk.quoteInDoc = nq.length >= 25 && nt.includes(nq);
  const sw = words(ans.site, s.region), qw = words(ans.quote, s.region);
  chk.siteInQuote = !!sw.length && sw.every((w) => qw.includes(w)) || nq.includes(norm(ans.site));
  if (!chk.quoteInDoc) { chk.why = 'quotation not found in the stored text'; return chk; }
  if (!chk.siteInQuote) { chk.why = 'site name not in the quotation'; return chk; }
  if (!sw.length || (classOnly(sw) && !(TOWN_RE[s.region] || []).some((re) => new RegExp(re.source, 'i').test(ans.site + ' ' + ans.quote)))) { chk.why = 'only a kind of place, not a named site'; return chk; }
  const at = nt.indexOf(nq);
  // (a) coordinates printed in that document, in the stored text and near the town
  if (ans.coordinates) {
    const c = coordsIn(ans.coordinates)[0], inDoc = coordsIn(d.text);
    const m = c && inDoc.find((x) => Math.abs(x.lat - c.lat) < 1e-6 && Math.abs(x.lon - c.lon) < 1e-6);
    if (m) { const dist = km(town.lat, town.lon, m.lat, m.lon);
      if (dist <= 25) { chk.position = { method: 'read-coord', named: ans.site, lat: +m.lat.toFixed(5), lon: +m.lon.toFixed(5), r: 1, fromTown: +dist.toFixed(1), raw: m.raw, coordsInDoc: new Set(inDoc.map((x) => x.raw)).size, src: { t: clip(d.title || d.id, 120) + ' (coordinates printed in the document)', u: d.cia || d.ia || d.url || '' }, docHash: d.hash || null }; }
      else chk.why = 'printed coordinates are ' + dist.toFixed(0) + ' km from the town'; }
    else chk.why = 'coordinates not found in the stored text';
  }
  // (b) a Wikipedia article whose title matches the site's name word for word
  if (!chk.position) for (const title of titlesFor(ans.site, s.region, town)) {
    const a = await article(title, DRY, true); if (!a || a.lat == null || a.disamb) continue;
    const dist = km(a.lat, a.lon, town.lat, town.lon); if (dist > 30 || dist < 0.3 || !same(words(a.title, s.region), sw)) continue;
    chk.position = { method: 'read-wikipedia', named: ans.site, title: a.title, lat: a.lat, lon: a.lon, r: R_BY(sw, ans.site), fromTown: +dist.toFixed(1), src: { t: 'Wikipedia: ' + a.title, u: a.url }, lead: a.lead || '' }; break;
  }
  if (!chk.position && !chk.why) chk.why = 'site named, but no printed coordinates and no Wikipedia article of that name near the town';
  chk.passage = clip(d.text.slice(Math.max(0, mapIndex(d.text, at) - 1500), mapIndex(d.text, at) + nq.length * 1.3 + 1500), 3600);
  chk.docId = d.id;
  return chk;
}
// position in the original text of the n-th character of its normalized form
function mapIndex(text, n) { let k = 0; for (let i = 0; i < text.length; i++) { if (/[a-z0-9]/i.test(text[i])) { if (k === n) return i; k++; } } return text.length; }

// ---------- stage 2 ----------
function checkContent(s, town, pos, passage) {
  const src = pos.method.endsWith('coord') || pos.method === 'doc-coord'
    ? `Position source: map coordinates printed in the document, ${pos.raw}. The document prints ${pos.coordsInDoc || 1} different set(s) of coordinates in all.`
    : `Position source: the English Wikipedia article "${pos.title || pos.src.t.replace(/^Wikipedia: /, '')}". Its opening paragraph: "${pos.lead || '(not available)'}"`;
  return `Entry (filed under ${town.name}, ${s.region}):\n${entryText(s)}\n\nProposed place: ${pos.named || pos.title || pos.src.t}\n${src}\n\nPassage from the document the entry rests on (stored OCR text):\n<passage>\n${passage}\n</passage>`;
}
const passes = (v) => v && v.passage_places_entry === 'yes' && v.source_is_same_place === 'yes';

// ---------- run ----------
const townOf = (s) => (TOWNS[s.region] || []).find((t) => km(t.lat, t.lon, s.lat, s.lon) < 0.3) || null;
const todo = PROP.list.filter((r) => r.status !== 'proposed' && (!ONLY || r.id === ONLY));
const proposed = PROP.list.filter((r) => r.status === 'proposed' && (!ONLY || r.id === ONLY));
const read = prev.read || {}, check = prev.check || {};
let chars = 0, reqs = 0;
const save = () => { saveWiki(); fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), model: MODEL, note: 'Stage 1 (reader) and stage 2 (independent checker) of the paid position reading, H1 Phase 3. A position is verified only when the checks without a model and the checker both pass. Approval is recorded separately in archive/model/positions.json.', usage: { ...usage, costUSD: +cost().toFixed(4), priceBasis: 'USD 0.10 per million input tokens, 0.50 per million output (Haiku 5.5 list price, prompts under 100K tokens)' }, read: Object.fromEntries(Object.entries(read).sort()), check: Object.fromEntries(Object.entries(check).sort()) }, null, 1) + '\n'); };

const queue = [];
for (const r of todo) { const s = byId.get(r.id), town = s && townOf(s); if (!town) continue; queue.push({ s, town }); }
if (DRY) {
  for (const { s, town } of queue) { const q = readRequest(s, town); chars += q.content.length + READ_SYS.length; reqs++; }
  const tin = chars / 4, est = (tin * 0.10 + reqs * 400 * 0.50) / 1e6;
  console.log(`dry run: ${reqs} reader requests, ${chars.toLocaleString()} characters (about ${Math.round(tin).toLocaleString()} input tokens); ${proposed.length} earlier proposals for the checker`);
  console.log(`estimated cost: reader about $${est.toFixed(3)}, checker about $${(((reqs * 0.3 + proposed.length) * 2500 * 0.10 + (reqs * 0.3 + proposed.length) * 250 * 0.50) / 1e6).toFixed(3)} (rough; the run prints its own count)`);
  if (queue[0]) fs.writeFileSync('archive/review/positions-read-example.txt', READ_SYS + '\n\n---\n\n' + readRequest(queue[0].s, queue[0].town).content.slice(0, 6000) + '\n…');
  process.exit(0);
}

async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const it = items[i++]; await fn(it); } })); }
await pool(queue, 4, async ({ s, town }) => {
  if (read[s.id] && read[s.id].answer) return;
  const q = readRequest(s, town); if (!q.ds.length) { read[s.id] = { answer: null, checks: { why: 'no stored document' } }; return; }
  const ans = await call(READ_SYS, READ_TOOL, q.content, 1500);
  const chk = await resolve(s, town, ans, q.ds);
  read[s.id] = { at: new Date().toISOString().slice(0, 10), town: town.name, answer: ans, checks: chk };
  console.log(s.id, ans ? (ans.found ? 'site: ' + ans.site : 'no site') : 'failed', chk.position ? '-> ' + chk.position.method : chk.why ? '(' + chk.why + ')' : '', '$' + cost().toFixed(3));
  if (Object.keys(read).length % 10 === 0) save();
});
save();

// stage 2: the reader's resolved positions, and the earlier proposals of scripts/locate-regional.mjs
const toCheck = [];
for (const [id, r] of Object.entries(read)) if (r.checks && r.checks.position) toCheck.push({ id, pos: r.checks.position, passage: r.checks.passage, from: 'reader' });
for (const r of proposed) {
  const s = byId.get(r.id), town = s && townOf(s); if (!town) continue; const o = r.proposal, ds = docsOf(s);
  let passage = '';
  if (o.method === 'doc-coord') { const d = ds.find((x) => x.text.includes(o.raw)) || ds.find((x) => norm(x.text).includes(norm(o.raw))); if (d) { const at = d.text.indexOf(o.raw); passage = clip(d.text.slice(Math.max(0, at - 2200), at + 800), 3600); } }
  else { const c = r.id.startsWith('c-') ? CAND.get(r.id.slice(2)) : null; passage = clip(c ? (c.items || []).map((x) => x.passage || x.detail).join('\n…\n') : s.text, 3600);
    const t = (o.title || o.src.t.replace(/^Wikipedia: /, '')); const a = await article(t, false, true); o.lead = a && a.lead || ''; o.title = t; }
  toCheck.push({ id: r.id, pos: o, passage, from: 'locator' });
}
await pool(toCheck, 4, async (t) => {
  if (check[t.id] && check[t.id].verdict && check[t.id].lat === t.pos.lat) return;
  const s = byId.get(t.id), town = townOf(s);
  if (!t.passage) { check[t.id] = { from: t.from, lat: t.pos.lat, lon: t.pos.lon, verdict: null, verified: false, why: 'no passage found to check' }; return; }
  const v = await call(CHECK_SYS, CHECK_TOOL, checkContent(s, town, t.pos, t.passage), 600);
  check[t.id] = { at: new Date().toISOString().slice(0, 10), from: t.from, method: t.pos.method, named: t.pos.named || t.pos.title || '', lat: t.pos.lat, lon: t.pos.lon, verdict: v, verified: passes(v) };
  console.log('check', t.id, t.from, v ? v.passage_places_entry + '/' + v.source_is_same_place : 'failed', '$' + cost().toFixed(3));
});
save();
const ver = Object.values(check).filter((c) => c.verified);
console.log(`\nreader: ${Object.keys(read).length} entries read, ${Object.values(read).filter((r) => r.answer && r.answer.found).length} name a site, ${Object.values(read).filter((r) => r.checks && r.checks.position).length} with a position that passed the checks without a model`);
console.log(`checker: ${Object.keys(check).length} positions checked, ${ver.length} verified (${ver.filter((c) => c.from === 'reader').length} from the reader, ${ver.filter((c) => c.from === 'locator').length} of the locator's proposals)`);
console.log(`cost by the script's count: $${cost().toFixed(4)} (${usage.calls} calls, ${usage.in} input and ${usage.out} output tokens, ${usage.fail} failed)`);
