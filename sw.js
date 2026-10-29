/* SUPRA Writer offline shell; never caches user documents or uploads. MIT. */
const CACHE = 'supra-writer-shell-v0.6-alpha.1-office-offline';
const SHELL = ['./', './index.html', './styles.css', './app.js', './pwa.js', './quick-actions.js', './office/writer-assistant.js', './office/writer-assistant.css', './office/register.js', './office/history.js', './office/index.html', './office/shared.css', './office/sheets/index.html', './office/sheets/app.js', './office/present/index.html', './office/present/app.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './dist/SUPRA_Writer_v0.2_Standalone.html'];
const urls = SHELL.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(urls)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('supra-writer-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  // Directory URLs (/office/sheets/) correspond to cached index.html files.
  const canonical = url.pathname.endsWith('/') ? new URL('./index.html', url.href).href : url.href;
  const key = urls.includes(url.href) ? url.href : urls.includes(canonical) ? canonical :
    request.mode === 'navigate' ? new URL('./index.html', self.registration.scope).href : null;
  if (!key) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok && response.type === 'basic' && urls.includes(url.href)) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(url.href, copy)));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(request, {ignoreSearch:true}) || await caches.match(key);
    return cached || new Response('SUPRA Writer is offline and this page is not yet cached.', {status:503, headers:{'content-type':'text/plain'}});
  }));
});
