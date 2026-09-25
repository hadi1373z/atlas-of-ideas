/* Atlas of Ideas — Reader’s edition.
 * Offline, dependency-free. Stable profile IDs and the original storage key are
 * intentional: shelf backups from the first edition remain compatible.
 */
(() => {
'use strict';
const D = JSON.parse(document.getElementById('atlas-data').textContent);
const PEOPLE = D.people;
const PUBLICATIONS = D.publications || [];
const publicationFor = id => [...PUBLICATIONS].reverse().find(p => p.person_id === id);
const paragraphs = value => String(value).split(/\n\s*\n/).map(p => `<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
const BYID = Object.fromEntries(PEOPLE.map(p => [p.id, p]));
const CONCEPTS = D.exploration.concepts;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const normal = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').toLowerCase();
const validID = id => typeof id === 'string' && Object.hasOwn(BYID, id);
const clamp = (n, low, high) => Math.min(high, Math.max(low, Number(n) || 0));
const main = $('#main');
const dialog = $('#atlas-dialog');
const fieldStyle = p => `--field-color:${D.fields[p.field].color};--field-soft:${D.fields[p.field].soft}`;
const year = p => (p.approximateBirth ? 'c. ' : '') + (p.born < 0 ? Math.abs(p.born) + ' BCE' : p.born);
const surname = p => p.id === 'von-neumann' ? 'von Neumann' : p.name.split(' ').at(-1);
const neighbors = id => D.connections.filter(e => e.source === id || e.target === id).map(edge => ({edge, person:BYID[edge.source === id ? edge.target : edge.source], out:edge.source === id}));
const personLink = (id, section = '') => '#person/' + id + (section ? '?section=' + encodeURIComponent(section) : '');
const featured = ['turing','lovasz','noether','goldwasser','nesetril','godel','shannon','ramanujan','valiant','babai','hastad','polya','immerman','gaifman','goemans','lasserre','wigderson','grothendieck'];
 const ICONS={
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', diagonal:'<path d="M6 18 18 6M6 6h12v12"/>', down:'<path d="M12 5v14M6 13l6 6 6-6"/>', back:'<path d="m10 6-6 6 6 6M4 12h16"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>', bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>', check:'<path d="m5 12 4 4L19 6"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',moon:'<path d="M20 15.5A8.8 8.8 0 0 1 8.5 4 8.8 8.8 0 1 0 20 15.5Z"/>', sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',list:'<path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',fit:'<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6"/>',copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/>',print:'<path d="M7 8V3h10v5M7 17H4V9h16v8h-3"/><rect x="7" y="14" width="10" height="7"/>',export:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>', shuffle:'<path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3m-4-4 4 4-4 4"/>'
 };
 const ico=(k,cls='')=>`<svg class="${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]||ICONS.arrow}</svg>`;
 const logo=`<svg class="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m7 29 12-19 14 19H7Zm0 0 25-16M19 10l1 22" stroke="currentColor" stroke-width="1.2"/><circle cx="19" cy="10" r="3.5" fill="currentColor"/><circle cx="7" cy="29" r="3.5" fill="currentColor"/><circle cx="33" cy="29" r="3.5" fill="currentColor"/><circle cx="32" cy="13" r="2.3" fill="currentColor"/><circle cx="20" cy="32" r="2.3" fill="currentColor"/></svg>`;

Object.assign(ICONS, {
 book:'<path d="M12 5C8 2 4 3 3 4v16c3-2 6-2 9 0 3-2 6-2 9 0V4c-3-2-6-2-9 1v15"/>',
 settings:'<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3" fill="var(--paper)"/><circle cx="16" cy="17" r="3" fill="var(--paper)"/>',
 network:'<path d="m6 6 12 1-6 12L6 6Zm0 0 0 12 12-11"/><circle cx="6" cy="6" r="3" fill="var(--paper)"/><circle cx="18" cy="7" r="3" fill="var(--paper)"/><circle cx="12" cy="19" r="3" fill="var(--paper)"/><circle cx="6" cy="18" r="2" fill="var(--paper)"/>',
 note:'<path d="M20 12v9H3V4h9m3-1 6 6M9 15l2-6 7-7 4 4-7 7-6 2Z"/>',
 time:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 idea:'<path d="M9 18h6m-5 3h4M8 14a7 7 0 1 1 8 0l-1 4H9l-1-4Z"/>',
 focus:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5"/><circle cx="12" cy="12" r="3"/>',
 home:'<path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-8h6v8"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>'
});
 function motif(field,id=''){
  const head='<svg class="motif" viewBox="0 0 300 180" fill="none" stroke="currentColor" stroke-width=".8" aria-hidden="true">';
  const patterns={
   complexity:'<path d="M-20 140h85V53h47v87h39V75h48v65h37V47h68" opacity=".35"/><path d="M-20 149h90V62h38v87h48V84h37v65h48V56h63" opacity=".25"/><circle cx="150" cy="90" r="64" opacity=".4"/><circle cx="150" cy="90" r="82" opacity=".15"/>',
   graphs:'<path d="M37 52 94 28 159 56 217 26 268 74 242 142 177 155 118 121 59 151 37 52Zm0 0 81 69 99-95m-123 2 24 93 124 21m-83-86 18 99 91-81m-109-18 83 86M59 151l100-95" opacity=".42"/>'+[[37,52],[94,28],[159,56],[217,26],[268,74],[242,142],[177,155],[118,121],[59,151]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="currentColor"/>`).join(''),
   algebra:'<path d="M21 90h258M150 15v150" opacity=".3"/><path d="M55 162Q150-94 245 162M55 18Q150 274 245 18" opacity=".4"/><circle cx="150" cy="90" r="58" opacity=".25"/>',
   geometry:'<ellipse cx="150" cy="90" rx="118" ry="66"/><ellipse cx="150" cy="90" rx="118" ry="44" opacity=".45"/><ellipse cx="150" cy="90" rx="118" ry="22" opacity=".3"/><ellipse cx="150" cy="90" rx="33" ry="66" opacity=".5"/><ellipse cx="150" cy="90" rx="77" ry="66" opacity=".4"/><path d="M32 90h236M150 24v132" opacity=".3"/>',
   analysis:Array.from({length:5},(_,i)=>`<path d="M-20 ${78+i*6}C25 ${-7+i*9}70 ${-7+i*9}110 ${78+i*6}S193 ${158+i*2}230 ${78+i*6}S275 ${-7+i*9}325 ${78+i*6}" opacity="${.18+i*.05}"/>`).join(''),
   information:'<circle cx="150" cy="90" r="21"/><circle cx="150" cy="90" r="44" opacity=".6"/><circle cx="150" cy="90" r="66" opacity=".4"/><circle cx="150" cy="90" r="90" opacity=".25"/><circle cx="150" cy="90" r="115" opacity=".15"/><path d="M15 90h270" opacity=".2"/>',
   logic:'<rect x="37" y="23" width="116" height="133" rx="58" opacity=".45"/><rect x="147" y="23" width="116" height="133" rx="58" opacity=".45"/><path d="M25 90h250M150 10v160" opacity=".2"/>',
   systems:'<path d="m68 34-42 56 42 56m164-112 42 56-42 56M172 23l-44 134" opacity=".35"/><rect x="21" y="17" width="258" height="146" rx="5" opacity=".16"/>',
   algorithms:'<path d="M37 146 70 63 146 22 252 67 221 146Z" opacity=".6"/><path d="M37 146 146 22 221 146 70 63 252 67 37 146" opacity=".25"/><path d="m98 180 45-180m-5 180 45-180m-5 180 45-180" opacity=".15"/>'
  };
  return head+(patterns[field]||patterns.graphs)+'</svg>';
 }

// ----- Local state: additive migration, never rename IDs or the original key. -----
const STORAGE_KEY = 'atlas-of-ideas-v1';
const initialState = () => ({version:1, schemaVersion:2, saved:[], read:[], notes:{}, interest:'complexity', depth:'all', answers:{}, theme:'light', reader:{size:19,font:'serif',width:'standard',leading:1.85,focus:false}, progress:{}, history:[]});
const validIDs = list => Array.isArray(list) ? [...new Set(list.filter(validID))] : [];
function cleanState(obj) {
  const out = initialState();
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
  out.saved = validIDs(obj.saved); out.read = validIDs(obj.read);
  if (obj.notes && typeof obj.notes === 'object') for (const [id,note] of Object.entries(obj.notes)) if (validID(id) && typeof note === 'string') out.notes[id] = note;
  out.interest = Object.hasOwn(D.fields, obj.interest) || obj.interest === 'all' ? obj.interest : out.interest;
  out.depth = obj.depth === 'extended' ? 'extended' : 'all';
  out.theme = obj.theme === 'dark' ? 'dark' : 'light';
  if (obj.answers && typeof obj.answers === 'object') for (const [id,index] of Object.entries(obj.answers)) if (validID(id) && Number.isInteger(index) && index >= 0 && index < 3) out.answers[id] = index;
  const r = obj.reader || {};
  out.reader = {size:clamp(r.size || 19,16,26),font:r.font === 'sans' ? 'sans' : 'serif',width:r.width === 'wide' ? 'wide' : 'standard',leading:clamp(r.leading || 1.85,1.5,2.2),focus:Boolean(r.focus)};
  if (obj.progress && typeof obj.progress === 'object') for (const [id,p] of Object.entries(obj.progress)) {
    if (!validID(id) || !p || typeof p !== 'object') continue;
    const sections = ['overview',...BYID[id].sections.map((_,i)=>'section-'+i),'notes','questions','sources'];
    out.progress[id] = {section:sections.includes(p.section)?p.section:'overview',offset:clamp(p.offset,0,1),percent:clamp(p.percent,0,100),updated:clamp(p.updated,0,9e15)};
  }
  out.history = validIDs(obj.history).slice(0,30);
  return out;
}
let state = initialState(), storageOK = true, corrupted = false;
try { state = cleanState(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); }
catch (e) { storageOK = false; corrupted = e instanceof SyntaxError; }
try { localStorage.setItem('atlas-storage-check','1');localStorage.removeItem('atlas-storage-check'); }
catch { storageOK = false; }
function showStorageWarning() {
  if ($('#storage-warning')) return;
  const el = document.createElement('div'); el.id='storage-warning'; el.className='storage-banner';el.setAttribute('role','status');
  el.innerHTML = `<span>${corrupted ? 'The saved shelf could not be decoded. Import a backup from My shelf.' : 'Browser storage is unavailable. Export a backup to keep changes after this session.'}</span><button data-action="export">Export backup ${ico('export')}</button>`;
  document.body.insertBefore(el,main);
}
function persist() {
  if (corrupted) return false; // Do not overwrite an undecodable legacy shelf.
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}
  catch {storageOK=false;showStorageWarning();return false;}
}
function applyPreferences() {
  document.body.dataset.theme=state.theme;
  document.body.dataset.readerFont=state.reader.font;
  document.body.dataset.readerWidth=state.reader.width;
  document.body.style.setProperty('--reader-size',state.reader.size+'px');
  document.body.style.setProperty('--reader-leading',String(state.reader.leading));
  document.body.classList.toggle('focus-mode',Boolean(activeId && state.reader.focus));
  $('meta[name="theme-color"]').content=state.theme==='dark'?'#17231e':'#f6f4ed';
}
let activeId=null, currentRoute='', routeSerial=0, lastFocus=null, toastTimer=null, readerAnchor=null;
let cat={query:'',field:'all',scope:'all',sort:'featured',view:'grid',limit:24};
let shelfTab='saved', graphMode='local', graphSelected='turing', graphTransform={x:0,y:0,k:1}, graphTarget='', graphDirected=false;
let pendingImport=null, progressTimer=null, scrollFrame=null, initialRoute=true;
function toast(text) {
  const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),4300);
}
if (!storageOK) showStorageWarning();

// Search is literal and local: no AI or background network service.
const profileText = p => [p.name,p.id,p.title,p.bio,p.impact,p.formula,D.fields[p.field].name,...p.sections.flatMap(s=>[s.title,s.text,s.math||''])].join(' ');
const searchIndex = Object.fromEntries(PEOPLE.map(p=>[p.id,normal(profileText(p))]));
const termFits = (text,term) => { const t=normal(term); return /^[a-z]{1,3}$/.test(t) ? new RegExp('\\b'+t+'s?\\b').test(text) : text.includes(t); };
const conceptMatches = c => PEOPLE.filter(p=>c.terms.some(t=>termFits(searchIndex[p.id],t)));
const conceptsFor = p => CONCEPTS.filter(c=>c.terms.some(t=>termFits(searchIndex[p.id],t)));
const termsOf = query => normal(query).trim().split(/\s+/).filter(Boolean);
function highlight(text,query) {
  const terms=termsOf(query); if(!terms.length)return esc(text);
  // Map normalized indices back to the original text, including accented names.
  const chars=Array.from(String(text)), flat=[], indexes=[];
  chars.forEach((c,i)=>{for(const ch of normal(c)){flat.push(ch);indexes.push(i);}});
  const norm=flat.join(''), marked=new Set();
  for(const t of terms){let at=norm.indexOf(t);while(at>=0){for(let j=at;j<at+t.length;j++)marked.add(indexes[j]);at=norm.indexOf(t,at+Math.max(1,t.length));}}
  let out='',open=false;
  chars.forEach((c,i)=>{if(marked.has(i)&&!open){out+='<mark>';open=true;}if(!marked.has(i)&&open){out+='</mark>';open=false;}out+=esc(c);});
  return out+(open?'</mark>':'');
}
function matchExcerpt(p,query) {
  const terms=termsOf(query);
  const chunks=[{text:p.bio,section:'overview'},{text:p.impact,section:'overview'},...p.sections.map((s,i)=>({text:s.title+'. '+s.text,section:'section-'+i}))];
  let best=chunks.map(c=>({...c,score:terms.filter(t=>normal(c.text).includes(t)).length})).sort((a,b)=>b.score-a.score)[0];
  const index=Math.min(...terms.map(t=>normal(best.text).indexOf(t)).filter(i=>i>=0));
  const start=Number.isFinite(index)?Math.max(0,index-70):0;
  return {html:highlight((start?'…':'')+best.text.slice(start,start+220)+(best.text.length>start+220?'…':''),query),section:best.section};
}
function orderedPeople(list,sort='featured') {
  return [...list].sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='oldest'?a.born-b.born:sort==='newest'?b.born-a.born:((featured.indexOf(a.id)<0?999:featured.indexOf(a.id))-(featured.indexOf(b.id)<0?999:featured.indexOf(b.id))||Number(b.extended)-Number(a.extended)||a.name.localeCompare(b.name)));
}

// ----- Shared interface. -----
function header() {
  const view=(location.hash.slice(1).split(/[/?]/)[0]||'home');
  const selected=view==='person'?'library':view==='idea'?'ideas':view==='trail'?'trails':view;
  $('#header').innerHTML=`<div class="wrap header-inner"><a class="brand" href="#home" aria-label="Atlas of Ideas home">${logo}<span>Atlas of Ideas<span class="brand-dot">.</span></span></a><nav class="nav" id="navigation" aria-label="Main navigation">${[['home','Discover'],['library','Thinkers'],['ideas','Ideas'],['connections','Connections'],['trails','Paths'],['timeline','Timeline']].map(([v,t])=>`<a href="#${v}" ${selected===v?'class="active" aria-current="page"':''}>${t}</a>`).join('')}</nav><div class="header-actions"><button class="icon-btn" data-action="search" aria-label="Search the atlas (slash key)">${ico('search')}</button><a class="shelf-link" href="#shelf" aria-label="My shelf, ${state.saved.length} saved profiles">${ico('bookmark')}<span>My shelf</span><b class="count-badge">${state.saved.length}</b></a><button class="icon-btn" data-action="theme" aria-label="Switch to ${state.theme==='light'?'dark':'light'} theme">${ico(state.theme==='light'?'moon':'sun')}</button><button class="icon-btn mobile-menu" data-action="menu" aria-controls="navigation" aria-expanded="false" aria-label="Open navigation">${ico('menu')}</button></div></div>`;
}
function footer() {
  $('#footer').innerHTML=`<div class="wrap footer-inner"><div><a class="footer-brand" href="#home">Atlas of Ideas.</a><p>A field guide, not a fixed itinerary.</p></div><div class="footer-links"><a href="#updates">Publication journal</a><a href="#about">About & sources</a><button data-action="help">Keyboard & reading help</button><button data-action="export-catalogue">Export catalogue ${ico('diagonal')}</button></div><span class="edition-label">READER’S EDITION · 02.1</span></div>`;
}
function dock() {
  $('#mobile-dock').innerHTML=activeId ? `<button data-action="contents">${ico('list')}<span>Contents</span></button><button data-action="jump" data-section="notes">${ico('note')}<span>Notes</span></button><button data-action="settings">${ico('settings')}<span>Type</span></button><button data-action="focus" aria-pressed="${state.reader.focus}">${ico('focus')}<span>${state.reader.focus?'Exit focus':'Focus'}</span></button>` : [['home','home','Discover'],['library','search','Explore'],['connections','network','Map'],['shelf','bookmark','Shelf']].map(([r,i,t])=>`<a href="#${r}" ${(location.hash||'#home').startsWith('#'+r)?'aria-current="page"':''}>${ico(i)}<span>${t}</span></a>`).join('');
}
function card(p,query='') {
  const saved=state.saved.includes(p.id),read=state.read.includes(p.id),progress=state.progress[p.id];
  const excerpt=query?matchExcerpt(p,query):null;
  return `<article class="person-card" style="${fieldStyle(p)}"><a class="person-link" href="${personLink(p.id,excerpt?.section||'')}"><div class="card-art">${motif(p.field)}<span class="cover-year">${p.approximateBirth?'C. ':'B. '}${p.born<0?Math.abs(p.born)+' BCE':p.born}</span><span class="cover-symbol" aria-hidden="true">${esc(D.fields[p.field].symbol)}</span></div><div class="card-content"><div class="card-label"><span>${esc(D.fields[p.field].name)}</span>${read?'<span class="read-indicator">✓ Read</span>':''}</div><h3>${highlight(p.name,query)}</h3><p>${highlight(p.title,query)}</p>${excerpt?`<div class="search-excerpt">${excerpt.html}</div>`:''}<div class="card-footer"><span>${p.extended?'IN DEPTH':'QUICK PORTRAIT'} <i>·</i> ${p.readMinutes} MIN</span>${ico('arrow')}</div></div></a><button class="bookmark-btn ${saved?'saved':''}" data-action="save" data-id="${p.id}" aria-label="${saved?'Unsave':'Save'} ${esc(p.name)}" aria-pressed="${saved}">${ico('bookmark')}</button>${progress&&!read&&progress.percent>0?`<div class="card-progress" title="Reading position: ${Math.round(progress.percent)}%"><span style="width:${progress.percent}%"></span></div>`:''}</article>`;
}
function compactPerson(p,reason='') {
  return `<a class="compact-person" href="${personLink(p.id)}" style="${fieldStyle(p)}"><span class="mini-symbol" aria-hidden="true">${esc(D.fields[p.field].symbol)}</span><span><strong>${esc(p.name)}</strong><small>${esc(reason||p.title)}</small></span>${ico('arrow')}</a>`;
}
function conceptCard(c,i=0) {
  const count=conceptMatches(c).length;
  return `<a class="concept-card" href="#idea/${c.id}" style="--field-color:${D.fields[c.field].color};--field-soft:${D.fields[c.field].soft}"><div class="concept-top"><span class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(c.name)}</span>${ico('diagonal')}</div><h3>${esc(c.question)}</h3><div class="concept-bottom"><span>${count} RELATED PROFILES</span><span class="concept-orbit" aria-hidden="true"></span></div></a>`;
}
function trailcard(t,i) {
  const done=t.ids.filter(id=>state.read.includes(id)).length;
  return `<a class="trail-card" href="#trail/${t.id}" style="--field-color:${D.fields[t.field].color};--field-soft:${D.fields[t.field].soft}"><div class="eyebrow">${esc(t.tag)}</div><span class="trail-number">${String(i+1).padStart(2,'0')}</span><div class="path-mini" aria-hidden="true">${t.ids.map((id,j)=>`${j?'<span></span>':''}<i class="${state.read.includes(id)?'done':''}"></i>`).join('')}</div><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><div class="trail-bottom"><span>${t.ids.length} PROFILES · ${done} READ</span>${ico('arrow')}</div></a>`;
}

function heroArt() {
  const nodes=[['godel',92,141],['turing',195,78],['cook',360,112],['karp',406,278],['valiant',242,338],['shamir',104,282]];
  return `<div class="hero-art"><div class="art-caption"><span>FIG. 001 — A CONSTELLATION OF IDEAS</span><span>EXPLORE ↗</span></div><svg viewBox="0 0 500 420" role="group" aria-label="Explore six mathematical profiles"><defs><pattern id="hero-grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="currentColor" opacity=".15"/></pattern></defs><rect width="500" height="420" fill="url(#hero-grid)"/><g fill="none" stroke="currentColor" stroke-width=".8" opacity=".32"><ellipse cx="250" cy="217" rx="172" ry="123" transform="rotate(28 250 217)"/><ellipse cx="250" cy="217" rx="182" ry="94" transform="rotate(-40 250 217)"/><path d="M92 141 195 78 360 112 406 278 242 338 104 282 92 141M195 78 242 338M92 141 406 278"/><circle cx="250" cy="217" r="150" stroke-dasharray="2 7"/></g><circle cx="250" cy="217" r="54" fill="#d79d72"/><text x="250" y="232" text-anchor="middle" font-family="Georgia,serif" font-size="52" fill="#1f382e" aria-hidden="true">λ</text>${nodes.map(([id,x,y])=>`<a href="#person/${id}" aria-label="Read about ${esc(BYID[id].name)}"><circle cx="${x}" cy="${y}" r="23" fill="transparent"/><circle class="star-halo" cx="${x}" cy="${y}" r="10" fill="#233e32" stroke="#bbc9a9"/><circle cx="${x}" cy="${y}" r="3" fill="#e7d8b7"/><text x="${x}" y="${y+(y>250?34:-22)}" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#f3efdf">${esc(surname(BYID[id]))}</text></a>`).join('')}<text x="250" y="393" text-anchor="middle" font-size="9" letter-spacing="2" fill="#c2c9b7">ONE QUESTION. MANY WAYS TO THINK.</text></svg><a class="art-footer" href="#connections/turing"><span>Follow the labeled connections</span>${ico('arrow')}</a></div>`;
}
function continuation() {
  const id=state.history.find(id=>!state.read.includes(id))||state.history[0];
  if(id){const p=BYID[id],progress=state.progress[id];return `<section class="continue-card" aria-label="Continue reading"><span class="continue-icon">${ico('book')}</span><div><div class="eyebrow">PICK UP YOUR THREAD</div><h2>${esc(p.name)}</h2><p>${esc(p.title)}${progress?.percent>0?` · ${Math.round(progress.percent)}% through the article`:''}</p></div><a class="btn primary" href="#person/${id}?resume=1">Continue reading ${ico('arrow')}</a><a class="quiet-link" href="#shelf">Your shelf</a></section>`;}
  return `<section class="continue-card"><span class="continue-icon">${ico('book')}</span><div><div class="eyebrow">A GOOD PLACE TO BEGIN</div><h2>From one profile to a larger idea.</h2><p>Start anywhere. Your place, notes and read marks stay on this device.</p></div><a class="btn primary" href="#person/nesetril">Read Nešetřil ${ico('arrow')}</a><a class="quiet-link" href="#about">How this works</a></section>`;
}

function latestPublication() {
  const h=PUBLICATIONS.at(-1);if(!h)return '';
  return `<section class="publication-banner" aria-label="Latest public update"><div><span class="eyebrow">LATEST IN THE ATLAS / ${esc(h.created_at.slice(0,10))}</span><h2><a href="${personLink(h.person_id)}">${esc(h.name)}</a></h2><p>${esc(h.summary)}</p></div><a class="btn" href="#updates">Publication journal ${ico('arrow')}</a></section>`;
}
function publicationJournal() {
  const build=D.publishing?.buildId||'';
  main.innerHTML=`<div class="wrap"><div class="page-head"><div class="eyebrow">PUBLIC ARTICLES / VERSIONED UPDATES</div><h1>An atlas that grows.</h1><p>New profiles and corrections, with a permanent record of what was added. Your private reading notebook is not part of this log.</p></div><div class="publication-layout"><section><h2>${PUBLICATIONS.length} ${PUBLICATIONS.length===1?'recorded update':'recorded updates'}</h2>${PUBLICATIONS.length?[...PUBLICATIONS].reverse().map(h=>`<article class="publication-entry"><div class="eyebrow"><time datetime="${esc(h.created_at)}">${esc(h.created_at.slice(0,10))}</time> / ${h.kind==='daily-profile'?'DAILY PROFILE':'CORRECTION / EDIT'}</div><h2><a href="${personLink(h.person_id)}">${esc(h.name)}</a></h2><p>${esc(h.summary)}</p><div class="actions"><a class="btn small" href="${personLink(h.person_id)}">Read current profile ${ico('arrow')}</a><a class="quiet-link" href="#publication/${h.event_id}">Archived article ${ico('book')}</a></div></article>`).join(''):`<div class="note-panel"><strong>The preserved collection is the starting point.</strong><p>All 118 original profiles remain available. There are no later publication records in this build. A configured pipeline is not evidence that a scheduled publication has already succeeded.</p><a class="quiet-link" href="#library">Browse the collection ${ico('arrow')}</a></div>`}</section><aside class="about-sidebar"><div class="note-panel"><strong>How updates arrive</strong><p>A public content record is validated and rebuilt into this site. Reload after a deployment to see new content. This page never reads your ChatGPT conversations itself.</p></div><div class="note-panel"><strong>Private means separate.</strong><p>Notes and reading progress stay in browser storage. When moving from a downloaded file to the hosted site, export your old JSON backup and import it using Merge.</p></div><p class="small-muted">Content build <code>${esc(build.slice(0,16))}</code></p><a class="quiet-link" href="https://github.com/hadi1373z/atlas-of-ideas" target="_blank" rel="noopener noreferrer">View editable source ${ico('diagonal')}</a></aside></div></div>`;
}
function publicationArchive(id) {
  const h=PUBLICATIONS.find(h=>h.event_id===id);if(!h)return notFound();
  main.innerHTML=`<div class="wrap"><div class="page-head"><a class="back-link" href="#updates">${ico('back')} Publication journal</a><div class="eyebrow">ARCHIVED ARTICLE / ${esc(h.created_at.slice(0,10))}</div><h1>${esc(h.name)}</h1><p>${esc(h.summary)}</p><a class="btn" href="${personLink(h.person_id)}">Read the current formatted profile ${ico('arrow')}</a></div><article class="publication-archive" aria-label="Archived public article"><p class="ui-text">Preserved text from this publication. Later corrections appear in the current profile, not by silently rewriting this archive.</p><pre>${esc(h.article_markdown)}</pre></article></div>`;
}

function home() {
  const favorites=['verification','local-global','approximation'].map(id=>CONCEPTS.find(c=>c.id===id));
  main.innerHTML=`<div class="wrap"><section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="dot"></span> A FIELD GUIDE TO MATHEMATICAL MINDS</div><h1>Read a mind.<br><em>Follow an idea.</em></h1><p>Meet the people behind the proofs. Understand a breakthrough, trace a connection, and find the question that keeps you reading.</p><div class="actions"><a href="#library" class="btn primary">Explore the collection ${ico('arrow')}</a><button data-action="search" class="btn text">Find an idea ${ico('search')}</button></div><div class="hero-stats"><div><strong>${PEOPLE.length}</strong><span>THINKERS</span></div><div><strong>${D.connections.length}</strong><span>CONNECTIONS</span></div><div><strong>∞</strong><span>POSSIBLE DETOURS</span></div></div></div>${heroArt()}</section>${continuation()}${latestPublication()}<section class="section" aria-labelledby="question-heading"><div class="section-heading"><div><div class="eyebrow">ENTER THROUGH A QUESTION</div><h2 id="question-heading">What are you curious about?</h2></div><a class="quiet-link" href="#ideas">All 12 idea lenses ${ico('arrow')}</a></div><div class="concept-grid">${favorites.map(conceptCard).join('')}</div></section><section class="section" aria-labelledby="thinker-heading"><div class="section-heading"><div><div class="eyebrow">THE COLLECTION</div><h2 id="thinker-heading">Different minds. Lasting ideas.</h2></div><a class="quiet-link" href="#library">All ${PEOPLE.length} thinkers ${ico('arrow')}</a></div><div class="card-grid">${featured.slice(0,8).map(id=>card(BYID[id])).join('')}</div></section><section class="feature"><div class="feature-art" aria-hidden="true">${motif('graphs')}<span>χ</span></div><div class="feature-copy"><div class="eyebrow">FOLLOW A CONNECTION, NOT A CHECKLIST</div><h2>How does one idea<br>lead to another?</h2><p>Choose any two people and find a route through the atlas. Every step keeps its explanation attached.</p><a class="btn inverse" href="#connections/turing?to=nesetril">Connect Turing to Nešetřil ${ico('arrow')}</a></div></section><section class="section"><div class="section-heading"><div><div class="eyebrow">OPTIONAL ITINERARIES</div><h2>Take the scenic route.</h2></div><a class="quiet-link" href="#trails">All 8 reading paths ${ico('arrow')}</a></div><div class="trail-grid">${D.trails.slice(0,3).map(trailcard).join('')}</div></section>${nextBox()}</div>`;
}
function nextBox() {
  return `<section class="next-box"><div><div class="eyebrow">NO FIXED SEQUENCE</div><h2>Let the next question choose.</h2><p>Find an unread profile in a field you care about. Suggestions come from this collection, not a live feed.</p></div><div class="next-controls"><label>Research field<select id="interest-select"><option value="all" ${state.interest==='all'?'selected':''}>Across all fields</option>${Object.entries(D.fields).map(([id,f])=>`<option value="${id}" ${state.interest===id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label><label>Reading depth<select id="depth-select"><option value="all" ${state.depth==='all'?'selected':''}>Any length</option><option value="extended" ${state.depth==='extended'?'selected':''}>Expanded profiles</option></select></label><button class="btn primary" data-action="surprise">Find my next read ${ico('shuffle')}</button></div></section>`;
}
function fieldPills() {
  return `<button class="pill ${cat.field==='all'?'active':''}" data-action="field" data-field="all" aria-pressed="${cat.field==='all'}">All fields</button>`+Object.entries(D.fields).map(([id,f])=>`<button class="pill ${cat.field===id?'active':''}" data-action="field" data-field="${id}" aria-pressed="${cat.field===id}" style="--field-color:${f.color}"><i class="field-dot" aria-hidden="true"></i>${esc(f.name)}</button>`).join('');
}
function library(field,params=new URLSearchParams()) {
  if(field&&Object.hasOwn(D.fields,field)){cat.field=field;cat.query='';}
  if(params.has('q')){cat.query=params.get('q');cat.field='all';cat.limit=24;}
  main.innerHTML=`<div class="wrap"><div class="page-head"><div class="eyebrow">THE COMPLETE COLLECTION</div><div class="head-line"><h1>Meet the minds.</h1><p>118 people. 31 expanded profiles.<br>Search by a name, theorem or idea.</p></div></div><section class="collection-section"><div class="filterbar"><label class="search-input">${ico('search')}<input id="collection-search" type="search" value="${esc(cat.query)}" placeholder="Try ‘locality’, ‘permanent’, ‘Gödel’…" aria-label="Search names and full profile text"></label><select id="sort-select" aria-label="Sort profiles"><option value="featured">Suggested first</option><option value="name">Name A–Z</option><option value="oldest">Birth year: earliest</option><option value="newest">Birth year: latest</option></select><select id="scope-select" aria-label="Filter profile status"><option value="all">All profiles</option><option value="extended">Expanded profiles</option><option value="unread">Unread profiles</option><option value="saved">Saved profiles</option></select><div class="view-toggle" role="group" aria-label="Display style"><button data-action="view" data-mode="grid" aria-label="Grid view" aria-pressed="${cat.view==='grid'}">${ico('grid')}</button><button data-action="view" data-mode="list" aria-label="List view" aria-pressed="${cat.view==='list'}">${ico('list')}</button></div></div><div class="pills" id="field-pills" aria-label="Filter by research field">${fieldPills()}</div><div class="results-line"><span id="result-count" role="status" aria-live="polite"></span><button data-action="reset-filters">Reset filters</button></div><div id="catalogue-results"></div></section></div>`;
  $('#sort-select').value=cat.sort;$('#scope-select').value=cat.scope;renderResults();
}
function filtered() {
  const terms=termsOf(cat.query);
  return orderedPeople(PEOPLE.filter(p=>(cat.field==='all'||p.field===cat.field)&&(cat.scope==='all'||cat.scope==='extended'&&p.extended||cat.scope==='unread'&&!state.read.includes(p.id)||cat.scope==='saved'&&state.saved.includes(p.id))&&terms.every(t=>searchIndex[p.id].includes(t))),cat.sort);
}
function renderResults() {
  if(!$('#catalogue-results'))return;
  const list=filtered();
  $('#result-count').textContent=`${list.length} ${list.length===1?'PROFILE':'PROFILES'}${cat.query?' · MATCHING YOUR SEARCH':''}`;
  $('#catalogue-results').innerHTML=list.length?`<div class="card-grid ${cat.view==='list'?'list-view':''}">${list.slice(0,cat.limit).map(p=>card(p,cat.query)).join('')}</div>${list.length>cat.limit?`<div class="load-row"><button class="btn" data-action="load-more">Show ${Math.min(24,list.length-cat.limit)} more ${ico('down')}</button><span>${Math.min(cat.limit,list.length)} of ${list.length}</span></div>`:''}`:`<div class="empty"><div class="eyebrow">TRY A DIFFERENT ANGLE</div><h2>No matching profiles.</h2><p>Use a surname or a broader idea, or reset the field and status filters.</p><button class="btn" data-action="reset-filters">Reset the collection ${ico('arrow')}</button></div>`;
}
function ideas() {
  main.innerHTML=`<div class="wrap"><div class="page-head"><div class="eyebrow">ANOTHER WAY INTO THE ATLAS</div><h1>Start with an idea.</h1><p>Not sure whose name to look for? Follow a question across fields. These lenses index the existing profile text, rather than asserting a historical genealogy.</p></div><div class="concept-grid ideas-grid">${CONCEPTS.map(conceptCard).join('')}</div><div class="note-panel">Every matching profile includes its own references. These are thematic reading indexes, not exhaustive surveys of a research area.</div></div>`;
}
function idea(id) {
  const c=CONCEPTS.find(c=>c.id===id);if(!c)return notFound();
  const list=orderedPeople(conceptMatches(c));
  const starter=BYID[c.start];
  main.innerHTML=`<div class="wrap" style="--field-color:${D.fields[c.field].color};--field-soft:${D.fields[c.field].soft}"><a class="back-link" href="#ideas">${ico('back')} All idea lenses</a><div class="page-head"><div class="eyebrow">IDEA LENS / ${esc(c.name)}</div><h1>${esc(c.question)}</h1><p>${esc(c.description)}</p></div><div class="idea-intro"><div><div class="eyebrow">ONE WAY IN</div><h2>${esc(starter.name)}</h2><p>${esc(starter.title)}. ${esc(starter.impact)}</p><a class="btn primary" href="${personLink(starter.id)}">Start reading ${ico('arrow')}</a></div><div class="idea-vocabulary"><div class="eyebrow">LOOK FOR THESE TERMS</div><div class="pills">${c.terms.map(t=>`<a class="pill" href="#library?q=${encodeURIComponent(t)}">${esc(t)} ${ico('diagonal')}</a>`).join('')}</div></div></div><div class="section-heading"><h2>Different views of this idea.</h2><span class="eyebrow">${list.length} PROFILES · TEXT-MATCHED</span></div><div class="card-grid">${list.map(p=>card(p)).join('')}</div></div>`;
}

// ----- Reading desk. All original paragraphs, equations and sources retained. -----
function mathblock(p,s=null,index=-1) {
  const item=s||p,text=item.math||item.formula||'',svg=item.mathSVG;
  return `<figure class="math-block"><div class="math-caption"><span>${index===-1?'THE SIGNATURE IDEA':'MATHEMATICAL NOTE'}</span><button data-action="equation" data-id="${p.id}" data-index="${index}" aria-label="Expand equation: ${esc(text)}">${ico('fit')}<span>Expand</span></button></div><div class="formula" role="math" aria-label="${esc(text)}"><div aria-hidden="true">${svg||esc(text)}</div></div></figure>`;
}
function toc(p,mobile=false) {
  const sections=[['overview','The essential idea'],...p.sections.map((s,i)=>['section-'+i,s.title]),['notes','Your margin notes'],['questions','Questions to follow'],['sources','Sources & reading']];
  return `<nav class="reader-toc ${mobile?'mobile-toc':''}" aria-label="Profile contents">${sections.map(([id,title],i)=>`<a href="${personLink(p.id,id)}" data-action="jump" data-section="${id}" data-toc="${id}"><span>${i===0?'—':String(i).padStart(2,'0')}</span>${esc(title)}</a>`).join('')}</nav>`;
}
function connectedPanel(id) {
  const links=neighbors(id);
  return `<div class="aside-block"><h2>Connected minds</h2><p class="small-muted">${links.length} labeled ${links.length===1?'connection':'connections'}</p>${links.slice(0,5).map(({person:p,edge})=>`<a class="related-link" href="${personLink(p.id)}"><strong>${esc(p.name)}</strong><span>${esc(edge.label)}</span></a>`).join('')}${!links.length?'<p class="small-muted">No links recorded yet for this profile.</p>':''}<a class="quiet-link" href="#connections/${id}">Explore the map ${ico('arrow')}</a></div>`;
}
function sourceList(p) {
  return `<div class="source-list">${p.sources.map((s,i)=>`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span class="source-num">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(s.label)}</strong><small>${esc(s.type||'Further reading')} · opens a new tab</small></span>${ico('diagonal')}</a>`).join('')}</div>`;
}
function profile(id) {
  const p=BYID[id];if(!p)return notFound();
  const saved=state.saved.includes(id),read=state.read.includes(id),progress=state.progress[id];
  const cs=conceptsFor(p).slice(0,4),paths=D.trails.filter(t=>t.ids.includes(id));
  main.innerHTML=`<div class="wrap profile-wrap" style="${fieldStyle(p)}"><a class="back-link" href="#library">${ico('back')} Back to the collection</a><section class="profile-head"><div><div class="eyebrow">${esc(D.fields[p.field].name)} <span class="meta-divider">/</span> ${p.extended?'EXPANDED PROFILE':'QUICK PORTRAIT'}</div><h1>${esc(p.name)}</h1><p class="profile-subtitle">${esc(p.title)}</p><p class="bio">${esc(p.bio)}</p><div class="profile-meta"><span>${p.approximateBirth?'Approximate birth: ':'Born '}${year(p)}</span><span>${ico('time')} About ${p.readMinutes} min</span><span>${neighbors(id).length} connections</span></div><div class="actions profile-actions"><button class="btn ${saved?'primary':''}" data-action="save" data-id="${id}" aria-pressed="${saved}" aria-label="${saved?'Unsave':'Save'} ${esc(p.name)}">${ico('bookmark')} ${saved?'Saved':'Save profile'}</button><button class="btn ${read?'primary':''}" data-action="read" data-id="${id}" aria-pressed="${read}">${ico('check')} ${read?'Read':'Mark as read'}</button><button class="btn" data-action="copy" data-id="${id}">${ico('copy')} Link</button><button class="icon-btn" data-action="print" aria-label="Print this profile">${ico('print')}</button></div>${progress?.percent>3&&!read?`<div class="resume-notice">${ico('book')}<span>You left off ${Math.round(progress.percent)}% through this article.</span><button data-action="resume" data-id="${id}">Resume ${ico('arrow')}</button></div>`:''}</div><div class="profile-cover" aria-hidden="true">${motif(p.field)}<span class="big-symbol">${esc(D.fields[p.field].symbol)}</span><div class="cover-note"><span>ATLAS / ${String(PEOPLE.indexOf(p)+1).padStart(3,'0')}</span><span>IDEAS WORTH KEEPING</span></div></div></section></div><div class="readerbar"><div class="wrap readerbar-inner"><div class="readerbar-title"><span class="eyebrow">READING</span><strong>${esc(p.name)}</strong></div><div class="readerbar-actions"><span class="read-position" id="read-position">0%</span><button class="btn small" data-action="settings">${ico('settings')}<span>Reading settings</span></button><button class="btn small" data-action="focus" aria-pressed="${state.reader.focus}">${ico('focus')}<span>${state.reader.focus?'Exit focus':'Focus'}</span></button></div></div><div class="reader-progress" role="progressbar" aria-label="Reading position, not completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="reader-progress-fill"></span></div></div><div class="wrap reading-layout" style="${fieldStyle(p)}"><aside class="toc-column"><div class="sticky-toc"><div class="eyebrow">IN THIS PROFILE</div>${toc(p)}<div class="toc-note">Read at your pace.<br>Scrolling saves your place;<br>only you mark it read.</div></div></aside><article class="article" aria-label="Profile of ${esc(p.name)}"><div class="reading-body" id="reading-body"><section id="overview" class="article-section overview" data-reading><div class="eyebrow">THE ESSENTIAL IDEA</div>${p.sections.some(s=>s.text===p.impact)?'':`<p class="article-lede">${esc(p.impact)}</p>`}${mathblock(p)}</section>${p.sections.map((s,i)=>`<section class="article-section" id="section-${i}" data-reading><div class="section-kicker"><span>${String(i+1).padStart(2,'0')} / UNDERSTAND THE WORK</span><button class="section-link" data-action="copy-section" data-id="${id}" data-section="section-${i}" aria-label="Copy link to ${esc(s.title)}">${ico('copy')}</button></div><h2>${esc(s.title)}</h2>${paragraphs(s.text)}${s.math?mathblock(p,s,i):''}</section>`).join('')}${p.qualification?`<p class="qualification">${ico('info')}<span>${esc(p.qualification)}</span></p>`:''}</div><div class="article-end"><span class="eyebrow">AN IDEA TO CARRY WITH YOU</span><button class="btn ${read?'primary':''}" data-action="read" data-id="${id}" aria-pressed="${read}">${ico('check')} ${read?'Marked as read':'Mark this profile as read'}</button></div><section class="notes-block article-section" id="notes"><div class="section-kicker"><span>YOUR NOTEBOOK</span><button data-action="export-notes" class="quiet-link">Export notes ${ico('export')}</button></div><h2>A thought in the margin.</h2><p class="ui-text">A question, a counterexample, a connection. Private to this browser; export a backup before moving devices.</p><label class="sr-only" for="profile-note">Notes on ${esc(p.name)}</label><textarea id="profile-note" data-id="${id}" placeholder="The idea I want to understand is…" rows="5">${esc(state.notes[id]||'')}</textarea><div class="notes-status" id="notes-status" role="status" aria-live="polite">${state.notes[id]?(storageOK?'Saved locally':'Saved in this session only'):'Notes save as you type.'}</div></section><section class="question-box article-section" id="questions"><div class="eyebrow">THREE QUESTIONS TO FOLLOW</div><h2>Choose your next direction.</h2><p class="ui-text">Each question searches for a relevant next profile. Suggestions explain the match; they are not generated answers.</p>${p.questions.map((q,i)=>`<button class="question" data-action="question" data-id="${id}" data-index="${i}" aria-pressed="${state.answers[id]===i}"><span class="qnum">0${i+1}</span><span class="qtext">${esc(q)}</span>${ico('arrow')}</button>`).join('')}<div id="question-result" aria-live="polite"></div></section><section class="sources-section article-section" id="sources"><div class="eyebrow">GO TO THE SOURCE</div><h2>Sources & further reading.</h2>${sourceList(p)}<p class="source-note">${publicationFor(id)?`Updated ${esc(publicationFor(id).created_at.slice(0,10))}. <a href="#publication/${publicationFor(id).event_id}">View the archived update</a>.`:`Preserved from the original September 2026 learning collection.`} These sketches are not full proofs or a live account of open-problem status. External references need an internet connection.</p><a class="quiet-link" href="#about">About this edition ${ico('arrow')}</a></section>${paths.length?`<section class="path-context"><div class="eyebrow">THIS PROFILE ALSO APPEARS IN</div>${paths.map(t=>`<a href="#trail/${t.id}">${esc(t.title)} ${ico('arrow')}</a>`).join('')}</section>`:''}<div class="print-footer">Atlas of Ideas · ${esc(p.name)}<br>${p.sources.map(s=>esc(s.label)+' — '+esc(s.url)).join('<br>')}</div></article><aside class="context-column">${connectedPanel(id)}<div class="aside-block"><h2>Idea lenses</h2><div class="idea-tags">${cs.map(c=>`<a href="#idea/${c.id}">${esc(c.name)} ${ico('diagonal')}</a>`).join('')}</div><p class="small-muted">Themes found in this profile. Follow one across the collection.</p></div><div class="aside-block"><h2>Keep the source close.</h2><p class="small-muted">${p.sources.length} ${p.sources.length===1?'reference':'references'} attached to this profile.</p><button data-action="jump" data-section="sources" class="quiet-link">View references ${ico('down')}</button></div></aside></div>`;
}
function readingTop() {return document.body.classList.contains('focus-mode')?84:152;}
function recordProgress(save=true) {
  if(!activeId || !$('#reading-body'))return;
  const sections=$$('.article-section'),top=readingTop();
  let current=sections[0];for(const el of sections)if(el.getBoundingClientRect().top<=top+20)current=el;
  const body=$('#reading-body'),rect=body.getBoundingClientRect();
  const percent=clamp((top-rect.top)/Math.max(1,rect.height)*100,0,100);
  const position={section:current.id,offset:clamp((top-current.getBoundingClientRect().top)/Math.max(1,current.offsetHeight),0,1),percent,updated:Date.now()};
  state.progress[activeId]=position;
  const reading=$('.reader-progress');if(reading){reading.setAttribute('aria-valuenow',String(Math.round(percent)));$('#reader-progress-fill').style.width=percent+'%';$('#read-position').textContent=Math.round(percent)+'%';}
  $$('[data-toc]').forEach(a=>{if(a.dataset.toc===current.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  if(save){clearTimeout(progressTimer);progressTimer=setTimeout(persist,350);}
}
function jumpTo(section,offset=0,{updateURL=true,focus=true}={}) {
  const el=document.getElementById(section);if(!el)return;
  if(dialog.open)dialog.close();
  if(activeId && updateURL)history.replaceState(null,'',personLink(activeId,section));
  const y=el.getBoundingClientRect().top+window.scrollY-readingTop()+offset*el.offsetHeight;
  window.scrollTo({top:Math.max(0,y),behavior:'instant'});
  if(focus){el.setAttribute('tabindex','-1');el.focus({preventScroll:true});}
  recordProgress();
}
function resume(id) {
  const progress=state.progress[id];if(!progress)return;
  const saved={...progress};jumpTo(saved.section,saved.offset,{updateURL:false});
}
function questionRecommendation(id,index) {
  const p=BYID[id],q=p.questions[index];state.answers[id]=index;persist();
  $$('[data-action="question"]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.index)===index)));
  const stop=new Set('what which how when where why does do can could would should the this that with from into about exactly more than some have has for and are its who next understand explain want comes'.split(' '));
  const stems=t=>t.length>5?t.replace(/(ing|ed|s)$/,''):t;
  const tokens=[...new Set(normal(q).match(/[a-z0-9#]+/g)||[])].filter(t=>t.length>2&&!stop.has(t));
  const linked=new Map(neighbors(id).map(n=>[n.person.id,n.edge]));
  const candidates=PEOPLE.filter(x=>x.id!==id).map(person=>{
    const text=searchIndex[person.id],matches=tokens.filter(t=>text.includes(stems(t)));
    return {person,matches,score:matches.length*3+(linked.has(person.id)?1:0)+(person.extended?.4:0)-(state.read.includes(person.id)?.3:0)};
  }).filter(x=>x.matches.length>0).sort((a,b)=>b.score-a.score).slice(0,3);
  const result=$('#question-result');
  result.innerHTML=`<div class="recommendation"><div class="eyebrow">${candidates.length?'READING MATCHES FOR YOUR QUESTION':'KEEP THIS QUESTION OPEN'}</div><p class="ui-text">${candidates.length?'Matched against the existing profile text. This recommends reading, not a solution.':'No useful text match was found. Keep the question in your notes or explore the connection map.'}</p>${candidates.map(({person,matches})=>`<div class="recommendation-item">${compactPerson(person)}<p class="small-muted"><strong>Why this match:</strong> text mentions ${matches.slice(0,4).map(t=>'“'+esc(t)+'”').join(', ')}.${linked.has(person.id)?' Recorded connection: '+esc(linked.get(person.id).label)+'.':''}${state.read.includes(person.id)?' Already marked read.':''}</p></div>`).join('')}<button class="btn small" data-action="save-question" data-id="${id}" data-index="${index}">${ico('note')} Keep this question in my notes</button></div>`;
}

// ----- Map and route finder: every step reuses a recorded labeled edge. -----
function shortestRoute(start,end,directed=false) {
  if(!validID(start)||!validID(end))return null;
  const queue=[start],seen=new Map([[start,null]]);
  for(let i=0;i<queue.length;i++) {
    const id=queue[i];if(id===end)break;
    for(const edge of D.connections){
      const next=edge.source===id?edge.target:(!directed&&edge.target===id?edge.source:null);
      if(!next||seen.has(next))continue;seen.set(next,{from:id,edge});queue.push(next);
    }
  }
  if(!seen.has(end))return null;
  const nodes=[end],steps=[];let cursor=end;
  while(cursor!==start){const item=seen.get(cursor);steps.unshift({from:item.from,to:cursor,edge:item.edge});nodes.unshift(item.from);cursor=item.from;}
  return {nodes,steps};
}
function findPerson(value) {
  const n=normal(value).trim();return PEOPLE.find(p=>normal(p.name)===n||p.id===n)||PEOPLE.find(p=>normal(surname(p))===n)||null;
}
function connections(id,params=new URLSearchParams()) {
  if(validID(id))graphSelected=id;
  if(params.has('to'))graphTarget=validID(params.get('to'))?params.get('to'):'';
  graphDirected=params.get('directed')==='1';
  const p=BYID[graphSelected];
  main.innerHTML=`<div class="wrap"><div class="page-head"><div class="eyebrow">150 RECORDED CONNECTIONS / NO FIXED ROUTE</div><h1>Follow the thread.</h1><p>Not a family tree or a ranking. Each line is a labeled conceptual connection or collaboration from the original collection.</p></div><div class="map-filterbar"><label>Start with<input id="graph-search" list="graph-names" value="${esc(p.name)}" autocomplete="off"></label><label>Connect to <span class="optional">optional</span><input id="graph-target" list="graph-names" placeholder="Choose a second thinker" value="${graphTarget?esc(BYID[graphTarget].name):''}" autocomplete="off"></label><datalist id="graph-names">${PEOPLE.map(p=>`<option value="${esc(p.name)}"></option>`).join('')}</datalist><label class="direction-choice">Direction<select id="graph-direction"><option value="both" ${!graphDirected?'selected':''}>Explore either way</option><option value="directed" ${graphDirected?'selected':''}>Follow arrows only</option></select></label><button class="btn primary" data-action="graph-go">Explore ${ico('arrow')}</button></div><div id="route-result" aria-live="polite"></div><div class="connections-layout"><section class="graph-shell" aria-label="Visual connections map"><div class="graph-top"><span id="graph-count" class="eyebrow"></span><button class="btn small" id="graph-mode" data-action="graph-mode">${graphMode==='local'?'Show full atlas':'Focus map'}</button></div><div class="graph-canvas"><svg id="network" viewBox="0 0 900 580" role="group" aria-label="Interactive connection map. The same connections are available as links in the adjacent list."></svg><div class="graph-controls"><button data-action="zoom-in" aria-label="Zoom in">${ico('plus')}</button><button data-action="zoom-out" aria-label="Zoom out">${ico('minus')}</button><button data-action="graph-fit" aria-label="Reset map view">${ico('fit')}</button></div><span class="graph-hint">Drag to pan · use + / − to zoom</span></div></section><aside class="graph-aside" id="graph-aside" aria-label="Selected profile and all its connections"></aside></div><div class="connection-legend">${Object.values(D.fields).map(f=>`<span><i style="background:${f.color}" aria-hidden="true"></i>${esc(f.name)}</span>`).join('')}</div><p class="fineprint">Paths connect only the links already in this atlas. “Explore either way” may traverse an arrow backwards; each step shows the original arrow. A short path is a reading suggestion, not evidence of direct personal influence.</p></div>`;
  drawGraph();renderRouteResult();
}
function renderRouteResult() {
  const el=$('#route-result');if(!el)return;
  if(!graphTarget){el.innerHTML='';return;}
  const result=shortestRoute(graphSelected,graphTarget,graphDirected);
  if(!result){el.innerHTML=`<div class="route-card"><h2>No recorded route in this direction.</h2><p>This only describes the atlas’s 150 links—not the absence of a relationship. Try exploring either way or choose another endpoint.</p><button class="btn small" data-action="clear-route">Clear destination</button></div>`;return;}
  el.innerHTML=`<section class="route-card"><div class="section-heading"><div><div class="eyebrow">A READING ROUTE / ${result.steps.length} ${result.steps.length===1?'STEP':'STEPS'}</div><h2>${esc(surname(BYID[graphSelected]))} to ${esc(surname(BYID[graphTarget]))}</h2></div><button class="btn small" data-action="clear-route">Clear route ${ico('close')}</button></div><div class="route-chain">${result.nodes.map((id,i)=>`${i?'<span class="chain-arrow" aria-hidden="true">→</span>':''}<a href="${personLink(id)}">${esc(BYID[id].name)}</a>`).join('')}</div>${result.steps.length?`<details class="route-explanation" open><summary>Why these ideas connect</summary><div>${result.steps.map(({from,to,edge})=>`<article class="route-step"><span class="eyebrow">${esc(BYID[edge.source].name)} → ${esc(BYID[edge.target].name)}${edge.source!==from?' / TRAVERSED BACKWARDS':''}</span><h3>${esc(edge.label)}</h3><p>${esc(edge.description)}</p></article>`).join('')}</div></details>`:'<p>You are already at this profile. Choose a different destination to trace a connection.</p>'}</section>`;
}
function drawGraph() {
  const selected=BYID[graphSelected],links=neighbors(graphSelected),all=graphMode==='all';
  const adjacent=new Set([graphSelected,...links.map(n=>n.person.id)]),visible=all?PEOPLE:PEOPLE.filter(p=>adjacent.has(p.id));
  const edges=all?D.connections:links.map(n=>n.edge),pos={};
  if(all){
    const centers=[[160,112],[449,104],[747,115],[155,282],[454,276],[746,282],[151,451],[447,454],[746,451]];
    Object.keys(D.fields).forEach((field,j)=>{
      const ps=PEOPLE.filter(p=>p.field===field),[cx,cy]=centers[j];
      ps.forEach((p,i)=>{const angle=i*2.39996,r=19+Math.sqrt(i)*19;pos[p.id]={x:cx+r*Math.cos(angle),y:cy+r*.7*Math.sin(angle)};});
    });
  } else {
    pos[graphSelected]={x:450,y:281};
    const others=visible.filter(p=>p.id!==graphSelected);others.forEach((p,i)=>{const a=-Math.PI/2+2*Math.PI*i/Math.max(1,others.length);pos[p.id]={x:450+Math.cos(a)*292,y:281+Math.sin(a)*194};});
  }
  const radius=p=>all?(p.id===graphSelected?10:6):(p.id===graphSelected?33:20);
  $('#network').classList.toggle('local-map',!all);
  $('#network').innerHTML=`<defs><marker id="net-arrow" viewBox="0 -4 8 8" refX="7" refY="0" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,-4L8,0L0,4" fill="currentColor"/></marker><pattern id="net-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="currentColor" opacity=".12"/></pattern></defs><rect width="900" height="580" fill="url(#net-grid)"/><g id="graph-transform"><g class="net-edges">${edges.map(e=>{const a=pos[e.source],b=pos[e.target],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ra=radius(BYID[e.source])+3,rb=radius(BYID[e.target])+7;const ax=a.x+dx/len*ra,ay=a.y+dy/len*ra,bx=b.x-dx/len*rb,by=b.y-dy/len*rb;return `<path d="M${ax} ${ay}Q${(ax+bx)/2+10} ${(ay+by)/2-16} ${bx} ${by}" fill="none" stroke="currentColor" stroke-width="${all?1:1.4}" opacity="${all&&e.source!==graphSelected&&e.target!==graphSelected?.15:.6}" marker-end="url(#net-arrow)"><title>${esc(BYID[e.source].name)} → ${esc(BYID[e.target].name)}: ${esc(e.label)}</title></path>`;}).join('')}</g><g>${visible.map(p=>{const {x,y}=pos[p.id],r=radius(p),selected=p.id===graphSelected,f=D.fields[p.field];return `<g class="map-node" transform="translate(${x},${y})" role="button" tabindex="0" aria-pressed="${selected}" aria-label="Focus on ${esc(p.name)}" data-action="graph-node" data-id="${p.id}"><circle class="node-target" r="${Math.max(22,r+10)}" fill="transparent"/><circle class="main-node" r="${r}" fill="${selected?f.color:f.soft}" stroke="${f.color}" stroke-width="${selected?2:1.2}"/>${!all?`<text text-anchor="middle" y="6" fill="${selected?'white':f.color}" font-family="Georgia,serif" font-size="${selected?29:19}">${esc(D.fields[p.field].symbol)}</text>`:''}${!all||adjacent.has(p.id)?`<text class="node-label" y="${r+25}" text-anchor="middle" font-size="${all?12:selected?21:16}" font-family="Georgia,serif">${esc(all?surname(p):p.name)}</text>`:''}<title>${esc(p.name)} — ${esc(p.title)}</title></g>`;}).join('')}</g></g>`;
  graphTransform={x:0,y:0,k:1};applyGraphTransform();
  $('#graph-count').textContent=all?'118 PROFILES / BY FIELD':`${links.length} CONNECTIONS / ${surname(selected).toUpperCase()}`;
  $('#graph-mode').textContent=all?'Focus map':'Show full atlas';
  $('#graph-aside').innerHTML=`<div class="eyebrow">SELECTED THINKER</div><h2>${esc(selected.name)}</h2><p>${esc(selected.title)}</p><a href="${personLink(selected.id)}" class="btn primary small">Read profile ${ico('arrow')}</a><div class="neighbor-list"><h3>Every connection, explained</h3>${links.length?links.map(({person:p,edge,out})=>`<div class="graph-neighbor"><button data-action="graph-node" data-id="${p.id}"><strong>${esc(p.name)}</strong>${ico('arrow')}</button><span class="eyebrow">${out?'OUTGOING':'INCOMING'} · ${esc(edge.label)}</span><p>${esc(edge.description)}</p><a class="quiet-link" href="${personLink(p.id)}">Read profile ${ico('diagonal')}</a></div>`).join(''):'<p>No connections are recorded for this profile yet. Its article is still available.</p>'}</div>`;
  bindPan();
}
function applyGraphTransform(){const el=$('#graph-transform');if(el)el.setAttribute('transform',`translate(${graphTransform.x} ${graphTransform.y}) scale(${graphTransform.k})`);}
function zoom(factor){const t=graphTransform,k=clamp(t.k*factor,.5,5);t.x=450-(450-t.x)*k/t.k;t.y=290-(290-t.y)*k/t.k;t.k=k;applyGraphTransform();}
function bindPan(){
  const el=$('#network');if(el.dataset.panBound)return;el.dataset.panBound='1';let drag=null;
  el.addEventListener('pointerdown',e=>{if(e.target.closest('.map-node'))return;drag={x:e.clientX,y:e.clientY,tx:graphTransform.x,ty:graphTransform.y};el.setPointerCapture(e.pointerId);});
  el.addEventListener('pointermove',e=>{if(!drag)return;const rect=el.getBoundingClientRect(),scale=Math.min(rect.width/900,rect.height/580);graphTransform.x=drag.tx+(e.clientX-drag.x)/scale;graphTransform.y=drag.ty+(e.clientY-drag.y)/scale;applyGraphTransform();});
  el.addEventListener('pointerup',()=>drag=null);el.addEventListener('pointercancel',()=>drag=null);
}
function graphURL(){return '#connections/'+graphSelected+(graphTarget?'?to='+graphTarget+(graphDirected?'&directed=1':''):(graphDirected?'?directed=1':''));}

function trails(){main.innerHTML=`<div class="wrap"><div class="page-head"><div class="eyebrow">EIGHT OPTIONAL READING PATHS</div><h1>Choose a thread.<br>Make it your own.</h1><p>These routes organize the existing collection. Enter anywhere, skip a step, or follow a connection out of the path. Nothing here sets a daily schedule.</p></div><div class="trail-grid all-trails">${D.trails.map(trailcard).join('')}</div>${nextBox()}</div>`;}
function trail(id){
  const t=D.trails.find(t=>t.id===id);if(!t)return notFound();
  const done=t.ids.filter(id=>state.read.includes(id)).length,next=t.ids.find(id=>!state.read.includes(id));
  main.innerHTML=`<div class="wrap"><a class="back-link" href="#trails">${ico('back')} All reading paths</a><div class="trail-intro"><div><div class="eyebrow">${esc(t.tag)}</div><h1>${esc(t.title)}</h1><p>${esc(t.description)}</p>${next?`<a class="btn primary" href="${personLink(next)}">${done?'Continue this path':'Start this path'} ${ico('arrow')}</a>`:'<span class="pill">✓ All profiles marked read</span>'}</div><div class="trail-progress"><span class="eyebrow">YOUR READING</span><strong>${done}<small> / ${t.ids.length}</small></strong><div class="progress-track"><span style="width:${done/t.ids.length*100}%"></span></div><p>Read marks, not just opened pages.</p></div></div><div class="trail-steps">${t.ids.map((id,i)=>{const p=BYID[id],read=state.read.includes(id);return `<article class="trail-step"><span class="step-index ${read?'done':''}" aria-label="${read?'Read':'Step '+(i+1)}">${read?'✓':String(i+1).padStart(2,'0')}</span><div class="step-content"><div><div class="eyebrow">${esc(D.fields[p.field].name)} · ${p.readMinutes} MIN</div><h2>${esc(p.name)}</h2><p>${esc(p.title)}. ${esc(p.impact)}</p></div><a class="btn" href="${personLink(id)}">${read?'Read again':'Open profile'} ${ico('arrow')}</a></div></article>`;}).join('')}</div></div>`;
}
const ERAS=[['before-1500','Early traditions',-10000,1499],['1500-1799','1500–1799',1500,1799],['1800-1899','1800–1899',1800,1899],['1900-1939','1900–1939',1900,1939],['1940-1959','1940–1959',1940,1959],['1960-on','1960 onward',1960,3000]];
function timeline(){main.innerHTML=`<div class="wrap"><div class="page-head"><div class="eyebrow">A LONG VIEW</div><h1>Across the centuries.</h1><p>All 118 people, arranged by birth year—not discovery date. Ancient dates marked “c.” are approximate; ideas do not develop in one straight line.</p></div><div class="timeline-controls">${ERAS.map(([id,title])=>`<button class="pill" data-action="section" data-section="era-${id}">${title}</button>`).join('')}</div>${ERAS.map(([id,title,lo,hi])=>{const ps=PEOPLE.filter(p=>p.born>=lo&&p.born<=hi).sort((a,b)=>a.born-b.born);return `<section class="era-group" id="era-${id}"><div class="era-title"><h2>${title}</h2><span class="eyebrow">${ps.length} PROFILES</span></div><div>${ps.map(p=>`<a class="timeline-item" href="${personLink(p.id)}"><time>${year(p)}</time><h3>${esc(p.name)}</h3><p>${esc(p.title)}</p>${ico('arrow')}</a>`).join('')}</div></section>`;}).join('')}</div>`;}

// ----- Notebook and backup workflow. Version 1 backups are accepted unchanged. -----
function shelf(){
  const noteIDs=Object.keys(state.notes).filter(id=>state.notes[id].trim());
  main.innerHTML=`<div class="wrap"><div class="page-head"><div class="eyebrow">YOUR OWN THREAD THROUGH THE ATLAS</div><h1>The reading room.</h1><p>Saved profiles, reading history and a notebook of your own. Private to this browser, with portable backups for moving between editions or devices.</p></div><div class="shelf-stats"><div><strong>${state.saved.length}</strong><span>SAVED</span></div><div><strong>${state.read.length}</strong><span>READ</span></div><div><strong>${noteIDs.length}</strong><span>NOTES</span></div><div><strong>${state.history.length}</strong><span>RECENTLY OPENED</span></div></div><div class="shelf-toolbar"><div class="shelf-tabs" role="group" aria-label="Notebook view">${[['saved','Saved'],['read','Read'],['history','Recent'],['notes','Notes']].map(([id,name])=>`<button aria-pressed="${shelfTab===id}" class="${shelfTab===id?'active':''}" data-action="shelf-tab" data-tab="${id}">${name}</button>`).join('')}</div><div class="shelf-export"><button class="btn small" data-action="export">${ico('export')} Backup</button><button class="btn small" data-action="import">Import</button><button class="btn small" data-action="export-notes">Notes as text ${ico('diagonal')}</button><input id="shelf-import" type="file" accept="application/json,.json" class="sr-only" aria-label="Import an Atlas shelf backup"></div></div><div id="shelf-content">${shelfContent(noteIDs)}</div><details class="backup-help"><summary>Moving from the original edition? Start here.</summary><p>The old and new editions use the same storage key and profile IDs. On the same browser origin, your saved profiles, read marks and notes load automatically. A renamed local file may have separate browser storage.</p><p>For a reliable move: open the old edition, go to My shelf, export its JSON backup, then import it here. <strong>Merge</strong> preserves both sets of notes; <strong>Replace</strong> requires an additional confirmation.</p><p>There is no account, telemetry, cloud synchronization or automatic link to ChatGPT. Keep a backup before clearing browser data.</p></details>${nextBox()}</div>`;
}
function shelfContent(noteIDs){
  if(shelfTab==='notes')return noteIDs.length?`<div class="notes-list">${noteIDs.map(id=>`<article class="saved-note"><div class="eyebrow">MARGIN NOTE</div><a href="${personLink(id,'notes')}"><h2>${esc(BYID[id].name)} ${ico('diagonal')}</h2></a><p>${esc(state.notes[id])}</p><a class="quiet-link" href="${personLink(id,'notes')}">Continue writing ${ico('arrow')}</a></article>`).join('')}</div>`:emptyShelf('A little space for your next thought.','Open a profile and capture a question or connection in its margin.');
  if(shelfTab==='history')return state.history.length?`<div class="history-list">${state.history.map(id=>{const p=BYID[id],pr=state.progress[id];return `<article><div><div class="eyebrow">${state.read.includes(id)?'MARKED READ':pr?Math.round(pr.percent)+'% THROUGH ARTICLE':'OPENED'}</div><h2>${esc(p.name)}</h2><p>${esc(p.title)}</p></div><a class="btn" href="#person/${id}?resume=1">Resume ${ico('arrow')}</a></article>`;}).join('')}</div>`:emptyShelf('Your first thread starts with a profile.','Recently opened profiles will appear here, with their saved reading positions.');
  const ids=state[shelfTab];return ids.length?`<div class="card-grid">${ids.map(id=>card(BYID[id])).join('')}</div>`:emptyShelf(shelfTab==='saved'?'A shelf with room to grow.':'No read marks yet.',shelfTab==='saved'?'Bookmark a person to keep their profile here.':'Opening a profile does not mark it read. You decide when you are done.');
}
function emptyShelf(title,description){return `<div class="empty"><span class="empty-icon">${ico('book')}</span><h2>${title}</h2><p>${description}</p><a class="btn primary" href="#library">Find a starting point ${ico('arrow')}</a></div>`;}
function download(name,value,type='application/json;charset=utf-8'){
  const text=typeof value==='string'?value:JSON.stringify(value,null,2);
  const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function exportNotes(){
  const ids=Object.keys(state.notes).filter(id=>state.notes[id].trim());
  const text='# Atlas of Ideas — My notebook\n\nExported '+new Date().toISOString().slice(0,10)+'\n\n'+ids.map(id=>'## '+BYID[id].name+'\n\n'+state.notes[id]+'\n\nProfile: #person/'+id+'\n').join('\n---\n\n');
  download('atlas-notebook.md',text,'text/markdown;charset=utf-8');toast(ids.length?'Notebook exported as Markdown text.':'An empty notebook template was exported.');
}
function validateBackup(raw){
  if(!raw||typeof raw!=='object'||raw.version!==1||!Array.isArray(raw.saved)||!Array.isArray(raw.read)||!raw.notes||Array.isArray(raw.notes)||typeof raw.notes!=='object')throw new Error('This is not a supported Atlas shelf backup.');
  if([...raw.saved,...raw.read].some(id=>typeof id!=='string')||Object.values(raw.notes).some(n=>typeof n!=='string'))throw new Error('The backup contains malformed shelf data. Nothing was changed.');
  return cleanState(raw);
}
function mergeState(current,incoming){
  const out=cleanState(current);out.saved=validIDs([...current.saved,...incoming.saved]);out.read=validIDs([...current.read,...incoming.read]);
  for(const [id,text] of Object.entries(incoming.notes)){
    const existing=out.notes[id]||'';
    if(!existing.trim())out.notes[id]=text;
    else if(text.trim() && text!==existing && !existing.includes('\n\n— Imported note —\n'+text))out.notes[id]=existing+'\n\n— Imported note —\n'+text;
  }
  out.answers={...incoming.answers,...current.answers};out.history=validIDs([...current.history,...incoming.history]).slice(0,30);
  for(const [id,p] of Object.entries(incoming.progress))if(!out.progress[id]||p.updated>out.progress[id].updated)out.progress[id]=p;
  return out;
}
function previewImport(incoming){
  pendingImport=incoming;
  const conflicts=Object.keys(incoming.notes).filter(id=>state.notes[id]?.trim()&&incoming.notes[id].trim()&&state.notes[id]!==incoming.notes[id]);
  openDialog('Import your reading shelf',`<p class="dialog-intro">Compatible with the original edition. Preview this backup before changing your data.</p><div class="import-stats"><span><b>${incoming.saved.length}</b> saved</span><span><b>${incoming.read.length}</b> read</span><span><b>${Object.values(incoming.notes).filter(n=>n.trim()).length}</b> notes</span></div><div class="note-panel"><strong>Merge is the safe default.</strong><p>Keep your existing shelf and add this backup. Different notes for the same person are combined with an “Imported note” separator. ${conflicts.length} note ${conflicts.length===1?'conflict':'conflicts'} detected. Your current appearance preferences stay unchanged.</p></div><div class="dialog-actions"><button class="btn primary" data-action="import-merge">Merge with my shelf ${ico('plus')}</button><button class="btn" data-action="import-replace">Replace instead</button><button class="btn text" data-action="close-dialog">Cancel</button></div>`);
}

function about(){
  main.innerHTML=`<div class="wrap"><div class="page-head"><div class="eyebrow">READER’S EDITION / VERSION 2</div><h1>Curiosity, with context.</h1><p>An independent collection of mathematical lives and ideas. Built to read, revisit and connect—not to send you down a predetermined sequence.</p></div><div class="about-layout"><div class="about-content"><h2>What is in this atlas?</h2><p>The collection contains ${PEOPLE.length} distinct profiles, including ${PEOPLE.filter(p=>p.extended).length} expanded articles and ${PEOPLE.filter(p=>!p.extended).length} quick portraits; ${D.connections.length} labeled connections; nine research fields; and eight optional reading paths. The original 118-profile source is retained unchanged; validated publication records add new articles and corrections. The shorter portraits are introductions, not complete biographies.</p><h2>How to use the reader</h2><p>Open a profile, adjust its type size or line spacing, and use Focus to hide the surrounding navigation. The contents highlight your position as you scroll. A reading position is not a completion mark: only the Mark as read button changes your read list. Continue from Discover or the Recent shelf.</p><p>Every article section has its own shareable link. Equations open in a larger view with copyable plain text and, where it exists in the source, TeX. The pre-rendered mathematics needs no network connection.</p><h2>Connections without invented history</h2><p>Arrows retain their original labels and descriptions. Some denote collaborations; others are thematic reading connections. The route finder searches only those recorded edges. Exploring an arrow in reverse is explicitly identified and does not reverse its historical meaning.</p><p>The 12 idea lenses and question suggestions use text matching in this catalogue. They are navigation aids, not generated answers, scientific classifications or exhaustive literature surveys.</p><h2>Content and qualifications</h2>${D.standards.map((s,i)=>`<div class="standard"><span>${String(i+1).padStart(2,'0')}</span><p>${esc(s)}</p></div>`).join('')}<p>The starting point is the September 2026 educational snapshot. The original catalogue is preserved in the source, and subsequent changes are recorded in the <a href="#updates">publication journal</a>. A scheduled profile becomes part of this edition only after its update record is accepted, built and deployed. This page does not itself fetch your conversations or generate new articles. Neither the redesign nor a deployment constitutes independent re-verification of every claim.</p><h2>Publishing and your private notebook are separate</h2><p>The public source repository is <a class="inline-source" href="https://github.com/hadi1373z/atlas-of-ideas" target="_blank" rel="noopener noreferrer">hadi1373z/atlas-of-ideas</a>. Accepted source changes can be built and deployed to GitHub Pages. New content appears after reloading the site; there is no background polling or upload of your notebook.</p><h2>Your notebook belongs to you</h2><p>Notes, saved profiles and preferences remain in browser storage. There are no accounts, trackers, remote fonts, background requests or cloud uploads. Storage restrictions, private browsing, a new file location or clearing browser data can prevent your shelf from carrying over. Use a JSON backup when moving editions; Markdown export makes notes readable outside the website.</p><p>The original storage key and profile IDs are unchanged. Old JSON backups can be merged without discarding your current notes. Replace mode is available only after confirmation.</p><h2>Access and controls</h2><p>All main actions have keyboard controls, visible focus indicators and text labels. The graph has an equivalent connection list, so dragging is never necessary for exploring its data. Dialogs support Escape and return focus to the opening control. Reduced-motion preferences are respected. A manual screen-reader audit has not been performed.</p><div class="actions"><button class="btn" data-action="help">Keyboard guide ${ico('arrow')}</button><button class="btn" data-action="export-catalogue">Export catalogue ${ico('export')}</button></div><h2>Design references</h2><p>Implementation references: <a class="inline-source" href="https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" target="_blank" rel="noopener noreferrer">WAI dialog guidance</a>, <a class="inline-source" href="https://www.w3.org/WAI/WCAG22/Understanding/reflow.html" target="_blank" rel="noopener noreferrer">W3C reflow guidance</a>, and <a class="inline-source" href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage" target="_blank" rel="noopener noreferrer">MDN on browser storage</a>.</p></div><aside class="about-sidebar"><div class="about-number"><strong>${PEOPLE.length}</strong><span>MATHEMATICAL MINDS</span></div><div class="about-number"><strong>${D.connections.length}</strong><span>EXPLAINED CONNECTIONS</span></div><div class="about-number"><strong>12</strong><span>WAYS IN THROUGH IDEAS</span></div><div class="note-panel"><strong>Offline by design.</strong><p>One HTML file. No build step to read it. Only opening external sources needs internet.</p></div></aside></div></div>`;
}
function notFound(){main.innerHTML=`<div class="wrap"><div class="empty"><div class="eyebrow">OUTSIDE THIS ATLAS</div><h1>That page is not in the collection.</h1><p>The link may be incomplete. Your shelf has not changed.</p><a class="btn primary" href="#library">Open the collection ${ico('arrow')}</a></div></div>`;}

// ----- Native modal dialogs: focus containment, Escape and focus return. -----
function openDialog(title,html,focusSelector=null){
  if(!dialog.open)lastFocus=document.activeElement;
  dialog.innerHTML=`<div class="dialog-head"><h2 id="dialog-title" tabindex="-1">${esc(title)}</h2><button class="icon-btn" data-action="close-dialog" aria-label="Close dialog">${ico('close')}</button></div><div class="dialog-body">${html}</div>`;
  if(!dialog.open)dialog.showModal();
  document.body.classList.add('dialog-open');
  (focusSelector?$(focusSelector,dialog):$('#dialog-title'))?.focus();
}
dialog.addEventListener('close',()=>{
  document.body.classList.remove('dialog-open');
  if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});lastFocus=null;
  const anchor=readerAnchor;readerAnchor=null;
  if(anchor&&activeId===anchor.id)requestAnimationFrame(()=>{
    if(activeId!==anchor.id)return;
    if(anchor.section)jumpTo(anchor.section,anchor.offset,{updateURL:false,focus:false});
    else window.scrollTo({top:anchor.y,behavior:'instant'});
  });
});
function settingsDialog(){
  if(activeId&&!dialog.open){
    const top=readingTop(),sections=$$('.article-section');let current=null;
    for(const el of sections)if(el.getBoundingClientRect().top<=top+20)current=el;
    readerAnchor=current?{id:activeId,section:current.id,offset:clamp((top-current.getBoundingClientRect().top)/Math.max(1,current.offsetHeight),0,1)}:{id:activeId,y:window.scrollY};
  }
  openDialog('Make room for the idea.',`<p class="dialog-intro">Reader settings are saved on this device. They change the article, not its content.</p><div class="setting-row"><label for="reader-size">Text size</label><div class="range-field"><input id="reader-size" type="range" min="16" max="26" step="1" value="${state.reader.size}"><output id="size-value" for="reader-size">${state.reader.size}px</output></div></div><div class="setting-row"><label for="reader-leading">Line spacing</label><div class="range-field"><input id="reader-leading" type="range" min="1.5" max="2.2" step="0.05" value="${state.reader.leading}"><output id="leading-value" for="reader-leading">${state.reader.leading.toFixed(2)}</output></div></div><div class="setting-row"><label for="reader-font">Article typeface</label><select id="reader-font"><option value="serif" ${state.reader.font==='serif'?'selected':''}>Bookish / serif</option><option value="sans" ${state.reader.font==='sans'?'selected':''}>Clear / sans serif</option></select></div><div class="setting-row"><label for="reader-width">Reading measure</label><select id="reader-width"><option value="standard" ${state.reader.width==='standard'?'selected':''}>Standard</option><option value="wide" ${state.reader.width==='wide'?'selected':''}>Wider</option></select></div><div class="reader-sample"><span class="eyebrow">PREVIEW</span><p>A useful idea changes what you can see in a familiar problem.</p></div><div class="dialog-actions"><button class="btn primary" data-action="close-dialog">Return to reading ${ico('arrow')}</button><button class="btn text" data-action="reset-reader">Reset typography</button></div>`);
}
function equationDialog(id,index){
  const p=BYID[id];if(!p)return;const item=index<0?p:p.sections[index];if(!item)return;
  const text=item.math||item.formula||'';
  openDialog('A closer look.',`<div class="equation-large" role="math" aria-label="${esc(text)}"><div aria-hidden="true">${item.mathSVG||esc(text)}</div></div><h3>Plain-text notation</h3><pre class="math-source">${esc(text)}</pre><div class="dialog-actions"><button class="btn" data-action="copy-equation" data-id="${id}" data-index="${index}" data-format="plain">${ico('copy')} Copy notation</button>${item.tex?`<button class="btn" data-action="copy-equation" data-id="${id}" data-index="${index}" data-format="tex">${ico('copy')} Copy TeX</button>`:''}</div>${item.tex?`<details class="tex-details"><summary>Show TeX source</summary><pre class="math-source">${esc(item.tex)}</pre></details>`:'<p class="small-muted">This entry has plain-text notation rather than stored TeX.</p>'}<p class="small-muted">${esc(p.name)} · ${esc(index<0?'Signature idea':item.title)}</p>`);
}
function searchDialog(){
  openDialog('Find your next connection.',`<label class="search-input dialog-search">${ico('search')}<input id="quick-search" type="search" placeholder="A person, a theorem, an idea…" autocomplete="off" aria-label="Search full profiles"></label><div id="quick-results" aria-live="polite"></div><p class="shortcut-hint">Names and full article text · ↑ / ↓ browse · Enter open · Esc close</p>`,'#quick-search');
  quickResults('');
}
function quickResults(query){
  const terms=termsOf(query),matches=orderedPeople(PEOPLE.filter(p=>terms.every(t=>searchIndex[p.id].includes(t))));
  $('#quick-results').innerHTML=`<div class="quick-label eyebrow">${terms.length?matches.length+' MATCHING PROFILES':'SOME PLACES TO BEGIN'}</div>${matches.slice(0,7).map(p=>{const snippet=terms.length?matchExcerpt(p,query):null;return `<a class="quick-result" href="${personLink(p.id,snippet?.section||'')}" style="${fieldStyle(p)}"><span class="mini-symbol" aria-hidden="true">${esc(D.fields[p.field].symbol)}</span><span><strong>${highlight(p.name,query)}</strong><small>${snippet?snippet.html:esc(p.title)}</small></span>${ico('arrow')}</a>`;}).join('')}${!matches.length?'<p class="empty-search">No match. Try a broader term such as “proof” or “graph”.</p>':''}${terms.length&&matches.length>7?`<a class="all-results" href="#library?q=${encodeURIComponent(query)}">Show all ${matches.length} results ${ico('arrow')}</a>`:''}`;
}
function helpDialog(){openDialog('A small guide to the atlas.',`<div class="help-row"><kbd>/</kbd><p>Open full-text search from any page.</p></div><div class="help-row"><kbd>F</kbd><p>Toggle distraction-free focus while reading a profile.</p></div><div class="help-row"><kbd>Esc</kbd><p>Close a dialog or the mobile menu; leave focus mode when no dialog is open.</p></div><div class="help-row"><kbd>Tab</kbd><p>Move between links and controls. Map nodes work with Enter or Space; the adjacent list offers the same connections without using the map.</p></div><h3>Your reading position</h3><p>Scrolling remembers the current article section. Use Continue on Discover or Resume in the Recent shelf to return. Mark as read is always a separate, deliberate action.</p><h3>Notes and backups</h3><p>Notes save as you type. Back up the shelf as JSON to transfer it between browsers or file locations. Export your notebook as Markdown to use it in other writing tools.</p><p class="small-muted">Text matching and recommendations run locally. Nothing here alters a scheduled task.</p>`);}

function suggest(){
  let candidates=PEOPLE.filter(p=>!state.read.includes(p.id)&&(state.interest==='all'||p.field===state.interest)&&(state.depth!=='extended'||p.extended));
  if(!candidates.length){toast('All matching profiles are marked read. Choose a different field or depth.');return;}
  const fresh=candidates.filter(p=>!state.history.slice(0,5).includes(p.id));if(fresh.length)candidates=fresh;
  const p=candidates[Math.floor(Math.random()*candidates.length)];location.hash=personLink(p.id);
}
async function copyText(text,label='Text'){
  try{if(!navigator.clipboard?.writeText)throw new Error('Unavailable');await navigator.clipboard.writeText(text);toast(label+' copied.');}
  catch {
    const el=document.createElement('textarea');el.value=text;el.style.cssText='position:fixed;left:-10000px';document.body.append(el);el.select();
    let ok=false;try{ok=document.execCommand('copy');}catch{}el.remove();
    if(ok)toast(label+' copied.');else openDialog('Copy '+label.toLowerCase(),`<p>Select and copy the text below. Your browser did not permit automatic clipboard access.</p><textarea class="copy-fallback" readonly>${esc(text)}</textarea>`);
  }
}
function copyProfileLink(id,section=''){
  const url=location.href.split('#')[0]+personLink(id,section);
  copyText(url,location.protocol==='file:'?'Local file link':'Profile link');
}
function refreshSaveButtons(id){
  const saved=state.saved.includes(id);
  $$(`[data-action="save"][data-id="${id}"]`).forEach(b=>{
    b.setAttribute('aria-pressed',String(saved));b.setAttribute('aria-label',`${saved?'Unsave':'Save'} ${BYID[id].name}`);
    if(b.classList.contains('bookmark-btn'))b.classList.toggle('saved',saved);
    else{b.classList.toggle('primary',saved);b.innerHTML=ico('bookmark')+' '+(saved?'Saved':'Save profile');}
  });
  const badge=$('.count-badge');if(badge)badge.textContent=state.saved.length;
  $('.shelf-link')?.setAttribute('aria-label',`My shelf, ${state.saved.length} saved profiles`);
}
function toggleRead(id){
  if(!validID(id))return;state.read=state.read.includes(id)?state.read.filter(x=>x!==id):[...state.read,id];persist();
  const read=state.read.includes(id);
  $$(`[data-action="read"][data-id="${id}"]`).forEach(b=>{b.classList.toggle('primary',read);b.setAttribute('aria-pressed',String(read));b.innerHTML=ico('check')+' '+(read?'Marked as read':'Mark as read');});
  toast(read?'Marked as read. Future unread suggestions will skip this profile.':'Read mark removed. Your notes and place are unchanged.');
}
function toggleFocus(){
  if(!activeId)return;
  const top=readingTop(),sections=$$('.article-section');let current=sections[0];
  for(const el of sections)if(el.getBoundingClientRect().top<=top+20)current=el;
  const section=current?.id||'overview',offset=clamp((top-(current?.getBoundingClientRect().top||top))/Math.max(1,current?.offsetHeight||1),0,1);
  suppressProgress=true;state.reader.focus=!state.reader.focus;applyPreferences();persist();
  requestAnimationFrame(()=>{jumpTo(section,offset,{updateURL:false,focus:false});setTimeout(()=>suppressProgress=false,80);});
  $$('[data-action="focus"]').forEach(b=>{b.setAttribute('aria-pressed',String(state.reader.focus));b.innerHTML=ico('focus')+'<span>'+(state.reader.focus?'Exit focus':'Focus')+'</span>';});dock();
}
let suppressProgress=false;
function route(){
  const serial=++routeSerial;clearTimeout(progressTimer);persist();
  const hash=location.hash.slice(1)||'home',question=hash.indexOf('?');
  const path=question<0?hash:hash.slice(0,question),params=new URLSearchParams(question<0?'':hash.slice(question+1));
  const [view,encoded='']=path.split('/');let id='';try{id=decodeURIComponent(encoded);}catch{}
  const savedPlace=validID(id)&&state.progress[id]?{...state.progress[id]}:null;
  suppressProgress=true;if(dialog.open)dialog.close();
  activeId=view==='person'&&validID(id)?id:null;currentRoute=path;applyPreferences();
  header();footer();
  if(view==='home')home();else if(view==='library')library(id,params);else if(view==='person')profile(id);else if(view==='ideas')ideas();else if(view==='idea')idea(id);else if(view==='connections')connections(id,params);else if(view==='trails')trails();else if(view==='trail')trail(id);else if(view==='timeline')timeline();else if(view==='shelf')shelf();else if(view==='about')about();else if(view==='updates')publicationJournal();else if(view==='publication')publicationArchive(id);else notFound();
  if(activeId){state.history=validIDs([activeId,...state.history]).slice(0,30);persist();}
  dock();
  const pageTitle=activeId?BYID[activeId].name:({home:'Discover',library:'Thinkers',ideas:'Idea lenses',idea:CONCEPTS.find(c=>c.id===id)?.name,connections:'Connections',trails:'Reading paths',trail:D.trails.find(t=>t.id===id)?.title,timeline:'Timeline',shelf:'Reading room',about:'About this edition',updates:'Publication journal',publication:'Archived profile'}[view]||'Explore');
  document.title=pageTitle+' — Atlas of Ideas';
  window.scrollTo({top:0,behavior:'instant'});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(serial!==routeSerial)return;
    if(params.has('section')&&activeId)jumpTo(params.get('section'),0,{updateURL:false});
    else if(params.get('resume')==='1'&&activeId&&savedPlace)jumpTo(savedPlace.section,savedPlace.offset,{updateURL:false});
    else if(!initialRoute){const h=$('h1',main);if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
    initialRoute=false;
    // Rendering at the top must not overwrite a saved resume position.
    if(activeId&&!params.has('section')&&params.get('resume')!=='1'){
      if(savedPlace)state.progress[activeId]=savedPlace;
      else delete state.progress[activeId];
    }
    setTimeout(()=>{if(serial===routeSerial)suppressProgress=false;},80);
  }));
}

// Delegated actions survive route changes and preserve focused controls when possible.
document.addEventListener('click',event=>{
  const anchor=event.target.closest('a');
  if(anchor?.classList.contains('skip')){event.preventDefault();main.focus();return;}
  if(anchor&&dialog.contains(anchor)&&anchor.getAttribute('href')?.startsWith('#'))dialog.close();
  const b=event.target.closest('[data-action]');if(!b)return;
  const a=b.dataset.action,id=b.dataset.id;
  if(a==='close-dialog'){dialog.close();return;}
  if(a==='search'){searchDialog();return;}
  if(a==='help'){helpDialog();return;}
  if(a==='save'&&validID(id)){
    state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];persist();refreshSaveButtons(id);toast(state.saved.includes(id)?'Saved to your shelf.':'Removed from your saved shelf. Notes are unchanged.');
    if(currentRoute==='shelf')shelf();else if(currentRoute.startsWith('library')&&cat.scope==='saved')renderResults();
  } else if(a==='read')toggleRead(id);
  else if(a==='theme'){
    state.theme=state.theme==='light'?'dark':'light';applyPreferences();persist();
    b.setAttribute('aria-label',`Switch to ${state.theme==='light'?'dark':'light'} theme`);b.innerHTML=ico(state.theme==='light'?'moon':'sun');
  } else if(a==='menu'){
    const nav=$('#navigation'),open=nav.classList.toggle('open');b.setAttribute('aria-expanded',String(open));b.setAttribute('aria-label',open?'Close navigation':'Open navigation');b.innerHTML=ico(open?'close':'menu');
  } else if(a==='view'){
    cat.view=b.dataset.mode;$$('[data-action="view"]').forEach(q=>q.setAttribute('aria-pressed',String(q.dataset.mode===cat.view)));renderResults();
  } else if(a==='field'){
    cat.field=b.dataset.field;cat.limit=24;$$('[data-action="field"]').forEach(q=>{q.classList.toggle('active',q.dataset.field===cat.field);q.setAttribute('aria-pressed',String(q.dataset.field===cat.field));});renderResults();
  } else if(a==='reset-filters'){
    cat={...cat,query:'',field:'all',scope:'all',limit:24};$('#collection-search').value='';$('#scope-select').value='all';$('#field-pills').innerHTML=fieldPills();renderResults();$('#collection-search').focus();
  } else if(a==='load-more'){
    const previous=cat.limit;cat.limit+=24;renderResults();const first=$$('.person-link')[previous];first?.focus({preventScroll:true});
  } else if(a==='surprise')suggest();
  else if(a==='settings')settingsDialog();
  else if(a==='focus')toggleFocus();
  else if(a==='reset-reader'){state.reader={...initialState().reader,focus:state.reader.focus};applyPreferences();persist();settingsDialog();}
  else if(a==='contents'&&activeId)openDialog('In this profile',toc(BYID[activeId],true));
  else if(a==='jump'){event.preventDefault();jumpTo(b.dataset.section);}
  else if(a==='section'){event.preventDefault();const el=document.getElementById(b.dataset.section);if(el){window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-100,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});el.tabIndex=-1;el.focus({preventScroll:true});}}
  else if(a==='resume')resume(id);
  else if(a==='copy')copyProfileLink(id);
  else if(a==='copy-section')copyProfileLink(id,b.dataset.section);
  else if(a==='equation')equationDialog(id,Number(b.dataset.index));
  else if(a==='copy-equation'){
    const p=BYID[id],i=Number(b.dataset.index),item=i<0?p:p.sections[i];copyText(b.dataset.format==='tex'?item.tex:(item.math||item.formula),'Equation');
  } else if(a==='print')window.print();
  else if(a==='question')questionRecommendation(id,Number(b.dataset.index));
  else if(a==='save-question'){
    const q=BYID[id]?.questions[Number(b.dataset.index)];if(!q)return;
    const note=state.notes[id]||'';if(!note.includes(q))state.notes[id]=note+(note.trim()?'\n\n':'')+'Question: '+q;persist();
    const input=$('#profile-note');if(input)input.value=state.notes[id];toast('Question added to your margin notes.');
  } else if(a==='shelf-tab'){shelfTab=b.dataset.tab;shelf();$(`[data-tab="${shelfTab}"]`)?.focus({preventScroll:true});}
  else if(a==='export'){persist();download('atlas-my-shelf.json',{...state,exportedAt:new Date().toISOString()});toast('Shelf backup exported. Keep it before moving file locations.');}
  else if(a==='export-notes')exportNotes();
  else if(a==='export-catalogue'){download('atlas-catalogue.json',D);toast('The catalogue was exported. Private notes are not included.');}
  else if(a==='import')$('#shelf-import')?.click();
  else if(a==='import-merge'&&pendingImport){state=mergeState(state,pendingImport);pendingImport=null;corrupted=false;persist();dialog.close();applyPreferences();header();shelf();dock();toast('Backup merged. Existing notes and read marks were preserved.');}
  else if(a==='import-replace'&&pendingImport){
    if(!confirm('Replace this browser’s shelf, notes, history and appearance settings with the selected backup? Export your current shelf first if you need to keep it.'))return;
    state=pendingImport;pendingImport=null;corrupted=false;persist();dialog.close();applyPreferences();header();shelf();dock();toast('Shelf replaced from the selected backup.');
  } else if(a==='graph-node'&&validID(id)){
    graphSelected=id;$('#graph-search').value=BYID[id].name;history.replaceState(null,'',graphURL());drawGraph();renderRouteResult();
    $(`.map-node[data-id="${id}"]`)?.focus({preventScroll:true});
  } else if(a==='graph-go'){
    const start=findPerson($('#graph-search').value),targetValue=$('#graph-target').value.trim(),target=targetValue?findPerson(targetValue):null;
    if(!start){toast('Choose a start name from the suggestions.');$('#graph-search').focus();return;}
    if(targetValue&&!target){toast('Choose a destination name from the suggestions.');$('#graph-target').focus();return;}
    graphSelected=start.id;graphTarget=target?.id||'';graphDirected=$('#graph-direction').value==='directed';
    $('#graph-search').value=start.name;if(target)$('#graph-target').value=target.name;history.replaceState(null,'',graphURL());drawGraph();renderRouteResult();
  } else if(a==='clear-route'){graphTarget='';$('#graph-target').value='';history.replaceState(null,'',graphURL());renderRouteResult();$('#graph-target').focus();}
  else if(a==='graph-mode'){graphMode=graphMode==='local'?'all':'local';drawGraph();}
  else if(a==='zoom-in')zoom(1.3);else if(a==='zoom-out')zoom(1/1.3);else if(a==='graph-fit'){graphTransform={x:0,y:0,k:1};applyGraphTransform();}
});
let searchTimer;
document.addEventListener('input',event=>{
  const el=event.target;
  if(el.id==='collection-search'){cat.query=el.value;cat.limit=24;clearTimeout(searchTimer);searchTimer=setTimeout(renderResults,90);}
  else if(el.id==='quick-search')quickResults(el.value);
  else if(el.id==='profile-note'){
    state.notes[el.dataset.id]=el.value;const ok=persist();$('#notes-status').textContent=ok?'Saved locally':'Saved in this session only — export a backup to keep it';
  } else if(el.id==='reader-size'){
    state.reader.size=Number(el.value);$('#size-value').textContent=el.value+'px';applyPreferences();persist();
  } else if(el.id==='reader-leading'){
    state.reader.leading=Number(el.value);$('#leading-value').textContent=Number(el.value).toFixed(2);applyPreferences();persist();
  }
});
document.addEventListener('change',async event=>{
  const el=event.target;
  if(el.id==='sort-select'){cat.sort=el.value;renderResults();}
  else if(el.id==='scope-select'){cat.scope=el.value;cat.limit=24;renderResults();}
  else if(el.id==='interest-select'){state.interest=el.value;persist();}
  else if(el.id==='depth-select'){state.depth=el.value;persist();}
  else if(el.id==='reader-font'){state.reader.font=el.value;applyPreferences();persist();}
  else if(el.id==='reader-width'){state.reader.width=el.value;applyPreferences();persist();}
  else if(el.id==='shelf-import'){
    const file=el.files?.[0];if(!file)return;
    try{if(file.size>8_000_000)throw new Error('This backup exceeds the 8 MB safety limit.');const incoming=validateBackup(JSON.parse(await file.text()));previewImport(incoming);}
    catch(error){toast(error instanceof SyntaxError?'This file is not valid JSON. Your shelf was not changed.':error.message);}
    el.value='';
  }
});
document.addEventListener('keydown',event=>{
  const typing=event.target.closest('input,textarea,select,[contenteditable="true"]');
  if(dialog.open){
    if(event.key==='Tab'){
      const items=$$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]',dialog).filter(el=>el.getClientRects().length>0&&!el.closest('[hidden]'));
      const first=items[0],last=items.at(-1),active=document.activeElement;
      if(!first){event.preventDefault();$('#dialog-title').focus();}
      else if(event.shiftKey&&(active===first||!items.includes(active))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(active===last||!dialog.contains(active))){event.preventDefault();first.focus();}
    }
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      const items=$$('.quick-result',dialog);if(items.length){event.preventDefault();let i=items.indexOf(document.activeElement);i=event.key==='ArrowDown'?(i+1)%items.length:(i<=0?items.length-1:i-1);items[i].focus();}
    }
    if(event.target.id==='quick-search'&&event.key==='Enter'){$('.quick-result',dialog)?.click();event.preventDefault();}
    return;
  }
  if(event.target.closest('.map-node')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();event.target.closest('.map-node').dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}
  if(['graph-search','graph-target'].includes(event.target.id)&&event.key==='Enter'){$('[data-action="graph-go"]').click();event.preventDefault();}
  if(event.key==='/'&&!typing&&!event.ctrlKey&&!event.metaKey){event.preventDefault();searchDialog();}
  if(event.key.toLowerCase()==='f'&&!typing&&!event.ctrlKey&&!event.metaKey&&activeId){event.preventDefault();toggleFocus();}
  if(event.key==='Escape'){
    const nav=$('#navigation');if(nav?.classList.contains('open')){nav.classList.remove('open');const b=$('[data-action="menu"]');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Open navigation');b.innerHTML=ico('menu');b.focus();}
    else if(activeId&&state.reader.focus)toggleFocus();
  }
});
window.addEventListener('scroll',()=>{
  if(!activeId||suppressProgress||dialog.open)return;
  if(scrollFrame!==null)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=null;recordProgress();});
},{passive:true});
window.addEventListener('pagehide',()=>{clearTimeout(progressTimer);persist();});
window.addEventListener('hashchange',route);
route();
// Read-only snapshots aid testing without exposing mutation functions.
window.Atlas={get catalogue(){return JSON.parse(JSON.stringify(D));},get localState(){return JSON.parse(JSON.stringify(state));},shortestRoute:(a,b,d=false)=>shortestRoute(a,b,d)};
})();
