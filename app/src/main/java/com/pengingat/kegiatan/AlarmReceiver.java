package com.pengingat.kegiatan;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.text.TextUtils;
import android.text.format.DateFormat;

/** Menampilkan notifikasi dan menangani tombol aksi di notifikasi. */
public class AlarmReceiver extends BroadcastReceiver {
    public static final String AKSI_TUNDA = "com.pengingat.kegiatan.TUNDA";
    public static final String AKSI_SELESAI = "com.pengingat.kegiatan.SELESAI";
    private static final int MENIT_TUNDA = 10;

    @Override
    public void onReceive(Context ctx, Intent intent) {
        long id = intent.getLongExtra(Penjadwal.EXTRA_ID, 0);
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);

        if (AKSI_TUNDA.equals(intent.getAction())) {
            nm.cancel((int) id);
            Penjadwal.tunda(ctx, id, MENIT_TUNDA);
            return;
        }
        if (AKSI_SELESAI.equals(intent.getAction())) {
            nm.cancel((int) id);
            return;
        }

        Database db = Database.get(ctx);
        Kegiatan k = db.ambil(id);
        if (k == null) return;
        if (!intent.getBooleanExtra(Penjadwal.EXTRA_TUNDA, false) && !k.aktif) return;

        tampilkan(ctx, k);

        // Jadwal berikutnya (hanya untuk alarm utama, bukan alarm tunda).
        if (!intent.getBooleanExtra(Penjadwal.EXTRA_TUNDA, false)) {
            if (k.ulang == Kegiatan.ULANG_TIDAK) {
                k.aktif = false;
            } else {
                k.majukanKeBerikutnya(System.currentTimeMillis());
            }
            db.simpan(k);
            Penjadwal.jadwalkan(ctx, k);
        }
    }

    private void tampilkan(Context ctx, Kegiatan k) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        Penjadwal.buatChannel(ctx);
        int nid = (int) k.id;

        PendingIntent buka = PendingIntent.getActivity(ctx, nid,
                new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String jam = DateFormat.getTimeFormat(ctx).format(k.waktu);
        String isi = "Mulai pukul " + jam;
        if (!TextUtils.isEmpty(k.catatan)) isi += "\n" + k.catatan;

        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(ctx, Penjadwal.CHANNEL_ID)
                : new Notification.Builder(ctx);
        b.setSmallIcon(R.drawable.ic_notif)
                .setColor(ctx.getColor(R.color.primer))
                .setContentTitle(k.judul)
                .setContentText(isi)
                .setStyle(new Notification.BigTextStyle().bigText(isi))
                .setCategory(Notification.CATEGORY_REMINDER)
                .setPriority(Notification.PRIORITY_HIGH)
                .setDefaults(Notification.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(buka)
                .addAction(new Notification.Action.Builder(null,
                        ctx.getString(R.string.tunda), aksi(ctx, AKSI_TUNDA, k.id)).build())
                .addAction(new Notification.Action.Builder(null,
                        ctx.getString(R.string.selesai), aksi(ctx, AKSI_SELESAI, k.id)).build());

        ctx.getSystemService(NotificationManager.class).notify(nid, b.build());
    }

    private static PendingIntent aksi(Context ctx, String aksi, long id) {
        Intent i = new Intent(ctx, AlarmReceiver.class).setAction(aksi).putExtra(Penjadwal.EXTRA_ID, id);
        return PendingIntent.getBroadcast(ctx, (int) id, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
