const CACHE = "albs-v1";
const PRECACHE = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Network first for API calls, cache first for app shell
  const url = new URL(e.request.url);
  const isApi = url.hostname.includes("supabase") || url.hostname.includes("anthropic") || url.hostname.includes("fonts");

  if (isApi) {
    // Always go to network for API calls
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
        }).catch(() => caches.match("/index.html"));
      })
    );
  }
});
