# Daftar Periksa Kepatuhan Pengumpulan & Pernyataan Orisinalitas (LOGICODIX 2026)

**Nama Proyek:** ReplyForge (Agen Otomasi Chat, Penjaga HPP, dan Inventaris Mandiri untuk UMKM)  
**Kompetisi:** LOGICODIX 2026  
**Subtema:** Subtema 3 (Local MSME & Creative Economy)  
**Identitas Paket Android:** `id.replyforge.agent`  
**Batas Akhir Pengumpulan & Code Freeze:** Sabtu, 14 November 2026 pukul 23:59 WIB (Target kunci internal: 23:00 WIB)

---

## 1. Checklist Kepatuhan Guidebook Logicodix 2026

Bagian ini memverifikasi kelengkapan lima syarat utama sesuai ketentuan Guidebook Logicodix 2026 (Halaman 14, 17 sampai 21, dan 27) sebelum formulir portal pengumpulan dikirimkan.

### 1.1 Repositori Publik & Kelengkapan Dokumentasi `README.md` (Guidebook Hal. 18)

- [x] **Visibilitas Repositori Publik:** Pengaturan repositori GitHub telah disetel ke status **Public** sehingga dewan juri dapat melakukan kloning dan pemeriksaan kode sumber tanpa halangan izin akses.
- [x] **Kelengkapan Kode Sumber:** Seluruh kode sumber aplikasi Android Native (`android-native-agent/`) dan Web Seller Center (`web/`) telah tersedia di dalam repositori utama.
- [x] **Kepatuhan Struktur `README.md` (Hal. 18):** Berkas `README.md` pada akar repositori telah memuat 10 bagian wajib:
  1. Identitas proyek, nama tim, daftar 4 anggota beserta peran, dan subtema lomba.
  2. Rumusan masalah UMKM (keterlambatan balasan chat, selisih stok, risiko penipuan berkas `.apk`) dan solusi ReplyForge.
  3. Daftar fitur utama (balasan otomatis WhatsApp Business dan Shopee Seller, sinkronisasi stok SQLite, deteksi anomali, gerbang privasi nomor pribadi, perintah cepat luring, dan *In-App Self-Test*).
  4. Rincian tumpukan teknologi (*tech stack*) untuk modul Android, Web, dan mesin AI lokal.
  5. Diagram arsitektur dan alur data sistem.
  6. Panduan instalasi dan pengoperasian lokal (*localhost*) langkah demi langkah.
  7. Penjelasan konfigurasi lingkungan melalui `.env.example`.
  8. Data akun demonstrasi toko (Stickeria / Stickeria, rekening SeaBank `901483182051`, katalog produk `STK-CAT-01`).
  9. Transparansi kecerdasan buatan, batasan kerja luring, serta perlindungan data pribadi penjual.
  10. Atribusi pustaka pihak ketiga dan lisensi sumber terbuka.
- [x] **Bebas Kebocoran Kredensial (*Zero Hardcoded Secrets*):** Seluruh berkas sumber, tata letak XML, dan dokumentasi telah dipindai untuk memastikan tidak ada kunci API aktif, kata sandi asli, maupun nomor telepon pribadi anggota tim yang tersimpan di dalam repositori.

### 1.2 Kepatuhan Code Freeze & Integritas Riwayat Commit (Guidebook Hal. 14)

- [x] **Kepatuhan Tenggat Code Freeze:** Seluruh pengiriman kode berakhir sebelum batas resmi **14 November 2026 pukul 23:59 WIB**, dengan jadwal penguncian akhir internal pada pukul **23:00 WIB**.
- [x] **Distribusi Kontribusi 4 Anggota Tim:** Riwayat *commit* tercatat secara proporsional pada ke-4 akun GitHub anggota tim (`@royaldinan`, `@anzuky1`, `@FarrelBasayev`, `@Alex1a67`) sesuai pembagian modul kerja di `docs/team-contributions.md`.
- [x] **Commit Bertahap & Pesan Terstandarisasi:** Perubahan kode dikirimkan secara bertahap (*atomic commits*) menggunakan format pesan baku (`feat`, `fix`, `docs`, `chore`) dan bukan berupa satu pengiriman masif tunggal di akhir waktu.
- [x] **Keaslian Waktu Commit:** Seluruh riwayat *commit* direkam secara waktu nyata (*real-time*) tanpa rekayasa tanggal (*date spoofing*), tanpa *force-push*, dan tanpa penulisan ulang riwayat masa lalu.
- [x] **Pencatatan Hash Final:** Kode *hash commit* terakhir dari cabang utama (`main`) telah dicatat untuk dilampirkan pada berkas pengumpulan resmi.

### 1.3 Video Demonstrasi di YouTube (Guidebook Hal. 18 s.d. 20)

- [x] **Durasi Sesuai Ketentuan:** Video demonstrasi berdurasi di antara **3:00 sampai 5:00 menit** (durasi target produksi: **3 menit 45 detik** sesuai naskah di `docs/video-demo-script.md`).
- [x] **Aksesibilitas Platform YouTube:** Video diunggah ke YouTube dengan pengaturan visibilitas **Unlisted** atau **Public**, tidak memiliki pembatasan usia, serta dapat diputar langsung dari tautan pengumpulan tanpa mewajibkan juri masuk akun.
- [x] **Rekaman Aplikasi Nyata Tanpa Mockup (Hal. 19):** Seluruh visual di dalam video merupakan rekaman layar langsung dari aplikasi yang berjalan di perangkat fisik Android (`Infinix X6853`) dan peramban lokal. Video sama sekali tidak menggunakan purwarupa Figma, tayangan gambar statis, atau animasi antarmuka rekayasa.
- [x] **Kelengkapan Urutan Demonstrasi Wajib:**
  1. Perkenalan identitas tim dan masalah nyata yang dihadapi penjual UMKM Stickeria (0:00 s.d. 0:30).
  2. Demonstrasi balasan otomatis WhatsApp Business saat layar perangkat terkunci melalui `ReplyForgeNotificationService` dan `ReplyForgeForegroundService` (0:30 s.d. 1:15).
  3. Pembuktian pencatatan pesanan otomatis dan pengurangan stok SQLite dari 50 menjadi 49 secara instan (1:15 s.d. 1:55).
  4. Pembuktian keamanan AI terhadap kiriman berkas `.apk` berbahaya (ditandai *Perlu Ditinjau Manual*) serta pemblokiran otomatis chat WhatsApp pribadi (1:55 s.d. 2:40).
  5. Demonstrasi perintah cepat stok luring (*Offline Quick Command*) di tab Stok dengan mengetik `tambah 10 STK-CAT-01` tanpa koneksi internet (2:40 s.d. 3:15).
  6. Eksekusi `SelfTestActivity` di menu Pengaturan yang menampilkan hasil `SELF-TEST: 8/8 PASS` dan `ERROR_STATE: PASS` (3:15 s.d. 3:35).
  7. Ringkasan dampak solusi bagi kemandirian usaha mikro (3:35 s.d. 3:45).

### 1.4 Ketersediaan Artefak APK Native Mandiri (`app-debug.apk`)

- [x] **Berkas APK Siap Pasang:** Artefak kompilasi `android-native-agent/app/build/outputs/apk/debug/app-debug.apk` telah terbangun dengan sukses melalui `./gradlew assembleDebug` dan disertakan dalam paket rilis untuk diuji oleh dewan juri.
- [x] **Arsitektur Mandiri di Perangkat (*Standalone On-Device*):** Aplikasi berjalan penuh di perangkat Android tanpa bergantung pada koneksi kabel ADB maupun server laptop. Basis data SQLite (`/data/data/id.replyforge.agent/databases/replyforge.db`), layanan latar depan (`ReplyForgeForegroundService`), dan pendengar notifikasi (`ReplyForgeNotificationService`) beroperasi mandiri di dalam telepon genggam penjual.
- [x] **Pengujian Mandiri Terintegrasi:** Juri dapat menekan tombol **Jalankan Self-Test** langsung di dalam aplikasi untuk memverifikasi 8 skenario inti beserta penanganan kondisi galat (`ERROR_STATE`) secara langsung di perangkat.

### 1.5 Kesiapan Verifikasi Localhost 1 Menit Grand Final (Guidebook Hal. 27)

- [x] **Server Web Seller Center (`localhost:5173`):** Dasbor web di direktori `web/` telah dikonfigurasi menggunakan Vite untuk berjalan konsisten pada port `5173` melalui perintah `npm run dev`.
- [x] **Verifikasi Build Produksi Bersih:** Perintah `npm run build` di direktori `web/` menghasilkan kompilasi tanpa galat TypeScript (kode keluar `0`), dilengkapi dengan berkas `.env.example`.
- [x] **SOP Pengujian 1 Menit Juri:** Panduan teknis langkah demi detik untuk menyalakan layanan lokal, memasang APK, dan mendemonstrasikan pelepasan kabel USB (*zero-tethering*) di hadapan dewan juri telah tersedia di `docs/localhost-grand-final-guide.md`.

---

## 2. Matriks Peringatan Dini & Mitigasi Diskualifikasi

Tabel berikut digunakan sebagai gerbang pemeriksaan terakhir. Apabila salah satu kondisi kegagalan ditemukan saat audit pra-pengumpulan, status item otomatis berubah menjadi **PERINGATAN MERAH (Blocker Diskualifikasi)** dan wajib diselesaikan sebelum formulir dikirim.

| Lapis Verifikasi | Indikator Lulus (`[PASS]`) | Kondisi Peringatan Merah (`[BLOCKER DISKUALIFIKASI]`) | Prosedur Mitigasi Cepat |
|---|---|---|---|
| **1. Repositori & Kredensial** | URL GitHub dapat dibuka di mode samaran (*incognito*), `README.md` utuh, 0 kebocoran data sensitif. | Repositori masih berstatus *Private*, `README.md` kosong, atau ditemukan kunci API / nomor pribadi di kode. | Ubah visibilitas repositori ke *Public*, jalankan pemindaian pola sensitif, dan hapus data rahasia sebelum *commit* penutup. |
| **2. Code Freeze & Git** | Seluruh *commit* masuk sebelum 14 Nov 2026 pukul 23:59 WIB, terdistribusi pada 4 akun kontributor. | Terdapat *commit* melewati pukul 23:59 WIB atau seluruh kode hanya dikirim dalam 1 *commit* tunggal. | Hentikan seluruh aktivitas *push* paling lambat pukul 23:00 WIB sesuai jadwal di `docs/hermes-commit-schedule.md`. |
| **3. Video Demo YouTube** | Durasi antara 3:00 s.d. 5:00 menit, status *Unlisted*/*Public*, suara jernih, 100% rekaman aplikasi nyata. | Durasi di bawah 3 menit atau di atas 5 menit, video berstatus *Private*, atau mengandung tampilan desain Figma. | Pangkas atau sesuaikan rekaman hingga tepat di kisaran 3 menit 45 detik, lalu uji tautan YouTube pada peramban tanpa akun. |
| **4. Artefak `app-debug.apk`** | APK terpasang mulus di Android 8.0+ (minSdk 26), *Self-Test* menampilkan `8/8 PASS` dan `ERROR_STATE: PASS` tanpa ADB. | APK gagal dipasang, berhenti mendadak (*force close*) saat izin notifikasi belum aktif, atau butuh laptop agar berfungsi. | Bangun ulang dengan `./gradlew clean assembleDebug`, uji langsung di perangkat `Infinix X6853` dengan kabel USB dilepas. |
| **5. Kesiapan Localhost** | `npm run dev` membuka `http://localhost:5173` dalam waktu < 15 detik dan `npm run build` lulus tanpa galat. | Port `5173` gagal terikat, paket `node_modules` rusak, atau ketiadaan berkas `.env` menyebabkan layar putih. | Pastikan fallback konfigurasi lokal aktif tanpa `.env` wajib, dan siapkan skrip pembersih port sesuai `docs/localhost-grand-final-guide.md`. |

---

## 3. Pernyataan Orisinalitas & Bebas Plagiarisme (Statement of Originality)

Naskah berikut merupakan pernyataan resmi keaslian karya yang disusun untuk kebutuhan dokumentasi repositori serta menjadi dasar pembuatan dokumen **Surat Pernyataan Orisinalitas Bermeterai Rp10.000 (PDF)** sesuai ketentuan administratif Guidebook Logicodix 2026 (Halaman 17 sampai 21).

### SURAT PERNYATAAN ORISINALITAS KARYA DAN BEBAS PLAGIARISME

Kami yang bertanda tangan di bawah ini, selaku anggota tim pengembang proyek **ReplyForge** pada kompetisi **LOGICODIX 2026** (Subtema 3: *Local MSME & Creative Economy*):

1. **Nama Lengkap:** Ferdinand Manurung  
   **Akun GitHub:** `@royaldinan`  
   **Peran dalam Tim:** Team Lead & Mobile Agent Core Architect (Arsitektur Android Native, Notification Listener Service, Foreground Service, dan Basis Data SQLite)

2. **Nama Lengkap:** Abyan Nur Zaky  
   **Akun GitHub:** `@anzuky1`  
   **Peran dalam Tim:** AI Engine & Security Specialist (Interaction Gate, Klasifikasi Anomali & Anti-Scam APK, Filter Privasi WhatsApp Pribadi, dan Mesin In-App Self-Test)

3. **Nama Lengkap:** Farrel Basayev  
   **Akun GitHub:** `@FarrelBasayev`  
   **Peran dalam Tim:** Frontend & Web Dashboard Engineer (Web Seller Center Vite/React, Sistem Desain UI Material3 & Web, serta Antarmuka Perintah Cepat)

4. **Nama Lengkap:** Alex  
   **Akun GitHub:** `@Alex1a67`  
   **Peran dalam Tim:** QA, Testing & Technical Writer (Penguatan Sistem v6, Audit Visual 70 Poin, Dokumentasi Teknis, dan Skenario Pengujian)

Dengan ini menyatakan secara sadar, jujur, dan bertanggung jawab penuh bahwa:

1. Karya perangkat lunak berjudul **ReplyForge** (mencakup aplikasi native Android `id.replyforge.agent`, mesin pemrosesan aturan dan kecerdasan buatan lokal, serta dasbor Web Seller Center) adalah murni hasil rancangan, penulisan kode, dan pengembangan orisinal oleh ke-4 anggota tim kami selama periode kompetisi berlangsung.
2. Karya ini bebas dari segala bentuk tindakan plagiarisme, pembajakan kode sumber, maupun klaim sepihak atas hak kekayaan intelektual milik pihak lain.
3. Karya ini belum pernah dipublikasikan secara komersial, tidak sedang terikat kontrak eksklusif dengan instansi mana pun, dan belum pernah meraih gelar juara pada kompetisi tingkat nasional maupun internasional lainnya sebelum LOGICODIX 2026.
4. Seluruh pustaka perangkat lunak sumber terbuka (*open-source libraries*), kerangka kerja, serta komponen pihak ketiga yang digunakan di dalam proyek ini telah dicantumkan secara transparan beserta lisensinya pada bagian Atribusi Pustaka Pihak Ketiga.
5. Apabila di kemudian hari ditemukan bukti sah bahwa karya ini melanggar ketentuan orisinalitas atau terbukti merupakan hasil plagiarisme, kami bersedia menerima sanksi pembatalan status kepesertaan atau diskualifikasi sesuai peraturan resmi panitia penyelenggara LOGICODIX 2026.

Demikian pernyataan orisinalitas ini kami buat dengan sebenarnya untuk digunakan sebagaimana mestinya.

**Tanggal Pernyataan:** Sabtu, 14 November 2026

| Nama Anggota Tim | Akun GitHub | Peran Utama | Status Verifikasi |
|---|---|---|---|
| **Ferdinand Manurung** | `@royaldinan` | Team Lead & Mobile Agent Core Architect | Menyetujui & Bertanda Tangan (Meterai Rp10.000 pada berkas PDF) |
| **Abyan Nur Zaky** | `@anzuky1` | AI Engine & Security Specialist | Menyetujui & Bertanda Tangan |
| **Farrel Basayev** | `@FarrelBasayev` | Frontend & Web Dashboard Engineer | Menyetujui & Bertanda Tangan |
| **Alex** | `@Alex1a67` | QA, Testing & Technical Writer | Menyetujui & Bertanda Tangan |

---

## 4. Atribusi Pustaka Pihak Ketiga (Third-Party Library Attribution)

Sesuai kaidah rekayasa perangkat lunak yang etis dan ketentuan transparansi Guidebook Logicodix 2026, seluruh komponen pihak ketiga yang digunakan dalam pengembangan **ReplyForge** dicantumkan pada tabel berikut beserta fungsi dan lisensinya:

| Kategori | Nama Pustaka / Kerangka Kerja | Koordinat Paket & Versi | Lisensi | Peruntukan di Dalam ReplyForge |
|---|---|---|---|---|
| **Android Native** | **AndroidX AppCompat, Activity & ConstraintLayout** | `androidx.appcompat:appcompat:1.8.0`, `androidx.activity:activity-ktx:1.13.0`, `androidx.constraintlayout:constraintlayout:2.2.2` | Apache License 2.0 | Kompatibilitas lintas versi Android (minSdk 26), pengelolaan siklus hidup aktivitas, dan penyusunan tata letak layar responsif. |
| **Android Native** | **Material Components for Android** | `com.google.android.material:material:1.14.0` | Apache License 2.0 | Komponen antarmuka Material Design 3, termasuk `MaterialButton`, kartu informasi, bilah navigasi bawah, dan grup chip filter pesanan. |
| **Jaringan & HTTP** | **OkHttp / Klien HTTP Android** | `okhttp3` / Pustaka klien HTTPS standar Android (`java.net.HttpURLConnection`) | Apache License 2.0 | Komunikasi jaringan HTTPS yang aman dengan batas waktu (*timeout*) terukur untuk gerbang cadangan AI ketika perangkat terhubung ke internet. |
| **Web Build Tool** | **Vite** | `vite: ^5.4.11`, `@vitejs/plugin-react: ^4.3.4` | MIT License | Server pengembangan lokal berkecepatan tinggi (`localhost:5173`) dan pembungkus bundel produksi untuk Web Seller Center. |
| **Web Frontend** | **React & React DOM** | `react: ^18.3.1`, `react-dom: ^18.3.1` | MIT License | Pustaka utama pembuatan komponen antarmuka pengguna interaktif, manajemen status tampilan, dan simulator pesan pada Web Seller Center. |
| **Web Styling** | **Tailwind CSS** | `tailwindcss: ^3.4.17`, `@tailwindcss/vite: ^4.1.18`, `tailwind-merge: ^3.7.0`, `clsx: ^2.1.1` | MIT License | Sistem penataan gaya berbasis kelas utilitas, penerapan palet warna *Warm Ivory & Honey Amber*, serta tipografi angka tabular (`tabular-nums`). |
| **Web UI & Ikon** | **Lucide React & Sonner** | `lucide-react: ^1.61.0`, `sonner: ^2.0.8` | ISC License / MIT License | Ikonografi vektor yang bersih pada dasbor web serta komponen pemberitahuan (*toast notification*) waktu nyata. |
| **Pengujian (QA)** | **JUnit, AndroidX Espresso & Vitest** | `junit:4.13.2`, `androidx.test.espresso:espresso-core:3.7.0`, `vitest: ^2.1.9` | EPL 1.0 / Apache 2.0 / MIT | Pengujian unit dan verifikasi komponen pada modul Android serta aplikasi web. |

### Komponen Inti yang Ditulis Sepenuhnya secara Mandiri (100% In-House Code)

Seluruh logika bisnis inti di bawah ini ditulis sendiri oleh tim pengembang ReplyForge tanpa menggunakan pustaka pembungkus pihak ketiga:
1. **`ReplyForgeNotificationService.java` & `ReplyForgeForegroundService.java`:** Pencegatan notifikasi tingkat sistem operasi, pemisahan pesan ringkasan grup Shopee Seller, filter isolasi WhatsApp pribadi (`com.whatsapp`), dan pengirim balasan langsung via `RemoteInput`.
2. **`ReplyForgeAiEngine.java`:** Normalisasi bahasa gaul jual-beli Indonesia, penjaga batas minimal Harga Pokok Penjualan (HPP Guard), pendeteksi anomali kiriman berkas `.apk` berbahaya, dan pelindung kode OTP perbankan di sisi perangkat.
3. **`QuickCommandParser.java` & `ReplyForgeDb.java`:** Mesin pengurai perintah teks luring untuk manajemen stok gudang tanpa internet beserta skema basis data SQLite transaksi dan inventaris.
4. **`SelfTestActivity.java`:** Mesin pengujian mandiri di dalam aplikasi yang memverifikasi 8 kasus uji utama beserta simulasi pemulihan galat (`ERROR_STATE`) secara langsung di perangkat fisik.
