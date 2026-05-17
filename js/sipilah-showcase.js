(function () {
  const fmt = (value, fallback = "0") => (value == null || value === "" ? fallback : value);

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function getMetrics() {
    const project = readJSON("sipilah_project_v1", {});
    const tests = readJSON("sipilah_tests_v1", {});
    const identity = readJSON("sipilah_identity_v1", {});
    const dataset = project.datasetCount || { plastik: 0, kertas: 0, organik: 0, residu: 0 };
    const totalDataset = Object.values(dataset).reduce((sum, n) => sum + Number(n || 0), 0);
    const predictions = project.predictions || [];
    const correct = predictions.filter((item) => item && item.isCorrect).length;
    const testAccuracy = predictions.length ? Math.round((correct / predictions.length) * 100) : 0;
    const pre = tests.pre && typeof tests.pre.score === "number" ? tests.pre.score : null;
    const post = tests.post && typeof tests.post.score === "number" ? tests.post.score : null;
    const gain = pre != null && post != null ? post - pre : null;

    return {
      identity,
      dataset,
      totalDataset,
      modelReady: !!project.modelReady,
      modelAccuracy: project.accuracy || 0,
      predictions: predictions.length,
      testAccuracy,
      pre,
      post,
      gain,
    };
  }

  function buildSummary(metrics) {
    return [
      "SIPILAH adalah media pembelajaran Kecerdasan Artifisial berbasis web untuk siswa SMP/MTs.",
      "Masalah yang diangkat: literasi AI siswa masih perlu diperkuat, sementara persoalan pemilahan sampah dekat dengan kehidupan sekolah.",
      "Solusi: siswa belajar AI melalui proyek nyata klasifikasi sampah sekolah, mulai dari Pre-Test, pengumpulan dataset, pelabelan, pelatihan model, pengujian, analisis akurasi, Post-Test, hingga laporan aksi.",
      `Bukti proses saat ini: ${metrics.totalDataset} foto dataset, ${metrics.modelReady ? "model sudah dilatih" : "model belum dilatih"}, ${metrics.predictions} pengujian prediksi.`,
      metrics.pre != null && metrics.post != null
        ? `Bukti peningkatan literasi: skor Pre-Test ${metrics.pre}, Post-Test ${metrics.post}, perubahan ${metrics.gain >= 0 ? "+" : ""}${metrics.gain} poin.`
        : "Bukti peningkatan literasi akan muncul otomatis setelah siswa menyelesaikan Pre-Test dan Post-Test.",
      "Keunggulan: offline-first, cocok untuk sekolah dengan internet terbatas, berbasis proyek, SMP-friendly, dan menghasilkan laporan yang dapat dipakai guru untuk asesmen.",
    ].join("\n");
  }

  function stat(label, value, note) {
    return `
      <div class="sip-show-stat">
        <div class="sip-show-stat-label">${label}</div>
        <div class="sip-show-stat-value">${value}</div>
        <div class="sip-show-stat-note">${note}</div>
      </div>
    `;
  }

  function card(title, body, tag) {
    return `
      <div class="sip-show-card">
        <div class="sip-show-tag">${tag}</div>
        <h3>${title}</h3>
        <p>${body}</p>
      </div>
    `;
  }

  function renderModal() {
    const metrics = getMetrics();
    const identity = metrics.identity || {};
    const gainText = metrics.gain == null ? "Belum lengkap" : `${metrics.gain >= 0 ? "+" : ""}${metrics.gain} poin`;
    const summary = buildSummary(metrics);

    const root = document.createElement("div");
    root.className = "sip-show-modal";
    root.innerHTML = `
      <div class="sip-show-backdrop" data-close="1"></div>
      <section class="sip-show-dialog" role="dialog" aria-modal="true" aria-label="Mode Presentasi Lomba SIPILAH">
        <button class="sip-show-close" type="button" aria-label="Tutup" data-close="1">×</button>
        <div class="sip-show-hero">
          <div>
            <div class="sip-show-eyebrow">Mode Presentasi Lomba</div>
            <h2>SIPILAH dalam 90 detik untuk juri</h2>
            <p>Ringkasan masalah, solusi, alur belajar, dampak, dan bukti peningkatan literasi yang langsung terbaca saat presentasi.</p>
          </div>
          <div class="sip-show-school">
            <strong>${fmt(identity.school, "Nama Sekolah")}</strong>
            <span>${fmt(identity.group, "Kelompok SIPILAH")} · Kelas ${fmt(identity.kelas, "-")}</span>
          </div>
        </div>

        <div class="sip-show-stats">
          ${stat("Dataset", metrics.totalDataset, "foto sampah sekolah")}
          ${stat("Model AI", metrics.modelReady ? "Siap" : "Belum", `${metrics.modelAccuracy || 0}% akurasi latih`)}
          ${stat("Uji Prediksi", metrics.predictions, `${metrics.testAccuracy}% benar`)}
          ${stat("Pre/Post", gainText, metrics.pre != null && metrics.post != null ? `${metrics.pre} → ${metrics.post}` : "menunggu asesmen")}
        </div>

        <div class="sip-show-grid">
          ${card("Masalah Nyata", "Siswa perlu literasi AI yang membumi, sementara sekolah menghadapi persoalan pemilahan sampah setiap hari.", "01")}
          ${card("Solusi Pembelajaran", "SIPILAH mengubah sampah sekolah menjadi proyek AI: kumpulkan data, beri label, latih model, uji, analisis, lalu buat aksi.", "02")}
          ${card("Bukti Belajar", "Pre-Test dan Post-Test menunjukkan peningkatan literasi. Dataset, akurasi, dan galeri kesalahan menjadi bukti proses.", "03")}
          ${card("Jangkauan Nasional", "Web offline-first membuat SIPILAH tetap relevan untuk sekolah perkotaan maupun sekolah 3T dengan internet terbatas.", "04")}
        </div>

        <div class="sip-show-flow">
          <div>Input Identitas</div>
          <div>Tujuan</div>
          <div>Pre-Test</div>
          <div>Dataset</div>
          <div>Latih AI</div>
          <div>Uji</div>
          <div>Post-Test</div>
          <div>Laporan</div>
        </div>

        <div class="sip-show-script">
          <div>
            <h3>Naskah singkat presentasi</h3>
            <p>${summary.replace(/\n/g, "<br>")}</p>
          </div>
          <button type="button" class="sip-show-copy">Salin Ringkasan</button>
        </div>
      </section>
    `;

    root.addEventListener("click", async (event) => {
      if (event.target && event.target.dataset && event.target.dataset.close) root.remove();
      if (event.target && event.target.classList.contains("sip-show-copy")) {
        try {
          await navigator.clipboard.writeText(summary);
          event.target.textContent = "Tersalin";
          setTimeout(() => (event.target.textContent = "Salin Ringkasan"), 1200);
        } catch {
          event.target.textContent = "Gagal Salin";
          setTimeout(() => (event.target.textContent = "Salin Ringkasan"), 1200);
        }
      }
    });

    document.body.appendChild(root);
  }

  function injectStyles() {
    if (document.getElementById("sip-showcase-style")) return;
    const style = document.createElement("style");
    style.id = "sip-showcase-style";
    style.textContent = `
      .sip-show-btn{position:fixed;right:18px;bottom:18px;z-index:80;border:0;border-radius:16px;background:#0f172a;color:#fff;padding:12px 14px;font:800 13px system-ui,sans-serif;box-shadow:0 18px 45px -18px rgba(15,23,42,.55);cursor:pointer;display:flex;align-items:center;gap:8px}
      .sip-show-btn:hover{background:#15803d}
      .sip-show-btn span{width:9px;height:9px;border-radius:999px;background:#facc15;box-shadow:0 0 0 5px rgba(250,204,21,.18)}
      .sip-show-modal{position:fixed;inset:0;z-index:120;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .sip-show-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.58);backdrop-filter:blur(8px)}
      .sip-show-dialog{position:relative;margin:24px auto;max-width:1120px;max-height:calc(100vh - 48px);overflow:auto;background:#fff;border-radius:24px;border:1px solid rgba(226,232,240,.9);box-shadow:0 30px 80px -30px rgba(15,23,42,.7)}
      .sip-show-close{position:absolute;right:14px;top:12px;z-index:2;width:36px;height:36px;border-radius:12px;border:1px solid rgba(226,232,240,.9);background:#fff;font-size:24px;line-height:1;color:#334155;cursor:pointer}
      .sip-show-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;padding:30px;background:linear-gradient(135deg,#f0fdf4,#f0f9ff 58%,#fffbeb);border-bottom:1px solid #e2e8f0}
      .sip-show-eyebrow,.sip-show-tag,.sip-show-stat-label{font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#15803d}
      .sip-show-hero h2{margin:8px 0 0;font-size:34px;line-height:1.05;color:#0f172a;letter-spacing:0;font-weight:900}
      .sip-show-hero p{margin:10px 0 0;color:#475569;max-width:720px;line-height:1.55}
      .sip-show-school{align-self:end;border:1px solid #bbf7d0;background:rgba(255,255,255,.78);border-radius:16px;padding:14px 16px;min-width:240px}
      .sip-show-school strong,.sip-show-school span{display:block}.sip-show-school strong{color:#0f172a}.sip-show-school span{margin-top:4px;color:#64748b;font-size:13px}
      .sip-show-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:18px 24px;background:#fff}
      .sip-show-stat{border:1px solid #e2e8f0;border-radius:16px;padding:14px;background:#f8fafc}
      .sip-show-stat-value{margin-top:5px;font-size:28px;font-weight:900;color:#0f172a;line-height:1}
      .sip-show-stat-note{margin-top:5px;font-size:12px;color:#64748b}
      .sip-show-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:0 24px 20px}
      .sip-show-card{border:1px solid #e2e8f0;border-radius:18px;padding:16px;background:#fff}
      .sip-show-card h3{margin:8px 0 6px;color:#0f172a;font-size:16px}.sip-show-card p{margin:0;color:#475569;font-size:13px;line-height:1.5}
      .sip-show-flow{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;padding:0 24px 20px}
      .sip-show-flow div{border-radius:12px;background:#ecfdf5;color:#166534;text-align:center;font-size:12px;font-weight:800;padding:10px 6px;border:1px solid #bbf7d0}
      .sip-show-script{margin:0 24px 24px;border-radius:18px;background:#0f172a;color:#e2e8f0;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start}
      .sip-show-script h3{margin:0 0 8px;color:#fff}.sip-show-script p{margin:0;font-size:13px;line-height:1.6}
      .sip-show-copy{border:0;border-radius:12px;background:#facc15;color:#422006;padding:11px 14px;font-weight:900;cursor:pointer;white-space:nowrap}
      @media(max-width:860px){.sip-show-btn{right:12px;bottom:12px}.sip-show-dialog{margin:10px;max-height:calc(100vh - 20px)}.sip-show-hero,.sip-show-script{grid-template-columns:1fr}.sip-show-stats,.sip-show-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sip-show-flow{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:520px){.sip-show-stats,.sip-show-grid{grid-template-columns:1fr}.sip-show-hero h2{font-size:28px}}
    `;
    document.head.appendChild(style);
  }

  function renderCertificate() {
    const metrics = getMetrics();
    const identity = metrics.identity || {};
    const group = (identity.group || "").trim();
    const name = (identity.name || "").trim();
    const role = identity.role || "Siswa";
    const kelas = (identity.kelas || "").trim();
    const school = (identity.school || "").trim();
    const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const recipient = group ? `Kelompok ${group}` : (name || "Peserta SIPILAH");
    const subLine = group && name ? `${name} &nbsp;·&nbsp; ${role}` : "";
    const schoolLine = [kelas ? `Kelas ${kelas}` : "", school].filter(Boolean).join(" &nbsp;·&nbsp; ");
    const gainText = metrics.gain != null ? `${metrics.gain >= 0 ? "+" : ""}${metrics.gain} poin` : "—";
    const prePost = metrics.pre != null && metrics.post != null ? `${metrics.pre} → ${metrics.post}` : "—";
    const accuracy = metrics.modelAccuracy ? `${Math.round(metrics.modelAccuracy * 100)}%` : (metrics.modelReady ? "Selesai" : "—");

    if (document.getElementById("sip-cert-modal")) return;

    const style = document.createElement("style");
    style.id = "sip-cert-style";
    style.textContent = `
      #sip-cert-modal{position:fixed;inset:0;z-index:130;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.65);backdrop-filter:blur(10px);font-family:system-ui,-apple-system,sans-serif;padding:16px}
      .sip-cert-wrap{position:relative;background:#fff;border-radius:20px;box-shadow:0 40px 100px -30px rgba(15,23,42,.7);max-width:720px;width:100%;overflow:hidden}
      .sip-cert-close{position:absolute;right:12px;top:12px;z-index:2;border:1px solid #e2e8f0;background:#fff;border-radius:10px;width:34px;height:34px;font-size:22px;line-height:1;cursor:pointer;color:#64748b}
      .sip-cert-actions{display:flex;gap:10px;padding:14px 20px 16px;justify-content:flex-end;border-top:1px solid #e2e8f0;background:#f8fafc}
      .sip-cert-print-btn{border:0;border-radius:12px;background:#15803d;color:#fff;padding:10px 20px;font-weight:800;font-size:14px;cursor:pointer}
      .sip-cert-print-btn:hover{background:#166534}
      .sip-cert-body{padding:40px 48px 32px;background:linear-gradient(160deg,#f0fdf4 0%,#fff 45%,#f0f9ff 100%);border:6px solid transparent;background-clip:padding-box;position:relative}
      .sip-cert-body::before{content:"";position:absolute;inset:0;border-radius:0;border:3px solid #bbf7d0;pointer-events:none}
      .sip-cert-corner{position:absolute;width:32px;height:32px;border-color:#15803d;border-style:solid;opacity:.5}
      .sip-cert-corner.tl{top:10px;left:10px;border-width:3px 0 0 3px}
      .sip-cert-corner.tr{top:10px;right:10px;border-width:3px 3px 0 0}
      .sip-cert-corner.bl{bottom:10px;left:10px;border-width:0 0 3px 3px}
      .sip-cert-corner.br{bottom:10px;right:10px;border-width:0 3px 3px 0}
      .sip-cert-eyebrow{font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#15803d;text-align:center}
      .sip-cert-title{text-align:center;font-size:22px;font-weight:900;color:#0f172a;margin:6px 0 4px;letter-spacing:-.01em}
      .sip-cert-sub{text-align:center;font-size:13px;color:#64748b;margin-bottom:24px}
      .sip-cert-divider{border:none;border-top:1px solid #e2e8f0;margin:0 0 22px}
      .sip-cert-given{text-align:center;font-size:12px;color:#64748b;letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin-bottom:10px}
      .sip-cert-recipient{text-align:center;font-size:34px;font-weight:900;color:#15803d;line-height:1.1;margin-bottom:6px}
      .sip-cert-subrec{text-align:center;font-size:14px;color:#334155;font-weight:600;margin-bottom:4px}
      .sip-cert-school{text-align:center;font-size:13px;color:#64748b;margin-bottom:22px}
      .sip-cert-desc{text-align:center;font-size:14px;color:#475569;line-height:1.6;margin-bottom:24px;max-width:480px;margin-left:auto;margin-right:auto}
      .sip-cert-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
      .sip-cert-stat{border:1px solid #e2e8f0;border-radius:12px;padding:10px 6px;text-align:center;background:#fff}
      .sip-cert-stat strong{display:block;font-size:18px;font-weight:900;color:#0f172a;line-height:1}
      .sip-cert-stat span{display:block;font-size:10px;color:#64748b;font-weight:700;margin-top:3px;text-transform:uppercase;letter-spacing:.06em}
      .sip-cert-footer{display:flex;align-items:center;justify-content:space-between}
      .sip-cert-date{font-size:12px;color:#94a3b8}
      .sip-cert-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#166534;background:#dcfce7;border:1px solid #bbf7d0;border-radius:999px;padding:4px 10px}
      @media print{
        body>*:not(#sip-cert-modal){display:none!important}
        #sip-cert-modal{position:static!important;background:none!important;backdrop-filter:none!important;padding:0!important;display:block!important}
        .sip-cert-wrap{box-shadow:none!important;border-radius:0!important;max-width:100%!important}
        .sip-cert-close,.sip-cert-actions{display:none!important}
        .sip-cert-body{padding:28px 36px!important}
      }
    `;
    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.id = "sip-cert-modal";
    modal.innerHTML = `
      <div class="sip-cert-wrap">
        <button class="sip-cert-close" id="sip-cert-close-btn" aria-label="Tutup">×</button>
        <div class="sip-cert-body">
          <div class="sip-cert-corner tl"></div>
          <div class="sip-cert-corner tr"></div>
          <div class="sip-cert-corner bl"></div>
          <div class="sip-cert-corner br"></div>
          <div class="sip-cert-eyebrow">SIPILAH · Media Ajar KKA SMP/MTs</div>
          <h2 class="sip-cert-title">Sertifikat Penyelesaian Proyek</h2>
          <p class="sip-cert-sub">Kecerdasan Artifisial: Klasifikasi Sampah Sekolah</p>
          <hr class="sip-cert-divider"/>
          <div class="sip-cert-given">Diberikan kepada</div>
          <div class="sip-cert-recipient">${recipient}</div>
          ${subLine ? `<div class="sip-cert-subrec">${subLine}</div>` : ""}
          ${schoolLine ? `<div class="sip-cert-school">${schoolLine}</div>` : ""}
          <p class="sip-cert-desc">
            Telah menyelesaikan seluruh tahapan Proyek AI SIPILAH: Pre-Test, pengumpulan dataset sampah,
            pelabelan, pelatihan model, pengujian prediksi, analisis akurasi, Post-Test, dan penyusunan laporan proyek.
          </p>
          <div class="sip-cert-stats">
            <div class="sip-cert-stat"><strong>${metrics.totalDataset || "—"}</strong><span>Foto Dataset</span></div>
            <div class="sip-cert-stat"><strong>${accuracy}</strong><span>Akurasi Model</span></div>
            <div class="sip-cert-stat"><strong>${prePost}</strong><span>Pre → Post Test</span></div>
            <div class="sip-cert-stat"><strong>${gainText}</strong><span>Peningkatan</span></div>
          </div>
          <div class="sip-cert-footer">
            <span class="sip-cert-date">${date}</span>
            <span class="sip-cert-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Selaras CP KKA Fase D · Kurikulum Merdeka
            </span>
          </div>
        </div>
        <div class="sip-cert-actions">
          <button class="sip-cert-print-btn" id="sip-cert-print-btn">🖨️ Cetak / Simpan PDF</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById("sip-cert-close-btn").addEventListener("click", () => {
      modal.remove();
      const s = document.getElementById("sip-cert-style");
      if (s) s.remove();
    });
    document.getElementById("sip-cert-print-btn").addEventListener("click", () => window.print());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        const s = document.getElementById("sip-cert-style");
        if (s) s.remove();
      }
    });
  }

  async function exportProject() {
    const project = readJSON("sipilah_project_v1", {});
    let photos = [];
    try { photos = await window.SipDB.getAll(); } catch (e) {}
    const payload = {
      v: 1,
      sipilah: "project-sync",
      exported: new Date().toISOString(),
      project,
      photos: photos.map((p) => ({ category: p.category, dataUrl: p.dataUrl, ts: p.ts })),
    };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sipilah-proyek-kelompok.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return photos.length;
  }

  async function importProject(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.sipilah !== "project-sync") throw new Error("File bukan file proyek SIPILAH.");
          if (data.project) localStorage.setItem("sipilah_project_v1", JSON.stringify(data.project));
          if (Array.isArray(data.photos) && data.photos.length) {
            await window.SipDB.clearAll();
            for (const photo of data.photos) {
              await window.SipDB.savePhoto(photo.category, photo.dataUrl);
            }
          }
          resolve({ photoCount: (data.photos || []).length });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsText(file);
    });
  }

  function renderSyncModal() {
    if (document.getElementById("sip-sync-modal")) return;
    const modal = document.createElement("div");
    modal.id = "sip-sync-modal";
    modal.style.cssText = "position:fixed;inset:0;z-index:130;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.6);backdrop-filter:blur(8px);font-family:system-ui,sans-serif";
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;box-shadow:0 40px 100px -30px rgba(15,23,42,.6);max-width:420px;width:100%;overflow:hidden">
        <div style="padding:20px 22px 0;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#15803d">Sinkron Kelompok</div>
            <div style="font-size:18px;font-weight:900;color:#0f172a;margin-top:2px">Bagikan Progress Proyek</div>
          </div>
          <button id="sip-sync-close" style="border:1px solid #e2e8f0;background:#fff;border-radius:10px;width:32px;height:32px;font-size:20px;cursor:pointer;color:#64748b">×</button>
        </div>
        <div style="padding:16px 22px 22px;display:grid;gap:10px">
          <div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#f8fafc">
            <div style="font-size:12px;font-weight:800;color:#0f172a;margin-bottom:4px">📤 Ekspor Proyek</div>
            <div style="font-size:12px;color:#64748b;line-height:1.5;margin-bottom:10px">Download file JSON berisi dataset + data proyek. Kirim ke anggota kelompok lain via chat/Google Drive.</div>
            <button id="sip-sync-export-btn" style="border:0;border-radius:10px;background:#0f172a;color:#fff;padding:9px 16px;font:800 12px system-ui,sans-serif;cursor:pointer;width:100%">📥 Download sipilah-proyek-kelompok.json</button>
            <div id="sip-sync-export-status" style="display:none;margin-top:8px;font-size:11px;font-weight:700;color:#15803d;text-align:center"></div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#f8fafc">
            <div style="font-size:12px;font-weight:800;color:#0f172a;margin-bottom:4px">📂 Impor Proyek</div>
            <div style="font-size:12px;color:#64748b;line-height:1.5;margin-bottom:10px">Upload file JSON dari ketua kelompok. Identitas &amp; nilai tes kamu tidak akan berubah.</div>
            <button id="sip-sync-import-btn" style="border:1px solid #bbf7d0;border-radius:10px;background:#f0fdf4;color:#15803d;padding:9px 16px;font:800 12px system-ui,sans-serif;cursor:pointer;width:100%">📤 Pilih File JSON…</button>
            <input id="sip-sync-file-input" type="file" accept=".json,application/json" style="display:none">
            <div id="sip-sync-import-status" style="display:none;margin-top:8px;font-size:11px;font-weight:700;text-align:center"></div>
          </div>
          <div style="font-size:11px;color:#94a3b8;text-align:center;line-height:1.5">Model AI perlu dilatih ulang di perangkat tujuan setelah impor.</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("sip-sync-close").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById("sip-sync-export-btn").addEventListener("click", async () => {
      const btn = document.getElementById("sip-sync-export-btn");
      const status = document.getElementById("sip-sync-export-status");
      btn.disabled = true;
      btn.textContent = "Menyiapkan…";
      try {
        const count = await exportProject();
        status.style.display = "block";
        status.textContent = `✅ File berhasil diunduh (${count} foto, data proyek)`;
        btn.textContent = "📥 Download sipilah-proyek-kelompok.json";
      } catch {
        status.style.display = "block";
        status.style.color = "#dc2626";
        status.textContent = "Gagal mengekspor. Coba lagi.";
        btn.textContent = "📥 Download sipilah-proyek-kelompok.json";
      }
      btn.disabled = false;
    });

    document.getElementById("sip-sync-import-btn").addEventListener("click", () => {
      document.getElementById("sip-sync-file-input").click();
    });

    document.getElementById("sip-sync-file-input").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const btn = document.getElementById("sip-sync-import-btn");
      const status = document.getElementById("sip-sync-import-status");
      btn.disabled = true;
      btn.textContent = "Mengimpor…";
      status.style.display = "block";
      status.style.color = "#64748b";
      status.textContent = "Sedang memproses…";
      try {
        const result = await importProject(file);
        status.style.color = "#15803d";
        status.textContent = `✅ Berhasil! ${result.photoCount} foto diimpor. Halaman akan dimuat ulang…`;
        setTimeout(() => { modal.remove(); location.reload(); }, 1800);
      } catch (err) {
        status.style.color = "#dc2626";
        status.textContent = `❌ ${err.message}`;
        btn.textContent = "📤 Pilih File JSON…";
        btn.disabled = false;
      }
    });
  }

  function init() {
    injectStyles();
    if (document.getElementById("sip-showcase-button")) return;

    const btn = document.createElement("button");
    btn.id = "sip-showcase-button";
    btn.className = "sip-show-btn";
    btn.type = "button";
    btn.innerHTML = "<span></span> Mode Presentasi Lomba";
    btn.addEventListener("click", renderModal);
    document.body.appendChild(btn);

    const certBtn = document.createElement("button");
    certBtn.id = "sip-cert-button";
    certBtn.type = "button";
    certBtn.style.cssText = "position:fixed;right:18px;bottom:64px;z-index:80;border:1px solid #bbf7d0;border-radius:16px;background:#f0fdf4;color:#15803d;padding:9px 14px;font:800 12px system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 14px -4px rgba(21,128,61,.25)";
    certBtn.innerHTML = "🏅 Sertifikat Proyek";
    certBtn.addEventListener("click", renderCertificate);
    document.body.appendChild(certBtn);

    const syncBtn = document.createElement("button");
    syncBtn.id = "sip-sync-button";
    syncBtn.type = "button";
    syncBtn.style.cssText = "position:fixed;right:18px;bottom:108px;z-index:80;border:1px solid #bfdbfe;border-radius:16px;background:#eff6ff;color:#1d4ed8;padding:9px 14px;font:800 12px system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 14px -4px rgba(29,78,216,.2)";
    syncBtn.innerHTML = "🔄 Sinkron Kelompok";
    syncBtn.addEventListener("click", renderSyncModal);
    document.body.appendChild(syncBtn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
