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
let SUMS = {};
try { SUMS = JSON.parse(await read('archive/records/frus-summaries.json')); } catch {}
// 1. records files
for (const f of await list('archive/records')) {
  if (!f.endsWith('.json') || f === 'frus-summaries.json') continue;
  const recs = JSON.parse(await read('archive/records/' + f));
  for (const r of recs) {
    let ft = '';
    if (r.fulltext) { try { ft = await read('archive/fulltext/' + r.id + '.txt'); } catch {} }
    if (typeof r.fulltext === 'string') ft = r.fulltext;
    const rights = RIGHTS[r.rights] || RIGHTS['link-only'];
    const sm = SUMS[r.id];
    if (sm && sm.summary) {
      r.summary = sm.summary + (sm.tripoli_details ? ' Tripoli: ' + sm.tripoli_details : '');
      r.keywords = [...(r.keywords || []), ...(sm.people || []), ...(sm.topics || [])].filter((x) => typeof x === 'string');
    }
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
// 4. FBIS Daily Reports: Libya sections, 1978-1987 (U.S. government translations, public domain)
for (const f of await list('archive/fbis')) {
  if (!/^\d{4}-\d{2}-\d{2}-\d+\.txt$/.test(f)) continue;
  const txt = await read('archive/fbis/' + f);
  const [head, url, , ...rest] = txt.split('\n');
  const body = rest.join('\n').trim();
  if (body.length < 300) continue;
  const date = f.slice(0, 10);
  const lines = body.split('\n').map((l) => l.trim());
  const heads = lines.filter((l, i) => i > 0 && l.length >= 12 && l.length <= 140 && /[A-Z]/.test(l) && l === l.toUpperCase() && !/^[A-Z]{2,4}\d/.test(l) && !/LIBYA/.test(l)).slice(0, 6);
  const id = 'fbis-' + f.replace('.txt', '');
  const vol = (/Vol\.[^,]*No\.\s*\d+/.exec(head) || [''])[0];
  out.push({ i: id, y: 'report', t: 'FBIS Daily Report, Libya: ' + (heads[0] ? heads[0].toLowerCase().replace(/(^|[ -])([a-z])/g, (m, a, b) => a + b.toUpperCase()) : date), d: date, s: 'FBIS Daily Report' + (vol ? ' ' + vol : ''), c: 'Foreign Broadcast Information Service, Daily Report: Middle East & Africa (Internet Archive scan)', u: url,
    p: tag(body.slice(0, 20000)), m: 'Libya section of the daily report: ' + (heads.length ? heads.join('; ').toLowerCase() : 'translated Libyan radio, JANA and press items') + '. Machine-read scan; errors likely.', r: 'public-domain', rt: 'Public domain', rn: 'U.S. government translation, public domain. OCR text: errors are likely.', f: true });
  fulltext.set(id, head + '\n' + url + '\n\n' + body);
}
// 5. Government documents: Reagan and Bush libraries, JPRS Near East/North Africa Report (Libya sections)
try {
  const gov = JSON.parse(await read('archive/gov/catalog.json'));
  for (const g of gov) {
    if (!g.file) continue;
    let txt = await read('archive/gov/' + g.file);
    const isJ = g.id.startsWith('jprs-');
    if (isJ) txt = txt.replace(/[ \t]{2,}/g, ' ');
    const lines = txt.split('\n');
    const body = lines.slice(isJ ? 5 : 0).join('\n').trim();
    let d = '';
    if (isJ) {
      const ys = {}; for (const m of body.matchAll(/\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{2,4})\b/g)) { const y = +(m[1].length === 2 ? '19' + m[1] : m[1]); if (y >= 1969 && y <= 1996) ys[y] = (ys[y] || 0) + 1; }
      const top = Object.entries(ys).sort((a, b) => b[1] - a[1])[0]; if (top) d = top[0];
    }
    const first = isJ ? (body.split('\n').map((l) => l.trim()).find((l) => l.length > 15 && l.length < 140) || '') : '';
    const t = isJ ? 'JPRS ' + (g.title || 'Near East/North Africa Report').replace(/^DTIC \w+:\s*/, '').replace(/\.$/, '') + ' — Libya: ' + first : g.title + ' (' + g.collection.split(',')[0] + ')';
    const id = 'gov-' + g.id;
    out.push({ i: id, y: isJ ? 'report' : 'government document', t, d, s: g.source, c: g.collection, u: g.url || g.page, a: g.page && g.page !== g.url ? g.page : undefined,
      p: tag(body.slice(0, 20000)), m: isJ ? 'Libya section of a JPRS translation volume (Libyan radio, JANA and press items). Date estimated from the items inside; OCR errors likely.' : 'Digitised U.S. government record, scanned and text-read. Date not verified; OCR errors likely.', r: 'public-domain', rt: 'Public domain', rn: 'U.S. government work, public domain. OCR text: errors are likely.', f: true });
    fulltext.set(id, t + '\n' + (g.url || '') + '\n\n' + body.slice(0, 400000));
  }
} catch (e) { console.log('gov skipped', e.message); }
// 6. CIA reading room (CREST), NIS and new JPRS volumes via the Internet Archive mirror, with Haiku extraction.
//    Only documents Haiku rated relevance >= 1 are added. Candidate new places and links go to archive/crest/ for review.
try {
  const { gunzipSync } = await import('node:zlib');
  const docs = new Map(gunzipSync(await readFile(ROOT + 'archive/crest/docs.jsonl.gz')).toString().split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((d) => d.text).map((d) => [d.id, d]));
  const ex = (await read('archive/crest/extract.jsonl')).split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const ids = new Set([...SITES.map((s) => s.id), ...AREAS.map((a) => a.id)]);
  const newPlaces = [], links = []; let n = 0;
  const arr = (v) => { if (Array.isArray(v)) return v; if (typeof v === 'string') { try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; } } return []; };
  let bad = 0;
  for (const x0 of ex) {
    const x = { ...x0, places: arr(x0.places).filter((p) => p && typeof p === 'object'), events: arr(x0.events).filter((e) => e && typeof e === 'object'),
      people: arr(x0.people).filter((p) => p && typeof p === 'object'), facts: arr(x0.facts).filter((f) => typeof f === 'string'), links: arr(x0.links).filter((l) => l && typeof l === 'object') };
    if (['places', 'events', 'people', 'facts', 'links'].some((k) => x0[k] != null && !Array.isArray(x0[k]))) bad++;
    const d = docs.get(x.id); if (!d || !(x.relevance >= 1)) continue;
    const id = (d.src === 'jprs' ? 'jprs2-' : 'crest-') + d.id.replace(/^cia-readingroom-document-|^ufiche-test-document_/, '');
    const src = d.src === 'jprs' ? 'JPRS (Joint Publications Research Service)' : d.src === 'nis' ? 'CIA National Intelligence Survey' : 'CIA reading room (CREST)';
    const known = [...new Set([...(x.places || []), ...(x.events || [])].map((p) => p.site_id).filter((s) => s && ids.has(s)))];
    const date = /^\d{4}/.test(x.date || '') ? x.date : (d.date || '');
    const facts = [...(x.facts || []), ...(x.events || []).map((e) => `${e.date ? e.date + ': ' : ''}${e.what}${e.killed ? ` (${e.killed} killed)` : ''}`)];
    out.push({ i: id, y: d.src === 'jprs' ? 'report' : (x.kind === 'imagery analysis' ? 'imagery analysis' : 'intelligence document'), t: (d.src === 'jprs' ? 'JPRS ' : '') + d.title.replace(/\s+/g, ' ').trim(), d: date, s: src,
      c: (d.src === 'jprs' ? 'JPRS translation volume' : 'CIA Electronic Reading Room') + ' (Internet Archive mirror)', u: d.cia || d.ia, a: d.ia,
      p: [...new Set([...known, ...tag([d.title, x.summary, d.text.slice(0, 20000)].join(' '))])], m: x.summary, r: 'public-domain', rt: 'Public domain',
      rn: 'U.S. government work, public domain. OCR text: errors are likely. Summary written by AI (Claude Haiku) from the text.', f: true,
      k: (x.people || []).map((p) => p.name).slice(0, 8) });
    fulltext.set(id, d.title + '\n' + (d.cia || d.ia) + '\n' + d.ia + '\n\n' + (x.summary ? 'Summary (AI): ' + x.summary + '\n' + facts.map((f) => '• ' + f).join('\n') + '\n\n' : '') + d.text.slice(0, 400000));
    for (const p of x.places || []) if (!(p.site_id && ids.has(p.site_id)) && (p.in_tripoli || p.lat)) newPlaces.push({ name: p.name, lat: p.lat, lon: p.lon, detail: p.detail, doc: id, date, rel: x.relevance });
    for (const l of x.links || []) links.push({ ...l, doc: id, date, rel: x.relevance });
    n++;
  }
  await writeFile(ROOT + 'archive/crest/new-places.json', JSON.stringify(newPlaces, null, 1));
  await writeFile(ROOT + 'archive/crest/link-candidates.json', JSON.stringify(links, null, 1));
  console.log('crest records', n, 'malformed-field rows repaired/ignored', bad, 'new place mentions', newPlaces.length, 'link candidates', links.length);
} catch (e) { console.log('crest skipped', e.message); }

// 7. Event tags: tie documents to the events mapped on the atlas. A rule fires when the text names the year, matches every keyword group,
//    and (optionally) the place names. Deliberately conjunctive so that a passing mention does not tag a document.
const EVENT_RULES = [
  { id: 'bt-1984-bab', yr: '1984', all: [/(bab|babel|el)[\s\-]*(al|el)?[\s\-]*az[iz]+[iy]?a|barracks/i, /(attack|assault|gunmen|raid|coup|commando)/i, /\bmay\b|8 may|nfsl|national front/i] },
  { id: 'mk-hang-1984', yr: '1984', all: [/hang(ed|ing|ings)/i, /(student|universit)/i, /tripoli|fateh/i] },
  { id: 'bt-1979-embassy', yr: '1979', all: [/embass/i, /(burn|burnt|sack|storm|mob|demonstrat|set on fire)/i, /(u\.?s\.?|american)/i] },
  { id: 'as-bab', yr: '1986', all: [/(air (raid|strike|attack)|bomb(ing|ed)|f-?111|el dorado)/i, /(bab|el)[\s\-]*(al|el)?[\s\-]*az[iz]+[iy]?a|qadh?dh?afi.{0,40}(house|compound|residence|tent|headquarters)/i] },
  { id: 'as-tip', yr: '1986', all: [/(air (raid|strike|attack)|bomb(ing|ed)|f-?111|el dorado)/i, /(tripoli (military )?(air|airport|airfield)|aeroporto|military airfield)/i] },
  { id: 'as-sidibilal', yr: '1986', all: [/(air (raid|strike|attack)|bomb(ing|ed)|f-?111|el dorado)/i, /sidi bilal|murat sidi/i] },
  { id: 'as-benashour', yr: '1986', all: [/(air (raid|strike|attack)|bomb(ing|ed)|f-?111|el dorado)/i, /ben ashour|french embassy|residential (area|neighbou?rhood)/i] },
  { id: 'mk-abusalim', all: [/abu ?sl[ei]+m/i, /(massacre|1,?270|1996|killing of (prisoners|detainees)|mass (killing|grave))/i] },
  { id: 'mk-feb2011', yr: '2011', all: [/tripoli/i, /(protest|demonstrat|uprising)/i, /(shot|killed|fired|live (ammunition|fire)|crackdown|bodies)/i, /february|feb\.? 2[0-5]|2[0-5] feb/i] },
  { id: 'bt-2011-bab', yr: '2011', all: [/(bab|el)[\s\-]*(al|el)?[\s\-]*az[iz]+[iy]?a/i, /(stormed|overran|fell|captured|seized|assault)/i, /august|23 aug/i] },
  { id: 'bt-2011-abusalim', yr: '2011', all: [/abu ?sl[ei]+m/i, /(fight|battle|clash|rebel|revolutionar|uprising|seized|liberat)/i] },
  { id: 'bt-2011-tajoura', yr: '2011', all: [/tajou?ra/i, /(fight|battle|clash|rebel|revolutionar|uprising|seized|liberat)/i] },
  { id: 'bt-2011-mitiga', yr: '2011', all: [/mitiga|maitiga|mitiga/i, /(fight|battle|clash|rebel|revolutionar|seized|shell|rocket)/i] },
  { id: 'bt-2011-green', yr: '2011', all: [/green square|martyrs.? square/i, /(fight|battle|clash|rebel|revolutionar|seized|shot|protest)/i] },
  { id: 'as-nato-bab', yr: '2011', all: [/nato/i, /(air ?strike|bomb|missile)/i, /(bab|el)[\s\-]*(al|el)?[\s\-]*az[iz]+[iy]?a|tripoli/i] }
];
try {
  let tagged = 0; const per = {};
  for (const r of out) {
    const txt = (fulltext.get(r.i) || '') + '\n' + (r.t || '') + '\n' + (r.m || '');
    const head = txt.length > 60000 ? txt.slice(0, 60000) : txt;
    const add = [];
    for (const ru of EVENT_RULES) {
      if (ru.yr && !head.includes(ru.yr)) continue;
      const ry = +(r.d || '').slice(0, 4);
      const front = (r.t || '') + ' ' + (r.m || '');
      // Precision first: a dated record must fall within a year of the event; an undated one must name it in its title or summary.
      if (ru.yr && (ry ? Math.abs(ry - +ru.yr) > 1 : !ru.all.every((re) => re.test(front)))) continue;
      if (ru.all.every((re) => re.test(head)) && !(r.p || []).includes(ru.id)) { add.push(ru.id); per[ru.id] = (per[ru.id] || 0) + 1; }
    }
    if (add.length) { r.p = [...add, ...(r.p || [])].slice(0, 12); tagged++; }
  }
  console.log('event-tagged records', tagged, per);
} catch (e) { console.log('event tags skipped', e.message); }
out.sort((a, b) => (a.d || '9999').localeCompare(b.d || '9999') || a.i.localeCompare(b.i));
// Drop undefined keys to keep the file small
const clean = out.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length))));
await writeFile(ROOT + 'public/data/records.js', '/* Generated by scripts/build-archive.mjs — do not edit by hand. */\nwindow.ATLAS_RECORDS = ' + JSON.stringify(clean) + ';\n');
await rm(ROOT + 'public/data/docs', { recursive: true, force: true });
await mkdir(ROOT + 'public/data/docs', { recursive: true });
for (const [id, t] of fulltext) await writeFile(ROOT + 'public/data/docs/' + id + '.txt', t);
const byType = {}; clean.forEach((r) => { byType[r.y] = (byType[r.y] || 0) + 1; });
console.log('records', clean.length, byType, 'full texts', fulltext.size);
