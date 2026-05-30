const CACHE_VERSION = 'kaivo-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`

const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
]

// Install: precache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('kaivo-') && k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch strategy:
// - API routes: network-only (no caching)
// - Navigation (HTML pages): network-first, fall back to cache
// - Static assets (_next/static): cache-first
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API routes: always hit the network
  if (url.pathname.startsWith('/api/')) return

  // Next.js static assets: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone))
            }
            return res
          })
      )
    )
    return
  }

  // Navigation / page requests: network-first
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone))
          }
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kaivo', {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        const existing = list.find((c) => c.url.includes(self.location.origin))
        if (existing) {
          existing.focus()
          existing.navigate(target)
        } else {
          clients.openWindow(target)
        }
      })
  )
})
