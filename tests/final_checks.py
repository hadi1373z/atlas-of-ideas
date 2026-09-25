"""Focused final-reader checks, after the full regression suite."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,hashlib
ROOT=Path(__file__).resolve().parents[1]
MOCK='''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(String(k))??null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear()}});}'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900});page.evaluate(MOCK);page.set_content((ROOT/'index.html').read_text());page.wait_for_timeout(140)
 for section in ['notes','questions','sources']:
  page.evaluate('(s)=>location.hash="person/shamir?section="+s',section);page.wait_for_timeout(180)
  assert page.locator('[data-toc="'+section+'"]').get_attribute('aria-current')=='location'
  assert page.evaluate('Atlas.localState.progress.shamir.section')==section
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':900});page.evaluate('location.hash="connections/turing?to=nesetril"');page.wait_for_timeout(170)
  assert page.locator('#network').get_attribute('class')=='local-map'
  assert page.evaluate('document.documentElement.scrollWidth')<=width+1
  if width<600:assert page.locator('.node-label').first.evaluate('(e)=>parseInt(getComputedStyle(e).fontSize)')>=30
 b.close()
report=json.loads((ROOT/'tests/test-report.json').read_text())
report['final_html_sha256']=hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
report['post_suite_checks']+=['Live contents and resume include notes, questions and sources.','Final map tested at 320, 390, 768 and 1440px; mobile label sizes confirmed.']
(ROOT/'tests/test-report.json').write_text(json.dumps(report,indent=2))
print('Final reader checks passed.')
