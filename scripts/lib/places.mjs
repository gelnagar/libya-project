// Shared by scripts/locate-regional.mjs and scripts/read-positions.mjs: comparing place names, and looking a place up by the exact
// title of an English Wikipedia article (article pages only: robots.txt forbids the Wikipedia and Wikidata APIs to this fetcher).
import fs from 'node:fs'; import vm from 'node:vm';
import { get, checksum } from './fetcher.mjs';
import { REGIONS } from './regions.mjs';

const nf = {}; vm.runInNewContext(fs.readFileSync('public/name-fold.js', 'utf8'), { window: nf, globalThis: nf });
export const plain = (t) => nf.ATLAS_NAMEFOLD(String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['‘’`ʿʾ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim());
export const km = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
export const clip = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

// ---------- the words of a name, for comparing two names ----------
const STOP = new Set(['the', 'of', 'al', 'el', 'ad', 'an', 'as', 'ash', 'at', 'ar', 'az', 'and', 'in', 'near', 'libya', 'libyan', 'city', 'town']);
const IGNORE = new Set(['facilities', 'facility', 'area', 'site', 'sites', 'installation', 'installations', 'international']);
const CLASS = [[/^(airport|airfield|airbase|airstrip|aerodrome)$/, 'AIR'], [/^(port|harbor|harbour|seaport)$/, 'PORT'], [/^(barracks|barrack)$/, 'BARRACKS'],
  [/^(university|universiti)$/, 'UNIVERSITY'], [/^(prison|jail|gaol)$/, 'PRISON'], [/^(stadium|arena)$/, 'STADIUM']];
export const TOWN_RE = Object.fromEntries(REGIONS.map((r) => [r.id, r.towns.map((t) => t[2])]));
export function words(name, region) {
  let t = String(name || '').replace(/\(.*?\)/g, ' ').replace(/\bair ?base\b/gi, 'airbase');
  for (const re of TOWN_RE[region] || []) t = t.replace(new RegExp(re.source, 'gi'), ' ');
  // stop words and kinds of place are judged on the word as written, before the spelling fold (which turns "airport" into "airpurt")
  const raw = String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['‘’`ʿʾ]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
  return [...new Set(raw.filter((w) => !STOP.has(w) && !IGNORE.has(w)).map((w) => { const k = CLASS.find(([re]) => re.test(w)); return k ? k[1] : plain(w); }).filter(Boolean))].sort();
}
export const same = (a, b) => a.length && a.length === b.length && a.every((w, i) => w === b[i]);
export const classOnly = (ws) => ws.every((w) => /^[A-Z]+$/.test(w));

// ---------- wikipedia: an article page by exact title, kept in a store so a rerun is offline ----------
export const WIKI_FILE = 'archive/review/positions-wiki.json';
export const wiki = fs.existsSync(WIKI_FILE) ? JSON.parse(fs.readFileSync(WIKI_FILE, 'utf8')) : {};
export const saveWiki = () => fs.writeFileSync(WIKI_FILE, JSON.stringify(Object.fromEntries(Object.entries(wiki).sort()), null, 1));
export async function article(title, offline, needLead) {
  const key = title.replace(/ /g, '_');
  // look-ups made before 19 Nov 2026 kept no opening paragraph; fetch again when a reader needs it
  if (wiki[key] !== undefined && !(needLead && !offline && wiki[key] && wiki[key].lead === undefined)) return wiki[key];
  if (offline) return null;
  const url = 'https://en.wikipedia.org/wiki/' + encodeURIComponent(key);
  const html = await get(url, { gap: 1500, timeout: 30000 });
  if (!html) { wiki[key] = null; return null; }
  const canon = (/<link rel="canonical" href="https:\/\/en\.wikipedia\.org\/wiki\/([^"]+)"/.exec(html) || [])[1];
  const geo = /class="geo"[^>]*>\s*(-?\d+(?:\.\d+)?)\s*;\s*(-?\d+(?:\.\d+)?)/.exec(html);
  const disamb = /id="disambigbox"|class="[^"]*\bdmbox-disambig\b/.test(html);
  const final = canon ? decodeURIComponent(canon).replace(/_/g, ' ') : title;
  // the article's opening paragraph, so a second reader can judge whether it describes the same facility
  // (paragraphs carry attributes in Wikipedia's markup; skip the empty ones and short captions)
  const strip = (p) => p.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '').replace(/&#\d+;|&[a-z]+;/g, ' ').replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
  const body = html.slice(Math.max(0, html.indexOf('mw-parser-output')));
  const para = [...body.matchAll(/<p(?![^>]*mw-empty-elt)[^>]*>([\s\S]*?)<\/p>/g)].map((m) => strip(m[1])).find((t) => t.length > 60);
  const lead = para ? clip(para, 600) : '';
  wiki[key] = { asked: title, title: final, url: 'https://en.wikipedia.org/wiki/' + (canon || key), lat: geo ? +geo[1] : null, lon: geo ? +geo[2] : null, disamb, lead, checksum: checksum(html), fetched: new Date().toISOString().slice(0, 10) };
  return wiki[key];
}
export function titlesFor(p, region, town) {
  const ws = words(p, region); if (!ws.length || classOnly(ws)) {
    // only a kind of place plus the town ("Benghazi port"): try the usual article form for the town's port, airport, university
    const k = ws[0]; const T = town.name;
    return { AIR: [T + ' Airport', T + ' International Airport'], PORT: ['Port of ' + T], UNIVERSITY: ['University of ' + T], STADIUM: [T + ' Stadium'] }[k] || [];
  }
  const proper = String(p).replace(/\s+/g, ' ').trim(), titled = proper.replace(/\b([a-z])/g, (c) => c.toUpperCase());
  const out = [proper, titled];
  const base = titled.replace(/\b(Air ?[Bb]ase|Airfield|Airport|International Airport|Airstrip)\b.*$/, '').trim();
  if (base !== titled && base) out.push(base + ' Airport', base + ' International Airport', base + ' Air Base', base + ' Airbase');
  if (/\b(Port|Harbou?r)\b/i.test(titled)) { const b2 = titled.replace(/\b(Port|Harbou?r)( Facilities)?\b/i, '').trim(); if (b2) out.push('Port of ' + b2); }
  return [...new Set(out)];
}
// uncertainty radius (km) by the kind of place, read from the name as written
export const R_BY = (ws, p) => ws.includes('AIR') ? 2 : ws.includes('PORT') ? 1 : ws.some((w) => /^(UNIVERSITY|STADIUM|PRISON)$/.test(w)) || /\b(hospital|hotel|mosque|museum|palace|college|institute|lighthouse|square)\b/i.test(p) ? 0.5 : /\b(street|avenue)\b/i.test(p) ? 1.5 : /\b(oasis|lake)\b/i.test(p) ? 3 : 1.5;

// ---------- coordinates printed in a document: "COORDINATES 32-07-14N 020-03-07E" and the like ----------
export const COORD = /\b(\d{2})-(\d{2})-([0-9O]{2})N\s*0?(\d{2,3})-(\d{2})-([0-9O]{2})E\b/g;
export const dms = (d, m, s) => +d + +m / 60 + +String(s).replace(/O/g, '0') / 3600;
