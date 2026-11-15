// Evidence rule 8 of the PRD (section 5): an entry at level "documented" that alleges a killing needs two independent
// sources; one source gives "testimony" or "suspected".
//   node scripts/check-evidence.mjs            report; exit 0 (it lists, it does not decide)
//   node scripts/check-evidence.mjs --strict   exit 1 if any entry breaks the rule
//   node scripts/check-evidence.mjs --self-test
// "Alleges a killing" = a pin in layer `massacre` (killings, executions, deaths in custody, repression: CLAUDE.md).
// "Independent" = published by a different organisation. The test is the publisher's registered domain, so en.wikipedia.org
// and ar.wikipedia.org are one, two CIA reading-room documents are one, and hrw.org twice is one. That is a floor, not a proof:
// two publishers can still be repeating one report, and a person has to judge that. Entries that fail need a second publisher
// or a lower level; changing a level on the live map is the owner's decision, so this script only lists.
// Writes archive/review/rule8.json.
import fs from 'node:fs'; import vm from 'node:vm';

const TWO_LEVEL = /^(co|com|org|gov|ac|net)\.[a-z]{2}$/;
export function publisher(u) {
  let h = ''; try { h = new URL(u).hostname.toLowerCase(); } catch { return ''; }
  const p = h.split('.'); if (p.length <= 2) return h;
  const tail2 = p.slice(-2).join('.');
  return TWO_LEVEL.test(tail2) ? p.slice(-3).join('.') : tail2;
}

if (process.argv.includes('--self-test')) {
  let f = 0; const eq = (a, b) => { if (a !== b) { f++; console.log('FAIL', a, '!==', b); } };
  eq(publisher('https://en.wikipedia.org/wiki/X'), 'wikipedia.org'); eq(publisher('https://ar.wikipedia.org/wiki/Y'), 'wikipedia.org');
  eq(publisher('https://www.hrw.org/reports/2006/06/28/x'), 'hrw.org'); eq(publisher('https://www.cia.gov/readingroom/document/cia-rdp'), 'cia.gov');
  eq(publisher('https://www.bbc.co.uk/news/1'), 'bbc.co.uk'); eq(publisher('not a url'), ''); eq(publisher('https://hrsly.com/en/annex'), 'hrsly.com');
  console.log(f ? f + ' failed' : 'self-test passed'); process.exit(f ? 1 : 0);
}

const pins = [];
const load = (file) => { const w = {}; vm.runInNewContext(fs.readFileSync(file, 'utf8'), { window: w, console }); return w; };
pins.push(...load('public/data/sites.js').ATLAS_SITES);
if (fs.existsSync('public/data/regions')) for (const f of fs.readdirSync('public/data/regions').filter((x) => x.endsWith('.js') && !x.startsWith('_'))) pins.push(...Object.values(load('public/data/regions/' + f)).flat().filter((x) => x && x.layer && x.id));

const rows = pins.filter((s) => s.layer === 'massacre' && s.level === 'documented').map((s) => {
  const pubs = [...new Set((s.sources || []).map((x) => publisher(x.u)).filter(Boolean))];
  return { id: s.id, name: s.name, year: s.y0 || null, sources: (s.sources || []).length, publishers: pubs, ok: pubs.length >= 2 };
});
const bad = rows.filter((r) => !r.ok);
fs.mkdirSync('archive/review', { recursive: true });
fs.writeFileSync('archive/review/rule8.json', JSON.stringify({ at: new Date().toISOString(), rule: 'documented + killing needs two independent publishers', documentedKillings: rows.length, meet: rows.length - bad.length, breaking: bad.length, entries: bad }, null, 1));
console.log(`rule 8: ${rows.length} documented killing entries; ${rows.length - bad.length} have two or more publishers; ${bad.length} rest on one.`);
for (const r of bad) console.log('  ' + r.id.padEnd(22) + (r.year || '').toString().padEnd(6) + r.name.slice(0, 60).padEnd(62) + (r.publishers.join(', ') || 'no source'));
process.exit(process.argv.includes('--strict') && bad.length ? 1 : 0);
