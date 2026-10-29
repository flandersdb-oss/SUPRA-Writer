import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function server(){
 const app=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const body=await fs.readFile(file);res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(body);}
  catch{res.writeHead(404).end();}
 });
 await new Promise(done=>app.listen(0,'127.0.0.1',done));
 return {app,url:'http://127.0.0.1:'+app.address().port+'/'};
}
test('shared history: bounded undo, redo and new-edit invalidation',async()=>{
 const scope={window:{}};
 vm.runInNewContext(await fs.readFile(path.join(root,'office/history.js'),'utf8'),scope);
 const h=scope.window.SUPRAHistory.create(3);
 for(let n=0;n<5;n++)h.record({n});
 assert.equal(h.counts().undo,3);
 const previous=h.undo({n:5});
 assert.equal(previous.n,4);
 assert.equal(h.redo({n:4}).n,5);
 h.undo({n:5});h.record({n:99});
 assert.equal(h.counts().redo,0);
});
test('Autosave and Undo/Redo across all three editor interfaces', {timeout:120000},async t=>{
 const {app,url}=await server();t.after(()=>new Promise(done=>app.close(done)));
 const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
 await t.test('Sheets autosaves as you type, supports undo, redo and reload',async()=>{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'office/sheets/');
  const cell=page.locator('[data-cell="A2"]');await cell.fill('178');
  assert.equal(await page.evaluate(()=>SUPRASheetsTest.getCell('A2')),'178');
  await page.locator('#undo').click();
  assert.equal(await page.evaluate(()=>SUPRASheetsTest.getCell('A2')),'');
  await page.locator('#redo').click();
  assert.equal(await page.evaluate(()=>SUPRASheetsTest.getCell('A2')),'178');
  await page.reload();
  assert.equal(await page.evaluate(()=>SUPRASheetsTest.getCell('A2')),'178');
  assert.match(await page.locator('#saveStatus').innerText(),/Autosaved/);
  assert.deepEqual(errors,[]);await page.close();
 });
 await t.test('Present autosaves slide edits, and restores undo/redo',async()=>{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'office/present/');
  await page.locator('#slideTitle').fill('First alpha slide');
  assert.equal(await page.evaluate(()=>SUPRAPresentTest.getSlides()[0].title),'First alpha slide');
  await page.locator('#undo').click();
  assert.equal(await page.evaluate(()=>SUPRAPresentTest.getSlides()[0].title),'');
  await page.locator('#redo').click();
  assert.equal(await page.evaluate(()=>SUPRAPresentTest.getSlides()[0].title),'First alpha slide');
  await page.locator('#newSlide').click();
  assert.equal(await page.evaluate(()=>SUPRAPresentTest.getSlides().length),2);
  await page.locator('#undo').click();
  assert.equal(await page.evaluate(()=>SUPRAPresentTest.getSlides().length),1);
  await page.reload();
  assert.equal(await page.evaluate(()=>SUPRAPresentTest.getSlides()[0].title),'First alpha slide');
  assert.deepEqual(errors,[]);await page.close();
 });
 await t.test('Writer exposes clear controls and retains autosaved text',async()=>{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  for(const id of ['undoBtn','redoBtn','saveNowBtn'])assert.equal(await page.locator('#'+id).count(),1);
  await page.locator('#document').fill('Autosave survives a reload.');
  await page.locator('#saveNowBtn').click();
  assert.match(await page.locator('#saveStatus').innerText(),/Autosaved/);
  await page.reload();
  assert.match(await page.locator('#document').innerText(),/Autosave survives a reload/);
  assert.deepEqual(errors,[]);await page.close();
 });
});