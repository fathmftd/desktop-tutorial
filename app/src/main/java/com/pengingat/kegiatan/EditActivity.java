package com.pengingat.kegiatan;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.os.Bundle;
import android.text.format.DateFormat;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;

import java.util.Calendar;

public class EditActivity extends Activity {
    public static final String EXTRA_ID = "id";
    private static final int MENU_HAPUS = 1;

    private Database db;
    private Kegiatan kegiatan;
    private final Calendar waktu = Calendar.getInstance();

    private EditText inputJudul;
    private EditText inputCatatan;
    private Button tombolTanggal;
    private Button tombolJam;
    private Spinner pilihUlang;
    private Spinner pilihSebelum;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_edit);
        if (getActionBar() != null) getActionBar().setDisplayHomeAsUpEnabled(true);
        db = Database.get(this);

        inputJudul = findViewById(R.id.input_judul);
        inputCatatan = findViewById(R.id.input_catatan);
        tombolTanggal = findViewById(R.id.pilih_tanggal);
        tombolJam = findViewById(R.id.pilih_jam);
        pilihUlang = findViewById(R.id.pilih_ulang);
        pilihSebelum = findViewById(R.id.pilih_sebelum);

        long id = getIntent().getLongExtra(EXTRA_ID, 0);
        kegiatan = id != 0 ? db.ambil(id) : null;
        if (kegiatan == null) {
            kegiatan = new Kegiatan();
            setTitle(R.string.judul_baru);
            // Bawaan: satu jam dari sekarang, dibulatkan ke jam penuh.
            waktu.add(Calendar.HOUR_OF_DAY, 1);
            waktu.set(Calendar.MINUTE, 0);
        } else {
            setTitle(R.string.judul_ubah);
            waktu.setTimeInMillis(kegiatan.waktu);
            inputJudul.setText(kegiatan.judul);
            inputCatatan.setText(kegiatan.catatan);
            pilihUlang.setSelection(kegiatan.ulang);
            pilihSebelum.setSelection(indeksSebelum(kegiatan.menitSebelum));
        }
        waktu.set(Calendar.SECOND, 0);
        waktu.set(Calendar.MILLISECOND, 0);
        tampilkanWaktu();

        tombolTanggal.setOnClickListener(v -> new DatePickerDialog(this, (dp, th, bl, hr) -> {
            waktu.set(th, bl, hr);
            tampilkanWaktu();
        }, waktu.get(Calendar.YEAR), waktu.get(Calendar.MONTH), waktu.get(Calendar.DAY_OF_MONTH)).show());

        tombolJam.setOnClickListener(v -> new TimePickerDialog(this, (tp, j, m) -> {
            waktu.set(Calendar.HOUR_OF_DAY, j);
            waktu.set(Calendar.MINUTE, m);
            tampilkanWaktu();
        }, waktu.get(Calendar.HOUR_OF_DAY), waktu.get(Calendar.MINUTE),
                DateFormat.is24HourFormat(this)).show());

        findViewById(R.id.tombol_simpan).setOnClickListener(v -> simpan());
    }

    private void tampilkanWaktu() {
        tombolTanggal.setText(DateFormat.format("EEEE, d MMM yyyy", waktu));
        tombolJam.setText(DateFormat.getTimeFormat(this).format(waktu.getTime()));
    }

    private static int indeksSebelum(int menit) {
        for (int i = 0; i < Kegiatan.MENIT_SEBELUM.length; i++) {
            if (Kegiatan.MENIT_SEBELUM[i] == menit) return i;
        }
        return 0;
    }

    private void simpan() {
        String judul = inputJudul.getText().toString().trim();
        if (judul.isEmpty()) {
            inputJudul.setError("Nama kegiatan wajib diisi");
            inputJudul.requestFocus();
            return;
        }
        kegiatan.judul = judul;
        kegiatan.catatan = inputCatatan.getText().toString().trim();
        kegiatan.waktu = waktu.getTimeInMillis();
        kegiatan.ulang = pilihUlang.getSelectedItemPosition();
        kegiatan.menitSebelum = Kegiatan.MENIT_SEBELUM[pilihSebelum.getSelectedItemPosition()];
        kegiatan.tanggalBulanan = waktu.get(Calendar.DAY_OF_MONTH);
        kegiatan.aktif = true;
        kegiatan.majukanKeBerikutnya(System.currentTimeMillis());

        db.simpan(kegiatan);
        Penjadwal.jadwalkan(this, kegiatan);

        if (kegiatan.waktuPengingat() <= System.currentTimeMillis()) {
            Toast.makeText(this, "Disimpan, tapi waktunya sudah lewat sehingga tidak akan diingatkan.",
                    Toast.LENGTH_LONG).show();
        } else {
            Toast.makeText(this, "Pengingat diatur "
                    + DateUtilsTeks.relatif(kegiatan.waktuPengingat()), Toast.LENGTH_SHORT).show();
        }
        finish();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        if (kegiatan != null && kegiatan.id != 0) {
            menu.add(0, MENU_HAPUS, 0, R.string.hapus).setShowAsAction(MenuItem.SHOW_AS_ACTION_ALWAYS);
        }
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
            return true;
        }
        if (item.getItemId() == MENU_HAPUS) {
            new AlertDialog.Builder(this)
                    .setMessage("Hapus kegiatan ini?")
                    .setPositiveButton(R.string.hapus, (d, w) -> {
                        Penjadwal.batal(this, kegiatan.id);
                        db.hapus(kegiatan.id);
                        finish();
                    })
                    .setNegativeButton(R.string.batal, null)
                    .show();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
