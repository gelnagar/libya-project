// Politeness probe: read robots.txt first, then fetch ONE search page and record what comes back.
import fs from 'node:fs';
const UA = 'TripoliOpenSource-research/1.0 (historical research; contact gsea2020@mymail.pomona.edu)';
const out = {};
async function get(u) {
  try {
    const r = await fetch(u, { headers: { 'user-agent': UA, accept: 'text/html,text/plain' }, redirect: 'follow' });
    const t = await r.text();
    return { status: r.status, type: r.headers.get('content-type'), length: t.length, body: t };
  } catch (e) { return { error: String(e) }; }
}
const robots = await get('https://www.cia.gov/robots.txt');
out.robots = { status: robots.status, length: robots.length, text: (robots.body || robots.error || '').slice(0, 6000) };
const s = await get('https://www.cia.gov/readingroom/search/site/Libya?page=1');
out.search = { status: s.status, type: s.type, length: s.length, head: (s.body || s.error || '').slice(0, 1500) };
if (s.body) {
  out.search.titles = [...s.body.matchAll(/<h3[^>]*class="[^"]*search-result[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)/gi)].slice(0, 20).map(m => [m[1], m[2].trim()]);
  out.search.docLinks = [...new Set([...s.body.matchAll(/href="(\/readingroom\/document\/[^"]+)"/g)].map(m => m[1]))].slice(0, 20);
  out.search.botWall = /captcha|access denied|akamai|incapsula|enable javascript/i.test(s.body);
}
fs.writeFileSync('archive/probe-crest.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out).slice(0, 3000));
