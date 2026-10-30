import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Writer fast autosave: idle, continuous input, and focus loss', {timeout:120000},async t=>{
 const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const b=await fs.readFile(file);const ext=path.extname(file);res.setHeader('content-type',ext==='.js'?'text/javascript':ext==='.css'?'text/css':'text/html');res.end(b);}
  catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.locator('#document').waitFor();
 assert.deepEqual(await page.evaluate(()=>{const p=SUPRAWriterTest.autosave();return {idleMs:p.idleMs,maxMs:p.maxMs};}),{idleMs:120,maxMs:1000});
 await t.test('idle save persists new content, then reload restores it',async()=>{
  await page.locator('#document').fill('Idle autosave evidence');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('supra-writer-v02')||'{}').html?.includes('Idle autosave evidence'),{timeout:1500});
  assert.match(await page.locator('#saveStatus').innerText(),/Autosaved/);
  await page.reload();
  assert.match(await page.locator('#document').innerText(),/Idle autosave evidence/);
 });
 await t.test('continuous typing saves intermediate content before input stops',async()=>{
  const result=await page.evaluate(async()=>{
   const doc=document.getElementById('document');
   let i=0;
   const ticker=setInterval(()=>{
    i++;
    doc.textContent='continuous-'+i;
    doc.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'x'}));
   },50);
   await new Promise(resolve=>setTimeout(resolve,1200));
   const mid=JSON.parse(localStorage.getItem('supra-writer-v02')||'{}').html||'';
   clearInterval(ticker);
   return {mid,typed:i};
  });
  assert.ok(result.typed>=19,'continuous input actually occurred');
  assert.match(result.mid,/continuous-\d+/,'maximum-delay save captured intermediate work');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('supra-writer-v02')||'{}').html===document.getElementById('document').innerHTML,{timeout:1500});
 });
 await t.test('leaving editor immediately flushes pending work',async()=>{
  await page.locator('#document').fill('Flush on focus loss');
  await page.locator('#docName').focus();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('supra-writer-v02')||'{}').html||'');
  assert.match(saved,/Flush on focus loss/);
  assert.equal(await page.evaluate(()=>SUPRAWriterTest.autosave().pending),false);
 });
 assert.deepEqual(errors,[]);
});