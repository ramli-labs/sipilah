(function () {
  const MARKERS = [
    { name: "Kepulauan Mentawai", region: "Kepulauan Mentawai", x: 255, y: 366, type: "Kepulauan", side: "left" },
    { name: "Kab. Natuna", region: "Natuna", x: 548, y: 232, type: "Perbatasan", side: "top" },
    { name: "Kalimantan Utara", region: "Kalimantan Utara", x: 918, y: 274, type: "Perbatasan", side: "top" },
    { name: "Tana Toraja", region: "Tana Toraja", x: 1072, y: 476, type: "Pegunungan", side: "right" },
    { name: "Kab. Ende", region: "Ende, NTT", x: 1068, y: 650, type: "Kepulauan", side: "bottom" },
    { name: "Manggarai Barat", region: "Manggarai Barat", x: 1016, y: 640, type: "Kepulauan", side: "bottom" },
    { name: "Kab. Belu (Atambua)", region: "Belu, NTT", x: 1182, y: 688, type: "Perbatasan", side: "bottom" },
    { name: "Banda Naira", region: "Maluku Tengah", x: 1310, y: 435, type: "Kepulauan", side: "right" },
    { name: "Kep. Tanimbar", region: "Kepulauan Tanimbar", x: 1402, y: 684, type: "Kepulauan", side: "bottom" },
    { name: "Kota Sorong", region: "Papua Barat Daya", x: 1528, y: 422, type: "Indonesia Timur", side: "top" },
    { name: "Kab. Jayawijaya (Wamena)", region: "Papua Pegunungan", x: 1710, y: 525, type: "Pegunungan", side: "right" }
  ];

  const css = `
    .sip-3t-card{margin-top:24px;border:1px solid rgba(187,247,208,.85);background:linear-gradient(135deg,#f8fffb 0%,#f0f9ff 52%,#fffdf0 100%);border-radius:24px;overflow:hidden;box-shadow:0 18px 45px -32px rgba(15,23,42,.34)}
    .sip-3t-wrap{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:20px;padding:24px}
    .sip-3t-eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#166534}
    .sip-3t-title{margin-top:6px;font-size:26px;line-height:1.12;font-weight:900;color:#0f172a}
    .sip-3t-copy{margin-top:10px;max-width:680px;color:#475569;font-size:14px;line-height:1.6}
    .sip-3t-map{margin-top:18px;border:1px solid rgba(226,232,240,.9);border-radius:18px;background:#ffffff;overflow:hidden}
    .sip-3t-map svg{width:100%;height:auto;display:block}
    .sip-3t-island{fill:#d9f99d;stroke:#15803d;stroke-width:1.45;stroke-linejoin:round;filter:url(#sipMapShadow)}
    .sip-3t-small-island{fill:#bbf7d0;stroke:#15803d;stroke-width:1;stroke-linejoin:round}
    .sip-3t-sea{fill:url(#sipSea)}
    .sip-3t-grid{fill:none;stroke:#bae6fd;stroke-width:.8;opacity:.55}
    .sip-3t-route{fill:none;stroke:#0284c7;stroke-width:1.15;stroke-dasharray:5 8;opacity:.45}
    .sip-3t-pin{fill:#facc15;stroke:#166534;stroke-width:2}
    .sip-3t-pin-core{fill:#15803d}
    .sip-3t-label{font:800 20px system-ui,sans-serif;fill:#334155}
    .sip-3t-map-label{font:800 18px system-ui,sans-serif;fill:#166534;letter-spacing:.08em;opacity:.68}
    .sip-3t-panel{display:flex;flex-direction:column;gap:12px}
    .sip-3t-stat{border:1px solid rgba(226,232,240,.9);background:rgba(255,255,255,.78);border-radius:16px;padding:14px}
    .sip-3t-stat strong{display:block;color:#0f172a;font-size:24px;line-height:1}
    .sip-3t-stat span{display:block;margin-top:4px;color:#64748b;font-size:12px;font-weight:700}
    .sip-3t-list{border:1px solid rgba(226,232,240,.9);background:#fff;border-radius:16px;padding:14px;max-height:310px;overflow:auto}
    .sip-3t-list h3{margin:0 0 10px;font-size:13px;color:#0f172a}
    .sip-3t-school{display:grid;grid-template-columns:auto 1fr;gap:8px;padding:8px 0;border-top:1px solid #f1f5f9}
    .sip-3t-school:first-of-type{border-top:0}
    .sip-3t-dot{width:9px;height:9px;border-radius:50%;background:#facc15;border:2px solid #15803d;margin-top:5px}
    .sip-3t-school b{display:block;font-size:12px;color:#1e293b}
    .sip-3t-school small{display:block;color:#64748b;font-size:11px;line-height:1.35}
    .sip-3t-note{font-size:11px;color:#64748b;line-height:1.5}
    @media(max-width:900px){.sip-3t-wrap{grid-template-columns:1fr;padding:18px}.sip-3t-title{font-size:22px}.sip-3t-list{max-height:none}}
  `;

  function islandPath() {
    return `
      <defs>
        <linearGradient id="sipSea" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#eff6ff"/>
          <stop offset="100%" stop-color="#f8fafc"/>
        </linearGradient>
      </defs>
      <rect class="sip-3t-sea" width="1828" height="814" rx="0"/>
      <image href="peta-indonesia-persis.svg" x="0" y="0" width="1828" height="814" preserveAspectRatio="xMidYMid meet"/>
      <path class="sip-3t-route" d="M320 439 C560 210 980 145 1518 403"/>
      <path class="sip-3t-route" d="M545 596 C790 705 1160 704 1438 647"/>
    `;
  }

  function markerSvg(marker) {
    const labelY = marker.side === "top" ? marker.y - 14 : marker.side === "bottom" ? marker.y + 24 : marker.y + 4;
    const labelX = marker.side === "left" ? marker.x - 116 : marker.side === "right" ? marker.x + 14 : marker.x - 20;
    return `
      <g tabindex="0" aria-label="${marker.name}">
        <title>${marker.name} (${marker.type})</title>
        <circle class="sip-3t-pin" cx="${marker.x}" cy="${marker.y}" r="15"/>
        <circle class="sip-3t-pin-core" cx="${marker.x}" cy="${marker.y}" r="5.5"/>
        <text class="sip-3t-label" x="${labelX}" y="${labelY}">${marker.name}</text>
      </g>
    `;
  }

  function buildCard() {
    const card = document.createElement("section");
    card.className = "sip-3t-card";
    card.setAttribute("data-sipilah-3t-map", "true");
    card.innerHTML = `
      <div class="sip-3t-wrap">
        <div>
          <div class="sip-3t-eyebrow">Peta Jangkauan 3T</div>
          <h2 class="sip-3t-title">SIPILAH untuk sekolah kepulauan, perbatasan, dan pegunungan Indonesia</h2>
          <p class="sip-3t-copy">
            Peta ini menunjukkan contoh sasaran replikasi SIPILAH ke wilayah 3T dan daerah akses terbatas.
            Karena aplikasi bersifat offline-first dan data tersimpan di perangkat, sekolah tetap bisa belajar AI
            meskipun koneksi internet tidak stabil.
          </p>
          <div class="sip-3t-map" aria-label="Peta Indonesia sasaran jangkauan SIPILAH ke sekolah 3T">
            <svg viewBox="0 0 1828 814" role="img">
              <title>Peta Jangkauan SIPILAH ke Sekolah 3T Indonesia</title>
              ${islandPath()}
              ${MARKERS.map(markerSvg).join("")}
            </svg>
          </div>
        </div>
        <aside class="sip-3t-panel">
          <div class="sip-3t-stat"><strong>${MARKERS.length}</strong><span>contoh titik sasaran sekolah 3T</span></div>
          <div class="sip-3t-stat"><strong>Offline-first</strong><span>aplikasi, panduan, dan model lokal</span></div>
          <div class="sip-3t-list">
            <h3>Contoh wilayah prioritas</h3>
            ${MARKERS.map((m) => `
              <div class="sip-3t-school">
                <span class="sip-3t-dot"></span>
                <span><b>${m.name}</b><small>${m.type}</small></span>
              </div>
            `).join("")}
          </div>
          <p class="sip-3t-note">
            Catatan: titik ini adalah contoh target perluasan dan bahan narasi lomba, bukan klaim implementasi resmi.
          </p>
        </aside>
      </div>
    `;
    return card;
  }

  function ensureStyles() {
    if (document.querySelector("style[data-sipilah-3t-map]")) return;
    const style = document.createElement("style");
    style.dataset.sipilah3tMap = "true";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function isHomeVisible() {
    const main = document.querySelector("main");
    if (!main) return false;
    const text = main.textContent || "";
    return text.includes("Beranda") && text.includes("Mulai Proyek") && text.includes("SIPILAH");
  }

  function mountMap() {
    ensureStyles();
    const existing = document.querySelector("[data-sipilah-3t-map]");
    if (!isHomeVisible()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    const content = document.querySelector("main > div.flex-1") || document.querySelector("main");
    if (!content) return;
    content.appendChild(buildCard());
  }

  window.addEventListener("load", () => {
    mountMap();
    const observer = new MutationObserver(() => mountMap());
    observer.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
  });
})();
