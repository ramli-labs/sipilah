(function () {
  const VERSION = 1;
  const VALID_CATEGORIES = new Set(["Plastik", "Kertas", "Organik", "Residu"]);
  const IMPORTED_KEYS_STORAGE = "sipilah_imported_package_keys_v1";

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

  function firstText(...values) {
    for (const value of values) {
      const text = String(value || "").trim();
      if (text) return text;
    }
    return "";
  }

  function normalizeIdentity(source) {
    const data = source || {};
    const project = data.project || {};
    const meta = data.meta || data.metadata || {};
    const identity = data.identity || project.identity || meta.identity || {};

    return {
      group: firstText(identity.group, identity.groupName, identity.kelompok, data.group, data.groupName, data.kelompok, meta.group, meta.groupName),
      school: firstText(identity.school, identity.schoolName, identity.sekolah, data.school, data.schoolName, data.sekolah, meta.school, meta.schoolName),
      kelas: firstText(identity.kelas, identity.class, identity.className, identity.classroom, data.kelas, data.class, data.className, meta.kelas, meta.className),
    };
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
  }

  function showDialog({
    title,
    message,
    confirmText = "OK",
    cancelText = "Batal",
    secondaryText = "",
    showCancel = false,
    tone = "green",
    html = "",
  }) {
    injectStyles();

    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "sip-dialog-backdrop";
      overlay.setAttribute("role", "presentation");

      const lines = String(message || "")
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      const iconText = tone === "danger" ? "!" : tone === "amber" ? "i" : "✓";

      overlay.innerHTML = `
        <div class="sip-dialog" role="dialog" aria-modal="true" aria-labelledby="sip-dialog-title">
          <div class="sip-dialog-head">
            <div class="sip-dialog-icon ${tone}">${iconText}</div>
            <div>
              <div id="sip-dialog-title" class="sip-dialog-title">${escapeHTML(title)}</div>
              <div class="sip-dialog-kicker">SIPILAH</div>
            </div>
          </div>
          <div class="sip-dialog-body">
            ${lines.map((line) => `<p>${escapeHTML(line)}</p>`).join("")}
            ${html || ""}
          </div>
          <div class="sip-dialog-actions">
            ${showCancel ? `<button type="button" class="sip-dialog-btn ghost" data-sip-dialog-cancel>${escapeHTML(cancelText)}</button>` : ""}
            ${secondaryText ? `<button type="button" class="sip-dialog-btn ghost" data-sip-dialog-secondary>${escapeHTML(secondaryText)}</button>` : ""}
            <button type="button" class="sip-dialog-btn ${tone === "danger" ? "danger" : "primary"}" data-sip-dialog-confirm>${escapeHTML(confirmText)}</button>
          </div>
        </div>
      `;

      let closed = false;
      function close(value) {
        if (closed) return;
        closed = true;
        document.removeEventListener("keydown", onKeydown);
        overlay.remove();
        resolve(value);
      }

      function onKeydown(event) {
        if (event.key === "Escape") close(false);
      }

      overlay.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.matches("[data-sip-dialog-confirm]")) close(true);
        if (target.matches("[data-sip-dialog-secondary]")) close("secondary");
        if (target.matches("[data-sip-dialog-cancel]")) close(false);
        if (target === overlay && showCancel) close(false);
      });

      document.addEventListener("keydown", onKeydown);
      document.body.appendChild(overlay);
      const primary = overlay.querySelector("[data-sip-dialog-confirm]");
      if (primary) primary.focus();
    });
  }

  function confirmDialog(title, message, options = {}) {
    return showDialog({ title, message, showCancel: true, ...options });
  }

  function notifyDialog(title, message, options = {}) {
    return showDialog({ title, message, showCancel: false, ...options });
  }

  function readContributions() {
    const data = readJSON("sipilah_merge_contributions_v1", []);
    return Array.isArray(data) ? data : [];
  }

  function writeContributions(items) {
    writeJSON("sipilah_merge_contributions_v1", items);
  }

  function readImportedKeys() {
    const data = readJSON(IMPORTED_KEYS_STORAGE, []);
    const keys = Array.isArray(data) ? data : [];
    readContributions().forEach((item) => {
      if (item && item.key) keys.push(item.key);
    });
    return new Set(keys.filter(Boolean));
  }

  function rememberImportedKey(key) {
    if (!key) return;
    const keys = readImportedKeys();
    keys.add(key);
    writeJSON(IMPORTED_KEYS_STORAGE, Array.from(keys).slice(-120));
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

  function renderCountsSummary(counts) {
    return `
      <div class="sip-import-counts">
        <span style="background:#0ea5e9">P ${counts.Plastik || counts.plastik || 0}</span>
        <span style="background:#f59e0b">K ${counts.Kertas || counts.kertas || 0}</span>
        <span style="background:#10b981">O ${counts.Organik || counts.organik || 0}</span>
        <span style="background:#64748b">R ${counts.Residu || counts.residu || 0}</span>
      </div>
    `;
  }

  function isImbalanced(counts) {
    const values = Object.values(counts || {}).map((value) => Number(value || 0));
    const active = values.filter((value) => value > 0);
    if (active.length < 2) return false;
    const max = Math.max(...active);
    const min = Math.min(...active);
    return max > 0 && min / max < 0.45;
  }

  function hashText(value) {
    let hash = 5381;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
    }
    return (hash >>> 0).toString(36);
  }

  function getExportedAt(source) {
    const data = source || {};
    const project = data.project || {};
    const meta = data.meta || data.metadata || {};
    return firstText(data.exportedAt, data.createdAt, data.updatedAt, project.exportedAt, project.createdAt, meta.exportedAt, meta.createdAt);
  }

  function getPackageKey(source, photos) {
    const identity = normalizeIdentity(source);
    const exportedAt = getExportedAt(source);
    const stablePart = exportedAt || hashText((photos || []).map((photo) => {
      const dataUrl = String((photo && photo.dataUrl) || "");
      return [
        photo && photo.category,
        photo && photo.ts,
        dataUrl.length,
        dataUrl.slice(0, 96),
      ].join(":");
    }).join("|"));

    return [
      identity.school || "sekolah",
      identity.kelas || "kelas",
      identity.group || "kelompok",
      stablePart || "paket",
    ].join("|");
  }

  function renderPackagePreview(packages) {
    const items = packages.map((pkg) => {
      const identity = normalizeIdentity(pkg.data);
      const counts = countPhotos(pkg.photos);
      const total = totalCounts(counts);
      const name = identity.group || "Kelompok tanpa nama";
      const school = identity.school || "Sekolah belum diatur";
      const kelas = identity.kelas || "-";
      const source = pkg.fileName ? `<div class="sip-import-file">${escapeHTML(pkg.fileName)}</div>` : "";

      const duplicateBadge = pkg.duplicate ? `<div class="sip-import-duplicate">Sudah pernah diimport</div>` : "";

      return `
        <div class="sip-import-preview-item${pkg.duplicate ? " duplicate" : ""}">
          <div class="sip-import-preview-top">
            <div>
              <div class="sip-import-group">${escapeHTML(name)}</div>
              <div class="sip-import-school">${escapeHTML(school)} · Kelas ${escapeHTML(kelas)}</div>
              ${source}
              ${duplicateBadge}
            </div>
            <div class="sip-import-total">${total} foto</div>
          </div>
          <div class="sip-import-counts">
            <span style="background:#0ea5e9">P ${counts.Plastik || 0}</span>
            <span style="background:#f59e0b">K ${counts.Kertas || 0}</span>
            <span style="background:#10b981">O ${counts.Organik || 0}</span>
            <span style="background:#64748b">R ${counts.Residu || 0}</span>
          </div>
        </div>
      `;
    }).join("");

    const totals = packages.reduce((acc, pkg) => {
      const counts = countPhotos(pkg.photos);
      Object.keys(acc).forEach((key) => {
        acc[key] += Number(counts[key] || 0);
      });
      return acc;
    }, { Plastik: 0, Kertas: 0, Organik: 0, Residu: 0 });
    const warning = isImbalanced(totals)
      ? `<div class="sip-import-warning">Distribusi kategori masih timpang. Setelah digabung, pertimbangkan menambah foto pada kategori yang paling sedikit.</div>`
      : "";

    return `<div class="sip-import-preview">${items}${warning}</div>`;
  }

  function normalizeContribution(source, photos) {
    const identity = normalizeIdentity(source);
    const exportedAt = getExportedAt(source) || new Date().toISOString();
    const key = getPackageKey(source, photos);

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
    const identity = normalizeIdentity({ identity: getIdentity() });
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

  async function getExportPayload() {
    if (!window.SipDB) {
      await notifyDialog("Database belum siap", "Muat ulang halaman lalu coba lagi.", { tone: "amber" });
      return null;
    }

    const photos = await window.SipDB.getAll();
    if (!photos.length) {
      await notifyDialog("Dataset masih kosong", "Tambahkan foto dulu sebelum membuat file JSON.", { tone: "amber" });
      return null;
    }

    const identity = normalizeIdentity({ identity: getIdentity() });
    const counts = await window.SipDB.getCounts();

    return { photos, identity, counts };
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
    const ok = await confirmDialog(
      "Muat ulang versi terbaru?",
      "Cache aplikasi akan dibersihkan.\nDataset, hasil tes, dan model lokal tidak ikut dihapus.",
      { confirmText: "Muat ulang", cancelText: "Nanti dulu", tone: "amber" }
    );
    if (!ok) return;

    try {
      await clearRuntimeCache();
      location.reload();
    } catch {
      await notifyDialog("Cache belum bersih", "Cache gagal dibersihkan otomatis. Halaman akan tetap dimuat ulang.", { tone: "amber" });
      location.reload();
    }
  }

  async function resetProjectData() {
    const ok = await confirmDialog(
      "Reset data proyek?",
      "Yang akan dihapus: dataset foto, model AI, hasil Pre/Post-Test, riwayat prediksi, laporan lokal, dan dashboard kontribusi.\nIdentitas siswa/kelompok tetap disimpan. Tindakan ini tidak bisa dibatalkan.",
      { confirmText: "Lanjut reset", cancelText: "Batal", tone: "danger" }
    );
    if (!ok) return;

    const doubleCheck = await confirmDialog(
      "Konfirmasi terakhir",
      "Benar-benar hapus semua data proyek SIPILAH di perangkat ini?",
      { confirmText: "Ya, hapus", cancelText: "Batal", tone: "danger" }
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
      IMPORTED_KEYS_STORAGE,
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

    await notifyDialog("Data proyek direset", "SIPILAH akan dimuat ulang dengan data proyek kosong.", { confirmText: "Muat ulang" });
    location.reload();
  }

  async function exportDataset() {
    const payload = await getExportPayload();
    if (!payload) return;

    const { photos, identity, counts } = payload;
    const missingIdentity = [
      !identity.group && "nama kelompok",
      !identity.school && "sekolah",
      !identity.kelas && "kelas",
    ].filter(Boolean);

    if (missingIdentity.length) {
      const ok = await confirmDialog(
        "Identitas paket belum lengkap",
        `Field ${missingIdentity.join(", ")} belum terisi. Paket tetap bisa diekspor, tapi guru/ketua mungkin sulit mengenali sumber dataset.\nLanjut ekspor sekarang?`,
        { confirmText: "Tetap ekspor", cancelText: "Batal dulu", tone: "amber" }
      );
      if (!ok) return;
    }

    const packageData = {
      type: "sipilah-dataset-package",
      version: VERSION,
      exportedAt: new Date().toISOString(),
      identity,
      metadata: {
        group: identity.group,
        school: identity.school,
        kelas: identity.kelas,
      },
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
    const fileName = `sipilah-dataset-${group}-${kelas}.json`;
    downloadJSON(fileName, packageData);

    await notifyDialog(
      "Paket dataset berhasil dibuat",
      `File ${fileName} sudah diunduh.\nKirim file JSON ini ke ketua/guru untuk digabung ke dataset kelas.`,
      {
        confirmText: "Siap",
        html: `
          <div class="sip-export-summary">
            <div class="sip-export-file">${escapeHTML(fileName)}</div>
            <div class="sip-export-meta">${escapeHTML(identity.group || "Kelompok tanpa nama")} · ${escapeHTML(identity.school || "Sekolah belum diatur")} · Kelas ${escapeHTML(identity.kelas || "-")}</div>
            <div class="sip-import-total">${photos.length} foto</div>
            ${renderCountsSummary(counts)}
          </div>
        `,
      }
    );
  }

  async function exportClassBackup() {
    const payload = await getExportPayload();
    if (!payload) return;

    const { photos, identity, counts } = payload;
    const missingIdentity = [
      !identity.school && "sekolah",
      !identity.kelas && "kelas",
    ].filter(Boolean);

    if (missingIdentity.length) {
      const ok = await confirmDialog(
        "Identitas kelas belum lengkap",
        `Field ${missingIdentity.join(", ")} belum terisi. Backup tetap bisa dibuat, tapi nama file dan arsipnya akan kurang rapi.\nLanjut buat backup?`,
        { confirmText: "Tetap backup", cancelText: "Batal dulu", tone: "amber" }
      );
      if (!ok) return;
    }

    const backupIdentity = {
      group: identity.group || "Dataset Gabungan Kelas",
      school: identity.school,
      kelas: identity.kelas,
    };
    const packageData = {
      type: "sipilah-dataset-package",
      version: VERSION,
      exportedAt: new Date().toISOString(),
      identity: backupIdentity,
      metadata: {
        group: backupIdentity.group,
        school: backupIdentity.school,
        kelas: backupIdentity.kelas,
        backupType: "class-dataset",
        source: "SIPILAH Backup Dataset Kelas",
      },
      counts,
      photos: photos.map((photo) => ({
        category: photo.category,
        dataUrl: photo.dataUrl,
        ts: photo.ts || Date.now(),
      })),
    };

    const school = safeName(identity.school, "sekolah");
    const kelas = safeName(identity.kelas, "kelas");
    const fileName = `sipilah-dataset-kelas-${school}-${kelas}-gabungan.json`;
    downloadJSON(fileName, packageData);

    await notifyDialog(
      "Backup dataset kelas dibuat",
      `File ${fileName} sudah diunduh.\nFile ini berisi seluruh dataset gabungan di perangkat ini dan bisa dipakai untuk pindah perangkat atau demo ulang.`,
      {
        confirmText: "Siap",
        html: `
          <div class="sip-export-summary">
            <div class="sip-export-file">${escapeHTML(fileName)}</div>
            <div class="sip-export-meta">${escapeHTML(identity.school || "Sekolah belum diatur")} · Kelas ${escapeHTML(identity.kelas || "-")} · ${photos.length} foto gabungan</div>
            <div class="sip-import-total">${photos.length} foto</div>
            ${renderCountsSummary(counts)}
          </div>
        `,
      }
    );
  }

  function pickDatasetFiles() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.multiple = true;
      input.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(input);

      let settled = false;
      function done(files) {
        if (settled) return;
        settled = true;
        document.body.removeChild(input);
        resolve(files);
      }

      input.onchange = () => done(input.files ? Array.from(input.files) : []);

      // Detect cancel: window regains focus without onchange firing
      function onWindowFocus() {
        setTimeout(() => {
          if (!settled) done([]);
        }, 400);
        window.removeEventListener("focus", onWindowFocus);
      }
      window.addEventListener("focus", onWindowFocus);

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
    const isDatasetPackage = data && data.type === "sipilah-dataset-package" && Array.isArray(data.photos);
    const isProjectSync = data && data.sipilah === "project-sync" && Array.isArray(data.photos);
    if (!isDatasetPackage && !isProjectSync) {
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
      await notifyDialog("Database belum siap", "Muat ulang halaman lalu coba lagi.", { tone: "amber" });
      return null;
    }

    const files = await pickDatasetFiles();
    if (!files.length) return null;

    const packages = [];
    const errors = [];
    const importedKeys = readImportedKeys();
    const selectedKeys = new Set();

    for (const file of files) {
      try {
        const text = await readFileText(file);
        const data = JSON.parse(text);
        const photos = validatePackage(data);
        const key = getPackageKey(data, photos);
        const duplicate = importedKeys.has(key) || selectedKeys.has(key);
        selectedKeys.add(key);
        packages.push({ data, photos, fileName: file.name, key, duplicate });
      } catch (error) {
        errors.push(`${file.name}: ${error && error.message ? error.message : "format tidak valid"}`);
      }
    }

    if (errors.length) {
      await notifyDialog("File tidak dapat dibaca", errors.join("\n"), { tone: "amber" });
      if (!packages.length) return null;
    }

    const freshPackages = packages.filter((pkg) => !pkg.duplicate);
    const duplicatePackages = packages.filter((pkg) => pkg.duplicate);

    if (!freshPackages.length) {
      await notifyDialog(
        "Paket sudah pernah diimport",
        "Semua file yang dipilih sudah tercatat di perangkat ini, jadi foto tidak ditambahkan lagi.",
        { tone: "amber" }
      );
      return null;
    }

    const totalPhotos = freshPackages.reduce((sum, pkg) => sum + pkg.photos.length, 0);
    const groupNames = freshPackages
      .map((pkg) => {
        const id = normalizeIdentity(pkg.data);
        return id.group || id.school || null;
      })
      .filter(Boolean)
      .join(", ");

    const ok = await confirmDialog(
      "Preview paket dataset",
      `SIPILAH akan menambahkan ${totalPhotos} foto baru ke dataset perangkat ini.${duplicatePackages.length ? `\n${duplicatePackages.length} paket duplikat akan dilewati.` : ""}\nCek ringkasannya dulu sebelum digabung.`,
      { confirmText: "Gabungkan", cancelText: "Batal", html: renderPackagePreview(packages) }
    );
    if (!ok) return null;

    for (const pkg of freshPackages) {
      for (const photo of pkg.photos) {
        await window.SipDB.savePhoto(photo.category, photo.dataUrl);
      }
      rememberImportedContribution(pkg.data, pkg.photos);
      rememberImportedKey(pkg.key);
    }

    const counts = await window.SipDB.getCounts();
    await invalidateModel(counts);

    const next = await showDialog({
      title: "Dataset berhasil digabung",
      message: `${totalPhotos} foto baru berhasil ditambahkan${groupNames ? ` dari ${groupNames}` : ""}.${duplicatePackages.length ? `\n${duplicatePackages.length} paket duplikat dilewati agar dataset tidak dobel.` : ""}\nModel lama sudah direset agar hasil prediksi memakai dataset gabungan terbaru.`,
      confirmText: "Latih ulang sekarang",
      secondaryText: "Nanti",
      tone: "green",
    });

    if (next === true) {
      const trainBtn = findNavBtn("Latih Model");
      if (trainBtn) trainBtn.click();
    }

    return { count: totalPhotos, groups: groupNames, trainNow: next === true };
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
      .sip-dialog-backdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.58);backdrop-filter:blur(10px);animation:sipDialogFade .16s ease-out}
      .sip-dialog{width:min(520px,100%);max-height:min(86vh,760px);overflow:auto;border:1px solid rgba(226,232,240,.95);border-radius:26px;background:linear-gradient(180deg,#fff,#f8fafc);box-shadow:0 28px 80px -34px rgba(15,23,42,.75);padding:22px;animation:sipDialogPop .18s ease-out}
      .sip-dialog-head{display:flex;gap:14px;align-items:center}
      .sip-dialog-icon{width:46px;height:46px;border-radius:16px;display:grid;place-items:center;font-weight:1000;color:#fff;box-shadow:0 14px 30px -18px currentColor}
      .sip-dialog-icon.green{background:linear-gradient(135deg,#15803d,#10b981)}
      .sip-dialog-icon.amber{background:linear-gradient(135deg,#f59e0b,#facc15);color:#422006}
      .sip-dialog-icon.danger{background:linear-gradient(135deg,#dc2626,#fb7185)}
      .sip-dialog-title{font-size:20px;font-weight:1000;color:#0f172a;line-height:1.15}
      .sip-dialog-kicker{margin-top:3px;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#15803d}
      .sip-dialog-body{margin-top:18px;color:#475569;font-size:14px;line-height:1.6}
      .sip-dialog-body p{margin:0 0 9px}
      .sip-dialog-body p:last-child{margin-bottom:0}
      .sip-import-preview{margin-top:14px;display:grid;gap:10px}
      .sip-import-preview-item{border:1px solid #e2e8f0;background:#fff;border-radius:18px;padding:12px}
      .sip-import-preview-item.duplicate{border-color:#fed7aa;background:#fff7ed}
      .sip-import-preview-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .sip-import-group{font-weight:1000;color:#0f172a;line-height:1.2}
      .sip-import-school{margin-top:3px;color:#64748b;font-size:12px;font-weight:700}
      .sip-import-file{margin-top:4px;color:#94a3b8;font-size:11px;font-weight:800;word-break:break-word}
      .sip-import-duplicate{display:inline-flex;margin-top:7px;border:1px solid #fdba74;background:#ffedd5;color:#9a3412;border-radius:999px;padding:4px 8px;font-size:11px;font-weight:1000}
      .sip-import-total{flex-shrink:0;border:1px solid #bbf7d0;background:#f0fdf4;color:#166534;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:1000;white-space:nowrap}
      .sip-import-counts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:10px}
      .sip-import-counts span{border-radius:9px;padding:6px 5px;color:#fff;font-size:11px;font-weight:1000;text-align:center}
      .sip-import-warning{border:1px solid #fed7aa;background:#fff7ed;color:#9a3412;border-radius:16px;padding:11px 12px;font-size:12px;font-weight:800;line-height:1.45}
      .sip-export-summary{margin-top:14px;border:1px solid #bbf7d0;background:linear-gradient(135deg,#f0fdf4,#fff);border-radius:18px;padding:13px}
      .sip-export-file{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;font-weight:900;color:#166534;background:#fff;border:1px solid #dcfce7;border-radius:12px;padding:9px 10px;word-break:break-all}
      .sip-export-meta{margin:10px 0;color:#475569;font-size:12px;font-weight:800;line-height:1.4}
      .sip-dialog-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:22px;flex-wrap:wrap}
      .sip-dialog-btn{border:0;border-radius:15px;padding:12px 16px;font-size:14px;font-weight:900;cursor:pointer;transition:transform .15s ease,filter .15s ease,background .15s ease}
      .sip-dialog-btn:active{transform:translateY(1px)}
      .sip-dialog-btn:focus-visible{outline:3px solid rgba(14,165,233,.28);outline-offset:2px}
      .sip-dialog-btn.ghost{background:#eef2f7;color:#334155}
      .sip-dialog-btn.primary{background:#15803d;color:#fff;box-shadow:0 14px 30px -18px #15803d}
      .sip-dialog-btn.danger{background:#dc2626;color:#fff;box-shadow:0 14px 30px -18px #dc2626}
      @keyframes sipDialogFade{from{opacity:0}to{opacity:1}}
      @keyframes sipDialogPop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media(max-width:720px){.sip-merge-flow{grid-template-columns:1fr}.sip-merge-actions{width:100%}.sip-merge-btn{flex:1}}
      @media(max-width:520px){.sip-dialog{padding:18px;border-radius:24px}.sip-dialog-actions{display:grid;grid-template-columns:1fr}.sip-dialog-btn{width:100%}.sip-dialog-btn.primary,.sip-dialog-btn.danger{order:-1}.sip-import-preview-top{display:block}.sip-import-total{display:inline-flex;margin-top:8px}.sip-import-counts{grid-template-columns:repeat(2,minmax(0,1fr))}}
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
                <td><div class="sip-merge-group">${escapeHTML(item.group)}</div><div class="sip-merge-muted">${new Date(item.importedAt || item.exportedAt).toLocaleDateString("id-ID")}</div></td>
                <td>${escapeHTML(item.school)}<div class="sip-merge-muted">Kelas ${escapeHTML(item.kelas)}</div></td>
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
          <button type="button" class="sip-merge-btn secondary" data-sip-merge-backup>Backup Dataset Kelas</button>
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
      if (target.matches("[data-sip-merge-backup]")) {
        await exportClassBackup();
      }
      if (target.matches("[data-sip-merge-import]")) {
        const result = await importDataset();
        if (result) refreshDashboardInCard(card);
      }
      if (target.matches("[data-sip-reload-latest]")) reloadLatestVersion();
      if (target.matches("[data-sip-reset-project]")) resetProjectData();
      if (target.matches("[data-sip-merge-reset]")) {
        if (await confirmDialog(
          "Reset riwayat kontribusi?",
          "Dashboard kontribusi akan dikosongkan.\nDataset foto yang sudah digabung tidak ikut terhapus.",
          { confirmText: "Reset riwayat", cancelText: "Batal", tone: "danger" }
        )) {
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
      if (target.matches("[data-sip-merge-backup]")) {
        await exportClassBackup();
      }
      if (target.matches("[data-sip-merge-import]")) {
        const result = await importDataset();
        if (result) refresh();
      }
      if (target.matches("[data-sip-merge-reset]")) {
        if (await confirmDialog(
          "Reset riwayat kontribusi?",
          "Dashboard kontribusi akan dikosongkan.\nDataset foto yang sudah digabung tidak ikut terhapus.",
          { confirmText: "Reset riwayat", cancelText: "Batal", tone: "danger" }
        )) {
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
            React.createElement("button", { type: "button", className: "sip-merge-btn secondary", "data-sip-merge-backup": true }, "Backup Dataset Kelas"),
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

  function isDatasetPageVisible() {
    const buttons = document.querySelectorAll("button");
    let tambahCount = 0;
    for (const btn of buttons) {
      if (btn.textContent && btn.textContent.trim().includes("Tambah Foto")) tambahCount++;
    }
    return tambahCount >= 3;
  }

  function mountDatasetImportBar() {
    const existing = document.getElementById("sip-dataset-import-bar");
    if (!isDatasetPageVisible()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    // Find the grid/container that holds the category cards
    const buttons = Array.from(document.querySelectorAll("button"));
    const tambahBtn = buttons.find((b) => b.textContent && b.textContent.trim().includes("Tambah Foto"));
    if (!tambahBtn) return;
    const cardGrid = tambahBtn.closest("[class*='grid']") || tambahBtn.closest("section") || tambahBtn.parentElement;
    if (!cardGrid) return;
    const insertAfter = cardGrid.closest("[class*='space-y']") || cardGrid.closest("main > div") || cardGrid.parentElement;
    if (!insertAfter || !insertAfter.parentElement) return;

    const bar = document.createElement("div");
    bar.id = "sip-dataset-import-bar";
    bar.style.cssText = "margin:12px 0;border:1px dashed #bbf7d0;border-radius:16px;background:linear-gradient(135deg,#f0fdf4,#f0f9ff);padding:14px 18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-family:system-ui,sans-serif";
    bar.innerHTML = `
      <div style="flex:1;min-width:160px">
        <div style="font-size:12px;font-weight:900;color:#15803d;letter-spacing:.06em;text-transform:uppercase">Sinkron Dataset Kelompok</div>
        <div id="sip-bar-desc" style="font-size:12px;color:#475569;margin-top:2px">Ekspor paket JSON untuk dikirim ke kelompok lain, atau import JSON dari kelompok lain.</div>
      </div>
      <button id="sip-dataset-export-btn" style="border:1px solid #bbf7d0;border-radius:12px;background:#fff;color:#15803d;padding:10px 18px;font:800 13px system-ui,sans-serif;cursor:pointer;white-space:nowrap">Ekspor JSON</button>
      <button id="sip-dataset-import-btn" style="border:0;border-radius:12px;background:#15803d;color:#fff;padding:10px 18px;font:800 13px system-ui,sans-serif;cursor:pointer;white-space:nowrap">+ Import dari Kelompok Lain</button>
    `;
    insertAfter.parentElement.insertBefore(bar, insertAfter.nextSibling);

    let totalBarImported = 0;

    document.getElementById("sip-dataset-export-btn").addEventListener("click", async () => {
      const btn = document.getElementById("sip-dataset-export-btn");
      if (btn) { btn.disabled = true; btn.textContent = "Menyiapkan…"; }
      await exportDataset();
      if (btn) { btn.disabled = false; btn.textContent = "Ekspor JSON"; }
    });

    document.getElementById("sip-dataset-import-btn").addEventListener("click", async () => {
      const importBtn = document.getElementById("sip-dataset-import-btn");
      if (importBtn) { importBtn.disabled = true; importBtn.textContent = "Memproses…"; }

      const result = await importDataset();

      if (result) {
        totalBarImported += result.count;
        const label = bar.querySelector("#sip-bar-desc");
        if (label) {
          label.style.color = "#15803d";
          label.style.fontWeight = "700";
          label.textContent = `✓ ${totalBarImported} foto tersimpan${result.groups ? ` (${result.groups})` : ""}. Import kelompok lain atau klik Selesai.`;
        }
        if (importBtn) { importBtn.disabled = false; importBtn.textContent = "+ Import Kelompok Lain"; }
        // Auto-refresh: navigasi ke halaman lain lalu kembali ke Dataset
        // agar React remount component dan fetch ulang data dari IndexedDB
        if (!result.trainNow) setTimeout(refreshDatasetPage, 800);
      } else {
        if (importBtn) { importBtn.disabled = false; importBtn.textContent = "+ Import dari Kelompok Lain"; }
      }
    });
  }

  function findNavBtn(label) {
    const wanted = String(label || "").trim().toLowerCase();
    return Array.from(document.querySelectorAll("button")).find((el) => {
      // Sidebar collapsed: title attribute
      const title = (el.getAttribute("title") || "").trim().toLowerCase();
      if (title === wanted || title.includes(wanted)) return true;
      // Sidebar expanded: label ada di dalam <span> (bukan langsung di button karena ada SVG icon)
      return Array.from(el.querySelectorAll("span")).some((s) => {
        const text = s.textContent.trim().toLowerCase();
        return text === wanted || text.includes(wanted);
      });
    });
  }

  function refreshDatasetPage() {
    const datasetBtn = findNavBtn("Dataset");
    const berandaBtn = findNavBtn("Beranda");
    if (!datasetBtn) return;

    // Pasang cover putih agar navigasi Beranda→Dataset tidak terlihat user
    const cover = document.createElement("div");
    cover.style.cssText = "position:fixed;inset:0;z-index:9999;background:#fff";
    document.body.appendChild(cover);

    if (berandaBtn) berandaBtn.click();

    setTimeout(() => {
      datasetBtn.click();
      setTimeout(() => cover.remove(), 120);
    }, 80);
  }

  function init() {
    injectStyles();
    const observer = new MutationObserver(() => mountDatasetImportBar());
    observer.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
    mountDatasetImportBar();
  }

  window.SipMerge = { exportDataset, exportClassBackup, importDataset, reloadLatestVersion, resetProjectData, PageCollaboration };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
