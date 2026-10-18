"""Find declassified spy-satellite frames (CORONA, GAMBIT, HEXAGON) over Tripoli in USGS EarthExplorer
and record which are already scanned and free to download. Needs USGS_USERNAME and USGS_TOKEN (M2M application token).
Writes archive/maps/usgs-declass.json. Nothing is downloaded here."""
import json, os, sys, urllib.request
API = 'https://m2m.cr.usgs.gov/api/api/json/stable/'
def call(endpoint, payload, key=None):
    req = urllib.request.Request(API + endpoint, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json', **({'X-Auth-Token': key} if key else {})})
    with urllib.request.urlopen(req, timeout=120) as r:
        j = json.load(r)
    if j.get('errorCode'):
        raise RuntimeError(f"{endpoint}: {j.get('errorCode')} {j.get('errorMessage')}")
    return j['data']
def main():
    user, tok = os.environ.get('USGS_USERNAME'), os.environ.get('USGS_TOKEN')
    if not user or not tok: raise RuntimeError('USGS_USERNAME / USGS_TOKEN secrets are missing')
    key = call('login-token', {'username': user, 'token': tok})
    print('logged in')
    AOI = {'filterType': 'mbr', 'lowerLeft': {'latitude': 32.80, 'longitude': 13.05}, 'upperRight': {'latitude': 32.95, 'longitude': 13.35}}
    datasets = call('dataset-search', {'datasetName': 'declass', 'spatialFilter': AOI}, key) or []
    datasets += call('dataset-search', {'datasetName': 'corona', 'spatialFilter': AOI}, key) or []
    names = sorted({d['datasetAlias'] for d in datasets})
    print('datasets', names)
    out = {'datasets': [{'alias': d['datasetAlias'], 'name': d.get('collectionName')} for d in datasets], 'scenes': []}
    for ds in names:
        try:
            res = call('scene-search', {'datasetName': ds, 'maxResults': 500, 'sceneFilter': {'spatialFilter': AOI}, 'metadataType': 'full'}, key)
        except Exception as e:
            print('search failed', ds, e); out.setdefault('errors', []).append('scene-search ' + ds + ': ' + str(e)[:300]); continue
        scenes = res.get('results', []) if res else []
        print(ds, 'scenes', len(scenes))
        ids = [s['entityId'] for s in scenes]
        avail = {}; allopts = {}
        for i in range(0, len(ids), 100):
            try:
                for o in call('download-options', {'datasetName': ds, 'entityIds': ids[i:i + 100]}, key) or []:
                    allopts.setdefault(o['entityId'], []).append({'id': o['id'], 'product': o.get('productName'), 'available': o.get('available'), 'size': o.get('filesize'), 'system': o.get('downloadSystem')})
                    if o.get('available'): avail.setdefault(o['entityId'], []).append({'id': o['id'], 'product': o.get('productName'), 'size': o.get('filesize')})
            except Exception as e:
                print('options failed', ds, e); out.setdefault('errors', []).append('download-options ' + ds + ': ' + str(e)[:300])
        for s in scenes:
            md = {m.get('fieldName'): m.get('value') for m in (s.get('metadata') or [])}
            out['scenes'].append({'dataset': ds, 'entityId': s['entityId'], 'displayId': s.get('displayId'), 'date': (s.get('temporalCoverage') or {}).get('startDate', '')[:10],
                'cloud': s.get('cloudCover'), 'footprint': (s.get('spatialCoverage') or {}).get('coordinates'), 'camera': md.get('Camera Type') or md.get('Camera'), 'resolution': md.get('Camera Resolution') or md.get('Resolution'),
                'mission': md.get('Mission'), 'downloadable': avail.get(s['entityId'], []), 'options': allopts.get(s['entityId'], []), 'browse': [b.get('browsePath') for b in (s.get('browse') or [])][:1]})
    call('logout', {}, key)
    os.makedirs('archive/maps', exist_ok=True)
    out['scenes'].sort(key=lambda x: x['date'])
    json.dump(out, open('archive/maps/usgs-declass.json', 'w'), indent=1)
    free = [s for s in out['scenes'] if s['downloadable']]
    print('total', len(out['scenes']), 'downloadable now', len(free))
    for s in free[:60]: print(s['dataset'], s['date'], s['displayId'], s['camera'], s['resolution'], [d['product'] for d in s['downloadable']])

try:
    main()
    json.dump({'ok': True}, open('archive/maps/usgs-status.json', 'w'))
except Exception as e:
    os.makedirs('archive/maps', exist_ok=True)
    msg = str(e)
    for v in (os.environ.get('USGS_TOKEN') or '', os.environ.get('USGS_USERNAME') or ''):
        if v: msg = msg.replace(v, '***')
    import datetime
    json.dump({'ok': False, 'error': msg[:500], 'type': type(e).__name__, 'at': datetime.datetime.utcnow().isoformat(), 'have_username': bool(os.environ.get('USGS_USERNAME')), 'have_token': bool(os.environ.get('USGS_TOKEN')), 'env_names_with_usgs': sorted(k for k in os.environ if 'USGS' in k.upper())}, open('archive/maps/usgs-status.json', 'w'))
    print('ERROR', msg[:500])
