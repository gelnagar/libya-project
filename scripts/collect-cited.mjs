// F3: give every cited source a fetch date and a checksum. Fetches each source in archive/model/sources.json that has no
// stored copy, free (no paid reader), politely (scripts/lib/fetcher.mjs: robots.txt, delay, named User-Agent).
//   node scripts/collect-cited.mjs [--limit N] [--host example.org] [--retry]
// What is kept:
//   archive/model/fetched.json   TRACKED. { "<url>": { fetched, sha256, chars, kind, status } }: the record that a page was read
//                                on a date and what its text hashed to. No page text.
//   archive/cited-cache/<id>.txt GIT-IGNORED. The text itself, so quotations can be checked on this machine. Most of these pages
//                                are copyrighted (Amnesty, HRW, press); publishing their full text in a public repository is not
//                                ours to do, so the repository holds the checksum and the Wayback link, not the text.
// build-claims.mjs reads fetched.json (via provenance.mjs) and marks such a source "checksummed, text not published".
// Sources that cannot be fetched are recorded with status (blocked or missing), so the gap is a fact, not a silence.
import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
import { get, strip, checksum } from './lib/fetcher.mjs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const limit = +arg('--limit') || 1e9, onlyHost = arg('--host'), retry = process.argv.includes('--retry');
const sources = JSON.parse(fs.readFileSync('archive/model/sources.json', 'utf8'));
const FILE = 'archive/model/fetched.json'; const done = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
fs.mkdirSync('archive/cited-cache', { recursive: true });
const save = () => fs.writeFileSync(FILE, JSON.stringify(done, null, 1));

// OpenStreetMap pages are the live map, not a document; they are cited as the place of a present-day feature.
const SKIP = /(^|\.)openstreetmap\.org$/;
const todo = sources.filter((s) => !s.stored && /^https?:\/\//.test(s.url || '') && !SKIP.test(new URL(s.url).hostname) && (!onlyHost || s.url.includes(onlyHost)) && (retry || !done[s.url])).slice(0, limit);
console.log(`${todo.length} sources to fetch`);
let ok = 0, miss = 0;
for (const s of todo) {
  const isPdf = /\.pdf($|\?)/i.test(s.url);
  const buf = await get(s.url, { as: 'buf', gap: 2000 });
  const at = new Date().toISOString().slice(0, 10);
  if (!buf || !buf.length) { done[s.url] = { fetched: at, status: 'not retrievable (blocked by robots.txt, missing, or refused)' }; miss++; console.log('MISS', s.url); save(); continue; }
  let text = '', kind = 'html';
  if (isPdf || buf.slice(0, 4).toString() === '%PDF') {
    kind = 'pdf'; const tmp = `archive/cited-cache/${s.id}.pdf`; fs.writeFileSync(tmp, buf);
    try { text = execFileSync('pdftotext', ['-layout', tmp, '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }); } catch { text = ''; } fs.rmSync(tmp, { force: true });
  } else text = strip(buf.toString('utf8'));
  text = text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  if (text.length < 200) { done[s.url] = { fetched: at, status: 'fetched but no readable text (script-built page or scanned file)', kind, bytes: buf.length }; miss++; console.log('THIN', s.url); save(); continue; }
  fs.writeFileSync(`archive/cited-cache/${s.id}.txt`, `${s.url}\nFetched: ${at}\n\n${text}`);
  done[s.url] = { fetched: at, sha256: checksum(text), chars: text.length, kind, status: 'ok' }; ok++;
  console.log('OK  ', String(text.length).padStart(7), s.url.slice(0, 90)); if (ok % 10 === 0) save();
}
save(); console.log(`done: ${ok} fetched with text, ${miss} recorded as not retrievable`);
