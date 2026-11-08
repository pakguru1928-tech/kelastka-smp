/* Bank soal guru: daftar & saring, editor dengan pratinjau HP, unggah gambar, telaah (setujui/revisi/tolak), impor Excel master,
 * generator (rakit paket dari bank, soal berparameter MAT, AI Gemini — hasil selalu draf dan wajib ditelaah). */
(function () {
  'use strict';
  const { h, raw, $, $$, ikon, api, toast, modal, angka, Sesi } = App;
  const MAP = App.MAPEL;
  const ELEMEN = { MAT: ['Bilangan', 'Aljabar', 'Geometri dan Pengukuran', 'Data dan Peluang'], BIN: ['Pemahaman Tekstual', 'Pemahaman Inferensial', 'Evaluasi dan Apresiasi'] };
  const LEVEL = ['1 Pengetahuan dan Pemahaman', '2 Aplikasi', '3 Penalaran'];
  const LABEL = [['Benar', 'Salah'], ['Sesuai', 'Tidak sesuai'], ['Fakta', 'Opini'], ['Tepat', 'Tidak tepat']];
  const mapelSaya = () => (Sesi.me || {}).m || '';
  const lv = s => String(s || '').replace(/^\d+\s*/, '');

  // =========================================================== DAFTAR BANK
  App.hal['bank'] = async function (el) {
    const f = Object.assign({ asal: 'guru-semua', status: '', bentuk: '', elemen: '', q: '', mapel: mapelSaya() || 'MAT' }, App.LS.get('saring_bank', {}));
    if (mapelSaya()) f.mapel = mapelSaya();
    el.innerHTML = String(App.kerangka(3));
    const gambar = d => {
      App.LS.set('saring_bank', f);
      const H = d.hitung;
      el.innerHTML = String(h`<div class="judul-hal"><div><div class="eyebrow">Bank soal ${MAP[f.mapel] || ''}</div><h1>Bank soal & telaah</h1>
          <p>Butir buatan guru melewati telaah sejawat sebelum dapat dipakai paket atau latihan siswa. Butir paket resmi dapat dilihat sebagai contoh.</p></div>
          <div class="baris"><button class="btn garis" data-aksi="impor">${ikon('unggah')} Impor Excel</button><a class="btn emas" href="#/bank/baru">${ikon('tambah')} Butir baru</a></div></div>
        <div class="kartu" style="padding:14px">
          <div class="baris" style="margin-bottom:10px">
            ${!mapelSaya() ? h`<div class="seg">${['MAT', 'BIN'].map(m => h`<button data-aksi="set" data-k="mapel" data-v="${m}" class="${f.mapel === m ? 'aktif' : ''}">${MAP[m]}</button>`)}</div>` : ''}
            <div class="seg">${[['guru-semua', 'Buatan guru'], ['resmi', 'Paket resmi (' + H.resmi + ')']].map(x => h`<button data-aksi="set" data-k="asal" data-v="${x[0]}" class="${f.asal === x[0] ? 'aktif' : ''}">${x[1]}</button>`)}</div></div>
          ${f.asal !== 'resmi' ? h`<div class="seg" style="margin-bottom:10px">${[['', 'Semua'], ['draf', 'Draf'], ['ditelaah', 'Menunggu telaah'], ['revisi', 'Revisi'], ['disetujui', 'Disetujui'], ['ditolak', 'Ditolak']]
            .map(x => h`<button data-aksi="set" data-k="status" data-v="${x[0]}" class="${f.status === x[0] ? 'aktif' : ''}">${x[1]}${x[0] ? ' (' + (H[x[0]] || 0) + ')' : ''}</button>`)}</div>` : ''}
          <div class="grid3"><input class="in" id="q" placeholder="Cari indikator, kode, atau isi soal…" value="${f.q}">
            <select class="in" data-k="bentuk"><option value="">Semua bentuk</option>${Object.keys(KTKA.NAMA_BENTUK).map(b => h`<option value="${b}" ${f.bentuk === b ? 'selected' : ''}>${KTKA.NAMA_BENTUK[b]} (${H[b] || 0})</option>`)}</select>
            <select class="in" data-k="elemen"><option value="">Semua elemen</option>${(ELEMEN[f.mapel] || []).map(e => h`<option ${f.elemen === e ? 'selected' : ''}>${e}</option>`)}</select></div></div>
        <div class="tabel-wadah" style="margin-top:12px"><table class="t resp"><thead><tr><th>Butir</th><th>Bentuk</th><th>Elemen · level</th><th>Status</th><th>Pembuat</th><th></th></tr></thead><tbody>
          ${d.butir.map(b => h`<tr><td data-l="Butir" style="max-width:420px"><a href="#/bank/${encodeURIComponent(b.id)}"><b>${b.id}</b></a><div class="kecil">${b.ind || ''}</div><div class="kecil" style="color:var(--ink-3)">${String(b.tanya || '').slice(0, 110)}</div></td>
            <td data-l="Bentuk">${KTKA.SINGKAT_BENTUK[b.b] || b.b}</td><td data-l="Elemen">${b.el}${b.lv ? h`<div class="kecil">${lv(b.lv)}</div>` : ''}</td>
            <td data-l="Status">${b.asal === 'paket' ? App.pil('terkunci', 'Paket resmi') : App.pil(b.status)}${b.asal === 'AI' ? h` <span class="pil garis">AI</span>` : b.asal === 'berparameter' ? h` <span class="pil garis">Param</span>` : ''}</td>
            <td data-l="Pembuat" class="kecil">${b.pembuat || '-'}<div>${App.tgl(b.diubah)}</div></td>
            <td><a class="btn kecil ${b.status === 'ditelaah' ? 'emas' : 'garis'}" href="#/bank/${encodeURIComponent(b.id)}">${b.status === 'ditelaah' ? 'Telaah' : 'Buka'}</a></td></tr>`)}
          ${!d.butir.length ? h`<tr><td colspan="6">${App.kosong('Tidak ada butir', 'Ubah saringan atau buat butir baru.')}</td></tr>` : ''}</tbody></table></div>
        <p class="kecil">Menampilkan ${d.butir.length} dari ${H.semua} butir ${MAP[f.mapel] || ''}.</p>`);
      const q = $('#q', el); q.oninput = App.tunda(() => { f.q = q.value.trim(); muat(); }, 350);
      $$('select[data-k]', el).forEach(s => s.onchange = () => { f[s.dataset.k] = s.value; muat(); });
    };
    const muat = paksa => App.ambil('bank.daftar', { asal: f.asal, status: f.status, bentuk: f.bentuk, elemen: f.elemen, q: f.q, mapel: f.mapel }, gambar, { segar: paksa ? 0 : 15000, langsung: true });
    App.aksi(el, { set: b => { f[b.dataset.k] = b.dataset.v; if (b.dataset.k === 'mapel') f.elemen = ''; muat(); }, impor: () => imporExcel().then(n => n && muat(true)) });
    await muat(false);
  };

  // =========================================================== EDITOR & TELAAH
  App.hal['bank/:id'] = async function (el, prm) {
    await App.modul('ujian');
    el.innerHTML = String(App.kerangka(2));
    const baru = prm.id === 'baru';
    let B;
    if (baru) {
      const dari = App._duplikat; App._duplikat = null;
      B = dari || { id: '', mapel: mapelSaya() || 'MAT', bentuk: 'PG', kunci: [], elemen: '', sub: '', kode: '', indikator: '', level: '', label: [], status: 'draf', asal: 'guru',
        konten: { stimulus: null, tanya: '', instr: '', opsi: ['', '', '', ''], pembahasan: '', alasan: ['', '', '', ''] } };
    } else {
      try { B = await api('bank.ambil', { id: prm.id }); } catch (e) { el.innerHTML = String(App.galatBox(e)); return; }
    }
    const K = B.konten = B.konten || {};
    K.opsi = K.opsi && K.opsi.length ? K.opsi : ['', '', '', '']; K.alasan = K.alasan || [];
    const kunciTerkunci = B.asal === 'paket' || (B.paket && B.status === 'disetujui' && !baru);
    const bolehUbah = !kunciTerkunci && (B.status !== 'disetujui' || App.Sesi.peran === 'admin' || B.pembuat === (Sesi.me || {}).n);
    let pakaiStim = !!(K.stimulus && K.stimulus.isi), fokus = 'tanya';
    const gambar = () => {
      const kat = B.bentuk === 'PGK-Kategori', lab = B.label.length === 2 ? B.label : LABEL[0];
      el.innerHTML = String(h`<div class="judul-hal"><div><a class="kecil" href="#/bank">${ikon('kiri')} Bank soal</a><h1 style="margin-top:4px">${baru ? 'Butir baru' : B.id}</h1>
          <p>${App.pil(B.status)} ${B.asal !== 'guru' ? h`<span class="pil garis">${B.asal === 'paket' ? 'Paket resmi' : B.asal}</span>` : ''} ${B.pembuat ? '· dibuat ' + B.pembuat : ''} ${B.penelaah ? '· ditelaah ' + B.penelaah : ''}</p></div>
          <div class="baris">${!baru ? h`<button class="btn garis" data-aksi="duplikat">${ikon('salin')} Duplikat</button>` : ''}
            ${bolehUbah ? h`<button class="btn garis" data-aksi="simpan">${ikon('centang')} Simpan draf</button><button class="btn emas" data-aksi="ajukan">${ikon('kirim')} Simpan & ajukan telaah</button>` : ''}</div></div>
        ${B.catatan ? h`<div class="kartu" style="border-left:4px solid var(--warn);margin-bottom:16px"><b>Catatan telaah:</b> ${B.catatan}</div>` : ''}
        <div class="kolom2"><form class="kartu" id="ed" onsubmit="return false">
          <fieldset ${bolehUbah ? '' : 'disabled'} style="border:0;padding:0;margin:0">
          <div class="grid3">
            ${!mapelSaya() ? h`<div class="fld"><label class="f">Mapel</label><select class="in" name="mapel">${['MAT', 'BIN'].map(m => h`<option value="${m}" ${B.mapel === m ? 'selected' : ''}>${MAP[m]}</option>`)}</select></div>` : ''}
            <div class="fld"><label class="f">Bentuk</label><select class="in" name="bentuk">${Object.keys(KTKA.NAMA_BENTUK).map(b => h`<option value="${b}" ${B.bentuk === b ? 'selected' : ''}>${KTKA.NAMA_BENTUK[b]}</option>`)}</select></div>
            <div class="fld"><label class="f">Elemen</label><select class="in" name="elemen"><option value="">— pilih —</option>${(ELEMEN[B.mapel] || []).map(e => h`<option ${B.elemen === e ? 'selected' : ''}>${e}</option>`)}</select></div>
            ${B.mapel === 'MAT' ? h`<div class="fld"><label class="f">Level kognitif</label><select class="in" name="level"><option value="">— pilih —</option>${LEVEL.map(l => h`<option value="${l}" ${B.level === l ? 'selected' : ''}>${lv(l)}</option>`)}</select></div>` : ''}
          </div>
          <div class="grid2"><div class="fld"><label class="f">Subelemen / subkompetensi</label><input class="in" name="sub" value="${B.sub}"></div>
            <div class="fld"><label class="f">Kode indikator (opsional)</label><input class="in" name="kode" value="${B.kode}" placeholder="mis. MAT.BIL.11"></div></div>
          <div class="fld"><label class="f">Indikator</label><input class="in" name="indikator" value="${B.indikator}" placeholder="Siswa dapat …"></div>
          <label class="cek" style="margin:6px 0 12px"><input type="checkbox" id="pakai-stim" ${pakaiStim ? 'checked' : ''}><span>Pakai bacaan/stimulus</span></label>
          ${pakaiStim ? h`<div class="kartu" style="background:var(--muted);padding:14px;margin-bottom:12px"><div class="grid2"><div class="fld"><label class="f">Judul bacaan</label><input class="in" name="s_judul" value="${(K.stimulus || {}).judul || ''}"></div>
            <div class="fld"><label class="f">Sumber (wajib bila kutipan)</label><input class="in" name="s_sumber" value="${(K.stimulus || {}).sumber || ''}" placeholder="mis. Teks asli guru"></div></div>
            <div class="fld"><label class="f">Isi bacaan</label><textarea class="in" name="s_isi" rows="8" data-fokus="s_isi">${(K.stimulus || {}).isi || ''}</textarea></div></div>` : ''}
          <div class="fld"><div class="baris antara"><label class="f">Pertanyaan (pokok soal)</label>
            <div class="baris" style="gap:4px"><button type="button" class="btn kecil garis" data-aksi="gambar">${ikon('gambar')} Gambar</button><button type="button" class="btn kecil garis" data-aksi="tabel">Tabel</button><button type="button" class="btn kecil garis" data-aksi="bantuan">${ikon('info')}</button></div></div>
            <textarea class="in" name="tanya" rows="5" data-fokus="tanya">${K.tanya}</textarea></div>
          ${kat ? h`<div class="fld"><label class="f">Label kategori</label><select class="in" name="label">${LABEL.map(p => h`<option value="${p.join('|')}" ${lab.join('|') === p.join('|') ? 'selected' : ''}>${p.join(' / ')}</option>`)}</select></div>
            ${K.opsi.map((o, i) => h`<div class="ed-op"><span class="hf">${i + 1}</span><div><textarea class="in" rows="2" name="op_${i}" data-fokus="op_${i}" placeholder="Pernyataan ${i + 1}">${o}</textarea>
              <input class="in" name="al_${i}" value="${K.alasan[i] || ''}" placeholder="Alasan/pembahasan singkat pernyataan ini" style="margin-top:4px;min-height:36px;font-size:13px"></div>
              <div><select class="in" name="k_${i}" style="min-width:120px">${lab.map(l => h`<option ${B.kunci[i] === l ? 'selected' : ''}>${l}</option>`)}</select>
              ${K.opsi.length > 2 ? h`<button type="button" class="btn kecil hantu" data-aksi="hapusOp" data-i="${i}">${ikon('hapus')}</button>` : ''}</div></div>`)}
            ${K.opsi.length < 5 ? h`<button type="button" class="btn kecil garis" data-aksi="tambahOp">${ikon('tambah')} Pernyataan</button>` : ''}`
          : h`<label class="f">Pilihan jawaban ${B.bentuk === 'PGK-MCMA' ? '(centang 2–3 kunci)' : '(pilih satu kunci)'}</label>
            ${[0, 1, 2, 3].map(i => h`<div class="ed-op"><span class="hf">${'ABCD'[i]}</span><div><textarea class="in" rows="2" name="op_${i}" data-fokus="op_${i}">${K.opsi[i] || ''}</textarea>
              <input class="in" name="al_${i}" value="${K.alasan[i] || ''}" placeholder="Alasan benar/salah pilihan ${'ABCD'[i]}" style="margin-top:4px;min-height:36px;font-size:13px"></div>
              <label class="cek" title="Kunci"><input type="${B.bentuk === 'PG' ? 'radio' : 'checkbox'}" name="kunci" value="${'ABCD'[i]}" ${B.kunci.indexOf('ABCD'[i]) >= 0 ? 'checked' : ''}><span class="kecil">Kunci</span></label></div>`)}`}
          <div class="fld" style="margin-top:12px"><label class="f">Pembahasan</label><textarea class="in" name="pembahasan" rows="5" data-fokus="pembahasan">${K.pembahasan}</textarea></div>
          </fieldset></form>
          <div><div class="kartu" style="position:sticky;top:80px"><div class="kartu-kepala"><h3>Pratinjau HP</h3><span class="kecil">tampilan siswa</span></div>
            <div class="pratinjau-hp" id="prev"></div>
            ${!baru ? h`<div id="cek" style="margin-top:14px"></div>` : ''}
            ${!baru && B.asal !== 'paket' ? panelTelaah() : ''}</div></div></div>`);
      pratinjau(); cekTampil();
      const fm = $('#ed', el);
      fm.addEventListener('input', App.tunda(() => { baca(); pratinjau(); }, 250));
      fm.addEventListener('change', e => { const n = e.target.name; baca(); if (n === 'bentuk' || n === 'mapel' || n === 'label') { if (n === 'bentuk') ubahBentuk(); gambar(); } else pratinjau(); });
      fm.addEventListener('focusin', e => { if (e.target.dataset.fokus) fokus = e.target.dataset.fokus; });
      const ps = $('#pakai-stim', el); if (ps) ps.onchange = () => { baca(); pakaiStim = ps.checked; if (pakaiStim && !K.stimulus) K.stimulus = { judul: '', isi: '', sumber: '' }; gambar(); };
    };
    const panelTelaah = () => h`<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px"><h4>${ikon('tanda')} Telaah</h4>
      ${B.status === 'ditelaah' ? h`<p class="kecil">Periksa kebenaran konsep, kunci, bahasa (PUEBI), kesesuaian indikator, dan keadilan konteks.</p>
        <div class="baris"><button class="btn hijau kecil" data-aksi="telaah" data-v="setujui">${ikon('centang')} Setujui</button><button class="btn garis kecil" data-aksi="telaah" data-v="revisi">Minta revisi</button><button class="btn bahaya kecil" data-aksi="telaah" data-v="tolak">Tolak</button></div>`
      : B.status === 'disetujui' ? h`<p class="kecil">Butir sudah disetujui dan dapat dirakit ke paket atau dipakai latihan siswa.</p>`
      : h`<p class="kecil">Butir belum diajukan. Simpan & ajukan agar guru lain dapat menelaah.</p>`}
      ${App.Sesi.peran === 'admin' || B.pembuat === (Sesi.me || {}).n ? h`<button class="btn hantu kecil" data-aksi="hapus" style="margin-top:8px">${ikon('hapus')} Hapus butir</button>` : ''}</div>`;
    function baca() {
      const f = App.nilaiForm($('#ed', el));
      if (f.mapel) B.mapel = f.mapel;
      ['bentuk', 'elemen', 'sub', 'kode', 'indikator'].forEach(k => { if (f[k] !== undefined) B[k] = f[k]; });
      if (f.level !== undefined) B.level = f.level;
      K.tanya = f.tanya; K.pembahasan = f.pembahasan;
      if (pakaiStim && f.s_isi !== undefined) K.stimulus = Object.assign(K.stimulus || {}, { judul: f.s_judul, isi: f.s_isi, sumber: f.s_sumber });
      const n = B.bentuk === 'PGK-Kategori' ? K.opsi.length : 4;
      if (f.op_0 !== undefined) { K.opsi = Array.from({ length: n }, (_, i) => f['op_' + i] || ''); K.alasan = Array.from({ length: n }, (_, i) => f['al_' + i] || ''); }
      if (B.bentuk === 'PGK-Kategori') { if (f.label) B.label = f.label.split('|'); if (!B.label.length) B.label = LABEL[0].slice(); if (f.k_0 !== undefined) B.kunci = Array.from({ length: n }, (_, i) => f['k_' + i] || B.label[0]); }
      else B.kunci = $$('[name=kunci]:checked', el).map(x => x.value).sort();
    }
    function ubahBentuk() {
      if (B.bentuk === 'PGK-Kategori') { if (!B.label.length) B.label = LABEL[0].slice(); K.opsi = K.opsi.slice(0, 5); if (K.opsi.length < 3) K.opsi = K.opsi.concat(['', '', '']).slice(0, 3); B.kunci = K.opsi.map(() => B.label[0]); }
      else { K.opsi = K.opsi.concat(['', '', '', '']).slice(0, 4); B.kunci = []; B.label = []; }
    }
    function pratinjau() {
      const b = { id: 'P', bentuk: B.bentuk, tanya: K.tanya, instr: K.instr, opsi: K.opsi, lab: B.bentuk === 'PGK-Kategori' ? (B.label.length ? B.label : LABEL[0]) : [] };
      const p = $('#prev', el); if (!p) return;
      p.innerHTML = String(h`${pakaiStim && K.stimulus && K.stimulus.isi ? h`<div style="border-bottom:1px dashed var(--line);margin-bottom:10px">${App.Soal.htmlStimulus(K.stimulus, {})}</div>` : ''}
        ${App.Soal.htmlButir(b, {}, { jawab: null, kunci: B.kunci, alasan: K.alasan, tampilKunci: true })}
        ${K.pembahasan ? h`<div class="bahas"><h5>Pembahasan</h5><div class="teks" style="font-size:14px">${raw(KTKA.render(K.pembahasan, {}))}</div></div>` : ''}`);
    }
    App._renderUlang = pratinjau;
    function cekTampil() {
      const c = $('#cek', el); if (!c || !B.cek) return;
      c.innerHTML = String(h`<h4>${ikon('perisai')} Validasi otomatis</h4>${B.cek.map(x => h`<div class="kecil" style="display:flex;gap:6px;align-items:center;color:${x.ok ? 'var(--ok-ink)' : x.berat === 'galat' ? 'var(--bad)' : 'var(--warn-ink)'}">${ikon(x.ok ? 'centang' : 'awas')}${x.pesan}</div>`)}`);
    }
    async function simpan(ajukan) {
      baca();
      if (!String(K.tanya).trim()) return toast('Pertanyaan masih kosong.', 'err');
      if (!B.elemen) return toast('Pilih elemen.', 'err');
      const r = await api('bank.simpan', { id: baru ? undefined : B.id, mapel: B.mapel, bentuk: B.bentuk, kunci: B.kunci, elemen: B.elemen, sub: B.sub, kode: B.kode, indikator: B.indikator,
        level: B.level, label: B.bentuk === 'PGK-Kategori' ? B.label : [], ajukan, asal: B.asal, konten: { stimulus: pakaiStim ? K.stimulus : null, tanya: K.tanya, instr: K.instr || '', opsi: K.opsi, pembahasan: K.pembahasan, alasan: K.alasan, param: K.param || null } });
      App.Data.basi('bank');
      if (baru) App.ke('bank/' + encodeURIComponent(r.ids[0]), true); else { B = await api('bank.ambil', { id: B.id }); Object.assign(K, B.konten); B.konten = K; gambar(); }
    }
    App.aksi(el, {
      simpan: b => App.sibuk(b, () => simpan(false)),
      ajukan: b => App.sibuk(b, () => simpan(true)),
      tambahOp: () => { baca(); K.opsi.push(''); K.alasan.push(''); B.kunci.push(B.label[0] || 'Benar'); gambar(); },
      hapusOp: b => { baca(); const i = +b.dataset.i; K.opsi.splice(i, 1); K.alasan.splice(i, 1); B.kunci.splice(i, 1); gambar(); },
      duplikat: () => { baca(); App._duplikat = JSON.parse(JSON.stringify(Object.assign({}, B, { id: '', status: 'draf', asal: 'guru', catatan: '', penelaah: '', paket: '', konten: Object.assign({}, K, { stimulus: K.stimulus ? Object.assign({}, K.stimulus, { id: undefined }) : null }) }))); App.ke('bank/baru'); },
      tabel: () => sisip('\n\n| Kolom 1 | Kolom 2 |\n|---|---|\n| isi | isi |\n\n'),
      bantuan: () => modal({ judul: 'Format penulisan', isi: h`<ul class="langkah"><li><code>**tebal**</code> dan <code>*miring*</code></li><li>Paragraf baru: baris kosong</li>
        <li>Rumus: <code>$\\frac{3}{4} \\times 120$</code> (format LaTeX/KaTeX)</li><li>Tabel: tombol <b>Tabel</b> lalu ubah isinya</li><li>Gambar: tombol <b>Gambar</b> (otomatis diperkecil, disimpan di Drive sekolah)</li></ul>` }),
      gambar: async () => {
        const f = await App.pilihBerkas('image/*'); if (!f) return;
        try { const d = await kecilkan(f, 1000); const r = await api('bank.gambar', { data: d, mime: 'image/jpeg', nama: f.name }); sisip('\n\n[[gambar:' + r.url + ']]\n\n'); toast('Gambar diunggah.', 'ok'); }
        catch (e) { toast(e.message, 'err'); }
      },
      telaah: async b => {
        const v = b.dataset.v;
        let catatan = '';
        if (v !== 'setujui') { const r = await App.mintaTeks(v === 'revisi' ? 'Minta revisi' : 'Tolak butir', 'Catatan untuk penulis', { min: 3 }); if (!r) return; catatan = r.teks; }
        App.sibuk(b, async () => { await api('bank.telaah', { id: B.id, keputusan: v, catatan }); App.Data.basi('bank'); B = await api('bank.ambil', { id: B.id }); Object.assign(K, B.konten); B.konten = K; gambar(); });
      },
      hapus: async () => { if (await App.konfirmasi('Hapus butir?', B.id + ' akan dihapus permanen.', 'Hapus', 'bahaya')) { await api('bank.hapus', { id: B.id }).catch(e => toast(e.message, 'err')); App.Data.basi('bank'); App.ke('bank'); } }
    });
    function sisip(t) {
      const ta = $('[data-fokus="' + fokus + '"]', el) || $('[name=tanya]', el); if (!ta) return;
      const a = ta.selectionStart || ta.value.length; ta.value = ta.value.slice(0, a) + t + ta.value.slice(ta.selectionEnd || a); ta.focus(); ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    gambar();
  };
  /** Perkecil gambar di peramban sebelum diunggah (hemat kuota & data siswa). */
  function kecilkan(file, maks) {
    return new Promise((res, rej) => {
      const img = new Image(); img.onload = () => {
        const s = Math.min(1, maks / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src); res(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => rej(new Error('Berkas bukan gambar yang valid.')); img.src = URL.createObjectURL(file);
    });
  }

  // =========================================================== IMPOR EXCEL MASTER
  async function imporExcel() {
    const f = await App.pilihBerkas('.xlsx,.csv'); if (!f) return 0;
    let wb; try { wb = await App.Excel.baca(f); } catch (e) { toast(e.message, 'err'); return 0; }
    const lembar = n => { const k = Object.keys(wb).find(x => x.toUpperCase() === n); return k ? App.Excel.objek(wb[k]) : []; };
    const m = mapelSaya();
    const butir = lembar('BUTIR').filter(b => b.pertanyaan && !/-CTH-/.test(String(b.id_butir || '')) && (!m || !b.mapel || b.mapel === m));
    const stim = lembar('STIMULUS').filter(s => s.isi);
    if (!butir.length) { toast('Lembar BUTIR tidak ditemukan atau kosong. Gunakan format master KelasTKA+ (lembar BUTIR dan STIMULUS).', 'err'); return 0; }
    const ok = await modal({ judul: 'Impor bank soal', isi: h`<p>${butir.length} butir dan ${stim.length} bacaan siap diimpor sebagai <b>draf</b>${butir.length > 200 ? ' (maksimal 200 per impor; sisanya diabaikan)' : ''}.</p>
      <div class="tabel-wadah" style="max-height:260px;overflow:auto"><table class="t"><thead><tr><th>ID</th><th>Bentuk</th><th>Kunci</th><th>Pertanyaan</th></tr></thead><tbody>
      ${butir.slice(0, 50).map(b => h`<tr><td class="kecil">${b.id_butir}</td><td>${b.bentuk}</td><td>${b.kunci}</td><td class="kecil">${String(b.pertanyaan).slice(0, 80)}</td></tr>`)}</tbody></table></div>`,
      aksi: [{ label: 'Batal', nilai: false }, { label: 'Impor sebagai draf', kelas: 'emas', nilai: true }] });
    if (!ok) return 0;
    const r = await api('bank.impor', { butir: butir.slice(0, 200).map(b => Object.assign({}, b, { mapel: m || b.mapel })), stimulus: stim }, { batas: 120000 }).catch(e => { toast(e.message, 'err'); return null; });
    App.Data.basi('bank');
    return r ? r.n : 0;
  }

  // =========================================================== GENERATOR
  App.hal['generator'] = async function (el) {
    let tab = App.LS.get('tab_gen', 'rakit');
    const mapel = mapelSaya() || App.LS.get('gen_mapel', 'MAT');
    const st = { mapel, pilih: new Set(), nama: '', durasi: Number((App.konfig || {}).durasi_bawaan || 75) };
    const kepala = () => h`<div class="judul-hal"><div><div class="eyebrow">Generator</div><h1>Generator soal & paket</h1>
        <p>Rakit paket try out/latihan dari bank yang sudah disetujui, bangkitkan soal Matematika berparameter, atau minta AI menyusun draf. Semua soal baru berstatus <b>draf</b> dan wajib ditelaah.</p></div></div>
      <div class="seg" style="margin-bottom:16px">${[['rakit', 'Rakit paket'], ['param', 'Soal berparameter (MAT)'], ['ai', 'Draf dengan AI']].map(t => h`<button data-aksi="tab" data-v="${t[0]}" class="${tab === t[0] ? 'aktif' : ''}">${t[1]}</button>`)}</div>
      ${!mapelSaya() ? h`<div class="seg" style="margin:0 0 16px 8px">${['MAT', 'BIN'].map(m => h`<button data-aksi="mapel" data-v="${m}" class="${st.mapel === m ? 'aktif' : ''}">${MAP[m]}</button>`)}</div>` : ''}`;
    const gambar = async () => {
      el.innerHTML = String(h`${kepala()}${App.kerangka(2)}`);
      if (tab === 'rakit') return rakit();
      if (tab === 'param') return param();
      return ai();
    };
    // ---- rakit paket dari butir disetujui
    async function rakit() {
      const d = await App.ambil('bank.daftar', { asal: 'guru-semua', status: 'disetujui', mapel: st.mapel }, null, { segar: 15000, langsung: true });
      const list = d.butir;
      const isi = () => {
        const dipilih = list.filter(b => st.pilih.has(b.id)), per = {};
        dipilih.forEach(b => { per[b.el] = (per[b.el] || 0) + 1; });
        el.innerHTML = String(h`${kepala()}<div class="kolom2"><div class="kartu"><div class="kartu-kepala"><h3>Butir disetujui (${list.length})</h3>
            <div class="baris"><select class="in" id="acak-n" style="width:auto">${[10, 20, 30].map(n => h`<option>${n}</option>`)}</select><button class="btn kecil garis" data-aksi="acak">${ikon('segar')} Pilih acak seimbang</button>
            <button class="btn kecil hantu" data-aksi="kosongkan">Kosongkan</button></div></div>
          ${list.length ? h`<div style="max-height:60vh;overflow:auto">${list.map(b => h`<label class="cek" style="padding:8px;border-bottom:1px solid var(--line)"><input type="checkbox" data-b="${b.id}" ${st.pilih.has(b.id) ? 'checked' : ''}>
            <span><b>${b.id}</b> · ${KTKA.SINGKAT_BENTUK[b.b]} · ${b.el}${b.lv ? ' · ' + lv(b.lv) : ''}<br><span class="kecil">${b.ind || String(b.tanya).slice(0, 100)}</span>${b.paket ? h` <span class="pil garis">di paket ${b.paket}</span>` : ''}</span></label>`)}</div>`
            : App.kosong('Belum ada butir disetujui', 'Buat butir di Bank Soal lalu ajukan ke telaah.', h`<a class="btn garis" href="#/bank/baru">Butir baru</a>`)}</div>
          <div class="kartu aksen"><h3>Paket baru</h3><p class="kecil">${dipilih.length} butir dipilih${Object.keys(per).length ? ': ' + Object.keys(per).map(k => k + ' ' + per[k]).join(', ') : ''}.</p>
            <div class="fld"><label class="f">Nama paket</label><input class="in" id="pk-nama" value="${st.nama}" placeholder="mis. TO Sekolah ${MAP[st.mapel]} 1"></div>
            <div class="grid2"><div class="fld"><label class="f">Jenis</label><select class="in" id="pk-jenis"><option value="TO">Try out</option><option value="latihan">Latihan</option></select></div>
              <div class="fld"><label class="f">Durasi (menit)</label><input class="in" id="pk-durasi" type="number" value="${st.durasi}"></div></div>
            <button class="btn emas penuh" data-aksi="buatPaket" ${dipilih.length ? '' : 'disabled'}>${ikon('tumpuk')} Simpan & bekukan paket</button>
            <p class="kecil" style="margin-top:8px">Urutan soal mengikuti urutan pilih; bacaan yang sama dikelompokkan otomatis saat ujian.</p></div></div>`);
        $$('[data-b]', el).forEach(c => c.onchange = () => { c.checked ? st.pilih.add(c.dataset.b) : st.pilih.delete(c.dataset.b); st.nama = $('#pk-nama', el).value; isi(); });
      };
      App.aksi(el, Object.assign(aksiUmum(), {
        acak: () => {
          const n = Number($('#acak-n', el).value), el2 = ELEMEN[st.mapel], kel = {};
          list.forEach(b => { (kel[b.el] = kel[b.el] || []).push(b); });
          st.pilih = new Set(); let i = 0;
          Object.keys(kel).forEach(k => { kel[k] = App.kocok(kel[k], Math.random); });
          while (st.pilih.size < Math.min(n, list.length) && i < 999) { const k = el2[i % el2.length]; const arr = kel[k] || []; if (arr.length) st.pilih.add(arr.shift().id); i++; if (i > el2.length * 60) break; }
          isi();
        },
        kosongkan: () => { st.pilih = new Set(); isi(); },
        buatPaket: b => App.sibuk(b, async () => {
          const nama = $('#pk-nama', el).value.trim(); if (!nama) throw new Error('Isi nama paket.');
          const r = await api('paket.buatGuru', { mapel: st.mapel, nama, jenis: $('#pk-jenis', el).value, durasi: Number($('#pk-durasi', el).value), butir: Array.from(st.pilih) });
          await App.modul('guru'); await App.bekukanPaket({ id: r.id }); st.pilih = new Set(); App.ke('paket');
        })
      }));
      isi();
    }
    // ---- soal berparameter
    async function param() {
      await App.modul('parametrik'); await App.modul('ujian');
      if (st.mapel !== 'MAT') { el.innerHTML = String(h`${kepala()}${App.kosong('Khusus Matematika', 'Soal berparameter tersedia untuk Matematika. Untuk Bahasa Indonesia gunakan bank soal atau draf AI.')}`); App.aksi(el, aksiUmum()); return; }
      let hasil = [];
      const isi = () => {
        el.innerHTML = String(h`${kepala()}<div class="kolom2"><div class="kartu"><h3>Template</h3>
          <div class="tabel-wadah"><table class="t"><thead><tr><th></th><th>Template</th><th>Elemen</th><th>Bentuk</th></tr></thead><tbody>
            ${App.Parametrik.daftar.map(t => h`<tr><td><input type="checkbox" data-t="${t.id}" checked></td><td><b>${t.judul}</b><div class="kecil">${t.ind}</div></td><td>${t.elemen}</td><td>${KTKA.SINGKAT_BENTUK[t.bentuk || 'PG']}</td></tr>`)}</tbody></table></div>
          <div class="baris" style="margin-top:12px"><label class="f" style="margin:0">Variasi per template</label><select class="in" id="var" style="width:auto">${[1, 2, 3].map(n => h`<option>${n}</option>`)}</select>
            <button class="btn emas" data-aksi="bangkit">${ikon('kilau')} Bangkitkan</button></div>
          <p class="kecil">Siswa juga dapat berlatih langsung dengan template ini dari menu Latihan tanpa disimpan ke bank.</p></div>
          <div class="kartu"><div class="kartu-kepala"><h3>Hasil (${hasil.length})</h3>${hasil.length ? h`<button class="btn biru kecil" data-aksi="simpanParam">${ikon('basis')} Simpan semua ke bank (draf)</button>` : ''}</div>
            <div style="max-height:70vh;overflow:auto">${hasil.map((b, i) => h`<div class="bahas-butir"><div class="no-soal"><span class="n">${i + 1}</span><span class="pil garis">${b.sub}</span><button class="btn kecil hantu" data-aksi="buang" data-i="${i}">${ikon('hapus')}</button></div>
              ${App.Soal.htmlButir({ id: b.id, bentuk: b.bentuk, tanya: b.tanya, instr: b.instr, opsi: b.opsi, lab: b.label }, {}, { kunci: b.kunci, tampilKunci: true })}
              <div class="bahas"><h5>Pembahasan</h5>${raw(KTKA.render(b.pembahasan, {}))}</div></div>`)}</div></div></div>`);
      };
      App.aksi(el, Object.assign(aksiUmum(), {
        bangkit: () => { const n = Number($('#var', el).value); hasil = []; $$('[data-t]:checked', el).forEach(c => { for (let i = 0; i < n; i++) hasil.push(App.Parametrik.buat(c.dataset.t)); }); isi(); },
        buang: b => { hasil.splice(+b.dataset.i, 1); isi(); },
        simpanParam: b => App.sibuk(b, async () => {
          for (let i = 0; i < hasil.length; i += 40) await api('bank.simpan', { items: hasil.slice(i, i + 40).map(x => ({ mapel: 'MAT', bentuk: x.bentuk, kunci: x.kunci, elemen: x.elemen, sub: x.sub, indikator: x.ind, level: x.level, label: x.label, asal: 'berparameter',
            konten: { stimulus: null, tanya: x.tanya, instr: x.instr, opsi: x.opsi, pembahasan: x.pembahasan, alasan: [], param: { template: x.template } } })) }, { pesan: false });
          toast(hasil.length + ' butir tersimpan sebagai draf. Telaah di Bank Soal.', 'ok'); hasil = []; App.Data.basi('bank'); isi();
        })
      }));
      isi();
    }
    // ---- AI
    async function ai() {
      let s; try { s = await api('ai.status', {}); } catch (e) { s = { aktif: false }; }
      el.innerHTML = String(h`${kepala()}<div class="kolom2"><form class="kartu aksen" id="f-ai" onsubmit="return false">
        ${!s.aktif ? h`<div class="kartu" style="border-left:4px solid var(--warn);margin-bottom:12px">${ikon('info')} Kunci API Gemini belum diisi. Admin dapat mengisinya di <b>Pengaturan → Kunci API Gemini</b> (tingkat gratis cukup untuk guru).</div>` : h`<p class="kecil">Model: ${s.model}. Maksimal 5 butir per permintaan, 20 permintaan per jam per guru.</p>`}
        <div class="grid3"><div class="fld"><label class="f">Bentuk</label><select class="in" name="bentuk">${Object.keys(KTKA.NAMA_BENTUK).map(b => h`<option value="${b}">${KTKA.NAMA_BENTUK[b]}</option>`)}</select></div>
          <div class="fld"><label class="f">Jumlah</label><select class="in" name="jumlah">${[1, 2, 3, 4, 5].map(n => h`<option ${n === 3 ? 'selected' : ''}>${n}</option>`)}</select></div>
          <div class="fld"><label class="f">Elemen</label><select class="in" name="elemen">${ELEMEN[st.mapel].map(e => h`<option>${e}</option>`)}</select></div></div>
        ${st.mapel === 'MAT' ? h`<div class="fld"><label class="f">Level kognitif</label><select class="in" name="level">${LEVEL.map(l => h`<option value="${l}">${lv(l)}</option>`)}</select></div>` : ''}
        <div class="fld"><label class="f">Subelemen / materi</label><input class="in" name="sub" placeholder="${st.mapel === 'MAT' ? 'mis. Perbandingan senilai' : 'mis. Teks eksplanasi'}"></div>
        <div class="fld"><label class="f">Indikator</label><input class="in" name="indikator" placeholder="Siswa dapat …"></div>
        <div class="fld"><label class="f">Konteks (opsional)</label><input class="in" name="konteks" placeholder="mis. kegiatan pasar tradisional di Sumatera Barat"></div>
        <button class="btn emas" data-aksi="aiBuat" ${s.aktif ? '' : 'disabled'}>${ikon('kilau')} Buat draf</button>
        <p class="kecil" style="margin-top:10px">Hasil AI dapat keliru (fakta, angka, kunci). Telaah dengan teliti sebelum disetujui. Jangan memasukkan data pribadi siswa.</p></form>
        <div class="kartu" id="ai-hasil"><h3>Hasil</h3><p class="kecil">Draf tersimpan otomatis di Bank Soal (status draf, asal AI).</p></div></div>`);
      App.aksi(el, Object.assign(aksiUmum(), {
        aiBuat: b => App.sibuk(b, async () => {
          const f = App.nilaiForm($('#f-ai', el));
          const r = await api('ai.buat', Object.assign({ mapel: st.mapel }, f, { jumlah: Number(f.jumlah) }), { batas: 120000 });
          App.Data.basi('bank');
          $('#ai-hasil', el).innerHTML = String(h`<h3>Hasil</h3><p>${r.ids.length} draf tersimpan:</p>${r.ids.map(id => h`<a class="log-item" href="#/bank/${encodeURIComponent(id)}">${ikon('dokumen')} ${id} — buka & telaah</a>`)}`);
        })
      }));
    }
    function aksiUmum() {
      return { tab: b => { tab = b.dataset.v; App.LS.set('tab_gen', tab); gambar(); }, mapel: b => { st.mapel = b.dataset.v; App.LS.set('gen_mapel', st.mapel); st.pilih = new Set(); gambar(); } };
    }
    App.aksi(el, aksiUmum());
    gambar();
  };
})();
