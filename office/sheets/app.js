/* SUPRA Sheets v0.1 — MIT, offline, no external dependencies. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const ROWS=25,COLS=10,KEY='supra-sheets-v01';
const alphabet='ABCDEFGHIJ';
const idFor=(r,c)=>alphabet[c]+(r+1);
const validId=s=>/^[A-J](?:[1-9]|1[0-9]|2[0-5])$/.test(s);
const blank=()=>({name:'My spreadsheet',cells:{}});
const data={state:blank(),chosen:'budget',selected:'A1'};
const history=window.SUPRAHistory.create(40);let editingCell=null;
function refreshHistory(){ $('undo').disabled=!history.canUndo();$('redo').disabled=!history.canRedo(); }
function checkpoint(){history.record(data.state);refreshHistory();}
const recipes={
 budget:{title:'Monthly budget',steps:['Create Category, Planned, Actual and Difference columns','Enter example spending amounts and editable categories','Calculate differences using cell formulas','Add automatic totals across each numeric column'],cells:{A1:'Category',B1:'Planned',C1:'Actual',D1:'Difference',A2:'Housing',B2:'1000',C2:'950',D2:'=B2-C2',A3:'Food',B3:'350',C3:'375',D3:'=B3-C3',A4:'Travel',B4:'200',C4:'180',D4:'=B4-C4',A5:'Utilities',B5:'120',C5:'110',D5:'=B5-C5',A7:'TOTAL',B7:'=SUM(B2:B5)',C7:'=SUM(C2:C5)',D7:'=B7-C7'}},
 inventory:{title:'Inventory tracker',steps:['Add item, quantity, unit price and stock value columns','Seed editable example inventory','Calculate each item’s total stock value','Calculate total item quantities and values'],cells:{A1:'Item',B1:'Quantity',C1:'Unit price',D1:'Stock value',A2:'Notebook',B2:'12',C2:'4.5',D2:'=B2*C2',A3:'Pen',B3:'25',C3:'1.2',D3:'=B3*C3',A4:'Folder',B4:'8',C4:'3',D4:'=B4*C4',A6:'TOTAL',B6:'=SUM(B2:B4)',D6:'=SUM(D2:D4)'}},
 grades:{title:'Gradebook',steps:['Create learner and assignment score columns','Add editable example results','Calculate each learner’s average','Calculate the overall class average'],cells:{A1:'Learner',B1:'Task 1',C1:'Task 2',D1:'Average',A2:'Learner A',B2:'90',C2:'84',D2:'=AVERAGE(B2:C2)',A3:'Learner B',B3:'72',C3:'88',D3:'=AVERAGE(B3:C3)',A4:'Learner C',B4:'95',C4:'91',D4:'=AVERAGE(B4:C4)',A6:'Class average',D6:'=AVERAGE(D2:D4)'}},
 blank:{title:'Blank spreadsheet',steps:['Clear the grid after confirmation','Keep all 250 editable cells available','Begin typing or load CSV/JSON'],cells:{}}
};
const feedback=s=>{$('feedback').textContent=s;};
const isEmpty=()=>Object.values(data.state.cells).every(v=>!String(v).trim());
function safeState(obj){
 if(!obj||typeof obj!=='object'||!obj.cells||typeof obj.cells!=='object')throw Error('Not a SUPRA Sheets project');
 const clean={name:String(obj.name||'My spreadsheet').slice(0,70),cells:{}};
 for(const [k,v] of Object.entries(obj.cells)){
  if(!validId(k)||typeof v!=='string')continue;
  if(v.length>1000)throw Error('Cell contents too long');
  clean.cells[k]=v;
 }
 if(Object.keys(obj.cells).length>ROWS*COLS)throw Error('Project exceeds prototype grid');
 return clean;
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(data.state));$('saveStatus').textContent='✓ Autosaved on this device';}
 catch{$('saveStatus').textContent='Storage unavailable — export backup';}
}
function nameChange(){const name=$('sheetName').value.slice(0,70);if(name!==data.state.name){checkpoint();data.state.name=name;save();}}
function raw(id){return data.state.cells[id]||'';}
function setRaw(id,value,group=null){
 if(!validId(id))throw Error('Outside grid');
 const text=String(value).slice(0,1000);
 if(raw(id)===text)return;
 if(group===null||editingCell!==group){checkpoint();editingCell=group;}
 if(text)data.state.cells[id]=text;else delete data.state.cells[id];save();
}
function tokenize(src){
 let i=0;const tokens=[];
 while(i<src.length){
  if(/\s/.test(src[i])){i++;continue;}
  const part=src.slice(i);const match=part.match(/^(\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?|[A-Za-z_][A-Za-z0-9_]*|[+\-*/^():,])/);
  if(!match)throw Error('#ERROR!');
  tokens.push(match[1]);i+=match[1].length;
  if(tokens.length>250)throw Error('#ERROR!');
 }
 return tokens;
}
function compute(id,stack=new Set()){
 if(!validId(id))throw Error('#REF!');
 if(stack.has(id))throw Error('#CYCLE!');
 const s=raw(id).trim();
 if(!s)return '';
 if(!s.startsWith('=')){const n=Number(s);return Number.isFinite(n)&&s!==''?n:s;}
 const next=new Set(stack);next.add(id);
 const t=tokenize(s.slice(1));let pos=0;
 const peek=()=>t[pos],eat=v=>{if(t[pos]!==v)throw Error('#ERROR!');pos++;};
 function numeric(v){if(typeof v==='number'&&Number.isFinite(v))return v;if(v==='')return 0;throw Error('#VALUE!');}
 function args(){
  const out=[];
  if(peek()===')')return out;
  while(true){
   if(/^[A-J](?:[1-9]|1[0-9]|2[0-5])$/i.test(peek()||'')&&t[pos+1]===':'){
    const start=t[pos++].toUpperCase();eat(':');const end=(t[pos++]||'').toUpperCase();
    if(!validId(end))throw Error('#REF!');
    const a=[alphabet.indexOf(start[0]),Number(start.slice(1))-1],b=[alphabet.indexOf(end[0]),Number(end.slice(1))-1];
    for(let row=Math.min(a[1],b[1]);row<=Math.max(a[1],b[1]);row++)
     for(let col=Math.min(a[0],b[0]);col<=Math.max(a[0],b[0]);col++)out.push(compute(idFor(row,col),next));
   }else out.push(expression());
   if(peek()!==',')break;
   pos++;
  }
  return out;
 }
 function primary(){
  const s=peek();if(s===undefined)throw Error('#ERROR!');
  if(s==='+'||s==='-'){pos++;return (s==='-'?-1:1)*numeric(primary());}
  if(s==='('){pos++;const v=expression();eat(')');return v;}
  if(/^\d/.test(s)){pos++;return Number(s);}
  if(/^[A-Za-z_]/.test(s)){
   pos++;const u=s.toUpperCase();
   if(peek()==='('){
    pos++;const values=args();eat(')');
    if(!['SUM','AVERAGE','MIN','MAX','COUNT'].includes(u))throw Error('#NAME?');
    const nums=values.filter(x=>x!==''&&typeof x==='number'&&Number.isFinite(x));
    if(u==='COUNT')return nums.length;
    if(u==='SUM')return nums.reduce((a,b)=>a+b,0);
    if(!nums.length)return 0;
    if(u==='AVERAGE')return nums.reduce((a,b)=>a+b,0)/nums.length;
    if(u==='MIN')return Math.min(...nums);
    return Math.max(...nums);
   }
   if(!validId(u))throw Error('#NAME?');
   return numeric(compute(u,next));
  }
  throw Error('#ERROR!');
 }
 function power(){let lhs=primary();if(peek()==='^'){pos++;lhs=Math.pow(numeric(lhs),numeric(power()));}return lhs;}
 function mult(){let x=power();while(peek()==='*'||peek()==='/'){const op=t[pos++],y=power();if(op==='/'&&numeric(y)===0)throw Error('#DIV/0!');x=op==='*'?numeric(x)*numeric(y):numeric(x)/numeric(y);}return x;}
 function expression(){let x=mult();while(peek()==='+'||peek()==='-'){const op=t[pos++],y=mult();x=op==='+'?numeric(x)+numeric(y):numeric(x)-numeric(y);}return x;}
 const out=expression();
 if(pos!==t.length)throw Error('#ERROR!');
 if(typeof out==='number'&&!Number.isFinite(out))throw Error('#NUM!');
 return out;
}
function value(id){try{return compute(id);}catch(e){return String(e.message||'#ERROR!').startsWith('#')?e.message:'#ERROR!';}}
function fmt(v){if(typeof v==='number')return String(Math.round((v+Number.EPSILON)*1000000)/1000000);return String(v);}
function buildGrid(){
 const head=$('grid').tHead;const h=document.createElement('tr');const corner=document.createElement('th');corner.textContent='';h.append(corner);
 for(const c of alphabet){const th=document.createElement('th');th.scope='col';th.textContent=c;h.append(th);}head.append(h);
 const body=$('grid').tBodies[0];for(let r=0;r<ROWS;r++){
  const tr=document.createElement('tr');const row=document.createElement('th');row.scope='row';row.textContent=r+1;tr.append(row);
  for(let c=0;c<COLS;c++){
   const id=idFor(r,c),td=document.createElement('td'),input=document.createElement('input');input.dataset.cell=id;input.setAttribute('aria-label','Cell '+id);
   input.addEventListener('focus',()=>{editingCell=null;data.selected=id;$('cellAddress').value=id;$('formulaBar').value=raw(id);input.value=raw(id);});
   input.addEventListener('input',()=>{setRaw(id,input.value,id);$('formulaBar').value=raw(id);});
   input.addEventListener('blur',()=>{editingCell=null;renderGrid();});
   input.addEventListener('change',()=>{setRaw(id,input.value);renderGrid();$('formulaBar').value=raw(id);});
   input.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();setRaw(id,input.value,id);editingCell=null;renderGrid();
      const next=e.key==='Tab'?idFor(r,Math.min(COLS-1,c+1)):idFor(Math.min(ROWS-1,r+1),c);document.querySelector('[data-cell="'+next+'"]')?.focus();}
   });
   td.append(input);tr.append(td);
  }body.append(tr);
 }
}
function renderGrid(){
 for(const el of document.querySelectorAll('[data-cell]')){
  const v=value(el.dataset.cell),str=fmt(v),isError=str.startsWith('#');
  el.parentElement.dataset.error=isError?'true':'false';el.title=raw(el.dataset.cell).startsWith('=')?raw(el.dataset.cell)+' → '+str:'Cell '+el.dataset.cell;
  if(document.activeElement!==el)el.value=str;
 }
 $('sheetName').value=data.state.name;
}
function updatePreview(){
 const rec=recipes[data.chosen];$('workflowTitle').textContent=rec.title;
 const host=$('workflowSteps');host.replaceChildren();for(const step of rec.steps){const li=document.createElement('li');li.textContent=step;host.append(li);}
 const vals=Object.values(rec.cells);$('presetCells').textContent=String(vals.length);$('presetFormulas').textContent=String(vals.filter(v=>v.startsWith('=')).length);$('presetClicks').textContent=String(rec.steps.length);
 for(const b of document.querySelectorAll('[data-template]')){const active=b.dataset.template===data.chosen;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
}
function applyTemplate(){
 const rec=recipes[data.chosen];
 if(!isEmpty()&&!confirm('Replace current sheet with '+rec.title+'? You can use Undo template.'))return false;
 checkpoint();editingCell=null;data.state={name:rec.title,cells:{...rec.cells}};
 save();renderGrid();feedback(rec.title+' applied: '+Object.keys(rec.cells).length+' cells prepared with one action.');return true;
}
function undo(){const prior=history.undo(data.state);if(!prior)return false;data.state=safeState(prior);editingCell=null;refreshHistory();save();renderGrid();feedback('Edit undone.');return true;}
function redo(){const next=history.redo(data.state);if(!next)return false;data.state=safeState(next);editingCell=null;refreshHistory();save();renderGrid();feedback('Edit restored.');return true;}
function formula(kind){
 const selected=data.selected;const c=selected[0],r=Number(selected.slice(1)),previous=r>2?r-1:2;
 const pre={sum:'=SUM('+c+'2:'+c+previous+')',avg:'=AVERAGE('+c+'2:'+c+previous+')',diff:r>1?'='+c+(r-1)+'-1':'=B2-C2',multiply:r>1?'='+c+(r-1)+'*1':'=B2*C2'};
 $('formulaBar').value=pre[kind];$('formulaBar').focus();feedback('Formula suggested for '+selected+'. Select Set cell to confirm.');}
function writeSelected(){setRaw(data.selected,$('formulaBar').value);renderGrid();feedback(data.selected+' updated.');}
function csvEscape(value){
 let x=String(value);
 // Prevent spreadsheet formula injection on export of user-entered text.
 if(typeof value!=='number'&&/^[=+\-@\t\r]/.test(x))x="'"+x;
 return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;
}
function exportCsv(){
 const rows=[];let last=0,lastCol=0;
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(raw(idFor(r,c)).trim()){last=Math.max(last,r);lastCol=Math.max(lastCol,c);}
 for(let r=0;r<=last;r++){const cols=[];for(let c=0;c<=lastCol;c++){const id=idFor(r,c),v=value(id);cols.push(csvEscape(v));}rows.push(cols.join(','));}
 download((rows.join('\r\n')||'')+'\r\n',safeName()+'.csv','text/csv');
 feedback('CSV exported with calculated values. Use JSON to preserve formulas.');
}
function safeName(){return(data.state.name||'SUPRA Sheets').replace(/[\\/:*?"<>|]/g,'-').slice(0,70);}
function download(contents,name,type){const blob=new Blob([contents],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},1200);}
function exportJson(){download(JSON.stringify({type:'SUPRA-SHEETS-v0.1',...data.state},null,2),safeName()+'.supra-sheets.json','application/json');feedback('Editable project backup downloaded.');}
function parseCsv(text){
 const lines=[],row=[];let current='',quotes=false;
 for(let i=0;i<text.length;i++){const ch=text[i];if(quotes){if(ch==='"'&&text[i+1]==='"'){current+='"';i++;}else if(ch==='"')quotes=false;else current+=ch;}
 else if(ch==='"')quotes=true;else if(ch===','){row.push(current);current='';}else if(ch==='\r'||ch==='\n'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(current);lines.push([...row]);row.length=0;current='';}
 else current+=ch;}
 if(quotes)throw Error('Unclosed CSV quote');
 if(current!==''||row.length){row.push(current);lines.push(row);}
 return lines;
}
async function loadFile(file){
 if(!file)return false;if(file.size>1024*1024)throw Error('Prototype import limit: 1 MB');
 const content=await file.text(),ext=file.name.split('.').pop().toLowerCase();let next;
 if(ext==='json'){const obj=JSON.parse(content);if(obj.type!=='SUPRA-SHEETS-v0.1')throw Error('Unknown project format');next=safeState(obj);}
 else if(ext==='csv'){
  const rows=parseCsv(content);if(rows.length>ROWS||rows.some(r=>r.length>COLS))throw Error('CSV exceeds 25 rows × 10 columns');
  next=blank();next.name=file.name.replace(/\.csv$/i,'');for(let r=0;r<rows.length;r++)for(let c=0;c<rows[r].length;c++){
   const value=String(rows[r][c]).slice(0,1000);
   // A CSV is untrusted external data; formulas are not automatically executed on import.
   if(value){
    // Ordinary signed numerals must remain numbers; other formula-like CSV text is inert.
    const isNumber=/^[+\-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+\-]?\d+)?$/.test(value.trim());
    next.cells[idFor(r,c)]=!isNumber&&/^[=+\-@]/.test(value)?"'"+value:value;
   }
  }
 }else throw Error('Choose CSV or SUPRA Sheets JSON');
 if(!isEmpty()&&!confirm('Replace current sheet with imported file?'))return false;
 checkpoint();editingCell=null;data.state=safeState(next);save();renderGrid();feedback('File imported. You can undo this replacement.');return true;
}
for(const b of document.querySelectorAll('[data-template]'))b.addEventListener('click',()=>{data.chosen=b.dataset.template;updatePreview();});
$('applyTemplate').addEventListener('click',applyTemplate);$('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
$('saveNow').addEventListener('click',()=>{save();feedback('Current sheet saved on this device.');});
$('sheetName').addEventListener('change',nameChange);$('formulaBar').addEventListener('keydown',e=>{if(e.key==='Enter')writeSelected();});
$('applyFormula').addEventListener('click',writeSelected);
for(const b of document.querySelectorAll('[data-formula]'))b.addEventListener('click',()=>formula(b.dataset.formula));
$('exportCsv').addEventListener('click',exportCsv);$('exportJson').addEventListener('click',exportJson);
$('importCsv').addEventListener('click',()=>{$('filePicker').dataset.mode='csv';$('filePicker').accept='.csv,text/csv';$('filePicker').click();});
$('importJson').addEventListener('click',()=>{$('filePicker').dataset.mode='json';$('filePicker').accept='.json,application/json';$('filePicker').click();});
$('filePicker').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{await loadFile(file);}catch(err){feedback('Import failed: '+err.message);}});
try{const existing=localStorage.getItem(KEY);if(existing)data.state=safeState(JSON.parse(existing));}catch{feedback('Could not restore saved sheet.');}
document.addEventListener('keydown',e=>{
 if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
 const key=e.key.toLowerCase();
 if(key!=='z'&&key!=='y')return;
 if(document.activeElement?.matches('input:not([readonly]),textarea'))return;
 e.preventDefault();if(key==='y'||e.shiftKey)redo();else undo();
});
buildGrid();renderGrid();updatePreview();save();refreshHistory();
window.SUPRASheetsTest=Object.freeze({setCell:(id,val)=>{setRaw(id,val);renderGrid();},getCell:raw,value,applyTemplate:(id)=>{data.chosen=id;updatePreview();return applyTemplate();},csv:parseCsv,gridSize:()=>({rows:ROWS,cols:COLS}),undo,redo,history:()=>history.counts()});
})();