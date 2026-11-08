/* Halaman siswa: beranda (token sesi & katalog paket), latihan mandiri, hasil & pembahasan, laporan saya. */
(function () {
  'use strict';
  const { h, raw, $, $$, ikon, api, toast, modal, IDB, Sesi, Paket, angka, angka2, Grafik } = App;
  const MAP = App.MAPEL;

  // =========================================================== BERANDA
  App.hal['beranda'] = async function (el) {
    const me = Sesi.me || {};
    let tabMapel = App.LS.get('tab_mapel', 'BIN'), data = null;
    const gambar = async d => {
      data = d;
      const now = App.kini();
      const aktif = d.jadwal.filter(j => j.status === 'berlangsung' && j.saya !== 'selesai');
      const nanti = d.jadwal.filter(j => j.status === 'dijadwalkan');
      const lokal = {}; for (const j of aktif) lokal[j.sesi] = !!(await IDB.get('uj|' + me.u + '|' + j.sesi));
      const tutup = d.hasil.filter(x => x.tutup);
      const rata = tutup.length ? tutup.reduce((a, b) => a + b.skor, 0) / tutup.length : null;
      el.innerHTML = String(h`
        <section class="hero"><div><h1>Halo, ${String(me.n || '').split(' ')[0]}!</h1>
          <p>${App.konfig && App.konfig.nama_sekolah || ''} · Rombel ${me.rb || '-'}</p>
          <div class="stat"><div><b>${d.hasil.length}</b>Try out diikuti</div><div><b>${rata == null ? '–' : angka(rata, 1)}</b>Rata-rata nilai</div>
            <div><b>${nanti.length}</b>Sesi terjadwal</div></div></div>
          <img src="./assets/logo-bulat.webp" alt="" width="150" height="150" style="border-radius:50%"></section>
        ${aktif.map(j => h`<div class="kartu sesi-aktif" style="margin-bottom:16px">
          <div class="kartu-kepala"><div><span class="pil kuning"><span class="titik denyut"></span> Sesi berlangsung</span>
            <h3 style="margin-top:8px">${j.nama}</h3><div class="kecil">${MAP[j.mapel]} · ${j.paket.nama} · ${j.durasi} menit${j.ruang ? ' · ' + j.ruang : ''}${j.jenis === 'susulan' ? ' · susulan' : ''}</div></div>
            <span class="kecil" id="siap-${j.sesi}">${ikon('unduh')} Menyiapkan paket…</span></div>
          ${lokal[j.sesi] || j.saya === 'mengerjakan' || j.saya === 'terkunci' ? h`
            <p>Anda sudah memulai try out ini. Lanjutkan dari perangkat yang sama.</p>
            <button class="btn emas besar" data-aksi="lanjut" data-sesi="${j.sesi}">${ikon('kanan')} Lanjutkan try out</button>
            ${!lokal[j.sesi] ? h`<p class="kecil" style="margin-top:8px">Pindah perangkat? Masukkan token, lalu minta pengawas melakukan <b>reset login</b>.</p>
              <div class="baris"><input class="in token-in" maxlength="6" placeholder="TOKEN" id="tok-${j.sesi}" style="max-width:220px" autocomplete="off" autocapitalize="characters">
              <button class="btn garis" data-aksi="masuk" data-sesi="${j.sesi}">Masuk dengan token</button></div>` : ''}`
          : h`<label class="f" for="tok-${j.sesi}">Token sesi dari pengawas</label>
            <div class="baris"><input class="in token-in" maxlength="6" placeholder="TOKEN" id="tok-${j.sesi}" style="max-width:240px" autocomplete="off" autocapitalize="characters" inputmode="text">
            <button class="btn emas besar" data-aksi="masuk" data-sesi="${j.sesi}">Masuk ruang ujian ${ikon('kanan')}</button></div>
            <p class="kecil" style="margin-top:8px">${ikon('info')} Waktu ${j.durasi} menit mulai berjalan setelah token benar.</p>`}
        </div>`)}
        ${d.to_berlangsung && !aktif.length ? h`<div class="kartu" style="margin-bottom:16px;border-left:4px solid var(--warn)">${ikon('info')} Try out sedang berlangsung di sekolah. Latihan mandiri dibuka kembali setelah semua sesi selesai.</div>` : ''}
        <div class="kolom2">
          <div class="kartu"><div class="kartu-kepala"><h3>Paket Try Out</h3>
            <div class="seg">${['BIN', 'MAT'].map(m => h`<button data-aksi="mapel" data-m="${m}" class="${tabMapel === m ? 'aktif' : ''}">${MAP[m]}</button>`)}</div></div>
            <div class="paket-list">${d.paket.filter(p => p.mapel === tabMapel).map(p => kartuPaket(p, d.jadwal))}
              ${!d.paket.some(p => p.mapel === tabMapel) ? App.kosong('Belum ada paket', 'Paket akan tampil setelah dipasang admin.') : ''}</div></div>
          <div>
            <div class="kartu"><h3>Jadwal</h3>${nanti.length ? nanti.map(j => h`<div class="log-item">${ikon('kalender')}<div><b>${j.nama}</b><div class="kecil">${App.tglJam(j.mulai)} · ${j.durasi} menit${j.ruang ? ' · ' + j.ruang : ''}</div></div></div>`)
              : h`<p class="kecil">Belum ada sesi terjadwal untuk rombel Anda.</p>`}</div>
            <div class="kartu"><h3>Hasil terbaru</h3>${d.hasil.length ? d.hasil.slice(-4).reverse().map(x => h`<a class="log-item" href="${x.tutup ? '#/hasil/' + x.kegiatan : '#/hasil'}" style="color:inherit;text-decoration:none">
              ${ikon('piala')}<div style="flex:1"><b>${x.nama}</b><div class="kecil">${MAP[x.mapel] || ''} · ${App.tgl(x.waktu)}</div></div>${x.tutup ? h`<b>${angka2(x.skor)}</b>` : h`<span class="pil">Menunggu</span>`}</a>`)
              : h`<p class="kecil">Hasil try out akan tampil di sini.</p>`}</div>
            <div class="kartu" style="background:var(--navy);color:#fff"><h3 style="color:#fff">${ikon('target')} Latihan mandiri</h3>
              <p style="color:#C7D2FE">${d.latihan_buka ? 'Latih soal dari paket yang sudah dibahas, bank soal guru, dan soal Matematika berparameter.' : 'Latihan mandiri sedang ditutup.'}</p>
              ${d.latihan_buka ? h`<a class="btn emas" href="#/latihan">Mulai latihan</a>` : ''}</div>
          </div></div>`);
      // siapkan paket yang dijadwalkan/berlangsung di belakang layar
      const perlu = d.paket.filter(p => p.unduh && p.asal === 'resmi').concat(d.jadwal.filter(j => j.status !== 'selesai').map(j => j.paket));
      const unik = {}; perlu.forEach(p => { unik[p.id] = p; });
      Paket.prefetch(Object.values(unik));
      for (const j of aktif) siapkan(j);
    };
    const kartuPaket = (p, jadwal) => {
      const j = jadwal.find(x => x.paket.id === p.id && x.status !== 'selesai');
      const ket = {
        terkunci: h`${ikon('kunci')} Terkunci · dibuka saat try out`, dijadwalkan: h`${ikon('kalender')} ${j ? App.tglJam(j.mulai) : 'Dijadwalkan'}`,
        berlangsung: h`${ikon('jam')} Sedang berlangsung`, selesai: h`${ikon('centang')} Sudah dikerjakan · menunggu pembahasan`,
        pembahasan: h`${ikon('piala')} Nilai ${angka2(p.skor)}`, latihan: h`${ikon('target')} Terbuka untuk latihan`
      }[p.st];
      const tombol = p.st === 'pembahasan' ? h`<a class="btn biru kecil" href="#/hasil/${p.kegiatan}">Pembahasan</a>`
        : p.st === 'latihan' ? h`<a class="btn garis kecil" href="#/latihan" data-aksi="latihPaket" data-p="${p.id}">Latihan</a>`
        : p.st === 'berlangsung' ? h`<span class="pil kuning">Masukkan token di atas</span>` : '';
      return h`<div class="paket st-${p.st}"><div class="no">${p.nomor || '•'}</div>
        <div><div>${App.pil(p.st)}</div><h4>${p.nama}</h4><div class="meta"><span>${p.jumlah} soal</span><span>${p.durasi} menit</span><span>${ket}</span></div></div>
        <div class="aksi">${tombol}</div></div>`;
    };
    const siapkan = async j => {
      const s = $('#siap-' + j.sesi); if (!s) return;
      try { await Paket.unduh(j.paket, 'isi', f => { s.innerHTML = String(h`${ikon('unduh')} Mengunduh ${Math.round(f * 100)}%`); }); const x = $('#siap-' + j.sesi); if (x) x.innerHTML = String(h`<span class="pil hijau">${ikon('centang')} Paket siap di perangkat</span>`); }
      catch (e) { const x = $('#siap-' + j.sesi); if (x) x.innerHTML = String(h`<span class="pil merah">Paket belum terunduh</span>`); }
    };
    App.aksi(el, {
      mapel: b => { tabMapel = b.dataset.m; App.LS.set('tab_mapel', tabMapel); gambar(data); },
      masuk: b => masukUjian(b.dataset.sesi, ($('#tok-' + b.dataset.sesi) || {}).value, false, b),
      lanjut: b => masukUjian(b.dataset.sesi, '', true, b),
      latihPaket: b => { App.LS.set('latihan_paket', b.dataset.p); App.ke('latihan'); }
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.token-in')) { const b = e.target.parentNode.querySelector('[data-aksi=masuk]'); if (b) b.click(); } });
    el.addEventListener('input', e => { if (e.target.matches('.token-in')) e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
    async function masukUjian(sesi, token, lanjut, btn) {
      const j = data.jadwal.find(x => x.sesi === sesi); if (!j) return;
      token = String(token || '').trim().toUpperCase();
      if (!lanjut && token.length < 4) return toast('Masukkan token sesi dari pengawas.', 'warn');
      await App.sibuk(btn, async () => {
        await Paket.unduh(j.paket, 'isi');                         // paket harus ada sebelum waktu berjalan
        try {
          const r = await api('ujian.mulai', { sesi, token, lanjut, dev: App.perangkat, klien: klienSingkat() }, { batas: 40000 });
          const lama = await IDB.get('uj|' + me.u + '|' + sesi);
          let L = lama && lama.L;
          if (L && r.state && r.state.ver > (L.ver || 0)) L = Object.assign(L, { ver: r.state.ver, j: r.state.j || {}, r: r.state.r || [] });
          if (L && r.state && r.state.st === 'terkunci') L.st = 'terkunci';
          await IDB.set('uj|' + me.u + '|' + sesi, { m: r, L: L || undefined, mulai: lama ? lama.mulai : false });
          App.ke('ujian/' + sesi);
        } catch (e) {
          if (e.kode === 'SUDAH') { App.Data.basi('siswa.beranda'); App.render(); }
          throw e;
        }
      });
    }
    el.innerHTML = String(App.kerangka(3));
    await App.ambil('siswa.beranda', {}, gambar, { segar: 10000, langsung: true });
    App.ulang(() => { if (Aktif.jatuh('beranda', 45000, 120000) && data && data.jadwal.some(j => j.status !== 'selesai')) App.ambil('siswa.beranda', {}, gambar, { segar: 0, langsung: true }).catch(() => {}); }, 5000);
  };
  const Aktif = App.Aktif;
  function klienSingkat() {
    const ua = navigator.userAgent, os = (/(Android|iPhone|iPad|Windows|Mac OS|CrOS|Linux)/.exec(ua) || ['', 'Lain'])[1], br = (/(Edg|OPR|SamsungBrowser|Firefox|Chrome|Safari)/.exec(ua) || ['', '?'])[1];
    return os + ' · ' + br + ' · ' + innerWidth + '×' + innerHeight;
  }

  // =========================================================== LATIHAN
  App.hal['latihan'] = async function (el) {
    el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Latihan mandiri</div><h1>Rakit latihan</h1><p>Pilih sumber soal, lalu kerjakan dengan umpan balik langsung setelah setiap soal.</p></div></div>${App.kerangka(2)}`);
    let src;
    try { src = await App.ambil('latihan.sumber', {}, null, { segar: 60000, langsung: true }); }
    catch (e) { el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Latihan mandiri</div><h1>Latihan</h1></div></div>${App.kosong('Latihan belum tersedia', e.message, h`<a class="btn garis" href="#/beranda">Kembali</a>`)}`); return; }
    const riwayat = await App.ambil('siswa.hasil', {}, null, { segar: 30000 }).catch(() => ({ latihan: [] }));
    const prePaket = App.LS.get('latihan_paket', ''); App.LS.del('latihan_paket');
    const st = { mapel: prePaket ? (src.paket.find(p => p.id === prePaket) || {}).mapel || 'BIN' : App.LS.get('tab_mapel', 'BIN'), sumber: prePaket ? 'paket' : 'paket', paket: prePaket, elemen: '', n: 10, waktu: 0 };
    const gambar = () => {
      const paket = src.paket.filter(p => p.mapel === st.mapel), bank = src.butir.filter(b => b.mapel === st.mapel);
      if (st.sumber === 'paket' && !paket.length) st.sumber = bank.length ? 'bank' : st.mapel === 'MAT' ? 'param' : 'paket';
      if (st.sumber === 'param' && st.mapel !== 'MAT') st.sumber = 'paket';
      const elemenList = st.mapel === 'MAT' ? ['Bilangan', 'Aljabar', 'Geometri dan Pengukuran', 'Data dan Peluang'] : ['Pemahaman Tekstual', 'Pemahaman Inferensial', 'Evaluasi dan Apresiasi'];
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Latihan mandiri</div><h1>Rakit latihan</h1><p>Pilih sumber soal, lalu kerjakan dengan umpan balik langsung setelah setiap soal.</p></div></div>
        <div class="kolom2"><div class="kartu aksen">
          <div class="fld"><label class="f">Mata pelajaran</label><div class="seg">${['BIN', 'MAT'].map(m => h`<button data-aksi="mapel" data-v="${m}" class="${st.mapel === m ? 'aktif' : ''}">${MAP[m]}</button>`)}</div></div>
          <div class="fld"><label class="f">Sumber soal</label><div class="seg">
            <button data-aksi="sumber" data-v="paket" class="${st.sumber === 'paket' ? 'aktif' : ''}" ${paket.length ? '' : 'disabled'}>Paket try out (${paket.length})</button>
            <button data-aksi="sumber" data-v="bank" class="${st.sumber === 'bank' ? 'aktif' : ''}" ${bank.length ? '' : 'disabled'}>Bank soal guru (${bank.length})</button>
            ${st.mapel === 'MAT' ? h`<button data-aksi="sumber" data-v="param" class="${st.sumber === 'param' ? 'aktif' : ''}">Soal berparameter</button>` : ''}</div>
            ${!paket.length && st.sumber === 'paket' ? h`<p class="kecil">Paket try out terbuka untuk latihan setelah guru menutup kegiatannya.</p>` : ''}</div>
          ${st.sumber === 'paket' && paket.length ? h`<div class="fld"><label class="f">Paket</label><select class="in" name="paket">${paket.map(p => h`<option value="${p.id}" ${st.paket === p.id ? 'selected' : ''}>${p.nama}</option>`)}</select></div>` : ''}
          <div class="grid3">
            <div class="fld"><label class="f">Elemen</label><select class="in" name="elemen"><option value="">Semua elemen</option>${elemenList.map(x => h`<option ${st.elemen === x ? 'selected' : ''}>${x}</option>`)}</select></div>
            <div class="fld"><label class="f">Jumlah soal</label><select class="in" name="n">${[5, 10, 15, 20, 30].map(x => h`<option value="${x}" ${st.n === x ? 'selected' : ''}>${x} soal</option>`)}</select></div>
            <div class="fld"><label class="f">Batas waktu</label><select class="in" name="waktu">${[[0, 'Tanpa batas'], [10, '10 menit'], [20, '20 menit'], [30, '30 menit']].map(x => h`<option value="${x[0]}" ${st.waktu === x[0] ? 'selected' : ''}>${x[1]}</option>`)}</select></div>
          </div>
          <button class="btn emas besar" data-aksi="mulai">${ikon('target')} Mulai latihan</button>
          <p class="kecil" style="margin-top:10px">Nilai latihan dicatat untuk laporan Anda, tetapi tidak memengaruhi nilai try out.</p></div>
          <div class="kartu"><h3>Riwayat latihan</h3>${(riwayat.latihan || []).length ? (riwayat.latihan || []).slice(-8).reverse().map(l => h`<div class="log-item">${ikon('target')}<div style="flex:1"><b>${l.sumber}</b><div class="kecil">${MAP[l.mapel] || ''} · ${App.tglJam(l.waktu)} · ${l.benar}/${l.n} benar</div></div><b>${angka(l.skor, 0)}</b></div>`)
            : h`<p class="kecil">Belum ada latihan.</p>`}</div></div>`);
    };
    gambar();
    el.addEventListener('change', e => { if (e.target.name) { st[e.target.name] = e.target.name === 'n' || e.target.name === 'waktu' ? Number(e.target.value) : e.target.value; } });
    App.aksi(el, {
      mapel: b => { st.mapel = b.dataset.v; st.paket = ''; gambar(); },
      sumber: b => { st.sumber = b.dataset.v; gambar(); },
      mulai: b => App.sibuk(b, async () => {
        const items = [], acak = arr => App.kocok(arr, Math.random);
        let judul = '';
        if (st.sumber === 'paket') {
          const p = src.paket.find(x => x.id === (st.paket || (src.paket.find(y => y.mapel === st.mapel) || {}).id));
          if (!p) throw new Error('Pilih paket.');
          const isi = await Paket.buka(p, p.ki, 'isi'), bah = await Paket.buka(p, p.kb, 'bahas'), P = App.Soal.dariPaket(isi);
          // ambil per kelompok stimulus agar bacaan tetap utuh
          let pool = P.butir.filter(x => !st.elemen || x.elemen === st.elemen);
          const grup = {}; pool.forEach(x => { const k = x.stim || x.id; (grup[k] = grup[k] || []).push(x); });
          acak(Object.keys(grup)).forEach(k => { if (items.length < st.n) grup[k].forEach(x => { if (items.length < st.n) { const z = bah.butir[x.id] || {}; items.push({ b: x, stim: x.stim ? P.stim[x.stim] : null, ctx: P.ctx, k: z.k || [], p: z.p || '', a: z.a || [] }); } }); });
          judul = p.nama;
        } else if (st.sumber === 'bank') {
          const pool = acak(src.butir.filter(x => x.mapel === st.mapel && (!st.elemen || x.elemen === st.elemen))).slice(0, st.n), B = App.Soal.dariBank(pool);
          B.butir.forEach(x => items.push({ b: x, stim: x.stim ? B.stim[x.stim] : null, ctx: B.ctx, k: x._k, p: x._p, a: x._a }));
          judul = 'Bank soal ' + MAP[st.mapel];
        } else {
          await App.modul('parametrik');
          const B = App.Soal.dariBank(App.Parametrik.acak(st.n, st.elemen));
          B.butir.forEach(x => items.push({ b: x, stim: null, ctx: B.ctx, k: x._k, p: x._p, a: [] }));
          judul = 'Soal berparameter Matematika';
        }
        if (!items.length) throw new Error('Tidak ada soal yang cocok dengan pilihan ini.');
        App._latihan = { judul: judul + (st.elemen ? ' · ' + st.elemen : ''), mapel: st.mapel, items, i: 0, jawab: {}, cek: {}, mulai: Date.now(), batas: st.waktu ? Date.now() + st.waktu * 60000 : 0 };
        App.ke('latihan/main');
      })
    });
    if (prePaket) $('[data-aksi=mulai]', el).scrollIntoView({ block: 'center' });
  };

  App.hal['latihan/main'] = async function (el) {
    await App.modul('ujian');
    const X = App._latihan;
    if (!X) return App.ke('latihan', true);
    const N = X.items.length, S = App.Soal;
    const gambar = () => {
      if (X.i >= N) return ringkasan();
      const it = X.items[X.i], b = it.b, sudah = !!X.cek[b.id], j = X.jawab[b.id];
      const poin = sudah ? S.skor(b.bentuk, it.k, j, 'parsial') : 0;
      el.innerHTML = String(h`<div class="baris antara" style="margin-bottom:12px"><div><div class="eyebrow" style="color:var(--blue);font-weight:700;font-size:11px;letter-spacing:.08em">LATIHAN · ${MAP[X.mapel]}</div><h3 style="margin:0">${X.judul}</h3></div>
          <div class="baris">${X.batas ? h`<span class="timer" id="lt-timer">${ikon('jam')}<span>--:--</span></span>` : ''}<button class="btn garis kecil" data-aksi="akhiri">Akhiri</button></div></div>
        <div class="progres" style="height:8px;margin-bottom:16px"><div style="width:${Math.round(X.i / N * 100)}%"></div></div>
        <div class="${it.stim ? 'kolom2s' : ''}">
          ${it.stim ? h`<div class="kartu" style="max-height:75vh;overflow:auto"><details ${X.i === 0 || (X.items[X.i - 1] || {}).stim !== it.stim ? 'open' : ''} open><summary class="f">${ikon('buku')} Bacaan</summary>${S.htmlStimulus(it.stim, it.ctx)}</details></div>` : ''}
          <div class="kartu"><div class="no-soal"><span class="n">${X.i + 1}</span><span class="kecil">dari ${N}</span><span class="pil garis">${KTKA.SINGKAT_BENTUK[b.bentuk]}</span>
            ${sudah ? h`<span class="pil ${poin >= 0.999 ? 'hijau' : poin > 0 ? 'kuning' : 'merah'}">${poin >= 0.999 ? 'Benar' : poin > 0 ? 'Sebagian benar' : 'Belum tepat'} · ${angka(poin, 2)} poin</span>` : ''}</div>
            <div id="lt-soal">${S.htmlButir(b, it.ctx, { jawab: j, kunci: it.k, alasan: it.a, tampilKunci: sudah })}</div>
            ${sudah && it.p ? h`<div class="bahas"><h5>${ikon('lampu')} Pembahasan</h5><div class="teks" style="font-size:15px">${raw(KTKA.render(it.p, it.ctx))}</div></div>` : ''}
            <div class="baris antara" style="margin-top:16px">
              <button class="btn garis" data-aksi="sebelum" ${X.i === 0 ? 'disabled' : ''}>${ikon('kiri')} Sebelumnya</button>
              ${sudah ? h`<button class="btn biru" data-aksi="lanjut">${X.i === N - 1 ? 'Lihat ringkasan' : 'Berikutnya'} ${ikon('kanan')}</button>`
                : h`<button class="btn emas" data-aksi="periksa" ${S.terjawab(b, j) || S.sebagian(b, j) ? '' : 'disabled'}>${ikon('centang')} Periksa jawaban</button>`}</div></div></div>`);
      window.scrollTo(0, 0);
    };
    App._renderUlang = gambar;
    const ringkasan = async () => {
      App.henti();
      let poin = 0, penuh = 0; const el2 = {};
      X.items.forEach(it => { const p = S.skor(it.b.bentuk, it.k, X.jawab[it.b.id], 'parsial'); poin += p; if (p >= 0.999) penuh++; const e = it.b.elemen || '-'; el2[e] = el2[e] || [0, 0]; el2[e][0] += p; el2[e][1]++; });
      const skor = Math.round(poin / N * 10000) / 100;
      if (!X.tersimpan) {
        X.tersimpan = true;
        api('latihan.simpan', { mapel: X.mapel, sumber: X.judul.slice(0, 80), skor, benar: penuh, jumlah: N, mulai: X.mulai,
          butir: X.items.map(it => ({ id: it.b.id, p: Math.round(S.skor(it.b.bentuk, it.k, X.jawab[it.b.id], 'parsial') * 100) / 100 })) }, { pesan: false })
          .then(() => App.Data.basi('siswa.hasil')).catch(() => toast('Nilai latihan belum tercatat di server (koneksi).', 'warn'));
      }
      el.innerHTML = String(h`<div class="kartu aksen" style="max-width:720px;margin:0 auto;text-align:center"><h2>Latihan selesai</h2><p>${X.judul}</p>
        <div style="display:flex;justify-content:center">${Grafik.gauge(skor)}</div>
        <p>${penuh} dari ${N} soal benar penuh · ${App.durasiKata((Date.now() - X.mulai) / 1000)}</p>
        <div style="text-align:left;max-width:480px;margin:0 auto">${Grafik.batangH(Object.keys(el2).map(k => ({ label: k, nilai: el2[k][0] / el2[k][1] * 100, teks: angka(el2[k][0], 1) + '/' + el2[k][1] })))}</div>
        <div class="baris" style="justify-content:center;margin-top:16px"><button class="btn garis" data-aksi="tinjau">${ikon('mata')} Tinjau soal</button>
          <a class="btn emas" href="#/latihan">${ikon('target')} Latihan lagi</a><a class="btn hantu" href="#/beranda">Beranda</a></div></div>`);
    };
    el.addEventListener('click', e => {
      const it = X.items[X.i]; if (!it || X.cek[it.b.id]) return;
      const op = e.target.closest('[data-op]'), kt = e.target.closest('[data-kat]');
      if (op) X.jawab[it.b.id] = S.pilih(it.b, X.jawab[it.b.id], op.dataset.op);
      else if (kt) X.jawab[it.b.id] = S.pilih(it.b, X.jawab[it.b.id], kt.dataset.lab, +kt.dataset.kat);
      else return;
      gambar();
    });
    App.aksi(el, {
      periksa: () => { X.cek[X.items[X.i].b.id] = true; gambar(); },
      lanjut: () => { X.i++; gambar(); },
      sebelum: () => { X.i = Math.max(0, X.i - 1); gambar(); },
      tinjau: () => { X.i = 0; X.items.forEach(it => { X.cek[it.b.id] = true; }); gambar(); },
      akhiri: async () => { if (await App.konfirmasi('Akhiri latihan?', 'Soal yang belum diperiksa dihitung 0 poin.', 'Akhiri')) { X.i = N; gambar(); } }
    });
    gambar();
    if (X.batas) App.ulang(() => {
      const s = Math.round((X.batas - Date.now()) / 1000), t = $('#lt-timer');
      if (t) { t.lastElementChild.textContent = App.durasi(Math.max(0, s)); t.className = 'timer ' + (s <= 60 ? 'merah' : s <= 180 ? 'kuning' : ''); }
      if (s <= 0 && X.i < N) { toast('Waktu latihan habis.', 'info'); X.i = N; gambar(); }
    }, 1000);
  };

  // =========================================================== HASIL
  App.hal['hasil'] = async function (el) {
    el.innerHTML = String(App.kerangka(3));
    await App.ambil('siswa.hasil', {}, d => {
      const per = { BIN: d.daftar.filter(x => x.mapel === 'BIN'), MAT: d.daftar.filter(x => x.mapel === 'MAT') };
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Hasil</div><h1>Hasil try out</h1><p>Nilai dan pembahasan terbuka setelah semua sesi selesai dan guru menutup kegiatan.</p></div>
          <a class="btn garis" href="#/laporan-saya">${ikon('grafik')} Laporan saya</a></div>
        ${!d.daftar.length ? App.kosong('Belum ada hasil', 'Hasil try out akan tampil setelah Anda mengumpulkan jawaban.') : ''}
        <div class="kolom2s">${['BIN', 'MAT'].map(m => per[m].length ? h`<div class="kartu"><h3>${MAP[m]}</h3>${per[m].slice().reverse().map(x => h`
          <a class="paket ${x.tutup ? 'st-pembahasan' : 'st-selesai'}" style="margin-bottom:10px;color:inherit;text-decoration:none" href="${x.tutup ? '#/hasil/' + x.kegiatan : '#/hasil'}">
            <div class="no">${x.nomor || '•'}</div><div><h4>${x.nama}</h4><div class="meta"><span>${App.tgl(x.waktu)}</span>${x.tutup ? h`<span>${x.penuh}/${x.n} benar penuh</span>` : h`<span>Menunggu pembahasan dibuka</span>`}</div></div>
            <div class="aksi" style="text-align:right">${x.tutup ? h`<div style="font-size:22px;font-weight:800;color:var(--navy)">${angka2(x.skor)}</div>${App.pil(x.predikat)}` : App.pil('selesai', 'Terkumpul')}</div></a>`)}</div>` : '')}</div>`);
    }, { segar: 15000 });
  };

  App.hal['hasil/:keg'] = async function (el, prm) {
    el.innerHTML = String(App.kerangka(3));
    await Promise.all([App.modul('ujian'), App.modul('rapor')]);
    let d;
    try { d = await App.ambil('siswa.hasil', { kegiatan: prm.keg }, null, { segar: 600000, langsung: true }); }
    catch (e) { el.innerHTML = String(App.kosong('Pembahasan belum tersedia', e.message, h`<a class="btn garis" href="#/hasil">Kembali</a>`)); return; }
    const ring = await App.ambil('siswa.hasil', {}, null, { segar: 60000 }).catch(() => ({ daftar: [], latihan: [] }));
    el.innerHTML = String(h`<p class="kecil">Membuka paket dan pembahasan…</p>${App.kerangka(2)}`);
    const [isi, bah] = await Promise.all([Paket.buka(d.paket, d.paket.ki, 'isi'), Paket.buka(d.paket, d.paket.kb, 'bahas')]);
    const P = App.Soal.dariPaket(isi), A = App.Rapor.analisis(d), H = d.hasil, me = Sesi.me || {};
    let saring = 'semua';
    const dataRapor = () => ({ siswa: { nama: me.n, username: me.un, kelas: me.k, rombel: me.rb }, detail: d,
      riwayat: ring.daftar.filter(x => x.tutup && x.mapel === d.kegiatan.mapel).map(x => ({ nama: x.nama, skor: x.skor, waktu: x.waktu })), latihan: (ring.latihan || []).filter(l => l.mapel === d.kegiatan.mapel) });
    const gambar = () => {
      const daftar = A.butir.filter(b => saring === 'semua' || (saring === 'benar' ? b.poin >= 0.999 : saring === 'sebagian' ? b.poin > 0 && b.poin < 0.999 : b.poin === 0));
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Hasil & pembahasan</div><h1>${d.kegiatan.nama}</h1><p>${MAP[d.kegiatan.mapel]} · ${d.paket.nama} · ${App.tglPanjang(H.waktu)}</p></div>
          <div class="baris"><a class="btn garis" href="#/hasil">${ikon('kiri')} Kembali</a><button class="btn biru" data-aksi="cetak">${ikon('cetak')} Cetak laporan</button></div></div>
        <div class="kolom2"><div class="kartu"><div class="baris" style="gap:24px;align-items:center">${Grafik.gauge(H.skor, { kkm: (App.konfig || {}).kkm })}
          <div><div>${App.pil(H.predikat)}</div><p style="margin-top:8px">Benar penuh <b>${H.penuh}</b> dari ${H.n} soal · poin ${angka(H.poin, 2)}<br>Lama mengerjakan ${H.durasi ? App.durasiKata(H.durasi) : '-'}</p></div></div>
          <h4 style="margin-top:12px">Capaian per elemen</h4>${Grafik.batangH(A.el.map(e => ({ label: e.nama, nilai: e.pct })))}
          ${A.lvl.length ? h`<h4>Capaian per level</h4>${Grafik.batangH(A.lvl.map(e => ({ label: e.nama, nilai: e.pct })))}` : ''}</div>
          <div class="kartu"><h3>${ikon('lampu')} Rekomendasi belajar</h3><ol class="r-rek">${A.rek.map(x => h`<li>${x}</li>`)}</ol></div></div>
        <div class="kartu" style="margin-top:16px"><div class="kartu-kepala"><h3>Pembahasan per soal</h3>
          <div class="seg">${[['semua', 'Semua'], ['benar', 'Benar'], ['sebagian', 'Sebagian'], ['salah', 'Salah/kosong']].map(x => h`<button data-aksi="saring" data-v="${x[0]}" class="${saring === x[0] ? 'aktif' : ''}">${x[1]}</button>`)}</div></div>
          ${daftar.map(b => { const bi = P.butir.find(x => x.id === b.id) || {}, z = bah.butir[b.id] || {}, jw = b.jawab ? (b.b === 'PGK-Kategori' ? String(b.jawab).split(';') : b.b === 'PGK-MCMA' ? String(b.jawab).split(';').filter(Boolean) : b.jawab) : '';
            return h`<article class="bahas-butir" id="b-${b.no}"><div class="no-soal"><span class="n">${b.no}</span><span class="pil garis">${KTKA.SINGKAT_BENTUK[b.b]}</span>
              <span class="pil ${b.poin >= 0.999 ? 'hijau' : b.poin > 0 ? 'kuning' : 'merah'}">${angka(b.poin, 2)} poin</span><span class="kecil">${b.el}${b.lv ? ' · ' + App.Rapor.lv(b.lv) : ''}</span></div>
              ${bi.stim && P.stim[bi.stim] ? h`<details class="kartu" style="padding:12px;margin-bottom:10px"><summary class="f">${ikon('buku')} Bacaan: ${P.stim[bi.stim].judul || ''}</summary>${App.Soal.htmlStimulus(P.stim[bi.stim], P.ctx)}</details>` : ''}
              ${bi.id ? App.Soal.htmlButir(bi, P.ctx, { jawab: jw, kunci: z.k || b.k, alasan: z.a, tampilKunci: true }) : ''}
              ${z.p ? h`<div class="bahas"><h5>${ikon('lampu')} Pembahasan</h5><div class="teks" style="font-size:15px">${raw(KTKA.render(z.p, P.ctx))}</div></div>` : ''}</article>`; })}
          ${!daftar.length ? h`<p class="kecil">Tidak ada soal pada kelompok ini.</p>` : ''}</div>`);
    };
    App._renderUlang = gambar;
    App.aksi(el, { saring: b => { saring = b.dataset.v; gambar(); }, cetak: () => App.cetak(App.Rapor.lembar(dataRapor()), 'Laporan ' + me.n + ' - ' + d.kegiatan.nama) });
    gambar();
  };

  // =========================================================== LAPORAN SAYA
  App.hal['laporan-saya'] = async function (el) {
    el.innerHTML = String(App.kerangka(3));
    await App.ambil('siswa.hasil', {}, d => {
      const tutup = d.daftar.filter(x => x.tutup), lat = d.latihan || [], kkm = Number((App.konfig || {}).kkm || 75);
      const seri = ['BIN', 'MAT'].map(m => ({ m, arr: tutup.filter(x => x.mapel === m) }));
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Laporan saya</div><h1>Perkembangan belajar</h1><p>Ringkasan nilai try out dan latihan. Laporan rinci per try out dapat dicetak dari halaman pembahasan.</p></div></div>
        <div class="kpi">${seri.map(s => h`<div class="kartu"><div class="lbl">${MAP[s.m]}</div><div class="val">${s.arr.length ? angka(s.arr[s.arr.length - 1].skor, 2) : '–'}</div><small>nilai terakhir · ${s.arr.length} try out</small></div>`)}
          <div class="kartu"><div class="lbl">Latihan</div><div class="val">${lat.length}</div><small>${lat.length ? 'rata-rata ' + angka(lat.reduce((a, b) => a + b.skor, 0) / lat.length, 1) : 'belum ada'}</small></div></div>
        <div class="kolom2s">${seri.map(s => h`<div class="kartu"><h3>${MAP[s.m]}</h3>${s.arr.length > 1 ? Grafik.garis(s.arr.map(x => x.nama), [{ nama: 'Nilai', nilai: s.arr.map(x => x.skor) }], { kkm }) : ''}
          ${s.arr.length ? h`<div class="tabel-wadah"><table class="t"><thead><tr><th>Kegiatan</th><th class="angka">Nilai</th><th>Predikat</th><th></th></tr></thead><tbody>
            ${s.arr.slice().reverse().map(x => h`<tr><td>${x.nama}<div class="kecil">${App.tgl(x.waktu)}</div></td><td class="angka"><b>${angka2(x.skor)}</b></td><td>${App.pil(x.predikat)}</td>
              <td><a class="btn kecil garis" href="#/hasil/${x.kegiatan}">Rinci & cetak</a></td></tr>`)}</tbody></table></div>` : h`<p class="kecil">Belum ada nilai yang dibuka.</p>`}</div>`)}</div>
        <div class="kartu" style="margin-top:16px"><h3>Latihan mandiri</h3>${lat.length ? h`<div class="tabel-wadah"><table class="t resp"><thead><tr><th>Waktu</th><th>Sumber</th><th>Mapel</th><th class="angka">Benar</th><th class="angka">Nilai</th></tr></thead><tbody>
          ${lat.slice().reverse().map(l => h`<tr><td data-l="Waktu">${App.tglJam(l.waktu)}</td><td data-l="Sumber">${l.sumber}</td><td data-l="Mapel">${MAP[l.mapel] || ''}</td><td data-l="Benar" class="angka">${l.benar}/${l.n}</td><td data-l="Nilai" class="angka"><b>${angka(l.skor, 0)}</b></td></tr>`)}</tbody></table></div>` : h`<p class="kecil">Belum ada latihan.</p>`}</div>`);
    }, { segar: 15000 });
  };
})();
