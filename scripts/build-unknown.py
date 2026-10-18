"""Builds public/data/unknown.js: the people, organisations and outside places that the CIA/FBIS/JPRS/FRUS files connect,
but that have no spot on the Tripoli map. Source: Haiku link candidates and people lists (archive/crest/extract*.jsonl)."""
import json, re, gzip, os, sys, collections, hashlib, math, random
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from place_aliases import ALIAS
ids = {a['id']: a['name'] for a in json.load(open(ROOT + '/archive/areas/areas.json'))}
for m in re.finditer(r"id: '([a-z0-9-]+)', layer: '\w+'.*?\n\s+name: (['\"])(.*?)\2,", open(ROOT + '/public/data/sites.js').read(), re.S): ids[m.group(1)] = m.group(3).replace("\\'", "'")
A = lambda v: v if isinstance(v, list) else []

# ---- documents: titles, dates, links, archive record ids
docs = {}
for f in ('docs.jsonl.gz', 'docs-other.jsonl.gz'):
    for l in gzip.open(f'{ROOT}/archive/crest/{f}', 'rt'):
        d = json.loads(l); docs[d['id']] = {'t': re.sub(r'\s+', ' ', d.get('title') or '').strip()[:160], 'd': d.get('date') or '', 'u': d.get('url') or d.get('cia') or d.get('ia'), 'ia': d.get('ia'), 'src': d.get('src')}
recs = json.loads(re.search(r'= (\[.*\]);', open(ROOT + '/public/data/records.js').read(), re.S).group(1))
by_url = {}
for r in recs:
    for k in ('u', 'a'):
        if r.get(k): by_url[r[k]] = r
rows = []
for f in ('extract.jsonl', 'extract-other.jsonl'):
    for l in open(f'{ROOT}/archive/crest/{f}'):
        r = json.loads(l)
        if r['id'] in docs: rows.append(r)

# ---- names
TITLES = r'^(col(onel)?|lt|lieutenant|gen(eral)?|maj(or)?|capt(ain)?|sgt|sergeant|mr|mrs|dr|king|president|prime minister|sheikh|shaykh|brother|prince|ambassador)\.?\s+'
def norm(n):
    n = (n or '').replace('’', "'").strip().strip('.,;:')
    k = n.lower()
    k = re.sub(TITLES, '', k)
    k = re.sub(r'\b[a-z]\.\s*', '', k)  # middle initials
    k = re.sub(r"[^a-z0-9' \-]", ' ', k)
    return re.sub(r'\s+', ' ', k).strip()
MERGE = {  # spelling variants seen in the files -> one entity
    'qadhafi': ['qadhafi', 'qaddafi', 'gaddafi', 'gadhafi', 'kadhafi', 'qadhdhafi', 'muammar el-qaddafi', 'moammar gadhafi', 'muammar qadhafi', 'muammar al-qadhafi', 'mu\'ammar al-qadhdhafi',
                'muammar gaddafi', 'muammar qaddafi', 'muammar al-qaddafi', 'muammar el qaddafi', 'muammar al qaddafi', 'muammar al-gaddafi', 'colonel qadhafi', 'col qadhafi', 'qadhafi\'s regime', 'al-qadhdhafi', 'muammar al-qadhdhafi', 'moammar khadafy', 'khadafy'],
    'edwin wilson': ['edwin wilson', 'edwin p wilson', 'ed wilson', 'wilson', 'edwin paul wilson'],
    'frank terpil': ['frank terpil', 'frank e terpil', 'francis e terpil', 'francis terpil', 'terpil'],
    'eugene tafoya': ['eugene tafoya', 'eugene a tafoya', 'tafoya'],
    'omar muhayshi': ['omar muhayshi', 'umar muhayshi', 'umar abdullah muhayshi', 'muhayshi', 'omar meheishi', 'umar al-muhayshi', 'omar al-muhayshi'],
    'abdessalam jalloud': ['jalloud', 'abdessalam jalloud', 'abd al-salam jallud', 'abdul salam jalloud', 'jallud', 'abd al-salam jalloud', 'major jalloud', 'abdel salam jalloud'],
    'soviet union': ['soviet union', 'ussr', 'the soviet union'], 'polisario front': ['polisario', 'polisario front'],
    'abu nidal organization': ['abu nidal group', 'abu nidal organization', 'abu nidal organisation', 'abu nidal'],
    'benghazi': ['benghazi', 'banghazi'], 'sebha': ['sebha', 'sabha'], 'sebha airfield': ['sebha airfield'],
    'kufra': ['kufra', 'kufrah', 'al kufrah', 'kufra oasis'], 'kufra airfield': ['kufra airfield'], 'misrata': ['misratah', 'misurata', 'misrata'],
    "n'djamena": ['ndjamena', "n'djamena", 'n djamena'], 'faya-largeau': ['faya largeau', 'faya-largeau'], 'fort collins, colorado': ['fort collins', 'fort collins colorado'],
    'national front for the salvation of libya': ['national front for the salvation of libya', 'nfsl'], 'abdullah senussi': ['abdullah senussi', 'abdallah al-sanusi', 'abdullah al-senussi'],
    'tarhuna': ['tarhuna', 'tarhunah'], 'sirte': ['sirte', 'surt', 'sirt'], 'derna': ['darnah', 'derna'], 'rabta': ['rabta', 'rabta technology center'],
    'abdelbaset al-megrahi': ['abdelbaset al-megrahi', 'abdalbasit ali al-magrahi', 'abdel basset al-megrahi', 'megrahi', 'al-megrahi'], 'yasir arafat': ['yasir arafat', "yasir 'arafat", 'yasser arafat', 'arafat'],
    'abdel moneim huni': ['abdel moneim huni', 'al-huni', 'abd al-munim al-huni', 'abdel moneim al-houni'], 'douglas schlachter': ['douglas schlachter', 'douglas schlachter sr', 'douglas schlachter sr.'],
    'great man-made river': ['great man-made river', 'great manmade river'], 'seawind exercise': ['seawind exercise', 'u s and egyptian seawind exercises'], 'gafsa': ['gafsa', 'qafsah', 'gafsa events', 'qafsah events in tunisia'],
    'libya-chad border': ['libya-chad border', 'libyan-chadian border'], 'libya-egypt border': ['libya-egypt border', 'egypt-libya border'], 'al-shati hotel': ['al-shati hotel', "ash-shati' hotel"],
    'carlos the jackal': ['carlos', 'carlos the jackal', 'ilich ramirez sanchez'], 'billy carter': ['billy carter'],
}

# More spellings merged after the Sonnet connection notes flagged them as the same thing (checked against the files by hand).
for _k, _vs in {
    'fort collins, colorado': ['fort collins colo'], 'misratah port': ['misratah port transshipment facility'], 'tobruk': ['tubruq port tobruk'], 'sirte': ['surt sirte'],
    'aozou airfield': ['aozou airfield chad'], "people's hall tripoli": ["people's hall"], 'sixth fleet maneuvers 17-23 august 1981': ['us 6th fleet maneuvers'],
    'seawind exercise': ['and egyptian seawind exercises'], 'libya-chad conflict': ['chad conflict'], 'national front for the salvation of libya': ['front for salvation of libya'],
    'tripoli flight information region': ['libyan flight information region'], 'public tile and construction materials company tripoli': ['public tile and construction materials company plant in tripoli'],
    "libyan people's bureau london": ['libyan embassy london'],
}.items():
    MERGE.setdefault(_k, [_k]); MERGE[_k] += [v for v in _vs if v not in MERGE[_k]]
CANON = {v: k for k, vs in MERGE.items() for v in vs}
GENERIC = {'tripoli', 'libya', 'tripoli libya', 'libyan government', 'libyan regime', 'libyan', 'libyans', 'the libyan government', 'tarabulus', 'tarabulus tripoli', 'tripolitania',
           'united states', 'us', 'u s', 'usa', 'the united states', 'u s government', 'us government', 'washington', 'america', 'libyan people', 'the regime', 'regime'}
def ent(n):
    if not isinstance(n, str) or not n.strip(): return None
    if n in ids: return 'map:' + n
    a = ALIAS.get(n.strip().lower().replace('’', "'"))
    if a: return 'map:' + a
    k = norm(n)
    if not k or k in GENERIC or len(k) < 3: return None
    return CANON.get(k, k)

COUNTRIES = set('egypt chad tunisia algeria morocco malta sudan niger uganda italy france spain syria iran iraq israel ghana nicaragua grenada ethiopia jordan lebanon britain united kingdom uk west germany east germany germany soviet union saudi arabia mauritania mali cuba north korea romania yugoslavia greece turkey pakistan philippines'.split()) | {'soviet union', 'united kingdom', 'west germany', 'east germany', 'saudi arabia', 'north korea', 'great britain', 'burkina faso', 'central african republic'}
ORG = re.compile(r"bureau|society|group|organi[sz]ation|front|brigade|ministry|secretariat|agency|committee|congress|guard|air force|navy|army|government|airlines?|company|corp|inc\b|ltd|s\.?p\.?a|council|party|movement|union|institute|bank|cia|kgb|fbi|nsa|mossad|opec|oau|un\b|nato|league|federation|service|police|legion|commission|petroleum|oil|snam|meprico|holdings|consult", re.I)
EVENT = re.compile(r'visit|demonstration|speech|address|exercise|declaration|treaty|killings|strike|capture|shooting|claim|break|campaign|violence|program|grand prix|planting|decision|bombing|hijack|siege|summit|uprising|conflict|attack|crisis|raid|war\b|incident|massacre|coup|assassination|explosion|trial|operation|plot|affair|flight \d', re.I)
PLACE = re.compile(r'prison|hotel|headquarters|school|facility|border|coast|river|airfield|air ?base|airport|port\b|harbou?r|oasis|base\b|camp\b|site\b|barracks|field\b|island|gulf|strait|region|city|town|province|district|colorado|virginia|london|paris|rome|berlin|cairo|tunis|algiers|rabat|khartoum|damascus|beirut|geneva|vienna|valletta|n.djamena|faya|aozou|abeche|darfur|kufra|sebha|benghazi|misrata|sirte|derna|tobruk|tarhuna|zuwarah|gharyan|jufrah|ghat|ubari|rabta|sidra|bouri|fort ', re.I)

people_roles = collections.defaultdict(collections.Counter)
for r in rows:
    for p in A(r.get('people')):
        if isinstance(p, dict) and p.get('name'):
            e = ent(p['name'])
            if e and not e.startswith('map:'): people_roles[e][(p.get('role') or '').strip()[:90]] += 1
place_names = set()
for r in rows:
    for p in A(r.get('places')):
        if isinstance(p, dict) and p.get('name'): place_names.add(ent(p['name']))
STRONG_ORG = re.compile(r"\b(group|front|organi[sz]ation|bureau|embassy|fleet|brigade|society|company|corporation|airlines?|council|party|movement|ministry|agency|committee|congress|sc|club|office|mission|forces|guard|navy|army|air force|service|government)\b", re.I)
def kind(e, label):
    if e.startswith('map:'): return 'mapped'
    if e in COUNTRIES: return 'state'
    if STRONG_ORG.search(label): return 'org'
    if EVENT.search(label): return 'event'
    if e in people_roles: return 'person'
    if PLACE.search(label) or e in place_names: return 'place'
    if ORG.search(label): return 'org'
    return 'unknown'

# ---- edges
labels = collections.defaultdict(collections.Counter)
E = {}
for r in rows:
    for k in A(r.get('links')):
        if not isinstance(k, dict): continue
        a, b = ent(k.get('a')), ent(k.get('b'))
        if not a or not b or a == b or (a.startswith('map:') and b.startswith('map:')): continue
        for raw, e in ((k.get('a'), a), (k.get('b'), b)): labels[e][raw.strip()] += 1
        key = tuple(sorted((a, b)))
        x = E.setdefault(key, {'a': key[0], 'b': key[1], 'why': [], 'docs': []})
        why = (k.get('why') or '').strip()
        if why and len(x['why']) < 4 and why not in x['why']: x['why'].append(why)
        if r['id'] not in x['docs']: x['docs'].append(r['id'])
deg = collections.Counter()
for (a, b), x in E.items(): deg[a] += len(x['docs']); deg[b] += len(x['docs'])
# keep the connected core: entities seen in 2+ link mentions, plus anything tied to them; drop isolated one-off pairs
keep = {e for e, n in deg.items() if n >= 2}
edges = [x for x in E.values() if (x['a'] in keep and x['b'] in keep) or ((x['a'] in keep or x['b'] in keep) and not (x['a'].startswith('map:') or x['b'].startswith('map:')) and len(x['why']) > 0)]
nodes_used = {e for x in edges for e in (x['a'], x['b'])}
# ---- doc mentions per node
ndocs = collections.defaultdict(set)
for x in edges:
    for d in x['docs']: ndocs[x['a']].add(d); ndocs[x['b']].add(d)
def label(e):
    if e.startswith('map:'): return ids.get(e[4:], e[4:])
    best = [n for n, _ in labels[e].most_common() if not re.match(r'^(col|colonel|mr|dr|gen|maj)\b', n, re.I)] or [n for n, _ in labels[e].most_common()]
    full = max(best[:4], key=len) if best else e
    return full
def year(d):
    m = re.match(r'(1[89]\d\d|20\d\d)', d or ''); return int(m.group(1)) if m else None
def docref(did):
    d = docs[did]; rec = by_url.get(d['u']) or by_url.get(d.get('ia'))
    rid = rec['i'] if rec else None
    if not rid and did.startswith('cia-readingroom-document-'): rid = 'crest-' + did.replace('cia-readingroom-document-', '')
    return {'id': did, 't': d['t'] or did, 'd': (rec or {}).get('d') or d['d'], 'u': d['u'], 'r': rid}
PIC_OVERRIDE = {'edwin wilson': 'agent', 'frank terpil': 'agent', 'eugene tafoya': 'militant', 'qadhafi': 'leader', 'faisal zagallai': 'dissident', 'omar muhayshi': 'dissident', 'billy carter': 'trader', 'carlos the jackal': 'militant', 'abdullah senussi': 'agent'}
ROLE_PIC = [('dissident', r'dissident|exile|opponent|opposition|student|defector|refugee'), ('agent', r'cia|intelligence|agent|spy|operative|officer of the|case officer|informant|defector'), ('militant', r'terror|militant|gunm|hijack|assassin|guerrilla|insurg|bomber|hit ?man|mercenar|jackal'),
            ('trader', r'arms|dealer|businessman|business|contractor|merchant|smuggl|company|broker|supplier|exporter|pilot'), ('official', r'minister|leader|president|king|ambassador|official|diplomat|chief|head of|colonel|general|secretary|envoy|commander|senator|congressman|prime')]
nodes = []
for e in sorted(nodes_used, key=lambda e: -len(ndocs[e])):
    lab = label(e); k = kind(e, lab)
    roles = [r for r, _ in people_roles[e].most_common(3) if r]
    whys = ' '.join(w for x in edges if e in (x['a'], x['b']) for w in x['why'])
    pic = k
    if k == 'person':
        txt = (' '.join(roles) + ' ' + whys).lower(); pic = 'person'
        for name, rx in ROLE_PIC:
            if re.search(rx, ' '.join(roles).lower() or txt): pic = name; break
    pic = PIC_OVERRIDE.get(e, pic)
    ys = [y for y in (year(docs[d]['d']) for d in ndocs[e]) if y and y < 2027]
    yrs = sorted(y for y in ys if 1950 <= y <= 2026)
    aka = [n for n, _ in labels[e].most_common(6) if n != lab][:4]
    nodes.append({'id': e, 'name': lab, 'kind': k, 'pic': pic, 'role': roles[0] if roles else '', 'roles': roles, 'aka': aka, 'n': len(ndocs[e]),
                  'y0': yrs[0] if yrs else None, 'y1': yrs[-1] if yrs else None, 'map': e[4:] if e.startswith('map:') else None,
                  'seed': int(hashlib.md5(e.encode()).hexdigest()[:6], 16)})
try: PH = json.load(open(ROOT + '/archive/unknown/photos.json'))
except Exception: PH = {}
STOPW = {'tripoli', 'libya', 'libyan', 'the', 'of', 'and', 'in', 'for', 'to', 'a', 'al', 'el'}
WRONG = {'front for salvation of libya', '1986 air attack on tripoli and benghazi', "arab people's congress", 'the institute', 'libyan mission to the united nations', "libyan people's bureau"}
def same(name, title):
    a = {w for w in re.findall(r"[a-z]{3,}", name.lower()) if w not in STOPW}
    b = {w for w in re.findall(r"[a-z]{3,}", title.lower()) if w not in STOPW}
    return bool(a & b) or not a
def credit(a):
    a = re.sub(r'(Unknown author)(\s*Unknown author)+', r'\1', a or '')
    return 'see the Commons page' if re.search(r'see (file history|below)|upload log', a, re.I) else a
for n in nodes:
    ph = PH.get(n['id'])
    if ph and (n['id'] in WRONG or not same(n['name'] + ' ' + ' '.join(n.get('aka') or []), ph.get('title', ''))): ph = None
    if ph and ph.get('img'): ph['img']['artist'] = credit(ph['img'].get('artist'))
    if ph:
        n['wiki'] = ph.get('page')
        if ph.get('img'): n['img'] = {k: ph['img'][k] for k in ('thumb', 'url', 'lic', 'artist')}
idx = {n['id']: i for i, n in enumerate(nodes)}
out_edges = [{'s': idx[x['a']], 't': idx[x['b']], 'why': x['why'], 'docs': [docref(d) for d in x['docs'][:6]], 'n': len(x['docs'])} for x in edges]

# ---- layout: each connected group laid out on its own (force simulation), then packed in a spiral, biggest in the middle
random.seed(7)
N = len(nodes)
SZ = [36 + min(44, math.sqrt(n['n']) * 9) for n in nodes]
nbr = [[] for _ in nodes]
for e in out_edges: nbr[e['s']].append(e['t']); nbr[e['t']].append(e['s'])
comp, seen = [], set()
for i in range(N):
    if i in seen: continue
    st, c = [i], []
    seen.add(i)
    while st:
        x = st.pop(); c.append(x)
        for y in nbr[x]:
            if y not in seen: seen.add(y); st.append(y)
    comp.append(c)
comp.sort(key=len, reverse=True)
pos = [[0.0, 0.0] for _ in nodes]
import networkx as nx
def lay(c):
    if len(c) == 1: return {c[0]: [0.0, 0.0]}
    G = nx.Graph(); G.add_nodes_from(c)
    for e in out_edges:
        if e['s'] in G and e['t'] in G: G.add_edge(e['s'], e['t'])
    unit = 150.0
    P0 = nx.kamada_kawai_layout(G) if len(c) <= 60 else nx.spring_layout(G, k=1.6 / math.sqrt(len(c)), iterations=400, seed=7)
    P0 = nx.kamada_kawai_layout(G, pos=P0) if len(c) > 60 else P0
    span = max(max(abs(p[0]), abs(p[1])) for p in P0.values()) or 1
    scale = unit * math.sqrt(len(c)) / span * 0.75
    P = {i: [p[0] * scale, p[1] * scale] for i, p in P0.items()}
    for it in range(80):  # collision pass so the cards never overlap
        for ii, i in enumerate(c):
            for j in c[ii + 1:]:
                dx = P[i][0] - P[j][0]; dy = P[i][1] - P[j][1]; d = math.sqrt(dx * dx + dy * dy) + 0.01
                m = (SZ[i] + SZ[j]) / 2 + 30
                if d < m:
                    push = (m - d) / 2; P[i][0] += dx / d * push; P[i][1] += dy / d * push; P[j][0] -= dx / d * push; P[j][1] -= dy / d * push
    cx = sum(p[0] for p in P.values()) / len(c); cy = sum(p[1] for p in P.values()) / len(c)
    return {i: [p[0] - cx, p[1] - cy] for i, p in P.items()}
placed = []  # (x, y, r)
for c in comp:
    P = lay(c)
    r = max(math.hypot(*p) + SZ[i] / 2 for i, p in P.items()) + 40
    if not placed: ox, oy = 0.0, 0.0
    else:
        ang, rad = 0.0, placed[0][2] + r
        while True:
            ox, oy = math.cos(ang) * rad, math.sin(ang) * rad * 0.8
            if all(math.hypot(ox - x, oy - y) > rr + r for x, y, rr in placed): break
            ang += 0.25
            if ang > 2 * math.pi: ang = 0.0; rad += 30
    placed.append((ox, oy, r))
    for i, p in P.items(): pos[i] = [p[0] + ox, p[1] + oy]; nodes[i]['c'] = len(placed) - 1
for n, p in zip(nodes, pos): n['x'] = round(p[0], 1); n['y'] = round(p[1], 1)
open(ROOT + '/public/data/unknown.js', 'w').write('/* Generated by scripts/build-unknown.py: people, organisations and outside places linked in the declassified files. */\nwindow.ATLAS_UNKNOWN = ' +
    json.dumps({'nodes': nodes, 'edges': out_edges}, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(N, 'nodes', len(out_edges), 'edges', collections.Counter(n['kind'] for n in nodes), collections.Counter(n['pic'] for n in nodes))

