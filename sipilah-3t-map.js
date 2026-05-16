(function () {
  const MARKERS = [
    { name: "SMPN Mentawai", region: "Kepulauan Mentawai", x: 168, y: 232, type: "Kepulauan", side: "left" },
    { name: "SMPN Natuna", region: "Natuna", x: 382, y: 76, type: "Perbatasan", side: "top" },
    { name: "SMPN 3 Tarakan", region: "Kalimantan Utara", x: 515, y: 119, type: "Perbatasan", side: "top" },
    { name: "SMP Tana Toraja", region: "Sulawesi Selatan", x: 614, y: 236, type: "Pegunungan", side: "right" },
    { name: "SMPN Ende", region: "Flores", x: 584, y: 330, type: "Kepulauan", side: "bottom" },
    { name: "SMPN Manggarai Barat", region: "Flores", x: 552, y: 322, type: "Kepulauan", side: "bottom" },
    { name: "SMPN Atambua", region: "Timor perbatasan", x: 656, y: 348, type: "Perbatasan", side: "bottom" },
    { name: "SMP Banda Naira", region: "Maluku Tengah", x: 718, y: 263, type: "Kepulauan", side: "right" },
    { name: "SMPN Saumlaki", region: "Kepulauan Tanimbar", x: 755, y: 342, type: "Kepulauan", side: "bottom" },
    { name: "SMPN 1 Sorong", region: "Papua Barat Daya", x: 797, y: 213, type: "Indonesia Timur", side: "top" },
    { name: "SMPN 2 Wamena", region: "Papua Pegunungan", x: 882, y: 254, type: "Pegunungan", side: "right" }
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
    .sip-3t-label{font:700 11px system-ui,sans-serif;fill:#334155}
    .sip-3t-map-label{font:800 10px system-ui,sans-serif;fill:#166534;letter-spacing:.08em;opacity:.68}
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
          <stop offset="55%" stop-color="#f0fdfa"/>
          <stop offset="100%" stop-color="#f8fafc"/>
        </linearGradient>
        <filter id="sipMapShadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0f766e" flood-opacity=".12"/>
        </filter>
      </defs>
      <rect class="sip-3t-sea" width="960" height="430" rx="0"/>
      <path class="sip-3t-grid" d="M80 70H910M80 150H910M80 230H910M80 310H910M170 35V390M320 35V390M470 35V390M620 35V390M770 35V390"/>

      <g aria-label="Siluet peta Indonesia">
        <!-- Sumatra -->
        <path class="sip-3t-island" d="M113 127 C137 100 169 86 195 95 C229 107 258 140 278 178 C294 210 312 246 300 275 C287 308 247 302 219 277 C187 248 151 219 128 188 C111 164 100 144 113 127 Z"/>
        <path class="sip-3t-small-island" d="M92 176 C105 168 117 174 121 187 C111 196 98 194 92 184 Z"/>
        <path class="sip-3t-small-island" d="M142 224 C158 213 176 218 181 235 C167 250 147 246 139 235 Z"/>
        <path class="sip-3t-small-island" d="M164 265 C181 254 198 262 201 277 C187 289 169 284 162 274 Z"/>

        <!-- Java and Madura -->
        <path class="sip-3t-island" d="M285 303 C337 292 416 296 493 314 C513 319 514 333 491 337 C417 351 334 341 285 322 C270 316 270 307 285 303 Z"/>
        <path class="sip-3t-small-island" d="M503 302 C521 298 540 302 551 312 C536 319 515 319 503 311 Z"/>

        <!-- Bali and Nusa Tenggara -->
        <path class="sip-3t-small-island" d="M520 332 C532 326 545 330 551 338 C540 345 526 343 520 336 Z"/>
        <path class="sip-3t-small-island" d="M556 337 C580 326 615 330 638 343 C608 351 579 350 556 342 Z"/>
        <path class="sip-3t-small-island" d="M642 347 C673 335 714 341 742 358 C706 367 667 363 642 353 Z"/>

        <!-- Kalimantan -->
        <path class="sip-3t-island" d="M357 108 C392 74 457 58 513 81 C558 99 586 140 581 188 C577 234 541 268 492 281 C444 294 392 278 365 239 C338 200 325 140 357 108 Z"/>
        <path class="sip-3t-small-island" d="M375 69 C388 57 411 57 425 68 C413 80 389 80 375 69 Z"/>

        <!-- Sulawesi -->
        <path class="sip-3t-island" d="M594 147 C619 116 652 117 664 143 C674 164 647 182 632 198 C659 196 692 207 694 230 C696 254 662 255 641 245 C648 270 638 293 615 299 C592 305 579 281 588 258 C568 267 543 263 535 243 C528 224 548 207 571 207 C551 184 568 161 594 147 Z"/>
        <path class="sip-3t-small-island" d="M662 132 C681 119 707 122 718 138 C699 151 676 149 662 132 Z"/>
        <path class="sip-3t-small-island" d="M682 262 C703 250 728 255 741 271 C722 284 695 281 682 262 Z"/>

        <!-- Maluku -->
        <path class="sip-3t-small-island" d="M715 204 C731 194 750 199 756 213 C743 226 722 222 715 210 Z"/>
        <path class="sip-3t-small-island" d="M753 238 C770 228 793 233 802 248 C787 262 763 258 753 244 Z"/>
        <path class="sip-3t-small-island" d="M709 280 C725 269 746 274 755 289 C741 302 717 298 709 285 Z"/>
        <path class="sip-3t-small-island" d="M746 319 C762 309 784 313 796 328 C779 342 756 338 746 324 Z"/>

        <!-- Papua -->
        <path class="sip-3t-island" d="M781 184 C823 154 881 157 919 191 C945 215 943 257 914 284 C882 314 827 313 782 288 C750 270 742 224 781 184 Z"/>
        <path class="sip-3t-small-island" d="M756 180 C772 169 794 173 804 188 C787 200 767 196 756 184 Z"/>
      </g>

      <path class="sip-3t-route" d="M168 232 C287 115 497 78 797 213"/>
      <path class="sip-3t-route" d="M285 315 C424 370 610 374 755 342"/>

      <text class="sip-3t-map-label" x="164" y="128">SUMATRA</text>
      <text class="sip-3t-map-label" x="375" y="114">KALIMANTAN</text>
      <text class="sip-3t-map-label" x="581" y="187">SULAWESI</text>
      <text class="sip-3t-map-label" x="360" y="326">JAWA</text>
      <text class="sip-3t-map-label" x="795" y="225">PAPUA</text>
    `;
  }

  function markerSvg(marker) {
    const labelY = marker.side === "top" ? marker.y - 14 : marker.side === "bottom" ? marker.y + 24 : marker.y + 4;
    const labelX = marker.side === "left" ? marker.x - 116 : marker.side === "right" ? marker.x + 14 : marker.x - 20;
    return `
      <g tabindex="0" aria-label="${marker.name}, ${marker.region}">
        <title>${marker.name} - ${marker.region} (${marker.type})</title>
        <circle class="sip-3t-pin" cx="${marker.x}" cy="${marker.y}" r="9"/>
        <circle class="sip-3t-pin-core" cx="${marker.x}" cy="${marker.y}" r="3.2"/>
        <text class="sip-3t-label" x="${labelX}" y="${labelY}">${marker.region}</text>
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
            <svg viewBox="0 0 960 430" role="img">
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
                <span><b>${m.name}</b><small>${m.region} - ${m.type}</small></span>
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
