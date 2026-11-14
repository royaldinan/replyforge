# ReplyForge - Autonomous Multi-Channel AI Agent for E-Commerce UMKM

**Sub-Theme:** Subtema 3 - *Local MSME & Creative Economy* (LOGICODIX 2026)  
**Category:** Mobile Application & AI Agent (Pilihan: Mobile/Web -> Mobile Native with Local Web Dashboard)  
**Application Package:** `id.replyforge.agent` (Android Native APK + Local Web Seller Center)  
**Target Hardware Verified:** Infinix Note 40 (`Infinix_X6853`, Android 14 / XOS, 1080x2436 px @ 480 dpi)

---

## Daftar Isi (Table of Contents)

1. [Identitas Tim & Atribusi Institusi (Team Identity)](#1-identitas-tim--atribusi-institusi-team-identity)
2. [Kategori Kompetisi (Category)](#2-kategori-kompetisi-category)
3. [Nama Aplikasi & Ringkasan Eksekutif (Application Name)](#3-nama-aplikasi--ringkasan-eksekutif-application-name)
4. [Deskripsi Solusi & Kebaruan Teknis (Solution Description & Novelty)](#4-deskripsi-solusi--kebaruan-teknis-solution-description--novelty)
5. [Latar Belakang Masalah (Problem Background)](#5-latar-belakang-masalah-problem-background)
6. [Target Pengguna & Studi Kasus Nyata (Target Users)](#6-target-pengguna--studi-kasus-nyata-target-users)
7. [Fitur yang Diimplementasikan (Implemented Features)](#7-fitur-yang-diimplementasikan-implemented-features)
8. [Arsitektur Teknis & Aliran Data (Technical Architecture)](#8-arsitektur-teknis--aliran-data-technical-architecture)
9. [Panduan Instalasi, Konfigurasi, & Localhost Run (Installation & Run Guide)](#9-panduan-instalasi-konfigurasi--localhost-run-installation--run-guide)
10. [Spesifikasi Perangkat, Batasan Sistem, Transparansi AI, & Peta Jalan (Specs, Limitations, & Roadmap)](#10-spesifikasi-perangkat-batasan-sistem-transparansi-ai--peta-jalan-specs-limitations--roadmap)

---

## 1. Identitas Tim & Atribusi Institusi (Team Identity)

- **Nama Tim:** Team ReplyForge
- **Kompetisi:** LOGICODIX 2026 (Babak Grand Final)
- **Subtema:** Subtema 3 - *Local MSME & Creative Economy*
- **Atribusi Institusi:** Tim Pengembang Mahasiswa Indonesia untuk Digitalisasi UMKM Kreatif Lokal (Studi Kasus Mitra: **Toko Stickeria**, Bandung, Jawa Barat)

### Susunan Anggota Tim & Pembagian Peran

| No | Nama Lengkap | GitHub Handle | Peran Utama (Role) | Tanggung Jawab Teknis & Modul |
|---|---|---|---|---|
| 1 | **Ferdinand Manurung** | [`@royaldinan`](https://github.com/royaldinan) | **Lead Mobile Architect** | Arsitektur Android Native (`id.replyforge.agent`), siklus hidup `ReplyForgeForegroundService`, intersepsi `ReplyForgeNotificationService`, persistensi SQLite (`ReplyForgeDb.java`), dan pemulihan pasca-boot (`BootCompletedReceiver.java`). |
| 2 | **Abyan Nur Zaky** | [`@anzuky1`](https://github.com/anzuky1) | **AI/Backend Engineer** | Mesin inferensi hibrida (`ReplyForgeAiEngine.java`), normalisasi bahasa santai/slang olshop, penjaga batas modal (HPP Guard), deteksi anomali scam `.apk`, perisai OTP lokal, dan server API sinkronisasi (`server/src/`). |
| 3 | **Farrel Basayev** | [`@FarrelBasayev`](https://github.com/FarrelBasayev) | **Frontend/UI Engineer** | Desain antarmuka Android Material 3 (`res/layout/`, palet warna token WCAG AA), komponen `Quick Command` gudang, serta aplikasi **Local Web Seller Center** berbasis React 18, TypeScript, Vite, dan TailwindCSS (`web/src/`). |
| 4 | **Alex** | [`@Alex1a67`](https://github.com/Alex1a67) | **QA/Documentation Engineer** | Mesin pengujian mandiri di dalam aplikasi (`SelfTestActivity.java` dengan 8 skenario inti + `ERROR_STATE`), matriks audit visual 70 titik pada skala font `1.0` dan `1.3`, skenario uji manual Excel (`docs/manual-test-stickeria.xlsx`), dan dokumentasi teknis. |

---

## 2. Kategori Kompetisi (Category)

- **Kategori Utama:** Mobile Application & AI Agent
- **Jalur Implementasi (Pilihan):** Mobile/Web -> **Mobile Native with Local Web Dashboard**
- **Alasan Pemilihan Arsitektur:**  
  Penjual UMKM mikro di Indonesia menghabiskan sebagian besar jam operasionalnya menggunakan satu ponsel Android tanpa menyalakan laptop sepanjang hari. Oleh karena itu, inti agen otonom ReplyForge dibangun sebagai **Aplikasi Android Native murni (Java SDK)** yang berjalan mandiri 24/7 di perangkat fisik, dilengkapi dengan **Local Web Seller Center (`http://localhost:5173`)** berbasis React dan Vite untuk pemantauan layar lebar, pengelolaan katalog & aturan, buku pesanan, serta telemetri privasi saat pemilik toko berada di meja kerja. Web ini adalah kembaran 1:1 tampilan APK: alamat default menampilkan mode mobile, sedangkan dashboard desktop dibuka melalui `http://localhost:5173/?view=studio`.

---

## 3. Nama Aplikasi & Ringkasan Eksekutif (Application Name)

### **ReplyForge - Autonomous Multi-Channel AI Agent for E-Commerce UMKM**

**ReplyForge** adalah agen kecerdasan buatan lokal (*local-first on-device AI agent*) yang bekerja langsung di dalam sistem operasi Android untuk mengotomasi layanan pelanggan, pencatatan pesanan, pemotongan stok gudang, dan perlindungan keamanan siber bagi pelaku UMKM e-commerce di **WhatsApp Business** dan **Shopee Seller**.

Berbeda dengan chatbot konvensional yang mewajibkan biaya langganan bulanan WhatsApp Business API (WABA) dan server cloud berbayar, ReplyForge menangkap notifikasi masuk secara langsung di tingkat sistem operasi Android melalui `NotificationListenerService` dan mengirimkan balasan instan WhatsApp Business kurang dari 800 milidetik melalui mekanisme `RemoteInput` bawaan Android. Khusus Shopee Seller yang tidak menyediakan aksi `RemoteInput`, ReplyForge menyiapkan draf balasan (Smart Copilot) yang dikirim penjual dengan satu ketukan. Seluruh proses tetap berjalan meskipun layar ponsel dalam keadaan mati dan terkunci, tanpa ketergantungan pada koneksi ADB atau komputer eksternal.

---

## 4. Deskripsi Solusi & Kebaruan Teknis (Solution Description & Novelty)

ReplyForge menghadirkan pendekatan **Local-First On-Device Commerce Agent** yang memadukan kecerdasan bahasa alami dengan kepastian aturan kode deterministik:

1. **Operasi 24/7 Mandiri di Perangkat (Zero-Tethered Standalone Execution):**  
   Agen berjalan di latar belakang melalui `ReplyForgeForegroundService` bertipe `dataSync` yang menjaga proses tetap hidup, sementara `ReplyForgeNotificationService` mengambil `PARTIAL_WAKE_LOCK` selama 30 detik pada setiap pemrosesan pesan. Saat layar ponsel mati atau aplikasi ditutup dari daftar *recent apps*, agen tetap menangkap chat pembeli, menghitung stok, dan membalas pesan secara otomatis.
2. **Persistensi SQLite Lokal Tanpa Server Cloud Eksternal (`replyforge.db`):**  
   Seluruh katalog produk, riwayat percakapan lintas kanal, transaksi pesanan, hingga log audit tersimpan di dalam database SQLite internal perangkat (`/data/data/id.replyforge.agent/databases/replyforge.db`). Penjual memegang kendali penuh atas data tokonya tanpa biaya sewa database cloud.
3. **Pemesanan Percakapan WhatsApp (WhatsApp Conversational Ordering):**  
   Pembeli dapat bertanya stok, menawar harga, dan langsung memesan di chat WhatsApp Business menggunakan bahasa sehari-hari (contoh: *"Kak, pesan stiker kucing 1 pack ya"*). ReplyForge mengenali maksud pembelian, memeriksa batas Harga Pokok Penjualan (HPP), membuat catatan pesanan lokal, dan memotong stok secara atomik.
4. **Kualifikasi Prospek Shopee Seller (Shopee Smart Copilot):**  
   Menangkap pertanyaan pra-pembelian dari aplikasi Shopee Seller (termasuk mengekstrak pesan yang digabung dalam *Grouped Notification Summary* Android), memfilter notifikasi promosi sistem Shopee, lalu menyusun **draf balasan** berisi ketersediaan stok dan arahan checkout melalui keranjang Shopee. Karena Shopee Seller tidak menyediakan `RemoteInput`, penjual mengirim draf lewat tombol **Buka & Balas di Shopee**; agen tidak membuat pesanan lokal maupun menyebut rekening transfer untuk kanal Shopee.
5. **Perisai Malware APK & Isolasi Privasi Proaktif (Proactive APK Malware & Privacy Shield):**  
   Melindungi penjual dari penipuan berkas `.apk` berbahaya (modus kurir resi palsu atau undangan pernikahan) dan memblokir pengiriman kode OTP perbankan ke jaringan eksternal (0 byte terkirim ke cloud). Selain itu, paket WhatsApp pribadi (`com.whatsapp`) diisolasi secara permanen di tingkat kode sehingga percakapan keluarga atau nomor pribadi tidak pernah terbaca oleh agen toko.

---

## 5. Latar Belakang Masalah (Problem Background)

Pelaku usaha mikro dan kreator produk lokal di Indonesia menghadapi empat hambatan operasional kritis setiap hari:

1. **Kehilangan Penjualan Akibat Respon Lambat di Malam Hari (Loss of Sales Due to Slow Evening Response):**  
   Pembeli e-commerce sering berbelanja pada pukul 20.00 hingga 01.00 dini hari. Ketika penjual sedang beristirahat atau mengemas paket di gudang dan terlambat membalas chat tanya stok lebih dari 15 menit, calon pembeli langsung berpindah ke toko kompetitor.
2. **Kelelahan Admin & Selisih Stok Lintas Kanal (Admin Fatigue & Stock Overselling):**  
   Menjawab pertanyaan berulang (*"Stok masih ada?"*, *"Bisa kurang nggak?"*, *"Kirim hari ini jam berapa?"*) di WhatsApp Business dan Shopee secara bersamaan menguras tenaga penjual. Pencatatan pesanan manual menyebabkan stok di gudang tidak sinkron, memicu pembatalan pesanan dan penalti poin toko.
3. **Jebakan Penipuan Berkas APK Berbahaya (APK Scam Traps Disguised as Invoice/Resi Files):**  
   Penipu sering menyamar sebagai pembeli atau kurir ekspedisi yang mengirimkan file berbahaya seperti `Resi_Pengiriman_JNT.apk` atau `Bukti_Transfer_Lunas.apk`. Penjual yang sedang terburu-buru rentan menekan file tersebut atau terjebak rekayasa sosial yang menguras saldo rekening toko.
4. **Pencemaran Kontak Antara WhatsApp Pribadi dan Bisnis (Contact Pollution Between Personal and Business WhatsApp):**  
   Banyak pelaku UMKM menggunakan satu ponsel untuk urusan keluarga dan toko. Alat auto-reply biasa sering salah membalas pesan pribadi dari keluarga atau membocorkan nomor telepon pribadi pemilik toko ke ruang publik.

---

## 6. Target Pengguna & Studi Kasus Nyata (Target Users)

ReplyForge dirancang khusus untuk **pedagang mikro (micro-merchants), pengusaha solo (solo-entrepreneurs), dan perajin produk kreatif lokal** yang mengelola produksi sekaligus layanan pelanggan seorang diri.

### Profil Studi Kasus Mitra: Toko Stickeria (Bandung)

| Parameter Profil Toko | Detail Implementasi & Data Uji |
|---|---|
| **Nama Usaha UMKM** | **Toko Stickeria** |
| **Lokasi Operasional** | Bandung, Jawa Barat |
| **Bidang Usaha** | Produksi stiker die-cut vinyl tahan air, gantungan kunci akrilik, dan merchandise ilustrasi orisinal |
| **Pemilik Usaha** | Ferdinand Manurung |
| **Rekening Pembayaran Resmi** | **SeaBank `901483182051`** a.n. Ferdinand Manurung |
| **Jam Batas Pengiriman (Cutoff)** | Pukul **16.00 WIB** (pesanan lunas sebelum jam 16.00 dikirim di hari yang sama) |
| **Produk Unggulan (Flagship SKU)** | `STK-CAT-01` - **Paket Stiker Kucing Gemoy** (Harga Jual: **Rp15.000**, HPP/Modal: **Rp6.000**, Stok Awal: **50 pack**, Kapasitas: **100 pack**, Batas order normal: **15 pack**) |
| **Katalog Produk Tambahan** | Katalog seed final hanya memuat satu SKU aktif (`STK-CAT-01`). Produk lain dapat ditambahkan melalui Quick Command `tambah produk ...` atau impor katalog CSV/XLSX. |

---

## 7. Fitur yang Diimplementasikan (Implemented Features)

Seluruh fitur di bawah ini telah berjalan penuh pada kode sumber produksi dan diverifikasi di perangkat fisik:

### 1. WhatsApp Autopilot & Conversational Commerce
- Menangkap notifikasi pesan masuk dari **WhatsApp Business (`com.whatsapp.w4b`)** secara real-time melalui `ReplyForgeNotificationService`.
- Menjalankan normalisasi kata singkatan bahasa Indonesia sehari-hari (`yg` -> `yang`, `brp` -> `berapa`, `krg` -> `kurang`, `gmn` -> `gimana`, `ready` -> `tersedia`) sebelum diproses oleh `ReplyForgeAiEngine`.
- Menjaga margin keuntungan toko dengan **HPP Guard**: jika pembeli menawar harga di bawah modal atau meminta diskon eceran untuk `STK-CAT-01`, agen menolak secara sopan dan menawarkan harga resmi Rp15.000/pack atau syarat pembelian grosir.
- Mengisolasi aplikasi **WhatsApp Pribadi (`com.whatsapp`)** secara ketat: setiap notifikasi dari paket non-bisnis langsung ditolak di pintu masuk tanpa disimpan ke database.

### 2. Shopee Pre-Sale Inquiry & Lead Management
- Mendeteksi paket aplikasi Shopee (`com.shopee.id` dan varian Shopee Seller regional) secara dinamis melalui `PackageManager`.
- Mengekstrak pesan individual dari dalam bundel **Grouped Notification Summary (`Notification.EXTRA_MESSAGES` / `MessagingStyle`)** sehingga ketika beberapa pembeli mengirim chat bersamaan di Shopee, masing-masing pembeli tetap dibuatkan utas percakapan (*thread*) terpisah.
- Menyaring notifikasi sistem atau iklan promosi Shopee (seperti *"Flash Sale 11.11 dimulai!"* atau *"Klaim voucher gratis ongkir"*) agar agen hanya memproses pesan manusia asli.
- Menyimpan chat Shopee sebagai **calon pembeli (Shopee Leads)** dan menyiapkan draf balasan. Penjual mengirim draf melalui tombol **`Buka & Balas di Shopee`** (salin ke clipboard + buka Shopee Seller), lalu memotong stok fisik dari tab **Transaksi** setelah lead dikonfirmasi.

### 3. Autonomous Local Order & Stock Decrement (`50 -> 49`, WhatsApp Business)
- Ketika pembeli mengirimkan pesan pemesanan langsung di WhatsApp Business (contoh: *"Kak saya mau beli Paket Stiker Kucing Gemoy 1 pack"*), agen secara otomatis:
  1. Mencocokkan nama produk dengan SKU `STK-CAT-01` di SQLite.
  2. Membuat entri pesanan baru di tabel `orders` dengan total harga terhitung pasti (`1 x Rp15.000 = Rp15.000`).
  3. **Memotong stok gudang secara instan dari `50` menjadi `49` pack** untuk mencegah *overselling*.
  4. Mengirimkan balasan konfirmasi pesanan beserta instruksi pembayaran ke rekening resmi **SeaBank `901483182051`**.
- Jika pesanan dibatalkan melalui kartu pesanan di layar detail chat, stok dikembalikan secara utuh (`49 -> 50`).
- Kanal Shopee **tidak** membuat pesanan lokal; pesanan Shopee tetap checkout di marketplace, dan stok dipotong setelah penjual mengonfirmasi lead di tab Transaksi.

### 4. Warehouse Quick Command (`tambah 10 STK-CAT-01`)
- Menyediakan baris perintah cepat (*Offline Quick Command Parser*) di tab **Stok & AI** untuk operasi gudang tanpa koneksi internet sama sekali.
- Mendukung sintaks deterministik instan:
  - Penambahan stok masuk: `tambah 10 STK-CAT-01` atau `+10 STK-CAT-01` atau `stok STK-CAT-01 10`
  - Pengurangan stok rusak/keluar: `kurang 5 STK-CAT-01` atau `-5 STK-CAT-01`
  - Pendaftaran produk baru: `tambah produk Stiker Bunga harga 12000 hpp 5000 stok 20 satuan pack`
- Dilengkapi pencocokan alias pintar dan pesan kesalahan eksplisit apabila kode SKU tidak ditemukan di dalam katalog.

### 5. AI Security Shield (Anomaly APK Detection & OTP Defense)
- **Deteksi Malware APK & Rekayasa Sosial:** Memindai pesan masuk terhadap pola ekstensi berbahaya (`.apk`), tautan pendek (`bit.ly`, `tinyurl`, `s.id`, dll.), dan upaya *prompt injection* (`ignore previous`, `system prompt`). Pesan berbahaya tidak dijawab dengan template belanja biasa, melainkan diblokir atau diberi penanda **`Perlu Ditinjau Manual (Needs Review)`** bila menyinggung pinjaman, transfer, rekening, atau undangan.
- **Kontrol Jeda & Lanjutkan AI (Honest AI Pause/Resume):** Apabila percakapan membutuhkan intervensi manusia, penjual dapat menjeda atau melanjutkan autopilot per utas melalui tombol **"Lanjutkan AI"** di layar detail percakapan.
- **Perisai Kode OTP Perbankan (Client-Side OTP Shield):** Setiap notifikasi atau pesan yang memuat pola kode rahasia (`OTP`, `kode verifikasi`, `jangan berikan kode`, `PIN`, `CVV`) langsung dicegat di perangkat lokal dan tidak pernah diteruskan ke API eksternal.

### 6. In-App Self-Test Engine (8 Core Cases + `ERROR_STATE`)
- Menyediakan halaman verifikasi mandiri di dalam aplikasi (`SelfTestActivity.java`) yang dapat dijalankan kapan saja melalui menu **Pengaturan -> Jalankan Self-Test** tanpa memerlukan kabel USB atau perintah ADB.
- Menguji 8 skenario inti ditambah 1 skenario ketahanan error secara langsung pada mesin produksi:
  1. `WA_BIZ_CHAT`: Balasan otomatis pertanyaan produk di WhatsApp Business.
  2. `WA_PERSONAL_BLOCKED`: Pemblokiran mutlak notifikasi dari WhatsApp pribadi (`com.whatsapp`).
  3. `SHOPEE_CHAT`: Pembuatan utas dan draf balasan pertanyaan pembeli dari Shopee Seller.
  4. `SHOPEE_PROMO`: Penolakan otomatis notifikasi promosi/iklan sistem Shopee.
  5. `SHOPEE_GROUP_SUMMARY`: Pemecahan notifikasi gabungan Shopee menjadi utas pembeli terpisah.
  6. `ANOMALY_APK`: Penandaan pesan mencurigakan (file `.apk` / tautan pendek / pinjaman) sebagai butuh tinjauan manual.
  7. `ORDER_DIRECT`: Pembuatan pesanan otomatis dan pemotongan stok langsung (`50 -> 49`).
  8. `AI_SCREEN_OFF`: Pemrosesan notifikasi dan balasan tetap berjalan saat layar mati/terkunci.
  9. `ERROR_STATE`: Ketahanan sistem terhadap input kosong, *null payload*, atau perintah SKU tidak valid tanpa *crash* maupun *Application Not Responding (ANR)*.
- Menjalankan pula rangkaian kasus `QuickCommandParser` (`tambah`, `kurang`, `stok`, `tambah produk`) sebagai verifikasi tambahan di luar 8 kasus inti.

### 7. Local Web Seller Center (`http://localhost:5173`)
- Dashboard manajemen berbasis web lokal yang dibangun dengan **React 18, TypeScript, Vite, dan TailwindCSS**.
- Alamat default (`/`) menampilkan **kembaran 1:1 aplikasi APK** (mode mobile/kiosk) dengan empat tab: Chat, Stok & AI, Transaksi, dan Sistem. Dashboard desktop dibuka melalui `?view=studio`.
- Dashboard desktop menyediakan empat panel: **Monitor Chat & Stok** (Live Inbox Monitor + Inventory Barometer), **Katalog & Aturan** (Store Studio + 6 preset balasan), **Buku Pesanan** (Order Ledger), dan **Keamanan & Efisiensi** (Green & Privacy Gateway), ditambah **Telemetry Pipeline 4-node**, **banner peringatan penjual**, **Auth Modal**, **wizard koneksi kanal**, dan **tutorial pemakaian**.

---

## 8. Arsitektur Teknis & Aliran Data (Technical Architecture)

### Diagram Arsitektur Aliran Data (ASCII Architecture Diagram)

```text
+-----------------------------------------------------------------------------------+
|                     EXTERNAL MESSAGING CHANNELS (ON ANDROID OS)                   |
|                                                                                   |
|   [WhatsApp Business]              [Shopee Seller App]       [Personal WhatsApp]  |
|    (com.whatsapp.w4b)               (com.shopee.id)            (com.whatsapp)     |
+------------+--------------------------------+-------------------------+-----------+
             |                                |                         |
             | StatusBarNotification          | MessagingStyle / Group  | Blocked!
             v                                v                         v
+-----------------------------------------------------------------------+-----------+
| 1. NotificationListenerService (ReplyForgeNotificationService.java)   | [DROPPED] |
|    - Package Whitelist Enforcement & Personal Contact Isolation       |  0 Bytes  |
|    - Shopee Promo Filter & Group Summary Unpacker                     |  Stored   |
|    - Partial WakeLock Acquisition (30,000 ms Screen-Off Guarantee)    +-----------+
+------------------------------------+----------------------------------------------+
                                     |
                                     | Keeps Process Alive 24/7 (START_STICKY)
                                     v
+-----------------------------------------------------------------------------------+
| 2. ForegroundService (ReplyForgeForegroundService.java + BootCompletedReceiver)   |
|    - Persistent Foreground Notification (foregroundServiceType="dataSync")        |
|    - Automatic Service Revival on Task Removal or Device Reboot                   |
+------------------------------------+----------------------------------------------+
                                     |
                                     | Read/Write Atomic Transactions
                                     v
+-----------------------------------------------------------------------------------+
| 3. Local SQLite Persistence (ReplyForgeDb.java -> replyforge.db)                  |
|    - Tables: products, orders, messages, threads, store_accounts, settings,       |
|      anomaly_alerts, rules                                                        |
|    - Offline Warehouse Quick Command Parser (adjustStock / addProduct)            |
|    - Instant Stock Decrement on WhatsApp Order Creation (STK-CAT-01: 50 -> 49)    |
+------------------------------------+----------------------------------------------+
                                     |
                                     | Clean Normalized Context + Catalog Snapshot
                                     v
+-----------------------------------------------------------------------------------+
| 4. Hybrid On-Device AI Engine (ReplyForgeAiEngine.java)                           |
|    - Client-Side OTP Shield (Blocks PIN/OTP before any network call)              |
|    - APK Malware & Social Engineering Classifier -> Flags [Perlu Ditinjau Manual] |
|    - Indonesian Slang Normalizer + HPP Margin Guard + Conversational Order Parser |
+-----------------+-----------------------------------+-----------------------------+
                  |                                   |
                  | Direct OS Action (<800ms)         | Local Loopback / API Sync
                  v                                   v
+------------------------------------+   +------------------------------------------+
| 5. Android Reply Dispatcher        |   | 6. Local Server (server/src/index.js)    |
|    - WhatsApp: RemoteInput <800 ms |   |    - Express REST + SSE (Port 8088)      |
|    - Shopee: draft -> clipboard +  |   |    - SQLite Sync & Sandbox Engine        |
|      launch Shopee Seller app      |   |    - Optional companion, APK standalone  |
+------------------------------------+   +--------------------+---------------------+
                                                              |
                                                              | HTTP Proxy (/api)
                                                              v
                                         +------------------------------------------+
                                         | 7. React/Vite Dashboard (web/src/)       |
                                         |    - Default `/`: mobile APK mirror      |
                                         |    - Desktop: `/?view=studio`            |
                                         |    - Dev :5173 · Prod served on :8088    |
                                         +------------------------------------------+
```

### Rincian Komponen Teknologi (Tech Stack)

- **Android Native Agent (`android-native-agent/`):** Java 11 (source/target compatibility), `compileSdk 37`, `targetSdk 34`, `minSdk 26`, Material Components for Android (`Theme.Material3.Light.NoActionBar`), `SQLiteOpenHelper` (`replyforge.db`), `NotificationListenerService`, `Service` (`dataSync`), `BroadcastReceiver` (`BOOT_COMPLETED`).
- **Local Web Seller Center (`web/`):** React 18.3, TypeScript 5.6, Vite 5.4, TailwindCSS 3.4, Lucide React Icons, Sonner Toast, Vitest & React Testing Library. Mode default adalah kiosk mobile; dashboard desktop di `?view=studio`.
- **Local Sync & Simulation Server (`server/`):** Node.js 22.5+ dengan `node:sqlite` (tanpa kompilasi native), Express 4.21, RESTful JSON API + SSE telemetry di port `8088`, modul deteksi PII/OTP (`pii.js`), klasifikasi intent (`intent.js`), dan deteksi anomali (`anomaly.js`). Server bersifat pendamping opsional; APK tetap berjalan mandiri tanpa server.

---

## 9. Panduan Instalasi, Konfigurasi, & Localhost Run (Installation & Run Guide)

Panduan ini disusun agar dewan juri maupun pengembang dapat menjalankan **Local Web Seller Center (`http://localhost:5173`)** dan membangun **APK Android Native** dalam waktu kurang dari 1 menit.

### A. Prasyarat Sistem (Prerequisites)
1. **Node.js:** Versi `>= 22.5.0` dan `npm` terpasang di sistem.
2. **Java Development Kit (JDK):** JDK 17 (digunakan oleh Gradle untuk kompilasi Android).
3. **Android SDK & Platform-Tools:** Android SDK Platform 37 (`compileSdk`) dengan `targetSdk 34`, serta `adb` (*Android Debug Bridge*) tersedia di `PATH`.

### B. Konfigurasi Lingkungan (`.env.example` & Zero Hardcoded Secrets)
ReplyForge mematuhi prinsip **Zero Hardcoded Secrets**. Tidak ada API key aktif atau nomor telepon pribadi yang disimpan di dalam kode sumber.
1. Salin berkas konfigurasi contoh di direktori root dan server:
   ```powershell
   Copy-Item -LiteralPath ".env.example" -Destination ".env"
   Copy-Item -LiteralPath "server\.env.example" -Destination "server\.env"
   ```
2. Isi variabel di dalam `.env` (opsional bila ingin menghubungkan ke gateway LLM eksternal; sistem tetap berjalan 100% secara lokal dengan mesin deterministik apabila biarkan default):
   ```ini
   PORT=8088
   REPLYFORGE_DB=./data/replyforge.db
   REPLYFORGE_BASE_URL=http://localhost:20128/v1
   REPLYFORGE_API_KEY=your_api_key_here
   REPLYFORGE_MODEL=ag/gemini-3.8-flash-low
   ```

### C. Menjalankan Local Web Seller Center (`http://localhost:5173`)
Jalankan perintah berikut dari direktori utama repositori (`replyforge_work`):

```powershell
# 1. Pasang seluruh dependensi workspace (server dan web)
npm install

# 2. Jalankan server API (port 8088) dan Vite Web Dashboard (port 5173) secara bersamaan
npm run dev
```

Atau jika ingin menjalankan khusus antarmuka web di direktori `web`:
```powershell
cd web
npm run dev
```
Buka browser dan kunjungi **`http://localhost:5173`**. Untuk memverifikasi kompilasi produksi web dan menjalankan pengujian otomatis:
```powershell
npm run build
npm test
```
Untuk menjalankan seluruh sistem dari satu port (server Express menyajikan hasil build web):
```powershell
npm start
```
Lalu buka **`http://localhost:8088`** (dashboard desktop: **`http://localhost:8088/?view=studio`**).

### D. Membangun (Build) APK Android Native dari Kode Sumber
Masuk ke direktori `android-native-agent` dan jalankan Gradle Wrapper:

```powershell
cd android-native-agent
.\gradlew.bat assembleDebug
```
Berkas APK hasil kompilasi akan tersedia di:
`android-native-agent\app\build\outputs\apk\debug\app-debug.apk`

### E. Panduan Instalasi APK & Pengujian Mandiri via ADB
Hubungkan ponsel Android fisik melalui kabel USB (dengan *USB Debugging* aktif), lalu jalankan perintah berikut:

```powershell
# 1. Pasang APK Debug ke ponsel Android
adb install -r android-native-agent\app\build\outputs\apk\debug\app-debug.apk

# 2. Berikan izin akses pengaturan terbatas & NotificationListenerService
adb shell appops set id.replyforge.agent ACCESS_RESTRICTED_SETTINGS allow
adb shell cmd notification allow_listener id.replyforge.agent/id.replyforge.agent.ReplyForgeNotificationService
adb shell pm grant id.replyforge.agent android.permission.POST_NOTIFICATIONS
adb shell dumpsys deviceidle whitelist +id.replyforge.agent

# 3. Jalankan aplikasi ReplyForge di layar ponsel
adb shell am start -n id.replyforge.agent/.MainActivity
```

> **Pembuktian Zero-Tethering (Tanpa Kabel USB):** Setelah langkah di atas selesai, **cabut kabel USB dari laptop**. Aplikasi ReplyForge di ponsel akan tetap membalas chat WhatsApp Business, menyiapkan draf Shopee Seller, memotong stok SQLite, serta menjalankan **In-App Self-Test (`8/8 PASS` + `ERROR_STATE: PASS`)** secara mandiri 100% di dalam ponsel.

---

## 10. Spesifikasi Perangkat, Batasan Sistem, Transparansi AI, & Peta Jalan (Specs, Limitations, & Roadmap)

### A. Spesifikasi Perangkat Keras & Lunak (Hardware & Software Specifications)

| Kategori | Spesifikasi Minimum | Spesifikasi Pengujian Produksi (Verified) |
|---|---|---|
| **Perangkat Keras Ponsel** | Android Smartphone, RAM 3 GB, Memori Internal Kosong 150 MB | **Infinix Note 40 (`Infinix_X6853`)**, RAM 8 GB, Layar 1080x2436 px (480 dpi) |
| **Sistem Operasi Ponsel** | Android 8.0 Oreo (API Level 26) ke atas | **Android 14 (API Level 34)** dengan antarmuka XOS |
| **Lingkungan Kompilasi & Web** | CPU Dual-Core, RAM 4 GB, Node.js v22.5+, JDK 17 | Intel Core i5-13420H (12 Cores), RAM 16 GB, Windows 11 x64 |
| **Ukuran & Performa APK** | Ukuran APK < 10 MB, Latensi Balasan Lokal < 800 ms | APK Debug Mandiri (tanpa aset WebView usang), waktu kueri SQLite < 5 ms |

### B. Transparansi & Etika Kecerdasan Buatan (AI Transparency & Ethics)
1. **Arsitektur Hibrida Deterministik + AI:** Perhitungan uang (Rupiah), batas modal HPP, dan pemotongan jumlah stok tidak pernah diserahkan pada tebakan probabilistik LLM, melainkan dieksekusi oleh kode Java/SQLite deterministik agar bebas dari halusinasi angka.
2. **Kepatuhan Pelindungan Data Pribadi (UU PDP):** Modul *Client-Side OTP Shield* dan *Personal WhatsApp Isolation* menjamin bahwa kode rahasia perbankan serta percakapan pribadi pemilik ponsel diblokir di perangkat lokal (0 byte dikirim ke internet).
3. **Efisiensi Energi (Green Software Engineering):** Pemrosesan lokal berbasis SQLite dan pencocokan pola di perangkat memangkas kebutuhan panggilan cloud API berulang, menghemat konsumsi baterai ponsel serta menekan jejak karbon komputasi server.

### C. Batasan Sistem Saat Ini (Current System Limitations)
1. **Ketergantungan pada Aksi Balasan Notifikasi (`RemoteInput`) untuk WhatsApp:** Agar agen dapat mengirim balasan otomatis tanpa membuka aplikasi target, WhatsApp Business harus memunculkan notifikasi standar Android yang menyertakan aksi `RemoteInput` (balas cepat). Jika pengguna mematikan notifikasi aplikasi chat di pengaturan OS, agen tidak akan menerima umpan pesan.
2. **Shopee Seller Bersifat Smart Copilot, Bukan Autopilot Penuh:** Shopee Seller tidak menyediakan `RemoteInput` di notifikasinya. ReplyForge mencatat chat sebagai lead, menyusun draf balasan, lalu menyalin draf dan membuka aplikasi Shopee Seller untuk dikirim penjual. Pesanan dan pembayaran tetap diproses di marketplace; stok fisik dipotong setelah lead dikonfirmasi di tab Transaksi.
3. **Kebijakan Penghemat Baterai OEM Agresif:** Meskipun ReplyForge telah menggunakan `ForegroundService` (`START_STICKY`), `WakeLock`, dan `BootCompletedReceiver`, beberapa sistem operasi modifikasi pabrikan memerlukan pengecualian penghematan baterai (*Unrestricted Battery*) satu kali saat instalasi awal.
4. **Format Impor Katalog:** Fitur impor CSV mengenali tanda pemisah koma (`,`). Berkas CSV yang disimpan ulang melalui Microsoft Excel dengan pengaturan regional Indonesia (koma menjadi titik koma `;`) perlu disimpan sebagai *CSV UTF-8 (Comma delimited)*, atau gunakan impor `.xlsx` melalui parser `XlsxImporter` sesuai panduan pada `docs/manual-test-stickeria.xlsx`.

### D. Peta Jalan Pengembangan Masa Depan (Future Roadmap)
1. **Integrasi Pencetakan Resi Termal Bluetooth (ESC/POS):** Mencetak label pengiriman stiker langsung dari kartu pesanan lunas di ponsel ke printer termal Bluetooth portabel tanpa berpindah aplikasi.
2. **Sinkronisasi Multi-Perangkat Terenkripsi (End-to-End Encrypted LAN Sync):** Menghubungkan ponsel pemilik toko dengan ponsel karyawan gudang dalam satu jaringan Wi-Fi lokal tanpa memerlukan server cloud pihak ketiga.
3. **Dukungan Kanal TikTok Shop & Tokopedia Seller:** Memperluas parser `NotificationListenerService` untuk mengenali struktur notifikasi pesan dari aplikasi TikTok Shop Seller Center dan Tokopedia Seller.
4. **Ringkasan Laporan Keuangan Harian Otomatis:** Menghasilkan rekapitulasi laba bersih harian (Omzet dikurangi HPP terhitung) setiap pukul 21.00 WIB langsung di layar utama aplikasi.

### E. Atribusi Open-Source & Lisensi (Attribution & License)
- **AndroidX AppCompat & Material Components (`com.google.android.material`):** Lisensi Apache 2.0 oleh Google & Android Open Source Project.
- **React, Vite, TailwindCSS, Lucide Icons, & Sonner:** Lisensi MIT oleh masing-masing kontributor open-source.
- **Hak Cipta & Orisinalitas:** Dikembangkan secara orisinal oleh **Team ReplyForge** untuk kompetisi **LOGICODIX 2026**. Seluruh aset ikon vektor aplikasi dirancang khusus tanpa ketergantungan pada aset berhak cipta tertutup.
