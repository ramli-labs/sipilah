(function () {
  const SIPILAH_LOGO = "assets/logo-sipilah.png";
  const RJM_LOGO = "assets/logo-rjm.png";

  function injectStyles() {
    if (document.getElementById("sipilah-branding-style")) return;
    const style = document.createElement("style");
    style.id = "sipilah-branding-style";
    style.textContent = `
      .sip-brand-logo{width:100%;height:100%;object-fit:contain;display:block}
      .sip-brand-logo-wrap{background:#fff!important;overflow:hidden}
      .sip-footer-brand{display:inline-flex;align-items:center;gap:10px;min-width:0}
      .sip-footer-brand img{width:28px;height:28px;object-fit:contain;border-radius:8px;background:#fff}
      .sip-footer-brand span{min-width:0}
      .sip-loader-logo{width:72px;height:72px;object-fit:contain;margin:0 auto 10px;display:block}
      .sip-cp-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#166534;background:#dcfce7;border:1px solid #bbf7d0;border-radius:999px;padding:3px 9px;white-space:nowrap}
      .sip-cp-badge svg{flex-shrink:0}
      #sip-step-bar{position:fixed;bottom:0;left:0;right:0;z-index:75;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-top:1px solid #e2e8f0;padding:6px 16px;pointer-events:none}
      .sip-step-inner{display:flex;align-items:center;gap:10px;max-width:640px;margin:0 auto}
      .sip-step-label{font-size:11px;font-weight:800;color:#166534;white-space:nowrap;min-width:140px}
      .sip-step-track{flex:1;height:6px;background:#e2e8f0;border-radius:999px;overflow:hidden}
      .sip-step-fill{height:100%;background:linear-gradient(90deg,#15803d,#4ade80);border-radius:999px;transition:width .4s ease}
      .sip-step-pct{font-size:11px;font-weight:800;color:#64748b;min-width:32px;text-align:right}
    `;
    document.head.appendChild(style);
  }

  function replaceBrandMarks() {
    const candidates = Array.from(document.querySelectorAll("div")).filter(
      (el) => el.childElementCount === 0 && el.textContent.trim() === "SIPILAH"
    );

    candidates.forEach((textEl) => {
      const row = textEl.closest(".flex");
      const logoBox = row && row.firstElementChild;
      if (!logoBox || logoBox.querySelector("img[data-sipilah-logo]")) return;
      if (!logoBox.className || !String(logoBox.className).includes("grid")) return;
      logoBox.classList.add("sip-brand-logo-wrap");
      logoBox.innerHTML = `<img data-sipilah-logo class="sip-brand-logo" src="${SIPILAH_LOGO}" alt="Logo SIPILAH">`;
    });
  }

  function replaceFooterCopyright() {
    const footer = document.querySelector("footer");
    if (!footer || footer.dataset.rjmBranded === "1") return;
    const target = Array.from(footer.querySelectorAll("span")).find((span) =>
      span.textContent.includes("© 2026 SIPILAH")
    );
    if (!target) return;
    target.innerHTML = `
      <span class="sip-footer-brand">
        <img src="${RJM_LOGO}" alt="Logo RJM">
        <span>© 2026 SIPILAH · Media Ajar KKA SMP · RJM</span>
      </span>
    `;
    footer.dataset.rjmBranded = "1";
  }

  const STEPS = [
    { step: 1, label: "Pre-Test", keywords: ["Pre-Test SIPILAH", "Asesmen Awal"] },
    { step: 2, label: "Dataset", keywords: ["Dataset Sampah", "Kumpulkan Foto"] },
    { step: 3, label: "Latih AI", keywords: ["Latih Kecerdasan Artifisial", "Latih Model"] },
    { step: 4, label: "Uji Model", keywords: ["Uji Prediksi", "Uji Model", "Pengujian Model"] },
    { step: 5, label: "Analisis", keywords: ["Akurasi & Analisis", "Analisis Akurasi"] },
    { step: 6, label: "Post-Test", keywords: ["Post-Test SIPILAH", "Asesmen Akhir"] },
    { step: 7, label: "Laporan", keywords: ["Laporan Proyek"] },
  ];
  const TOTAL_STEPS = 7;

  function detectCurrentStep() {
    const main = document.querySelector("main");
    if (!main) return null;
    const headings = main.querySelectorAll("h1, h2, h3");
    const text = Array.from(headings).map((h) => h.textContent).join(" ");
    if (!text.trim()) return null;
    for (const s of STEPS) {
      if (s.keywords.some((kw) => text.includes(kw))) return s;
    }
    return null;
  }

  function injectStepIndicator() {
    const step = detectCurrentStep();
    let bar = document.getElementById("sip-step-bar");
    if (!step) {
      if (bar) bar.remove();
      return;
    }
    const pct = Math.round((step.step / TOTAL_STEPS) * 100);
    if (bar && bar.dataset.step === String(step.step)) return;
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "sip-step-bar";
      document.body.appendChild(bar);
    }
    bar.dataset.step = String(step.step);
    bar.innerHTML = `
      <div class="sip-step-inner">
        <span class="sip-step-label">Tahap ${step.step} / ${TOTAL_STEPS} · ${step.label}</span>
        <div class="sip-step-track"><div class="sip-step-fill" style="width:${pct}%"></div></div>
        <span class="sip-step-pct">${pct}%</span>
      </div>
    `;
  }

  function injectCPBadge() {
    const footer = document.querySelector("footer");
    if (!footer || footer.querySelector("[data-sipilah-cp-badge]")) return;
    const badge = document.createElement("span");
    badge.setAttribute("data-sipilah-cp-badge", "1");
    badge.className = "sip-cp-badge";
    badge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Selaras CP KKA Fase D · Kurikulum Merdeka`;
    const wrap = footer.querySelector(".flex");
    if (wrap) wrap.appendChild(badge);
    else footer.appendChild(badge);
  }

  function applyBranding() {
    injectStyles();
    replaceBrandMarks();
    replaceFooterCopyright();
    injectCPBadge();
    injectStepIndicator();
  }

  function init() {
    applyBranding();
    const observer = new MutationObserver(applyBranding);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
