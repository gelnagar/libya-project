// Turns the remaining review candidates outside Tripoli into map entries, each carrying a plain note of how many documents stand behind it.
//   node scripts/write-regional.mjs            writes public/data/regions/<region>-more.js and archive/review/regional-written.json
// Owner's instruction in chat, 16 Nov 2026: publish the candidates that rest on one document too; it is only a note. Nothing here is
// invented: the statement is the document's own words as the reading recorded them (`detail`), the position is the centre of the town the
// text names (Wikipedia coordinates in archive/model/regions.json), and the sources are the documents the candidate was found in.
// What is left out, and listed with its reason in archive/review/regional-written.json:
//   - a safety flag from `node scripts/safety-check.mjs` (a private person in a security or informer role, a named victim, a private home)
//   - after 2011 (the map's period ends there), speeches
//   - a text that also names Tripoli (it belongs to the Tripoli entries), a text that names no town of its region (no position to give)
//   - the same event or place already written (same town, date and wording), and the candidates written by hand in public/data/regions/<region>.js
// Grading: a candidate that describes a killing is "suspected" (reported, not confirmed) because one document is all there is
// (PRD s5 rule 8); everything else is "documented", meaning the document says it, and the entry says that one document says so.
import fs from 'node:fs';
import { REGIONS } from './lib/regions.mjs';

const WRITTEN_BY_HAND = new Set(['ae856549c274', 'c71c7c26d530', 'f765a85f7255', 'c8a5cea7b8d0', '52d979f33f42', 'd87cf40edf82', '8d3b1035b5ae', 'e5995f5d1de6', 'a734bf02829a', '4404240d56fd', '2cfc65968238']);
const cands = JSON.parse(fs.readFileSync('archive/review/candidates.json', 'utf8')).filter((c) => c.region !== 'tripoli' && (c.kind === 'place' || c.kind === 'event'));
const towns = {}; for (const r of JSON.parse(fs.readFileSync('archive/model/regions.json', 'utf8')).regions) towns[r.id] = r.towns;
const flags = {}; for (const r of ['benghazi', 'cyrenaica', 'fezzan', 'sirte', 'tripolitania']) { const f = `archive/review/safety-${r}.json`; if (fs.existsSync(f)) for (const e of JSON.parse(fs.readFileSync(f, 'utf8')).entries) flags[e.id] = e.flags.map((x) => x.flag); }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const period = (d) => { const m = /^(\d{4})(?:-(\d\d))?(?:-(\d\d))?/.exec(d || ''); if (!m) return null; return [m[3] && +m[3], m[2] && MONTHS[+m[2] - 1], m[1]].filter(Boolean).join(' '); };
const clip = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; const c = t.slice(0, n - 1), i = c.lastIndexOf(' '); return (i > n * 0.6 ? c.slice(0, i) : c) + '…'; };
const fold = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

const KILL = /\b(kill(ed|ing|ings)?|murder(ed)?|execut(ed|ion|ions)|assassinated|hanged|hanging|massacre\w*|tortur(ed|e)|shot dead)\b/i;
const layerOf = (t, kind) => {
  if (KILL.test(t)) return 'massacre';
  if (/\b(prison|detain\w*|jail\w*|custody|interrogat\w*)\b/i.test(t)) return 'detention';
  if (/\b(air ?strikes?|air raids?|bombed|bombing)\b/i.test(t) && /\b(US|U\.S\.|American|NATO|French|Egyptian)\b/.test(t)) return 'airstrike';
  if (/\b(battle|fighting|clash\w*|attack\w*|offensive|ambush\w*|shell(ed|ing)|raid\w*|coup|invasion|invaded|war|rebel\w*|insurgen\w*)\b/i.test(t)) return 'battle';
  if (/\b(airfield|air base|barracks|military|missile|SAM|radar|brigade|battalion|garrison|naval|armou?red)\b/i.test(t) && !/\b(visit|visits|visited|delegation|arrived|departs?|welcomed)\b/i.test(t)) return 'military';
  if (/\b(police|security (service|force|forces)|intelligence|revolutionary committee|committee)\b/i.test(t)) return 'security';
  return 'landmark';
};

const out = {}, skipped = {}, seen = new Set(), written = [];
const skip = (why, c) => { (skipped[why] || (skipped[why] = [])).push({ id: c.id, region: c.region, name: c.name.slice(0, 90) }); };
for (const c of cands) {
  if (WRITTEN_BY_HAND.has(c.id)) { skip('written by hand already', c); continue; }
  const fl = flags[c.id] || [];
  const bad = fl.find((f) => ['private-role', 'victim', 'home', 'after-2011'].includes(f));
  if (bad) { skip('safety flag: ' + bad, c); continue; }
  const year = (/^(\d{4})/.exec(c.date || '') || [])[1];
  if (year && +year > 2011) { skip('after 2011', c); continue; }
  const yy = year || (/^(\d{4})/.exec((c.items[0] || {}).date || '') || [])[1];
  if (yy && +yy < 1969) { skip('before 1969 (the map is of the Gaddafi years)', c); continue; }
  const it = [...c.items].sort((a, b) => (b.rel || 0) - (a.rel || 0))[0]; if (!it) { skip('no document', c); continue; }
  const text = [c.name, c.place || '', it.detail || ''].join(' ');
  if (/tripoli|tarabulus/i.test(text.replace(/Tripoli, Libya/gi, ''))) { skip('names Tripoli (belongs to the Tripoli entries)', c); continue; }
  const town = (towns[c.region] || []).map((t) => ({ t, re: (REGIONS.find((r) => r.id === c.region).towns.find((x) => x[0] === t.name) || [])[2] })).find((x) => x.re && x.re.test(text));
  if (!town) { skip('no town of the region named (no position to give)', c); continue; }
  const key = [town.t.name, c.date || '', fold(c.name).slice(0, 60)].join('|'); if (seen.has(key)) { skip('same place, date and wording already written', c); continue; } seen.add(key);

  const level = KILL.test(text) ? 'suspected' : 'documented', layer = layerOf(text, c.kind);
  const docYear = (/^(\d{4})/.exec(it.date || '') || [])[1], y = year || docYear || null;
  const pub = [...new Set(c.items.map((x) => host(x.url)).filter(Boolean))];
  const many = c.items.length > 1;
  const detail = String(it.detail || c.name).replace(/\s+/g, ' ').trim();
  const poor = c.items.some((x) => x.ocr != null && x.ocr < 80);
  const when = period(c.date), docWhen = period(it.date);
  const body = [
    detail.replace(/\.?$/, '.'),
    many ? `${c.items.length} documents mention it (${pub.length === 1 ? 'all from one publisher, ' + pub[0] : 'from ' + pub.length + ' publishers'}).` : `This rests on one document: ${clip(it.title, 120)}${docWhen ? ' (' + docWhen + ')' : ''}. No second source is held for it.`,
    level === 'suspected' ? 'It describes a death or killing, so it is shown as reported and not confirmed.' : '',
    poor ? 'The scan of at least one of these documents is of poor quality; errors in the text are likely.' : '',
    `Mapped at the centre of ${town.t.name}: the document names the town, not the site.`
  ].filter(Boolean).join(' ');
  const entry = {
    id: 'c-' + c.id, region: c.region, layer, level, ...(y ? { y0: +y, y1: +y } : {}),
    name: c.kind === 'place' ? clip(c.name, 90) : clip(c.name.replace(/\.$/, '').split(/;\s/)[0], 110), lat: town.t.lat, lon: town.t.lon, r: 12,
    period: when || (docWhen ? 'Described in a document of ' + docWhen : 'Date not given'),
    relevance: clip(detail, 170), text: body,
    sources: c.items.filter((x, i, a) => x.url && a.findIndex((y) => y.url === x.url) === i).slice(0, 5).map((x) => ({ t: clip(x.title, 150) + (x.date ? ' (' + x.date + ')' : ''), u: x.url }))
  };
  (out[c.region] || (out[c.region] = [])).push(entry); written.push({ id: entry.id, region: c.region, layer, level, docs: c.items.length, name: entry.name });
}

const HEAD = (r) => `/* GENERATED by scripts/write-regional.mjs: do not edit by hand (change the script, or write the entry by hand in ${r}.js).
   Entries for ${r} written from review candidates, including those that rest on one document, on the owner's chat instruction of
   16 Nov 2026. Each entry says how many documents it rests on. Position: the centre of the town the text names. */\n`;
for (const [r, list] of Object.entries(out)) {
  list.sort((a, b) => (a.y0 || 9999) - (b.y0 || 9999) || (a.id < b.id ? -1 : 1));
  fs.writeFileSync(`public/data/regions/${r}-more.js`, HEAD(r) + `window.ATLAS_SITES = (window.ATLAS_SITES || []).concat(${JSON.stringify(list, null, 1)});\n`);
}
fs.writeFileSync('archive/review/regional-written.json', JSON.stringify({ at: new Date().toISOString(), written: written.length, byRegion: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])), byLayer: written.reduce((m, w) => { m[w.layer] = (m[w.layer] || 0) + 1; return m; }, {}), byLevel: written.reduce((m, w) => { m[w.level] = (m[w.level] || 0) + 1; return m; }, {}), skipped: Object.fromEntries(Object.entries(skipped).map(([k, v]) => [k, { count: v.length, items: v }])) }, null, 1));
console.log(`written ${written.length}:`, JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length]))));
console.log('by layer', JSON.stringify(written.reduce((m, w) => { m[w.layer] = (m[w.layer] || 0) + 1; return m; }, {})), 'by level', JSON.stringify(written.reduce((m, w) => { m[w.level] = (m[w.level] || 0) + 1; return m; }, {})));
for (const [k, v] of Object.entries(skipped)) console.log('skipped', String(v.length).padStart(4), k);
