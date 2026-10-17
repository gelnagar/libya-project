// Lists links on a few government pages so the collector knows what to download. Writes archive/probe2.json.
import { writeFile } from 'node:fs/promises';
const PAGES = [
  'https://www.reaganlibrary.gov/libya-bombing',
  'https://www.bush41library.gov/digital-research-room/finding-aid/foia/records-us-libya-relations',
  'https://www.cia.gov/readingroom/node/347175',
  'https://www.cia.gov/readingroom/search/site/%22Near%20East%2FNorth%20Africa%20Report%22%20Libya',
  'https://www.cia.gov/readingroom/search/site/Libya%20Tripoli%20Qadhafi%20JPRS',
  'https://www.cia.gov/readingroom/collection/crest-25-year-program-archive'
];
const out = {};
for (const u of PAGES) {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (research archive; github.com/gelnagar/libya-project)' }, signal: AbortSignal.timeout(30000) });
    const t = await r.text();
    const links = [...t.matchAll(/href="([^"#]+)"[^>]*>([^<]{0,140})/g)].map((m) => [m[1], m[2].replace(/\s+/g, ' ').trim()]).filter(([h, x]) => /\.pdf|readingroom\/document|digitallibrary|libya|jprs|near east|docs\//i.test(h + x));
    out[u] = { status: r.status, length: t.length, title: (/<title>([^<]*)/.exec(t) || [])[1], links: links.slice(0, 150) };
  } catch (e) { out[u] = { error: e.message }; }
}
await writeFile('archive/probe2.json', JSON.stringify(out, null, 1));
console.log(Object.entries(out).map(([u, v]) => u + ' ' + (v.status || v.error) + ' links=' + (v.links || []).length).join('\n'));
