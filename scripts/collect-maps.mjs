// Finds dated historical maps of Tripoli on Wikimedia Commons and the Library of Congress,
// records their licence, and downloads those that are public domain or openly licensed.
// Output: archive/maps/catalog.json and archive/maps/images/<id>.<ext>
import { writeFile, mkdir } from 'node:fs/promises';
const UA = 'TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project; research)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (u, asJson = true) => { const r = await fetch(u, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error(r.status + ' ' + u); return asJson ? r.json() : Buffer.from(await r.arrayBuffer()); };
await mkdir('archive/maps/images', { recursive: true });
const catalog = [];
const seen = new Set();

// 1. Wikimedia Commons
const queries = ['Tripoli map', 'Tripoli plan', 'Tripoli pianta', 'Tripolis Karte', 'Tripoli Libya map', 'Tarabulus map', 'Tripoli 1911', 'Tripoli 1912', 'Tripoli 1934', 'Tripoli 1943', 'Tripoli AMS', 'Tripoli city plan', 'Pianta di Tripoli', 'Tripoli topographic', 'Tripoli aerial', 'Tripoli 1986 map', 'Wheelus', 'Tripoli Libya satellite 1980', 'خريطة طرابلس'];
for (const q of queries) {
  const j = await get('https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', generator: 'search', gsrsearch: q + ' filetype:bitmap', gsrnamespace: '6', gsrlimit: '50', prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '3000' }));
  for (const p of j.query?.pages || []) {
    if (seen.has(p.title)) continue; seen.add(p.title);
    const ii = p.imageinfo?.[0]; if (!ii) continue;
    const m = ii.extmetadata || {};
    const val = (k) => (m[k]?.value || '').replace(/<[^>]+>/g, '').trim();
    catalog.push({ id: 'wmc-' + p.pageid, source: 'Wikimedia Commons', title: p.title.replace(/^File:/, ''), page: ii.descriptionurl, url: ii.url, thumb: ii.thumburl, width: ii.width, height: ii.height,
      date: val('DateTimeOriginal') || val('DateTime'), author: val('Artist'), license: val('LicenseShortName'), usage: val('UsageTerms'), description: val('ImageDescription').slice(0, 600), categories: val('Categories').slice(0, 400) });
  }
  await sleep(300);
}
// 2. Library of Congress maps
for (const q of ['tripoli libya', 'tripoli tripolitania', 'tarabulus']) {
  try {
    const j = await get('https://www.loc.gov/maps/?' + new URLSearchParams({ q, fo: 'json', c: '100' }));
    for (const r of j.results || []) {
      if (seen.has(r.id)) continue; seen.add(r.id);
      catalog.push({ id: 'loc-' + (r.id || '').split('/').filter(Boolean).pop(), source: 'Library of Congress', title: r.title, page: r.id, url: (r.image_url || []).slice(-1)[0] || null, date: r.date, author: (r.contributor || []).join('; '),
        license: (r.rights_advisory || []).join(' ') || 'No known restrictions on publication (check)', description: (r.description || []).join(' ').slice(0, 600), subjects: (r.subject || []).join('; ').slice(0, 300) });
    }
  } catch (e) { console.warn(e.message); }
  await sleep(500);
}
// keep only things that look like maps of the Tripoli area
const mapLike = (c) => /map|plan|pianta|karte|carta|topogra|chart|survey|aerial|خريطة|town|city/i.test(c.title + ' ' + c.description + ' ' + (c.categories || '') + ' ' + (c.subjects || '')) && /tripol|tarabul|طرابلس|wheelus|mellaha|tagiura|tajura|zanzur|janzur/i.test(c.title + ' ' + c.description + ' ' + (c.categories || '') + ' ' + (c.subjects || ''));
const maps = catalog.filter(mapLike);
const free = (c) => /public domain|^pd|cc0|cc[- ]by|no known restrictions/i.test(c.license + ' ' + c.usage);
for (const c of maps) {
  c.reusable = free(c);
  if (!c.reusable || !c.url) continue;
  const src = c.thumb || c.url;
  const ext = (src.match(/\.(jpe?g|png|gif|tiff?)(?:$|\?)/i) || [, 'jpg'])[1].toLowerCase().replace('jpeg', 'jpg');
  if (/tiff?/.test(ext) && !c.thumb) continue;
  try { const b = await get(src, false); if (b.length < 40e6) { await writeFile(`archive/maps/images/${c.id}.${ext}`, b); c.file = `${c.id}.${ext}`; c.bytes = b.length; } } catch (e) { console.warn(e.message); }
  await sleep(400);
}
await writeFile('archive/maps/catalog.json', JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), all: catalog.length, maps }, null, 1));
console.log('catalog', catalog.length, 'maps', maps.length, 'downloaded', maps.filter((m) => m.file).length);
