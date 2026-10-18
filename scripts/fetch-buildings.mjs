// Saves every OpenStreetMap building in greater Tripoli as small tiles (0.01° each) in public/data/buildings/,
// so the map does not depend on the busy public Overpass servers when someone zooms in. Run by buildings.yml.
import { writeFile, mkdir, rm } from 'node:fs/promises';
const S = 32.74, N = 32.96, W = 12.98, E = 13.46, STEP = 0.04, TILE = 0.01;
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function query(box) {
  const q = `[out:json][timeout:180];way["building"](${box});out geom tags;`;
  for (let round = 0; round < 3; round++) for (const url of ENDPOINTS) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'libya-project-atlas (github.com/gelnagar/libya-project)' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(200000) });
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return await r.json();
    } catch (e) { console.warn('retry', box, e.message); await sleep(4000); }
  }
  throw new Error('failed ' + box);
}
const KEEP = ['building', 'name', 'name:en', 'name:ar', 'building:levels', 'height', 'amenity'];
const tiles = new Map();
await rm('public/data/buildings', { recursive: true, force: true });
await mkdir('public/data/buildings', { recursive: true });
let total = 0;
for (let s = S; s < N - 1e-9; s += STEP) for (let w = W; w < E - 1e-9; w += STEP) {
  const box = [s, w, s + STEP, w + STEP].map((v) => v.toFixed(3)).join(',');
  const d = await query(box);
  for (const el of d.elements || []) {
    if (el.type !== 'way' || !el.geometry || el.geometry.length < 3) continue;
    let la = 0, lo = 0; el.geometry.forEach((p) => { la += p.lat; lo += p.lon; }); la /= el.geometry.length; lo /= el.geometry.length;
    const key = Math.floor(la / TILE) + '_' + Math.floor(lo / TILE);
    if (!tiles.has(key)) tiles.set(key, new Map());
    const t = {}; for (const k of KEEP) if (el.tags && el.tags[k]) t[k] = el.tags[k];
    let px = 0, py = 0; const c = [];
    for (const p of el.geometry) { const x = Math.round(p.lat * 1e5), y = Math.round(p.lon * 1e5); c.push(x - px, y - py); px = x; py = y; }
    tiles.get(key).set(el.id, [el.id, Object.keys(t).length > 1 || t.building !== 'yes' ? t : 0, c]);
  }
  total += (d.elements || []).length; console.log(box, (d.elements || []).length, 'running', total);
  await sleep(1500);
}
let files = 0;
for (const [key, m] of tiles) { await writeFile(`public/data/buildings/${key}.json`, JSON.stringify({ v: 1, b: [...m.values()] })); files++; }
await writeFile('public/data/buildings/index.json', JSON.stringify({ generated: new Date().toISOString().slice(0, 10), bbox: [S, W, N, E], tile: TILE, tiles: [...tiles.keys()] }));
console.log('tiles', files, 'buildings', [...tiles.values()].reduce((n, m) => n + m.size, 0));
