"""Validated, append-only public content updates. Standard library only."""
from __future__ import annotations
import copy
import datetime as dt
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

BASELINE_SHA256 = 'dcb96d1176a98b77da8c723bb9b47415f4fd455c163f36312a5bda85a443d4cd'
SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
EDITABLE = {'name','born','field','title','bio','formula','impact','ref','sections','sources','questions','approximateBirth','extended','readMinutes','tex','qualification','aliases'}
REQUIRED = {'name','born','field','title','bio','formula','impact','sections','sources','questions'}
EVENT_KEYS = {'schema_version','event_id','source_key','created_at','kind','person_id','base_revision','summary','profile','connections_add','article_markdown'}

class ValidationError(ValueError):
    pass

def canonical(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(',',':'))

def revision(profile):
    return hashlib.sha256(canonical(profile).encode()).hexdigest()

def normalized(name):
    return ''.join(c for c in unicodedata.normalize('NFKD',name).casefold() if c.isalnum() and not unicodedata.combining(c))

def require(test, message):
    if not test: raise ValidationError(message)

def text(value, label, maximum=50000, allow_empty=False):
    require(isinstance(value,str), f'{label} must be text')
    require((allow_empty or bool(value.strip())) and len(value)<=maximum, f'{label} is empty or too long')
    require(not any(ord(c)<32 and c not in '\n\r\t' for c in value), f'{label} contains control characters')

def url(value):
    text(value,'source URL',3000)
    u=urlparse(value)
    require(u.scheme in {'https','http'} and u.netloc and not u.username and not u.password, 'Sources must use public HTTP(S) URLs without embedded credentials')

def validate_profile(p, fields):
    require(REQUIRED<=p.keys(), 'Missing required profile fields: '+', '.join(sorted(REQUIRED-p.keys())))
    require(SLUG.fullmatch(p['id']) is not None, 'Invalid canonical person ID')
    for key in ('name','title','bio','formula','impact'):
        text(p[key],key,50000 if key in {'bio','impact'} else 2500)
    require(type(p['born']) is int and -4000<=p['born']<=2100, 'born must be an integer year')
    require(p['field'] in fields,'Unknown field ID')
    require(type(p['extended']) is bool and type(p['approximateBirth']) is bool,'Profile flags must be booleans')
    require(type(p['readMinutes']) is int and 1<=p['readMinutes']<=240,'readMinutes must be 1–240')
    require(isinstance(p['sections'],list) and 1<=len(p['sections'])<=80,'A profile needs 1–80 sections')
    for i,s in enumerate(p['sections']):
        require(isinstance(s,dict),'Each section must be an object')
        require(set(s)<={'title','text','math','tex'},'New sections accept plain text/TeX, not HTML or SVG')
        for key in ('title','text'): text(s.get(key),f'section {i} {key}')
        for key in ('math','tex'):
            if key in s:text(s[key],key,10000,allow_empty=True)
    require(isinstance(p['questions'],list) and len(p['questions'])==3,'Provide exactly three questions')
    for q in p['questions']:text(q,'question',2000)
    require(isinstance(p['sources'],list) and 1<=len(p['sources'])<=30,'Provide 1–30 sources')
    for s in p['sources']:
        require(isinstance(s,dict) and set(s)<={'label','url','type'},'Invalid source fields')
        text(s.get('label'),'source label',2000);url(s.get('url'))
        if 'type' in s:text(s['type'],'source type',80)
    for key in ('tex','qualification','ref'):
        if key in p:text(p[key],key,20000,allow_empty=True)
    require(isinstance(p.get('aliases',[]),list) and len(p.get('aliases',[]))<=30,'aliases must be a short array')
    for alias in p.get('aliases',[]):text(alias,'alias',300)

def markdown_profile(p):
    chunks=[f"# {p['name']} — {p['title']}",p['bio'],p['impact'],p['formula']]
    for s in p['sections']:
        chunks += ['## '+s['title'],s['text']]
        if s.get('math'):chunks.append(s['math'])
        if s.get('tex'):chunks.append('```tex\n'+s['tex']+'\n```')
    chunks += ['## Three directions to explore']+[f'{i+1}. {q}' for i,q in enumerate(p['questions'])]
    chunks += ['## Sources']+[f"- [{s['label']}]({s['url']})" for s in p['sources']]
    return '\n\n'.join(chunks)+'\n'

def validate_event(e):
    require(isinstance(e,dict),'Update must be a JSON object')
    require(set(e)<=EVENT_KEYS,'Unknown update fields (private notebook data must never be uploaded): '+', '.join(set(e)-EVENT_KEYS))
    for key in ('schema_version','event_id','source_key','created_at','kind','person_id','base_revision','summary','profile'):
        require(key in e,'Missing update field: '+key)
    require(type(e['schema_version']) is int and e['schema_version']==1,'Unsupported schema version')
    for key in ('event_id','person_id'):
        require(isinstance(e[key],str) and len(e[key])<=120 and SLUG.fullmatch(e[key]),'Invalid '+key)
    require(e['kind'] in {'daily-profile','profile-edit'},'Unknown update kind')
    text(e['summary'],'summary',1000);text(e['source_key'],'source_key',200)
    try:
        instant=dt.datetime.strptime(e['created_at'],'%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=dt.timezone.utc)
    except (ValueError,TypeError):raise ValidationError('created_at must be a real UTC timestamp: YYYY-MM-DDTHH:MM:SSZ')
    if e['kind']=='daily-profile':
        require(re.fullmatch(r'daily:\d{4}-\d{2}-\d{2}',e['source_key']) is not None,'Daily source_key is daily:YYYY-MM-DD in Europe/Prague')
        try:dt.date.fromisoformat(e['source_key'][6:])
        except ValueError:raise ValidationError('Invalid daily source date')
        require(e['event_id']=='daily-'+e['source_key'][6:], 'Daily event_id must be daily-YYYY-MM-DD, independent of the person, to prevent duplicate runs')
        require(isinstance(e.get('article_markdown'),str) and e['article_markdown'].strip(),'Every daily profile must retain the complete delivered article as article_markdown')
    else:
        require(e['source_key'].startswith('edit:'),'An edit source_key starts with edit:')
    if 'article_markdown' in e:text(e['article_markdown'],'article_markdown',250000)
    require(e['base_revision'] is None or isinstance(e['base_revision'],str) and re.fullmatch('[a-f0-9]{64}',e['base_revision']),'base_revision must be null or a SHA-256 revision')
    require(isinstance(e['profile'],dict) and e['profile'],'profile must contain public profile fields')
    require(set(e['profile'])<=EDITABLE,'Unsupported or unsafe profile fields: '+', '.join(set(e['profile'])-EDITABLE))
    return instant

def apply_events(base, events):
    """Replay immutable events; stale/ambiguous changes stop publication, not last-write-wins."""
    data=copy.deepcopy(base)
    people={p['id']:p for p in data['people']}
    initial_delivered={p['id'] for p in data['people'] if p.get('extended')}
    seen_events=set();seen_sources=set();history=[]
    parsed=[(validate_event(e),e) for e in events]
    for _,e in sorted(parsed,key=lambda pair:(pair[0],pair[1]['event_id'])):
        require(e['event_id'] not in seen_events,'Duplicate event_id: '+e['event_id'])
        require(e['source_key'] not in seen_sources,'Duplicate source_key: '+e['source_key'])
        pid=e['person_id'];old=people.get(pid)
        require(e['base_revision']==(revision(old) if old else None),'Stale base_revision for '+pid+'; fetch the latest profile and reconcile')
        new=copy.deepcopy(old) if old else {'id':pid,'extended':True,'approximateBirth':False,'readMinutes':5,'ref':'','aliases':[]}
        new.update(copy.deepcopy(e['profile']))
        # Changing an equation must not leave an old pre-rendered equation displayed.
        if any(k in e['profile'] and (not old or e['profile'][k]!=old.get(k)) for k in ('formula','tex')):
            new.pop('mathSVG',None)
            if 'formula' in e['profile'] and 'tex' not in e['profile']:new.pop('tex',None)
        # Validate new/changed sections without rejecting the trusted baseline's embedded SVGs.
        check=copy.deepcopy(new)
        if 'sections' not in e['profile'] and old:
            check['sections']=[{k:v for k,v in s.items() if k in {'title','text','math','tex'}} for s in check['sections']]
        validate_profile(check,data['fields'])
        identities={normalized(new['name']),*(normalized(x) for x in new.get('aliases',[]))}
        require('' not in identities,'Empty normalized identity')
        for other_id,other in people.items():
            if other_id==pid:continue
            other_names={normalized(other['name']),*(normalized(x) for x in other.get('aliases',[]))}
            require(not identities.intersection(other_names),'Person already exists under ID '+other_id+'; update that ID instead')
        people[pid]=new
        if old:
            data['people']=[new if p['id']==pid else p for p in data['people']]
        else:data['people'].append(new)
        added=e.get('connections_add',[])
        require(isinstance(added,list) and len(added)<=30,'connections_add must be an array of at most 30 edges')
        existing={(x['source'],x['target'],x['label']) for x in data['connections']}
        for edge in added:
            require(isinstance(edge,dict) and set(edge)=={'source','target','label','description'},'An edge needs source, target, label and description')
            require(edge['source'] in people and edge['target'] in people and edge['source']!=edge['target'],'Invalid connection endpoints')
            for key in ('label','description'):text(edge[key],key,5000)
            key=(edge['source'],edge['target'],edge['label'])
            if key not in existing:data['connections'].append(copy.deepcopy(edge));existing.add(key)
        history.append({'event_id':e['event_id'],'source_key':e['source_key'],'created_at':e['created_at'],'kind':e['kind'],'person_id':pid,'name':new['name'],'summary':e['summary'],'revision':revision(new),'article_markdown':e.get('article_markdown') or markdown_profile(new)})
        seen_events.add(e['event_id']);seen_sources.add(e['source_key'])
    delivered=initial_delivered|{h['person_id'] for h in history if h['kind']=='daily-profile'}
    index={'schema_version':1,'baseline_sha256':BASELINE_SHA256,'people':[{'id':p['id'],'name':p['name'],'aliases':p.get('aliases',[]),'field':p['field'],'expanded':bool(p.get('extended')),'already_profiled':p['id'] in delivered,'revision':revision(p)} for p in data['people']], 'event_ids':[h['event_id'] for h in history], 'source_keys':[h['source_key'] for h in history]}
    return data,index,history

def load(root:Path):
    raw=(root/'src/catalogue.json').read_bytes()
    require(hashlib.sha256(raw).hexdigest()==BASELINE_SHA256,'Original catalogue changed. Preserve it and add an update record instead.')
    base=json.loads(raw)
    events=[]
    for p in sorted((root/'content/updates').glob('*.json')):
        require(p.stat().st_size<=500000,'Oversized update '+p.name)
        e=json.loads(p.read_text(encoding='utf-8'))
        validate_event(e)
        require(p.stem==e['event_id'],'Update filename must equal event_id: '+p.name)
        events.append(e)
    return apply_events(base,events)
