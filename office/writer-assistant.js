/* SUPRA Writer Visual Setup — MIT. All actions are local existing editor controls. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const goals=[
 {id:'letter',title:'Professional letter',icon:'✉',desc:'Balanced, formal correspondence',changes:['Font family','Font size','Line spacing','Paragraph spacing','Margins','Paper and ink','Page direction']},
 {id:'academic',title:'Academic paper',icon:'▤',desc:'Double-spaced research document',changes:['Serif font','Font size','Double line spacing','First-line indent','Page margins','Paper size','Page direction']},
 {id:'read',title:'Comfortable reading',icon:'◉',desc:'More space and larger letter shapes',changes:['Readable font','Font size','Line spacing','Word spacing','Letter spacing','Wider margins','Paper color']},
 {id:'print',title:'Print-friendly document',icon:'▣',desc:'Plain white paper, clear black text',changes:['Readable font','Font size','Paper color','Ink color','Line spacing','Margins','Page direction']},
 {id:'compact',title:'Fit more text',icon:'⇤',desc:'Tighter style for shorter documents',changes:['Compact font','Font size','Line spacing','Paragraph spacing','Letter spacing','Margins','Page direction']},
 {id:'manuscript',title:'Book manuscript',icon:'✎',desc:'Double-spaced draft for authors',changes:['Monospace font','Font size','Double line spacing','Indent','Margins','Paper and ink','Page direction']}
];
const state={goal:'letter'},launch=$('visualSetupBtn');if(!launch)return;
const modal=document.createElement('div');modal.className='supra-outcome-backdrop';modal.id='visualSetupModal';modal.hidden=true;
modal.innerHTML='<div class="supra-outcome-dialog" role="dialog" aria-modal="true" aria-labelledby="supraOutcomeTitle"><div class="supra-outcome-title"><div><h2 id="supraOutcomeTitle">✦ Build my document look</h2><p>Choose your result, change up to four preferences, then apply all settings together.</p></div><button class="supra-outcome-close" id="visualSetupClose" type="button" aria-label="Close visual setup">×</button></div><div class="supra-outcome-columns"><section><h3>1 · What are you making?</h3><div class="supra-outcome-options" id="visualSetupGoals" role="group" aria-label="Document goal"></div></section><section><h3>2 · Personalize the result</h3><div class="supra-outcome-choice"><label>Paper<select id="visualPaper"><option value="letter">US Letter</option><option value="a4">A4</option></select></label><label>Page direction<select id="visualDirection"><option value="portrait">Tall / portrait</option><option value="landscape">Wide / landscape</option></select></label><label>Text size<select id="visualText"><option value="preset">Recommended</option><option value="large">Bigger letters</option><option value="small">Smaller letters</option></select></label><label>Line spacing<select id="visualSpacing"><option value="preset">Recommended</option><option value="roomy">More room</option><option value="compact">Less room</option></select></label></div><div class="supra-outcome-preview"><h3 style="margin:0 0 5px">3 · Preview the settings</h3><p id="visualSummary"></p><ul class="supra-outcome-list" id="visualChanges"></ul><p id="visualCount" style="font-weight:800"></p></div></section></div><div class="supra-outcome-actions"><span class="supra-outcome-status" id="visualStatus" role="status" aria-live="polite"></span><button class="supra-outcome-secondary" id="visualAdvanced" type="button">⚙ All settings</button><button class="supra-outcome-secondary" id="visualCancel" type="button">Cancel</button><button class="supra-outcome-action" id="visualApply" type="button">Apply all settings</button></div></div>';
document.body.append(modal);
for(const g of goals){
 const b=document.createElement('button');b.type='button';b.className='supra-outcome-option';b.dataset.goal=g.id;
 const icon=document.createElement('span');icon.textContent=g.icon;icon.style.fontSize='22px';icon.setAttribute('aria-hidden','true');
 const desc=document.createElement('span'),title=document.createElement('strong'),small=document.createElement('small');title.textContent=g.title;small.textContent=g.desc;desc.append(title,small);b.append(icon,desc);
 b.addEventListener('click',()=>{state.goal=g.id;update();});$('visualSetupGoals').append(b);
}
function update(){
 const g=goals.find(x=>x.id===state.goal);
 for(const b of $('visualSetupGoals').children)b.setAttribute('aria-pressed',String(b.dataset.goal===state.goal));
 $('visualSummary').textContent=g.desc+'. These controls will be configured together:';
 const ul=$('visualChanges');ul.replaceChildren();
 const names=new Set([...g.changes,'Paper size','Page direction']);
 if($('visualText').value!=='preset')names.add('Text size override');
 if($('visualSpacing').value!=='preset')names.add('Line spacing override');
 for(const name of names){const li=document.createElement('li');li.textContent='✓ '+name;ul.append(li);}
 $('visualCount').textContent=names.size+' settings/choices are bundled into one Apply action.';
}
function setValue(id,value,type='change'){const x=$(id);if(!x)throw Error('Missing control '+id);x.value=value;x.dispatchEvent(new Event(type,{bubbles:true}));}
function apply(){
 if(!window.SUPRAQuickActions?.run){$('visualStatus').textContent='Quick Actions loading. Try again.';return false;}
 if(!window.SUPRAQuickActions.run(state.goal))return false;
 setValue('paperSize',$('visualPaper').value);
 $(''+($('visualDirection').value==='landscape'?'landscapeBtn':'portraitBtn')).click();
 const base=window.SUPRAWriterTest?.settings?.()?.fontSize||16;
 if($('visualText').value!=='preset'){const n=$('visualText').value==='large'?Math.min(40,Math.round(base*1.2)):Math.max(8,Math.round(base*.85));setValue('fontSizeNumber',String(n));}
 if($('visualSpacing').value!=='preset')setValue('lineAdvanced',$('visualSpacing').value==='roomy'?'1.95':'1.35','input');
 modal.hidden=true;launch.focus();return true;
}
function open(){modal.hidden=false;update();$('visualSetupGoals').querySelector('[aria-pressed=true]')?.focus();}
function close(){modal.hidden=true;launch.focus();}
$('visualSetupClose').addEventListener('click',close);$('visualCancel').addEventListener('click',close);$('visualAdvanced').addEventListener('click',()=>{close();document.querySelector('[data-tab="advanced"]')?.click();});$('visualApply').addEventListener('click',apply);launch.addEventListener('click',open);
modal.addEventListener('click',e=>{if(e.target===modal)close();});
for(const id of ['visualPaper','visualDirection','visualText','visualSpacing'])$(id).addEventListener('change',update);
modal.addEventListener('keydown',e=>{
 if(e.key==='Escape'){e.preventDefault();close();}
 if(e.key==='Tab'){
  const items=[...modal.querySelectorAll('button,select')].filter(x=>!x.disabled&&x.getBoundingClientRect().width>0),first=items[0],last=items[items.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
window.SUPRAWriterVisualTest=Object.freeze({open,apply,choose:id=>{if(!goals.some(g=>g.id===id))return false;state.goal=id;update();return true;},getGoal:()=>state.goal,settings:()=>window.SUPRAWriterTest?.settings?.()});
update();
})();