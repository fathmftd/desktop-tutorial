package com.pengingat.kegiatan;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.text.format.DateFormat;
import android.text.format.DateUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ListView;
import android.widget.Switch;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private final List<Kegiatan> data = new ArrayList<>();
    private Adapter adapter;
    private Database db;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        db = Database.get(this);
        Penjadwal.buatChannel(this);

        ListView daftar = findViewById(R.id.daftar);
        daftar.setEmptyView(findViewById(R.id.kosong));
        adapter = new Adapter();
        daftar.setAdapter(adapter);
        daftar.setOnItemClickListener((p, v, pos, id) -> bukaEditor(data.get(pos).id));
        daftar.setOnItemLongClickListener((p, v, pos, id) -> {
            konfirmasiHapus(data.get(pos));
            return true;
        });
        findViewById(R.id.tombol_tambah).setOnClickListener(v -> bukaEditor(0));

        mintaIzin();
    }

    @Override
    protected void onResume() {
        super.onResume();
        muatUlang();
    }

    private void muatUlang() {
        data.clear();
        data.addAll(db.semua());
        adapter.notifyDataSetChanged();
    }

    private void bukaEditor(long id) {
        startActivity(new Intent(this, EditActivity.class).putExtra(EditActivity.EXTRA_ID, id));
    }

    private void konfirmasiHapus(Kegiatan k) {
        new AlertDialog.Builder(this)
                .setTitle(R.string.hapus)
                .setMessage("Hapus \"" + k.judul + "\"?")
                .setPositiveButton(R.string.hapus, (d, w) -> {
                    Penjadwal.batal(this, k.id);
                    db.hapus(k.id);
                    muatUlang();
                })
                .setNegativeButton(R.string.batal, null)
                .show();
    }

    private void mintaIzin() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                && !getSystemService(AlarmManager.class).canScheduleExactAlarms()) {
            new AlertDialog.Builder(this)
                    .setTitle("Izin alarm")
                    .setMessage("Agar pengingat berbunyi tepat waktu, izinkan aplikasi ini mengatur alarm.")
                    .setPositiveButton("Buka pengaturan", (d, w) -> startActivity(
                            new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                                    Uri.parse("package:" + getPackageName()))))
                    .setNegativeButton("Nanti", null)
                    .show();
        }
    }

    private static String teksUlang(Kegiatan k) {
        switch (k.ulang) {
            case Kegiatan.ULANG_HARIAN: return "Setiap hari";
            case Kegiatan.ULANG_MINGGUAN: return "Setiap minggu";
            case Kegiatan.ULANG_BULANAN: return "Setiap bulan";
            default: return "";
        }
    }

    private class Adapter extends BaseAdapter {
        @Override
        public int getCount() {
            return data.size();
        }

        @Override
        public Kegiatan getItem(int pos) {
            return data.get(pos);
        }

        @Override
        public long getItemId(int pos) {
            return data.get(pos).id;
        }

        @Override
        public View getView(int pos, View v, ViewGroup parent) {
            if (v == null) {
                v = LayoutInflater.from(MainActivity.this).inflate(R.layout.item_kegiatan, parent, false);
            }
            Kegiatan k = getItem(pos);
            TextView jam = v.findViewById(R.id.jam);
            TextView tanggal = v.findViewById(R.id.tanggal);
            TextView judul = v.findViewById(R.id.judul);
            TextView catatan = v.findViewById(R.id.catatan);
            TextView info = v.findViewById(R.id.info);
            Switch aktif = v.findViewById(R.id.aktif);

            jam.setText(DateFormat.getTimeFormat(MainActivity.this).format(k.waktu));
            tanggal.setText(DateUtils.isToday(k.waktu) ? "Hari ini"
                    : DateFormat.format("d MMM", k.waktu));
            judul.setText(k.judul);
            catatan.setText(k.catatan);
            catatan.setVisibility(TextUtils.isEmpty(k.catatan) ? View.GONE : View.VISIBLE);

            List<String> bagian = new ArrayList<>();
            String ulang = teksUlang(k);
            if (!ulang.isEmpty()) bagian.add(ulang);
            if (k.menitSebelum > 0) bagian.add(labelSebelum(k.menitSebelum));
            if (!k.aktif && k.ulang == Kegiatan.ULANG_TIDAK && k.waktu < System.currentTimeMillis()) {
                bagian.add("Sudah lewat");
            }
            info.setText(TextUtils.join(" · ", bagian));
            info.setVisibility(bagian.isEmpty() ? View.GONE : View.VISIBLE);

            int warna = getColor(k.aktif ? R.color.primer : R.color.lewat);
            jam.setTextColor(warna);
            v.setAlpha(k.aktif ? 1f : 0.6f);

            aktif.setOnCheckedChangeListener(null);
            aktif.setChecked(k.aktif);
            aktif.setOnCheckedChangeListener((b, nyala) -> {
                k.aktif = nyala;
                if (nyala) k.majukanKeBerikutnya(System.currentTimeMillis());
                db.simpan(k);
                Penjadwal.jadwalkan(MainActivity.this, k);
                if (nyala && k.waktuPengingat() <= System.currentTimeMillis()) {
                    new AlertDialog.Builder(MainActivity.this)
                            .setMessage("Waktu kegiatan ini sudah lewat. Ubah tanggal/jamnya agar diingatkan lagi.")
                            .setPositiveButton("Ubah", (d, w) -> bukaEditor(k.id))
                            .setNegativeButton(R.string.batal, null)
                            .show();
                }
                muatUlang();
            });
            return v;
        }
    }

    static String labelSebelum(int menit) {
        if (menit >= 24 * 60) return (menit / (24 * 60)) + " hari sebelumnya";
        if (menit >= 60) return (menit / 60) + " jam sebelumnya";
        return menit + " menit sebelumnya";
    }
}
