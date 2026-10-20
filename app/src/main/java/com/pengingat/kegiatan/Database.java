package com.pengingat.kegiatan;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.util.ArrayList;
import java.util.List;

/** Penyimpanan kegiatan di SQLite. */
public class Database extends SQLiteOpenHelper {
    private static final String NAMA = "kegiatan.db";
    private static final int VERSI = 1;
    private static final String TABEL = "kegiatan";

    private static Database instance;

    public static synchronized Database get(Context context) {
        if (instance == null) instance = new Database(context.getApplicationContext());
        return instance;
    }

    private Database(Context context) {
        super(context, NAMA, null, VERSI);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE " + TABEL + " ("
                + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                + "judul TEXT NOT NULL,"
                + "catatan TEXT NOT NULL DEFAULT '',"
                + "waktu INTEGER NOT NULL,"
                + "ulang INTEGER NOT NULL DEFAULT 0,"
                + "menit_sebelum INTEGER NOT NULL DEFAULT 0,"
                + "tanggal_bulanan INTEGER NOT NULL DEFAULT 0,"
                + "aktif INTEGER NOT NULL DEFAULT 1)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int lama, int baru) {
    }

    public List<Kegiatan> semua() {
        List<Kegiatan> hasil = new ArrayList<>();
        try (Cursor c = getReadableDatabase().query(TABEL, null, null, null, null, null,
                "aktif DESC, waktu ASC")) {
            while (c.moveToNext()) hasil.add(dariCursor(c));
        }
        return hasil;
    }

    public Kegiatan ambil(long id) {
        try (Cursor c = getReadableDatabase().query(TABEL, null, "id=?",
                new String[]{String.valueOf(id)}, null, null, null)) {
            return c.moveToFirst() ? dariCursor(c) : null;
        }
    }

    public void simpan(Kegiatan k) {
        ContentValues v = new ContentValues();
        v.put("judul", k.judul);
        v.put("catatan", k.catatan);
        v.put("waktu", k.waktu);
        v.put("ulang", k.ulang);
        v.put("menit_sebelum", k.menitSebelum);
        v.put("tanggal_bulanan", k.tanggalBulanan);
        v.put("aktif", k.aktif ? 1 : 0);
        SQLiteDatabase db = getWritableDatabase();
        if (k.id == 0) {
            k.id = db.insert(TABEL, null, v);
        } else {
            db.update(TABEL, v, "id=?", new String[]{String.valueOf(k.id)});
        }
    }

    public void hapus(long id) {
        getWritableDatabase().delete(TABEL, "id=?", new String[]{String.valueOf(id)});
    }

    private static Kegiatan dariCursor(Cursor c) {
        Kegiatan k = new Kegiatan();
        k.id = c.getLong(c.getColumnIndexOrThrow("id"));
        k.judul = c.getString(c.getColumnIndexOrThrow("judul"));
        k.catatan = c.getString(c.getColumnIndexOrThrow("catatan"));
        k.waktu = c.getLong(c.getColumnIndexOrThrow("waktu"));
        k.ulang = c.getInt(c.getColumnIndexOrThrow("ulang"));
        k.menitSebelum = c.getInt(c.getColumnIndexOrThrow("menit_sebelum"));
        k.tanggalBulanan = c.getInt(c.getColumnIndexOrThrow("tanggal_bulanan"));
        k.aktif = c.getInt(c.getColumnIndexOrThrow("aktif")) == 1;
        return k;
    }
}
