#!/usr/bin/env python3
"""One-time authenticated GitHub Pages bootstrap. Does not require Git or third-party Python packages.

Uses your locally authenticated GitHub CLI. It never prints, stores, or uploads your token.
Run: python tools/publish_github.py
Inspect without network/writes: python tools/publish_github.py --dry-run
"""
from __future__ import annotations
import argparse,base64,json,os,shutil,subprocess,sys,time,urllib.error,urllib.request
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from build import build
from tools.verify_live import verify
ROOT=Path(__file__).resolve().parents[1]
REPO='hadi1373z/atlas-of-ideas'
SITE='https://hadi1373z.github.io/atlas-of-ideas/'

def local_token():
    """Read an existing local login without printing or persisting its token."""
    if shutil.which('gh'):
        result=subprocess.run(['gh','auth','token','--hostname','github.com'],capture_output=True,text=True,timeout=30)
        if result.returncode==0 and result.stdout.strip():return result.stdout.strip()
    request='protocol=https\nhost=github.com\nusername=hadi1373z\n\n'
    result=subprocess.run(['git','credential-manager','get'],input=request,capture_output=True,text=True,timeout=30,
      env={**os.environ,'GIT_TERMINAL_PROMPT':'0','GCM_INTERACTIVE':'never'})
    if result.returncode:
        raise RuntimeError('No usable GitHub login in Windows Credential Manager. Run git credential-manager github login --username hadi1373z --browser.')
    fields=dict(line.split('=',1) for line in result.stdout.splitlines() if '=' in line)
    token=fields.get('password')
    if not token:raise RuntimeError('GitHub Credential Manager returned no token.')
    return token

class APIError(RuntimeError):
    def __init__(self,status,body):self.status=status;super().__init__(f'GitHub HTTP {status}: {body[:800]}')

class GitHubAPI:
    def __init__(self,token):self.token=token
    def call(self,method,path,payload=None):
        raw=json.dumps(payload).encode() if payload is not None else None
        req=urllib.request.Request('https://api.github.com/'+path.lstrip('/'),data=raw,method=method,headers={
          'Authorization':'Bearer '+self.token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Atlas-Reader-Edition-Publisher','Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(req,timeout=60) as r:
                body=r.read();return json.loads(body) if body else {}
        except urllib.error.HTTPError as e:raise APIError(e.code,e.read().decode('utf-8',errors='replace')) from None

def files_to_publish(root):
    # Explicit allowlist: no environment, credentials, local notes, screenshots or local caches.
    fixed=['README.md','README-READER-EDITION.md','AGENTS.md','CHANGELOG.md','build.py','index.html','.gitignore']
    files=[root/f for f in fixed if (root/f).is_file()]
    for directory in ('src','tools','docs','schemas','content','.github'):
        for p in (root/directory).rglob('*'):
            if p.is_file() and '__pycache__' not in p.parts and p.suffix in {'.py','.js','.cjs','.json','.css','.html','.md','.yml','.yaml','.txt'}:files.append(p)
    for p in (root/'tests').glob('*.py'):
        if p.is_file():files.append(p)
    return sorted(set(files),key=lambda p:p.relative_to(root).as_posix())

def bootstrap(api,root):
    endpoint='repos/'+REPO
    repo=api.call('GET',endpoint)
    if not repo.get('permissions',{}).get('push'):raise RuntimeError('Authenticated account lacks repository push permission')
    branch=repo.get('default_branch','main')
    if branch!='main':raise RuntimeError('Default branch is not main; review before changing configuration')
    # Empty-repository check: do not overwrite an existing site or unrelated work.
    try:
        head=api.call('GET',endpoint+'/git/ref/heads/main')['object']['sha']
        current=api.call('GET',endpoint+'/git/commits/'+head)
        tree=api.call('GET',endpoint+'/git/trees/'+current['tree']['sha']+'?recursive=1')
        existing={x['path'] for x in tree.get('tree',[]) if x['type']=='blob'}
        if existing-{'README.md'}:
            raise RuntimeError('Repository already contains files. Stop to reconcile them; use the documented incremental update path instead of bootstrap.')
    except APIError as e:
        if e.status not in {404,409}:raise
        # A successful first write establishes main. A 403 is not retried or bypassed.
        init=api.call('PUT',endpoint+'/contents/README.md',{'message':'Initialize Atlas Reader’s Edition','content':base64.b64encode((root/'README.md').read_bytes()).decode(),'branch':'main'})
        head=init['commit']['sha']
    build(root)
    elements=[]
    for path in files_to_publish(root):
        rel=path.relative_to(root).as_posix()
        blob=api.call('POST',endpoint+'/git/blobs',{'content':base64.b64encode(path.read_bytes()).decode(),'encoding':'base64'})
        elements.append({'path':rel,'mode':'100644','type':'blob','sha':blob['sha']})
        print('Prepared',rel)
    parent=api.call('GET',endpoint+'/git/commits/'+head)
    tree=api.call('POST',endpoint+'/git/trees',{'base_tree':parent['tree']['sha'],'tree':elements})
    commit=api.call('POST',endpoint+'/git/commits',{'message':'Publish actual Reader’s Edition with validated daily-profile updates','tree':tree['sha'],'parents':[head]})
    # Never force-push. A concurrent change makes this update fail safely.
    api.call('PATCH',endpoint+'/git/refs/heads/main',{'sha':commit['sha'],'force':False})
    print('Source committed:',commit['sha'])
    try:
        api.call('GET',endpoint+'/pages')
        api.call('PUT',endpoint+'/pages',{'build_type':'workflow'})
    except APIError as e:
        if e.status!=404:raise
        api.call('POST',endpoint+'/pages',{'build_type':'workflow'})
    # Initial push may run before Pages is enabled. Dispatch after configuration explicitly.
    api.call('POST',endpoint+'/actions/workflows/pages.yml/dispatches',{'ref':'main'})
    print('GitHub Pages configured. Checking deployed content, not only the URL.')
    for _ in range(30):
        try:
            result=verify(SITE,expected_commit=commit['sha'])
            print('VERIFIED LIVE:',SITE)
            (root/'publish-status.local.json').write_text(json.dumps({'verified':True,'url':SITE,**result},indent=2)+'\n')
            return result
        except (OSError,ValueError,KeyError,RuntimeError):time.sleep(10)
    raise RuntimeError('Source and Pages configuration were submitted, but live deployment was not verified. Inspect the repository Actions tab and run tools/verify_live.py again.')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--dry-run',action='store_true');a=p.parse_args()
    try:
        if a.dry_run:
            build();print('NO NETWORK OR WRITES. Planned public files:')
            for f in files_to_publish(ROOT):print(f.relative_to(ROOT))
            print('Target:',REPO,'\nPages:',SITE);sys.exit(0)
        bootstrap(GitHubAPI(local_token()),ROOT)
    except (APIError,RuntimeError,OSError,ValueError) as e:
        print('Publication not verified:',e,file=sys.stderr)
        print('No force-push was used. The GitHub connector needs separate repository access for future ChatGPT updates.',file=sys.stderr);sys.exit(1)
