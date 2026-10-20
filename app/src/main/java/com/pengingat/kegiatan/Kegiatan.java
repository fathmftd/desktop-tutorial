package com.pengingat.kegiatan;

import java.util.Calendar;

/** Satu kegiatan yang ingin diingatkan. */
public class Kegiatan {
    public static final int ULANG_TIDAK = 0;
    public static final int ULANG_HARIAN = 1;
    public static final int ULANG_MINGGUAN = 2;
    public static final int ULANG_BULANAN = 3;

    /** Pilihan "ingatkan sebelumnya" dalam menit, urutannya sama dengan array pilihan_sebelum. */
    public static final int[] MENIT_SEBELUM = {0, 5, 15, 30, 60, 24 * 60};

    public long id;
    public String judul = "";
    public String catatan = "";
    /** Waktu mulai kegiatan (epoch millis). */
    public long waktu;
    public int ulang = ULANG_TIDAK;
    public int menitSebelum = 0;
    public boolean aktif = true;
    /** Tanggal asli (1-31) untuk pengulangan bulanan, agar tanggal 31 tetap kembali ke 31. */
    public int tanggalBulanan = 0;

    /** Waktu notifikasi dibunyikan. */
    public long waktuPengingat() {
        return waktu - menitSebelum * 60_000L;
    }

    /**
     * Untuk kegiatan berulang, majukan waktu ke kemunculan berikutnya
     * yang pengingatnya masih di masa depan.
     *
     * @return true jika waktu berubah.
     */
    public boolean majukanKeBerikutnya(long sekarang) {
        if (ulang == ULANG_TIDAK) return false;
        boolean berubah = false;
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(waktu);
        int hari = tanggalBulanan > 0 ? tanggalBulanan : c.get(Calendar.DAY_OF_MONTH);
        int bulanKe = 0;
        while (waktu - menitSebelum * 60_000L <= sekarang) {
            switch (ulang) {
                case ULANG_HARIAN:
                    c.add(Calendar.DAY_OF_MONTH, 1);
                    break;
                case ULANG_MINGGUAN:
                    c.add(Calendar.WEEK_OF_YEAR, 1);
                    break;
                default:
                    bulanKe++;
                    c.setTimeInMillis(waktu);
                    c.set(Calendar.DAY_OF_MONTH, 1);
                    c.add(Calendar.MONTH, 1);
                    c.set(Calendar.DAY_OF_MONTH, Math.min(hari, c.getActualMaximum(Calendar.DAY_OF_MONTH)));
                    break;
            }
            waktu = c.getTimeInMillis();
            berubah = true;
            if (bulanKe > 1200) break;
        }
        return berubah;
    }
}
