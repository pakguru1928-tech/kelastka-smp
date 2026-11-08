/* Pengawas: daftar sesi, pantau peserta (status, progres, pelanggaran, offline), tindakan dengan alasan, log kejadian. */
(function () {
  'use strict';
  const { h, $, $$, ikon, api, toast, modal, angka } = App;
  const MAP = App.MAPEL;

  App.hal['pantau'] = async function (el) {
    el.innerHTML = String(App.kerangka(3));
    const gambar = list => {
      const grup = { berlangsung: list.filter(s => s.status === 'berlangsung'), dijadwalkan: list.filter(s => s.status === 'dijadwalkan'), selesai: list.filter(s => s.status === 'selesai') };
      const kartu = s => h`<a class="kartu" href="#/pantau/${s.id}" style="display:block;color:inherit;text-decoration:none;margin-bottom:12px;border-left:4px solid ${s.status === 'berlangsung' ? 'var(--gold)' : s.status === 'dijadwalkan' ? 'var(--blue)' : 'var(--ok)'}">
        <div class="baris antara"><div>${App.pil(s.status)} ${s.jenis === 'susulan' ? h`<span class="pil garis">Susulan</span>` : ''}<h3 style="margin:8px 0 2px">${s.kegiatan}</h3>
          <div class="kecil">${MAP[s.mapel]} · ${s.paket} · ${s.rombel.join(', ') || s.jumlah + ' siswa'}${s.ruang ? ' · ' + s.ruang : ''}</div></div>
          <div style="text-align:right"><div class="kecil">Token</div><div class="mono" style="font-size:22px;font-weight:800;color:var(--blue);letter-spacing:.15em">${s.token}</div></div></div>
        <div class="kecil" style="margin-top:8px">${ikon('jam')} ${App.tglJam(s.mulai)} – ${App.jam(s.selesai)} · ${s.durasi} menit · ${s.jumlah} peserta${s.pengawas ? ' · Pengawas: ' + s.pengawas : ''}</div></a>`;
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Pengawasan</div><h1>Pantau sesi</h1><p>Pilih sesi untuk memantau peserta, membuka kunci layar, menambah waktu, atau mereset login.</p></div>
        <button class="btn garis" data-aksi="segar">${ikon('segar')} Segarkan</button></div>
        ${!list.length ? App.kosong('Belum ada sesi', App.Sesi.peran === 'pengawas' ? 'Sesi yang ditugaskan kepada Anda akan tampil di sini.' : 'Buat kegiatan dan sesi di menu Kegiatan & Sesi.') : ''}
        ${grup.berlangsung.length ? h`<h3>Sedang berlangsung</h3>${grup.berlangsung.map(kartu)}` : ''}
        ${grup.dijadwalkan.length ? h`<h3 style="margin-top:20px">Akan datang</h3>${grup.dijadwalkan.map(kartu)}` : ''}
        ${grup.selesai.length ? h`<h3 style="margin-top:20px">Selesai (3 hari terakhir)</h3>${grup.selesai.map(kartu)}` : ''}`);
    };
    App.aksi(el, { segar: () => App.ambil('pengawas.sesi', {}, gambar, { paksa: true }) });
    await App.ambil('pengawas.sesi', {}, gambar, { segar: 15000 });
    App.ulang(() => { if (App.Aktif.jatuh('psesi', 30000, 90000)) App.ambil('pengawas.sesi', {}, gambar, { segar: 0 }).catch(() => {}); }, 5000);
  };

  App.hal['pantau/:sesi'] = async function (el, prm) {
    const sesi = prm.sesi;
    let D = null, saring = 'semua', cari = '', terakhir = 0, logData = [];
    el.innerHTML = String(App.kerangka(3));
    const STAT = p => p.st === 'selesai' ? 'selesai' : p.st === 'terkunci' ? 'terkunci' : p.offline ? 'offline' : p.st === 'mengerjakan' ? 'mengerjakan' : 'belum';
    const gambar = d => {
      D = d; terakhir = Date.now();
      const s = d.sesi, P = d.peserta, hit = { semua: P.length, mengerjakan: 0, terkunci: 0, offline: 0, selesai: 0, belum: 0 };
      P.forEach(p => { hit[STAT(p)]++; });
      const daftar = P.filter(p => (saring === 'semua' || STAT(p) === saring) && (!cari || (p.nama + ' ' + p.username).toLowerCase().indexOf(cari) >= 0))
        .sort((a, b) => ({ terkunci: 0, offline: 1, mengerjakan: 2, belum: 3, selesai: 4 }[STAT(a)] - { terkunci: 0, offline: 1, mengerjakan: 2, belum: 3, selesai: 4 }[STAT(b)]) || a.nama.localeCompare(b.nama));
      el.innerHTML = String(h`<div class="judul-hal"><div><a href="#/pantau" class="kecil">${ikon('kiri')} Semua sesi</a>
          <h1 style="margin-top:4px">${s.kegiatan}</h1><p>${MAP[s.mapel]} · ${s.paket} · ${s.rombel.join(', ')}${s.ruang ? ' · ' + s.ruang : ''} · ${App.tglJam(s.mulai)} – ${App.jam(s.selesai)}</p></div>
          <div class="kartu" style="padding:12px 16px;text-align:center"><div class="kecil">TOKEN SESI</div><div class="token-besar">${s.token}</div>
            <div class="baris" style="justify-content:center;gap:6px"><button class="btn kecil garis" data-aksi="salin">${ikon('salin')} Salin</button>
            <button class="btn kecil garis" data-aksi="tokenBaru">${ikon('segar')} Token baru</button><button class="btn kecil garis" data-aksi="layarToken">${ikon('penuh')} Tampilkan</button></div></div></div>
        <div class="kpi">${[['semua', 'Total peserta', 'navy'], ['mengerjakan', 'Mengerjakan', 'biru'], ['terkunci', 'Terkunci', 'merah'], ['offline', 'Tidak terhubung', 'abu'], ['selesai', 'Selesai', 'hijau'], ['belum', 'Belum mulai', 'abu']]
          .map(k => h`<button class="kartu" data-aksi="saring" data-v="${k[0]}" style="text-align:left;cursor:pointer;${saring === k[0] ? 'outline:2px solid var(--blue)' : ''}"><div class="lbl">${k[1]}</div><div class="val" style="color:${App.WARNA[k[2]]}">${hit[k[0]]}</div></button>`)}</div>
        <div class="kolom2"><div>
          <div class="baris antara" style="margin-bottom:10px"><input class="in" id="cari" placeholder="Cari nama atau username…" value="${cari}" style="max-width:320px">
            <span class="kecil">${App.pil(s.status)} · diperbarui <span id="umur">baru saja</span> <button class="btn kecil hantu" data-aksi="segar">${ikon('segar')}</button></span></div>
          <div class="peserta-grid">${daftar.map(p => { const st = STAT(p), jml = s.jumlah_soal || 30;
            return h`<div class="pes ${st}"><div><b>${p.nama}</b><div class="kecil">${p.username} · ${p.rombel}${p.pel ? h` · <span style="color:var(--bad);font-weight:700">${p.pel}× pindah layar</span>` : ''}</div></div>
              <div class="sel-sembunyi"><div class="kecil">${p.terj}/${jml} terjawab</div><div class="progres"><div style="width:${Math.round(p.terj / jml * 100)}%"></div></div></div>
              <div class="sel-sembunyi kecil">${st === 'selesai' ? h`Kumpul ${App.jam(p.kumpul)}<br><span class="mono">${p.resi}</span>` : p.mulai ? h`Sisa ${App.durasi(p.sisa)}${p.tambah ? ' (+' + p.tambah + 'm)' : ''}<br>kontak ${App.lalu(p.kontak)}` : '–'}</div>
              <div class="baris" style="gap:6px;justify-content:flex-end">${App.pil(st, st === 'offline' ? 'Tidak terhubung' : null)}
                ${st !== 'belum' && st !== 'selesai' ? h`<button class="btn kecil ${st === 'terkunci' ? 'emas' : 'garis'}" data-aksi="tindak" data-id="${p.id}">${ikon(st === 'terkunci' ? 'buka' : 'titik3')}${st === 'terkunci' ? 'Buka' : ''}</button>` : ''}
                ${st === 'belum' ? h`<button class="btn kecil garis" data-aksi="tindak" data-id="${p.id}">${ikon('titik3')}</button>` : ''}</div></div>`; })}
            ${!daftar.length ? h`<p class="kecil">Tidak ada peserta pada kelompok ini.</p>` : ''}</div></div>
          <div class="kartu"><div class="kartu-kepala"><h3>Log kejadian</h3><button class="btn kecil garis" data-aksi="muatLog">${ikon('segar')}</button></div>
            <div id="log">${logHtml()}</div>
            <div class="kecil" style="margin-top:12px;background:var(--bg);padding:10px;border-radius:10px">${ikon('info')} <b>Panduan:</b> layar siswa dikunci setelah batas pindah layar tercapai; jawaban <b>tidak</b> dikumpulkan otomatis. Periksa siswa, lalu buka kunci dengan alasan. Status "tidak terhubung" biasanya karena sinyal — bukan pelanggaran.</div></div></div>`);
      const ci = $('#cari', el); ci.oninput = App.tunda(() => { cari = ci.value.trim().toLowerCase(); gambar(D); const c = $('#cari', el); c.focus(); c.setSelectionRange(c.value.length, c.value.length); }, 250);
    };
    const logHtml = () => logData.length ? h`${logData.slice(0, 60).map(l => h`<div class="log-item"><span class="mono kecil" style="min-width:42px">${App.jam(l.t)}</span>
      <div><b>${l.nama || l.siswa}</b> — ${({ pindah: 'pindah layar', fokus: 'keluar jendela', terkunci: 'layar terkunci', mulai: 'mulai', lanjut: 'melanjutkan', kumpul: 'mengumpulkan', buka: 'kunci dibuka', tambah: 'waktu ditambah', reset: 'login direset', keluar_layar_penuh: 'keluar layar penuh', pindah_perangkat: 'pindah perangkat' })[l.j] || l.j}
      ${l.d ? h` <span class="kecil">(${l.j === 'tambah' ? Math.round(l.d / 60) + ' mnt' : l.d + ' dtk'})</span>` : ''}<div class="kecil">${l.oleh !== 'sistem' ? 'oleh ' + l.oleh + ' · ' : ''}${l.i || ''}</div></div></div>`)}` : h`<p class="kecil">Belum ada kejadian.</p>`;
    const muat = paksa => App.ambil('pengawas.pantau', { sesi }, gambar, { segar: paksa ? 0 : 8000, langsung: true });
    const muatLog = async () => { try { logData = await api('pengawas.log', { sesi }); const l = $('#log', el); if (l) l.innerHTML = String(logHtml()); } catch (e) { /* abaikan */ } };
    App.aksi(el, {
      segar: () => muat(true), muatLog,
      saring: b => { saring = b.dataset.v; gambar(D); },
      salin: () => { navigator.clipboard && navigator.clipboard.writeText(D.sesi.token).then(() => toast('Token disalin.', 'ok')); },
      layarToken: () => modal({ isi: h`<div style="text-align:center;padding:24px 0"><div class="kecil">${D.sesi.kegiatan}</div><div class="mono" style="font-size:min(18vw,120px);font-weight:800;letter-spacing:.15em;color:var(--navy)">${D.sesi.token}</div><div>Masukkan token ini di halaman Beranda.</div></div>`, lebar: true }),
      tokenBaru: async b => {
        if (!(await App.konfirmasi('Buat token baru?', 'Token lama tidak berlaku untuk siswa yang BELUM masuk. Siswa yang sudah mengerjakan tidak terpengaruh.', 'Buat token baru'))) return;
        App.sibuk(b, async () => { await api('sesi.tokenBaru', { id: sesi }); App.Data.basi('pengawas'); muat(true); });
      },
      tindak: b => tindakan(D.peserta.find(p => p.id === b.dataset.id))
    });
    async function tindakan(p) {
      if (!p) return;
      const st = STAT(p);
      const pil = await modal({ judul: p.nama, isi: h`<p class="kecil">${p.username} · ${p.rombel} · ${App.pil(st)} · ${p.terj} terjawab · ${p.pel} pelanggaran</p>
        ${(p.log || []).length ? h`<div class="kecil" style="background:var(--bg);border-radius:10px;padding:8px 12px;margin-bottom:10px">${p.log.slice().reverse().map(l => h`<div>${App.jam(l.t)} · ${l.j}${l.d ? ' ' + l.d + ' dtk' : ''}</div>`)}</div>` : ''}
        <div class="daftar-menu">
          ${st === 'terkunci' ? h`<button class="item-menu" data-v="buka">${ikon('buka')}<span><b>Buka kunci layar</b><br><small>Siswa melanjutkan; hitungan pelanggaran diulang dari nol.</small></span></button>` : ''}
          ${st !== 'belum' && st !== 'selesai' ? h`<button class="item-menu" data-v="tambah">${ikon('jam')}<span><b>Tambah waktu</b><br><small>Untuk gangguan teknis atau kebutuhan khusus.</small></span></button>` : ''}
          <button class="item-menu" data-v="reset">${ikon('hp')}<span><b>Reset login / pindah perangkat</b><br><small>Siswa dapat melanjutkan di perangkat lain dengan token sesi.</small></span></button>
          ${st !== 'belum' && st !== 'selesai' ? h`<button class="item-menu merah" data-v="kumpul">${ikon('kirim')}<span><b>Kumpulkan jawaban sekarang</b><br><small>Jawaban terakhir yang diterima server dikumpulkan.</small></span></button>` : ''}
        </div>`, saatBuka: (m, tutup) => $$('[data-v]', m).forEach(x => x.onclick = () => tutup(x.dataset.v)) });
      if (!pil) return;
      const judul = { buka: 'Buka kunci layar', tambah: 'Tambah waktu', reset: 'Reset login', kumpul: 'Kumpulkan jawaban' }[pil];
      const r = await App.mintaTeks(judul + ' — ' + p.nama, 'Alasan (tercatat di log)', { kelas: pil === 'kumpul' ? 'bahaya' : 'biru', tombol: judul,
        placeholder: pil === 'buka' ? 'mis. sudah diperiksa, notifikasi masuk' : pil === 'tambah' ? 'mis. HP mati 5 menit' : pil === 'reset' ? 'mis. HP rusak, pindah ke PC-12' : 'mis. siswa sakit',
        tambahan: pil === 'tambah' ? h`<div class="fld"><label class="f">Tambahan (menit)</label><select class="in" data-ex="menit">${[3, 5, 10, 15, 20, 30].map(x => h`<option ${x === 5 ? 'selected' : ''}>${x}</option>`)}</select></div>` : '' });
      if (!r) return;
      try { await api('pengawas.tindak', { sesi, siswa: p.id, aksi: pil, alasan: r.teks, menit: Number(r.ex.menit || 5) }); muat(true); muatLog(); }
      catch (e) { toast(e.message, 'err'); }
    }
    await muat(false);
    muatLog();
    // polling adaptif: 15 dtk saat aktif, 60 dtk saat diam, berhenti saat tab tidak terlihat
    App.ulang(() => {
      const u = $('#umur', el); if (u) u.textContent = App.lalu(terakhir).replace(' lalu', '') + ' lalu';
      if (App.Aktif.jatuh('pantau', 15000, 60000)) { muat(true).catch(() => {}); if (Math.random() < 0.34) muatLog(); }
    }, 3000);
  };
})();
