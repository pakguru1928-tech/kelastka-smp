/* Laporan rinci per siswa (A4) — dipakai siswa (laporan saya), guru (laporan siswa & cetak per rombel). Peringkat TIDAK dicantumkan. */
(function () {
  'use strict';
  const { h, raw, angka, angka2, Grafik } = App;
  const lv = s => String(s || '').replace(/^\d+\s*/, '');
  const SINGKAT = { 'Sesuai': 'S', 'Tidak sesuai': 'TS', 'Benar': 'B', 'Salah': 'S', 'Fakta': 'F', 'Opini': 'O' };
  const jwb = (b, s) => {
    if (s == null || s === '') return '–';
    if (b === 'PGK-Kategori') return String(s).split(';').map(x => x ? (SINGKAT[x] || x.slice(0, 2)) : '–').join(' ');
    return String(s).replace(/;/g, ',');
  };
  const kunciTeks = (b, k) => b === 'PGK-Kategori' ? k.map(x => SINGKAT[x] || x.slice(0, 2)).join(' ') : k.join(',');

  /** Ringkasan analitis dari satu hasil — dipakai layar & cetak. */
  function analisis(d) {
    const H = d.hasil, el = Object.keys(H.elemen || {}).map(k => ({ nama: k, poin: H.elemen[k][0], maks: H.elemen[k][1], pct: H.elemen[k][1] ? H.elemen[k][0] / H.elemen[k][1] * 100 : 0 }));
    const lvl = Object.keys(H.level || {}).filter(k => k).sort().map(k => ({ nama: lv(k), poin: H.level[k][0], maks: H.level[k][1], pct: H.level[k][1] ? H.level[k][0] / H.level[k][1] * 100 : 0 }));
    const butir = (d.butir || []).map(b => { const r = (H.rinci || {})[b.id] || ['', 0]; return Object.assign({}, b, { jawab: r[0], poin: Number(r[1]) || 0 }); });
    const kosong = butir.filter(b => !b.jawab || !String(b.jawab).replace(/;/g, '')).length;
    const rek = [];
    el.slice().sort((a, b) => a.pct - b.pct).forEach(e => {
      if (e.pct >= 70) return;
      const ind = []; butir.filter(b => b.el === e.nama && b.poin < 1).forEach(b => { if (b.ind && ind.indexOf(b.ind) < 0) ind.push(b.ind); });
      rek.push(h`Perkuat <b>${e.nama}</b> (capaian ${angka(e.pct, 0)}%). Pelajari kembali: ${ind.slice(0, 3).join('; ') || 'indikator pada elemen ini'}.`);
    });
    const pen = lvl.find(l => /Penalaran/i.test(l.nama));
    if (pen && pen.pct < 60) rek.push(h`Soal <b>penalaran</b> masih menjadi tantangan (${angka(pen.pct, 0)}%). Biasakan menuliskan langkah, memeriksa satuan, dan menguji jawaban dengan contoh.`);
    const mc = (H.bentuk || {})['PGK-MCMA'];
    if (mc && mc[1] && mc[0] / mc[1] < 0.5) rek.push(h`Pada <b>pilihan ganda kompleks</b>, periksa setiap pilihan satu per satu; jawaban benar bisa lebih dari satu dan pilihan yang salah mengurangi poin.`);
    if (kosong) rek.push(h`Ada <b>${kosong} soal tidak dijawab</b>. Atur waktu: kerjakan soal yang mudah dahulu, tandai ragu-ragu, lalu kembali di akhir.`);
    const kuat = el.filter(e => e.pct >= 80).map(e => e.nama);
    if (kuat.length) rek.push(h`Pertahankan capaian baik pada <b>${kuat.join(', ')}</b>.`);
    if (!rek.length) rek.push(h`Capaian sudah merata. Lanjutkan latihan dengan soal berlevel penalaran untuk mempertahankan hasil.`);
    return { el, lvl, butir, kosong, rek };
  }

  function lembar(o) {
    const k = App.konfig || {}, d = o.detail, H = d.hasil, s = o.siswa, A = analisis(d), kkm = Number(k.kkm || 75);
    const tuntas = H.skor >= kkm;
    const riwayat = (o.riwayat || []).slice(-8);
    const lat = o.latihan || [];
    return h`<div class="lembar rapor">
      ${App.kop('Laporan Hasil Try Out Tes Kemampuan Akademik', (d.kegiatan.nama || '') + ' · ' + (App.MAPEL[d.kegiatan.mapel] || d.kegiatan.mapel) + (k.tahun_ajaran ? ' · Tahun ajaran ' + k.tahun_ajaran : ''))}
      <div class="r-grid2">
        <table class="t r-id"><tbody>
          <tr><td>Nama</td><td><b>${s.nama}</b></td></tr><tr><td>Username</td><td>${s.username || '-'}</td></tr>
          <tr><td>Kelas / rombel</td><td>${s.kelas || '-'} / ${s.rombel || '-'}</td></tr><tr><td>Paket</td><td>${d.paket ? d.paket.nama : '-'}</td></tr>
          <tr><td>Tanggal</td><td>${App.tglPanjang(H.waktu)}</td></tr><tr><td>Lama mengerjakan</td><td>${H.durasi ? App.durasiKata(H.durasi) : '-'}</td></tr></tbody></table>
        <div class="r-nilai"><div class="kecil">NILAI (0–100)</div><div class="r-skor">${angka2(H.skor)}</div>
          <div>${App.pil(H.predikat)} <span class="pil ${tuntas ? 'hijau' : 'merah'}">${tuntas ? 'Tuntas' : 'Belum tuntas'} (KKM ${kkm})</span></div>
          <div class="kecil" style="margin-top:6px">Benar penuh ${H.penuh} dari ${H.n} soal · poin ${angka(H.poin, 2)} · penskoran ${H.mode === 'semua' ? 'semua benar' : 'parsial'}</div></div>
      </div>
      <div class="r-grid2" style="margin-top:12px">
        <div><h3>Capaian per elemen</h3>${Grafik.batangH(A.el.map(e => ({ label: e.nama, nilai: e.pct, teks: angka(e.poin, 2) + '/' + e.maks + ' · ' + angka(e.pct, 0) + '%' })), { kkm })}</div>
        <div>${A.lvl.length ? h`<h3>Capaian per level kognitif</h3>${Grafik.batangH(A.lvl.map(e => ({ label: e.nama, nilai: e.pct, teks: angka(e.pct, 0) + '%' })), { kkm })}` : ''}
          <h3>Bentuk soal</h3><table class="t"><thead><tr><th>Bentuk</th><th class="angka">Benar penuh</th><th class="angka">Poin</th></tr></thead><tbody>
          ${Object.keys(H.bentuk || {}).map(b => h`<tr><td>${KTKA.NAMA_BENTUK[b] || b}</td><td class="angka">${H.bentuk[b][0]}/${H.bentuk[b][1]}</td><td class="angka">${angka(H.bentuk[b][2], 2)}</td></tr>`)}</tbody></table></div>
      </div>
      <h3 style="margin-top:12px">Analisis per butir</h3>
      <table class="t r-butir"><thead><tr><th>No</th><th>Elemen · indikator</th><th>Bentuk</th><th>Jawaban</th><th>Kunci</th><th class="angka">Poin</th></tr></thead><tbody>
        ${A.butir.map(b => h`<tr class="${b.poin >= 0.999 ? '' : b.poin > 0 ? 'r-sebagian' : 'r-salah'}"><td>${b.no}</td><td><b>${b.el}</b>${b.lv ? ' · ' + lv(b.lv) : ''}<br><span class="kecil">${b.ind || ''}</span></td>
          <td>${KTKA.SINGKAT_BENTUK[b.b] || b.b}</td><td class="mono">${jwb(b.b, b.jawab)}</td><td class="mono">${kunciTeks(b.b, b.k || [])}</td><td class="angka">${angka(b.poin, 2)}</td></tr>`)}
      </tbody></table>
      <p class="kecil">Jawaban soal kategori ditulis per pernyataan: B = Benar, S = Salah atau Sesuai (mengikuti label soal), TS = Tidak sesuai. Poin parsial: PG 1/0; PGK (kunci dipilih − pilihan salah) ÷ jumlah kunci; kategori = pernyataan tepat ÷ jumlah pernyataan.</p>
      <div class="r-grid2" style="margin-top:12px">
        <div><h3>Perkembangan nilai ${App.MAPEL[d.kegiatan.mapel] || ''}</h3>${riwayat.length > 1 ? Grafik.garis(riwayat.map(r => r.nama), [{ nama: 'Nilai', nilai: riwayat.map(r => r.skor) }], { kkm, tinggi: 160 }) : h`<p class="kecil">Riwayat akan tampil setelah mengikuti lebih dari satu try out.</p>`}
          <p class="kecil">Latihan mandiri tercatat: ${lat.length} kali${lat.length ? ', rata-rata ' + angka(lat.reduce((a, b) => a + b.skor, 0) / lat.length, 1) : ''}.</p></div>
        <div><h3>Rekomendasi belajar</h3><ol class="r-rek">${A.rek.map(x => h`<li>${x}</li>`)}</ol></div>
      </div>
      <div class="ttd" style="margin-top:18px"><div>Orang tua/wali<div class="garis">........................</div></div>
        <div>Guru mata pelajaran<div class="garis">${o.guru || '........................'}</div></div>
        <div>${k.kota_ttd || ''}, ${App.tglPanjang()}<br>Kepala sekolah<div class="garis">${k.kepala_sekolah || '........................'}</div>${k.nip_kepala ? h`<div class="kecil">NIP ${k.nip_kepala}</div>` : ''}</div></div>
      <p class="kecil r-kaki">Dicetak dari KelasTKA+ SMP · ${App.tglJam(Date.now())}. Hasil try out sekolah untuk umpan balik belajar, bukan hasil TKA resmi.</p>
    </div>`;
  }
  App.Rapor = { lembar, analisis, jwb, kunciTeks, lv };
})();
