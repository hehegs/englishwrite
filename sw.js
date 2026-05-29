// 서비스 워커: 앱 셸을 캐시하여 오프라인에서도 동작하게 한다.
const CACHE = "englishwrite-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/words.js",
  "./js/speech.js",
  "./js/handwriting.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 네트워크 우선: 온라인이면 항상 최신 파일을 받아 캐시를 갱신하고,
// 오프라인일 때만 캐시한 버전을 보여준다(업데이트가 새로고침만으로 즉시 반영됨).
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
