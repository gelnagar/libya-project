// Finds speeches given in Tripoli in the texts already stored (no AI calls, no network), with where each was given
// exactly as the source says, and where its transcript sits in the stored text.
//   node scripts/build-speeches.mjs
// Reads  archive/fbis/*.txt, archive/gov/*.txt, archive/crest/docs*.jsonl.gz
// Writes archive/review/speeches.json
// How: FBIS and JPRS translators opened each speech with a bracketed description, for example
//   [Speech by Libyan Leader Mu'ammar al-Qadhdhafi at a workers rally at Al-Khadra Square in Tripoli ... --live]
// That description is the only evidence used for the speaker and the place. If it says "place not given", or names
// no place, the speech is counted but not listed as a Tripoli speech. A venue is recorded only when the description
// names one (a square, hall, base, university...); otherwise the entry reads "Tripoli, venue not stated".
import fs from 'node:fs'; import zlib from 'node:zlib'; import vm from 'node:vm'; import crypto from 'node:crypto';

const fold = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’'`ʿʾ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const tidy = (t) => String(t || '').replace(/-\s{2,}/g, '').replace(/\s+/g, ' ').trim();
const W = {}; for (const f of ['public/data/sites.js', 'public/data/areas.js']) { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(f, 'utf8'), c); Object.assign(W, c.window); }
const PLACES = [...(W.ATLAS_SITES || []), ...(W.ATLAS_AREAS || [])];
// spellings the translators used (as folded text) for places already on the map, by map id. Only these are linked:
// a venue is never matched to a pin by loose resemblance.
const SPELL = [[/kh[a-z]{1,2}dra square|green square|martyrs square/, 'green'], [/uqbah? (ibn|bin|ben) nafi|okba ben nafi|wheelus|mu ?aytiqah air/, 'wheelus'],
  [/bab al ?aziziy|aziziyah barracks|aziziyah camp/, 'bab'], [/al ?fatih university|fatih university|university of tripoli|tripoli university/, 'fateh'],
  [/tripoli international airport/, 'lm-tripoli-international-airport'], [/11 june stadium/, 'lb-tripoli-international-stadium']];
function pinFor(text) {
  const f = fold(text);
  for (const [said, id] of SPELL) if (said.test(f)) { const p = PLACES.find((x) => x.id === id); if (p) return { id: p.id, name: p.name }; }
  return null;
}

const KIND = /\[\s*((?:Friday\s+)?(?:Speech|Address|Sermon|Remarks|Lecture|Khutbah))\b([^\]]{12,600})\]/gi;
const ELSEWHERE = /\b(Benghazi|Banghazi|Surt|Sirte|Sabha|Sebha|Tubruq|Tubruk|Tobruk|Misrata[h]?|Brak|Al-Bayda|Bayda|Darnah|Derna|Az-Zawiyah|Zawiyah|Gharyan|Ajdabiya|Al-Kufrah|Kufrah|Jabal al-Akhdar|Qaryunis|Garyounis|Ghadamis|Hun|Al-Jufrah|Niamey|Lagos|Cairo|Damascus|Algiers|Tunis|Baghdad|Beirut|Moscow|Addis Ababa|Khartoum|Rabat|Valletta|Kampala|Nairobi|Aden|Sanaa|New York|Belgrade|Havana|Tehran|Kuwait|Amman|Riyadh|Ouagadougou|Ndjamena|N'Djamena|Accra|Freetown|Monrovia|Dakar|Bamako|Conakry|Luanda|Maputo|Harare|Lusaka|Dar es Salaam|Madrid|Paris|Rome|Vienna|Athens|Sofia|Warsaw|Prague|Budapest|Bucharest|Pyongyang|Beijing|Peking|New Delhi|Islamabad|Kabul)\b/i;
const VENUE_WORD = /department|ministry|embassy|bureau|office\b|building|square|hall|universit|college|institute|school|air ?base|airbase|\bbase\b|barracks|camp|cent(?:er|re)|stadium|sports city|mosque|palace|theat|club|port\b|airport|hotel|street|avenue|academy|hospital|fair|compound|headquarters|secretariat building|congress hall/i;
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function broadcastDate(before) { // "... 1846 GMT 30 Sep 81" on the source line above the speech
  const m = [...before.matchAll(/GMT\s+(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{2})\b/g)].pop(); if (!m) return '';
  const mo = MONTHS[m[2].toLowerCase()]; if (!mo) return '';
  const y = +m[3] + (+m[3] < 30 ? 2000 : 1900);
  return y + '-' + String(mo).padStart(2, '0') + '-' + String(+m[1]).padStart(2, '0');
}
function headline(before) { // nearest line in capitals above the description
  const lines = before.split('\n').map((l) => l.trim()).filter(Boolean).reverse();
  for (const l of lines.slice(0, 12)) if (l.length >= 12 && l.length <= 120 && l === l.toUpperCase() && /[A-Z]{4}/.test(l) && !/GMT/.test(l)) return l.replace(/\s+/g, ' ');
  return '';
}
function where(desc) {
  const d = tidy(desc);
  if (/place not given|location not given|place not specified/i.test(d)) return { place: 'not given', note: 'The source says the place was not given.' };
  const pin = pinFor(d), tri = /\bTripoli\b|\bTarabulus\b/i.test(d);
  if (!tri && !pin) return ELSEWHERE.test(d) ? { place: 'elsewhere' } : { place: 'not stated', note: 'The description names no place.' };
  if (!tri && pin && ELSEWHERE.test(d)) return { place: 'elsewhere' };
  // the words that say where, taken as written
  let said = '';
  const m1 = /\b(?:at|in|from|outside)\s+((?:the\s+|a\s+|an\s+)?[^,;\]]{3,110}?)\s*,?\s+in\s+Tripoli\b/i.exec(d), m2 = /\bat\s+(Tripoli's\s+[^,;\]]{3,80}?)(?=\s+(?:on|during|to|marking|in|for|at)\b|\s*[,;]|\s*--|$)/i.exec(d);
  if (m2) said = m2[1]; else if (m1) said = m1[1];
  if (pin && !pinFor(said)) { // the stretch of the description that names the place on the map
    const sp = SPELL.find((x) => x[1] === pin.id)[0], words = d.split(/\s+/); said = '';
    for (let n = 2; n <= 6 && !said; n++) for (let i = 0; i + n <= words.length; i++) { const w = words.slice(i, i + n).join(' '); if (sp.test(fold(w))) { said = w.replace(/[,;.]+$/, ''); break; } }
  }
  // "a workers rally at Al-Khadra Square" names an occasion and a venue: the venue is the last part that reads as a place
  let occasion = '';
  const parts = said.split(/\s+(?:held\s+)?(?:at|in|outside)\s+/i);
  if (parts.length > 1) { const last = parts[parts.length - 1]; if (VENUE_WORD.test(last) || pinFor(last)) { occasion = parts.slice(0, -1).join(' at '); said = last; } }
  const venue = said && (VENUE_WORD.test(said) || pinFor(said)) ? said.trim() : '';
  if (!venue) occasion = said;
  return { place: 'tripoli', venue, occasion, pin: venue ? pinFor(venue) : null };
}
function speaker(desc) {
  const m = /\bby\s*\(?(.+?)(?=\s+(?:at|in|to|on|before|during|from|delivered|marking|addressing|opening|closing|outside)\b|[,;]|\s--|$)/i.exec(tidy(desc));
  return m ? m[1].trim() : '';
}

const found = new Map(); const tally = { descriptions: 0, tripoli: 0, elsewhere: 0, 'not given': 0, 'not stated': 0 };
function scan(text, src) {
  KIND.lastIndex = 0; let m; const hits = [];
  while ((m = KIND.exec(text))) hits.push({ i: m.index, end: m.index + m[0].length, kind: tidy(m[1]), desc: tidy(m[2]), raw: tidy(m[0]) });
  hits.forEach((h, n) => {
    tally.descriptions++;
    const w = where(h.desc); tally[w.place]++;
    if (w.place !== 'tripoli') return;
    const before = text.slice(Math.max(0, h.i - 700), h.i);
    // the transcript runs to the next item: the next source line ("LD302020 Tripoli JANA ... GMT ...") or the next speech
    const rest = text.slice(h.end), nextSrc = rest.search(/\n\s*[A-Z]{2}\d{6}\s+[^\n]{0,120}GMT/), nextHit = n + 1 < hits.length ? hits[n + 1].i - h.end : -1;
    let len = Math.min(...[rest.length, nextSrc < 0 ? Infinity : nextSrc, nextHit < 0 ? Infinity : nextHit, 120000]);
    if (nextSrc >= 0 && len === nextSrc) { const cut = rest.slice(0, len).lastIndexOf('\n\n'); if (cut > len - 400 && cut > 0) len = cut; } // drop the next item's headline
    const body = rest.slice(0, len).trim();
    const date = broadcastDate(before) || (src.date && +src.date.slice(0, 4) <= 2011 ? src.date : '');
    const key = fold(h.desc).slice(0, 70) + '|' + date.slice(0, 7);
    const item = { ...src, start: h.end, chars: body.length, opening: tidy(body.slice(0, 700)) };
    const g = found.get(key);
    if (g) { if (!g.sources.some((s) => s.ref === src.ref)) g.sources.push(item); if (body.length > g.chars) { g.chars = body.length; } return; }
    found.set(key, { kind: h.kind.toLowerCase(), speaker: speaker(h.desc), date, dateIs: broadcastDate(before) ? 'broadcast' : (date ? 'catalogue' : ''), headline: headline(before), description: h.raw,
      venue: w.venue, occasion: w.occasion, pin: w.pin, chars: body.length, sources: [item] });
  });
}

let files = 0;
for (const dir of ['archive/fbis', 'archive/gov']) for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith('.txt')).sort() : []) {
  const t = fs.readFileSync(`${dir}/${f}`, 'utf8'), head = t.split('\n');
  scan(t, { ref: `${dir}/${f}`, title: tidy(head[0]).slice(0, 160), url: /^https?:/.test(head[1] || '') ? head[1].trim() : '', date: (/^(\d{4}-\d\d-\d\d)/.exec(f) || [])[1] || '', rights: 'U.S. government translation, public domain' }); files++;
}
for (const f of ['docs', 'docs-other']) { const p = `archive/crest/${f}.jsonl.gz`; if (!fs.existsSync(p)) continue;
  for (const l of zlib.gunzipSync(fs.readFileSync(p)).toString().split('\n')) { if (!l) continue; const d = JSON.parse(l); if (!d.text || d.src === 'wikipedia') continue;
    scan(d.text, { ref: d.id, title: tidy(d.title).slice(0, 160), url: d.cia || d.url || d.ia || '', date: d.date || '', rights: 'U.S. government work, public domain' }); files++; } }

const out = [...found.values()].map((s) => ({ id: crypto.createHash('sha1').update(s.description + s.date).digest('hex').slice(0, 12), ...s, transcript: s.chars >= 600 }))
  .sort((a, b) => (a.date || '9') < (b.date || '9') ? -1 : 1);
fs.mkdirSync('archive/review', { recursive: true });
fs.writeFileSync('archive/review/speeches.json', JSON.stringify(out, null, 1));
const withVenue = out.filter((s) => s.venue), onMap = {};
out.forEach((s) => { if (s.pin) onMap[s.pin.name] = (onMap[s.pin.name] || 0) + 1; });
console.log(`texts scanned: ${files}; speech descriptions: ${tally.descriptions} (Tripoli ${tally.tripoli}, elsewhere ${tally.elsewhere}, place not given ${tally['not given']}, no place named ${tally['not stated']})`);
console.log(`Tripoli speeches after merging copies: ${out.length}; with a stated venue: ${withVenue.length}; with a transcript: ${out.filter((s) => s.transcript).length}; venue already on the map: ${JSON.stringify(onMap)}`);
