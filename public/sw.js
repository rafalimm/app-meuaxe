/* Meu Axé — service worker conservador.
   Estratégia: cache-first APENAS para ativos de marca (ícones e manifest).
   Nenhum dado pessoal, anotação, API ou página autenticada é cacheado,
   evitando vazamento entre usuários do mesmo dispositivo. */

const CACHE = "meu-axe-brand-v1";
const BRAND_ASSETS = ["/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(BRAND_ASSETS)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isBrand = BRAND_ASSETS.includes(url.pathname);
  if (!isBrand) return; // deixa passar direto para a rede — sem cache de conteúdo

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      });
    }),
  );
});
