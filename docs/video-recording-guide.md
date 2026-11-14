# Panduan Teknis Perekaman Video Demo & SOP Unggah YouTube (LOGICODIX 2026)

**Nama Proyek:** ReplyForge (Autonomous Multi-Channel AI Agent for E-Commerce UMKM)  
**Kompetisi:** LOGICODIX 2026 (Subtema 3: *Local MSME & Creative Economy*)  
**Paket Aplikasi:** `id.replyforge.agent` (Android Native APK + Local Web Seller Center)  
**Perangkat Keras Perekaman:** Infinix Note 40 (`Infinix X6853`, Android 14 / XOS, 1080x2436 px @ 480 dpi)  
**Durasi Target Video:** 3 menit 45 detik (Rentang Wajib Guidebook Hal. 19: 3:00 s.d. 5:00 menit)  
**Dokumen Pasangan:** `docs/video-demo-script.md` (Naskah & Storyboard Shot-by-Shot)

---

## Daftar Isi

1. [Aturan Kepatuhan Utama Guidebook Hal. 19 s.d. 20](#1-aturan-kepatuhan-utama-guidebook-hal-19-sd-20)
2. [Persiapan Perangkat Pra-Perekaman (Pre-Recording Device Setup)](#2-persiapan-perangkat-pra-perekaman-pre-recording-device-setup)
3. [Standar Perekaman Audio & Voice-Over (Audio & Voice-Over Recording)](#3-standar-perekaman-audio--voice-over-audio--voice-over-recording)
4. [Standar Pascaproduksi & Penyuntingan (Post-Production & Editing)](#4-standar-pascaproduksi--penyuntingan-post-production--editing)
5. [SOP Pengunggahan & Konfigurasi YouTube (YouTube Upload SOP)](#5-sop-pengunggahan--konfigurasi-youtube-youtube-upload-sop)
6. [Daftar Periksa Verifikasi Akhir Sebelum Submit Portal](#6-daftar-periksa-verifikasi-akhir-sebelum-submit-portal)

---

## 1. Aturan Kepatuhan Utama Guidebook Hal. 19 s.d. 20

Sebelum memulai produksi video demonstrasi ReplyForge, tim wajib mematuhi lima batasan mutlak sesuai regulasi Guidebook LOGICODIX 2026 Halaman 19 sampai 20:

1. **100% Rekaman Aplikasi Nyata (Dilarang Mockup):** Seluruh visual wajib direkam langsung dari aplikasi native `id.replyforge.agent` yang berjalan di ponsel fisik **Infinix X6853** serta **Local Web Seller Center (`http://localhost:5173`)**. Dilarang keras menampilkan prototipe Figma, desain statis Canva/PowerPoint, atau animasi antarmuka palsu.
2. **Kemandirian On-Device (Zero-Tethering):** Perekaman layar ponsel wajib dilakukan menggunakan perekam layar internal bawaan XOS (*Built-in Screen Recorder*) dengan kondisi kabel USB dilepas setelah tahap kalibrasi awal selesai, membuktikan bahwa SQLite (`replyforge.db`), `ReplyForgeForegroundService`, dan `ReplyForgeNotificationService` berjalan mandiri di perangkat.
3. **Batas Durasi Presisi (3:00 s.d. 5:00 Menit):** Durasi total video yang diunggah ke YouTube tidak boleh kurang dari 3 menit 00 detik dan tidak boleh melebihi 5 menit 00 detik. Target produksi dikunci pada **3 menit 45 detik (225 detik)**.
4. **Kejelasan Visual & Indikator Sentuhan:** Resolusi perekaman wajib tajam (`1080x2436` pada `60fps`) dengan fitur **Tampilkan Ketukan (*Show Touches*)** menyala agar dewan juri dapat melihat setiap interaksi jari secara transparan.
5. **Aksesibilitas Tautan YouTube Tanpa Hambatan:** Video wajib diunggah ke YouTube dengan visibilitas **Unlisted** (Tidak Publik) atau **Public** (Publik), bebas dari pembatasan usia (*age restriction*), dan tidak menuntut dewan juri untuk masuk akun (*login*) saat membuka tautan.

---

## 2. Persiapan Perangkat Pra-Perekaman (Pre-Recording Device Setup)

Tahap ini memastikan ponsel **Infinix X6853** berada dalam kondisi visual yang bersih, responsif, dan bebas dari gangguan notifikasi pribadi selama pengambilan gambar.

### 2.1 Spesifikasi Perekam Layar Infinix X6853

Atur perekam layar bawaan sistem operasi Android 14 (XOS Screen Recorder) dengan parameter berikut:

| Parameter Perekaman | Nilai Konfigurasi Wajib | Tujuan Teknis |
|---|---|---|
| **Perangkat Target** | Infinix Note 40 (`Infinix X6853`) | Perangkat produksi yang telah terverifikasi pada audit visual 70 titik. |
| **Resolusi Video** | **1080 x 2436 piksel (FHD+ Native)** | Menjamin teks katalog, lencana status pesanan, dan log `SelfTestActivity` terbaca tajam tanpa efek kabur. |
| **Frame Rate** | **60 fps (Frames Per Second)** | Memastikan transisi antar-tab Material 3, guliran daftar chat, dan kemunculan notifikasi terlihat mulus. |
| **Bitrate Video** | **16 Mbps (Kualitas Tinggi / High)** | Mencegah artefak kompresi blok (*macroblocking*) pada latar belakang warna terang (*Warm Ivory*). |
| **Sumber Suara Layar** | **Suara Perangkat (Internal Audio) / Mute Mic HP** | Mencegah masuknya derau napas atau gema ruangan ke trek video mentah; narasi direkam terpisah melalui mikrofon utama. |
| **Mode Jangan Ganggu (DND)** | **Aktif (ON)** dengan pengecualian notifikasi uji | Mencegah panggilan telepon acak, pop-up promosi aplikasi lain, atau alarm mengganggu pengambilan gambar. |
| **Tampilkan Ketukan (Show Touches)** | **Aktif (ON / `1`) di Opsi Pengembang** | Menampilkan titik visual putih setiap kali layar disentuh sebagai bukti interaksi nyata di perangkat fisik. |
| **Skala Font (Font Scale)** | **1.0 (Default Standar)** | Menjaga proporsi tipografi standar selama demonstrasi alur utama (audit skala `1.3` telah dibuktikan pada `.omo/VISUAL_AUDIT.md`). |
| **Kecerahan Layar & Kunci Otomatis** | Kecerahan 80%, Waktu tunggu layar 10 menit | Mencegah layar meredup sendiri di tengah adegan penjelasan aplikasi. |

### 2.2 Kebersihan Status Bar & Isolasi Notifikasi

1. **Pembersihan Notifikasi Sampah:** Sapu bersih seluruh notifikasi lama di panel status bar sebelum merekam. Hanya notifikasi persisten **`ReplyForge Active (Autopilot 24/7)`** dari `ReplyForgeForegroundService` yang boleh tampil di bilah status awal.
2. **Kesiapan Baterai & Jaringan:** Pastikan baterai ponsel berada di atas **80%** (tanpa mode penghemat baterai ekstrem yang membatasi layar 60fps). Gunakan jaringan Wi-Fi atau seluler yang stabil untuk adegan WhatsApp Business (0:30 s.d. 2:40), dan siapkan tombol cepat *Mode Pesawat* di panel kontrol untuk adegan *Offline Quick Command* (2:40 s.d. 3:15).
3. **Reset Data Awal Demo Toko Stickeria:** Pastikan database SQLite lokal (`/data/data/id.replyforge.agent/databases/replyforge.db`) berada pada kondisi awal skenario uji:
   - Nama Toko: **Stickeria** (Rekening tujuan: **SeaBank `901483182051`** a.n. Stickeria Official).
   - Produk Utama: **`STK-CAT-01`** (*Stiker Kucing Lucu Pack*), Harga Jual **Rp15.000**, HPP **Rp9.000**, Stok Awal tepat **50 pcs**.
   - Kontak Pribadi Terdaftar di Filter Privasi: Nomor keluarga/pribadi sudah dimasukkan ke daftar blokir otomatis (`com.whatsapp` terisolasi dari `com.whatsapp.w4b`).

### 2.3 Perintah Kalibrasi Cepat via ADB (Sebelum Kabel Dilepas)

Hubungkan Infinix X6853 ke laptop sejenak untuk menyetel parameter layar secara presisi, lalu **cabut kabel USB** sebelum menekan tombol rekam:

```powershell
# 1. Pastikan skala font berada tepat di 1.0 dan kepadatan layar 480 dpi
adb shell settings put system font_scale 1.0
adb shell wm density 480

# 2. Aktifkan indikator sentuhan visual (Show Touches) di Developer Options
adb shell settings put system show_touches 1
adb shell settings put system pointer_location 0

# 3. Panjangkan batas waktu mati layar otomatis ke 10 menit (600.000 ms) selama sesi persiapan
adb shell settings put system screen_off_timeout 600000

# 4. Pastikan izin NotificationListenerService dan ForegroundService aktif penuh
adb shell cmd notification allow_listener id.replyforge.agent/id.replyforge.agent.ReplyForgeNotificationService
adb shell pm grant id.replyforge.agent android.permission.POST_NOTIFICATIONS

# 5. Verifikasi nilai pengaturan sebelum mencabut kabel USB
adb shell settings get system font_scale
adb shell settings get system show_touches
```

> **Catatan Penting Pasca-Perekaman:** Setelah seluruh pengambilan video selesai, kembalikan `show_touches` ke `0` dengan perintah `adb shell settings put system show_touches 0`.

---

## 3. Standar Perekaman Audio & Voice-Over (Audio & Voice-Over Recording)

Kualitas audio yang jernih membantu dewan juri menangkap setiap argumen teknis dan nilai bisnis ReplyForge tanpa kelelahan mendengar.

### 3.1 Pengaturan Mikrofon & Lingkungan Rekaman

1. **Perangkat Mikrofon:** Gunakan mikrofon kondensor USB atau mikrofon *lavalier* terarah (*cardioid*) yang dipasang pada jarak **15 s.d. 20 cm** dari mulut pembicara dengan kemiringan sekitar 30 derajat untuk menghindari letupan udara pada huruf *P*, *B*, dan *T* (*plosives*).
2. **Format Tangkap Audio:** Rekam pada laju sampel **48.000 Hz (48 kHz)**, kedalaman **24-bit**, saluran Mono/Stereo dalam format tak terkompresi (`.wav`) menggunakan perangkat lunak perekam seperti Audacity, OBS Studio, atau Adobe Audition.
3. **Peredaman Kebisingan Ruangan (Ambient Noise Suppression):**
   - Matikan kipas angin, pendingin ruangan yang bising, dan notifikasi perangkat lain di ruangan saat merekam suara.
   - Pastikan ambang derau latar (*noise floor*) berada di bawah **-50 dB** saat pembicara diam.
   - Terapkan filter potong frekuensi rendah (*High-Pass Filter*) pada **80 Hz** untuk menghilangkan dengung listrik, serta gunakan *Noise Reduction* ringan (maksimal pengurangan 6 dB) agar warna suara manusia tetap terdengar alami dan tidak terdengar seperti robot.

### 3.2 Tempo Bicara & Keseimbangan Volume (Audio Mixing Levels)

| Elemen Audio | Target Level Volume (dB / LUFS) | Panduan Eksekusi Produksi |
|---|---|---|
| **Suara Narator (Voice-Over Utama)** | Peak: **-6 dB s.d. -3 dB** (Rata-rata: **-14 LUFS**) | Suara vokal harus menjadi elemen paling dominan, bulat, dan jernih di sepanjang 3 menit 45 detik. |
| **Musik Latar (Background Music)** | **-24 dB s.d. -28 dB** (Sangat Halus / Subtle) | Gunakan musik instrumental bebas royalti (*lo-fi corporate* atau akustik lembut tanpa vokal). Musik hanya berfungsi mengisi ruang hening dan tidak boleh menutupi artikulasi kata teknis. |
| **Efek Suara Notifikasi Sistem** | **-16 dB s.d. -12 dB** | Suara denting notifikasi pesan masuk WhatsApp Business diperbolehkan terdengar tipis sebagai penanda waktu nyata (*real-time cue*). |
| **Tempo Penyampaian (Pacing)** | **145 s.d. 155 kata per menit (WPM)** | Bacakan naskah (~580 kata pada `docs/video-demo-script.md`) dengan intonasi tegas, tenang, dan artikulasi jelas untuk istilah teknis seperti *NotificationListenerService*, *RemoteInput*, *SQLite*, dan *HPP Guard*. |

---

## 4. Standar Pascaproduksi & Penyuntingan (Post-Production & Editing)

Penyuntingan video bertujuan menyajikan alur demonstrasi yang padat dan mudah diikuti tanpa mengurangi keaslian kerja sistem operasi Android maupun aplikasi ReplyForge.

### 4.1 Aturan Pemotongan Video (Trimming Tanpa Manipulasi Proses)

1. **Dilarang Memotong Proses Kerja Inti Aplikasi:**
   - **Jangan memotong** jeda waktu antara masuknya notifikasi WhatsApp Business hingga keluarnya balasan otomatis `< 800 ms` melalui `RemoteInput` (Adegan 0:30 s.d. 1:15). Biarkan juri melihat kecepatan respon asli secara utuh.
   - **Jangan memotong** momen perubahan angka stok produk `STK-CAT-01` dari **50 pcs menjadi 49 pcs** setelah pesanan tercatat (Adegan 1:15 s.d. 1:55).
   - **Jangan memotong** proses eksekusi baris perintah `tambah 10 STK-CAT-01` di tab Stok saat *Mode Pesawat* aktif hingga stok bertambah instan (Adegan 2:40 s.d. 3:15).
   - **Jangan memotong** proses berjalan tombol **Jalankan Self-Test** pada `SelfTestActivity` hingga muncul lencana hijau **`SELF-TEST: 8/8 PASS`** dan **`ERROR_STATE: PASS`** (Adegan 3:15 s.d. 3:35).
2. **Pemangkasan Jeda Kosong yang Diizinkan (Dead Pause Trimming):**
   - Pemotongan hanya boleh dilakukan pada jeda transisi antar-skenario (misalnya waktu saat operator berpindah dari adegan *Chat Detail* menuju menu *Pengaturan*), selama tidak ada rekayasa hasil atau pemalsuan status data.
3. **Tata Letak Kanvas Video (16:9 Landscape Canvas):**
   - Karena layar Infinix X6853 berbentuk vertikal (`1080x2436`, rasio 9:20.3), tempatkan tangkapan layar ponsel secara utuh di sisi tengah atau kanan-tengah kanvas video **1920x1080 (16:9 Full HD)** tanpa memotong status bar atas maupun bilah navigasi bawah ponsel.
   - Gunakan ruang samping kanvas 16:9 untuk menampilkan poin ringkas indikator pengujian yang sedang berlangsung (misalnya: *Skenario 4: Deteksi Scam File .APK & Isolasi WA Pribadi*) atau tampilan pendamping **Local Web Seller Center (`localhost:5173`)**.

### 4.2 Penempatan Takarir & Label Penjelas (Subtitle & Callout Placement)

1. **Zona Aman Takarir (Safe Zone):**
   - Tempatkan teks takarir (*closed captions* / *burned-in subtitles*) Bahasa Indonesia di bagian bawah kanvas dengan margin bawah minimal **80 piksel** dari tepi layar 1080p.
   - Pastikan kotak takarir **tidak menutupi** bilah navigasi bawah (`BottomNavigationView` tab Chat, Stok, Pesanan, Pengaturan) maupun kolom input `Quick Command` pada layar ponsel.
2. **Gaya Tipografi Takarir:**
   - Jenis huruf: Sans-serif bersih (*Inter*, *Plus Jakarta Sans*, atau *Roboto Medium*).
   - Warna teks: Putih (`#FFFFFF`) di atas latar kotak semi-transparan gelap (`#0F172A` dengan opasitas 80%) agar memenuhi kontras keterbacaan tinggi di segala latar.
3. **Sorotan Visual (Visual Callouts):**
   - Berikan bingkai sorot (*bounding box* warna Amber `#D97706`) selama 2 detik saat informasi krusial muncul di layar:
     - Lencana peringatan merah/kuning: **`Perlu Ditinjau Manual`** pada chat pengirim berkas `Resi_JNT_Kurir.apk`.
     - Perubahan angka stok: **`Stok: 50 -> 49`** dan **`Stok: 49 -> 59`** (`tambah 10 STK-CAT-01`).
     - Hasil verifikasi mandiri: **`SELF-TEST: 8/8 PASS`** dan **`ERROR_STATE: PASS`**.

### 4.3 Parameter Ekspor Video Final

- **Format Kontainer:** `.mp4` (MPEG-4 Part 14)
- **Codec Video:** H.264 (High Profile, Level 4.2), Progressive Scan
- **Resolusi & Frame Rate:** `1920 x 1080` piksel (1080p Full HD) @ **60 fps**
- **Codec Audio:** AAC-LC, 320 kbps, 48 kHz Stereo
- **Durasi Berkas Final:** Tepat di rentang **03:40 s.d. 03:50** (Target ideal: **03:45**)

---

## 5. SOP Pengunggahan & Konfigurasi YouTube (YouTube Upload SOP)

Sesuai ketentuan Guidebook LOGICODIX 2026 Halaman 19 sampai 20, kesalahan pengaturan privasi video di YouTube dapat menyebabkan dewan juri gagal menilai karya dan memicu diskualifikasi administratif. Ikuti prosedur baku di bawah ini saat mengunggah berkas `.mp4` ke YouTube Studio.

### 5.1 Format Judul Video Resmi

Salin dan tempel judul berikut secara persis pada kolom **Judul (Title)** di YouTube Studio:

```text
[LOGICODIX 2026] ReplyForge - Autonomous Multi-Channel AI Agent for UMKM (Demo Video)
```

### 5.2 Pengaturan Visibilitas & Batasan Akses (Wajib Dipatuhi)

| Pengaturan YouTube Studio | Nilai yang Wajib Dipilih | Hal yang Dilarang Keras (Blocker Diskualifikasi) |
|---|---|---|
| **Visibilitas (Visibility)** | **Unlisted (Tidak Publik)** atau **Public (Publik)** | **DILARANG memilih Private (Pribadi)**. Video *Private* tidak bisa dibuka oleh dewan juri meskipun tautannya dibagikan. |
| **Penonton (Audience / Made for Kids)** | **Tidak, video ini tidak dibuat untuk anak-anak** | Memilih "Ya, dibuat untuk anak-anak" akan mematikan fitur pemutaran mini dan komentar teknis. |
| **Pembatasan Usia (Age Restriction)** | **Tidak, jangan batasi video saya untuk penonton berusia 18 tahun ke atas** | **DILARANG mengaktifkan pembatasan usia 18+**, karena pembatasan usia memaksa juri untuk *login* akun Google dan melakukan verifikasi identitas. |
| **Jadwal Tayang Perdana (Premiere / Schedule)** | **Jangan diaktifkan (Terbitkan Langsung)** | **DILARANG menjadwalkan tayang perdana (*Premiere*)** yang menahan pemutaran video dengan hitung mundur. |
| **Sematkan Video (Allow Embedding)** | **Aktif (Centang Izinkan Penyematan)** | Mematikan fitur *embedding* dapat membuat video gagal diputar di dalam portal penjurian internal panitia. |

### 5.3 Templat Deskripsi Video YouTube (Siap Salin)

Salin templat di bawah ini ke kolom **Deskripsi (Description)** di YouTube Studio. Daftar waktu (*Timestamps*) yang diawali dari `0:00` akan otomatis mengaktifkan fitur *YouTube Chapters* untuk memudahkan dewan juri melompat ke bagian penilaian tertentu:

```text
[LOGICODIX 2026] ReplyForge - Autonomous Multi-Channel AI Agent for UMKM (Demo Video)

ReplyForge adalah agen kecerdasan buatan otonom berbasis Android Native (local-first on-device AI agent) yang dirancang untuk membantu pelaku UMKM e-commerce Indonesia menangani chat pelanggan 24/7 di WhatsApp Business dan Shopee Seller, mencatat pesanan secara otomatis, menyinkronkan stok gudang di SQLite lokal, serta menangkal penipuan berkas berbahaya (.apk) tanpa ketergantungan pada server cloud eksternal maupun biaya langganan API bulanan.

INFORMASI KOMPETISI & KATEGORI:
- Kompetisi: LOGICODIX 2026
- Subtema: Subtema 3 (Local MSME & Creative Economy)
- Kategori: Mobile Application & AI Agent (Mobile Native with Local Web Dashboard)
- Identitas Paket Android: id.replyforge.agent
- Perangkat Pengujian Fisik: Infinix Note 40 (Infinix X6853, Android 14, 1080x2436 px)

TIM PENGEMBANG (TEAM REPLYFORGE):
1. Ferdinand Manurung (@royaldinan) : Team Lead & Mobile Agent Core Architect
2. Abyan Nur Zaky (@anzuky1) : AI Engine & Security Specialist
3. Farrel Basayev (@FarrelBasayev) : Frontend & Web Dashboard Engineer
4. Alex (@Alex1a67) : QA, Testing & System Documentation Engineer

TAUTAN REPOSITORI KODE SUMBER (PUBLIC GITHUB):
https://github.com/royaldinan/replyforge

URUTAN BAB DEMONSTRASI (TIMESTAMPS):
0:00 Identitas Aplikasi & Latar Belakang Masalah UMKM Stickeria
0:30 Alur Autopilot WhatsApp Business (Intersepsi Notifikasi & Balasan <800ms)
1:15 Pembuktian Autonomous Order & Sinkronisasi Stok SQLite (50 menjadi 49)
1:55 AI Safety & Anomaly Defense (Deteksi Scam File .APK & Isolasi WA Pribadi)
2:40 Fitur Offline Quick Command Gudang Tanpa Internet (tambah 10 STK-CAT-01)
3:15 Verifikasi In-App Self-Test Engine (8/8 PASS & ERROR_STATE: PASS)
3:35 Ringkasan Dampak Solusi bagi Kemandirian UMKM Lokal

FITUR INTI YANG DIDEMONSTRASIKAN:
- Zero-Tethered Standalone Execution via ReplyForgeForegroundService & NotificationListenerService
- On-Device SQLite Persistence (replyforge.db) untuk Katalog, Pesanan, dan Riwayat Chat
- HPP Margin Guard (Penjaga Batas Harga Pokok Penjualan Deterministik)
- Anti-APK Malware Classifier (Menjeda AI & Menandai "Perlu Ditinjau Manual")
- Client-Side OTP Shield & Isolasi Permanen WhatsApp Pribadi (com.whatsapp)
- Offline Warehouse Quick Command Parser & Local Web Seller Center (localhost:5173)

#LOGICODIX2026 #ReplyForge #UMKMIndonesia #AndroidNative #AIAgent #LocalFirstAI
```

---

## 6. Daftar Periksa Verifikasi Akhir Sebelum Submit Portal

Sebelum menempelkan tautan YouTube ke formulir pengumpulan akhir LOGICODIX 2026, jalankan pemeriksaan 8 langkah berikut:

- [ ] **Uji Jendela Samaran (Incognito Browser Test):** Salin tautan YouTube (format `https://youtu.be/...` atau `https://www.youtube.com/watch?v=...`), buka jendela *Incognito / Private Window* pada peramban yang **tidak sedang login akun Google mana pun**, dan pastikan video langsung berputar tanpa halaman blokir login atau verifikasi usia.
- [ ] **Uji Kualitas Resolusi 1080p60:** Tunggu hingga pemrosesan HD di server YouTube selesai 100%, lalu klik ikon roda gigi pada pemutar YouTube dan pastikan opsi **1080p60 HD** sudah tersedia.
- [ ] **Uji Keterbacaan Bab (YouTube Chapters):** Pastikan bilah kemajuan (*progress bar*) video di YouTube telah terbagi menjadi 7 segmen bab sesuai daftar waktu (`0:00` hingga `3:35`).
- [ ] **Verifikasi Durasi Total:** Pastikan angka durasi total pada pemutar YouTube berada di antara **03:00 dan 05:00** (target **03:45**).
- [ ] **Verifikasi Kejelasan Audio & Musik Latar:** Putar video menggunakan pengeras suara laptop standar dan *earphone*; pastikan suara narator terdengar jelas di setiap bagian dan musik latar (`-24 dB`) tidak menenggelamkan penjelasan teknis.
- [ ] **Verifikasi Ketiadaan Mockup:** Pastikan dari detik `0:00` hingga `3:45` hanya menampilkan rekaman layar nyata dari Infinix X6853 dan Local Web Seller Center tanpa satu pun slide Figma atau animasi rekayasa.
- [ ] **Verifikasi Indikator Sentuhan (Show Touches):** Pastikan titik sentuhan layar terlihat saat pengguna menekan tab navigasi, mengetik `tambah 10 STK-CAT-01`, dan menekan tombol **Jalankan Self-Test**.
- [ ] **Verifikasi Keamanan Data Pribadi:** Pastikan tidak ada nomor telepon pribadi anggota tim atau kunci API rahasia yang terekspos secara tidak sengaja pada rekaman layar maupun teks deskripsi YouTube.
