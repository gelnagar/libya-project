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

const at = {}; for (const s of site) { const k = s.lat.toFixed(4) + ',' + s.lon.toFixed(4); (at[k] = at[k] || []).push(s.id); }
const stacks = Object.entries(at).filter(([, ids]) => ids.length > MAX_STACK);
ok(!stacks.length, `no more than ${MAX_STACK} site-level pins share one point`, stacks.map(([k, ids]) => k + ' x' + ids.length).join('; '));

const app = fs.readFileSync('public/app.js', 'utf8');
ok(/s\.pos === 'town'\) \{ townOn\[s\.id\] = on;/.test(app) && /function openTown\(g\)/.test(app), 'app.js draws town-level pins as one marker per town and lists them');

// self-test of the stacking rule on a made-up set, so the check cannot pass by being blind
const fake = Array.from({ length: MAX_STACK + 1 }, (_, i) => ({ id: 'x' + i, lat: 1, lon: 1 })), fk = {};
for (const s of fake) { const k = s.lat.toFixed(4) + ',' + s.lon.toFixed(4); (fk[k] = fk[k] || []).push(s.id); }
ok(Object.values(fk).some((ids) => ids.length > MAX_STACK), 'self-test: a stack of ' + (MAX_STACK + 1) + ' on one point is caught');

console.log(`\ntown-level ${pins.filter((s) => s.pos === 'town').length}, site-level ${site.length}`);
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
