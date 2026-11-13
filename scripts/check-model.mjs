// Checks the claim model against the stored source texts.
//   node scripts/check-model.mjs
// For every claim that carries a passage, finds the stored copy of its source and confirms the passage is in it,
// word for word (spacing aside). Reports claims whose source has no stored copy, and claims with no passage.
// Exit code 1 if any passage is missing from its stored source: that would be a quotation the archive cannot back.
import fs from 'node:fs'; import zlib from 'node:zlib';

const claims = JSON.parse(fs.readFileSync('archive/model/claims.json', 'utf8')), sources = new Map(JSON.parse(fs.readFileSync('archive/model/sources.json', 'utf8')).map((s) => [s.id, s]));
const norm = (t) => String(t || '').normalize('NFKC').replace(/[‎‏­]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

// stored texts, by the address they were fetched from
// (one address can have several stored copies, e.g. a whole volume and the Libya section cut from it)
const store = new Map(); const put = (u, text) => { if (!u || !text) return; const k = u.replace(/^http:/, 'https:').replace(/\/$/, ''); if (!store.has(k)) store.set(k, []); store.get(k).push(text); };
for (const lang of fs.existsSync('archive/wikipedia') ? fs.readdirSync('archive/wikipedia') : []) { const d = `archive/wikipedia/${lang}`; if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d)) if (f.endsWith('.json')) { try { const j = JSON.parse(fs.readFileSync(`${d}/${f}`, 'utf8')); put(j.url, j.text); put(decodeURI(j.url || ''), j.text); put(encodeURI(decodeURI(j.url || '')), j.text); } catch {} } }
for (const f of ['docs', 'docs-other']) { const p = `archive/crest/${f}.jsonl.gz`; if (!fs.existsSync(p)) continue;
  for (const l of zlib.gunzipSync(fs.readFileSync(p)).toString().split('\n')) { if (!l) continue; const d = JSON.parse(l); put(d.cia, d.text); put(d.ia, d.text); put(d.url, d.text); } }
for (const dir of ['archive/fbis', 'archive/gov', 'archive/countrystudy', 'archive/fulltext']) for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith('.txt')) : []) {
  const t = fs.readFileSync(`${dir}/${f}`, 'utf8'); for (const line of t.split('\n').slice(0, 4)) if (/^https?:\/\//.test(line.trim())) put(line.trim(), t); }

const res = { withPassage: 0, confirmed: 0, noStoredCopy: 0, missing: [] };
for (const c of claims) {
  if (!c.passage) continue; res.withPassage++;
  const s = sources.get(c.source), u = s && s.url ? s.url.replace(/^http:/, 'https:').replace(/\/$/, '') : '';
  const text = store.get(u) || store.get(decodeURI(u)) || store.get(u.split('#')[0]);
  if (!text) { res.noStoredCopy++; continue; }
  if (text.some((t) => norm(t).includes(norm(c.passage.text)))) res.confirmed++; else res.missing.push({ claim: c.id, subject: c.subject, url: u, passage: c.passage.text.slice(0, 90) });
}
const pins = claims.filter((c) => c.field === 'account' && c.subject.startsWith('site:'));
console.log(`claims ${claims.length}; with a passage ${res.withPassage}; passage confirmed in the stored source ${res.confirmed}; source has no stored copy ${res.noStoredCopy}; passage NOT in the stored source ${res.missing.length}`);
console.log(`pin claims without a recorded passage: ${pins.filter((c) => !c.passage).length} of ${pins.length} (these cite a source but the supporting words were never stored)`);
res.missing.slice(0, 10).forEach((m) => console.log('  MISSING', m.subject, m.url, '|', m.passage));
fs.writeFileSync('archive/model/check.json', JSON.stringify({ at: new Date().toISOString(), ...res, missing: res.missing }, null, 1));
if (res.missing.length) process.exit(1);
