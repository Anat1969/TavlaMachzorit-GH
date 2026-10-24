// Pages from the network (fresh code), assets from cache (fast, offline).
const CACHE = 'tavla-v1'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')))
    return
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    const copy = res.clone()
    caches.open(CACHE).then((c) => c.put(req, copy))
    return res
  })))
})
