/* SUPRA Writer Windows local document discovery UI — MIT */
(()=>{'use strict';
const api=window.SUPRADesktop;if(!api||!api.catalogStatus)return;
const $=id=>document.getElementById(id);
let items=[],approved=false,loading=false,filter='all';
const styles=document.createElement('style');
styles.textContent='.supra-catalog[hidden]{display:none!important}.supra-catalog{position:fixed;inset:0;z-index:21000;background:#10243cd9;display:flex;justify-content:center;align-items:flex-start;padding:6vh 12px}.supra-catalog>section{width:min(790px,100%);max-height:88vh;overflow:auto;background:white;color:#153450;border-radius:13px;padding:18px}.supra-catalog h2{font-size:21px;margin:0}.supra-catalog p{font-size:13px}.supra-catalog button{padding:9px;border-radius:7px;border:1px solid #9ab6d2;background:#e9f3fd;color:#24517a;font-weight:700}.supra-catalog button:disabled{opacity:.55}.supra-catalog .controls{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.supra-catalog input{padding:9px;border:1px solid #b6c9d9;min-width:180px;flex:1}.supra-catalog ol{list-style:none;padding:0;max-height:43vh;overflow:auto}.supra-catalog li{display:flex;gap:9px;align-items:center;padding:8px 0;border-bottom:1px solid #dce7ef}.supra-catalog li>span{flex:1;min-width:0;word-break:break-word}.supra-catalog li small{display:block;color:#60758a}.supra-catalog .warning{color:#735825}@media print{.supra-catalog,#supraDocumentsBtn{display:none!important}}';
document.head.append(styles);
const button=document.createElement('button');button.id='supraDocumentsBtn';button.className='top-btn';button.type='button';button.textContent='▤ Documents';button.title='Find documents in folders you approve';
document.querySelector('.top-actions')?.append(button);
const modal=document.createElement('div');modal.id='supraCatalog';modal.className='supra-catalog';modal.hidden=true;
modal.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="catalogTitle"><div style="display:flex;align-items:center;justify-content:space-between;gap:9px"><h2 id="catalogTitle">Find my documents</h2><button id="catalogClose" type="button">Close</button></div><p>Find readable documents on this computer. Choose folders once; on later launches, approved folders can be rescanned automatically.</p><p class="warning">Privacy: read-only filenames and sizes, never document contents during scanning. No uploads, hidden-folder crawling or automatic program installs.</p><div class="controls"><button id="catalogChoose">Choose folders & allow scan</button><button id="catalogRescan">Rescan</button><button id="catalogForget">Forget access</button></div><p id="catalogStatus" role="status" aria-live="polite"></p><div class="controls"><input id="catalogQuery" type="search" aria-label="Search document names" placeholder="Search names…"><label for="catalogFilter">Show <select id="catalogFilter"><option value="all">All</option><option value="readable">Ready to open</option><option value="converter-needed">Needs converter</option></select></label></div><ol id="catalogItems"></ol><p id="catalogAdvice" class="warning"></p><p>Limits: 5,000 matching files, 8 folder levels, 25 MB per opened document. Scan scope is only folders you explicitly choose.</p></section>';
document.body.append(modal);
const status=text=>{$('catalogStatus').textContent=text;};
function render(){
 const container=$('catalogItems'),query=$('catalogQuery').value.toLowerCase();
 container.replaceChildren();
 const found=items.filter(i=>(filter==='all'||i.kind===filter)&&(i.name+' '+i.relative).toLowerCase().includes(query));
 for(const item of found.slice(0,250)){
  const row=document.createElement('li'),info=document.createElement('span'),name=document.createElement('strong'),details=document.createElement('small'),action=document.createElement('button');
  name.textContent=item.name;
  details.textContent=item.folder+' / '+item.relative+' · '+Math.round(item.bytes/1024)+' KiB';
  info.append(name,details);action.textContent=item.canOpen?'Open':item.adapter?'Get '+(item.adapter==='pandoc'?'Pandoc':'LibreOffice'):'Unavailable';
  action.addEventListener('click',async()=>{
   if(!item.canOpen){
    if(item.adapter){
     $('catalogAdvice').textContent='Opening the official '+(item.adapter==='pandoc'?'Pandoc':'LibreOffice')+' information page. Download and installation require your own approval. Conversion is not yet integrated.';
     try{await api.catalogAdapterSource(item.adapter);}catch(error){$('catalogAdvice').textContent='Cannot open publisher site: '+error.message;}
    }else $('catalogAdvice').textContent=item.extension+' has no verified automatic converter in this alpha. The original file is unchanged.';
    return;
   }
   const current=document.getElementById('document');
   if(current?.innerText?.trim()){
    if(!confirm('Opening '+item.name+' will replace the document shown in Writer. Save a copy first if needed. Continue?'))return;
    try{
     if(window.SUPRAWriterRecovery?.record){
      await window.SUPRAWriterRecovery.record({html:current.innerHTML,name:document.getElementById('docName')?.value||'Current document',settings:window.SUPRAWriterTest?.settings?.()||{}},true);
     }
    }catch(error){
     if(!confirm('Could not make a recovery copy ('+error.message+'). Open anyway?'))return;
    }
   }
   try{
    const result=await api.catalogOpen(item.id);
    if(!window.SUPRAOpenDiscoveredFile)throw Error('Editor unavailable');
    await window.SUPRAOpenDiscoveredFile(new File([new Uint8Array(result.bytes)],result.name));
    modal.hidden=true;
   }catch(error){$('catalogAdvice').textContent='Open failed: '+error.message;}
  });
  row.append(info,action);container.append(row);
 }
 if(found.length>250){const li=document.createElement('li');li.textContent='Showing 250 results; filter by name for more.';container.append(li);}
 if(!found.length){const li=document.createElement('li');li.textContent='No matching files. Choose or rescan folders.';container.append(li);}
}
function report(result){
 if(!result||result.canceled)return;
 approved=!!result.approved;items=Array.isArray(result.items)?result.items:[];
 const ready=items.filter(i=>i.canOpen).length;
 status(approved?items.length+' matching files · '+ready+' openable · '+(items.length-ready)+' require conversion or exceed size limit'+(result.truncated?' · Scan reached limit.':''):'No folders approved.');
 $('catalogRescan').disabled=!approved;$('catalogForget').disabled=!approved;render();
}
async function invoke(name){
 if(loading)return;loading=true;$('catalogChoose').disabled=true;$('catalogRescan').disabled=true;status('Checking local folders…');
 try{report(await api[name]());}catch(e){status('Document discovery failed: '+e.message);}
 finally{loading=false;$('catalogChoose').disabled=false;$('catalogRescan').disabled=!approved;}
}
button.addEventListener('click',()=>{modal.hidden=false;$('catalogClose').focus();});
$('catalogClose').addEventListener('click',()=>{modal.hidden=true;button.focus();});
$('catalogChoose').addEventListener('click',()=>invoke('catalogChoose'));
$('catalogRescan').addEventListener('click',()=>invoke('catalogScan'));
$('catalogForget').addEventListener('click',async()=>{
 if(!confirm('Forget all approved folders and clear the local document list?'))return;
 try{report(await api.catalogForget());$('catalogAdvice').textContent='Access revoked. Documents remain untouched.';}
 catch(e){status('Failed to revoke: '+e.message);}
});
$('catalogQuery').addEventListener('input',render);
$('catalogFilter').addEventListener('change',e=>{filter=e.target.value;render();});
modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();modal.hidden=true;button.focus();}});
(async()=>{
 try{
  const state=await api.catalogStatus();
  approved=!!state.approved;$('catalogForget').disabled=!approved;$('catalogRescan').disabled=!approved;
  if(approved)await invoke('catalogScan');
  else{
   status('Choose folders to allow read-only scanning.');
   if(!localStorage.getItem('supra-writer-catalog-intro')){localStorage.setItem('supra-writer-catalog-intro','1');modal.hidden=false;}
  }
 }catch(e){status('Document discovery unavailable: '+e.message);}
})();
window.SUPRAWriterCatalogTest=Object.freeze({getItems:()=>items.map(i=>({...i})),approved:()=>approved});
})();
