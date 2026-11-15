# Panduan Lengkap KelasTKA+ SMP v1.4.2

Aplikasi latihan dan try out TKA SMP untuk Matematika dan Bahasa Indonesia, dilengkapi survei karakter dan lingkungan belajar. Satu pemasangan dipakai oleh **satu sekolah**.

Pengembang: Iwa Salji Elbi Satria, guru UPT SMPN 3 Batipuh.

---

## Daftar isi

1. [Mengenal aplikasi](#1-mengenal-aplikasi)
2. [Isi paket dan aturan kerahasiaan](#2-isi-paket-dan-aturan-kerahasiaan)
3. [Pilih jalur pemasangan](#3-pilih-jalur-pemasangan)
4. [Tahap 0 — Siapkan akun](#4-tahap-0--siapkan-akun)
5. [Tahap 1 — Pasang server di Apps Script](#5-tahap-1--pasang-server-di-apps-script)
6. [Tahap 2 — Pasang tampilan di GitHub Pages](#6-tahap-2--pasang-tampilan-di-github-pages)
7. [Tahap 3 — Pengaturan awal di aplikasi](#7-tahap-3--pengaturan-awal-di-aplikasi)
8. [Tahap 4 — Pasang di HP](#8-tahap-4--pasang-di-hp)
9. [Tahap 5 — Menjalankan try out](#9-tahap-5--menjalankan-try-out)
10. [Bank soal, generator, dan latihan](#10-bank-soal-generator-dan-latihan)
11. [Survei karakter dan lingkungan belajar](#11-survei-karakter-dan-lingkungan-belajar)
12. [Uji coba bertahap](#12-uji-coba-bertahap)
13. [Kinerja, kuota, keamanan, dan cadangan](#13-kinerja-kuota-keamanan-dan-cadangan)
14. [Memperbarui dari versi lama](#14-memperbarui-dari-versi-lama)
15. [Kendala umum](#15-kendala-umum)

---

## 1. Mengenal aplikasi

### Fitur utama

- **Try out TKA berbasis HP atau komputer.**
  - 20 paket resmi: Try Out 1–10 Matematika dan Try Out 1–10 Bahasa Indonesia, masing-masing 30 butir, total 600 butir.
  - Bentuk soal: pilihan ganda, pilihan ganda kompleks, dan kategori (benar/salah).
  - Token sesi, pengawasan, dan penguncian layar bila siswa berpindah aplikasi.
- **Penilaian otomatis**, pembahasan, laporan kelas, analisis butir, cetak A4, dan Excel.
- **Bank soal dan telaah**, generator soal berparameter, generator AI (opsional), serta latihan mandiri siswa.
- **Survei karakter dan lingkungan belajar** untuk latihan murid kelas IX dan refleksi mutu sekolah, selaras dengan indikator Rapor Pendidikan.

### Cara kerja

| Bagian | Tempat | Isi |
|---|---|---|
| **Server** | Google Apps Script + Google Sheets + Google Drive milik akun sekolah | Data siswa, nilai, survei, dan semua rahasia |
| **Tampilan** | GitHub Pages (gratis, alamat https) | Halaman yang dibuka siswa, guru, dan pengawas |

Siswa membuka alamat GitHub Pages. Tampilan mengirim data ke server Apps Script, lalu server menyimpannya di spreadsheet milik akun sekolah. Tidak ada data siswa yang disimpan di GitHub.

### Yang perlu disiapkan

- Satu akun Gmail khusus sekolah (lihat Tahap 0).
- Satu akun GitHub (gratis).
- Laptop atau komputer Windows/Mac dengan Chrome dan koneksi internet.
- Waktu ±1–2 jam untuk pemasangan pertama.

---

## 2. Isi paket dan aturan kerahasiaan

Setelah ZIP diekstrak, isinya seperti ini:

```
KelasTKA-SMP-v1.4.2/
├── 00-BACA-DULU-Panduan-Lengkap.pdf      ← panduan ini
├── PANDUAN-LENGKAP.md                    ← panduan yang sama (teks)
├── 1-SERVER-AppsScript/                  ← 13 berkas: ditempel ke editor Apps Script
├── 2-RAHASIA-JANGAN-DIUNGGAH/            ← 98_DataPaketResmi.gs (kunci paket dan kunci jawaban)
├── 3-TAMPILAN-GitHubPages/
│   ├── KelasTKA-SMP-tampilan-v1.4.2.zip  ← diekstrak menjadi folder repository GitHub
│   └── config.js                         ← hanya untuk pemasangan baru
└── 4-LAMPIRAN/                           ← kisi-kisi survei (Excel) dan contoh tampilan HP
```

> **Aturan kerahasiaan.** Berkas `98_DataPaketResmi.gs` berisi kunci pembuka paket soal dan kunci jawaban. Berkas ini **hanya** ditempel ke editor Apps Script. **Jangan** diunggah ke GitHub, grup WhatsApp, Drive bersama, atau diberikan kepada siswa. Jika berkas ini bocor, kunci jawaban try out dapat diketahui siswa.
>
> ZIP tampilan (folder 3) sudah dipastikan **tidak** memuat berkas `.gs` maupun kunci. Paket soal di dalamnya terenkripsi dan hanya bisa dibuka saat sesi try out berjalan.

---

## 3. Pilih jalur pemasangan

| Keadaan sekolah | Ikuti |
|---|---|
| Belum pernah memasang KelasTKA+ | **Jalur A — Pemasangan baru**: Tahap 0 sampai Tahap 5 |
| Sudah memasang versi lama (1.0.0 sampai 1.3.0) | **Jalur B — Pembaruan**: bagian [14](#14-memperbarui-dari-versi-lama) |

---

## 4. Tahap 0 — Siapkan akun

### Akun Google

Gunakan **satu akun Gmail khusus sekolah** sebagai pemilik server, misalnya `kelastka.namasekolah@gmail.com`.

Alasannya:

- Akun belajar.id atau Google Workspace sekolah sering dibatasi admin domain. Pembatasan itu bisa menolak pengaturan **"Siapa saja"** pada Web App dan berbagi gambar lewat tautan. Tanpa dua pengaturan itu, siswa tidak bisa masuk.
- Semua data (spreadsheet, cadangan, gambar soal) berada di satu tempat yang jelas pemiliknya, dan tidak hilang ketika operator pindah tugas.

Simpan sandi akun ini di tempat aman. **Jangan** menambahkan orang lain sebagai editor proyek Apps Script, karena editor dapat melihat semua rahasia server.

### Akun GitHub

Daftar di <https://github.com>. Nama pengguna akan menjadi bagian alamat aplikasi, misalnya `https://namasekolah.github.io/kelastka-smp/`, jadi pilih nama yang mudah dikenali.

### Git di komputer

- **Windows:** unduh dari <https://git-scm.com/download/win>, lalu pasang dengan pengaturan bawaan.
- **Mac:** buka Terminal, ketik `git --version`; jika belum ada, macOS menawarkan pemasangan.

Lalu, sekali saja, atur identitas Git di PowerShell atau Terminal:

```bash
git config --global user.name "Nama Operator"
git config --global user.email "email@akun-github.com"
```

---

## 5. Tahap 1 — Pasang server di Apps Script

### Menempel berkas

1. Masuk ke akun Google sekolah, buka <https://script.google.com>, lalu klik **Proyek baru**. Beri nama `KelasTKA+ SMP`.
2. Klik ikon **roda gigi (Setelan Proyek)**, centang **Tampilkan file manifes "appsscript.json" di editor**, lalu kembali ke **Editor**.
3. Buka `appsscript.json`, hapus seluruh isinya, tempel isi berkas `appsscript.json` dari folder `1-SERVER-AppsScript`, lalu simpan.
4. Hapus berkas `Kode.gs` bawaan.
5. Buat berkas skrip baru (tombol **+** → **Skrip**) dengan nama persis seperti di bawah. Tulis namanya **tanpa** `.gs`; editor menambahkannya sendiri. Buka berkas yang sesuai di komputer dengan Notepad, salin semua isinya, lalu tempel.

   | Dari folder | Nama berkas di editor |
   |---|---|
   | `1-SERVER-AppsScript` | `00_Config`, `01_Util`, `02_Auth`, `03_Router`, `04_Setup`, `10_Admin`, `20_PaketSesi`, `40_Ujian`, `50_Skor`, `60_Laporan`, `70_Bank`, `80_Survei`, `81_InstrumenSurvei` |
   | `2-RAHASIA-JANGAN-DIUNGGAH` | `98_DataPaketResmi` |

   Jumlahnya **14 berkas skrip** ditambah `appsscript.json`.

6. Klik **Simpan** (ikon disket). Pastikan tidak ada tanda galat merah.

### Menjalankan setup

1. Di bilah atas, pilih fungsi **`setupAppEnvironment`**, lalu klik **Jalankan**.
2. Pertama kali, Google meminta izin. Pilih akun sekolah → **Lanjutan** → **Buka KelasTKA+ SMP (tidak aman)** → **Izinkan**. Peringatan ini muncul karena skrip buatan sendiri belum diverifikasi Google. Ini wajar.
3. Tunggu sampai **Log eksekusi** menampilkan:

   ```
   ✅ Paket resmi: 20 paket, 600 butir (baru 20)
   ```

4. **Catat akun admin pertama** yang tampil di log:

   ```
   🔐 AKUN ADMIN PERTAMA (catat sekarang — hanya tampil sekali, ganti setelah masuk):
      Username   : admin
      Kata sandi : ••••••••••••
   ```

   Jika terlewat, jalankan fungsi `resetSandiAdmin` untuk membuat sandi baru.

Setup otomatis membuat:

- folder Drive **KelasTKA+ SMP** berisi subfolder `aset_soal`, `paket_guru`, dan `cadangan`;
- spreadsheet **DB_KelasTKA — KelasTKA+ SMP** berisi 18 sheet;
- dua *trigger*: `jobTiapMenit` (memproses jawaban dan nilai) dan `jobHarian` (cadangan otomatis pukul 01.00).

Setup aman dijalankan ulang. Ia tidak menggandakan data, tidak mengganti rahasia, tidak mengubah pengaturan yang sudah diisi, dan hanya menambah sheet atau kolom yang belum ada.

### Deploy sebagai Web App

1. Klik **Terapkan (Deploy)** → **Deployment baru**.
2. Klik ikon roda gigi di samping "Pilih jenis", lalu pilih **Aplikasi web**.
3. Isi pengaturannya:
   - **Deskripsi**: `KelasTKA+ v1.4.2`
   - **Jalankan sebagai**: **Saya** (akun sekolah)
   - **Siapa yang memiliki akses**: **Siapa saja**
4. Klik **Terapkan**, lalu salin **URL aplikasi web** yang berakhiran **`/exec`**. Simpan URL ini; dipakai di Tahap 2.
5. Uji di peramban dengan membuka `URL/exec?a=konfig`. Hasil yang benar berupa teks yang memuat `"ok":true`.

---

## 6. Tahap 2 — Pasang tampilan di GitHub Pages

Tahap ini memakai terminal (PowerShell di Windows, Terminal di Mac). **Jangan memakai "Upload files" di situs GitHub**, karena cara itu merusak struktur folder `css/` dan `js/`.

### Menyiapkan folder

1. Ekstrak `3-TAMPILAN-GitHubPages/KelasTKA-SMP-tampilan-v1.4.2.zip` ke tempat yang mudah ditemukan, misalnya `Dokumen\kelastka-smp`.
   **Folder hasil ekstrak inilah folder kerja Anda.** Di dalamnya harus langsung terlihat `index.html`, `manifest.json`, `sw.js`, serta folder `css`, `js`, `assets`, dan `paket`.
2. Salin `3-TAMPILAN-GitHubPages/config.js` ke folder `js` di dalam folder kerja.
3. Buka `js\config.js` dengan Notepad. Ganti `GANTI_DENGAN_ID_DEPLOYMENT` sehingga `GAS_URL` berisi URL `/exec` dari Tahap 1, lalu simpan.

   ```js
   window.KTKA_CONFIG = {
     GAS_URL: 'https://script.google.com/macros/s/AKfycb…/exec'
   };
   ```

### Mengunggah ke GitHub

1. Di github.com, klik **+** → **New repository**. Beri nama `kelastka-smp`, pilih **Public** (wajib untuk GitHub Pages gratis), dan **jangan** centang README.
2. Buka PowerShell **di folder kerja**: buka folder itu di File Explorer, klik *address bar*, ketik `powershell`, lalu tekan Enter.
3. Ketik `dir` dan pastikan **`index.html`** muncul di daftar. Jika yang muncul justru sebuah folder, masuk dulu ke folder itu dengan `cd namafolder`. Langkah ini penting: jika salah folder, situs akan menampilkan 404.
4. Jalankan perintah berikut **satu per satu**. Ganti `USERNAME` dengan nama akun GitHub Anda.

   ```bash
   git init
   git add .
   git commit -m "KelasTKA+ SMP v1.4.2"
   git branch -M main
   git remote add origin https://github.com/USERNAME/kelastka-smp.git
   git push -u origin main
   ```

5. Saat diminta *password*, tempel **Personal Access Token**, bukan sandi GitHub. Layar memang tidak menampilkan apa pun saat token ditempel; itu normal.
   - Cara membuat token: buka <https://github.com/settings/tokens> → **Generate new token (classic)** → centang **repo** → **Generate token** → salin token yang diawali `ghp_`.
   - Token hanya tampil sekali. Simpan di tempat aman.
6. Tanda berhasil: muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### Mengaktifkan GitHub Pages

1. Di repository, buka **Settings → Pages**.
2. Atur:
   - **Source**: *Deploy from a branch*
   - **Branch**: `main` dan `/ (root)`
3. Klik **Save**, lalu centang **Enforce HTTPS**.
4. Tunggu 1–2 menit. Alamat aplikasi menjadi `https://USERNAME.github.io/kelastka-smp/`.

> HTTPS **wajib**. Pembuka paket soal dan fitur pasang di HP hanya bekerja di alamat https.

---

## 7. Tahap 3 — Pengaturan awal di aplikasi

1. Buka alamat GitHub Pages, pilih tab **Guru / Pengawas**, lalu masuk sebagai `admin` dengan sandi dari log.
2. Buka **Akun saya** dan ganti sandi.
3. Buka **Pengaturan** dan isi:
   - identitas sekolah untuk kop laporan: nama, alamat, kepala sekolah, kota, tahun ajaran;
   - **URL situs GitHub Pages**, yang dicetak di kartu login;
   - nilai KKM serta ambang Baik dan Memadai sesuai kebijakan sekolah.

   Lalu klik **Simpan pengaturan**.
4. Buka **Akun Staf** dan buat akun untuk guru Bahasa Indonesia (peran *Guru*, mapel BIN), guru Matematika (peran *Guru*, mapel MAT), dan para pengawas ruang. Sandi awal tampil **sekali**; serahkan langsung kepada pemilik akun.
5. Buka **Data Siswa → Templat Excel**. Isi kolom `nama`, `kelas`, dan `rombel` (misalnya `IX.A`), lalu klik **Impor Excel**.
   - Aplikasi memindai dulu dan menampilkan jumlah siswa baru dan yang sudah ada. Klik **Impor** untuk menyimpan.
   - Username dibuat otomatis, misalnya `ixa-001`. NISN tidak diperlukan.
6. Klik **Cetak kartu login** per rombel. Satu lembar A4 memuat 10 kartu.
   - Jika kartu hilang, cetak ulang saja; tokennya tetap sama.
   - Jika token bocor, pilih siswa itu, klik **Ganti token**, lalu cetak kartu baru.
7. Buka **Sistem & Cadangan** dan pastikan **Pekerja latar: Aktif** dan versi aplikasi serta versi server sama-sama **1.4.2**.
8. (Opsional) Isi **Kunci API Gemini** di Pengaturan agar guru dapat memakai generator soal AI.
   - Buat kunci di <https://aistudio.google.com> dengan **akun Gmail sekolah**: **Get API key → Create API key**, lalu salin kunci yang diawali `AIza`.
   - Tempel di **Pengaturan → Kunci API Gemini**, lalu klik **Simpan kunci**. Server langsung memeriksa kunci itu ke Google dan **mendeteksi model yang tersedia**, lalu menampilkan *Kunci valid* beserta nama model yang dipakai. Nama model tidak perlu ditebak.
   - Biarkan pengaturan **Model Gemini** berisi `otomatis`. Jika suatu saat Google mengganti nama model, server mendeteksi ulang sendiri. Tombol **Periksa kunci & deteksi model** dapat dipakai kapan saja.
   - Kunci disimpan di server (Script Properties) dan tidak pernah dikirim ke peramban. Jangan menempelkannya ke `config.js` atau grup chat.

---

## 8. Tahap 4 — Pasang di HP

- **Android (Chrome):** buka alamat aplikasi, ketuk menu **⋮**, lalu pilih **Instal aplikasi** atau **Tambahkan ke layar utama**. Bisa juga lewat tombol **Pasang aplikasi di HP** di halaman masuk.
- **iPhone (Safari):** buka alamat aplikasi, ketuk **Bagikan**, lalu pilih **Tambahkan ke Layar Utama**.
- **Komputer lab:** cukup buka alamatnya di Chrome atau Edge. Saat mulai mengerjakan, aplikasi meminta mode layar penuh.

---

## 9. Tahap 5 — Menjalankan try out

### Langkah per peran

| Peran | Langkah |
|---|---|
| **Guru mapel** | Buka **Kegiatan & Sesi → Kegiatan baru**. Pilih paket dan aturan penskoran (*parsial* disarankan). Tambahkan **sesi utama** per rombel atau ruang: waktu mulai, durasi, acak soal/opsi, dan (opsional) username pengawas. |
| **Hari H — pengawas** | Masuk dan buka **Pantau Sesi**. Pilih sesi, lalu tampilkan **token sesi** (tombol *Tampilkan* untuk proyektor). |
| **Hari H — siswa** | Masuk dengan kartu login. Di Beranda, masukkan token sesi, lalu klik **Masuk ruang ujian**. Paket soal sudah diunduh sebelumnya, jadi waktu tidak terbuang untuk mengunduh. |
| **Selama ujian** | Jawaban tersimpan di perangkat dan dikirim ke server tiap ±2,5 menit dengan jeda acak. Jika sinyal putus, siswa tetap bisa mengerjakan. |
| **Pindah layar** | Setelah batas tercapai (bawaan: 3 kali, masing-masing lebih dari 5 detik), **layar dikunci, bukan dikumpulkan**. Pengawas memeriksa siswa, lalu menekan **Buka**. Setiap tindakan pengawas wajib diberi alasan dan tercatat. |
| **Bantuan teknis** | Pengawas dapat menambah waktu, mereset login untuk pindah perangkat, atau mengumpulkan jawaban siswa. |
| **Selesai** | Siswa menekan **Selesai**, mencentang pernyataan kejujuran, lalu menerima **kode resi**. Bila waktu habis, jawaban dikumpulkan otomatis. |
| **Siswa tidak hadir** | Guru membuat **sesi susulan**. Tombol *Pilih yang belum mengerjakan* mengisi daftar pesertanya otomatis. |
| **Penutupan** | Setelah semua sesi, termasuk susulan, selesai, guru menekan **Tutup & buka pembahasan**. Nilai dan pembahasan kemudian terbuka untuk siswa. |
| **Laporan** | Ringkasan kelas, peringkat (hanya guru), analisis butir (kesukaran, daya beda, sebaran jawaban), cetak rekap A4, cetak laporan per siswa, dan unduh Excel. |

### Aturan penskoran

Tiap butir bernilai maksimal 1 poin.

| Bentuk soal | Mode *parsial* (disarankan) | Mode *semua benar* |
|---|---|---|
| Pilihan ganda | 1 bila benar, 0 bila salah | Sama |
| Pilihan ganda kompleks | (kunci yang dipilih − pilihan salah yang dipilih) ÷ jumlah kunci, minimal 0 | Poin hanya bila seluruh jawaban tepat |
| Kategori | Pernyataan yang tepat ÷ jumlah pernyataan | Poin hanya bila seluruh jawaban tepat |

Nilai akhir = jumlah poin ÷ jumlah butir × 100, dibulatkan dua desimal. Predikat **Istimewa** untuk nilai ≥ 95; **Baik**, **Memadai**, dan **Kurang** mengikuti ambang di Pengaturan (bawaan 70 dan 50).

---

## 10. Bank soal, generator, dan latihan

- Guru membuat butir di **Bank Soal** (dengan pratinjau tampilan HP) atau **mengimpor Excel master**.
- Butir diajukan ke **telaah**. Guru lain menyetujui, meminta revisi, atau menolak. Hanya butir yang **disetujui** yang dapat dirakit menjadi paket atau dipakai latihan.
- **Generator** menyediakan tiga cara: rakit paket acak seimbang, soal Matematika berparameter, dan draf soal dengan AI. Semua soal baru berstatus **draf** dan wajib ditelaah.
- **Latihan mandiri** siswa memakai paket yang kegiatannya sudah ditutup, paket yang dibuka guru, serta bank soal yang disetujui. Latihan **ditutup otomatis** saat ada try out berlangsung.

---

## 11. Survei karakter dan lingkungan belajar

### Isi survei

Survei murid tersedia dalam **5 paket lengkap**: setiap paket memuat semua indikator, hanya pertanyaannya yang berbeda.

| Instrumen | Responden | Isi per paket |
|---|---|---|
| Survei Karakter | Murid | 46 pertanyaan, ±25 menit: 8 dimensi profil lulusan × 3 unsur (Rapor A.3.7–A.3.14) dalam bentuk situasi atau pendapat tentang tokoh rekaan, 7 Kebiasaan Anak Indonesia Hebat × 3 unsur (Rapor D.19), dan 1 butir pemeriksa ketelitian |
| Survei Lingkungan Belajar — Murid | Murid | 96 pertanyaan, ±25 menit: iklim keamanan, kualitas pembelajaran, kompetensi pendidik, kebinekaan, inklusivitas, kesetaraan gender, kesiapsiagaan bencana dan perubahan iklim, partisipasi, program dan kebijakan sekolah, latar belakang belajar di rumah (tidak dinilai), dan 1 butir pemeriksa ketelitian |
| Survei Lingkungan Belajar — Guru | Guru/staf | 21 butir: refleksi pembelajaran, kepemimpinan pembelajaran, iklim sekolah, praktik kelas, kesejahteraan guru |

Acuan penyusunan: Kepmendikdasmen No. 56 Tahun 2026, definisi indikator Rapor Pendidikan 2026, dan contoh survei dari buku persiapan. Rincian butir dan bobotnya ada di `4-LAMPIRAN/KelasTKA-SMP-KisiKisi-Survei-Murid-v1.4.2.xlsx`. **Berkas ini khusus untuk guru; jangan dibagikan kepada murid.**

### Tampilan murid

Murid mengisi seperti ANBK: satu pertanyaan per layar, tombol **Daftar nomor** untuk berpindah, dan penghitung waktu yang hanya memberi peringatan. Jawaban tidak terkirim otomatis dan tersimpan di HP sampai dikirim.

### Alur penggunaan

1. **Admin membuka survei** di menu **Survei → Buka survei**: pilih instrumen dan paket, judul, waktu buka/tutup, dan rombel sasaran.
2. **Responden mengisi.** Murid melihat kartu survei di Beranda. Guru mengisi lewat menu Survei.
3. **Guru dan admin membaca laporan:**
   - indeks 0–100 per aspek dan unsur, lengkap dengan kode indikator Rapor;
   - persentase murid aman untuk perundungan, hukuman fisik, kekerasan seksual, serta rokok, minuman keras, dan narkoba;
   - rangkuman per rombel (tampil bila responden minimal 5 orang);
   - sebaran jawaban per butir dan latar belakang belajar di rumah;
   - **kesungguhan pengisian**: respons yang terlalu cepat, salah menjawab butir pemeriksa, berpola seragam, atau tidak konsisten ditandai dan tidak dihitung dalam indeks;
   - rekomendasi tindak lanjut, cetak A4, dan Excel.

### Saran pelaksanaan

- **Urutan seperti pelaksanaan resmi.** Survei Karakter dibuka setelah try out Matematika, Survei Lingkungan Belajar setelah try out Bahasa Indonesia. Gunakan paket berikutnya setiap putaran, misalnya Paket 1 setelah Try Out 2, Paket 2 setelah Try Out 4, dan seterusnya.
- **Sebelum putaran pertama**, bacakan petunjuk bersama murid: baca semua pilihan sampai selesai, tidak ada jawaban benar atau salah, dan jawaban dirahasiakan.
- **Setelah latihan, bahas topiknya, bukan kuncinya.** Ajak murid mendiskusikan pilihan sikap dan akibatnya, tanpa menyebut pilihan mana yang bobotnya tertinggi. Murid yang menghafal "jawaban terbaik" akan berhenti menjawab jujur, sehingga hasilnya tidak berguna bagi sekolah.
- **Pantau kesungguhan pengisian.** Jika lebih dari 10% respons ditandai, ulangi pembiasaan membaca petunjuk di rombel tersebut.
- **Tindak lanjuti tanda bahaya.** Persentase murid aman di bawah 100% perlu diteruskan kepada tim pencegahan dan penanganan kekerasan sekolah serta guru BK, tanpa mencari tahu siapa yang menjawab.

### Kerahasiaan responden

- Identitas disimpan sebagai kode acak. Guru dan admin tidak dapat melihat jawaban perorangan.
- Di akhir survei, murid dapat **secara sukarela** meminta dihubungi guru BK. Hanya pada pilihan ini namanya tercatat, dan hanya admin yang dapat membacanya di **Survei → Permintaan bantuan**.

Hasil survei ini untuk latihan dan refleksi mutu sekolah. Hasilnya bukan data resmi dan angkanya tidak sama dengan angka Rapor Pendidikan.

---

## 12. Uji coba bertahap

Aplikasi ini sudah diuji di simulator Apps Script dan peramban: 26 uji server dan 23 langkah uji peramban lulus. Tetap lakukan uji coba bertahap sebelum try out penuh:

1. **Uji staf (15 menit).** Admin, satu guru, dan satu pengawas mencoba setiap menu. Buat satu kegiatan percobaan dengan sesi 10 menit untuk 3–5 akun siswa.
2. **Uji satu kelas (±30 siswa, 20 menit).** Siswa mengerjakan dengan HP masing-masing. Uji juga kasus khusus: matikan data seluler sebentar, pindah aplikasi 3 kali (layar harus terkunci, lalu dibuka pengawas), dan ganti perangkat (reset login). Akhiri sesi, tutup kegiatan, lalu periksa nilai, pembahasan, dan cetak laporan.
3. **Uji tiga sampai lima kelas sekaligus.** Pantau menu **Sistem**: *Antrean nilai* harus kembali 0 dalam 1–2 menit setelah sesi berakhir.
4. **Try out penuh.** Mulailah sesi bertahap per ruang dengan selisih 2–5 menit agar lonjakan masuk tidak bersamaan.

Catat setiap kendala beserta tangkapan layar dan isi menu **Sistem → Jejak audit**.

---

## 13. Kinerja, kuota, keamanan, dan cadangan

### Jalur siswa dibuat ringan

- Simpan otomatis tidak langsung menulis ke spreadsheet. Data ditahan di *cache* server, lalu ditulis bertahap oleh `jobTiapMenit`.
- Paket soal diunduh sekali ke perangkat dalam bentuk terenkripsi, lalu dibuka saat siswa memasukkan token sesi.
- Pembahasan baru bisa dibuka setelah kegiatan ditutup.

### Kuota

Menurut dokumentasi Google (dapat berubah sewaktu-waktu), akun Gmail biasa mendapat total waktu jalan *trigger* 90 menit per hari dan 30 eksekusi bersamaan per pengguna. Aplikasi dirancang hemat agar ±400 siswa muat dalam batas itu. Jika kuota trigger harian hampir habis, buka **Sistem** dan proses jawaban secara manual. Jangan menghapus trigger.

### Rahasia

Kunci sesi, *hash* sandi staf, kunci API Gemini, dan kunci kartu login hanya disimpan di **Script Properties** dan tidak pernah dikirim ke peramban. Berkas `config.js` hanya berisi URL `/exec`, yang memang bukan rahasia.

### Fungsi darurat

Jalankan dari editor Apps Script bila diperlukan:

| Fungsi | Kegunaan |
|---|---|
| `resetSandiAdmin` | Membuat sandi admin baru (tampil di log) |
| `rotasiSecretSesi` | Mengeluarkan semua pengguna dari semua perangkat |
| `cekPerforma` | Menampilkan versi, trigger, jumlah siswa, sesi aktif, dan ukuran Script Properties |

### Cadangan

Salinan spreadsheet dibuat otomatis setiap hari; 14 salinan terakhir disimpan di folder `cadangan`. Admin juga dapat membuat cadangan manual dari menu **Sistem**.

---

## 14. Memperbarui dari versi lama

Ikuti bagian ini bila sekolah sudah memasang KelasTKA+ versi 1.0.0 sampai 1.3.0. **Data siswa, akun staf, kegiatan, nilai, dan pengaturan tetap aman.** Setup hanya menambah yang belum ada.

> **Jangan memperbarui saat try out sedang berlangsung.** Selesaikan dulu semua sesi yang berjalan.

### Langkah 1 — Server

1. Buka proyek Apps Script KelasTKA+ yang sudah ada. **Jangan membuat proyek baru**, karena data tersimpan di proyek lama.
2. Untuk setiap berkas yang sudah ada, hapus seluruh isinya, tempel isi yang baru, lalu simpan:
   - 11 berkas `00_Config`, `01_Util`, `02_Auth`, `03_Router`, `04_Setup`, `10_Admin`, `20_PaketSesi`, `40_Ujian`, `50_Skor`, `60_Laporan`, dan `70_Bank` dari folder `1-SERVER-AppsScript`;
   - `98_DataPaketResmi` dari folder `2-RAHASIA-JANGAN-DIUNGGAH`;
   - `appsscript.json`.
3. **Tambahkan berkas yang belum ada.** Pemasangan versi 1.0.0 belum memiliki modul survei, yaitu `80_Survei` dan `81_InstrumenSurvei`. Jika keduanya sudah ada, cukup ganti isinya. Buat keduanya lewat tombol **+** → **Skrip**, lalu tempel isinya. Setelah itu, jumlah berkas skrip harus **14**.
4. Klik **Simpan**, pilih fungsi **`setupAppEnvironment`**, lalu klik **Jalankan**. Fungsi ini:
   - menambahkan sheet survei dan kolom baru yang belum ada;
   - menambahkan pengaturan baru tanpa mengubah yang sudah diisi;
   - memperbarui 20 paket resmi ke versi terbaru (termasuk ilustrasi Bahasa Indonesia);
   - tidak membuat akun admin baru dan tidak mengganti sandi.

   Jika Google meminta izin lagi, berikan seperti pada pemasangan pertama.
5. Buka **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan**. **Jangan** memilih *Deployment baru*, karena URL `/exec` akan berubah dan aplikasi tidak bisa terhubung.

### Langkah 2 — Tampilan

1. Ekstrak `KelasTKA-SMP-tampilan-v1.4.2.zip` **ke folder repository yang sudah ada**, yaitu folder yang berisi `index.html` dan pernah Anda *push* ke GitHub. Jika ditanya, pilih **timpa/replace semua**.
2. **Jangan** menyalin `config.js` dari paket ini. ZIP tampilan sengaja tidak memuat `js/config.js`, sehingga alamat server Anda tetap aman.
3. Buka PowerShell di folder itu, lalu jalankan:

   ```bash
   git add .
   git commit -m "Pembaruan ke KelasTKA+ v1.4.2"
   git push
   ```

   Unggahan pertama dari versi lama bisa berukuran belasan MB karena memuat ilustrasi soal.

### Langkah 3 — Periksa

1. Tunggu 1–2 menit, buka aplikasi, lalu tekan **Ctrl+Shift+R** di komputer. Di HP, tutup lalu buka kembali aplikasinya; aplikasi menampilkan pemberitahuan "Versi baru siap".
2. Masuk sebagai admin dan buka **Sistem**. Versi aplikasi dan versi server harus sama-sama **1.4.2**.
3. Jika sekolah pernah membuka **survei murid** dengan versi lama, hapus survei itu di menu **Survei**. Kode pertanyaannya sudah berubah, sehingga laporan baru tidak bisa membacanya dengan benar. Survei guru tidak terpengaruh.

### Pembaruan berikutnya

Untuk versi-versi selanjutnya, langkahnya sama: tempel kode baru ke berkas yang sama, jalankan `setupAppEnvironment`, terapkan **Versi baru**, salin berkas tampilan ke folder repository, lalu `git add .`, `git commit`, dan `git push`.

---

## 15. Kendala umum

| Gejala | Penyebab dan solusi |
|---|---|
| "Konfigurasi belum lengkap" | `js/config.js` belum ada atau `GAS_URL` belum diisi. Salin `config.js` ke folder `js`, isi URL `/exec`, lalu *push* ulang. |
| Situs GitHub Pages 404 | `git init` dijalankan di folder yang salah. Pastikan `index.html` berada di tingkat teratas repository (lihat Tahap 2). |
| Tampilan berantakan tanpa warna | Berkas diunggah lewat "Upload files" di situs GitHub sehingga folder `css` dan `js` rusak. Unggah ulang lewat terminal. |
| `Password authentication is not supported` | GitHub tidak menerima sandi akun di terminal. Gunakan Personal Access Token (Tahap 2). |
| "Tidak dapat terhubung ke server" | Akses Web App belum **Siapa saja**, URL salah, atau deployment belum diperbarui ke versi baru. |
| Fungsi `setupAppEnvironment` tidak muncul di daftar | Berkas `04_Setup` belum dibuat atau belum disimpan. Simpan semua berkas, lalu muat ulang editor. |
| Versi server dan versi aplikasi berbeda | Salah satu bagian belum diperbarui. Server: terapkan **Versi baru**. Tampilan: *push* ulang, lalu **Ctrl+Shift+R**. |
| Login siswa: "Username atau token salah" | Periksa kartu. Huruf O dan angka 0 tidak dipakai di token. Setelah 5 kali salah, akun terkunci 15 menit; pengawas dapat membukanya dari menu pantau. |
| "Akun dipakai di perangkat lain" | Pengawas memilih siswa → **Reset login**. Siswa lalu masuk di perangkat baru dengan token sesi. |
| Paket gagal dibuka | Peramban terlalu lama, situs dibuka tanpa https, atau tampilan dan server berbeda versi. Gunakan Chrome/Safari terbaru melalui alamat https dan samakan versinya. |
| Nilai belum muncul | Tunggu 1–2 menit atau buka **Kegiatan → Proses jawaban**. Pembahasan untuk siswa terbuka setelah kegiatan ditutup. |
| Gambar soal guru tidak tampil | Gambar disimpan di Drive akun sekolah dengan akses "siapa saja yang memiliki link". Akun Workspace yang membatasi berbagi tautan dapat menghalanginya; gunakan akun Gmail (Tahap 0). |
| Laporan survei kosong atau aneh setelah pembaruan | Survei dibuka dengan versi lama. Hapus survei itu, lalu buka survei baru. |
| Generator AI tidak aktif | Kunci API Gemini belum diisi admin di Pengaturan. |
| Generator AI: "Kunci API tidak valid" atau "ditolak" | Salin ulang kunci dari Google AI Studio (akun sekolah), simpan, lalu tekan **Periksa kunci & deteksi model**. |
| Generator AI: "Kuota habis (429)" | Batas pemakaian gratis akun sekolah tercapai. Coba lagi nanti. |
