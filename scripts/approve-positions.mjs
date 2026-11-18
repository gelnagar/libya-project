// Records a person's approval of a proposed position (archive/review/positions-sheet.md) in archive/model/positions.json.
//   node scripts/approve-positions.mjs --by <initials> <id> [<id>:<option> ...]     approve; <option> picks one of several (1, 2, ...)
//   node scripts/approve-positions.mjs --list                                        show what is approved
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
const date = new Date().toISOString().slice(0, 10);
let bad = 0;
for (const a of args) {
  const [id, opt] = a.split(':'), r = P.get(id);
  if (!r) { console.log('not in the proposals: ' + id); bad++; continue; }
  const choices = r.options.filter((o) => ['doc-coord', 'gazetteer', 'wikipedia', 'wikipedia-near', 'possible'].includes(o.method));
  const o = opt ? choices[+opt - 1] : r.proposal;
  if (!o) { console.log(id + ': ' + (opt ? 'no option ' + opt : 'no single proposal; pick one of ' + choices.length + ' with ' + id + ':<n>') + '; options:'); choices.forEach((c, i) => console.log('   ' + (i + 1) + '. ' + c.method + ' ' + c.lat + ', ' + c.lon + ' ' + c.src.t)); bad++; continue; }
  store.approved[id] = { region: r.region, town: r.town, name: r.name, method: o.method, lat: o.lat, lon: o.lon, r: o.r || 1, posSrc: o.src, ...(o.raw ? { printed: o.raw } : {}), ...(o.named ? { named: o.named } : {}), by, date };
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
