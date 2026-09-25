"""Build Reader's Edition + validated public updates, offline HTML and Pages artifacts."""
from pathlib import Path
import hashlib,json,os,shutil
from tools.catalogue import load,canonical,require,BASELINE_SHA256
ROOT=Path(__file__).resolve().parent
SRC=ROOT/'src'
SITE_URL='https://hadi1373z.github.io/atlas-of-ideas/'

def build(root:Path=ROOT):
    src=root/'src'
    data,index,history=load(root)
    data['exploration']=json.loads((src/'exploration.json').read_text(encoding='utf-8'))
    ids={p['id'] for p in data['people']}
    require(len(ids)==len(data['people']),'Duplicate profile IDs')
    require(all(e['source'] in ids and e['target'] in ids for e in data['connections']),'Dangling edge')
    require(all(i in ids for t in data['trails'] for i in t['ids']),'Dangling reading path')
    require(all(c['start'] in ids for c in data['exploration']['concepts']),'Dangling idea index')
    data['publications']=history
    data['publishing']={'repository':'https://github.com/hadi1373z/atlas-of-ideas','site':SITE_URL,'schemaVersion':1,'privateNotes':'browser-local'}
    # Do not reclassify the original historical profiles or change their text.
    source_material=canonical(data)+''.join((src/f).read_text(encoding='utf-8') for f in ('template.html','style.css','app.js'))
    source_material += (root/'build.py').read_text(encoding='utf-8') if (root/'build.py').exists() else ''
    source_material += (root/'tools/catalogue.py').read_text(encoding='utf-8') if (root/'tools/catalogue.py').exists() else ''
    build_id=hashlib.sha256(source_material.encode()).hexdigest()
    data['publishing']['buildId']=build_id
    data['publishing']['sourceCommit']=os.environ.get('ATLAS_SOURCE_COMMIT',os.environ.get('GITHUB_SHA','local-unpublished'))
    site=(src/'template.html').read_text(encoding='utf-8')
    for token,value in {
      '/*__STYLE__*/':(src/'style.css').read_text(encoding='utf-8'),
      '/*__DATA__*/':json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'),
      '/*__SCRIPT__*/':(src/'app.js').read_text(encoding='utf-8'),
      '__PROFILE_COUNT__':str(len(ids)),
      '__CONNECTION_COUNT__':str(len(data['connections'])),
      '__SITE_URL__':SITE_URL,
    }.items():site=site.replace(token,value)
    (root/'index.html').write_text(site,encoding='utf-8')
    out=root/'_site'
    if out.exists():shutil.rmtree(out)
    out.mkdir();(out/'index.html').write_text(site,encoding='utf-8');(out/'.nojekyll').touch()
    digest=hashlib.sha256(site.encode()).hexdigest()
    manifest={'schema_version':1,'build_id':build_id,'html_sha256':digest,'source_commit':data['publishing']['sourceCommit'],'baseline_sha256':BASELINE_SHA256,'profiles':len(ids),'connections':len(data['connections']),'reading_paths':len(data['trails']),'updates':len(history),'event_ids':index['event_ids'],'source_keys':index['source_keys']}
    index.update({'build_id':build_id,'source_commit':manifest['source_commit']})
    for file,contents in [('version.json',manifest),('catalogue-index.json',index),('updates.json',history)]:
        (out/file).write_text(json.dumps(contents,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    schema=root/'schemas/update.schema.json'
    if schema.exists():shutil.copyfile(schema,out/'update.schema.json')
    (out/'profiles').mkdir();(out/'journal').mkdir()
    for p in data['people']:(out/'profiles'/f"{p['id']}.json").write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for h in history:(out/'journal'/f"{h['event_id']}.md").write_text(h['article_markdown'],encoding='utf-8')
    print(f'Built {len(ids)} profiles, {len(history)} updates; build {build_id[:16]}; artifacts: _site/')
    return manifest
if __name__=='__main__':build()
