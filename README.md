# Sistem Absensi BEM PEM Akamigas

Aplikasi web (PWA) untuk absensi kegiatan BEM PEM Akamigas dengan scan QR Code ID Card.
Bisa di-*install* ke HP seperti aplikasi biasa dan tetap jalan offline setelah dibuka pertama kali.

## Fitur
- **Scanner** – scan QR ID Card, status *Hadir/Terlambat* otomatis sesuai batas waktu kegiatan.
- **Laporan** – rekap per kegiatan + export CSV (bisa dibuka di Excel).
- **Kegiatan** – buat/hapus kegiatan beserta jam mulai & batas terlambat.
- **Anggota** – database anggota:
  - **Import dari gambar QR Code** (pilih banyak file sekaligus). Isi QR dibaca otomatis;
    jika QR hanya berisi NIM, nama diambil dari nama file (mis. `21144001_Andi_Saputra.png`).
    Format isi QR yang didukung: `NIM`, `NIM|Nama`, `NIM;Nama`, `NIM,Nama`, `NIM - Nama`, atau JSON `{"nim":"..","nama":".."}`.
  - Import CSV (`NIM,Nama`), tambah manual, cari, hapus, export.
- Data 58 pengurus BEM 2026/2027 sudah termuat otomatis.
- Semua data tersimpan di perangkat (localStorage), tidak hilang saat halaman ditutup.

## Cara memasukkan data anggota dari Google Drive
1. Buka folder QR Code di Google Drive → klik kanan folder → **Download** (jadi file .zip) → ekstrak.
2. Buka aplikasi → tab **Anggota** → **Pilih Gambar QR Code** → pilih semua gambar QR.
3. Periksa/lengkapi nama → **Simpan Semua ke Database**.

## Link aplikasi (GitHub Pages)
Kamera hanya bisa dipakai lewat **HTTPS**, dan GitHub Pages sudah HTTPS.

1. Repo → **Settings → General → Danger Zone → Change visibility → Public**
   (GitHub Pages gratis hanya untuk repo public).
2. Repo → **Settings → Pages** → *Source*: **Deploy from a branch** → pilih branch ini, folder **/ (root)** → **Save**.
3. Tunggu ±1 menit, link: **https://fathmftd.github.io/desktop-tutorial/**

Data pengurus ada di `data-anggota.js`. Data absensi tersimpan di HP/browser masing-masing panitia,
jadi gunakan **Export CSV** setelah kegiatan.

## Pengembangan
CSS Tailwind sudah di-build ke `vendor/tailwind.css`. Jika mengubah kelas di `index.html`, build ulang:

```bash
npm install
npm run build:css
```
