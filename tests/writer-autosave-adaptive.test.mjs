import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
const settings=source.slice(source.indexOf('const AUTOSAVE_IDLE_MS'),source.indexOf('const dims',source.indexOf('const AUTOSAVE_IDLE_MS')));
const functions=source.slice(source.indexOf('function store(){'),source.indexOf('function contrastRatio('));
assert.ok(settings.includes('AUTOSAVE_MIN_GAP_MS'),'Autowrite throttle exists');
assert.ok(functions.includes('function flushAutosave()'),'Emergency save exists');
function harness(){
 let now=1000,nextId=0,writes=0,status='',blocked=false;const pending=new Map();
 const doc={innerHTML:''};
 function after(fn,delay){const id=++nextId;pending.set(id,{at:now+delay,fn});return id;}
 function cancel(id){pending.delete(id);}
 function advance(to){
  for(;;){
   let soonest=Infinity,id=null;
   for(const [k,t] of pending)if(t.at<soonest){id=k;soonest=t.at;}
   if(id===null||soonest>to)break;
   now=soonest;const callback=pending.get(id).fn;pending.delete(id);callback();
  }
  now=to;
 }
 const engine=new Function('setTimeout','clearTimeout','Date','localStorage','doc','$','settings','status','updateCounts','document','CustomEvent',
  'let saveTimer=null,maxSaveTimer=null;'+settings+functions+
  'return {queueSave,store,flushAutosave,autosaveIdleDelay,pending:()=>unsavedChanges};');
 const app=engine(after,cancel,{now:()=>now},{setItem(){if(blocked)throw Error('Quota exceeded');writes++;}},doc,()=>({value:'Test'}),{},
  str=>{status=str;},()=>{},{dispatchEvent(){}},function C(){});
 return {app,doc,advance,writes:()=>writes,status:()=>status,block:()=>{blocked=true;}};
}
test('adaptive autosave: 50 ms small document',()=>{
 const h=harness();h.doc.innerHTML='short';h.app.queueSave();h.advance(1049);assert.equal(h.writes(),0);h.advance(1050);assert.equal(h.writes(),1);
});
test('adaptive autosave: 120 ms medium document after earlier save',()=>{
 const h=harness();h.doc.innerHTML='m'.repeat(100100);h.app.store();h.advance(1400);h.app.queueSave();
 assert.equal(h.app.autosaveIdleDelay(),120);h.advance(1519);assert.equal(h.writes(),1);h.advance(1520);assert.equal(h.writes(),2);
});
test('adaptive autosave: 300 ms large document',()=>{
 const h=harness();h.doc.innerHTML='l'.repeat(500100);h.app.store();h.advance(1400);h.app.queueSave();
 assert.equal(h.app.autosaveIdleDelay(),300);h.advance(1699);assert.equal(h.writes(),1);h.advance(1700);assert.equal(h.writes(),2);
});
test('continuous typing: 23 edits at 50 ms cadence do not write every keystroke',()=>{
 const h=harness();for(let i=1;i<=23;i++){h.advance(1000+i*50);h.doc.innerHTML='typing'+i;h.app.queueSave();}
 assert.ok(h.writes()>=2,'at least two continuous checkpoints');
 assert.ok(h.writes()<=6,'throttled, fewer than 7 full writes');
});
test('blur forces immediate persistence and failures remain visible',()=>{
 const h=harness();h.doc.innerHTML='blur';h.app.queueSave();h.advance(1001);h.app.flushAutosave();
 assert.equal(h.writes(),1);assert.equal(h.app.pending(),false);
 h.block();h.doc.innerHTML='failed';h.app.queueSave();h.app.flushAutosave();
 assert.equal(h.app.pending(),true);assert.match(h.status(),/unavailable/);
});
