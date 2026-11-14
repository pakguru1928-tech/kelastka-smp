/* Survei karakter & lingkungan belajar: pengisian (murid/guru), pengelolaan (admin), laporan agregat (admin/guru). */
(function () {
  'use strict';
  const { h, $, $$, ikon, api, toast, modal, angka, angka2, Grafik, Sesi, IDB } = App;
  const WARNA_KAT = { Baik: 'hijau', Sedang: 'kuning', Kurang: 'merah' };
  const pilKat = k => k ? h`<span class="pil ${WARNA_KAT[k] === 'hijau' ? 'hijau' : WARNA_KAT[k] === 'kuning' ? 'kuning' : 'merah'}">${k}</span>` : '';
  const statusSv = s => s.status === 'ditutup' ? ['', 'Ditutup'] : s.terbuka ? ['hijau', 'Terbuka'] : s.buka > Date.now() ? ['biru', 'Dijadwalkan'] : ['', 'Berakhir'];
  // Paket paralel: kode jenis "karakter" = Paket 1, "karakter_3" = Paket 3 (aspek & kode butir sama, kalimat berbeda).
  const kodeRapor = c => c ? h`<span class="pil garis" style="height:20px;font-size:11px;padding:0 7px" title="Kode indikator Rapor Pendidikan">${c}</span>` : '';
  const kelSv = j => String(j || '').replace(/_\d+$/, '');
  const pkSv = j => Number((String(j || '').match(/_(\d+)$/) || [])[1] || 1);
  const namaSv = j => String(j.judul || '').replace(/ · Paket \d+$/, '');
  /** Kelompokkan instrumen per survei + hitung pemakaian tiap paket; saran = paket yang paling jarang dipakai (nomor terkecil bila sama). */
  const grupSv = D => {
    const pakai = {}; (D.survei || []).forEach(s => { pakai[s.jenis] = (pakai[s.jenis] || 0) + 1; });
    const g = {};
    D.jenis.forEach(j => { const k = kelSv(j.kode); (g[k] = g[k] || { kode: k, nama: namaSv(j), sasaran: j.sasaran, butir: j.butir, menit: j.menit, paket: [] }).paket.push(Object.assign({}, j, { no: pkSv(j.kode), dipakai: pakai[j.kode] || 0 })); });
    return Object.values(g).map(x => { x.paket.sort((a, b) => a.no - b.no); x.saran = x.paket.slice().sort((a, b) => a.dipakai - b.dipakai || a.no - b.no)[0]; return x; });
  };

  /** Rekomendasi tindak lanjut per aspek (dipakai bila kategori Sedang/Kurang). */
  const REKOM = {
    karakter: {
      KT: 'Perkuat pembiasaan ibadah dan akhlak melalui kegiatan rutin (doa bersama, kultum/renungan sesuai keyakinan) serta keteladanan guru dalam kejujuran, misalnya ujian tanpa pengawasan ketat dengan pakta kejujuran.',
      KW: 'Rancang kegiatan kebinekaan (pekan budaya, proyek lintas kelompok) dan kesepakatan kelas tentang aturan; tindak tegas candaan bernada SARA di kelas maupun grup daring.',
      PK: 'Biasakan pertanyaan "mengapa" dan "apa buktinya" di setiap mata pelajaran, latih literasi digital (cek fakta, sumber tepercaya), dan ajak murid menimbang dampak keputusan bagi orang lain (refleksi etis).',
      KR: 'Beri tugas terbuka yang menerima beragam solusi, proyek pemanfaatan barang bekas, dan apresiasi atas ide orisinal, bukan hanya hasil akhir.',
      KL: 'Gunakan kerja kelompok dengan peran yang jelas dan penilaian kontribusi individu; bentuk kelompok heterogen secara bergilir.',
      KM: 'Beri murid tanggung jawab nyata secara bergilir (piket, peran dalam kelompok, kepengurusan kelas) untuk melatih kepemimpinan dan penyesuaian diri; biasakan refleksi diri dan umpan balik yang menunjukkan langkah perbaikan.',
      KS: 'Galakkan pola hidup bersih dan sehat (cuci tangan, jumat bersih, aktivitas fisik), edukasi kebiasaan tidur dan penggunaan gawai, serta perkenalkan layanan BK untuk kesehatan mental.',
      KO: 'Latih keterbukaan menerima masukan, empati, dan cara berbicara yang santun (diskusi berpasangan, umpan balik antarteman, etika berkomunikasi di media sosial).',
      KH: 'Jalankan Gerakan 7 Kebiasaan Anak Indonesia Hebat secara terencana: jurnal kebiasaan harian yang dipantau wali kelas, kerja sama dengan orang tua, dan fokus pada kebiasaan dengan indeks terendah (lihat rincian per kebiasaan).'
    },
    lingkungan_murid: {
      IK: 'Tinjau ulang program pencegahan kekerasan: sosialisasi saluran pelaporan, penguatan tim pencegahan dan penanganan kekerasan sekolah, disiplin positif tanpa hukuman fisik, pengawasan area rawan (toilet, kantin, belakang kelas), serta wali kelas yang rutin menyapa murid dan layanan konseling yang mudah diakses. Periksa subaspek dengan persentase murid aman terendah.',
      KB: 'Fokuskan supervisi pada pengelolaan kelas dengan disiplin positif, dukungan guru, variasi metode dan media, serta kegiatan literasi dan numerasi di semua mata pelajaran; biasakan membahas hasil penilaian, remedial, pengayaan, dan refleksi akhir pelajaran; berbagi praktik baik dalam komunitas belajar guru.',
      PD: 'Gunakan hasil ini sebagai umpan balik bagi guru (tanpa menyebut nama): keteladanan, komunikasi yang ramah, variasi cara mengajar, dan penguasaan materi; tindak lanjuti melalui komunitas belajar dan supervisi akademik.',
      IB: 'Kuatkan toleransi dan kesetaraan melalui kegiatan lintas agama dan budaya, pemilihan pengurus kelas yang terbuka, dan penanganan tegas atas candaan bernada SARA.',
      IN: 'Lakukan asesmen kebutuhan belajar, sediakan dukungan dan fasilitas bagi murid berkebutuhan khusus serta pembinaan bagi murid cerdas dan berbakat istimewa, dan tegaskan larangan menertawakan teman yang kesulitan.',
      GD: 'Pastikan pembagian peran dan tugas yang adil bagi murid laki-laki dan perempuan, kesempatan memimpin yang setara, serta diskusi kelas untuk meluruskan stereotip gender.',
      BC: 'Jadwalkan simulasi evakuasi minimal tiap semester, pastikan jalur evakuasi dan titik kumpul jelas, dan integrasikan materi pengurangan risiko bencana serta perubahan iklim dalam pembelajaran dan kokurikuler.',
      PM: 'Libatkan murid (OSIS, perwakilan kelas) dalam merencanakan dan menjalankan program sekolah, sampaikan tindak lanjut usulan mereka, dan perkuat komunikasi serta dukungan orang tua terhadap program sekolah.',
      PS: 'Sosialisasikan kebijakan sekolah tentang perundungan, hukuman fisik, kekerasan seksual, rokok-miras-narkoba, kesetaraan gender, dan intoleransi secara berkala, termasuk saluran pelaporannya, sehingga murid mengetahui dan merasakannya.'
    },
    lingkungan_guru: {
      RG: 'Jadwalkan komunitas belajar rutin untuk membahas data asesmen dan umpan balik murid, lalu sepakati satu perbaikan praktik setiap siklus.',
      KK: 'Kepala sekolah menyusun jadwal observasi kelas yang konsisten dengan umpan balik yang membangun dan program pengembangan guru yang terarah.',
      IS: 'Sosialisasikan kembali prosedur pencegahan dan penanganan kekerasan, disiplin positif, serta strategi pembelajaran berdiferensiasi untuk murid beragam.',
      PK: 'Perkuat praktik kelas: tujuan dan kriteria keberhasilan yang jelas, pertanyaan yang mengajak berpikir, umpan balik yang konkret, dan kesepakatan kelas.',
      KG: 'Petakan beban kerja guru, kurangi tugas administratif yang tidak perlu, dan bangun budaya saling menghargai serta dukungan antarrekan.'
    }
  };

  // =========================================================== DAFTAR & KELOLA (staf)
  App.hal['survei'] = async function (el) {
    el.innerHTML = String(App.kerangka(3));
    const admin = Sesi.peran === 'admin', boleh = admin || Sesi.peran === 'guru';
    const [saya, D, bantuan] = await Promise.all([
      App.apiQ('survei.saya', {}).catch(() => []),
      boleh ? App.apiQ('survei.daftar', {}) : Promise.resolve(null),
      admin ? App.apiQ('survei.bantuan', {}).catch(() => []) : Promise.resolve([])
    ]);
    const gambar = () => {
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Survei</div><h1>Survei karakter & lingkungan belajar</h1>
          <p>Latihan survei dan refleksi mutu sekolah, selaras dengan indikator Rapor Pendidikan. Jawaban perorangan dirahasiakan; laporan hanya berupa rangkuman.</p></div>
          ${admin ? h`<button class="btn emas" data-aksi="baru">${ikon('tambah')} Buka survei</button>` : ''}</div>
        ${saya.length ? h`<div class="kartu aksen" style="margin-bottom:16px"><h3>${ikon('tanda')} Survei untuk Anda</h3>${saya.map(s => h`<div class="log-item"><div style="flex:1"><b>${s.judul}</b><div class="kecil">${s.butir} pertanyaan · ±${s.menit} menit</div></div>
          ${s.sudah ? App.pil('selesai', 'Sudah diisi') : h`<a class="btn kecil emas" href="#/isi-survei/${s.id}">Isi sekarang</a>`}</div>`)}</div>` : ''}
        ${D ? h`<div class="tabel-wadah"><table class="t resp"><thead><tr><th>Survei</th><th>Sasaran</th><th>Waktu</th><th>Partisipasi</th><th>Status</th><th></th></tr></thead><tbody>
          ${D.survei.map(s => { const st = statusSv(s), pct = s.target ? Math.min(100, s.responden / s.target * 100) : 0; return h`<tr>
            <td data-l="Survei"><b>${s.judul}</b><div class="kecil">${s.nama_instrumen} · ${s.butir} butir</div></td>
            <td data-l="Sasaran">${s.sasaran === 'guru' ? 'Semua guru/staf' : s.rombel.length ? s.rombel.join(', ') : 'Semua murid'}</td>
            <td data-l="Waktu" class="kecil">${App.tglJam(s.buka)}${s.tutup ? h`<br>s.d. ${App.tglJam(s.tutup)}` : ''}</td>
            <td data-l="Partisipasi" style="min-width:150px"><b>${s.responden}</b> / ${s.target} (${angka(pct, 0)}%)<div class="progres"><div style="width:${pct}%"></div></div></td>
            <td data-l="Status"><span class="pil ${st[0]}">${st[1]}</span></td>
            <td><div class="baris" style="gap:4px;justify-content:flex-end"><a class="btn kecil biru" href="#/survei/${s.id}">${ikon('grafik')} Laporan</a>
              ${admin ? h`<button class="btn kecil garis" data-aksi="ubah" data-id="${s.id}">${ikon('edit')}</button><button class="btn kecil hantu" data-aksi="hapus" data-id="${s.id}">${ikon('hapus')}</button>` : ''}</div></td></tr>`; })}
          ${!D.survei.length ? h`<tr><td colspan="6">${App.kosong('Belum ada survei', admin ? 'Klik "Buka survei" untuk memulai.' : 'Admin belum membuka survei.')}</td></tr>` : ''}</tbody></table></div>
          <div class="kolom2s" style="margin-top:16px"><div class="kartu"><h3>Instrumen tersedia</h3>${grupSv(D).map(g => h`<div class="log-item">${ikon('dokumen')}<div style="flex:1"><b>${g.nama}</b>${g.paket.length > 1 ? h` <span class="pil biru">${g.paket.length} paket paralel</span>` : ''}
              <div class="kecil">${g.butir} butir${g.paket.length > 1 ? ' per paket' : ''} · ±${g.menit} menit · responden ${g.sasaran === 'guru' ? 'guru/staf' : 'murid'}</div>
              ${g.paket.length > 1 ? h`<div class="kecil">${g.paket.map(p => 'Paket ' + p.no + (p.dipakai ? ' (dipakai ' + p.dipakai + '×)' : ' (belum dipakai)')).join(' · ')}</div>` : ''}</div></div>`)}
            <p class="kecil" style="margin-top:8px">Survei Karakter mengukur 8 dimensi profil lulusan (Rapor A.3) dan 7 Kebiasaan Anak Indonesia Hebat (Rapor D.19). Survei Lingkungan Belajar mengukur indikator Rapor yang bersumber dari murid: iklim keamanan (D.4), kualitas pembelajaran (D.1), kompetensi pendidik (C.4), kebinekaan (D.8), inklusivitas (D.10), kesetaraan gender (D.6), kesiapsiagaan bencana dan perubahan iklim (D.18), partisipasi (E.1), serta program dan kebijakan sekolah (E.5), ditambah latar belakang belajar di rumah yang tidak dinilai. Waktu latihan 25 menit (pelaksanaan resmi 20 menit).</p>
            <p class="kecil">Survei murid tersedia dalam 5 paket paralel. Setiap paket lengkap mencakup semua indikator dengan pertanyaan yang berbeda, sehingga hasil antarputaran dapat dibandingkan. Murid mengisi seperti ANBK: satu pertanyaan per layar. Laporan menandai respons yang terlalu cepat, tidak teliti, atau berpola seragam sebagai bahan evaluasi kesungguhan.</p></div>
          ${admin ? h`<div class="kartu"><h3>${ikon('lampu')} Permintaan bantuan (${bantuan.filter(b => b.status === 'baru').length} baru)</h3>
            <p class="kecil">Hanya dari responden yang <b>secara sukarela</b> meminta dihubungi. Teruskan kepada guru BK dan jaga kerahasiaannya.</p>
            ${bantuan.length ? bantuan.slice(0, 30).map(b => h`<div class="log-item"><div style="flex:1"><b>${b.nama}</b> <span class="kecil">· ${b.rombel} · ${App.tglJam(b.waktu)}</span>
              ${b.pesan ? h`<div class="kecil" style="margin-top:2px">"${b.pesan}"</div>` : ''}<div class="kecil">${b.survei}${b.oleh ? ' · ditangani ' + b.oleh : ''}</div></div>
              ${b.status === 'baru' ? h`<button class="btn kecil garis" data-aksi="tangani" data-b="${b.baris}">Tandai ditangani</button>` : App.pil('selesai', 'Ditangani')}</div>`) : h`<p class="kecil">Belum ada permintaan.</p>`}</div>` : ''}</div>` : ''}`);
    };
    gambar();
    App.aksi(el, {
      baru: () => formSurvei(null, D).then(ok => ok && App.render()),
      ubah: b => formSurvei(D.survei.find(s => s.id === b.dataset.id), D).then(ok => ok && App.render()),
      hapus: async b => {
        const s = D.survei.find(x => x.id === b.dataset.id);
        const r = await App.mintaTeks('Hapus survei "' + s.judul + '"', 'Ketik judul survei persis untuk konfirmasi', { kelas: 'bahaya', tombol: 'Hapus permanen', min: 1, placeholder: s.judul,
          pesan: 'Survei beserta ' + s.responden + ' jawaban dan permintaan bantuannya akan dihapus permanen.' });
        if (!r) return;
        try { await api('survei.hapus', { id: s.id, konfirmasi: r.teks }); App.render(); } catch (e) { toast(e.message, 'err'); }
      },
      tangani: b => App.sibuk(b, async () => { await api('survei.bantuanTindak', { baris: Number(b.dataset.b) }); App.render(); })
    });
  };

  async function formSurvei(s, D) {
    const S = await App.ambil('siswa.daftar', { arsip: false }, null, { segar: 120000 });
    const smt = new Date().getMonth() >= 6 ? 'Ganjil' : 'Genap', ta = (App.konfig || {}).tahun_ajaran || '';
    const G = grupSv(D), awal = s ? s.jenis : G[0].saran.kode;
    let ok = false;
    await modal({ judul: s ? 'Ubah survei' : 'Buka survei baru', lebar: true, isi: h`
      <div class="grid2"><div class="fld"><label class="f">Instrumen</label><select class="in" name="jenis" ${s ? 'disabled' : ''}>${G.map(g => g.paket.length > 1
          ? h`<optgroup label="${g.nama}">${g.paket.map(p => h`<option value="${p.kode}" ${awal === p.kode ? 'selected' : ''}>${g.nama} · Paket ${p.no}${p.dipakai ? ' (dipakai ' + p.dipakai + '×)' : ''}${!s && g.saran.kode === p.kode ? ' · disarankan' : ''}</option>`)}</optgroup>`
          : h`<option value="${g.paket[0].kode}" ${awal === g.paket[0].kode ? 'selected' : ''}>${g.nama}</option>`)}</select>
          <p class="kecil" style="margin:4px 0 0">Untuk survei murid, pilih paket yang belum dipakai agar murid tidak mengisi pertanyaan yang sama.</p></div>
        <div class="fld"><label class="f">Judul</label><input class="in" name="judul" value="${s ? s.judul : (D.jenis.find(j => j.kode === awal) || D.jenis[0]).judul + ' · Semester ' + smt + (ta ? ' ' + ta : '')}" maxlength="120"></div>
        <div class="fld"><label class="f">Dibuka mulai</label><input class="in" type="datetime-local" name="buka" value="${App.keInputWaktu(s ? s.buka : Date.now())}"></div>
        <div class="fld"><label class="f">Ditutup (opsional)</label><input class="in" type="datetime-local" name="tutup" value="${s && s.tutup ? App.keInputWaktu(s.tutup) : ''}"></div></div>
      <div class="fld" id="fld-rb"><label class="f">Rombel sasaran (kosongkan = semua murid)</label><div class="baris" style="gap:8px">${S.rombel.map(r => h`<label class="pil garis" style="height:34px;cursor:pointer;font-size:13px">
        <input type="checkbox" name="rb" value="${r.rombel}" ${s && s.rombel.indexOf(r.rombel) >= 0 ? 'checked' : ''} style="margin-right:6px">${r.rombel} (${r.n})</label>`)}</div></div>
      ${s ? h`<label class="cek"><input type="checkbox" name="tutupkan" ${s.status === 'ditutup' ? 'checked' : ''}><span>Tutup survei sekarang (responden tidak dapat mengisi lagi)</span></label>` : ''}
      <p class="kecil" style="margin-top:10px">${ikon('perisai')} Identitas responden disimpan sebagai kode acak. Guru dan admin hanya melihat rangkuman; rangkuman per rombel muncul bila responden minimal 5 orang.</p>`,
      aksi: [{ label: 'Batal', nilai: null }, { label: 'Simpan', kelas: 'emas', nilai: 'ok' }],
      saatBuka: m => {
        const j = $('[name=jenis]', m), jd = $('[name=judul]', m), rb = $('#fld-rb', m);
        const sesuaikan = () => { const x = D.jenis.find(q => q.kode === j.value); rb.style.display = x && x.sasaran === 'guru' ? 'none' : ''; if (!s) jd.value = x.judul + ' · Semester ' + smt + (ta ? ' ' + ta : ''); };
        j.onchange = sesuaikan; sesuaikan();
      },
      sebelumTutup: async (v, m) => {
        if (v !== 'ok') return true;
        const f = App.nilaiForm(m);
        try {
          await api('survei.simpan', { id: s ? s.id : undefined, jenis: s ? s.jenis : f.jenis, judul: f.judul, buka: f.buka ? new Date(f.buka).getTime() : Date.now(),
            tutup: f.tutup ? new Date(f.tutup).getTime() : 0, rombel: $$('[name=rb]:checked', m).map(x => x.value), status: f.tutupkan ? 'ditutup' : 'aktif' });
          ok = true; return true;
        } catch (e) { toast(e.message, 'err'); return false; }
      } });
    return ok;
  }

  // =========================================================== PENGISIAN (murid & guru) — seperti ANBK: satu butir per layar, panel nomor
  const terjawabSv = v => Array.isArray(v) ? v.length > 0 : !!v;
  /** "Bacalah cerita berikut.\n<cerita>\n<pertanyaan>" → petunjuk, kotak cerita, pertanyaan. */
  const teksButirSv = t => {
    const p = String(t).replace(/ \(Pilih semua yang sesuai\.\)$/, '').split('\n');      // petunjuk pilih semua sudah tampil di label
    if (p.length < 3) return h`<p class="sv-tanya">${p.join(' ')}</p>`;
    return h`<p class="sv-petunjuk">${p[0]}</p><div class="sv-cerita">${p.slice(1, -1).map(x => h`<p>${x}</p>`)}</div><p class="sv-tanya">${p[p.length - 1]}</p>`;
  };
  const mmss = d => { d = Math.max(0, Math.round(d / 1000)); return String(Math.floor(d / 60)).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0'); };
  App.hal['isi-survei/:id'] = async function (el, prm) {
    el.innerHTML = String(App.kerangka(2));
    const saya = await api('survei.saya', {}).catch(() => []), S = saya.find(x => x.id === prm.id);
    const bingkai = isi => h`<div class="ujian sv-layar"><header class="uj-atas"><img class="logo" src="./assets/logo-horizontal.webp" alt="" width="120" height="40">
      <div class="judul"><small>Survei</small><b>${S ? S.judul : 'Survei'}</b></div>
      <div class="kanan"><span class="timer sembunyi" id="sv-timer">${ikon('jam')}<span>--:--</span></span><button class="btn emas kecil sembunyi" data-aksi="daftar">${ikon('menu')}<span class="label-panjang">Daftar nomor</span></button>
        <a class="btn kecil garis" href="#/" style="color:#fff;border-color:rgba(255,255,255,.3)">Keluar</a></div></header>
      <div class="sv-tengah" id="sv-isi">${isi}</div><div id="sv-kaki"></div>
      <aside class="laci" id="laci" aria-label="Daftar nomor"><div class="kepala"><div><b>Daftar Nomor</b><small>ketuk nomor untuk berpindah</small></div>
        <button class="ikonbtn" data-aksi="tutupLaci" style="margin-left:auto">${ikon('silang')}</button></div><div class="isi" id="laci-isi"></div></aside></div>`;
    if (!S) { el.innerHTML = String(bingkai(App.kosong('Survei tidak tersedia', 'Survei sudah ditutup atau tidak ditujukan untuk akun Anda.', h`<a class="btn garis" href="#/">Kembali</a>`))); return; }
    if (S.sudah) { el.innerHTML = String(bingkai(terimaKasih(S))); return; }
    const I = await App.ambil('survei.instrumen', { jenis: S.jenis }, null, { segar: 3600000 });
    const N = I.butir.length, kunci = 'sv|' + (Sesi.me || {}).u + '|' + S.id;
    const st = Object.assign({ j: {}, pos: {}, i: -1, mulai: 0 }, (await IDB.get(kunci)) || {});
    if (typeof st.i !== 'number' || st.i >= N + 1) st.i = -1;              // draf versi lama → mulai dari pengantar
    st.pos = st.pos || {};
    // Urutan pilihan diacak tetap per murid (situasi & pilih semua); skala dan pilihan berurutan tidak diacak.
    const rnd = App.acakBenih(App.hashStr((Sesi.me || {}).u + S.id).split('').reduce((a, c) => a + c.charCodeAt(0), 7));
    const urut = {};
    I.butir.forEach(b => {
      const n = (b.o || I.skala[b.s]).length, semua = [...Array(n).keys()];
      if (b.j === 'P') urut[b.id] = App.kocok(semua, rnd);
      else if (b.j === 'M') urut[b.id] = App.kocok(semua.filter(k => k + 1 !== b.x), rnd).concat(b.x ? [b.x - 1] : []);
      else urut[b.id] = semua;
    });
    el.innerHTML = String(bingkai(''));
    const elIsi = $('#sv-isi', el), elKaki = $('#sv-kaki', el), elTimer = $('#sv-timer', el), elLaci = $('#laci', el);
    const simpan = App.tunda(() => IDB.set(kunci, st), 300);
    const nJawab = () => I.butir.filter(b => terjawabSv(st.j[b.id])).length;
    let sudahHabis = false;
    const detak = () => {
      if (!st.mulai || st.i < 0) return;
      const sisa = st.mulai + I.menit * 60000 - Date.now();
      elTimer.querySelector('span').textContent = sisa > 0 ? mmss(sisa) : 'Waktu habis';
      elTimer.className = 'timer ' + (sisa <= 0 ? 'habis' : sisa <= 300000 ? 'kuning' : '');
      if (sisa <= 0 && !sudahHabis) { sudahHabis = true; toast('Waktu yang disarankan sudah habis. Selesaikan jawabanmu, lalu kirim.', 'warn'); }
    };
    App.ulang(detak, 1000);
    const pengantar = () => h`<div class="kartu aksen" style="margin-top:8px">
      <div class="eyebrow" style="color:var(--blue);font-weight:800;font-size:11px;letter-spacing:.1em">PETUNJUK</div><h1 style="margin-top:4px">${S.judul}</h1>
      <p>${I.pengantar}</p>
      <div class="baris" style="margin:12px 0"><span class="pil biru">${N} pertanyaan</span><span class="pil biru">±${I.menit} menit</span></div>
      <ol class="sv-tips">
        <li>Setiap layar berisi satu pertanyaan. Bacalah pertanyaan dan <b>semua pilihannya sampai selesai</b> sebelum menjawab.</li>
        <li>Pilih jawaban yang sesuai dengan <b>keadaanmu yang sebenarnya</b>. Tidak ada jawaban benar atau salah.</li>
        <li>Pada pertanyaan bertanda <b>Pilih semua yang sesuai</b>, kamu boleh memilih lebih dari satu jawaban.</li>
        <li>Gunakan tombol <b>Daftar nomor</b> untuk kembali ke pertanyaan mana pun sebelum mengirim.</li>
        <li>Waktu yang disarankan ${I.menit} menit. Jika waktunya habis, kamu tetap bisa menyelesaikan dan mengirim jawaban.</li></ol>
      <div class="catatan" style="display:flex;gap:10px;background:var(--bg);border-radius:12px;padding:12px">${ikon('perisai')}<span class="kecil">Jawabanmu disimpan tanpa nama dan tersimpan otomatis di perangkat ini sampai kamu mengirimnya. Sekolah hanya melihat rangkuman.</span></div>
      <button class="btn emas besar" data-aksi="mulai" style="margin-top:16px">${nJawab() ? 'Lanjutkan' : 'Mulai'} ${ikon('kanan')}</button></div>`;
    const layarButir = () => {
      const b = I.butir[st.i], v = st.j[b.id], lab = b.o || I.skala[b.s], multi = b.j === 'M';
      return h`<div class="no-soal"><span class="n">${st.i + 1}</span><span class="kecil">dari ${N}</span>${multi ? h`<span class="pil emas">Pilih semua yang sesuai</span>` : ''}</div>
        <div class="kartu sv-butir1">${teksButirSv(b.t)}
          <p class="sv-panduan">${multi ? 'Pilih semua jawaban yang sesuai. Boleh lebih dari satu.' : b.s === 'F' ? 'Ingat kejadian dalam 3 bulan terakhir. Pilih satu jawaban.' : 'Pilih satu jawaban.'}</p>
          <div class="sv-opsi" role="${multi ? 'group' : 'radiogroup'}">${urut[b.id].map(k => { const on = multi ? (v || []).indexOf(k + 1) >= 0 : v === k + 1;
            return h`<button type="button" class="op ${multi ? 'mc' : ''} ${on ? 'pilih' : ''}" data-v="${k + 1}" role="${multi ? 'checkbox' : 'radio'}" aria-checked="${on}">
              ${multi ? h`<span class="kotak-cek">${on ? ikon('centang') : ''}</span>` : h`<span class="hf">${ikon('centang')}</span>`}<span class="isi">${lab[k]}</span></button>`; })}</div></div>`;
    };
    const kaki = () => {
      if (st.i < 0 || st.i >= N) { elKaki.innerHTML = ''; return; }
      const akhir = st.i === N - 1;
      elKaki.innerHTML = String(h`<footer class="uj-bawah"><button class="btn sebelum" data-aksi="sebelum" ${st.i === 0 ? 'disabled' : ''}>${ikon('kiri')}<span class="label-panjang">Sebelumnya</span></button>
        <div class="tengah kecil" id="sv-hitung">${nJawab()}/${N} terjawab</div>
        <button class="btn ${akhir ? 'emas' : 'biru'}" data-aksi="berikut">${akhir ? h`<span>Selesai</span>${ikon('centang')}` : h`<span>Berikutnya</span>${ikon('kanan')}`}</button></footer>`);
    };
    const laci = () => {
      const nj = nJawab();
      $('#laci-isi', el).innerHTML = String(h`<div class="ringkas3" style="grid-template-columns:repeat(2,1fr)"><div style="background:var(--navy);color:#fff">${nj} Terjawab</div><div>${N - nj} Belum</div></div>
        <div class="navno">${I.butir.map((b, k) => h`<button data-no="${k}" class="${terjawabSv(st.j[b.id]) ? 'jawab' : ''} ${k === st.i ? 'kini' : ''}" aria-label="Nomor ${k + 1}">${k + 1}</button>`)}</div>
        <p class="kecil" style="margin-top:14px">Biru = terjawab · Abu = belum dijawab.</p>
        <button class="btn emas penuh" data-aksi="keAkhir" style="margin-top:8px">${ikon('kirim')} Periksa & kirim</button>`);
    };
    const akhir = () => {
      const kosong = I.butir.map((b, k) => terjawabSv(st.j[b.id]) ? -1 : k).filter(k => k >= 0);
      return h`<div class="kartu aksen" style="margin-top:8px"><h2>${kosong.length ? 'Periksa kembali jawabanmu' : 'Semua pertanyaan sudah dijawab'}</h2>
        ${kosong.length ? h`<p style="color:var(--bad)">${ikon('awas')} Masih ada ${kosong.length} pertanyaan yang belum dijawab. Ketuk nomornya untuk menjawab:</p>
          <div class="navno" style="grid-template-columns:repeat(auto-fill,minmax(48px,1fr))">${kosong.map(k => h`<button data-no="${k}">${k + 1}</button>`)}</div>`
          : h`<p>Kamu sudah menjawab ${N} pertanyaan. Terima kasih atas kejujuranmu. Kamu masih bisa memeriksa jawaban sebelum mengirim.</p>`}
        <div class="kartu" style="background:var(--bg);margin-top:16px"><label class="cek"><input type="checkbox" id="mau-bantu" ${st.bantu ? 'checked' : ''}><span><b>Saya ingin dihubungi guru BK atau wali kelas</b> untuk membicarakan sesuatu.</span></label>
          <p class="kecil" style="margin:6px 0 8px 28px">Pilihan ini sukarela. Hanya bila dicentang, namamu dan pesan di bawah dikirim kepada guru BK/admin. Jawaban survei tetap dirahasiakan.</p>
          <textarea class="in" id="pesan-bantu" rows="3" maxlength="500" placeholder="Tulis singkat hal yang ingin dibicarakan (opsional)" style="${st.bantu ? '' : 'display:none'}">${st.pesan || ''}</textarea></div>
        <div class="baris antara" style="margin-top:16px"><button class="btn garis" data-aksi="periksa">${ikon('kiri')} Periksa jawaban</button>
          <button class="btn emas besar" data-aksi="kirim" ${kosong.length ? 'disabled' : ''}>${ikon('kirim')} Kirim survei</button></div></div>`;
    };
    const gambar = () => {
      const isiButir = st.i >= 0 && st.i < N;
      elTimer.classList.toggle('sembunyi', st.i < 0); $('[data-aksi=daftar]', el).classList.toggle('sembunyi', st.i < 0);
      elIsi.innerHTML = String(st.i < 0 ? pengantar() : isiButir ? layarButir() : akhir());
      kaki(); detak(); if (elLaci.classList.contains('buka')) laci();
      if (st.i >= N) {
        const cb = $('#mau-bantu', el), ta = $('#pesan-bantu', el);
        cb.onchange = () => { st.bantu = cb.checked; ta.style.display = cb.checked ? '' : 'none'; simpan(); };
        ta.oninput = () => { st.pesan = ta.value; simpan(); };
      }
      window.scrollTo(0, 0);
    };
    const ke = i => { st.i = Math.max(-1, Math.min(N, i)); simpan(); elLaci.classList.remove('buka'); gambar(); };
    el.addEventListener('click', e => {
      const no = e.target.closest('[data-no]'); if (no) return ke(Number(no.dataset.no));
      const x = e.target.closest('.sv-opsi [data-v]'); if (!x) return;
      const b = I.butir[st.i], k = Number(x.dataset.v);
      if (b.j === 'M') {
        let v = (st.j[b.id] || []).slice(); const ada = v.indexOf(k) >= 0;
        if (ada) v = v.filter(z => z !== k); else if (k === b.x) v = [k]; else v = v.filter(z => z !== b.x).concat([k]);
        st.j[b.id] = v.sort((p, q) => p - q);
      } else { st.j[b.id] = k; if (b.j === 'P') st.pos[b.id] = urut[b.id].indexOf(k - 1) + 1; }
      simpan();
      const v = st.j[b.id];
      $$('.sv-opsi [data-v]', el).forEach(y => { const on = Array.isArray(v) ? v.indexOf(Number(y.dataset.v)) >= 0 : v === Number(y.dataset.v);
        y.classList.toggle('pilih', on); y.setAttribute('aria-checked', on); const kc = $('.kotak-cek', y); if (kc) kc.innerHTML = on ? String(ikon('centang')) : ''; });
      const hit = $('#sv-hitung', el); if (hit) hit.textContent = nJawab() + '/' + N + ' terjawab';
    });
    App.aksi(el, {
      mulai: () => { if (!st.mulai) st.mulai = Date.now(); ke(Math.max(0, Math.min(N - 1, I.butir.findIndex(b => !terjawabSv(st.j[b.id]))))); },
      sebelum: () => ke(st.i - 1),
      berikut: () => ke(st.i + 1),
      daftar: () => { laci(); elLaci.classList.add('buka'); },
      tutupLaci: () => elLaci.classList.remove('buka'),
      keAkhir: () => ke(N),
      periksa: () => ke(0),
      kirim: b => App.sibuk(b, async () => {
        try {
          await api('survei.kirim', { id: S.id, jawaban: st.j, pos: st.pos, durasi: Math.round((Date.now() - (st.mulai || Date.now())) / 1000), bantuan: { mau: !!st.bantu, pesan: st.pesan || '' } }, { pesan: false });
        } catch (e) { if (e.kode !== 'SUDAH') throw e; }
        await IDB.del(kunci); App.Data.basi('survei'); App.henti();
        elTimer.classList.add('sembunyi'); $('[data-aksi=daftar]', el).classList.add('sembunyi'); elKaki.innerHTML = '';
        elIsi.innerHTML = String(terimaKasih(S));
      })
    });
    gambar();
  };
  const terimaKasih = S => h`<div class="kartu aksen" style="max-width:640px;margin:16px auto;text-align:center">
    <div style="width:72px;height:72px;border-radius:50%;background:var(--ok-50);color:var(--ok);display:grid;place-items:center;margin:0 auto 12px">${ikon('centang')}</div>
    <h2>Terima kasih!</h2><p>Jawabanmu untuk <b>${S.judul}</b> sudah tersimpan. Jawaban ini membantu sekolah menjadi tempat belajar yang lebih baik.</p>
    <a class="btn emas" href="#/">${ikon('rumah')} Kembali ke beranda</a></div>`;

  // =========================================================== LAPORAN (admin & guru)
  const ALASAN = { C: ['Terlalu cepat', 'waktu isi lebih singkat daripada waktu minimal untuk membaca'], P: ['Tidak teliti membaca', 'salah menjawab butir pemeriksa ("pilihlah jawaban …")'],
    S: ['Pola seragam', 'jawaban hampir selalu pada posisi atau pilihan yang sama'], T: ['Tidak konsisten', 'sangat setuju pada pernyataan positif sekaligus negatif'] };
  const WARNA_D = ['#DC2626', '#F59E0B', '#60A5FA', '#16A34A'], WARNA_K = ['#1E3A8A', '#2563EB', '#60A5FA', '#93C5FD', '#0EA5E9', '#14B8A6', '#A78BFA', '#94A3B8', '#CBD5E1'];
  const labelSv = (I, b) => b.o ? b.o.map(o => o[0]) : I.skala[b.s];
  const warnaSv = b => {
    if (b.k) return WARNA_K;
    if (b.j === 'P') return b.o.map(o => WARNA_D[o[1] - 1]);
    if (b.j === 'O') return b.o.map((_, i) => WARNA_D[Math.round(i / Math.max(1, b.o.length - 1) * 3)]);
    return b.r ? WARNA_D.slice().reverse() : WARNA_D;
  };
  const TIPE_SV = { P: 'Situasi', O: 'Pilihan', M: 'Pilih semua' };
  /** Sebaran satu butir: bar bertumpuk (pilih satu) atau persentase per pilihan (pilih semua). */
  const sebaranSv = (I, b, x) => {
    const lab = labelSv(I, b), warna = warnaSv(b), n = x.n || 0;
    const kepala = h`<div class="kecil" style="color:var(--ink)">${TIPE_SV[b.j] ? h`<span class="pil ${b.k ? 'biru' : 'emas'}">${b.k ? 'Konteks' : TIPE_SV[b.j]}</span> ` : ''}${String(b.t).split('\n').pop()}${b.r ? ' (B)' : ''}</div>`;
    if (b.j === 'M') return h`<div class="sv-dist">${kepala}${lab.map((l, i) => { const p = n ? x.dist[i] / n * 100 : 0, w = b.o[i][1];
        return h`<div class="baris" style="gap:8px;flex-wrap:nowrap;margin-top:4px"><span class="kecil" style="flex:0 0 48%">${l}${!b.k && w ? (w > 0 ? ' (+)' : ' (−)') : ''}</span>
          <div class="sv-bar" style="height:12px"><span style="width:${p}%;background:${b.k ? '#2563EB' : w > 0 ? '#16A34A' : w < 0 ? '#DC2626' : '#94A3B8'}"></span></div><b class="kecil" style="min-width:40px;text-align:right">${angka(p, 0)}%</b></div>`; })}
      ${b.k ? '' : h`<div class="kecil" style="margin-top:4px">Indeks butir: <b>${angka(x.indeks, 0)}</b> · persentase murid yang memilih setiap pilihan</div>`}</div>`;
    const tot = x.dist.reduce((a, c) => a + c, 0) || 1;
    return h`<div class="sv-dist">${kepala}<div class="baris" style="gap:10px;flex-wrap:nowrap"><div class="sv-bar">${x.dist.map((c, i) => c ? h`<span style="width:${c / tot * 100}%;background:${warna[i]}" title="${lab[i]}: ${c}">${c / tot >= 0.08 ? Math.round(c / tot * 100) + '%' : ''}</span>` : '')}</div>
        <b style="min-width:42px;text-align:right">${b.k ? '' : angka(x.indeks, 0)}</b></div>
      <div class="kecil sv-leg">${lab.map((l, i) => h`<span><i style="background:${warna[i]}"></i>${l}${b.j === 'P' ? ' (bobot ' + b.o[i][1] + ')' : ''}: ${x.dist[i]}</span>`)}</div></div>`;
  };
  App.hal['survei/:id'] = async function (el, prm) {
    el.innerHTML = String(App.kerangka(3));
    let rb = '', semua = false, L, I;
    const muat = async segar => {
      L = await api('survei.laporan', { id: prm.id, rombel: rb, semua, _fresh: !!segar });
      I = I || await App.ambil('survei.instrumen', { jenis: L.survei.jenis }, null, { segar: 3600000 });
    };
    try { await muat(); } catch (e) { el.innerHTML = String(App.galatBox(e)); return; }
    const gambar = () => {
      const H = L.hasil, rek = REKOM[kelSv(L.survei.jenis)] || {}, siswa = I.sasaran === 'siswa', K = L.kesungguhan || { ditandai: 0, alasan: {} };
      const aspN = I.aspek.filter(a => !a.konteks), aspK = I.aspek.filter(a => a.konteks);
      const isiB = I.butir.filter(b => H.butir[b.id]);
      const lemah = aspN.filter(a => H.aspek[a.kode].indeks != null && H.aspek[a.kode].kategori !== 'Baik').sort((a, b) => H.aspek[a.kode].indeks - H.aspek[b.kode].indeks);
      const butirUrut = isiB.filter(b => H.butir[b.id].indeks != null).sort((a, b) => H.butir[a.id].indeks - H.butir[b.id].indeks);
      el.innerHTML = String(h`<div class="judul-hal"><div><a class="kecil" href="#/survei">${ikon('kiri')} Semua survei</a><h1 style="margin-top:4px">${L.survei.judul}</h1>
          <p>${L.survei.nama_instrumen} · ${App.tglJam(L.survei.buka)}${L.survei.tutup ? ' – ' + App.tglJam(L.survei.tutup) : ''} · ${L.survei.terbuka ? 'masih terbuka' : 'ditutup'}</p></div>
          <div class="baris">${siswa ? h`<select class="in" id="pilih-rb" style="width:auto"><option value="">Semua rombel</option>${L.per_rombel.map(r => h`<option value="${r.rombel}" ${rb === r.rombel ? 'selected' : ''} ${r.disembunyikan ? 'disabled' : ''}>${r.rombel}${r.disembunyikan ? ' (< ' + L.min_rombel + ' responden)' : ''}</option>`)}</select>` : ''}
            <button class="btn garis" data-aksi="segar">${ikon('segar')}</button><button class="btn garis" data-aksi="excel">${ikon('unduh')} Excel</button><button class="btn biru" data-aksi="cetak">${ikon('cetak')} Cetak</button></div></div>
        ${!L.n ? App.kosong('Belum ada jawaban', 'Laporan tampil setelah responden mengirim survei.') : h`
        <div class="kpi">
          <div class="kartu"><div class="lbl">Responden${rb ? ' ' + rb : ''}</div><div class="val">${L.n}</div><small>${L.n_dipakai} dipakai dalam indeks</small></div>
          <div class="kartu"><div class="lbl">${kelSv(L.survei.jenis) === 'karakter' ? 'Indeks karakter (8 dimensi)' : 'Indeks keseluruhan'}</div><div class="val">${angka(H.indeks, 1)}</div><small>${pilKat(H.kategori)}</small></div>
          ${I.aspek.filter(a => a.terpisah && !a.konteks).map(a => h`<div class="kartu"><div class="lbl">${a.nama}</div><div class="val">${angka(H.aspek[a.kode].indeks, 1)}</div><small>${pilKat(H.aspek[a.kode].kategori)} ${kodeRapor(a.rapor)}</small></div>`)}
          <div class="kartu"><div class="lbl">Kesungguhan pengisian</div><div class="val" style="color:${K.persen > 20 ? 'var(--bad)' : K.persen > 10 ? 'var(--warn)' : 'var(--ok)'}">${angka(100 - (K.persen || 0), 0)}%</div><small>${K.ditandai} respons ditandai</small></div>
          <div class="kartu"><div class="lbl">Median waktu isi</div><div class="val">${L.durasi_median ? Math.round(L.durasi_median / 60) : '–'}</div><small>menit (saran ${I.menit} menit)</small></div></div>
        <div class="kartu" style="margin-bottom:16px"><h3>${ikon('tanda')} Kesungguhan pengisian</h3>
          <p class="kecil" style="margin:0">Respons yang ditandai ${K.disertakan ? h`<b>disertakan</b>` : h`<b>tidak dihitung</b>`} dalam indeks. Tanda ini membantu sekolah melihat seberapa teliti murid membaca survei, bukan untuk mencari tahu siapa murid tersebut.</p>
          <div class="sv-tanda">${Object.keys(ALASAN).filter(k => k !== 'P' || K.ada_cek).map(k => h`<div title="${ALASAN[k][1]}"><b>${K.alasan[k] || 0}</b>${ALASAN[k][0]}</div>`)}</div>
          <p class="kecil" style="margin:0 0 8px">${Object.keys(ALASAN).filter(k => k !== 'P' || K.ada_cek).map(k => ALASAN[k][0] + ': ' + ALASAN[k][1] + (k === 'C' && K.cepat_detik ? ' (' + Math.round(K.cepat_detik / 60 * 10) / 10 + ' menit)' : '')).join(' · ')}. Satu respons bisa memiliki lebih dari satu tanda.</p>
          <label class="cek"><input type="checkbox" id="ikut-semua" ${semua ? 'checked' : ''}><span>Sertakan respons yang ditandai dalam perhitungan indeks</span></label>
          ${K.persen > 10 ? h`<p class="kecil" style="margin:8px 0 0;color:var(--warn)">${ikon('lampu')} Lebih dari 10% respons ditandai. Sebelum putaran berikutnya, ajak murid membaca petunjuk bersama, ingatkan bahwa tidak ada jawaban benar atau salah, dan beri waktu yang cukup. Bahas cara membaca survei, bukan "jawaban terbaik".</p>` : ''}</div>
        <div class="kolom2"><div class="kartu"><h3>Indeks per ${siswa && kelSv(L.survei.jenis) === 'karakter' ? 'dimensi' : 'aspek'}</h3>
            ${aspN.map(a => { const x = H.aspek[a.kode], subs = Object.keys(I.sub || {}).filter(k => k.indexOf(a.kode + '-') === 0 && H.sub[k]);
              return h`${a.terpisah ? h`<h4 style="margin-top:16px">Dilaporkan terpisah</h4>` : ''}<div class="batang"><div class="lb"><span><b>${a.nama}</b> ${kodeRapor(a.rapor)} ${pilKat(x.kategori)}</span><b>${angka(x.indeks, 1)}</b></div>
              <div class="jalur"><div class="isi ${WARNA_KAT[x.kategori] || 'navy'}" style="width:${x.indeks || 0}%"></div></div><div class="kecil" style="margin-top:2px">${a.ket}</div>
              ${subs.length ? h`<div style="margin:6px 0 4px 14px;border-left:2px solid var(--line);padding-left:10px">${subs.map(k => h`<div class="batang" style="margin-bottom:6px"><div class="lb kecil"><span>${I.sub[k]} ${kodeRapor((I.sub_rapor || {})[k])}${H.sub[k].aman != null ? h` <span class="pil ${H.sub[k].aman >= 100 ? 'hijau' : H.sub[k].aman >= 80 ? 'kuning' : 'merah'}" style="height:20px;font-size:11px" title="Persentase murid yang menjawab Tidak pernah pada semua butir pengalaman">${angka(H.sub[k].aman, 1)}% aman</span>` : ''}</span><b>${angka(H.sub[k].indeks, 1)}</b></div>
                <div class="jalur" style="height:6px"><div class="isi ${WARNA_KAT[H.sub[k].kategori]}" style="width:${H.sub[k].indeks || 0}%"></div></div></div>`)}</div>` : ''}</div>`; })}
            ${Object.keys(H.sub).some(k => H.sub[k].aman != null) ? h`<p class="kecil" style="margin-top:8px">"% aman" = persentase murid yang menjawab <i>Tidak pernah</i> pada semua butir pengalaman di subaspek itu, sebanding dengan cara Rapor menyajikan D.4.4, D.4.6, D.4.8, dan D.4.10 (cara hitung resmi tidak dipublikasikan).</p>` : ''}</div>
          <div><div class="kartu"><h3>${ikon('lampu')} Rekomendasi tindak lanjut</h3>${lemah.length ? h`<ol class="r-rek" style="font-size:14px">${lemah.map(a => h`<li><b>${a.nama}</b> (${angka(H.aspek[a.kode].indeks, 1)}): ${rek[a.kode] || ''}</li>`)}</ol>`
              : h`<p>Semua aspek berada pada kategori Baik. Pertahankan program yang berjalan dan pantau kembali pada semester berikutnya.</p>`}</div>
            <div class="kartu"><h3>Butir dengan indeks terendah</h3>${butirUrut.slice(0, 6).map(b => h`<div class="log-item"><span class="pil ${WARNA_KAT[H.butir[b.id].indeks >= L.ambang.baik ? 'Baik' : H.butir[b.id].indeks >= L.ambang.sedang ? 'Sedang' : 'Kurang']}">${angka(H.butir[b.id].indeks, 0)}</span><div class="kecil" style="color:var(--ink)">${String(b.t).split('\n').pop()}</div></div>`)}</div></div></div>
        ${aspK.length ? h`<div class="kartu" style="margin-top:16px"><h3>${aspK.map(a => a.nama).join(', ')}</h3><p class="kecil">${aspK.map(a => a.ket).join(' ')}</p>
          ${isiB.filter(b => b.k && aspK.some(a => a.kode === b.a)).map(b => sebaranSv(I, b, H.butir[b.id]))}</div>` : ''}
        ${siswa && !rb && L.per_rombel.length ? h`<div class="kartu" style="margin-top:16px"><h3>Per rombel</h3><div class="tabel-wadah"><table class="t resp"><thead><tr><th>Rombel</th><th class="angka">Responden</th><th class="angka" title="Respons yang ditandai kurang sungguh-sungguh">Ditandai</th>${aspN.map(a => h`<th class="angka" title="${a.nama}">${a.kode}</th>`)}<th class="angka">Indeks</th></tr></thead><tbody>
          ${L.per_rombel.map(r => h`<tr><td data-l="Rombel"><b>${r.rombel}</b></td><td data-l="Responden" class="angka">${r.n}/${r.target}</td>${r.disembunyikan ? h`<td colspan="${aspN.length + 2}" class="kecil">Disembunyikan (responden kurang dari ${L.min_rombel})</td>`
            : h`<td data-l="Ditandai" class="angka">${angka(r.persen_ditandai, 0)}%</td>${aspN.map(a => h`<td data-l="${a.nama}" class="angka"><span class="pil ${WARNA_KAT[r.aspek[a.kode].kategori]}">${angka(r.aspek[a.kode].indeks, 0)}</span></td>`)}<td data-l="Indeks" class="angka"><b>${angka(r.indeks, 1)}</b></td>`}</tr>`)}</tbody></table></div>
          <p class="kecil">${aspN.map(a => a.kode + ' = ' + a.nama).join(' · ')}</p></div>` : ''}
        <div class="kartu" style="margin-top:16px"><h3>Sebaran jawaban per butir</h3><p class="kecil">Warna dari merah ke hijau mengikuti arah skor (hijau = paling positif). Butir bertanda (B) diberi skor terbalik. Untuk butir situasi, bobot pilihan terlihat di keterangan; untuk butir pilih semua, (+) pilihan baik dan (−) pilihan kurang baik.</p>
          ${aspN.map(a => h`<h4 style="margin-top:14px">${a.nama}</h4>${isiB.filter(b => b.a === a.kode).map(b => sebaranSv(I, b, H.butir[b.id]))}`)}</div>
        <p class="kecil" style="margin-top:12px">Indeks 0–100 = (rerata skor − 1) ÷ 3 × 100, skor 4 = kondisi paling positif. Kategori: Baik ≥ ${L.ambang.baik}, Sedang ${L.ambang.sedang}–${L.ambang.baik - 0.01}, Kurang &lt; ${L.ambang.sedang} (ketentuan internal sekolah). Survei latihan untuk refleksi; bukan data resmi dan tidak sama dengan angka Rapor Pendidikan.</p>`}`);
      const p = $('#pilih-rb', el); if (p) p.onchange = () => App.sibuk(p, async () => { rb = p.value; await muat(); gambar(); });
      const cs = $('#ikut-semua', el); if (cs) cs.onchange = () => App.sibuk(cs, async () => { semua = cs.checked; await muat(); gambar(); });
    };
    App.aksi(el, {
      segar: b => App.sibuk(b, async () => { await muat(true); gambar(); }),
      cetak: () => App.cetak(lembarCetak(), 'Laporan ' + L.survei.judul),
      excel: () => {
        const H = L.hasil, K = L.kesungguhan || { alasan: {} }, isiB = I.butir.filter(b => H.butir[b.id]);
        const sebarTeks = b => { const x = H.butir[b.id], lab = labelSv(I, b); return lab.map((l, i) => l + ': ' + x.dist[i] + (b.j === 'M' && x.n ? ' (' + Math.round(x.dist[i] / x.n * 100) + '%)' : '')).join(' | '); };
        App.Excel.tulis('Laporan ' + L.survei.judul + (rb ? ' ' + rb : ''), [
          { nama: 'Aspek', lebar: [34, 10, 10, 10, 60], baris: [['Aspek', 'Kode Rapor', 'Indeks', 'Kategori', 'Keterangan']].concat(I.aspek.filter(a => !a.konteks).map(a => [a.nama, a.rapor || '', H.aspek[a.kode].indeks, H.aspek[a.kode].kategori, a.ket])).concat([[], ['Keseluruhan' + (I.aspek.some(a => a.terpisah) ? ' (tanpa aspek terpisah)' : ''), '', H.indeks, H.kategori, 'Responden: ' + L.n + ', dipakai dalam indeks: ' + L.n_dipakai]]) },
          ...(Object.keys(H.sub).length ? [{ nama: 'Subaspek', lebar: [44, 10, 10, 10, 12], baris: [['Subaspek', 'Kode Rapor', 'Indeks', 'Kategori', '% murid aman']].concat(Object.keys(I.sub || {}).filter(k => H.sub[k]).map(k => [I.sub[k], (I.sub_rapor || {})[k] || '', H.sub[k].indeks, H.sub[k].kategori, H.sub[k].aman == null ? '' : H.sub[k].aman])) }] : []),
          { nama: 'Butir', lebar: [8, 26, 12, 70, 70, 10, 8], baris: [['Kode', 'Aspek', 'Bentuk', 'Pertanyaan', 'Sebaran jawaban', 'Indeks', 'Balik']].concat(isiB.map(b => [b.id, (I.aspek.find(a => a.kode === b.a) || {}).nama, b.k ? 'Konteks' : TIPE_SV[b.j] || 'Skala', String(b.t).replace(/\n/g, ' '), sebarTeks(b), H.butir[b.id].indeks, b.r ? 'ya' : ''])) },
          { nama: 'Kesungguhan', lebar: [30, 12, 70], baris: [['Tanda', 'Jumlah respons', 'Keterangan']].concat(Object.keys(ALASAN).map(k => [ALASAN[k][0], K.alasan[k] || 0, ALASAN[k][1]])).concat([[], ['Respons ditandai', K.ditandai, (K.persen || 0) + '% dari ' + L.n + ' responden; ' + (K.disertakan ? 'disertakan' : 'tidak dihitung') + ' dalam indeks']]) },
          ...(L.per_rombel.length ? [{ nama: 'Per rombel', baris: [['Rombel', 'Responden', 'Target', '% ditandai'].concat(I.aspek.filter(a => !a.konteks).map(a => a.nama)).concat(['Indeks'])].concat(L.per_rombel.map(r => [r.rombel, r.n, r.target, r.disembunyikan ? '' : r.persen_ditandai].concat(r.disembunyikan ? I.aspek.filter(a => !a.konteks).map(() => 'disembunyikan') : I.aspek.filter(a => !a.konteks).map(a => r.aspek[a.kode].indeks)).concat([r.indeks == null ? '' : r.indeks]))) }] : [])
        ]);
      }
    });
    const lembarCetak = () => {
      const H = L.hasil, K = L.kesungguhan || { alasan: {} }, rek = REKOM[kelSv(L.survei.jenis)] || {}, aspN = I.aspek.filter(a => !a.konteks), isiB = I.butir.filter(b => H.butir[b.id]);
      const lemah = aspN.filter(a => H.aspek[a.kode].indeks != null && H.aspek[a.kode].kategori !== 'Baik').sort((a, b) => H.aspek[a.kode].indeks - H.aspek[b.kode].indeks);
      const konteks = isiB.filter(b => b.k);
      return h`<div class="lembar">${App.kop('Laporan ' + L.survei.nama_instrumen, L.survei.judul + (rb ? ' · Rombel ' + rb : '') + ' · ' + L.n + ' responden')}
        <div class="r-grid2"><div class="r-nilai"><div class="kecil">${kelSv(L.survei.jenis) === 'karakter' ? 'INDEKS KARAKTER, 8 DIMENSI (0–100)' : 'INDEKS KESELURUHAN (0–100)'}</div><div class="r-skor">${angka(H.indeks, 1)}</div>${pilKat(H.kategori)}</div>
          <div><h3>Ringkasan</h3><p style="font-size:12px">Survei diisi ${L.n} responden${rb ? ' rombel ' + rb : ''} pada periode ${App.tgl(L.survei.buka)}${L.survei.tutup ? ' – ' + App.tgl(L.survei.tutup) : ''}. ${K.ditandai} respons (${angka(K.persen || 0, 1)}%) ditandai kurang sungguh-sungguh dan ${K.disertakan ? 'tetap disertakan' : 'tidak dihitung'} dalam indeks. ${lemah.length ? lemah.length + ' aspek memerlukan perhatian: ' + lemah.map(a => a.nama).join(', ') + '.' : 'Seluruh aspek berada pada kategori Baik.'}</p></div></div>
        <h3>Indeks per aspek</h3>${Grafik.batangH(aspN.map(a => ({ label: a.nama + (a.rapor ? ' (' + a.rapor + ')' : '') + ' · ' + H.aspek[a.kode].kategori, nilai: H.aspek[a.kode].indeks || 0, teks: angka(H.aspek[a.kode].indeks, 1), warna: WARNA_KAT[H.aspek[a.kode].kategori] })))}
        ${Object.keys(H.sub).some(k => H.sub[k].aman != null) ? h`<h3>Persentase murid aman</h3><table class="t"><tbody>${Object.keys(I.sub).filter(k => H.sub[k] && H.sub[k].aman != null).map(k => h`<tr><td>${I.sub[k]} (${(I.sub_rapor || {})[k] || ''})</td><td class="angka"><b>${angka(H.sub[k].aman, 1)}%</b></td></tr>`)}</tbody></table>` : ''}
        ${I.aspek.some(a => a.terpisah && !a.konteks) ? h`<h3>Rincian ${I.aspek.filter(a => a.terpisah && !a.konteks).map(a => a.nama).join(', ')}</h3><table class="t"><tbody>${Object.keys(I.sub).filter(k => H.sub[k] && I.aspek.some(a => a.terpisah && !a.konteks && k.indexOf(a.kode + '-') === 0)).map(k => h`<tr><td>${I.sub[k]} (${(I.sub_rapor || {})[k] || ''})</td><td class="angka">${angka(H.sub[k].indeks, 1)}</td><td>${H.sub[k].kategori}</td></tr>`)}</tbody></table>` : ''}
        <h3>Kesungguhan pengisian</h3><table class="t"><tbody>${Object.keys(ALASAN).filter(k => k !== 'P' || K.ada_cek).map(k => h`<tr><td>${ALASAN[k][0]} <span class="kecil">— ${ALASAN[k][1]}</span></td><td class="angka">${K.alasan[k] || 0}</td></tr>`)}</tbody></table>
        ${!rb && L.per_rombel.some(r => !r.disembunyikan) ? h`<h3>Per rombel</h3><table class="t"><thead><tr><th>Rombel</th><th class="angka">n</th><th class="angka">Ditandai</th>${aspN.map(a => h`<th class="angka">${a.kode}</th>`)}<th class="angka">Indeks</th></tr></thead><tbody>
          ${L.per_rombel.filter(r => !r.disembunyikan).map(r => h`<tr><td>${r.rombel}</td><td class="angka">${r.n}</td><td class="angka">${angka(r.persen_ditandai, 0)}%</td>${aspN.map(a => h`<td class="angka">${angka(r.aspek[a.kode].indeks, 0)}</td>`)}<td class="angka"><b>${angka(r.indeks, 1)}</b></td></tr>`)}</tbody></table>
          <p class="kecil">${aspN.map(a => a.kode + ' = ' + a.nama).join(' · ')}</p>` : ''}
        ${konteks.length ? h`<h3>Latar belakang belajar di rumah (tidak dinilai)</h3><table class="t"><tbody>${konteks.map(b => { const x = H.butir[b.id], lab = labelSv(I, b), tot = b.j === 'M' ? x.n : x.dist.reduce((p, q) => p + q, 0);
            return h`<tr><td style="width:38%">${String(b.t).replace(/ \(Pilih semua yang sesuai\.\)$/, '')}</td><td class="kecil">${lab.map((l, i) => l + ' ' + (tot ? Math.round(x.dist[i] / tot * 100) : 0) + '%').join(' · ')}</td></tr>`; })}</tbody></table>` : ''}
        <h3>Rekomendasi tindak lanjut</h3><ol class="r-rek">${lemah.length ? lemah.map(a => h`<li><b>${a.nama}</b>: ${rek[a.kode] || ''}</li>`) : h`<li>Pertahankan program yang berjalan dan lakukan survei ulang pada semester berikutnya.</li>`}</ol>
        <h3>Butir dengan indeks terendah</h3><table class="t"><tbody>${isiB.filter(b => H.butir[b.id].indeks != null).sort((a, b) => H.butir[a.id].indeks - H.butir[b.id].indeks).slice(0, 8).map(b => h`<tr><td>${b.id}</td><td class="kecil">${String(b.t).split('\n').pop()}</td><td class="angka">${angka(H.butir[b.id].indeks, 0)}</td></tr>`)}</tbody></table>
        <p class="kecil">Indeks = (rerata skor − 1) ÷ 3 × 100; Baik ≥ ${L.ambang.baik}, Sedang ${L.ambang.sedang}–${L.ambang.baik - 0.01}, Kurang &lt; ${L.ambang.sedang} (ketentuan internal sekolah). Jawaban perorangan dirahasiakan. Survei latihan untuk refleksi mutu sekolah; bukan data resmi dan tidak sama dengan angka Rapor Pendidikan.</p>
        ${App.ttd({ jabatan: 'Koordinator survei', nama: (Sesi.me || {}).n })}</div>`;
    };
    gambar();
  };
})();
