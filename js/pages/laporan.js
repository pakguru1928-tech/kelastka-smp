/* Laporan guru: daftar kegiatan & rekap nilai, laporan kegiatan (ringkasan, peringkat, analisis butir, belum mengerjakan),
 * cetak rekap kelas A4, cetak laporan rinci per siswa satu rombel, unduh Excel, laporan per siswa. */
(function () {
  'use strict';
  const { h, raw, $, $$, ikon, api, toast, modal, angka, angka2, Grafik, Sesi } = App;
  const MAP = App.MAPEL;
  const lv = s => String(s || '').replace(/^\d+\s*/, '');
  const tafsirP = p => p > 0.7 ? ['Mudah', 'hijau'] : p >= 0.3 ? ['Sedang', 'biru'] : ['Sukar', 'merah'];
  const tafsirD = d => d >= 0.4 ? ['Sangat baik', 'hijau'] : d >= 0.3 ? ['Baik', 'hijau'] : d >= 0.2 ? ['Cukup, perlu perbaikan', 'kuning'] : ['Kurang, revisi', 'merah'];

  // =========================================================== DAFTAR & REKAP
  App.hal['laporan'] = async function (el) {
    el.innerHTML = String(App.kerangka(3));
    const list = await App.ambil('kegiatan.daftar', {}, null, { segar: 20000 });
    el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Laporan</div><h1>Laporan hasil</h1><p>Pilih kegiatan untuk melihat analisis kelas, peringkat, analisis butir, dan mencetak laporan per siswa.</p></div>
        <button class="btn garis" data-aksi="rekap">${ikon('unduh')} Rekap nilai (Excel)</button></div>
      ${list.length ? h`<div class="tabel-wadah"><table class="t resp"><thead><tr><th>Kegiatan</th><th>Mapel</th><th>Sesi</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map(k => h`<tr><td data-l="Kegiatan"><b>${k.nama}</b><div class="kecil">${k.paket.nama} · ${App.tgl(k.dibuat)}</div></td><td data-l="Mapel">${MAP[k.mapel]}</td>
          <td data-l="Sesi">${k.sesi.length} sesi · ${k.sesi.reduce((a, s) => a + s.jumlah, 0)} peserta</td><td data-l="Status">${App.pil(k.status)}</td>
          <td><a class="btn kecil biru" href="#/laporan/${k.id}">${ikon('grafik')} Buka laporan</a></td></tr>`)}</tbody></table></div>` : App.kosong('Belum ada kegiatan', 'Laporan tersedia setelah ada kegiatan try out.')}`);
    App.aksi(el, { rekap: b => App.sibuk(b, async () => {
      const r = await api('laporan.rekap', {});
      App.Excel.tulis('Rekap nilai KelasTKA ' + App.tgl(Date.now()), [{ nama: 'Rekap', lebar: [6, 34, 10, 14].concat(r.kegiatan.map(() => 16)),
        baris: [['No', 'Nama', 'Rombel', 'Username'].concat(r.kegiatan.map(k => k.nama + ' (' + k.mapel + ')'))].concat(r.siswa.map((s, i) => [i + 1, s.nama, s.rombel, s.username].concat(s.nilai.map(v => v == null ? '' : v)))) }]);
    }) });
  };

  // =========================================================== LAPORAN KEGIATAN
  App.hal['laporan/:keg'] = async function (el, prm) {
    await App.modul('rapor');
    el.innerHTML = String(App.kerangka(3));
    let tab = 'ringkas', D, cariS = '', rbS = '';
    const gambar = d => {
      D = d; const k = d.kegiatan, T = d.total, kkm = d.kkm;
      const sukar = d.butir.filter(b => b.p < 0.3).length, revisi = d.butir.filter(b => b.d < 0.2).length;
      el.innerHTML = String(h`<div class="judul-hal"><div><a class="kecil" href="#/laporan">${ikon('kiri')} Semua laporan</a><h1 style="margin-top:4px">${k.nama}</h1>
          <p>${MAP[k.mapel]} · ${k.paket} · penskoran ${k.mode === 'semua' ? 'semua benar' : 'parsial'} · ${App.pil(k.status)}</p></div>
          <div class="baris"><button class="btn garis" data-aksi="segar">${ikon('segar')}</button><button class="btn garis" data-aksi="excel">${ikon('unduh')} Excel</button>
            <button class="btn garis" data-aksi="cetakRekap">${ikon('cetak')} Rekap kelas</button><button class="btn biru" data-aksi="cetakSiswa">${ikon('cetak')} Laporan per siswa</button></div></div>
        ${k.status !== 'ditutup' ? h`<div class="kartu" style="border-left:4px solid var(--warn);margin-bottom:14px">${ikon('info')} Kegiatan belum ditutup: nilai dapat bertambah saat sesi lain/susulan berjalan, dan siswa belum dapat melihat pembahasan.</div>` : ''}
        <div class="kpi">
          <div class="kartu"><div class="lbl">Peserta</div><div class="val">${T.n}</div><small>${d.belum.length} belum mengerjakan</small></div>
          <div class="kartu"><div class="lbl">Rata-rata</div><div class="val">${angka2(T.rerata)}</div><small>SD ${angka2(T.sd)}</small></div>
          <div class="kartu"><div class="lbl">Tertinggi / terendah</div><div class="val">${angka(T.max, 2)}</div><small>terendah ${angka(T.min, 2)}</small></div>
          <div class="kartu"><div class="lbl">Tuntas (≥ ${kkm})</div><div class="val">${T.n ? angka(T.tuntas / T.n * 100, 0) : 0}%</div><small>${T.tuntas} siswa</small></div>
          <div class="kartu"><div class="lbl">Butir perlu perhatian</div><div class="val" style="color:${revisi ? 'var(--warn)' : 'var(--navy)'}">${revisi}</div><small>${sukar} butir sukar</small></div></div>
        <div class="seg" style="margin-bottom:14px">${[['ringkas', 'Ringkasan'], ['siswa', 'Peringkat siswa'], ['butir', 'Analisis butir'], ['belum', 'Belum mengerjakan (' + d.belum.length + ')']].map(x => h`<button data-aksi="tab" data-v="${x[0]}" class="${tab === x[0] ? 'aktif' : ''}">${x[1]}</button>`)}</div>
        <div id="isi-tab">${({ ringkas, siswa, butir, belum })[tab]()}</div>`);
      const c = $('#cari-s', el); if (c) { c.oninput = App.tunda(() => { cariS = c.value.toLowerCase(); $('#isi-tab', el).innerHTML = String(siswa()); pasangCari(); }, 250); }
      function pasangCari() { const c2 = $('#cari-s', el); if (c2) { c2.focus(); c2.setSelectionRange(c2.value.length, c2.value.length); c2.oninput = App.tunda(() => { cariS = c2.value.toLowerCase(); $('#isi-tab', el).innerHTML = String(siswa()); pasangCari(); }, 250); } }
    };
    const ringkas = () => {
      const d = D;
      return h`<div class="kolom2"><div class="kartu"><h3>Sebaran nilai</h3>${Grafik.kolom(d.hist.map((n, i) => ({ label: i * 10 + '–' + (i === 9 ? 100 : i * 10 + 9), nilai: n, warna: i * 10 >= d.kkm ? 'hijau' : i >= 5 ? 'kuning' : 'merah' })), { tinggi: 180 })}
          <h3 style="margin-top:12px">Per rombel</h3><div class="tabel-wadah"><table class="t"><thead><tr><th>Rombel</th><th class="angka">Ikut/terdaftar</th><th class="angka">Rata-rata</th><th class="angka">Min</th><th class="angka">Maks</th><th class="angka">SD</th><th class="angka">Tuntas</th></tr></thead><tbody>
          ${d.rombel.map(r => h`<tr><td><b>${r.rombel}</b></td><td class="angka">${r.n}/${r.terdaftar}</td><td class="angka"><b>${angka2(r.rerata)}</b></td><td class="angka">${angka(r.min, 2)}</td><td class="angka">${angka(r.max, 2)}</td><td class="angka">${angka2(r.sd)}</td><td class="angka">${r.tuntas} (${r.n ? angka(r.tuntas / r.n * 100, 0) : 0}%)</td></tr>`)}</tbody></table></div></div>
        <div class="kartu"><h3>Capaian per elemen</h3>${Grafik.batangH(Object.keys(d.elemen).map(k => ({ label: k, nilai: d.elemen[k] })), { kkm: d.kkm })}
          ${Object.keys(d.level).filter(Boolean).length ? h`<h3>Capaian per level</h3>${Grafik.batangH(Object.keys(d.level).filter(Boolean).sort().map(k => ({ label: lv(k), nilai: d.level[k] })), { kkm: d.kkm })}` : ''}
          <h3>Butir tersukar</h3>${d.butir.slice().sort((a, b) => a.p - b.p).slice(0, 5).map(b => h`<div class="log-item"><b style="min-width:28px">${b.no}</b><div style="flex:1"><div class="kecil">${b.el}${b.lv ? ' · ' + lv(b.lv) : ''}</div>${b.ind}</div><span class="pil merah">p ${angka(b.p, 2)}</span></div>`)}</div></div>`;
    };
    const siswa = () => {
      const rbs = Array.from(new Set(D.peserta.map(p => p.rombel))).sort();
      const arr = D.peserta.filter(p => (!rbS || p.rombel === rbS) && (!cariS || p.nama.toLowerCase().indexOf(cariS) >= 0));
      return h`<div class="kartu"><div class="baris" style="margin-bottom:10px"><input class="in" id="cari-s" placeholder="Cari nama…" value="${cariS}" style="max-width:260px">
          <div class="seg"><button data-aksi="rb" data-v="" class="${!rbS ? 'aktif' : ''}">Semua</button>${rbs.map(r => h`<button data-aksi="rb" data-v="${r}" class="${rbS === r ? 'aktif' : ''}">${r}</button>`)}</div></div>
        <div class="tabel-wadah"><table class="t resp"><thead><tr><th class="angka">#</th><th>Nama</th><th>Rombel</th><th class="angka">Nilai</th><th>Predikat</th><th class="angka">Benar penuh</th><th class="angka">Durasi</th><th></th></tr></thead><tbody>
        ${arr.map(p => h`<tr><td data-l="Peringkat" class="angka"><b>${p.rank}</b></td><td data-l="Nama">${p.nama}</td><td data-l="Rombel">${p.rombel}</td><td data-l="Nilai" class="angka"><b>${angka2(p.skor)}</b></td>
          <td data-l="Predikat">${App.pil(p.predikat)}</td><td data-l="Benar penuh" class="angka">${p.penuh}/${p.n}</td><td data-l="Durasi" class="angka">${p.durasi ? Math.round(p.durasi / 60) + ' mnt' : '-'}</td>
          <td><a class="btn kecil garis" href="#/laporan-siswa/${p.id}?k=${D.kegiatan.id}">${ikon('dokumen')} Rinci</a></td></tr>`)}</tbody></table></div></div>`;
    };
    const butir = () => h`<div class="kartu"><p class="kecil">Kesukaran (p) = rata-rata poin butir (0–1): &gt;0,70 mudah, 0,30–0,70 sedang, &lt;0,30 sukar. Daya beda (d) = rata-rata poin 27% kelompok atas − 27% kelompok bawah:
      ≥0,40 sangat baik, 0,30–0,39 baik, 0,20–0,29 cukup, &lt;0,20 perlu revisi (acuan umum analisis butir klasik). Untuk peserta sedikit, tafsirkan dengan hati-hati.</p>
      <div class="tabel-wadah"><table class="t resp"><thead><tr><th>No</th><th>Elemen · indikator</th><th>Bentuk</th><th>Kunci</th><th class="angka">p</th><th class="angka">d</th><th>Sebaran jawaban</th><th class="angka">Kosong</th></tr></thead><tbody>
      ${D.butir.map(b => { const tp = tafsirP(b.p), td = tafsirD(b.d); return h`<tr><td data-l="No"><b>${b.no}</b></td><td data-l="Indikator"><b>${b.el}</b>${b.lv ? ' · ' + lv(b.lv) : ''}<div class="kecil">${b.kode ? b.kode + ' · ' : ''}${b.ind}</div></td>
        <td data-l="Bentuk">${KTKA.SINGKAT_BENTUK[b.b]}</td><td data-l="Kunci" class="mono kecil">${App.Rapor.kunciTeks(b.b, b.k)}</td>
        <td data-l="p" class="angka"><span class="pil ${tp[1]}">${angka(b.p, 2)} ${tp[0]}</span></td><td data-l="d" class="angka"><span class="pil ${td[1]}">${angka(b.d, 2)}</span></td>
        <td data-l="Sebaran" class="kecil">${Object.keys(b.sebaran).sort().map(k => h`<span style="margin-right:6px;${b.k.indexOf(k) >= 0 || b.k.some((x, i) => k === 'P' + (i + 1) + ':' + x) ? 'font-weight:800;color:var(--ok-ink)' : ''}">${k.replace('Tidak sesuai', 'TS')}=${b.sebaran[k]}</span>`)}</td>
        <td data-l="Kosong" class="angka">${b.kosong}</td></tr>`; })}</tbody></table></div></div>`;
    const belum = () => h`<div class="kartu">${D.belum.length ? h`<p class="kecil">Siswa rombel peserta yang belum memiliki hasil. Jadwalkan <b>sesi susulan</b> di menu Kegiatan & Sesi.</p>
      <div class="tabel-wadah"><table class="t"><thead><tr><th>Nama</th><th>Rombel</th></tr></thead><tbody>${D.belum.map(s => h`<tr><td>${s.nama}</td><td>${s.rombel}</td></tr>`)}</tbody></table></div>` : h`<p>Semua siswa sudah mengerjakan.</p>`}</div>`;
    const muat = paksa => App.ambil('laporan.kegiatan', { kegiatan: prm.keg }, gambar, { segar: paksa ? 0 : 30000, langsung: true });
    App.aksi(el, {
      tab: b => { tab = b.dataset.v; gambar(D); }, rb: b => { rbS = b.dataset.v; gambar(D); },
      segar: b => App.sibuk(b, async () => { const d = await api('laporan.kegiatan', { kegiatan: prm.keg, _fresh: true }); App.Data.tulis('laporan.kegiatan', { kegiatan: prm.keg }, d); gambar(d); }),
      cetakRekap: async () => {
        const rb = await pilihRombel(); if (rb === null) return;
        App.cetak(rekapA4(D, rb), 'Rekap ' + D.kegiatan.nama + (rb ? ' ' + rb : ''));
      },
      cetakSiswa: async b => {
        const rb = await pilihRombel(true); if (rb === null) return;
        App.sibuk(b, async () => {
          const r = await api('laporan.rombel', { kegiatan: prm.keg, rombel: rb });
          if (!r.siswa.length) throw new Error('Belum ada hasil untuk rombel ini.');
          App.cetak(h`${r.siswa.map(s => App.Rapor.lembar({ siswa: s.siswa, detail: { kegiatan: r.kegiatan, paket: r.paket, hasil: s.hasil, butir: r.butir }, riwayat: s.riwayat, latihan: s.latihan, guru: (Sesi.me || {}).n }))}`, 'Laporan siswa ' + rb + ' - ' + D.kegiatan.nama);
        });
      },
      excel: b => App.sibuk(b, async () => {
        const r = await api('laporan.rombel', { kegiatan: prm.keg, rombel: '' });
        const no = r.butir.map(x => x.no), rank = {}; D.peserta.forEach(p => { rank[p.id] = p.rank; });
        App.Excel.tulis('Laporan ' + D.kegiatan.nama, [
          { nama: 'Nilai', lebar: [10, 34, 10, 10, 12, 12, 12], baris: [['Peringkat', 'Nama', 'Rombel', 'Nilai', 'Predikat', 'Benar penuh', 'Durasi (menit)']].concat(D.peserta.map(p => [p.rank, p.nama, p.rombel, p.skor, p.predikat, p.penuh, Math.round(p.durasi / 60)])) },
          { nama: 'Jawaban', baris: [['Nama', 'Rombel', 'Nilai'].concat(no.map(n => 'J' + n)).concat(no.map(n => 'P' + n))].concat(r.siswa.map(s => [s.siswa.nama, s.siswa.rombel, s.hasil.skor].concat(r.butir.map(x => ((s.hasil.rinci || {})[x.id] || [''])[0])).concat(r.butir.map(x => Number(((s.hasil.rinci || {})[x.id] || ['', 0])[1]))))) },
          { nama: 'Analisis butir', lebar: [6, 22, 10, 24, 14, 50, 10, 10, 8, 40], baris: [['No', 'ID', 'Bentuk', 'Elemen', 'Level', 'Indikator', 'Kesukaran p', 'Daya beda d', 'Kosong', 'Sebaran']].concat(D.butir.map(x => [x.no, x.id, x.b, x.el, lv(x.lv), x.ind, x.p, x.d, x.kosong, Object.keys(x.sebaran).map(k => k + '=' + x.sebaran[k]).join('; ')])) },
          { nama: 'Rombel', baris: [['Rombel', 'Terdaftar', 'Ikut', 'Rata-rata', 'Min', 'Maks', 'SD', 'Tuntas']].concat(D.rombel.map(x => [x.rombel, x.terdaftar, x.n, x.rerata, x.min, x.max, x.sd, x.tuntas])) },
          { nama: 'Belum', baris: [['Nama', 'Rombel']].concat(D.belum.map(x => [x.nama, x.rombel])) }]);
      })
    });
    async function pilihRombel(wajib) {
      const rbs = D.rombel.map(r => r.rombel);
      if (rbs.length === 1) return wajib ? rbs[0] : '';
      return modal({ judul: 'Pilih rombel', isi: h`<div class="daftar-menu">${wajib ? '' : h`<button class="item-menu" data-v="">${ikon('grup')}<span>Semua rombel</span></button>`}${rbs.map(r => h`<button class="item-menu" data-v="${r}">${ikon('pengguna')}<span>${r}</span></button>`)}</div>`,
        saatBuka: (m, tutup) => $$('[data-v]', m).forEach(x => x.onclick = () => tutup(x.dataset.v)) });
    }
    await muat(false);
  };

  function rekapA4(D, rb) {
    const k = App.konfig || {}, ps = D.peserta.filter(p => !rb || p.rombel === rb), R = D.rombel.filter(r => !rb || r.rombel === rb);
    const per = [], ukuran = 34;
    for (let i = 0; i < ps.length; i += ukuran) per.push(ps.slice(i, i + ukuran));
    if (!per.length) per.push([]);
    return h`${per.map((hal, hi) => h`<div class="lembar">${hi === 0 ? h`${App.kop('Rekapitulasi Hasil Try Out', D.kegiatan.nama + ' · ' + MAP[D.kegiatan.mapel] + (rb ? ' · Rombel ' + rb : '') + (k.tahun_ajaran ? ' · TA ' + k.tahun_ajaran : ''))}
        <table class="t"><thead><tr><th>Rombel</th><th class="angka">Ikut/terdaftar</th><th class="angka">Rata-rata</th><th class="angka">Min</th><th class="angka">Maks</th><th class="angka">SD</th><th class="angka">Tuntas (KKM ${D.kkm})</th></tr></thead><tbody>
        ${R.map(r => h`<tr><td>${r.rombel}</td><td class="angka">${r.n}/${r.terdaftar}</td><td class="angka"><b>${angka2(r.rerata)}</b></td><td class="angka">${angka(r.min, 2)}</td><td class="angka">${angka(r.max, 2)}</td><td class="angka">${angka2(r.sd)}</td><td class="angka">${r.tuntas}</td></tr>`)}</tbody></table>
        <div class="r-grid2" style="margin:10px 0"><div><h3>Capaian per elemen (angkatan)</h3>${Grafik.batangH(Object.keys(D.elemen).map(x => ({ label: x, nilai: D.elemen[x] })), { kkm: D.kkm })}</div>
          <div><h3>Butir tersukar</h3><table class="t"><tbody>${D.butir.slice().sort((a, b) => a.p - b.p).slice(0, 6).map(b => h`<tr><td>${b.no}</td><td class="kecil">${b.ind}</td><td class="angka">${angka(b.p, 2)}</td></tr>`)}</tbody></table></div></div>` : h`<h3>Lanjutan daftar nilai</h3>`}
      <h3>Daftar nilai${rb ? '' : ' (peringkat angkatan)'}</h3>
      <table class="t"><thead><tr><th class="angka">Peringkat</th><th>Nama</th><th>Rombel</th><th class="angka">Nilai</th><th>Predikat</th><th class="angka">Benar penuh</th><th>Ket.</th></tr></thead><tbody>
        ${hal.map(p => h`<tr><td class="angka">${p.rank}</td><td>${p.nama}</td><td>${p.rombel}</td><td class="angka"><b>${angka2(p.skor)}</b></td><td>${p.predikat}</td><td class="angka">${p.penuh}/${p.n}</td><td>${p.skor >= D.kkm ? 'Tuntas' : 'Belum'}</td></tr>`)}</tbody></table>
      ${hi === per.length - 1 ? h`${D.belum.filter(b => !rb || b.rombel === rb).length ? h`<p class="kecil">Belum mengerjakan: ${D.belum.filter(b => !rb || b.rombel === rb).map(b => b.nama).join(', ')}.</p>` : ''}
        <p class="kecil">Peringkat hanya untuk keperluan guru dan tidak dicantumkan pada laporan siswa/orang tua.</p>
        ${App.ttd({ jabatan: 'Guru mata pelajaran', nama: (Sesi.me || {}).n })}` : ''}</div>`)}`;
  }

  // =========================================================== LAPORAN SATU SISWA
  App.hal['laporan-siswa/:id'] = async function (el, prm) {
    await App.modul('rapor');
    el.innerHTML = String(App.kerangka(2));
    const q = new URLSearchParams(location.hash.split('?')[1] || ''), keg = q.get('k') || '';
    const d = await api('laporan.siswa', { siswa: prm.id, kegiatan: keg });
    const kkm = Number((App.konfig || {}).kkm || 75);
    const lembar = () => d.detail ? App.Rapor.lembar({ siswa: d.siswa, detail: d.detail, riwayat: d.riwayat.filter(r => r.mapel === d.detail.kegiatan.mapel), latihan: d.latihan.filter(l => l.mapel === d.detail.kegiatan.mapel), guru: (Sesi.me || {}).n }) : '';
    el.innerHTML = String(h`<div class="judul-hal no-print"><div><a class="kecil" href="${keg ? '#/laporan/' + keg : '#/laporan'}">${ikon('kiri')} Kembali</a><h1 style="margin-top:4px">${d.siswa.nama}</h1>
        <p>${d.siswa.rombel} · ${d.siswa.username}</p></div>${d.detail ? h`<button class="btn biru" data-aksi="cetak">${ikon('cetak')} Cetak laporan</button>` : ''}</div>
      <div class="kolom2s no-print"><div class="kartu"><h3>Riwayat try out</h3>${d.riwayat.length > 1 ? Grafik.garis(d.riwayat.map(r => r.nama), [{ nama: 'Nilai', nilai: d.riwayat.map(r => r.skor) }], { kkm, tinggi: 170 }) : ''}
        ${d.riwayat.map(r => h`<a class="log-item" href="#/laporan-siswa/${prm.id}?k=${r.kegiatan}" style="color:inherit;text-decoration:none">${ikon('piala')}<div style="flex:1"><b>${r.nama}</b><div class="kecil">${MAP[r.mapel]} · ${App.tgl(r.waktu)}</div></div><b>${angka2(r.skor)}</b></a>`)}</div>
        <div class="kartu"><h3>Latihan mandiri</h3>${d.latihan.length ? d.latihan.slice(-10).reverse().map(l => h`<div class="log-item">${ikon('target')}<div style="flex:1">${l.sumber}<div class="kecil">${App.tglJam(l.waktu)} · ${l.benar}/${l.n}</div></div><b>${angka(l.skor, 0)}</b></div>`) : h`<p class="kecil">Belum ada latihan.</p>`}</div></div>
      <div style="margin-top:16px">${d.detail ? lembar() : h`<p class="kecil">Pilih salah satu try out pada riwayat untuk melihat laporan rinci.</p>`}</div>`);
    App.aksi(el, { cetak: () => App.cetak(lembar(), 'Laporan ' + d.siswa.nama) });
  };
})();
