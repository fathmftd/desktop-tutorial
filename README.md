# Pengingat Kegiatan

Aplikasi Android sederhana untuk mengingatkan kegiatan sehari-hari lewat notifikasi.

## Fitur

- Tambah, ubah, dan hapus kegiatan (nama, catatan, tanggal & jam).
- Notifikasi tepat waktu, atau lebih awal: 5/15/30 menit, 1 jam, atau 1 hari sebelumnya.
- Kegiatan berulang: setiap hari, setiap minggu, atau setiap bulan.
- Tombol **Tunda 10 menit** dan **Selesai** langsung dari notifikasi.
- Sakelar untuk menyalakan/mematikan pengingat per kegiatan.
- Pengingat tetap terpasang setelah HP dinyalakan ulang.
- Data tersimpan di HP (SQLite), tanpa internet dan tanpa akun.

## Cara mendapatkan APK

### Lewat GitHub Actions (tanpa install apa pun)

1. Buka tab **Actions** di repository ini.
2. Pilih run terbaru dari workflow **Build APK** (otomatis berjalan setiap push,
   atau jalankan manual lewat **Run workflow**).
3. Unduh artifact **PengingatKegiatan-apk**, ekstrak zip-nya, lalu salin
   `app-debug.apk` ke HP dan install (izinkan "Instal dari sumber tidak dikenal").

### Build sendiri

Butuh JDK 17 dan Android SDK (paling mudah lewat Android Studio):

```bash
./gradlew assembleDebug
# hasil: app/build/outputs/apk/debug/app-debug.apk
```

Atau buka folder ini di Android Studio lalu tekan **Run**.

## Cara pakai

1. Tekan **+ Tambah Kegiatan**, isi nama kegiatan, pilih tanggal & jam, lalu **Simpan**.
2. Ketuk kegiatan untuk mengubahnya; tekan lama untuk menghapus.
3. Saat pertama dibuka, izinkan notifikasi (dan izin alarm jika diminta) agar
   pengingat bisa berbunyi.

Minimal Android 7.0 (API 24).
