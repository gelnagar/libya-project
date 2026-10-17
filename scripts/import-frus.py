"""Import Libya-related documents from Foreign Relations of the United States (FRUS).

FRUS is published by the U.S. State Department's Office of the Historian as TEI XML at
https://github.com/HistoryAtState/frus. U.S. government works are public domain, so the
full text is kept and may be shown on the map.

Usage: python3 scripts/import-frus.py /path/to/frus/volumes
Writes archive/records/frus.json and archive/fulltext/<id>.txt
"""
import sys, re, glob, json, os
from lxml import etree

NS = {'t': 'http://www.tei-c.org/ns/1.0'}
FRUS_NS = '{http://history.state.gov/frus/ns/1.0}'
XML_ID = '{http://www.w3.org/XML/1998/namespace}id'
KW = re.compile(r'\b(Libya|Libyan|Libyans|Tripoli|Qadhafi|Qaddafi|Gadhafi|Wheelus|Jamahiriya|Benghazi|Jallud)\b')
CORE = {'frus1981-88v24', 'frus1977-80v17p3', 'frus1969-76ve05p2', 'frus1969-76ve09p1'}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
clean = lambda s: re.sub(r'\s+', ' ', s or '').strip()

def text_without_notes(el):
    parts = []
    def walk(e):
        if e.tag in ('{%s}note' % NS['t'],): return
        if e.text: parts.append(e.text)
        for c in e:
            walk(c)
            if c.tail: parts.append(c.tail)
    walk(el)
    return clean(''.join(parts))

def paragraphs(doc):
    out = []
    for p in doc.xpath('.//t:p | .//t:item | .//t:closer | .//t:signed', namespaces=NS):
        if p.xpath('ancestor::t:note', namespaces=NS): continue
        t = text_without_notes(p)
        if t: out.append(t)
    return out

def doc_type(head):
    h = head.lower()
    if any(k in h for k in ('intelligence', 'estimate', 'central intelligence agency', 'national intelligence')): return 'intelligence assessment'
    if 'telegram' in h: return 'diplomatic cable'
    if 'conversation' in h: return 'record of conversation'
    if 'editorial note' in h: return 'editorial note'
    if 'letter' in h: return 'letter'
    if 'directive' in h or 'decision' in h: return 'policy directive'
    return 'government document'

def main(voldir):
    records = []
    os.makedirs(os.path.join(ROOT, 'archive', 'fulltext'), exist_ok=True)
    for f in sorted(glob.glob(os.path.join(voldir, 'frus19*.xml'))):
        vol = os.path.basename(f)[:-4]
        if not re.match(r'frus(1969-76|1977-80|1981-88)', vol): continue
        tree = etree.parse(f)
        vtitle = clean(' '.join(tree.xpath('//t:titleStmt/t:title[@type="complete"]//text()', namespaces=NS)))
        for d in tree.xpath('//t:div[@type="document"]', namespaces=NS):
            full = ' '.join(d.itertext())
            hits = KW.findall(full)
            trip = len(re.findall(r'\bTripoli\b', full))
            if not ((vol in CORE and len(hits) >= 2) or len(hits) >= 8 or trip >= 3): continue
            hd = d.find('t:head', NS)
            title = text_without_notes(hd) if hd is not None else ''
            title = re.sub(r'^\d+\.\s*', '', title)
            srcnote = ''
            if hd is not None:
                n = hd.find('.//t:note[@type="source"]', NS)
                if n is None: n = hd.find('.//t:note', NS)
                if n is not None: srcnote = clean(' '.join(n.itertext()))
            date = (d.get(FRUS_NS + 'doc-dateTime-min') or '')[:10]
            dateline = clean(' '.join(d.xpath('.//t:dateline//text()', namespaces=NS)))[:160]
            paras = paragraphs(d)
            body = '\n\n'.join(paras)
            summ = ''
            for p in paras[:6]:
                m = re.match(r'^(?:\d+\.\s*)?\(?[A-Z/ ]{0,12}\)?\s*Summary[:.]\s*(.*)', p, re.I)
                if m and len(m.group(1)) > 60: summ = m.group(1); break
            if not summ:
                if vol in CORE:
                    summ = ' '.join(paras[:3])
                else:
                    # Outside the North Africa volumes, show the passages that are about Libya.
                    scored = sorted(((len(KW.findall(p)), i, p) for i, p in enumerate(paras)), key=lambda x: (-x[0], x[1]))
                    best = sorted([x for x in scored if x[0] > 0][:3], key=lambda x: x[1])
                    summ = ' … '.join(x[2] for x in best) or ' '.join(paras[:2])
            summ = re.sub(r'^\d+\.\s+(?=Subject)', '', summ)
            if len(summ) > 900: summ = summ[:900].rsplit(' ', 1)[0] + '…'
            rid = 'frus-' + vol.replace('frus', '') + '-' + d.get(XML_ID)
            rec = {
                'id': rid,
                'type': doc_type(title + ' ' + srcnote[:200]),
                'title': title[:300],
                'date': date,
                'source': 'U.S. Department of State, Office of the Historian',
                'collection': vtitle,
                'doc_number': d.get('n'),
                'language': 'en',
                'summary': summ,
                'dateline': dateline,
                'archive_ref': srcnote[:600],
                'link': 'https://history.state.gov/historicaldocuments/%s/%s' % (vol, d.get(XML_ID)),
                'rights': 'public-domain',
                'rights_note': 'U.S. government work, public domain. Full text may be shown.',
                'fulltext': True,
                'mentions': {'libya_terms': len(hits), 'tripoli': trip},
                'added': '2026-10-17'
            }
            records.append(rec)
            with open(os.path.join(ROOT, 'archive', 'fulltext', rid + '.txt'), 'w') as fh:
                fh.write(title + '\n' + (dateline + '\n' if dateline else '') + '\n' + body + ('\n\nSource: ' + srcnote if srcnote else ''))
    records.sort(key=lambda r: (r['date'] or '9999', r['id']))
    with open(os.path.join(ROOT, 'archive', 'records', 'frus.json'), 'w') as fh:
        json.dump(records, fh, ensure_ascii=False, indent=1)
    print(len(records), 'records')

if __name__ == '__main__':
    main(sys.argv[1])
