// Checks the timeline's date reading and that no record is silently dropped from it.
//   node scripts/test-timeline.mjs
// 1. public/when-years.js reads dates out of free "when" text: what it reads, and what it refuses.
// 2. Every pin and every record with no map position lands in exactly one of: drawn on the timeline, or listed as
//    "not on the timeline" with the reason. Counts must add up.
import fs from 'node:fs'; import vm from 'node:vm';
const w = {}; const ctx = { window: w, console }; ctx.globalThis = ctx;
for (const f of ['public/when-years.js', 'public/data/sites.js', 'public/data/unplaced.js']) vm.runInNewContext(fs.readFileSync(f, 'utf8'), ctx);
const when = w.ATLAS_WHEN;
let pass = 0, fail = 0; const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra && !cond ? '   ' + extra : '')); };
const is = (text, kind, y0, y1, extra = {}) => { const r = when(text, 1905, 2026); const good = r.kind === kind && (y0 == null || r.y0 === y0) && (y1 == null || r.y1 === y1) && Object.keys(extra).every((k) => JSON.stringify(r[k]) === JSON.stringify(extra[k])); ok(`"${text}" -> ${kind}${y0 ? ' ' + y0 + (y1 !== y0 ? '-' + y1 : '') : ''}`, good, JSON.stringify(r)); };

is('1957', 'point', 1957, 1957);
is('April 1984', 'point', 1984, 1984);
is('17 May 2022', 'point', 2022, 2022);
is('Arrested April 1983, died January 1984', 'point', 1983, 1983, { also: [1984] });
is('1925-1928', 'range', 1925, 1928);
is('1860-65', 'outside', 1860, 1865);
is('1985-92', 'range', 1985, 1992);
is('1906-1908; rebuilt 1935', 'range', 1906, 1908, { also: [1935] });
is('1907 (Banco di Roma); 1913 or 1930 (Banco di Napoli)', 'point', 1907, 1907, { also: [1913, 1930] });
is('1920s', 'decade', 1920, 1929, { approx: true });
is('1910s-1920s', 'decade', 1910, 1929, { approx: true });
is('Late 1970s-1980s', 'decade', 1970, 1989, { approx: true });
is('c. 1975', 'point', 1975, 1975, { approx: true });
is('before 1911', 'none');
is('after 1990', 'none');
is('since 1969', 'none');
is('Ottoman period', 'none');
is('late 15th century', 'none');
is('', 'none');
is('1654', 'outside', 1654, 1654);
is('1604 or 1670', 'outside', 1604, 1604);
is('2031', 'none');
is('about 2000 prisoners', 'none');
is('1990 prisoners died in 1996', 'point', 1996, 1996);

// coverage: nothing dropped
const S = w.ATLAS_SITES, U = [...(w.ATLAS_UNPLACED || []), ...(w.ATLAS_UNPLACED_MORE || [])];
const pinsDated = S.filter((s) => s.y0 != null).length, pinsUndated = S.filter((s) => s.y0 == null).length;
const kinds = {}; U.forEach((u) => { const k = when(u.when, 1905, 2026).kind; kinds[k] = (kinds[k] || 0) + 1; });
const drawn = (kinds.point || 0) + (kinds.range || 0) + (kinds.decade || 0), listed = (kinds.none || 0) + (kinds.outside || 0);
ok('every pin is dated or counted as undated', pinsDated + pinsUndated === S.length, `${pinsDated} + ${pinsUndated} vs ${S.length}`);
ok('every record with no map position is drawn or listed', drawn + listed === U.length, `${drawn} + ${listed} vs ${U.length}`);
console.log(`\nmapped pins: ${pinsDated} dated, ${pinsUndated} undated. Records with no map position: ${U.length}: drawn ${drawn} (${JSON.stringify(kinds)}), listed as not drawable ${listed}.`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
