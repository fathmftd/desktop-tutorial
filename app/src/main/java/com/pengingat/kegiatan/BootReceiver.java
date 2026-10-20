package com.pengingat.kegiatan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Alarm hilang setelah HP dinyalakan ulang, jadi pasang lagi semuanya. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        Penjadwal.jadwalkanSemua(ctx);
    }
}
