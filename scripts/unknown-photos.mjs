// Finds a freely licensed picture (photo or drawing) for each entity in The Unknown, from Wikipedia / Wikimedia Commons.
// Only files hosted on Commons are used (non-free "fair use" uploads live on en.wikipedia and are skipped).
// People, organisations and events must have a Wikipedia article that mentions Libya or Gaddafi, so a namesake is not picked.
// Output: archive/unknown/photos.json  { nodeId: { page, title, img?: { thumb, file, url, lic, artist } } }
import fs from 'fs';
const src = fs.readFileSync('public/data/unknown.js', 'utf8');
const D = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
const UA = { 'User-Agent': 'TripoliOpenSource/1.0 (https://github.com/gelnagar/libya-project; family history map)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(url, { headers: UA }); if (r.status === 429) { await sleep(3000 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1500); }
  }
  return null;
}
const W = 'https://en.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*&';
const LIBYA = /Libya|Qadh?d?h?afi|Gaddafi|Gadhafi|Qaddafi|Lockerbie|Tripoli/i;
const strip = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
async function page(title) {
  const j = await get(W + 'action=query&redirects=1&prop=pageimages|extracts|pageprops|info&inprop=url&piprop=name&explaintext=1&titles=' + encodeURIComponent(title));
  const p = j && j.query && j.query.pages && j.query.pages[0];
  if (!p || p.missing || p.invalid) return null;
  if (p.pageprops && 'disambiguation' in p.pageprops) return null;
  return p;
}
async function search(q) {
  const j = await get(W + 'action=query&list=search&srlimit=3&srsearch=' + encodeURIComponent(q));
  return (j && j.query && j.query.search || []).map((x) => x.title);
}
async function commons(file) {
  const j = await get('https://commons.wikimedia.org/w/api.php?format=json&formatversion=2&origin=*&action=query&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=360&titles=' + encodeURIComponent('File:' + file));
  const p = j && j.query && j.query.pages && j.query.pages[0];
  if (!p || p.missing || !p.imageinfo) return null;
  const ii = p.imageinfo[0], m = ii.extmetadata || {};
  const lic = strip(m.LicenseShortName && m.LicenseShortName.value);
  if (!lic || /fair use|non-free/i.test(lic)) return null;
  return { thumb: ii.thumburl, file, url: ii.descriptionurl, lic, artist: strip(m.Artist && m.Artist.value).slice(0, 120) || 'Unknown author' };
}
const out = {};
let found = 0, pics = 0;
for (const n of D.nodes) {
  if (n.kind === 'mapped') continue;
  const strict = !['state', 'place'].includes(n.kind);
  const names = [n.name, ...(n.aka || [])].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 3);
  let p = null;
  for (const t of names) { p = await page(t); await sleep(150); if (p && (!strict || LIBYA.test(p.extract || ''))) break; p = null; }
  if (!p && strict && n.kind !== 'unknown') {
    const last = n.name.split(/\s+/).pop().toLowerCase();
    for (const t of await search(n.name + ' Libya')) {
      if (!t.toLowerCase().includes(last)) continue;
      p = await page(t); await sleep(150);
      if (p && LIBYA.test(p.extract || '')) break; p = null;
    }
  }
  if (!p) continue;
  found++;
  const rec = { page: p.fullurl, title: p.title };
  if (p.pageimage) { const c = await commons(p.pageimage); await sleep(150); if (c) { rec.img = c; pics++; } }
  out[n.id] = rec;
  console.log(n.name, '->', p.title, rec.img ? '(picture)' : '');
}
fs.mkdirSync('archive/unknown', { recursive: true });
fs.writeFileSync('archive/unknown/photos.json', JSON.stringify(out, null, 1));
console.log('articles', found, 'free pictures', pics, 'of', D.nodes.length);
