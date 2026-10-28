import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Quick Actions: plain-language single-click workflow and Ctrl+K', {timeout:120000},async t=>{
 const server=http.createServer(async(req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  const target=path.resolve(root,name==='/'?'index.html':'.'+name);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const body=await fs.readFile(target);res.setHeader('content-type',path.extname(target)==='.js'?'text/javascript':path.extname(target)==='.css'?'text/css':'text/html');res.end(body);}catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 await page.locator('#quickActionsBtn').waitFor({timeout:10000});
 assert.ok((await page.evaluate(()=>SUPRAQuickActions.ids())).length>=15);
 const initial=await page.evaluate(()=>SUPRAWriterTest.settings().line);
 await page.locator('[data-quick-action="academic"]').click();
 assert.equal(await page.evaluate(()=>SUPRAWriterTest.settings().line),2);
 await page.locator('#revertLookQuick').click();
 assert.equal(await page.evaluate(()=>SUPRAWriterTest.settings().line),initial);
 await page.keyboard.press('Control+k');
 assert.equal(await page.locator('#quickActionsModal').isVisible(),true);
 await page.locator('#supraFastSearch').fill('replace');
 await page.keyboard.press('Enter');
 assert.equal(await page.locator('#findBar').isVisible(),true);
 assert.equal(await page.locator('#replaceText').isVisible(),true);
 await page.keyboard.press('Control+k');
 await page.locator('#supraFastSearch').fill('ready to print');
 await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>SUPRAWriterTest.settings().color),'#000000');
 assert.equal(await page.evaluate(()=>SUPRAWriterTest.settings().size),'letter');
 await page.keyboard.press('Control+k');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#quickActionsModal').isVisible(),false);
 assert.deepEqual(errors,[]);
});
