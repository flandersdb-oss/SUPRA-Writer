/* SUPRA Writer editions; same document, different workflows. MIT. */
(()=>{'use strict';
const formats=[
['DOCX','.docx','Basic','Read/write; complex layout may simplify'],
['HTML','.html .htm','Basic','Read/write; unsupported CSS may simplify'],
['TXT','.txt','Working','Read/write; plain text only'],
['Markdown','.md .markdown','Basic','Read/write; basic headings, lists, quotes and emphasis'],
['PDF','.pdf','Export only','Print to PDF; no PDF import'],
['ODF','.odt','Planned','Adapter and fidelity tests required'],
['RTF','.rtf','Planned','Adapter required'],
['Legacy Word','.doc','Planned','Binary format conversion required'],
['Apple Pages','.pages','Planned','Adapter required'],
['WordPerfect','.wpd','Planned','Adapter required'],
['LaTeX','.tex','Planned','Adapter required'],
['EPUB','.epub','Planned','Publication engine required']];
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const inline=t=>esc(t).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>');
function markdownToHtml(t){
 if(typeof t!=='string'||t.length>2*1024*1024)throw Error('Markdown input exceeds 2 MB');
 const out=[];let list='',code=null;
 function close(){if(list){out.push('</'+list+'>');list='';}}
 for(const line of t.replace(/\r\n?/g,'\n').split('\n')){
  if(line.startsWith('~~~')){if(code!==null){out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');code=null;}else{close();code=[];}continue;}
  if(code!==null){code.push(line);continue;}
  if(!line.trim()){close();continue;}
  const h=line.match(/^(#{1,6})\s+(.+)$/),q=line.match(/^>\s?(.*)$/),ul=line.match(/^\s*[-+*]\s+(.+)$/),ol=line.match(/^\s*\d+[.)]\s+(.+)$/);
  if(h){close();out.push('<h'+h[1].length+'>'+inline(h[2])+'</h'+h[1].length+'>');continue;}
  if(q){close();out.push('<blockquote><p>'+inline(q[1])+'</p></blockquote>');continue;}
  if(ul||ol){const type=ul?'ul':'ol';if(list!==type){close();out.push('<'+type+'>');list=type;}out.push('<li>'+inline((ul||ol)[1])+'</li>');continue;}
  close();out.push('<p>'+inline(line)+'</p>');
 }
 if(code!==null)out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');
 close();return out.join('\n')||'<p><br></p>';
}
function htmlToMarkdown(root){
 function walk(n){
  if(n.nodeType===3)return n.nodeValue||'';if(n.nodeType!==1)return '';
  const t=n.tagName.toLowerCase(),c=()=>Array.from(n.childNodes).map(walk).join('');
  if(t==='br')return '\n';
  if(t==='strong'||t==='b')return '**'+c()+'**';
  if(t==='em'||t==='i')return '*'+c()+'*';
  if(/^h[1-6]$/.test(t))return '#'.repeat(Number(t[1]))+' '+c().trim()+'\n\n';
  if(t==='blockquote')return '> '+n.textContent.trim()+'\n\n';
  if(t==='pre')return '~~~\n'+n.textContent.trimEnd()+'\n~~~\n\n';
  if(t==='ul'||t==='ol')return Array.from(n.children).filter(x=>x.tagName.toLowerCase()==='li').map((x,i)=>(t==='ol'?(i+1)+'. ':'- ')+x.textContent.trim()).join('\n')+'\n\n';
  if(t==='li')return c()+'\n';
  if(t==='table')return '[Table flattened in basic Markdown]\n'+n.textContent.trim()+'\n\n';
  if(t==='p'||t==='div'||t==='article'||t==='section')return c().trim()+'\n\n';
  return c();
 }
 return Array.from(root.childNodes).map(walk).join('').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}
const $=id=>document.getElementById(id),KEY='supra-writer-edition-v1';
const css=document.createElement('style');
css.textContent='.supra-mode-group{display:flex;gap:4px;background:#dfebf4;border-radius:8px;padding:3px;flex-wrap:wrap}.supra-mode-group button{background:transparent;color:#245076;border:0;padding:9px;border-radius:7px;font-size:12px;font-weight:750}.supra-mode-group button[aria-pressed=true]{background:#183c61;color:#fff}.supra-universal-banner[hidden],.supra-formats-overlay[hidden]{display:none!important}.supra-universal-banner{padding:8px;background:#e8f3fc;color:#173e63;font-size:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.supra-formats-overlay{position:fixed;inset:0;z-index:18000;background:#0b2340ce;display:flex;justify-content:center;align-items:flex-start;padding:8vh 15px}.supra-formats-panel{background:white;color:#17324b;max-width:760px;width:100%;max-height:85vh;overflow:auto;padding:18px;border-radius:13px}.supra-formats-panel h2{font-size:19px}.supra-formats-panel table{width:100%;border-collapse:collapse;font-size:12px}.supra-formats-panel td,.supra-formats-panel th{padding:8px;border-bottom:1px solid #d3e0eb;text-align:left}.supra-formats-panel button,.supra-universal-banner button{border:1px solid #9ab3cb;background:#eff7ff;color:#204d78;padding:8px;border-radius:7px}.supra-formats-panel .warning{background:#fff4df;border-left:3px solid #bb914a;padding:9px;font-size:13px}@media print{.supra-mode-group,.supra-universal-banner,.supra-formats-overlay{display:none!important}}';
document.head.append(css);
const header=document.querySelector('.top-actions');if(!header)return;
const selector=document.createElement('div');selector.className='supra-mode-group';selector.setAttribute('role','group');selector.setAttribute('aria-label','Writer edition');
selector.innerHTML='<button id="supraFastMode" type="button" aria-pressed="true">⚡ Fast & Accessible</button><button id="supraUniversalMode" type="button" aria-pressed="false">◈ Universal</button>';
header.prepend(selector);
const banner=document.createElement('div');banner.id='supraUniversalBanner';banner.hidden=true;banner.className='supra-universal-banner';
banner.innerHTML='<strong>Universal workspace</strong><span>Same document · additional format guidance</span><button id="supraShowFormats" type="button">View supported formats</button>';
document.querySelector('.find-bar')?.before(banner);
const overlay=document.createElement('div');overlay.id='supraFormatsOverlay';overlay.className='supra-formats-overlay';overlay.hidden=true;
overlay.innerHTML='<section class="supra-formats-panel" role="dialog" aria-modal="true" aria-labelledby="supraFormatTitle"><div style="display:flex;justify-content:space-between;gap:8px"><h2 id="supraFormatTitle">◈ Universal compatibility</h2><button id="supraCloseFormats" type="button">Close</button></div><p class="warning">Use a copy of important documents. Basic conversion can simplify content or formatting; planned formats are not supported.</p><table><thead><tr><th>Format</th><th>Support</th><th>Notes</th></tr></thead><tbody id="supraFormatRows"></tbody></table><p><button id="supraOpenSupported" type="button">Open supported file</button> <button id="supraExportMarkdown" type="button">Save Markdown</button></p><p style="font-size:12px">BetterOffice/OpenOOXML is a research candidate, not an integrated conversion engine.</p></section>';
document.body.append(overlay);
for(const v of formats){const tr=document.createElement('tr');for(const cell of [v[0]+' '+v[1],v[2],v[3]]){const td=document.createElement('td');td.textContent=cell;tr.append(td);}$('supraFormatRows').append(tr);}
let mode='fast';try{if(localStorage.getItem(KEY)==='universal')mode='universal';}catch{}
function setMode(next){if(next!=='fast'&&next!=='universal')return false;mode=next;$('supraFastMode').setAttribute('aria-pressed',String(mode==='fast'));$('supraUniversalMode').setAttribute('aria-pressed',String(mode==='universal'));banner.hidden=mode!=='universal';document.documentElement.dataset.writerEdition=mode;try{localStorage.setItem(KEY,mode);}catch{}return true;}
function close(){overlay.hidden=true;$('supraUniversalMode').focus();}
function show(){setMode('universal');overlay.hidden=false;$('supraCloseFormats').focus();}
$('supraFastMode').addEventListener('click',()=>setMode('fast'));$('supraUniversalMode').addEventListener('click',show);$('supraShowFormats').addEventListener('click',show);$('supraCloseFormats').addEventListener('click',close);$('supraOpenSupported').addEventListener('click',()=>{close();$('openBtn').click();});$('supraExportMarkdown').addEventListener('click',()=>{close();document.querySelector('[data-export="md"]').click();});
overlay.addEventListener('click',e=>{if(e.target===overlay)close();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();close();}});
setMode(mode);
window.SUPRAWriterUniversal=Object.freeze({markdownToHtml,htmlToMarkdown,formats:()=>formats.map(x=>[...x]),mode:()=>mode,setMode});
})();