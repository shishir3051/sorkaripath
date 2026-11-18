const CACHE_VERSION = "sorkaripath-shell-v3";
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/pwa-icon/192x192.png",
  "/pwa-icon/512x512.png",
  "/pwa-icon/maskable-192x192.png",
  "/pwa-icon/maskable-512x512.png",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_URLS.map((url) => cache.add(url).catch(() => {}))
        )
      )
      .catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1"
  ) {
    return;
  }

  // Network-first strategy so live circulars, study banks & SSR updates stay fresh,
  // with cached fallback when offline or experiencing flaky mobile connectivity.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches
            .open(CACHE_VERSION)
            .then((cache) => cache.put(request, clone))
            .catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;
        }
        return Response.error();
      })
  );
});
