import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png' };

async function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const name = decodeURIComponent(url.pathname) === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const file = path.resolve(root, name);
    if (!file.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
    try {const body = await fs.readFile(file); res.writeHead(200,{'content-type': types[path.extname(file)]||'application/octet-stream'});res.end(body);}
    catch {res.writeHead(404).end('Not Found');}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

test('SUPRA Writer: editor, presets, exports, mobile layout and PWA', { timeout: 120000 }, async t => {
  const { server, url } = await startServer();
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await chromium.launch({headless:true});
  t.after(() => browser.close());
  const context = await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, {waitUntil:'domcontentloaded'});

  await t.test('writing and one-click preset', async () => {
    assert.equal(await page.locator('#document').count(),1);
    await page.locator('[data-tab="advanced"]').click();
    await page.locator('#advancedPreset').selectOption('reading');
    await page.locator('#applyAdvanced').click();
    assert.ok(await page.evaluate(() => SUPRAWriterTest.settings().fontSize) > 0);
    await page.locator('#document').click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Automated SUPRA Writer test.');
    assert.ok((await page.locator('#document').innerText()).includes('Automated SUPRA Writer test.'));
  });

  await t.test('irony mark and Word document export', async () => {
    await page.locator('#insertIrony').click();
    assert.ok((await page.locator('#document').innerText()).includes('⸮'));
    await page.locator('#docName').fill('Automated SUPRA test');
    const promise = page.waitForEvent('download');
    await page.locator('#saveMenuBtn').click();
    await page.locator('[data-export="docx"]').click();
    const download = await promise;
    assert.match(download.suggestedFilename(), /\.docx$/);
    const temp = await download.path();
    assert.ok((await fs.stat(temp)).size>1000);
    await page.locator('#openFile').setInputFiles(temp);
    await page.waitForFunction(() => document.querySelector('#document')?.textContent.includes('Automated SUPRA Writer test.'),{timeout:10000});
  });

  await t.test('download standalone version', async () => {
    const anchor = page.locator('a.app-download');
    assert.equal(await anchor.count(),1);
    assert.match(await anchor.getAttribute('href'), /Standalone\.html$/);
    const downloadPromise = page.waitForEvent('download');
    await anchor.click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /\.html$/);
    assert.ok((await fs.stat(await download.path())).size > 80000);
  });

  await t.test('offline-ready manifest and service worker', async () => {
    const manifest = await page.evaluate(async () => (await fetch('./manifest.webmanifest')).json());
    assert.equal(manifest.short_name, 'SUPRA Writer');
    assert.ok(manifest.icons.some(icon => icon.sizes === '512x512'));
    assert.ok(await page.evaluate(async () => !!(await navigator.serviceWorker.ready).active));
  });

  await t.test('mobile viewport avoids horizontal overflow', async () => {
    await page.setViewportSize({width:390,height:844});
    const dims = await page.evaluate(() => ({scroll:document.body.scrollWidth,width:innerWidth}));
    assert.ok(dims.scroll <= dims.width + 2, JSON.stringify(dims));
  });
  assert.deepEqual(errors, []);
});
