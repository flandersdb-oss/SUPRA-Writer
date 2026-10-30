/* SUPRA Writer — local recovery history for the two shared-core editions (MIT).
 * IndexedDB revisions are distinct from localStorage autosave and explicit DOCX exports.
 */
(()=>{'use strict';
const STORE='revisions',DB='supra-writer-local-recovery-v1',LIMIT=12,MAX_HTML=1200000,INTERVAL=60000;
const $=id=>document.getElementById(id);
let database=null,lastSnapshot=0;
const reqPromise=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Database request failed'));});
async function openDb(){
 if(!('indexedDB' in window))throw Error('Browser recovery database not supported');
 if(database)return database;
 const open=indexedDB.open(DB,1);
 open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains(STORE))open.result.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});};
 database=await reqPromise(open);database.onversionchange=()=>{database?.close();database=null;};
 return database;
}
async function record(snapshot,force=false){
 if(!snapshot||typeof snapshot.html!=='string')throw Error('Invalid snapshot');
 if(snapshot.html.length>MAX_HTML)throw Error('Snapshot too large; export your document');
 if(!force&&lastSnapshot&&Date.now()-lastSnapshot<INTERVAL)return false;
 const db=await openDb();
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
  store.add({created:Date.now(),name:String(snapshot.name||'Untitled').slice(0,100),html:snapshot.html,settings:snapshot.settings||{}});
  const all=store.getAllKeys();
  all.onsuccess=()=>{
   const ids=all.result||[];
   if(ids.length>LIMIT)for(const id of ids.slice(0,ids.length-LIMIT))store.delete(id);
  };
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Recovery write failed'));tx.onabort=()=>reject(tx.error||Error('Recovery write aborted'));
 });
 lastSnapshot=Date.now();return true;
}
async function list(){
 const db=await openDb();const tx=db.transaction(STORE,'readonly');
 const entries=await reqPromise(tx.objectStore(STORE).getAll());
 return entries.sort((a,b)=>b.id-a.id).map(x=>({id:x.id,created:x.created,name:x.name,characters:x.html.length}));
}
async function load(id){
 const db=await openDb();return reqPromise(db.transaction(STORE,'readonly').objectStore(STORE).get(id));
}
function current(){
 const d=$('document');return {html:d?.innerHTML||'',name:$('docName')?.value||'Untitled',settings:window.SUPRAWriterTest?.settings?.()||{}};
}
const style=document.createElement('style');style.textContent='.supra-recovery-panel[hidden]{display:none!important}.supra-recovery-panel{position:fixed;inset:0;z-index:19000;background:#0c2038c9;padding:6vh 16px;display:flex;align-items:flex-start;justify-content:center}.supra-recovery-dialog{background:#fff;color:#18334c;border-radius:13px;padding:18px;width:min(650px,100%);max-height:86vh;overflow:auto}.supra-recovery-dialog h2{font-size:19px;margin:0}.supra-recovery-dialog button{border:1px solid #9ab9d3;padding:9px;border-radius:7px;background:#edf5fe;color:#23517a;font-weight:750}.supra-recovery-dialog li{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #d5e3ef;gap:10px;padding:10px 2px}.supra-recovery-dialog li small{display:block;color:#60768b}.supra-recovery-dialog ol{padding:0;list-style:none}.supra-recovery-dialog .actions{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.supra-recovery-dialog .notice{color:#74551b;font-size:12px}';document.head.append(style);
const button=document.createElement('button');button.id='supraRecoveryBtn';button.className='top-btn';button.type='button';button.title='Restore an earlier local recovery snapshot';button.textContent='↶ Versions';
$('saveMenuBtn')?.closest('.dropdown-wrap')?.before(button);
const modal=document.createElement('div');modal.id='supraRecoveryModal';modal.className='supra-recovery-panel';modal.hidden=true;
modal.innerHTML='<section class="supra-recovery-dialog" role="dialog" aria-modal="true" aria-labelledby="supraRecoveryHeading"><h2 id="supraRecoveryHeading">Local recovery versions</h2><p class="notice">Copies are stored only on this device. They are not cloud backups, and clearing browser data can erase them. Export important documents separately.</p><div class="actions"><button type="button" id="supraRecoverySave">Save recovery point</button><button type="button" id="supraRecoveryClose">Close</button></div><p id="supraRecoveryStatus" role="status" aria-live="polite"></p><ol id="supraRecoveryEntries"></ol></section>';
document.body.append(modal);
function report(message){$('supraRecoveryStatus').textContent=message;}
async function refresh(){
 const container=$('supraRecoveryEntries');container.replaceChildren();
 try{
  const entries=await list();
  if(!entries.length)report('No recovery versions yet. Save a recovery point to begin.');
  else report(entries.length+' recovery version(s) on this device (maximum '+LIMIT+').');
  for(const v of entries){
   const li=document.createElement('li'),copy=document.createElement('div'),strong=document.createElement('strong'),info=document.createElement('small'),restore=document.createElement('button');
   strong.textContent=v.name;info.textContent=new Date(v.created).toLocaleString()+' · '+v.characters.toLocaleString()+' HTML characters';
   copy.append(strong,info);restore.textContent='Restore';restore.type='button';restore.addEventListener('click',async()=>{
    const item=await load(v.id);
    if(!item)return report('Recovery version no longer exists.');
    if(!confirm('Replace the current document with this older version? Export a backup first if needed.'))return;
    try{
     await record(current(),true); // protect the document being replaced
     if(!window.SUPRAWriterTest?.restoreSnapshot?.(item))throw Error('Unable to restore this document');
     report('Previous version restored. The newer document was also saved as a recovery point.');
     await refresh();
    }catch(error){report('Could not restore: '+error.message);}
   });li.append(copy,restore);container.append(li);
  }
 }catch(error){report('Recovery history unavailable: '+error.message);}
}
button?.addEventListener('click',()=>{modal.hidden=false;void refresh();$('supraRecoveryClose').focus();});
$('supraRecoveryClose').addEventListener('click',()=>{modal.hidden=true;button.focus();});
$('supraRecoverySave').addEventListener('click',async()=>{
 try{await record(current(),true);await refresh();}catch(error){report('Could not save recovery point: '+error.message);}
});
modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();modal.hidden=true;button.focus();}});
document.addEventListener('supra:writer:saved',e=>{
 const snapshot=e.detail;if(!snapshot)return;
 void record(snapshot).catch(()=>{}); // Autosave remains successful even if optional recovery storage is unavailable.
});
window.SUPRAWriterRecovery=Object.freeze({record,list,load,getLimit:()=>LIMIT,getInterval:()=>INTERVAL});
})();