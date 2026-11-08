// Checks the hand-written panel data in public/data/panels.js against the pins and areas it describes.
// Run from the repo root:  node scripts/check-panels.mjs
// Errors (exit code 1): unknown ids, footnotes that point past a pin's source list, timelines out of order, bad fields.
// Warnings: lines with no source (they show "source?" in the panel), sequence lines with no "at" date to check.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['sites.js', 'areas.js', 'panels.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const W = ctx.window;
const SITES = Object.fromEntries((W.ATLAS_SITES || []).map(s => [s.id, s]));
const AREAS = Object.fromEntries((W.ATLAS_AREAS || []).map(a => [a.id, a]));
const PANELS = W.ATLAS_PANELS || {};
const GEO = new Set(['neighbourhood', 'district', 'town']);
const EVENT_LAYERS = new Set(['airstrike', 'battle', 'massacre']);
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const errors = [], warnings = [];
const err = (id, m) => errors.push(`${id}: ${m}`);
const warn = (id, m) => warnings.push(`${id}: ${m}`);

function checkSrc(id, where, src, n) {
  if (src == null || (Array.isArray(src) && !src.length)) { warn(id, `${where} has no source (shows "source?")`); return; }
  if (!Array.isArray(src)) { err(id, `${where}: src must be a list of numbers, e.g. [3]`); return; }
  for (const k of src) if (!Number.isInteger(k) || k < 1 || k > n) err(id, `${where}: footnote ${k} is outside this pin's ${n} sources`);
}
// "4 Oct" -> month*100 + day, for ordering rows within one year
function dayKey(d) {
  const s = String(d || '').toLowerCase(), mo = MONTHS.findIndex(m => s.includes(m));
  const day = (s.match(/\b([0-3]?\d)\b/) || [])[1];
  return mo < 0 ? null : (mo + 1) * 100 + (day ? +day : 0);
}
// compare two ISO-ish dates only to the precision both have: '1996-06-28' and '1996-06-28T16:30' count as the same day
function atCompare(a, b) { const n = Math.min(a.length, b.length); return a.slice(0, n) < b.slice(0, n) ? -1 : a.slice(0, n) > b.slice(0, n) ? 1 : 0; }

for (const [id, P] of Object.entries(PANELS)) {
  const s = SITES[id], a = AREAS[id];
  if (!s && !a) { err(id, 'no pin or area has this id'); continue; }
  const n = ((s || a).sources || []).length;
  const kind = P.kind || (s && EVENT_LAYERS.has(s.layer) ? 'event' : 'site');
  if (P.kind && !['site', 'event'].includes(P.kind)) err(id, `kind must be 'site' or 'event', not '${P.kind}'`);
  if (P.area && !(AREAS[P.area] && GEO.has(AREAS[P.area].kind))) err(id, `area '${P.area}' is not a neighbourhood, district or town`);
  if (P.bottomSrc) checkSrc(id, 'bottom line', P.bottomSrc, n);
  if (P.events && kind === 'event') warn(id, 'has "events" but is shown as an event; events use "sequence"');
  if (P.sequence && kind === 'site') warn(id, 'has "sequence" but is shown as a site; sites use "events"');

  // site chronology: shown sorted by year; rows in the same year keep their written order, so their days must already be in order
  const lastDay = {};
  (P.events || []).forEach((e, i) => {
    const where = `events[${i}]`;
    if (!e.t) err(id, `${where} has no text`);
    checkSrc(id, where, e.src, n);
    if (e.y == null) return; // undated: listed under "Not dated in the sources"
    if (!Number.isInteger(e.y) || e.y < 1800 || e.y > 2100) { err(id, `${where}: y must be a year like 1984, or left out if undated`); return; }
    const k = dayKey(e.d);
    if (e.d && k == null) warn(id, `${where}: could not read the day '${e.d}' (use e.g. '4 Oct')`);
    if (k != null && lastDay[e.y] != null && k < lastDay[e.y]) err(id, `${where}: ${e.d} ${e.y} is written after a later date in ${e.y}; reorder them`);
    if (k != null) lastDay[e.y] = Math.max(lastDay[e.y] || 0, k);
  });

  // event sequence: shown in written order, so check it against each line's "at" date
  let prev = null;
  (P.sequence || []).forEach((e, i) => {
    const where = `sequence[${i}] ("${e.w || ''}")`;
    if (!e.t) err(id, `${where} has no text`);
    checkSrc(id, where, e.src, n);
    if (!e.at) { warn(id, `${where} has no "at" date, so its order cannot be checked`); return; }
    if (!/^\d{4}(-\d\d(-\d\d(T\d\d:\d\d)?)?)?$/.test(e.at)) { err(id, `${where}: at '${e.at}' should look like 1996, 1996-06, 1996-06-29 or 1996-06-29T10:45`); return; }
    if (prev && atCompare(e.at, prev.at) < 0) err(id, `${where} (${e.at}) comes before the line above it (${prev.at}); reorder them`);
    prev = e;
  });
  (P.conflicts || []).forEach((c, i) => checkSrc(id, `conflicts[${i}]`, c.src, n));
  (P.reporting || []).forEach((r, i) => { if (!r.who) warn(id, `reporting[${i}] does not say who the account is from`); checkSrc(id, `reporting[${i}]`, r.src, n); });
}

for (const w of warnings) console.log('warning  ' + w);
for (const e of errors) console.log('ERROR    ' + e);
console.log(`\n${Object.keys(PANELS).length} panel entries checked: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
