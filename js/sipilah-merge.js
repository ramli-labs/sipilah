(function () {
  const VERSION = 1;
  const VALID_CATEGORIES = new Set(["Plastik", "Kertas", "Organik", "Residu"]);

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be full after many images; the IndexedDB import still matters most.
    }
  }

  function getIdentity() {
    return readJSON("sipilah_identity_v1", {});
  }

  function readContributions() {
    const data = readJSON("sipilah_merge_contributions_v1", []);
    return Array.isArray(data) ? data : [];
  }

  function writeContributions(items) {
    writeJSON("sipilah_merge_contributions_v1", items);
  }

  function countPhotos(photos) {
    const counts = { Plastik: 0, Kertas: 0, Organik: 0, Residu: 0 };
    photos.forEach((photo) => {
      if (photo && VALID_CATEGORIES.has(photo.category)) counts[photo.category] += 1;
    });
    return counts;
  }

  function totalCounts(counts) {
    return Object.values(counts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function normalizeContribution(source, photos) {
    const identity = (source && source.identity) || {};
    const exportedAt = (source && source.exportedAt) || new Date().toISOString();
    const key = [
      identity.school || "sekolah",
      identity.kelas || "kelas",
      identity.group || "kelompok",
      exportedAt,
    ].join("|");

    return {
      key,
      group: identity.group || "Kelompok tanpa nama",
      school: identity.school || "Sekolah belum diatur",
      kelas: identity.kelas || "-",
      exportedAt,
      importedAt: new Date().toISOString(),
      counts: countPhotos(photos),
      total: photos.length,
    };
  }

  function rememberOwnContribution(photos, counts) {
    const identity = getIdentity();
    const own = normalizeContribution(
      { identity, exportedAt: new Date().toISOString() },
      photos.map((photo) => ({ category: photo.category }))
    );
    own.counts = {
      Plastik: counts.Plastik || counts.plastik || 0,
      Kertas: counts.Kertas || counts.kertas || 0,
      Organik: counts.Organik || counts.organik || 0,
      Residu: counts.Residu || counts.residu || 0,
    };
    own.total = totalCounts(own.counts);
    own.key = `local|${identity.school || "sekolah"}|${identity.kelas || "kelas"}|${identity.group || "kelompok"}`;

    const existing = readContributions().filter((item) => item.key !== own.key);
    writeContributions([own, ...existing].slice(0, 24));
  }

  function rememberImportedContribution(packageData, photos) {
    const contribution = normalizeContribution(packageData, photos);
    const existing = readContributions().filter((item) => item.key !== contribution.key);
    writeContributions([contribution, ...existing].slice(0, 24));
  }

  function safeName(value, fallback) {
    return String(value || fallback)
      .trim()
      .replace(/[^a-z0-9-]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
  }

  function downloadJSON(name, data) {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  async function invalidateModel(counts) {
    try {
      if (window.SipML && typeof window.SipML.deleteModel === "function") {
        await window.SipML.deleteModel();
      }
    } catch {
      // If model deletion fails, the UI copy still tells users to retrain after merging.
    }

    const project = readJSON("sipilah_project_v1", {});
    writeJSON("sipilah_project_v1", {
      ...project,
      datasetCount: counts,
      modelReady: false,
      accuracy: 0,
      predictions: [],
    });
  }

  async function clearRuntimeCache() {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  }

  async function reloadLatestVersion() {
    const ok = confirm(
      "Muat ulang versi terbaru SIPILAH?\n\nCache aplikasi akan dibersihkan, tetapi dataset, hasil tes, dan model lokal tidak dihapus."
    );
    if (!ok) return;

    try {
      await clearRuntimeCache();
      location.reload();
    } catch {
      alert("Cache gagal dibersihkan otomatis. Halaman akan tetap dimuat ulang.");
      location.reload();
    }
  }

  async function resetProjectData() {
    const ok = confirm(
      "Reset semua data proyek di perangkat ini?\n\nYang akan dihapus: dataset foto, model AI, hasil Pre/Post-Test, riwayat prediksi, laporan lokal, dan dashboard kontribusi.\n\nIdentitas siswa/kelompok tetap disimpan. Tindakan ini tidak bisa dibatalkan."
    );
    if (!ok) return;

    const doubleCheck = confirm(
      "Konfirmasi terakhir: benar-benar hapus semua data proyek SIPILAH di perangkat ini?"
    );
    if (!doubleCheck) return;

    try {
      if (window.SipDB && typeof window.SipDB.clearAll === "function") {
        await window.SipDB.clearAll();
      }
    } catch {
      // Continue with local reset even if IndexedDB clear fails.
    }

    try {
      if (window.SipML && typeof window.SipML.deleteModel === "function") {
        await window.SipML.deleteModel();
      }
    } catch {
      // Continue with local reset even if model deletion fails.
    }

    [
      "sipilah_project_v1",
      "sipilah_tests_v1",
      "sipilah_merge_contributions_v1",
    ].forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage errors during reset.
      }
    });

    try {
      await clearRuntimeCache();
    } catch {
      // Reset data is more important than cache cleanup.
    }

    alert("Data proyek di perangkat ini sudah direset. SIPILAH akan dimuat ulang.");
    location.reload();
  }

  async function exportDataset() {
    if (!window.SipDB) {
      alert("Database SIPILAH belum siap. Muat ulang halaman lalu coba lagi.");
      return;
    }

    const photos = await window.SipDB.getAll();
    if (!photos.length) {
      alert("Dataset masih kosong. Tambahkan foto dulu sebelum ekspor.");
      return;
    }

    const identity = getIdentity();
    const counts = await window.SipDB.getCounts();
    const packageData = {
      type: "sipilah-dataset-package",
      version: VERSION,
      exportedAt: new Date().toISOString(),
      identity,
      counts,
      photos: photos.map((photo) => ({
        category: photo.category,
        dataUrl: photo.dataUrl,
        ts: photo.ts || Date.now(),
      })),
    };

    rememberOwnContribution(photos, counts);

    const group = safeName(identity.group, "kelompok-sipilah");
    const kelas = safeName(identity.kelas, "kelas");
    downloadJSON(`sipilah-dataset-${group}-${kelas}.json`, packageData);
  }

  function pickDatasetFiles() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.multiple = true;
      input.onchange = () => resolve(input.files ? Array.from(input.files) : []);
      input.click();
    });
  }

  function readFileText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Gagal membaca file."));
      reader.readAsText(file);
    });
  }

  function validatePackage(data) {
    if (!data || data.type !== "sipilah-dataset-package" || !Array.isArray(data.photos)) {
      throw new Error("File bukan paket dataset SIPILAH.");
    }

    const photos = data.photos.filter((photo) => {
      return (
        photo &&
        VALID_CATEGORIES.has(photo.category) &&
        typeof photo.dataUrl === "string" &&
        photo.dataUrl.startsWith("data:image/")
      );
    });

    if (!photos.length) throw new Error("Paket dataset tidak berisi foto yang valid.");
    return photos;
  }

  async function importDataset() {
    if (!window.SipDB) {
      alert("Database SIPILAH belum siap. Muat ulang halaman lalu coba lagi.");
      return false;
    }

    const files = await pickDatasetFiles();
    if (!files.length) return false;

    const packages = [];
    const errors = [];

    for (const file of files) {
      try {
        const text = await readFileText(file);
        const data = JSON.parse(text);
        const photos = validatePackage(data);
        packages.push({ data, photos, fileName: file.name });
      } catch (error) {
        errors.push(`${file.name}: ${error && error.message ? error.message : "format tidak valid"}`);
      }
    }

    if (errors.length) {
      alert(`File berikut tidak dapat dibaca:\n${errors.join("\n")}`);
      if (!packages.length) return false;
    }

    const totalPhotos = packages.reduce((sum, pkg) => sum + pkg.photos.length, 0);
    const groupNames = packages
      .map((pkg) => pkg.data.identity && (pkg.data.identity.group || pkg.data.identity.school))
      .filter(Boolean)
      .join(", ");

    const ok = confirm(
      `Gabungkan ${totalPhotos} foto dari ${packages.length} paket${groupNames ? ` (${groupNames})` : ""} ke perangkat ini?\n\nModel lama akan ditandai perlu dilatih ulang.`
    );
    if (!ok) return false;

    for (const pkg of packages) {
      for (const photo of pkg.photos) {
        await window.SipDB.savePhoto(photo.category, photo.dataUrl);
      }
      rememberImportedContribution(pkg.data, pkg.photos);
    }

    const counts = await window.SipDB.getCounts();
    await invalidateModel(counts);

    const totalNow = Object.values(counts).reduce((sum, value) => sum + value, 0);
    alert(
      `Berhasil menggabungkan ${totalPhotos} foto dari ${packages.length} kelompok.\n\nDataset sekarang: ${totalNow} foto. Bisa import kelompok lain lagi, atau latih ulang AI kalau sudah cukup.`
    );
    return true;
  }

  function refreshDashboardInCard(card) {
    const existing = card.querySelector(".sip-merge-dashboard");
    if (!existing) return;
    const tmp = document.createElement("div");
    tmp.innerHTML = renderDashboard();
    existing.replaceWith(tmp.firstElementChild);
  }

  function injectStyles() {
    if (document.getElementById("sipilah-merge-style")) return;
    const style = document.createElement("style");
    style.id = "sipilah-merge-style";
    style.textContent = `
      .sip-merge-card{margin-top:18px;border:1px solid #bbf7d0;background:linear-gradient(135deg,#f0fdf4,#f0f9ff);border-radius:22px;padding:18px;box-shadow:0 18px 45px -30px rgba(21,128,61,.35)}
      .sip-merge-page{display:flex;flex-direction:column;gap:18px}
      .sip-merge-hero{border:1px solid #bbf7d0;background:linear-gradient(135deg,#f0fdf4,#ffffff 54%,#f0f9ff);border-radius:24px;padding:24px;box-shadow:0 22px 60px -38px rgba(21,128,61,.45)}
      .sip-merge-row{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
      .sip-merge-eyebrow{font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#15803d}
      .sip-merge-title{margin-top:4px;font-size:20px;line-height:1.15;font-weight:900;color:#0f172a}
      .sip-merge-desc{margin-top:6px;color:#475569;font-size:14px;line-height:1.55;max-width:760px}
      .sip-merge-actions{display:flex;gap:8px;flex-wrap:wrap}
      .sip-merge-btn{border:0;border-radius:14px;padding:11px 14px;font-weight:900;font-size:13px;cursor:pointer}
      .sip-merge-btn.primary{background:#15803d;color:#fff}
      .sip-merge-btn.secondary{background:#fff;color:#166534;border:1px solid #bbf7d0}
      .sip-merge-flow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
      .sip-merge-step{border:1px solid #dbeafe;background:rgba(255,255,255,.78);border-radius:16px;padding:12px;color:#334155;font-size:13px;line-height:1.45}
      .sip-merge-step b{display:block;color:#0f172a;margin-bottom:3px}
      .sip-merge-dashboard{margin-top:14px;border:1px solid #e2e8f0;background:#fff;border-radius:18px;padding:14px}
      .sip-merge-dashboard-head{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px}
      .sip-merge-dashboard-title{font-weight:900;color:#0f172a}
      .sip-merge-dashboard-note{font-size:12px;color:#64748b;margin-top:2px}
      .sip-merge-summary{display:flex;gap:8px;flex-wrap:wrap}
      .sip-merge-chip{border:1px solid #e2e8f0;background:#f8fafc;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900;color:#334155}
      .sip-merge-table{width:100%;border-collapse:separate;border-spacing:0 8px}
      .sip-merge-table th{text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;padding:0 8px}
      .sip-merge-table td{background:#f8fafc;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:10px 8px;font-size:13px;color:#334155}
      .sip-merge-table td:first-child{border-left:1px solid #e2e8f0;border-radius:12px 0 0 12px}
      .sip-merge-table td:last-child{border-right:1px solid #e2e8f0;border-radius:0 12px 12px 0}
      .sip-merge-group{font-weight:900;color:#0f172a}
      .sip-merge-muted{color:#64748b;font-size:12px}
      .sip-merge-bars{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
      .sip-merge-bar{border-radius:8px;padding:5px 6px;text-align:center;color:#fff;font-weight:900;font-size:11px}
      .sip-merge-empty{border:1px dashed #cbd5e1;border-radius:14px;padding:14px;color:#64748b;font-size:13px;background:#f8fafc}
      .sip-merge-reset{border:0;background:transparent;color:#64748b;font-weight:800;font-size:12px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
      .sip-merge-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .sip-merge-panel{border:1px solid #e2e8f0;background:#fff;border-radius:20px;padding:16px}
      .sip-merge-panel-title{font-weight:900;color:#0f172a;margin-bottom:6px}
      .sip-merge-panel-text{font-size:13px;color:#64748b;line-height:1.55}
      @media(max-width:720px){.sip-merge-flow{grid-template-columns:1fr}.sip-merge-actions{width:100%}.sip-merge-btn{flex:1}}
      @media(max-width:720px){.sip-merge-table th:nth-child(2),.sip-merge-table td:nth-child(2){display:none}.sip-merge-bars{grid-template-columns:repeat(2,minmax(0,1fr))}.sip-merge-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function renderDashboard() {
    const contributions = readContributions();
    const totals = contributions.reduce(
      (acc, item) => {
        acc.Plastik += Number(item.counts && item.counts.Plastik || 0);
        acc.Kertas += Number(item.counts && item.counts.Kertas || 0);
        acc.Organik += Number(item.counts && item.counts.Organik || 0);
        acc.Residu += Number(item.counts && item.counts.Residu || 0);
        return acc;
      },
      { Plastik: 0, Kertas: 0, Organik: 0, Residu: 0 }
    );
    const total = totalCounts(totals);
    const values = Object.values(totals);
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const balanced = total > 0 && min > 0 && (max - min) / max <= 0.45;

    if (!contributions.length) {
      return `
        <div class="sip-merge-dashboard">
          <div class="sip-merge-dashboard-head">
            <div>
              <div class="sip-merge-dashboard-title">Dashboard Kolaborasi Kelas</div>
              <div class="sip-merge-dashboard-note">Kontribusi kelompok akan muncul setelah ekspor atau import paket dataset.</div>
            </div>
          </div>
          <div class="sip-merge-empty">Belum ada riwayat kontribusi. Mulai dari satu kelompok: kumpulkan foto, lalu klik Ekspor Paket.</div>
        </div>
      `;
    }

    const bars = [
      ["Plastik", totals.Plastik, "#0ea5e9"],
      ["Kertas", totals.Kertas, "#f59e0b"],
      ["Organik", totals.Organik, "#10b981"],
      ["Residu", totals.Residu, "#64748b"],
    ];

    return `
      <div class="sip-merge-dashboard">
        <div class="sip-merge-dashboard-head">
          <div>
            <div class="sip-merge-dashboard-title">Dashboard Kolaborasi Kelas</div>
            <div class="sip-merge-dashboard-note">${contributions.length} kontribusi kelompok tercatat · ${balanced ? "dataset cukup seimbang" : "cek kategori yang masih timpang"}</div>
          </div>
          <div class="sip-merge-summary">
            <span class="sip-merge-chip">${total} foto</span>
            <span class="sip-merge-chip">${contributions.length} kelompok</span>
            <button type="button" class="sip-merge-reset" data-sip-merge-reset>Reset riwayat</button>
          </div>
        </div>
        <div class="sip-merge-bars">
          ${bars.map(([label, value, color]) => `<div class="sip-merge-bar" style="background:${color}">${label}: ${value}</div>`).join("")}
        </div>
        <table class="sip-merge-table" aria-label="Kontribusi dataset kelompok">
          <thead>
            <tr><th>Kelompok</th><th>Sekolah/Kelas</th><th>Distribusi</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${contributions.map((item) => `
              <tr>
                <td><div class="sip-merge-group">${item.group}</div><div class="sip-merge-muted">${new Date(item.importedAt || item.exportedAt).toLocaleDateString("id-ID")}</div></td>
                <td>${item.school}<div class="sip-merge-muted">Kelas ${item.kelas}</div></td>
                <td>
                  <div class="sip-merge-bars">
                    <div class="sip-merge-bar" style="background:#0ea5e9">P ${item.counts.Plastik || 0}</div>
                    <div class="sip-merge-bar" style="background:#f59e0b">K ${item.counts.Kertas || 0}</div>
                    <div class="sip-merge-bar" style="background:#10b981">O ${item.counts.Organik || 0}</div>
                    <div class="sip-merge-bar" style="background:#64748b">R ${item.counts.Residu || 0}</div>
                  </div>
                </td>
                <td><b>${item.total}</b> foto</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function findOfflineContainer() {
    const titles = Array.from(document.querySelectorAll("div, h1, h2, h3")).filter((node) => {
      const text = node.textContent || "";
      return text.includes("Cara Demonstrasi Antar Kelompok") || text.includes("Dataset Kelompok Nyata");
    });
    const title = titles[0];
    return title ? title.closest(".space-y-6, main, .p-6") || title.parentElement : null;
  }

  function injectMergeCard() {
    injectStyles();
    if (document.getElementById("sipilah-merge-card")) return;
    const container = findOfflineContainer();
    if (!container) return;

    const card = document.createElement("section");
    card.id = "sipilah-merge-card";
    card.className = "sip-merge-card";
    card.innerHTML = `
      <div class="sip-merge-row">
        <div>
          <div class="sip-merge-eyebrow">Merge Dataset Langsung</div>
          <div class="sip-merge-title">Gabungkan dataset antar perangkat tanpa server</div>
          <div class="sip-merge-desc">
            Perangkat anggota mengekspor paket dataset, lalu perangkat ketua/guru mengimpor paket itu.
            Cocok untuk demo lomba, GitHub Pages, dan sekolah dengan internet terbatas.
          </div>
        </div>
        <div class="sip-merge-actions">
          <button type="button" class="sip-merge-btn secondary" data-sip-merge-export>Ekspor Paket</button>
          <button type="button" class="sip-merge-btn primary" data-sip-merge-import>Import & Gabungkan</button>
        </div>
      </div>
      <div class="sip-merge-flow">
        <div class="sip-merge-step"><b>1. Anggota</b>Kumpulkan foto di perangkat masing-masing, lalu klik Ekspor Paket.</div>
        <div class="sip-merge-step"><b>2. Kirim File</b>Bagikan file .json lewat WhatsApp, Nearby Share, AirDrop, USB, atau Drive.</div>
        <div class="sip-merge-step"><b>3. Perangkat Pusat</b>Klik Import & Gabungkan, lalu latih ulang AI dari dataset kelas.</div>
      </div>
      ${renderDashboard()}
    `;

    card.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches("[data-sip-merge-export]")) {
        await exportDataset();
        refreshDashboardInCard(card);
      }
      if (target.matches("[data-sip-merge-import]")) {
        const imported = await importDataset();
        if (imported) refreshDashboardInCard(card);
      }
      if (target.matches("[data-sip-reload-latest]")) reloadLatestVersion();
      if (target.matches("[data-sip-reset-project]")) resetProjectData();
      if (target.matches("[data-sip-merge-reset]")) {
        if (confirm("Hapus riwayat kontribusi dashboard? Dataset foto tidak ikut terhapus.")) {
          writeContributions([]);
          refreshDashboardInCard(card);
        }
      }
    });

    container.appendChild(card);
  }

  function PageCollaboration() {
    const React = window.React;
    const [version, setVersion] = React.useState(0);

    React.useEffect(() => {
      injectStyles();
    }, []);

    const refresh = () => setVersion((value) => value + 1);
    const handleClick = async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches("[data-sip-merge-export]")) {
        await exportDataset();
        refresh();
      }
      if (target.matches("[data-sip-merge-import]")) {
        const imported = await importDataset();
        if (imported) refresh();
      }
      if (target.matches("[data-sip-merge-reset]")) {
        if (confirm("Hapus riwayat kontribusi dashboard? Dataset foto tidak ikut terhapus.")) {
          writeContributions([]);
          refresh();
        }
      }
    };

    return React.createElement(
      "div",
      { className: "sip-merge-page", onClick: handleClick, "data-sip-merge-version": version },
      React.createElement(
        "section",
        { className: "sip-merge-hero" },
        React.createElement(
          "div",
          { className: "sip-merge-row" },
          React.createElement(
            "div",
            null,
            React.createElement("div", { className: "sip-merge-eyebrow" }, "Kolaborasi Kelas"),
            React.createElement("div", { className: "sip-merge-title" }, "Gabungkan dataset antar kelompok dalam satu perangkat pusat"),
            React.createElement(
              "div",
              { className: "sip-merge-desc" },
              "Setiap kelompok mengumpulkan foto sampah di perangkat masing-masing. Ketua/guru mengimpor paket dataset, lalu melatih ulang AI memakai data gabungan kelas."
            )
          ),
          React.createElement(
            "div",
            { className: "sip-merge-actions" },
            React.createElement("button", { type: "button", className: "sip-merge-btn secondary", "data-sip-merge-export": true }, "Ekspor Paket"),
            React.createElement("button", { type: "button", className: "sip-merge-btn primary", "data-sip-merge-import": true }, "Import & Gabungkan")
          )
        ),
        React.createElement(
          "div",
          { className: "sip-merge-flow" },
          React.createElement("div", { className: "sip-merge-step" }, React.createElement("b", null, "1. Anggota"), "Kumpulkan foto kategori plastik, kertas, organik, dan residu di perangkat masing-masing."),
          React.createElement("div", { className: "sip-merge-step" }, React.createElement("b", null, "2. Kirim Paket"), "Klik Ekspor Paket, lalu bagikan file .json lewat WhatsApp, Nearby Share, AirDrop, USB, atau Drive."),
          React.createElement("div", { className: "sip-merge-step" }, React.createElement("b", null, "3. Perangkat Pusat"), "Klik Import & Gabungkan, cek dashboard kontribusi, lalu latih ulang AI dari dataset kelas.")
        )
      ),
      React.createElement(
        "div",
        { className: "sip-merge-grid" },
        React.createElement(
          "div",
          { className: "sip-merge-panel" },
          React.createElement("div", { className: "sip-merge-panel-title" }, "Untuk demonstrasi lomba"),
          React.createElement("div", { className: "sip-merge-panel-text" }, "Gunakan 2-3 perangkat siswa. Tiap perangkat mengumpulkan dataset kecil, lalu perangkat pusat menggabungkan semuanya di depan juri.")
        ),
        React.createElement(
          "div",
          { className: "sip-merge-panel" },
          React.createElement("div", { className: "sip-merge-panel-title" }, "Untuk kelas sungguhan"),
          React.createElement("div", { className: "sip-merge-panel-text" }, "Setelah dataset kelas terkumpul, siswa dapat membandingkan kontribusi kelompok dan melihat apakah kategori sampah sudah seimbang.")
        )
      ),
      React.createElement("div", { dangerouslySetInnerHTML: { __html: renderDashboard() } })
    );
  }

  function init() {
    injectStyles();
  }

  window.SipMerge = { exportDataset, importDataset, reloadLatestVersion, resetProjectData, PageCollaboration };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
