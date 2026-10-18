// Claude Sonnet explains every connection: the 165 place-to-place links on the Tripoli map and the 268 links in "The Unknown".
//   node scripts/explain-connections.mjs --sample 8     # quick regular-API test
//   node scripts/explain-connections.mjs --batch        # everything not yet explained (Message Batches API, 50% off)
// Resumable: items whose evidence hash is unchanged are skipped. Needs ANTHROPIC_API_KEY.
// Output: archive/research/connection-notes.json  and  public/data/connection-notes.js (window.ATLAS_CONN_NOTES)
import fs from 'node:fs'; import zlib from 'node:zlib'; import vm from 'node:vm'; import crypto from 'node:crypto';
const KEY = process.env.ANTHROPIC_API_KEY; if (!KEY) { console.error('ANTHROPIC_API_KEY missing'); process.exit(2); }
const MODEL = process.env.EXPLAIN_MODEL || 'claude-sonnet-5-5';
const args = process.argv.slice(2), SAMPLE = args.includes('--sample') ? +args[args.indexOf('--sample') + 1] || 8 : 0, BATCH = args.includes('--batch');
const OUT = 'archive/research/connection-notes.json', JS = 'public/data/connection-notes.js', STATUS = 'archive/research/connection-notes-status.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
const load = (f) => { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(f, 'utf8'), c); return c.window; };
const W = { ...load('public/data/sites.js'), ...load('public/data/areas.js'), ...load('public/data/links.js'), ...load('public/data/unknown.js') };
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// ---- corpus (for text windows) and Haiku summaries
const docs = {};
for (const f of ['docs', 'docs-other']) { const p = `archive/crest/${f}.jsonl.gz`; if (!fs.existsSync(p)) continue;
  for (const l of zlib.gunzipSync(fs.readFileSync(p)).toString().split('\n').filter(Boolean)) { const d = JSON.parse(l); docs[d.id] = { id: d.id, title: norm(d.title), date: d.date || '', src: d.src, text: norm(d.text) }; } }
const ext = {}; for (const f of ['extract', 'extract-other']) { const p = `archive/crest/${f}.jsonl`; if (!fs.existsSync(p)) continue;
  for (const l of fs.readFileSync(p, 'utf8').split('\n').filter(Boolean)) { const x = JSON.parse(l); ext[x.id] = x; } }

const names = (n, aka) => [...new Set([n, ...(aka || [])].map((s) => norm(String(s).replace(/\(.*?\)/g, ''))).filter((s) => s.length >= 4))].slice(0, 8);
function windows(text, terms, half = 600, max = 3) {
  const low = text.toLowerCase(), hits = [];
  for (const t of terms) { const k = t.toLowerCase(); let i = low.indexOf(k); let n = 0; while (i >= 0 && n++ < 6) { hits.push([i, k]); i = low.indexOf(k, i + k.length); } }
  hits.sort((a, b) => a[0] - b[0]); const win = [];
  for (const [i] of hits) { const a = Math.max(0, i - half), b = Math.min(text.length, i + half); if (win.length && a <= win[win.length - 1][1]) win[win.length - 1][1] = b; else win.push([a, b]); }
  return win.slice(0, max).map(([a, b]) => (a ? '…' : '') + text.slice(a, b) + (b < text.length ? '…' : ''));
}
// windows where both ends occur close together are the best evidence
function bothWindows(text, A, B, max = 3) {
  const low = text.toLowerCase(), out = [];
  for (const a of A) { const k = a.toLowerCase(); let i = low.indexOf(k), n = 0;
    while (i >= 0 && n++ < 8) { const seg = low.slice(Math.max(0, i - 900), i + 900); if (B.some((b) => seg.includes(b.toLowerCase()))) { const s = Math.max(0, i - 700), e = Math.min(text.length, i + 700); if (!out.length || s > out[out.length - 1][1]) out.push([s, e]); }
      i = low.indexOf(k, i + k.length); } }
  return out.slice(0, max).map(([s, e]) => (s ? '…' : '') + text.slice(s, e) + (e < text.length ? '…' : ''));
}

// ---- build the work list
const items = [];
const ents = {}; for (const s of W.ATLAS_SITES || []) ents[s.id] = { name: s.name, aka: s.aliases, profile: [s.relevance, s.text].filter(Boolean).join(' ') };
for (const a of W.ATLAS_AREAS || []) ents[a.id] = { name: a.name, aka: a.aliases, profile: [a.history, a.era, a.uncertain && 'Unclear: ' + a.uncertain].filter(Boolean).join(' ') };
for (const c of W.ATLAS_CONNECTIONS || []) {
  const A = ents[c.a], B = ents[c.b]; if (!A || !B) continue;
  const key = `m:${c.a}|${c.b}|${c.kind}`, ta = names(A.name, A.aka), tb = names(B.name, B.aka), ev = [];
  for (const d of Object.values(docs)) { if (ev.length >= 4) break; const w = bothWindows(d.text, ta, tb, 1); if (w.length) ev.push({ doc: d, w }); }
  items.push({ key, scope: 'map', c, A, B, ev: ev.map((e) => ({ id: e.doc.id, title: e.doc.title, date: e.doc.date, passages: e.w, summary: ext[e.doc.id]?.summary })) });
}
const N = (W.ATLAS_UNKNOWN || { nodes: [], edges: [] });
for (const e of N.edges) {
  const A = N.nodes[e.s], B = N.nodes[e.t], key = `u:${A.id}|${B.id}`, ta = names(A.name, A.aka), tb = names(B.name, B.aka), ev = [];
  for (const dr of e.docs.slice(0, 5)) { const d = docs[dr.id]; if (!d) { ev.push({ id: dr.id, title: dr.t, date: dr.d, passages: [], summary: ext[dr.id]?.summary }); continue; }
    let w = bothWindows(d.text, ta, tb, 2); if (!w.length) w = windows(d.text, [...ta, ...tb], 500, 2);
    ev.push({ id: d.id, title: d.title, date: d.date, passages: w, summary: ext[d.id]?.summary, quote: ext[d.id]?.quote }); }
  items.push({ key, scope: 'unknown', e, A: { name: A.name, aka: A.aka, kind: A.kind, roles: A.roles, years: [A.y0, A.y1], profile: '' }, B: { name: B.name, aka: B.aka, kind: B.kind, roles: B.roles, years: [B.y0, B.y1], profile: '' }, ev });
}
const render = (it) => {
  const L = [];
  const side = (t, x) => L.push(`${t}: ${x.name}${x.aka?.length ? ' (also: ' + x.aka.slice(0, 5).join('; ') + ')' : ''}${x.kind ? ' [' + x.kind + ']' : ''}${x.roles?.length ? '\n  roles in the files: ' + x.roles.slice(0, 3).join(' | ') : ''}${x.profile ? '\n  atlas profile: ' + x.profile.slice(0, 1400) : ''}`);
  side('END A', it.A); side('END B', it.B);
  if (it.scope === 'map') { const c = it.c; L.push(`\nCONNECTION AS RECORDED: type "${c.kind}", ${c.year ? 'year ' + c.year + ', ' : ''}confidence "${c.confidence}".\nStated reason: ${c.why}\nCited sources: ${(c.sources || []).map((s) => s.t + ' <' + s.u + '>').join('; ') || 'none'}`); }
  else L.push(`\nLINK AS READ BY AI FROM DOCUMENTS (${it.e.n} document${it.e.n === 1 ? '' : 's'}). The reasons given per document:\n${it.e.why.map((w) => '- ' + w).join('\n')}`);
  it.ev.forEach((e, i) => L.push(`\n[DOC ${i + 1}] ${e.title} (${e.date || 'undated'}) id=${e.id}${e.summary ? '\n  summary: ' + e.summary : ''}${(e.passages || []).map((p) => '\n  passage: ' + p).join('')}`));
  if (!it.ev.length) L.push('\n(No source passage could be retrieved for this link; rely only on the stated reason and say so.)');
  return L.join('\n');
};
for (const it of items) { it.input = render(it); it.hash = crypto.createHash('sha1').update(MODEL + it.input).digest('hex').slice(0, 12); }

// ---- prompt
const SYSTEM = `You write the "why are these connected?" note for one link on "Tripoli: Open Source", a family-built historical map of Tripoli, Libya under Gaddafi (1969-2011). Readers are older relatives, some of whom lived through these years. Be clear, respectful and plain; no jargon, no drama.

You get the two ends, how the link was recorded, and source passages (OCR'd U.S. government documents, translations, reports). Rules:
- Use only what the evidence says. Background you know well may be added in "context", but never as evidence of the link. Never invent dates, numbers, names or quotes.
- Say exactly what the sources establish and what they do not. Names in OCR text can be garbled; do not overread them.
- "strength": direct = a source states the link; reported = a source reports it second-hand or from testimony; inferred = it follows from the facts but nobody states it; weak = only co-mentioned or thin; doubtful = the evidence does not support it or the two ends look like the same thing or unrelated.
- If both ends are really the same person or place under two spellings, set flag "same-entity". If the evidence does not support the link, set flag "unsupported". Otherwise "ok".
- quotes must be copied word for word from the passages given (max 30 words each), with the DOC number. Include none if nothing quotable.
- Write for the reader first: headline then explanation, then details.
- Always answer by calling the note tool, once.`;
const TOOL = { name: 'note', description: 'The note for one connection.', input_schema: { type: 'object', additionalProperties: false, required: ['headline', 'explanation', 'strength', 'flag', 'established', 'not_established', 'context', 'timeline', 'quotes', 'open_question'], properties: {
  headline: { type: 'string', description: 'One plain sentence, max 22 words, naming the link.' },
  explanation: { type: 'string', description: '3-5 plain sentences: what links the two and why it matters to understanding Tripoli under Gaddafi.' },
  strength: { type: 'string', enum: ['direct', 'reported', 'inferred', 'weak', 'doubtful'] },
  flag: { type: 'string', enum: ['ok', 'same-entity', 'unsupported'] },
  established: { type: 'array', maxItems: 4, items: { type: 'string' }, description: 'Specific things the sources do show.' },
  not_established: { type: 'array', maxItems: 3, items: { type: 'string' }, description: 'What the sources do not show or where they conflict.' },
  context: { type: 'string', description: 'Optional: 1-2 sentences of widely known background that helps, clearly separate from the evidence. Empty if none.' },
  timeline: { type: 'array', maxItems: 5, items: { type: 'object', additionalProperties: false, required: ['when', 'what'], properties: { when: { type: 'string' }, what: { type: 'string' } } } },
  quotes: { type: 'array', maxItems: 2, items: { type: 'object', additionalProperties: false, required: ['text', 'doc'], properties: { text: { type: 'string' }, doc: { type: 'integer' } } } },
  open_question: { type: 'string', description: 'What record or witness would settle what is uncertain. Empty if nothing is uncertain.' } } } };
const params = (it) => ({ model: MODEL, max_tokens: 1500, system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }], tools: [TOOL], messages: [{ role: 'user', content: it.input + '\n\nRespond only by calling the note tool.' }] });

// ---- run
const notes = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
let todo = items.filter((it) => notes[it.key]?.h !== it.hash);
if (SAMPLE) { const step = Math.max(1, Math.floor(todo.length / SAMPLE)); todo = todo.filter((_, i) => i % step === 0).slice(0, SAMPLE); }
console.log('items', items.length, 'todo', todo.length);
const usage = { in: 0, out: 0, cw: 0, cr: 0, ok: 0, fail: 0 }, errors = [];
function verifyQuotes(it, q) { // keep only quotes that really occur in the evidence we sent
  const hay = norm(it.ev.map((e) => (e.passages || []).join(' ') + ' ' + (e.quote || '') + ' ' + (e.summary || '')).join(' ')).toLowerCase();
  return (q || []).filter((x) => x.text && hay.includes(norm(x.text).replace(/^…|…$/g, '').toLowerCase())).slice(0, 2).map((x) => ({ text: norm(x.text), doc: it.ev[x.doc - 1] ? { id: it.ev[x.doc - 1].id, t: it.ev[x.doc - 1].title } : null }));
}
function keep(it, msg) {
  const u = msg.usage || {}; usage.in += u.input_tokens || 0; usage.out += u.output_tokens || 0; usage.cw += u.cache_creation_input_tokens || 0; usage.cr += u.cache_read_input_tokens || 0;
  const tu = (msg.content || []).find((c) => c.type === 'tool_use'); if (!tu) { usage.fail++; return; }
  const n = tu.input; usage.ok++; notes[it.key] = { h: it.hash, model: MODEL, ...n, quotes: verifyQuotes(it, n.quotes), docs: it.ev.length };
}
const save = () => {
  fs.mkdirSync('archive/research', { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(notes, null, 1));
  const pub = {}; for (const [k, v] of Object.entries(notes)) { const { h, model, docs: _d, ...rest } = v; pub[k] = rest; }
  fs.writeFileSync(JS, '/* Sonnet-written notes explaining each connection. Generated by scripts/explain-connections.mjs. */\nwindow.ATLAS_CONN_NOTES = ' + JSON.stringify(pub) + ';\n');
  fs.writeFileSync(STATUS, JSON.stringify({ at: new Date().toISOString(), model: MODEL, items: items.length, notes: Object.keys(notes).length, ...usage, errors: errors.slice(0, 5) }, null, 1));
};
process.on('uncaughtException', (e) => { errors.push('uncaught: ' + e.message); save(); process.exit(1); });

if (!BATCH) {
  let i = 0; async function lane() { while (i < todo.length) { const it = todo[i++];
    for (let k = 0; k < 4; k++) { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: H, body: JSON.stringify(params(it)) });
      if (r.ok) { keep(it, await r.json()); break; } const t = await r.text(); errors.push(`${it.key} HTTP ${r.status}: ${t.slice(0, 300)}`); if (r.status === 400 || r.status === 401 || r.status === 404) { usage.fail++; break; } await sleep(5000 * (k + 1)); } } }
  await Promise.all([lane(), lane(), lane()]);
} else if (todo.length) {
  const r = await fetch('https://api.anthropic.com/v1/messages/batches', { method: 'POST', headers: H, body: JSON.stringify({ requests: todo.map((it, j) => ({ custom_id: 'c' + j, params: params(it) })) }) });
  const b = await r.json(); if (!b.id) { errors.push('batch create failed ' + JSON.stringify(b).slice(0, 400)); save(); process.exit(1); }
  console.log('batch', b.id); let st = b;
  while (st.processing_status !== 'ended') { await sleep(30000); st = await (await fetch(`https://api.anthropic.com/v1/messages/batches/${b.id}`, { headers: H })).json(); console.log(st.processing_status, JSON.stringify(st.request_counts)); }
  const res = await (await fetch(st.results_url, { headers: H })).text();
  for (const l of res.split('\n').filter(Boolean)) { const x = JSON.parse(l); if (x.result?.type === 'succeeded') keep(todo[+x.custom_id.slice(1)], x.result.message); else { usage.fail++; errors.push(JSON.stringify(x.result).slice(0, 200)); } }
}
save(); console.log(JSON.parse(fs.readFileSync(STATUS, 'utf8')));
