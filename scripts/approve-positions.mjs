// Records a person's approval of a proposed position (archive/review/positions-sheet.md) in archive/model/positions.json.
//   node scripts/approve-positions.mjs --by <initials> <id> [<id>:<option> ...]     approve; <option> picks one of several (1, 2, ...)
//   node scripts/approve-positions.mjs --list                                        show what is approved
//   node scripts/approve-positions.mjs --by <initials> --verified-only <id> ...       approve only what passed both stages of read-positions.mjs
//   node scripts/approve-positions.mjs --revoke <id>                                 take an approval back
// The approval is the person's: run it only on their word, with their initials. Only an option the locator listed can be
// approved, so no position is typed in by hand. Then:
//   generated entries (c-...):  node scripts/write-regional.mjs   (it reads positions.json)
//   hand-written entries:        this script edits public/data/regions/<region>.js for that entry (lat, lon, r, pos, posSrc)
import fs from 'node:fs';
const FILE = 'archive/model/positions.json', PROP = 'archive/review/positions-proposed.json';
const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const store = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { note: 'Positions of regional entries approved by a person. Written by scripts/approve-positions.mjs; applied by scripts/write-regional.mjs (generated entries) and by approve-positions.mjs itself (hand-written entries). Each records the source of the position and who approved it, when.', approved: {} };
const save = () => fs.writeFileSync(FILE, JSON.stringify({ ...store, approved: Object.fromEntries(Object.entries(store.approved).sort()) }, null, 1) + '\n');

if (args.includes('--list')) { for (const [id, a] of Object.entries(store.approved)) console.log(id.padEnd(22), a.lat, a.lon, 'r=' + a.r, a.method, a.by, a.date, '|', a.posSrc.t); console.log(Object.keys(store.approved).length + ' approved'); process.exit(0); }
const rv = flag('--revoke'); if (rv) { if (!store.approved[rv]) { console.log('not approved: ' + rv); process.exit(1); } delete store.approved[rv]; save(); console.log('revoked ' + rv + '; rerun node scripts/write-regional.mjs (a hand-written entry must be put back by hand)'); process.exit(0); }

const by = flag('--by');
if (!by || !/^[A-Za-z .'-]{2,40}$/.test(by)) { console.log('Give the approver: --by <initials>'); process.exit(1); }
if (!fs.existsSync(PROP)) { console.log('Run node scripts/locate-regional.mjs first'); process.exit(1); }
const P = new Map(JSON.parse(fs.readFileSync(PROP, 'utf8')).list.map((r) => [r.id, r]));
// positions from the paid two-stage reading (scripts/read-positions.mjs) can be approved only when both stages passed
const READ = 'archive/review/positions-read.json', RD = fs.existsSync(READ) ? JSON.parse(fs.readFileSync(READ, 'utf8')) : { read: {}, check: {} };
for (const [id, c] of Object.entries(RD.check || {})) {
  const r = P.get(id); if (!r) continue;
  if (c.from === 'reader') { const pos = RD.read[id] && RD.read[id].checks && RD.read[id].checks.position; if (!pos) continue;
    const o = { ...pos, verified: !!c.verified, verdict: c.verdict }; delete o.lead; r.options = [...r.options.filter((x) => !String(x.method).startsWith('read-')), o];
    if (c.verified) r.proposal = o; else if (r.proposal && String(r.proposal.method).startsWith('read-')) r.proposal = null; }
  else if (r.proposal && r.proposal.lat === c.lat && r.proposal.lon === c.lon) { r.proposal.verified = !!c.verified; r.proposal.verdict = c.verdict; }
}
// positions found by reading the documents in the session and checked against the stored texts by scripts/review-positions.mjs
// (owner's instruction of 20 Nov 2026); only a record that passed is offered, and it becomes the entry's proposal
const REV = 'archive/review/positions-reviewed.json', RV = fs.existsSync(REV) ? JSON.parse(fs.readFileSync(REV, 'utf8')) : { records: {} };
for (const [id, rec] of Object.entries(RV.records || {})) {
  const k = rec.checked; if (!k || !k.ok) continue;
  const r = P.get(id) || (P.set(id, { id, region: k.region, town: k.town, name: k.name, options: [] }), P.get(id));
  const o = { method: k.method, lat: k.lat, lon: k.lon, r: k.r, src: k.src, ...(k.printed ? { raw: k.printed } : {}), ...(k.named ? { named: k.named } : {}), reviewed: { by: RV.by, site: rec.site, quote: rec.quote, note: rec.note } };
  r.options = [...r.options.filter((x) => !String(x.method).startsWith('reviewed-')), o]; r.proposal = o;
}
const ONLY_VERIFIED = args.includes('--verified-only'); if (ONLY_VERIFIED) args.splice(args.indexOf('--verified-only'), 1);
const date = new Date().toISOString().slice(0, 10);
let bad = 0;
for (const a of args) {
  const [id, opt] = a.split(':'), r = P.get(id);
  if (!r) { console.log('not in the proposals: ' + id); bad++; continue; }
  const choices = r.options.filter((o) => ['doc-coord', 'gazetteer', 'wikipedia', 'wikipedia-near', 'possible', 'read-coord', 'read-wikipedia', 'reviewed-coord', 'reviewed-wikipedia'].includes(o.method) && (!String(o.method).startsWith('read-') || o.verified));
  const o = opt ? choices[+opt - 1] : r.proposal;
  if (o && ONLY_VERIFIED && !o.verified) { console.log(id + ': not verified by both stages of scripts/read-positions.mjs; not approved'); bad++; continue; }
  if (!o) { console.log(id + ': ' + (opt ? 'no option ' + opt : 'no single proposal; pick one of ' + choices.length + ' with ' + id + ':<n>') + '; options:'); choices.forEach((c, i) => console.log('   ' + (i + 1) + '. ' + c.method + ' ' + c.lat + ', ' + c.lon + ' ' + c.src.t)); bad++; continue; }
  store.approved[id] = { region: r.region, town: r.town, name: r.name, method: o.method, lat: o.lat, lon: o.lon, r: o.r || 1, posSrc: o.src, ...(o.raw ? { printed: o.raw } : {}), ...(o.named ? { named: o.named } : {}), ...(o.reviewed ? { reviewed: o.reviewed } : {}), ...(o.verdict ? { checked: { by: 'second reading, ' + (RD.model || 'model'), verdict: o.verdict.passage_places_entry + '/' + o.verdict.source_is_same_place, reason: o.verdict.reason } } : {}), by, date };
  console.log('approved ' + id + ' -> ' + o.lat + ', ' + o.lon + ' (' + o.method + ', ' + o.src.t + ')');
  if (!id.startsWith('c-')) applyHand(id, store.approved[id]);
}
save();
console.log(bad ? bad + ' not approved (see above)' : 'saved ' + FILE + '; now run node scripts/write-regional.mjs');
process.exit(bad ? 1 : 0);

// a hand-written entry: rewrite its position fields in place, leaving the rest of the entry as written
function applyHand(id, a) {
  const f = `public/data/regions/${a.region}.js`; let s = fs.readFileSync(f, 'utf8');
  const start = s.indexOf(`id: '${id}'`); if (start < 0) { console.log('  could not find ' + id + ' in ' + f + '; edit it by hand'); return; }
  const end = s.indexOf('\n    }', start), block = s.slice(start, end);
  const q = (t) => String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  let nb = block.replace(/pos: '[a-z]+',(?: posSrc: \{[^}]*\},)?/, `pos: 'site', posSrc: { t: '${q(a.posSrc.t)}', u: '${q(a.posSrc.u)}' },`)
    .replace(/lat: [-\d.]+, lon: [-\d.]+, r: [\d.]+/, `lat: ${a.lat}, lon: ${a.lon}, r: ${a.r}`);
  if (nb === block) { console.log('  no change made to ' + id + '; edit it by hand'); return; }
  s = s.slice(0, start) + nb + s.slice(end); fs.writeFileSync(f, s);
  console.log('  ' + f + ' updated for ' + id + '. Its text may still say it is mapped at the town centre: reword that sentence by hand.');
}
