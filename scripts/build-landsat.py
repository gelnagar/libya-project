"""Builds dated Landsat satellite overlays of Tripoli (public domain, USGS) as web map tiles.

Uses Microsoft Planetary Computer's free STAC catalogue to find the clearest scene in each period,
reads only the Tripoli window from the cloud-optimised GeoTIFFs, makes a colour image and tiles it
into public/maps/landsat-<year>/. Run by .github/workflows/maps.yml (needs python3-gdal).
"""
import json, os, subprocess, urllib.request, urllib.parse
from osgeo import gdal
gdal.UseExceptions()
gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
gdal.SetConfigOption('CPL_VSIL_CURL_ALLOWED_EXTENSIONS', '.tif,.TIF')
BBOX = [12.95, 32.70, 13.45, 32.95]  # west, south, east, north
STAC = 'https://planetarycomputer.microsoft.com/api/stac/v1/search'
SIGN = 'https://planetarycomputer.microsoft.com/api/sas/v1/sign?href='
PERIODS = [  # id, label year, collection, date range, platform filter, bands (r,g,b), note
    ('landsat-1970s', 1976, 'landsat-c2-l1', '1972-07-01/1979-12-31', ['landsat-1', 'landsat-2', 'landsat-3'], ('nir08', 'red', 'green'), 'Landsat 1–2 MSS, false colour (vegetation shows red)'),
    ('landsat-1984', 1984, 'landsat-c2-l2', '1984-03-01/1986-12-31', ['landsat-5'], ('red', 'green', 'blue'), 'Landsat 5 TM, natural colour'),
    ('landsat-1989', 1989, 'landsat-c2-l2', '1988-06-01/1990-12-31', ['landsat-5'], ('red', 'green', 'blue'), 'Landsat 5 TM, natural colour'),
    ('landsat-2003', 2003, 'landsat-c2-l2', '2002-06-01/2004-12-31', ['landsat-5', 'landsat-7'], ('red', 'green', 'blue'), 'Landsat 5/7, natural colour'),
]
def post(url, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req, timeout=60))
def sign(href):
    return json.load(urllib.request.urlopen(SIGN + urllib.parse.quote(href, safe=''), timeout=60))['href']
os.makedirs('work', exist_ok=True); os.makedirs('public/maps', exist_ok=True)
made = []
for pid, year, coll, dt, plats, bands, note in PERIODS:
    if os.path.exists(f'public/maps/{pid}/done'):
        made.append(json.load(open(f'public/maps/{pid}/meta.json'))); continue
    q = {'collections': [coll], 'bbox': BBOX, 'datetime': dt, 'limit': 100, 'query': {'eo:cloud_cover': {'lt': 20}, 'platform': {'in': plats}}}
    try:
        items = post(STAC, q).get('features', [])
    except Exception as e:
        print(pid, 'search failed', e); continue
    items = [i for i in items if all(b in i['assets'] for b in bands)]
    if not items: print(pid, 'no scenes'); continue
    # prefer Tier 1 scenes (best geometry), then clear skies, then summer
    items.sort(key=lambda i: (0 if i['id'].endswith('_T1') else 1, i['properties'].get('eo:cloud_cover', 100), abs(int(i['properties']['datetime'][5:7]) - 6)))
    it = items[0]; date = it['properties']['datetime'][:10]
    print(pid, 'using', it['id'], date, 'cloud', it['properties'].get('eo:cloud_cover'))
    outs = []
    for b in bands:
        src = '/vsicurl/' + sign(it['assets'][b]['href'])
        dst = f'work/{pid}-{b}.tif'
        gdal.Warp(dst, src, outputBounds=BBOX, outputBoundsSRS='EPSG:4326', dstSRS='EPSG:3857', xRes=30, yRes=30, resampleAlg='bilinear')
        outs.append(dst)
    vrt = gdal.BuildVRT(f'work/{pid}.vrt', outs, separate=True); vrt = None
    if coll == 'landsat-c2-l2':
        # surface reflectance: DN*0.0000275-0.2; show reflectance 0–0.32 the same way on all bands (keeps colours true)
        scale = [[7273, 18909, 0, 255]] * 3
        gdal.Translate(f'work/{pid}.rgb.tif', f'work/{pid}.vrt', outputType=gdal.GDT_Byte, scaleParams=scale, exponents=[0.8, 0.8, 0.8])
    else:
        import numpy as np
        ds = gdal.Open(f'work/{pid}.vrt'); vals = []
        for k in range(1, 4):
            arr = ds.GetRasterBand(k).ReadAsArray().astype('float64'); vals.append(arr[arr > 0])
        ds = None
        allv = np.concatenate(vals) if vals else np.array([0, 1])
        lo, hi = float(np.percentile(allv, 1)), float(np.percentile(allv, 99))
        gdal.Translate(f'work/{pid}.rgb.tif', f'work/{pid}.vrt', outputType=gdal.GDT_Byte, scaleParams=[[lo, hi, 0, 255]] * 3)
    gdal.Warp(f'work/{pid}.alpha.tif', f'work/{pid}.rgb.tif', dstAlpha=True, srcNodata=0)
    subprocess.run(['gdal2tiles.py', '-q', '--xyz', '-z', '10-13', '-w', 'none', '-r', 'bilinear', '--tiledriver=WEBP', '--webp-quality=82', '--processes=2', f'work/{pid}.alpha.tif', f'public/maps/{pid}'], check=True)
    meta = {'id': pid, 'year': year, 'date': date, 'scene': it['id'], 'note': note, 'bbox': BBOX, 'maxZoom': 13, 'ext': 'webp',
            'title': f'Satellite image, {date[:4]} (Landsat)', 'source': 'USGS Landsat via Microsoft Planetary Computer', 'license': 'Public domain (USGS)'}
    json.dump(meta, open(f'public/maps/{pid}/meta.json', 'w'), indent=1)
    open(f'public/maps/{pid}/done', 'w').write(date)
    made.append(meta)
json.dump(made, open('archive/maps/landsat.json', 'w'), indent=1)
print('made', [m['id'] for m in made])
