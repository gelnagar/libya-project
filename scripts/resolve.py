"""Shared place-name resolver: map a free-text place name from an extraction to a site/area id."""
import json, re, subprocess, unicodedata, functools

def fold(t):
    t = unicodedata.normalize('NFD', str(t or '').lower())
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[’'`ʿʾ]", '', t); t = re.sub(r'[-_.,()/;:"]', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()

STOP = set('the of in at near and tripoli libya libyan al el an a base camp site area facility installation complex headquarters hq center centre airport airfield field city district road south north east west outer inner'.split())
GENERIC = {'tripoli', 'libya', 'libyan', 'tarabulus', 'tripolitania', 'cairo', 'malta', 'benghazi', 'tripoli libya', 'tripoli area', 'general', 'airport', 'port'}

@functools.lru_cache(1)
def index():
    js = subprocess.check_output(['node', '-e', """
global.window={};require('./public/data/sites.js');require('./public/data/areas.js');
const o=[];for(const s of window.ATLAS_SITES)o.push({id:s.id,names:[s.name,s.ar].concat(s.aliases||[]),kind:'site',layer:s.layer,lat:s.lat,lon:s.lon});
for(const a of window.ATLAS_AREAS)o.push({id:a.id,names:[a.name,a.ar].concat(a.aliases||[]),kind:a.kind,lat:a.lat,lon:a.lon});
console.log(JSON.stringify(o))"""]).decode()
    ents = json.loads(js)
    extra = {  # aliases used in the sources
        'bab': ['Bab al-Aziziya', 'Bab al Aziziya', 'Bab al-Azizia', 'Bab el-Azizia', 'Bab Aziziya', 'Azizia barracks', 'Aziziyah barracks', 'El Azziziya', 'Al Aziziyah barracks', 'Qadhafi compound', 'Qaddafi compound', 'Qadhafi headquarters', 'Qaddafi headquarters', 'Qadhdhafi compound'],
        'wheelus': ['Wheelus', 'Wheelus Air Base', 'Wheelus Field', 'Okba Ben Nafi', 'Uqba bin Nafi', 'Mitiga', 'Mitiga airport', 'Mellaha'],
        'tip': ['Tripoli military airport', 'Tripoli military airfield', 'Tripoli International Airport', 'Tripoli airport', 'Tripoli airfield'],
        'abusalim': ['Abu Salim', 'Abu Salim prison', 'Abu Salim jail', 'Abusalim'],
        'green': ['Green Square', 'Martyrs Square', 'Piazza Italia'],
        'fateh': ['Al-Fateh University', 'Fateh University', 'Al Fatah University', 'University of Tripoli', 'Tripoli University'],
        'sidibilal': ['Sidi Bilal', 'Sidi Bilal naval school', 'Murat Sidi Bilal'],
        'palace': ["People's Palace", 'Qasr al Shaab'],
    }
    for e in ents:
        if e['id'] in extra: e['names'] += extra[e['id']]
    idx = {}
    for e in ents:
        for n in e['names']:
            f = fold(n)
            if len(f) >= 4: idx.setdefault(f, set()).add(e['id'])
    return ents, idx

def toks(f): return [t for t in f.split() if t not in STOP and len(t) > 2]

def resolve(name, hint_id=None):
    ents, idx = index()
    by = {e['id']: e for e in ents}
    if hint_id and hint_id in by: return hint_id, 'hint'
    f = fold(name)
    if not f or f in GENERIC: return None, 'generic'
    if f in idx and len(idx[f]) == 1: return next(iter(idx[f])), 'exact'
    if f in idx: return None, 'ambiguous'
    # whole-name containment (either direction) with reasonable length
    hits = set()
    for k, ids in idx.items():
        if len(k) >= 6 and (re.search(r'\b' + re.escape(k) + r'\b', f) or (len(f) >= 7 and re.search(r'\b' + re.escape(f) + r'\b', k))):
            hits |= ids
    if len(hits) == 1: return next(iter(hits)), 'contain'
    # token overlap
    ft = set(toks(f))
    if len(ft) >= 2:
        best = []
        for k, ids in idx.items():
            kt = set(toks(k))
            if len(kt) >= 2 and len(ft & kt) >= max(2, int(0.75 * min(len(ft), len(kt)))):
                best.append((len(ft & kt) / max(len(ft | kt), 1), ids))
        best.sort(key=lambda x: -x[0])
        if best and (len(best) == 1 or best[0][0] > best[1][0]) and len(best[0][1]) == 1: return next(iter(best[0][1])), 'tokens'
    return None, 'none'
