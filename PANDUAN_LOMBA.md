# SIPILAH

## Media Pembelajaran Kecerdasan Artifisial Berbasis Web untuk Meningkatkan Literasi Pengelolaan Sampah Siswa SMP/MTs melalui Proyek Klasifikasi Sampah Sekolah

Panduan demo lomba untuk mempresentasikan SIPILAH secara ringkas, meyakinkan, dan berbasis bukti.

SIPILAH adalah media ajar KKA untuk SMP yang menghubungkan konsep kecerdasan artifisial dengan masalah nyata di sekolah: pemilahan sampah. Nilai utamanya bukan hanya klasifikasi gambar, tetapi siklus belajar lengkap: pre-test, pengumpulan dataset, pelatihan model, pengujian, analisis akurasi, refleksi kesalahan, post-test, dan laporan proyek.

## Prasyarat Belajar Siswa

SIPILAH dirancang agar dapat digunakan oleh siswa SMP/MTs tanpa pengalaman membuat AI sebelumnya. Prasyarat siswa dibuat sederhana, tetapi **Pre-Test wajib dikerjakan sebelum proyek dimulai** agar guru memiliki gambaran kemampuan awal.

- Siswa dapat memakai kamera perangkat atau memilih foto dari galeri.
- Siswa mengenal contoh dasar sampah plastik, kertas, organik, dan residu.
- Siswa siap bekerja dalam kelompok kecil dan mencatat hasil pengamatan.
- Siswa mengisi identitas, kelas, sekolah, dan nama kelompok.
- Siswa mengerjakan Pre-Test SIPILAH sebelum masuk ke Dataset Sampah, Latih Model, Uji Model, Akurasi, Post-Test, dan Laporan.

## Persiapan Guru

Panduan Guru dan Mode Offline tetap perlu, tetapi posisinya sebagai persiapan guru/fasilitator, bukan prasyarat yang harus dikerjakan siswa satu per satu.

- Guru membaca Panduan Guru untuk memahami tujuan pembelajaran, alur 4 pertemuan, asesmen, dan rubrik proyek.
- Guru menyiapkan 3-5 contoh benda nyata dari lingkungan sekolah.
- Guru mengecek Mode Offline sebelum pembelajaran, terutama jika internet sekolah tidak stabil.
- Perangkat membuka aplikasi melalui browser modern; internet hanya dibutuhkan saat pemuatan awal jika aset belum tersimpan.
- Jika waktu lomba terbatas, guru dapat memakai Mode Simulasi Guru untuk menunjukkan alur lengkap tanpa menunggu dataset terkumpul. Mode ini adalah alat fasilitator, bukan alur belajar utama siswa.

Setelah identitas dan Pre-Test selesai, alur belajar bergerak secara berurutan: pengumpulan dataset, pelatihan model, pengujian model, analisis kesalahan, Post-Test, laporan, hingga aksi lingkungan. Post-Test baru dikerjakan setelah siswa menyelesaikan proyek inti, dan laporan final baru dibuka setelah Post-Test selesai.

## Pitch 30 Detik

SIPILAH membantu siswa memahami AI secara konkret. Mereka tidak hanya memakai AI, tetapi membangun dataset sampah sekolah, melatih model, menguji prediksi, melihat akurasi, menganalisis kesalahan, lalu menyusun laporan. Aplikasi ini berjalan sebagai PWA offline-first sehingga cocok untuk sekolah dengan internet terbatas.

## Alur Demo 5 Menit

1. Buka Beranda dan tunjukkan bahwa SIPILAH punya alur belajar lengkap, bukan sekadar kamera klasifikasi.
2. Masuk ke Pre-Test untuk menunjukkan asesmen awal pemahaman KKA.
3. Buka Dataset Sampah dan jelaskan empat label utama: plastik, kertas, organik, residu.
4. Aktifkan Mode Simulasi Guru dari panel pengaturan hanya jika waktu presentasi pendek.
5. Buka Latih Model, jelaskan bahwa siswa belajar hubungan dataset, label, fitur, dan model.
6. Buka Uji Model untuk menunjukkan prediksi, confidence, dan label kebenaran.
7. Buka Akurasi & Analisis, sorot galeri kesalahan sebagai bagian literasi AI: model bisa salah dan harus dievaluasi.
8. Buka Laporan Proyek dan cetak/preview sebagai bukti hasil belajar.
9. Buka Mode Offline, lalu matikan jaringan atau gunakan DevTools offline untuk menunjukkan app tetap terbuka.

## Poin Juri yang Harus Ditekankan

- Relevansi: sampah sekolah adalah masalah nyata dan dekat dengan siswa.
- Pembelajaran AI utuh: dataset, label, training, testing, akurasi, error analysis, dan refleksi.
- Computational thinking: siswa melakukan dekomposisi kategori, pengumpulan data, evaluasi, dan iterasi.
- Diferensiasi guru: ada Mode Simulasi Guru untuk demonstrasi fasilitator tanpa mengganggu alur belajar siswa.
- Aksesibilitas sekolah: PWA offline-first, model MobileNet lokal, dan penyimpanan data di browser.
- Bukti asesmen: pre-test, post-test, dan laporan proyek membuat dampak belajar lebih mudah dibuktikan.

## Ide Penguatan Nasional

SIPILAH dapat diposisikan sebagai media pembelajaran yang siap direplikasi di SMP/MTs seluruh Indonesia melalui konsep **Dataset Sampah Nusantara**. Setiap sekolah tetap belajar dari sampah di lingkungannya sendiri, tetapi hasil proyek dapat diarahkan untuk membangun peta pembelajaran nasional: jenis sampah dominan, contoh foto lokal, tingkat akurasi model, dan refleksi siswa dari berbagai daerah.

Gagasan ini membuat SIPILAH lebih dari aplikasi klasifikasi. SIPILAH menjadi gerakan belajar AI dan lingkungan yang kontekstual, murah, offline-first, dan dapat dipakai lintas sekolah tanpa menunggu laboratorium komputer canggih.

Di Beranda, SIPILAH menampilkan **Peta Jangkauan 3T** berbentuk peta Indonesia. Peta ini dipakai sebagai narasi target perluasan ke sekolah kepulauan, perbatasan, pegunungan, dan wilayah akses terbatas. Titik pada peta adalah contoh sasaran replikasi, bukan klaim implementasi resmi.

Fitur lanjutan yang bisa menjadi roadmap:

- **Paket Sekolah Offline**: satu folder siap pakai berisi aplikasi, model, panduan guru, rubrik, dan contoh dataset mini.
- **Mode Guru Nusantara**: guru memilih konteks sekolah, misalnya perkotaan, pesisir, pegunungan, atau pesantren/madrasah, lalu contoh kasus dan refleksi menyesuaikan.
- **Dataset Sampah Lokal**: siswa membangun dataset dari sampah nyata di sekolah, bukan gambar generik dari internet.
- **Bank Refleksi Siswa**: laporan tidak hanya angka akurasi, tetapi juga alasan model salah dan rencana aksi pengurangan sampah.
- **Peta Dampak Sekolah**: tiap kelas dapat mencatat jumlah foto, kategori sampah dominan, akurasi, dan aksi lanjutan sebagai bukti literasi lingkungan.
- **Bahasa dan Istilah Ramah SMP/MTs**: istilah AI dijelaskan lewat contoh sederhana: dataset sebagai kumpulan contoh, label sebagai nama kategori, akurasi sebagai ukuran ketepatan.
- **Tanpa Server Wajib**: data tetap bisa disimpan lokal sehingga cocok untuk sekolah dengan internet tidak stabil.

## Ide Brilian untuk Versi Web Berikutnya

Versi web saat ini sudah sesuai sebagai media pembelajaran SMP/MTs karena memiliki alur belajar, praktik proyek, asesmen, laporan, dan mode offline. Penguatan berikutnya sebaiknya diarahkan pada skala nasional dan kemudahan guru.

- **Pilih Konteks Sekolah**: saat awal, guru memilih konteks sekolah seperti perkotaan, pesisir, pegunungan, madrasah, atau sekolah kecil. Contoh sampah, skenario refleksi, dan tantangan proyek menyesuaikan.
- **Misi 7 Hari Sekolah Bersih**: setelah siswa melatih model, aplikasi memberi misi harian sederhana: audit tempat sampah, foto 10 sampah dominan, diskusi kesalahan model, dan rencana aksi kelas.
- **Kartu Konsep AI SMP**: setiap halaman punya kartu singkat yang menjelaskan konsep KKA dengan bahasa sederhana, misalnya dataset, label, training, testing, confidence, bias, dan akurasi.
- **Rubrik Otomatis Guru**: laporan proyek dilengkapi skor proses, kualitas dataset, analisis kesalahan, kerja kelompok, dan rencana aksi lingkungan.
- **Mode Berbagi Tanpa Internet**: laporan dapat diekspor/cetak sebagai bukti proyek, lalu dikumpulkan guru tanpa akun dan tanpa server.
- **Dashboard Dampak Kelas**: tampilkan total foto, komposisi sampah, akurasi model, kesalahan terbanyak, dan aksi yang disepakati kelas.
- **Cerita Daerah**: contoh kasus bisa memuat masalah lokal, seperti sampah plastik di pesisir, daun dan organik di sekolah hijau, atau residu kantin di sekolah perkotaan.

## Checklist Sebelum Presentasi

- Jalankan aplikasi lewat server lokal, bukan langsung dari file, agar service worker aktif.
- Buka aplikasi sekali saat online sampai semua aset selesai dimuat.
- Masuk ke Mode Offline dan pastikan halaman tetap bisa dibuka.
- Siapkan 3-5 contoh benda nyata: botol plastik, kertas, daun/sisa makanan, dan residu.
- Isi identitas kelompok agar laporan terlihat siap dinilai.
- Gunakan Mode Simulasi Guru jika durasi demo kurang dari 7 menit.
- Simpan satu screenshot halaman Akurasi & Analisis dan Laporan Proyek sebagai cadangan.

## Risiko dan Jawaban Singkat

**Apakah model selalu benar?**  
Tidak. Justru SIPILAH mengajarkan bahwa AI harus diuji. Kesalahan prediksi dipakai sebagai bahan diskusi dataset, kualitas foto, dan bias data.

**Apakah butuh internet?**  
Tidak untuk demo setelah aset termuat. Aplikasi memakai PWA cache dan model MobileNet lokal di folder `mobilenet/`.

**Apakah data siswa dikirim ke server?**  
Tidak. Data proyek disimpan lokal di browser melalui IndexedDB/localStorage.

**Apa kebaruan utamanya?**  
SIPILAH menyatukan literasi AI, asesmen pembelajaran, aksi lingkungan sekolah, dan aplikasi offline dalam satu pengalaman belajar.
