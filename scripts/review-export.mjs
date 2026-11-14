// Turns the owner's approvals in the review queue into drafts. Nothing here publishes a place or an event:
// it writes drafts for a person to check. Approved speeches are the exception by design: a speech is a record of
// what a source itself describes (who spoke, where, when), so an approved speech goes to the map as it stands.
//   node scripts/review-export.mjs approvals.json
// approvals.json is what the review page's owner export returns: [{ verdict, note, at, cand }]
//   (owner API: { owner: true, review: { export: true } }).
// Writes archive/review/drafts.json and drafts.md   places and events, each with its sources and what is still missing
//        public/data/speeches.js                     approved speeches (date, speaker, venue as stated, sources)
//        public/data/docs/speech-<id>.txt            the stored transcript of each approved speech
import fs from 'node:fs'; import zlib from 'node:zlib';

const file = process.argv[2]; if (!file) { console.log('usage: node scripts/review-export.mjs approvals.json'); process.exit(2); }
const raw = JSON.parse(fs.readFileSync(file, 'utf8')), approvals = (raw.approved || raw).filter((a) => a && a.cand && (a.verdict === 'approve' || a.verdict === 'unplaced'));
const speeches = fs.existsSync('archive/review/speeches.json') ? new Map(JSON.parse(fs.readFileSync('archive/review/speeches.json', 'utf8')).map((s) => [s.id, s])) : new Map();
const day = (t) => t ? new Date(t).toISOString().slice(0, 10) : null;
const src = (it) => ({ t: it.title + (it.date ? ' (' + it.date + ')' : ''), u: it.url || it.mirror || null });

/* ---------- places and events: drafts only ---------- */
const drafts = approvals.filter((a) => a.cand.kind !== 'speech').map((a) => {
  const c = a.cand, withText = c.items.filter((i) => i.found === 'exact' || (c.kind === 'event' && i.found === 'word'));
  const missing = [];
  if (!withText.length) missing.push('No document was found to contain the name: read a source and quote it before publishing.');
  if (a.verdict === 'approve') missing.push('Position: none yet. Use coordinates only if a source gives them or names a mapped building; otherwise publish with no location.');
  if (c.kind === 'place') missing.push('Years in use: take them from the sources.');
  missing.push('Wording: the text below is the reading model\'s summary. Rewrite it from the quoted passages, as a claim where it is one.');
  return { id: c.id, kind: c.kind, region: c.region, approvedAs: a.verdict === 'approve' ? 'to be placed' : 'no location', approved: day(a.at), ownerNote: a.note || '',
    draft: c.kind === 'place'
      ? { name: c.name, also: c.also || [], lat: null, lon: null, r: null, y0: null, y1: null, level: c.docs > 1 && withText.length > 1 ? 'documented' : 'testimony', text: (c.items[0] || {}).detail || '', sources: c.items.map(src) }
      : { name: c.name, when: c.date, place: c.place || '', killed: c.killed ?? null, text: (c.items[0] || {}).detail || c.name, src: c.items.map(src) },
    evidence: c.items.map((i) => ({ source: src(i), found: i.found, passage: i.passage })), missing };
});
fs.mkdirSync('archive/review', { recursive: true });
fs.writeFileSync('archive/review/drafts.json', JSON.stringify(drafts, null, 1));
fs.writeFileSync('archive/review/drafts.md', ['# Drafts from the review queue', '', `${drafts.length} approved items. None is on the map. Each needs the points under "Still needed" settled first.`, '']
  .concat(drafts.flatMap((d) => [`## ${d.draft.name}`, '', `- Kind: ${d.kind}; region: ${d.region}; approved ${d.approved || ''} as "${d.approvedAs}"${d.ownerNote ? '; note: ' + d.ownerNote : ''}`,
    ...(d.kind === 'event' ? [`- Date: ${d.draft.when}${d.draft.place ? '; place: ' + d.draft.place : ''}`] : []), `- Summary by the reading model: ${d.draft.text}`, '', 'Evidence:', '',
    ...d.evidence.map((e) => `- ${e.source.u ? `[${e.source.t}](${e.source.u})` : e.source.t} — ${e.found === 'exact' ? 'name found in the text' : e.found === 'word' ? 'part of the name found' : 'NAME NOT FOUND in the stored text'}${e.passage ? `\n  > ${e.passage.replace(/\n/g, ' ')}` : ''}`), '', 'Still needed:', '', ...d.missing.map((m) => '- ' + m), ''])).join('\n'));

/* ---------- speeches: approved ones go to the map with their transcript ---------- */
const texts = new Map(); // stored text by reference, loaded only for what is needed
function stored(ref) {
  if (texts.has(ref)) return texts.get(ref);
  let t = null;
  if (fs.existsSync(ref)) t = fs.readFileSync(ref, 'utf8');
  else for (const f of ['archive/crest/docs.jsonl.gz', 'archive/crest/docs-other.jsonl.gz']) { if (t != null || !fs.existsSync(f)) continue;
    for (const l of zlib.gunzipSync(fs.readFileSync(f)).toString().split('\n')) { if (!l || !l.includes(ref)) continue; const d = JSON.parse(l); if (d.id === ref) { t = d.text; break; } } }
  texts.set(ref, t); return t;
}
const outSpeeches = []; let files = 0;
for (const a of approvals.filter((x) => x.cand.kind === 'speech')) {
  const c = a.cand, s = [...speeches.values()].find((x) => c.items.some((i) => x.description === i.detail && x.sources.some((y) => y.ref === i.doc)));
  if (!s) { console.log('speech not found in archive/review/speeches.json, skipped:', c.name); continue; }
  const best = s.sources.slice().sort((x, y) => y.chars - x.chars)[0], full = s.transcript ? stored(best.ref) : null;
  const text = full ? full.slice(best.start, best.start + best.chars).trim() : '';
  const doc = text ? 'speech-' + s.id : null;
  if (doc) { fs.mkdirSync('public/data/docs', { recursive: true });
    fs.writeFileSync(`public/data/docs/${doc}.txt`, [s.description, (s.dateIs === 'broadcast' ? 'Broadcast ' : '') + (s.date || 'undated'), best.title, best.url || '', best.rights + '. OCR text: errors are likely.', '', text].join('\n')); files++; }
  outSpeeches.push({ id: s.id, date: s.date, dateIs: s.dateIs, speaker: s.speaker, kind: s.kind, venue: s.venue || null, occasion: s.occasion || null, pin: s.pin ? s.pin.id : null,
    description: s.description, opening: best.opening, doc, chars: text.length, src: s.sources.map((x) => ({ t: x.title, u: x.url || null })), approved: day(a.at) });
}
outSpeeches.sort((x, y) => (x.date || '9') < (y.date || '9') ? -1 : 1);
fs.writeFileSync('public/data/speeches.js', '/* Generated by scripts/review-export.mjs from the speeches the owner approved. Do not hand-edit. */' + String.fromCharCode(10) + 'window.ATLAS_SPEECHES = ' + JSON.stringify(outSpeeches) + ';' + String.fromCharCode(10));
console.log(`approvals read: ${approvals.length}; drafts written: ${drafts.length} (${drafts.filter((d) => d.kind === 'place').length} places, ${drafts.filter((d) => d.kind === 'event').length} events); speeches for the map: ${outSpeeches.length} (${outSpeeches.filter((s) => s.pin).length} at a mapped venue, ${files} transcripts written)`);
