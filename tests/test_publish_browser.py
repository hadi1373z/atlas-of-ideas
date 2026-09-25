"""Browser smoke checks for public updates; temporary synthetic data never ships.

Requires Playwright + Chromium. Sandbox uses about:blank and a test-only storage
adapter; this is not evidence of live GitHub Pages or native file persistence.
"""
from pathlib import Path
import copy,json,shutil,sys,tempfile
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT));sys.path.insert(0,str(ROOT/'tests'))
from build import build
from test_publish import PublishingTests
from tools.catalogue import revision
from playwright.sync_api import sync_playwright
MOCK='''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(String(k))??null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear()}});}'''
checks=[]
def passed(s):checks.append(s);print('PASS:',s,flush=True)

def run():
    PublishingTests.setUpClass();fixture=PublishingTests()
    with tempfile.TemporaryDirectory() as tmp:
        root=Path(tmp);shutil.copytree(ROOT/'src',root/'src');(root/'content/updates').mkdir(parents=True)
        initial=build(root);before=(root/'index.html').read_text()
        event=fixture.new_event();event['article_markdown']='# Complete archived test\n\n<img src=x onerror="window.PWNED=true">\n\nThree questions and source text remain.'
        (root/'content/updates'/f"{event['event_id']}.json").write_text(json.dumps(event))
        updated=build(root);after=(root/'index.html').read_text()
        assert initial['profiles']==118 and updated['profiles']==119
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
            page=browser.new_page(viewport={'width':1440,'height':1000});errors=[];requests=[]
            page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
            page.evaluate(MOCK)
            legacy={'version':1,'saved':['godel'],'read':['turing'],'notes':{'godel':'Private pre-publication note.'}}
            page.evaluate('(s)=>localStorage.setItem("atlas-of-ideas-v1",JSON.stringify(s))',legacy)
            def go(route):page.evaluate('(r)=>location.hash=r',route);page.wait_for_timeout(150)
            page.set_content(before);go('updates')
            assert '0 recorded updates' in page.locator('main').inner_text()
            assert page.locator('.publication-entry').count()==0
            passed('Original catalogue has an honest empty publication journal, not synthetic posted articles.')
            page.set_content(after);page.wait_for_timeout(100);go('home')
            assert page.locator('.hero-stats strong').first.inner_text()=='119'
            assert page.locator('.publication-banner').count()==1
            state=page.evaluate('Atlas.localState');assert state['notes']['godel']==legacy['notes']['godel'];assert state['read']==['turing'];assert state['saved']==['godel']
            passed('New build adds a profile and latest-article banner without changing legacy notes, read marks or saved IDs.')
            go('person/integration-test')
            assert page.locator('h1').inner_text()=='Integration Test Person'
            assert page.locator('#section-0 p').count()==2
            assert page.locator('[data-action="question"]').count()==3
            assert 'archived update' in page.locator('.source-note').inner_text()
            passed('New formatted profile supports paragraphs, three questions, sources and archive links.')
            go('updates');assert page.locator('.publication-entry').count()==1
            go('publication/'+event['event_id'])
            assert page.locator('.publication-archive pre').inner_text()==event['article_markdown']
            assert page.locator('.publication-archive img').count()==0
            assert page.evaluate('window.PWNED===undefined')
            passed('Full archived text is retained verbatim and displayed safely without executing injected HTML.')
            for width in (1440,390,320):
                page.set_viewport_size({'width':width,'height':900})
                for route in ('home','updates','publication/'+event['event_id'],'person/integration-test'):
                    go(route)
                    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'),(width,route)
            passed('Home, journal, archived article and new profile reflow at 320, 390 and 1440 pixels.')
            go('library?q=Integration%20Test');assert 'Integration Test Person' in page.locator('#catalogue-results').inner_text()
            assert errors==[],errors;assert requests==[],requests
            passed('New profile is searchable; publishing views produce no uncaught JS errors or background HTTP requests.')
            browser.close()
    report={'passed':len(checks),'checks':checks,'environment':'Chromium/about:blank with test-only Web Storage adapter','remote_deployment_verified':False}
    (ROOT/'tests/publishing-browser-report.json').write_text(json.dumps(report,indent=2)+'\n')
if __name__=='__main__':run()
