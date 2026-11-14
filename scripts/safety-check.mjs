// Safety check for one region, before its entries go anywhere public (plan section 9: "who could be harmed by this
// region's entries, and what was left out for that reason"). Free: no network, no AI calls.
//   node scripts/safety-check.mjs <region>
// Reads the region's review candidates (archive/review/candidates.json), its map pins if any
// (public/data/regions/<region>.js), and the people the reading model listed for each cited document.
// Flags, per entry:
//   private-role  a person named in a security, informer or enforcement role who is not a public official  -> leave out the name
//   victim        a person named as executed, arrested, detained or killed                                  -> name only if a published source names them
//   home          a passage pointing to a private home or residence                                         -> never published
//   after-2011    an event after the period of the map, in a conflict that is still live                    -> out of scope
// Writes archive/review/safety-<region>.json. The written judgement goes in archive/regions/<region>-safety.md.
import fs from 'node:fs'; import vm from 'node:vm';
import { flat } from './lib/stored.mjs';

const region = process.argv[2]; if (!region) { console.log('usage: node scripts/safety-check.mjs <region>'); process.exit(2); }
const all = JSON.parse(fs.readFileSync('archive/review/candidates.json', 'utf8')); const cands = (all.candidates || all).filter((c) => c.region === region);
let pins = []; const pf = `public/data/regions/${region}.js`;
if (fs.existsSync(pf)) { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(pf, 'utf8'), ctx); pins = Object.values(ctx.window).flat().filter((x) => x && x.region === region); }

// people per document, as the reading model listed them
const people = new Map();
for (const f of ['archive/crest/extract.jsonl', 'archive/crest/extract-other.jsonl']) { if (!fs.existsSync(f)) continue;
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) { if (!l) continue; let d; try { d = JSON.parse(l); } catch { continue; } if (d.people && d.people.length) people.set(d.id, d.people); } }

const PUBLIC = /\b(leader|head of state|president|king|queen|crown prince|emir|sultan|prime minister|premier|minister|secretary|ambassador|consul|envoy|chargé|charge d'affaires|chairman|spokesman|governor|mayor|general|admiral|colonel|lieutenant colonel|major|commander|chief of staff|member of the rcc|revolutionary command council|deputy|senator|congressman|pope|official|delegat|foreign|party|movement leader|press|journalist|author|scholar|historian)\b/i;
const ROLE = /\b(informer|informant|agent of|intelligence officer|security officer|interrogat|torture|guard|warden|executioner|hangman|revolutionary committee member|committee member|militia|prosecutor|judge|killer|assassin|hit ?man|accused of|carried out the execution|denounced)\b/i;
const VICTIM = /\b(executed|hanged|hung|shot dead|killed|murdered|assassinated|victim|prisoner|detainee|detained|arrested|disappeared|tortured|sentenced|condemned|defendant|dissident|exile|student|hostage)\b/i;
const HOME = /\b(home of|house of|residence of|his home|her home|family home|private house|lives at|lived at)\b/i;

const entries = [
  ...pins.map((p) => ({ id: p.id, kind: 'pin', name: p.name, date: p.y0 ? String(p.y0) : '', text: p.text || '', docs: [], sources: (p.sources || []).map((s) => s.t) })),
  ...cands.map((c) => ({ id: c.id, kind: c.kind, name: c.name, date: c.date || '', text: [c.name, ...c.items.map((i) => i.detail + ' ' + i.passage)].join(' '), docs: c.items.map((i) => i.doc), sources: c.items.map((i) => i.title) })),
];
const out = [];
for (const e of entries) {
  const body = flat(e.text), flags = [], named = new Map();
  for (const d of e.docs) for (const p of people.get(d) || []) {
    if (!p || !p.name) continue; const n = flat(p.name); if (n.length < 4) continue;
    // only people whose name is in this entry's own words or passages, not everyone in a long document
    const last = n.split(' ').filter((w) => w.length >= 4).pop(); if (!body.includes(n) && !(last && body.includes(last))) continue;
    const prev = named.get(n); named.set(n, { name: p.name, role: [prev && prev.role, p.role].filter(Boolean).join('; ') });
  }
  for (const p of named.values()) {
    const role = p.role || '', pub = PUBLIC.test(role) || /qadh?d?h?afi|gaddafi|qaddafi|jallud|idris|reagan|sadat|castro|arafat/i.test(p.name);
    if (ROLE.test(role) && !pub) flags.push({ flag: 'private-role', who: p.name, role });
    else if (VICTIM.test(role) && !pub) flags.push({ flag: 'victim', who: p.name, role });
    else if (!pub) flags.push({ flag: 'unclassified', who: p.name, role });
  }
  const m = body.match(new RegExp(HOME.source, 'i')); if (m) flags.push({ flag: 'home', at: m[0] });
  if (/^(201[2-9]|202)/.test(e.date)) flags.push({ flag: 'after-2011', at: e.date });
  out.push({ id: e.id, kind: e.kind, date: e.date, name: e.name.slice(0, 160), sources: e.sources.length, flags });
}
const count = (f) => out.filter((e) => e.flags.some((x) => x.flag === f)).length;
const summary = { region, at: new Date().toISOString(), entries: out.length, pins: pins.length, candidates: cands.length,
  privateRole: count('private-role'), victim: count('victim'), home: count('home'), after2011: count('after-2011'), unclassified: count('unclassified'), clear: out.filter((e) => !e.flags.length).length };
fs.writeFileSync(`archive/review/safety-${region}.json`, JSON.stringify({ summary, entries: out }, null, 1));
console.log(JSON.stringify(summary));
for (const f of ['private-role', 'victim', 'home', 'after-2011']) for (const e of out.filter((x) => x.flags.some((y) => y.flag === f)))
  console.log(f.padEnd(13), e.date.padEnd(10), e.name.slice(0, 90), '|', e.flags.filter((y) => y.flag === f).map((y) => y.who ? `${y.who} (${y.role})` : y.at).join('; ').slice(0, 200));
