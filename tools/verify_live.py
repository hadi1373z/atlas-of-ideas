#!/usr/bin/env python3
"""Check deployed bytes, not only a 200 response or a guessed Pages URL."""
from __future__ import annotations
import argparse,hashlib,json,re,time,urllib.error,urllib.request,sys
from urllib.parse import urljoin,urlparse

def fetch(url):
    req=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'Atlas-of-Ideas-deployment-check'})
    with urllib.request.urlopen(req,timeout=25) as r:
        if r.status!=200:raise RuntimeError(f'HTTP {r.status}: {url}')
        if urlparse(r.url).netloc!=urlparse(url).netloc:raise RuntimeError('Unexpected cross-host redirect')
        return r.read()

def verify(base,expected_commit=None,expected_event=None,expected_build=None):
    if not base.endswith('/'):base+='/'
    nonce=str(time.time_ns())
    version=json.loads(fetch(urljoin(base,'version.json')+'?verify='+nonce))
    if expected_commit and version.get('source_commit')!=expected_commit:raise RuntimeError('Site has not reached the expected source commit')
    if expected_event and expected_event not in version.get('event_ids',[]):raise RuntimeError('Update not yet present in live manifest')
    if expected_build and version.get('build_id')!=expected_build:raise RuntimeError('Unexpected build ID')
    html=fetch(base+'?verify='+nonce)
    if hashlib.sha256(html).hexdigest()!=version.get('html_sha256'):raise RuntimeError('Live HTML bytes and version.json do not match')
    m=re.search(rb'<script id="atlas-data" type="application/json">(.*?)</script>',html,re.S)
    if not m:raise RuntimeError('Missing Atlas catalogue in deployed HTML')
    data=json.loads(m.group(1))
    if data['publishing']['buildId']!=version['build_id']:raise RuntimeError('Embedded build differs from manifest')
    if len(data['people'])!=version['profiles']:raise RuntimeError('Profile count differs from manifest')
    if 'atlas-of-ideas-v1' not in html.decode('utf-8'):raise RuntimeError('Legacy notebook storage key missing')
    index=json.loads(fetch(urljoin(base,'catalogue-index.json')+'?verify='+nonce))
    if index.get('build_id')!=version['build_id']:raise RuntimeError('Catalogue index belongs to a different build')
    return version

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--url',default='https://hadi1373z.github.io/atlas-of-ideas/')
    p.add_argument('--commit');p.add_argument('--event');p.add_argument('--build');p.add_argument('--attempts',type=int,default=1);p.add_argument('--delay',type=float,default=10)
    a=p.parse_args();error=None
    for i in range(max(1,a.attempts)):
        try:
            v=verify(a.url,a.commit,a.event,a.build)
            print(json.dumps({'verified':True,'url':a.url,**v},indent=2));sys.exit(0)
        except (OSError,ValueError,KeyError,RuntimeError) as e:
            error=e
            if i+1<a.attempts:time.sleep(a.delay)
    print('Deployment NOT verified: '+str(error),file=sys.stderr);sys.exit(1)
