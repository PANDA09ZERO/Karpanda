/* Karpanda PWA service worker */
const APP_VERSION = "1.1.0";
const CACHE_NAME = "karpanda-cache-" + APP_VERSION;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("karpanda-cache-") && key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Never persist third-party responses, authentication, or private report data.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/"))
    return;

  if (request.mode === "navigate") {
    const publicPage =
      [
        "/",
        "/servicios",
        "/como-funciona",
        "/terminos",
        "/demos",
        "/demo/ventas",
        "/demo/reservas",
      ].includes(url.pathname) || /^\/producto\/[a-z0-9-]+$/.test(url.pathname);
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          if (publicPage)
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          return response;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  if (
    !["/assets/", "/icons/"].some((prefix) =>
      url.pathname.startsWith(prefix),
    ) &&
    !["/manifest.webmanifest", "/favicon.ico"].includes(url.pathname)
  )
    return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type === "opaque"
          ) {
            return response;
          }
          const copy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
          return response;
        })
        .catch(() => cached);
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
