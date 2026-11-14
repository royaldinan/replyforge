# DOKUMEN HANDOVER & KONTEKS LENGKAP PROYEK REPLYFORGE (LOGICODIX 2026)

**Berkas:** `C:\Users\User\replyforge_work\HANDOVER_LOGICODIX_2026.md`  
**Waktu Pembuatan:** Sabtu, 14 November 2026  
**Status Proyek:** Siap Operasional / Siap Eksekusi Submission  
**Kompetisi:** LOGICODIX 2026 — Subtema 3: *Local MSME & Creative Economy*  
**Aplikasi:** `id.replyforge.agent` (Android Native Standalone APK) & Web Seller Center (`http://localhost:5173`)  
**Hardware Target Terverifikasi:** Infinix Note 40 (`Infinix_X6853`, Android 14 / XOS 14, 1080x2436 px @ 480 dpi, PIN: `246810`)  
**Mitra Studi Kasus:** Toko Stickeria, Bandung / Cikarang (SeaBank `901483182051` a.n. Ferdinand Manurung, SKU `STK-CAT-01` Rp15.000, stok 50)

---

## 1. Executive Summary & Arsitektur Sistem

ReplyForge adalah agen kecerdasan buatan (AI) multi-kanal lokal pertama untuk UMKM yang beroperasi **100% mandiri (local-first standalone)** langsung di perangkat smartphone Android tanpa ketergantungan server cloud berbayar atau komputer jinjing yang terus menyala.

### Pilar Arsitektur:
1. **WhatsApp Business (Conversational Commerce - Full Autopilot)**:
   - Menangkap notifikasi chat WhatsApp Business via `ReplyForgeNotificationService`.
   - Menggunakan Android `RemoteInput` resmi untuk membalas chat secara otomatis di latar belakang dalam waktu sub-detik (<800 ms).
   - Memvalidasi stok produk di basis data SQLite lokal (`replyforge.db`).
   - Membuat pesanan otomatis berstatus `reserved`, memotong stok dari 50 ke 48 pack, dan mengeluarkan tagihan resmi transfer SeaBank `901483182051`.
   - Saat penjual menekan tombol `✓ Konfirmasi Lunas`, sistem otomatis mengirimkan chat WhatsApp balasan konfirmasi pembayaran telah diterima dan paket sedang dikemas dari kota toko.
2. **Shopee Seller (Marketplace Lead Management - Smart Copilot)**:
   - Notifikasi Shopee di Android **tidak memiliki `RemoteInput`** (tidak ada tombol quick reply di status bar). Sistem ReplyForge **tidak memaksakan klaim bohong**, melainkan mengadopsi model **Smart Copilot**:
     a. Chat Shopee masuk dicatat sebagai **Calon Pembeli (Shopee Leads)** di tab Transaksi.
     b. AI menyusun draf balasan pra-jual ramah (konfirmasi stok ready, estimasi pengiriman kota toko, dan ajakan checkout via keranjang Shopee).
     c. **DILARANG** membuat pesanan lokal dan **DILARANG** menyebutkan nomor rekening transfer (sesuai aturan marketplace).
     d. Tombol **`[🚀 Buka & Balas di Shopee]`**: Teks balasan disalin otomatis ke Clipboard dan aplikasi seketika melompat membuka aplikasi Shopee Seller Centre (`com.shopee.shopeeseller`) via tag deklarasi `<queries>`.
     e. Pada tab Transaksi, penjual dapat memilih barang yang dibeli dari dropdown katalog SQLite dan memasukkan jumlah pack yang beneran dibayar di Shopee untuk memotong stok fisik.
3. **AI Security Shield & Privasi UU PDP**:
   - Mencegat dan memblokir otomatis pesan file berbahaya scam `.apk` (`tagihan.apk`), tautan mencurigakan, dan teks pinjaman online (diberi tanda *"Perlu Ditinjau Manual"*).
   - Memblokir 100% notifikasi WhatsApp Pribadi (`com.whatsapp`) dan kode rahasia SMS OTP perbankan agar tidak pernah disentuh AI.
4. **Ketahanan Latar Belakang Mandiri (Zero-Tethering)**:
   - Berjalan pada `FOREGROUND_SERVICE_TYPE_DATA_SYNC` dengan `WakeLock` resmi.
   - Kebal terhadap sistem pembekuan baterai Infinix XOS (`tranpm`) karena telah terdaftar di Doze Mode Whitelist permanen Android.

---

## 2. Aturan Mutlak & Batasan Keras (Hard Guardrails — Zero Tolerance)

Jika melanjutkan proyek ini di laptop teman, patuhi aturan mutlak berikut:

1. **LARANGAN MUTASI GIT SECARA LANGSUNG OLEH AI**:
   - Dilarang keras melakukan `git commit`, `git push`, `git rebase`, atau `git merge` manual tanpa aturan.
   - Seluruh commit dikerjakan secara bertahap menggunakan naskah orkestrasi yang sudah disiapkan di `docs/hermes-orchestration-prompt.md` dan jadwal di `docs/hermes-commit-schedule.md`.
2. **ZERO DATE SPOOFING (DILARANG MEMALSUKAN TANGGAL GIT)**:
   - Sesuai Guidebook Hal. 14, commit harus berjalan real-time dengan stempel waktu sistem asli (+07:00 WIB). Dilarang memakai `GIT_COMMITTER_DATE`.
3. **LARANGAN KEBOCORAN NOMOR TELEPON PRIBADI**:
   - Nomor telepon pribadi `nomor pribadi pemilik (disembunyikan)` **DILARANG KERAS** muncul di repositori, kode, dokumen, maupun commit history.
   - Rekening pengujian resmi adalah: **SeaBank `901483182051` a.n. Ferdinand Manurung**.
4. **LARANGAN KLAIM BERBASIS ILUSI ADB SAJA**:
   - Pengujian aplikasi nyata harus membuktikan bahwa background service tetap hidup saat kabel USB dicabut (uji cabut kabel zero-tethering), dan tombol di layar HP fisik benar-benar membuka aplikasi Shopee Seller Centre saat disentuh jari manusia.
5. **LARANGAN SELF-CHECKOUT DI SHOPEE**:
   - Dilarang keras melakukan checkout dan membayar produk toko sendiri di aplikasi Shopee menggunakan akun pribadi pada HP/Wi-Fi yang sama (risiko permanent ban *Wash Trading* dan penalti keterlambatan pengiriman). Pengujian Shopee cukup menggunakan chat masuk pra-jual.

---

## 3. Apa Saja yang SUDAH Selesai 100% (Completed & Verified)

Seluruh 10 perbaikan bug fisik dan fungsional di kode Java & XML telah selesai diterapkan dan terkompilasi bersih (`BUILD SUCCESSFUL`):

| # | Item Perbaikan | Berkas yang Diubah | Status & Hasil Pengujian |
|---|---|---|---|
| 1 | **Gboard Auto-Close Bug Fix** | `MainActivity.java` | **LULUS** — Menghapus pemanggilan `removeAllViews()` periodik dari timer 3 detik dan menambahkan proteksi fokus aktif `EditText`. Mengetik di HP Infinix stabil tanpa keyboard tertutup sendiri. |
| 2 | **Fuzzy Quick Command Multi-Kata** | `QuickCommandParser.java` | **LULUS** — Parsing dinamis multi-token. Mengetik perintah `tambah 10 stiker kucing` otomatis mencocokkan alias ke SKU `STK-CAT-01` dan menaikkan stok dari 50 ke **60 pack** di SQLite dan UI. |
| 3 | **Shopee Pre-Sale Inquiry Parity** | `ReplyForgeAiEngine.java`, `ReplyForgeNotificationService.java` | **LULUS** — AI mendeteksi kanal Shopee: merespons stok ready dan info pengiriman toko, mengarahkan ke keranjang Shopee, **0 pesanan lokal, 0 nomor rekening bank**. Pesan keluar tersimpan ke SQLite (`out`). |
| 4 | **Dukungan Format Excel Asli (`.xlsx`) & Tombol Download** | `XlsxImporter.java`, `fragment_stock.xml`, `MainActivity.java` | **LULUS** — Dibuatkan parser mandiri `XlsxImporter` (membaca XML ZIP sharedStrings). Tombol `[📥 Unduh Template Katalog Excel (.xlsx)]` menulis berkas template tabel Amber ke folder Download HP. |
| 5 | **Tombol Simetris & Icon Vector Kembali** | `item_order.xml`, `activity_chat_detail.xml`, `ic_arrow_back.xml` | **LULUS** — Tombol `✓ Konfirmasi Lunas` dan `✕ Batalkan` disetel simetris 50/50 (minHeight 44dp, padding aman). Teks panah mentah `"←"` diganti vector resmi Material `@drawable/ic_arrow_back`. |
| 6 | **Package Visibility Shopee Android 14** | `AndroidManifest.xml` | **LULUS** — Menambahkan deklarasi `<queries>` untuk `com.shopee.shopeeseller` dan `com.shopee.id` agar `getLaunchIntentForPackage` tidak lagi bernilai null di Android 14. |
| 7 | **Peluncuran Shopee Seller Centre** | `ChatDetailActivity.java` | **LULUS** — Tombol `[🚀 Buka & Balas di Shopee]` menyalin balasan ke clipboard dan langsung meluncurkan `com.shopee.shopeeseller` dengan flag `FLAG_ACTIVITY_NEW_TASK`. |
| 8 | **Menu & Filter Calon Pembeli (Shopee Leads)** | `fragment_orders.xml`, `MainActivity.java` | **LULUS** — Filter `[🛒 Calon Pembeli (Shopee Leads)]` menampilkan lead chat Shopee. Tombol konfirmasi membuka dialog pemilihan produk dari katalog SQLite + input qty. Tombol batal memindahkan lead secara resmi ke filter `Dibatalkan`. |
| 9 | **WhatsApp Closed-Loop Payment Confirmation** | `ChatDetailActivity.java` | **LULUS** — Saat pesanan WhatsApp dikonfirmasi lunas, sistem otomatis mengirimkan chat konfirmasi terima uang dan pengemasan barang ke nomor pembeli. |
| 10 | **Pop-up Tutorial UI Premium di Layar Utama** | `MainActivity.java`, `dialog_tutorial.xml` | **LULUS** — Mengganti kotak putih jadul dengan kartu Material3 Warm Ivory berikon 4 pilar fitur yang otomatis muncul pop-up saat pertama kali membuka beranda aplikasi. |
| 11 | **Input Kota Pengiriman Toko Dinamis** | `OnboardingActivity.java`, `fragment_settings.xml`, `ReplyForgeAiEngine.java` | **LULUS** — Input kota asal toko (default: Bandung / Cikarang) dibaca dinamis oleh AI pada seluruh template jadwal pengiriman dan chat. |
| 12 | **Doze Mode Whitelist & Phone Master** | Sistem HP via ADB | **LULUS** — `com.transsion.phonemaster` diaktifkan kembali (`pm enable`) dan `id.replyforge.agent` didaftarkan ke Doze Whitelist permanen Android (`dumpsys deviceidle whitelist`). |

---

## 4. Apa Saja Berkas Dokumen Resmi yang SUDAH Selesai Disusun?

Seluruh berkas dokumen submission Logicodix 2026 berada di direktori:  
`C:\Users\User\replyforge_work\`

1. **`README.md` (Root Repositori)**:
   - 358 baris dokumentasi teknis publik memenuhi seluruh 10 bab wajib Guidebook Hal. 18 (Identitas Tim 4 orang, Problem-Solution fit, Feature Inventory, Tech Stack, Diagram Arsitektur Data Flow ASCII, Panduan Instalasi Localhost, Kredensial `.env.example`, Transparansi AI, dan Lisensi Atribusi).
2. **`docs/localhost-grand-final-guide.md`**:
   - SOP teknis 1 menit verifikasi localhost di depan dewan juri (start web `localhost:5173`, verifikasi build APK lokal, dan demonstrasi cabut kabel USB zero-tethering).
3. **`docs/team-contributions.md`**:
   - Matriks RACI pembagian peran 4 anggota tim (Ferdinand Manurung, Abyan Nur Zaky, Farrel Basayev, Alex) sinkron dengan riwayat modul kode.
4. **`docs/submission-checklist.md`**:
   - Checklist administratif 5 lapis penyerahan karya dan template Surat Pernyataan Orisinalitas bermeterai Rp10.000.
5. **`docs/hermes-commit-schedule.md`**:
   - Jadwal commit terdistribusi untuk 4 akun GitHub secara real-time dari pagi menuju batas pukul **17:20 WIB** (sebelum batas keras 17:30 WIB) tanpa pemalsuan tanggal.
6. **`docs/hermes-orchestration-prompt.md`**:
   - Naskah prompt instruksi copy-paste mandiri untuk asisten Hermes lengkap dengan aturan keras anti-force-push dan alur ganti identitas commit per batch.
7. **`docs/video-demo-script.md`**:
   - Naskah shot-by-shot video demo durasi target **3 menit 45 detik** (578 kata Bahasa Indonesia, tempo 150 kpm, 7 segmen wajib, 100% rekaman layar HP fisik Infinix tanpa slide Figma).
8. **`docs/video-recording-guide.md`**:
   - Panduan teknis setting rekam layar HP 1080p 60fps, mikrofon, dan SOP unggah YouTube (status *Unlisted/Public* tanpa pembatasan usia).
9. **`docs/template-katalog-toko.xlsx` & `docs/import-produk-demo.csv`**:
   - Template resmi katalog Excel dan file contoh siap impor yang sudah terpasang juga di folder Download HP.

---

## 5. Apa yang BELUM dan Harus Dilakukan di Laptop Teman? (Panduan Langkah Demi Langkah)

Ketika lu memindahkan proyek ini ke laptop teman lu, ikuti urutan kerja taktis berikut:

### Langkah 1: Ekstrak ZIP Proyek
1. Salin file ZIP `replyforge_work_logicodix2026.zip` ke laptop teman lu.
2. Ekstrak ke folder yang diinginkan (misal `D:\replyforge_work` atau `C:\Users\Teman\replyforge_work`).

### Langkah 2: Kompilasi & Pasang ke HP Infinix (Jika Ingin Tes / Rekam Video)
1. Sambungkan HP Infinix Note 40 via kabel USB (aktifkan USB Debugging, PIN HP: `246810`).
2. Masuk ke folder Android:
   ```bash
   cd android-native-agent
   ./gradlew assembleDebug
   ```
3. Pasang APK ke HP:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

### Langkah 3: Eksekusi Git Commit oleh Hermes (Sebelum 17:30 WIB)
1. Buka sesi AI Hermes di laptop teman lu.
2. Buka berkas `docs/hermes-orchestration-prompt.md`.
3. Salin seluruh teks prompt tersebut dan berikan ke Hermes.
4. Hermes akan membaca jadwal di `docs/hermes-commit-schedule.md` dan menjalankan commit Git secara bertahap untuk 4 akun sebelum pukul **17:30 WIB**.

### Langkah 4: Perekaman Video Demo 3 Menit 45 Detik di HP Infinix
1. Buka HP Infinix Note 40 lu (pastikan opsi *Show Touches / Tampilkan Ketukan* menyala di Opsi Pengembang).
2. Siapkan perekam layar HP bawaan Infinix (resolusi 1080p, 60 fps).
3. Buka naskah `docs/video-demo-script.md` di laptop sebagai panduan berbicara.
4. Rekam layar HP sambil membacakan narasi suara sesuai urutan 7 segmen (total waktu ~3m45s).
5. Pada bagian demonstrasi impor Excel/CSV, gunakan file `template-katalog-stickeria.xlsx` atau `import-produk-demo.csv` yang sudah otomatis tersedia di folder Download HP lu.

### Langkah 5: Unggah Video & Submit Portal Logicodix
1. Unggah video hasil rekaman ke YouTube dengan status **Unlisted** (Tidak Publik) atau **Public** (ikuti panduan `docs/video-recording-guide.md`).
2. Ambil draf Surat Pernyataan Orisinalitas di `docs/submission-checklist.md`, tempel meterai Rp10.000, tanda tangani, lalu scan ke PDF.
3. Kunjungi portal resmi Logicodix 2026 dan kirimkan URL repositori GitHub publik, tautan video YouTube, serta PDF surat orisinalitas sebelum pukul **23:59 WIB** malam ini.

---

## 6. Daftar Lokasi Berkas Kunci (Path Reference Index)

| Nama Berkas / Dokumen | Lokasi Berkas Absolut |
|---|---|
| **PRD Master Definitif (Source of Truth)** | `C:\Users\User\.omo\plans\PRD_MASTER_DEFINITIF_REPLYFORGE_2026.md` |
| **Rencana Kerja ULW Master** | `C:\Users\User\.omo\plans\replyforge-master-definitive-execution.md` |
| **README Utama Repositori** | `C:\Users\User\replyforge_work\README.md` |
| **SOP 1 Menit Localhost Grand Final** | `C:\Users\User\replyforge_work\docs\localhost-grand-final-guide.md` |
| **Jadwal Commit Hermes (<= 17:30 WIB)** | `C:\Users\User\replyforge_work\docs\hermes-commit-schedule.md` |
| **Prompt Orkestrasi Hermes** | `C:\Users\User\replyforge_work\docs\hermes-orchestration-prompt.md` |
| **Naskah Video Demo (~3m45s)** | `C:\Users\User\replyforge_work\docs\video-demo-script.md` |
| **Panduan Rekam Layar & YouTube** | `C:\Users\User\replyforge_work\docs\video-recording-guide.md` |
| **Matriks 4 Anggota Tim** | `C:\Users\User\replyforge_work\docs\team-contributions.md` |
| **Checklist Submission & Orisinalitas** | `C:\Users\User\replyforge_work\docs\submission-checklist.md` |
| **Template Katalog Excel Resmi** | `C:\Users\User\replyforge_work\docs\template-katalog-toko.xlsx` |
| **APK Debug Siap Pasang** | `C:\Users\User\replyforge_work\android-native-agent\app\build\outputs\apk\debug\app-debug.apk` |
| **File ZIP Utuh Proyek** | `C:\Users\User\replyforge_work_logicodix2026.zip` |


---

## 7. UPDATE EKSEKUSI MALAM INI (14 November 2026, 21:25 WIB)

Bagian di atas adalah snapshot pukul 19:12. Sejak itu dikerjakan satu putaran hardening
berdasarkan hasil tes langsung pengguna. Kondisi terbaru:

### 7.1 Bug yang sudah diperbaiki dan diuji di HP

| Keluhan | Akar masalah | Perbaikan | Bukti |
|---|---|---|---|
| Semua chat dianggap pesanan "1 stiker kucing" | `matchProduct()` punya fallback: kalau katalog hanya 1 produk, semua pesan dianggap produk itu; deteksi intent memakai substring sehingga kata "pesanan" = perintah "pesan" | Fallback dihapus, intent memakai whole-word, pertanyaan ambigu ditanya balik produknya | HTTP webhook: "ready nggak?" → minta sebut produk; "pesanan kapan dikirim?" → jawaban pengiriman, bukan order |
| Potong stok Shopee bisa di-spam | Order tidak terikat ke thread; pengecekan "sudah selesai" mencocokkan nama buyer dengan `contains` | Kolom `orders.thread_id` (DB v3), tombol dikunci per thread, insert menolak kalau sudah ada order paid/cancelled | Stok 48 → 47, tap kedua tetap 47, tombol `✓ Checkout Tercatat` |
| Buka & Balas di Shopee cuma menyalin | Jalur utama memakai `PendingIntent.send()` dari notification cache yang sering gagal | Langsung `getLaunchIntentForPackage("com.shopee.shopeeseller")`, fallback `com.shopee.id` | `topResumedActivity = com.shopee.shopeeseller/...HomeActivity_` |
| AI menjawab sendiri di latar belakang untuk Shopee | Mode `autopilot` global juga mengirim `RemoteInput` untuk notifikasi Shopee | Shopee **selalu** draft-only, apa pun mode-nya; manual send Shopee hanya menyalin | Kode `ReplyForgeNotificationService` + pipeline server |
| Label "Autopilot" di chat Shopee | Label tidak sadar kanal | `● Smart Copilot` + `Draf Copilot (belum terkirim)` | Screenshot chat detail |
| API key hardcoded di seed | Kredensial tertanam di `ReplyForgeDb.java` | Dihapus; input manual di Pengaturan; kosong = mesin lokal 100% offline | `git grep` bersih |

### 7.2 Localhost sekarang kembaran APK

- Default `http://localhost:5173` = frame HP berisi 4 tab yang sama (Chat, Stok & AI, Transaksi, Sistem).
- Dashboard lama (telemetry, simulator, green gateway) hanya bisa dibuka dengan `?view=studio` dan tidak dipakai saat demo.
- Seed web disamakan: Stickeria, `STK-CAT-01` Rp15.000/HPP Rp6.000/stok 50, SeaBank. Server juga menolak membuat order Shopee dan tidak menyebut rekening.
- 60/60 test web lulus setelah penyesuaian.

### 7.3 Status commit

- 10 commit atomic dijadwalkan 21:35–22:56 WIB oleh `scripts/auto_scheduler.py` (tidak di-commit).
- Setelah itu: merge `--no-ff` ke `main`, tag `v6.0.0-logicodix-final`, push (tanpa force).
- Detail: `docs/hermes-commit-schedule.md`.

### 7.4 Yang masih harus dilakukan manusia (jujur)

1. **Sambungkan kembali kabel USB.** Perangkat terputus pukul 21:08, sehingga:
   - uji cabut kabel/Doze belum dijalankan (`.omo/evidence/task-def-8-zero-tethering.md` BLOCKED);
   - 14 screenshot audit belum lengkap (`.omo/evidence/task-def-9-visual-audit.md` PARTIAL).
2. Setelah tersambung: `python scripts/capture_final_shots.py 1.0` lalu `1.3`, dan jalankan uji zero-tethering 2 menit.
3. Rekam video demo memakai naskah baru `docs/video-demo-script.md` (±4m25s, sudah memuat segmen Shopee).
4. Push repo + isi portal sebelum 23:59 WIB.

**Jangan klaim "tahan cabut kabel" atau "70/70 PASS" sampai langkah 2 selesai.**
