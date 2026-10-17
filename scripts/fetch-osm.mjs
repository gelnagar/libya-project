// Downloads present-day OpenStreetMap layers for greater Tripoli into public/data/osm/*.json.
// Run by .github/workflows/osm-data.yml (monthly and on demand). Node 20+.
import { writeFile, mkdir } from 'node:fs/promises';

const BBOX = '32.60,12.90,32.98,13.50'; // south, west, north, east
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];
const LAYERS = {
  landuse: `(way["landuse"~"^(residential|commercial|retail|industrial)$"](${BBOX});relation["landuse"~"^(residential|commercial|retail|industrial)$"](${BBOX}););`,
  military: `(way["landuse"="military"](${BBOX});relation["landuse"="military"](${BBOX});way["military"](${BBOX});node["military"](${BBOX}););`,
  water: `(node["man_made"~"^(water_well|water_tower|water_works|reservoir_covered)$"](${BBOX});way["man_made"~"^(water_tower|water_works|reservoir_covered)$"](${BBOX});way["landuse"="reservoir"](${BBOX}););`,
  places: `(node["place"~"^(suburb|neighbourhood|quarter|village|town|hamlet)$"](${BBOX});way["place"~"^(suburb|neighbourhood|quarter|village|town)$"](${BBOX});relation["place"~"^(suburb|neighbourhood|quarter|village|town)$"](${BBOX});relation["boundary"="administrative"]["admin_level"~"^(7|8|9|10)$"](${BBOX}););`,
  landmarks: `(node["amenity"~"^(prison|police|courthouse|townhall|university|hospital|place_of_worship)$"]["name"](${BBOX});way["amenity"~"^(prison|police|courthouse|townhall|university|hospital)$"]["name"](${BBOX});node["historic"]["name"](${BBOX});way["historic"]["name"](${BBOX});node["office"~"^(government|diplomatic)$"]["name"](${BBOX});way["office"~"^(government|diplomatic)$"]["name"](${BBOX});node["tourism"~"^(attraction|museum)$"]["name"](${BBOX});way["tourism"~"^(attraction|museum)$"]["name"](${BBOX});way["aeroway"="aerodrome"](${BBOX});way["leisure"="stadium"]["name"](${BBOX});way["landuse"="cemetery"]["name"](${BBOX});way["amenity"="grave_yard"]["name"](${BBOX}););`,
  oil: `(node["man_made"="petroleum_well"](${BBOX});way["man_made"="petroleum_well"](${BBOX});way["industrial"~"^(oil|refinery|fuel)$"](${BBOX});node["industrial"~"^(oil|refinery)$"](${BBOX});way["man_made"="storage_tank"]["content"~"oil|fuel|petrol|gas"](${BBOX}););`
};
const KEEP = ['name', 'name:en', 'name:ar', 'name:it', 'alt_name', 'old_name', 'place', 'admin_level', 'boundary', 'wikidata', 'wikipedia', 'historic', 'office', 'diplomatic', 'country', 'tourism', 'aeroway', 'leisure', 'religion', 'start_date', 'description', 'landuse', 'building', 'military', 'man_made', 'industrial', 'content', 'operator', 'product', 'water', 'amenity'];
const r5 = (n) => Math.round(n * 1e5) / 1e5;

async function query(q) {
  let last;
  for (const url of ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'libya-project-atlas (github.com/gelnagar/libya-project)' }, body: 'data=' + encodeURIComponent('[out:json][timeout:180];' + q + 'out geom;') });
        if (!res.ok) throw new Error(url + ' HTTP ' + res.status);
        return await res.json();
      } catch (e) { last = e; console.warn('retrying:', e.message); await new Promise((r) => setTimeout(r, 5000)); }
    }
  }
  throw last;
}

function compact(el) {
  const tags = {};
  for (const k of KEEP) if (el.tags && el.tags[k]) tags[k] = el.tags[k];
  if (el.type === 'node') return { k: 'n', i: el.id, t: tags, p: [r5(el.lat), r5(el.lon)] };
  if (el.type === 'way' && el.geometry) return { k: 'w', i: el.id, t: tags, g: [el.geometry.map((p) => [r5(p.lat), r5(p.lon)])] };
  if (el.type === 'relation' && el.members) {
    const g = el.members.filter((m) => m.geometry && m.role !== 'inner').map((m) => m.geometry.map((p) => [r5(p.lat), r5(p.lon)]));
    if (g.length) return { k: 'r', i: el.id, t: tags, g };
  }
  return null;
}

await mkdir('public/data/osm', { recursive: true });
for (const [name, q] of Object.entries(LAYERS)) {
  const data = await query(q);
  const features = (data.elements || []).map(compact).filter(Boolean);
  await writeFile(`public/data/osm/${name}.json`, JSON.stringify({ generated: new Date().toISOString().slice(0, 10), bbox: BBOX, source: 'OpenStreetMap contributors (ODbL)', features }));
  console.log(name, features.length, 'features');
}

import { splitLandmarks } from "./split-landmarks.mjs";
await splitLandmarks();
