/* KelasTKA+ SMP — service worker.
 * Strategi: berkas aplikasi dari cache lebih dulu (instan) lalu diperbarui di belakang layar (stale-while-revalidate),
 * config.js selalu dari jaringan bila bisa, permintaan ke Apps Script dan berkas paket soal TIDAK disentuh
 * (paket disimpan aplikasi di IndexedDB). Naikkan VERSI saat merilis pembaruan besar.
 */
const VERSI = 'ktka-smp-1.0.0';
const INTI = [
  './', './index.html', './manifest.json', './css/app.css?v=1.0.0', './js/config.js?v=1.0.0', './js/lib/render.js?v=1.0.0', './js/core.js?v=1.0.0',
  './js/pages/masuk.js?v=1.0.0', './js/pages/siswa.js?v=1.0.0', './js/pages/ujian.js?v=1.0.0', './js/pages/rapor.js?v=1.0.0',
  './js/pages/pengawas.js?v=1.0.0', './js/pages/guru.js?v=1.0.0', './js/pages/bank.js?v=1.0.0', './js/pages/laporan.js?v=1.0.0', './js/pages/admin.js?v=1.0.0', './js/pages/parametrik.js?v=1.0.0',
  './js/lib/katex/katex.min.css?v=1.0.0', './assets/logo-horizontal.webp', './assets/logo-bulat.webp', './assets/favicon.svg',
  './assets/icon-192.png', './assets/icon-512.png', './assets/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => Promise.all(INTI.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function swr(req) {
  const c = await caches.open(VERSI), hit = await c.match(req, { ignoreSearch: req.mode === 'navigate' });
  const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
  return hit || (await net) || (req.mode === 'navigate' ? c.match('./index.html') : Response.error());
}
async function jaringanDulu(req) {
  const c = await caches.open(VERSI);
  try {
    const r = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('lambat')), 3500))]);
    if (r && r.ok) c.put(req, r.clone());
    return r;
  } catch (e) { return (await c.match(req, { ignoreSearch: true })) || Response.error(); }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return;             // API: selalu langsung
  if (url.origin === location.origin) {
    if (/\/paket\//.test(url.pathname)) return;                                      // paket: ditangani aplikasi (IndexedDB)
    if (/\/js\/config\.js$/.test(url.pathname)) { e.respondWith(jaringanDulu(req)); return; }
    e.respondWith(swr(req));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(swr(req));
});
