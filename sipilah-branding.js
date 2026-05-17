(function () {
  const SIPILAH_LOGO = "logo-sipilah.png";
  const RJM_LOGO = "logo-rjm.png";

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

  function applyBranding() {
    injectStyles();
    replaceBrandMarks();
    replaceFooterCopyright();
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
