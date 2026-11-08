/* Halaman masuk (siswa & staf) dan halaman akun. */
(function () {
  'use strict';
  const { h, $, $$, ikon, api, toast, Sesi, sibuk } = App;

  App.hal['masuk'] = async function (el) {
    const k = App.konfig || {};
    App.panaskan('pub');
    const tab = App.LS.get('tab_masuk', 'siswa');
    el.innerHTML = String(h`<div class="masuk">
      <section class="pahlawan">
        <div style="position:relative;z-index:1">
          <img class="logo" src="./assets/logo-horizontal.webp" alt="KelasTKA+ SMP" width="460" height="153">
          <h1>Latihan & Try Out TKA SMP</h1>
          <p>${k.nama_sekolah || 'Sekolah Anda'}${k.tahun_ajaran ? ' · Tahun ajaran ' + k.tahun_ajaran : ''}</p>
          <div class="poin">
            <div>${ikon('buku')} Bahasa Indonesia dan Matematika, 30 soal per paket</div>
            <div>${ikon('perisai')} Jawaban tersimpan otomatis, aman walau sinyal putus</div>
            <div>${ikon('grafik')} Hasil dan pembahasan rinci setelah kegiatan ditutup</div>
          </div>
        </div>
        <p class="kecil" style="color:#A5B4FC;position:relative;z-index:1;margin:24px 0 0">Aplikasi latihan sekolah · versi ${App.VERSI}</p>
      </section>
      <section class="form">
        <div class="seg" role="tablist" style="margin-bottom:20px;width:100%">
          <button role="tab" data-tab="siswa" class="${tab === 'siswa' ? 'aktif' : ''}" style="flex:1">${ikon('pengguna')} Siswa</button>
          <button role="tab" data-tab="staf" class="${tab === 'staf' ? 'aktif' : ''}" style="flex:1">${ikon('grup')} Guru / Pengawas</button>
        </div>
        <form id="f-siswa" class="${tab === 'siswa' ? '' : 'sembunyi'}" autocomplete="off">
          <h2>Selamat datang</h2>
          <p class="kecil">Masukkan username dan token yang tertulis di <b>kartu login</b> dari sekolah.</p>
          <div class="fld"><label class="f" for="u-siswa">Username</label>
            <input class="in" id="u-siswa" name="username" placeholder="contoh: ixa-001" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="text" required></div>
          <div class="fld"><label class="f" for="t-siswa">Token kartu</label>
            <input class="in token-in" id="t-siswa" name="token" placeholder="••••••" maxlength="6" autocapitalize="characters" autocorrect="off" spellcheck="false" required style="font-size:22px"></div>
          <div class="err" id="e-siswa" style="color:var(--bad);font-size:13.5px;min-height:20px"></div>
          <button class="btn emas besar penuh" type="submit">Masuk ${ikon('kanan')}</button>
          <div class="catatan">${ikon('info')}<span>Satu akun hanya dapat mengerjakan try out di satu perangkat. Jika pindah perangkat, minta bantuan pengawas.</span></div>
        </form>
        <form id="f-staf" class="${tab === 'staf' ? '' : 'sembunyi'}" autocomplete="on">
          <h2>Masuk staf</h2>
          <p class="kecil">Untuk admin, guru mata pelajaran, dan pengawas ruang.</p>
          <div class="fld"><label class="f" for="u-staf">Username</label>
            <input class="in" id="u-staf" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>
          <div class="fld"><label class="f" for="p-staf">Kata sandi</label>
            <div style="position:relative"><input class="in" id="p-staf" name="sandi" type="password" autocomplete="current-password" required style="padding-right:48px">
            <button type="button" class="btn hantu kecil" id="lihat-sandi" style="position:absolute;right:4px;top:6px" aria-label="Lihat sandi">${ikon('mata')}</button></div></div>
          <div class="err" id="e-staf" style="color:var(--bad);font-size:13.5px;min-height:20px"></div>
          <button class="btn biru besar penuh" type="submit">Masuk ${ikon('kanan')}</button>
        </form>
        <button class="btn hantu penuh" data-pasang-app style="margin-top:12px">${ikon('hp')} Pasang aplikasi di HP</button>
      </section></div>`);

    $$('[data-tab]', el).forEach(b => b.onclick = () => {
      const t = b.dataset.tab; App.LS.set('tab_masuk', t);
      $$('[data-tab]', el).forEach(x => x.classList.toggle('aktif', x === b));
      $('#f-siswa', el).classList.toggle('sembunyi', t !== 'siswa'); $('#f-staf', el).classList.toggle('sembunyi', t !== 'staf');
      App.panaskan(t);
    });
    $('[data-pasang-app]', el).onclick = () => App.Pasang.tanya();
    App.Pasang.tombol();
    $('#lihat-sandi', el).onclick = () => { const p = $('#p-staf', el); p.type = p.type === 'password' ? 'text' : 'password'; };
    $('#t-siswa', el).addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });

    const masuk = async (form, aksi, data, err) => {
      const btn = $('button[type=submit]', form); $(err, el).textContent = '';
      await sibuk(btn, async () => {
        try {
          const r = await api(aksi, data, { batas: 30000 });
          Sesi.simpan(r.token, r.me);
          delete $('#app').dataset.shell;
          App.ke(r.me.r === 'siswa' ? 'beranda' : r.me.r === 'pengawas' ? 'pantau' : 'dasbor');
        } catch (e) { $(err, el).textContent = e.message; throw e; }
      });
    };
    $('#f-siswa', el).onsubmit = e => { e.preventDefault(); const f = App.nilaiForm(e.target); masuk(e.target, 'auth.siswa', { username: f.username.trim().toLowerCase(), token: f.token.trim().toUpperCase() }, '#e-siswa'); };
    $('#f-staf', el).onsubmit = e => { e.preventDefault(); const f = App.nilaiForm(e.target); masuk(e.target, 'auth.staf', { username: f.username.trim().toLowerCase(), sandi: f.sandi }, '#e-staf'); };
  };

  App.hal['akun'] = async function (el) {
    const me = Sesi.me || {};
    el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Akun</div><h1>${me.n}</h1><p>${App.PERAN_NAMA[me.r]}${me.m ? ' · ' + App.MAPEL[me.m] : ''}${me.rb ? ' · Rombel ' + me.rb : ''} · username <b>${me.un}</b></p></div></div>
      <div class="kolom2s">
        ${me.r !== 'siswa' ? h`<form class="kartu" id="f-sandi"><h3>Ganti kata sandi</h3>
          <div class="fld"><label class="f">Sandi lama</label><input class="in" type="password" name="lama" autocomplete="current-password" required></div>
          <div class="fld"><label class="f">Sandi baru</label><input class="in" type="password" name="baru" autocomplete="new-password" minlength="8" required><small>Minimal 8 karakter, berisi huruf dan angka.</small></div>
          <div class="fld"><label class="f">Ulangi sandi baru</label><input class="in" type="password" name="ulang" autocomplete="new-password" required></div>
          <button class="btn biru" type="submit">${ikon('kunci')} Simpan sandi baru</button></form>` : h`<div class="kartu"><h3>Akun siswa</h3><p>Token login ada di kartu dari sekolah. Jika kartu hilang, minta admin mencetak ulang atau mengganti token.</p></div>`}
        <div class="kartu"><h3>Perangkat ini</h3>
          <p class="kecil">Pasang aplikasi agar terbuka lebih cepat dan bisa dipakai saat sinyal lemah.</p>
          <div class="baris"><button class="btn garis" data-pasang>${ikon('hp')} Pasang aplikasi</button>
          <button class="btn garis" data-bersih>${ikon('hapus')} Hapus data tersimpan</button>
          <button class="btn bahaya" data-keluar>${ikon('keluar')} Keluar</button></div></div></div>`);
    const f = $('#f-sandi', el);
    if (f) f.onsubmit = e => {
      e.preventDefault(); const v = App.nilaiForm(f);
      if (v.baru !== v.ulang) return toast('Ulangan sandi baru tidak sama.', 'err');
      sibuk($('button[type=submit]', f), async () => { await api('akun.gantiSandi', { lama: v.lama, baru: v.baru }); Sesi.hapus(); delete $('#app').dataset.shell; App.ke('masuk'); });
    };
    $('[data-pasang]', el).onclick = () => App.Pasang.tanya();
    $('[data-keluar]', el).onclick = () => App.keluar();
    $('[data-bersih]', el).onclick = async () => {
      if (!(await App.konfirmasi('Hapus data tersimpan?', 'Paket soal yang sudah diunduh dan tampilan tersimpan akan dihapus dari perangkat ini. Jawaban try out yang belum terkirim TIDAK dihapus.', 'Hapus'))) return;
      const ks = await App.IDB.kunci(); for (const k of ks) if (String(k).indexOf('pk|') === 0) await App.IDB.del(k);
      App.Data.kosongkan(); toast('Data tersimpan dihapus.', 'ok');
    };
  };
})();
