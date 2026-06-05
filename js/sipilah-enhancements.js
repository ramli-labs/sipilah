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
    '#sip-eh-warn-overlay,#sip-eh-train-timer,#sip-eh-acc-toast,#sip-live-test-card{',
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

    /* Live camera prediction for Uji Model */
    '#sip-live-test-card{',
    '  border:1px solid #bbf7d0;border-radius:18px;background:linear-gradient(135deg,#f0fdf4,#f8fafc);',
    '  padding:16px 18px;margin:0 0 20px;box-shadow:0 10px 28px rgba(15,23,42,.06);',
    '}',
    '.sip-live-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}',
    '.sip-live-kicker{font-size:11px;font-weight:900;color:#15803d;letter-spacing:.08em;text-transform:uppercase}',
    '.sip-live-title{font-size:18px;font-weight:900;color:#0f172a;margin-top:2px}',
    '.sip-live-sub{font-size:13px;color:#475569;margin-top:3px;line-height:1.45}',
    '.sip-live-btn{border:0;border-radius:13px;background:#15803d;color:white;padding:11px 16px;font-weight:850;font-size:13px;cursor:pointer;white-space:nowrap}',
    '.sip-live-btn:hover{background:#166534}',
    '.sip-live-btn:disabled{opacity:.55;cursor:not-allowed}',
    '.sip-live-btn.sip-live-stop{background:#f1f5f9;color:#334155;border:1px solid #cbd5e1}',
    '.sip-live-actions{display:flex;gap:8px;flex-wrap:wrap}',
    '.sip-live-actions .sip-live-btn{padding-inline:13px}',
    '.sip-live-btn.sip-live-secondary{background:#fff;color:#15803d;border:1px solid #bbf7d0}',
    '.sip-live-btn.sip-live-secondary:hover{background:#f0fdf4}',
    '.sip-live-body{display:grid;grid-template-columns:minmax(220px,.9fr) 1.1fr;gap:14px;margin-top:14px;align-items:stretch}',
    '.sip-live-video-wrap{position:relative;overflow:hidden;border-radius:16px;background:#0f172a;aspect-ratio:4/3;min-height:190px}',
    '.sip-live-video-wrap video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}',
    '.sip-live-video-wrap img{width:100%;height:100%;object-fit:cover}',
    '.sip-live-frame{position:absolute;inset:12%;border:2px dashed rgba(255,255,255,.72);border-radius:18px;pointer-events:none}',
    '.sip-live-status{position:absolute;left:10px;right:10px;bottom:10px;border-radius:12px;background:rgba(15,23,42,.72);color:white;padding:8px 10px;font-size:12px;font-weight:750;text-align:center}',
    '.sip-live-result{border:1px solid #e2e8f0;background:rgba(255,255,255,.78);border-radius:16px;padding:14px;min-height:190px}',
    '.sip-live-pred-label{font-size:32px;line-height:1.05;font-weight:950;color:#15803d;margin-top:6px}',
    '.sip-live-confidence{font-size:13px;color:#475569;margin-top:4px}',
    '.sip-live-bars{display:flex;flex-direction:column;gap:8px;margin-top:14px}',
    '.sip-live-row{display:grid;grid-template-columns:64px 1fr 40px;gap:8px;align-items:center;font-size:12px}',
    '.sip-live-cat{font-weight:850;text-align:right}',
    '.sip-live-track{height:9px;border-radius:999px;background:#e2e8f0;overflow:hidden}',
    '.sip-live-fill{height:100%;border-radius:999px;width:0;transition:width .18s ease}',
    '.sip-live-prob{font-weight:850;color:#334155;text-align:right;font-variant-numeric:tabular-nums}',
    '.sip-live-note{font-size:12px;color:#64748b;line-height:1.45;margin-top:10px}',

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
    '  .sip-live-body{grid-template-columns:1fr}',
    '  .sip-live-head{align-items:flex-start}',
    '  .sip-live-btn{width:100%}',
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
   * FEATURE 3 — Click Interceptor (capture phase)
   *
   * Validasi foto dijalankan DI SINI, sebelum event
   * mencapai React. Dengan cara ini:
   * - Jika user cancel → modal tutup, React tidak tahu
   *   ada click, UI tetap idle. Tidak ada error card.
   * - Jika user proceed → bypass flag di-set, button
   *   di-click ulang, React handle seperti biasa.
   *
   * Kenapa capture phase?
   * React (v17+) pasang event listener di #root element.
   * Listener di document-level capture phase berjalan
   * LEBIH DULU (window→document→#root). Dengan
   * stopImmediatePropagation() event tidak pernah
   * sampai ke React.
   * ──────────────────────────────────────────────── */
  var _allowClickFor = null; /* Tombol yang boleh lolos ke React */

  function installClickInterceptor() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('button') : null;
      if (!btn) return;

      /* Jika ini click hasil re-dispatch kita sendiri, biarkan lolos */
      if (_allowClickFor === btn) {
        _allowClickFor = null;
        return;
      }

      /* Hanya intercept tombol "Latih AI" yang tidak disabled */
      if (btn.disabled) return;
      if (btn.textContent.indexOf('Latih AI') < 0) return;

      /* Hentikan event — React tidak akan pernah tahu ada click ini */
      e.stopImmediatePropagation();
      e.preventDefault();

      /* Cek jumlah foto secara async, lalu putuskan */
      handleTrainClick(btn);
    }, true /* capture = true */);
  }

  function handleTrainClick(btn) {
    if (!window.SipDB) {
      /* SipDB belum siap, lanjut saja */
      proceedWithClick(btn);
      return;
    }

    window.SipDB.getAll().then(function (photos) {
      var total = Array.isArray(photos) ? photos.length : 0;

      if (total > 0 && total < MIN_TOTAL_PHOTOS) {
        /* Foto kurang → tampilkan modal */
        showPhotoWarning(total).then(function (proceed) {
          if (proceed) proceedWithClick(btn);
          /* Jika cancel: tidak ada yang terjadi.
             React tidak pernah masuk "running" state.
             UI tetap idle. Tidak ada error card. ✓ */
        });
      } else {
        /* Foto cukup → lanjut langsung */
        proceedWithClick(btn);
      }
    }).catch(function () {
      /* Gagal baca DB → amannya lanjut */
      proceedWithClick(btn);
    });
  }

  function proceedWithClick(btn) {
    /* Tandai tombol ini boleh lolos ke React pada click berikutnya */
    _allowClickFor = btn;
    btn.click();
  }

  /* ────────────────────────────────────────────────
   * FEATURE 4 — Kamera Live untuk Uji Model
   * Menggunakan window.SipML.predict(video) agar hasilnya sama
   * dengan alur uji foto biasa, tetapi berjalan realtime.
   * ──────────────────────────────────────────────── */
  var LIVE_COLORS = {
    Plastik: '#0ea5e9',
    Kertas: '#f59e0b',
    Organik: '#10b981',
    Residu: '#64748b',
  };
  var _liveStream = null;
  var _liveRunning = false;
  var _livePredicting = false;
  var _liveLoopId = null;
  var _liveObjectUrl = null;

  function isTestPageVisible() {
    var text = document.body ? document.body.innerText || '' : '';
    return text.indexOf('Uji Model dengan Foto Baru') >= 0 && text.indexOf('Foto Uji') >= 0;
  }

  function stopLiveCamera() {
    _liveRunning = false;
    if (_liveLoopId) {
      clearTimeout(_liveLoopId);
      _liveLoopId = null;
    }
    if (_liveStream) {
      _liveStream.getTracks().forEach(function (track) { track.stop(); });
      _liveStream = null;
    }
    revokeLiveObjectUrl();

    var card = document.getElementById('sip-live-test-card');
    if (!card) return;
    card.classList.remove('sip-live-active');
    var video = card.querySelector('video');
    if (video) video.srcObject = null;
    var preview = card.querySelector('#sip-live-still');
    if (preview) {
      preview.removeAttribute('src');
      preview.hidden = true;
    }
    if (video) video.hidden = false;
    var btn = card.querySelector('#sip-live-start');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Mulai Kamera Live';
      btn.classList.remove('sip-live-stop');
    }
    setLiveStatus('Kamera berhenti. Arahkan objek lalu mulai lagi untuk menebak realtime.');
  }

  function setLiveStatus(message) {
    var el = document.getElementById('sip-live-status');
    if (el) el.textContent = message;
  }

  function revokeLiveObjectUrl() {
    if (_liveObjectUrl) {
      URL.revokeObjectURL(_liveObjectUrl);
      _liveObjectUrl = null;
    }
  }

  function renderLivePrediction(result) {
    var card = document.getElementById('sip-live-test-card');
    if (!card || !result) return;

    var label = card.querySelector('#sip-live-label');
    var confidence = card.querySelector('#sip-live-confidence');
    var bars = card.querySelector('#sip-live-bars');
    var color = LIVE_COLORS[result.label] || '#15803d';

    if (label) {
      label.textContent = result.label || '-';
      label.style.color = color;
    }
    if (confidence) {
      confidence.textContent = 'Keyakinan ' + Math.round(result.confidence || 0) + '%';
    }
    if (bars && Array.isArray(result.allCategories)) {
      bars.innerHTML = result.allCategories
        .slice()
        .sort(function (a, b) { return (b.prob || 0) - (a.prob || 0); })
        .map(function (item) {
          var itemColor = item.color || LIVE_COLORS[item.cat] || '#15803d';
          var prob = Math.max(0, Math.min(100, Math.round(item.prob || 0)));
          return (
            '<div class="sip-live-row">' +
              '<div class="sip-live-cat" style="color:' + itemColor + '">' + item.cat + '</div>' +
              '<div class="sip-live-track"><div class="sip-live-fill" style="width:' + prob + '%;background:' + itemColor + '"></div></div>' +
              '<div class="sip-live-prob">' + prob + '%</div>' +
            '</div>'
          );
        })
        .join('');
    }
  }

  function runLivePredictionLoop(video) {
    if (!_liveRunning) return;
    if (!video || !video.videoWidth) {
      _liveLoopId = setTimeout(function () { runLivePredictionLoop(video); }, 250);
      return;
    }
    if (_livePredicting) {
      _liveLoopId = setTimeout(function () { runLivePredictionLoop(video); }, 250);
      return;
    }

    _livePredicting = true;
    window.SipML.predict(video)
      .then(function (result) {
        renderLivePrediction(result);
        setLiveStatus('Live: arahkan objek sampah ke tengah kamera.');
      })
      .catch(function (error) {
        setLiveStatus(error && error.message ? error.message : 'Prediksi live gagal.');
      })
      .finally(function () {
        _livePredicting = false;
        if (_liveRunning) {
          _liveLoopId = setTimeout(function () { runLivePredictionLoop(video); }, 650);
        }
      });
  }

  function openMobileImagePicker(source) {
    var card = document.getElementById('sip-live-test-card');
    if (!card) return;
    if (!window.SipML || typeof window.SipML.predict !== 'function') {
      setLiveStatus('Model AI belum siap. Muat ulang halaman atau latih model dulu.');
      return;
    }

    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;z-index:-1';
    document.body.appendChild(input);

    var cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      setTimeout(function () {
        if (input.parentNode) input.parentNode.removeChild(input);
      }, 400);
      window.removeEventListener('focus', onFocus);
    }
    function onFocus() {
      setTimeout(cleanup, 1200);
    }
    window.addEventListener('focus', onFocus);

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      cleanup();
      if (!file) {
        setLiveStatus('Tidak ada foto dipilih.');
        return;
      }
      predictPickedImage(file, card);
    }, { once: true });

    input.click();
  }

  function predictPickedImage(file, card) {
    stopLiveCamera();
    setLiveStatus('Membaca foto dan menjalankan prediksi...');

    revokeLiveObjectUrl();
    _liveObjectUrl = URL.createObjectURL(file);
    var video = card.querySelector('video');
    var preview = card.querySelector('#sip-live-still');
    if (video) video.hidden = true;
    if (preview) {
      preview.src = _liveObjectUrl;
      preview.hidden = false;
    }

    var reader = new FileReader();
    reader.onload = function (event) {
      var dataUrl = String(event.target && event.target.result || '');
      var source = Promise.resolve(dataUrl);
      if (window.SipDBHelpers && typeof window.SipDBHelpers.resizeDataUrl === 'function') {
        source = window.SipDBHelpers.resizeDataUrl(dataUrl, 480, 0.84);
      }
      source
        .then(function (resized) {
          return window.SipML.predict(resized);
        })
        .then(function (result) {
          renderLivePrediction(result);
          setLiveStatus('Prediksi foto selesai. Pilih foto lain atau mulai kamera live.');
        })
        .catch(function (error) {
          setLiveStatus(error && error.message ? error.message : 'Gagal memprediksi foto.');
        });
    };
    reader.onerror = function () {
      setLiveStatus('Gagal membaca foto dari perangkat.');
    };
    reader.readAsDataURL(file);
  }

  function startLiveCamera(card) {
    var btn = card.querySelector('#sip-live-start');
    if (_liveRunning) {
      stopLiveCamera();
      return;
    }
    if (!window.SipML || typeof window.SipML.predict !== 'function') {
      setLiveStatus('Model AI belum siap. Muat ulang halaman atau latih model dulu.');
      return;
    }
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setLiveStatus('Kamera live di HP butuh HTTPS. Pakai tombol Kamera HP atau Galeri/Folder di kartu ini.');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setLiveStatus('Browser belum mendukung kamera live. Pakai tombol Kamera HP atau Galeri/Folder.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Menyiapkan kamera...';
    }
    setLiveStatus('Memeriksa model dan izin kamera...');

    Promise.resolve(window.SipML.hasModel ? window.SipML.hasModel() : true)
      .then(function (ready) {
        if (!ready) throw new Error('Model belum dilatih. Buka Latih Model dulu.');
        return navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 960 } },
          audio: false,
        });
      })
      .then(function (stream) {
        _liveStream = stream;
        _liveRunning = true;
        var video = card.querySelector('video');
        if (video) {
          video.srcObject = stream;
          video.play().catch(function () {});
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Stop Kamera';
          btn.classList.add('sip-live-stop');
        }
        setLiveStatus('Kamera aktif. Memuat prediksi pertama...');
        runLivePredictionLoop(video);
      })
      .catch(function (error) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Mulai Kamera Live';
          btn.classList.remove('sip-live-stop');
        }
        var message = error && error.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Izinkan kamera di browser atau gunakan foto biasa.'
          : (error && error.message ? error.message : 'Kamera tidak tersedia.');
        setLiveStatus(message);
      });
  }

  function mountLiveTestCard() {
    var existing = document.getElementById('sip-live-test-card');
    if (!isTestPageVisible()) {
      stopLiveCamera();
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    var fotoTitle = Array.from(document.querySelectorAll('div')).find(function (el) {
      return el.textContent && el.textContent.trim() === 'Foto Uji';
    });
    var grid = fotoTitle ? fotoTitle.closest("[class*='grid']") : null;
    var parent = grid && grid.parentElement ? grid.parentElement : null;
    if (!parent || !grid) return;

    var card = document.createElement('div');
    card.id = 'sip-live-test-card';
    card.innerHTML =
      '<div class="sip-live-head">' +
        '<div>' +
          '<div class="sip-live-kicker">Mode Teachable Machine</div>' +
          '<div class="sip-live-title">Kamera Live: AI menebak langsung</div>' +
          '<div class="sip-live-sub">Arahkan kamera ke sampah. Jika HP memblokir kamera live, pakai Kamera HP atau Galeri/Folder.</div>' +
        '</div>' +
        '<div class="sip-live-actions">' +
          '<button id="sip-live-start" class="sip-live-btn">Mulai Kamera Live</button>' +
          '<button id="sip-live-camera-file" class="sip-live-btn sip-live-secondary">Kamera HP</button>' +
          '<button id="sip-live-gallery-file" class="sip-live-btn sip-live-secondary">Galeri/Folder</button>' +
        '</div>' +
      '</div>' +
      '<div class="sip-live-body">' +
        '<div class="sip-live-video-wrap">' +
          '<video playsinline muted autoplay></video>' +
          '<img id="sip-live-still" alt="Foto uji" hidden>' +
          '<div class="sip-live-frame"></div>' +
          '<div id="sip-live-status" class="sip-live-status">Kamera belum aktif.</div>' +
        '</div>' +
        '<div class="sip-live-result">' +
          '<div class="sip-live-kicker">Prediksi saat ini</div>' +
          '<div id="sip-live-label" class="sip-live-pred-label">-</div>' +
          '<div id="sip-live-confidence" class="sip-live-confidence">Mulai kamera untuk melihat hasil.</div>' +
          '<div id="sip-live-bars" class="sip-live-bars"></div>' +
          '<div class="sip-live-note">Gunakan hasil live sebagai demo cepat. Untuk mencatat akurasi, tetap gunakan foto uji dan tandai benar/salah seperti biasa.</div>' +
        '</div>' +
      '</div>';
    parent.insertBefore(card, grid);

    var startBtn = card.querySelector('#sip-live-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () { startLiveCamera(card); });
    }
    var cameraBtn = card.querySelector('#sip-live-camera-file');
    if (cameraBtn) {
      cameraBtn.addEventListener('click', function () { openMobileImagePicker('camera'); });
    }
    var galleryBtn = card.querySelector('#sip-live-gallery-file');
    if (galleryBtn) {
      galleryBtn.addEventListener('click', function () { openMobileImagePicker('gallery'); });
    }
  }

  function installLiveTestObserver() {
    var observer = new MutationObserver(function () { mountLiveTestCard(); });
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    mountLiveTestCard();
    window.addEventListener('pagehide', stopLiveCamera);
  }

  /* ────────────────────────────────────────────────
   * PATCH — window.SipML.train
   * Hanya untuk Feature 1 (timer) dan Feature 2 (akurasi).
   * Feature 3 sudah ditangani di click interceptor di atas.
   * ──────────────────────────────────────────────── */
  function patchSipMLTrain() {
    /* Tunggu hingga SipML tersedia */
    if (!window.SipML || typeof window.SipML.train !== 'function') {
      setTimeout(patchSipMLTrain, 400);
      return;
    }

    /* Cegah double-patch */
    if (window.SipML._sipEhPatched) return;
    window.SipML._sipEhPatched = true;

    var origTrain = window.SipML.train.bind(window.SipML);

    window.SipML.train = async function (callbacks) {
      callbacks = callbacks || {};

      /* ── Feature 1: Tampilkan timer ── */
      showTrainingTimer();

      var wrappedCallbacks = {
        onStatus: callbacks.onStatus
          ? function (status, progress) { callbacks.onStatus(status, progress); }
          : undefined,

        onEpoch: callbacks.onEpoch,

        onDone: function (result) {
          /* Feature 1: Sembunyikan timer */
          hideTrainingTimer();

          /* Teruskan ke React */
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
        /* Sembunyikan timer walau ada error teknis */
        hideTrainingTimer();
        throw err;
      }
    };

    console.log('[SIPILAH] Training enhancements v1.0 aktif ✓');
  }

  /* ─── INIT ─── */
  injectStyles();

  /* Click interceptor bisa dipasang segera (tidak butuh SipML) */
  installClickInterceptor();
  installLiveTestObserver();

  /* SipML patch butuh polling karena bundle.js load async */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchSipMLTrain);
  } else {
    patchSipMLTrain();
  }
})();
