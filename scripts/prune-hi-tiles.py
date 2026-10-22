"""Keep the sharpest tile level of the 512-pixel satellite layers only near the pinned sites, so the whole site fits a file budget.

The Cloudflare Worker is on the free plan: deploys of 18,055 and 37,275 files failed, 16,286 passed. So the layers are tiled in full
(tile level zmax is about 1 m a pixel, shown at map zoom 17), and this script then deletes the zmax tiles that are farther than R from
every pin. R is the largest radius whose tiles still keep the whole of public/ inside the budget.
  python3 scripts/prune-hi-tiles.py [budget=16300]
Pins are the detention / security / killings / power / military / landmark sites in public/data/sites.js."""
import json, math, os, re, sys
BUDGET = int(sys.argv[1]) if len(sys.argv) > 1 else 16300
KEEP = {'detention', 'security', 'massacre', 'power', 'military', 'landmark'}
RADII = [8, 6, 5, 4.5, 4, 3.5, 3, 2.5, 2.2, 2, 1.8, 1.5, 1.2, 1, 0.8, 0.6, 0.4]

sites = open('public/data/sites.js', encoding='utf8').read()
pins = [(float(a), float(b)) for l, a, b in re.findall(r"layer:\s*'(\w+)'[^{}]*?lat:\s*(-?[\d.]+),\s*lon:\s*(-?[\d.]+)", sites) if l in KEEP and 32.70 < float(a) < 32.96 and 13.0 < float(b) < 13.42]
print(len(pins), 'pinned sites')
P = [((lo - 13.2) * 111.32 * math.cos(math.radians(32.88)), (la - 32.88) * 110.9) for la, lo in pins]

layers = [o for o in json.load(open('archive/maps/overlays.json', encoding='utf8')) if o.get('tilesize') == 512 and o.get('url')]
tiles = []   # (path, x km, y km)
for o in layers:
    zmax = int(str(o['zooms']).split('-')[1]); base = f"public/maps/{o['id']}/{zmax}"
    if not os.path.isdir(base): continue
    n = 2 ** zmax
    for xd in os.listdir(base):
        for f in os.listdir(f'{base}/{xd}'):
            x, y = int(xd), int(os.path.splitext(f)[0])
            lon = (x + .5) / n * 360 - 180; lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + .5) / n))))
            tiles.append((f'{base}/{xd}/{f}', (lon - 13.2) * 111.32 * math.cos(math.radians(32.88)), (lat - 32.88) * 110.9))
total = sum(len(fs) for _, _, fs in os.walk('public'))
others = total - len(tiles)
allowed = BUDGET - others
print(f'public/ has {total} files; {len(tiles)} are top-level tiles of {len(layers)} layers; the rest is {others}; room for {allowed} top-level tiles')
T = [(t[1], t[2]) for t in tiles]
def near(R): return [min(math.hypot(x - px, y - py) for px, py in P) < R if P else False for x, y in T]
chosen = None
for R in RADII:
    k = sum(near(R)); print(f'  radius {R:4} km keeps {k} tiles')
    if k <= allowed: chosen = R; break
if chosen is None: chosen = RADII[-1]
keep = near(chosen); removed = 0
for (path, _, _), k in zip(tiles, keep):
    if not k: os.remove(path); removed += 1
for o in layers:   # drop emptied folders
    zmax = int(str(o['zooms']).split('-')[1]); base = f"public/maps/{o['id']}/{zmax}"
    if os.path.isdir(base):
        for xd in os.listdir(base):
            if not os.listdir(f'{base}/{xd}'): os.rmdir(f'{base}/{xd}')
print(f'radius {chosen} km: kept {sum(keep)} sharp tiles, removed {removed}; public/ now has {sum(len(fs) for _, _, fs in os.walk("public"))} files')
