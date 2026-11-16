// Provenance and analyst grades for the claim model (used by build-claims.mjs and check-model.mjs).
//
// PROVENANCE: for each cited source, the stored copy of its text (where one exists), a checksum of that text,
// the fetch date when it was recorded, and an archived copy on the Wayback Machine when one has been looked up.
//
// GRADES follow the two-part system intelligence analysts use (the "Admiralty" or NATO system):
//   source reliability   A completely reliable · B usually reliable · C fairly reliable · D not usually reliable
//                        E unreliable · F reliability cannot be judged
//   information credibility   1 confirmed by other sources · 2 probably true · 3 possibly true · 4 doubtful
//                        5 improbable · 6 truth cannot be judged
// The grades written here are DEFAULTS FROM A RULE, marked `grade_basis: "rule"`. They say what kind of source
// this is and how the entry is corroborated; they are not an individual assessment. The owner can override any
// of them in archive/model/grades.json ({ "sources": { "<source id or host>": "B" }, "claims": { "<claim id>": 2 } }).
import fs from 'node:fs'; import zlib from 'node:zlib'; import crypto from 'node:crypto';

/* ---------- stored copies ---------- */
const keyOf = (u) => String(u || '').replace(/^http:/, 'https:').replace(/\/$/, '');
export function storedCopies() {
  const store = new Map();
  const put = (u, text, ref, fetched) => { if (!u || !text) return; for (const k of new Set([keyOf(u), keyOf(safe(decodeURI, u)), keyOf(safe(encodeURI, safe(decodeURI, u)))])) { if (!store.has(k)) store.set(k, []); store.get(k).push({ text, ref, fetched: fetched || null }); } };
  for (const lang of fs.existsSync('archive/wikipedia') ? fs.readdirSync('archive/wikipedia') : []) { const d = `archive/wikipedia/${lang}`; if (!fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d)) if (f.endsWith('.json')) { try { const j = JSON.parse(fs.readFileSync(`${d}/${f}`, 'utf8')); put(j.url, j.text, `${d}/${f}`, j.fetched); } catch {} } }
  for (const f of ['archive/crest/docs.jsonl.gz', 'archive/crest/docs-other.jsonl.gz', 'archive/cables/docs.jsonl.gz']) { if (!fs.existsSync(f)) continue;
    for (const l of zlib.gunzipSync(fs.readFileSync(f)).toString().split('\n')) { if (!l) continue; const d = JSON.parse(l); for (const u of [d.cia, d.ia, d.url]) put(u, d.text, `${f}#${d.id}`, d.fetched); } }
  for (const dir of ['archive/fbis', 'archive/gov', 'archive/countrystudy', 'archive/fulltext']) for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith('.txt')) : []) {
    const t = fs.readFileSync(`${dir}/${f}`, 'utf8'); for (const line of t.split('\n').slice(0, 4)) if (/^https?:\/\//.test(line.trim())) put(line.trim(), t, `${dir}/${f}`); }
  return { get: (u) => store.get(keyOf(u)) || store.get(keyOf(safe(decodeURI, u))) || store.get(keyOf(String(u || '').split('#')[0])) || null, size: store.size };
}
function safe(fn, v) { try { return fn(v); } catch { return v; } }
const sha = (t) => crypto.createHash('sha256').update(String(t)).digest('hex').slice(0, 32);

export function addProvenance(sources, store, wayback = {}, fetched = {}) {
  for (const s of sources) {
    const copies = s.url ? store.get(s.url) : null;
    if (copies) { const best = copies.slice().sort((a, b) => b.text.length - a.text.length)[0]; s.stored = best.ref; s.sha256 = sha(best.text); s.chars = best.text.length; s.fetched = best.fetched || null; s.copies = copies.length; }
    else { s.stored = null; s.sha256 = null; const f = s.url && fetched[s.url]; if (f && f.sha256) { s.sha256 = f.sha256; s.fetched = f.fetched; s.chars = f.chars; s.held = 'checksum only: text kept off the public repository (rights)'; } else if (f) s.fetch_status = f.status; }
    s.archived = s.url && /(^|\.)archive\.org$/.test(s.origin || '') ? s.url : (s.url && wayback[s.url]) || null;
  }
}

/* ---------- reliability: what kind of source is this ---------- */
const KINDS = [
  ['B', 'official record', /(^|\.)(cia\.gov|state\.gov|archives\.gov|af\.mil|nato\.int|opcw\.org|un\.org|ohchr\.org|refworld\.org|ecoi\.net|icc-cpi\.int|esteri\.it|awm\.gov\.au|navyhistory\.au|countrystudies\.us|lana\.gov\.ly|securitycouncilreport\.org)$/],
  ['B', 'human-rights organisation', /(^|\.)(amnesty\.org|amnestyusa\.org|hrw\.org|omct\.org|icj\.org|rsf\.org|msf\.hk|globaldetentionproject\.org|airwars\.org)$/],
  ['B', 'news organisation or journal', /(^|\.)(reuters\.com|screenocean\.com|washingtonpost\.com|nytimes\.com|bbc\.co\.uk|bbc\.com|nbcnews\.com|aljazeera\.com|aljazeera\.net|apnews\.com|theguardian\.com|aawsat\.com|cambridge\.org|nih\.gov|merip\.org|foreignpolicy\.com|usip\.org|atlanticcouncil\.org|jamestown\.org)$/],
  ['C', 'reference work', /(^|\.)(wikipedia\.org|globalsecurity\.org|jewishvirtuallibrary\.org|nti\.org|fas\.org|wisconsinproject\.org|armscontrolwonk\.com|ww2db\.com|temehu\.com)$/],
  ['C', 'testimony collection', /(^|\.)(tarikhi\.org|jewishrefugees\.org\.uk|libyanheritagehouse\.org)$/],
  ['C', 'community map (present-day features only)', /(^|\.)openstreetmap\.org$/],
  ['C', 'regional press or monitor', /(^|\.)(libyasecuritymonitor\.com|libya-analysis\.com|libyamonitor\.com|newarab\.com|timesofisrael\.com|gulfnews\.com|kuwaittimes\.com|mg\.co\.za|iol\.co\.za|africanews\.com|malaymail\.com|heraldnet\.com|zenith\.me)$/]
];
const BY_TITLE = [['B', 'official record', /\b(FBIS|JPRS|CIA|National Intelligence|Department of State|FRUS|Foreign Relations of the United States|Telegram From|UN OHCHR|UNSMIL|United Nations|Security Council)\b/i],
  ['B', 'human-rights organisation', /\b(Amnesty International|Human Rights Watch)\b/i]];
export function gradeSource(s, over = {}) {
  if (over[s.id] || over[s.origin]) return { reliability: over[s.id] || over[s.origin], source_kind: 'graded by the owner', grade_basis: 'owner' };
  // archive.org holds anything: grade by what the item is, read from its title or item name
  if (/(^|\.)archive\.org$/.test(s.origin || '')) return /FBIS|JPRS|Daily Report|cia-readingroom|ufiche|jprs/i.test((s.title || '') + ' ' + (s.url || '')) ? { reliability: 'B', source_kind: 'official record', grade_basis: 'rule' } : { reliability: 'F', source_kind: 'not classified', grade_basis: 'rule' };
  for (const [g, kind, rx] of KINDS) if (rx.test(s.origin || '')) return { reliability: g, source_kind: kind, grade_basis: 'rule' };
  for (const [g, kind, rx] of BY_TITLE) if (rx.test(s.title || '')) return { reliability: g, source_kind: kind, grade_basis: 'rule' };
  return { reliability: 'F', source_kind: 'not classified', grade_basis: 'rule' };
}

/* ---------- credibility: how well is this entry corroborated ---------- */
export function gradeClaims(claims, sources, over = {}) {
  const src = new Map(sources.map((s) => [s.id, s]));
  const origins = new Map(); // subject -> distinct origins rated B or better
  for (const c of claims) { const s = src.get(c.source); if (!s || !['A', 'B'].includes(s.reliability)) continue; if (!origins.has(c.subject)) origins.set(c.subject, new Set()); origins.get(c.subject).add(s.origin || s.id); }
  for (const c of claims) {
    const s = src.get(c.source); c.reliability = s ? s.reliability : null;
    if (over[c.id] != null) { c.credibility = over[c.id]; c.grade_basis = 'owner'; continue; }
    const n = origins.has(c.subject) ? origins.get(c.subject).size : 0;
    c.credibility = !c.source ? 6 : c.level === 'documented' || c.level === 'direct' ? (n >= 2 ? 1 : 2) : c.level === 'testimony' || c.level === 'reported' ? 3 : 6;
    c.grade_basis = 'rule';
  }
}
export const RELIABILITY = { A: 'Completely reliable', B: 'Usually reliable', C: 'Fairly reliable', D: 'Not usually reliable', E: 'Unreliable', F: 'Reliability cannot be judged' };
export const CREDIBILITY = { 1: 'Confirmed by other sources', 2: 'Probably true', 3: 'Possibly true', 4: 'Doubtful', 5: 'Improbable', 6: 'Truth cannot be judged' };
