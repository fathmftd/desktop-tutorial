"""Sesuaikan proyek Android hasil `cap add android`: izin kamera dan ikon aplikasi."""
import shutil
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
android = root / "android" / "app" / "src" / "main"

# Izin kamera untuk scan QR
manifest = android / "AndroidManifest.xml"
text = manifest.read_text()
perms = (
    '    <uses-permission android:name="android.permission.CAMERA" />\n'
    '    <uses-feature android:name="android.hardware.camera" android:required="false" />\n'
)
if "android.permission.CAMERA" not in text:
    text = text.replace("</manifest>", perms + "</manifest>")
    manifest.write_text(text)

# Ikon: pakai ikon PWA untuk semua kepadatan layar
src = Image.open(root.parent / "absensi-bem" / "icons" / "icon-512.png").convert("RGBA")
sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
res = android / "res"
shutil.rmtree(res / "mipmap-anydpi-v26", ignore_errors=True)
for dpi, size in sizes.items():
    folder = res / f"mipmap-{dpi}"
    folder.mkdir(parents=True, exist_ok=True)
    icon = src.resize((size, size), Image.LANCZOS)
    for name in ("ic_launcher.png", "ic_launcher_round.png"):
        icon.save(folder / name)
    for extra in ("ic_launcher_foreground.png", "ic_launcher_background.png"):
        (folder / extra).unlink(missing_ok=True)

# Layar pembuka: ikon di tengah latar ungu
for splash in res.glob("drawable*/splash.png"):
    w, h = Image.open(splash).size
    bg = Image.new("RGBA", (w, h), (79, 70, 229, 255))
    size = min(w, h) // 3
    bg.alpha_composite(src.resize((size, size), Image.LANCZOS), ((w - size) // 2, (h - size) // 2))
    bg.convert("RGB").save(splash)

print("Android project disiapkan: izin kamera + ikon.")
