"""Preview the actual built HTML. Test-only storage handles opaque sandbox origin."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
MOCK='''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(String(k))??null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear()}});}'''
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate(MOCK);page.set_content((ROOT/'index.html').read_text())
 for route,name in [('home','home-desktop'),('person/shamir','profile-desktop'),('connections/turing?to=nesetril','connections-desktop'),('ideas','ideas-desktop'),('library','library-desktop')]:
  page.evaluate('(r)=>location.hash=r',route);page.wait_for_timeout(250)
  page.screenshot(path=str(ROOT/'previews'/f'{name}.png'),full_page=True)
  if name=='home-desktop':page.screenshot(path=str(ROOT/'previews/website-preview.png'))
  print(route,page.locator('h1').inner_text(),'overflow',page.evaluate('document.documentElement.scrollWidth'))
 page.evaluate('location.hash="person/shamir"');page.wait_for_timeout(200)
 page.locator('[data-action="settings"]').first.click();page.screenshot(path=str(ROOT/'previews/reading-settings.png'))
 page.keyboard.press('Escape');page.locator('[data-action="focus"]').first.click();page.wait_for_timeout(200)
 page.screenshot(path=str(ROOT/'previews/focus-desktop.png'),full_page=True)
 page.locator('[data-action="focus"]').first.click();page.evaluate('location.hash="home"');page.wait_for_timeout(150)
 page.locator('[data-action="theme"]').click();page.screenshot(path=str(ROOT/'previews/home-dark.png'),full_page=True)
 page.locator('[data-action="theme"]').click()
 page.set_viewport_size({'width':390,'height':844})
 for route,name in [('home','home-mobile'),('person/shamir','profile-mobile'),('connections/turing?to=nesetril','connections-mobile'),('library','library-mobile')]:
  page.evaluate('(r)=>location.hash=r',route);page.wait_for_timeout(220)
  page.screenshot(path=str(ROOT/'previews'/f'{name}.png'),full_page=True)
  print('mobile',route,'overflow',page.evaluate('document.documentElement.scrollWidth'))
 print('ERRORS',errors)
 b.close()
