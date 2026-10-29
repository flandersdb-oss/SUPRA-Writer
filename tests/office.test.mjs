import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function server(){
 const s=http.createServer(async(req,res)=>{
  const pathPart=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const location=pathPart.endsWith('/')?pathPart+'index.html':pathPart;
  const p=path.resolve(root,'.'+location);
  if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const bytes=await fs.readFile(p),ext=path.extname(p),types={'.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.html':'text/html','.webmanifest':'application/manifest+json'};
   res.writeHead(200,{'content-type':types[ext]||'application/octet-stream'});res.end(bytes);
  }catch{res.writeHead(404).end();}
 });
 await new Promise(done=>s.listen(0,'127.0.0.1',done));
 return {s,url:'http://127.0.0.1:'+s.address().port+'/'};
}
test('SUPRA Office: Sheets, Present and Writer Visual Setup', {timeout:180000},async t=>{
 const {s,url}=await server();t.after(()=>new Promise(done=>s.close(done)));
 const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
 await t.test('Office home links to all three editors',async()=>{
  const page=await browser.newPage();await page.goto(url+'office/');
  assert.equal(await page.locator('a[href="../"]').count()>=1,true);
  assert.equal(await page.locator('a[href="sheets/"]').count()>=1,true);
  assert.equal(await page.locator('a[href="present/"]').count()>=1,true);
  await page.close();
 });
 await t.test('Sheets: template, formula math, cycle detection, offline recovery, export',async()=>{
  const page=await browser.newPage({acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'office/sheets/');
  await page.locator('[data-cell="A1"]').waitFor();
  const dims=await page.evaluate(()=>SUPRASheetsTest.gridSize());assert.deepEqual(dims,{rows:25,cols:10});
  await page.locator('#applyTemplate').click();
  assert.equal(await page.evaluate(()=>SUPRASheetsTest.value('B7')),1670);
  assert.equal(await page.evaluate(()=>SUPRASheetsTest.value('C7')),1615);
  assert.equal(await page.evaluate(()=>SUPRASheetsTest.value('D7')),55);
  await page.evaluate(()=>SUPRASheetsTest.setCell('E1','=1+2*3'));
  assert.equal(await page.evaluate(()=>SUPRASheetsTest.value('E1')),7);
  await page.evaluate(()=>{SUPRASheetsTest.setCell('H2','=H3');SUPRASheetsTest.setCell('H3','=H2');});
  assert.equal(await page.evaluate(()=>SUPRASheetsTest.value('H2')),'#CYCLE!');
  await page.evaluate(()=>SUPRASheetsTest.setCell('H2',''));
  await page.reload();
  assert.equal(await page.evaluate(()=>SUPRASheetsTest.value('D7')),55);
  assert.deepEqual(await page.evaluate(()=>SUPRASheetsTest.csv('"Hello, world",42\r\nB,13')),[['Hello, world','42'],['B','13']]);
  const csvPromise=page.waitForEvent('download');await page.locator('#exportCsv').click();const csv=await csvPromise;
  assert.match(csv.suggestedFilename(),/\.csv$/);assert.ok((await fs.stat(await csv.path())).size>80);
  const jsonPromise=page.waitForEvent('download');await page.locator('#exportJson').click();const json=await jsonPromise;
  const saved=JSON.parse(await fs.readFile(await json.path(),'utf8'));
  assert.equal(saved.type,'SUPRA-SHEETS-v0.1');assert.equal(saved.cells.B7,'=SUM(B2:B5)');
  assert.deepEqual(errors,[]);
  await page.close();
 });
 await t.test('Present: goal applies 3 slides, editing persists, export is safe',async()=>{
  const page=await browser.newPage({acceptDownloads:true});page.on('dialog',d=>d.accept());const errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'office/present/');
  await page.locator('#applyRecipe').click();
  assert.equal(await page.evaluate(()=>SUPRAPresentTest.getSlides().length),3);
  assert.equal(await page.evaluate(()=>SUPRAPresentTest.getTheme()),'dark');
  await page.locator('#slideTitle').fill('<img src=x onerror=alert(1)>');
  await page.locator('#slideTitle').dispatchEvent('change');
  assert.equal(await page.locator('#previewTitle').innerText(),'<img src=x onerror=alert(1)>');
  const html=await page.evaluate(()=>SUPRAPresentTest.offlineHtml());
  assert.equal(html.includes('<img src=x onerror=alert(1)>'),false);
  assert.match(html,/ArrowRight/);
  const jsonPromise=page.waitForEvent('download');await page.locator('#exportJson').click();const json=await jsonPromise;
  const saved=JSON.parse(await fs.readFile(await json.path(),'utf8'));assert.equal(saved.slides.length,3);
  await page.reload();assert.equal(await page.evaluate(()=>SUPRAPresentTest.getSlides()[0].title),'<img src=x onerror=alert(1)>');
  await page.locator('#newSlide').click();assert.equal(await page.evaluate(()=>SUPRAPresentTest.getSlides().length),4);
  assert.deepEqual(errors,[]);await page.close();
 });
 await t.test('Writer: Visual Setup sets multiple real editor settings and can undo',async()=>{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.locator('#quickActionsBtn').waitFor();
  const initial=await page.evaluate(()=>SUPRAWriterTest.settings());
  await page.locator('#visualSetupBtn').click();
  assert.equal(await page.locator('#visualSetupModal').isVisible(),true);
  await page.locator('[data-goal="academic"]').click();
  await page.locator('#visualPaper').selectOption('a4');
  await page.locator('#visualDirection').selectOption('landscape');
  await page.locator('#visualText').selectOption('large');
  await page.locator('#visualSpacing').selectOption('roomy');
  assert.match(await page.locator('#visualCount').innerText(),/settings\/choices/);
  await page.locator('#visualApply').click();
  const settings=await page.evaluate(()=>SUPRAWriterTest.settings());
  assert.equal(settings.size,'a4');assert.equal(settings.orientation,'landscape');
  assert.equal(settings.line,1.95);assert.ok(settings.fontSize>initial.fontSize);
  assert.equal(await page.locator('#visualSetupModal').isVisible(),false);
  await page.locator('#revertLookQuick').click();
  const reverted=await page.evaluate(()=>SUPRAWriterTest.settings());assert.equal(reverted.line,initial.line);
  assert.deepEqual(errors,[]);await page.close();
 });
});