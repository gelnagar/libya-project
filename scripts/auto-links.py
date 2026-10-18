"""Turns Haiku link candidates from archive/crest/extract-other.jsonl (and extract.jsonl) into archive/research/links-auto.json.
Keeps only links between two existing mapped ids, drops co-occurrence-only and same-place duplicates, one entry per pair+kind."""
import json, re, gzip, os, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ids = {a['id'] for a in json.load(open(ROOT + '/archive/areas/areas.json'))} | set(re.findall(r"id: '([a-z0-9-]+)'", open(ROOT + '/public/data/sites.js').read()))

import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from place_aliases import ALIAS
def res(n):
    if not isinstance(n, str): return None
    if n in ids: return n
    return ALIAS.get(n.strip().lower().replace('\u2019', "'"))
docs = {}
for f in ('docs-other.jsonl.gz', 'docs.jsonl.gz'):
    for l in gzip.open(f'{ROOT}/archive/crest/{f}', 'rt'):
        d = json.loads(l); docs[d['id']] = d
manual = {(l['a'], l['b']) for f in ('links.json', 'links-curated.json') for l in json.load(open(f'{ROOT}/archive/research/{f}'))}
manual |= {(b, a) for a, b in manual}
A = lambda v: v if isinstance(v, list) else []
def kind(w):
    w = w.lower()
    if re.search(r'refers to both|both (sites|places) were|in the same .{0,30}(clashes|chronology|speech)', w): return None
    if re.search(r'not established|two different|different locations|both (were |are )?(named|mentioned|part of the same|guarded)|within a few days|guarded by troops|same (anniversary|celebration|broadcast|digest)', w): return None
    if re.search(r'co-?occur|same (report|article|document|list)|both (named|mentioned|appear)|only (a )?(mention|list)', w): return None
    if re.search(r'same (place|site|prison|base|compound|airport|building|location|facility)|is the same|refer to the same|renamed|former(ly)?|successor|now known', w): return None  # identity: handled by dedupe, not a connection
    if re.search(r'\bmob\b|rally|march(ed|ers)?\b|demonstrat|protest', w): return 'event'
    if re.search(r'moved .{0,20} from|from .{0,30} to the', w) and re.search(r'prison|detain|held|moved', w): return 'transfer'
    if re.search(r'strike|struck|bomb|attack|raid|shell|assault|stormed|fighting', w): return 'attack'
    if re.search(r'transferr|moved to|taken to|held at|detain|imprison|interrogat|prisoner', w): return 'transfer'
    if re.search(r'killed|casualt|wounded|dead|died|injur|hospital', w): return 'casualties'
    if re.search(r'part of|within|inside|adjacent|border|north|south|east|west|near|neighbou?r|next to|inland|coast', w): return 'same-place'
    if re.search(r'command|unit|brigade|battalion|force|agency|service|guard|ministry|run by|operated|controlled|garrison', w): return 'control'
    return None
U = lambda d: d.get('url') or d.get('cia') or d.get('ia')
DENY = {('green', 'wheelus')}  # contrast in a speech, not a connection
best = {}
for f in ('extract-other.jsonl', 'extract.jsonl'):
    for l in open(f'{ROOT}/archive/crest/{f}'):
        r = json.loads(l)
        if not (r.get('relevance') or 0) >= 2 or r['id'] not in docs: continue
        for k in A(r.get('links')):
            if not isinstance(k, dict): continue
            a, b, why = res(k.get('a')), res(k.get('b')), (k.get('why') or '').strip()
            if tuple(sorted((a or '', b or ''))) in DENY: continue
            if a not in ids or b not in ids or a == b or (a, b) in manual or not why: continue
            kd = kind(why)
            if not kd: continue
            key = (tuple(sorted((a, b))), kd)
            d = docs[r['id']]
            e = best.setdefault(key, {'a': a, 'b': b, 'kind': kd, 'why': why, 'year': None, 'confidence': 'reported', 'sources': []})
            if len(e['sources']) < 3 and U(d) not in [s['u'] for s in e['sources']]:
                e['sources'].append({'t': re.sub(r'\s+', ' ', d['title']).strip()[:140], 'u': U(d)})
out = sorted(best.values(), key=lambda e: (-len(e['sources']), e['a']))
json.dump(out, open(ROOT + '/archive/research/links-auto.json', 'w'), ensure_ascii=False, indent=1)
print(len(out), collections.Counter(e['kind'] for e in out), 'multi-source', sum(len(e['sources']) > 1 for e in out))
