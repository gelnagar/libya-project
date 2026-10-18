"""Network probe (run in GitHub Actions): look for coordinates of Libya's weapons sites that the atlas lists without a position.
Writes archive/research/weapons-probe.json: raw hits only, nothing is applied."""
import json, re, time, urllib.request, urllib.parse, html
UA = {'User-Agent': 'TripoliOpenSource/1.0 (github.com/gelnagar/libya-project; research)'}
def get(url, data=None, timeout=60):
    for i in range(3):
        try:
            req = urllib.request.Request(url, data=data, headers=UA)
            return urllib.request.urlopen(req, timeout=timeout).read().decode('utf8', 'replace')
        except Exception as e:
            err = str(e); time.sleep(2)
    return 'ERROR ' + err
out = {}
# 1. OpenStreetMap names inside Libya
NAMES = r'(Rabta|Rabtah|Rabita|الرابطة|Ruwagha|Rawagha|Ruwaghah|Rawaghah|الرواغة|Hashan|Khalla|Khallah|Salah ?(Ed|al)|Sawani|Karamia|Karamiyah|Ezeizia|Aziziyah|Al Fatah|Al-Fatah|Fatah|Scud|missile|Missile|صواريخ|Ghardabiya|Gardabiya|Jufra|Jofra|Hun|Waddan|Zillah)'
q = '[out:json][timeout:180];area["ISO3166-1"="LY"]->.a;(nwr["name"~"%s"](area.a);nwr["name:en"~"%s"](area.a);nwr["military"](area.a);nwr["landuse"="military"](area.a););out center tags 4000;' % (NAMES, NAMES)
txt = get('https://overpass-api.de/api/interpreter', urllib.parse.urlencode({'data': q}).encode(), 240)
try:
    els = json.loads(txt)['elements']
    hits = []
    for e in els:
        t = e.get('tags', {}); c = e.get('center') or {'lat': e.get('lat'), 'lon': e.get('lon')}
        hits.append({'id': e['type'][0] + str(e['id']), 'name': t.get('name:en') or t.get('name'), 'ar': t.get('name:ar'), 'tags': {k: v for k, v in t.items() if k in ('military', 'landuse', 'man_made', 'amenity', 'building', 'operator', 'description', 'wikipedia', 'wikidata', 'note')}, 'lat': c.get('lat'), 'lon': c.get('lon')})
    out['osm'] = hits
except Exception as e:
    out['osm_error'] = txt[:300]
# 2. Wikipedia / Wikidata searches and coordinates
def wp(title_or_query, lang='en'):
    u = 'https://%s.wikipedia.org/w/api.php?' % lang + urllib.parse.urlencode({'action': 'query', 'list': 'search', 'srsearch': title_or_query, 'srlimit': 8, 'format': 'json'})
    try: return [{'title': r['title'], 'snip': re.sub('<.*?>', '', r['snippet'])} for r in json.loads(get(u))['query']['search']]
    except Exception: return []
def wcoords(titles, lang='en'):
    u = 'https://%s.wikipedia.org/w/api.php?' % lang + urllib.parse.urlencode({'action': 'query', 'prop': 'coordinates', 'titles': '|'.join(titles), 'format': 'json', 'colimit': 'max'})
    try: return {p['title']: p.get('coordinates') for p in json.loads(get(u))['query']['pages'].values()}
    except Exception: return {}
out['wiki_search'] = {q: wp(q) for q in ['Rabta chemical weapons Libya', 'Ruwagha chemical weapons depot Libya', 'Libya centrifuge Al Hashan Al Khalla', 'Libya Scud missile base', 'Al Fatah missile Libya', 'Qabilat az Zaribah', 'Rabta Libya', 'Tarhuna underground chemical weapons Rabta II', 'Waddan chemical weapons mustard']}
out['wiki_coords'] = wcoords(['Rabta', 'Ruwagha', 'Waddan, Libya', 'Ghardabiya Airbase', 'Sirte', 'Tarhuna', 'Libya and weapons of mass destruction', 'Libyan missile attack against Lampedusa', 'Al Jufra District', 'Hun, Libya', 'Qasr Bin Ghashir', 'Janzour', 'Salah al-Din, Tripoli', 'Tajoura Nuclear Research Center', 'Sabha, Libya', 'Ras Lanuf'])
def wd(q):
    u = 'https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode({'action': 'wbsearchentities', 'search': q, 'language': 'en', 'limit': 6, 'format': 'json'})
    try: return json.loads(get(u))['search']
    except Exception: return []
cands = {}
for q in ['Rabta', 'Ruwagha', 'Rawagha', 'Al Hashan', 'Al Khalla', 'Salah Eddin', 'Sawani', 'Al Fatah missile', 'Ar Rabtah', 'Qabilat az Zaribah']: cands[q] = wd(q)
ids = list({r['id'] for v in cands.values() for r in v})[:50]
ent = {}
if ids:
    try:
        d = json.loads(get('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode({'action': 'wbgetentities', 'ids': '|'.join(ids), 'props': 'claims|labels|descriptions', 'languages': 'en', 'format': 'json'})))
        for q, e in d['entities'].items():
            c = (e.get('claims') or {}).get('P625'); v = c and c[0]['mainsnak'].get('datavalue', {}).get('value')
            ent[q] = {'label': (e.get('labels', {}).get('en') or {}).get('value'), 'desc': (e.get('descriptions', {}).get('en') or {}).get('value'), 'lat': v and v['latitude'], 'lon': v and v['longitude']}
    except Exception as e: ent['error'] = str(e)
out['wikidata'] = {'search': {k: [r['id'] for r in v] for k, v in cands.items()}, 'entities': ent}
# 3. Nominatim
out['nominatim'] = {}
for q in ['Rabta, Libya', 'Ar Rabtah, Libya', 'Ruwagha, Libya', 'Rawagha, Libya', 'Ar Rawaghah, Libya', 'Salah Al Din, Tripoli, Libya', 'Al Khalla, Tripoli, Libya', 'Sawani, Libya', 'Al Hashan, Libya', 'Karamia, Libya', 'Qabilat az Zaribah Libya']:
    try: out['nominatim'][q] = [{'name': r['display_name'], 'lat': r['lat'], 'lon': r['lon'], 'type': r.get('type')} for r in json.loads(get('https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({'q': q, 'format': 'json', 'limit': 5})))]
    except Exception: out['nominatim'][q] = []
    time.sleep(1.2)
# 4. page text scan for coordinates near our keywords
COORD = re.compile(r"(\d{1,3}\s*[°º]\s*\d{1,2}\s*['′’]?\s*(?:\d{1,2}(?:\.\d+)?\s*[\"″”]?)?\s*[NS][, ]+\s*\d{1,3}\s*[°º]\s*\d{1,2}\s*['′’]?\s*(?:\d{1,2}(?:\.\d+)?\s*[\"″”]?)?\s*[EW])|(-?\d{1,2}\.\d{3,}\s*[,;]\s*-?\d{1,3}\.\d{3,})")
PAGES = ['https://www.globalsecurity.org/wmd/world/libya/rabta.htm', 'https://www.globalsecurity.org/wmd/world/libya/chemical.htm', 'https://www.globalsecurity.org/wmd/world/libya/al-khalla.htm', 'https://www.globalsecurity.org/wmd/world/libya/nuclear.htm',
 'https://www.globalsecurity.org/wmd/world/libya/missile.htm', 'https://www.globalsecurity.org/wmd/world/libya/al-hashan.htm', 'https://www.globalsecurity.org/wmd/world/libya/salah-eddin.htm', 'https://www.globalsecurity.org/wmd/world/libya/sawani.htm', 'https://www.globalsecurity.org/wmd/world/libya/al-karamia.htm',
 'http://wikimapia.org/20096513/Tarhuna-underground-Chemical-Weapons-Production-Facility-Rabta-II', 'https://bigenoughlie.wordpress.com/2011/06/30/rabta-cwpf-libya/',
 'https://en.wikipedia.org/wiki/Libya_and_weapons_of_mass_destruction', 'https://en.wikipedia.org/wiki/Libyan_missile_attack_against_Lampedusa', 'https://en.wikipedia.org/wiki/Ghardabiya_Airbase', 'https://en.wikipedia.org/wiki/Rabta_chemical_weapons_plant', 'https://en.wikipedia.org/wiki/Libyan_chemical_weapons_program',
 'https://www.nti.org/analysis/articles/libya-chemical/', 'https://www.nti.org/wp-content/uploads/2021/09/libya_missile.pdf', 'https://irp.fas.org/threat/missile/libya.htm', 'https://nuke.fas.org/guide/libya/index.html', 'https://www.wisconsinproject.org/libya-has-trouble-building-the-most-deadly-weapons/',
 'https://www.sciencephoto.com/media/362081/view/rabta-chemical-facility-libya', 'https://www.sciencephoto.com/media/362111/view/al-rabtah-chemical-weapons-factory-libya', 'https://www.cnn.com/2011/10/30/world/africa/libya-chemical-weapons/index.html',
 'https://nuke.fas.org/guide/libya/facility/index.html', 'https://nuke.fas.org/guide/libya/missile/index.html', 'https://isis-online.org/country_pages/libya/', 'https://www.fas.org/nuke/guide/libya/facility/']
KEY = re.compile(r'Rabta|Rabtah|Ruwagha|Rawagha|Hashan|Khalla|Salah Eddin|Sawani|Karamia|Ezeizia|Fatah|Scud|Tarhuna|Waddan|Sirte|Jufra|Sebha|Sabha|Hun\b|Ghardabiya', re.I)
out['pages'] = {}
for u in PAGES:
    t = get(u, timeout=45)
    if t.startswith('ERROR'): out['pages'][u] = {'error': t[:120]}; continue
    t2 = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', t, flags=re.S); t2 = html.unescape(re.sub(r'<[^>]+>', ' ', t2)); t2 = re.sub(r'\s+', ' ', t2)
    co = [{'coord': m.group(0), 'ctx': t2[max(0, m.start() - 160):m.end() + 100]} for m in COORD.finditer(t2)][:12]
    ctx = []
    for m in KEY.finditer(t2):
        s = t2[max(0, m.start() - 200):m.end() + 260]
        if re.search(r'\b(km|kilometers?|miles?|south|north|east|west|near|outside|located|suburb|desert|coordinates?|°)\b', s, re.I) and not any(s[:60] in c for c in ctx): ctx.append(s)
        if len(ctx) >= 10: break
    out['pages'][u] = {'len': len(t2), 'coords': co, 'ctx': ctx}
json.dump(out, open('archive/research/weapons-probe.json', 'w'), ensure_ascii=False, indent=1)
print('osm', len(out.get('osm', [])), 'pages', {u.split('/')[-1] or u: (len(v.get('coords', [])), v.get('error', '')[:30]) for u, v in out['pages'].items()})
