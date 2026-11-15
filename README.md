# KelasTKA+ SMP — tampilan aplikasi (frontend)

Aplikasi web progresif (PWA) untuk latihan dan try out TKA SMP: Bahasa Indonesia dan Matematika.

Folder ini adalah **akar repository GitHub Pages**: `index.html` harus berada di tingkat teratas.

## Isi folder

| Berkas/folder | Isi |
|---|---|
| `index.html` | Kerangka aplikasi. |
| `manifest.json` dan `sw.js` | Pemasangan di HP dan cache aplikasi. |
| `css/app.css` | Tampilan. |
| `js/config.js` | **Satu-satunya berkas yang perlu diubah**: isi `GAS_URL` dengan URL `/exec` Web App Apps Script. Pada paket berbagi, berkas ini disediakan terpisah agar pembaruan tidak menimpa alamat server sekolah. |
| `js/core.js` | API, penyimpanan, pembuka brankas, router, komponen. |
| `js/lib/` | Perender soal dan KaTeX. |
| `js/pages/` | Halaman siswa, ujian, pengawas, guru, bank soal, laporan, admin. |
| `paket/` | 20 paket try out resmi KelasTKA+ (Try Out 1–10 Matematika dan Bahasa Indonesia) dalam bentuk **terenkripsi** (AES-256-GCM). Kuncinya hanya ada di server dan diberikan saat sesi berjalan. |
| `assets/` | Logo dan ikon. |

## Yang tidak ada di sini

Folder ini sengaja tidak memuat:

- kode server (`.gs`);
- kunci paket;
- data siswa.

Panduan lengkap ada di `PANDUAN-INSTALASI.md`.
