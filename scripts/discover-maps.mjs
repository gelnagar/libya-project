// Searches open GeoBlacklight map catalogues (Princeton via UW–Milwaukee, NYU, Berkeley/Stanford) for
// historical maps covering Tripoli and records title, date, footprint, rights and download/service links.
// Output: archive/maps/discovered.json
import { writeFile, mkdir } from 'node:fs/promises';
const UA = 'TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project)';
const BASES = ['https://geodiscovery.uwm.edu', 'https://geo.nyu.edu', 'https://geodata.lib.berkeley.edu', 'https://earthworks.stanford.edu', 'https://geo.btaa.org'];
const QUERIES = ['tripoli libya', 'tripoli tripolitania', 'tarabulus', 'tripoli city plan', 'tripoli G.S.G.S.', 'tripolitania', 'libya city plans', 'libya 1:50,000', 'libya 1:250,000', 'jamahiriya atlas'];
const T = { lon0: 12.9, lon1: 13.5, lat0: 32.6, lat1: 33.0 }; // Tripoli area
const out = new Map();
function bboxOf(d) {
  const g = d.locn_geometry || d.solr_geom || d.dcat_bbox || '';
  const m = /ENVELOPE\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/i.exec(Array.isArray(g) ? g[0] : g);
  return m ? { w: +m[1], e: +m[2], n: +m[3], s: +m[4] } : null;
}
for (const base of BASES) for (const q of QUERIES) {
  for (let page = 1; page <= 3; page++) {
    try {
      const r = await fetch(`${base}/catalog.json?` + new URLSearchParams({ q, per_page: '100', page: String(page) }), { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) { console.log(base, q, r.status); break; }
      const j = await r.json();
      const docs = j.data || j.response?.docs || [];
      for (const it of docs) {
        const d = it.attributes ? Object.fromEntries(Object.entries(it.attributes).map(([k, v]) => [k, v?.attributes?.value ?? v])) : it;
        const id = it.id || d.id || d.layer_slug_s;
        if (!id || out.has(id)) continue;
        const b = bboxOf(d);
        const covers = b && Math.min(b.w, b.e) <= T.lon1 && Math.max(b.w, b.e) >= T.lon0 && Math.min(b.n, b.s) <= T.lat1 && Math.max(b.n, b.s) >= T.lat0;
        out.set(id, { id, base, title: d.dct_title_s || d.dc_title_s || d.title, date: d.gbl_indexYear_im || d.solr_year_i || d.dct_temporal_sm || d.dct_issued_s, bbox: b, coversTripoli: !!covers,
          rights: d.dct_accessRights_s || d.dc_rights_s, license: d.dct_license_sm || d.dct_rights_sm, provider: d.schema_provider_s || d.dct_provenance_s,
          refs: (() => { try { return JSON.parse(d.dct_references_s || '{}'); } catch { return d.dct_references_s; } })(), georeferenced: d.gbl_georeferenced_b, resourceType: d.gbl_resourceType_sm || d.layer_geom_type_s });
      }
      if (docs.length < 100) break;
    } catch (e) { console.log(base, q, e.message); break; }
  }
}
const all = [...out.values()];
await mkdir('archive/maps', { recursive: true });
await writeFile('archive/maps/discovered.json', JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), total: all.length, tripoli: all.filter((x) => x.coversTripoli), others: all.filter((x) => !x.coversTripoli).map((x) => ({ id: x.id, base: x.base, title: x.title, date: x.date, bbox: x.bbox })) }, null, 1));
console.log('found', all.length, 'covering Tripoli', all.filter((x) => x.coversTripoli).length);
