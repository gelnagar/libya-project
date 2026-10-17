"""For landmark profiles without coordinates, look for a Wikidata item with the same name and coordinates inside greater Tripoli.
Writes archive/research/coords-candidates.json for review (nothing is applied automatically)."""
import json, glob, urllib.request, urllib.parse, re, time
from concurrent.futures import ThreadPoolExecutor
UA = 'TripoliOpenSource/1.0 (github.com/gelnagar/libya-project)'
def api(url):
    for i in range(3):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30))
        except Exception as e: time.sleep(2)
    return {}
out = {}
todo = []
for f in sorted(glob.glob('archive/areas/landmarks_batch_*.json')):
    for a in json.load(open(f)):
        if a.get('lat') is None: todo.append(a)
def one(a):
    names = [re.sub(r'\s*\(.*?\)', '', a['name']).strip()] + [re.sub(r'\s*\(.*?\)', '', x).strip() for x in (a.get('aliases') or [])[:2]]
    if a.get('ar'): names.append(a['ar'])
    cands = {}
    for n in names[:4]:
        for lang in (('ar',) if re.search(r'[\u0600-\u06ff]', n) else ('en',)):
            d = api('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode({'action': 'wbsearchentities', 'search': n, 'language': lang, 'limit': 5, 'format': 'json'}))
            for r in d.get('search', []): cands[r['id']] = r
    res = []
    ids = list(cands)[:40]
    if ids:
        d = api('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode({'action': 'wbgetentities', 'ids': '|'.join(ids), 'props': 'claims|labels|descriptions', 'languages': 'en', 'format': 'json'}))
        for q, e in (d.get('entities') or {}).items():
            c = (e.get('claims') or {}).get('P625')
            if not c: continue
            v = c[0]['mainsnak'].get('datavalue', {}).get('value')
            if not v: continue
            lat, lon = v['latitude'], v['longitude']
            if 32.0 <= lat <= 33.4 and 12.2 <= lon <= 14.3:
                res.append({'qid': q, 'label': (e.get('labels', {}).get('en') or {}).get('value'), 'desc': (e.get('descriptions', {}).get('en') or {}).get('value'), 'lat': lat, 'lon': lon})
    print(a['id'], len(res), [r['label'] for r in res][:4], flush=True)
    return a['id'], {'name': a['name'], 'candidates': res}
with ThreadPoolExecutor(6) as ex:
    for k, v in ex.map(one, todo): out[k] = v
json.dump(out, open('archive/research/coords-candidates.json', 'w'), ensure_ascii=False, indent=1)
