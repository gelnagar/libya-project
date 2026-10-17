// Builds the archive files the map loads:
//   public/data/records.js  — one compact entry per document, with places tagged automatically
//   public/data/docs/<id>.txt — full text, only where the rights allow it to be shown
// Sources: archive/records/*.json (hand-written and imported records), archive/fulltext/*.txt,
//          archive/wikipedia/<lang>/*.json (CC BY-SA), archive/countrystudy/*.txt (public domain).
// Run: node scripts/build-archive.mjs
import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import vm from 'node:vm';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFile(ROOT + p, 'utf8');
const list = async (p) => { try { return (await readdir(ROOT + p)).sort(); } catch { return []; } };
const load = async (p) => { const ctx = { window: {} }; vm.runInNewContext(await read(p), ctx); return ctx.window; };

const W = Object.assign({}, await load('public/data/sites.js'), await load('public/data/areas.js').catch(() => ({})));
const SITES = W.ATLAS_SITES || [], AREAS = W.ATLAS_AREAS || [];

// ---- gazetteer: every name a place goes by ----
const fold = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ً-ٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[’'`ʿʾ]/g, '').replace(/[-_.,()/]/g, ' ').replace(/\s+/g, ' ').trim();
const SITE_ALIASES = {
  abusalim: ['Abu Salim prison', 'Abu Salim jail', 'Abusalim prison', 'Abu Sleem prison', 'سجن ابو سليم'],
  jdeida: ['Jdeida prison', 'Jadida prison', 'Jedaida prison', 'Al-Jadida prison', 'سجن الجديده'],
  maktab: ['Maktab al-Nasser', 'Maktab al Nasser'],
  hadba: ['Hadba prison', 'al-Hadba prison', 'Hadba al-Khadra prison'],
  ainzara: ['Ain Zara prison'],
  cso: ['Central Security Organization', 'Central Security Organisation'],
  wheelus: ['Wheelus', 'Okba Ben Nafi', 'Uqba bin Nafi Air Base', 'Okba ibn Nafi', 'Mitiga', 'Maitiga', 'Mellaha', 'معيتيقه', 'قاعده عقبه بن نافع'],
  tip: ['Tripoli International Airport', 'Tripoli airport', 'Tripoli military airport', 'Tripoli airfield'],
  sidibilal: ['Sidi Bilal', 'Murat Sidi Bilal', 'Sidi Bilal port'],
  bab: ['Bab al-Aziziya', 'Bab al Aziziya', 'Bab al-Azizia', 'Bab el-Azizia', 'Bab al-Aziziyah', 'Azizia barracks', 'Aziziyah barracks', 'Aziziya barracks', 'Bab Aziziya', 'باب العزيزيه'],
  palace: ["People's Palace", 'People’s Palace', 'Qasr al-Shaab', 'قصر الشعب'],
  green: ['Green Square', 'Piazza Italia', 'الساحه الخضراء', 'ميدان الشهداء'],
  fateh: ['Al-Fateh University', 'Al Fateh University', 'Fateh University', 'University of Tripoli', 'Tripoli University', 'جامعه الفاتح', 'جامعه طرابلس'],
  'mk-sharshatt': ['Shar al-Shatt', 'Sciara Sciat', 'Sharia Shatt', 'Shara Shat', 'الشط'],
  'mk-riots': ['1945 Tripoli pogrom', '1945 anti-Jewish riots', '1967 Tripoli pogrom', 'anti-Jewish riots in Tripoli'],
  'mk-abusalim': ['Abu Salim massacre', 'Abu Salim prison massacre', 'مجزره ابو سليم', 'مذبحه سجن ابو سليم']
};
// Names too generic to tag documents by (they occur in texts about other places).
const STOP = new Set(['zoo', 'garden city', 'tourist area', 'military college', 'military academy tripoli', 'central security', 'military camp', 'army camp', 'sam site', 'naval academy', 'transport camp', 'artillery and missile school', 'missile camp', 'city centre', 'medina', 'old town', 'zanata', 'zenata', 'bab zanata', 'andalus', 'downtown tripoli', 'royal palace', 'independence square', 'martyrs square', 'martyrs’ square', "martyrs' square", 'saraya', 'red castle', 'women’s military academy', 'tripoli university', 'university of tripoli', 'dahra'].map(fold));
const gaz = [];
const okName = (n) => n && !STOP.has(fold(n)) && fold(n).length >= (/[a-z]/.test(fold(n)) ? 5 : 4);
for (const s of SITES) for (const n of [s.name, s.ar].concat(SITE_ALIASES[s.id] || [], s.aliases || [])) if (okName(n)) gaz.push([fold(n), s.id]);
for (const a of AREAS) for (const n of [a.name, a.ar].concat(a.aliases || [])) if (okName(n) && !(a.noAutoTag || []).includes(n)) gaz.push([fold(n), a.id]);
gaz.push(['tripoli', 'tripoli'], ['tarabulus', 'tripoli'], ['طرابلس', 'tripoli']);
gaz.sort((a, b) => b[0].length - a[0].length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const gazRe = gaz.map(([n, id]) => [new RegExp('(^|[^\\p{L}\\p{N}])' + esc(n) + '(?=$|[^\\p{L}\\p{N}])', 'u'), id, n]);
function tag(text, given) {
  const t = fold(text), counts = {};
  for (const [re, id] of gazRe) { if (re.test(t)) counts[id] = (counts[id] || 0) + 1; }
  const ids = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  return [...new Set([...(given || []), ...ids])].slice(0, 10);
}

// ---- rights ----
const RIGHTS = {
  'public-domain': { label: 'Public domain', show: true },
  'cc-by-sa': { label: 'CC BY-SA', show: true },
  'cc-by': { label: 'CC BY', show: true },
  'link-only': { label: 'Summary and link only', show: false },
  'excerpt': { label: 'Short excerpt and link', show: false },
  'private': { label: 'Private', show: false }
};
const shortSource = (r) => {
  const m = /Foreign Relations of the United States, (\d{4}[–-]\d{2,4}), Volume ([^,]+)/.exec(r.collection || '');
  if (m) return 'FRUS ' + m[1] + ', vol. ' + m[2];
  return r.source_short || r.source || r.collection || '';
};

const out = [], fulltext = new Map();
// 1. records files
for (const f of await list('archive/records')) {
  if (!f.endsWith('.json')) continue;
  const recs = JSON.parse(await read('archive/records/' + f));
  for (const r of recs) {
    let ft = '';
    if (r.fulltext) { try { ft = await read('archive/fulltext/' + r.id + '.txt'); } catch {} }
    if (typeof r.fulltext === 'string') ft = r.fulltext;
    const rights = RIGHTS[r.rights] || RIGHTS['link-only'];
    out.push({ i: r.id, y: r.type, t: r.title, d: r.date || '', s: shortSource(r), c: r.collection || r.source || '', a: r.archive_ref || undefined, u: r.link || undefined,
      p: tag([r.title, r.summary, ft.slice(0, 30000), (r.places || []).join(' ')].join(' '), r.places), m: r.summary || '', r: r.rights, rt: rights.label,
      rn: r.rights_note || '', f: !!(ft && rights.show), k: r.keywords || undefined });
    if (ft && rights.show) fulltext.set(r.id, ft);
  }
}
// 2. Wikipedia (only articles that are about Libya)
for (const lang of ['en', 'ar']) {
  for (const f of await list('archive/wikipedia/' + lang)) {
    if (!f.endsWith('.json')) continue;
    const w = JSON.parse(await read(`archive/wikipedia/${lang}/${f}`));
    if (!/Libya|Libyan|Tripoli|Gaddafi|Qadhafi|ليبيا|طرابلس|القذافي/.test(w.text.slice(0, 6000))) continue;
    const id = 'wp-' + lang + '-' + fold(w.title).replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 80);
    const first = w.text.split('\n').find((l) => l.trim().length > 80) || w.text.slice(0, 600);
    out.push({ i: id, y: 'reference', t: w.title + (lang === 'ar' ? ' (ويكيبيديا)' : ' (Wikipedia)'), d: '', s: 'Wikipedia (' + lang + ')', c: 'Wikipedia, ' + (lang === 'ar' ? 'Arabic' : 'English'), u: w.url,
      p: tag(w.title + ' ' + w.text.slice(0, 40000)), m: first.slice(0, 700), r: 'cc-by-sa', rt: 'CC BY-SA', rn: 'Text from Wikipedia contributors, CC BY-SA 4.0. Check the article for its own sources.', f: true, ll: w.coords || undefined });
    fulltext.set(id, w.title + '\n' + w.url + '\nText: Wikipedia contributors, CC BY-SA 4.0\n\n' + w.text);
  }
}
// 3. Libya: A Country Study
for (const f of await list('archive/countrystudy')) {
  if (!f.endsWith('.txt')) continue;
  const txt = await read('archive/countrystudy/' + f);
  const [title, url, , ...rest] = txt.split('\n');
  const body = rest.join('\n').trim();
  if (body.length < 400) continue;
  const id = 'lcs-' + f.replace('.txt', '');
  const first = body.split('\n').find((l) => l.trim().length > 120) || body.slice(0, 600);
  out.push({ i: id, y: 'reference', t: 'Libya: A Country Study — ' + title.replace(/^Libya\s*-\s*/i, '').trim(), d: '1987', s: 'Library of Congress country study', c: 'Libya: A Country Study, ed. Helen Chapin Metz (Library of Congress, Federal Research Division, 1987)', u: url,
    p: tag(title + ' ' + body), m: first.slice(0, 700), r: 'public-domain', rt: 'Public domain', rn: 'U.S. government work, public domain.', f: true });
  fulltext.set(id, title + '\n' + url + '\n\n' + body);
}
out.sort((a, b) => (a.d || '9999').localeCompare(b.d || '9999') || a.i.localeCompare(b.i));
// Drop undefined keys to keep the file small
const clean = out.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length))));
await writeFile(ROOT + 'public/data/records.js', '/* Generated by scripts/build-archive.mjs — do not edit by hand. */\nwindow.ATLAS_RECORDS = ' + JSON.stringify(clean) + ';\n');
await rm(ROOT + 'public/data/docs', { recursive: true, force: true });
await mkdir(ROOT + 'public/data/docs', { recursive: true });
for (const [id, t] of fulltext) await writeFile(ROOT + 'public/data/docs/' + id + '.txt', t);
const byType = {}; clean.forEach((r) => { byType[r.y] = (byType[r.y] || 0) + 1; });
console.log('records', clean.length, byType, 'full texts', fulltext.size);
