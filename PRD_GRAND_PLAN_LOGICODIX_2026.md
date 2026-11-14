================================================================================
PRODUCT REQUIREMENTS DOCUMENT (PRD) & GRAND EXECUTION PLAN
PRODUK   : REPLYFORGE v3.0 (Production-Ready MSME Commerce & Inventory Agent)
KOMPETISI: LOGICODIX 2026 HACKATHON
SUBTEMA  : 3 - Local MSME & Creative Economy
TARGET   : Lolos Top 8 Finalis, Menang Juara 1 Grand Final, & Siap Rilis Publik
STATUS   : Dokumen Perencanaan Objektif (0% Self-Claim, Kode Belum Diubah)
================================================================================

BAGIAN 1: AUDIT OBJEKTIF KONDISI SAAT INI (FAKTA APA ADANYA TANPA OVERCLAIM)
--------------------------------------------------------------------------------
Sebelum menulis satu baris kode pun untuk v3.0, berikut adalah fakta objektif
mengenai kondisi kode ReplyForge saat ini dibandingkan dengan aturan terbaru di
GUIDEBOOK-LOGICODIX-FINAL (1).pdf dan materi mentoring panitia:

1. Pelanggaran Aturan Guidebook Baru pada UI Saat Ini (Wajib Dihapus):
   - Di halaman utama web sekarang terpampang "MiroFish Buyer Simulation Studio"
     dan teks "Panel penguji otomatis untuk video demo LOGICODIX 2026".
   - Padahal Guidebook Hal. 21 & Hal. 27 secara tegas melarang:
     "Dilarang memakai slide, desain UI/UX, prototype Figma, mockup, animasi,
     SIMULASI, atau hasil yang direkayasa sebagai pengganti demonstrasi."
   - Menampilkan panel bernama "Simulator Demo Lomba" di dalam antarmuka utama
     membuat aplikasi terlihat seperti mainan/mockup lomba, bukan produk asli.

2. Pelanggaran Keamanan Kredensial (Guidebook Hal. 17 Bagian 5):
   - Di file web/src/App.tsx (baris 39) dan server/src/seed.js masih terdapat
     hardcoded API Key.
   - Guidebook Hal. 17 mewajibkan seluruh kredensial berada di .env (masuk ke
     .gitignore) dan menyediakan .env.example tanpa nilai asli.

3. Pelanggaran Riwayat Commit GitHub (Guidebook Hal. 14 & Hal. 16 Bagian 4):
   - Repo lokal saat ini memiliki commit tertanggal 24 Oktober & 31 Oktober 2026.
   - Guidebook Hal. 16 mewajibkan: "Repositori GitHub wajib dibuat setelah
     Hacking Kick-off (7 November 2026). Commit pertama dibuat setelah kick-off
     selesai. Seluruh commit wajib dibuat secara berkala selama Hacking Week
     (7 - 14 Nov 2026). Dilarang bulk upload di akhir periode."

4. Kekurangan Alur Produk Nyata (Belum Siap Pakai oleh Seller Sungguhan):
   - Belum ada halaman Login / Registrasi Toko & Akun Demonstrasi Juri.
   - Belum ada Onboarding Wizard yang memandu penjual baru (setelah install APK)
     untuk menghubungkan aplikasi Shopee Seller dan WhatsApp Business mereka.
   - Belum ada sistem Peringatan Anomali (Escalation Alert) ke penjual ketika
     calon pembeli bertanya aneh-aneh atau memesan jumlah barang tidak wajar.
   - Palet warna saat ini masih 100% biru-hitam gelap (#090D16 / #111827) dengan
     kotak warna-warni transparan (AI slop), belum diubah ke palet Dominan
     Kuning & Putih Cerah yang bersih.


================================================================================
BAGIAN 2: RANGKUMAN ATURAN BARU GUIDEBOOK FINAL & MATERI MENTORING PANITIA
================================================================================

A. TIMELINE KRITIS (GUIDEBOOK HAL. 6 & HAL. 14)
   - Hacking Kick-off & Pengerjaan : Sabtu, 7 Nov - Sabtu, 14 Nov 2026
   - Code Freeze & Batas Submission: Sabtu, 14 Nov 2026 pukul 23.59 WIB
   - Pengumuman Top 8 Finalis      : Sabtu, 21 Nov 2026
   - Technical Meeting Finalis     : Minggu, 22 Nov 2026
   - Grand Final Offline & Seminar : Minggu, 29 Nov 2026

B. BOBOT PENILAIAN RESMI (GUIDEBOOK HAL. 31)
   1. Kesesuaian Masalah & Solusi (Problem-Solution Fit) : 25%
   2. Inovasi & Implementasi Teknologi (Tech Innovation) : 25%
   3. Rekayasa Perangkat Lunak (Software Engineering)    : 25%
   4. Desain & Pengalaman Pengguna (UI/UX)               : 15%
   5. Etika & Keamanan Digital (Digital Ethics/Security) : 10%
   Total                                                 : 100%

C. KETENTUAN BARU VIDEO DEMO (GUIDEBOOK HAL. 20-22)
   - Durasi: Wajib 3 menit 00 detik s.d. 5 menit 00 detik (YouTube Unlisted/Public).
   - Penjelasan Suara / Voice-Over: SEKARANG DIPERBOLEHKAN ("Narasi, voice-over,
     atau teks penjelas bersifat opsional"). Kita wajib memakai Voice-Over
     yang jelas agar juri langsung paham nilai jual produk dalam 30 detik pertama.
   - Urutan Wajib di Video:
     1. Tampilan awal dan identitas aplikasi.
     2. Alur penggunaan fitur utama (input -> proses -> output).
     3. Pembuktian fungsi utama yang diklaim tim.
     4. Proses dan hasil integrasi AI secara langsung.
   - Larangan Mutlak: Dilarang memakai mockup/simulasi sebagai pengganti demo.
     Kita wajib menggunakan akun WhatsApp Business asli & akun Shopee Seller asli.

D. KETENTUAN BABAK GRAND FINAL OFFLINE (GUIDEBOOK HAL. 25 & HAL. 29)
   - Aplikasi wajib berjalan secara LOCALHOST di laptop tim saat Grand Final.
   - Alokasi waktu 15 menit per tim di depan juri industri:
     * 1 Menit : Persiapan laptop & Localhost Verification oleh panitia/juri.
     * 7 Menit : Presentasi & Live Demo aplikasi secara langsung.
     * 3 Menit : Tanya Jawab (Q&A) dengan dewan juri.
     * 4 Menit : Penilaian juri & transisi.

E. PENYELARASAN DENGAN PPT MENTORING PANITIA (Sesi_1_Dari_Masalah_ke_Produk_Software.pptx)
   Panitia menekankan 4 prinsip utama yang wajib tercermin langsung di produk kita:

   1. Kalimat Masalah Satu Baris (Slide 8):
      "[Siapa] perlu [apa], tapi [hambatan], sehingga [akibat]."
      Rumusan Resmi ReplyForge:
      "Penjual UMKM di WhatsApp Business dan Shopee perlu membalas chat, menjaga
      harga di atas modal (HPP), dan mencatat pesanan ke buku stok, tapi sekarang
      harus menyalin chat satu per satu dan mengecek stok manual di dua aplikasi,
      sehingga banyak pesanan terlewat, stok selisih (overselling), atau rugi
      karena salah hitung tawar-menawar."

   2. Pembagian Tugas Tegas: MODEL vs KODE vs MANUSIA (Slide 13):
      Juri akan menguji apakah tim menyerahkan semua hal ke AI (yang rawan salah
      hitung uang) atau membagi peran secara rekayasa perangkat lunak yang benar:
      - TUGAS MODEL (AI): Menafsirkan chat bebas yang berantakan, bahasa gaul/daerah,
        mengekstrak nama barang & jumlah, serta mendeteksi niat/intent pembeli.
      - TUGAS KODE (Deterministik 100% Pasti): Menghitung total harga Rupiah,
        memvalidasi batas minimal HPP (Harga Pokok Penjualan), memeriksa sisa
        stok di SQLite, memblokir kode OTP perbankan via Regex lokal, dan
        mendeteksi angka pesanan tidak wajar (Anomaly Threshold).
      - TUGAS MANUSIA (Penjual): Memegang keputusan berisiko tinggi—mengoreksi
        draf pesanan yang datanya belum lengkap, serta mengambil alih chat saat
        sistem mengirim Peringatan Anomali (pembeli tanya aneh-aneh atau beli
        dengan jumlah tidak wajar).

   3. Alur MVP Utuh & Penandaan Data Belum Jelas (Slide 22-23):
      "Bagian yang belum jelas ditandai, bukan ditebak."
      Jika pembeli chat: "Kak pesan stiker kucing 3 kayak biasa ya", sistem TIDAK
      boleh mengarang alamat/varian, melainkan membuat Draf Pesanan dengan label
      peringatan kuning: "Perlu Konfirmasi: Alamat pengiriman & varian belum jelas".

   4. Demo Wajib Menampilkan 1 Kasus Normal + 1 Kasus Sulit (Slide 25):
      - Kasus Normal: Chat pesanan & tawar-menawar wajar -> AI menjaga HPP ->
        pesanan tercatat & stok terpotong otomatis saat pembayaran masuk.
      - Kasus Sulit (Anomaly & Incomplete Data): Chat pembeli tidak lengkap,
        menanyakan hal aneh/mencurigakan, atau memesan jumlah tidak wajar
        (misal borong 200 pcs melebihi stok dan minta bayar tempo) -> Sistem
        menolak menebak, menjeda auto-reply untuk pembeli tersebut, dan langsung
        mengirim Notifikasi Peringatan (Escalation Alert) ke penjual.


================================================================================
BAGIAN 3: SISTEM DESAIN BARU (DOMINAN PUTIH & KUNING CERAH — ANTI-SLOP)
================================================================================
Menggantikan total palet hitam-biru lama (#090D16) dengan arsitektur visual
"Sunlit Warm Commercial" yang bersih, cerah, ramah UMKM, dan terinspirasi dari
standar kerapian getlayers.ai, Wise, dan Linear Light Mode.

1. PALET WARNA UTAMA (COLOR TOKENS)
   A. Permukaan & Latar (Dominan Putih Bersih & Krem Hangat Halus):
      - --bg-canvas        : #FAF8F5 (Warm Alabaster / Putih Gading sangat lembut
                             untuk latar belakang halaman agar mata tidak silau)
      - --bg-surface       : #FFFFFF (Pure Crisp White untuk kartu utama, tabel,
                             dan area kerja aplikasi)
      - --bg-elevated      : #FFFBEB (Warm Ivory / Kuning sangat muda 4% untuk
                             highlight baris aktif atau banner informasi)
      - --bg-muted         : #F4F4F0 (Warm Stone Gray untuk input field, pill
                             non-aktif, dan latar belakang sekunder)

   B. Warna Primary & Gradien (Kuning Cerah / Warm Amber Gold):
      - --primary-yellow   : #FACC15 (Vibrant Sun Yellow - Aksen utama brand,
                             indikator aktif, highlight utama)
      - --primary-amber    : #F59E0B (Rich Amber Gold - Untuk tombol CTA utama
                             dan border aksen agar kontras jelas di atas putih)
      - --primary-deep     : #D97706 (Deep Honey - Untuk teks aksen di atas latar
                             putih agar memenuhi standar kontras keterbacaan WCAG)
      - --gradient-brand   : linear-gradient(135deg, #FEF08A 0%, #FACC15 50%, #F59E0B 100%)
                             (Gradien kuning-emas cerah untuk elemen utama,
                             header aksen, dan tombol CTA primer dengan teks
                             gelap tegas #18181B)
      - --gradient-surface : linear-gradient(180deg, #FFFDF5 0%, #FFFFFF 100%)
                             (Gradien putih-kuning super lembut untuk header card)

   C. Warna Secondary & Tipografi (Kontras Tinggi di Atas Putih & Kuning):
      - --ink-primary      : #18181B (Deep Zinc Charcoal - Teks utama dan teks di
                             atas tombol kuning, kontras > 12:1)
      - --ink-secondary    : #52525B (Neutral Slate - Teks subjudul dan deskripsi)
      - --ink-muted        : #71717A (Muted Gray - Timestamp, SKU, meta label)
      - --border-subtle    : #E4E4E7 (Garis pemisah tipis 1px antar baris/seksi)
      - --border-warm      : #FDE68A (Border kuning lembut untuk kartu yang sedang
                             aktif / disorot)

   D. Warna Additional / Semantik (Hanya untuk Status & Channel):
      - --status-success   : #16A34A (Hijau tegas di atas latar #F0FDF4 untuk
                             status Lunas / Terhubung / Stok Aman)
      - --status-warning   : #EA580C (Oranye-Tembaga di atas latar #FFF7ED untuk
                             Stok Menipis / Draf Perlu Koreksi)
      - --status-danger    : #DC2626 (Merah tegas di atas latar #FEF2F2 untuk
                             Alert Pembeli Aneh / Jumlah Tidak Wajar / Blokir OTP)
      - --channel-shopee   : #EE4D2D (Badge kecil indikator chat Shopee Seller)
      - --channel-wa       : #15803D (Badge kecil indikator chat WhatsApp Business)

2. ATURAN TATA LETAK ANTI-SLOP (MENGIKUTI GETLAYERS.AI & OPENDESIGN)
   - Dilarang menumpuk kotak di dalam kotak (maksimal 1 level kartu putih #FFFFFF
     di atas kanvas #FAF8F5; item di dalam kartu dipisahkan dengan garis tipis
     1px solid #E4E4E7, bukan dibungkus kartu lagi).
   - Semua angka uang (Rp), stok, HPP, dan persentase wajib menggunakan
     font-variant-numeric: tabular-nums.
   - Hapus 100% tulisan "LOGICODIX 2026", "Studi Kasus", "Simulator", atau
     penjelasan teknis developer dari layar aplikasi. Aplikasi harus murni
     berbicara kepada Penjual UMKM.


================================================================================
BAGIAN 4: ARSITEKTUR PRODUK & USER FLOW LENGKAP (APK & WEB SELLER CENTER)
================================================================================
Agar aplikasi ini benar-benar layak rilis publik (Play Store / GitHub) dan tidak
terlihat seperti mockup, alur pengguna dibangun utuh dari pertama kali dibuka:

1. ALUR 1: LOGIN & AUTENTIKASI TOKO (WEB & APK)
   - Saat penjual membuka APK atau Web untuk pertama kali, tampil halaman Login
     & Registrasi Toko yang bersih (tema Putih-Kuning Cerah):
     * Input Email / Nomor HP Penjual & Password.
     * Tombol "Daftar Toko Baru" (bagi penjual yang baru pertama kali install).
     * Tombol Cepat "Masuk Akun Demo (Stickeria)" — Disediakan khusus di bawah
       form login sesuai kewajiban Guidebook Hal. 20 & Hal. 22 agar juri dapat
       masuk dalam 1 klik (kredensial juga dicantumkan di README.md).

2. ALUR 2: ONBOARDING & CARA KONEKSI KE SHOPEE SELLER & WHATSAPP BUSINESS
   Pertanyaan krusial: "Kalau seller download APK-nya, gimana cara dia masukin
   akunnya biar connect ke Shopee Seller atau WhatsApp Business?"

   Penjelasan Teknis & Alur Nyata di APK:
   Shopee dan WhatsApp Business memiliki proteksi anti-bot yang memblokir login
   tidak resmi (unofficial web scraping). Keunggulan utama arsitektur ReplyForge
   adalah "Zero-API OS Notification & RemoteInput Bridge". Artinya, penjual
   TIDAK PERLU menyerahkan password Shopee atau membayar sewa WhatsApp API.
   Begitu penjual selesai daftar/login di APK ReplyForge, mereka masuk ke
   "Wizard Koneksi Toko (3 Langkah)":

   - Langkah 1: Identitas & Rekening Toko
     Penjual mengisi Nama Toko (misal: Stickeria), Kategori Usaha, Nomor Rekening
     Tujuan Transfer, serta Jam Operasional Toko.

   - Langkah 2: Hubungkan WhatsApp Business & Shopee Seller di HP Ini
     Layar APK mendeteksi secara otomatis:
     a) Apakah aplikasi WhatsApp Business (com.whatsapp.w4b / com.whatsapp) dan
        Shopee (com.shopee.id) sudah terpasang di HP Android tersebut.
     b) Penjual memasukkan:
        - Nomor WhatsApp Business Toko (contoh: 0851-8325-0750)
        - Username Toko Shopee Seller (contoh: @linashop.id)
     c) Penjual menekan tombol kuning "Aktifkan Izin Baca & Balas Notifikasi".
        APK langsung membuka pengaturan resmi Android
        (android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).
        Begitu penjual mencentang "ReplyForge", aplikasi otomatis mendeteksi izin
        aktif dan mengubah status menjadi "Jembatan OS Aktif".

   - Langkah 3: Verifikasi & Uji Koneksi Langsung (Live Handshake)
     Penjual dapat menekan tombol "Cek Status Jembatan" atau mengirim 1 pesan
     tes ke WA Business/Shopee mereka. Begitu notifikasi pertama tertangkap oleh
     ReplyForgeNotificationService, status channel berubah menjadi:
     [TERHUBUNG - SIAP MEMBALAS OTOMATIS].
     (Seluruh status ini tersimpan di SQLite dan dapat diatur ulang kapan saja
     di menu "Pengaturan Koneksi Channel").

3. ALUR 3: MANAJEMEN KATALOG, HPP (MODAL), & ATURAN NEGOSIASI
   - Penjual dapat menambah/mengedit produk lengkap dengan:
     * Nama Produk, SKU, Harga Jual (Rp), HPP/Modal (Rp), Batas Diskon Maksimal,
       Stok Saat Ini, dan Batas Maksimal Pembelian Wajar per Transaksi
       (contoh: Max Order Wajar = 10 pcs).
   - Penjual juga bisa mengimpor file CSV/Excel katalog Shopee atau mengetik
     perintah cepat di kolom "Asisten Toko" (contoh: "Ubah stok Stiker Kucing
     jadi 45 pack").
   - Perhitungan batas harga tawar (HPP Guard) dikunci oleh KODE deterministik,
     sehingga AI tidak akan pernah menyetujui harga di bawah modal.

4. ALUR 4: KOTAK MASUK PINTAR, DRAF PESANAN, & DETEKSI ANOMALI (FITUR BARU WAJIB)
   Setiap ada chat masuk dari WhatsApp Business atau Shopee Seller, sistem
   menjalankan pipa pemrosesan 4 tahap (MODEL + KODE + MANUSIA):

   Tahap A - Perisai Privasi Lokal (KODE):
   - Jika pesan berisi kode OTP bank, PIN, atau mutasi rekening pribadi, pesan
     diblokir di HP (0 byte dikirim ke AI) dan dicatat di Log Privasi.

   Tahap B - Deteksi Anomali, Pertanyaan Aneh, & Jumlah Tidak Wajar (KODE + MODEL):
   - Sistem memeriksa 3 kondisi risiko tinggi sebelum membalas:
     1. JUMLAH TIDAK WAJAR (Unusual Quantity / Bulk Anomaly):
        Pembeli memesan jumlah barang yang melebihi stok tersedia ATAU melebihi
        ambang wajar per transaksi (misal stok 30 pcs, pembeli minta 150 pcs
        atau > 10 pcs batas wajar).
     2. PERTANYAAN ANEH / MENCURIGAKAN (Out-of-Scope / Suspicious Query):
        Pembeli menanyakan hal di luar konteks barang toko, meminta hutang/bayar
        belakangan di luar aturan, mengirim tautan mencurigakan, marah/komplain
        keras, atau mencoba memanipulasi instruksi AI.
     3. DATA PESANAN TIDAK JELAS (Incomplete Order - Sesuai PPT Mentoring Slide 23):
        Pembeli bilang "pesan kayak biasa ya kak" tanpa menyebut alamat/item jelas.

   Tahap C - Tindakan Eskalasi ke Penjual (Notifikasi & Jeda Otomatis):
   - Jika salah satu dari kondisi anomali di atas terdeteksi:
     * Auto-Pilot untuk pembeli tersebut LANGSUNG DIJEDA (Auto-Paused).
     * Sistem TIDAK menebak atau menyetujui pesanan secara sembarangan.
     * Muncul "Banner Peringatan Prioritas (Escalation Alert)" di bagian paling
       atas aplikasi HP (APK) dan Web Dashboard disertai bunyi/getar notifikasi
       ke penjual:
       Contoh Alert 1 (Jumlah Tidak Wajar):
       "PERINGATAN PESanan TIDAK WAJAR: @hendrik_88 meminta 120 pcs Gantungan
       Kunci Capybara (Stok tersedia: 30 pcs, Batas wajar: 10 pcs). Auto-reply
       dijeda otomatis. [Ambil Alih Chat] [Tolak Pesanan]"
       Contoh Alert 2 (Pertanyaan Aneh):
       "PERLU TINDAKAN PENJUAL: @user_99 mengirim pertanyaan di luar katalog /
       permintaan mencurigakan ('Bisa pinjam uang / bayar bulan depan?').
       Auto-reply dijeda. [Buka Chat]"
       Contoh Alert 3 (Data Kurang Lengkap):
       "DRAF PERLU DICEK: @rina_wati88 memesan 3x Stiker Kucing tetapi alamat
       ditulis 'kayak biasa'. Sistem menandai bagian kurang jelas untuk dikonfirmasi."

   Tahap D - Balasan Normal & Rekonsiliasi Stok Otomatis:
   - Jika chat wajar (tanya stok, tanya harga, nego wajar), AI menyusun balasan
     ramah sesuai harga & HPP toko, lalu mengirimkannya kembali ke pembeli via
     Android OS RemoteInput (atau menyiapkan draf 1-Tap jika dalam mode Copilot).
   - Saat notifikasi pembayaran Shopee masuk atau penjual menekan "Konfirmasi
     Pesanan" pada Draf Pesanan dari chat WA, KODE secara deterministik membuat
     data pesanan resmi dan memotong jumlah stok di SQLite secara real-time.


================================================================================
BAGIAN 5: STRATEGI KATEGORI, PEMBAGIAN PERAN TIM, & JADWAL GITHUB COMMIT
================================================================================

A. KEPUTUSAN KATEGORI & REPOSITORI (GUIDEBOOK HAL. 13, 16-22)
   - Aplikasi dibangun dalam 1 monorepo bersih yang memuat:
     1. `android-native-agent/` (APK Android Native + Hybrid UI untuk HP Penjual)
     2. `web/` (Antarmuka Web Seller Center & Mobile Viewport bertema Putih-Kuning)
     3. `server/` (Backend Node.js + SQLite deterministik + AI Gateway + SSE)
   - Seluruh API Key dikeluarkan dari kode dan dipindahkan ke `.env` (masuk ke
     `.gitignore`), dilengkapi `.env.example` yang bersih.
   - Untuk mematuhi aturan Guidebook Hal. 16 ("Repositori GitHub wajib dibuat
     setelah Hacking Kick-off 7 November 2026... Dilarang bulk upload di akhir
     periode"), kita membuat repositori GitHub publik baru untuk lomba dan
     mendorong (push) fitur secara bertahap dan nyata selama periode 9 - 14
     November 2026.

B. PEMBAGIAN PERAN TIM (SESUAI PPT MENTORING SLIDE 27-28)
   Mengikuti struktur resmi dari slide mentoring panitia:
   1. Product Manager & UI/UX Designer:
      - Merumuskan kalimat masalah, desain sistem Putih-Kuning Cerah (DESIGN.md),
        alur onboarding koneksi toko, wireframe layar, skenario demo, dan README.md.
   2. Backend Developer:
      - Membangun skema SQLite, endpoint autentikasi/onboarding, validasi KODE
        deterministik (HPP Guard, perhitungan total Rupiah, mutasi stok, deteksi
        kuantitas tidak wajar), serta perisai privasi OTP.
   3. Frontend Developer (Web & Mobile UI):
      - Membangun layar Login, Wizard Koneksi WA Business/Shopee, Kotak Masuk
        & Draf Pesanan (dengan penanda bagian kurang jelas & Escalation Alert),
        Manajemen Katalog/Stok, dan Buku Pesanan.
   4. AI & Android Engineer:
      - Membangun ReplyForgeNotificationService (OS NotificationListener &
        RemoteInput), ekstraksi teks bebas ke JSON terstruktur (chat -> draf),
        klasifikasi pertanyaan aneh/anomali, serta kompilasi APK.
   5. QA Engineer (Dirangkap Silang):
      - Menulis dan menjalankan automated test (Vitest) untuk kasus normal dan
        kasus sulit (anomali jumlah tidak wajar, chat tidak lengkap, blokir OTP).

C. JADWAL COMMIT & PUSH BERKALA (9 NOVEMBER - 14 NOVEMBER 2026)
   Setiap commit menggunakan awalan standar Guidebook Hal. 17 (`feat:`, `fix:`,
   `refactor:`, `style:`, `test:`, `docs:`) dan mencerminkan progres kerja nyata:

   - Gelombang 1 (Senin, 9 Nov 2026 - Fondasi, Database, & Keamanan .env):
     * `chore: initialize project workspace and environment configuration (.env.example)`
     * `feat(server): implement SQLite schema for store auth, catalog, orders, and alerts`
     * `feat(server): add deterministic HPP margin calculator and stock mutation engine`

   - Gelombang 2 (Selasa, 10 Nov 2026 - AI Parser, Anomaly Guard, & OTP Shield):
     * `feat(ai): implement free-text chat to structured order draft extractor`
     * `feat(engine): add anomaly detection for unusual order quantities and suspicious queries`
     * `feat(security): add client-side regex shield to block banking OTP notifications`

   - Gelombang 3 (Rabu, 11 Nov 2026 - Sistem Desain Putih-Kuning & Onboarding Toko):
     * `style(ui): implement sunlit yellow and crisp white design system tokens`
     * `feat(web): build seller login, demo account access, and 3-step channel connection wizard`
     * `feat(web): build catalog manager with HPP guard and max normal quantity threshold`

   - Gelombang 4 (Kamis, 12 Nov 2026 - Inbox Pintar, Draf Pesanan, & Escalation Alert):
     * `feat(ui): build unified inbox, order draft correction view, and seller anomaly alert banner`
     * `feat(web): implement real-time SSE synchronization between mobile agent and seller center`
     * `fix(ui): highlight incomplete buyer address and variant fields in order draft`

   - Gelombang 5 (Jumat, 13 Nov 2026 - Android Native Agent & Integrasi WA/Shopee Asli):
     * `feat(android): implement NotificationListenerService and RemoteInput reply bridge`
     * `feat(android): add OS permission status checker and live channel handshake test`
     * `test(web): add vitest suite covering normal checkout, bulk anomaly alert, and OTP block`

   - Gelombang 6 (Sabtu, 14 Nov 2026 sebelum 20.00 WIB - Final Polish, APK, & Docs):
     * `docs: complete README architecture diagram, AI transparency, and setup instructions`
     * `chore(release): build final production web bundle and signed debug APK before code freeze`
     (Catatan: Setelah commit terakhir ini, kita catat Commit Hash Final untuk
     form submission, lalu rekam video demo dari commit tersebut sebelum 23.59 WIB).


================================================================================
BAGIAN 6: RENCANA VIDEO DEMO 3-5 MENIT (DENGAN VOICE-OVER & AKUN ASLI)
================================================================================
Mengikuti aturan Guidebook Hal. 20-22 dan PPT Mentoring Slide 25 (Kasus Normal +
Kasus Sulit), video direkam utuh tanpa mockup/simulasi palsu, menggunakan:
- Sisi Kiri Layar : Layar HP Android fisik (via scrcpy) yang menjalankan APK
                    ReplyForge + WhatsApp Business asli + Shopee Seller asli.
- Sisi Kanan Layar: Browser Laptop (Web Seller Center ReplyForge).
- Audio           : Voice-Over (penjelasan suara) bahasa Indonesia yang lugas.

SUSUNAN ADEGAN & NASKAH VOICE-OVER (TOTAL DURASI TARGET: 4 MENIT 00 DETIK):

1. Menit 00:00 - 00:35 | Pembukaan, Masalah Nyata, & Identitas Aplikasi
   - Visual: Menampilkan halaman awal ReplyForge (Putih-Kuning Cerah), lalu masuk
     ke akun toko "Stickeria" dan memperlihatkan status koneksi WhatsApp Business
     & Shopee Seller yang sudah aktif melalui izin jembatan notifikasi Android.
   - Voice-Over: Menjelaskan kalimat masalah (penjual UMKM kewalahan menyalin
     chat pesanan dari WA Business & Shopee ke buku stok, rawan salah hitung
     tawar-menawar di bawah modal/HPP, dan rawan pesanan terlewat) serta cara
     seller menghubungkan akun mereka cukup dengan mengaktifkan izin jembatan
     notifikasi Android di APK tanpa perlu API berbayar.

2. Menit 00:35 - 01:45 | KASUS NORMAL 1: Tawar-Menawar (HPP Guard) & Rekonsiliasi Order
   - Visual:
     * Dari HP/akun pembeli kedua, kita kirim chat WhatsApp Business asli ke
       nomor WA Business toko: "Kak, Paket Stiker Kucing Gemoy 2 pack bisa
       kurang jadi 10rb per pack gak?"
     * Notifikasi WA Business muncul di bagian atas layar HP penjual.
     * APK ReplyForge menangkap notifikasi tersebut -> AI membaca maksud tawar
       -> KODE mengecek HPP (Harga Rp15.000, HPP Rp6.000, batas harga Rp15.000)
       -> Membalas otomatis lewat RemoteInput WA Business dengan sopan.
     * Pembeli membalas: "Oke kak deal 2 pack Stiker Kucing kirim ke Jl. Melati
       No. 10 Bandung, saya transfer BCA sekarang ya."
     * Di APK & Web Seller Center langsung terbentuk Draf Pesanan rapi (Item:
       2x Paket Stiker Kucing, Total Rp30.000 dihitung oleh KODE, Alamat lengkap).
     * Begitu dikonfirmasi / notifikasi pesanan Shopee Seller masuk, stok Stiker
       Kucing otomatis berkurang dari 50 menjadi 48 pack secara real-time di HP
       dan di Web Seller Center.

3. Menit 01:45 - 03:00 | KASUS SULIT & ANOMALI (Sesuai PPT Mentoring Slide 23 & 25)
   - Visual:
     * Adegan A (Pesanan Tidak Lengkap): Pembeli chat "Kak pesan Gantungan Kunci
       Capybara 3 pcs kirim ke rumah kayak biasa ya."
       -> Sistem TIDAK menebak alamat. Sistem membuat draf dan memberi penanda
       kuning: "Data Belum Lengkap: Alamat pengiriman belum jelas, tanyakan ke
       pembeli."
     * Adegan B (Jumlah Tidak Wajar & Pertanyaan Aneh -> Escalation Alert):
       Calon pembeli mengirim chat: "Kak saya mau borong Griptok Bunga 250 pcs
       sekarang juga tapi bayarnya bulan depan ya, bisa gak?"
       -> KODE mendeteksi kuantitas 250 pcs jauh melampaui stok (25 pcs) dan
       batas wajar (10 pcs), serta MODEL mendeteksi permintaan pembayaran tidak
       wajar.
       -> Auto-reply untuk pembeli ini LANGSUNG DIJEDA OTOMATIS.
       -> Di layar HP Penjual (APK) dan Web Dashboard langsung muncul Banner
       Peringatan Merah/Kuning: "PERINGATAN PESANAN TIDAK WAJAR (250 pcs > Stok
       25 pcs & Permintaan Tempo). Auto-Pilot Dijeda — Klik untuk Ambil Alih."
       Penjual mengklik "Ambil Alih Manual" untuk menangani langsung.

4. Menit 03:00 - 03:40 | Perisai Privasi OTP Lokal & Efisiensi Green Cache
   - Visual:
     * Sebuah pesan berisi kode OTP Bank ("Kode OTP BCA Anda 849201. Jangan
       berikan kepada siapa pun") masuk ke HP penjual.
     * Sistem langsung memblokir notifikasi tersebut secara lokal di HP (0 byte
       dikirim ke AI) dan menampilkannya di tab Keamanan & Privasi.
     * Menampilkan metrik penghematan token (0ms Local Cache untuk pertanyaan
       stok berulang).

5. Menit 03:40 - 04:00 | Penutup & Ringkasan Dampak
   - Visual: Rekap Buku Pesanan yang rapi, stok terkini yang sinkron antara HP
     dan Web, serta halaman informasi transparansi AI & atribusi.
   - Voice-Over: Penutup singkat bahwa ReplyForge membagi tugas secara presisi:
     AI menafsirkan chat berantakan, Kode menjaga hitungan uang & stok 100%
     akurat, dan Penjual memegang kendali penuh atas keputusan berisiko.


================================================================================
BAGIAN 7: PROTOKOL BABAK GRAND FINAL OFFLINE (15 MENIT DI DEPAN JURI)
================================================================================
Sesuai Guidebook Hal. 25 & Hal. 29, babak final dilaksanakan secara luring
(offline) dengan kewajiban aplikasi berjalan di LOCALHOST laptop tim:

1. Menit ke-1 (Persiapan Laptop & Localhost Verification - 60 Detik):
   - Kabel USB HP Android fisik (yang berisi APK ReplyForge, WA Business, dan
     Shopee Seller) sudah tertancap ke laptop.
   - Jalankan 1 file `START_REPLYFORGE_FINAL.bat` yang otomatis:
     a) Menjalankan `adb reverse tcp:8088 tcp:8088`
     b) Menyalakan server backend & frontend di `http://localhost:8088`
     c) Membuka jendela `scrcpy` di separuh kiri layar dan browser `localhost:8088`
        di separuh kanan layar dalam waktu < 10 detik.
   - Juri dapat langsung memverifikasi URL `localhost:8088` dan koneksi fisik ADB.

2. Menit ke-2 s.d. ke-8 (7 Menit Presentasi & Live Demo Interaktif):
   - Menit 1-2: Pitching masalah nyata UMKM & arsitektur pembagian tugas
     (Model vs Kode vs Manusia) + keunggulan Zero-API OS Notification Bridge.
   - Menit 3-5: Juri dipersilakan mengirim chat langsung (atau anggota tim kedua
     mengirim chat dari HP kedua) ke nomor WhatsApp Business / Shopee toko:
     * Uji coba 1: Nego harga di bawah HPP -> dibalas otomatis di layar HP.
     * Uji coba 2: Pesan jumlah tidak wajar (misal 500 pcs) atau tanya aneh ->
       langsung memicu bunyi & banner Escalation Alert di layar penjual.
   - Menit 6-7: Konfirmasi draf pesanan & pembuktian pemotongan stok SQLite
     secara real-time + demonstrasi blokir OTP lokal.

3. Menit ke-9 s.d. ke-11 (3 Menit Q&A Dewan Juri):
   - Siap menjawab pertanyaan juri dengan bukti langsung dari kode dan aplikasi:
     * "Bagaimana kalau AI salah hitung harga?" -> Dijawab: AI dilarang menghitung
       uang; harga total, batas HPP, dan sisa stok dihitung 100% oleh KODE
       deterministik di server/src/engine/.
     * "Bagaimana cara penjual awam menghubungkan WA/Shopee?" -> Ditunjukkan
       langsung Wizard Koneksi 3 Langkah di APK (cukup aktifkan izin notifikasi
       Android, tanpa token API).
     * "Bagaimana kalau pembeli menipu atau pesan borongan fiktif?" -> Ditunjukkan
       fitur Anomaly & Escalation Guard yang langsung menjeda AI dan memanggil
       penjual.
================================================================================
