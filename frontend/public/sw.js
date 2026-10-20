// 앱 셸만 캐시해 홈 화면 앱이 빠르게 뜨도록 한다. API 응답(/api)은 항상 네트워크로 보낸다.
const CACHE = "book-archive-v1"
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/apple-touch-icon.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== "GET" || url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return

  // 페이지: 네트워크 우선, 오프라인이면 캐시된 셸
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put("/", copy))
          return res
        })
        .catch(() => caches.match("/")),
    )
    return
  }

  // 빌드 산출물(/assets/*)은 파일명에 해시가 있어 캐시 우선
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
            return res
          }),
      ),
    )
    return
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)))
})
