"""For landmark profiles without coordinates, look for a Wikidata item with the same name and coordinates inside greater Tripoli.
Writes archive/research/coords-candidates.json for review (nothing is applied automatically)."""
import json, glob, urllib.request, urllib.parse, re, time
UA = 'TripoliOpenSource/1.0 (github.com/gelnagar/libya-project)'
def api(url):
    for i in range(3):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30))
        except Exception as e: time.sleep(2)
    return {}
out = {}
for f in sorted(glob.glob('archive/areas/landmarks_batch_*.json')):
    for a in json.load(open(f)):
        if a.get('lat') is not None: continue
        names = [re.sub(r'\s*\(.*?\)', '', a['name']).strip()] + [re.sub(r'\s*\(.*?\)', '', x).strip() for x in (a.get('aliases') or [])[:3]]
        if a.get('ar'): names.append(a['ar'])
        cands = {}
        for n in names:
            for lang in ('en', 'ar'):
                d = api('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode({'action': 'wbsearchentities', 'search': n, 'language': lang, 'limit': 6, 'format': 'json'}))
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
                if 32.55 <= lat <= 33.05 and 12.85 <= lon <= 13.55:
                    res.append({'qid': q, 'label': (e.get('labels', {}).get('en') or {}).get('value'), 'desc': (e.get('descriptions', {}).get('en') or {}).get('value'), 'lat': lat, 'lon': lon})
        out[a['id']] = {'name': a['name'], 'candidates': res}
        print(a['id'], len(res), [r['label'] for r in res][:4])
json.dump(out, open('archive/research/coords-candidates.json', 'w'), ensure_ascii=False, indent=1)
