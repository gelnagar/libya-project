"""Second probe (GitHub Actions): Tripoli-area names for the nuclear sites, features near Ruwagha/Tarhuna/Sirte, and the IAEA report text."""
import json, re, time, urllib.request, urllib.parse, subprocess, io
UA = {'User-Agent': 'TripoliOpenSource/1.0 (github.com/gelnagar/libya-project; research)'}
def get(url, data=None, timeout=120, raw=False):
    for i in range(3):
        try:
            b = urllib.request.urlopen(urllib.request.Request(url, data=data, headers=UA), timeout=timeout).read()
            return b if raw else b.decode('utf8', 'replace')
        except Exception as e: err = str(e); time.sleep(3)
    return b'' if raw else 'ERROR ' + err
def ov(q):
    t = get('https://overpass-api.de/api/interpreter', urllib.parse.urlencode({'data': '[out:json][timeout:120];' + q}).encode(), 180)
    try: return json.loads(t)['elements']
    except Exception: return [{'error': t[:200]}]
def slim(els):
    r = []
    for e in els:
        if 'error' in e: r.append(e); continue
        t = e.get('tags', {}); c = e.get('center') or {'lat': e.get('lat'), 'lon': e.get('lon')}
        r.append({'id': e['type'][0] + str(e['id']), 'name': t.get('name:en') or t.get('name'), 'ar': t.get('name:ar') or t.get('name'), 'lat': c.get('lat'), 'lon': c.get('lon'), 'tags': {k: v for k, v in t.items() if k in ('military', 'landuse', 'man_made', 'amenity', 'building', 'industrial', 'power', 'office', 'place', 'highway', 'description', 'operator')}})
    return r
out = {}
TRI = '(32.45,12.75,33.15,13.65)'
out['tripoli_names'] = slim(ov('nwr["name"~"الهشان|الفلاح|الخلة|الكريمية|الكرامية|البيروني|الاستشعار|Hashan|Fallah|Khalla|Krimiy|Karami|Biruni|Remote Sensing|Ezeiz|العزيزية|صلاح الدين"]%s;out center 600;' % TRI))
out['tripoli_military'] = slim(ov('(nwr["military"]%s;nwr["landuse"="military"]%s;nwr["name"~"military|camp|base|barracks|معسكر|كتيبة|قاعدة|لواء"]%s;);out center 600;' % (TRI, TRI, TRI)))
out['tripoli_industrial'] = slim(ov('(nwr["landuse"="industrial"]["name"]%s;nwr["man_made"="works"]%s;);out center 400;' % (TRI, TRI)))
out['waddan_near'] = slim(ov('(nwr(around:40000,29.18,16.16)["military"];nwr(around:40000,29.18,16.16)["landuse"~"military|industrial"];nwr(around:40000,29.18,16.16)["man_made"];nwr(around:12000,29.18,16.16)["name"];);out center 300;'))
out['tarhuna_near'] = slim(ov('(nwr(around:30000,32.43,13.63)["military"];nwr(around:30000,32.43,13.63)["landuse"~"military|industrial|quarry"];nwr(around:30000,32.43,13.63)["man_made"~"tunnel|works|bunker|storage_tank"];nwr(around:30000,32.43,13.63)["name"~"Pharma|pharma|Rabta|الرابطة|Fatah|مصنع|معمل|factory|plant"];);out center 300;'))
out['sirte_military'] = slim(ov('(nwr(around:60000,31.2,16.6)["military"];nwr(around:60000,31.2,16.6)["landuse"="military"];nwr(around:60000,31.2,16.6)["name"~"missile|صواريخ|military|معسكر|قاعدة|لواء|كتيبة|camp|base"];);out center 300;'))
out['jufra_sebha_military'] = slim(ov('(nwr(around:80000,29.2,16.0)["military"];nwr(around:60000,27.04,14.43)["military"];nwr(around:60000,27.04,14.43)["landuse"="military"];);out center 300;'))
# IAEA report text
pdf = get('https://www.securitycouncilreport.org/atf/cf/%7B65BFCF9B-6D27-4E9C-8CD3-CF6E4FF96FF9%7D/Disarm%20GOV200412.pdf', raw=True)
txt = ''
try:
    subprocess.run(['pip', 'install', '-q', 'pypdf'], check=False)
    from pypdf import PdfReader
    txt = '\n'.join((p.extract_text() or '') for p in PdfReader(io.BytesIO(pdf)).pages)
except Exception as e: txt = 'ERROR ' + str(e)
out['iaea_len'] = len(txt)
ctx = []
for m in re.finditer(r'Hashan|Khalla|Salah Eddin|Sawani|Karamia|Ezeizia|Fallah|Janzour|Sebha|Sabha|Tajoura|suburb|outskirts', txt):
    s = re.sub(r'\s+', ' ', txt[max(0, m.start() - 220):m.end() + 300])
    if not any(s[:80] in c for c in ctx): ctx.append(s)
out['iaea_ctx'] = ctx[:40]
json.dump(out, open('archive/research/weapons-probe2.json', 'w'), ensure_ascii=False, indent=1)
print({k: (len(v) if isinstance(v, list) else v) for k, v in out.items()})
