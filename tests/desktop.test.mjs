import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const main=fs.readFileSync(path.join(root,'desktop/main.cjs'),'utf8');
const preload=fs.readFileSync(path.join(root,'desktop/preload.cjs'),'utf8');
const renderer=fs.readFileSync(path.join(root,'app.js'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
test('desktop host is sandboxed and context isolated',()=>{
 assert.match(main,/contextIsolation:true,sandbox:true,webSecurity:true/);
 assert.match(main,/nodeIntegration:false/);
 assert.match(main,/setPermissionRequestHandler/);
 assert.match(main,/targetWindow\(event\)/);
 assert.doesNotMatch(main,/eval\(/);
});
test('preload exposes only specific document actions',()=>{
 assert.match(preload,/contextBridge\.exposeInMainWorld\('SUPRADesktop'/);
 assert.match(preload,/document:open/);assert.match(preload,/document:save/);
 assert.match(preload,/document:pdf/);
 assert.doesNotMatch(preload,/require\('node:fs'\)/);
});
test('DOCX, HTML, TXT native save and Web editor coexist',()=>{
 assert.match(renderer,/async function openFromWindows/);
 assert.match(renderer,/window\.SUPRADesktop\.saveDocument/);
 assert.match(main,/MAX_BYTES = 25 \* 1024 \* 1024/);
 assert.match(main,/\.docx/);assert.match(main,/\.html/);assert.match(main,/\.txt/);
});
test('installer and portable targets configured',()=>{
 assert.equal(pkg.main,'desktop/main.cjs');
 assert.deepEqual(pkg.build.win.target[0].arch,['x64']);
 assert.deepEqual(pkg.build.win.target.map(x=>x.target),['nsis','portable']);
 assert.ok(fs.statSync(path.join(root,'build/icon.ico')).size>1000);
});

test('find-and-replace menu and controls exist',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/id="findBar"/);assert.match(html,/id="replaceAll"/);
 assert.match(renderer,/function replaceEveryMatch/);
 assert.match(main,/sendCommand\('replace'\)/);
});
