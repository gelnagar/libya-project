// Check whether real document/print pages are served (vs. the home page) to an honest, polite client.
import fs from 'node:fs';
const UA = 'TripoliOpenSource-research/1.0 (historical research; contact gsea2020@mymail.pomona.edu)';
const H = { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'accept-language': 'en-US,en;q=0.9' };
const urls = [
  'https://www.cia.gov/readingroom/document/cia-rdp79t00975a019600020002-1',
  'https://www.cia.gov/readingroom/print/2013627',
  'https://www.cia.gov/readingroom/node/470611',
  'https://www.cia.gov/readingroom/docs/situation%20report%20as%20of%2022%5B15439799%5D.pdf',
  'https://www.cia.gov/sitemap/sitemap-0.xml',
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
fs.mkdirSync('archive/crest/test', { recursive: true });
for (const [i, u] of urls.entries()) {
  if (i) await sleep(10500);
  try {
    const r = await fetch(u, { headers: H, redirect: 'follow' });
    const buf = Buffer.from(await r.arrayBuffer());
    const t = buf.toString('utf8');
    const rec = { u, status: r.status, finalUrl: r.url, type: r.headers.get('content-type'), bytes: buf.length,
      title: (t.match(/<title>([^<]*)<\/title>/i) || [])[1], canonical: (t.match(/rel="canonical" href="([^"]+)"/) || [])[1],
      isHome: /canonical" href="\/readingroom\/home"/.test(t), libya: /liby|tripoli|qadhaf/i.test(t),
      pdfs: [...new Set([...t.matchAll(/href="([^"]+\.pdf)"/gi)].map((m) => m[1]))].slice(0, 3),
      setCookie: r.headers.get('set-cookie')?.slice(0, 120), server: r.headers.get('server'),
      readingroomInSitemap: (t.match(/readingroom/g) || []).length };
    out.push(rec);
    fs.writeFileSync(`archive/crest/test/${i}.${/pdf/.test(rec.type || '') ? 'pdf' : 'html'}`, buf.subarray(0, 600000));
  } catch (e) { out.push({ u, error: String(e) }); }
}
fs.writeFileSync('archive/crest/test.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
