/* SUPRA Writer — offline, local-only Quick Actions. MIT. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const actions=[
 {id:'letter',glyph:'✉',title:'Professional letter',detail:'One click: clean type, balanced margins and spacing',syn:'business correspondence formal',run:()=>applyLook('minimal',{size:'letter',orientation:'portrait'})},
 {id:'academic',glyph:'▤',title:'Academic paper',detail:'One click: serif text, double lines and wide margins',syn:'essay school research mla',run:()=>applyLook('academic',{size:'letter',orientation:'portrait'})},
 {id:'read',glyph:'◉',title:'Comfortable reading',detail:'One click: larger type, more space and warm paper',syn:'accessible legible dyslexia autism',run:()=>applyLook('reading',{size:'letter',orientation:'portrait'})},
 {id:'print',glyph:'▣',title:'Ready to print',detail:'One click: black ink, white paper and practical spacing',syn:'printer economical high contrast',run:()=>applyLook('highcontrast',{size:'letter',orientation:'portrait',fontSize:15,line:1.5,paper:'#ffffff',color:'#000000'})},
 {id:'compact',glyph:'⇤',title:'Fit more per page',detail:'One click: smaller text and tighter margins (page count not guaranteed)',syn:'compact save paper shorter',run:()=>applyLook('compact2',{size:'letter',orientation:'portrait'})},
 {id:'manuscript',glyph:'✎',title:'Book manuscript',detail:'One click: typewriter font with double lines',syn:'novel draft story writer',run:()=>applyLook('manuscript',{size:'letter',orientation:'portrait'})},
 {id:'undo',glyph:'↶',title:'Undo last look',detail:'Restore the prior set of appearance settings',syn:'revert previous formatting',run:()=>$('revertLookQuick').click()},
 {id:'save-look',glyph:'☆',title:'Save current look',detail:'Name and reuse your current formatting setup',syn:'custom preset template favorite',run:()=>$('saveLookQuick').click()},
 {id:'find',glyph:'⌕',title:'Find words',detail:'Search in the current document',syn:'search text',run:()=>$('showFind').click()},
 {id:'replace',glyph:'⇄',title:'Find and replace',detail:'Open text replacement; changes require your confirmation',syn:'replace all substitute edit words',run:()=>{const bar=$('findBar');bar.hidden=false;$('replaceText').parentElement.hidden=false;$('replaceNext').hidden=false;$('replaceAll').hidden=false;$('findText').focus();}},
 {id:'font',glyph:'Aa',title:'Choose a font',detail:'Go directly to letter shapes and size',syn:'typeface typography text',run:()=>jump('text','fontSearch')},
 {id:'new-page',glyph:'▯',title:'Start a new page',detail:'Insert a real page break that stays in Word documents',syn:'pagebreak ctrl enter next sheet separate page',run:()=>$('addPageBreak').click()},
 {id:'page',glyph:'▯',title:'Adjust page margins',detail:'Open paper size, direction and margins',syn:'layout orientation landscape portrait',run:()=>jump('page','paperSize')},
 {id:'advanced',glyph:'⚙',title:'Advanced formatting',detail:'Open the detailed appearance controls',syn:'settings spacing colors indent',run:()=>jump('advanced','advancedPreset')},
 {id:'word',glyph:'↓',title:'Save Word document',detail:'Export DOCX using the normal Save dialog',syn:'export file docx',run:()=>{$('saveMenuBtn').click();$('[data-export="docx"]').click();}},
 {id:'pdf',glyph:'▣',title:'Save or print PDF',detail:'Use Windows PDF export or browser printing',syn:'export document print',run:()=>$('printBtn').click()},
 {id:'new',glyph:'✧',title:'New document',detail:'Start blank (asks before replacing existing writing)',syn:'blank start clear',run:()=>$('newBtn').click()},
 {id:'open',glyph:'↥',title:'Open a document',detail:'Load DOCX, HTML or TXT',syn:'import load file',run:()=>$('openBtn').click()}
];
let filtered=actions,selected=0;
function updateControl(id,value,event='change'){const el=$(id);if(!el)return;el.value=value;el.dispatchEvent(new Event(event,{bubbles:true}));}
function jump(tab,focusId){document.querySelector('[data-tab="'+tab+'"]')?.click();$(focusId)?.focus();}
function applyLook(name,extra){
 updateControl('advancedPreset',name);
 $('applyAdvanced').click();
 if(extra.size)updateControl('paperSize',extra.size);
 if(extra.orientation)$((extra.orientation==='landscape'?'landscape':'portrait')+'Btn').click();
 if(extra.fontSize)updateControl('fontSizeNumber',extra.fontSize);
 if(extra.line)updateControl('lineAdvanced',extra.line,'input');
 if(extra.paper){const input=document.querySelector('[data-paper="'+extra.paper+'"]');input?.click();}
 if(extra.color){const input=$('textColor');input.value=extra.color;input.dispatchEvent(new Event('input',{bubbles:true}));}
}
const style=document.createElement('style');style.textContent=`
.supra-fast-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0}
.supra-fast-grid button{background:#edf4ff;border:1px solid #abc3e2;color:#1a395a;border-radius:8px;text-align:left;min-height:47px;font-size:12px;font-weight:700;padding:9px;cursor:pointer}
.supra-fast-grid button:hover,.supra-fast-grid button:focus-visible{background:#dbeafb}
.supra-fast-backdrop[hidden]{display:none!important}
.supra-fast-backdrop{position:fixed;inset:0;z-index:15000;background:#0b1a30be;display:flex;justify-content:center;align-items:flex-start;padding:9vh 16px 20px}
.supra-fast-modal{background:#fff;color:#152c46;border-radius:14px;border:1px solid #9cb0ca;max-height:85vh;width:min(610px,100%);padding:17px;box-shadow:0 24px 70px #0006;display:flex;flex-direction:column}
.supra-fast-header{display:flex;gap:12px;align-items:start;justify-content:space-between}
.supra-fast-header h2{margin:0;font-size:20px}.supra-fast-header p{margin:4px 0 14px;font-size:13px;color:#506782}
.supra-fast-close{font-size:24px;min-width:37px;min-height:37px;border:1px solid #afbed2;border-radius:8px;background:#fff;color:#16395d}
#supraFastSearch{border:2px solid #7b9dc9;border-radius:9px;background:white;color:#172f49;font-size:16px;padding:10px;min-height:44px;width:100%}
.supra-fast-results{overflow-y:auto;margin:8px 0;min-height:70px}
.supra-fast-option{display:flex;align-items:center;gap:12px;text-align:left;width:100%;border:1px solid transparent;background:white;color:#1d334d;border-radius:8px;padding:9px;cursor:pointer}
.supra-fast-option:hover,.supra-fast-option[aria-selected=true]{background:#e9f2ff;border-color:#98b8e1}
.supra-fast-option strong{font-size:14px;display:block}.supra-fast-option small{display:block;color:#586a80;margin-top:2px;font-size:12px;line-height:1.35}
.supra-fast-glyph{width:33px;height:33px;background:#e3edfa;color:#245292;border-radius:7px;display:grid;place-items:center;font-size:19px;flex-shrink:0}
.supra-fast-hint{margin:4px 0 0;font-size:12px;color:#617189}
@media(max-width:750px){.supra-fast-backdrop{padding:12px}.supra-fast-modal{max-height:90dvh;padding:12px}}
@media print{.supra-fast-backdrop,.supra-fast-grid{display:none!important}}`;
document.head.appendChild(style);
const launch=document.createElement('button');launch.id='quickActionsBtn';launch.type='button';launch.className='top-btn';launch.title='Search actions by result (Ctrl+K)';launch.textContent='⚡ Quick Actions';
$('showFind')?.before(launch);
const dock=document.createElement('div');dock.className='supra-fast-grid';dock.setAttribute('aria-label','One-click document workflows');
for(const [id,label] of [['letter','✉ Letter'],['academic','▤ Academic'],['read','◉ Readable'],['print','▣ Print-ready']]){
 const b=document.createElement('button');b.type='button';b.dataset.quickAction=id;b.textContent=label;b.addEventListener('click',()=>run(id));dock.appendChild(b);
}
$('quickPanel')?.insertBefore(dock,$('quickPanel').querySelector('.presets'));
const overlay=document.createElement('div');overlay.id='quickActionsModal';overlay.className='supra-fast-backdrop';overlay.hidden=true;
overlay.innerHTML='<section class="supra-fast-modal" role="dialog" aria-modal="true" aria-labelledby="supraFastTitle"><div class="supra-fast-header"><div><h2 id="supraFastTitle">⚡ Quick Actions</h2><p>Describe your goal. One command can change many settings.</p></div><button class="supra-fast-close" id="supraFastClose" aria-label="Close Quick Actions">×</button></div><label for="supraFastSearch" class="visually-hidden">Search commands</label><input type="search" id="supraFastSearch" autocomplete="off" placeholder="Try: academic, print, accessible, replace…" aria-controls="supraFastResults"><div id="supraFastResults" class="supra-fast-results" role="listbox"></div><p class="supra-fast-hint">↑ ↓ choose · Enter run · Esc close · Ctrl+K search</p></section>';
document.body.append(overlay);
const search=$('supraFastSearch'),results=$('supraFastResults');
function render(){
 const terms=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
 filtered=actions.filter(a=>terms.every(t=>(a.title+' '+a.detail+' '+a.syn).toLowerCase().includes(t)));
 selected=0;results.replaceChildren();
 if(!filtered.length){const p=document.createElement('p');p.textContent='No matches. Try letter, print, replace or PDF.';results.append(p);return;}
 filtered.forEach((a,i)=>{
  const b=document.createElement('button');b.type='button';b.className='supra-fast-option';b.setAttribute('role','option');b.setAttribute('aria-selected',i===selected?'true':'false');
  const g=document.createElement('span');g.className='supra-fast-glyph';g.textContent=a.glyph;
  const detail=document.createElement('span');const title=document.createElement('strong');title.textContent=a.title;const desc=document.createElement('small');desc.textContent=a.detail;detail.append(title,desc);b.append(g,detail);
  b.addEventListener('click',()=>run(a.id));results.append(b);
 });
}
function move(delta){if(!filtered.length)return;selected=(selected+delta+filtered.length)%filtered.length;results.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-selected',i===selected?'true':'false'));results.querySelectorAll('button')[selected]?.scrollIntoView({block:'nearest'});}
function open(){overlay.hidden=false;search.value='';render();search.focus();}
function close(){overlay.hidden=true;launch.focus();}
function run(id){const a=actions.find(x=>x.id===id);if(!a)return false;overlay.hidden=true;a.run();return true;}
launch.addEventListener('click',open);$('supraFastClose').addEventListener('click',close);
overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
search.addEventListener('input',render);
search.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();move(e.key==='ArrowDown'?1:-1);}if(e.key==='Enter'){e.preventDefault();if(filtered[selected])run(filtered[selected].id);}if(e.key==='Escape'){e.preventDefault();close();}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}else if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();close();}});
window.SUPRAQuickActions=Object.freeze({ids:()=>actions.map(a=>a.id),open,run});
})();