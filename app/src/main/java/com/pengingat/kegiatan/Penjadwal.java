package com.pengingat.kegiatan;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** Mengatur alarm sistem untuk setiap kegiatan. */
public final class Penjadwal {
    public static final String CHANNEL_ID = "pengingat";
    public static final String EXTRA_ID = "id";
    public static final String EXTRA_TUNDA = "tunda";

    private static final int OFFSET_TUNDA = 1_000_000;

    private Penjadwal() {
    }

    /** Pasang (atau pasang ulang) alarm untuk kegiatan; dibatalkan bila tidak aktif / sudah lewat. */
    public static void jadwalkan(Context ctx, Kegiatan k) {
        batal(ctx, k.id);
        if (!k.aktif) return;
        long kapan = k.waktuPengingat();
        if (kapan <= System.currentTimeMillis()) return;
        pasangAlarm(ctx, kapan, buatPending(ctx, k.id, false));
    }

    /** Bunyikan lagi pengingat kegiatan beberapa menit dari sekarang. */
    public static void tunda(Context ctx, long id, int menit) {
        long kapan = System.currentTimeMillis() + menit * 60_000L;
        pasangAlarm(ctx, kapan, buatPending(ctx, id, true));
    }

    public static void batal(Context ctx, long id) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        am.cancel(buatPending(ctx, id, false));
        am.cancel(buatPending(ctx, id, true));
    }

    /** Dipanggil saat boot / aplikasi diperbarui / jam diubah. */
    public static void jadwalkanSemua(Context ctx) {
        Database db = Database.get(ctx);
        long sekarang = System.currentTimeMillis();
        for (Kegiatan k : db.semua()) {
            if (k.aktif && k.majukanKeBerikutnya(sekarang)) db.simpan(k);
            jadwalkan(ctx, k);
        }
    }

    public static void buatChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID,
                ctx.getString(R.string.channel_nama), NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription(ctx.getString(R.string.channel_desk));
        ch.enableVibration(true);
        ctx.getSystemService(NotificationManager.class).createNotificationChannel(ch);
    }

    private static void pasangAlarm(Context ctx, long kapan, PendingIntent pi) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        boolean bolehTepat = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
        if (bolehTepat) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, kapan, pi);
        } else {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, kapan, pi);
        }
    }

    private static PendingIntent buatPending(Context ctx, long id, boolean tunda) {
        Intent i = new Intent(ctx, AlarmReceiver.class)
                .putExtra(EXTRA_ID, id)
                .putExtra(EXTRA_TUNDA, tunda);
        int kode = (int) id + (tunda ? OFFSET_TUNDA : 0);
        return PendingIntent.getBroadcast(ctx, kode, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
