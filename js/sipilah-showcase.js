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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
