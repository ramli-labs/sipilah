/*
 * SIPILAH — Training Enhancements v1.0
 *
 * Fitur 1: Training Progress Indicator — timer + animasi "🤖 AI sedang belajar..."
 * Fitur 2: Accuracy Explanation — penjelasan akurasi dalam bahasa sederhana
 * Fitur 3: Minimum Photo Validation — peringatan sebelum training jika foto < 15
 *
 * Cara kerja: meng-intercept window.SipML.train() tanpa memodifikasi bundle.js
 * Kompatibel offline-first (PWA), tidak butuh library tambahan.
 */

(function () {
  'use strict';

  /* ─── KONFIGURASI ─── */
  var MIN_TOTAL_PHOTOS = 15;
  var MIN_PER_CATEGORY = 5;
  var TRAINING_ESTIMATE_SEC = 30;

  /* ─── CSS UNTUK SEMUA FITUR ─── */
  var STYLES = [
    /* ── Shared ── */
    '#sip-eh-warn-overlay,#sip-eh-train-timer,#sip-eh-acc-toast{',
    '  box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;',
    '}',

    /* ── Feature 3: Modal Peringatan Foto ── */
    '#sip-eh-warn-overlay{',
    '  position:fixed;inset:0;z-index:10000;',
    '  background:rgba(15,23,42,.55);backdrop-filter:blur(4px);',
    '  display:flex;align-items:center;justify-content:center;padding:16px;',
    '  animation:sip-fade-in .2s ease;',
    '}',
    '.sip-eh-warn-box{',
    '  background:#fff;border-radius:22px;padding:28px 24px;',
    '  max-width:370px;width:100%;text-align:center;',
    '  box-shadow:0 24px 64px rgba(15,23,42,.18);',
    '  animation:sip-pop-in .25s cubic-bezier(.34,1.56,.64,1);',
    '}',
    '.sip-eh-warn-icon{font-size:44px;line-height:1;margin-bottom:12px}',
    '.sip-eh-warn-title{',
    '  font-size:19px;font-weight:800;color:#0f172a;margin:0 0 10px;',
    '}',
    '.sip-eh-warn-body{',
    '  color:#475569;font-size:15px;line-height:1.65;margin:0 0 14px;',
    '}',
    '.sip-eh-warn-hint{',
    '  background:#fefce8;border:1px solid #fde68a;border-radius:12px;',
    '  padding:10px 14px;font-size:13px;color:#92400e;',
    '  margin-bottom:22px;line-height:1.55;text-align:left;',
    '}',
    '.sip-eh-warn-actions{display:flex;gap:10px;}',
    '.sip-eh-btn{',
    '  flex:1;padding:13px 8px;border:none;border-radius:13px;',
    '  font-size:14px;font-weight:700;cursor:pointer;',
    '  transition:background .15s,transform .1s;',
    '}',
    '.sip-eh-btn:active{transform:scale(.97)}',
    '.sip-eh-btn-cancel{background:#f1f5f9;color:#475569;}',
    '.sip-eh-btn-cancel:hover{background:#e2e8f0;}',
    '.sip-eh-btn-proceed{background:#f59e0b;color:#fff;}',
    '.sip-eh-btn-proceed:hover{background:#d97706;}',

    /* ── Feature 1: Training Timer (floating pill) ── */
    '#sip-eh-train-timer{',
    '  position:fixed;bottom:24px;left:50%;transform:translateX(-50%);',
    '  z-index:9500;',
    '  background:rgba(15,23,42,.92);color:#fff;',
    '  border-radius:50px;padding:11px 22px;',
    '  font-size:14px;font-weight:600;white-space:nowrap;',
    '  display:flex;align-items:center;gap:10px;',
    '  box-shadow:0 8px 32px rgba(15,23,42,.3);',
    '  animation:sip-slide-up .35s cubic-bezier(.34,1.2,.64,1);',
    '}',
    '#sip-eh-train-timer.sip-eh-hide{',
    '  animation:sip-slide-down .3s ease forwards;',
    '}',
    '.sip-eh-timer-dot{',
    '  width:9px;height:9px;border-radius:50%;background:#22c55e;flex-shrink:0;',
    '  animation:sip-pulse 1.2s ease-in-out infinite;',
    '}',
    '.sip-eh-timer-est{opacity:.65;font-size:13px}',

    /* ── Feature 2: Accuracy Toast (pojok kanan atas) ── */
    '#sip-eh-acc-toast{',
    '  position:fixed;top:16px;right:12px;left:12px;',
    '  max-width:400px;margin:0 auto;',
    '  z-index:9500;',
    '  background:#fff;border:1.5px solid #bbf7d0;border-radius:18px;',
    '  padding:16px 40px 16px 16px;',
    '  box-shadow:0 8px 32px rgba(15,23,42,.13);',
    '  animation:sip-toast-in .4s cubic-bezier(.34,1.2,.64,1);',
    '}',
    '.sip-eh-toast-hd{',
    '  display:flex;align-items:center;gap:10px;margin-bottom:7px;',
    '}',
    '.sip-eh-toast-emoji{font-size:28px;line-height:1}',
    '.sip-eh-toast-title{font-size:17px;font-weight:800;color:#0f172a}',
    '.sip-eh-toast-meaning{',
    '  color:#334155;font-size:14px;line-height:1.6;margin:0 0 6px;',
    '}',
    '.sip-eh-toast-ctx{',
    '  color:#64748b;font-size:13px;line-height:1.5;margin:0;',
    '  padding-top:8px;border-top:1px solid #f1f5f9;',
    '}',
    '.sip-eh-toast-close{',
    '  position:absolute;top:12px;right:12px;',
    '  background:none;border:none;cursor:pointer;',
    '  color:#94a3b8;font-size:18px;line-height:1;padding:4px 6px;',
    '  border-radius:8px;',
    '}',
    '.sip-eh-toast-close:hover{background:#f8fafc;color:#64748b}',

    /* ── Keyframes ── */
    '@keyframes sip-fade-in{from{opacity:0}to{opacity:1}}',
    '@keyframes sip-pop-in{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}',
    '@keyframes sip-slide-up{',
    '  from{opacity:0;transform:translateX(-50%) translateY(20px)}',
    '  to  {opacity:1;transform:translateX(-50%) translateY(0)}',
    '}',
    '@keyframes sip-slide-down{',
    '  to{opacity:0;transform:translateX(-50%) translateY(20px)}',
    '}',
    '@keyframes sip-pulse{0%,100%{opacity:1}50%{opacity:.35}}',
    '@keyframes sip-toast-in{',
    '  from{opacity:0;transform:translateY(-16px)}',
    '  to  {opacity:1;transform:translateY(0)}',
    '}',

    /* ── Mobile tweaks ── */
    '@media(max-width:480px){',
    '  .sip-eh-warn-box{padding:22px 16px}',
    '  .sip-eh-warn-title{font-size:17px}',
    '  #sip-eh-train-timer{font-size:13px;padding:10px 18px}',
    '}',
  ].join('');

  function injectStyles() {
    var s = document.createElement('style');
    s.id = 'sip-eh-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  /* ────────────────────────────────────────────────
   * FEATURE 3 — Modal Peringatan Foto Minimum
   * Tampil jika total foto < MIN_TOTAL_PHOTOS
   * Return: Promise<boolean> — true = lanjut latih
   * ──────────────────────────────────────────────── */
  function showPhotoWarning(total) {
    return new Promise(function (resolve) {
      var lacking = MIN_TOTAL_PHOTOS - total;
      var el = document.createElement('div');
      el.id = 'sip-eh-warn-overlay';
      el.innerHTML =
        '<div class="sip-eh-warn-box">' +
          '<div class="sip-eh-warn-icon">📸</div>' +
          '<h3 class="sip-eh-warn-title">Dataset Perlu Ditambah</h3>' +
          '<p class="sip-eh-warn-body">' +
            'Anda punya <strong>' + total + ' foto</strong>. ' +
            'Minimal <strong>' + MIN_TOTAL_PHOTOS + ' foto</strong> ' +
            'disarankan agar AI belajar dengan baik.' +
          '</p>' +
          '<div class="sip-eh-warn-hint">' +
            '💡 Saran: tiap kategori minimal ' + MIN_PER_CATEGORY + ' foto<br>' +
            '&nbsp;&nbsp;&nbsp;(Plastik, Kertas, Organik, Residu).<br>' +
            '&nbsp;&nbsp;&nbsp;Kurang <strong>' + lacking + ' foto</strong> lagi untuk mencapai minimum.' +
          '</div>' +
          '<div class="sip-eh-warn-actions">' +
            '<button class="sip-eh-btn sip-eh-btn-cancel" id="sip-eh-btn-cancel">← Tambah Foto</button>' +
            '<button class="sip-eh-btn sip-eh-btn-proceed" id="sip-eh-btn-proceed">Latih Tetap (' + total + ' foto)</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(el);

      function close(result) {
        el.remove();
        resolve(result);
      }

      document.getElementById('sip-eh-btn-cancel').onclick = function () { close(false); };
      document.getElementById('sip-eh-btn-proceed').onclick = function () { close(true); };
      /* Klik backdrop juga menutup */
      el.addEventListener('click', function (e) {
        if (e.target === el) close(false);
      });
    });
  }

  /* ────────────────────────────────────────────────
   * FEATURE 1 — Training Timer (floating pill)
   * Menampilkan estimasi waktu selama training
   * ──────────────────────────────────────────────── */
  var _timerEl = null;
  var _timerInterval = null;
  var _trainStart = 0;

  function showTrainingTimer() {
    if (_timerEl) return;
    _trainStart = Date.now();

    _timerEl = document.createElement('div');
    _timerEl.id = 'sip-eh-train-timer';
    _timerEl.innerHTML =
      '<div class="sip-eh-timer-dot"></div>' +
      '<span>🤖 AI sedang belajar…</span>' +
      '<span class="sip-eh-timer-est" id="sip-eh-timer-est">~' + TRAINING_ESTIMATE_SEC + ' detik</span>';
    document.body.appendChild(_timerEl);

    _timerInterval = setInterval(function () {
      var el = document.getElementById('sip-eh-timer-est');
      if (!el) return;
      var elapsed = Math.round((Date.now() - _trainStart) / 1000);
      var remaining = TRAINING_ESTIMATE_SEC - elapsed;
      el.textContent = remaining > 0 ? ('~' + remaining + ' detik lagi') : (elapsed + ' detik');
    }, 1000);
  }

  function hideTrainingTimer() {
    clearInterval(_timerInterval);
    _timerInterval = null;
    if (!_timerEl) return;
    _timerEl.classList.add('sip-eh-hide');
    var el = _timerEl;
    _timerEl = null;
    setTimeout(function () { el.remove(); }, 350);
  }

  /* ────────────────────────────────────────────────
   * FEATURE 2 — Accuracy Explanation Toast
   * Muncul setelah training selesai, auto-hilang 12 detik
   * accuracy: integer persen (misal 73 artinya 73%)
   * ──────────────────────────────────────────────── */
  function showAccuracyExplanation(accuracy) {
    var pct = Math.round(accuracy);
    var correct = Math.round(pct / 10);
    var emoji = pct >= 80 ? '🎯' : pct >= 60 ? '📊' : '💪';
    var feedback =
      pct >= 80
        ? 'Hasil sangat bagus untuk dataset sekolah! 🌟'
        : pct >= 60
        ? 'Tambah foto atau perbaiki label untuk meningkatkan akurasi.'
        : 'Coba tambah lebih banyak foto yang beragam tiap kategori.';

    /* Hapus toast lama jika ada */
    var existing = document.getElementById('sip-eh-acc-toast');
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.id = 'sip-eh-acc-toast';
    el.innerHTML =
      '<button class="sip-eh-toast-close" id="sip-eh-acc-close" aria-label="Tutup">✕</button>' +
      '<div class="sip-eh-toast-hd">' +
        '<span class="sip-eh-toast-emoji">' + emoji + '</span>' +
        '<span class="sip-eh-toast-title">Akurasi ' + pct + '%</span>' +
      '</div>' +
      '<p class="sip-eh-toast-meaning">' +
        pct + '% akurat = dari <strong>10 foto baru</strong>, ' +
        'AI bisa menebak <strong>' + correct + ' foto</strong> dengan benar.' +
      '</p>' +
      '<p class="sip-eh-toast-ctx">' +
        'Lebih bagus dari tebakan acak (25% untuk 4 kategori). ' + feedback +
      '</p>';
    document.body.appendChild(el);

    var closeBtn = document.getElementById('sip-eh-acc-close');
    if (closeBtn) closeBtn.onclick = function () { el.remove(); };

    /* Auto-dismiss setelah 12 detik */
    setTimeout(function () { if (el.parentNode) el.remove(); }, 12000);
  }

  /* ────────────────────────────────────────────────
   * PATCH — window.SipML.train
   * Membungkus fungsi training asli untuk menyisipkan
   * ketiga fitur di atas tanpa ubah bundle.js
   * ──────────────────────────────────────────────── */
  function applyPatch() {
    /* Tunggu hingga SipML & SipDB tersedia */
    if (!window.SipML || typeof window.SipML.train !== 'function' || !window.SipDB) {
      setTimeout(applyPatch, 400);
      return;
    }

    /* Cegah double-patch */
    if (window.SipML._sipEhPatched) return;
    window.SipML._sipEhPatched = true;

    var origTrain = window.SipML.train.bind(window.SipML);

    window.SipML.train = async function (callbacks) {
      callbacks = callbacks || {};

      /* ── Feature 3: Cek jumlah foto ── */
      var total = 0;
      try {
        var photos = await window.SipDB.getAll();
        total = Array.isArray(photos) ? photos.length : 0;
      } catch (_) { /* Jika gagal cek, lanjut saja */ }

      if (total > 0 && total < MIN_TOTAL_PHOTOS) {
        var proceed = await showPhotoWarning(total);
        if (!proceed) {
          /* User memilih "Tambah Foto" — batalkan training */
          throw new Error(
            'Pelatihan dibatalkan. Tambah lebih banyak foto untuk hasil yang lebih akurat.'
          );
        }
      }

      /* ── Feature 1: Tampilkan timer ── */
      showTrainingTimer();

      /* Bungkus callbacks agar fitur 1 & 2 aktif */
      var wrappedCallbacks = {
        onStatus: callbacks.onStatus
          ? function (status, progress) { callbacks.onStatus(status, progress); }
          : undefined,

        onEpoch: callbacks.onEpoch,

        onDone: function (result) {
          /* Feature 1: Sembunyikan timer saat selesai */
          hideTrainingTimer();

          /* Teruskan ke komponen React */
          if (callbacks.onDone) callbacks.onDone(result);

          /* Feature 2: Tampilkan penjelasan akurasi */
          if (result && result.accuracy != null) {
            setTimeout(function () {
              showAccuracyExplanation(result.accuracy);
            }, 700);
          }
        },
      };

      try {
        return await origTrain(wrappedCallbacks);
      } catch (err) {
        /* Pastikan timer disembunyikan walau error */
        hideTrainingTimer();
        throw err;
      }
    };

    console.log('[SIPILAH] Training enhancements v1.0 aktif ✓');
  }

  /* ─── INIT ─── */
  injectStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPatch);
  } else {
    applyPatch();
  }
})();
