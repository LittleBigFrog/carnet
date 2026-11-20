const CACHE = 'carnet-v1';
const SHELL = ['manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? new Request(new URL('./', self.registration.scope)) : req;
  const net = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
    return res;
  });
  e.waitUntil(net.catch(() => {}));
  e.respondWith(caches.match(key, {ignoreSearch: true}).then(cached => {
    if (!cached) return net;
    const late = new Promise(r => setTimeout(() => r(cached), 4000));
    return Promise.race([net.catch(() => cached), late]);
  }));
});
