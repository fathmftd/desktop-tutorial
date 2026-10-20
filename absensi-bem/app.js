/* Absensi BEM — aplikasi absensi berbasis QR (tanpa server, data di localStorage) */
(() => {
  'use strict';

  // ---------- Utilitas ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const STORE_KEY = 'absensiBem.v1';
  const QR_PREFIX = 'BEM:';
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const BLN = BULAN.map(b => b.slice(0, 3));
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const STATUS_LABEL = { hadir: 'Hadir', terlambat: 'Terlambat', izin: 'Izin', sakit: 'Sakit', alpha: 'Alpha' };
  const COLORS = { hadir: '#10b981', terlambat: '#f59e0b', izin: '#3b82f6', alpha: '#ef4444' };
  const AVATAR_GRADS = [
    ['#6366f1', '#8b5cf6'], ['#ec4899', '#f43f5e'], ['#10b981', '#14b8a6'], ['#f59e0b', '#ef4444'],
    ['#3b82f6', '#06b6d4'], ['#8b5cf6', '#d946ef'], ['#0ea5e9', '#6366f1'], ['#84cc16', '#10b981'],
  ];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = () => dateStr(new Date());
  const monthStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmtDate = s => { const d = parseDate(s); return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtShort = s => { const d = parseDate(s); return `${d.getDate()} ${BLN[d.getMonth()]}`; };
  const fmtMonth = ym => { const [y, m] = ym.split('-').map(Number); return `${BULAN[m - 1]} ${y}`; };
  const fmtTime = iso => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = name => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const avatar = (m, cls = '') => {
    const [a, b] = AVATAR_GRADS[hash(m.id) % AVATAR_GRADS.length];
    return `<div class="avatar ${cls}" style="background:linear-gradient(135deg,${a},${b})">${esc(initials(m.nama))}</div>`;
  };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  // ---------- Penyimpanan ----------
  const defaultState = () => ({
    settings: { org: 'BEM Universitas', periode: '2026/2027', tol: 15 },
    members: [], events: [], att: [],
  });
  let state;
  try { state = { ...defaultState(), ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; }
  catch { state = defaultState(); }
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch { toast('Gagal menyimpan data ke perangkat', 'error'); }
  };

  const memberById = id => state.members.find(m => m.id === id);
  const eventById = id => state.events.find(e => e.id === id);
  const recordOf = (eventId, memberId) => state.att.find(a => a.eventId === eventId && a.memberId === memberId);
  const eventsInMonth = ym => state.events.filter(e => e.tanggal.startsWith(ym)).sort((a, b) => (a.tanggal + a.jam).localeCompare(b.tanggal + b.jam));
  const divisions = () => [...new Set(state.members.map(m => m.divisi).filter(Boolean))].sort();

  // Anggota hanya "wajib hadir" untuk agenda yang sudah lewat/hari ini dan setelah ia bergabung.
  const isCounted = (ev, m) => ev.tanggal <= todayStr() && ev.tanggal >= (m.bergabung || '0000');
  const statusOf = (ev, m) => {
    const r = recordOf(ev.id, m.id);
    if (r) return r.status;
    return isCounted(ev, m) ? 'alpha' : null;
  };
  const membersForEvent = ev => state.members.filter(m => ev.tanggal >= (m.bergabung || '0000'));

  function memberMonthStats(m, ym) {
    const s = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, total: 0 };
    eventsInMonth(ym).forEach(ev => {
      if (!isCounted(ev, m) && !recordOf(ev.id, m.id)) return;
      const st = statusOf(ev, m);
      if (!st) return;
      s[st]++; s.total++;
    });
    s.present = s.hadir + s.terlambat;
    s.rate = pct(s.present, s.total);
    return s;
  }

  function eventStats(ev) {
    const ms = membersForEvent(ev);
    const present = ms.filter(m => ['hadir', 'terlambat'].includes(recordOf(ev.id, m.id)?.status)).length;
    return { present, total: ms.length, rate: pct(present, ms.length) };
  }

  // ---------- Toast, suara, modal ----------
  function toast(msg, type = 'info', icon) {
    const ic = icon || { success: '✅', warn: '⚠️', error: '⛔', info: 'ℹ️' }[type];
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span style="font-size:1.4rem">${ic}</span><div>${msg}</div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
  }

  let audioCtx;
  function beep(ok = true) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = ok ? 1046 : 220;
      g.gain.setValueAtTime(0.2, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (ok ? 0.18 : 0.35));
      o.connect(g).connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + 0.4);
      if (navigator.vibrate) navigator.vibrate(ok ? 80 : [60, 60, 60]);
    } catch { /* audio tidak tersedia */ }
  }

  function openModal(html, onMount) {
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
    if (onMount) onMount($('#modalBody'));
  }
  const closeModal = () => { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; };
  $$('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ---------- Grafik ----------
  const charts = {};
  function drawChart(id, config) {
    if (typeof Chart === 'undefined') return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), config);
  }
  if (typeof Chart !== 'undefined') {
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    Chart.defaults.font.family = '"Plus Jakarta Sans", system-ui, sans-serif';
    Chart.defaults.color = dark ? '#a3a0c2' : '#6b7280';
    Chart.defaults.borderColor = dark ? 'rgba(165,160,255,.12)' : 'rgba(99,102,241,.1)';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.maintainAspectRatio = false;
  }

  // ---------- Navigasi ----------
  let currentPage = 'dashboard';
  function go(page) {
    if (currentPage === 'scan' && page !== 'scan') stopScanner();
    currentPage = page;
    $$('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    render[page]?.();
  }
  $$('.nav-item').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-goto]');
    if (g) go(g.dataset.goto);
  });

  const render = {};

  // ---------- Dashboard ----------
  render.dashboard = () => {
    const ym = monthStr();
    const evs = eventsInMonth(ym);
    $('#todayLabel').textContent = fmtDate(todayStr());
    $('#dashMonthLabel').textContent = fmtMonth(ym);
    $('#stMembers').textContent = state.members.length;
    $('#stEvents').textContent = evs.length;
    const rates = state.members.map(m => memberMonthStats(m, ym)).filter(s => s.total);
    $('#stRate').textContent = (rates.length ? Math.round(rates.reduce((a, s) => a + s.rate, 0) / rates.length) : 0) + '%';
    $('#stToday').textContent = state.att.filter(a => a.waktu?.startsWith(todayStr())).length;

    const past = evs.filter(e => e.tanggal <= todayStr());
    $('#trendEmpty').hidden = past.length > 0;
    drawChart('chartTrend', {
      type: 'line',
      data: {
        labels: past.map(e => `${fmtShort(e.tanggal)} · ${e.judul.length > 16 ? e.judul.slice(0, 15) + '…' : e.judul}`),
        datasets: [{
          label: 'Kehadiran (%)',
          data: past.map(e => eventStats(e).rate),
          borderColor: '#7c3aed', borderWidth: 3, tension: 0.4, fill: true,
          pointBackgroundColor: '#fff', pointBorderColor: '#7c3aed', pointBorderWidth: 3, pointRadius: 5,
          backgroundColor: ctx => {
            const { chartArea, ctx: c } = ctx.chart;
            if (!chartArea) return 'rgba(124,58,237,.15)';
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, 'rgba(124,58,237,.35)'); g.addColorStop(1, 'rgba(124,58,237,0)');
            return g;
          },
        }],
      },
      options: {
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.y}% hadir` } } },
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } }, x: { grid: { display: false } } },
      },
    });

    const upcoming = state.events.filter(e => e.tanggal >= todayStr()).sort((a, b) => (a.tanggal + a.jam).localeCompare(b.tanggal + b.jam)).slice(0, 5);
    $('#upcomingList').innerHTML = upcoming.length ? upcoming.map(eventListItem).join('')
      : `<div class="empty">Belum ada agenda mendatang.<br><button class="btn btn-ghost btn-sm" data-goto="agenda">＋ Buat agenda</button></div>`;

    const top = state.members.map(m => ({ m, s: memberMonthStats(m, ym) })).filter(x => x.s.total)
      .sort((a, b) => b.s.rate - a.s.rate || b.s.hadir - a.s.hadir).slice(0, 6);
    const medal = ['🥇', '🥈', '🥉'];
    $('#topMembers').innerHTML = top.length ? top.map((x, i) => `
      <div class="top-member">
        <div class="rank">${medal[i] || i + 1}</div>${avatar(x.m)}
        <div class="grow"><div style="font-weight:700;font-size:.9rem">${esc(x.m.nama)}</div>
        <div class="muted small" style="margin:0">${x.s.present}/${x.s.total} agenda · <b style="color:var(--hadir)">${x.s.rate}%</b></div></div>
      </div>`).join('')
      : `<div class="empty">Belum ada data kehadiran bulan ini.</div>`;
  };

  function eventListItem(e) {
    const d = parseDate(e.tanggal);
    const isToday = e.tanggal === todayStr();
    return `<div class="list-item">
      <div class="date-pill"><b>${d.getDate()}</b><small>${BLN[d.getMonth()]}</small></div>
      <div class="grow"><div class="t">${esc(e.judul)}</div>
        <div class="s">${esc(e.jam)} · ${esc(e.lokasi || '-')} ${isToday ? '· <b style="color:var(--hadir)">Hari ini</b>' : ''}</div></div>
      <span class="badge ${e.jenis.toLowerCase()}">${esc(e.jenis)}</span>
      <button class="icon-btn" title="Scan" data-scan="${e.id}">📷</button>
    </div>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-scan]');
    if (b) { selectedEventId = b.dataset.scan; go('scan'); }
  });

  // ---------- Scan ----------
  let scanner = null, selectedEventId = null, lastScan = { text: '', at: 0 };

  render.scan = () => {
    const evs = [...state.events].sort((a, b) => (b.tanggal + b.jam).localeCompare(a.tanggal + a.jam));
    if (!selectedEventId || !eventById(selectedEventId)) {
      const today = evs.find(e => e.tanggal === todayStr());
      const next = [...evs].reverse().find(e => e.tanggal >= todayStr());
      selectedEventId = (today || next || evs[0])?.id || null;
    }
    $('#scanEvent').innerHTML = evs.length
      ? evs.map(e => `<option value="${e.id}" ${e.id === selectedEventId ? 'selected' : ''}>${fmtShort(e.tanggal)} — ${esc(e.judul)}</option>`).join('')
      : '<option value="">Belum ada agenda — buat dulu di menu Agenda</option>';
    $('#manualMember').innerHTML = state.members.length
      ? [...state.members].sort((a, b) => a.nama.localeCompare(b.nama)).map(m => `<option value="${m.id}">${esc(m.nama)}${m.nim ? ' (' + esc(m.nim) + ')' : ''}</option>`).join('')
      : '<option value="">Belum ada anggota</option>';
    renderScanPanel();
  };

  function renderScanPanel() {
    const ev = eventById(selectedEventId);
    $('#btnStartScan').disabled = !ev;
    if (!ev) {
      $('#scanEventInfo').innerHTML = '';
      $('#scanList').innerHTML = '<div class="empty">Pilih agenda terlebih dahulu.</div>';
      $('#scanCount').textContent = '0 / 0';
      $('#scanProgress').style.width = '0';
      return;
    }
    $('#scanEventInfo').innerHTML = `<span class="badge ${ev.jenis.toLowerCase()}">${esc(ev.jenis)}</span>
      <b style="margin-left:6px">${esc(ev.judul)}</b><br>
      <span class="muted">📅 ${fmtDate(ev.tanggal)} · 🕒 ${esc(ev.jam)} (toleransi ${ev.toleransi} menit) · 📍 ${esc(ev.lokasi || '-')}</span>`;
    const st = eventStats(ev);
    $('#scanCount').textContent = `${st.present} / ${st.total} hadir`;
    $('#scanProgress').style.width = st.rate + '%';
    const recs = state.att.filter(a => a.eventId === ev.id).sort((a, b) => b.waktu.localeCompare(a.waktu));
    $('#scanList').innerHTML = recs.length ? recs.map((r, i) => {
      const m = memberById(r.memberId);
      if (!m) return '';
      return `<div class="list-item ${i === 0 && r.waktu > new Date(Date.now() - 4000).toISOString() ? 'fresh' : ''}">
        ${avatar(m)}
        <div class="grow"><div class="t">${esc(m.nama)}</div><div class="s">${esc(m.jabatan || '')} · ${fmtTime(r.waktu)} · ${r.metode === 'qr' ? 'QR' : 'Manual'}</div></div>
        <span class="badge ${r.status}">${STATUS_LABEL[r.status]}</span>
        <button class="icon-btn" title="Hapus" data-unatt="${r.memberId}">✕</button>
      </div>`;
    }).join('') : '<div class="empty">Belum ada yang absen. Mulai scan! 🚀</div>';
  }

  $('#scanEvent').addEventListener('change', e => { selectedEventId = e.target.value; renderScanPanel(); });
  $('#scanList').addEventListener('click', e => {
    const b = e.target.closest('[data-unatt]');
    if (!b) return;
    const m = memberById(b.dataset.unatt);
    if (!confirm(`Hapus absensi ${m?.nama || ''}?`)) return;
    state.att = state.att.filter(a => !(a.eventId === selectedEventId && a.memberId === b.dataset.unatt));
    save(); renderScanPanel();
  });

  function setAttendance(ev, m, status, metode) {
    const existing = recordOf(ev.id, m.id);
    if (existing) Object.assign(existing, { status, metode, waktu: new Date().toISOString() });
    else state.att.push({ eventId: ev.id, memberId: m.id, status, metode, waktu: new Date().toISOString() });
    save();
  }

  function autoStatus(ev) {
    if (ev.tanggal !== todayStr()) return 'hadir';
    const [h, mi] = ev.jam.split(':').map(Number);
    const limit = parseDate(ev.tanggal);
    limit.setHours(h, mi + Number(ev.toleransi || 0), 0, 0);
    return new Date() > limit ? 'terlambat' : 'hadir';
  }

  function onScan(text) {
    const now = Date.now();
    if (text === lastScan.text && now - lastScan.at < 3000) return;
    lastScan = { text, at: now };
    const ev = eventById(selectedEventId);
    if (!ev) return;
    const raw = text.trim();
    const id = raw.startsWith(QR_PREFIX) ? raw.slice(QR_PREFIX.length) : raw;
    const m = memberById(id) || state.members.find(x => x.nim && x.nim === raw);
    if (!m) { beep(false); toast('QR tidak dikenali sebagai kartu anggota.', 'error'); return; }
    const rec = recordOf(ev.id, m.id);
    if (rec) { beep(false); toast(`<b>${esc(m.nama)}</b> sudah tercatat (${STATUS_LABEL[rec.status]}).`, 'warn'); return; }
    const status = autoStatus(ev);
    setAttendance(ev, m, status, 'qr');
    beep(true);
    const wrap = $('.scanner-wrap');
    wrap.classList.remove('flash'); void wrap.offsetWidth; wrap.classList.add('flash');
    toast(`<b>${esc(m.nama)}</b><br>${status === 'hadir' ? 'Hadir tepat waktu 🎉' : 'Tercatat terlambat ⏰'}`, status === 'hadir' ? 'success' : 'warn');
    renderScanPanel();
  }

  async function startScanner() {
    if (typeof Html5Qrcode === 'undefined') { toast('Library scanner gagal dimuat. Periksa koneksi internet.', 'error'); return; }
    try {
      scanner = scanner || new Html5Qrcode('reader', { verbose: false });
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s }; } },
        onScan, () => {},
      );
      $('#scannerPlaceholder').hidden = true;
      $('#btnStartScan').hidden = true;
      $('#btnStopScan').hidden = false;
    } catch (err) {
      toast('Tidak bisa mengakses kamera. Pastikan izin kamera diberikan dan halaman dibuka lewat HTTPS.', 'error');
      console.error(err);
    }
  }
  async function stopScanner() {
    if (scanner?.isScanning) { try { await scanner.stop(); } catch { /* sudah berhenti */ } }
    $('#scannerPlaceholder').hidden = false;
    $('#btnStartScan').hidden = false;
    $('#btnStopScan').hidden = true;
  }
  // Alternatif: foto QR lewat kamera bawaan HP / galeri (berguna jika kamera langsung diblokir browser).
  $('#scanPhoto').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    e.target.value = '';
    if (!eventById(selectedEventId)) { toast('Pilih agenda terlebih dahulu.', 'warn'); return; }
    if (typeof Html5Qrcode === 'undefined') { toast('Library scanner gagal dimuat. Periksa koneksi internet.', 'error'); return; }
    if (scanner?.isScanning) await stopScanner();
    try {
      const text = await new Html5Qrcode('reader-file', { verbose: false }).scanFile(file, false);
      lastScan = { text: '', at: 0 };
      onScan(text);
    } catch {
      beep(false); toast('QR tidak terbaca di foto. Coba foto lebih dekat & terang.', 'error');
    }
  });
  $('#btnStartScan').addEventListener('click', startScanner);
  $('#btnStopScan').addEventListener('click', stopScanner);

  $('#btnManual').addEventListener('click', () => {
    const ev = eventById(selectedEventId), m = memberById($('#manualMember').value);
    if (!ev || !m) { toast('Pilih agenda dan anggota terlebih dahulu.', 'warn'); return; }
    const status = $('#manualStatus').value;
    setAttendance(ev, m, status, 'manual');
    toast(`<b>${esc(m.nama)}</b> dicatat ${STATUS_LABEL[status]}.`, 'success');
    renderScanPanel();
  });

  // ---------- Agenda ----------
  let agendaType = '';
  $('#agendaMonth').value = monthStr();
  $('#agendaMonth').addEventListener('change', () => render.agenda());
  $$('#agendaFilter button').forEach(b => b.addEventListener('click', () => {
    $$('#agendaFilter button').forEach(x => x.classList.toggle('active', x === b));
    agendaType = b.dataset.v; render.agenda();
  }));

  render.agenda = () => {
    const ym = $('#agendaMonth').value || monthStr();
    const evs = eventsInMonth(ym).filter(e => !agendaType || e.jenis === agendaType).reverse();
    $('#eventList').innerHTML = evs.length ? evs.map(e => {
      const d = parseDate(e.tanggal), st = eventStats(e);
      const upcoming = e.tanggal > todayStr();
      return `<div class="card event-card">
        <div class="top">
          <div class="date-pill"><b>${d.getDate()}</b><small>${BLN[d.getMonth()]}</small></div>
          <div class="grow">
            <div class="title">${esc(e.judul)}</div>
            <div class="meta">${HARI[d.getDay()]} · 🕒 ${esc(e.jam)} · 📍 ${esc(e.lokasi || '-')}</div>
          </div>
          <span class="badge ${e.jenis.toLowerCase()}">${esc(e.jenis)}</span>
        </div>
        <div class="member-rate"><div class="progress"><div style="width:${st.rate}%"></div></div>
          <span>${upcoming ? 'Akan datang' : `${st.present}/${st.total} hadir (${st.rate}%)`}</span></div>
        <div class="actions">
          <button class="btn btn-primary btn-sm" data-scan="${e.id}">📷 Scan</button>
          <button class="btn btn-secondary btn-sm" data-ev-detail="${e.id}">📋 Rekap</button>
          <button class="icon-btn" title="Edit" data-ev-edit="${e.id}">✏️</button>
          <button class="icon-btn" title="Hapus" data-ev-del="${e.id}">🗑️</button>
        </div>
      </div>`;
    }).join('') : `<div class="card empty" style="grid-column:1/-1">Tidak ada agenda di ${fmtMonth(ym)}.<br><br>
        <button class="btn btn-primary btn-sm" id="emptyAddEvent">＋ Buat Agenda</button></div>`;
    $('#emptyAddEvent')?.addEventListener('click', () => eventForm());
  };

  $('#eventList').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.evEdit) eventForm(eventById(t.dataset.evEdit));
    if (t.dataset.evDetail) eventDetail(eventById(t.dataset.evDetail));
    if (t.dataset.evDel) {
      const ev = eventById(t.dataset.evDel);
      if (!confirm(`Hapus agenda "${ev.judul}" beserta data absensinya?`)) return;
      state.events = state.events.filter(x => x.id !== ev.id);
      state.att = state.att.filter(a => a.eventId !== ev.id);
      save(); render.agenda(); toast('Agenda dihapus.', 'info', '🗑️');
    }
  });
  $('#btnAddEvent').addEventListener('click', () => eventForm());

  function eventForm(ev) {
    const v = ev || { judul: '', jenis: 'Rapat', tanggal: todayStr(), jam: '19:00', lokasi: '', toleransi: state.settings.tol };
    openModal(`
      <h2>${ev ? 'Edit Agenda' : 'Agenda Baru'}</h2>
      <form id="evForm">
        <label class="field"><span>Nama Agenda</span><input name="judul" required placeholder="cth. Rapat Pleno Bulanan" value="${esc(v.judul)}"></label>
        <div class="form-grid">
          <label class="field"><span>Jenis</span><select name="jenis">
            <option ${v.jenis === 'Rapat' ? 'selected' : ''}>Rapat</option>
            <option ${v.jenis === 'Kegiatan' ? 'selected' : ''}>Kegiatan</option></select></label>
          <label class="field"><span>Lokasi</span><input name="lokasi" placeholder="Sekretariat BEM" value="${esc(v.lokasi)}"></label>
          <label class="field"><span>Tanggal</span><input type="date" name="tanggal" required value="${esc(v.tanggal)}"></label>
          <label class="field"><span>Jam Mulai</span><input type="time" name="jam" required value="${esc(v.jam)}"></label>
        </div>
        <label class="field"><span>Toleransi terlambat (menit)</span><input type="number" min="0" name="toleransi" value="${esc(v.toleransi)}"></label>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" data-close-btn>Batal</button>
          <button class="btn btn-primary">${ev ? 'Simpan Perubahan' : 'Buat Agenda'}</button>
        </div>
      </form>`, body => {
      $('[data-close-btn]', body).addEventListener('click', closeModal);
      $('#evForm', body).addEventListener('submit', e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target));
        f.judul = f.judul.trim();
        f.toleransi = Number(f.toleransi) || 0;
        if (ev) Object.assign(ev, f);
        else state.events.push({ id: uid(), ...f });
        save(); closeModal();
        $('#agendaMonth').value = f.tanggal.slice(0, 7);
        render.agenda();
        toast(ev ? 'Agenda diperbarui.' : 'Agenda berhasil dibuat!', 'success');
      });
    });
  }

  function eventDetail(ev) {
    const ms = membersForEvent(ev).sort((a, b) => a.nama.localeCompare(b.nama));
    const opts = st => ['hadir', 'terlambat', 'izin', 'sakit', 'alpha'].map(s => `<option value="${s}" ${s === st ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('');
    const st = eventStats(ev);
    openModal(`
      <h2>📋 ${esc(ev.judul)}</h2>
      <p class="muted small" style="margin-top:-12px">${fmtDate(ev.tanggal)} · ${esc(ev.jam)} · ${st.present}/${st.total} hadir</p>
      <div id="attRows" style="margin:12px 0">${ms.length ? ms.map(m => {
        const r = recordOf(ev.id, m.id);
        return `<div class="att-row">${avatar(m)}
          <div class="grow"><div style="font-weight:700;font-size:.9rem">${esc(m.nama)}</div>
          <div class="muted small" style="margin:0">${r ? fmtTime(r.waktu) + ' · ' + (r.metode === 'qr' ? 'QR' : 'Manual') : 'Belum absen'}</div></div>
          <select data-mid="${m.id}">${r ? '' : '<option value="" selected>—</option>'}${opts(r?.status)}</select></div>`;
      }).join('') : '<div class="empty">Belum ada anggota.</div>'}</div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="btnEvCsv">📄 Unduh CSV</button>
        <button class="btn btn-primary" data-close-btn>Selesai</button>
      </div>`, body => {
      $('[data-close-btn]', body).addEventListener('click', () => { closeModal(); render[currentPage]?.(); });
      $('#attRows', body).addEventListener('change', e => {
        const m = memberById(e.target.dataset.mid);
        const v = e.target.value;
        if (!v) return;
        if (v === 'alpha') state.att = state.att.filter(a => !(a.eventId === ev.id && a.memberId === m.id));
        else setAttendance(ev, m, v, 'manual');
        save(); toast(`${esc(m.nama)}: ${STATUS_LABEL[v]}`, 'success');
      });
      $('#btnEvCsv', body).addEventListener('click', () => {
        const rows = [['Nama', 'NIM', 'Jabatan', 'Divisi', 'Status', 'Waktu', 'Metode']];
        ms.forEach(m => {
          const r = recordOf(ev.id, m.id);
          rows.push([m.nama, m.nim, m.jabatan, m.divisi, STATUS_LABEL[r?.status || 'alpha'], r ? fmtTime(r.waktu) : '', r?.metode || '']);
        });
        downloadCsv(rows, `absensi-${ev.tanggal}-${ev.judul}.csv`);
      });
    });
  }

  // ---------- Anggota ----------
  $('#memberSearch').addEventListener('input', () => render.anggota());
  $('#memberDivFilter').addEventListener('change', () => render.anggota());

  render.anggota = () => {
    const sel = $('#memberDivFilter').value;
    $('#memberDivFilter').innerHTML = '<option value="">Semua Divisi</option>' + divisions().map(d => `<option ${d === sel ? 'selected' : ''}>${esc(d)}</option>`).join('');
    const q = $('#memberSearch').value.toLowerCase().trim();
    const ym = monthStr();
    const list = state.members
      .filter(m => !sel || m.divisi === sel)
      .filter(m => !q || [m.nama, m.nim, m.divisi, m.jabatan].some(x => (x || '').toLowerCase().includes(q)))
      .sort((a, b) => a.nama.localeCompare(b.nama));
    $('#memberList').innerHTML = list.length ? list.map(m => {
      const s = memberMonthStats(m, ym);
      return `<div class="card member-card">
        <div class="member-top">${avatar(m, 'lg')}
          <div class="grow" style="min-width:0">
            <div class="name">${esc(m.nama)}</div>
            <div class="meta">${esc(m.jabatan || 'Anggota')}${m.divisi ? ' · ' + esc(m.divisi) : ''}</div>
            <div class="meta">${m.nim ? 'NIM ' + esc(m.nim) : ''}</div>
          </div>
        </div>
        <div class="member-rate"><div class="progress"><div style="width:${s.rate}%"></div></div><span>${s.total ? s.rate + '% bulan ini' : 'Belum ada data'}</span></div>
        <div class="member-actions">
          <button class="btn btn-primary btn-sm" data-m-qr="${m.id}">🔳 Kartu QR</button>
          <button class="btn btn-secondary btn-sm" data-m-chart="${m.id}">📊 Grafik</button>
          <button class="icon-btn" title="Edit" data-m-edit="${m.id}">✏️</button>
          <button class="icon-btn" title="Hapus" data-m-del="${m.id}">🗑️</button>
        </div>
      </div>`;
    }).join('') : `<div class="card empty" style="grid-column:1/-1">${state.members.length ? 'Tidak ada anggota yang cocok.' : 'Belum ada anggota.<br><br><button class="btn btn-primary btn-sm" id="emptyAddMember">＋ Tambah Anggota Pertama</button>'}</div>`;
    $('#emptyAddMember')?.addEventListener('click', () => memberForm());
  };

  $('#memberList').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.mQr) showQrCard(memberById(t.dataset.mQr));
    if (t.dataset.mEdit) memberForm(memberById(t.dataset.mEdit));
    if (t.dataset.mChart) { grafikMemberId = t.dataset.mChart; go('grafik'); }
    if (t.dataset.mDel) {
      const m = memberById(t.dataset.mDel);
      if (!confirm(`Hapus anggota "${m.nama}" beserta riwayat absensinya?`)) return;
      state.members = state.members.filter(x => x.id !== m.id);
      state.att = state.att.filter(a => a.memberId !== m.id);
      save(); render.anggota(); toast('Anggota dihapus.', 'info', '🗑️');
    }
  });
  $('#btnAddMember').addEventListener('click', () => memberForm());

  function memberForm(m) {
    const v = m || { nama: '', nim: '', jabatan: '', divisi: '', hp: '', email: '', bergabung: todayStr() };
    const jabatan = ['Ketua BEM', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Kepala Departemen', 'Staf'];
    openModal(`
      <h2>${m ? 'Edit Anggota' : '＋ Tambah Anggota'}</h2>
      <form id="mForm">
        <label class="field"><span>Nama Lengkap</span><input name="nama" required placeholder="cth. Siti Rahmawati" value="${esc(v.nama)}"></label>
        <div class="form-grid">
          <label class="field"><span>NIM</span><input name="nim" placeholder="2210511001" value="${esc(v.nim)}"></label>
          <label class="field"><span>Jabatan</span><input name="jabatan" list="dlJabatan" placeholder="Staf" value="${esc(v.jabatan)}"></label>
          <label class="field"><span>Divisi / Departemen</span><input name="divisi" list="dlDivisi" placeholder="Kominfo" value="${esc(v.divisi)}"></label>
          <label class="field"><span>No. HP</span><input name="hp" type="tel" placeholder="08xxxxxxxxxx" value="${esc(v.hp)}"></label>
          <label class="field"><span>Email</span><input name="email" type="email" placeholder="nama@kampus.ac.id" value="${esc(v.email)}"></label>
          <label class="field"><span>Tanggal Bergabung</span><input name="bergabung" type="date" value="${esc(v.bergabung)}"></label>
        </div>
        <datalist id="dlJabatan">${jabatan.map(j => `<option value="${j}">`).join('')}</datalist>
        <datalist id="dlDivisi">${divisions().map(d => `<option value="${esc(d)}">`).join('')}</datalist>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" data-close-btn>Batal</button>
          <button class="btn btn-primary">${m ? 'Simpan Perubahan' : 'Tambah Anggota'}</button>
        </div>
      </form>`, body => {
      $('[data-close-btn]', body).addEventListener('click', closeModal);
      $('#mForm', body).addEventListener('submit', e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target));
        Object.keys(f).forEach(k => { f[k] = f[k].trim(); });
        if (f.nim && state.members.some(x => x.nim === f.nim && x.id !== m?.id)) { toast('NIM sudah terdaftar.', 'error'); return; }
        let target = m;
        if (m) Object.assign(m, f);
        else { target = { id: uid(), ...f }; state.members.push(target); }
        save(); closeModal(); render.anggota();
        toast(m ? 'Data anggota diperbarui.' : `<b>${esc(f.nama)}</b> ditambahkan! 🎉`, 'success');
        if (!m) showQrCard(target);
      });
    });
  }

  function idCardHtml(m) {
    return `<div class="id-card">
      <div class="ic-head"><div class="org">${esc(state.settings.org)}</div><div class="per">Kartu Anggota · Periode ${esc(state.settings.periode)}</div></div>
      <div class="ic-qr" data-qr="${QR_PREFIX + m.id}"></div>
      <div class="ic-body"><div class="nm">${esc(m.nama)}</div><div class="jb">${esc(m.jabatan || 'Anggota')}${m.divisi ? ' · ' + esc(m.divisi) : ''}</div>
      <div class="jb">${m.nim ? 'NIM ' + esc(m.nim) : ''}</div></div>
    </div>`;
  }
  function paintQrs(root) {
    if (typeof QRCode === 'undefined') { toast('Library QR gagal dimuat. Periksa koneksi internet.', 'error'); return; }
    $$('[data-qr]', root).forEach(el => {
      el.innerHTML = '';
      new QRCode(el, { text: el.dataset.qr, width: 360, height: 360, colorDark: '#1e1b4b', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    });
  }

  function showQrCard(m) {
    openModal(`
      <h2>🔳 Kartu QR Anggota</h2>
      ${idCardHtml(m)}
      <p class="muted small" style="text-align:center;margin:16px 0">Tunjukkan QR ini saat rapat/kegiatan untuk absen.</p>
      <div class="modal-actions" style="justify-content:center">
        <button class="btn btn-primary" id="btnDlCard">⬇️ Unduh Kartu (PNG)</button>
      </div>`, body => {
      paintQrs(body);
      $('#btnDlCard', body).addEventListener('click', () => downloadCard(m, $('.ic-qr canvas', body)));
    });
  }

  function downloadCard(m, qrCanvas) {
    if (!qrCanvas) return;
    const W = 600, H = 860, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const round = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
    g.fillStyle = '#ffffff'; round(0, 0, W, H, 40); g.fill();
    g.save(); round(0, 0, W, H, 40); g.clip();
    const grad = g.createLinearGradient(0, 0, W, 180);
    grad.addColorStop(0, '#4f46e5'); grad.addColorStop(0.55, '#7c3aed'); grad.addColorStop(1, '#db2777');
    g.fillStyle = grad; g.fillRect(0, 0, W, 170);
    g.restore();
    g.textAlign = 'center';
    g.fillStyle = '#fff';
    g.font = '800 34px "Plus Jakarta Sans", sans-serif'; g.fillText(state.settings.org, W / 2, 80, W - 60);
    g.font = '500 22px "Plus Jakarta Sans", sans-serif'; g.fillText(`Kartu Anggota · Periode ${state.settings.periode}`, W / 2, 122, W - 60);
    g.drawImage(qrCanvas, 120, 210, 360, 360);
    g.fillStyle = '#1e1b4b'; g.font = '800 38px "Plus Jakarta Sans", sans-serif'; g.fillText(m.nama, W / 2, 650, W - 60);
    g.fillStyle = '#6b7280'; g.font = '500 24px "Plus Jakarta Sans", sans-serif';
    g.fillText(`${m.jabatan || 'Anggota'}${m.divisi ? ' · ' + m.divisi : ''}`, W / 2, 695, W - 60);
    if (m.nim) g.fillText(`NIM ${m.nim}`, W / 2, 735);
    const a = document.createElement('a');
    a.download = `kartu-${m.nama.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  }

  $('#btnPrintCards').addEventListener('click', () => {
    if (!state.members.length) { toast('Belum ada anggota untuk dicetak.', 'warn'); return; }
    const area = $('#printArea');
    area.innerHTML = [...state.members].sort((a, b) => a.nama.localeCompare(b.nama)).map(idCardHtml).join('');
    paintQrs(area);
    setTimeout(() => window.print(), 400);
  });

  // ---------- Grafik per anggota ----------
  let grafikMemberId = null;
  $('#grafikMonth').value = monthStr();
  $('#grafikMonth').addEventListener('change', () => render.grafik());
  $('#grafikMember').addEventListener('change', e => { grafikMemberId = e.target.value; render.grafik(); });

  render.grafik = () => {
    const sorted = [...state.members].sort((a, b) => a.nama.localeCompare(b.nama));
    if (!memberById(grafikMemberId)) grafikMemberId = sorted[0]?.id || null;
    $('#grafikMember').innerHTML = sorted.length
      ? sorted.map(m => `<option value="${m.id}" ${m.id === grafikMemberId ? 'selected' : ''}>${esc(m.nama)}</option>`).join('')
      : '<option>Belum ada anggota</option>';
    const ym = $('#grafikMonth').value || monthStr();
    const m = memberById(grafikMemberId);
    renderRank(ym);
    if (!m) {
      $('#grafikProfile').innerHTML = '<div class="grow">Tambahkan anggota untuk melihat grafik kehadiran.</div>';
      return;
    }
    const s = memberMonthStats(m, ym);
    $('#grafikProfile').innerHTML = `${avatar(m, 'lg')}
      <div><div style="font-weight:800;font-size:1.15rem">${esc(m.nama)}</div>
      <div class="meta">${esc(m.jabatan || 'Anggota')}${m.divisi ? ' · ' + esc(m.divisi) : ''}${m.nim ? ' · NIM ' + esc(m.nim) : ''}</div>
      <div class="meta">Rekap ${fmtMonth(ym)}</div></div>
      <div class="big"><b>${s.rate}%</b><span class="meta">${predikat(s)}</span></div>`;
    $('#gRate').textContent = s.rate + '%';
    $('#gHadir').textContent = s.hadir;
    $('#gTelat').textContent = s.terlambat;
    $('#gAlpha').textContent = `${s.izin + s.sakit}/${s.alpha}`;

    const donutData = [s.hadir, s.terlambat, s.izin + s.sakit, s.alpha];
    drawChart('chartDonut', {
      type: 'doughnut',
      data: {
        labels: ['Hadir', 'Terlambat', 'Izin/Sakit', 'Alpha'],
        datasets: [{ data: s.total ? donutData : [1], backgroundColor: s.total ? [COLORS.hadir, COLORS.terlambat, COLORS.izin, COLORS.alpha] : ['rgba(148,163,184,.3)'], borderWidth: 0, hoverOffset: 10 }],
      },
      options: {
        cutout: '68%',
        plugins: { legend: { position: 'bottom', display: !!s.total }, tooltip: { enabled: !!s.total } },
      },
      plugins: [{
        id: 'center',
        afterDraw(ch) {
          const { ctx, chartArea: a } = ch;
          ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = Chart.defaults.color;
          ctx.font = '800 26px "Plus Jakarta Sans"'; ctx.fillText(s.total ? `${s.rate}%` : '–', (a.left + a.right) / 2, (a.top + a.bottom) / 2 - 8);
          ctx.font = '500 12px "Plus Jakarta Sans"'; ctx.fillText(`${s.total} agenda`, (a.left + a.right) / 2, (a.top + a.bottom) / 2 + 16);
          ctx.restore();
        },
      }],
    });

    // Per minggu (minggu ke-1..5 dalam bulan)
    const evs = eventsInMonth(ym);
    const weeks = Math.ceil(new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate() / 7);
    const w = { hadir: Array(weeks).fill(0), terlambat: Array(weeks).fill(0), izin: Array(weeks).fill(0), alpha: Array(weeks).fill(0) };
    evs.forEach(ev => {
      const st = statusOf(ev, m);
      if (!st) return;
      const wi = Math.ceil(parseDate(ev.tanggal).getDate() / 7) - 1;
      w[st === 'sakit' ? 'izin' : st][wi]++;
    });
    drawChart('chartWeekly', {
      type: 'bar',
      data: {
        labels: Array.from({ length: weeks }, (_, i) => `Minggu ${i + 1}`),
        datasets: [['hadir', 'Hadir'], ['terlambat', 'Terlambat'], ['izin', 'Izin/Sakit'], ['alpha', 'Alpha']].map(([k, l]) => ({
          label: l, data: w[k], backgroundColor: COLORS[k], borderRadius: 6, borderSkipped: false, maxBarThickness: 38,
        })),
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } },
      },
    });

    renderCalendar(m, ym, evs);

    const hist = evs.filter(ev => statusOf(ev, m)).reverse();
    $('#grafikHistory').innerHTML = hist.length ? hist.map(ev => {
      const st = statusOf(ev, m), r = recordOf(ev.id, m.id), d = parseDate(ev.tanggal);
      return `<div class="list-item">
        <div class="date-pill"><b>${d.getDate()}</b><small>${BLN[d.getMonth()]}</small></div>
        <div class="grow"><div class="t">${esc(ev.judul)}</div><div class="s">${esc(ev.jenis)} · ${esc(ev.jam)}${r ? ' · absen ' + fmtTime(r.waktu) : ''}</div></div>
        <span class="badge ${st}">${STATUS_LABEL[st]}</span></div>`;
    }).join('') : '<div class="empty">Tidak ada agenda pada bulan ini.</div>';
  };

  function predikat(s) {
    if (!s.total) return 'Belum ada agenda';
    if (s.rate >= 90) return '🌟 Sangat Aktif';
    if (s.rate >= 75) return '👍 Aktif';
    if (s.rate >= 50) return '🙂 Cukup';
    return '⚠️ Perlu Ditingkatkan';
  }

  function renderCalendar(m, ym, evs) {
    const [y, mo] = ym.split('-').map(Number);
    const first = new Date(y, mo - 1, 1);
    const days = new Date(y, mo, 0).getDate();
    const offset = (first.getDay() + 6) % 7; // mulai Senin
    const rank = { alpha: 4, terlambat: 3, izin: 2, sakit: 2, hadir: 1 };
    let html = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(h => `<div class="cal-h">${h}</div>`).join('');
    html += '<div class="cal-d blank"></div>'.repeat(offset);
    for (let d = 1; d <= days; d++) {
      const ds = `${ym}-${pad(d)}`;
      const sts = evs.filter(e => e.tanggal === ds).map(e => statusOf(e, m)).filter(Boolean);
      const worst = sts.sort((a, b) => rank[b] - rank[a])[0];
      const cls = worst ? `s-${worst === 'sakit' ? 'izin' : worst}` : '';
      const dots = sts.map(s => `<i style="background:${COLORS[s === 'sakit' ? 'izin' : s]}"></i>`).join('');
      const title = evs.filter(e => e.tanggal === ds).map(e => `${e.judul}: ${STATUS_LABEL[statusOf(e, m)] || 'Akan datang'}`).join('\n');
      html += `<div class="cal-d ${cls} ${ds === todayStr() ? 'today' : ''}" title="${esc(title)}">${d}${dots ? `<span class="dots">${dots}</span>` : ''}</div>`;
    }
    $('#calendar').innerHTML = html;
  }

  function renderRank(ym) {
    const data = state.members.map(m => ({ m, s: memberMonthStats(m, ym) })).sort((a, b) => b.s.rate - a.s.rate || a.m.nama.localeCompare(b.m.nama));
    $('#rankBox').style.height = Math.max(200, data.length * 30 + 50) + 'px';
    drawChart('chartRank', {
      type: 'bar',
      data: {
        labels: data.map(x => x.m.nama),
        datasets: [{
          label: 'Kehadiran (%)', data: data.map(x => x.s.rate), borderRadius: 8, borderSkipped: false, maxBarThickness: 20,
          backgroundColor: data.map(x => (x.m.id === grafikMemberId ? '#7c3aed' : x.s.rate >= 75 ? COLORS.hadir : x.s.rate >= 50 ? COLORS.terlambat : COLORS.alpha)),
        }],
      },
      options: {
        indexAxis: 'y',
        onClick: (_, els) => { if (els[0]) { grafikMemberId = data[els[0].index].m.id; render.grafik(); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.x}% (${data[c.dataIndex].s.present}/${data[c.dataIndex].s.total} agenda)` } } },
        scales: { x: { min: 0, max: 100, ticks: { callback: v => v + '%' } }, y: { grid: { display: false } } },
      },
    });
  }

  // ---------- Pengaturan ----------
  render.pengaturan = () => {
    $('#setOrg').value = state.settings.org;
    $('#setPeriode').value = state.settings.periode;
    $('#setTol').value = state.settings.tol;
  };
  $('#btnSaveSettings').addEventListener('click', () => {
    state.settings.org = $('#setOrg').value.trim() || 'BEM';
    state.settings.periode = $('#setPeriode').value.trim();
    state.settings.tol = Number($('#setTol').value) || 0;
    save(); applyBrand(); toast('Pengaturan disimpan.', 'success');
  });

  function downloadBlob(content, name, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function downloadCsv(rows, name) {
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    downloadBlob('﻿' + csv, name.replace(/[^\w.-]+/g, '_'), 'text/csv;charset=utf-8');
  }

  $('#btnExportJson').addEventListener('click', () => downloadBlob(JSON.stringify(state, null, 2), `backup-absensi-bem-${todayStr()}.json`, 'application/json'));
  $('#importJson').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.members) || !Array.isArray(data.events) || !Array.isArray(data.att)) throw new Error('format');
      if (!confirm('Pulihkan backup? Data saat ini akan diganti.')) return;
      state = { ...defaultState(), ...data };
      save(); applyBrand(); render.pengaturan(); toast('Backup berhasil dipulihkan.', 'success');
    } catch { toast('File backup tidak valid.', 'error'); }
    e.target.value = '';
  });
  $('#btnExportCsv').addEventListener('click', () => {
    const ym = monthStr();
    const rows = [['Nama', 'NIM', 'Jabatan', 'Divisi', 'Total Agenda', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha', 'Persentase']];
    [...state.members].sort((a, b) => a.nama.localeCompare(b.nama)).forEach(m => {
      const s = memberMonthStats(m, ym);
      rows.push([m.nama, m.nim, m.jabatan, m.divisi, s.total, s.hadir, s.terlambat, s.izin, s.sakit, s.alpha, s.rate + '%']);
    });
    downloadCsv(rows, `rekap-absensi-${ym}.csv`);
  });
  $('#btnReset').addEventListener('click', () => {
    if (!confirm('Yakin hapus SEMUA data anggota, agenda, dan absensi?')) return;
    state = defaultState(); save(); applyBrand(); render.pengaturan(); toast('Semua data dihapus.', 'info', '🗑️');
  });
  $('#btnSeed').addEventListener('click', () => {
    if (state.members.length && !confirm('Data contoh akan ditambahkan ke data yang sudah ada. Lanjutkan?')) return;
    seed(); toast('Data contoh dimuat. Cek Dashboard & Grafik!', 'success', '✨'); go('dashboard');
  });

  function seed() {
    const people = [
      ['Ahmad Fauzi', 'Ketua BEM', 'Inti'], ['Siti Rahmawati', 'Wakil Ketua', 'Inti'], ['Dewi Lestari', 'Sekretaris', 'Inti'],
      ['Rizky Pratama', 'Bendahara', 'Inti'], ['Nabila Putri', 'Kepala Departemen', 'Kominfo'], ['Bagas Saputra', 'Staf', 'Kominfo'],
      ['Intan Permata', 'Kepala Departemen', 'Advokesma'], ['Fajar Nugroho', 'Staf', 'Advokesma'], ['Ayu Wulandari', 'Kepala Departemen', 'PSDM'],
      ['Dimas Ardiansyah', 'Staf', 'PSDM'], ['Putri Maharani', 'Kepala Departemen', 'Sosmas'], ['Yoga Firmansyah', 'Staf', 'Sosmas'],
    ];
    const now = new Date();
    const start = dateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const ms = people.map(([nama, jabatan, divisi], i) => ({
      id: uid() + i, nama, jabatan, divisi, nim: `22105${pad(i + 1)}0${i + 11}`,
      hp: `08${1200000000 + i * 7919}`, email: '', bergabung: start, rel: 0.55 + ((i * 37) % 45) / 100,
    }));
    const agenda = [
      [3, 'Rapat Koordinasi Pengurus', 'Rapat', '19:00', 'Sekretariat BEM'], [6, 'Bakti Sosial Desa Binaan', 'Kegiatan', '07:30', 'Desa Sukamaju'],
      [10, 'Rapat Pleno Bulanan', 'Rapat', '16:00', 'Aula Rektorat'], [14, 'Seminar Kepemimpinan', 'Kegiatan', '08:00', 'Gedung Serbaguna'],
      [17, 'Rapat Evaluasi Program', 'Rapat', '19:30', 'Sekretariat BEM'], [21, 'Diskusi Publik Advokesma', 'Kegiatan', '13:00', 'Taman Kampus'],
      [24, 'Rapat Persiapan Dies Natalis', 'Rapat', '19:00', 'Ruang Rapat FT'], [28, 'Upgrading Pengurus', 'Kegiatan', '07:00', 'Villa Puncak'],
    ];
    const evs = [];
    [-1, 0].forEach(off => agenda.forEach(([d, judul, jenis, jam, lokasi]) => {
      const dt = new Date(now.getFullYear(), now.getMonth() + off, d);
      if (dt.getMonth() !== (now.getMonth() + off + 12) % 12) return;
      evs.push({ id: uid() + evs.length, judul, jenis, jam, lokasi, toleransi: 15, tanggal: dateStr(dt) });
    }));
    let rnd = 42;
    const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
    evs.filter(e => e.tanggal < todayStr()).forEach(ev => ms.forEach(m => {
      const r = rand();
      let status = null;
      if (r < m.rel * 0.8) status = 'hadir';
      else if (r < m.rel) status = 'terlambat';
      else if (r < m.rel + 0.12) status = rand() < 0.5 ? 'izin' : 'sakit';
      if (!status) return;
      const [h, mi] = ev.jam.split(':').map(Number);
      const t = parseDate(ev.tanggal);
      t.setHours(h, mi + (status === 'terlambat' ? 20 + Math.floor(rand() * 30) : -Math.floor(rand() * 15)));
      state.att.push({ eventId: ev.id, memberId: m.id, status, metode: status === 'hadir' || status === 'terlambat' ? 'qr' : 'manual', waktu: t.toISOString() });
    }));
    ms.forEach(m => delete m.rel);
    state.members.push(...ms);
    state.events.push(...evs);
    save();
  }

  // ---------- Init ----------
  function applyBrand() {
    $('#orgName').textContent = state.settings.org;
    $('.brand-logo').textContent = initials(state.settings.org || 'B').slice(0, 1) || 'B';
  }
  applyBrand();
  render.dashboard();
  if (!state.members.length && !state.events.length) {
    setTimeout(() => toast('Selamat datang! Tambah anggota atau muat data contoh di menu Pengaturan.', 'info', '👋'), 600);
  }
})();
