# 📋 Absensi BEM — Scan QR

Aplikasi web absensi anggota BEM untuk setiap **rapat** dan **kegiatan** menggunakan **scan QR code**.
Tanpa server: cukup buka di browser, data tersimpan di perangkat (localStorage).

## Fitur
- **Dashboard** — total anggota, jumlah agenda bulan ini, rata-rata kehadiran, scan hari ini, grafik tren kehadiran, agenda terdekat, dan papan peringkat anggota paling rajin.
- **Scan QR** — pilih agenda, aktifkan kamera, lalu scan kartu QR anggota. Status *Hadir*/*Terlambat* ditentukan otomatis dari jam mulai + toleransi. Ada bunyi & getar sebagai tanda berhasil, cegah absen ganda, serta absen manual (Hadir/Terlambat/Izin/Sakit).
- **Agenda** — buat, ubah, dan hapus agenda Rapat/Kegiatan; rekap per agenda (ubah status tiap anggota) dan unduh CSV.
- **Anggota** — tambah/edit/hapus anggota (nama, NIM, jabatan, divisi, HP, email, tanggal bergabung), pencarian & filter divisi, **kartu QR** yang bisa diunduh (PNG) atau **dicetak semua sekaligus**.
- **Grafik per anggota (1 bulan)** — persentase kehadiran & predikat, diagram donat komposisi status, grafik batang per minggu, kalender kehadiran, riwayat agenda, dan peringkat kehadiran seluruh anggota.
- **Pengaturan** — nama organisasi & periode, toleransi keterlambatan default, backup/pulihkan JSON, rekap bulanan CSV, data contoh, hapus semua data.
- Tampilan responsif (sidebar di desktop, navigasi bawah di HP) dan mendukung mode gelap.

## Cara Menjalankan
Kamera hanya bisa diakses lewat **HTTPS** atau **localhost**.

```bash
cd absensi-bem
python3 -m http.server 8000
# buka http://localhost:8000
```

Untuk dipakai dari HP, unggah folder ini ke hosting HTTPS gratis, misalnya **GitHub Pages**
(Settings → Pages → pilih branch) atau Netlify/Vercel.

## Alur Penggunaan
1. **Anggota → Tambah Anggota**, lalu bagikan/cetak **Kartu QR** setiap anggota.
2. **Agenda → Agenda Baru** untuk setiap rapat/kegiatan.
3. Saat acara, buka **Scan QR**, pilih agenda, aktifkan kamera, dan scan kartu anggota.
4. Lihat rekap di **Grafik** (pilih anggota & bulan) dan unduh CSV bila perlu.

> Anggota yang tidak absen pada agenda yang sudah lewat otomatis dihitung **Alpha**.
> Ingin mencoba cepat? Buka **Pengaturan → Muat Data Contoh**.

## Teknologi
HTML, CSS, JavaScript murni + [Chart.js](https://www.chartjs.org/), [html5-qrcode](https://github.com/mebjas/html5-qrcode), dan [qrcodejs](https://github.com/davidshimjs/qrcodejs) (dimuat dari CDN).
