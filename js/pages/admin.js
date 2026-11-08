/* Admin: data siswa (impor Excel, kartu login, reset token, arsip), akun staf, pengaturan + kunci API Gemini, sistem & cadangan & audit. */
(function () {
  'use strict';
  const { h, $, $$, ikon, api, toast, modal, angka, Sesi } = App;
  const MAP = App.MAPEL;

  // =========================================================== SISWA
  App.hal['siswa'] = async function (el) {
    let rb = App.LS.get('rb_admin', ''), cari = '', arsip = false, D;
    const pilih = new Set();
    const gambar = d => {
      D = d;
      const arr = d.siswa.filter(s => (!rb || s.rombel === rb) && (!cari || (s.nama + ' ' + s.username).toLowerCase().indexOf(cari) >= 0));
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Administrasi</div><h1>Data siswa</h1>
          <p>Siswa masuk dengan <b>username</b> dan <b>token kartu</b>. Token tidak disimpan di server; kartu dapat dicetak ulang kapan saja.</p></div>
          <div class="baris"><button class="btn garis" data-aksi="templat">${ikon('unduh')} Templat Excel</button><button class="btn garis" data-aksi="impor">${ikon('unggah')} Impor Excel</button>
            <button class="btn emas" data-aksi="tambah">${ikon('tambah')} Siswa</button></div></div>
        <div class="kartu" style="padding:14px"><div class="baris antara">
          <div class="seg"><button data-aksi="rb" data-v="" class="${!rb ? 'aktif' : ''}">Semua (${d.siswa.length})</button>${d.rombel.map(r => h`<button data-aksi="rb" data-v="${r.rombel}" class="${rb === r.rombel ? 'aktif' : ''}">${r.rombel} (${r.n})</button>`)}</div>
          <div class="baris"><input class="in" id="cari" placeholder="Cari…" value="${cari}" style="max-width:200px"><label class="cek"><input type="checkbox" id="arsip" ${arsip ? 'checked' : ''}><span class="kecil">Tampilkan arsip</span></label></div></div>
          <div class="baris" style="margin-top:10px"><span class="kecil">${pilih.size} dipilih</span>
            <button class="btn kecil biru" data-aksi="kartu">${ikon('cetak')} Cetak kartu login ${pilih.size ? '(dipilih)' : rb ? '(' + rb + ')' : '(semua)'}</button>
            <button class="btn kecil garis" data-aksi="reset" ${pilih.size ? '' : 'disabled'}>${ikon('kunci')} Ganti token</button>
            <button class="btn kecil garis" data-aksi="arsipkan" ${pilih.size ? '' : 'disabled'}>${ikon('kotak')} ${arsip ? 'Pulihkan/arsipkan' : 'Arsipkan'}</button></div></div>
        <div class="tabel-wadah" style="margin-top:12px"><table class="t resp"><thead><tr><th><input type="checkbox" id="semua"></th><th>Nama</th><th>Username</th><th>Kelas · rombel</th><th>Status</th><th></th></tr></thead><tbody>
          ${arr.map(s => h`<tr><td><input type="checkbox" data-id="${s.id}" ${pilih.has(s.id) ? 'checked' : ''}></td><td data-l="Nama"><b>${s.nama}</b></td><td data-l="Username" class="mono">${s.username}</td>
            <td data-l="Rombel">${s.kelas} · ${s.rombel}</td><td data-l="Status">${App.pil(s.status === 'aktif' ? 'aktif' : 'arsip')}</td><td><button class="btn kecil garis" data-aksi="ubah" data-id="${s.id}">${ikon('edit')}</button></td></tr>`)}
          ${!arr.length ? h`<tr><td colspan="6">${App.kosong('Belum ada siswa', 'Impor dari Excel (kolom: nama, kelas, rombel) atau tambah satu per satu.')}</td></tr>` : ''}</tbody></table></div>`);
      const c = $('#cari', el); c.oninput = App.tunda(() => { cari = c.value.toLowerCase(); gambar(D); const x = $('#cari', el); x.focus(); x.setSelectionRange(x.value.length, x.value.length); }, 250);
      $('#arsip', el).onchange = e => { arsip = e.target.checked; muat(true); };
      $('#semua', el).onchange = e => { arr.forEach(s => e.target.checked ? pilih.add(s.id) : pilih.delete(s.id)); gambar(D); };
      $$('[data-id][type=checkbox]', el).forEach(x => x.onchange = () => { x.checked ? pilih.add(x.dataset.id) : pilih.delete(x.dataset.id); gambar(D); });
    };
    const muat = paksa => App.ambil('siswa.daftar', { arsip }, gambar, { segar: paksa ? 0 : 20000, langsung: true });
    const segar = () => { App.Data.basi('siswa.daftar'); return muat(true); };
    App.aksi(el, {
      rb: b => { rb = b.dataset.v; App.LS.set('rb_admin', rb); pilih.clear(); gambar(D); },
      tambah: () => formSiswa(null, D).then(ok => ok && segar()),
      ubah: b => formSiswa(D.siswa.find(s => s.id === b.dataset.id), D).then(ok => ok && segar()),
      templat: () => App.Excel.tulis('Templat siswa KelasTKA', [{ nama: 'Siswa', lebar: [36, 8, 10], baris: [['nama', 'kelas', 'rombel'], ['Contoh Nama Siswa', 9, 'IX.A']] }]),
      impor: () => imporSiswa().then(ok => ok && segar()),
      kartu: b => App.sibuk(b, async () => {
        const r = await api('siswa.kartu', pilih.size ? { ids: Array.from(pilih) } : { rombel: rb });
        if (!r.kartu.length) throw new Error('Tidak ada siswa aktif.');
        App.cetak(kartuA4(r), 'Kartu login ' + (rb || 'siswa'));
      }),
      reset: async b => {
        if (!(await App.konfirmasi('Ganti token ' + pilih.size + ' siswa?', 'Token lama tidak berlaku dan siswa yang sedang login akan keluar. Cetak ulang kartu setelahnya. Jangan lakukan saat try out berlangsung.', 'Ganti token', 'bahaya'))) return;
        App.sibuk(b, async () => { await api('siswa.resetToken', { ids: Array.from(pilih) }); segar(); });
      },
      arsipkan: async b => {
        const pulih = arsip && Array.from(pilih).every(id => (D.siswa.find(s => s.id === id) || {}).status === 'arsip');
        if (!(await App.konfirmasi(pulih ? 'Pulihkan siswa?' : 'Arsipkan siswa?', pulih ? 'Siswa dapat masuk kembali.' : 'Siswa tidak dapat masuk dan tidak muncul di daftar aktif. Hasil lama tetap tersimpan.', pulih ? 'Pulihkan' : 'Arsipkan'))) return;
        App.sibuk(b, async () => { await api('siswa.arsip', { ids: Array.from(pilih), pulihkan: pulih }); pilih.clear(); segar(); });
      }
    });
    el.innerHTML = String(App.kerangka(3));
    await muat(false);
  };
  async function formSiswa(s, D) {
    let ok = false;
    await modal({ judul: s ? 'Ubah siswa' : 'Tambah siswa', isi: h`<div class="fld"><label class="f">Nama lengkap</label><input class="in" name="nama" value="${s ? s.nama : ''}" maxlength="100"></div>
      <div class="grid2"><div class="fld"><label class="f">Kelas</label><input class="in" name="kelas" value="${s ? s.kelas : '9'}"></div>
      <div class="fld"><label class="f">Rombel</label><input class="in" name="rombel" list="dl-rb" value="${s ? s.rombel : ''}" placeholder="mis. IX.A"><datalist id="dl-rb">${D.rombel.map(r => h`<option value="${r.rombel}">`)}</datalist></div></div>
      ${s ? h`<p class="kecil">Username <b class="mono">${s.username}</b> tetap. Pindah rombel tidak mengubah username.</p>` : h`<p class="kecil">Username dibuat otomatis dari rombel (mis. <span class="mono">ixa-001</span>).</p>`}`,
      aksi: [{ label: 'Batal', nilai: null }, { label: 'Simpan', kelas: 'emas', nilai: 'ok' }],
      sebelumTutup: async (v, m) => { if (v !== 'ok') return true; const f = App.nilaiForm(m); try { const r = await api('siswa.simpan', Object.assign({ id: s ? s.id : undefined, status: s ? s.status : 'aktif' }, f)); if (!s) toast('Username: ' + r.username, 'ok', 6000); ok = true; return true; } catch (e) { toast(e.message, 'err'); return false; } } });
    return ok;
  }
  async function imporSiswa() {
    const f = await App.pilihBerkas('.xlsx,.csv'); if (!f) return false;
    let rows;
    try { const wb = await App.Excel.baca(f); rows = App.Excel.objek(wb[Object.keys(wb)[0]] || []); } catch (e) { toast(e.message, 'err'); return false; }
    rows = rows.map(r => ({ nama: String(r.nama || r.nama_siswa || r.nama_lengkap || '').trim(), kelas: String(r.kelas || '').trim(), rombel: String(r.rombel || r.rombongan_belajar || r.kelas_rombel || '').trim() })).filter(r => r.nama);
    if (!rows.length) { toast('Kolom "nama" dan "rombel" tidak ditemukan pada baris pertama.', 'err'); return false; }
    const pindai = await api('siswa.impor', { rows, dryRun: true }, { pesan: false });
    const ok = await modal({ judul: 'Impor siswa', isi: h`<p>Pindai selesai: <b>${pindai.tambah}</b> siswa baru, <b>${pindai.lewat}</b> sudah ada (dilewati).</p>
      ${pindai.galat.length ? h`<p class="kecil" style="color:var(--bad)">${pindai.galat.slice(0, 8).join('; ')}</p>` : ''}
      <div class="tabel-wadah" style="max-height:240px;overflow:auto"><table class="t"><thead><tr><th>Nama</th><th>Kelas</th><th>Rombel</th></tr></thead><tbody>${rows.slice(0, 40).map(r => h`<tr><td>${r.nama}</td><td>${r.kelas}</td><td>${r.rombel}</td></tr>`)}</tbody></table></div>`,
      aksi: [{ label: 'Batal', nilai: false }, { label: 'Impor ' + pindai.tambah + ' siswa', kelas: 'emas', nilai: true }] });
    if (!ok || !pindai.tambah) return false;
    await api('siswa.impor', { rows });
    return true;
  }
  function kartuA4(r) {
    const k = App.konfig || {}, url = (r.url || location.origin + location.pathname).replace(/^https?:\/\//, '').replace(/\/$/, '');
    const hal = []; for (let i = 0; i < r.kartu.length; i += 10) hal.push(r.kartu.slice(i, i + 10));
    return h`${hal.map(p => h`<div class="lembar" style="padding:10mm"><div class="kartu-login">${p.map(s => h`<div class="kl"><img src="./assets/logo-bulat.webp" alt="">
      <div><div style="font-weight:800;color:var(--navy);font-size:12px">KARTU LOGIN KelasTKA+ · ${k.nama_sekolah || ''}</div>
        <div style="font-size:14px;font-weight:700;margin-top:2px">${s.nama}</div><div class="kecil">${s.kelas} · ${s.rombel}</div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 8px;margin-top:6px;font-size:12px"><span>Username</span><b class="mono" style="font-size:15px">${s.username}</b><span>Token</span><span class="tk">${s.token}</span></div>
        <div class="kecil" style="margin-top:4px">${url}</div></div></div>`)}</div></div>`)}`;
  }

  // =========================================================== STAF
  App.hal['staf'] = async function (el) {
    el.innerHTML = String(App.kerangka(2));
    const gambar = d => {
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Administrasi</div><h1>Akun staf</h1><p>Guru hanya dapat mengelola mapelnya. Pengawas hanya memantau sesi yang ditugaskan (atau semua sesi bila tidak ditentukan).</p></div>
        <button class="btn emas" data-aksi="tambah">${ikon('tambah')} Akun staf</button></div>
        <div class="tabel-wadah"><table class="t resp"><thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Mapel</th><th>Status</th><th></th></tr></thead><tbody>
        ${d.map(g => h`<tr><td data-l="Nama"><b>${g.nama}</b></td><td data-l="Username" class="mono">${g.username}</td><td data-l="Peran">${App.PERAN_NAMA[g.peran] || g.peran}</td><td data-l="Mapel">${MAP[g.mapel] || '-'}</td>
          <td data-l="Status">${App.pil(g.status)}</td><td><div class="baris" style="gap:4px;justify-content:flex-end"><button class="btn kecil garis" data-aksi="ubah" data-id="${g.id}">${ikon('edit')}</button>
          <button class="btn kecil garis" data-aksi="sandi" data-id="${g.id}">${ikon('kunci')} Reset sandi</button></div></td></tr>`)}</tbody></table></div>`);
      App.aksi(el, {
        tambah: () => formStaf(null).then(ok => ok && muat(true)),
        ubah: b => formStaf(d.find(x => x.id === b.dataset.id)).then(ok => ok && muat(true)),
        sandi: async b => {
          const g = d.find(x => x.id === b.dataset.id);
          if (!(await App.konfirmasi('Reset sandi ' + g.nama + '?', 'Sandi lama tidak berlaku dan sesi login akun ini berakhir.', 'Reset sandi'))) return;
          const r = await api('guru.resetSandi', { id: g.id }).catch(e => { toast(e.message, 'err'); return null; });
          if (r) tampilSandi(g.username, r.sandi);
        }
      });
    };
    const muat = paksa => App.ambil('guru.daftar', {}, gambar, { segar: paksa ? 0 : 20000, langsung: true });
    await muat(false);
  };
  const tampilSandi = (u, s) => modal({ judul: 'Sandi awal', isi: h`<p>Sampaikan langsung kepada pemilik akun. Sandi ini hanya tampil sekali.</p>
    <div class="kartu" style="text-align:center"><div class="kecil">Username</div><div class="mono" style="font-size:20px;font-weight:800">${u}</div><div class="kecil" style="margin-top:8px">Sandi</div><div class="token-besar" style="letter-spacing:.08em">${s}</div></div>
    <p class="kecil">Minta pemilik akun mengganti sandi di menu Akun setelah masuk.</p>`, aksi: [{ label: 'Sudah dicatat', kelas: 'biru', nilai: 1 }], wajib: true });
  async function formStaf(g) {
    let ok = false;
    await modal({ judul: g ? 'Ubah akun' : 'Akun staf baru', isi: h`<div class="fld"><label class="f">Nama</label><input class="in" name="nama" value="${g ? g.nama : ''}"></div>
      <div class="grid2"><div class="fld"><label class="f">Username</label><input class="in" name="username" value="${g ? g.username : ''}" placeholder="huruf kecil, mis. bu.rina" autocapitalize="none"></div>
        <div class="fld"><label class="f">Peran</label><select class="in" name="peran">${['guru', 'pengawas', 'admin'].map(p => h`<option value="${p}" ${g && g.peran === p ? 'selected' : ''}>${App.PERAN_NAMA[p]}</option>`)}</select></div>
        <div class="fld"><label class="f">Mapel (guru)</label><select class="in" name="mapel"><option value="">—</option>${['BIN', 'MAT'].map(m => h`<option value="${m}" ${g && g.mapel === m ? 'selected' : ''}>${MAP[m]}</option>`)}</select></div>
        <div class="fld"><label class="f">Status</label><select class="in" name="status"><option value="aktif">Aktif</option><option value="nonaktif" ${g && g.status === 'nonaktif' ? 'selected' : ''}>Nonaktif</option></select></div></div>`,
      aksi: [{ label: 'Batal', nilai: null }, { label: 'Simpan', kelas: 'emas', nilai: 'ok' }],
      sebelumTutup: async (v, m) => {
        if (v !== 'ok') return true;
        const f = App.nilaiForm(m);
        try { const r = await api('guru.simpan', Object.assign({ id: g ? g.id : undefined }, f)); ok = true; if (r.sandi) setTimeout(() => tampilSandi(f.username.toLowerCase(), r.sandi), 50); return true; }
        catch (e) { toast(e.message, 'err'); return false; }
      } });
    return ok;
  }

  // =========================================================== PENGATURAN
  const GRUP = [
    ['Identitas sekolah (kop laporan)', ['nama_sekolah', 'npsn', 'alamat', 'kop_baris_1', 'kop_baris_2', 'kepala_sekolah', 'nip_kepala', 'kota_ttd', 'tahun_ajaran', 'logo_sekolah', 'frontend_url']],
    ['Try out & penskoran', ['durasi_bawaan', 'mode_skor', 'kkm', 'ambang_istimewa', 'ambang_baik', 'ambang_memadai']],
    ['Pengamanan & sinkron', ['batas_pelanggaran', 'ambang_pindah_detik', 'simpan_otomatis_detik']],
    ['Latihan & AI', ['latihan_aktif', 'gemini_model']]
  ];
  const LBL = { mode_skor: 'Aturan penskoran bawaan untuk kegiatan baru', latihan_aktif: 'Latihan mandiri siswa', gemini_model: 'Model Gemini untuk generator AI (hanya guru)' };
  App.hal['pengaturan'] = async function (el) {
    el.innerHTML = String(App.kerangka(3));
    const d = await api('set.ambil', {});
    const S = d.setelan, G = d.rahasia.GEMINI_API_KEY;
    el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Administrasi</div><h1>Pengaturan</h1><p>Perubahan berlaku untuk seluruh pengguna dalam beberapa detik.</p></div>
        <button class="btn emas" data-aksi="simpan">${ikon('centang')} Simpan pengaturan</button></div>
      <form id="f-set" onsubmit="return false"><div class="kolom2s">${GRUP.map(g => h`<div class="kartu"><h3>${g[0]}</h3>${g[1].filter(k => S[k]).map(k => h`<div class="fld"><label class="f">${LBL[k] || S[k].ket}</label>
        ${k === 'mode_skor' ? h`<select class="in" name="${k}"><option value="parsial" ${S[k].nilai === 'parsial' ? 'selected' : ''}>Parsial</option><option value="semua" ${S[k].nilai === 'semua' ? 'selected' : ''}>Semua benar</option></select>`
        : k === 'latihan_aktif' ? h`<select class="in" name="${k}"><option value="ya" ${S[k].nilai === 'ya' ? 'selected' : ''}>Ya</option><option value="tidak" ${S[k].nilai === 'tidak' ? 'selected' : ''}>Tidak</option></select>`
        : h`<input class="in" name="${k}" value="${S[k].nilai}">`}</div>`)}</div>`)}
        <div class="kartu aksen"><h3>${ikon('kunci')} Kunci API Gemini (generator AI guru)</h3>
          <p class="kecil">Disimpan aman di server (Script Properties), tidak pernah dikirim ke peramban. Buat kunci gratis di Google AI Studio dengan akun sekolah.</p>
          <p>Status: ${G.ada ? h`<span class="pil hijau">Terpasang</span> <span class="mono">${G.samar}</span>` : h`<span class="pil">Belum diisi</span>`}</p>
          <div class="baris"><input class="in" id="gemini" type="password" autocomplete="off" placeholder="${G.ada ? 'Isi untuk mengganti' : 'Tempel kunci API'}" style="max-width:340px">
            <button class="btn biru" data-aksi="kunciAi">Simpan kunci</button>${G.ada ? h`<button class="btn garis" data-aksi="hapusAi">Hapus</button>` : ''}</div></div></div></form>`);
    App.aksi(el, {
      simpan: b => App.sibuk(b, async () => { const f = App.nilaiForm($('#f-set', el)); delete f.gemini; await api('set.simpan', { setelan: f }); App.konfig = await api('app.konfig', {}); App.LS.set('konfig', App.konfig); }),
      kunciAi: b => App.sibuk(b, async () => { const v = $('#gemini', el).value.trim(); if (!v) throw new Error('Kunci kosong.'); await api('rahasia.simpan', { kunci: 'GEMINI_API_KEY', nilai: v }); $('#gemini', el).value = ''; App.render(); }),
      hapusAi: async b => { if (await App.konfirmasi('Hapus kunci API?', 'Generator AI guru tidak dapat dipakai sampai kunci diisi lagi.', 'Hapus', 'bahaya')) App.sibuk(b, async () => { await api('rahasia.simpan', { kunci: 'GEMINI_API_KEY', nilai: '__HAPUS__' }); App.render(); }); }
    });
  };

  // =========================================================== SISTEM
  App.hal['sistem'] = async function (el) {
    el.innerHTML = String(App.kerangka(3));
    const [s, cad, aud] = await Promise.all([App.apiQ('sistem.status', {}), App.apiQ('cadangan.daftar', {}), App.apiQ('audit.daftar', { batas: 150 })]);
    el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Administrasi</div><h1>Sistem & cadangan</h1><p>Server versi ${s.versi} · API v${s.api} · aplikasi v${App.VERSI}</p></div>
        <div class="baris"><a class="btn garis" href="${s.spreadsheet}" target="_blank" rel="noopener">${ikon('basis')} Buka spreadsheet</a><button class="btn emas" data-aksi="cadangan">${ikon('unduh')} Buat cadangan</button></div></div>
      <div class="kpi">
        <div class="kartu"><div class="lbl">Pekerja latar</div><div class="val" style="color:${s.trigger_ok ? 'var(--ok)' : 'var(--bad)'}">${s.trigger_ok ? 'Aktif' : 'Mati'}</div><small>${s.trigger.join(', ') || 'jalankan setupAppEnvironment'}</small></div>
        <div class="kartu"><div class="lbl">Sesi berlangsung</div><div class="val">${s.sesi_berlangsung}</div><small>saat ini</small></div>
        <div class="kartu"><div class="lbl">Antrean nilai</div><div class="val">${s.kumpul_belum_diproses}</div><small>pengumpulan belum dinilai</small></div>
        <div class="kartu"><div class="lbl">Siswa · paket</div><div class="val">${s.siswa}</div><small>${s.paket} paket · AI ${s.ai ? 'aktif' : 'nonaktif'}</small></div></div>
      <div class="kolom2s"><div class="kartu"><h3>Pemeliharaan</h3>
          <div class="daftar-menu">
            <button class="item-menu" data-aksi="flush">${ikon('segar')}<span><b>Proses jawaban sekarang</b><br><small>Menulis jawaban dari cache ke spreadsheet dan menghitung nilai (biasanya otomatis tiap menit).</small></span></button>
            <button class="item-menu" data-aksi="sinkron">${ikon('tumpuk')}<span><b>Sinkronkan paket resmi</b><br><small>Memasang/memperbarui paket resmi KelasTKA+ dari berkas server.</small></span></button>
            <button class="item-menu" data-aksi="bersihLokal">${ikon('hapus')}<span><b>Kosongkan tampilan tersimpan di perangkat ini</b></span></button></div></div>
        <div class="kartu"><h3>Cadangan (Google Drive)</h3>${cad.length ? cad.slice(0, 10).map(c => h`<a class="log-item" href="${c.url}" target="_blank" rel="noopener">${ikon('dokumen')}<div><b>${c.nama}</b><div class="kecil">${App.tglJam(c.waktu)}</div></div></a>`) : h`<p class="kecil">Belum ada cadangan. Cadangan otomatis dibuat setiap hari pukul 01.00.</p>`}</div></div>
      <div class="kartu" style="margin-top:16px"><h3>Jejak audit</h3><div class="tabel-wadah" style="max-height:420px;overflow:auto"><table class="t resp"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>
        ${aud.map(a => h`<tr><td data-l="Waktu" class="kecil">${App.tglJam(a.waktu)}</td><td data-l="Pengguna">${a.pengguna}<div class="kecil">${a.peran}</div></td><td data-l="Aksi"><span class="pil garis">${a.aksi}</span></td><td data-l="Detail" class="kecil" style="max-width:360px;word-break:break-word">${a.detail}</td></tr>`)}</tbody></table></div></div>`);
    App.aksi(el, {
      cadangan: b => App.sibuk(b, async () => { await api('cadangan.buat', {}, { batas: 120000 }); App.render(); }),
      flush: b => App.sibuk(b, async () => { const r = await api('sistem.flush', {}); toast(r.hasil + ' pengumpulan dinilai.', 'ok'); App.render(); }),
      sinkron: b => App.sibuk(b, async () => { const r = await api('paket.sinkronResmi', {}); toast('Sinkron selesai: ' + JSON.stringify(r), 'ok', 6000); App.Data.basi('paket'); }),
      bersihLokal: () => { App.Data.kosongkan(); toast('Tampilan tersimpan dikosongkan.', 'ok'); }
    });
  };
})();
