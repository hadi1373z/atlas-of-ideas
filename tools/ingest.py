#!/usr/bin/env python3
"""Validate and store one update locally. Retries are idempotent. No remote writes."""
import argparse,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from tools.catalogue import load, validate_event, canonical, ValidationError
ROOT=Path(__file__).resolve().parents[1]
def ingest(payload:Path,root:Path=ROOT):
    event=json.loads(payload.read_text(encoding='utf-8'));validate_event(event)
    out=root/'content/updates'/(event['event_id']+'.json')
    if out.exists():
        if canonical(json.loads(out.read_text(encoding='utf-8')))==canonical(event):return out,False
        raise ValidationError('This event ID already exists with different content. Create a new profile-edit record; do not overwrite history.')
    out.parent.mkdir(parents=True,exist_ok=True)
    # Exclusive create; roll back an invalid record, leaving prior content untouched.
    with out.open('x',encoding='utf-8') as f:json.dump(event,f,ensure_ascii=False,indent=2);f.write('\n')
    try:load(root)
    except BaseException:out.unlink();raise
    return out,True
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('payload',type=Path);a=p.parse_args()
    try:
        path,changed=ingest(a.payload);print(('Validated new record: ' if changed else 'Already present, no change: ')+str(path))
    except (OSError,ValueError) as e:print('Not ingested:',e,file=sys.stderr);sys.exit(1)
