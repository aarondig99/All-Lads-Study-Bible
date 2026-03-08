const CACHE = "albs-v3";
const BASE = "/All-Lads-Study-Bible/";
const PRECACHE = [BASE, BASE + "index.html", BASE + "manifest.json", BASE + "icon-192.png", BASE + "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  const isExternal = url.hostname.includes("supabase") ||
                     url.hostname.includes("api.bible") ||
                     url.hostname.includes("bible-api") ||
                     url.hostname.includes("fonts.googleapis") ||
                     url.hostname.includes("cdnjs");

  if (isExternal) {
    // Network only for external APIs
    e.respondWith(fetch(e.request).catch(() => new Response("", { status: 503 })));
  } else {
    // Cache first for app shell
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return response;
        }).catch(() => caches.match(BASE + "index.html"));
      })
    );
  }
});
