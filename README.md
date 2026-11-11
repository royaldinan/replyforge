# ReplyForge v3.0
### *Zero-API Autonomous Commerce, HPP Guard & Inventory Agent for Indonesian MSMEs*

**Kategori:** Mobile & Web Terintegrasi (Subtema 3: *Local MSME & Creative Economy* — LOGICODIX 2026)  
**Tim Pengembang:** Ferdinand Manurung (`royaldinan`)

---

## 1. Kalimat Masalah & Solusi (Problem-Solution Fit)

**Rumusan Masalah Nyata UMKM:**
> *"Penjual UMKM di WhatsApp Business dan Shopee perlu membalas chat pelanggan, menjaga harga tawar di atas modal (HPP), dan mencatat pesanan ke buku stok, tapi sekarang harus menyalin chat satu per satu dan mengecek stok manual di dua aplikasi, sehingga banyak pesanan terlewat, stok selisih (overselling), atau rugi karena salah hitung tawar-menawar."*

**Arsitektur Pembagian Tugas: MODEL vs KODE vs MANUSIA**
1. **TUGAS MODEL (AI):** Menafsirkan chat bebas yang berantakan dari pembeli (singkatan, bahasa daerah/santai, negosiasi) menjadi struktur draf pesanan dan klasifikasi intent.
2. **TUGAS KODE (Deterministik 100% Pasti):** Menghitung total harga Rupiah, memvalidasi batas minimal HPP (Harga Pokok Penjualan), memotong & mengembalikan stok SQLite secara atomik, memblokir notifikasi kode OTP perbankan secara lokal di perangkat (0 byte ke AI), serta mendeteksi jumlah pembelian tidak wajar (`max_order_normal`).
3. **TUGAS MANUSIA (Penjual):** Memegang keputusan berisiko tinggi—mengonfirmasi draf pesanan yang alamatnya belum lengkap (*"kirim kayak biasa"*), serta menerima **Notifikasi Peringatan Prioritas (Escalation Alert)** saat ada pembeli yang bertanya aneh/mencurigakan atau memesan jumlah barang yang tidak wajar.

---

## 2. Akun Demonstrasi & Alur Koneksi Toko (Wajib Juri)

Aplikasi menyediakan halaman **Autentikasi Akun Toko** serta **Tombol Masuk Cepat 1-Klik** untuk pengujian:
- **Email Akun Demo:** `owner@linashop.id`
- **Nomor WA Bisnis Demo:** `085183250750`
- **Kata Sandi Demo:** `linashop2026`
- **Nama Toko Demo:** `Lina Shop` (`@linashop.id` di Shopee Seller)

### Cara Penjual Menghubungkan Akun Shopee Seller & WhatsApp Business (3 Langkah di APK):
1. **Langkah 1 (Identitas & Rekening Toko):** Penjual mendaftarkan Nama Toko, Nomor WhatsApp Business, Username Shopee Seller, dan Rekening Bank tujuan pembayaran.
2. **Langkah 2 (Izin Jembatan Notifikasi OS Android):** Penjual memastikan aplikasi WhatsApp Business (`com.whatsapp.w4b`) dan Shopee (`com.shopee.id`) sudah login di HP Android mereka, lalu menekan tombol **"Buka Pengaturan Izin Notifikasi Android"** di dalam APK ReplyForge untuk mengaktifkan `ReplyForgeNotificationService` (`NotificationListenerService` & `RemoteInput`).
3. **Langkah 3 (Verifikasi Jembatan):** Penjual menekan tombol **"Kirim Pesan Tes Jembatan"** untuk memverifikasi bahwa notifikasi chat masuk langsung tertangkap dan siap dibalas otomatis tanpa biaya sewa API dan tanpa menyerahkan password akun marketplace.

---

## 🏗️ 2. Diagram Arsitektur Cross-Device Sync

```mermaid
flowchart TD
    subgraph AndroidDevice ["📱 Android OS Device (Infinix Note 40 — Lina Shop)"]
        NOTIF["Notification Posted\n(com.shopee.id / com.whatsapp.w4b)"]
        NLS["ReplyForgeNotificationService.java\n(NotificationListenerService)"]
        WHITELIST{"Strict Package Whitelist\n& Group Filter"}
        OTP_SHIELD{"Client-Side PII & OTP Shield\n(UU PDP Guard)"}
        REMOTE_INPUT["Autonomous RemoteInput Dispatcher\n(Zero Ban Risk)"]
        WEBVIEW["Mobile App Interface\n(WebView -> localhost:8088/?mobile=1)"]
        
        NOTIF --> NLS
        NLS --> WHITELIST
        WHITELIST -- "Group Chat" --> DROP["Silently Dropped"]
        WHITELIST -- "Valid App" --> OTP_SHIELD
        OTP_SHIELD -- "OTP Detected" --> DROP_OTP["🚫 Blocked On-Device (0 Bytes to Cloud)"]
        OTP_SHIELD -- "Safe Clean Text" --> ADB_REV["ADB Reverse Bridge\n(tcp:8088)"]
    end

    subgraph ReplyForgeEngine ["⚡ ReplyForge Localhost Core (Node.js & SQLite)"]
        WEBHOOK["POST /api/notification-webhook"]
        TELEMETRY["SSE Live Telemetry Stream\n(4-Node Visual Pipeline)"]
        CACHE{"Green Semantic Cache\n(On-Device Match?)"}
        PAYMENT_PARSER{"Shopee Payment Notif?\n(#2610259988LINA)"}
        INTENT_MEM[(buyer_intent_sessions\n@rina_wati88 -> 2x Stiker Kucing)]
        DEBOUNCE["3s Humanized Debounce Queue\n(Merge Fragmented Chat)"]
        DB[(node:sqlite Storage\nProducts | Rules | Orders | Cache)]
        GATEWAY["9Router AI Gateway\n(Port 20128: ag/gemini-3.8-flash-low)"]
        FALLBACK["Built-in Smart Local Engine\n(100% Offline Demo Fallback)"]
        
        ADB_REV --> WEBHOOK
        WEBHOOK --> TELEMETRY
        WEBHOOK --> PAYMENT_PARSER
        
        PAYMENT_PARSER -- "Shopee Payment Detected" --> INTENT_MEM
        INTENT_MEM -- "Match @rina_wati88" --> MUTATE_PAY["Auto Lunas & Potong Stok (-2 pcs)"]
        MUTATE_PAY --> DB
        
        PAYMENT_PARSER -- "Normal Chat" --> CACHE
        CACHE -- "Hit (0ms)" --> TELEMETRY
        CACHE -- "Miss" --> DEBOUNCE
        DEBOUNCE --> GATEWAY
        GATEWAY -- "Fail / Offline" --> FALLBACK
        GATEWAY -- "Success" --> OUTBOX["Android OS Outbox Queue"]
        FALLBACK --> OUTBOX
        CACHE -- "Hit" --> OUTBOX
    end

    OUTBOX --> ADB_REV
    ADB_REV --> REMOTE_INPUT
    REMOTE_INPUT --> NOTIF_REPLY["Delivered to Buyer Chat (0ms/3s Delay)"]
    WEBVIEW -.-> ADB_REV
```

---

## 🎯 3. Pemetaan Bobot Penilaian LOGICODIX 2026

| Kriteria Penilaian | Bobot | Pembuktian Konkret di ReplyForge |
|---|---|---|
| **Problem-Solution Fit** | **25%** | Mengatasi masalah sinkronisasi stok antara Shopee & WhatsApp secara *real-time* untuk toko aksesoris kreatif **"Lina Shop"** tanpa penjual harus mengetik tabel manual. |
| **Technology Innovation** | **25%** | Menggabungkan *OS-Level RemoteInput Interceptor*, *Buyer Intent Memory*, pencocokan notifikasi pembayaran Shopee Seller otomatis, dan *MiroFish Simulation Studio* dengan 3 skenario uji. |
| **Software Engineering** | **25%** | Native Android APK (`id.replyforge.agent`) dengan 60 FPS rendering, full hardware USB bridge (`adb reverse tcp:8088 tcp:8088`), *3-Second Debounce Queue*, Anti-Self-Reply Loop, dan built-in SQLite database. |
| **UI/UX Design** | **15%** | Didesain setara Linear Mobile & Wise: 4 Tab Mobile App (Chat, Stok & AI, Transaksi, Sistem), `tabular-nums` untuk angka Rupiah & stok, kurva animasi Emil Kowalski `cubic-bezier(0.22, 1, 0.36, 1)`, dan notifikasi Sonner. |
| **Green IT & Ethics** | **10%** | **Green IT:** *On-Device Semantic Cache* menjawab pertanyaan berulang dalam 0ms tanpa komputasi cloud, menghemat emisi karbon (gCO2e). **Ethics:** *Client-Side OTP Shield* memblokir 100% kebocoran kode perbankan sesuai UU PDP (0 bytes ke cloud). |

---

## ⚡ 4. 3 Cara Input Database Produk Instan
1. **Chat / Voice AI Natural Language:** Penjual cukup mengetik atau bicara:  
   *"Masukin data Lina Shop: Paket Stiker Kucing Gemoy stok 50 harga 15 ribu HPP 6 ribu, Gantungan Kunci Capybara stok 30 harga 25 ribu HPP 12 ribu. Kalau ada yang tanya pengiriman bilang dikirim hari yang sama maksimal jam 4 sore."* $\rightarrow$ AI langsung mengubahnya menjadi entri database produk SQLite dan aturan balasan otomatis!
2. **Upload Template Excel / CSV Shopee:** Tombol 1-klik untuk mengimpor file daftar produk ekspor Shopee secara instan.
3. **Vision Screenshot Scanner:** Multimodal scanner untuk memindai tangkapan layar etalase toko.

---

## 💬 5. 6 Preset Template Bahasa Admin Olshop Indonesia Asli (Anti-AI-Slop)
1. **Stok Ready:** `"Halo kak {nama_pembeli}! Untuk {produk} saat ini masih ready {stok} pcs ya kak, harganya Rp{harga}. Mau diamankan berapa pcs nih kak? 😊"`
2. **Stok Habis:** `"Halo kak, maaf banget untuk {produk} kebetulan baru aja habis 😭 Kalau kakak mau, ada {produk_alternatif} yang masih ready stok. Mau dicek dulu kak?"`
3. **Tawar Harga (Nego / HPP Guard):** `"Wah maaf banget kak {nama_pembeli}, untuk {produk} udah harga pas terbaik di Rp{harga} ya kak 🙏 Ambil minimal {min_grosir} pcs baru bisa dapat potongan grosir kak!"`
4. **Jadwal Kirim (Cutoff):** `"Siap kak! Kalau pesanan masuk sebelum jam {jam_cutoff} sore ini, langsung kita ikutkan pengiriman hari ini juga ya 🚚"`
5. **Konfirmasi Pesanan Chat:** `"Siap kak {nama_pembeli}! Pesanan {produk} sebanyak {qty} pcs (Total: Rp{total_harga}) udah kami catat ya ✅ Silakan lanjut checkout/pembayaran kak!"`
6. **Pembayaran Diterima (Auto-Lunas):** `"Terima kasih kak {nama_pembeli}! Pembayaran untuk pesanan {order_id} udah terkonfirmasi lunas ya ✅ Paket kakak segera kami proses kirim!"`

---

## 🚀 6. Panduan Menjalankan di Localhost & HP Android (< 30 Detik)

### Prasyarat
- Node.js versi 22+ (menggunakan fitur bawaan `node:sqlite`).
- Android SDK Platform-Tools (`adb`).

### Langkah 1: Jalankan Server Localhost (Laptop)
```bash
cd replyforge/server
node src/index.js
```
Aplikasi langsung berjalan di `http://localhost:8088`.

### Langkah 2: Hubungkan HP Android Fisik via ADB
```bash
# 1. Reverse port 8088 agar HP dapat mengakses localhost laptop
adb reverse tcp:8088 tcp:8088

# 2. Pasang APK native
adb install -r android-native-agent/app/build/outputs/apk/debug/app-debug.apk

# 3. Izinkan Notification Listener Service (Bypass Restricted Settings)
adb shell appops set id.replyforge.agent ACCESS_RESTRICTED_SETTINGS allow
adb shell cmd notification allow_listener id.replyforge.agent/id.replyforge.agent.ReplyForgeNotificationService
adb shell pm grant id.replyforge.agent android.permission.POST_NOTIFICATIONS
adb shell dumpsys deviceidle whitelist +id.replyforge.agent

# 4. Buka aplikasi di layar HP
adb shell am start -n id.replyforge.agent/.MainActivity
```

---

## 🧪 7. 3 Skenario Simulasi MiroFish (Grand Final Demo)
1. **Simulasi Alur Lengkap Pembeli 1 (`@rina_wati88`):**  
   Step 1: Chat tanya stok & nego $\rightarrow$ Step 2: Deal pesan 2 pack di chat $\rightarrow$ Step 3: Masuk Notifikasi Pembayaran Shopee Seller (`#2610259988LINA dari rina_wati88`) $\rightarrow$ Transaksi otomatis LUNAS di Tab Transaksi dan stok Paket Stiker Kucing Gemoy berkurang `-2 pack` secara real-time di HP dan laptop!
2. **Simulasi Pembeli Langsung Checkout (`@budi_silent`):**  
   Notifikasi pesanan Shopee baru `#2610257766SILENT` masuk $\rightarrow$ langsung tercatat di Transaksi Masuk dengan tombol 1-Tap Tautkan.
3. **Simulasi Swarm / Ramai Pembeli (MiroFish Stress Test):**  
   Menguji *3-Second Debounce* (chat burst `"P"`, `"Kak"`, `"Ready?"`), *0ms Green Cache Hit*, dan pemblokiran otomatis SMS Kode OTP Bank (0 bytes sent to AI).
