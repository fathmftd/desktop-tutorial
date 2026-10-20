package com.pengingat.kegiatan;

/** Teks waktu relatif sederhana dalam bahasa Indonesia, misalnya "dalam 2 jam 5 menit". */
final class DateUtilsTeks {
    private DateUtilsTeks() {
    }

    static String relatif(long kapan) {
        long menit = Math.max(1, (kapan - System.currentTimeMillis() + 59_999) / 60_000);
        long hari = menit / (24 * 60);
        long jam = (menit / 60) % 24;
        long sisa = menit % 60;
        StringBuilder sb = new StringBuilder("dalam ");
        if (hari > 0) sb.append(hari).append(" hari ");
        if (jam > 0) sb.append(jam).append(" jam ");
        if (sisa > 0 && hari == 0) sb.append(sisa).append(" menit");
        return sb.toString().trim();
    }
}
