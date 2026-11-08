# Panduan Instalasi KelasTKA+ SMP

Aplikasi latihan dan try out TKA (Bahasa Indonesia dan Matematika) untuk satu sekolah. Versi aplikasi 1.0.0.

Aplikasi terdiri atas dua bagian yang dipasang terpisah:

| Bagian | Tempat | Berkas |
|---|---|---|
| **Server (backend)** | Google Apps Script + Google Sheets + Google Drive di akun Google sekolah | 12 berkas `.gs` + `appsscript.json` (diberikan satu per satu) |
| **Tampilan (frontend)** | GitHub Pages (gratis, https) | Isi ZIP `KelasTKA-SMP-frontend.zip` (ada `index.html` di bagian paling atas) |

Siswa, guru, dan pengawas membuka alamat GitHub Pages. Tampilan itu mengirim data ke server Apps Script. Data tersimpan di spreadsheet milik akun sekolah.

> **Penting tentang rahasia.** Berkas `98_DataPaketResmi.gs` berisi kunci brankas paket soal dan kunci jawaban. Berkas ini **hanya** ditempel ke editor Apps Script. **Jangan** diunggah ke GitHub, grup WhatsApp, atau Drive bersama. ZIP frontend sudah dipastikan tidak memuat berkas `.gs` maupun kunci.

---

## Tahap 0 — Siapkan akun Google

Gunakan **satu akun Gmail khusus sekolah** (misalnya `kelastka.smpn3batipuh@gmail.com`) sebagai pemilik server.

Alasannya:

- Akun belajar.id/Google Workspace sekolah sering dibatasi admin domain. Pembatasan itu bisa menolak pengaturan **"Who has access: Anyone"** dan berbagi gambar "siapa saja yang memiliki link". Tanpa dua pengaturan itu, siswa tidak bisa masuk.
- Semua data (spreadsheet, cadangan, gambar soal guru) berada di satu tempat yang jelas pemiliknya.

Simpan sandi akun ini di tempat aman. Jangan menambahkan orang lain sebagai editor proyek Apps Script: editor dapat melihat semua rahasia server.

Kuota akun Gmail biasa (konsumen) menurut dokumentasi resmi Google:

- total waktu jalan *trigger* 90 menit per hari;
- 30 eksekusi bersamaan per pengguna.

Aplikasi dirancang hemat agar 400 siswa muat dalam batas itu (lihat Tahap 7).

---

## Tahap 1 — Pasang server di Apps Script

1. Masuk ke akun Google sekolah, buka <https://script.google.com>, lalu klik **Proyek baru**. Beri nama `KelasTKA+ SMP`.
2. Klik ikon **roda gigi (Setelan Proyek)**, centang **Tampilkan file manifes "appsscript.json" di editor**, lalu kembali ke **Editor**.
3. Buka `appsscript.json`, hapus seluruh isinya, lalu tempel isi berkas `appsscript.json` yang diberikan. Simpan.
4. Hapus berkas `Kode.gs` bawaan. Buat berkas skrip baru (tombol **+** → **Skrip**) **sesuai urutan dan nama berikut**. Tulis namanya tanpa `.gs`; editor menambahkannya sendiri. Tempel isi masing-masing berkas.

   ```
   00_Config      01_Util        02_Auth        03_Router
   04_Setup       10_Admin       20_PaketSesi   40_Ujian
   50_Skor        60_Laporan     70_Bank        98_DataPaketResmi
   ```

5. Klik **Simpan** (ikon disket). Pastikan tidak ada tanda galat merah.
6. Di bilah atas, pilih fungsi **`setupAppEnvironment`**, lalu klik **Jalankan**.
   - Pertama kali, Google meminta izin. Pilih akun sekolah → **Lanjutan** → **Buka KelasTKA+ SMP (tidak aman)** → **Izinkan**. Peringatan ini muncul karena skrip buatan sendiri belum diverifikasi Google. Ini wajar.
   - Tunggu sampai **Log eksekusi** menampilkan `✅ Paket resmi: 10 paket, 300 butir`.
7. **Catat akun admin pertama** yang tampil di log:

   ```
   🔐 AKUN ADMIN PERTAMA (catat sekarang — hanya tampil sekali, ganti setelah masuk):
      Username   : admin
      Kata sandi : ••••••••••••
   ```

   Jika terlewat, jalankan fungsi `resetSandiAdmin` untuk membuat sandi baru.

Fungsi setup ini aman dijalankan ulang. Ia tidak menggandakan data, tidak mengganti rahasia, dan hanya menambah kolom yang belum ada.

Setup sudah otomatis membuat:

- folder Drive **KelasTKA+ SMP** berisi subfolder `aset_soal`, `paket_guru`, dan `cadangan`;
- spreadsheet **DB_KelasTKA — KelasTKA+ SMP** berisi 15 sheet;
- dua *trigger*:
  - `jobTiapMenit` memproses jawaban dan nilai;
  - `jobHarian` membuat cadangan otomatis pukul 01.00.

### Deploy sebagai Web App

1. Klik **Terapkan (Deploy)** → **Deployment baru**.
2. Klik ikon roda gigi di samping "Pilih jenis", lalu pilih **Aplikasi web**.
3. Isi pengaturannya:
   - **Deskripsi**: `KelasTKA+ v1.0.0`
   - **Jalankan sebagai**: **Saya** (akun sekolah)
   - **Siapa yang memiliki akses**: **Siapa saja**
4. Klik **Terapkan**, lalu salin **URL aplikasi web** yang berakhiran **`/exec`**.
5. Uji di peramban dengan membuka `URL/exec?a=konfig`. Hasil yang benar berupa teks JSON yang memuat `"ok":true` dan nama sekolah.

---

## Tahap 2 — Pasang tampilan di GitHub Pages

Tahap ini memakai terminal (PowerShell atau Git Bash). **Jangan memakai "Upload files" di situs GitHub**, karena cara itu merusak struktur folder `css/` dan `js/`.

1. Ekstrak `KelasTKA-SMP-frontend.zip`. Hasilnya folder **`KelasTKA-SMP-frontend`**. **Folder inilah folder kerja Anda.** Isinya harus langsung terlihat `index.html`, `manifest.json`, `sw.js`, serta folder `css`, `js`, `assets`, dan `paket`.
2. Buka `js\config.js` dengan Notepad. Ganti `GANTI_DENGAN_ID_DEPLOYMENT` sehingga `GAS_URL` berisi URL `/exec` dari Tahap 1. Simpan.

   ```js
   window.KTKA_CONFIG = {
     GAS_URL: 'https://script.google.com/macros/s/AKfycb…/exec'
   };
   ```

3. Di github.com, buat repository baru, misalnya `kelastka-smp`, dengan pengaturan **Public** dan **tanpa** README.
4. Buka PowerShell **di folder `KelasTKA-SMP-frontend`**: buka folder itu di File Explorer, klik address bar, ketik `powershell`, lalu tekan Enter. Ketik `dir` dan pastikan `index.html` muncul di daftar. Jika yang muncul justru sebuah folder, masuk dulu ke folder itu.
5. Jalankan perintah berikut **satu per satu**. Ganti `USERNAME` dengan nama akun GitHub Anda.

   ```bash
   git init
   git add .
   git commit -m "KelasTKA+ SMP v1.0.0"
   git branch -M main
   git remote add origin https://github.com/USERNAME/kelastka-smp.git
   git push -u origin main
   ```

   Saat diminta *password*, tempel **Personal Access Token** (bukan sandi GitHub). Layar memang tidak menampilkan apa pun saat token ditempel; itu normal.

6. Aktifkan GitHub Pages: di repository, buka **Settings → Pages**, lalu atur:
   - **Source**: *Deploy from a branch*
   - **Branch**: `main` dan `/ (root)`
   - **Save**, lalu centang **Enforce HTTPS**.
7. Tunggu 1–2 menit. Alamat aplikasi menjadi `https://USERNAME.github.io/kelastka-smp/`.

> HTTPS **wajib**. Pembuka brankas paket (WebCrypto) dan fitur pasang di HP hanya bekerja di https.

---

## Tahap 3 — Pengaturan awal di aplikasi

1. Buka alamat GitHub Pages, pilih tab **Guru / Pengawas**, lalu masuk sebagai `admin` dengan sandi dari log.
2. Buka **Akun saya** dan ganti sandi.
3. Buka **Pengaturan** dan isi:
   - identitas sekolah untuk kop laporan: nama, alamat, kepala sekolah, kota, tahun ajaran;
   - **URL situs GitHub Pages**, yang akan dicetak di kartu login;
   - nilai KKM serta ambang Baik dan Memadai sesuai kebijakan sekolah.

   Lalu klik **Simpan pengaturan**.
4. Buka **Akun Staf** dan buat akun untuk:
   - guru Bahasa Indonesia (peran *Guru*, mapel BIN);
   - guru Matematika (peran *Guru*, mapel MAT);
   - para pengawas ruang.

   Sandi awal tampil **sekali**. Serahkan langsung kepada pemilik akun.
5. Buka **Data Siswa → Templat Excel**. Isi kolom `nama`, `kelas`, dan `rombel` (misalnya `IX.A`), lalu klik **Impor Excel**.
   - Aplikasi memindai dulu dan menampilkan jumlah siswa baru serta yang sudah ada.
   - Klik **Impor** untuk menyimpan.
   - Username dibuat otomatis, misalnya `ixa-001`. NISN tidak diperlukan.
6. Klik **Cetak kartu login** per rombel. Satu A4 memuat 10 kartu. Gunting, lalu bagikan.
   - Jika kartu hilang, cetak ulang saja; tokennya tetap sama.
   - Jika token bocor, pilih siswa itu lalu klik **Ganti token**, kemudian cetak kartu baru.
7. Buka **Sistem & Cadangan** dan pastikan **Pekerja latar: Aktif**.
8. (Opsional) Isi **Kunci API Gemini** di halaman Pengaturan agar guru dapat memakai generator soal AI.
   - Kunci dibuat di Google AI Studio dengan akun sekolah.
   - Kunci disimpan di server (Script Properties) dan tidak pernah dikirim ke peramban.
   - Nama model bawaan dapat diganti di Pengaturan bila Google mengubah nama model.

---

## Tahap 4 — Pasang di HP siswa dan guru

- **Android (Chrome)**: buka alamat aplikasi, ketuk menu **⋮**, lalu pilih **Instal aplikasi** atau **Tambahkan ke layar utama**. Bisa juga lewat tombol **Pasang aplikasi di HP** di halaman masuk.
- **iPhone (Safari)**: buka alamat aplikasi, ketuk **Bagikan**, lalu pilih **Tambahkan ke Layar Utama**.
- **Komputer lab**: cukup buka alamatnya di Chrome atau Edge. Saat mulai mengerjakan, aplikasi meminta mode layar penuh.

---

## Tahap 5 — Alur try out

### Langkah per peran

| Peran | Langkah |
|---|---|
| **Guru mapel** | Buka **Kegiatan & Sesi → Kegiatan baru**. Pilih paket dan aturan penskoran (*parsial* disarankan). Tambahkan **sesi utama** per rombel/ruang: waktu mulai, durasi, acak soal/opsi, dan (opsional) username pengawas. |
| **Hari H — pengawas** | Masuk dan buka **Pantau Sesi**. Pilih sesi, lalu tampilkan **token sesi** (tombol *Tampilkan* untuk proyektor). |
| **Hari H — siswa** | Masuk dengan kartu login. Di Beranda, masukkan token sesi, lalu klik **Masuk ruang ujian**. Paket soal sudah diunduh sebelumnya, jadi waktu tidak terbuang untuk mengunduh. |
| **Selama ujian** | Jawaban tersimpan di perangkat dan dikirim ke server tiap ±2,5 menit dengan jeda acak. Jika sinyal putus, siswa tetap bisa mengerjakan. |
| **Pindah layar** | Setelah batas tercapai (bawaan: 3 kali, masing-masing lebih dari 5 detik), **layar dikunci, bukan dikumpulkan**. Pengawas memeriksa siswa, lalu menekan **Buka**. Setiap tindakan pengawas wajib diberi alasan dan tercatat di log. |
| **Bantuan teknis** | Pengawas dapat:<ul><li>menambah waktu;</li><li>mereset login untuk pindah perangkat (siswa lalu masuk lagi dengan token sesi);</li><li>mengumpulkan jawaban siswa.</li></ul> |
| **Selesai** | Siswa menekan **Selesai**, mencentang pernyataan kejujuran, lalu menerima **kode resi**. Bila waktu habis, jawaban dikumpulkan otomatis. |
| **Siswa tidak hadir** | Guru membuat **sesi susulan**. Tombol *Pilih yang belum mengerjakan* mengisi daftar pesertanya otomatis. |
| **Penutupan** | Setelah semua sesi, termasuk susulan, selesai, guru menekan **Tutup & buka pembahasan**. Nilai dan pembahasan rinci kemudian terbuka untuk siswa. |
| **Laporan** | Menu **Laporan** berisi:<ul><li>ringkasan kelas, peringkat (hanya untuk guru), dan analisis butir (kesukaran p, daya beda d, sebaran jawaban);</li><li>cetak rekap kelas A4;</li><li>cetak laporan rinci per siswa satu rombel (untuk siswa dan orang tua, tanpa peringkat);</li><li>unduh Excel.</li></ul> |

### Aturan penskoran

Tiap butir bernilai maksimal 1 poin.

| Bentuk soal | Mode *parsial* (disarankan) | Mode *semua benar* |
|---|---|---|
| Pilihan ganda (PG) | 1 bila benar, 0 bila salah | Sama |
| Pilihan ganda kompleks (PGK) | (kunci yang dipilih − pilihan salah yang dipilih) ÷ jumlah kunci, minimal 0 | Poin hanya bila seluruh jawaban tepat |
| Kategori | Pernyataan yang tepat ÷ jumlah pernyataan | Poin hanya bila seluruh jawaban tepat |

Nilai akhir = jumlah poin ÷ jumlah butir × 100, dibulatkan dua desimal.

Predikat:

- **Istimewa**: nilai ≥ 95;
- **Baik**, **Memadai**, dan **Kurang**: mengikuti ambang di Pengaturan (bawaan 70 dan 50).

### Bank soal, generator, dan latihan

- Guru membuat butir di **Bank Soal** (dengan pratinjau tampilan HP) atau **mengimpor Excel master** (lembar `BUTIR` dan `STIMULUS`).
- Butir diajukan ke **telaah**. Guru lain menyetujui, meminta revisi, atau menolak. Hanya butir yang **disetujui** yang dapat dirakit menjadi paket atau dipakai latihan.
- **Generator** menyediakan tiga cara:
  - rakit paket acak seimbang dari butir yang disetujui;
  - soal Matematika berparameter (12 templat);
  - draf soal dengan AI.

  Semua soal baru berstatus **draf** dan wajib ditelaah.
- **Latihan mandiri** siswa memakai tiga sumber:
  - paket yang kegiatannya sudah ditutup;
  - paket yang dibuka guru untuk latihan;
  - bank soal yang sudah disetujui, plus soal berparameter.

  Latihan **ditutup otomatis** saat ada try out berlangsung.

---

## Tahap 6 — Uji coba bertahap (sangat disarankan)

Aplikasi ini sudah diuji di simulator Apps Script dan peramban: 22 uji server dan 21 langkah uji peramban lulus. Namun, ini adalah **pemasangan pertama di Apps Script asli**. Lakukan uji coba bertahap sebelum try out penuh:

1. **Uji staf (15 menit).** Admin, satu guru, dan satu pengawas mencoba setiap menu. Buat satu kegiatan percobaan dengan sesi 10 menit untuk rombel uji berisi 3–5 akun siswa.
2. **Uji satu kelas (±30 siswa, 20 menit).**
   - Siswa mengerjakan dengan HP masing-masing.
   - Uji juga kasus khusus: matikan data seluler sebentar, pindah aplikasi 3 kali (layar harus terkunci, lalu dibuka pengawas), dan ganti perangkat (reset login).
   - Akhiri sesi, tutup kegiatan, lalu periksa nilai, pembahasan, dan cetak laporan.
3. **Uji tiga sampai lima kelas sekaligus.** Pantau menu **Sistem**: *Antrean nilai* harus kembali 0 dalam 1–2 menit setelah sesi berakhir.
4. **Try out penuh (±400 siswa).** Mulailah sesi bertahap per ruang dengan selisih 2–5 menit agar lonjakan masuk tidak bersamaan.

Laporkan setiap kendala beserta tangkapan layar dan isi menu Sistem → Jejak audit.

---

## Tahap 7 — Kinerja, kuota, dan keamanan

### Jalur siswa dibuat ringan

- Simpan otomatis tidak menulis ke spreadsheet. Data ditahan di *cache* server, lalu ditulis bertahap oleh `jobTiapMenit`.
- Pengumpulan memakai satu baris tambahan yang atomik.
- Paket soal diunduh sekali ke perangkat dalam bentuk terenkripsi, lalu dibuka saat siswa memasukkan token sesi.
- Pembahasan baru bisa dibuka setelah kegiatan ditutup.

### Kuota

`jobTiapMenit` membaca spreadsheet hanya bila ada pengumpulan baru, dengan pemeriksaan cadangan tiap 15 menit. Di luar jam try out, eksekusinya sangat singkat. Jika kuota trigger harian (90 menit untuk Gmail) hampir habis, buka **Sistem** dan proses jawaban secara manual. Jangan menghapus trigger.

### Rahasia

Semua rahasia hanya disimpan di Script Properties dan tidak pernah dikirim ke peramban:

- kunci sesi;
- *hash* sandi staf;
- kunci API Gemini;
- kunci kartu login.

Berkas `config.js` hanya berisi URL `/exec`, yang memang bukan rahasia.

### Fungsi darurat

Jalankan dari editor Apps Script bila diperlukan:

| Fungsi | Kegunaan |
|---|---|
| `resetSandiAdmin` | Membuat sandi admin baru (tampil di log). |
| `rotasiSecretSesi` | Mengeluarkan semua pengguna dari semua perangkat. |
| `cekPerforma` | Menampilkan versi, trigger, jumlah siswa, sesi aktif, dan ukuran Script Properties. |

### Cadangan

Salinan spreadsheet dibuat otomatis setiap hari; 14 salinan terakhir disimpan di folder `cadangan`. Admin juga dapat membuat cadangan manual dari menu Sistem.

---

## Memperbarui aplikasi di kemudian hari

1. **Server.** Tempel kode baru ke berkas yang sama, lalu simpan dan jalankan `setupAppEnvironment` sekali (aman diulang). Kemudian buka **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan**.

   Jangan membuat *Deployment baru*, karena URL `/exec` akan berubah.

2. **Tampilan.** Salin berkas baru ke folder kerja, lalu jalankan:

   ```bash
   git add .
   git commit -m "Pembaruan"
   git push
   ```

   Setelah 1–2 menit, tekan **Ctrl+Shift+R**. Aplikasi yang terpasang di HP akan menampilkan pemberitahuan "Versi baru siap" dan diperbarui saat dibuka ulang.

Jangan memperbarui saat try out sedang berlangsung.

---

## Kendala umum

| Gejala | Penyebab dan solusi |
|---|---|
| "Konfigurasi belum lengkap" | `GAS_URL` di `js/config.js` belum diisi atau salah. Isi dengan URL `/exec`, lalu lakukan *push* ulang. |
| Situs GitHub Pages 404 | `git init` dijalankan di folder yang salah. Pastikan `index.html` ada di tingkat teratas repository (lihat Tahap 2). |
| "Tidak dapat terhubung ke server" | Akses Web App belum **Siapa saja**, URL salah, atau deployment belum diperbarui. |
| Login siswa: "Username atau token salah" | Periksa kartu. Huruf O dan angka 0 tidak dipakai di token. Setelah 5 kali salah, akun terkunci 15 menit; pengawas dapat membukanya dari menu pantau. |
| "Akun dipakai di perangkat lain" | Pengawas memilih siswa → **Reset login**. Siswa lalu masuk di perangkat baru dengan token sesi. |
| Paket gagal dibuka | Peramban terlalu lama, atau situs dibuka tanpa https. Gunakan Chrome/Safari terbaru melalui alamat https. |
| Nilai belum muncul | Tunggu 1–2 menit atau buka **Kegiatan → Proses jawaban**. Pembahasan untuk siswa terbuka setelah kegiatan ditutup. |
| Gambar soal guru tidak tampil | Gambar disimpan di Drive akun sekolah dengan akses "siapa saja yang memiliki link". Akun Workspace yang membatasi berbagi tautan dapat menghalanginya; gunakan akun Gmail (Tahap 0). |
| Generator AI tidak aktif | Kunci API Gemini belum diisi admin di Pengaturan. |
