// Menyalin file aplikasi web ke folder dist/ untuk dibungkus Capacitor menjadi APK.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const entries = ['index.html', 'manifest.webmanifest', 'sw.js', 'icons', 'vendor'];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist);
for (const entry of entries) {
    fs.cpSync(path.join(root, entry), path.join(dist, entry), { recursive: true });
}
console.log('Web app disalin ke dist/');
