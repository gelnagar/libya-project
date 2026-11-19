// One polite downloader for every collector.
//   import { get, saveDocs, loadDocs, record, TRIPOLI } from './lib/fetcher.mjs';
// What it guarantees:
//   - one User-Agent that names the project and where to reach it (the repository; never a personal address)
//   - robots.txt is read once per host and obeyed, including Crawl-delay
//   - at least `gap` ms between requests to the same host (default 1500)
//   - 429 and 5xx are retried, waiting as long as Retry-After asks (capped at 2 minutes), at most 4 times
//   - every stored document carries the address it came from, when it was fetched and a checksum of its text
import fs from 'node:fs'; import zlib from 'node:zlib'; import crypto from 'node:crypto';

export const UA = 'TripoliOpenSource/1.1 (+https://github.com/gelnagar/libya-project; historical research)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hosts = new Map(); // host -> { rules, delay, last }
export const stats = { requests: 0, blocked: 0, retried: 0, failed: 0 };

function parseRobots(txt) {
  const groups = []; let cur = null;
  for (const raw of String(txt).split('\n')) {
    const line = raw.replace(/#.*/, '').trim(); const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { if (!cur || cur.rules.length || cur.delay != null) { cur = { agents: [], rules: [], delay: null }; groups.push(cur); } cur.agents.push(v.toLowerCase()); }
    else if (cur && (k === 'disallow' || k === 'allow')) cur.rules.push([k === 'allow', v]);
    else if (cur && k === 'crawl-delay' && !isNaN(+v)) cur.delay = +v * 1000;
  }
  const mine = groups.find((g) => g.agents.some((a) => a !== '*' && UA.toLowerCase().includes(a))) || groups.find((g) => g.agents.includes('*'));
  return mine || { rules: [], delay: null };
}
function allowed(rules, path) { // longest matching rule wins, as search engines read it
  let best = null;
  for (const [allow, pat] of rules) { if (!pat) continue;
    const rx = new RegExp('^' + pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (rx.test(path) && (!best || pat.length > best[1].length)) best = [allow, pat]; }
  return best ? best[0] : true;
}
async function hostState(u, gap) {
  let h = hosts.get(u.host);
  if (!h) {
    h = { rules: [], delay: gap, last: 0 }; hosts.set(u.host, h);
    try { const r = await fetch(u.origin + '/robots.txt', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
      if (r.ok) { const p = parseRobots(await r.text()); h.rules = p.rules; if (p.delay) h.delay = Math.max(gap, Math.min(p.delay, 30000)); } } catch {}
    h.last = Date.now();
  }
  return h;
}

/** Fetch one address. as: 'text' | 'json' | 'buf'. Returns null when robots.txt forbids it, on 404, or after the retries run out. */
export async function get(url, { as = 'text', gap = 1500, headers = {}, timeout = 90000, robots = true } = {}) {
  const u = new URL(url), h = await hostState(u, gap);
  if (robots && !allowed(h.rules, u.pathname + u.search)) { stats.blocked++; return null; }
  for (let k = 0; k < 4; k++) {
    const wait = h.last + h.delay - Date.now(); if (wait > 0) await sleep(wait);
    h.last = Date.now(); stats.requests++;
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(timeout) });
      if (r.ok) return as === 'json' ? await r.json() : as === 'buf' ? Buffer.from(await r.arrayBuffer()) : await r.text();
      if (r.status === 404 || r.status === 410 || r.status === 403 || r.status === 401) return null;
      if (r.status === 429 || r.status >= 500) { const ra = +r.headers.get('retry-after'); stats.retried++; await sleep(Math.min(120000, ra > 0 ? ra * 1000 : 5000 * (k + 1))); continue; }
      return null;
    } catch { stats.retried++; await sleep(4000 * (k + 1)); }
  }
  stats.failed++; return null;
}

export const checksum = (text) => crypto.createHash('sha256').update(String(text)).digest('hex').slice(0, 32);
/** A stored document, in the shape scripts/crest-extract.mjs and scripts/build-review.mjs read. */
export function record({ id, src, title, date = '', url, text, rights, extra = {} }) {
  text = String(text || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  return { id, src, title: String(title || '').replace(/\s+/g, ' ').trim(), date, url, fetched: new Date().toISOString(), sha256: checksum(text), chars: text.length, rights, ...extra, text };
}
export function loadDocs(file) {
  const m = new Map(); if (!fs.existsSync(file)) return m;
  for (const l of zlib.gunzipSync(fs.readFileSync(file)).toString().split('\n')) { if (!l) continue; try { const d = JSON.parse(l); m.set(d.id, d); } catch {} }
  return m;
}
export function saveDocs(file, map) {
  fs.mkdirSync(file.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
  fs.writeFileSync(file, zlib.gzipSync([...map.values()].map((d) => JSON.stringify(d)).join('\n') + '\n'));
}
export const strip = (html) => String(html).replace(/<(script|style|head|nav|footer)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|h\d|li|tr)>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
  .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
/** Names that mark a text as being about a place in Tripoli (the same list crest-extract.mjs uses with ONLY=tripoli). */
export const TRIPOLI = /tripoli|aziziy|azizia|abu sal[ie]m|wheelus|mitiga|okba|uqba|tajou?ra|ain zara|janzur|gargaresh|ben ashour|hadba|green square|suq al|bab al/i;
/** Tripoli in Lebanon: a text that never names Libya and plainly points to Lebanon: "Tripoli, Lebanon" written out, Lebanon or
    Beirut in the title, or Lebanon named three or more times. A passing mention of Beirut is not enough: a President's Daily Brief
    of 13 Feb 1974 reports the Arab oil ministers' meeting in Tripoli, Libya, and quotes "the Kuwait Embassy in Beirut" without
    naming Libya once (found 19 Nov 2026 when the looser first version of this test set it aside). */
export const lebanonOnly = (t, title = '') => !/liby|qadh|qadd|gadd|gadh|jamahir/i.test(t + ' ' + title)
  && (/tripoli\W{1,4}(?:north(?:ern)?\s+)?leban/i.test(t) || /leban|beirut/i.test(title) || (t.match(/leban/gi) || []).length >= 3);
