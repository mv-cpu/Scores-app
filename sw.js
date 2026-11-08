// status 150: keeps the offline viewer on the device. Songs are NOT here: they live in the app's own storage (IndexedDB).
// The page itself is fetched fresh whenever there is a connection (so an update shows the first time the app is opened
// online) and comes from the cache when offline; the big files (alphaTab, the sound bank, the font) come from the cache.
// Bump CACHE when those big files change.
const CACHE = "scores-v5";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png",
  "alphatab/alphaTab.min.js", "alphatab/soundfont/sonivox.sf2",
  "alphatab/font/Bravura.woff2", "alphatab/font/Bravura.woff"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => null))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const isPage = (req) => req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (isPage(req)) {                                       // network first: the newest app when online
    e.respondWith(fetch(req, { cache: "no-store" }).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok && new URL(req.url).origin === location.origin) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  })));
});
