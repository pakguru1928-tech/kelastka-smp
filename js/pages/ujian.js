/* Mesin ujian (try out) + perender butir soal yang dipakai juga oleh latihan dan pembahasan.
 * Prinsip: jawaban selalu disimpan dulu di perangkat (IndexedDB), dikirim ke server berkala dengan jeda acak.
 * Pindah layar TIDAK pernah mengumpulkan otomatis: setelah batas tercapai layar dikunci dan keputusan ada di pengawas.
 * Offline tidak dihitung pelanggaran.
 */
(function () {
  'use strict';
  const { h, raw, $, $$, ikon, api, toast, modal, IDB, LS } = App;
  const HURUF = 'ABCDE';

  // =========================================================== perender butir (bersama)
  const Soal = App.Soal = {
    /** Normalisasi paket terdekripsi → {butir[], stim{}, ctx} */
    dariPaket(isi) {
      const stim = {}; (isi.stimulus || []).forEach(s => { stim[s.id] = s; });
      return { butir: (isi.butir || []).map(b => Object.assign({}, b, { lab: b.lab || [] })), stim, ctx: { aset: isi.aset || {}, math: isi.math || {} }, paket: isi.paket };
    },
    /** Butir bank (latihan) → bentuk yang sama dengan butir paket. */
    dariBank(list) {
      const stim = {};
      const butir = list.map((b, i) => {
        let sid = '';
        if (b.stimulus && String(b.stimulus.isi || '').trim()) { sid = b.stimulus.id || ('ST-' + b.id); stim[sid] = Object.assign({ id: sid }, b.stimulus); }
        return { id: b.id, no: i + 1, stim: sid, bentuk: b.bentuk, tanya: b.tanya, instr: b.instr, opsi: b.opsi || [], lab: b.label || [], elemen: b.elemen, level: b.level,
          _k: b.kunci, _p: b.pembahasan, _a: b.alasan || [] };
      });
      return { butir, stim, ctx: { aset: {}, math: {} } };
    },
    /** Urutan tampil: kelompok stimulus tetap utuh; opsi PG/PGK diacak per siswa bila diminta. */
    urutan(butir, seed, acakSoal, acakOpsi) {
      const rnd = App.acakBenih(seed || 1), grup = [], idx = {};
      butir.forEach(b => { const k = b.stim || ('_' + b.id); if (idx[k] === undefined) { idx[k] = grup.length; grup.push([]); } grup[idx[k]].push(b); });
      const g = acakSoal ? App.kocok(grup, rnd) : grup;
      const out = [];
      g.forEach(arr => arr.forEach(b => {
        const n = (b.opsi || []).length;
        let peta = Array.from({ length: n }, (_, i) => i);
        if (acakOpsi && b.bentuk !== 'PGK-Kategori') peta = App.kocok(peta, rnd);
        out.push({ b, peta });
      }));
      return out;
    },
    terjawab(b, j) {
      if (j == null || j === '') return false;
      if (b.bentuk === 'PG') return !!j;
      if (b.bentuk === 'PGK-MCMA') return Array.isArray(j) && j.length > 0;
      return Array.isArray(j) && j.length === b.opsi.length && j.every(x => x);
    },
    sebagian(b, j) { return b.bentuk === 'PGK-Kategori' && Array.isArray(j) && j.some(x => x) && !Soal.terjawab(b, j); },
    pilih(b, j, nilai, i) {
      if (b.bentuk === 'PG') return j === nilai ? '' : nilai;
      if (b.bentuk === 'PGK-MCMA') { const s = new Set(Array.isArray(j) ? j : []); s.has(nilai) ? s.delete(nilai) : s.add(nilai); return Array.from(s).sort(); }
      const arr = Array.isArray(j) ? j.slice() : Array(b.opsi.length).fill('');
      while (arr.length < b.opsi.length) arr.push('');
      arr[i] = arr[i] === nilai ? '' : nilai; return arr;
    },
    htmlStimulus(s, ctx) {
      if (!s) return '';
      return h`<div class="teks">${s.judul ? h`<h2 class="jt">${s.judul}</h2>` : ''}${raw(KTKA.render(s.isi, ctx))}
        ${s.glos ? h`<div class="glos">${raw(KTKA.render(s.glos, ctx))}</div>` : ''}${s.sumber ? h`<div class="sumber">${s.sumber}</div>` : ''}</div>`;
    },
    /** mode: 'ujian' | 'latihan' | 'bahas'. o: {peta, jawab, kunci[], alasan[], tampilKunci} */
    htmlButir(b, ctx, o) {
      o = o || {};
      const j = o.jawab, peta = o.peta || b.opsi.map((_, i) => i), bahas = o.tampilKunci, kunci = o.kunci || [];
      const instr = b.instr || (b.bentuk === 'PG' ? 'Pilihlah satu jawaban yang paling tepat!' : b.bentuk === 'PGK-MCMA' ? 'Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.' : 'Tentukan pilihan untuk setiap pernyataan!');
      let opsiHtml;
      if (b.bentuk === 'PGK-Kategori') {
        const lab = b.lab && b.lab.length ? b.lab : ['Benar', 'Salah'];
        opsiHtml = h`<div class="tabel-geser"><table class="kat"><thead><tr><th>Pernyataan</th>${lab.map(l => h`<th>${l}</th>`)}</tr></thead><tbody>
          ${b.opsi.map((p, i) => { const pilihan = Array.isArray(j) ? j[i] : ''; return h`<tr class="${bahas ? (pilihan === kunci[i] ? 'kat-benar' : 'kat-salah') : ''}"><td>${raw(KTKA.render(p, ctx))}
            ${bahas && o.alasan && o.alasan[i] ? h`<div class="alasan">${raw(KTKA.inline(o.alasan[i], ctx))}</div>` : ''}</td>
            ${lab.map(l => h`<td class="pl"><button type="button" class="bulat ${pilihan === l ? 'pilih' : ''} ${bahas && kunci[i] === l ? 'kunci' : ''}" ${bahas ? 'disabled' : ''} data-kat="${i}" data-lab="${l}" aria-label="${l}" aria-pressed="${pilihan === l}">${pilihan === l ? ikon('centang') : ''}</button></td>`)}</tr>`; })}
          </tbody></table></div>`;
      } else {
        const mc = b.bentuk === 'PGK-MCMA';
        opsiHtml = h`<div class="opsi" role="${mc ? 'group' : 'radiogroup'}">${peta.map((oi, di) => {
          const asli = HURUF[oi], dipilih = mc ? Array.isArray(j) && j.indexOf(asli) >= 0 : j === asli;
          const k = bahas && kunci.indexOf(asli) >= 0, salah = bahas && dipilih && !k;
          return h`<button type="button" class="op ${mc ? 'mc' : ''} ${dipilih ? 'pilih' : ''} ${k ? 'kunci' : ''} ${salah ? 'salah' : ''}" data-op="${asli}" ${bahas ? 'disabled' : ''} role="${mc ? 'checkbox' : 'radio'}" aria-checked="${dipilih}">
            <span class="hf">${bahas ? asli : HURUF[di]}</span><span class="isi">${raw(KTKA.render(b.opsi[oi], ctx))}
            ${bahas && o.alasan && o.alasan[oi] ? h`<span class="alasan">${raw(KTKA.inline(o.alasan[oi], ctx))}</span>` : ''}</span>
            ${mc && !bahas ? h`<span class="kotak-cek">${dipilih ? ikon('centang') : ''}</span>` : ''}${bahas && k ? h`<span class="pil hijau">Kunci</span>` : ''}</button>`;
        })}</div>`;
      }
      return h`<div class="instr">${ikon('info')}<span>${instr}</span></div>
        <div class="teks tanya">${raw(KTKA.render(b.tanya, ctx))}</div>${opsiHtml}`;
    },
    /** Teks jawaban untuk ringkasan (huruf asli). */
    teksJawab(b, j) {
      if (j == null || j === '' || (Array.isArray(j) && !j.some(x => x))) return '–';
      if (b.bentuk === 'PGK-Kategori') return (Array.isArray(j) ? j : String(j).split(';')).map((x, i) => (i + 1) + ':' + (x || '–')).join(' ');
      return Array.isArray(j) ? j.join(', ') : String(j).replace(/;/g, ', ');
    },
    /** Skor lokal (latihan) dengan aturan yang sama dengan server. */
    skor(bentuk, kunci, jawab, mode) {
      if (jawab == null || jawab === '' || (Array.isArray(jawab) && !jawab.length)) return 0;
      if (bentuk === 'PG') return String(jawab) === String(kunci[0]) ? 1 : 0;
      if (bentuk === 'PGK-MCMA') {
        const p = Array.isArray(jawab) ? jawab : String(jawab).split(/[;,]/), b = p.filter(x => kunci.indexOf(x) >= 0).length, s = p.length - b;
        if (mode === 'semua') return b === kunci.length && !s ? 1 : 0;
        return Math.max(0, (b - s) / kunci.length);
      }
      const a = Array.isArray(jawab) ? jawab : String(jawab).split(';'); let b = 0;
      kunci.forEach((k, i) => { if (String(a[i] || '') === String(k)) b++; });
      return mode === 'semua' ? (b === kunci.length ? 1 : 0) : b / kunci.length;
    }
  };
  window.addEventListener('katex-siap', () => { if (App._renderUlang) App._renderUlang(); });

  // =========================================================== halaman ujian
  App.hal['ujian/:sesi'] = async function (el, prm) {
    const sesi = prm.sesi, kunciIDB = 'uj|' + (App.Sesi.me || {}).u + '|' + sesi;   // per siswa: aman untuk komputer lab bersama
    let rec = await IDB.get(kunciIDB);
    if (!rec || !rec.m) { toast('Masuk ke ruang ujian melalui Beranda dan token sesi.', 'warn'); return App.ke('beranda', true); }
    const m = rec.m;
    const st0 = m.state || {};
    const L = rec.L || { ver: st0.ver || 0, j: st0.j || {}, r: st0.r || [], pel: st0.pel || 0, kini: 0, ev: [], st: st0.st === 'terkunci' ? 'terkunci' : 'mengerjakan' };
    el.innerHTML = String(h`<div class="ujian"><div class="wadah" style="max-width:560px;padding-top:15vh;text-align:center">
      <img src="./assets/logo-bulat.webp" width="96" height="96" alt="" style="border-radius:50%"><h2 style="margin-top:12px">Menyiapkan soal…</h2>
      <p class="kecil" id="prog-teks">Membuka paket ${m.paket.nama}</p><div class="progres" style="height:10px"><div id="prog" style="width:5%"></div></div></div></div>`);
    let paket;
    try {
      paket = await App.Paket.buka(m.paket, m.ki, 'isi', f => { const p = $('#prog'); if (p) p.style.width = Math.round(5 + f * 90) + '%'; });
    } catch (e) {
      el.innerHTML = String(App.galatBox(e, true)); App.aksi(el, { ulang: () => App.render() }); return;
    }
    const P = Soal.dariPaket(paket);
    const urut = Soal.urutan(P.butir, m.seed, m.sesi.acak_soal, m.sesi.acak_opsi);
    const N = urut.length;
    const aturan = m.aturan || { batas: 3, ambang: 5, simpan: 150 };
    let batasWaktu = m.batas_waktu, selesai = false, kumpulJalan = false, mulaiKerja = !!rec.mulai;
    L.kini = Math.min(L.kini || 0, N - 1);
    const fsLv = LS.get('fs', 1), FS = [15, 17, 20];
    document.documentElement.style.setProperty('--fs-soal', FS[fsLv] + 'px');

    // ---------- simpan lokal
    const simpanLokal = App.tunda(() => IDB.set(kunciIDB, { m: Object.assign({}, m, { batas_waktu: batasWaktu }), L, mulai: mulaiKerja }), 300);
    const ubah = () => { L.ver = (L.ver || 0) + 1; L.dirty = true; simpanLokal(); };

    // ---------- tampilan
    el.innerHTML = String(h`<div class="ujian" id="uj">
      <header class="uj-atas">
        <img class="logo" src="./assets/logo-horizontal.webp" alt="" width="120" height="40">
        <div class="judul"><small>${App.MAPEL[m.sesi.mapel] || m.sesi.mapel} · ${m.sesi.jenis === 'susulan' ? 'Sesi susulan' : 'Try out'}</small><b>${m.sesi.nama}</b></div>
        <div class="kanan"><span class="timer" id="timer">${ikon('jam')}<span>--:--</span></span>
          <button class="btn emas kecil" id="btn-nav">${ikon('menu')}<span class="label-panjang">Daftar soal</span></button></div>
      </header>
      <div class="uj-alat">
        <span class="kecil" style="color:#C7D2FE">${(App.Sesi.me || {}).n || ''}</span>
        <span class="fs" style="margin-left:auto;display:flex;gap:4px" aria-label="Ukuran huruf">${FS.map((f, i) => h`<button data-fs="${i}" class="${i === fsLv ? 'aktif' : ''}" style="font-size:${11 + i * 2}px">A</button>`)}</span>
        <button class="btn kecil garis" id="btn-penuh" style="color:#fff;border-color:rgba(255,255,255,.3)" title="Layar penuh">${ikon('penuh')}</button>
      </div>
      <div class="pita-offline sembunyi" id="pita-off">${ikon('wifimati')} Sinyal terputus. Tetap kerjakan — jawaban tersimpan di perangkat dan dikirim otomatis saat sinyal kembali.</div>
      <div class="uj-isi" id="uj-isi"><section class="uj-bacaan" id="uj-bacaan"></section><section class="uj-soal" id="uj-soal"></section></div>
      <footer class="uj-bawah">
        <button class="btn sebelum" id="btn-sebelum">${ikon('kiri')}<span class="label-panjang">Sebelumnya</span></button>
        <div class="tengah"><button class="btn ragu" id="btn-ragu">${ikon('bendera')} Ragu-ragu</button></div>
        <button class="btn biru" id="btn-lanjut"><span>Berikutnya</span>${ikon('kanan')}</button>
      </footer>
      <div class="uj-kaki" id="uj-kaki"></div>
      <aside class="laci" id="laci" aria-label="Daftar nomor soal"><div class="kepala"><div><b>Daftar Soal</b><small>${N} soal · ketuk nomor untuk berpindah</small></div>
        <button class="ikonbtn" id="tutup-laci" style="margin-left:auto">${ikon('silang')}</button></div><div class="isi" id="laci-isi"></div>
        <div style="padding:12px 16px;border-top:1px solid var(--line)"><button class="btn bahaya penuh" id="btn-selesai2">${ikon('kirim')} Selesai & kumpulkan</button></div></aside>
    </div>`);
    const elIsi = $('#uj-isi'), elBacaan = $('#uj-bacaan'), elSoal = $('#uj-soal');
    let stimTerakhir = null;

    function tampil() {
      const it = urut[L.kini], b = it.b, s = b.stim ? P.stim[b.stim] : null;
      const mobil = innerWidth <= 1024;
      elIsi.classList.toggle('tunggal', !s);
      if (s) {
        const baru = stimTerakhir !== b.stim;
        elBacaan.innerHTML = String(h`<div class="tempel ${mobil && !baru ? 'ciut' : ''}" id="bacaan-isi">
          <div class="label-bacaan">${ikon('buku')} Bacaan untuk soal ${urut.filter(x => x.b.stim === b.stim).map(x => urut.indexOf(x) + 1).join(', ')}</div>
          ${Soal.htmlStimulus(s, P.ctx)}</div>
          ${mobil ? h`<button class="btn garis kecil penuh" id="btn-ciut" style="margin-top:8px">${ikon('buku')} ${!baru ? 'Buka bacaan' : 'Tutup bacaan'}</button>` : ''}`);
        const bc = $('#btn-ciut'); if (bc) bc.onclick = () => { const t = $('#bacaan-isi'); t.classList.toggle('ciut'); bc.innerHTML = String(h`${ikon('buku')} ${t.classList.contains('ciut') ? 'Buka bacaan' : 'Tutup bacaan'}`); };
        stimTerakhir = b.stim;
      } else { elBacaan.innerHTML = ''; stimTerakhir = null; }
      const ragu = L.r.indexOf(b.id) >= 0;
      elSoal.innerHTML = String(h`<div class="no-soal"><span class="n">${L.kini + 1}</span><span class="kecil">dari ${N}</span>
        <span class="pil garis">${KTKA.SINGKAT_BENTUK[b.bentuk] || b.bentuk}</span>${ragu ? h`<span class="pil emas">${ikon('bendera')} Ragu-ragu</span>` : ''}</div>
        ${Soal.htmlButir(b, P.ctx, { peta: it.peta, jawab: L.j[b.id] })}`);
      $('#btn-sebelum').disabled = L.kini === 0;
      const akhir = L.kini === N - 1, bl = $('#btn-lanjut');
      bl.className = 'btn ' + (akhir ? 'bahaya' : 'biru');
      bl.innerHTML = String(akhir ? h`${ikon('kirim')}<span>Selesai</span>` : h`<span>Berikutnya</span>${ikon('kanan')}`);
      const br = $('#btn-ragu'); br.classList.toggle('on', ragu);
      window.scrollTo(0, 0); elSoal.scrollTop = 0;
      laci();
    }
    App._renderUlang = tampil;
    function laci() {
      let nj = 0, nr = 0;
      urut.forEach(x => { if (Soal.terjawab(x.b, L.j[x.b.id])) nj++; if (L.r.indexOf(x.b.id) >= 0) nr++; });
      $('#laci-isi').innerHTML = String(h`<div class="ringkas3"><div style="background:var(--navy);color:#fff">${nj} Terjawab</div><div style="background:var(--gold);color:var(--navy)">${nr} Ragu</div><div>${N - nj} Belum</div></div>
        <div class="navno">${urut.map((x, i) => { const ja = Soal.terjawab(x.b, L.j[x.b.id]), rg = L.r.indexOf(x.b.id) >= 0, sb = Soal.sebagian(x.b, L.j[x.b.id]);
          return h`<button data-no="${i}" class="${rg ? 'ragu' : ja ? 'jawab' : ''} ${i === L.kini ? 'kini' : ''}" aria-label="Soal ${i + 1}">${i + 1}<small>${rg ? 'ragu' : sb ? 'sebagian' : ''}</small></button>`; })}</div>
        <p class="kecil" style="margin-top:14px">Biru = terjawab · Kuning = ragu-ragu · Abu = belum dijawab.</p>`);
      $('#uj-kaki').textContent = 'Terjawab ' + nj + '/' + N + ' · tersimpan di perangkat · ' + (L.terkirim ? 'terkirim ' + App.jam(L.terkirim) : 'belum terkirim');
    }

    // ---------- interaksi
    elSoal.addEventListener('click', e => {
      if (selesai || L.st === 'terkunci') return;
      const b = urut[L.kini].b, op = e.target.closest('[data-op]'), kt = e.target.closest('[data-kat]');
      if (op) { L.j[b.id] = Soal.pilih(b, L.j[b.id], op.dataset.op); if (L.j[b.id] === '' || (Array.isArray(L.j[b.id]) && !L.j[b.id].length)) delete L.j[b.id]; ubah(); tampilPilihan(); }
      else if (kt) { L.j[b.id] = Soal.pilih(b, L.j[b.id], kt.dataset.lab, +kt.dataset.kat); if (!L.j[b.id].some(x => x)) delete L.j[b.id]; ubah(); tampilPilihan(); }
    });
    function tampilPilihan() {
      const it = urut[L.kini], b = it.b, j = L.j[b.id];
      $$('[data-op]', elSoal).forEach(x => { const on = b.bentuk === 'PG' ? j === x.dataset.op : Array.isArray(j) && j.indexOf(x.dataset.op) >= 0; x.classList.toggle('pilih', on); x.setAttribute('aria-checked', on); const kc = $('.kotak-cek', x); if (kc) kc.innerHTML = on ? String(ikon('centang')) : ''; });
      $$('[data-kat]', elSoal).forEach(x => { const on = Array.isArray(j) && j[+x.dataset.kat] === x.dataset.lab; x.classList.toggle('pilih', on); x.innerHTML = on ? String(ikon('centang')) : ''; });
      laci();
    }
    const pindah = i => { if (i < 0 || i >= N) return; L.kini = i; simpanLokal(); tampil(); };
    $('#btn-sebelum').onclick = () => pindah(L.kini - 1);
    $('#btn-lanjut').onclick = () => L.kini === N - 1 ? konfirmasiSelesai() : pindah(L.kini + 1);
    $('#btn-ragu').onclick = () => { const id = urut[L.kini].b.id, i = L.r.indexOf(id); if (i >= 0) L.r.splice(i, 1); else L.r.push(id); ubah(); tampil(); };
    $('#btn-nav').onclick = () => $('#laci').classList.add('buka');
    $('#tutup-laci').onclick = () => $('#laci').classList.remove('buka');
    $('#laci').addEventListener('click', e => { const b = e.target.closest('[data-no]'); if (b) { $('#laci').classList.remove('buka'); pindah(+b.dataset.no); } });
    $('#btn-selesai2').onclick = () => { $('#laci').classList.remove('buka'); konfirmasiSelesai(); };
    $$('[data-fs]').forEach(b => b.onclick = () => { const i = +b.dataset.fs; LS.set('fs', i); document.documentElement.style.setProperty('--fs-soal', FS[i] + 'px'); $$('[data-fs]').forEach(x => x.classList.toggle('aktif', x === b)); });
    $('#btn-penuh').onclick = () => layarPenuh(true);
    document.addEventListener('keydown', kunciTombol);
    function kunciTombol(e) {
      if (selesai || L.st === 'terkunci' || $('.tirai')) return;
      if (e.target.matches('input,textarea')) return;
      if (e.key === 'ArrowRight') pindah(L.kini + 1); else if (e.key === 'ArrowLeft') pindah(L.kini - 1);
    }

    // ---------- waktu
    const sentuh = matchMedia('(pointer: coarse)').matches;
    let autoKirimJadwal = 0;
    function detak() {
      const sisa = Math.round((batasWaktu - App.kini()) / 1000), t = $('#timer');
      if (!t) return;
      t.lastElementChild.textContent = App.durasi(Math.max(0, sisa));
      t.className = 'timer ' + (sisa <= 180 ? 'merah' : sisa <= 600 ? 'kuning' : '');
      if (sisa <= 0 && !selesai && !kumpulJalan && !autoKirimJadwal) {
        autoKirimJadwal = setTimeout(() => kumpul('waktu'), Math.random() * 12000);
        layarInfo('jam', 'Waktu habis', 'Jawaban Anda sedang dikirim otomatis. Jangan tutup aplikasi.');
      }
    }
    App.ulang(detak, 1000); detak();

    // ---------- sinkron berkala (jeda acak agar 400 siswa tidak bersamaan)
    let timerSinkron = 0, sinkronJalan = false;
    const jedaSinkron = () => (aturan.simpan || 150) * 1000 * (0.8 + Math.random() * 0.4);
    function jadwalSinkron(ms) { clearTimeout(timerSinkron); timerSinkron = setTimeout(sinkron, ms == null ? jedaSinkron() : ms); }
    async function sinkron() {
      if (selesai || sinkronJalan) return;
      if (!navigator.onLine) return jadwalSinkron(15000);
      sinkronJalan = true;
      const kirimVer = L.ver, ev = L.ev.slice(0, 30);
      try {
        const r = await api('ujian.simpan', { sesi, ver: L.ver, j: L.j, r: L.r, terj: urut.filter(x => Soal.terjawab(x.b, L.j[x.b.id])).length,
          pel: L.pel, st: L.st, kunci_t: L.kunci_t || 0, ev, dev: App.perangkat }, { pesan: false, batas: 30000 });
        L.ev = L.ev.slice(ev.length); L.terkirim = Date.now(); if (L.ver === kirimVer) L.dirty = false;
        terapkanServer(r);
      } catch (e) {
        if (e.kode === 'PERANGKAT_LAIN') { layarInfo('hp', 'Akun dipakai di perangkat lain', e.message); selesai = true; }
      } finally { sinkronJalan = false; simpanLokal(); laci(); if (!selesai) jadwalSinkron(L.st === 'terkunci' ? 12000 + Math.random() * 8000 : undefined); }
    }
    function terapkanServer(r) {
      if (!r) return;
      if (r.batas_waktu && r.batas_waktu !== batasWaktu) { if (r.batas_waktu > batasWaktu) toast('Waktu ditambah oleh pengawas.', 'info'); batasWaktu = r.batas_waktu; autoKirimJadwal = 0; }
      if (r.st === 'selesai') { selesaikan({ resi: r.resi || '', waktu: Date.now(), oleh: 'pengawas' }); return; }
      if (L.st === 'terkunci' && r.st === 'mengerjakan') { L.st = 'mengerjakan'; L.pel = 0; L.kunci_t = 0; tutupKunci(); toast('Layar dibuka oleh pengawas. Lanjutkan mengerjakan.', 'ok'); }
      if (r.cmd && r.cmd.pesan && r.cmd.pesan !== L.pesanAkhir) { L.pesanAkhir = r.cmd.pesan; }
    }
    addEventListener('online', onOnline); addEventListener('offline', onOffline);
    function onOnline() { $('#pita-off') && $('#pita-off').classList.add('sembunyi'); jadwalSinkron(2000 + Math.random() * 8000); }
    function onOffline() { $('#pita-off') && $('#pita-off').classList.remove('sembunyi'); }
    if (!navigator.onLine) onOffline();

    // ---------- deteksi pindah layar (kunci, bukan kumpul otomatis)
    let hilangSejak = 0, blurSejak = 0;
    function catatPindah(det, jenis) {
      if (selesai || L.st === 'terkunci' || !mulaiKerja || det < 1) return;
      const hitung = det >= (aturan.ambang || 5);
      L.ev.push({ j: jenis, d: Math.round(det), i: hitung ? 'dihitung' : 'singkat' });
      if (!hitung) { simpanLokal(); return; }
      L.pel = (L.pel || 0) + 1; simpanLokal();
      if (L.pel >= (aturan.batas || 3)) kunci();
      else modal({ judul: 'Peringatan', isi: h`<p>Anda meninggalkan halaman ujian selama ${Math.round(det)} detik. Ini tercatat sebagai pelanggaran <b>${L.pel} dari ${aturan.batas}</b>.</p><p class="kecil">Jika mencapai batas, layar akan dikunci dan hanya pengawas yang dapat membukanya.</p>`, aksi: [{ label: 'Saya mengerti', kelas: 'biru', nilai: 1 }] });
    }
    function onVis() { if (document.hidden) hilangSejak = Date.now(); else if (hilangSejak) { const d = (Date.now() - hilangSejak) / 1000; hilangSejak = 0; blurSejak = 0; catatPindah(d, 'pindah'); } }
    function onBlur() { if (!sentuh && !document.hidden) blurSejak = Date.now(); }
    function onFocus() { if (blurSejak && !hilangSejak) { const d = (Date.now() - blurSejak) / 1000; blurSejak = 0; catatPindah(d, 'fokus'); } }
    document.addEventListener('visibilitychange', onVis); addEventListener('blur', onBlur); addEventListener('focus', onFocus);
    function kunci() {
      L.st = 'terkunci'; L.kunci_t = App.kini(); L.ev.push({ j: 'terkunci', d: 0, i: 'batas ' + aturan.batas }); simpanLokal();
      tampilKunci(); jadwalSinkron(500);
    }
    function tampilKunci() {
      if ($('#tirai-kunci')) return;
      const t = document.createElement('div'); t.className = 'tirai-kunci'; t.id = 'tirai-kunci';
      t.innerHTML = String(h`<div class="kotak"><div class="ik-besar">${ikon('kunci')}</div><h2>Layar dikunci sementara</h2>
        <p>Anda telah meninggalkan halaman ujian sebanyak ${aturan.batas} kali. <b>Jawaban Anda aman dan belum dikumpulkan.</b></p>
        <p>Angkat tangan dan minta <b>pengawas</b> membuka kunci melalui aplikasi pengawas. Halaman ini akan terbuka otomatis.</p>
        <p class="kecil" id="kunci-status">Menghubungi server…</p><div class="putar" style="margin:12px auto"></div></div>`);
      document.body.appendChild(t);
    }
    function tutupKunci() { const t = $('#tirai-kunci'); if (t) t.remove(); }
    function layarPenuh(paksa) {
      const d = document.documentElement;
      if (document.fullscreenElement) return paksa ? document.exitFullscreen() : null;
      if (d.requestFullscreen) d.requestFullscreen().catch(() => {});
    }
    document.addEventListener('fullscreenchange', onFs);
    function onFs() { if (!document.fullscreenElement && mulaiKerja && !selesai && !sentuh) L.ev.push({ j: 'keluar_layar_penuh', d: 0, i: '' }); }

    // ---------- selesai
    async function konfirmasiSelesai() {
      const kosong = urut.map((x, i) => Soal.terjawab(x.b, L.j[x.b.id]) ? null : i + 1).filter(Boolean);
      const ragu = urut.map((x, i) => L.r.indexOf(x.b.id) >= 0 ? i + 1 : null).filter(Boolean);
      const sisa = Math.max(0, Math.round((batasWaktu - App.kini()) / 1000));
      const v = await modal({ judul: 'Kumpulkan jawaban?', lebar: false, isi: h`
        <div class="ringkas3" style="grid-template-columns:repeat(4,1fr)"><div>${N}<br><small>Total</small></div><div style="background:var(--blue-50)">${N - kosong.length}<br><small>Terjawab</small></div>
          <div style="background:var(--gold-50)">${ragu.length}<br><small>Ragu</small></div><div style="background:var(--bad-50)">${kosong.length}<br><small>Kosong</small></div></div>
        ${kosong.length ? h`<p class="kecil">${ikon('awas')} Belum dijawab: <b>${kosong.join(', ')}</b></p>` : ''}
        ${ragu.length ? h`<p class="kecil">${ikon('bendera')} Masih ragu-ragu: <b>${ragu.join(', ')}</b></p>` : ''}
        <p class="kecil">Sisa waktu ${App.durasi(sisa)}. Setelah dikumpulkan, jawaban tidak dapat diubah.</p>
        <label class="cek" style="margin-top:10px"><input type="checkbox" id="jujur"><span>Saya menyatakan telah menyelesaikan try out ini secara mandiri dan jujur tanpa bantuan pihak lain.</span></label>
        <div class="err" id="err-jujur" style="color:var(--bad);font-size:13px"></div>`,
        aksi: [{ label: 'Kembali ke soal', kelas: 'garis', nilai: null, ikon: 'kiri' }, { label: 'Kumpulkan', kelas: 'bahaya', nilai: 'ya', ikon: 'kirim' }],
        sebelumTutup: (val, md) => { if (val === 'ya' && !$('#jujur', md).checked) { $('#err-jujur', md).textContent = 'Centang pernyataan kejujuran terlebih dahulu.'; return false; } return true; } });
      if (v === 'ya') kumpul('siswa');
    }
    async function kumpul(sumber) {
      if (kumpulJalan || selesai) return;
      kumpulJalan = true;
      layarInfo('kirim', sumber === 'waktu' ? 'Waktu habis' : 'Mengumpulkan jawaban…', 'Mohon tunggu, jangan tutup aplikasi.');
      L.kumpul = { sumber, t: Date.now() }; await IDB.set(kunciIDB, { m: Object.assign({}, m, { batas_waktu: batasWaktu }), L, mulai: mulaiKerja });
      for (let coba = 0; ; coba++) {
        try {
          const r = await api('ujian.kumpul', { sesi, ver: L.ver, j: L.j, r: L.r, sumber }, { pesan: false, batas: 40000 });
          return selesaikan({ resi: r.resi, waktu: r.waktu || Date.now(), oleh: sumber });
        } catch (e) {
          if (e.kode === 'SUDAH') return selesaikan({ resi: (e.data && e.data.resi) || '', waktu: Date.now(), oleh: sumber });
          if (e.kode !== 'JARINGAN' && e.kode !== 'HTTP' && coba >= 2) { layarInfo('awas', 'Pengumpulan gagal', e.message + ' Jawaban tetap tersimpan di perangkat. Hubungi pengawas.'); kumpulJalan = false; return; }
          const t = $('#info-teks'); if (t) t.textContent = 'Sinyal bermasalah. Jawaban aman di perangkat — mencoba lagi otomatis (' + (coba + 1) + ')…';
          await App.tidur(navigator.onLine ? 6000 + Math.random() * 8000 : 4000);
        }
      }
    }
    function layarInfo(ik, judul, teks) {
      let t = $('#tirai-info');
      if (!t) { t = document.createElement('div'); t.className = 'tirai-kunci'; t.id = 'tirai-info'; t.style.background = '#F3F6FC'; document.body.appendChild(t); }
      t.innerHTML = String(h`<div class="kotak"><div class="ik-besar">${ikon(ik)}</div><h2>${judul}</h2><p id="info-teks">${teks}</p><div class="putar" style="margin:12px auto"></div></div>`);
    }
    async function selesaikan(tt) {
      if (selesai && !tt.resi) return;
      selesai = true; clearTimeout(timerSinkron); App.henti(); bersih();
      const terima = { sesi, resi: tt.resi, waktu: tt.waktu, oleh: tt.oleh, nama: (App.Sesi.me || {}).n, rombel: (App.Sesi.me || {}).rb, username: (App.Sesi.me || {}).un,
        kegiatan: m.sesi.nama, mapel: m.sesi.mapel, paket: m.paket.nama, jumlah: N, terjawab: urut.filter(x => Soal.terjawab(x.b, L.j[x.b.id])).length, pengawas: m.sesi.pengawas, ruang: m.sesi.ruang };
      await IDB.set('terima|' + (App.Sesi.me || {}).u + '|' + sesi, terima); await IDB.del(kunciIDB);
      App.Data.basi('siswa.beranda');
      ['#tirai-info', '#tirai-kunci'].forEach(s => { const x = $(s); if (x) x.remove(); });
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      App.hal['tanda-terima'](el, terima);
    }
    function bersih() {
      App.sebelumPindah = null; App._renderUlang = null;
      document.removeEventListener('visibilitychange', onVis); removeEventListener('blur', onBlur); removeEventListener('focus', onFocus);
      removeEventListener('online', onOnline); removeEventListener('offline', onOffline); removeEventListener('beforeunload', onUnload);
      document.removeEventListener('keydown', kunciTombol); document.removeEventListener('fullscreenchange', onFs);
    }
    function onUnload(e) { if (!selesai) { IDB.set(kunciIDB, { m: Object.assign({}, m, { batas_waktu: batasWaktu }), L, mulai: mulaiKerja }); e.preventDefault(); e.returnValue = ''; } }
    addEventListener('beforeunload', onUnload);
    App.sebelumPindah = () => {
      if (selesai) { bersih(); return true; }
      if (location.hash.indexOf('ujian/' + sesi) >= 0) return true;
      history.replaceState(null, '', '#/ujian/' + sesi);
      toast('Try out masih berlangsung. Gunakan tombol Selesai untuk mengumpulkan.', 'warn');
      return false;
    };

    // ---------- mulai
    if (L.kumpul) { kumpul(L.kumpul.sumber); return; }
    if (L.st === 'terkunci') { mulaiKerja = true; if (!L.kunci_t) L.kunci_t = App.kini(); tampilKunci(); }
    tampil();
    if (!mulaiKerja) {
      const v = await modal({ judul: 'Siap mengerjakan', wajib: true, tanpaFokus: true, isi: h`
        <p><b>${m.sesi.nama}</b> · ${N} soal · ${m.sesi.durasi} menit</p>
        <ul class="langkah">
          <li>Waktu berjalan sejak Anda memasukkan token. Sisa waktu tampil di kanan atas.</li>
          <li>Jawaban tersimpan otomatis di perangkat dan dikirim berkala ke server, walau sinyal putus.</li>
          <li>Jangan berpindah aplikasi/tab. Setelah ${aturan.batas} kali, layar dikunci sampai dibuka pengawas.</li>
          <li>Tandai <b>Ragu-ragu</b> untuk soal yang ingin diperiksa lagi. Kumpulkan dengan tombol <b>Selesai</b>.</li></ul>`,
        aksi: [{ label: 'Mulai mengerjakan', kelas: 'emas besar', nilai: 1, ikon: 'kanan' }] });
      if (v && !sentuh) layarPenuh();
      mulaiKerja = true; simpanLokal();
    }
    jadwalSinkron(5000 + Math.random() * 25000);
  };

  // =========================================================== tanda terima
  App.hal['tanda-terima'] = function (el, t) {
    const lembar = () => h`<div class="lembar" style="min-height:0">${App.kop('Tanda Terima Lembar Jawaban', t.kegiatan)}
      <table class="t" style="margin-top:10px"><tbody>
        <tr><td>Nama</td><td><b>${t.nama}</b></td></tr><tr><td>Username · Rombel</td><td>${t.username} · ${t.rombel}</td></tr>
        <tr><td>Kegiatan</td><td>${t.kegiatan} (${App.MAPEL[t.mapel] || t.mapel})</td></tr><tr><td>Paket</td><td>${t.paket}</td></tr>
        <tr><td>Waktu kumpul</td><td>${App.tglJam(t.waktu)}</td></tr><tr><td>Terjawab</td><td>${t.terjawab} dari ${t.jumlah} soal</td></tr>
        <tr><td>Kode resi</td><td class="mono" style="font-size:18px;font-weight:800;letter-spacing:.1em">${t.resi || '-'}</td></tr>
        <tr><td>Dikumpulkan oleh</td><td>${t.oleh === 'waktu' ? 'Sistem (waktu habis)' : t.oleh === 'pengawas' ? 'Pengawas' : 'Siswa'}</td></tr></tbody></table>
      <p class="kecil" style="margin-top:12px">Nilai dan pembahasan dapat dilihat setelah semua sesi selesai dan guru menutup kegiatan.</p></div>`;
    el.innerHTML = String(h`<div class="ujian"><div class="wadah" style="max-width:720px">
      <div class="kartu aksen" style="text-align:center"><div class="ik-besar" style="width:72px;height:72px;border-radius:50%;background:var(--ok-50);color:var(--ok);display:grid;place-items:center;margin:0 auto 12px">${ikon('centang')}</div>
        <h2>Jawaban berhasil dikumpulkan</h2><p>Terima kasih, ${t.nama}. Simpan kode resi berikut sebagai bukti.</p>
        <div class="token-besar" style="margin:8px 0 16px">${t.resi || '—'}</div>
        <div class="baris" style="justify-content:center"><button class="btn garis" id="tt-cetak">${ikon('cetak')} Cetak / simpan PDF</button>
          <a class="btn emas" href="#/beranda">${ikon('rumah')} Kembali ke beranda</a></div></div>
      <div style="margin-top:16px">${lembar()}</div></div></div>`);
    $('#tt-cetak').onclick = () => App.cetak(lembar(), 'Tanda terima ' + t.resi);
  };
})();
