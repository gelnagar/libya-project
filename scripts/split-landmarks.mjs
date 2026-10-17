// Splits public/data/osm/landmarks.json into one file per kind of place, so the map can switch each on its own.
import { readFile, writeFile } from 'node:fs/promises';
export async function splitLandmarks(dir = 'public/data/osm/') {
  const src = JSON.parse(await readFile(dir + 'landmarks.json', 'utf8'));
  const cats = { hospitals: [], schools: [], govt: [], police: [], embassies: [], mosques: [], sights: [], cemeteries: [] };
  const seen = new Set();
  for (const f of src.features) {
    const t = f.t || {};
    const key = [t.name || t['name:en'] || '', (f.p || (f.g && f.g[0] && f.g[0][0]) || []).map((n) => n.toFixed ? n.toFixed(3) : n).join(',')].join('|');
    if (seen.has(key)) continue; seen.add(key);
    let c = null;
    if (t.amenity === 'hospital') c = 'hospitals';
    else if (t.amenity === 'university') c = 'schools';
    else if (t.amenity === 'police') c = 'police';
    else if (t.amenity === 'place_of_worship') c = 'mosques';
    else if (t.office === 'diplomatic' || /embassy|consulate/i.test(t['name:en'] || t.name || '')) c = 'embassies';
    else if (t.amenity === 'courthouse' || t.amenity === 'townhall' || t.office === 'government') c = 'govt';
    else if (t.landuse === 'cemetery' || t.amenity === 'grave_yard') c = 'cemeteries';
    else if (t.historic || t.tourism || t.aeroway === 'aerodrome' || t.leisure === 'stadium') c = 'sights';
    if (c) cats[c].push(f);
  }
  for (const [k, features] of Object.entries(cats)) {
    await writeFile(dir + k + '.json', JSON.stringify({ generated: src.generated, bbox: src.bbox, source: src.source, features }));
    console.log(k, features.length);
  }
}
if (process.argv[1] && process.argv[1].endsWith('split-landmarks.mjs')) await splitLandmarks();
