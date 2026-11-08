// status 150: keeps the offline viewer on the device. Songs are NOT here: they live in the app's own storage (IndexedDB).
// Bump CACHE when the app changes, so the iPad picks up the new version the next time it is online.
const CACHE = "scores-v3";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png",
  "alphatab/alphaTab.min.js", "alphatab/soundfont/sonivox.sf2",
  "alphatab/font/Bravura.woff2", "alphatab/font/Bravura.woff"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok && new URL(e.request.url).origin === location.origin) {
      const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy));
    }
    return r;
  })));
});
