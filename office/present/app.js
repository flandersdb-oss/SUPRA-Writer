/* SUPRA Present v0.1 — local-only slides with offline export. MIT. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='supra-present-v01',THEMES=['classic','dark','modern','lecture'],MAX=50;
const copy=x=>JSON.parse(JSON.stringify(x));
const slide=(title='',subtitle='',bullets=[])=>({title,subtitle,bullets});
const blank=()=>({name:'My presentation',theme:'classic',slides:[slide()]});
const recipes={
 pitch:{name:'Project proposal',theme:'dark',steps:['Create an opening slide explaining your project','Add a problem and opportunity slide','Add a clear solution and next-steps slide','Apply the futuristic navy and gold visual theme'],slides:[
 slide('A better way to work','Project proposal',['What we want to improve','Why the change matters']),
 slide('The opportunity','Start with a clear problem',['Current challenge','Who it affects','What success could look like']),
 slide('The proposed approach','Simple next steps',['Build a small prototype','Verify the most important requirements','Measure results and improve'])]},
 lesson:{name:'Teaching lesson',theme:'lecture',steps:['Create a clear learning goal','Build a three-point explanation','Add a recap and practice slide','Apply a classroom-friendly theme'],slides:[
 slide('Today’s learning goal','What we will understand',['Name the topic','Connect it to what we already know']),
 slide('Three key ideas','Work through each one',['Idea one: definition','Idea two: example','Idea three: application']),
 slide('Review and practice','Check understanding',['Summarize the topic in your own words','Try one example','Ask one question'])]},
 report:{name:'Progress report',theme:'modern',steps:['Start with the latest project status','Add concrete achievements and evidence','Highlight priorities and obstacles','Apply a restrained teal professional look'],slides:[
 slide('Project status','A concise progress review',['Current milestone','What has changed since the last update']),
 slide('Evidence of progress','Show meaningful measurements',['Completed tasks','Tests or milestones passed','Quality improvements']),
 slide('What comes next','Priorities and risks',['Most important next action','Known blocker','How progress will be verified'])]},
 blank:{name:'Blank presentation',theme:'classic',steps:['Create one editable slide','Apply a minimal white-and-gold style','Leave all title and content fields editable'],slides:[slide()]},
};
const state={deck:blank(),current:0,chosen:'pitch',previous:null};
const feedback=s=>{$('feedback').textContent=s;};
function cleanSlide(s){
 if(!s||typeof s!=='object')throw Error('Invalid slide');
 const title=String(s.title||'').slice(0,140),subtitle=String(s.subtitle||'').slice(0,220);
 if(!Array.isArray(s.bullets)||s.bullets.length>30)throw Error('Too many points');
 return slide(title,subtitle,s.bullets.map(x=>String(x).slice(0,200)));
}
function validate(o){
 if(!o||!Array.isArray(o.slides)||o.slides.length<1||o.slides.length>MAX||!THEMES.includes(o.theme))throw Error('Invalid deck format');
 return {name:String(o.name||'My presentation').slice(0,90),theme:o.theme,slides:o.slides.map(cleanSlide)};
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(state.deck));$('saveStatus').textContent='Saved locally';}
 catch{$('saveStatus').textContent='Storage unavailable — export backup';}
}
function isUntouched(){const d=state.deck;return d.slides.length===1&&!d.slides[0].title&&!d.slides[0].subtitle&&!d.slides[0].bullets.join('');}
function renderRecipe(){
 const p=recipes[state.chosen];$('workflowTitle').textContent=p.name;$('presetSlides').textContent=p.slides.length;$('presetSteps').textContent=p.steps.length;$('presetThemes').textContent='1';
 const steps=$('workflowSteps');steps.replaceChildren();for(const text of p.steps){const li=document.createElement('li');li.textContent=text;steps.append(li);}
 document.querySelectorAll('[data-recipe]').forEach(b=>{const active=b.dataset.recipe===state.chosen;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
function applyRecipe(){
 const p=recipes[state.chosen];if(!isUntouched()&&!confirm('Replace the current presentation with '+p.name+'? You can Undo deck.'))return false;
 state.previous=copy(state.deck);state.deck={name:p.name,theme:p.theme,slides:copy(p.slides)};state.current=0;$('undo').disabled=false;render();save();feedback(p.name+' applied: '+p.slides.length+' slides prepared in one action.');return true;
}
function undo(){if(!state.previous)return;state.deck=state.previous;state.previous=null;state.current=0;$('undo').disabled=true;render();save();feedback('Previous presentation restored.');}
function select(i){if(i<0||i>=state.deck.slides.length)return;state.current=i;render();}
function render(){
 const d=state.deck,s=d.slides[state.current],p=$('slidePreview');p.className='slide '+(d.theme==='classic'?'':d.theme);
 $('deckName').value=d.name;$('theme').value=d.theme;
 $('previewTitle').textContent=s.title||'Your slide title';$('previewSubtitle').textContent=s.subtitle;
 const list=$('previewBullets');list.replaceChildren();s.bullets.filter(Boolean).forEach(text=>{const li=document.createElement('li');li.textContent=text;list.append(li);});
 const sl=$('slideList');sl.replaceChildren();d.slides.forEach((x,i)=>{const b=document.createElement('button');b.type='button';b.className='slide-tab'+(i===state.current?' active':'');b.setAttribute('role','tab');b.setAttribute('aria-selected',String(i===state.current));b.textContent=(i+1)+'. '+(x.title||'Untitled slide').slice(0,20);const small=document.createElement('small');small.textContent=(x.bullets.length)+' points';b.append(small);b.addEventListener('click',()=>select(i));sl.append(b);});
 $('slideTitle').value=s.title;$('slideSubtitle').value=s.subtitle;$('slideBullets').value=s.bullets.join('\n');
 $('movePrev').disabled=state.current===0;$('moveNext').disabled=state.current===d.slides.length-1;$('removeSlide').disabled=d.slides.length<2;
}
function changed(){const s=state.deck.slides[state.current];s.title=$('slideTitle').value.slice(0,140);s.subtitle=$('slideSubtitle').value.slice(0,220);s.bullets=$('slideBullets').value.split(/\r?\n/).slice(0,30).map(x=>x.slice(0,200));render();save();}
function add(){if(state.deck.slides.length>=MAX){feedback('Maximum 50 slides');return;}state.deck.slides.splice(state.current+1,0,slide());state.current++;render();save();}
function duplicate(){if(state.deck.slides.length>=MAX){feedback('Maximum 50 slides');return;}state.deck.slides.splice(state.current+1,0,copy(state.deck.slides[state.current]));state.current++;render();save();}
function move(delta){const i=state.current,j=i+delta;if(j<0||j>=state.deck.slides.length)return;[state.deck.slides[i],state.deck.slides[j]]=[state.deck.slides[j],state.deck.slides[i]];state.current=j;render();save();}
function remove(){if(state.deck.slides.length===1)return;if(!confirm('Remove this slide?'))return;state.deck.slides.splice(state.current,1);state.current=Math.min(state.current,state.deck.slides.length-1);render();save();}
function safeName(){return(state.deck.name||'SUPRA Present').replace(/[\\/:*?"<>|]/g,'-').slice(0,90);}
function download(text,name,mime){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},1000);}
function exportJson(){download(JSON.stringify({type:'SUPRA-PRESENT-v0.1',...state.deck},null,2),safeName()+'.supra-present.json','application/json');feedback('Editable project backup saved.');}
function offlineHtml(){
 // JSON is used as *data*, not HTML; escaping "<" prevents user content from injecting scripts into exported HTML.
 const encoded=JSON.stringify(state.deck).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 const css='*{box-sizing:border-box}body{margin:0;background:#08182c;color:#fff;font-family:Segoe UI,Arial,sans-serif}main{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;padding:4vw}.slide{aspect-ratio:16/9;width:100%;max-height:90vh;padding:7%;display:flex;flex-direction:column;justify-content:center;overflow:auto;background:white;color:#1d2c3c;border-top:14px solid #c6a05f}.slide.dark{background:linear-gradient(125deg,#0f253e,#17516a);color:#fff}.slide.modern{border-top:0;border-left:15px solid #1388a4}.slide.lecture{border-top:0;border-bottom:13px solid #3970b1}.slide h1{font-size:clamp(24px,4vw,63px);margin:0 0 15px}.slide p{font-size:clamp(16px,2vw,33px)}.slide li{font-size:clamp(16px,2vw,31px);margin:12px}nav{position:fixed;bottom:8px;right:12px;background:#08192bc9;border-radius:8px;padding:8px;display:flex;gap:5px}nav button{padding:8px 13px;font-size:15px}nav span{padding:8px}button:focus-visible{outline:3px solid gold}@media print{nav{display:none}main{padding:0;break-after:page}.slide{height:100vh;max-height:none}}';
 const script='const d='+encoded+';let i=0;function show(){const s=d.slides[i],h=document.querySelector("h1"),p=document.querySelector("p"),ul=document.querySelector("ul"),slide=document.querySelector(".slide");slide.className="slide "+d.theme;h.textContent=s.title;p.textContent=s.subtitle;ul.replaceChildren();s.bullets.forEach(x=>{if(x){const li=document.createElement("li");li.textContent=x;ul.append(li);}});document.querySelector("#counter").textContent=(i+1)+" / "+d.slides.length;}function move(n){i=Math.max(0,Math.min(d.slides.length-1,i+n));show();}document.querySelector("#prev").addEventListener("click",()=>move(-1));document.querySelector("#next").addEventListener("click",()=>move(1));document.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="PageDown"||e.key===" "){e.preventDefault();move(1)}if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();move(-1)}});show();';
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+safeName().replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</title><style>'+css+'</style></head><body><main><article class="slide"><h1></h1><p></p><ul></ul></article></main><nav aria-label="Slide navigation"><button id="prev">← Back</button><span id="counter"></span><button id="next">Next →</button></nav><script>'+script+'</scr'+'ipt></body></html>';
}
function exportHtml(){download(offlineHtml(),safeName()+'.html','text/html');feedback('Offline slideshow downloaded (arrow-key navigation).');}
async function loadProject(file){
 if(!file||file.size>1024*1024)throw Error('File missing or larger than 1 MB');
 const obj=JSON.parse(await file.text());if(obj.type!=='SUPRA-PRESENT-v0.1')throw Error('Not a SUPRA Present project');
 const d=validate(obj);if(!isUntouched()&&!confirm('Replace the current presentation?'))return false;
 state.previous=copy(state.deck);state.deck=d;state.current=0;$('undo').disabled=false;render();save();feedback('Presentation restored from local project backup.');return true;
}
for(const b of document.querySelectorAll('[data-recipe]'))b.addEventListener('click',()=>{state.chosen=b.dataset.recipe;renderRecipe();});
$('applyRecipe').addEventListener('click',applyRecipe);$('undo').addEventListener('click',undo);
$('deckName').addEventListener('change',()=>{state.deck.name=$('deckName').value.slice(0,90);save();});
$('theme').addEventListener('change',()=>{state.deck.theme=$('theme').value;render();save();});
for(const id of ['slideTitle','slideSubtitle','slideBullets'])$(id).addEventListener('change',changed);
$('newSlide').addEventListener('click',add);$('duplicate').addEventListener('click',duplicate);$('movePrev').addEventListener('click',()=>move(-1));$('moveNext').addEventListener('click',()=>move(1));$('removeSlide').addEventListener('click',remove);
$('exportJson').addEventListener('click',exportJson);$('exportHtml').addEventListener('click',exportHtml);$('importJson').addEventListener('click',()=>$('deckPicker').click());
$('deckPicker').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(file)try{await loadProject(file);}catch(err){feedback('Restore failed: '+err.message);}});
try{const stored=localStorage.getItem(KEY);if(stored)state.deck=validate(JSON.parse(stored));}catch{feedback('Saved deck was not readable; started a sample deck.');}
renderRecipe();render();save();
window.SUPRAPresentTest=Object.freeze({apply:(id)=>{state.chosen=id;renderRecipe();return applyRecipe();},getSlides:()=>copy(state.deck.slides),getTheme:()=>state.deck.theme,offlineHtml,select,validate});
})();