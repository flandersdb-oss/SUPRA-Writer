import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Fast/Universal Writer preserve one document and safely handle Markdown', {timeout:120000},async t=>{
 const server=http.createServer(async(req,res)=>{
  const n=new URL(req.url,'http://localhost').pathname;
  const filename=path.resolve(root,'.'+(n.endsWith('/')?n+'index.html':n));
  if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const bytes=await fs.readFile(filename),ext=path.extname(filename);res.setHeader('content-type',ext==='.js'?'text/javascript':ext==='.css'?'text/css':'text/html');res.end(bytes);}
  catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
 const page=await browser.newPage({acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.locator('#supraFastMode').waitFor();
 assert.equal(await page.evaluate(()=>SUPRAWriterUniversal.mode()),'fast');
 assert.equal(await page.evaluate(()=>SUPRAWriterUniversal.formats().length),12);
 await page.locator('#document').fill('My work remains unchanged.');
 await page.locator('#saveNowBtn').click();
 await page.locator('#supraUniversalMode').click();
 assert.equal(await page.evaluate(()=>SUPRAWriterUniversal.mode()),'universal');
 assert.equal(await page.locator('#supraFormatsOverlay').isVisible(),true);
 assert.match(await page.locator('#supraFormatRows').innerText(),/ODF/);
 await page.locator('#supraCloseFormats').click();
 assert.match(await page.locator('#document').innerText(),/My work remains unchanged/);
 const markdown='# First heading\n\nA **bold** line\n\n- One\n- Two\n\n<script>alert("NO")</script>';
 const html=await page.evaluate(m=>SUPRAWriterUniversal.markdownToHtml(m),markdown);
 assert.match(html,/<h1>First heading<\/h1>/);
 assert.match(html,/<strong>bold<\/strong>/);
 assert.ok(!html.includes('<script>'));
 const raw=await page.evaluate(()=>SUPRAWriterUniversal.htmlToMarkdown(document.getElementById('document')));
 assert.match(raw,/My work remains unchanged/);
 // Open the new .md format through the actual Editor input handler.
 await page.locator('#openFile').setInputFiles({name:'example.md',mimeType:'text/markdown',buffer:Buffer.from(markdown)});
 await page.waitForFunction(()=>document.getElementById('document')?.innerText.includes('First heading'));
 assert.match(await page.locator('#document').innerText(),/First heading/);
 const download=page.waitForEvent('download');
 await page.locator('#saveMenuBtn').click();await page.locator('[data-export="md"]').click();
 const asset=await download;
 assert.match(asset.suggestedFilename(),/\.md$/);
 const actual=await fs.readFile(await asset.path(),'utf8');
 assert.match(actual,/# First heading/);
 assert.match(actual,/\*\*bold\*\*/);
 await page.locator('#supraFastMode').click();
 assert.equal(await page.evaluate(()=>SUPRAWriterUniversal.mode()),'fast');
 assert.match(await page.locator('#document').innerText(),/First heading/);
 await page.reload();
 assert.equal(await page.evaluate(()=>SUPRAWriterUniversal.mode()),'fast');
 assert.match(await page.locator('#document').innerText(),/First heading/);
 assert.deepEqual(errors,[]);
});
test('Desktop allowlist recognizes Markdown, not unsupported Office formats',async()=>{
 const src=await fs.readFile(path.join(root,'desktop/main.cjs'),'utf8');
 assert.match(src,/\.md/);
 assert.match(src,/\.markdown/);
 assert.doesNotMatch(src,/ALLOWED_EXTENSIONS = new Set\(\[[^\]]*'\.odt'/);
});
