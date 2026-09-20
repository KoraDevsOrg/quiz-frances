const CACHE_NAME = "kora-francais-cache-v1.0";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./manifest.json",
  "./js/app.js",
  "./js/data/words.js",
  "./js/services/storage.js",
  "./js/services/audio.js",
  "./js/modules/quiz.js",
  "./js/modules/wordsearch.js",
  "./js/modules/memory.js",
  "./js/modules/scramble.js",
  "./js/modules/timeattack.js",
  "./js/modules/achievements.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
