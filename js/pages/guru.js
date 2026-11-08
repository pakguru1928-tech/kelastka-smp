/* Guru & admin: dasbor, kegiatan & sesi (utama/susulan, token, tutup), paket soal (pratinjau, bekukan, latihan). */
(function () {
  'use strict';
  const { h, raw, $, $$, ikon, api, toast, modal, angka, angka2, Grafik, Sesi } = App;
  const MAP = App.MAPEL;
  const mapelSaya = () => (Sesi.me || {}).m || '';

  // =========================================================== DASBOR
  App.hal['dasbor'] = async function (el) {
    el.innerHTML = String(App.kerangka(3));
    App.panaskan('staf');
    const gambar = d => {
      const me = Sesi.me || {}, kkm = Number((App.konfig || {}).kkm || 75);
      const tren = d.tren.filter(t => t.rerata != null);
      const perMapel = ['BIN', 'MAT'].filter(m => !me.m || me.m === m).map(m => ({ m, t: tren.filter(t => t.mapel === m) })).filter(x => x.t.length);
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">${App.PERAN_NAMA[me.r]}${me.m ? ' · ' + MAP[me.m] : ''}</div><h1>Selamat datang, ${String(me.n || '').split(' ')[0]}</h1>
          <p>Ringkasan kegiatan try out, bank soal, dan latihan siswa.</p></div>
          <div class="baris"><a class="btn emas" href="#/kegiatan">${ikon('tambah')} Kegiatan baru</a><a class="btn garis" href="#/generator">${ikon('kilau')} Generator soal</a></div></div>
        <div class="kpi">
          <div class="kartu"><div class="lbl">Kegiatan aktif</div><div class="val">${d.kegiatan_aktif}</div><small>belum ditutup</small></div>
          <div class="kartu"><div class="lbl">Siswa aktif</div><div class="val">${d.jumlah_siswa}</div><small>terdaftar</small></div>
          <div class="kartu"><div class="lbl">Bank soal</div><div class="val">${d.jumlah_bank}</div><small>butir${me.m ? ' ' + MAP[me.m] : ''}</small></div>
          <a class="kartu" href="#/bank" style="color:inherit;text-decoration:none"><div class="lbl">Menunggu telaah</div><div class="val" style="color:${d.menunggu_telaah ? 'var(--warn)' : 'var(--navy)'}">${d.menunggu_telaah}</div><small>draf & diajukan</small></a>
          <div class="kartu"><div class="lbl">Latihan 7 hari</div><div class="val">${d.latihan_minggu}</div><small>sesi latihan siswa</small></div></div>
        <div class="kolom2"><div class="kartu"><div class="kartu-kepala"><h3>Tren rata-rata nilai</h3><a class="btn kecil garis" href="#/laporan">Laporan lengkap</a></div>
          ${perMapel.length ? perMapel.map(x => h`<h4>${MAP[x.m]}</h4>${Grafik.garis(x.t.map(t => t.nama), [{ nama: 'Rata-rata', nilai: x.t.map(t => t.rerata) }], { kkm, tinggi: 180 })}`)
            : h`<p class="kecil">Grafik tampil setelah ada hasil try out.</p>`}</div>
          <div class="kartu"><div class="kartu-kepala"><h3>Sesi terdekat</h3><a class="btn kecil garis" href="#/pantau">Pantau</a></div>
            ${d.sesi_berikut.length ? d.sesi_berikut.map(s => h`<a class="log-item" href="#/pantau/${s.id}" style="color:inherit;text-decoration:none">${ikon(s.status === 'berlangsung' ? 'monitor' : 'kalender')}
              <div style="flex:1"><b>${s.kegiatan}</b><div class="kecil">${App.tglJam(s.mulai)} · ${s.rombel.join(', ') || 'susulan'}</div></div>
              <div style="text-align:right">${App.pil(s.status)}<div class="mono" style="font-weight:800;color:var(--blue)">${s.token}</div></div></a>`)
              : h`<p class="kecil">Tidak ada sesi terjadwal.</p>`}</div></div>`);
    };
    await App.ambil('guru.dasbor', {}, gambar, { segar: 20000 });
  };

  // =========================================================== KEGIATAN & SESI
  let cacheSiswa = null;
  const muatSiswa = async () => cacheSiswa || (cacheSiswa = await App.ambil('siswa.daftar', {}, null, { segar: 120000 }));

  App.hal['kegiatan'] = async function (el) {
    el.innerHTML = String(App.kerangka(3));
    let list = [], tampilTutup = false;
    const gambar = d => {
      list = d;
      const aktif = d.filter(k => k.status !== 'ditutup'), tutup = d.filter(k => k.status === 'ditutup');
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Penjadwalan</div><h1>Kegiatan & sesi</h1>
          <p>Kegiatan = satu try out dengan satu paket. Setiap kegiatan punya sesi utama per rombel/ruang dan sesi susulan. Pembahasan terbuka setelah semua sesi selesai dan kegiatan ditutup.</p></div>
          <div class="baris"><button class="btn garis" data-aksi="proses" title="Proses jawaban yang masuk sekarang">${ikon('segar')} Proses jawaban</button><button class="btn emas" data-aksi="baru">${ikon('tambah')} Kegiatan baru</button></div></div>
        ${!d.length ? App.kosong('Belum ada kegiatan', 'Mulai dengan membuat kegiatan dari paket try out yang tersedia.', h`<button class="btn emas" data-aksi="baru">${ikon('tambah')} Kegiatan baru</button>`) : ''}
        ${aktif.map(kartuKeg)}
        ${tutup.length ? h`<div class="baris antara" style="margin-top:24px"><h3>Kegiatan ditutup (${tutup.length})</h3><button class="btn kecil garis" data-aksi="lihatTutup">${tampilTutup ? 'Sembunyikan' : 'Tampilkan'}</button></div>${tampilTutup ? tutup.map(kartuKeg) : ''}` : ''}`);
    };
    const kartuKeg = k => h`<div class="kartu ${k.status !== 'ditutup' ? 'aksen' : ''}" style="margin-bottom:16px">
      <div class="kartu-kepala"><div>${App.pil(k.status)} <span class="pil garis">${MAP[k.mapel]}</span> <span class="pil garis">Skor ${k.mode === 'semua' ? 'semua benar' : 'parsial'}</span>
        <h3 style="margin-top:8px">${k.nama}</h3><div class="kecil">${k.paket.nama} · ${k.paket.jumlah || '?'} soal · dibuat ${App.tgl(k.dibuat)}${k.tutup ? ' · ditutup ' + App.tglJam(k.tutup) : ''}</div></div>
        <div class="baris">${k.status !== 'ditutup' ? h`<button class="btn kecil garis" data-aksi="sesiBaru" data-k="${k.id}">${ikon('tambah')} Sesi utama</button>
          <button class="btn kecil garis" data-aksi="susulan" data-k="${k.id}">${ikon('tambah')} Susulan</button>` : ''}
          <a class="btn kecil garis" href="#/laporan/${k.id}">${ikon('grafik')} Laporan</a>
          ${k.status !== 'ditutup' ? h`<button class="btn kecil ${k.bisa_tutup ? 'hijau' : 'garis'}" data-aksi="tutup" data-k="${k.id}" ${k.bisa_tutup ? '' : 'disabled title="Semua sesi harus selesai"'}>${ikon('buka')} Tutup & buka pembahasan</button>` : ''}
          <button class="btn kecil hantu" data-aksi="menuKeg" data-k="${k.id}">${ikon('titik3')}</button></div></div>
      ${k.sesi.length ? h`<div class="tabel-wadah"><table class="t resp"><thead><tr><th>Sesi</th><th>Peserta</th><th>Waktu</th><th>Token</th><th>Status</th><th></th></tr></thead><tbody>
        ${k.sesi.map(s => h`<tr><td data-l="Sesi"><b>${s.jenis === 'susulan' ? 'Susulan' : 'Utama'}</b>${s.ruang ? h`<div class="kecil">${s.ruang}</div>` : ''}</td>
          <td data-l="Peserta">${s.jenis === 'susulan' ? s.jumlah + ' siswa' : s.rombel.join(', ')}<div class="kecil">${s.jumlah} peserta</div></td>
          <td data-l="Waktu">${App.tglJam(s.mulai)}<div class="kecil">${s.durasi} mnt · s.d. ${App.jam(s.selesai)}${s.acak_soal ? ' · acak' : ''}</div></td>
          <td data-l="Token" class="mono" style="font-weight:800;color:var(--blue);letter-spacing:.1em">${s.token}</td>
          <td data-l="Status">${App.pil(s.status)}</td>
          <td><div class="baris" style="gap:4px;justify-content:flex-end">${s.status !== 'selesai' ? h`<a class="btn kecil garis" href="#/pantau/${s.id}">${ikon('monitor')} Pantau</a>` : ''}
            ${s.status === 'dijadwalkan' && k.status !== 'ditutup' ? h`<button class="btn kecil garis" data-aksi="ubahSesi" data-k="${k.id}" data-s="${s.id}">${ikon('edit')}</button><button class="btn kecil garis" data-aksi="hapusSesi" data-s="${s.id}">${ikon('hapus')}</button>` : ''}
            ${s.status === 'berlangsung' ? h`<button class="btn kecil bahaya" data-aksi="akhiri" data-s="${s.id}">Akhiri</button>` : ''}</div></td></tr>`)}</tbody></table></div>`
        : h`<p class="kecil">Belum ada sesi. Tambahkan sesi utama untuk setiap rombel atau ruang.</p>`}</div>`;
    const muat = paksa => App.ambil('kegiatan.daftar', {}, gambar, { segar: paksa ? 0 : 15000, paksa });
    const segarkan = () => { App.Data.basi(); return muat(true); };
    App.aksi(el, {
      baru: () => formKegiatan().then(id => { if (id) segarkan().then(() => formSesi(list.find(k => k.id === id), 'utama')); }),
      sesiBaru: b => formSesi(list.find(k => k.id === b.dataset.k), 'utama').then(ok => ok && segarkan()),
      susulan: b => formSesi(list.find(k => k.id === b.dataset.k), 'susulan').then(ok => ok && segarkan()),
      ubahSesi: b => { const k = list.find(x => x.id === b.dataset.k); formSesi(k, null, k.sesi.find(s => s.id === b.dataset.s)).then(ok => ok && segarkan()); },
      hapusSesi: async b => { if (await App.konfirmasi('Hapus sesi?', 'Sesi yang belum dimulai akan dihapus.', 'Hapus', 'bahaya')) { await api('sesi.hapus', { id: b.dataset.s }).catch(e => toast(e.message, 'err')); segarkan(); } },
      akhiri: async b => { if (await App.konfirmasi('Akhiri sesi sekarang?', 'Semua siswa yang masih mengerjakan akan dikumpulkan otomatis dengan jawaban terakhir yang tersimpan di server. Tindakan ini tidak dapat dibatalkan.', 'Akhiri sesi', 'bahaya')) App.sibuk(b, async () => { await api('sesi.akhiri', { id: b.dataset.s }); segarkan(); }); },
      tutup: async b => { if (await App.konfirmasi('Tutup kegiatan?', 'Semua jawaban diproses, nilai dihitung, lalu PEMBAHASAN dan NILAI terbuka untuk siswa. Kegiatan yang ditutup tidak bisa diberi sesi baru.', 'Tutup & buka pembahasan', 'hijau')) App.sibuk(b, async () => { await api('kegiatan.tutup', { id: b.dataset.k }); segarkan(); }); },
      proses: b => App.sibuk(b, async () => { const r = await api('sistem.flush', {}); toast(r.hasil + ' pengumpulan diproses menjadi nilai.', 'ok'); segarkan(); }),
      lihatTutup: () => { tampilTutup = !tampilTutup; gambar(list); },
      menuKeg: async b => {
        const k = list.find(x => x.id === b.dataset.k);
        const v = await modal({ judul: k.nama, isi: h`<div class="daftar-menu">
          ${k.status !== 'ditutup' ? h`<button class="item-menu" data-v="ubah">${ikon('edit')}<span>Ubah nama / mode penskoran</span></button>` : ''}
          <button class="item-menu" data-v="hitung">${ikon('segar')}<span>Hitung ulang nilai<br><small>Gunakan bila kunci butir diperbaiki.</small></span></button>
          ${k.sesi.every(s => s.status === 'dijadwalkan') ? h`<button class="item-menu merah" data-v="hapus">${ikon('hapus')}<span>Hapus kegiatan</span></button>` : ''}</div>`,
          saatBuka: (m, tutup) => $$('[data-v]', m).forEach(x => x.onclick = () => tutup(x.dataset.v)) });
        if (v === 'ubah') formKegiatan(k).then(ok => ok && segarkan());
        if (v === 'hitung') api('hasil.hitungUlang', { kegiatan: k.id }).then(segarkan).catch(e => toast(e.message, 'err'));
        if (v === 'hapus' && await App.konfirmasi('Hapus kegiatan?', 'Kegiatan dan sesinya dihapus.', 'Hapus', 'bahaya')) api('kegiatan.hapus', { id: k.id }).then(segarkan).catch(e => toast(e.message, 'err'));
      }
    });
    await muat(false);
  };

  async function formKegiatan(lama) {
    const paket = (await App.ambil('paket.daftar', {}, null, { segar: 30000 })).filter(p => p.siap && p.status !== 'latihan');
    if (!lama && !paket.length) { toast('Belum ada paket siap. Bekukan paket guru atau sinkronkan paket resmi.', 'warn'); return null; }
    let id = null;
    await modal({ judul: lama ? 'Ubah kegiatan' : 'Kegiatan try out baru', isi: h`
      <div class="fld"><label class="f">Paket soal</label><select class="in" name="paket" ${lama ? 'disabled' : ''}>${(lama ? [lama.paket] : paket).map(p => h`<option value="${p.id}">${p.nama} · ${MAP[p.mapel]} · ${p.jumlah} soal${p.kegiatan && p.kegiatan.length ? ' (sudah dipakai ' + p.kegiatan.length + '×)' : ''}</option>`)}</select></div>
      <div class="fld"><label class="f">Nama kegiatan</label><input class="in" name="nama" value="${lama ? lama.nama : (paket[0] ? paket[0].nama : '')}" maxlength="120"></div>
      <div class="fld"><label class="f">Aturan penskoran</label><select class="in" name="mode">
        <option value="parsial" ${!lama || lama.mode !== 'semua' ? 'selected' : ''}>Parsial — PGK & kategori mendapat poin sebagian (disarankan)</option>
        <option value="semua" ${lama && lama.mode === 'semua' ? 'selected' : ''}>Semua benar — poin hanya bila seluruh jawaban butir tepat</option></select></div>`,
      aksi: [{ label: 'Batal', nilai: null }, { label: lama ? 'Simpan' : 'Buat kegiatan', kelas: 'emas', nilai: 'ok' }],
      saatBuka: m => { const s = $('[name=paket]', m), n = $('[name=nama]', m); s.onchange = () => { const p = paket.find(x => x.id === s.value); if (p) n.value = p.nama; }; },
      sebelumTutup: async (v, m) => {
        if (v !== 'ok') return true;
        const f = App.nilaiForm(m);
        try { const r = await api('kegiatan.simpan', { id: lama ? lama.id : undefined, paket: lama ? lama.paket.id : f.paket, nama: f.nama, mode: f.mode }); id = r.id; return true; }
        catch (e) { toast(e.message, 'err'); return false; }
      } });
    return id;
  }

  async function formSesi(k, jenis, lama) {
    if (!k) return false;
    jenis = lama ? lama.jenis : jenis;
    const S = await muatSiswa();
    let belum = [];
    if (jenis === 'susulan') { try { belum = (await api('laporan.kegiatan', { kegiatan: k.id })).belum.map(x => x.id); } catch (e) { /* belum ada hasil */ } }
    const dur = lama ? lama.durasi : (k.paket.durasi || 75);
    const mulai = lama ? lama.mulai : (() => { const d = new Date(Date.now() + 3600e3); d.setMinutes(0, 0, 0); return d.getTime(); })();
    const rbSesi = {}; k.sesi.filter(s => s.jenis === 'utama').forEach(s => s.rombel.forEach(r => { rbSesi[r] = true; }));
    let ok = false;
    await modal({ judul: (lama ? 'Ubah sesi ' : 'Sesi ') + (jenis === 'susulan' ? 'susulan' : 'utama') + ' — ' + k.nama, lebar: true, isi: h`
      <div class="grid2">
        <div class="fld"><label class="f">Mulai</label><input class="in" type="datetime-local" name="mulai" value="${App.keInputWaktu(mulai)}" required></div>
        <div class="fld"><label class="f">Durasi (menit)</label><input class="in" type="number" name="durasi" min="5" max="240" value="${dur}"></div>
        <div class="fld"><label class="f">Ruang / lab (opsional)</label><input class="in" name="ruang" value="${lama ? lama.ruang : ''}" placeholder="mis. Lab Komputer 1" maxlength="60"></div>
        <div class="fld"><label class="f">Username pengawas (opsional)</label><input class="in" name="pengawas" value="${lama ? lama.pengawas.join(', ') : ''}" placeholder="pisahkan koma; kosong = semua pengawas"></div>
      </div>
      <div class="baris" style="gap:20px;margin-bottom:12px">
        <label class="cek"><input type="checkbox" name="acak_soal" ${!lama || lama.acak_soal ? 'checked' : ''}><span>Acak urutan soal (bacaan tetap berkelompok)</span></label>
        <label class="cek"><input type="checkbox" name="acak_opsi" ${!lama || lama.acak_opsi ? 'checked' : ''}><span>Acak urutan pilihan jawaban</span></label></div>
      ${jenis === 'utama' ? h`<div class="fld"><label class="f">Rombel peserta</label><div class="baris" style="gap:8px">${S.rombel.map(r => h`<label class="pil garis" style="height:34px;cursor:pointer;font-size:13px">
          <input type="checkbox" name="rb" value="${r.rombel}" ${lama && lama.rombel.indexOf(r.rombel) >= 0 ? 'checked' : ''} style="margin-right:6px">${r.rombel} (${r.n})${!lama && rbSesi[r.rombel] ? ' ✓' : ''}</label>`)}</div>
          <small>✓ = rombel sudah punya sesi utama di kegiatan ini.</small></div>`
      : h`<div class="fld"><label class="f">Siswa peserta susulan</label>
          <div class="baris" style="margin-bottom:8px"><input class="in" id="cari-s" placeholder="Cari nama…" style="max-width:260px">
            ${belum.length ? h`<button type="button" class="btn kecil garis" id="pilih-belum">Pilih ${belum.length} siswa yang belum mengerjakan</button>` : ''}</div>
          <div style="max-height:260px;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:8px" id="daftar-s">
          ${S.siswa.filter(s => !Object.keys(rbSesi).length || rbSesi[s.rombel]).map(s => h`<label class="cek" data-nama="${s.nama.toLowerCase()}" style="padding:4px 0"><input type="checkbox" name="ps" value="${s.id}" ${lama && lama.peserta.indexOf(s.id) >= 0 ? 'checked' : ''}><span>${s.nama} <span class="kecil">· ${s.rombel}${belum.indexOf(s.id) >= 0 ? ' · belum mengerjakan' : ''}</span></span></label>`)}</div></div>`}`,
      aksi: [{ label: 'Batal', nilai: null }, { label: 'Simpan sesi', kelas: 'emas', nilai: 'ok' }],
      saatBuka: m => {
        const c = $('#cari-s', m); if (c) c.oninput = () => $$('[data-nama]', m).forEach(x => { x.style.display = x.dataset.nama.indexOf(c.value.toLowerCase()) >= 0 ? '' : 'none'; });
        const pb = $('#pilih-belum', m); if (pb) pb.onclick = () => $$('[name=ps]', m).forEach(x => { if (belum.indexOf(x.value) >= 0) x.checked = true; });
      },
      sebelumTutup: async (v, m) => {
        if (v !== 'ok') return true;
        const f = App.nilaiForm(m);
        const d = { id: lama ? lama.id : undefined, kegiatan: k.id, jenis, mulai: new Date(f.mulai).getTime(), durasi: Number(f.durasi), ruang: f.ruang,
          acak_soal: f.acak_soal, acak_opsi: f.acak_opsi, pengawas: f.pengawas.split(/[,;\s]+/).map(x => x.trim().toLowerCase()).filter(Boolean),
          rombel: $$('[name=rb]:checked', m).map(x => x.value), peserta: $$('[name=ps]:checked', m).map(x => x.value) };
        if (!d.mulai) { toast('Isi waktu mulai.', 'err'); return false; }
        try { await api('sesi.simpan', d); ok = true; toast('Sesi tersimpan. Token tampil di daftar sesi.', 'ok'); return true; } catch (e) { toast(e.message, 'err'); return false; }
      } });
    return ok;
  }

  // =========================================================== PAKET SOAL
  App.hal['paket'] = async function (el) {
    el.innerHTML = String(App.kerangka(3));
    let list = [];
    const gambar = d => {
      list = d;
      const resmi = d.filter(p => p.asal === 'resmi'), guru = d.filter(p => p.asal !== 'resmi');
      const baris = p => h`<tr><td data-l="Paket"><b>${p.nama}</b><div class="kecil">${p.id}${p.pembuat ? ' · ' + p.pembuat : ''}</div></td><td data-l="Mapel">${MAP[p.mapel]}</td>
        <td data-l="Soal" class="angka">${p.jumlah}</td><td data-l="Status">${p.siap ? App.pil(p.status === 'latihan' ? 'latihan' : 'terkunci', p.status === 'latihan' ? 'Latihan' : 'Terkunci (brankas)') : App.pil('draf', 'Draf')}</td>
        <td data-l="Dipakai">${p.kegiatan.length ? p.kegiatan.map(k => h`<div class="kecil">${k.nama} ${App.pil(k.status)}</div>`) : h`<span class="kecil">–</span>`}</td>
        <td><div class="baris" style="gap:4px;justify-content:flex-end">
          ${p.siap ? h`<button class="btn kecil garis" data-aksi="lihat" data-id="${p.id}">${ikon('mata')} Pratinjau</button>
            <button class="btn kecil garis" data-aksi="latihan" data-id="${p.id}" title="Buka/tutup untuk latihan siswa">${ikon('target')} ${p.status === 'latihan' ? 'Tutup latihan' : 'Jadikan latihan'}</button>`
            : h`<button class="btn kecil emas" data-aksi="bekukan" data-id="${p.id}">${ikon('kunci')} Bekukan</button>`}
          ${p.asal !== 'resmi' && !p.kegiatan.length ? h`<button class="btn kecil hantu" data-aksi="hapus" data-id="${p.id}">${ikon('hapus')}</button>` : ''}</div></td></tr>`;
      const tabel = arr => h`<div class="tabel-wadah"><table class="t resp"><thead><tr><th>Paket</th><th>Mapel</th><th class="angka">Soal</th><th>Status</th><th>Dipakai kegiatan</th><th></th></tr></thead><tbody>${arr.map(baris)}</tbody></table></div>`;
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Paket soal</div><h1>Paket try out</h1>
          <p>Paket tersimpan terenkripsi ("brankas"). Siswa hanya bisa membuka isi saat sesi berjalan, dan pembahasan setelah kegiatan ditutup.</p></div>
          <div class="baris"><a class="btn emas" href="#/generator">${ikon('tambah')} Rakit paket dari bank</a></div></div>
        <div class="kartu"><h3>Paket resmi KelasTKA+</h3>${resmi.length ? tabel(resmi) : h`<p class="kecil">Belum ada. Admin dapat menyinkronkan paket resmi di menu Sistem.</p>`}</div>
        <div class="kartu"><h3>Paket buatan guru</h3>${guru.length ? tabel(guru) : h`<p class="kecil">Belum ada. Rakit paket dari butir bank soal yang sudah disetujui, lalu bekukan.</p>`}</div>`);
    };
    const muat = paksa => App.ambil('paket.daftar', {}, gambar, { segar: paksa ? 0 : 20000 });
    App.aksi(el, {
      lihat: b => App.sibuk(b, () => pratinjauPaket(list.find(p => p.id === b.dataset.id))),
      bekukan: b => App.sibuk(b, async () => { await bekukanPaket(list.find(p => p.id === b.dataset.id)); muat(true); }),
      latihan: async b => {
        const p = list.find(x => x.id === b.dataset.id), jadi = p.status !== 'latihan';
        if (!(await App.konfirmasi(jadi ? 'Buka paket untuk latihan?' : 'Tutup latihan paket ini?', jadi ? 'Siswa dapat berlatih memakai paket ini lengkap dengan pembahasan. Jangan buka paket yang akan dipakai try out berikutnya.' : 'Paket kembali terkunci.', jadi ? 'Buka untuk latihan' : 'Tutup'))) return;
        App.sibuk(b, async () => { await api('paket.jadikanLatihan', { id: p.id, latihan: jadi }); muat(true); });
      },
      hapus: async b => { if (await App.konfirmasi('Hapus paket?', 'Paket draf/brankas buatan guru akan dihapus.', 'Hapus', 'bahaya')) App.sibuk(b, async () => { await api('paket.hapus', { id: b.dataset.id }); muat(true); }); }
    });
    await muat(false);
  };

  async function pratinjauPaket(p) {
    await App.modul('ujian');
    const k = await api('paket.kunciGuru', { id: p.id });
    const meta = Object.assign({}, p, { url_isi: k.url_isi, url_bahas: k.url_bahas });
    const [isi, bah] = await Promise.all([App.Paket.buka(meta, k.ki, 'isi'), App.Paket.buka(meta, k.kb, 'bahas')]);
    const P = App.Soal.dariPaket(isi);
    let stimAkhir = '';
    modal({ judul: p.nama, lebar: true, isi: h`<p class="kecil">${P.butir.length} soal · pratinjau guru lengkap dengan kunci dan pembahasan.</p>
      ${P.butir.map(b => { const z = bah.butir[b.id] || {}, s = b.stim && b.stim !== stimAkhir ? P.stim[b.stim] : null; stimAkhir = b.stim || '';
        return h`${s ? h`<details class="kartu" style="padding:12px;margin:12px 0"><summary class="f">${ikon('buku')} ${s.judul || 'Bacaan'}</summary>${App.Soal.htmlStimulus(s, P.ctx)}</details>` : ''}
        <article class="bahas-butir"><div class="no-soal"><span class="n">${b.no}</span><span class="pil garis">${KTKA.SINGKAT_BENTUK[b.bentuk]}</span><span class="kecil">${b.elemen}${b.level ? ' · ' + App.Rapor_lv(b.level) : ''}</span></div>
        ${App.Soal.htmlButir(b, P.ctx, { jawab: null, kunci: z.k, alasan: z.a, tampilKunci: true })}
        ${z.p ? h`<div class="bahas"><h5>Pembahasan</h5><div class="teks" style="font-size:15px">${raw(KTKA.render(z.p, P.ctx))}</div></div>` : ''}</article>`; })}` });
  }
  App.Rapor_lv = s => String(s || '').replace(/^\d+\s*/, '');

  /** Bekukan paket guru: ambil konten → render rumus → enkripsi di peramban → kirim berkas terenkripsi + kunci. */
  async function bekukanPaket(p) {
    if (!(await App.konfirmasi('Bekukan paket?', 'Isi paket dienkripsi dan tidak dapat diubah lagi. Pastikan semua butir sudah ditelaah.', 'Bekukan'))) return;
    const k = await api('paket.konten', { id: p.id });
    const teks = []; k.stimulus.forEach(s => teks.push(s.isi)); k.butir.forEach(b => { teks.push(b.tanya, b.pembahasan); (b.opsi || []).concat(b.alasan || []).forEach(x => teks.push(x)); });
    const math = {}, rumus = []; teks.forEach(t => KTKA.rumus(t).forEach(r => rumus.push(r)));
    if (rumus.length) { await App.muatKatex(); rumus.forEach(r => { const key = (r.d ? 'D:' : '') + r.tex; if (!math[key]) try { math[key] = katex.renderToString(r.tex, { throwOnError: false, displayMode: r.d }); } catch (e) { /* biarkan */ } }); }
    const isi = { paket: k.paket, stimulus: k.stimulus.map(s => ({ id: s.id, judul: s.judul || '', jenis: s.jenis || '', isi: s.isi || '', glos: '', sumber: s.sumber || '' })),
      butir: k.butir.map(b => ({ id: b.id, no: b.no, stim: b.stim, bentuk: b.bentuk, tanya: b.tanya, instr: b.instr, opsi: b.opsi, lab: b.lab, elemen: b.elemen, level: b.level })), aset: {}, math };
    const bahas = { paket: k.paket, butir: {} };
    k.butir.forEach(b => { bahas.butir[b.id] = { k: b.kunci, p: b.pembahasan, a: b.alasan }; });
    const E1 = await App.Brankas.kunci(isi, p.id, 'isi'), E2 = await App.Brankas.kunci(bahas, p.id, 'bahas');
    await api('paket.bekukan', { id: p.id, isi: E1.berkas, bahas: E2.berkas, ki: E1.kunci, kb: E2.kunci }, { batas: 90000 });
    toast('Paket dibekukan dan siap dipakai kegiatan.', 'ok');
    App.Data.basi('paket');
  }
  App.bekukanPaket = bekukanPaket;
})();
