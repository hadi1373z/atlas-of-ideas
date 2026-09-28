"""Validate editorial layers without mutating the preserved baseline or events."""
import json
from tools.catalogue import require, text, url

PLATES={'computation','information','learning','verification','approximation','symmetry'}
KINDS={'Thematic comparison','Mathematical connection','Documented research lineage','Documented mathematical equivalence','Documented supervision'}

def enrich(root, data):
    concepts=data['exploration']['concepts']
    ids={c['id'] for c in concepts}
    require(len(ids)==len(concepts),'Duplicate idea ID')
    for c in concepts:
        if 'plate' in c:
            require(c['plate'] in PLATES,'Unknown idea illustration')
            for key in ('caption','takeaway','explanation'):text(c.get(key),'idea '+key)
            require(bool(c.get('sources')),'Illustrated idea needs sources')
        for s in c.get('sources',[]):
            text(s.get('label'),'idea source');url(s.get('url'))
        for b in c.get('bridges',[]):
            require(b['to'] in ids and b['to']!=c['id'],'Dangling idea bridge')
            text(b.get('why'),'idea bridge explanation')
    path=root/'content/connection-notes.json'
    if not path.exists():return
    edges={(e['source'],e['target'],e['label']):e for e in data['connections']}
    seen=set()
    for note in json.loads(path.read_text(encoding='utf-8')):
        key=tuple(note[k] for k in ('source','target','label'))
        require(key in edges,'Connection note has no matching edge: '+str(key))
        require(key not in seen,'Duplicate connection note');seen.add(key)
        require(note['kind'] in KINDS,'Unknown connection kind')
        text(note['description'],'connection explanation')
        require(bool(note['sources']),'Connection note needs sources')
        for s in note['sources']:text(s.get('label'),'connection source');url(s.get('url'))
        edges[key].update({k:note[k] for k in ('kind','description','sources')})
