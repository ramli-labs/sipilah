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
    '#sip-eh-warn-overlay,#sip-eh-train-timer,#sip-eh-acc-toast,#sip-live-test-card,#sip-dataset-quality-card,#sip-presentation-check-card,#sip-dup-photo-overlay,#sip-project-log-card,#sip-action-recommend-card{',
    '  box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;',
    '}',
    '#sip-reset-test-card{box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif}',

    /* Dataset quality helper */
    '#sip-dataset-quality-card{border:1px solid #bae6fd;background:linear-gradient(135deg,#f0f9ff,#fff);border-radius:18px;padding:16px 18px;margin:0 0 18px;box-shadow:0 10px 28px rgba(15,23,42,.05)}',
    '#sip-dataset-quality-card[data-tone="good"]{border-color:#bbf7d0;background:linear-gradient(135deg,#f0fdf4,#fff)}',
    '#sip-dataset-quality-card[data-tone="warn"]{border-color:#fde68a;background:linear-gradient(135deg,#fffbeb,#fff)}',
    '#sip-dataset-quality-card[data-tone="bad"]{border-color:#fecdd3;background:linear-gradient(135deg,#fff1f2,#fff)}',
    '.sip-dq-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}',
    '.sip-dq-kicker{font-size:11px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:#0369a1}',
    '#sip-dataset-quality-card[data-tone="good"] .sip-dq-kicker{color:#15803d}',
    '#sip-dataset-quality-card[data-tone="warn"] .sip-dq-kicker{color:#b45309}',
    '#sip-dataset-quality-card[data-tone="bad"] .sip-dq-kicker{color:#be123c}',
    '.sip-dq-title{font-size:18px;font-weight:950;color:#0f172a;margin-top:2px}',
    '.sip-dq-sub{font-size:13px;color:#475569;line-height:1.45;margin-top:3px;max-width:720px}',
    '.sip-dq-score{border-radius:14px;background:white;border:1px solid #e2e8f0;padding:9px 12px;font-weight:950;color:#0f172a;min-width:96px;text-align:center}',
    '.sip-dq-score span{display:block;font-size:11px;color:#64748b;font-weight:850;margin-top:1px}',
    '.sip-dq-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px}',
    '.sip-dq-cat{border:1px solid #e2e8f0;background:rgba(255,255,255,.78);border-radius:14px;padding:10px}',
    '.sip-dq-cat-top{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:900;color:#334155}',
    '.sip-dq-count{font-variant-numeric:tabular-nums;color:#0f172a}',
    '.sip-dq-track{height:8px;border-radius:999px;background:#e2e8f0;overflow:hidden;margin-top:8px}',
    '.sip-dq-fill{height:100%;border-radius:999px;min-width:3px}',
    '.sip-dq-advice{margin-top:12px;border-radius:14px;background:rgba(255,255,255,.72);border:1px solid #e2e8f0;padding:10px 12px;color:#475569;font-size:13px;line-height:1.5}',
    '.sip-dq-advice strong{color:#0f172a}',

    /* Presentation readiness checklist */
    '#sip-presentation-check-card{border:1px solid #bbf7d0;background:linear-gradient(135deg,#f0fdf4,#f8fafc);border-radius:18px;padding:16px 18px;margin:0 0 18px;box-shadow:0 10px 28px rgba(15,23,42,.05)}',
    '#sip-presentation-check-card[data-ready="no"]{border-color:#fde68a;background:linear-gradient(135deg,#fffbeb,#fff)}',
    '.sip-pc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}',
    '.sip-pc-kicker{font-size:11px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:#15803d}',
    '#sip-presentation-check-card[data-ready="no"] .sip-pc-kicker{color:#b45309}',
    '.sip-pc-title{font-size:18px;font-weight:950;color:#0f172a;margin-top:2px}',
    '.sip-pc-sub{font-size:13px;color:#475569;line-height:1.45;margin-top:3px;max-width:760px}',
    '.sip-pc-score{border-radius:14px;background:white;border:1px solid #e2e8f0;padding:9px 12px;font-weight:950;color:#0f172a;min-width:104px;text-align:center}',
    '.sip-pc-score span{display:block;font-size:11px;color:#64748b;font-weight:850;margin-top:1px}',
    '.sip-pc-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:14px}',
    '.sip-pc-item{border:1px solid #e2e8f0;background:rgba(255,255,255,.78);border-radius:14px;padding:10px 11px;display:flex;gap:9px;align-items:flex-start}',
    '.sip-pc-mark{width:24px;height:24px;border-radius:9px;display:grid;place-items:center;font-size:13px;font-weight:1000;flex-shrink:0;background:#dcfce7;color:#166534}',
    '.sip-pc-item[data-done="no"] .sip-pc-mark{background:#fef3c7;color:#92400e}',
    '.sip-pc-label{font-size:13px;font-weight:950;color:#0f172a}',
    '.sip-pc-note{font-size:12px;color:#64748b;line-height:1.4;margin-top:2px}',
    '.sip-pc-advice{margin-top:12px;border-radius:14px;background:rgba(255,255,255,.72);border:1px solid #e2e8f0;padding:10px 12px;color:#475569;font-size:13px;line-height:1.5}',
    '.sip-pc-advice strong{color:#0f172a}',

    /* Duplicate photo warning */
    '#sip-dup-photo-overlay{position:fixed;inset:0;z-index:10030;background:rgba(15,23,42,.6);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px;animation:sip-fade-in .2s ease}',
    '.sip-dup-box{width:min(520px,100%);background:#fff;border:1px solid #fed7aa;border-radius:24px;padding:22px;box-shadow:0 28px 80px -34px rgba(15,23,42,.72);animation:sip-pop-in .25s cubic-bezier(.34,1.56,.64,1)}',
    '.sip-dup-icon{width:44px;height:44px;border-radius:15px;background:#f59e0b;color:#422006;display:grid;place-items:center;font-weight:1000;margin-bottom:12px}',
    '.sip-dup-title{font-size:20px;font-weight:1000;color:#0f172a;line-height:1.15}',
    '.sip-dup-body{margin-top:9px;color:#475569;font-size:14px;line-height:1.55}',
    '.sip-dup-preview{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}',
    '.sip-dup-img{border:1px solid #e2e8f0;background:#0f172a;border-radius:15px;overflow:hidden;aspect-ratio:4/3;position:relative}',
    '.sip-dup-img img{width:100%;height:100%;object-fit:cover;display:block}',
    '.sip-dup-img span{position:absolute;left:8px;bottom:8px;border-radius:999px;background:rgba(15,23,42,.78);color:#fff;font-size:11px;font-weight:900;padding:5px 8px}',
    '.sip-dup-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px;flex-wrap:wrap}',
    '.sip-dup-btn{border:0;border-radius:14px;padding:11px 14px;font-size:14px;font-weight:900;cursor:pointer}',
    '.sip-dup-btn.ghost{background:#f1f5f9;color:#334155}',
    '.sip-dup-btn.keep{background:#15803d;color:#fff}',

    /* Project process log */
    '#sip-project-log-card{border:1px solid #dbeafe;background:linear-gradient(135deg,#eff6ff,#fff);border-radius:18px;padding:16px 18px;margin:0 0 18px;box-shadow:0 10px 28px rgba(15,23,42,.05)}',
    '.sip-log-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}',
    '.sip-log-kicker{font-size:11px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:#0369a1}',
    '.sip-log-title{font-size:18px;font-weight:950;color:#0f172a;margin-top:2px}',
    '.sip-log-sub{font-size:13px;color:#475569;line-height:1.45;margin-top:3px;max-width:760px}',
    '.sip-log-list{display:grid;gap:8px;margin-top:14px}',
    '.sip-log-item{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:flex-start;border:1px solid #e2e8f0;background:rgba(255,255,255,.78);border-radius:14px;padding:10px 11px}',
    '.sip-log-dot{width:26px;height:26px;border-radius:10px;background:#dbeafe;color:#0369a1;display:grid;place-items:center;font-size:12px;font-weight:1000}',
    '.sip-log-item-title{font-size:13px;font-weight:950;color:#0f172a}',
    '.sip-log-item-detail{font-size:12px;color:#64748b;line-height:1.4;margin-top:2px}',
    '.sip-log-time{font-size:11px;color:#94a3b8;font-weight:900;white-space:nowrap}',
    '.sip-log-empty{margin-top:12px;border:1px dashed #cbd5e1;border-radius:14px;padding:12px;color:#64748b;font-size:13px;background:#f8fafc}',

    /* Automatic action recommendation */
    '#sip-action-recommend-card{border:1px solid #bbf7d0;background:linear-gradient(135deg,#ecfdf5,#fff);border-radius:18px;padding:16px 18px;margin:0 0 18px;box-shadow:0 10px 28px rgba(15,23,42,.05)}',
    '.sip-ar-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}',
    '.sip-ar-kicker{font-size:11px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:#15803d}',
    '.sip-ar-title{font-size:18px;font-weight:950;color:#0f172a;margin-top:2px}',
    '.sip-ar-sub{font-size:13px;color:#475569;line-height:1.45;margin-top:3px;max-width:760px}',
    '.sip-ar-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}',
    '.sip-ar-item{border:1px solid #e2e8f0;background:rgba(255,255,255,.8);border-radius:15px;padding:12px;display:flex;gap:10px;align-items:flex-start}',
    '.sip-ar-number{width:28px;height:28px;border-radius:10px;background:#15803d;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:1000;flex-shrink:0}',
    '.sip-ar-item-title{font-size:13px;font-weight:950;color:#0f172a}',
    '.sip-ar-item-body{font-size:12px;color:#64748b;line-height:1.45;margin-top:3px}',
    '.sip-ar-copy{border:0;border-radius:13px;background:#15803d;color:#fff;padding:10px 13px;font-size:13px;font-weight:900;cursor:pointer;white-space:nowrap}',
    '.sip-ar-copy:hover{background:#166534}',
    '@media print{',
    '  #sip-eh-warn-overlay,#sip-eh-train-timer,#sip-eh-acc-toast,#sip-live-test-card,#sip-dup-photo-overlay,.sip-ar-copy,.sip-show-btn{display:none!important}',
    '  #sip-presentation-check-card,#sip-action-recommend-card,#sip-project-log-card,#sip-dataset-quality-card{box-shadow:none!important;background:#fff!important;border-color:#cbd5e1!important;break-inside:avoid;page-break-inside:avoid}',
    '  .sip-pc-score,.sip-dq-score,.sip-pc-item,.sip-ar-item,.sip-log-item{background:#fff!important}',
    '  .sip-ar-list,.sip-pc-list{grid-template-columns:1fr!important}',
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
    '.sip-live-video-wrap video{width:100%;height:100%;object-fit:cover}',
    '#sip-live-test-card[data-facing="user"] .sip-live-video-wrap video{transform:scaleX(-1)}',
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
    '.sip-live-counter{display:inline-flex;margin-top:10px;border:1px solid #bae6fd;background:#f0f9ff;color:#0369a1;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:900}',
    '.sip-live-record{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}',
    '.sip-live-record .sip-live-btn{width:100%;padding:10px 12px}',
    '.sip-live-record .sip-live-btn:disabled{opacity:.52;cursor:not-allowed;filter:grayscale(.25)}',
    '.sip-live-btn.sip-live-good{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}',
    '.sip-live-btn.sip-live-bad{background:#ffe4e6;color:#be123c;border:1px solid #fecdd3}',
    '.sip-live-btn.sip-live-wide{grid-column:1/-1;background:#fff;color:#0369a1;border:1px solid #bae6fd}',
    '.sip-live-truth{margin-top:10px;border:1px solid #fed7aa;background:#fff7ed;border-radius:14px;padding:10px}',
    '.sip-live-truth[hidden]{display:none}',
    '.sip-live-truth-title{font-size:12px;font-weight:900;color:#9a3412;margin-bottom:8px}',
    '.sip-live-truth-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}',
    '.sip-live-truth-btn{border:0;border-radius:11px;padding:9px 8px;color:#fff;font-size:12px;font-weight:950;cursor:pointer}',
    '#sip-reset-test-card{border:1px solid #fecdd3;background:linear-gradient(135deg,#fff1f2,#fff);border-radius:18px;padding:14px 16px;margin:0 0 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}',
    '.sip-reset-test-title{font-size:15px;font-weight:950;color:#881337}',
    '.sip-reset-test-sub{font-size:12px;color:#9f1239;margin-top:2px;line-height:1.4}',
    '.sip-reset-test-btn{border:0;border-radius:13px;background:#e11d48;color:#fff;padding:10px 14px;font-weight:900;font-size:13px;cursor:pointer}',
    '.sip-reset-test-btn:disabled{opacity:.55;cursor:not-allowed}',
    '#sip-reset-confirm{position:fixed;inset:0;z-index:10020;background:rgba(15,23,42,.58);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px}',
    '.sip-reset-confirm-box{width:min(440px,100%);background:linear-gradient(180deg,#fff,#fff7f8);border:1px solid #fecdd3;border-radius:24px;padding:22px;box-shadow:0 28px 80px -34px rgba(15,23,42,.7)}',
    '.sip-reset-confirm-icon{width:44px;height:44px;border-radius:15px;background:#e11d48;color:#fff;display:grid;place-items:center;font-weight:1000;margin-bottom:12px}',
    '.sip-reset-confirm-title{font-size:20px;font-weight:1000;color:#0f172a;line-height:1.15}',
    '.sip-reset-confirm-body{margin-top:10px;color:#475569;font-size:14px;line-height:1.6}',
    '.sip-reset-confirm-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:20px;flex-wrap:wrap}',
    '.sip-reset-confirm-btn{border:0;border-radius:14px;padding:11px 14px;font-size:14px;font-weight:900;cursor:pointer}',
    '.sip-reset-confirm-btn.ghost{background:#eef2f7;color:#334155}',
    '.sip-reset-confirm-btn.danger{background:#e11d48;color:#fff}',

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
    '  .sip-dq-grid{grid-template-columns:repeat(2,minmax(0,1fr))}',
    '  .sip-pc-list{grid-template-columns:1fr}',
    '  .sip-ar-list{grid-template-columns:1fr}',
    '  .sip-log-item{grid-template-columns:auto 1fr}',
    '  .sip-log-time{grid-column:2;font-size:10px}',
    '  .sip-ar-copy{width:100%;white-space:normal}',
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
  var _liveFacingMode = 'environment';
  var _liveLastResult = null;
  var _liveLastRecordedKey = null;

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
    var switchBtn = card.querySelector('#sip-live-switch');
    if (switchBtn) {
      switchBtn.disabled = false;
      switchBtn.textContent = _liveFacingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan';
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
    _liveLastResult = result;
    if (getLivePredictionKey(result) !== _liveLastRecordedKey) {
      setLiveRecordDisabled(false);
    }

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

  function getProjectState() {
    try {
      return JSON.parse(localStorage.getItem('sipilah_project_v1') || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function writeProjectState(project) {
    try {
      localStorage.setItem('sipilah_project_v1', JSON.stringify(project || {}));
    } catch (error) {
      setLiveStatus('Prediksi terbaca, tapi storage perangkat penuh sehingga riwayat tidak tersimpan.');
    }
  }

  function getLivePredictionKey(result) {
    if (!result || !result.label) return '';
    var probs = Array.isArray(result.allCategories)
      ? result.allCategories.map(function (item) {
        return String(item.cat || '') + ':' + Math.round(item.prob || 0);
      }).join('|')
      : '';
    return [result.label, Math.round(result.confidence || 0), probs].join('|');
  }

  function getLiveRecordedCount() {
    var project = getProjectState();
    var predictions = Array.isArray(project.predictions) ? project.predictions : [];
    return predictions.filter(function (item) {
      return item && item.desc === 'Dicatat dari kamera live';
    }).length;
  }

  function updateLiveCounter() {
    var el = document.getElementById('sip-live-counter');
    if (el) el.textContent = 'Riwayat live: ' + getLiveRecordedCount() + ' uji';
  }

  function setLiveRecordDisabled(disabled) {
    var good = document.getElementById('sip-live-record-good');
    var bad = document.getElementById('sip-live-record-bad');
    if (good) good.disabled = !!disabled;
    if (bad) bad.disabled = !!disabled;
  }

  var DATASET_CATEGORIES = [
    { key: 'plastik', label: 'Plastik', short: 'P', color: '#0ea5e9' },
    { key: 'kertas', label: 'Kertas', short: 'K', color: '#f59e0b' },
    { key: 'organik', label: 'Organik', short: 'O', color: '#10b981' },
    { key: 'residu', label: 'Residu', short: 'R', color: '#64748b' },
  ];
  var _datasetQualityReadId = 0;

  function isDatasetQualityPageVisible() {
    var text = document.body ? document.body.innerText || '' : '';
    return (
      text.indexOf('Dataset Sampah') >= 0 ||
      text.indexOf('Latih Model') >= 0 ||
      text.indexOf('Dashboard Kolaborasi Kelas') >= 0
    ) && text.indexOf('SIPILAH') >= 0;
  }

  function normalizeDatasetCounts(raw) {
    raw = raw || {};
    var counts = {};
    DATASET_CATEGORIES.forEach(function (cat) {
      var direct = raw[cat.key];
      var label = raw[cat.label];
      counts[cat.key] = Math.max(0, Number(direct != null ? direct : label) || 0);
    });
    return counts;
  }

  function getFallbackDatasetCounts() {
    var project = getProjectState();
    return normalizeDatasetCounts(project.datasetCount || project.counts || {});
  }

  function readDatasetCounts() {
    if (window.SipDB && typeof window.SipDB.getCounts === 'function') {
      return window.SipDB.getCounts()
        .then(function (counts) {
          counts = normalizeDatasetCounts(counts);
          var total = DATASET_CATEGORIES.reduce(function (sum, cat) {
            return sum + (counts[cat.key] || 0);
          }, 0);
          var fallback = getFallbackDatasetCounts();
          var fallbackTotal = DATASET_CATEGORIES.reduce(function (sum, cat) {
            return sum + (fallback[cat.key] || 0);
          }, 0);
          return total === 0 && fallbackTotal > 0 ? fallback : counts;
        })
        .catch(getFallbackDatasetCounts);
    }
    return Promise.resolve(getFallbackDatasetCounts());
  }

  function analyzeDatasetQuality(counts) {
    counts = normalizeDatasetCounts(counts);
    var values = DATASET_CATEGORIES.map(function (cat) { return counts[cat.key] || 0; });
    var total = values.reduce(function (sum, value) { return sum + value; }, 0);
    var min = Math.min.apply(Math, values);
    var max = Math.max.apply(Math, values);
    var missing = DATASET_CATEGORIES.filter(function (cat) { return (counts[cat.key] || 0) === 0; });
    var low = DATASET_CATEGORIES.filter(function (cat) { return (counts[cat.key] || 0) > 0 && (counts[cat.key] || 0) < MIN_PER_CATEGORY; });
    var imbalance = min > 0 && max > Math.ceil(min * 1.8);
    var score = 0;

    if (total >= MIN_TOTAL_PHOTOS) score += 35;
    else score += Math.round(Math.min(1, total / MIN_TOTAL_PHOTOS) * 35);
    score += Math.round((DATASET_CATEGORIES.length - missing.length) / DATASET_CATEGORIES.length * 25);
    score += Math.round(DATASET_CATEGORIES.filter(function (cat) {
      return (counts[cat.key] || 0) >= MIN_PER_CATEGORY;
    }).length / DATASET_CATEGORIES.length * 25);
    if (!imbalance && total > 0) score += 15;
    score = Math.max(0, Math.min(100, score));

    var tone = 'good';
    var title = 'Dataset siap dilatih';
    var advice = 'Distribusi dataset sudah cukup sehat. Lanjutkan latih model, lalu cek pola kesalahan di halaman Akurasi.';

    if (!total) {
      tone = 'bad';
      title = 'Dataset masih kosong';
      advice = 'Tambahkan foto untuk empat kategori: Plastik, Kertas, Organik, dan Residu.';
    } else if (missing.length) {
      tone = 'bad';
      title = 'Ada kategori belum terisi';
      advice = 'Isi dulu kategori <strong>' + missing.map(function (cat) { return cat.label; }).join(', ') + '</strong> supaya AI tidak berat sebelah.';
    } else if (total < MIN_TOTAL_PHOTOS || low.length) {
      tone = 'warn';
      title = 'Dataset perlu ditambah';
      advice = 'Target aman: minimal <strong>' + MIN_TOTAL_PHOTOS + ' foto total</strong> dan <strong>' + MIN_PER_CATEGORY + ' foto per kategori</strong>. Tambahkan terutama: <strong>' + getPriorityCategories(counts).join(', ') + '</strong>.';
    } else if (imbalance) {
      tone = 'warn';
      title = 'Distribusi dataset kurang seimbang';
      advice = 'Kategori paling sedikit perlu ditambah agar AI tidak terlalu sering memilih kategori yang fotonya paling banyak. Prioritas: <strong>' + getPriorityCategories(counts).join(', ') + '</strong>.';
    }

    return {
      counts: counts,
      total: total,
      min: min,
      max: max,
      score: score,
      tone: tone,
      title: title,
      advice: advice,
    };
  }

  function getPriorityCategories(counts) {
    var min = Math.min.apply(Math, DATASET_CATEGORIES.map(function (cat) {
      return counts[cat.key] || 0;
    }));
    return DATASET_CATEGORIES
      .filter(function (cat) { return (counts[cat.key] || 0) === min || (counts[cat.key] || 0) < MIN_PER_CATEGORY; })
      .map(function (cat) { return cat.label; })
      .slice(0, 4);
  }

  function findDatasetQualityHost() {
    var exactTitles = [
      'Dataset Sampah',
      'Latih Model AI',
      'Latih Model',
      'Dashboard Kolaborasi Kelas',
    ];
    var title = Array.from(document.querySelectorAll('h1, h2, h3, div')).find(function (el) {
      var text = (el.textContent || '').trim();
      return exactTitles.indexOf(text) >= 0;
    });
    if (title) {
      return title.closest('.space-y-6, main, [class*="space-y"]') || title.parentElement;
    }
    var main = document.querySelector('main');
    return main ? main.querySelector('[class*="space-y"]') || main : null;
  }

  function renderDatasetQualityCard(analysis) {
    var card = document.getElementById('sip-dataset-quality-card');
    var host = findDatasetQualityHost();
    if (!host) return;
    if (!card) {
      card = document.createElement('div');
      card.id = 'sip-dataset-quality-card';
      host.insertBefore(card, host.firstElementChild && host.firstElementChild.nextSibling ? host.firstElementChild.nextSibling : host.firstChild);
    } else if (card.parentElement !== host) {
      host.insertBefore(card, host.firstElementChild && host.firstElementChild.nextSibling ? host.firstElementChild.nextSibling : host.firstChild);
    }

    var max = Math.max(analysis.max, MIN_PER_CATEGORY, 1);
    var signature = [
      analysis.tone,
      analysis.score,
      analysis.total,
      DATASET_CATEGORIES.map(function (cat) { return analysis.counts[cat.key] || 0; }).join(','),
    ].join('|');
    card.setAttribute('data-tone', analysis.tone);
    if (card.getAttribute('data-sip-signature') === signature) return;
    card.setAttribute('data-sip-signature', signature);
    card.innerHTML =
      '<div class="sip-dq-head">' +
        '<div>' +
          '<div class="sip-dq-kicker">Kualitas Dataset</div>' +
          '<div class="sip-dq-title">' + escapeHtml(analysis.title) + '</div>' +
          '<div class="sip-dq-sub">' + analysis.total + ' foto tercatat. Target sehat: ' + MIN_TOTAL_PHOTOS + ' total, minimal ' + MIN_PER_CATEGORY + ' foto per kategori, dan distribusi tidak terlalu timpang.</div>' +
        '</div>' +
        '<div class="sip-dq-score">' + analysis.score + '%<span>skor data</span></div>' +
      '</div>' +
      '<div class="sip-dq-grid">' +
        DATASET_CATEGORIES.map(function (cat) {
          var count = analysis.counts[cat.key] || 0;
          var pct = Math.round(count / max * 100);
          return (
            '<div class="sip-dq-cat">' +
              '<div class="sip-dq-cat-top"><span>' + cat.label + '</span><span class="sip-dq-count">' + count + '</span></div>' +
              '<div class="sip-dq-track"><div class="sip-dq-fill" style="width:' + pct + '%;background:' + cat.color + '"></div></div>' +
            '</div>'
          );
        }).join('') +
      '</div>' +
      '<div class="sip-dq-advice">' + analysis.advice + '</div>';
  }

  function mountDatasetQualityCard() {
    var existing = document.getElementById('sip-dataset-quality-card');
    if (!isDatasetQualityPageVisible()) {
      if (existing) existing.remove();
      return;
    }
    var readId = ++_datasetQualityReadId;
    readDatasetCounts().then(function (counts) {
      if (readId !== _datasetQualityReadId) return;
      if (!isDatasetQualityPageVisible()) return;
      renderDatasetQualityCard(analyzeDatasetQuality(counts));
    });
  }

  function readJSONStorage(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  var PROJECT_LOG_STORAGE = 'sipilah_project_log_v1';
  var PROJECT_LOG_LIMIT = 60;

  function getProjectLog() {
    var log = readJSONStorage(PROJECT_LOG_STORAGE, []);
    return Array.isArray(log) ? log : [];
  }

  function logProjectEvent(type, title, detail) {
    if (window.SipProjectLogMuted && type === 'photo') return;
    var entry = {
      type: type || 'activity',
      title: title || 'Aktivitas proyek',
      detail: detail || '',
      ts: Date.now(),
    };
    try {
      localStorage.setItem(PROJECT_LOG_STORAGE, JSON.stringify([entry].concat(getProjectLog()).slice(0, PROJECT_LOG_LIMIT)));
    } catch (error) {}
    mountProjectLogCard();
  }

  window.SipProjectLog = logProjectEvent;

  function formatProjectLogTime(ts) {
    try {
      return new Date(ts || Date.now()).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  }

  function getProjectLogIcon(type) {
    return {
      photo: 'F',
      import: 'I',
      train: 'AI',
      reset: 'R',
      duplicate: 'D',
      export: 'E',
    }[type] || 'L';
  }

  function isProjectLogPageVisible() {
    var text = document.body ? document.body.innerText || '' : '';
    return text.indexOf('Laporan Proyek') >= 0 && text.indexOf('SIPILAH') >= 0;
  }

  function findProjectLogHost() {
    var title = Array.from(document.querySelectorAll('h1, h2, h3, div')).find(function (el) {
      return (el.textContent || '').trim() === 'Laporan Proyek';
    });
    if (title) return title.closest('.space-y-6, main, [class*="space-y"]') || title.parentElement;
    var main = document.querySelector('main');
    return main ? main.querySelector('[class*="space-y"]') || main : null;
  }

  function insertReportEnhancementCard(host, card) {
    host.insertBefore(card, host.firstElementChild && host.firstElementChild.nextSibling ? host.firstElementChild.nextSibling : host.firstChild);
    orderReportEnhancementCards(host);
  }

  function orderReportEnhancementCards(host) {
    if (!host) return;
    var ids = [
      'sip-presentation-check-card',
      'sip-action-recommend-card',
      'sip-project-log-card',
    ];
    var anchor = host.firstElementChild && host.firstElementChild.nextSibling ? host.firstElementChild.nextSibling : host.firstChild;
    ids.slice().reverse().forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.parentElement === host) {
        host.insertBefore(el, anchor);
      }
    });
  }

  function mountProjectLogCard() {
    var existing = document.getElementById('sip-project-log-card');
    if (!isProjectLogPageVisible()) {
      if (existing) existing.remove();
      return;
    }
    var host = findProjectLogHost();
    if (!host) return;
    var log = getProjectLog().slice(0, 8);
    var signature = log.map(function (item) { return String(item.ts) + item.title; }).join('|');
    var card = existing;
    if (!card) {
      card = document.createElement('div');
      card.id = 'sip-project-log-card';
      insertReportEnhancementCard(host, card);
    } else if (card.parentElement !== host) {
      insertReportEnhancementCard(host, card);
    } else {
      orderReportEnhancementCards(host);
    }
    if (card.getAttribute('data-sip-signature') === signature) return;
    card.setAttribute('data-sip-signature', signature);
    card.innerHTML =
      '<div class="sip-log-head">' +
        '<div>' +
          '<div class="sip-log-kicker">Log Proses Proyek</div>' +
          '<div class="sip-log-title">Riwayat perbaikan dataset dan model</div>' +
          '<div class="sip-log-sub">Delapan aktivitas terbaru sebagai bukti proses kerja kelompok saat menyusun laporan atau presentasi.</div>' +
        '</div>' +
      '</div>' +
      (log.length
        ? '<div class="sip-log-list">' + log.map(function (item) {
          return (
            '<div class="sip-log-item">' +
              '<div class="sip-log-dot">' + escapeHtml(getProjectLogIcon(item.type)) + '</div>' +
              '<div><div class="sip-log-item-title">' + escapeHtml(item.title) + '</div><div class="sip-log-item-detail">' + escapeHtml(item.detail || '') + '</div></div>' +
              '<div class="sip-log-time">' + escapeHtml(formatProjectLogTime(item.ts)) + '</div>' +
            '</div>'
          );
        }).join('') + '</div>'
        : '<div class="sip-log-empty">Belum ada aktivitas tercatat. Tambah foto, import dataset, latih model, atau uji prediksi untuk mulai membuat jejak proses.</div>');
  }

  function getMostFrequentWrongLabel(predictions) {
    var wrong = {};
    (predictions || []).forEach(function (item) {
      if (item && item.isCorrect === false) {
        var key = item.truth || item.label || 'kategori tertentu';
        wrong[key] = (wrong[key] || 0) + 1;
      }
    });
    return Object.keys(wrong).sort(function (a, b) { return wrong[b] - wrong[a]; })[0] || '';
  }

  function buildActionRecommendations(counts) {
    var project = getProjectState();
    var tests = readJSONStorage('sipilah_tests_v1', {}) || {};
    var predictions = Array.isArray(project.predictions) ? project.predictions : [];
    var correct = predictions.filter(function (item) { return item && item.isCorrect; }).length;
    var testAccuracy = predictions.length ? Math.round(correct / predictions.length * 100) : 0;
    var trainAccuracy = Math.round(project.accuracy || 0);
    var dataset = analyzeDatasetQuality(counts || getFallbackDatasetCounts());
    var priority = getPriorityCategories(dataset.counts);
    var wrongLabel = getMostFrequentWrongLabel(predictions);
    var preScore = tests.pre && typeof tests.pre.score === 'number' ? tests.pre.score : null;
    var postScore = tests.post && typeof tests.post.score === 'number' ? tests.post.score : null;
    var gain = preScore != null && postScore != null ? postScore - preScore : null;
    var items = [];

    if (dataset.tone !== 'good') {
      items.push({
        title: 'Perbaiki keseimbangan dataset',
        body: 'Tambahkan foto kategori ' + (priority.length ? priority.join(', ') : 'yang paling sedikit') + ' dari sudut, cahaya, dan latar yang berbeda.',
      });
    } else {
      items.push({
        title: 'Pertahankan variasi dataset',
        body: 'Dataset sudah cukup sehat. Lanjutkan dengan contoh foto baru agar model tidak hanya mengenali pola yang sama.',
      });
    }

    if (!project.modelReady) {
      items.push({
        title: 'Latih model setelah dataset siap',
        body: 'Setelah semua kategori terisi, buka Latih Model agar laporan memiliki bukti model AI yang bisa diuji.',
      });
    } else if (trainAccuracy < 70 || (predictions.length && testAccuracy < 70)) {
      items.push({
        title: 'Tingkatkan akurasi model',
        body: 'Cek ulang label foto dan tambahkan contoh yang lebih jelas. Bandingkan akurasi latih ' + trainAccuracy + '% dengan akurasi uji ' + (predictions.length ? testAccuracy + '%' : 'yang belum cukup diuji') + '.',
      });
    } else {
      items.push({
        title: 'Gunakan hasil model untuk edukasi',
        body: 'Model sudah cukup kuat untuk demonstrasi. Jelaskan bahwa AI membantu mengenali sampah, tetapi tetap perlu dicek manusia.',
      });
    }

    if (wrongLabel) {
      items.push({
        title: 'Bahas pola kesalahan AI',
        body: 'Kesalahan paling terlihat ada pada ' + wrongLabel + '. Buat contoh pembeda visual agar teman sekelas lebih mudah membedakannya.',
      });
    } else if (predictions.length < 3) {
      items.push({
        title: 'Tambah uji prediksi',
        body: 'Lakukan minimal 3 uji foto baru dan catat benar/salah agar laporan punya bahan analisis kesalahan.',
      });
    } else {
      items.push({
        title: 'Dokumentasikan contoh berhasil',
        body: 'Simpan contoh prediksi yang benar sebagai bukti bahwa dataset dan model sudah bekerja pada foto baru.',
      });
    }

    if (gain != null) {
      items.push({
        title: gain >= 0 ? 'Tunjukkan peningkatan literasi AI' : 'Perkuat refleksi belajar',
        body: 'Skor Pre-Test ' + preScore + ' dan Post-Test ' + postScore + ' menghasilkan perubahan ' + (gain >= 0 ? '+' : '') + gain + ' poin. Gunakan ini sebagai bukti dampak pembelajaran.',
      });
    } else {
      items.push({
        title: 'Lengkapi bukti Pre/Post-Test',
        body: 'Selesaikan Pre-Test dan Post-Test agar laporan menunjukkan perubahan pemahaman siswa sebelum dan sesudah proyek.',
      });
    }

    items.push({
      title: 'Rancang aksi nyata di sekolah',
      body: 'Gunakan hasil proyek untuk kampanye pilah sampah: tempel panduan kategori, siapkan tempat sampah terlabel, dan ajak kelas mencoba model AI.',
    });

    return items.slice(0, 5);
  }

  function findReportHost() {
    var title = Array.from(document.querySelectorAll('h1, h2, h3, div')).find(function (el) {
      return (el.textContent || '').trim() === 'Laporan Proyek';
    });
    if (title) return title.closest('.space-y-6, main, [class*="space-y"]') || title.parentElement;
    var main = document.querySelector('main');
    return main ? main.querySelector('[class*="space-y"]') || main : null;
  }

  function mountActionRecommendationCard() {
    var existing = document.getElementById('sip-action-recommend-card');
    if (!isProjectLogPageVisible()) {
      if (existing) existing.remove();
      return;
    }
    var host = findReportHost();
    if (!host) return;
    readDatasetCounts().then(function (counts) {
      if (!isProjectLogPageVisible()) return;
      var items = buildActionRecommendations(counts);
      var signature = items.map(function (item) { return item.title + item.body; }).join('|');
      var card = document.getElementById('sip-action-recommend-card');
      if (!card) {
        card = document.createElement('div');
        card.id = 'sip-action-recommend-card';
        insertReportEnhancementCard(host, card);
      } else if (card.parentElement !== host) {
        insertReportEnhancementCard(host, card);
      } else {
        orderReportEnhancementCards(host);
      }
      if (card.getAttribute('data-sip-signature') === signature) return;
      card.setAttribute('data-sip-signature', signature);
      card.innerHTML =
        '<div class="sip-ar-head">' +
          '<div>' +
            '<div class="sip-ar-kicker">Rekomendasi Aksi Otomatis</div>' +
            '<div class="sip-ar-title">Langkah nyata setelah proyek AI</div>' +
            '<div class="sip-ar-sub">Saran ini disusun dari dataset, hasil uji, akurasi, dan Pre/Post-Test kelompok.</div>' +
          '</div>' +
          '<button type="button" class="sip-ar-copy">Salin Rekomendasi</button>' +
        '</div>' +
        '<div class="sip-ar-list">' +
          items.map(function (item, index) {
            return (
              '<div class="sip-ar-item">' +
                '<div class="sip-ar-number">' + (index + 1) + '</div>' +
                '<div><div class="sip-ar-item-title">' + escapeHtml(item.title) + '</div><div class="sip-ar-item-body">' + escapeHtml(item.body) + '</div></div>' +
              '</div>'
            );
          }).join('') +
        '</div>';

      var copyBtn = card.querySelector('.sip-ar-copy');
      if (copyBtn) {
        copyBtn.addEventListener('click', function () {
          var text = items.map(function (item, index) {
            return (index + 1) + '. ' + item.title + ': ' + item.body;
          }).join('\n');
          navigator.clipboard.writeText(text).then(function () {
            copyBtn.textContent = 'Tersalin';
            setTimeout(function () { copyBtn.textContent = 'Salin Rekomendasi'; }, 1200);
          }).catch(function () {
            copyBtn.textContent = 'Gagal Salin';
            setTimeout(function () { copyBtn.textContent = 'Salin Rekomendasi'; }, 1200);
          });
        });
      }
    });
  }

  function isPresentationCheckPageVisible() {
    var text = document.body ? document.body.innerText || '' : '';
    return (
      text.indexOf('Laporan Proyek') >= 0 ||
      text.indexOf('Mode Presentasi Lomba') >= 0 ||
      text.indexOf('PROYEK AKTIF') >= 0
    ) && text.indexOf('SIPILAH') >= 0;
  }

  function getPresentationChecklistMetrics(counts) {
    var identity = readJSONStorage('sipilah_identity_v1', {}) || {};
    var project = getProjectState();
    var tests = readJSONStorage('sipilah_tests_v1', {}) || {};
    var predictions = Array.isArray(project.predictions) ? project.predictions : [];
    var wrong = predictions.filter(function (item) { return item && item.isCorrect === false; });
    var dataset = analyzeDatasetQuality(counts || getFallbackDatasetCounts());
    var identityOk = !!(identity.name && identity.kelas && identity.group);
    var schoolOk = !!identity.school;
    var datasetOk = dataset.total >= 8 && DATASET_CATEGORIES.every(function (cat) {
      return (dataset.counts[cat.key] || 0) > 0;
    });
    var datasetStrong = dataset.total >= MIN_TOTAL_PHOTOS && DATASET_CATEGORIES.every(function (cat) {
      return (dataset.counts[cat.key] || 0) >= MIN_PER_CATEGORY;
    });
    var modelReady = !!project.modelReady;
    var tested = predictions.length >= 3;
    var analysisOk = wrong.length > 0 || predictions.length >= 5;
    var testsOk = !!(tests.pre && tests.pre.total && tests.post && tests.post.total);

    return {
      identity: identity,
      dataset: dataset,
      predictions: predictions,
      wrong: wrong,
      items: [
        {
          label: 'Identitas kelompok',
          done: identityOk && schoolOk,
          note: identityOk && schoolOk ? identity.group + ' - ' + identity.school + ' - Kelas ' + identity.kelas : 'Lengkapi nama, kelompok, kelas, dan sekolah.',
        },
        {
          label: 'Dataset siap',
          done: datasetOk,
          note: datasetStrong ? dataset.total + ' foto, dataset sudah sehat.' : dataset.total + ' foto. Minimal semua kategori harus terisi.',
        },
        {
          label: 'Model AI dilatih',
          done: modelReady,
          note: modelReady ? 'Model siap didemokan dan diuji.' : 'Buka Latih Model setelah dataset cukup.',
        },
        {
          label: 'Uji prediksi',
          done: tested,
          note: predictions.length + ' uji tercatat. Target minimal 3 uji.',
        },
        {
          label: 'Analisis kesalahan',
          done: analysisOk,
          note: wrong.length ? wrong.length + ' kesalahan sudah bisa dibahas.' : 'Catat benar/salah agar refleksi lebih kuat.',
        },
        {
          label: 'Pre/Post-Test',
          done: testsOk,
          note: testsOk ? 'Bukti peningkatan literasi sudah lengkap.' : 'Selesaikan Pre-Test dan Post-Test.',
        },
      ],
    };
  }

  function findPresentationCheckHost() {
    var exactTitles = [
      'Laporan Proyek',
      'Proyek Pilah Sampah',
      'Belajar Kecerdasan Artifisial melalui aksi pilah sampah',
    ];
    var title = Array.from(document.querySelectorAll('h1, h2, h3, div')).find(function (el) {
      var text = (el.textContent || '').trim();
      return exactTitles.indexOf(text) >= 0;
    });
    if (title) {
      return title.closest('.space-y-6, main, [class*="space-y"]') || title.parentElement;
    }
    var main = document.querySelector('main');
    return main ? main.querySelector('[class*="space-y"]') || main : null;
  }

  function renderPresentationChecklistCard(metrics) {
    var card = document.getElementById('sip-presentation-check-card');
    var host = findPresentationCheckHost();
    if (!host) return;

    var doneCount = metrics.items.filter(function (item) { return item.done; }).length;
    var score = Math.round(doneCount / metrics.items.length * 100);
    var ready = doneCount === metrics.items.length;
    var nextItem = metrics.items.find(function (item) { return !item.done; });
    var signature = [
      score,
      metrics.dataset.total,
      metrics.predictions.length,
      metrics.items.map(function (item) { return item.done ? '1' : '0'; }).join(''),
    ].join('|');

    if (!card) {
      card = document.createElement('div');
      card.id = 'sip-presentation-check-card';
      insertReportEnhancementCard(host, card);
    } else if (card.parentElement !== host) {
      insertReportEnhancementCard(host, card);
    } else {
      orderReportEnhancementCards(host);
    }
    card.setAttribute('data-ready', ready ? 'yes' : 'no');
    if (card.getAttribute('data-sip-signature') === signature) return;
    card.setAttribute('data-sip-signature', signature);

    card.innerHTML =
      '<div class="sip-pc-head">' +
        '<div>' +
          '<div class="sip-pc-kicker">Checklist Siap Presentasi</div>' +
          '<div class="sip-pc-title">' + (ready ? 'Proyek siap dipresentasikan' : 'Masih ada yang perlu dilengkapi') + '</div>' +
          '<div class="sip-pc-sub">Gunakan daftar ini sebelum membuka Mode Presentasi Lomba atau mencetak laporan proyek.</div>' +
        '</div>' +
        '<div class="sip-pc-score">' + doneCount + '/' + metrics.items.length + '<span>' + score + '% siap</span></div>' +
      '</div>' +
      '<div class="sip-pc-list">' +
        metrics.items.map(function (item) {
          return (
            '<div class="sip-pc-item" data-done="' + (item.done ? 'yes' : 'no') + '">' +
              '<div class="sip-pc-mark">' + (item.done ? 'OK' : '!') + '</div>' +
              '<div><div class="sip-pc-label">' + escapeHtml(item.label) + '</div><div class="sip-pc-note">' + escapeHtml(item.note) + '</div></div>' +
            '</div>'
          );
        }).join('') +
      '</div>' +
      '<div class="sip-pc-advice">' +
        (ready
          ? 'Semua bukti utama sudah lengkap. Saat presentasi, jelaskan alur: masalah sampah, dataset, model AI, hasil uji, kesalahan, dan aksi nyata.'
          : 'Langkah berikutnya: <strong>' + escapeHtml(nextItem ? nextItem.label : 'lengkapi proyek') + '</strong>. Setelah selesai, cek lagi kartu ini sebelum presentasi.') +
      '</div>';
  }

  function mountPresentationChecklistCard() {
    var existing = document.getElementById('sip-presentation-check-card');
    if (!isPresentationCheckPageVisible()) {
      if (existing) existing.remove();
      return;
    }
    readDatasetCounts().then(function (counts) {
      if (!isPresentationCheckPageVisible()) return;
      renderPresentationChecklistCard(getPresentationChecklistMetrics(counts));
    });
  }

  var DUPLICATE_HASH_THRESHOLD = 6;
  var DUPLICATE_COMPARE_LIMIT = 120;
  var _photoHashCache = {};

  function computeImageHash(dataUrl) {
    return new Promise(function (resolve) {
      if (!dataUrl || typeof dataUrl !== 'string') {
        resolve('');
        return;
      }
      var img = new Image();
      img.onload = function () {
        try {
          var size = 8;
          var canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, size, size);
          var data = ctx.getImageData(0, 0, size, size).data;
          var grays = [];
          for (var i = 0; i < data.length; i += 4) {
            grays.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          }
          var avg = grays.reduce(function (sum, value) { return sum + value; }, 0) / grays.length;
          resolve(grays.map(function (value) { return value >= avg ? '1' : '0'; }).join(''));
        } catch (error) {
          resolve('');
        }
      };
      img.onerror = function () { resolve(''); };
      img.src = dataUrl;
    });
  }

  function hammingDistance(a, b) {
    if (!a || !b || a.length !== b.length) return Infinity;
    var distance = 0;
    for (var i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) distance += 1;
    }
    return distance;
  }

  function getCachedPhotoHash(photo) {
    if (!photo || !photo.dataUrl) return Promise.resolve('');
    var key = photo.id != null ? String(photo.id) : String(photo.dataUrl).slice(0, 80);
    if (_photoHashCache[key]) return Promise.resolve(_photoHashCache[key]);
    return computeImageHash(photo.dataUrl).then(function (hash) {
      if (hash) _photoHashCache[key] = hash;
      return hash;
    });
  }

  function findSimilarDatasetPhoto(category, dataUrl) {
    if (!window.SipDB || typeof window.SipDB.getByCategory !== 'function') {
      return Promise.resolve(null);
    }
    return computeImageHash(dataUrl).then(function (newHash) {
      if (!newHash) return null;
      return window.SipDB.getByCategory(category).then(function (photos) {
        photos = Array.isArray(photos) ? photos.slice(-DUPLICATE_COMPARE_LIMIT) : [];
        var best = null;
        return photos.reduce(function (chain, photo) {
          return chain.then(function () {
            if (best && best.distance <= 2) return null;
            return getCachedPhotoHash(photo).then(function (oldHash) {
              var distance = hammingDistance(newHash, oldHash);
              if (distance <= DUPLICATE_HASH_THRESHOLD && (!best || distance < best.distance)) {
                best = { photo: photo, distance: distance };
              }
            });
          });
        }, Promise.resolve()).then(function () { return best; });
      });
    }).catch(function () {
      return null;
    });
  }

  function showDuplicatePhotoDialog(category, newDataUrl, match) {
    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.id = 'sip-dup-photo-overlay';
      overlay.innerHTML =
        '<div class="sip-dup-box" role="dialog" aria-modal="true">' +
          '<div class="sip-dup-icon">!</div>' +
          '<div class="sip-dup-title">Foto terlihat mirip</div>' +
          '<div class="sip-dup-body">Foto untuk kategori <strong>' + escapeHtml(category) + '</strong> mirip dengan data yang sudah ada. Dataset yang bervariasi membantu AI belajar lebih adil.</div>' +
          '<div class="sip-dup-preview">' +
            '<div class="sip-dup-img"><img alt="Foto baru" src="' + escapeHtml(newDataUrl) + '"><span>Foto baru</span></div>' +
            '<div class="sip-dup-img"><img alt="Foto mirip" src="' + escapeHtml(match && match.photo ? match.photo.dataUrl : '') + '"><span>Mirip sebelumnya</span></div>' +
          '</div>' +
          '<div class="sip-dup-actions">' +
            '<button type="button" class="sip-dup-btn ghost" data-sip-dup-cancel>Ambil Variasi Lain</button>' +
            '<button type="button" class="sip-dup-btn keep" data-sip-dup-keep>Tetap Simpan</button>' +
          '</div>' +
        '</div>';

      function close(value) {
        overlay.remove();
        resolve(value);
      }

      overlay.addEventListener('click', function (event) {
        var target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.matches('[data-sip-dup-keep]')) close(true);
        if (target.matches('[data-sip-dup-cancel]')) close(false);
        if (target === overlay) close(false);
      });

      document.body.appendChild(overlay);
      var cancel = overlay.querySelector('[data-sip-dup-cancel]');
      if (cancel) cancel.focus();
    });
  }

  function patchSipDBSavePhoto() {
    if (!window.SipDB || typeof window.SipDB.savePhoto !== 'function') {
      setTimeout(patchSipDBSavePhoto, 400);
      return;
    }
    if (window.SipDB._sipDuplicatePatched) return;
    window.SipDB._sipDuplicatePatched = true;

    var originalSavePhoto = window.SipDB.savePhoto.bind(window.SipDB);
    window.SipDB.savePhoto = function (category, dataUrl) {
      if (window.SipProjectLogMuted) {
        return originalSavePhoto(category, dataUrl);
      }
      var duplicateMatch = null;
      return findSimilarDatasetPhoto(category, dataUrl).then(function (match) {
        duplicateMatch = match;
        if (!match) return true;
        return showDuplicatePhotoDialog(category, dataUrl, match);
      }).then(function (shouldSave) {
        if (!shouldSave) {
          logProjectEvent('duplicate', 'Foto mirip dibatalkan', 'Kategori ' + category + ' tidak disimpan agar dataset lebih bervariasi.');
          return null;
        }
        return originalSavePhoto(category, dataUrl).then(function (result) {
          if (duplicateMatch) {
            logProjectEvent('duplicate', 'Foto mirip tetap disimpan', 'Kategori ' + category + ' tetap disimpan setelah konfirmasi.');
          } else {
            logProjectEvent('photo', 'Tambah foto ' + category, 'Satu foto baru masuk ke dataset ' + category + '.');
          }
          return result;
        });
      }).catch(function () {
        return originalSavePhoto(category, dataUrl).then(function (result) {
          logProjectEvent('photo', 'Tambah foto ' + category, 'Satu foto baru masuk ke dataset ' + category + '.');
          return result;
        });
      });
    };
  }

  function isAccuracyPageVisible() {
    var text = document.body ? document.body.innerText || '' : '';
    return text.indexOf('Akurasi & Analisis Kesalahan') >= 0 || (
      text.indexOf('Akurasi & Analisis') >= 0 &&
      text.indexOf('Jumlah Pengujian') >= 0
    );
  }

  function getPredictionCount() {
    var project = getProjectState();
    return Array.isArray(project.predictions) ? project.predictions.length : 0;
  }

  function resetPredictionHistory() {
    var total = getPredictionCount();
    if (!total) {
      showResetHistoryDialog({
        title: 'Riwayat uji masih kosong',
        message: 'Belum ada hasil prediksi yang perlu dihapus.',
        confirmText: 'Mengerti',
        showCancel: false,
      });
      return;
    }

    showResetHistoryDialog({
      title: 'Reset riwayat uji?',
      message: total + ' hasil uji akan dihapus. Dataset, model AI, identitas, dan hasil Pre/Post-Test tetap aman.',
      confirmText: 'Reset Riwayat',
      cancelText: 'Batal',
      showCancel: true,
    }).then(function (ok) {
      if (!ok) return;
      var project = getProjectState();
      writeProjectState(Object.assign({}, project, { predictions: [] }));
      logProjectEvent('reset', 'Riwayat uji direset', total + ' hasil prediksi dihapus agar pengujian bisa dimulai ulang.');
      try {
        sessionStorage.setItem('sip_open_accuracy_after_reset', '1');
      } catch (error) {}
      location.reload();
    });
  }

  function showResetHistoryDialog(options) {
    options = options || {};
    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.id = 'sip-reset-confirm';
      overlay.innerHTML =
        '<div class="sip-reset-confirm-box" role="dialog" aria-modal="true">' +
          '<div class="sip-reset-confirm-icon">!</div>' +
          '<div class="sip-reset-confirm-title">' + escapeHtml(options.title || 'Konfirmasi') + '</div>' +
          '<div class="sip-reset-confirm-body">' + escapeHtml(options.message || '') + '</div>' +
          '<div class="sip-reset-confirm-actions">' +
            (options.showCancel ? '<button type="button" class="sip-reset-confirm-btn ghost" data-sip-reset-cancel>' + escapeHtml(options.cancelText || 'Batal') + '</button>' : '') +
            '<button type="button" class="sip-reset-confirm-btn danger" data-sip-reset-ok>' + escapeHtml(options.confirmText || 'OK') + '</button>' +
          '</div>' +
        '</div>';

      function close(value) {
        overlay.remove();
        resolve(value);
      }

      overlay.addEventListener('click', function (event) {
        var target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.matches('[data-sip-reset-ok]')) close(true);
        if (target.matches('[data-sip-reset-cancel]')) close(false);
        if (target === overlay && options.showCancel) close(false);
      });

      document.body.appendChild(overlay);
      var ok = overlay.querySelector('[data-sip-reset-ok]');
      if (ok) ok.focus();
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[char];
    });
  }

  function mountResetTestHistoryCard() {
    var existing = document.getElementById('sip-reset-test-card');
    if (!isAccuracyPageVisible()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) {
      var countEl = existing.querySelector('[data-sip-reset-count]');
      if (countEl) countEl.textContent = String(getPredictionCount());
      return;
    }

    var title = Array.from(document.querySelectorAll('h1, h2, h3, div')).find(function (el) {
      return (el.textContent || '').trim() === 'Akurasi & Analisis Kesalahan';
    });
    var container = title ? title.closest('.space-y-6, main, [class*="space-y"]') : null;
    if (!container) return;

    var card = document.createElement('div');
    card.id = 'sip-reset-test-card';
    card.innerHTML =
      '<div>' +
        '<div class="sip-reset-test-title">Reset riwayat uji prediksi</div>' +
        '<div class="sip-reset-test-sub"><span data-sip-reset-count>' + getPredictionCount() + '</span> hasil uji tercatat. Hapus hanya riwayat uji, dataset dan model tetap aman.</div>' +
      '</div>' +
      '<button type="button" class="sip-reset-test-btn">Reset Riwayat Uji</button>';

    var btn = card.querySelector('.sip-reset-test-btn');
    if (btn) btn.addEventListener('click', resetPredictionHistory);
    container.insertBefore(card, container.firstElementChild && container.firstElementChild.nextSibling ? container.firstElementChild.nextSibling : container.firstChild);
  }

  function openAccuracyAfterReset() {
    try {
      if (sessionStorage.getItem('sip_open_accuracy_after_reset') !== '1') return;
    } catch (error) {
      return;
    }
    var btn = findNavButton('Akurasi');
    if (!btn) return;
    try {
      sessionStorage.removeItem('sip_open_accuracy_after_reset');
    } catch (error) {}
    setTimeout(function () { btn.click(); }, 120);
  }

  function findNavButton(label) {
    var wanted = String(label || '').trim().toLowerCase();
    return Array.from(document.querySelectorAll('button')).find(function (el) {
      var title = (el.getAttribute('title') || '').trim().toLowerCase();
      if (title === wanted || title.indexOf(wanted) >= 0) return true;
      return Array.from(el.querySelectorAll('span')).some(function (span) {
        var text = (span.textContent || '').trim().toLowerCase();
        return text === wanted || text.indexOf(wanted) >= 0;
      });
    });
  }

  function goToAccuracyAfterReload() {
    try {
      sessionStorage.setItem('sip_live_open_accuracy', '1');
    } catch (error) {}
    location.reload();
  }

  function openPendingAccuracyPage() {
    try {
      if (sessionStorage.getItem('sip_live_open_accuracy') !== '1') return;
    } catch (error) {
      return;
    }
    var btn = findNavButton('Akurasi');
    if (!btn) return;
    try {
      sessionStorage.removeItem('sip_live_open_accuracy');
    } catch (error) {}
    setTimeout(function () { btn.click(); }, 120);
  }

  function hideTruthChoices() {
    var panel = document.getElementById('sip-live-truth-panel');
    if (panel) panel.hidden = true;
  }

  function showTruthChoices() {
    if (!_liveLastResult || !_liveLastResult.label) {
      setLiveStatus('Belum ada prediksi untuk dicatat. Arahkan kamera sampai AI menebak dulu.');
      return;
    }
    if (getLivePredictionKey(_liveLastResult) === _liveLastRecordedKey) {
      setLiveStatus('Prediksi ini sudah dicatat. Tunggu hasil live berubah sebelum mencatat lagi.');
      return;
    }
    var panel = document.getElementById('sip-live-truth-panel');
    if (panel) panel.hidden = false;
    setLiveStatus('Pilih kategori sebenarnya agar analisis kesalahan lebih jelas.');
  }

  function recordLivePrediction(isCorrect, truthLabel) {
    if (!_liveLastResult || !_liveLastResult.label) {
      setLiveStatus('Belum ada prediksi untuk dicatat. Arahkan kamera sampai AI menebak dulu.');
      return;
    }
    var predictionKey = getLivePredictionKey(_liveLastResult);
    if (predictionKey === _liveLastRecordedKey) {
      hideTruthChoices();
      setLiveStatus('Prediksi ini sudah dicatat. Tunggu hasil live berubah sebelum mencatat lagi.');
      return;
    }

    hideTruthChoices();
    var color = LIVE_COLORS[_liveLastResult.label] || '#64748b';
    var truth = isCorrect ? _liveLastResult.label : (truthLabel || '-');
    var project = getProjectState();
    var predictions = Array.isArray(project.predictions) ? project.predictions : [];
    var item = {
      label: _liveLastResult.label,
      confidence: Math.round(_liveLastResult.confidence || 0),
      allCategories: Array.isArray(_liveLastResult.allCategories) ? _liveLastResult.allCategories : [],
      color: color,
      desc: 'Dicatat dari kamera live',
      isCorrect: !!isCorrect,
      reason: isCorrect ? null : ('Kategori sebenarnya: ' + truth),
      truth: truth,
      ts: Date.now(),
    };

    writeProjectState(Object.assign({}, project, {
      predictions: predictions.concat(item),
    }));
    _liveLastRecordedKey = predictionKey;
    setLiveRecordDisabled(true);
    updateLiveCounter();

    setLiveStatus(
      (isCorrect ? 'Dicatat benar' : 'Dicatat salah') +
      ': AI menebak ' + item.label +
      (isCorrect ? '' : ', sebenarnya ' + truth) +
      ' (' + item.confidence + '%). Buka Akurasi & Analisis untuk melihat rekap.'
    );
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

  function updateSwitchButton(card) {
    var switchBtn = card && card.querySelector('#sip-live-switch');
    if (switchBtn) {
      switchBtn.textContent = _liveFacingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan';
    }
    if (card) card.setAttribute('data-facing', _liveFacingMode);
  }

  function switchLiveCamera(card) {
    _liveFacingMode = _liveFacingMode === 'environment' ? 'user' : 'environment';
    updateSwitchButton(card);
    if (!_liveRunning) {
      setLiveStatus(_liveFacingMode === 'environment' ? 'Mode kamera belakang dipilih.' : 'Mode kamera depan dipilih.');
      return;
    }
    stopLiveCamera();
    setLiveStatus('Berpindah kamera...');
    setTimeout(function () { startLiveCamera(card); }, 180);
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
    updateSwitchButton(card);
    setLiveStatus('Memeriksa model dan izin kamera...');

    Promise.resolve(window.SipML.hasModel ? window.SipML.hasModel() : true)
      .then(function (ready) {
        if (!ready) throw new Error('Model belum dilatih. Buka Latih Model dulu.');
        return navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: _liveFacingMode }, width: { ideal: 960 } },
          audio: false,
        });
      })
      .then(function (stream) {
        _liveStream = stream;
        _liveRunning = true;
        var video = card.querySelector('video');
        if (video) {
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
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
    card.setAttribute('data-facing', _liveFacingMode);
    card.innerHTML =
      '<div class="sip-live-head">' +
        '<div>' +
          '<div class="sip-live-kicker">Mode Teachable Machine</div>' +
          '<div class="sip-live-title">Kamera Live: AI menebak langsung</div>' +
          '<div class="sip-live-sub">Arahkan kamera ke sampah. Jika HP memblokir kamera live, pakai Kamera HP atau Galeri/Folder.</div>' +
        '</div>' +
        '<div class="sip-live-actions">' +
          '<button id="sip-live-start" class="sip-live-btn">Mulai Kamera Live</button>' +
          '<button id="sip-live-switch" class="sip-live-btn sip-live-secondary">Kamera Belakang</button>' +
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
          '<div id="sip-live-counter" class="sip-live-counter">Riwayat live: 0 uji</div>' +
          '<div class="sip-live-record">' +
            '<button id="sip-live-record-good" class="sip-live-btn sip-live-good">Catat Benar</button>' +
            '<button id="sip-live-record-bad" class="sip-live-btn sip-live-bad">Catat Salah</button>' +
            '<button id="sip-live-open-accuracy" class="sip-live-btn sip-live-wide">Lihat Akurasi</button>' +
          '</div>' +
          '<div id="sip-live-truth-panel" class="sip-live-truth" hidden>' +
            '<div class="sip-live-truth-title">Kalau salah, kategori sebenarnya apa?</div>' +
            '<div class="sip-live-truth-grid">' +
              '<button class="sip-live-truth-btn" data-sip-live-truth="Plastik" style="background:#0ea5e9">Plastik</button>' +
              '<button class="sip-live-truth-btn" data-sip-live-truth="Kertas" style="background:#f59e0b">Kertas</button>' +
              '<button class="sip-live-truth-btn" data-sip-live-truth="Organik" style="background:#10b981">Organik</button>' +
              '<button class="sip-live-truth-btn" data-sip-live-truth="Residu" style="background:#64748b">Residu</button>' +
            '</div>' +
          '</div>' +
          '<div class="sip-live-note">AI menebak otomatis dari kamera. Untuk masuk rekap Akurasi & Analisis, catat hasilnya dengan tombol Benar/Salah.</div>' +
        '</div>' +
      '</div>';
    parent.insertBefore(card, grid);

    var startBtn = card.querySelector('#sip-live-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () { startLiveCamera(card); });
    }
    var switchBtn = card.querySelector('#sip-live-switch');
    if (switchBtn) {
      switchBtn.addEventListener('click', function () { switchLiveCamera(card); });
    }
    var cameraBtn = card.querySelector('#sip-live-camera-file');
    if (cameraBtn) {
      cameraBtn.addEventListener('click', function () { openMobileImagePicker('camera'); });
    }
    var galleryBtn = card.querySelector('#sip-live-gallery-file');
    if (galleryBtn) {
      galleryBtn.addEventListener('click', function () { openMobileImagePicker('gallery'); });
    }
    var goodBtn = card.querySelector('#sip-live-record-good');
    if (goodBtn) {
      goodBtn.addEventListener('click', function () { recordLivePrediction(true); });
    }
    var badBtn = card.querySelector('#sip-live-record-bad');
    if (badBtn) {
      badBtn.addEventListener('click', showTruthChoices);
    }
    Array.from(card.querySelectorAll('[data-sip-live-truth]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        recordLivePrediction(false, btn.getAttribute('data-sip-live-truth'));
      });
    });
    var truthPanel = card.querySelector('#sip-live-truth-panel');
    if (truthPanel) {
      truthPanel.hidden = true;
    }
    updateLiveCounter();
    var accuracyBtn = card.querySelector('#sip-live-open-accuracy');
    if (accuracyBtn) {
      accuracyBtn.addEventListener('click', goToAccuracyAfterReload);
    }
  }

  function installLiveTestObserver() {
    var observer = new MutationObserver(function () {
      mountLiveTestCard();
      mountResetTestHistoryCard();
      mountDatasetQualityCard();
      mountPresentationChecklistCard();
      mountProjectLogCard();
      mountActionRecommendationCard();
      openPendingAccuracyPage();
      openAccuracyAfterReset();
    });
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    mountLiveTestCard();
    mountResetTestHistoryCard();
    mountDatasetQualityCard();
    mountPresentationChecklistCard();
    mountProjectLogCard();
    mountActionRecommendationCard();
    openPendingAccuracyPage();
    openAccuracyAfterReset();
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
            logProjectEvent('train', 'Model AI dilatih ulang', 'Akurasi latih ' + Math.round(result.accuracy) + '% dengan ' + (result.total || 'dataset') + ' foto.');
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
  patchSipDBSavePhoto();

  /* SipML patch butuh polling karena bundle.js load async */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchSipMLTrain);
  } else {
    patchSipMLTrain();
  }
})();
