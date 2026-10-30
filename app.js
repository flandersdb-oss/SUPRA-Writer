/* SUPRA Writer v0.2 — MIT. Original, offline-first word processor. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const doc = $('document');
const defaults = {font:"Arial, Helvetica, sans-serif",fontSize:15,line:1.65,color:'#1c2938',paper:'#ffffff',size:'letter',margin:'normal',orientation:'portrait',zoom:100,letterSpacing:0,wordSpacing:0,fontWeight:400,paragraphSpace:1.05,firstIndent:0,marginCustom:90,headingColor:'#263f60',align:'left'};
let settings = {...defaults}; let savedRange = null; let saveTimer = null; let maxSaveTimer = null; let toastTimer = null;
const AUTOSAVE_IDLE_MS = 50; // Small documents: only 50 ms after the last edit.
const AUTOSAVE_MEDIUM_MS = 120; // Medium documents: keep typing responsive.
const AUTOSAVE_LARGE_MS = 300; // Large documents: avoid excessive full-document writes.
const AUTOSAVE_MAX_MS = 1000; // Continuous typing: aim for one checkpoint per second.
const AUTOSAVE_MIN_GAP_MS = 300; // Avoid repeated synchronous writes while typing rapidly.
let lastSavedAt = 0;
let lastSavedDocumentSize = 0;
let unsavedChanges = false;
function autosaveIdleDelay(){
 if(lastSavedDocumentSize >= 500000)return AUTOSAVE_LARGE_MS;
 if(lastSavedDocumentSize >= 100000)return AUTOSAVE_MEDIUM_MS;
 return AUTOSAVE_IDLE_MS;
}
const dims = {letter:[816,1056],a4:[794,1123]};
const margins = {narrow:37,normal:90,wide:120};
const getMargin = () => settings.margin==='custom'?Math.max(20,Math.min(160,Number(settings.marginCustom)||90)):(margins[settings.margin]||90);
let lastLook=null, customLooks=[], importedFonts=[];
// Catalog names are not downloaded assets. Browser/OS fallback is expected unless installed.
// Reuse the system's entire font collection through manual entry, Local Font Access (where allowed), or a user-owned font file.
const FONT_GROUPS = {
 accessible:['Atkinson Hyperlegible Next','Atkinson Hyperlegible','Atkinson Hyperlegible Mono','OpenDyslexic','OpenDyslexic 3','Lexend','Readex Pro','Andika','ABeeZee','Comic Neue','Verdana','Tahoma','Trebuchet MS','Nunito Sans','Noto Sans','Inter','Fira Sans','Source Sans 3','Roboto','Lato'],
 sans:['Arial','Helvetica','Helvetica Neue','Aptos','Calibri','Carlito','Liberation Sans','DejaVu Sans','Noto Sans','Noto Sans Display','Open Sans','Inter','Roboto','Roboto Condensed','Roboto Flex','Lato','Montserrat','Poppins','Nunito','Nunito Sans','Work Sans','IBM Plex Sans','Source Sans 3','Fira Sans','Ubuntu','Cantarell','Noto Sans Symbols 2','Segoe UI','Trebuchet MS','Verdana','Tahoma','Gill Sans','Franklin Gothic','Century Gothic','Arial Narrow','Quicksand','Cabin','Manrope','Mulish','Outfit','DM Sans','Rubik','Raleway','Bricolage Grotesque','Sora','Alegreya Sans','Recursive','Oswald','PT Sans','Merriweather Sans','Barlow'],
 serif:['Georgia','Times New Roman','Times','Cambria','Constantia','Garamond','EB Garamond','Baskerville','Libre Baskerville','Palatino Linotype','Book Antiqua','Bookman Old Style','Charter','Noto Serif','Noto Serif Display','Source Serif 4','Merriweather','Lora','PT Serif','IBM Plex Serif','Crimson Pro','Cormorant Garamond','Fraunces','Newsreader','Bitter','Literata','Alegreya','Playfair Display','Spectral','Liberation Serif','DejaVu Serif','FreeSerif','GFS Didot'],
 display:['Comic Neue','Comic Sans MS','Impact','Anton','Bebas Neue','Cinzel','Pacifico','Dancing Script','Caveat','Lobster','Permanent Marker','Abril Fatface','Alfa Slab One','Amatic SC','Shadows Into Light','Righteous','Satisfy','Great Vibes','Rock Salt','Brush Script MT','Copperplate','Papyrus','Cinzel Decorative','Cormorant Unicase','UnifrakturCook'],
 mono:['Consolas','Cascadia Code','Cascadia Mono','Courier New','Liberation Mono','DejaVu Sans Mono','Noto Sans Mono','Atkinson Hyperlegible Mono','Fira Code','Fira Mono','JetBrains Mono','Recursive Mono','IBM Plex Mono','Roboto Mono','Source Code Pro','Ubuntu Mono','Inconsolata','Menlo','Monaco','Lucida Console','Space Mono','Anonymous Pro'],
 international:['Noto Sans Arabic','Noto Naskh Arabic','Amiri','Cairo','Noto Sans Hebrew','Noto Serif Hebrew','Noto Sans Devanagari','Noto Serif Devanagari','Hind','Mukta','Noto Sans Bengali','Noto Sans Tamil','Noto Sans Telugu','Noto Sans Thai','Sarabun','Noto Sans JP','Noto Sans CJK JP','Noto Serif JP','Yu Gothic','Meiryo','MS Gothic','Noto Sans SC','Noto Sans CJK SC','Microsoft YaHei','SimSun','Noto Serif SC','Noto Sans TC','Noto Sans KR','Malgun Gothic','Nanum Gothic','Noto Sans Ethiopic','Noto Sans Armenian','Noto Sans Georgian','Noto Sans Symbols 2','Noto Sans Math','Noto Color Emoji']
};
const FONT_FALLBACK={accessible:'sans-serif',sans:'sans-serif',serif:'serif',display:'sans-serif',mono:'monospace',international:'sans-serif',personal:'sans-serif'};
const fontItems=[];const allNames=new Set();const scannedInstalledFonts=new Set();let hasScannedInstalledFonts=false;
for(const [category,names] of Object.entries(FONT_GROUPS))for(const name of names){const k=name.toLowerCase();if(!allNames.has(k)){allNames.add(k);fontItems.push({name,category});}}
function safeFontName(raw){const name=String(raw||'').trim();return name.length>0&&name.length<=90&&!/[\\'";{}<>]/.test(name)?name:null;}
function fontCss(name,category){return '"'+name.replace(/"/g,'')+'", '+(FONT_FALLBACK[category]||'sans-serif');}
function updateFontAvailability(){
 const chosen=settings.font.split(',')[0].trim().replace(/^['"]|['"]$/g,'');
 const note=$('fontAvailability');if(!note)return;
 const knownImported=importedFonts.some(n=>n.toLowerCase()===chosen.toLowerCase());
 const knownInstalled=scannedInstalledFonts.has(chosen.toLowerCase());
 if(knownImported)note.textContent='✓ '+chosen+' is loaded for this session. Save important documents separately; local font files are not bundled with exports.';
 else if(knownInstalled)note.textContent='✓ '+chosen+' was found in the installed-font scan on this device.';
 else if(hasScannedInstalledFonts)note.textContent='⚠ '+chosen+' was not found in the installed-font scan. A substitute may be displayed.';
 else note.textContent='Font names are not bundled fonts. '+chosen+' may require installation. Select “Scan installed” to check, or add a licensed font file.';
}
function fillFontList(){const term=$('fontSearch').value.toLowerCase().trim(),cat=$('fontCategory').value;const chosen=settings.font.split(',')[0].trim().replace(/^['"]|['"]$/g,'');const choices=fontItems.filter(item=>(cat==='all'||cat===item.category)&&item.name.toLowerCase().includes(term));
 const select=$('fontSelect');select.textContent='';for(const item of choices){const opt=document.createElement('option');opt.textContent=item.name;opt.value=fontCss(item.name,item.category);opt.style.fontFamily=opt.value;opt.selected=(item.name.toLowerCase()===chosen.toLowerCase());select.append(opt);}
 if(chosen&&!choices.some(item=>item.name.toLowerCase()===chosen.toLowerCase())&&!term){const opt=document.createElement('option');opt.textContent=chosen+' (current)';opt.value=settings.font;opt.selected=true;select.prepend(opt);}
 $('fontCount').textContent=choices.length+' shown · '+fontItems.length+' font names';updateFontAvailability();
}
function addFontToCatalog(name,refresh=true){if(!allNames.has(name.toLowerCase())){allNames.add(name.toLowerCase());fontItems.unshift({name,category:'personal'});}if(refresh)fillFontList();}
async function loadFontFile(file){if(!file)return;const name=(file.name||'').replace(/\.(ttf|otf|woff2?)$/i,'').replace(/[_-]+/g,' ').trim().slice(0,70);if(!/\.(ttf|otf|woff2?)$/i.test(file.name)||file.size>8*1024*1024||file.size<100)throw Error('Use a TTF/OTF/WOFF font smaller than 8 MB');if(!('FontFace' in window))throw Error('This browser does not support local font loading');const safe=safeFontName(name);if(!safe)throw Error('Unsupported font name');const face=new FontFace(safe,await file.arrayBuffer());await face.load();document.fonts.add(face);importedFonts.push(safe);addFontToCatalog(safe);setSetting('font',fontCss(safe,'personal'));toast('✓ Font loaded for this session: '+safe);}
async function findLocalFonts(){if(!('queryLocalFonts' in window)){toast('Browser cannot list installed fonts. Type the name or add a file.');return;}try{const list=await window.queryLocalFonts();for(const f of list){const name=safeFontName(f.family);if(name){addFontToCatalog(name,false);scannedInstalledFonts.add(name.toLowerCase());}}hasScannedInstalledFonts=true;fillFontList();toast('Found '+list.length+' installed font styles.');}catch(e){toast('Font access was unavailable or denied. Add a font file instead.');}}
function loadSavedLooks(){try{const looks=JSON.parse(localStorage.getItem('supra-writer-looks-v02')||'[]');if(Array.isArray(looks))customLooks=looks.filter(i=>i&&typeof i.name==='string'&&i.settings).slice(0,25);}catch(e){customLooks=[];}renderCustomLooks();}
function renderCustomLooks(){const host=$('customLooks');host.textContent='';if(!customLooks.length)return;const heading=document.createElement('strong');heading.textContent='My saved looks';host.append(heading);for(let i=0;i<customLooks.length;i++){const row=document.createElement('div');row.className='saved-look';const apply=document.createElement('button');apply.textContent='✦ '+customLooks[i].name;apply.addEventListener('click',()=>applySettings(customLooks[i].settings,customLooks[i].name));const del=document.createElement('button');del.textContent='×';del.title='Delete saved look';del.setAttribute('aria-label','Delete '+customLooks[i].name);del.addEventListener('click',()=>{customLooks.splice(i,1);saveCustomLooks();});row.append(apply,del);host.append(row);}}
function saveCustomLooks(){try{localStorage.setItem('supra-writer-looks-v02',JSON.stringify(customLooks));}catch(e){toast('Could not keep looks in this browser');}renderCustomLooks();}
function rememberLook(){lastLook={...settings};}
function applySettings(changes,label){rememberLook();const appearanceKeys=['font','fontSize','line','color','paper','margin','letterSpacing','wordSpacing','fontWeight','paragraphSpace','firstIndent','headingColor','align'];const base=Object.fromEntries(appearanceKeys.map(k=>[k,defaults[k]]));settings={...settings,...base,...changes};updatePreview();document.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));$('advancedPreset').value='';document.querySelectorAll('[data-advanced-card]').forEach(b=>b.classList.toggle('active',Boolean(advancedPresets[b.dataset.advancedCard]&&Object.keys(advancedPresets[b.dataset.advancedCard]).every(k=>settings[k]===advancedPresets[b.dataset.advancedCard][k]))));queueSave();toast('✓ '+label+' look applied');}
function saveCurrentLook(){const name=prompt('Name this complete document look:','My custom look');if(name===null)return;const clean=name.trim().slice(0,45);if(!clean)return;const idx=customLooks.findIndex(item=>item.name.toLowerCase()===clean.toLowerCase());const entry={name:clean,settings:{...settings}};if(idx>=0)customLooks[idx]=entry;else if(customLooks.length>=25){toast('Maximum 25 saved looks. Delete one first.');return;}else customLooks.push(entry);saveCustomLooks();toast('✓ Saved '+clean);}
const advancedPresets={
 reading:{font:'"Lexend", sans-serif',fontSize:19,line:1.85,letterSpacing:.5,wordSpacing:3,fontWeight:400,paragraphSpace:1.1,firstIndent:0,margin:'wide',paper:'#fffaf0',color:'#29303b',headingColor:'#344b5a',align:'left'},
 hyper:{font:'"Atkinson Hyperlegible Next", sans-serif',fontSize:19,line:1.8,letterSpacing:.5,wordSpacing:2,fontWeight:500,paragraphSpace:1.05,firstIndent:0,margin:'normal',paper:'#ffffff',color:'#132b40',headingColor:'#244e78',align:'left'},
 dyslexia:{font:'"OpenDyslexic", sans-serif',fontSize:19,line:1.95,letterSpacing:.75,wordSpacing:3,fontWeight:400,paragraphSpace:1.2,firstIndent:0,margin:'wide',paper:'#fffaf0',color:'#252c34',headingColor:'#263c53',align:'left'},
 highcontrast:{font:'"Atkinson Hyperlegible Next", sans-serif',fontSize:22,line:1.8,letterSpacing:.6,wordSpacing:2,fontWeight:600,paragraphSpace:1.15,margin:'normal',paper:'#ffffff',color:'#000000',headingColor:'#000000',align:'left'},
 academic:{font:'"Georgia", serif',fontSize:16,line:2,letterSpacing:0,wordSpacing:0,fontWeight:400,paragraphSpace:.4,firstIndent:32,margin:'wide',paper:'#ffffff',color:'#111111',headingColor:'#111111',align:'left'},
 manuscript:{font:'"Courier New", monospace',fontSize:16,line:2,letterSpacing:0,wordSpacing:0,fontWeight:400,paragraphSpace:.5,firstIndent:25,margin:'wide',paper:'#fff',color:'#161616',headingColor:'#161616',align:'left'},
 newsletter:{font:'"Arial", sans-serif',fontSize:15,line:1.45,letterSpacing:0,wordSpacing:0,fontWeight:400,paragraphSpace:.8,firstIndent:0,margin:'narrow',paper:'#ffffff',color:'#233247',headingColor:'#175b96',align:'left'},
 poetry:{font:'"Garamond", serif',fontSize:19,line:1.9,letterSpacing:.2,wordSpacing:1,fontWeight:400,paragraphSpace:1.35,firstIndent:0,margin:'wide',paper:'#fffaf0',color:'#2e2a28',headingColor:'#673e49',align:'left'},
 minimal:{font:'"Inter", sans-serif',fontSize:16,line:1.65,letterSpacing:0,wordSpacing:0,fontWeight:400,paragraphSpace:1,firstIndent:0,margin:'normal',paper:'#ffffff',color:'#222222',headingColor:'#222222',align:'left'},
 typewriter:{font:'"Liberation Mono", monospace',fontSize:17,line:1.75,letterSpacing:.4,wordSpacing:1,fontWeight:400,paragraphSpace:1,firstIndent:0,margin:'normal',paper:'#f5f4ee',color:'#292929',headingColor:'#292929',align:'left'},
 draft:{font:'"Verdana", sans-serif',fontSize:20,line:2,letterSpacing:.25,wordSpacing:2,fontWeight:400,paragraphSpace:1.3,firstIndent:0,margin:'normal',paper:'#ffffff',color:'#334054',headingColor:'#304c79',align:'left'},
 compact2:{font:'"Arial", sans-serif',fontSize:13,line:1.23,letterSpacing:-.25,wordSpacing:0,fontWeight:400,paragraphSpace:.5,firstIndent:0,margin:'narrow',paper:'#ffffff',color:'#111827',headingColor:'#22355c',align:'justify'}
};
const advancedCardData=[
 ['reading','☼','Calm reading','Warm paper, roomy words'],
 ['hyper','◉','Clear characters','Distinct letter shapes'],
 ['dyslexia','Aa','OpenDyslexic','Specialized font choice'],
 ['highcontrast','◐','Extra contrast','Strong black on white'],
 ['academic','▤','Academic','Wide margins, double lines'],
 ['manuscript','⌨','Manuscript','Typewriter-style draft'],
 ['newsletter','▥','Newsletter','Compact editorial layout'],
 ['poetry','✎','Poetry','Light, generous spacing'],
 ['minimal','□','Minimal','Modern and understated'],
 ['typewriter','⌨','Typewriter','Monospace, warm paper'],
 ['draft','✧','Spacious draft','Large and relaxed'],
 ['compact2','⇤','Fit more','Compact and professional']
];
function renderAdvancedCards(){const host=$('advancedCards');for(const [id,glyph,title,desc] of advancedCardData){const button=document.createElement('button');button.className='adv-card';button.dataset.advancedCard=id;button.title='Apply '+title+' to whole document';const symbol=document.createElement('span');symbol.className='adv-glyph';symbol.textContent=glyph;const details=document.createElement('span');const strong=document.createElement('strong');strong.textContent=title;const small=document.createElement('small');small.textContent=desc;details.append(strong,small);button.append(symbol,details);button.addEventListener('click',()=>applySettings(advancedPresets[id],title));host.append(button);}}
const symbolSet=[['⸮','Irony / sarcasm (historical)'],['‽','Interrobang'],['⁂','Asterism'],['§','Section'],['¶','Paragraph'],['©','Copyright'],['®','Registered'],['™','Trademark'],['…','Ellipsis'],['—','Em dash'],['–','En dash'],['•','Bullet'],['→','Right arrow'],['←','Left arrow'],['↔','Both directions'],['✓','Check'],['✦','Star'],['♡','Heart'],['°','Degrees'],['±','Plus/minus'],['∞','Infinity'],['≈','Approximately'],['≤','Less than or equal'],['≥','Greater than or equal'],['€','Euro'],['£','Pound'],['¥','Yen'],['₹','Rupee'],['¿','Inverted question'],['¡','Inverted exclamation']];
function insertSymbol(ch){restoreSelection();document.execCommand('insertText',false,ch);saveSelection();queueSave();}

const presets = {
 everyday:{font:defaults.font,fontSize:15,line:1.65,margin:'normal',color:'#1c2938',paper:'#fff'},
 report:{font:'Arial, Helvetica, sans-serif',fontSize:16,line:1.5,margin:'normal',color:'#1b3153',paper:'#fff'},
 book:{font:"Georgia, 'Times New Roman', serif",fontSize:17,line:1.8,margin:'wide',color:'#262219',paper:'#fffaf0'},
 large:{font:'Verdana, Geneva, sans-serif',fontSize:21,line:1.8,margin:'normal',color:'#14243a',paper:'#fff'},
 compact:{font:'Arial, Helvetica, sans-serif',fontSize:13,line:1.25,margin:'narrow',color:'#1c2938',paper:'#fff'}
};
function toast(msg){const e=$('toast');e.textContent=msg;e.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('visible'),3200);}
function status(msg){$('saveStatus').textContent=msg;}
function updateCounts(){const txt=doc.innerText||doc.textContent||'';const words=(txt.trim().match(/\S+/g)||[]).length;$('wordCount').textContent=words+' word'+(words===1?'':'s');$('charCount').textContent=txt.length+' characters';}
function store(){
 clearTimeout(saveTimer);saveTimer=null;clearTimeout(maxSaveTimer);maxSaveTimer=null;
 try{
  const html=doc.innerHTML;
  localStorage.setItem('supra-writer-v02',JSON.stringify({html,name:$('docName').value,settings}));
  lastSavedDocumentSize=html.length;lastSavedAt=Date.now();
  unsavedChanges=false;status('✓ Autosaved on this device');updateCounts();
  document.dispatchEvent(new CustomEvent('supra:writer:saved',{detail:{html,name:$('docName').value,settings:{...settings}}}));
  return true;
 }catch(err){
  unsavedChanges=true;status('Autosave unavailable — use Save file');updateCounts();return false;
 }
}
function queueSave(){
 unsavedChanges=true;status('Saving…');
 clearTimeout(saveTimer);
 const gap=lastSavedAt ? Math.max(0,AUTOSAVE_MIN_GAP_MS-(Date.now()-lastSavedAt)) : 0;
 saveTimer=setTimeout(store,Math.max(autosaveIdleDelay(),gap));
 if(maxSaveTimer===null)maxSaveTimer=setTimeout(store,AUTOSAVE_MAX_MS);
}
function flushAutosave(){if(unsavedChanges)store();}
function contrastRatio(foreground,background){const linear=hex=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};const l1=linear(foreground),l2=linear(background);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);}
function updateContrast(){const r=contrastRatio(settings.color,settings.paper);const grade=r>=7?'Excellent contrast':r>=4.5?'Good contrast':r>=3?'Low contrast for small letters':'Very low contrast';$('contrastMeter').textContent='◐ Text / paper contrast: '+r.toFixed(1)+':1 · '+grade;$('contrastMeter').classList.toggle('contrast-warning',r<4.5);}
function updatePreview(){const [dw,dh]=dims[settings.size];const wide=settings.orientation==='landscape';const w=wide?dh:dw,h=wide?dw:dh;const pg=$('pageFrame');const mobile=innerWidth<750;pg.style.width=mobile?'100%':w+'px';pg.style.minHeight=mobile?'600px':h+'px';pg.style.backgroundColor=settings.paper;pg.style.transform=mobile?'none':'scale('+(settings.zoom/100)+')';pg.style.marginBottom=mobile?'0px':((settings.zoom/100-1)*h)+'px';
 doc.style.minHeight=mobile?'600px':(h-2)+'px';doc.style.fontFamily=settings.font;doc.style.fontSize=settings.fontSize+'px';doc.style.lineHeight=String(settings.line);doc.style.color=settings.color;doc.style.backgroundColor=settings.paper;doc.style.letterSpacing=settings.letterSpacing+'px';doc.style.wordSpacing=settings.wordSpacing+'px';doc.style.fontWeight=String(settings.fontWeight);doc.style.textAlign=settings.align;doc.style.setProperty('--paragraph-gap',settings.paragraphSpace+'em');doc.style.setProperty('--first-indent',settings.firstIndent+'px');doc.style.setProperty('--heading-ink',settings.headingColor);let m=getMargin();doc.style.padding=(mobile?Math.min(28,m):m)+'px';
 if(innerWidth>=750){const available=document.querySelector('.editor-area').clientWidth-40;if(available>150&&w*settings.zoom/100>available){$('editorHint').textContent='↔ Page is wider than the viewing area — scroll to see the edge';}else{$('editorHint').textContent='✎ Click anywhere on the page to start writing';}}
 fillFontList();$('fontSize').value=Math.min(72,settings.fontSize);$('fontSizeNumber').value=settings.fontSize;$('fontSample').style.fontFamily=settings.font;$('fontSample').style.fontSize=Math.min(21,settings.fontSize+2)+'px';$('lineIllustration').style.gap=(settings.line*7)+'px';$('textColor').value=settings.color;$('paperSize').value=settings.size;$('zoomVal').textContent=settings.zoom+'%';
 document.querySelectorAll('[data-line]').forEach(b=>b.classList.toggle('active',Number(b.dataset.line)===settings.line));
 document.querySelectorAll('[data-margin]').forEach(b=>b.classList.toggle('active',b.dataset.margin===settings.margin));
 document.querySelectorAll('[data-color]').forEach(b=>b.classList.toggle('active',b.dataset.color.toLowerCase()===settings.color.toLowerCase()));
 document.querySelectorAll('[data-paper]').forEach(b=>b.classList.toggle('active',b.dataset.paper.toLowerCase()===settings.paper.toLowerCase()));
 ['letterSpacing','wordSpacing','fontWeight','lineAdvanced','paragraphSpace','firstIndent','customMargin','headingColor','textAlignGlobal'].forEach(id=>{const key={lineAdvanced:'line',customMargin:'marginCustom',textAlignGlobal:'align'}[id]||id;$(id).value=settings[key];});[['letterSpacing',' px'],['wordSpacing',' px'],['lineAdvanced','×'],['paragraphSpace',' em'],['firstIndent',' px'],['customMargin',' px']].forEach(([id,unit])=>$(id+'Val').textContent=$(id).value+unit);$('portraitBtn').classList.toggle('active',settings.orientation==='portrait');$('landscapeBtn').classList.toggle('active',settings.orientation==='landscape');
 updateContrast();document.documentElement.style.setProperty('--print-size',settings.size+' '+settings.orientation);document.documentElement.style.setProperty('--print-margin',(m/96)+'in');
}
function setSetting(key,value){settings[key]=value;document.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));updatePreview();queueSave();}
function activatePreset(name){rememberLook();settings={...settings,...defaults,...presets[name]};updatePreview();document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset===name));queueSave();toast('✓ '+document.querySelector('[data-preset="'+name+'"]').querySelector('strong').textContent+' look applied');}
function showTab(tab){document.querySelectorAll('.side-tab').forEach(el=>{const yes=el.dataset.tab===tab;el.classList.toggle('active',yes);el.setAttribute('aria-selected',yes?'true':'false');});['quick','text','page','advanced'].forEach(id=>$(id+'Panel').hidden=(id!==tab));}
function saveSelection(){const selection=window.getSelection();if(selection.rangeCount && doc.contains(selection.anchorNode)) savedRange=selection.getRangeAt(0).cloneRange();}
function restoreSelection(){doc.focus();if(savedRange){const selection=window.getSelection();selection.removeAllRanges();try{selection.addRange(savedRange);}catch(err){savedRange=null;}}}
function command(name,val){restoreSelection();document.execCommand(name,false,val);saveSelection();queueSave();}
const safeUrl=url=>{try{const u=new URL(url,location.href);return ['https:','http:','mailto:'].includes(u.protocol)?u.href:null;}catch{return null;}};
const PAGE_BREAK_HTML='<div data-supra-page-break="true" contenteditable="false"></div>';
const PAGE_BREAK_TOKEN='<!--SUPRA-PAGE-BREAK-TOKEN-->';
const allowed=new Set(['P','DIV','H1','H2','H3','H4','BR','STRONG','B','EM','I','U','S','STRIKE','DEL','SPAN','FONT','UL','OL','LI','BLOCKQUOTE','PRE','CODE','TABLE','TBODY','THEAD','TR','TD','TH','A','SUP','SUB','HR']);
const cssAllowed=new Set(['font-family','font-size','font-weight','font-style','text-decoration','text-decoration-line','color','background-color','text-align','line-height']);
function sanitizeMarkup(html){const parsed=new DOMParser().parseFromString('<body>'+html+'</body>','text/html');
 function walk(parent){for(const node of [...parent.childNodes]){if(node.nodeType===8){node.remove();continue;}if(node.nodeType!==1)continue;
  if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','META','LINK','BASE','IMG','VIDEO','AUDIO'].includes(node.tagName)){node.remove();continue;}
  if(!allowed.has(node.tagName)){walk(node);node.replaceWith(...Array.from(node.childNodes));continue;}
  for(const attr of [...node.attributes]){if(attr.name==='href'&&node.tagName==='A'){const url=safeUrl(attr.value);if(url)node.setAttribute('href',url);else node.removeAttribute('href');continue;}
   if(attr.name==='data-supra-page-break'&&node.tagName==='DIV'&&attr.value==='true')continue;
   if(attr.name==='contenteditable'&&node.tagName==='DIV'&&node.getAttribute('data-supra-page-break')==='true'&&attr.value==='false')continue;
   if(attr.name==='colspan'&&['TD','TH'].includes(node.tagName)){if(!/^\d{1,2}$/.test(attr.value))node.removeAttribute('colspan');continue;}
   if(attr.name==='rowspan'&&['TD','TH'].includes(node.tagName)){if(!/^\d{1,2}$/.test(attr.value))node.removeAttribute('rowspan');continue;}
   if(attr.name==='style'){const v=[];for(const style of node.style){if(!cssAllowed.has(style))continue;const value=node.style.getPropertyValue(style);if(!/url\s*\(|expression\s*\(|@import/i.test(value))v.push(style+':'+value);}
    if(v.length)node.setAttribute('style',v.join(';'));else node.removeAttribute('style');continue;}
   node.removeAttribute(attr.name);
  }walk(node);
 }}walk(parsed.body);return parsed.body.innerHTML;}
function addPageBreak(){
 restoreSelection();
 // Fixed editor-generated HTML only; never insert untrusted markup.
 const inserted=document.execCommand('insertHTML',false,PAGE_BREAK_HTML+'<p><br></p>');
 if(!inserted){
  const selection=window.getSelection();if(!selection.rangeCount)return;
  const range=selection.getRangeAt(0);range.deleteContents();
  const marker=document.createElement('div');marker.setAttribute('data-supra-page-break','true');marker.setAttribute('contenteditable','false');
  range.insertNode(marker);
 }
 savedRange=null;queueSave();toast('New page added');
}
function insertHtml(html){restoreSelection();document.execCommand('insertHTML',false,sanitizeMarkup(html));saveSelection();queueSave();}
function loadHtml(html,name){doc.innerHTML=sanitizeMarkup(html)||'<p></p>';$('docName').value=name||'Untitled';savedRange=null;store();}
function textToHtml(text){return text.replace(/\r\n?/g,'\n').split(/\n\n+/).map(p=>'<p>'+escapeXml(p).replace(/\n/g,'<br>')+'</p>').join('');}
function escapeXml(text){return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
let forceDesktopSaveAs=false;
async function download(bytes,fileName,mime){
 const blob=bytes instanceof Blob?bytes:new Blob([bytes],{type:mime});
 if(window.SUPRADesktop){
  const force=forceDesktopSaveAs;forceDesktopSaveAs=false;
  try {const data=new Uint8Array(await blob.arrayBuffer());const result=await window.SUPRADesktop.saveDocument({fileName,bytes:data,saveAs:force});
   if(result?.saved){status('Saved to '+result.fileName);toast('Saved: '+result.fileName);return;}if(result?.canceled){status('Save canceled');return;}
  }catch(e){toast('Save failed: '+e.message);status('Save failed');}return;
 }
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fileName;a.style.display='none';document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1000);
}
function filename(ext){const name=($('docName').value||'Untitled').trim().replace(/[\\/:*?"<>|]/g,'-').slice(0,90);return (name||'Untitled')+'.'+ext;}
function exportHtml(){const serialized='<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>'+escapeXml($('docName').value)+'</title><style>body{background:#e9edf3;margin:0;padding:28px}article{box-sizing:border-box;margin:auto;max-width:850px;min-height:900px;background:'+settings.paper+';padding:'+getMargin()+'px;font-family:'+settings.font+';font-size:'+settings.fontSize+'px;line-height:'+settings.line+';letter-spacing:'+settings.letterSpacing+'px;word-spacing:'+settings.wordSpacing+'px;font-weight:'+settings.fontWeight+';text-align:'+settings.align+';color:'+settings.color+';overflow-wrap:anywhere}article p{text-indent:'+settings.firstIndent+'px;margin-bottom:'+settings.paragraphSpace+'em}article h1,article h2,article h3{color:'+settings.headingColor+'}table{border-collapse:collapse;width:100%}th,td{border:1px solid #aab8c8;padding:8px}blockquote{border-left:4px solid #98b2d3;padding-left:15px}article [data-supra-page-break=true]{break-before:page;page-break-before:always;min-height:15px;border-top:2px dashed #85a5c5;margin:15px 0}@media print{article [data-supra-page-break=true]{border:0;min-height:0;margin:0} } @media print{body{padding:0;background:#fff}article{padding:0;max-width:none;min-height:0}@page{size:'+settings.size+' '+settings.orientation+';margin:'+(getMargin()/96)+'in}}</style></head><body><article>'+sanitizeMarkup(doc.innerHTML)+'</article></body></html>';
 void download(serialized,filename('html'),'text/html;charset=utf-8');if(!window.SUPRADesktop)toast('HTML file saved');}
function exportText(){void download(doc.innerText,filename('txt'),'text/plain;charset=utf-8');if(!window.SUPRADesktop)toast('Text file saved');}
function exportMarkdown(){if(!window.SUPRAWriterUniversal){toast('Markdown module unavailable');return;}
 void download(window.SUPRAWriterUniversal.htmlToMarkdown(doc),filename('md'),'text/markdown;charset=utf-8');
 if(!window.SUPRADesktop)toast('Basic Markdown (.md) saved · complex formatting may simplify');
}
// ZIP writer: store-only ZIP archives, CRC32 and central directory. No third-party dependency.
const enc=new TextEncoder(); const dec=new TextDecoder();
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
function crc32(data){let c=0xffffffff;for(let i=0;i<data.length;i++)c=(c>>>8)^crcTable[(c^data[i])&255];return (c^0xffffffff)>>>0;}
function u16(a,pos,n){a[pos]=n&255;a[pos+1]=(n>>>8)&255;}function u32(a,pos,n){u16(a,pos,n);u16(a,pos+2,n>>>16);}
function joinBytes(parts){let len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len),offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}return out;}
function zipFiles(files){const locals=[],centers=[];let offset=0;for(const [name,content] of Object.entries(files)){const fn=enc.encode(name),data=typeof content==='string'?enc.encode(content):content,crc=crc32(data);const local=new Uint8Array(30+fn.length),central=new Uint8Array(46+fn.length);u32(local,0,0x04034b50);u16(local,4,20);u16(local,6,0x800);u16(local,8,0);u32(local,14,crc);u32(local,18,data.length);u32(local,22,data.length);u16(local,26,fn.length);local.set(fn,30);
 u32(central,0,0x02014b50);u16(central,4,20);u16(central,6,20);u16(central,8,0x800);u16(central,10,0);u32(central,16,crc);u32(central,20,data.length);u32(central,24,data.length);u16(central,28,fn.length);u32(central,42,offset);central.set(fn,46);locals.push(local,data);centers.push(central);offset+=local.length+data.length;}
 const center=joinBytes(centers),end=new Uint8Array(22);u32(end,0,0x06054b50);u16(end,8,centers.length);u16(end,10,centers.length);u32(end,12,center.length);u32(end,16,offset);return joinBytes([...locals,center,end]);}
// Read standard ZIP archives (store or deflate); never execute document content.
async function unzipFiles(blob){const bytes=new Uint8Array(await blob.arrayBuffer());const dv=new DataView(bytes.buffer);let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(dv.getUint32(i,true)===0x06054b50){end=i;break;}}if(end<0)throw Error('This file is not a valid DOCX/ZIP document');const count=dv.getUint16(end+10,true),centOffset=dv.getUint32(end+16,true);if(count>15000)throw Error('This document has too many ZIP entries');let p=centOffset;const result={};let total=0;
 for(let n=0;n<count;n++){if(p+46>bytes.length||dv.getUint32(p,true)!==0x02014b50)throw Error('The DOCX archive is damaged');const method=dv.getUint16(p+10,true),comp=dv.getUint32(p+20,true),uncomp=dv.getUint32(p+24,true),nameLen=dv.getUint16(p+28,true),extra=dv.getUint16(p+30,true),comment=dv.getUint16(p+32,true),local=dv.getUint32(p+42,true);const name=dec.decode(bytes.subarray(p+46,p+46+nameLen));p+=46+nameLen+extra+comment;
  if(!['word/document.xml','word/styles.xml','word/numbering.xml','word/_rels/document.xml.rels'].includes(name))continue;
  if(uncomp>20*1024*1024||(total+=uncomp)>40*1024*1024)throw Error('The document is too large to open safely');if(local+30>bytes.length||dv.getUint32(local,true)!==0x04034b50)throw Error('Invalid file contents');const fileStart=local+30+dv.getUint16(local+26,true)+dv.getUint16(local+28,true);const compressed=bytes.slice(fileStart,fileStart+comp);if(compressed.length!==comp)throw Error('File is truncated');
  if(method===0)result[name]=dec.decode(compressed);else if(method===8){if(!('DecompressionStream' in window))throw Error('This browser cannot decompress DOCX. Try a current Chrome or Edge browser.');let stream;try{stream=new DecompressionStream('deflate-raw');}catch(e){throw Error('This browser cannot open compressed DOCX files.');}const decompressed=await new Response(new Blob([compressed]).stream().pipeThrough(stream)).arrayBuffer();if(decompressed.byteLength>20*1024*1024)throw Error('The file is too large');result[name]=dec.decode(new Uint8Array(decompressed));}else throw Error('Unsupported compression method in DOCX');
 }return result;}
const XMLNS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const relNS='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function xmlText(s){return escapeXml(String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,''));}
function getFontName(){return settings.font.split(',')[0].replace(/["']/g,'').trim();}
function runProps(st){let p='';if(st.bold)p+='<w:b/>';if(st.italic)p+='<w:i/>';if(st.underline)p+='<w:u w:val="single"/>';if(st.strike)p+='<w:strike/>';if(st.sup)p+='<w:vertAlign w:val="superscript"/>';if(st.sub)p+='<w:vertAlign w:val="subscript"/>';if(st.color)p+='<w:color w:val="'+xmlText(st.color.replace('#',''))+'"/>';if(st.highlight&&/^#[0-9a-f]{6}$/i.test(st.highlight))p+='<w:shd w:fill="'+st.highlight.slice(1)+'"/>';if(st.size)p+='<w:sz w:val="'+Math.round(st.size*1.5)+'"/>';if(st.font)p+='<w:rFonts w:ascii="'+xmlText(st.font)+'" w:hAnsi="'+xmlText(st.font)+'"/>';return p?'<w:rPr>'+p+'</w:rPr>':'';}
function textRun(value,st){if(!value)return '';return '<w:r>'+runProps(st)+'<w:t xml:space="preserve">'+xmlText(value)+'</w:t></w:r>';}
function childStyle(node,base){const s={...base},tag=node.tagName;if(tag==='B'||tag==='STRONG')s.bold=true;if(tag==='I'||tag==='EM')s.italic=true;if(tag==='U')s.underline=true;if(tag==='S'||tag==='STRIKE'||tag==='DEL')s.strike=true;if(tag==='SUP')s.sup=true;if(tag==='SUB')s.sub=true;
 if(node.style){if(node.style.fontWeight && (node.style.fontWeight==='bold'||Number(node.style.fontWeight)>=600))s.bold=true;if(node.style.fontStyle==='italic')s.italic=true;if(node.style.textDecoration.includes('underline'))s.underline=true;if(node.style.textDecoration.includes('line-through'))s.strike=true;const color=node.style.color.match(/#[0-9a-f]{6}/i);if(color)s.color=color[0];const rgb=node.style.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(rgb)s.color='#'+[1,2,3].map(i=>Number(rgb[i]).toString(16).padStart(2,'0')).join('');const bg=node.style.backgroundColor.match(/#[0-9a-f]{6}/i);if(bg)s.highlight=bg[0];const size=parseFloat(node.style.fontSize);if(Number.isFinite(size)&&size>=8&&size<=96)s.size=size; if(node.style.fontFamily)s.font=node.style.fontFamily.split(',')[0].replace(/["']/g,'').trim();}
 if(tag==='FONT'){const c=node.getAttribute('color');if(c&&/^#[0-9a-f]{6}$/i.test(c))s.color=c;const face=node.getAttribute('face');if(face)s.font=face;}
 return s;}
function runContent(node,st,ctx){if(node.nodeType===3)return textRun(node.nodeValue,st);if(node.nodeType!==1)return '';if(node.tagName==='BR')return '<w:r><w:br/></w:r>';
 let inside=Array.from(node.childNodes).map(c=>runContent(c,childStyle(node,st),ctx)).join('');if(node.tagName==='A'){const target=safeUrl(node.getAttribute('href')||'');if(target){const id='rId'+(++ctx.nextRel);ctx.links.push({id,target});inside='<w:hyperlink r:id="'+id+'" w:history="1">'+inside+'</w:hyperlink>';}}return inside;}
function paragraphXml(node,ctx,numId){let style='',align='';const tag=node.tagName;if(/^H[1-4]$/.test(tag))style='Heading'+tag[1];if(tag==='BLOCKQUOTE')style='Quote';if(node.style&&node.style.textAlign)align=node.style.textAlign;if(node.getAttribute('align'))align=node.getAttribute('align');
 const pPr=[];if(style)pPr.push('<w:pStyle w:val="'+style+'"/>');if(align)pPr.push('<w:jc w:val="'+(align==='center'?'center':align==='right'?'right':align==='justify'?'both':'left')+'"/>');if(numId)pPr.push('<w:numPr><w:ilvl w:val="0"/><w:numId w:val="'+numId+'"/></w:numPr>');const pr=pPr.length?'<w:pPr>'+pPr.join('')+'</w:pPr>':'';
 const runs=Array.from(node.childNodes).map(c=>runContent(c,{},ctx)).join('');return '<w:p>'+pr+runs+'</w:p>';}
function tableXml(node,ctx){let rows=Array.from(node.querySelectorAll('tr'));let width=Math.max(1,...rows.map(row=>row.children.length));let t='<w:tbl><w:tblPr><w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(edge=>'<w:'+edge+' w:val="single" w:sz="4" w:color="B7C4D3"/>').join('')+'</w:tblBorders></w:tblPr><w:tblGrid>'+Array.from({length:width},()=>'<w:gridCol w:w="2000"/>').join('')+'</w:tblGrid>';
 for(const row of rows){t+='<w:tr>';for(const cell of row.children){if(!['TD','TH'].includes(cell.tagName))continue;let paragraph=paragraphXml(cell,ctx);t+='<w:tc><w:tcPr><w:tcW w:type="auto" w:w="0"/></w:tcPr>'+paragraph+'</w:tc>';}t+='</w:tr>';}return t+'</w:tbl>';}
function bodyXml(ctx){let out='';function visit(el){if(el.nodeType===3){if(el.nodeValue.trim())out+=paragraphXml({tagName:'P',style:{},getAttribute:()=>'',childNodes:[el]},ctx);return;}if(el.nodeType!==1)return;
 if(el.tagName==='DIV'&&el.getAttribute('data-supra-page-break')==='true'){out+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';return;}
  if(el.tagName==='TABLE'){out+=tableXml(el,ctx);return;}if(el.tagName==='UL'||el.tagName==='OL'){const num=el.tagName==='UL'?1:2;for(const child of el.children){if(child.tagName==='LI'){const clone=child.cloneNode(true);clone.querySelectorAll('ul,ol').forEach(n=>n.remove());out+=paragraphXml(clone,ctx,num);for(const sub of child.children){if(['UL','OL'].includes(sub.tagName))visit(sub);}}}return;}
 if(['P','DIV','H1','H2','H3','H4','BLOCKQUOTE','LI','TD','TH'].includes(el.tagName)){out+=paragraphXml(el,ctx);return;}if(el.tagName==='HR'){out+='<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8"/></w:pBdr></w:pPr></w:p>';return;}for(const child of el.childNodes)visit(child);}
 for(const child of doc.childNodes)visit(child);return out||'<w:p/>';}
function generateDocx(){const ctx={links:[],nextRel:1};const content=bodyXml(ctx);const paper=settings.size==='a4'?[11906,16838]:[12240,15840];const wide=settings.orientation==='landscape';const w=wide?paper[1]:paper[0],h=wide?paper[0]:paper[1];const margin=Math.round(getMargin()*15);const front='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
 const document=front+'<w:document xmlns:w="'+XMLNS+'" xmlns:r="'+relNS+'"><w:body>'+content+'<w:sectPr><w:pgSz w:w="'+w+'" w:h="'+h+'"'+(wide?' w:orient="landscape"':'')+'/><w:pgMar w:top="'+margin+'" w:right="'+margin+'" w:bottom="'+margin+'" w:left="'+margin+'" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>';
 const font=getFontName();const styles=front+'<w:styles xmlns:w="'+XMLNS+'"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="'+xmlText(font)+'" w:hAnsi="'+xmlText(font)+'"/>'+(settings.fontWeight>=600?'<w:b/>':'')+(settings.letterSpacing?'<w:spacing w:val="'+Math.round(settings.letterSpacing*15)+'"/>':'')+'<w:sz w:val="'+Math.round(settings.fontSize*1.5)+'"/><w:color w:val="'+settings.color.slice(1)+'"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:line="'+Math.round(settings.line*240)+'" w:after="'+Math.round(settings.paragraphSpace*settings.fontSize*15)+'" w:lineRule="auto"/><w:ind w:firstLine="'+Math.round(settings.firstIndent*15)+'"/><w:jc w:val="'+(settings.align==='justify'?'both':settings.align)+'"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'+[1,2,3,4].map(n=>'<w:style w:type="paragraph" w:styleId="Heading'+n+'"><w:name w:val="heading '+n+'"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="'+settings.headingColor.slice(1)+'"/><w:sz w:val="'+Math.round(settings.fontSize*1.5*[2,1.5,1.25,1.1][n-1])+'"/></w:rPr></w:style>').join('')+'<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:rPr><w:i/></w:rPr></w:style></w:styles>';
 const numbering=front+'<w:numbering xmlns:w="'+XMLNS+'"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>';
 const links=ctx.links.map(l=>'<Relationship Id="'+l.id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="'+xmlText(l.target)+'" TargetMode="External"/>').join('');
 const rels=front+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'+links+'</Relationships>';
 const contentTypes=front+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
 const rootRels=front+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
 const core=front+'<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>'+xmlText($('docName').value)+'</dc:title><dc:creator>SUPRA Writer</dc:creator></cp:coreProperties>';
 return zipFiles({'[Content_Types].xml':contentTypes,'_rels/.rels':rootRels,'docProps/core.xml':core,'word/document.xml':document,'word/styles.xml':styles,'word/numbering.xml':numbering,'word/_rels/document.xml.rels':rels});}
function exportDocx(){try{const file=generateDocx();void download(file,filename('docx'),'application/vnd.openxmlformats-officedocument.wordprocessingml.document');if(!window.SUPRADesktop)toast('Word (.docx) saved to your downloads');}catch(err){toast('Could not save DOCX: '+err.message);}}
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
function tagChildren(el,name){return el?Array.from(el.childNodes).filter(n=>n.nodeType===1&&n.localName===name):[];}
function firstChild(el,name){return tagChildren(el,name)[0]||null;}
function descendant(el,name){return el?el.getElementsByTagNameNS('*',name)[0]||null:null;}
function attr(el,name){return el?(el.getAttributeNS(W,name)||el.getAttribute('w:'+name)||el.getAttribute(name)||''):'';}
function markHtml(html,tag){return '<'+tag+'>'+html+'</'+tag+'>';}
function runToHtml(run){let text='';for(const node of run.childNodes){if(node.nodeType!==1)continue;if(node.localName==='t'||node.localName==='delText')text+=escapeXml(node.textContent);if(node.localName==='tab')text+='&emsp;';if(node.localName==='br'&&attr(node,'type')==='page')text+=PAGE_BREAK_TOKEN;else if(node.localName==='br'||node.localName==='cr')text+='<br>';}
 const rPr=firstChild(run,'rPr');if(!rPr)return text;
 if(firstChild(rPr,'b')&&attr(firstChild(rPr,'b'),'val')!=='0')text=markHtml(text,'strong');if(firstChild(rPr,'i')&&attr(firstChild(rPr,'i'),'val')!=='0')text=markHtml(text,'em');if(firstChild(rPr,'u'))text=markHtml(text,'u');if(firstChild(rPr,'strike'))text=markHtml(text,'s');
 const css=[];const color=attr(firstChild(rPr,'color'),'val');if(/^[0-9a-f]{6}$/i.test(color))css.push('color:#'+color);const sz=Number(attr(firstChild(rPr,'sz'),'val'));if(sz>=12&&sz<=200)css.push('font-size:'+Math.round(sz/1.5)+'px');const face=attr(firstChild(rPr,'rFonts'),'ascii')||attr(firstChild(rPr,'rFonts'),'hAnsi');if(face&&safeFontName(face))css.push('font-family:&quot;'+escapeXml(face)+'&quot;');const shade=attr(firstChild(rPr,'shd'),'fill');if(/^[0-9a-f]{6}$/i.test(shade))css.push('background-color:#'+shade);
 const vert=attr(firstChild(rPr,'vertAlign'),'val');if(vert==='superscript')text=markHtml(text,'sup');if(vert==='subscript')text=markHtml(text,'sub');if(css.length)text='<span style="'+css.join(';')+'">'+text+'</span>';return text;}
function paragraphToHtml(p,ctx,inCell=false){const pPr=firstChild(p,'pPr');let style=attr(firstChild(pPr,'pStyle'),'val').toLowerCase();let tag=style.startsWith('heading')?'h'+(style.match(/[1-4]/)?.[0]||'1'):style==='quote'?'blockquote':'p';
 const align=attr(firstChild(pPr,'jc'),'val');let styleAttr=align==='center'?' style="text-align:center"':align==='right'?' style="text-align:right"':align==='both'?' style="text-align:justify"':'';let content='';
 for(const child of p.childNodes){if(child.nodeType!==1)continue;if(child.localName==='r')content+=runToHtml(child);if(child.localName==='hyperlink'){const id=child.getAttributeNS(relNS,'id')||child.getAttribute('r:id');const href=ctx.relationships[id];const linked=tagChildren(child,'r').map(runToHtml).join('');content+=(href&&safeUrl(href))?'<a href="'+escapeXml(href)+'">'+linked+'</a>':linked;}}
 if(content.includes(PAGE_BREAK_TOKEN)){const sections=content.split(PAGE_BREAK_TOKEN);const combined=sections.map((part,i)=>(i?PAGE_BREAK_HTML:'')+(part?'<'+tag+styleAttr+'>'+part+'</'+tag+'>':'')).join('');return {listType:null,html:combined};}
 if(!content)content='<br>';const numPr=descendant(pPr,'numPr');if(numPr&&!inCell){const numId=attr(firstChild(numPr,'numId'),'val');const listType=ctx.listTypes[numId]||'ul';return {listType,html:'<li'+styleAttr+'>'+content+'</li>'};}
 return {listType:null,html:'<'+tag+styleAttr+'>'+content+'</'+tag+'>'};}
function readRelationships(xml){const map={};if(!xml)return map;const parsed=new DOMParser().parseFromString(xml,'application/xml');for(const rel of parsed.getElementsByTagNameNS('*','Relationship')){if((rel.getAttribute('Type')||'').endsWith('/hyperlink')&&(rel.getAttribute('TargetMode')||'')==='External')map[rel.getAttribute('Id')]=rel.getAttribute('Target');}return map;}
function readNumbering(xml){const types={},abs={};if(!xml)return types;const parsed=new DOMParser().parseFromString(xml,'application/xml');for(const a of parsed.getElementsByTagNameNS('*','abstractNum')){const id=attr(a,'abstractNumId'),fmt=attr(descendant(a,'numFmt'),'val');abs[id]=fmt==='bullet'?'ul':'ol';}for(const n of parsed.getElementsByTagNameNS('*','num')){const id=attr(n,'numId'),ref=attr(descendant(n,'abstractNumId'),'val');types[id]=abs[ref]||'ul';}return types;}
async function importDocx(blob){const zip=await unzipFiles(blob);if(!zip['word/document.xml'])throw Error('This DOCX has no document content');const parsed=new DOMParser().parseFromString(zip['word/document.xml'],'application/xml');if(parsed.querySelector('parsererror'))throw Error('The DOCX XML is invalid');const body=descendant(parsed,'body');if(!body)throw Error('Cannot read Word document body');const ctx={relationships:readRelationships(zip['word/_rels/document.xml.rels']),listTypes:readNumbering(zip['word/numbering.xml'])};
 let html='',pendingList=null;function closeList(){if(pendingList){html+='</'+pendingList+'>';pendingList=null;}}
 for(const node of body.childNodes){if(node.nodeType!==1)continue;if(node.localName==='p'){const out=paragraphToHtml(node,ctx);if(out.listType!==pendingList){closeList();if(out.listType){pendingList=out.listType;html+='<'+pendingList+'>';}}html+=out.html;}
 else if(node.localName==='tbl'){closeList();html+='<table>';for(const row of tagChildren(node,'tr')){html+='<tr>';for(const cell of tagChildren(row,'tc')){html+='<td>';for(const p of tagChildren(cell,'p'))html+=paragraphToHtml(p,ctx,true).html;html+='</td>';}html+='</tr>';}html+='</table>';}}
 closeList();loadHtml(html,blob.name.replace(/\.docx$/i,''));const pg=descendant(body,'pgSz'),mar=descendant(body,'pgMar');if(pg){const w=Number(attr(pg,'w')),h=Number(attr(pg,'h'));settings.orientation=w>h?'landscape':'portrait';settings.size=Math.min(w,h)>12000?'letter':Math.abs(Math.min(w,h)-11906)<200?'a4':'letter';}
 if(mar){const v=Number(attr(mar,'left'))/15;settings.margin=v<60?'narrow':v>104?'wide':'normal';}
 updatePreview();store();toast('Word document opened · complex layouts may be simplified');}
async function openFile(file){if(!file)return;const name=file.name.replace(/\.[^.]+$/,'');const ext=file.name.split('.').pop().toLowerCase();try{if(file.size>25*1024*1024)throw Error('Please use a file smaller than 25 MB');if(ext==='docx')await importDocx(file);else if(['html','htm'].includes(ext)){const raw=await file.text();const parser=new DOMParser().parseFromString(raw,'text/html');loadHtml(parser.body.innerHTML,name);toast('HTML document opened');}else if(ext==='txt'){loadHtml(textToHtml(await file.text()),name);toast('Text document opened');}
 else if(ext==='md'||ext==='markdown'){if(!window.SUPRAWriterUniversal)throw Error('Markdown module unavailable');loadHtml(window.SUPRAWriterUniversal.markdownToHtml(await file.text()),name);toast('Basic Markdown document opened');}
 else throw Error('Supported: .docx, .html, .txt, .md, .markdown');}catch(err){toast('Open failed: '+err.message);}}
// Find and replace within individual text runs, preserving surrounding HTML formatting.
function showFindBar(replace=false){
 $('findBar').hidden=false;$('replaceText').parentElement.hidden=!replace;
 $('replaceNext').hidden=!replace;$('replaceAll').hidden=!replace;
 $('findText').focus();$('findText').select();
}
function findNextMatch(){
 const query=$('findText').value;
 if(!query){$('findStatus').textContent='Type the text to find';return null;}
 const walker=document.createTreeWalker(doc,NodeFilter.SHOW_TEXT);const nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 if(!nodes.length)return null;
 const selection=window.getSelection();let startNode=0,startOffset=0;
 if(selection&&selection.rangeCount){const range=selection.getRangeAt(0);const nodeIndex=nodes.indexOf(range.endContainer);if(nodeIndex>=0){startNode=nodeIndex;startOffset=range.endOffset;}}
 const needle=query.toLocaleLowerCase();
 for(let cycle=0;cycle<2;cycle++){
  for(let i=(cycle?0:startNode);i<nodes.length;i++){
   const node=nodes[i];const at=node.nodeValue.toLocaleLowerCase().indexOf(needle,cycle?0:(i===startNode?startOffset:0));
   if(at<0)continue;
   const range=document.createRange();range.setStart(node,at);range.setEnd(node,at+query.length);
   selection.removeAllRanges();selection.addRange(range);
   node.parentElement?.scrollIntoView({block:'nearest'});
   $('findStatus').textContent='Found match';return range;
  }
 }
 $('findStatus').textContent='No match found';return null;
}
function replaceSelected(){
 const query=$('findText').value,replacement=$('replaceText').value;
 if(!query)return;
 let range=null;const selection=window.getSelection();
 if(selection?.rangeCount && selection.toString().toLocaleLowerCase()===query.toLocaleLowerCase() && doc.contains(selection.anchorNode))range=selection.getRangeAt(0);
 if(!range)range=findNextMatch();if(!range)return;
 range.deleteContents();const node=document.createTextNode(replacement);range.insertNode(node);
 const after=document.createRange();after.setStartAfter(node);after.collapse(true);selection.removeAllRanges();selection.addRange(after);
 queueSave();$('findStatus').textContent='Replaced one match';
}
function replaceEveryMatch(){
 const query=$('findText').value;const replacement=$('replaceText').value;
 if(!query){$('findStatus').textContent='Enter text to find';return;}
 if(query.length>300)return;
 const walker=document.createTreeWalker(doc,NodeFilter.SHOW_TEXT);const nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 let count=0;for(const node of nodes){
  const source=node.nodeValue;const lower=source.toLocaleLowerCase(),needle=query.toLocaleLowerCase();let index=0,start=0,result='';
  while((index=lower.indexOf(needle,start))>=0){result+=source.slice(start,index)+replacement;start=index+query.length;count++;if(count>=10000)break;}
  if(start>0)node.nodeValue=result+source.slice(start);
  if(count>=10000)break;
 }
 queueSave();$('findStatus').textContent=count+' replacement'+(count===1?'':'s')+' made';
}
function wireFind(){
 $('showFind').addEventListener('click',()=>showFindBar(false));
 $('findNext').addEventListener('click',findNextMatch);
 $('replaceNext').addEventListener('click',replaceSelected);
 $('replaceAll').addEventListener('click',replaceEveryMatch);
 $('closeFind').addEventListener('click',()=>{$('findBar').hidden=true;doc.focus();});
 $('findText').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();findNextMatch();}});
}
async function openFromWindows(){try{const item=await window.SUPRADesktop.openDocument();if(item)await openFile(new File([new Uint8Array(item.bytes)],item.name));}catch(e){toast('Open failed: '+e.message);}}
function wireWindowsHost(){
 if(!window.SUPRADesktop)return;
 document.documentElement.classList.add('supra-desktop');
 const sub=document.querySelector('.brand small');if(sub)sub.textContent='Windows Desktop · v0.3';
 window.SUPRADesktop.onCommand(command=>{
  if(command==='new')beginNew();else if(command==='open')void openFromWindows();
  else if(command==='save')exportDocx();else if(command==='saveAs'){forceDesktopSaveAs=true;exportDocx();}
  else if(command==='pdf')void window.SUPRADesktop.exportPdf().then(r=>{if(r.saved)toast('PDF saved: '+r.fileName);}).catch(e=>toast('PDF export failed: '+e.message));
  else if(command==='print')printDocument();else if(command==='find')showFindBar(false);else if(command==='replace')showFindBar(true);else if(command==='help')$('modal').hidden=false;
 });
 window.SUPRADesktop.onFileOpen(item=>{void openFile(new File([new Uint8Array(item.bytes)],item.name));});
}
function printDocument(){const old=document.title;document.title=$('docName').value||'SUPRA Writer';window.print();setTimeout(()=>document.title=old,1000);}
function beginNew(){if(doc.innerText.trim()&&!confirm('Start a new document? Your current browser copy will be replaced. Save a file first if you want to keep it.'))return;rememberLook();settings={...defaults};doc.innerHTML='<p><br></p>';$('docName').value='Untitled';savedRange=null;updatePreview();store();doc.focus();toast('New document ready');if(window.SUPRADesktop)void window.SUPRADesktop.resetDocument();}
function addTable(){const rowInput=prompt('How many rows? (1–12)','3');if(rowInput===null)return;const rows=Math.max(1,Math.min(12,Number(rowInput)||3));const colInput=prompt('How many columns? (1–8)','3');if(colInput===null)return;const cols=Math.max(1,Math.min(8,Number(colInput)||3));let h='<table><tbody>';for(let i=0;i<rows;i++){h+='<tr>';for(let j=0;j<cols;j++)h+='<td> </td>';h+='</tr>';}h+='</tbody></table><p><br></p>';insertHtml(h);toast(rows+' × '+cols+' table added');}
function addLink(){let selected=window.getSelection()?.toString()||'';const raw=prompt('Where should this link go? Enter a website address starting with https://','https://');if(raw===null)return;const url=safeUrl(raw);if(!url){toast('Use a valid http://, https:// or mailto: link');return;}restoreSelection();if(selected){command('createLink',url);}else insertHtml('<a href="'+escapeXml(url)+'">'+escapeXml(url)+'</a>');}
function loadPrevious(){try{const raw=localStorage.getItem('supra-writer-v02')||localStorage.getItem('supra-writer-v01');if(!raw)return;const item=JSON.parse(raw);if(item.html)doc.innerHTML=sanitizeMarkup(item.html);if(item.name)$('docName').value=item.name;if(item.settings)settings={...defaults,...item.settings};lastSavedDocumentSize=doc.innerHTML.length;status('Restored from this browser');}catch(err){status('Ready');}}
function wire(){
 renderAdvancedCards();
 $('fontSearch').addEventListener('input',fillFontList);$('fontCategory').addEventListener('change',fillFontList);
 $('findPapyrusBtn').addEventListener('click',()=>{
  showTab('text');$('fontCategory').value='display';$('fontSearch').value='Papyrus';fillFontList();$('fontSelect').focus();
 });
 $('fontSizeNumber').addEventListener('change',e=>setSetting('fontSize',Math.max(8,Math.min(144,Number(e.target.value)||15))));
 $('applyFontManual').addEventListener('click',()=>{const name=safeFontName($('fontManual').value);if(!name){toast('Use a font name with 1–90 characters.');return;}addFontToCatalog(name);setSetting('font',fontCss(name,'personal'));toast('Font name selected. It must be installed to appear as expected.');});
 $('addFontBtn').addEventListener('click',()=>$('fontFile').click());$('fontFile').addEventListener('change',async e=>{try{await loadFontFile(e.target.files[0]);}catch(err){toast(err.message);}e.target.value='';});
 $('scanFontsBtn')?.addEventListener('click',findLocalFonts);
 for(const [id,key,cast] of [['letterSpacing','letterSpacing',Number],['wordSpacing','wordSpacing',Number],['fontWeight','fontWeight',Number],['lineAdvanced','line',Number],['paragraphSpace','paragraphSpace',Number],['firstIndent','firstIndent',Number],['customMargin','marginCustom',Number],['headingColor','headingColor',String],['textAlignGlobal','align',String]]){$(id).addEventListener(['fontWeight','headingColor','textAlignGlobal'].includes(id)?'change':'input',e=>{if(id==='customMargin')settings.margin='custom';setSetting(key,cast(e.target.value));});}
 $('applyAdvanced').addEventListener('click',()=>{const id=$('advancedPreset').value;if(!id||!advancedPresets[id]){toast('Choose a look first.');return;}applySettings(advancedPresets[id],$('advancedPreset').selectedOptions[0].textContent);});
 $('resetLooks').addEventListener('click',()=>applySettings(defaults,'Default'));
 $('saveLookQuick').addEventListener('click',saveCurrentLook);$('saveLookAdvanced').addEventListener('click',saveCurrentLook);
 $('revertLookQuick').addEventListener('click',()=>{if(!lastLook){toast('No previous look to restore yet.');return;}const back=lastLook;lastLook={...settings};settings={...back};updatePreview();queueSave();toast('Previous look restored');});
 $('insertIrony').addEventListener('mousedown',e=>e.preventDefault());$('insertIrony').addEventListener('click',()=>insertSymbol('⸮'));
 const grid=$('symbolsGrid');for(const [character,title] of symbolSet){const b=document.createElement('button');b.textContent=character;b.title=title;b.setAttribute('aria-label',title);b.addEventListener('click',()=>{insertSymbol(character);$('symbolsModal').hidden=true;});grid.append(b);}
 $('symbolsBtn').addEventListener('mousedown',e=>e.preventDefault());$('symbolsBtn').addEventListener('click',()=>{$('symbolsModal').hidden=false;});$('closeSymbols').addEventListener('click',()=>{$('symbolsModal').hidden=true;});$('symbolsModal').addEventListener('click',e=>{if(e.target.id==='symbolsModal')$('symbolsModal').hidden=true;});
 document.querySelectorAll('.side-tab').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
 document.querySelectorAll('.preset').forEach(b=>b.addEventListener('click',()=>activatePreset(b.dataset.preset)));
 $('fontSelect').addEventListener('change',e=>setSetting('font',e.target.value));$('fontSize').addEventListener('input',e=>setSetting('fontSize',Number(e.target.value)));
 document.querySelectorAll('[data-line]').forEach(b=>b.addEventListener('click',()=>setSetting('line',Number(b.dataset.line))));
 document.querySelectorAll('[data-margin]').forEach(b=>b.addEventListener('click',()=>setSetting('margin',b.dataset.margin)));
 document.querySelectorAll('[data-color]').forEach(b=>b.addEventListener('click',()=>setSetting('color',b.dataset.color)));
 $('textColor').addEventListener('input',e=>setSetting('color',e.target.value));$('paperSize').addEventListener('change',e=>setSetting('size',e.target.value));
 document.querySelectorAll('[data-paper]').forEach(b=>b.addEventListener('click',()=>setSetting('paper',b.dataset.paper)));
 $('portraitBtn').addEventListener('click',()=>setSetting('orientation','portrait'));$('landscapeBtn').addEventListener('click',()=>setSetting('orientation','landscape'));
 $('zoomIn').addEventListener('click',()=>setSetting('zoom',Math.min(150,settings.zoom+10)));$('zoomOut').addEventListener('click',()=>setSetting('zoom',Math.max(60,settings.zoom-10)));
 document.querySelectorAll('[data-cmd]').forEach(b=>{b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>command(b.dataset.cmd));});
 $('blockStyle').addEventListener('change',e=>{command('formatBlock','<'+e.target.value+'>');doc.focus();});
 $('addLink').addEventListener('mousedown',e=>e.preventDefault());$('addLink').addEventListener('click',addLink);
 $('addTable').addEventListener('mousedown',e=>e.preventDefault());$('addTable').addEventListener('click',addTable);
 $('addPageBreak').addEventListener('mousedown',e=>e.preventDefault());$('addPageBreak').addEventListener('click',addPageBreak);
 $('undoBtn').addEventListener('click',()=>command('undo'));$('redoBtn').addEventListener('click',()=>command('redo'));$('saveNowBtn').addEventListener('click',()=>{if(store())toast('Saved to this device');else toast('Local save failed — use Save file');});
 $('docName').addEventListener('input',queueSave);doc.addEventListener('input',queueSave);doc.addEventListener('keyup',saveSelection);doc.addEventListener('mouseup',saveSelection);doc.addEventListener('focusout',saveSelection);
 doc.addEventListener('focusout',flushAutosave);
 $('docName').addEventListener('blur',flushAutosave);
 doc.addEventListener('paste',e=>{const html=e.clipboardData?.getData('text/html');const txt=e.clipboardData?.getData('text/plain');if(html||txt){e.preventDefault();insertHtml(html?html:textToHtml(txt));}});
 $('saveMenuBtn').addEventListener('click',()=>{let open=$('saveMenu').hidden;$('saveMenu').hidden=!open;$('saveMenuBtn').setAttribute('aria-expanded',open?'true':'false');});
 document.querySelectorAll('[data-export]').forEach(b=>b.addEventListener('click',()=>{const type=b.dataset.export;$('saveMenu').hidden=true;$('saveMenuBtn').setAttribute('aria-expanded','false');if(type==='docx')exportDocx();if(type==='html')exportHtml();if(type==='txt')exportText();if(type==='md')exportMarkdown();}));
 document.addEventListener('click',e=>{if(!e.target.closest('.dropdown-wrap')){$('saveMenu').hidden=true;$('saveMenuBtn').setAttribute('aria-expanded','false');}});
 $('newBtn').addEventListener('click',beginNew);$('openBtn').addEventListener('click',()=>{if(window.SUPRADesktop)void openFromWindows();else $('openFile').click();});$('openFile').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';await openFile(file);});$('printBtn').addEventListener('click',printDocument);
 $('helpBtn').addEventListener('click',()=>$('modal').hidden=false);$('closeModal').addEventListener('click',()=>$('modal').hidden=true);$('modal').addEventListener('click',e=>{if(e.target.id==='modal')$('modal').hidden=true;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('modal').hidden=true;$('symbolsModal').hidden=true;$('findBar').hidden=true;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){e.preventDefault();showFindBar(false);}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='h'){e.preventDefault();showFindBar(true);}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();addPageBreak();return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(e.shiftKey)forceDesktopSaveAs=true;exportDocx();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='p'){e.preventDefault();printDocument();}});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushAutosave();});
 window.addEventListener('pagehide',flushAutosave);
 window.addEventListener('beforeunload',flushAutosave);
 window.addEventListener('resize',updatePreview);
}
wire();wireFind();wireWindowsHost();loadSavedLooks();loadPrevious();updatePreview();updateCounts();
// Expose a small API solely for repeatable local QA checks.
window.SUPRAWriterTest={generateDocx,zipFiles,unzipFiles,importDocx,settings:()=>({...settings}),wordCount:()=>Number(($('wordCount').textContent||'').split(' ')[0]),readHtml:()=>doc.innerHTML, fontCount:()=>fontItems.length, symbols:()=>symbolSet.map(s=>s[0]), applyAdvanced:(id)=>applySettings(advancedPresets[id],id), importFont:loadFontFile, customLooks:()=>customLooks,addPageBreak,restoreSnapshot:(entry)=>{
 if(!entry||typeof entry.html!=='string'||entry.html.length>1200000)return false;
 if(entry.settings&&typeof entry.settings==='object')settings={...defaults,...entry.settings};
 updatePreview();loadHtml(entry.html,typeof entry.name==='string'?entry.name:'Recovered');return true;
},autosave:()=>({idleMs:autosaveIdleDelay(),smallMs:AUTOSAVE_IDLE_MS,mediumMs:AUTOSAVE_MEDIUM_MS,largeMs:AUTOSAVE_LARGE_MS,minGapMs:AUTOSAVE_MIN_GAP_MS,maxMs:AUTOSAVE_MAX_MS,pending:unsavedChanges}),flushAutosave};
})();
