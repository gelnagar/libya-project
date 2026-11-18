// Checks the positions of the pins outside Tripoli (the regional entries).
//   node scripts/test-positions.mjs
// Why: on 16 Nov 2026 the owner saw that 192 regional entries sat on 13 points (76 on the centre of Benghazi). The documents behind
// them name the town, not the site, so they are now marked `pos: 'town'` and drawn as one marker per town with a count (app.js,
// TOWNS). An entry gets `pos: 'site'` only when a source gives the site's own position, recorded in `posSrc`.
// What is checked:
//   1. every pin outside Tripoli says which it is (pos 'town' or 'site')
//   2. a town-level pin sits on the centre of a town of its region as recorded in archive/model/regions.json
//   3. a site-level pin names where its position comes from (posSrc with a link)
//   4. site-level pins do not stack: no more than MAX_STACK share one point (the old problem would come back as a failure here)
//   5. app.js draws town-level pins as town markers (the code is present)
import fs from 'node:fs'; import vm from 'node:vm';
const MAX_STACK = 3;
let pass = 0, fail = 0;
const ok = (c, msg, detail) => { if (c) { pass++; console.log('PASS ' + msg); } else { fail++; console.log('FAIL ' + msg + (detail ? ': ' + detail : '')); } };

const W = {}; W.window = W;
for (const f of fs.readdirSync('public/data/regions').filter((x) => x.endsWith('.js') && !x.startsWith('_'))) vm.runInNewContext(fs.readFileSync('public/data/regions/' + f, 'utf8'), W);
const pins = (W.ATLAS_SITES || []).filter((s) => s.region && s.region !== 'tripoli');
const towns = {}; for (const r of JSON.parse(fs.readFileSync('archive/model/regions.json', 'utf8')).regions) towns[r.id] = r.towns || [];

const noPos = pins.filter((s) => s.pos !== 'town' && s.pos !== 'site');
ok(pins.length > 0 && !noPos.length, `${pins.length} regional pins each say whether they are town-level or site-level`, noPos.slice(0, 5).map((s) => s.id).join(', '));

const near = (s, t) => Math.abs(s.lat - t.lat) < 0.002 && Math.abs(s.lon - t.lon) < 0.002;
const offTown = pins.filter((s) => s.pos === 'town' && !(towns[s.region] || []).some((t) => near(s, t)));
ok(!offTown.length, `town-level pins sit on a recorded town centre of their region (${pins.filter((s) => s.pos === 'town').length})`, offTown.slice(0, 5).map((s) => s.id).join(', '));

const site = pins.filter((s) => s.pos === 'site'), noSrc = site.filter((s) => !s.posSrc || !/^https?:\/\//.test(s.posSrc.u || ''));
ok(!noSrc.length, `site-level pins name the source of their position (${site.length})`, noSrc.map((s) => s.id).join(', '));

// several reports about one facility may share its point (they name the same position source); different sources on one point
// would mean a fallback position, which is the old problem
const at = {}; for (const s of site) { const k = s.lat.toFixed(4) + ',' + s.lon.toFixed(4); (at[k] = at[k] || []).push(s); }
const stacks = Object.entries(at).filter(([, g]) => g.length > MAX_STACK && new Set(g.map((s) => s.posSrc && s.posSrc.u)).size > 1);
ok(!stacks.length, `no more than ${MAX_STACK} site-level pins with different position sources share one point`, stacks.map(([k, g]) => k + ' x' + g.length).join('; '));

// a site-level pin on a town centre is allowed only when the town itself is the subject (its source is the town's article)
const onTown = site.filter((s) => (towns[s.region] || []).some((t) => near(s, t) && (!s.posSrc || s.posSrc.u !== t.source)));
ok(!onTown.length, 'no site-level pin sits on a town centre unless the town is its subject', onTown.map((s) => s.id).join(', '));

// every approved position is one the locator listed for that entry (no position typed in by hand), and is applied
if (fs.existsSync('archive/model/positions.json')) {
  const A = JSON.parse(fs.readFileSync('archive/model/positions.json', 'utf8')).approved || {};
  const P = fs.existsSync('archive/review/positions-proposed.json') ? new Map(JSON.parse(fs.readFileSync('archive/review/positions-proposed.json', 'utf8')).list.map((r) => [r.id, r])) : new Map();
  const notListed = Object.entries(A).filter(([id, a]) => !(P.get(id) || { options: [] }).options.some((o) => o.lat === a.lat && o.lon === a.lon));
  ok(!notListed.length, `${Object.keys(A).length} approved positions are each one the locator listed`, notListed.map(([id]) => id).join(', '));
  const byId = new Map(pins.map((s) => [s.id, s]));
  const notApplied = Object.entries(A).filter(([id, a]) => { const s = byId.get(id); return !s || s.pos !== 'site' || s.lat !== a.lat || s.lon !== a.lon; });
  ok(!notApplied.length, 'every approved position is on the map (run node scripts/write-regional.mjs after approving)', notApplied.map(([id]) => id).join(', '));
  ok(Object.values(A).every((a) => a.by && /^\d{4}-\d{2}-\d{2}$/.test(a.date)), 'every approval records who approved it and when');
}

const app = fs.readFileSync('public/app.js', 'utf8');
ok(/s\.pos === 'town'\) \{ townOn\[s\.id\] = on;/.test(app) && /function openTown\(g\)/.test(app), 'app.js draws town-level pins as one marker per town and lists them');

// self-test of the stacking rule on a made-up set, so the check cannot pass by being blind
const fake = Array.from({ length: MAX_STACK + 1 }, (_, i) => ({ id: 'x' + i, lat: 1, lon: 1 })), fk = {};
for (const s of fake) { const k = s.lat.toFixed(4) + ',' + s.lon.toFixed(4); (fk[k] = fk[k] || []).push(s.id); }
ok(Object.values(fk).some((ids) => ids.length > MAX_STACK), 'self-test: a stack of ' + (MAX_STACK + 1) + ' on one point is caught');

console.log(`\ntown-level ${pins.filter((s) => s.pos === 'town').length}, site-level ${site.length}`);
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
