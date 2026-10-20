# 📋 Absensi BEM — Scan QR

Aplikasi web absensi anggota BEM untuk setiap **rapat** dan **kegiatan** menggunakan **scan QR code**.
Tanpa server: cukup buka di browser, data tersimpan di perangkat (localStorage).

## Fitur
- **Dashboard** — total anggota, jumlah agenda bulan ini, rata-rata kehadiran, scan hari ini, grafik tren kehadiran, agenda terdekat, dan papan peringkat anggota paling rajin.
- **Scan QR** — pilih agenda, aktifkan kamera (atau **Scan dari Foto** bila kamera langsung tidak bisa dipakai), lalu scan kartu QR anggota. Status *Hadir*/*Terlambat* ditentukan otomatis dari jam mulai + toleransi. Ada bunyi & getar sebagai tanda berhasil, cegah absen ganda, serta absen manual (Hadir/Terlambat/Izin/Sakit).
- **Agenda** — buat, ubah, dan hapus agenda Rapat/Kegiatan; rekap per agenda (ubah status tiap anggota) dan unduh CSV.
- **Anggota** — tambah/edit/hapus anggota (nama, NIM, jabatan, divisi, HP, email, tanggal bergabung), pencarian & filter divisi, **kartu QR** yang bisa diunduh (PNG) atau **dicetak semua sekaligus**.
- **Grafik per anggota (1 bulan)** — persentase kehadiran & predikat, diagram donat komposisi status, grafik batang per minggu, kalender kehadiran, riwayat agenda, dan peringkat kehadiran seluruh anggota.
- **Pengaturan** — nama organisasi & periode, toleransi keterlambatan default, backup/pulihkan JSON, rekap bulanan CSV, data contoh, hapus semua data.
- Tampilan responsif (sidebar di desktop, navigasi bawah di HP) dan mendukung mode gelap.

## 📲 Download di HP

### Android — file APK
1. Buka halaman **Releases** repo ini di HP (`https://github.com/fathmftd/desktop-tutorial/releases/tag/apk-terbaru`, login GitHub dulu karena repo privat).
2. Unduh **Absensi-BEM.apk**, lalu buka file tersebut.
3. Jika diminta, izinkan *Instal dari sumber tidak dikenal* untuk browser/File Manager, lalu tekan **Instal**.
4. Saat pertama scan, izinkan akses **kamera**.

APK dibangun otomatis oleh GitHub Actions (`.github/workflows/android-apk.yml`) setiap ada perubahan pada folder `absensi-bem/` atau `mobile/`.
Di aplikasi Android, tombol unduh (kartu QR, CSV, backup) membuka menu **Bagikan** untuk menyimpan ke Drive/WhatsApp/File.

### Android & iPhone — pasang dari browser (PWA)
Setelah aplikasi di-hosting di HTTPS (lihat di bawah), buka link-nya di HP lalu:
- **Android (Chrome):** tekan tombol **📲 Pasang Aplikasi** di Dashboard, atau menu ⋮ → *Instal aplikasi / Tambahkan ke layar utama*.
- **iPhone (Safari):** tombol Bagikan → *Tambahkan ke Layar Utama*.

Aplikasi tetap bisa dibuka tanpa internet setelah dipasang.

## Cara Menjalankan
Kamera hanya bisa diakses lewat **HTTPS** atau **localhost**.

```bash
cd absensi-bem
python3 -m http.server 8000
# buka http://localhost:8000
```

Untuk dipakai dari HP, unggah folder ini ke hosting HTTPS gratis:
- **Netlify Drop** — buka https://app.netlify.com/drop lalu seret folder `absensi-bem` ke halaman itu.
- **GitHub Pages** — Settings → Pages → pilih branch (repo privat butuh GitHub berbayar, atau jadikan repo publik).

## Alur Penggunaan
1. **Anggota → Tambah Anggota**, lalu bagikan/cetak **Kartu QR** setiap anggota.
2. **Agenda → Agenda Baru** untuk setiap rapat/kegiatan.
3. Saat acara, buka **Scan QR**, pilih agenda, aktifkan kamera, dan scan kartu anggota.
4. Lihat rekap di **Grafik** (pilih anggota & bulan) dan unduh CSV bila perlu.

> Anggota yang tidak absen pada agenda yang sudah lewat otomatis dihitung **Alpha**.
> Ingin mencoba cepat? Buka **Pengaturan → Muat Data Contoh**.

## Teknologi
HTML, CSS, JavaScript murni (PWA) + [Capacitor](https://capacitorjs.com/) untuk APK Android + [Chart.js](https://www.chartjs.org/), [html5-qrcode](https://github.com/mebjas/html5-qrcode), dan [qrcodejs](https://github.com/davidshimjs/qrcodejs) (disertakan di folder `vendor/`, jadi bisa berjalan offline).
