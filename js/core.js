/* KelasTKA+ SMP — inti aplikasi: API, penyimpanan, brankas paket, router, komponen UI, Excel, grafik, cetak. */
(function () {
  'use strict';
  const VERSI = '1.0.0', API_V = 1;
  const CFG = window.KTKA_CONFIG || {};
  const App = window.App = { VERSI, hal: {}, modulMuat: {} };

  // =========================================================== utilitas
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  class Aman { constructor(s) { this.s = s; } toString() { return this.s; } }
  const isi = v => v == null || v === false ? '' : v instanceof Aman ? v.s : Array.isArray(v) ? v.map(isi).join('') : esc(v);
  const h = (str, ...vals) => { let o = str[0]; vals.forEach((v, i) => { o += isi(v) + str[i + 1]; }); return new Aman(o); };
  const raw = s => new Aman(String(s == null ? '' : s));
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const tidur = ms => new Promise(r => setTimeout(r, ms));
  const tunda = (fn, ms) => { let t; return function () { clearTimeout(t); const a = arguments; t = setTimeout(() => fn.apply(this, a), ms); }; };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2));
  const angka2 = v => v == null || v === '' || isNaN(v) ? '–' : Number(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const angka = (v, d) => v == null || isNaN(v) ? '–' : Number(v).toLocaleString('id-ID', { maximumFractionDigits: d == null ? 1 : d });
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const BULAN_P = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dua = n => ('0' + n).slice(-2);
  const jam = ms => { if (!ms) return '–'; const d = new Date(ms); return dua(d.getHours()) + '.' + dua(d.getMinutes()); };
  const tgl = ms => { if (!ms) return '–'; const d = new Date(ms); return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear(); };
  const tglPanjang = ms => { const d = new Date(ms || Date.now()); return d.getDate() + ' ' + BULAN_P[d.getMonth()] + ' ' + d.getFullYear(); };
  const tglJam = ms => ms ? HARI[new Date(ms).getDay()].slice(0, 3) + ', ' + tgl(ms) + ' · ' + jam(ms) : '–';
  const durasi = det => { det = Math.max(0, Math.round(det || 0)); const j = Math.floor(det / 3600), m = Math.floor(det % 3600 / 60), s = det % 60; return (j ? j + ':' + dua(m) : m) + ':' + dua(s); };
  const durasiKata = det => { det = Math.round(det || 0); const m = Math.floor(det / 60), s = det % 60; return m ? m + ' mnt ' + (s ? s + ' dtk' : '') : s + ' dtk'; };
  const lalu = ms => { if (!ms) return '–'; const s = Math.round((App.kini() - ms) / 1000); if (s < 60) return s + ' dtk lalu'; if (s < 3600) return Math.floor(s / 60) + ' mnt lalu'; if (s < 86400) return Math.floor(s / 3600) + ' jam lalu'; return tgl(ms); };
  const keInputWaktu = ms => { const d = new Date(ms); return d.getFullYear() + '-' + dua(d.getMonth() + 1) + '-' + dua(d.getDate()) + 'T' + dua(d.getHours()) + ':' + dua(d.getMinutes()); };
  const inisial = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0] || '').join('').toUpperCase();
  const MAPEL = { MAT: 'Matematika', BIN: 'Bahasa Indonesia' };
  /** Label sumbu pendek: "Try Out 2 Matematika" → "TO 2". */
  App.labelPendek = n => String(n || '').replace(/Try\s*Out/i, 'TO').replace(/Matematika|Bahasa Indonesia|-/gi, '').replace(/\s+/g, ' ').trim().slice(0, 12);
  /** PRNG berbenih (mulberry32) — urutan acak soal sama untuk siswa yang sama di sesi yang sama. */
  const acakBenih = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const kocok = (arr, rnd) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const hashStr = s => { let x = 5381; s = String(s); for (let i = 0; i < s.length; i++) x = (x * 33) ^ s.charCodeAt(i); return (x >>> 0).toString(36); };
  Object.assign(App, { esc, h, raw, $, $$, tidur, tunda, uuid, angka, angka2, jam, tgl, tglPanjang, tglJam, durasi, durasiKata, lalu, keInputWaktu, inisial, MAPEL, acakBenih, kocok, hashStr, BULAN_P, HARI });

  // =========================================================== ikon (SVG garis)
  const P = {
    rumah: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
    buku: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 19.5V4.5M20 19v3H6.5',
    grafik: 'M3 3v18h18M7 15l4-4 3 3 5-6',
    batang: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    piala: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
    jam: 'M12 7v5l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    kunci: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z',
    buka: 'M7 11V7a5 5 0 0 1 9.9-1M5 11h14v10H5z',
    keluar: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    pengguna: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
    grup: 'M16 21a6 6 0 0 0-12 0M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21a6 6 0 0 0-4-5.6M16 3.2a4 4 0 0 1 0 7.6',
    kalender: 'M3 6h18v15H3zM3 10h18M8 3v4M16 3v4',
    cetak: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
    unduh: 'M12 3v12M7 10l5 5 5-5M4 21h16',
    unggah: 'M12 21V9M7 14l5-5 5 5M4 3h16',
    tambah: 'M12 5v14M5 12h14',
    edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
    hapus: 'M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15',
    cari: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    centang: 'M4 12.5 9 17.5 20 6.5',
    silang: 'M6 6l12 12M18 6 6 18',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-5M12 8h.01',
    awas: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    kiri: 'M15 18l-6-6 6-6',
    kanan: 'M9 18l6-6-6-6',
    menu: 'M4 6h16M4 12h16M4 18h16',
    bendera: 'M4 22V4M4 4h12l-2 4 2 4H4',
    wifi: 'M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0M12 20h.01',
    wifimati: 'M2 2l20 20M8.5 16a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 4.2-2.4M16.7 10.6a10 10 0 0 1 2.3 1.9M12 20h.01',
    mata: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    salin: 'M9 9h11v11H9zM5 15H4V4h11v1',
    segar: 'M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5',
    kilau: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
    dokumen: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6',
    basis: 'M12 8c5 0 8-1.3 8-3s-3-3-8-3-8 1.3-8 3 3 3 8 3zM4 5v14c0 1.7 3 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3 3 8 3s8-1.3 8-3',
    roda: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    monitor: 'M2 4h20v13H2zM8 21h8M12 17v4',
    penuh: 'M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3',
    kirim: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    perisai: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    lampu: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z',
    target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    tumpuk: 'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    kotak: 'M4 4h16v16H4z',
    titik3: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    hp: 'M7 2h10v20H7zM11 18h2',
    petir: 'M13 2 3 14h9l-1 8 10-12h-9z',
    gambar: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
    tanda: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'
  };
  const ikon = (n, cls) => raw('<svg class="ik ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (P[n] || P.info) + '"/></svg>');
  App.ikon = ikon;

  // =========================================================== penyimpanan lokal
  const LS = {
    get(k, def) { try { const v = localStorage.getItem('ktka_' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem('ktka_' + k, JSON.stringify(v)); } catch (e) { /* penuh/diblokir */ } },
    del(k) { try { localStorage.removeItem('ktka_' + k); } catch (e) { /* abaikan */ } }
  };
  const IDB = {
    _db: null,
    buka() {
      if (this._db) return this._db;
      this._db = new Promise((res, rej) => {
        if (!window.indexedDB) return rej(new Error('IndexedDB tidak tersedia'));
        const r = indexedDB.open('kelastka', 1);
        r.onupgradeneeded = () => { r.result.createObjectStore('kv'); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
      return this._db;
    },
    async op(mode, fn) {
      try {
        const db = await this.buka();
        return await new Promise((res, rej) => { const tx = db.transaction('kv', mode), st = tx.objectStore('kv'), q = fn(st); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); });
      } catch (e) { console.warn('IDB', e); return undefined; }
    },
    get(k) { return this.op('readonly', st => st.get(k)); },
    set(k, v) { return this.op('readwrite', st => st.put(v, k)); },
    del(k) { return this.op('readwrite', st => st.delete(k)); },
    async kunci() { return (await this.op('readonly', st => st.getAllKeys())) || []; }
  };
  App.LS = LS; App.IDB = IDB;

  // =========================================================== sesi pengguna
  const Sesi = App.Sesi = {
    data: LS.get('sesi', null),
    get token() { return this.data && this.data.token; },
    get me() { return this.data && this.data.me; },
    get peran() { return this.data && this.data.me ? this.data.me.r : ''; },
    aktif() { return !!(this.data && this.data.token && this.data.exp > Date.now()); },
    simpan(token, me) { this.data = { token, me, exp: Date.now() + 11.5 * 3600e3 }; LS.set('sesi', this.data); },
    hapus() { this.data = null; LS.del('sesi'); Data.kosongkan(); }
  };
  App.perangkat = LS.get('dev') || (() => { const d = uuid(); LS.set('dev', d); return d; })();

  // =========================================================== API ke Apps Script
  class GalatApi extends Error { constructor(msg, kode, data) { super(msg); this.kode = kode; this.data = data; } }
  App.GalatApi = GalatApi;
  let selisihServer = LS.get('selisih', 0), epochTulis = 0;
  const inflight = {};
  App.kini = () => Date.now() + selisihServer;
  const urlSiap = () => !!CFG.GAS_URL && (/^https:\/\/script\.google(usercontent)?\.com\//.test(CFG.GAS_URL) || (CFG.UJI === true && /^http:\/\/(localhost|127\.0\.0\.1)[:\/]/.test(CFG.GAS_URL))) && !/GANTI|XXXX/.test(CFG.GAS_URL);
  App.urlSiap = urlSiap;
  const BACA = /^(app\.konfig|siswa\.beranda|ujian\.status|siswa\.hasil|latihan\.sumber|paket\.unduh|pengawas\.(sesi|pantau|log)|guru\.dasbor|paket\.(daftar|kunciGuru|konten)|kegiatan\.daftar|laporan\.|bank\.(daftar|ambil)|ai\.status|set\.ambil|siswa\.(daftar|kartu)|guru\.daftar|cadangan\.daftar|audit\.daftar|sistem\.status)/;

  async function kirimMentah(a, d, opsi) {
    if (!urlSiap()) throw new GalatApi('Alamat server belum diatur. Isi GAS_URL di js/config.js.', 'KONFIG');
    if (!navigator.onLine) throw new GalatApi('Perangkat sedang offline.', 'JARINGAN');
    const ctrl = new AbortController(), batas = (opsi && opsi.batas) || 45000;
    const tm = setTimeout(() => ctrl.abort(), batas);
    const t0 = performance.now();
    let res;
    try {
      const r = await fetch(CFG.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ a, t: Sesi.token || '', d: d || {}, v: API_V }), signal: ctrl.signal, redirect: 'follow', cache: 'no-store' });
      if (!r.ok) throw new GalatApi('Server sibuk (' + r.status + '). Coba lagi sebentar.', 'HTTP');
      res = await r.json();
    } catch (e) {
      if (e instanceof GalatApi) throw e;
      throw new GalatApi(e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi.', 'JARINGAN');
    } finally { clearTimeout(tm); }
    const rtt = performance.now() - t0;
    if (res.st && rtt < 8000) { selisihServer = Math.round(res.st - rtt / 2 - Date.now()); LS.set('selisih', selisihServer); }
    if (window.KTKA_DEBUG) console.log('[api]', a, Math.round(rtt) + ' ms', 'server ' + res.ms + ' ms');
    return res;
  }
  function periksa(res) {
    if (res.ok) return res.data;
    const e = res.error || {};
    if (e.code === 'SESI') { setTimeout(() => { Sesi.hapus(); toast('Sesi berakhir. Silakan masuk kembali.', 'warn'); App.ke('masuk'); }, 0); }
    if (e.code === 'VERSI') setTimeout(() => modal({ judul: 'Pembaruan tersedia', isi: h`<p>${e.msg}</p>`, aksi: [{ label: 'Muat ulang', kelas: 'emas', nilai: 1 }] }).then(() => location.reload()), 0);
    throw new GalatApi(e.msg || 'Terjadi kesalahan.', e.code || 'GAGAL', res.data);
  }
  /** Panggil satu aksi. Aksi baca identik yang sedang berjalan digabung; aksi tulis menaikkan epoch. */
  async function api(a, d, opsi) {
    opsi = opsi || {};
    if (!BACA.test(a)) { epochTulis++; const r = await kirimMentah(a, d, opsi); const out = periksa(r); if (r.pesan && opsi.pesan !== false) toast(r.pesan, 'ok'); return out; }
    const k = epochTulis + '|' + a + '|' + JSON.stringify(d || {});
    if (inflight[k]) return inflight[k];
    const p = (async () => {
      try { return periksa(await kirimMentah(a, d, opsi)); }
      catch (e) { if (e.kode === 'JARINGAN' && !opsi.tanpaUlang && navigator.onLine) { await tidur(1200); return periksa(await kirimMentah(a, d, opsi)); } throw e; }
    })();
    inflight[k] = p; p.then(() => delete inflight[k], () => delete inflight[k]);
    return p;
  }
  /** Penggabung otomatis: aksi baca yang dipanggil pada tik yang sama dikirim dalam satu eksekusi 'batch'. */
  const Antre = { q: null };
  function apiQ(a, d) {
    return new Promise((res, rej) => {
      if (!Antre.q) { Antre.q = []; setTimeout(flushAntre, 0); }
      Antre.q.push({ a, d: d || {}, res, rej });
    });
  }
  async function flushAntre() {
    const q = Antre.q; Antre.q = null;
    if (q.length === 1) return api(q[0].a, q[0].d).then(q[0].res, q[0].rej);
    for (let i = 0; i < q.length; i += 10) {
      const part = q.slice(i, i + 10);
      try {
        const r = await kirimMentah('batch', { calls: part.map(x => ({ a: x.a, d: x.d })) });
        const arr = periksa(r);
        part.forEach((x, j) => { try { x.res(periksa(arr[j])); } catch (e) { x.rej(e); } });
      } catch (e) { part.forEach(x => x.rej(e)); }
    }
  }
  App.api = api; App.apiQ = apiQ;
  /** Memanaskan server (tanpa data) agar permintaan pertama tidak menunggu "cold start". */
  App.panaskan = scope => {
    if (!urlSiap()) return;
    const k = 'warm_' + scope, t = Number(sessionStorage.getItem(k) || 0);
    if (Date.now() - t < 240000) return;
    try { sessionStorage.setItem(k, String(Date.now())); } catch (e) { /* abaikan */ }
    fetch(CFG.GAS_URL + '?w=' + encodeURIComponent(scope), { mode: 'no-cors' }).catch(() => {});
  };

  // =========================================================== data dengan SWR (tampil dari cache dulu, segarkan di belakang)
  const Data = App.Data = {
    mem: {},
    kunci(a, d) { return (Sesi.me ? Sesi.me.u : 'anon') + '|' + a + '|' + JSON.stringify(d || {}); },
    baca(a, d) { const k = this.kunci(a, d); return this.mem[k] || LS.get('c|' + k, null); },
    tulis(a, d, v) { const k = this.kunci(a, d), o = { t: Date.now(), v, hs: hashStr(JSON.stringify(v)) }; this.mem[k] = o; if (!d || !d._tanpaLS) LS.set('c|' + k, o); return o; },
    basi(pola) { Object.keys(this.mem).forEach(k => { if (!pola || k.indexOf(pola) >= 0) this.mem[k].t = 0; }); },
    kosongkan() { this.mem = {}; try { Object.keys(localStorage).filter(k => k.indexOf('ktka_c|') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { /* abaikan */ } }
  };
  /** ambil(aksi, data, render, {segar: ms}) → render(cache) segera bila ada, lalu render(baru) bila berubah. */
  App.ambil = async function (a, d, render, opsi) {
    opsi = opsi || {};
    const c = Data.baca(a, d), segar = opsi.segar == null ? 20000 : opsi.segar;
    if (c && render) { try { render(c.v, true); } catch (e) { console.error(e); } }
    if (c && Date.now() - c.t < segar && !opsi.paksa) return c.v;
    try {
      const v = await (opsi.langsung ? api(a, d) : apiQ(a, d));
      const o = Data.tulis(a, d, v);
      if (render && (!c || c.hs !== o.hs)) render(v, false);
      return v;
    } catch (e) {
      if (!c) throw e;
      if (e.kode !== 'JARINGAN') toast(e.message, 'err');
      return c.v;
    }
  };

  // =========================================================== brankas & paket soal
  const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
  const keB64 = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const Brankas = App.Brankas = {
    async buka(enc, kunciB64) {
      if (!window.crypto || !crypto.subtle) throw new Error('Peramban ini tidak mendukung enkripsi. Gunakan Chrome/Edge/Safari terbaru melalui https.');
      const key = await crypto.subtle.importKey('raw', b64(kunciB64), 'AES-GCM', false, ['decrypt']);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(enc.iv), additionalData: new TextEncoder().encode(enc.id + '|' + enc.bagian) }, key, b64(enc.ct));
      return JSON.parse(new TextDecoder().decode(pt));
    },
    async kunci(obj, id, bagian) {
      const raw = crypto.getRandomValues(new Uint8Array(32)), iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(id + '|' + bagian) }, key, new TextEncoder().encode(JSON.stringify(obj)));
      return { berkas: { v: 1, id, bagian, alg: 'A256GCM', iv: keB64(iv), ct: keB64(ct) }, kunci: keB64(raw) };
    }
  };
  const Paket = App.Paket = {
    terbuka: {},
    /** Unduh berkas terenkripsi (sekali per versi, disimpan di IndexedDB). */
    async unduh(p, bagian, onProgres) {
      bagian = bagian || 'isi';
      const k = 'pk|' + p.id + '|' + bagian + '|' + (p.versi || 1);
      let enc = await IDB.get(k);
      if (enc) return enc;
      if (p.asal === 'resmi' || /^paket\//.test(p['url_' + bagian] || '')) {
        const url = './paket/' + p.id + '.' + bagian + '.json?v=' + (p.versi || 1);
        const r = await fetch(url, { cache: 'no-cache' });
        if (!r.ok) throw new Error('Berkas paket tidak ditemukan (' + r.status + ').');
        if (onProgres && r.body && r.headers.get('content-length')) {
          const total = Number(r.headers.get('content-length')), rd = r.body.getReader(), parts = []; let n = 0;
          for (;;) { const x = await rd.read(); if (x.done) break; parts.push(x.value); n += x.value.length; onProgres(n / total); }
          enc = JSON.parse(new TextDecoder().decode(await new Blob(parts).arrayBuffer()));
        } else enc = await r.json();
      } else {
        enc = await api('paket.unduh', { id: p.id, bagian }, { batas: 60000 });
      }
      await IDB.set(k, enc);
      // bersihkan versi lama paket yang sama
      (await IDB.kunci()).filter(x => x.indexOf('pk|' + p.id + '|' + bagian + '|') === 0 && x !== k).forEach(x => IDB.del(x));
      return enc;
    },
    async ada(p, bagian) { return !!(await IDB.get('pk|' + p.id + '|' + (bagian || 'isi') + '|' + (p.versi || 1))); },
    async buka(p, kunci, bagian, onProgres) {
      bagian = bagian || 'isi';
      const mk = p.id + '|' + bagian + '|' + (p.versi || 1);
      if (this.terbuka[mk]) return this.terbuka[mk];
      const enc = await this.unduh(p, bagian, onProgres);
      let isi;
      try { isi = await Brankas.buka(enc, kunci); }
      catch (e) { await IDB.del('pk|' + p.id + '|' + bagian + '|' + (p.versi || 1)); throw new Error('Paket gagal dibuka (berkas rusak atau kunci tidak cocok). Coba muat ulang.'); }
      this.terbuka[mk] = isi;
      return isi;
    },
    /** Unduh di belakang layar saat perangkat senggang. */
    prefetch(list) {
      const jalan = async () => { for (const p of list) { try { if (!(await this.ada(p))) await this.unduh(p); } catch (e) { /* coba lagi lain kali */ } } };
      (window.requestIdleCallback || (f => setTimeout(f, 1500)))(() => jalan());
    }
  };
  /** Muat KaTeX (hanya bila ada rumus yang belum dirender sebelumnya, mis. soal buatan guru). */
  let katexP = null;
  App.muatKatex = () => {
    if (window.katex) return Promise.resolve();
    if (!katexP) katexP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = './js/lib/katex/katex.min.js?v=' + VERSI; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    return katexP;
  };
  window.KTKA_BUTUH_KATEX = tunda(() => { App.muatKatex().then(() => window.dispatchEvent(new Event('katex-siap'))); }, 50);

  // =========================================================== komponen UI
  function toast(msg, jenis, lama) {
    let box = $('#toast'); if (!box) { box = document.createElement('div'); box.id = 'toast'; document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast ' + (jenis || 'info'); el.setAttribute('role', 'status');
    el.innerHTML = String(h`${ikon(jenis === 'ok' ? 'centang' : jenis === 'err' ? 'awas' : jenis === 'warn' ? 'awas' : 'info')}<span>${msg}</span>`);
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, lama || (jenis === 'err' ? 5000 : 3200));
  }
  /** modal({judul, isi (h), aksi:[{label, kelas, nilai, ikon}], lebar, saatBuka(el), sebelumTutup(nilai, el) → false untuk batal}) → Promise<nilai|null> */
  function modal(o) {
    return new Promise(res => {
      const t = document.createElement('div'); t.className = 'tirai'; t.setAttribute('role', 'dialog'); t.setAttribute('aria-modal', 'true');
      const aksi = o.aksi || [{ label: 'Tutup', kelas: 'garis', nilai: null }];
      t.innerHTML = String(h`<div class="modal ${o.lebar ? 'lebar' : ''}">${o.judul ? h`<h3>${o.judul}</h3>` : ''}<div class="modal-isi">${o.isi || ''}</div>
        <div class="aksi">${aksi.map((a, i) => h`<button class="btn ${a.kelas || 'garis'}" data-i="${i}">${a.ikon ? ikon(a.ikon) : ''}${a.label}</button>`)}</div></div>`);
      document.body.appendChild(t);
      const m = $('.modal', t);
      const tutup = async v => {
        if (o.sebelumTutup) { const ok = await o.sebelumTutup(v, m); if (ok === false) return; v = ok === true || ok === undefined ? v : ok; }
        t.remove(); document.removeEventListener('keydown', kd); res(v);
      };
      const kd = e => { if (e.key === 'Escape' && !o.wajib) tutup(null); };
      document.addEventListener('keydown', kd);
      t.addEventListener('click', e => {
        if (e.target === t && !o.wajib) return tutup(null);
        const b = e.target.closest('[data-i]'); if (b && b.parentNode.classList.contains('aksi')) tutup(aksi[+b.dataset.i].nilai);
      });
      if (o.saatBuka) o.saatBuka(m, tutup);
      const f = $('input,select,textarea', m); if (f && !o.tanpaFokus) setTimeout(() => f.focus(), 50);
    });
  }
  const konfirmasi = (judul, pesan, label, kelas) => modal({ judul, isi: h`<p>${pesan}</p>`, aksi: [{ label: 'Batal', kelas: 'garis', nilai: false }, { label: label || 'Ya, lanjutkan', kelas: kelas || 'biru', nilai: true }] });
  /** Minta alasan tertulis (tindakan pengawas, telaah, dsb.). */
  function mintaTeks(judul, label, opsi) {
    opsi = opsi || {};
    return modal({ judul, isi: h`${opsi.pesan ? h`<p>${opsi.pesan}</p>` : ''}${opsi.tambahan || ''}<div class="fld"><label class="f">${label}</label>
      <textarea class="in" id="mt-teks" rows="3" placeholder="${opsi.placeholder || ''}">${opsi.nilai || ''}</textarea><div class="err" id="mt-err"></div></div>`,
      aksi: [{ label: 'Batal', kelas: 'garis', nilai: null }, { label: opsi.tombol || 'Simpan', kelas: opsi.kelas || 'biru', nilai: 'ok' }],
      sebelumTutup: (v, m) => {
        if (v !== 'ok') return true;
        const s = $('#mt-teks', m).value.trim();
        if (s.length < (opsi.min == null ? 3 : opsi.min)) { $('#mt-err', m).textContent = 'Wajib diisi (minimal ' + (opsi.min || 3) + ' karakter).'; return false; }
        const ex = {}; $$('[data-ex]', m).forEach(el => { ex[el.dataset.ex] = el.value; });
        return { teks: s, ex };
      } });
  }
  const kerangka = (n, tipe) => raw(Array.from({ length: n || 3 }, () => '<div class="sk ' + (tipe || 'k') + '"></div>').join('<div style="height:12px"></div>'));
  const kosong = (judul, pesan, tombol) => h`<div class="kosong"><img src="./assets/logo-bulat.webp" alt="" width="96" height="96"><h4>${judul}</h4><p>${pesan || ''}</p>${tombol || ''}</div>`;
  const galatBox = (e, ulang) => h`<div class="kartu kosong">${ikon('awas')}<h4>Gagal memuat</h4><p>${e && e.message ? e.message : e}</p>${ulang ? h`<button class="btn garis" data-aksi="ulang">${ikon('segar')} Coba lagi</button>` : ''}</div>`;
  const PIL_STATUS = {
    berlangsung: ['kuning', 'Berlangsung'], dijadwalkan: ['biru', 'Dijadwalkan'], selesai: ['hijau', 'Selesai'], terkunci: ['', 'Terkunci'],
    pembahasan: ['hijau', 'Pembahasan'], latihan: ['navy', 'Latihan'], aktif: ['biru', 'Aktif'], ditutup: ['hijau', 'Ditutup'],
    draf: ['', 'Draf'], ditelaah: ['kuning', 'Menunggu telaah'], disetujui: ['hijau', 'Disetujui'], revisi: ['kuning', 'Perlu revisi'], ditolak: ['merah', 'Ditolak'],
    mengerjakan: ['biru', 'Mengerjakan'], belum: ['', 'Belum mulai'], offline: ['', 'Offline'], arsip: ['', 'Arsip'], nonaktif: ['merah', 'Nonaktif'],
    Istimewa: ['navy', 'Istimewa'], Baik: ['hijau', 'Baik'], Memadai: ['kuning', 'Memadai'], Kurang: ['merah', 'Kurang']
  };
  const pil = (st, teks) => { const p = PIL_STATUS[st] || ['', st]; return h`<span class="pil ${p[0]}">${st === 'berlangsung' || st === 'mengerjakan' ? raw('<span class="titik denyut"></span>') : ''}${teks || p[1]}</span>`; };
  /** Delegasi klik: elemen dengan data-aksi="nama" memanggil peta[nama](el, ev). */
  function aksi(root, peta) {
    if (root._aksi) root.removeEventListener('click', root._aksi);
    root._aksi = e => { const el = e.target.closest('[data-aksi]'); if (!el || !root.contains(el)) return; const f = peta[el.dataset.aksi]; if (f) { e.preventDefault(); f(el, e); } };
    root.addEventListener('click', root._aksi);
  }
  /** Tombol sibuk: nonaktifkan + label "Memproses…" selama janji berjalan. */
  async function sibuk(btn, fn) {
    if (!btn || btn.disabled) return;
    const lama = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="putar"></span> Memproses…';
    try { return await fn(); } catch (e) { toast(e.message || String(e), 'err'); } finally { btn.disabled = false; btn.innerHTML = lama; }
  }
  const nilaiForm = root => { const o = {}; $$('[name]', root).forEach(el => { if (el.type === 'checkbox') o[el.name] = el.checked; else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; } else o[el.name] = el.value; }); return o; };
  Object.assign(App, { toast, modal, konfirmasi, mintaTeks, kerangka, kosong, galatBox, pil, aksi, sibuk, nilaiForm });

  // =========================================================== aktivitas pengguna (polling adaptif)
  const Aktif = App.Aktif = {
    t: Date.now(), last: {},
    init() { ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { this.t = Date.now(); }, { passive: true })); },
    diam() { return Date.now() - this.t > 120000; },
    jatuh(k, aktifMs, diamMs) {
      if (document.visibilityState !== 'visible') return false;
      if (Date.now() - (this.last[k] || 0) < (this.diam() ? diamMs : aktifMs) - 300) return false;
      this.last[k] = Date.now(); return true;
    }
  };
  /** Pengatur waktu yang otomatis berhenti saat halaman berganti. */
  const timers = [];
  App.ulang = (fn, ms) => { const id = setInterval(fn, ms); timers.push(id); return id; };
  App.henti = () => { while (timers.length) clearInterval(timers.pop()); };

  // =========================================================== router & kerangka tampilan
  const RUTE = [
    // siswa
    ['beranda', 'siswa', ['siswa']], ['latihan', 'siswa', ['siswa']], ['latihan/main', 'siswa', ['siswa']], ['hasil', 'siswa', ['siswa']], ['hasil/:keg', 'siswa', ['siswa']],
    ['laporan-saya', 'siswa', ['siswa']], ['ujian/:sesi', 'ujian', ['siswa']],
    // staf
    ['dasbor', 'guru', ['guru', 'admin']], ['kegiatan', 'guru', ['guru', 'admin']], ['paket', 'guru', ['guru', 'admin']],
    ['pantau', 'pengawas', ['guru', 'admin', 'pengawas']], ['pantau/:sesi', 'pengawas', ['guru', 'admin', 'pengawas']],
    ['bank', 'bank', ['guru', 'admin']], ['bank/:id', 'bank', ['guru', 'admin']], ['generator', 'bank', ['guru', 'admin']],
    ['laporan', 'laporan', ['guru', 'admin']], ['laporan/:keg', 'laporan', ['guru', 'admin']], ['laporan-siswa/:id', 'laporan', ['guru', 'admin']],
    ['siswa', 'admin', ['admin']], ['staf', 'admin', ['admin']], ['pengaturan', 'admin', ['admin']], ['sistem', 'admin', ['admin']],
    ['akun', 'masuk', ['guru', 'admin', 'pengawas', 'siswa']], ['masuk', 'masuk', null]
  ];
  const BERANDA = { siswa: 'beranda', guru: 'dasbor', admin: 'dasbor', pengawas: 'pantau' };
  const NAV = {
    siswa: [['beranda', 'rumah', 'Beranda'], ['latihan', 'target', 'Latihan'], ['hasil', 'piala', 'Hasil'], ['laporan-saya', 'grafik', 'Laporan']],
    guru: [['dasbor', 'rumah', 'Dasbor', 'Utama'], ['kegiatan', 'kalender', 'Kegiatan & Sesi'], ['pantau', 'monitor', 'Pantau Sesi'], ['paket', 'tumpuk', 'Paket Soal'],
      ['bank', 'basis', 'Bank Soal', 'Soal'], ['generator', 'kilau', 'Generator'], ['laporan', 'grafik', 'Laporan', 'Hasil']],
    pengawas: [['pantau', 'monitor', 'Pantau Sesi', 'Utama'], ['akun', 'pengguna', 'Akun']],
    admin: [['dasbor', 'rumah', 'Dasbor', 'Utama'], ['kegiatan', 'kalender', 'Kegiatan & Sesi'], ['pantau', 'monitor', 'Pantau Sesi'], ['paket', 'tumpuk', 'Paket Soal'],
      ['bank', 'basis', 'Bank Soal', 'Soal'], ['generator', 'kilau', 'Generator'], ['laporan', 'grafik', 'Laporan', 'Hasil'],
      ['siswa', 'grup', 'Data Siswa', 'Administrasi'], ['staf', 'pengguna', 'Akun Staf'], ['pengaturan', 'roda', 'Pengaturan'], ['sistem', 'perisai', 'Sistem & Cadangan']]
  };
  const BAWAH = { guru: ['dasbor', 'kegiatan', 'pantau', 'bank', 'laporan'], admin: ['dasbor', 'kegiatan', 'pantau', 'laporan'], pengawas: ['pantau', 'akun'], siswa: ['beranda', 'latihan', 'hasil', 'laporan-saya'] };
  const PERAN_NAMA = { admin: 'Admin', guru: 'Guru', pengawas: 'Pengawas', siswa: 'Siswa' };
  App.PERAN_NAMA = PERAN_NAMA;

  App.ke = (path, ganti) => { const url = '#/' + path; if (ganti) location.replace(url); else if (location.hash === url) render(); else location.hash = url; };
  App.modul = nama => {
    if (App.modulMuat[nama]) return App.modulMuat[nama];
    App.modulMuat[nama] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = './js/pages/' + nama + '.js?v=' + VERSI;
      s.onload = res; s.onerror = () => { delete App.modulMuat[nama]; rej(new Error('Modul ' + nama + ' gagal dimuat. Periksa koneksi.')); };
      document.head.appendChild(s);
    });
    return App.modulMuat[nama];
  };
  function cocok(path) {
    const seg = path.split('/');
    for (const r of RUTE) {
      const pola = r[0].split('/'); if (pola.length !== seg.length) continue;
      const prm = {}; let ok = true;
      pola.forEach((p, i) => { if (p[0] === ':') prm[p.slice(1)] = decodeURIComponent(seg[i]); else if (p !== seg[i]) ok = false; });
      if (ok) return { pola: r[0], modul: r[1], peran: r[2], prm };
    }
    return null;
  }
  let renderId = 0, halKini = '';
  App.sebelumPindah = null;     // halaman ujian memasang penjaga
  async function render() {
    const id = ++renderId;
    let path = location.hash.replace(/^#\/?/, '').split('?')[0];
    if (!Sesi.aktif()) { if (Sesi.data) Sesi.hapus(); path = 'masuk'; }
    else if (!path || path === 'masuk') path = BERANDA[Sesi.peran] || 'masuk';
    const r = cocok(path) || cocok(BERANDA[Sesi.peran] || 'masuk');
    if (r.peran && r.peran.indexOf(Sesi.peran) < 0) return App.ke(BERANDA[Sesi.peran] || 'masuk', true);
    App.henti();
    halKini = r.pola;
    const tanpaShell = r.pola === 'masuk' || r.pola === 'ujian/:sesi';
    const main = tanpaShell ? siapkanPolos() : siapkanShell(path);
    try {
      await App.modul(r.modul);
      if (id !== renderId) return;
      const fn = App.hal[r.pola];
      if (!fn) throw new Error('Halaman tidak ditemukan.');
      await fn(main, r.prm);
    } catch (e) {
      console.error(e);
      if (id === renderId) main.innerHTML = String(galatBox(e, true)), aksi(main, { ulang: () => render() });
    }
    if (!tanpaShell) window.scrollTo(0, 0);
    if (!tanpaShell) prefetchSekali();
  }
  App.render = render;
  /** Setelah halaman pertama tampil: muat modul & data menu utama saat perangkat senggang → pindah menu terasa instan. */
  let sudahPrefetch = '';
  function prefetchSekali() {
    const peran = Sesi.peran; if (!peran || sudahPrefetch === peran) return; sudahPrefetch = peran;
    const modul = { siswa: ['ujian', 'rapor'], pengawas: [], guru: ['guru', 'pengawas', 'bank', 'laporan', 'rapor'], admin: ['guru', 'pengawas', 'bank', 'laporan', 'rapor', 'admin'] }[peran] || [];
    const data = { siswa: [['siswa.hasil', {}]], pengawas: [], guru: [['kegiatan.daftar', {}], ['paket.daftar', {}], ['pengawas.sesi', {}]], admin: [['kegiatan.daftar', {}], ['paket.daftar', {}], ['pengawas.sesi', {}], ['siswa.daftar', { arsip: false }]] }[peran] || [];
    (window.requestIdleCallback || (f => setTimeout(f, 1200)))(() => {
      modul.forEach(m => App.modul(m).catch(() => {}));
      data.forEach(x => App.ambil(x[0], x[1], null, { segar: 60000 }).catch(() => {}));
    }, { timeout: 4000 });
  }
  addEventListener('hashchange', () => {
    if (App.sebelumPindah && App.sebelumPindah() === false) return;
    render();
  });
  function siapkanPolos() {
    const app = $('#app'); app.className = ''; app.innerHTML = '<main id="utama"></main>';
    return $('#utama');
  }
  function siapkanShell(path) {
    const app = $('#app'), peran = Sesi.peran, me = Sesi.me || {}, nav = NAV[peran] || [], aktifNav = path.split('/')[0];
    const konfig = App.konfig || {};
    const shell = app.dataset.shell === peran ? true : false;
    if (!shell) {
      app.dataset.shell = peran;
      const sub = peran === 'guru' && me.m ? 'Guru ' + (MAPEL[me.m] || me.m) : peran === 'siswa' ? 'Kelas ' + (me.rb || '') : PERAN_NAMA[peran];
      app.innerHTML = String(h`
        <header class="atas no-print">
          <a href="#/${BERANDA[peran]}" class="baris" style="gap:10px;color:#fff;text-decoration:none">
            <img class="logo" src="./assets/logo-horizontal.webp" alt="KelasTKA+ SMP" width="120" height="40"></a>
          ${peran === 'siswa' ? h`<nav>${nav.map(n => h`<a href="#/${n[0]}" data-nav="${n[0]}">${n[2]}</a>`)}</nav>` : h`<div class="nama-app sembunyi-hp">${konfig.nama_sekolah || ''}<small>${konfig.tahun_ajaran ? 'Tahun ajaran ' + konfig.tahun_ajaran : ''}</small></div>`}
          <div class="kanan">
            <span class="koneksi ${navigator.onLine ? '' : 'off'}" id="koneksi">${ikon(navigator.onLine ? 'wifi' : 'wifimati')}<span class="sembunyi-hp">${navigator.onLine ? 'Daring' : 'Offline'}</span></span>
            <button class="ikonbtn sembunyi" id="btn-pasang" title="Pasang aplikasi">${ikon('unduh')}</button>
            <div class="pengguna"><b>${me.n || ''}</b><small>${sub}</small></div>
            <button class="avatar" id="btn-akun" title="Akun" style="border:0;cursor:pointer">${inisial(me.n)}</button>
          </div>
        </header>
        ${peran === 'siswa' ? h`<main class="wadah" id="utama"></main>` : h`<div class="tata-staf">
          <aside class="samping no-print">
            <div class="sekolah"><img src="./assets/logo-bulat.webp" alt="" width="32" height="32" style="border-radius:50%"><span>${konfig.nama_sekolah || 'KelasTKA+ SMP'}</span></div>
            ${nav.map(n => h`${n[3] ? h`<div class="grup">${n[3]}</div>` : ''}<a href="#/${n[0]}" data-nav="${n[0]}">${ikon(n[1])}<span>${n[2]}</span></a>`)}
            <div class="grup">Akun</div>
            <a href="#/akun" data-nav="akun">${ikon('pengguna')}<span>Akun saya</span></a>
          </aside>
          <main class="wadah" id="utama"></main></div>`}
        <nav class="bawah no-print">${(BAWAH[peran] || []).map(k => { const n = nav.find(x => x[0] === k) || ['akun', 'pengguna', 'Akun']; return h`<a href="#/${n[0]}" data-nav="${n[0]}">${ikon(n[1])}<span>${n[2].split(' ')[0]}</span></a>`; })}
          ${peran !== 'siswa' && peran !== 'pengawas' ? h`<a href="#" id="btn-lainnya">${ikon('menu')}<span>Lainnya</span></a>` : ''}</nav>`);
      $('#btn-akun').onclick = () => menuAkun();
      const ln = $('#btn-lainnya'); if (ln) ln.onclick = e => { e.preventDefault(); menuLainnya(); };
      Pasang.tombol();
    }
    $$('[data-nav]', app).forEach(a => a.classList.toggle('aktif', a.dataset.nav === aktifNav));
    const m = $('#utama'); m.innerHTML = String(kerangka(3)); return m;
  }
  function menuLainnya() {
    const nav = NAV[Sesi.peran] || [];
    modal({ judul: 'Menu', isi: h`<div class="daftar-menu">${nav.map(n => h`<a href="#/${n[0]}" class="item-menu" data-tutup>${ikon(n[1])}<span>${n[2]}</span></a>`)}
      <a href="#/akun" class="item-menu" data-tutup>${ikon('pengguna')}<span>Akun saya</span></a></div>`,
      saatBuka: (m, tutup) => $$('[data-tutup]', m).forEach(a => a.addEventListener('click', () => tutup(null))) });
  }
  function menuAkun() {
    const me = Sesi.me || {};
    modal({ judul: me.n, isi: h`<p class="kecil">${PERAN_NAMA[Sesi.peran]}${me.m ? ' · ' + (MAPEL[me.m] || me.m) : ''}${me.rb ? ' · ' + me.rb : ''} · ${me.un || ''}</p>
      <div class="daftar-menu">
        ${Sesi.peran !== 'siswa' ? h`<a href="#/akun" class="item-menu" data-tutup>${ikon('kunci')}<span>Ganti kata sandi</span></a>` : ''}
        <button class="item-menu" data-pasang>${ikon('hp')}<span>Pasang aplikasi di perangkat</span></button>
        <button class="item-menu merah" data-keluar>${ikon('keluar')}<span>Keluar</span></button></div>`,
      saatBuka: (m, tutup) => {
        $$('[data-tutup]', m).forEach(a => a.addEventListener('click', () => tutup(null)));
        $('[data-pasang]', m).onclick = () => { tutup(null); Pasang.tanya(); };
        $('[data-keluar]', m).onclick = () => { tutup(null); App.keluar(); };
      } });
  }
  App.keluar = async () => {
    const ok = await konfirmasi('Keluar dari aplikasi?', Sesi.peran === 'siswa' ? 'Jawaban try out yang sudah terkirim tetap aman.' : 'Anda perlu masuk kembali untuk melanjutkan.', 'Keluar', 'bahaya');
    if (!ok) return;
    try { await api('auth.keluar', {}, { batas: 8000 }); } catch (e) { /* tetap keluar */ }
    Sesi.hapus(); Paket.terbuka = {}; delete $('#app').dataset.shell; App.ke('masuk');
  };
  addEventListener('online', () => { const k = $('#koneksi'); if (k) { k.className = 'koneksi'; k.innerHTML = String(h`${ikon('wifi')}<span class="sembunyi-hp">Daring</span>`); } });
  addEventListener('offline', () => { const k = $('#koneksi'); if (k) { k.className = 'koneksi off'; k.innerHTML = String(h`${ikon('wifimati')}<span class="sembunyi-hp">Offline</span>`); } });

  // =========================================================== pasang aplikasi (PWA)
  const Pasang = App.Pasang = {
    ev: null,
    standalone() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; },
    ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent); },
    tombol() { const b = $('#btn-pasang'); if (b) { b.classList.toggle('sembunyi', !this.ev || this.standalone()); b.onclick = () => this.tanya(); } $$('[data-pasang-app]').forEach(x => x.classList.toggle('sembunyi', this.standalone())); },
    async tanya() {
      if (this.standalone()) return toast('Aplikasi sudah terpasang di perangkat ini.', 'ok');
      if (this.ev) { this.ev.prompt(); const r = await this.ev.userChoice; if (r.outcome === 'accepted') { this.ev = null; this.tombol(); toast('Aplikasi dipasang. Buka dari layar utama.', 'ok'); } return; }
      modal({ judul: 'Pasang KelasTKA+ di HP', isi: this.ios()
        ? h`<ol class="langkah"><li>Buka halaman ini di <b>Safari</b>.</li><li>Ketuk tombol <b>Bagikan</b> (kotak dengan panah ke atas).</li><li>Pilih <b>Tambahkan ke Layar Utama</b>, lalu <b>Tambah</b>.</li></ol>`
        : h`<ol class="langkah"><li>Buka halaman ini di <b>Chrome</b>.</li><li>Ketuk menu <b>⋮</b> di kanan atas.</li><li>Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</li></ol><p class="kecil">Setelah terpasang, aplikasi terbuka seperti aplikasi biasa dan lebih cepat dimuat.</p>` });
    }
  };
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); Pasang.ev = e; Pasang.tombol(); });
  addEventListener('appinstalled', () => { Pasang.ev = null; Pasang.tombol(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:' || location.hostname === 'localhost') {
    addEventListener('load', () => {
      if (!navigator.serviceWorker) return;
      navigator.serviceWorker.register('./sw.js').then(reg => {
        if (!reg) return;
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw && nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller && halKini !== 'ujian/:sesi')
              toast('Versi baru aplikasi siap. Muat ulang halaman untuk memakai.', 'info', 8000);
          });
        });
      }).catch(e => console.warn('SW', e));
    });
  }

  // =========================================================== Excel (.xlsx) baca & tulis tanpa pustaka luar
  const Excel = App.Excel = {
    async baca(file) {
      const buf = new Uint8Array(await file.arrayBuffer());
      if (/\.csv$/i.test(file.name)) return { [file.name]: this.csv(new TextDecoder().decode(buf)) };
      const ent = this._zip(buf), ambil = async n => { const e = ent[n]; return e ? this._inflate(buf, e) : null; };
      const wb = await ambil('xl/workbook.xml'); if (!wb) throw new Error('Berkas bukan Excel (.xlsx) yang valid.');
      const rels = await ambil('xl/_rels/workbook.xml.rels'), ss = await ambil('xl/sharedStrings.xml');
      const dp = s => new DOMParser().parseFromString(s, 'application/xml');
      const strs = ss ? Array.from(dp(ss).getElementsByTagName('si')).map(si => Array.from(si.getElementsByTagName('t')).map(t => t.textContent).join('')) : [];
      const relMap = {}; if (rels) Array.from(dp(rels).getElementsByTagName('Relationship')).forEach(r => { relMap[r.getAttribute('Id')] = r.getAttribute('Target'); });
      const out = {};
      for (const s of Array.from(dp(wb).getElementsByTagName('sheet'))) {
        const rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
        let tgt = relMap[rid] || ''; tgt = tgt.replace(/^\/?xl\//, ''); const xml = await ambil('xl/' + tgt.replace(/^\//, ''));
        if (!xml) continue;
        const rows = [];
        Array.from(dp(xml).getElementsByTagName('row')).forEach(row => {
          const arr = [];
          Array.from(row.getElementsByTagName('c')).forEach(c => {
            const ref = c.getAttribute('r') || '', col = ref.replace(/[0-9]/g, '').split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
            const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0];
            let val = '';
            if (t === 's') val = strs[Number(v && v.textContent)] || '';
            else if (t === 'inlineStr') val = Array.from(c.getElementsByTagName('t')).map(x => x.textContent).join('');
            else if (t === 'b') val = v && v.textContent === '1';
            else val = v ? v.textContent : '';
            if (t !== 's' && t !== 'inlineStr' && t !== 'str' && val !== '' && !isNaN(val)) val = Number(val);
            arr[col < 0 ? arr.length : col] = val;
          });
          rows[Number(row.getAttribute('r')) - 1] = Array.from(arr, x => x === undefined ? '' : x);
        });
        out[s.getAttribute('name')] = Array.from(rows, x => x || []);
      }
      return out;
    },
    csv(t) { const rows = [], re = /("([^"]|"")*"|[^,;\n\r]*)([,;]|\r?\n|$)/g; let row = [], m; t = t.replace(/^﻿/, ''); while ((m = re.exec(t)) && m[0] !== '') { let v = m[1]; if (v[0] === '"') v = v.slice(1, -1).replace(/""/g, '"'); row.push(v); if (m[3] !== ',' && m[3] !== ';') { rows.push(row); row = []; } } return rows; },
    /** baris pertama = header → array objek dengan kunci header (huruf kecil, spasi → _). */
    objek(rows) { const hd = (rows[0] || []).map(x => String(x).trim().toLowerCase().replace(/\s+/g, '_')); return rows.slice(1).filter(r => r.some(x => String(x).trim() !== '')).map(r => { const o = {}; hd.forEach((k, i) => { if (k) o[k] = r[i] === undefined ? '' : r[i]; }); return o; }); },
    _zip(buf) {
      const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); let eocd = -1;
      for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
      if (eocd < 0) throw new Error('Berkas bukan Excel (.xlsx) yang valid.');
      const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true); const out = {};
      for (let i = 0; i < n; i++) {
        const met = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
        out[new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nl))] = { met, csz, off }; p += 46 + nl + xl + cl;
      }
      return out;
    },
    async _inflate(buf, e) {
      const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), st = e.off + 30 + dv.getUint16(e.off + 26, true) + dv.getUint16(e.off + 28, true);
      const data = buf.subarray(st, st + e.csz);
      if (e.met === 0) return new TextDecoder().decode(data);
      if (typeof DecompressionStream === 'undefined') throw new Error('Peramban ini belum bisa membaca Excel. Simpan berkas sebagai CSV lalu unggah ulang, atau gunakan Chrome terbaru.');
      const s = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new TextDecoder().decode(await new Response(s).arrayBuffer());
    },
    /** tulis(namaBerkas, [{nama, baris:[[...]], lebar:[...]}]) → unduh .xlsx (baris pertama tebal). */
    tulis(nama, sheets) {
      const x = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
      const kol = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
      const files = {
        '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map((s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>',
        '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map((s, i) => '<sheet name="' + x(String(s.nama).replace(/[\\\/?*\[\]:]/g, ' ').slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>',
        'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
        'xl/styles.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs></styleSheet>'
      };
      sheets.forEach((s, i) => {
        const cols = s.lebar ? '<cols>' + s.lebar.map((w, j) => '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>' : '';
        const rows = s.baris.map((r, ri) => '<row r="' + (ri + 1) + '">' + r.map((v, ci) => {
          const ref = kol(ci) + (ri + 1), st = ri === 0 ? ' s="1"' : '';
          if (v === null || v === undefined || v === '') return '';
          if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>';
          return '<c r="' + ref + '" t="inlineStr"' + st + '><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
        }).join('') + '</row>').join('');
        files['xl/worksheets/sheet' + (i + 1) + '.xml'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' + cols + '<sheetData>' + rows + '</sheetData></worksheet>';
      });
      unduhBlob(this._zipStore(files), nama.replace(/\.xlsx$/i, '') + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    },
    _zipStore(files) {
      const enc = new TextEncoder(), parts = [], central = []; let off = 0;
      const crcT = Excel._crcT || (Excel._crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; }));
      const crc = d => { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = crcT[(c ^ d[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
      Object.keys(files).forEach(n => {
        const nm = enc.encode(n), d = enc.encode(files[n]), c = crc(d);
        const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint32(14, c, true); lh.setUint32(18, d.length, true); lh.setUint32(22, d.length, true); lh.setUint16(26, nm.length, true);
        parts.push(new Uint8Array(lh.buffer), nm, d);
        const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint32(16, c, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
        central.push(new Uint8Array(ch.buffer), nm); off += 30 + nm.length + d.length;
      });
      const csz = central.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
      e.setUint32(0, 0x06054b50, true); e.setUint16(8, Object.keys(files).length, true); e.setUint16(10, Object.keys(files).length, true); e.setUint32(12, csz, true); e.setUint32(16, off, true);
      return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]));
    }
  };
  function unduhBlob(blob, nama, tipe) {
    if (!(blob instanceof Blob)) blob = new Blob([blob], { type: tipe || 'application/octet-stream' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nama; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  App.unduhBlob = unduhBlob;
  /** Pilih berkas lewat dialog. */
  App.pilihBerkas = accept => new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept || ''; i.onchange = () => res(i.files[0] || null); i.click(); });

  // =========================================================== grafik SVG sederhana
  const WARNA = { navy: '#0B2A6B', biru: '#1565C0', emas: '#FCB900', hijau: '#16A34A', kuning: '#F59E0B', merah: '#DC2626', abu: '#94A3B8' };
  App.WARNA = WARNA;
  App.warnaNilai = (v, kkm) => v == null ? 'abu' : v >= (kkm || 75) ? 'hijau' : v >= 50 ? 'kuning' : 'merah';
  const Grafik = App.Grafik = {
    /** batang horizontal berlabel (persentase 0–100). */
    batangH(items, opsi) {
      opsi = opsi || {};
      return h`${items.map(it => { const v = Math.max(0, Math.min(100, Number(it.nilai) || 0)); return h`<div class="batang"><div class="lb"><span>${it.label}</span><b>${it.teks != null ? it.teks : angka(v) + '%'}</b></div>
        <div class="jalur"><div class="isi ${it.warna || App.warnaNilai(v, opsi.kkm)}" style="width:${v}%"></div></div></div>`; })}`;
    },
    /** histogram/batang vertikal: data [{label, nilai, warna}] */
    kolom(data, opsi) {
      opsi = opsi || {};
      const W = opsi.lebar || 560, H = opsi.tinggi || 200, pad = 28, n = data.length || 1, maks = Math.max(1, ...data.map(d => d.nilai)), bw = (W - pad * 2) / n;
      return raw('<svg class="grafik" viewBox="0 0 ' + W + ' ' + (H + 30) + '" width="100%" role="img" aria-label="' + esc(opsi.judul || 'Grafik') + '">' +
        [0, .25, .5, .75, 1].map(f => { const y = 10 + (H - 10) * (1 - f); return '<line x1="' + pad + '" x2="' + (W - 8) + '" y1="' + y + '" y2="' + y + '" stroke="#E2E8F0"/><text x="' + (pad - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + Math.round(maks * f) + '</text>'; }).join('') +
        data.map((d, i) => { const bh = (H - 10) * d.nilai / maks, x = pad + i * bw + bw * 0.15, y = H - bh; return '<rect x="' + x + '" y="' + y + '" width="' + (bw * 0.7) + '" height="' + Math.max(0, bh) + '" rx="4" fill="' + (WARNA[d.warna] || d.warna || WARNA.biru) + '"/>' + (d.nilai ? '<text x="' + (x + bw * 0.35) + '" y="' + (y - 4) + '" text-anchor="middle" style="font-weight:700;fill:#0F172A">' + d.nilai + '</text>' : '') + '<text x="' + (x + bw * 0.35) + '" y="' + (H + 16) + '" text-anchor="middle">' + esc(d.label) + '</text>'; }).join('') + '</svg>');
    },
    /** garis: labels[], seri [{nama, nilai[], warna}] skala 0–100 */
    garis(labels, seri, opsi) {
      opsi = opsi || {};
      const W = opsi.lebar || 620, H = opsi.tinggi || 220, pl = 44, pr = 40, n = Math.max(1, labels.length - 1), X = i => pl + (W - pl - pr) * (labels.length === 1 ? 0.5 : i / n), Y = v => 10 + (H - 20) * (1 - v / 100);
      let s = '<svg class="grafik" viewBox="0 0 ' + W + ' ' + (H + 34) + '" width="100%" role="img" aria-label="' + esc(opsi.judul || 'Tren nilai') + '">';
      [0, 25, 50, 75, 100].forEach(v => { s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#E2E8F0"/><text x="' + (pl - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>'; });
      if (opsi.kkm) s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(opsi.kkm) + '" y2="' + Y(opsi.kkm) + '" stroke="#DC2626" stroke-dasharray="4 4"/><text x="' + (W - pr) + '" y="' + (Y(opsi.kkm) - 4) + '" text-anchor="end" style="fill:#DC2626">KKM ' + opsi.kkm + '</text>';
      labels.forEach((l, i) => { s += '<text x="' + X(i) + '" y="' + (H + 14) + '" text-anchor="middle">' + esc(App.labelPendek(l)) + '</text>'; });
      seri.forEach((sr, si) => {
        const c = WARNA[sr.warna] || sr.warna || [WARNA.navy, WARNA.emas, WARNA.biru, WARNA.hijau, WARNA.merah][si % 5];
        const pts = sr.nilai.map((v, i) => v == null ? null : [X(i), Y(v), v]).filter(Boolean);
        if (pts.length > 1) s += '<polyline fill="none" stroke="' + c + '" stroke-width="2.5" points="' + pts.map(p => p[0] + ',' + p[1]).join(' ') + '"/>';
        pts.forEach(p => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#fff" stroke="' + c + '" stroke-width="2.5"/>' + (seri.length === 1 ? '<text x="' + p[0] + '" y="' + (p[1] - 9) + '" text-anchor="middle" style="font-weight:700;fill:#0F172A">' + angka(p[2]) + '</text>' : ''); });
      });
      if (seri.length > 1) s += seri.map((sr, si) => '<g transform="translate(' + (pl + si * 110) + ',' + (H + 28) + ')"><rect width="10" height="10" y="-9" rx="2" fill="' + (WARNA[sr.warna] || [WARNA.navy, WARNA.emas, WARNA.biru, WARNA.hijau, WARNA.merah][si % 5]) + '"/><text x="14">' + esc(sr.nama) + '</text></g>').join('');
      return raw(s + '</svg>');
    },
    /** lingkar nilai 0–100 */
    gauge(v, opsi) {
      opsi = opsi || {}; const r = 70, c = 2 * Math.PI * r, f = Math.max(0, Math.min(100, Number(v) || 0)) / 100, w = WARNA[App.warnaNilai(v, opsi.kkm)];
      return h`<div class="gauge"><svg viewBox="0 0 170 170" width="170" height="170"><circle cx="85" cy="85" r="${r}" fill="none" stroke="#EEF2F8" stroke-width="14"/>
        <circle cx="85" cy="85" r="${r}" fill="none" stroke="${opsi.warna || w}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${c * f} ${c}"/></svg>
        <div class="nilai"><div><b>${angka2(v)}</b><small>${opsi.teks || 'dari 100'}</small></div></div></div>`;
    }
  };

  // =========================================================== cetak (A4) & kop laporan
  App.cetak = (html, judul) => {
    let box = $('#area-cetak'); if (!box) { box = document.createElement('div'); box.id = 'area-cetak'; document.body.appendChild(box); }
    box.innerHTML = String(html);
    document.body.classList.add('mencetak');
    const lama = document.title; if (judul) document.title = judul;
    const selesai = () => { document.body.classList.remove('mencetak'); box.innerHTML = ''; document.title = lama; removeEventListener('afterprint', selesai); };
    addEventListener('afterprint', selesai);
    const imgs = $$('img', box).filter(i => !i.complete);
    Promise.all(imgs.map(i => new Promise(r => { i.onload = i.onerror = r; }))).then(() => setTimeout(() => { window.print(); if (/iphone|ipad/i.test(navigator.userAgent)) setTimeout(selesai, 1500); }, 150));
  };
  App.kop = (judul, sub) => {
    const k = App.konfig || {};
    return h`<div class="kop"><img src="${k.logo_sekolah || './assets/logo-bulat.webp'}" alt="">
      <div>${k.kop_baris_1 ? h`<div class="b1">${k.kop_baris_1}</div>` : ''}${k.kop_baris_2 ? h`<div class="b1">${k.kop_baris_2}</div>` : ''}
        <div class="b2">${k.nama_sekolah || 'Satuan Pendidikan'}</div><div class="b3">${k.alamat || ''}${k.npsn ? ' · NPSN ' + k.npsn : ''}</div></div>
      <img src="./assets/logo-bulat.webp" alt=""></div>
      <div style="text-align:center;margin-bottom:10px"><h2 style="margin:0">${judul}</h2>${sub ? h`<div class="kecil">${sub}</div>` : ''}</div>`;
  };
  App.ttd = (kiri, kanan) => {
    const k = App.konfig || {};
    return h`<div class="ttd"><div>${kiri ? h`${kiri.jabatan}<div class="garis">${kiri.nama || '........................'}</div>${kiri.nip ? h`<div class="kecil">NIP ${kiri.nip}</div>` : ''}` : ''}</div><div></div>
      <div>${k.kota_ttd || ''}, ${tglPanjang()}<br>${kanan ? kanan.jabatan : 'Kepala Sekolah'}<div class="garis">${kanan ? kanan.nama : (k.kepala_sekolah || '........................')}</div>
      ${(kanan ? kanan.nip : k.nip_kepala) ? h`<div class="kecil">NIP ${kanan ? kanan.nip : k.nip_kepala}</div>` : ''}</div></div>`;
  };
  App.predikat = v => { const k = App.konfig || {}; v = Number(v); if (v >= Number(k.ambang_istimewa || 95)) return 'Istimewa'; if (v >= Number(k.ambang_baik || 70)) return 'Baik'; if (v >= Number(k.ambang_memadai || 50)) return 'Memadai'; return 'Kurang'; };

  // =========================================================== mulai aplikasi
  App.muatKonfig = async () => {
    App.konfig = LS.get('konfig', null);
    if (!urlSiap()) return App.konfig;
    const tarik = api('app.konfig', {}, { tanpaUlang: true }).then(k => { App.konfig = k; LS.set('konfig', k); return k; }).catch(() => App.konfig);
    return App.konfig ? (tarik, App.konfig) : tarik;
  };
  async function mulai() {
    Aktif.init();
    if (!urlSiap()) {
      $('#app').innerHTML = String(h`<div class="wadah" style="max-width:640px;padding-top:48px"><div class="kartu aksen"><img src="./assets/logo-horizontal.webp" alt="KelasTKA+ SMP" style="width:240px">
        <h2 style="margin-top:16px">Konfigurasi belum lengkap</h2><p>Alamat server (Web App Apps Script) belum diisi. Buka berkas <code>js/config.js</code>, ganti nilai <code>GAS_URL</code> dengan URL <b>/exec</b> hasil deploy, lalu unggah ulang ke GitHub.</p></div></div>`);
      return;
    }
    await App.muatKonfig();
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
