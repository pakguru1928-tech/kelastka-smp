/* Soal Matematika berparameter: angka dibangkitkan acak dalam rentang wajar, pengecoh dihitung dari kesalahan umum.
 * Dipakai latihan siswa (langsung) dan generator guru (disimpan ke bank sebagai draf, wajib ditelaah).
 */
(function () {
  'use strict';
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pilih = arr => arr[Math.floor(Math.random() * arr.length)];
  const rp = n => 'Rp' + Math.round(n).toLocaleString('id-ID');
  const ang = (n, d) => Number(n).toLocaleString('id-ID', { maximumFractionDigits: d == null ? 2 : d });
  const NAMA = ['Rani', 'Dimas', 'Sinta', 'Bayu', 'Nisa', 'Fajar', 'Laras', 'Rizki', 'Putri', 'Arif', 'Wulan', 'Yoga'];
  const L = { P: '1 Pengetahuan dan Pemahaman', A: '2 Aplikasi', N: '3 Penalaran' };

  /** Susun PG dari nilai benar + pengecoh; acak urutan; kunci = huruf posisi jawaban benar. */
  function pg(benar, pengecoh, fmt) {
    const set = [benar], f = fmt || (x => String(x));
    pengecoh.forEach(x => { if (set.length < 4 && set.every(y => f(y) !== f(x)) && isFinite(x) && x > 0) set.push(x); });
    let k = 1; while (set.length < 4) { const x = benar + k * (benar > 20 ? Math.ceil(benar / 10) : 1) * (k % 2 ? 1 : -1); k++; if (x > 0 && set.every(y => f(y) !== f(x))) set.push(x); }
    const urut = set.map((v, i) => ({ v, i })).sort(() => Math.random() - 0.5);
    return { opsi: urut.map(o => f(o.v)), kunci: ['ABCD'[urut.findIndex(o => o.i === 0)]] };
  }
  function kat(pernyataan) {                 // [[teks, benar(bool)]]
    return { opsi: pernyataan.map(p => p[0]), kunci: pernyataan.map(p => p[1] ? 'Benar' : 'Salah'), label: ['Benar', 'Salah'] };
  }

  const T = [
    { id: 'diskon', judul: 'Diskon bertingkat', elemen: 'Bilangan', level: L.A, ind: 'Menyelesaikan masalah persentase (diskon bertingkat)', buat() {
      const n = pilih(NAMA), H = r(8, 40) * 10000, a = pilih([10, 20, 25, 30]), b = pilih([5, 10, 15, 20]);
      const benar = H * (1 - a / 100) * (1 - b / 100);
      const x = pg(benar, [H * (1 - (a + b) / 100), H * (1 - a / 100), H * a * b / 10000, H - H * b / 100], rp);
      return Object.assign(x, { tanya: `Sebuah toko memberi diskon ${a}% untuk sepatu seharga ${rp(H)}. Pada hari Sabtu ada tambahan diskon ${b}% dari harga setelah diskon pertama. ${n} membeli sepatu itu pada hari Sabtu.\n\nHarga yang dibayar ${n} adalah ....`,
        pembahasan: `Setelah diskon ${a}%: ${rp(H)} × ${100 - a}% = ${rp(H * (1 - a / 100))}.\nSetelah diskon ${b}%: ${rp(H * (1 - a / 100))} × ${100 - b}% = ${rp(benar)}.\nDiskon bertingkat tidak boleh dijumlahkan menjadi ${a + b}%.` });
    } },
    { id: 'senilai', judul: 'Perbandingan senilai (resep)', elemen: 'Bilangan', level: L.A, ind: 'Menyelesaikan masalah perbandingan senilai', buat() {
      const p = r(4, 8), g = pilih([150, 200, 250, 300]), q = p * r(2, 4) + pilih([0, p / 2 | 0]);
      const benar = g * q / p;
      if (benar % 1) return this.buat();
      const x = pg(benar, [g * p / q, g + (q - p), g * q, benar - g], v => ang(v) + ' gram');
      return Object.assign(x, { tanya: `Untuk membuat kue bagi ${p} orang diperlukan ${g} gram tepung. Ibu ingin membuat kue yang sama untuk ${q} orang.\n\nBanyak tepung yang diperlukan adalah ....`,
        pembahasan: `Perbandingan senilai: tepung = ${g} × ${q} : ${p} = ${ang(benar)} gram.` });
    } },
    { id: 'berbalik', judul: 'Perbandingan berbalik nilai', elemen: 'Bilangan', level: L.A, ind: 'Menyelesaikan masalah perbandingan berbalik nilai', buat() {
      const gcd = (x, y) => y ? gcd(y, x % y) : x;
      let a, b, d, benar, i = 0;
      do { a = pilih([4, 6, 8, 10, 12]); b = pilih([a + 2, a + 4, a * 2, a * 3 / 2]); d = (b / gcd(a, b)) * r(1, 4); benar = a * d / b; i++; }
      while ((d < 4 || d > 40 || benar % 1 || b === a) && i < 60);
      const x = pg(benar, [d * b / a, d - (b - a), d + (b - a), benar + 1], v => ang(v) + ' hari');
      return Object.assign(x, { tanya: `Pembangunan sebuah pos ronda dapat diselesaikan oleh ${a} pekerja dalam ${d} hari. Jika dikerjakan oleh ${b} pekerja dengan kemampuan yang sama, pekerjaan itu selesai dalam ....`,
        pembahasan: `Berbalik nilai: ${a} × ${d} = ${b} × t, sehingga t = ${a * d} : ${b} = ${ang(benar)} hari.` });
    } },
    { id: 'kpk', judul: 'KPK (jadwal bersamaan)', elemen: 'Bilangan', level: L.A, ind: 'Menyelesaikan masalah yang berkaitan dengan KPK', buat() {
      const fpb = (x, y) => y ? fpb(y, x % y) : x, a = pilih([4, 6, 8, 10, 12, 15]), b = pilih([6, 9, 10, 12, 14, 18].filter(x => x !== a)), k = a * b / fpb(a, b);
      const j0 = r(6, 8), mulai = j0 * 60, t = mulai + k, f = m => String(Math.floor(m / 60)).padStart(2, '0') + '.' + String(m % 60).padStart(2, '0');
      const x = pg(t, [mulai + a * b, mulai + fpb(a, b), mulai + a + b, mulai + Math.max(a, b)], f);
      return Object.assign(x, { tanya: `Bus kota jurusan A berangkat dari terminal setiap ${a} menit, sedangkan bus jurusan B setiap ${b} menit. Kedua bus berangkat bersamaan pada pukul ${f(mulai)}.\n\nKedua bus akan berangkat bersamaan lagi pada pukul ....`,
        pembahasan: `KPK dari ${a} dan ${b} adalah ${k}. Jadi, kedua bus berangkat bersamaan lagi ${k} menit setelah pukul ${f(mulai)}, yaitu pukul ${f(t)}.` });
    } },
    { id: 'plsv', judul: 'Persamaan linear satu variabel', elemen: 'Aljabar', level: L.A, ind: 'Menyelesaikan masalah kontekstual dengan persamaan linear satu variabel', buat() {
      const n = pilih(NAMA), p = r(3, 6) * 1000, b = r(2, 5) * 500, k = r(3, 8), total = k * p + b;
      const x = pg(k, [k + 1, k - 1, Math.round(total / p), k + 2], v => v + ' buku');
      return Object.assign(x, { tanya: `${n} membeli beberapa buku tulis seharga ${rp(p)} per buku dan sebuah pulpen seharga ${rp(b)}. Ia membayar ${rp(total)} tanpa kembalian.\n\nBanyak buku tulis yang dibeli ${n} adalah ....`,
        pembahasan: `Misalkan banyak buku = x. Maka ${p}x + ${b} = ${total}, sehingga ${p}x = ${total - b} dan x = ${k}.` });
    } },
    { id: 'pola', judul: 'Pola bilangan (barisan aritmetika)', elemen: 'Aljabar', level: L.A, ind: 'Menentukan suku ke-n pola bilangan dalam konteks', buat() {
      const a = r(10, 20), b = r(2, 4), n = r(8, 15), benar = a + (n - 1) * b;
      const x = pg(benar, [a + n * b, a * n, benar - b, a + (n - 1) * (b + 1)], v => v + ' kursi');
      return Object.assign(x, { tanya: `Di sebuah gedung pertunjukan, baris pertama terdiri atas ${a} kursi, baris kedua ${a + b} kursi, baris ketiga ${a + 2 * b} kursi, dan seterusnya dengan pola yang sama.\n\nBanyak kursi pada baris ke-${n} adalah ....`,
        pembahasan: `Beda tiap baris ${b}. Suku ke-${n} = ${a} + (${n} − 1) × ${b} = ${benar} kursi.` });
    } },
    { id: 'rerata', judul: 'Rata-rata gabungan', elemen: 'Data dan Peluang', level: L.N, ind: 'Menentukan perubahan rata-rata ketika data bertambah', buat() {
      let n, m, x0, i = 0;
      do { n = r(9, 19); m = r(65, 80); x0 = r(85, 100); i++; } while ((n * m + x0) % (n + 1) && i < 80);
      const benar = (n * m + x0) / (n + 1);
      const x = pg(benar, [(m + x0) / 2, m + 1, (n * m + x0) / n, m], v => ang(v));
      return Object.assign(x, { tanya: `Rata-rata nilai ulangan ${n} siswa adalah ${m}. Seorang siswa yang mengikuti ulangan susulan memperoleh nilai ${x0}.\n\nRata-rata nilai ${n + 1} siswa tersebut sekarang adalah ....`,
        pembahasan: `Jumlah nilai awal = ${n} × ${m} = ${n * m}. Jumlah baru = ${n * m} + ${x0} = ${n * m + x0}. Rata-rata baru = ${n * m + x0} : ${n + 1} = ${ang(benar)}.` });
    } },
    { id: 'skala', judul: 'Skala peta', elemen: 'Geometri dan Pengukuran', level: L.A, ind: 'Menentukan jarak sebenarnya dari skala', buat() {
      const s = pilih([50000, 100000, 200000, 250000, 500000]), d = r(3, 12) + pilih([0, 0.5]), benar = d * s / 100000;
      const x = pg(benar, [d * s / 1000, d * s / 10000000, benar * 10, d + s / 100000], v => ang(v) + ' km');
      return Object.assign(x, { tanya: `Pada peta berskala 1 : ${s.toLocaleString('id-ID')}, jarak antara dua desa adalah ${ang(d)} cm.\n\nJarak sebenarnya kedua desa itu adalah ....`,
        pembahasan: `Jarak sebenarnya = ${ang(d)} × ${s.toLocaleString('id-ID')} cm = ${ang(d * s)} cm = ${ang(benar)} km (1 km = 100.000 cm).` });
    } },
    { id: 'pythagoras', judul: 'Teorema Pythagoras', elemen: 'Geometri dan Pengukuran', level: L.A, ind: 'Menggunakan teorema Pythagoras dalam masalah nyata', buat() {
      const tr = pilih([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [12, 16, 20]]);
      const x = pg(tr[1], [tr[2] - tr[0], tr[0] + tr[2], Math.round(Math.sqrt(tr[2] * tr[2] + tr[0] * tr[0])), tr[2]], v => v + ' m');
      return Object.assign(x, { tanya: `Sebuah tangga sepanjang ${tr[2]} m disandarkan pada dinding. Jarak kaki tangga ke dinding ${tr[0]} m.\n\nTinggi ujung atas tangga dari lantai adalah ....`,
        pembahasan: `Tinggi = √(${tr[2]}² − ${tr[0]}²) = √(${tr[2] * tr[2]} − ${tr[0] * tr[0]}) = √${tr[1] * tr[1]} = ${tr[1]} m.` });
    } },
    { id: 'volume', judul: 'Volume balok (liter)', elemen: 'Geometri dan Pengukuran', level: L.A, ind: 'Menghitung volume bangun ruang dan konversi satuan', buat() {
      const p = r(8, 15) * 10, l = r(5, 9) * 10, t = r(5, 10) * 10, v = p * l * t / 1000;
      const x = pg(v, [p * l * t, v / 10, (p + l + t), v * 10], z => ang(z) + ' liter');
      return Object.assign(x, { tanya: `Sebuah bak mandi berbentuk balok berukuran panjang ${p} cm, lebar ${l} cm, dan tinggi ${t} cm.\n\nBak itu dapat menampung air paling banyak ....`,
        pembahasan: `Volume = ${p} × ${l} × ${t} = ${ang(p * l * t)} cm³ = ${ang(v)} liter (1 liter = 1.000 cm³).` });
    } },
    { id: 'kecepatan', judul: 'Jarak, waktu, kecepatan (Benar/Salah)', elemen: 'Aljabar', level: L.N, bentuk: 'PGK-Kategori', ind: 'Menganalisis hubungan jarak, waktu, dan kecepatan', buat() {
      const v = pilih([40, 45, 48, 50, 60]), w = pilih([1.5, 2, 2.5, 3]), s = v * w, n = pilih(NAMA);
      const x = kat([[`Jarak yang ditempuh ${n} adalah ${ang(s)} km.`, true], [`Jika kecepatan dinaikkan menjadi ${v + 10} km/jam, waktu tempuh lebih dari ${ang(w)} jam.`, false],
        [`Dengan kecepatan ${v / 2} km/jam, waktu tempuh menjadi ${ang(w * 2)} jam.`, true]]);
      return Object.assign(x, { tanya: `${n} bersepeda motor dari rumah ke kota kabupaten dengan kecepatan rata-rata ${v} km/jam dan tiba setelah ${ang(w)} jam.\n\nTentukan Benar atau Salah untuk setiap pernyataan berikut!`,
        pembahasan: `Jarak = ${v} × ${ang(w)} = ${ang(s)} km. Kecepatan lebih besar membuat waktu lebih singkat (${ang(s / (v + 10), 2)} jam). Kecepatan ${v / 2} km/jam membutuhkan ${ang(s)} : ${v / 2} = ${ang(w * 2)} jam.` });
    } },
    { id: 'peluang', judul: 'Peluang sederhana (Benar/Salah)', elemen: 'Data dan Peluang', level: L.N, bentuk: 'PGK-Kategori', ind: 'Menentukan peluang kejadian sederhana', buat() {
      const m = r(3, 8), b = r(2, 7), k = r(1, 5), t = m + b + k;
      const fpb = (x, y) => y ? fpb(y, x % y) : x, pec = (a, c) => { const g = fpb(a, c); return (a / g) + '/' + (c / g); };
      const x = kat([[`Peluang terambil kelereng merah adalah ${pec(m, t)}.`, true], [`Peluang terambil kelereng biru sama dengan peluang terambil kelereng kuning.`, b === k],
        [`Peluang terambil kelereng yang bukan kuning adalah ${pec(m + b, t)}.`, true], [`Peluang terambil kelereng hijau adalah ${pec(1, t)}.`, false]]);
      return Object.assign(x, { tanya: `Dalam sebuah kantong terdapat ${m} kelereng merah, ${b} kelereng biru, dan ${k} kelereng kuning. Sebuah kelereng diambil secara acak.\n\nTentukan Benar atau Salah untuk setiap pernyataan berikut!`,
        pembahasan: `Banyak kelereng ${t}. P(merah) = ${m}/${t}, P(biru) = ${b}/${t}, P(kuning) = ${k}/${t}, P(bukan kuning) = ${m + b}/${t}. Tidak ada kelereng hijau sehingga peluangnya 0.` });
    } }
  ];

  App.Parametrik = {
    daftar: T,
    /** buat(idTemplate) → butir siap tampil/simpan (bentuk bank). */
    buat(id) {
      const t = T.find(x => x.id === id) || pilih(T), x = t.buat();
      return { id: 'PAR-' + t.id + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), mapel: 'MAT', bentuk: t.bentuk || 'PG', tanya: x.tanya,
        instr: t.bentuk === 'PGK-Kategori' ? 'Tentukan Benar atau Salah untuk setiap pernyataan berikut!' : 'Pilihlah satu jawaban yang paling tepat!',
        opsi: x.opsi, kunci: x.kunci, label: x.label || [], pembahasan: x.pembahasan, alasan: [], elemen: t.elemen, level: t.level, ind: t.ind, sub: t.judul, template: t.id, stimulus: null };
    },
    acak(n, elemen) { const pool = T.filter(t => !elemen || t.elemen === elemen); return Array.from({ length: n }, () => this.buat(pilih(pool).id)); }
  };
})();
