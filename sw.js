// sw.js

const CACHE_NAME = "pesosave-cache-v1";

const APP_SHELL = [
  "/",               // root
  "/index.html",
  "/favicon.png",
  "/manifest.webmanifest",
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        // Some CDNs may block opaque requests; ignore individual failures
        console.warn("SW: cache addAll error (some assets may not be cached):", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches if you bump CACHE_NAME
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for app shell; network for others
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Try cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          // Optionally cache new GET responses from same origin
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            request.url.startsWith(self.location.origin)
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback: you could return a custom offline page here
          return new Response(
            "You appear to be offline. PesoSave may not be fully functional.",
            { status: 503, statusText: "Service Unavailable" }
          );
        });
    })
  );
});
