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
- Semua data tersimpan di perangkat (localStorage), tidak hilang saat aplikasi ditutup.

## Cara memasukkan data anggota dari Google Drive
1. Buka folder QR Code di Google Drive → klik kanan folder → **Download** (jadi file .zip) → ekstrak.
2. Buka aplikasi → tab **Anggota** → **Pilih Gambar QR Code** → pilih semua gambar QR.
3. Periksa/lengkapi nama → **Simpan Semua ke Database**.

## Menjalankan / meng-online-kan
Kamera hanya bisa dipakai lewat **HTTPS** (atau `localhost`).

- **GitHub Pages (gratis):** Settings → Pages → *Deploy from a branch* → pilih branch & folder `/ (root)`.
  Buka link yang diberikan di HP → menu browser → **Tambahkan ke Layar Utama / Install aplikasi**.
- **Lokal:** `npx http-server -p 8080 .` lalu buka `http://localhost:8080`.

## Pengembangan
CSS Tailwind sudah di-build ke `vendor/tailwind.css`. Jika mengubah kelas di `index.html`, build ulang:

```bash
npm install
npm run build:css
```
