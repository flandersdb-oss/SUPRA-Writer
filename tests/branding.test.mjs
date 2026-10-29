import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p));
const pkg=JSON.parse(read('package.json').toString());
const manifest=JSON.parse(read('manifest.webmanifest').toString());
test('alpha version and actual Windows icon file',()=>{
 assert.equal(pkg.version,'0.6.0-alpha.1');
 assert.equal(pkg.build.win.icon,'build/icon.ico');
 const ico=read('build/icon.ico');
 assert.equal(ico.readUInt16LE(2),1); // Windows ICO header
 assert.ok(ico.length>3000);
});
test('PWA icons exist, are PNG, and have correct size',()=>{
 for(const item of manifest.icons){
  const buf=read(item.src);
  assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  const size=Number(item.sizes.split('x')[0]);
  assert.equal(buf.readUInt32BE(16),size);
  assert.equal(buf.readUInt32BE(20),size);
 }
 assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
});
test('website header uses same icon identity',()=>{
 const html=read('index.html').toString();
 assert.match(html,/class="brand-icon"/);
 assert.match(html,/src="icons\/icon-192.png"/);
 const cacheSource=read('sw.js').toString();
 const version=pkg.version.match(/^(\d+\.\d+)\.\d+-(alpha\.\d+)$/);
 assert.ok(version,'Staged alpha uses semantic prerelease version');
 const expectedPrefix='supra-writer-shell-v'+version[1]+'-'+version[2];
 const cacheMatch=cacheSource.match(/const CACHE = '([^']+)'/);
 assert.ok(cacheMatch,'Offline cache name exists');
 assert.ok(cacheMatch[1]===expectedPrefix || cacheMatch[1].startsWith(expectedPrefix+'-'),
   'Offline cache version matches the application release: '+pkg.version);
 for (const file of ['index.html','app.js','styles.css','pwa.js','quick-actions.js']) {
   assert.ok(cacheSource.includes("'./"+file+"'"),'Offline shell caches '+file);
 }
});
