const CACHE_NAME = 'kb-app-cache-v2'
const CORE_ASSETS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

function shouldCacheResponse(request, response) {
  if (!response || !response.ok) return false
  const ct = response.headers.get('content-type') || ''
  // Avoid caching HTML as response for JS/CSS assets due to SPA rewrites
  if ((request.destination === 'script' || request.destination === 'style') && ct.includes('text/html')) return false
  return true
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  // Navigation requests: network-first with fallback to cached index
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          if (shouldCacheResponse(request, fresh)) caches.open(CACHE_NAME).then(c => c.put(request, fresh.clone()))
          return fresh
        } catch (e) {
          const fallback = await caches.match('/index.html')
          return fallback || new Response('', { status: 503 })
        }
      })()
    )
    return
  }

  // Assets: network-first, fallback to cache; only cache valid asset responses
  if (request.url.includes('/assets/')) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          if (shouldCacheResponse(request, fresh)) caches.open(CACHE_NAME).then(c => c.put(request, fresh.clone()))
          return fresh
        } catch (e) {
          const cached = await caches.match(request)
          return cached || new Response('', { status: 504 })
        }
      })()
    )
    return
  }

  // Default: cache-first, then network
  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      try {
        const fresh = await fetch(request)
        if (shouldCacheResponse(request, fresh)) caches.open(CACHE_NAME).then(c => c.put(request, fresh.clone()))
        return fresh
      } catch (e) {
        return new Response('', { status: 504 })
      }
    })()
  )
})


