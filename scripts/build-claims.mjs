// The claim model: every statement on the map as "this source supports this fact about this subject".
//   node scripts/build-claims.mjs            writes archive/model/{subjects,sources,claims}.json and model.sql
//   node scripts/build-claims.mjs --check    also proves nothing was lost: rebuilds the map's data from the model
//                                            and compares it, field by field, with public/data
// Records (see archive/model/README.md):
//   subject  a place, an area, an event or an item with no location; carries region, position and uncertainty
//   source   one cited work, with its address; provenance (fetch date, checksum) is added by build-provenance.mjs
//   claim    subject + source + what the source supports, the evidence level, the stored passage if there is one,
//            the analyst grades (source reliability A-F, information credibility 1-6) and who approved it
// The model is generated from public/data for now. When the owner switches over, public/data is generated from it.
import fs from 'node:fs'; import vm from 'node:vm'; import crypto from 'node:crypto'; import assert from 'node:assert/strict';
import { storedCopies, addProvenance, gradeSource, gradeClaims, addPublishers } from './lib/provenance.mjs';

const W = {};
for (const f of ['sites', 'areas', 'unplaced', 'panels', 'quotes', 'links']) { const p = `public/data/${f}.js`; if (!fs.existsSync(p)) continue; const c = { window: {} }; vm.runInNewContext(fs.readFileSync(p, 'utf8'), c); Object.assign(W, c.window); }
// other regions add their pins to the same list (public/data/regions/<id>.js); files starting with _ are test fixtures
const DRAFTED = new Set(); // ids of pins written from review candidates under the owner's instruction of 16 Nov 2026 (public/data/regions/)
for (const f of fs.existsSync('public/data/regions') ? fs.readdirSync('public/data/regions').filter((x) => x.endsWith('.js') && !x.startsWith('_')).sort() : []) { const before = (W.ATLAS_SITES || []).length, c = { window: W }; vm.runInNewContext(fs.readFileSync(`public/data/regions/${f}`, 'utf8'), c); (W.ATLAS_SITES || []).slice(before).forEach((p) => DRAFTED.add(p.id)); }
const SITES = W.ATLAS_SITES || [], AREAS = W.ATLAS_AREAS || [], UNPLACED = W.ATLAS_UNPLACED || [], MORE = W.ATLAS_UNPLACED_MORE || [], PANELS = W.ATLAS_PANELS || {}, QUOTES = W.ATLAS_QUOTES || {}, CONN = W.ATLAS_CONNECTIONS || [];
const EVENT_LAYERS = new Set(['airstrike', 'battle', 'massacre']);
const REGION = 'tripoli'; // everything published so far; other regions arrive with their own data files
const h12 = (t) => crypto.createHash('sha1').update(String(t)).digest('hex').slice(0, 12);

const sources = new Map(), claims = [], subjects = [];
function sourceId(s) { // one record per address; a work cited without an address is keyed by its title
  const key = s.u || 'title:' + s.t, id = 'src-' + h12(key);
  if (!sources.has(id)) sources.set(id, { id, url: s.u || null, title: s.t || null, origin: s.u ? new URL(s.u).host.replace(/^www\./, '') : null, fetched: null, sha256: null, archived: null, rights: null });
  return id;
}
function claim(subject, field, src, o = {}) {
  const sid = src ? sourceId(src) : null;
  claims.push({ id: 'c-' + h12(subject + '|' + field + '|' + (sid || '') + '|' + (o.n ?? '') + '|' + (o.statement || '')), subject, field, source: sid, cite: src ? src.t || null : null, url_blank: !!(src && 'u' in src && src.u == null), n: o.n ?? null,
    statement: o.statement ?? null, date: o.date ?? null, level: o.level ?? null,
    passage: o.passage ?? null, passage_status: o.passage ? 'stored' : 'not recorded',
    reliability: null, credibility: null, // analyst grades, set by scripts/grade-sources.mjs
    ...(DRAFTED.has(String(subject).replace(/^site:/, '')) ? { reviewer: 'owner (by instruction)', reviewed: '2026-11-16', origin: 'drafted from the review candidates that two or more stored documents support, on the owner\'s chat instruction of 16 Nov 2026 to finish the remaining regions. No person reviewed this claim; the date is the date of the instruction.' } : { reviewer: 'owner (by statement)', reviewed: '2026-11-16', origin: 'migrated from public/data. The original review was never recorded; on 16 Nov 2026 the owner stated in chat that these claims are good. That is a statement, not a per-claim review, and the date is the date of the statement.' }) });
}
const quote = (id, u) => { const q = QUOTES[id] && u && QUOTES[id][u]; return q ? { before: q.pre || '', text: q.hi || '', after: q.post || '', from: q.t || null, date: q.d || null } : null; };

/* pins: places and events */
for (const s of SITES) {
  const { id, sources: srcs, ...rest } = s;
  const uid = 'site:' + id;
  subjects.push({ uid, id, class: EVENT_LAYERS.has(s.layer) ? 'event' : 'place', region: s.region || REGION, order: subjects.length, set: 'sites', ...rest });
  (srcs || []).forEach((x, n) => claim(uid, 'account', x, { n, level: s.level, passage: quote(id, x.u) }));
  const P = PANELS[id];
  if (P) { // hand-written panel: each dated line is its own claim, tied to the numbered sources it cites
    (P.events || []).forEach((e, n) => { const refs = (e.src || []).map((i) => srcs[i - 1]).filter(Boolean);
      if (refs.length) refs.forEach((x) => claim(uid, 'timeline', x, { n, statement: e.t, date: e.y ?? e.d ?? null, level: s.level }));
      else claim(uid, 'timeline', null, { n, statement: e.t, date: e.y ?? e.d ?? null, level: s.level }); });
  }
}
/* areas: neighbourhoods, landmarks, military sites */
for (const a of AREAS) {
  const { id, sources: srcs, ...rest } = a;
  const uid = 'area:' + id;
  subjects.push({ uid, id, class: 'area', region: REGION, order: subjects.length, set: 'areas', hasSources: srcs !== undefined, ...rest });
  (srcs || []).forEach((x, n) => claim(uid, 'account', typeof x === 'string' ? { t: x } : x, { n, level: a.documented ? 'documented' : null }));
}
/* sourced items with no published location */
[[UNPLACED, 'unplaced'], [MORE, 'unplaced_more']].forEach(([list, set]) => list.forEach((u, i) => {
  const { src, ...rest } = u, id = (set === 'unplaced' ? 'u-' : 'um-') + h12(u.name + '|' + (u.when || '') + '|' + i);
  subjects.push({ uid: id, id, class: 'unplaced', region: REGION, order: subjects.length, set, srcShape: src === undefined ? 'none' : Array.isArray(src) ? 'list' : 'one', ...rest });
  [].concat(src === undefined ? [] : src).forEach((x, n) => claim(id, 'account', x, { n }));
}));
/* evidenced connections between subjects */
CONN.forEach((c, i) => { const { sources: srcs, ...rest } = c, id = 'k-' + h12(c.a + '|' + c.b + '|' + c.kind + '|' + i);
  subjects.push({ uid: id, id, class: 'connection', region: REGION, order: subjects.length, set: 'connections', hasSources: srcs !== undefined, ...rest });
  (srcs || []).forEach((x, n) => claim(id, 'connection', x, { n, level: c.confidence || null, statement: c.why || null })); });

fs.mkdirSync('archive/model', { recursive: true });
const out = { subjects, sources: [...sources.values()], claims };
// provenance, then the analyst grades (see lib/provenance.mjs); owner overrides live in archive/model/grades.json
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const over = readJson('archive/model/grades.json', {}), wayback = readJson('archive/model/wayback.json', {});
addProvenance(out.sources, storedCopies(), wayback, readJson('archive/model/fetched.json', {}));
out.sources.forEach((s) => Object.assign(s, gradeSource(s, over.sources || {})));
gradeClaims(claims, out.sources, over.claims || {});
addPublishers(claims, out.sources);
for (const k of Object.keys(out)) fs.writeFileSync(`archive/model/${k}.json`, JSON.stringify(out[k], null, 1));
const q = (v) => v == null ? 'NULL' : typeof v === 'number' ? String(v) : "'" + String(typeof v === 'object' ? JSON.stringify(v) : v).replace(/'/g, "''") + "'";
fs.writeFileSync('archive/model/model.sql', [
  '-- Generated by scripts/build-claims.mjs. The same three tables in SQLite or Cloudflare D1.',
  'CREATE TABLE IF NOT EXISTS subject (uid TEXT PRIMARY KEY, id TEXT NOT NULL, class TEXT NOT NULL, region TEXT NOT NULL, name TEXT, lat REAL, lon REAL, r REAL, y0 INTEGER, y1 INTEGER, level TEXT, data TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS source (id TEXT PRIMARY KEY, url TEXT, title TEXT, origin TEXT, fetched TEXT, sha256 TEXT, archived TEXT, rights TEXT);',
  'CREATE TABLE IF NOT EXISTS claim (id TEXT PRIMARY KEY, subject TEXT NOT NULL REFERENCES subject(uid), field TEXT NOT NULL, source TEXT REFERENCES source(id), cite TEXT, n INTEGER, statement TEXT, date TEXT, level TEXT, passage TEXT, passage_status TEXT, reliability TEXT, credibility INTEGER, reviewer TEXT, reviewed TEXT, origin TEXT);',
  'CREATE INDEX IF NOT EXISTS claim_subject ON claim(subject); CREATE INDEX IF NOT EXISTS claim_source ON claim(source); CREATE INDEX IF NOT EXISTS subject_region ON subject(region, class);',
  ...subjects.map((s) => `INSERT OR REPLACE INTO subject VALUES (${[s.uid, s.id, s.class, s.region, s.name ?? null, s.lat ?? null, s.lon ?? null, s.r ?? null, s.y0 ?? null, s.y1 ?? null, s.level ?? null, s].map(q).join(', ')});`),
  ...out.sources.map((s) => `INSERT OR REPLACE INTO source VALUES (${[s.id, s.url, s.title, s.origin, s.fetched, s.sha256, s.archived, s.rights].map(q).join(', ')});`),
  ...claims.map((c) => `INSERT OR REPLACE INTO claim VALUES (${[c.id, c.subject, c.field, c.source, c.cite, c.n, c.statement, c.date, c.level, c.passage, c.passage_status, c.reliability, c.credibility, c.reviewer, c.reviewed, c.origin].map(q).join(', ')});`)
].join('\n') + '\n');

const by = (list, k) => list.reduce((m, x) => { m[x[k]] = (m[x[k]] || 0) + 1; return m; }, {});
const acct = claims.filter((c) => c.field === 'account' && c.subject && subjects.find((s) => s.uid === c.subject && s.set === 'sites'));
console.log(`subjects ${subjects.length} ${JSON.stringify(by(subjects, 'class'))}; sources ${sources.size}; claims ${claims.length} ${JSON.stringify(by(claims, 'field'))}`);
// what the map shows beside each citation: the source's grade, and the entry's grade per subject
const G = { rel: {}, cred: {}, rev: {} };
out.sources.forEach((x) => { if (x.url) G.rel[x.url] = [x.reliability, x.source_kind, x.grade_basis === 'owner' ? 1 : 0]; });
claims.forEach((c) => { const sx = out.sources.find((x) => x.id === c.source); if (!sx || !sx.url || c.field !== 'account') return; const id = c.subject.replace(/^(site|area):/, ''); (G.cred[id] = G.cred[id] || {})[sx.url] = c.credibility; });
// who approved an entry and when (evidence rule 9): only where a claim records both; the map says "not recorded" for the rest
claims.forEach((c) => { if (c.reviewer && c.reviewed && c.subject) G.rev[c.subject.replace(/^(site|area):/, '')] = [c.reviewer, c.reviewed]; });
fs.writeFileSync('public/data/grades.js', '/* Generated by scripts/build-claims.mjs: analyst grades for cited sources. Do not hand-edit; override in archive/model/grades.json. */' + String.fromCharCode(10) + 'window.ATLAS_GRADES = ' + JSON.stringify(G) + ';' + String.fromCharCode(10));
const tally = (list, k) => JSON.stringify(list.reduce((m, x) => { m[x[k] ?? 'none'] = (m[x[k] ?? 'none'] || 0) + 1; return m; }, {}));
console.log(`sources with a stored copy ${out.sources.filter((s) => s.stored).length} of ${out.sources.length}, with an archived copy ${out.sources.filter((s) => s.archived).length}; reliability ${tally(out.sources, 'reliability')}; claim credibility ${tally(claims, 'credibility')}`);
console.log(`subjects whose claims all rest on one publisher: ${new Set(claims.filter((c) => c.single_publisher).map((c) => c.subject)).size} of ${new Set(claims.map((c) => c.subject)).size}`);
console.log(`claims with a recorded reviewer and review date (evidence rule 9): ${out.claims ? out.claims.filter((c) => c.reviewer && c.reviewed).length : claims.filter((c) => c.reviewer && c.reviewed).length} of ${claims.length}`);
console.log(`pin claims with the passage stored: ${acct.filter((c) => c.passage).length} of ${acct.length}; claims with no source at all: ${claims.filter((c) => !c.source).length}`);

/* ---------- --check: rebuild public/data from the model and compare ---------- */
if (process.argv.includes('--check')) {
  const M = JSON.parse(JSON.stringify(out)), src = new Map(M.sources.map((s) => [s.id, s]));
  const cited = (id, field) => M.claims.filter((c) => c.subject === id && c.field === field && c.source).sort((a, b) => a.n - b.n);
  const uniqueN = (list) => { const seen = new Set(); return list.filter((c) => !seen.has(c.n) && seen.add(c.n)); };
  const pair = (c) => { const s = src.get(c.source), o = {}; if (c.cite != null) o.t = c.cite; if (s.url != null) o.u = s.url; else if (c.url_blank) o.u = null; return o; };
  const strip = (s, extra = []) => { const o = { ...s }; for (const k of ['uid', 'class', 'region', 'order', 'set', 'hasSources', 'srcShape', ...extra]) delete o[k]; if (s.region && s.region !== REGION && s.set === 'sites') o.region = s.region; return o; }; // a pin outside Tripoli keeps its region, as its data file wrote it
  const key = (o) => JSON.stringify(Object.keys(o).sort().reduce((m, k) => { m[k] = o[k]; return m; }, {}));
  const same = (a, b, what) => { try { assert.equal(key(a), key(b)); return true; } catch { console.log('DIFFERS', what, '\n  was', key(a).slice(0, 300), '\n  now', key(b).slice(0, 300)); return false; } };
  let bad = 0;
  const sitesBack = M.subjects.filter((s) => s.set === 'sites').sort((a, b) => a.order - b.order).map((s) => ({ ...strip(s), sources: uniqueN(cited(s.uid, 'account')).map(pair) }));
  assert.equal(sitesBack.length, SITES.length); SITES.forEach((s, i) => { if (!same(s, sitesBack[i], 'site ' + s.id)) bad++; });
  const areasBack = M.subjects.filter((s) => s.set === 'areas').sort((a, b) => a.order - b.order).map((s) => { const o = strip(s); if (s.hasSources) o.sources = uniqueN(cited(s.uid, 'account')).map((c, i) => { const orig = AREAS.find((a) => a.id === s.id).sources[i]; return typeof orig === 'string' ? c.cite : pair(c); }); return o; });
  assert.equal(areasBack.length, AREAS.length); AREAS.forEach((a, i) => { if (!same(a, areasBack[i], 'area ' + a.id)) bad++; });
  for (const [list, set] of [[UNPLACED, 'unplaced'], [MORE, 'unplaced_more']]) {
    const back = M.subjects.filter((s) => s.set === set).sort((a, b) => a.order - b.order).map((s) => { const o = strip(s); delete o.id; const p = uniqueN(cited(s.uid, 'account')).map(pair); if (s.srcShape === 'list') o.src = p; else if (s.srcShape === 'one') o.src = p[0]; return o; });
    assert.equal(back.length, list.length); list.forEach((u, i) => { if (!same(u, back[i], set + ' ' + u.name)) bad++; });
  }
  const connBack = M.subjects.filter((s) => s.set === 'connections').sort((a, b) => a.order - b.order).map((s) => { const o = strip(s); delete o.id; if (s.hasSources) o.sources = uniqueN(cited(s.uid, 'connection')).map(pair); return o; });
  assert.equal(connBack.length, CONN.length); CONN.forEach((c, i) => { if (!same(c, connBack[i], 'connection ' + i)) bad++; });
  // every dated panel line is a claim
  let lines = 0, lineClaims = 0; for (const id of Object.keys(PANELS)) for (const [n, e] of (PANELS[id].events || []).entries()) { lines++; if (M.claims.some((c) => c.subject === 'site:' + id && c.field === 'timeline' && c.n === n && c.statement === e.t)) lineClaims++; }
  console.log(`check: ${SITES.length} pins, ${AREAS.length} areas, ${UNPLACED.length + MORE.length} unplaced items, ${CONN.length} connections rebuilt from the model; ${bad} differ. Panel lines as claims: ${lineClaims} of ${lines}.`);
  if (bad || lineClaims !== lines) process.exit(1);
}
