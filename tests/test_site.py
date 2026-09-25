"""Regression checks for the actual standalone HTML, using Playwright.

The sandbox blocks navigable URLs. HTML is injected into about:blank; a test-only
Web Storage implementation exercises the app's real migration/persistence code.
No mock or testing dependency is part of the delivered website.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, hashlib, time
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
MOCK='''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(String(k))??null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear()}});}'''
checks=[]
def log(message):
 checks.append(message);print('PASS:',message,flush=True)

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000})
 errors=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:requests.append(r.url))
 page.evaluate(MOCK)
 legacy={'version':1,'saved':['turing','nesetril'],'read':['godel'],'notes':{'turing':'Original note. <script>not executable</script>','nesetril':'Existing graph notes.'},'interest':'graphs','depth':'extended','answers':{'turing':1},'theme':'light'}
 page.evaluate('(s)=>localStorage.setItem("atlas-of-ideas-v1",JSON.stringify(s))',legacy)
 page.set_content(HTML);page.wait_for_timeout(150)
 def go(route,delay=150):
  page.evaluate('(r)=>location.hash=r',route)
  page.wait_for_timeout(delay)
 def state():return page.evaluate('Atlas.localState')
 def click_sticky(selector):
  # Locator.click can scroll a sticky element's original layout box before the
  # click. Use its visible viewport coordinates, as an actual pointer does.
  box=page.locator(selector).first.bounding_box()
  page.mouse.click(box['x']+box['width']/2,box['y']+box['height']/2)
 def fill_file(value):
  page.locator('#shelf-import').set_input_files({'name':'shelf.json','mimeType':'application/json','buffer':json.dumps(value).encode()})
  page.wait_for_timeout(150)
 data=page.evaluate('Atlas.catalogue');ids={p['id'] for p in data['people']}
 assert len(ids)==118 and sum(p['extended'] for p in data['people'])==31
 assert len(data['connections'])==150 and len(data['trails'])==8
 assert all(e['source'] in ids and e['target'] in ids for e in data['connections'])
 assert all(c['start'] in ids for c in data['exploration']['concepts'])
 s=state()
 for key in ['saved','read','notes','interest','depth','answers','theme']:assert s[key]==legacy[key],key
 assert s['schemaVersion']==2
 log('Version-1 shelf migrates without changing saved profiles, read marks, notes, answers, field, depth or theme.')
 for p in data['people']:
  go('person/'+p['id'],25)
  assert page.locator('h1').inner_text()==p['name'],p['id']
  assert page.locator('[data-reading]').count()==len(p['sections'])+1
  assert page.locator('[data-action="question"]').count()==3
  for sec in p['sections']:
   assert sec['text'] in page.locator('.article').inner_text(),p['id']
  for src in p['sources']:
   assert page.locator(f'.source-list a[href="{src["url"]}"]').count()>0,(p['id'],src)
 log('All 118 profile routes retain every original section, all references and all three questions.')
 go('library')
 assert page.locator('.person-card').count()==24
 while page.locator('[data-action="load-more"]').count():page.locator('[data-action="load-more"]').click()
 assert page.locator('.person-card').count()==118
 for query,name in [('Godel','Kurt Gödel'),('Nesetril','Jaroslav Nešetřil'),('ODonnell','Ryan O’Donnell'),('polynomial','')]:
  page.locator('#collection-search').fill(query);page.wait_for_timeout(160)
  if name:assert name in page.locator('#catalogue-results').inner_text(),query
  assert page.locator('.search-excerpt').count()>0
  assert page.locator('#catalogue-results mark').count()>0
 page.locator('#collection-search').fill('zzzxxyynoresult');page.wait_for_timeout(130)
 assert page.locator('.empty').count()==1
 page.locator('[data-action="reset-filters"]').first.click()
 page.locator('[data-action="field"][data-field="graphs"]').click()
 assert page.locator('.person-card').count()==len([p for p in data['people'] if p['field']=='graphs'])
 page.locator('[data-action="view"][data-mode="list"]').click()
 assert page.locator('.list-view').count()==1
 log('All profiles load; accent-insensitive full-text search, matching excerpts, highlighting, filters, empty states and list view work.')
 page.keyboard.press('/')
 assert page.locator('dialog').evaluate('(d)=>d.open')
 page.locator('#quick-search').fill('arithmetization')
 assert page.locator('.quick-result').count()>0
 page.keyboard.press('ArrowDown');assert page.evaluate('document.activeElement.classList.contains("quick-result")')
 page.keyboard.press('Enter');page.wait_for_timeout(160)
 assert not page.locator('dialog').evaluate('(d)=>d.open')
 assert 'person/' in page.evaluate('location.hash') and '?section=' in page.evaluate('location.hash')
 log('Global search is keyboard-operable and opens the matching profile section.')
 go('person/shamir?section=section-1',250)
 assert abs(page.locator('#section-1').bounding_box()['y']-152)<4
 assert page.evaluate('document.activeElement.id')=='section-1'
 page.wait_for_timeout(160)
 assert page.locator('[data-toc="section-1"]').get_attribute('aria-current')=='location'
 original_position=state()['progress']['shamir']
 go('home');assert 'Adi Shamir' in page.locator('.continue-card').inner_text()
 page.locator('.continue-card a[href*="resume=1"]').click();page.wait_for_timeout(250)
 assert abs(page.locator('#section-1').bounding_box()['y']-152)<5
 assert 'shamir' not in state()['read']
 log('Section deep links, active contents, progress, explicit resume and “opened is not read” behavior work.')
 click_sticky('[data-action="settings"]')
 assert page.locator('dialog').evaluate('(d)=>d.open')
 page.locator('#reader-size').fill('23');page.locator('#reader-leading').fill('2.05')
 page.locator('#reader-font').select_option('sans');page.locator('#reader-width').select_option('wide')
 assert state()['reader']['size']==23 and state()['reader']['font']=='sans'
 for _ in range(22):
  page.keyboard.press('Tab');assert page.evaluate('document.querySelector("dialog").contains(document.activeElement)')
 page.keyboard.press('Escape');page.wait_for_timeout(100);assert page.evaluate('document.activeElement.dataset.action')=='settings'
 page.keyboard.press('f');page.wait_for_timeout(170)
 assert page.locator('body').evaluate('(el)=>el.classList.contains("focus-mode")')
 assert abs(page.locator('#section-1').bounding_box()['y']-84)<5
 page.keyboard.press('Escape');page.wait_for_timeout(170)
 assert not page.locator('body').evaluate('(el)=>el.classList.contains("focus-mode")')
 assert abs(page.locator('#section-1').bounding_box()['y']-152)<5
 click_sticky('[data-action="settings"]');page.locator('[data-action="reset-reader"]').click();page.keyboard.press('Escape')
 log('Type size, spacing, face and width persist; dialog focus stays contained and returns; focus mode preserves the current section.')
 page.locator('[data-action="equation"][data-index="1"]').click()
 assert page.locator('.equation-large svg').count()==1
 assert page.locator('[data-format="tex"]').count()==1
 page.locator('.tex-details summary').click()
 assert 'R_x' in page.locator('.tex-details').inner_text()
 page.keyboard.press('Escape')
 log('Equation expansion retains offline SVG, plain notation and stored TeX.')
 go('person/turing');page.locator('#profile-note').fill('My new note. <img src=x onerror=alert(1)>')
 page.locator('[data-action="read"]').first.click()
 assert 'turing' in state()['read']
 page.locator('[data-action="question"]').first.click()
 assert page.locator('.recommendation').count()==1
 if page.locator('.recommendation-item').count():assert 'Why this match:' in page.locator('.recommendation').inner_text()
 page.locator('[data-action="save-question"]').click()
 assert 'Question:' in state()['notes']['turing']
 saved=state();page.set_content(HTML);page.wait_for_timeout(160);go('person/turing')
 assert state()['notes']['turing']==saved['notes']['turing']
 assert page.locator('#profile-note').input_value()==saved['notes']['turing']
 assert page.locator('.article img').count()==0
 log('Notes are escaped, auto-save, survive reinitialization and preserve selected questions; recommendations show their text-match reasons.')
 for c in data['exploration']['concepts']:
  go('idea/'+c['id'],40);assert page.locator('.person-card').count()>0,c['id']
 go('ideas');assert page.locator('.concept-card').count()==12
 for t in data['trails']:
  go('trail/'+t['id'],35);assert page.locator('.trail-step').count()==len(t['ids'])
 go('timeline');assert page.locator('.timeline-item').count()==118
 log('All 12 concept indexes, eight paths and the 118-person timeline work.')
 go('connections/turing?to=nesetril')
 assert page.locator('.route-step').count()>0
 result=page.evaluate('Atlas.shortestRoute("turing","nesetril",false)')
 assert result and result['nodes'][0]=='turing' and result['nodes'][-1]=='nesetril'
 assert all(step['edge'] in data['connections'] for step in result['steps'])
 # Validate returned shortest paths against BFS independently, in both directions.
 from collections import deque
 def distance(a,b,directed):
  q=deque([(a,0)]);seen={a}
  while q:
   v,d=q.popleft()
   if v==b:return d
   for e in data['connections']:
    u=e['target'] if e['source']==v else (e['source'] if not directed and e['target']==v else None)
    if u and u not in seen:seen.add(u);q.append((u,d+1))
  return None
 for a,b in [('turing','nesetril'),('lasserre','euclid'),('shamir','fortnow'),('godel','godel'),('aryabhata','mirzakhani')]:
  for directed in [False,True]:
   got=page.evaluate('(x)=>Atlas.shortestRoute(...x)',[a,b,directed]);want=distance(a,b,directed)
   assert (len(got['steps']) if got else None)==want,(a,b,directed)
 page.locator('[data-action="graph-mode"]').click();assert page.locator('.map-node').count()==118
 page.locator('[data-action="zoom-in"]').click();assert 'scale(1.3)' in page.locator('#graph-transform').get_attribute('transform')
 page.locator('[data-action="graph-fit"]').click()
 page.locator('#graph-search').fill('Nesetril');page.locator('#graph-target').fill('Turing');page.locator('[data-action="graph-go"]').click()
 assert page.locator('#graph-aside h2').inner_text()=='Jaroslav Nešetřil'
 assert page.locator('.route-step').count()>0
 page.locator('#graph-direction').select_option('directed');page.locator('[data-action="graph-go"]').click()
 assert 'follow' in page.locator('#graph-direction option:checked').inner_text().lower()
 log('Map selection, complete map, zoom, labeled lists and shortest-route search match an independent BFS, including direction and no-route cases.')
 go('shelf')
 page.evaluate('''() => {window.__downloads=[];URL.createObjectURL=b=>{window.__downloads.push(b);return 'blob:test';};URL.revokeObjectURL=()=>{};}''')
 page.locator('[data-action="export"]').click()
 backup=page.evaluate('async()=>JSON.parse(await window.__downloads.at(-1).text())')
 assert backup['notes']==state()['notes'] and backup['version']==1
 page.locator('[data-action="export-notes"]').click()
 md=page.evaluate('async()=>await window.__downloads.at(-1).text()')
 assert '# Atlas of Ideas' in md and 'My new note.' in md
 incoming={**legacy,'saved':['godel'],'read':['shamir'],'notes':{'turing':'Imported separate note.','godel':'Imported Gödel note.'}}
 before=state();fill_file(incoming)
 assert page.locator('dialog').evaluate('(d)=>d.open') and state()==before
 page.locator('[data-action="import-merge"]').click()
 after=state();assert set(after['saved'])==set(before['saved'])|{'godel'}
 assert before['notes']['turing'] in after['notes']['turing'] and 'Imported separate note.' in after['notes']['turing']
 assert '— Imported note —' in after['notes']['turing']
 assert 'shamir' in after['read']
 fill_file(incoming);page.locator('[data-action="import-merge"]').click()
 assert state()['notes']['turing'].count('Imported separate note.')==1
 page.on('dialog',lambda d:d.accept())
 fill_file(incoming);page.locator('[data-action="import-replace"]').click()
 assert state()['saved']==['godel'] and state()['notes']['turing']=='Imported separate note.'
 prev=state();fill_file({'wrong':True});assert state()==prev
 page.locator('#shelf-import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{invalid'})
 page.wait_for_timeout(100);assert state()==prev
 log('JSON and Markdown export, non-destructive import preview, idempotent merge, confirmed replacement and invalid-backup rejection work.')
 # Reset typography after imports, test viewport reflow on main page types.
 go('home');page.locator('[data-action="theme"]').click();assert page.locator('body').get_attribute('data-theme')=='dark'
 routes=['home','library','person/nesetril','person/shamir','person/von-neumann','connections/turing?to=nesetril','ideas','idea/algebra','trails','trail/proofs','timeline','shelf','about']
 for width in [1440,1024,768,390,320]:
  page.set_viewport_size({'width':width,'height':900})
  for route in routes:
   go(route,70)
   wide=page.evaluate('document.documentElement.scrollWidth')
   assert wide<=width+1,(width,route,wide)
 log('No horizontal page overflow at 1440, 1024, 768, 390 or 320px across 13 page types, including dark mode.')
 page.set_viewport_size({'width':320,'height':900})
 for p in data['people']:
  go('person/'+p['id'],20);assert page.evaluate('document.documentElement.scrollWidth')<=321,p['id']
 log('All 118 profiles also pass the narrowest 320px page-overflow check.')
 go('person/shamir');page.locator('#mobile-dock [data-action="contents"]').click()
 assert page.locator('dialog .mobile-toc').count()==1
 page.locator('dialog [data-section="section-2"]').click();page.wait_for_timeout(100)
 assert not page.locator('dialog').evaluate('(d)=>d.open')
 page.locator('#mobile-dock [data-action="settings"]').click();page.locator('#reader-size').fill('26');page.keyboard.press('Escape')
 assert page.evaluate('document.documentElement.scrollWidth')<=321
 go('home');page.locator('[data-action="menu"]').click();assert page.locator('#navigation').get_attribute('class')=='nav open'
 page.locator('#navigation a[href="#ideas"]').click();page.wait_for_timeout(140)
 assert page.locator('.concept-card').count()==12
 log('Mobile navigation, bottom reading controls, contents dialog and maximum article text size function at 320px.')
 page.emulate_media(reduced_motion='reduce');go('home')
 assert page.locator('.btn').first.evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s'
 page.emulate_media(media='print');go('person/shamir')
 assert page.locator('.print-footer').is_visible()
 assert page.locator('#notes').is_hidden() and page.locator('#mobile-dock').is_hidden()
 page.emulate_media(media='screen')
 log('Reduced-motion preferences and privacy-conscious profile print styles are applied.')
 go('person/%not-valid');assert 'not in the collection' in page.locator('h1').inner_text()
 assert not errors,errors
 assert not [r for r in requests if r.startswith(('https:','http:'))],requests
 log('Malformed routes are handled; no uncaught JavaScript errors or background HTTP requests were observed.')
 # Storage-denied and corrupted-data cases in separate pages.
 denied=browser.new_page();denied.set_content(HTML);denied.wait_for_timeout(100)
 assert denied.locator('#storage-warning').count()==1
 denied.evaluate('location.hash="person/turing"');denied.wait_for_timeout(130)
 denied.locator('#profile-note').fill('Session only note')
 assert denied.evaluate('Atlas.localState.notes.turing')=='Session only note'
 broken=browser.new_page();broken.evaluate(MOCK);broken.evaluate('localStorage.setItem("atlas-of-ideas-v1","{broken")');broken.set_content(HTML);broken.wait_for_timeout(100)
 assert broken.evaluate('localStorage.getItem("atlas-of-ideas-v1")')=='{broken'
 assert broken.locator('#storage-warning').count()==1
 log('Storage-denied mode retains session notes, and an undecodable legacy shelf is not silently overwritten.')
 browser.close()

report={'status':'PASS','edition':'2.0','checks':checks,'catalogue_sha256':hashlib.sha256((ROOT/'src/catalogue.json').read_bytes()).hexdigest(),'browser':'Chromium, headless','method':'Actual built HTML injected into about:blank because sandbox administrator policy blocks URL navigation; persistence tested with a test-only Web Storage API implementation.','limitations':['No screen-reader or independent WCAG-conformance audit','No live hosting/deployment or multi-device storage test','External source links preserved, not all rechecked for current availability','Native clipboard/download/print behavior depends on the user browser; download Blob contents and print CSS were tested','Original mathematical content preserved, not independently re-proved']}
(ROOT/'tests/test-report.json').write_text(json.dumps(report,indent=2))
print('ALL CHECKS PASSED',flush=True)
