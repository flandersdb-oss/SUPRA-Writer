import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function startServer(){
 const server=http.createServer(async(req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^[/]+/, '')||'index.html';
  const target=path.resolve(root,name);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const body=await fs.readFile(target);const ext=path.extname(target);res.writeHead(200,{'content-type':ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.png'?'image/png':'text/html'});res.end(body);}
  catch{res.writeHead(404).end();}
 });
 return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/'})));
}
test('manual page breaks survive DOCX export/import and browser draft storage',{timeout:120000},async t=>{
 const {server,url}=await startServer();t.after(()=>new Promise(r=>server.close(r)));
 const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
 const page=await browser.newPage({acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
 await page.locator('#document').fill('Before the page break');
 await page.locator('#document').click();await page.keyboard.press('Control+End');await page.keyboard.press('Control+Enter');
 assert.equal(await page.locator('#document [data-supra-page-break="true"]').count(),1);
 assert.ok((await page.evaluate(()=>SUPRAQuickActions.ids())).includes('new-page'));
 await page.keyboard.type('After the page break');
 const pending=page.waitForEvent('download');await page.locator('#saveMenuBtn').click();await page.locator('[data-export="docx"]').click();
 const download=await pending;const temp=await download.path();const bytes=await fs.readFile(temp);assert.ok(bytes.length>1000);
 const xml=await page.evaluate(async data=>{const parts=await SUPRAWriterTest.unzipFiles(new Blob([new Uint8Array(data)]));return parts['word/document.xml'];},[...bytes]);
 assert.match(xml,/<w:br w:type="page"\/>/);
 await page.locator('#openFile').setInputFiles(temp);
 await page.waitForFunction(()=>document.querySelector('#document [data-supra-page-break="true"]'));
 assert.equal(await page.locator('#document [data-supra-page-break="true"]').count(),1);
 assert.ok((await page.locator('#document').innerText()).includes('Before the page break'));
 assert.ok((await page.locator('#document').innerText()).includes('After the page break'));
 await page.waitForTimeout(850);await page.reload();
 assert.equal(await page.locator('#document [data-supra-page-break="true"]').count(),1);
 assert.deepEqual(errors,[]);
});
