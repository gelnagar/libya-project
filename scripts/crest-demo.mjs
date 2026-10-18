// CREST demo: robots-compliant (sitemap only, no /search/), one request at a time, >=10 s apart.
import fs from 'node:fs';
const UA = 'TripoliOpenSource-research/1.0 (historical research; contact gsea2020@mymail.pomona.edu)';
const BUDGET_MS = 5 * 60 * 1000, GAP = 10500, T0 = Date.now();
const OUT = 'archive/crest'; fs.mkdirSync(`${OUT}/demo-pages`, { recursive: true });
let last = 0; const log = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(u) {
  const wait = last + GAP - Date.now(); if (wait > 0) await sleep(wait);
  last = Date.now();
  const t = Date.now();
  try {
    const r = await fetch(u, { headers: { 'user-agent': UA }, redirect: 'follow' });
    const body = await r.text();
    log.push({ u, status: r.status, ms: Date.now() - t, len: body.length, type: r.headers.get('content-type') });
    return { status: r.status, body };
  } catch (e) { log.push({ u, error: String(e) }); return { status: 0, body: '' }; }
}
const left = () => BUDGET_MS - (Date.now() - T0);
const res = { started: new Date().toISOString() };
const locs = (x) => [...x.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

const idx = await get('https://www.cia.gov/readingroom/sitemap.xml');
fs.writeFileSync(`${OUT}/demo-sitemap-index.xml`, idx.body.slice(0, 200000));
res.index = { status: idx.status, isIndex: /<sitemapindex/i.test(idx.body), entries: locs(idx.body).length, first: locs(idx.body).slice(0, 5), last: locs(idx.body).slice(-3), tags: [...new Set([...idx.body.matchAll(/<([a-z:]+)[\s>]/gi)].map((m) => m[1]))].slice(0, 30) };

// Sample child sitemaps: first, middle, last
let docUrls = [];
if (res.index.isIndex) {
  const kids = locs(idx.body);
  res.children = [];
  for (const k of [kids[0], kids[Math.floor(kids.length / 2)], kids[kids.length - 1]].filter(Boolean)) {
    if (left() < 60000) break;
    const c = await get(k);
    const L = locs(c.body);
    res.children.push({ url: k, status: c.status, urls: L.length, bytes: c.body.length, sample: L.slice(0, 8), hasLastmod: /<lastmod>/.test(c.body), extraTags: [...new Set([...c.body.matchAll(/<([a-z:]+)[\s>]/gi)].map((m) => m[1]))] });
    if (!docUrls.length) fs.writeFileSync(`${OUT}/demo-child-sitemap.xml`, c.body.slice(0, 300000));
    docUrls.push(...L.filter((u) => /\/readingroom\/document\//.test(u)));
  }
} else {
  docUrls = locs(idx.body).filter((u) => /\/readingroom\/document\//.test(u));
}
res.docUrlsSeen = docUrls.length;

// Fetch sample document pages, spread across what we saw
const pick = []; const n = docUrls.length;
for (let i = 0; i < 40 && n; i++) pick.push(docUrls[Math.floor((i * n) / 40)]);
res.pages = [];
for (const u of pick) {
  if (left() < 15000) break;
  const p = await get(u);
  const b = p.body;
  const field = (lab) => { const m = b.match(new RegExp(lab + '[^<]*</div>\\s*<div[^>]*>\\s*(?:<div[^>]*>)?\\s*([^<]{1,200})', 'i')); return m ? m[1].trim() : null; };
  const title = (b.match(/<title>([^<]+)<\/title>/i) || [])[1];
  const bodyTxt = (b.match(/field-name-body[\s\S]*?<p>([\s\S]*?)<\/div>/i) || [])[1] || '';
  const pdf = (b.match(/href="([^"]+\.pdf)"/i) || [])[1];
  const rec = { u, status: p.status, title, docType: field('Document Type'), created: field('Document Creation Date'), pages: field('Document Page Count'), collection: field('Collection'), pdf, bodyChars: bodyTxt.replace(/<[^>]+>/g, '').length, bodyStart: bodyTxt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300), libya: /liby|tripoli|qadhaf|gadhaf|qaddaf/i.test(b) };
  res.pages.push(rec);
  if (res.pages.length <= 3) fs.writeFileSync(`${OUT}/demo-pages/${res.pages.length}.html`, b);
}
res.elapsedS = Math.round((Date.now() - T0) / 1000);
res.requests = log.length;
res.avgMs = Math.round(log.reduce((a, x) => a + (x.ms || 0), 0) / Math.max(1, log.length));
res.log = log;
fs.writeFileSync(`${OUT}/demo.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ ...res, log: undefined, pages: res.pages.length }, null, 1));
