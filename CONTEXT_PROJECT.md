# KONTEKS PROJECT & REFERENSI DATA — REPLYFORGE (v4.0)

File ini adalah panduan konteks sistem dan referensi data aplikasi ReplyForge untuk developer atau AI agent eksternal. Silakan pelajari konteks ini dan gunakan kebebasan penuh untuk mendesain antarmuka dan pengalaman pengguna (UI/UX) sesuai standar anti-slop getlayers.ai dan Linear Mobile.

---

## 1. Tentang Aplikasi

ReplyForge adalah **Universal On-Device Agent** (Aplikasi Agen Otomasi Mandiri per Perangkat) untuk UMKM di Indonesia, yang dapat di-install pada ponsel Android pedagang online apa pun.

### Studi Kasus Resmi: "Toko Stickeria" (Stiker Vinyl & Merchandise Kreatif)
Untuk keperluan kompetisi **LOGICODIX 2026 Hackathon (Subtema 3: Local MSME & Creative Economy)**, ReplyForge didemonstrasikan dengan studi kasus live: **"Toko Stickeria"**, toko stiker die-cut vinyl tahan air asal Bandung, Jawa Barat. Katalog seed final berisi satu SKU aktif: `STK-CAT-01` (Paket Stiker Kucing Gemoy, Rp15.000, HPP Rp6.000, stok 50 pack).

### Masalah Utama yang Diselesaikan:
- Admin toko kewalahan membalas ratusan chat setiap hari di dua platform sekaligus: Shopee Seller dan WhatsApp Business.
- Pembeli sering menawar harga di bawah modal/HPP (Harga Pokok Penjualan).
- Stok barang sering tidak sinkron antara penjualan chat manual dan marketplace, memicu overselling.
- Pedagang menerima notifikasi sensitif (SMS perbankan, OTP) di perangkat yang sama, sehingga data sensitif harus dilindungi secara lokal (Client-Side OTP Shield).

### Mekanisme Teknis:
- **Zero-API Platform Integration:** Berjalan di ponsel Android menggunakan native Android OS `NotificationListenerService`. WhatsApp Business dibalas otomatis melalui `RemoteInput`; Shopee Seller tidak menyediakan `RemoteInput`, sehingga chat dicatat sebagai **lead** dan AI menyiapkan **draf Smart Copilot** yang dikirim penjual lewat tombol **`Buka & Balas di Shopee`** (0 token API resmi pihak ketiga, 0 risiko banned).
- **Dual Viewport:** Satu codebase web (React + Vite) melayani 2 konteks tampilan:
  1. Mobile App Mirror: tampilan default di `/` yang merupakan kembaran 1:1 aplikasi Android (4 tab: Chat, Stok & AI, Transaksi, Sistem). Bisa dibuka di browser HP maupun desktop.
  2. Desktop Studio: dashboard lengkap saat diakses dengan `?view=studio` (dev `http://localhost:5173/?view=studio`, produksi `http://localhost:8088/?view=studio`).
  Aplikasi Android sendiri adalah native Java (XML layouts), **bukan** WebView yang menembak localhost.
- **Side-by-Side Demo Verification:** Merekam layar OBS Studio berdampingan: Jendela Kiri (scrcpy HP fisik Infinix Note 40) dan Jendela Kanan (Dashboard Localhost Studio).

---

## 2. Katalog Resmi (Toko Stickeria)

1. `STK-CAT-01`: Paket Stiker Kucing Gemoy Vinyl Waterproof Lucu Anti Air Die Cut Isi 20 Pcs — Harga: Rp15.000, HPP: Rp6.000, Stok: 50 pack (Kapasitas: 100, batas order normal: 15)

Katalog seed final hanya memuat satu SKU ini. Produk tambahan dapat didaftarkan lewat Quick Command `tambah produk ...` atau diimpor dari katalog CSV/XLSX.

---

## 3. Struktur File & Lokasi Kode Tampilan

Path root web: `C:\Users\User\replyforge_work\web\`

| File | Fungsi |
|---|---|
| `src/App.tsx` | Komponen root. Default menampilkan mode mobile (kembaran APK); dashboard desktop aktif bila URL memakai `?view=studio`. Mengelola state global, polling data, dan SSE telemetry. |
| `src/components/MobileAppView.tsx` | Seluruh shell tampilan aplikasi versi mobile (Chat, Stok & AI, Transaksi, Sistem). |
| `src/components/mobile/` | Komponen modular tab mobile (AppHeader, BottomNav, InboxView, ThreadView, StockTab, OrdersTab, SystemTab). |
| `src/components/LiveInboxMonitor.tsx` | Panel monitor chat real-time + pengirim simulasi pesan pembeli. |
| `src/components/InventoryBarometer.tsx` | Panel stok, harga, HPP, dan penyesuaian stok. |
| `src/components/StoreStudio.tsx` | Dashboard desktop untuk pengelolaan katalog dan aturan toko. |
| `src/components/OrderLedger.tsx` | Tampilan ledger transaksi pesanan, lead Shopee, dan mutasi stok. |
| `src/components/TelemetryPipeline.tsx` | Visualisasi 4-node alur eksekusi pesan (Notifikasi masuk -> Guard/Filter -> Eksekusi AI -> Balasan/draf terkirim). |
| `src/components/GreenPrivacyGateway.tsx` | Tampilan log privasi (OTP terblokir) dan metrik efisiensi cache lokal. |
| `src/components/SellerAlertBanner.tsx` | Banner eskalasi untuk pesanan tidak wajar, pertanyaan aneh, atau alamat tidak lengkap. |
| `src/components/AuthModal.tsx`, `ChannelOnboardingModal.tsx`, `TutorialModal.tsx` | Modal login akun toko, wizard koneksi kanal WA/Shopee, dan panduan pemakaian. |
| `src/types.ts` | Definisi tipe data TypeScript. |

Path aplikasi Android Native: `C:\Users\User\replyforge_work\android-native-agent\`
- `app/src/main/java/id/replyforge/agent/MainActivity.java`: Activity native (XML layout) dengan 4 tab; tidak memuat WebView.
- `app/src/main/java/id/replyforge/agent/ReplyForgeNotificationService.java`: OS-level NotificationListenerService & RemoteInput hook.
- `app/src/main/java/id/replyforge/agent/ReplyForgeForegroundService.java`: Foreground service `dataSync` + restart otomatis.
- `app/src/main/java/id/replyforge/agent/ReplyForgeDb.java`: SQLite `replyforge.db` (produk, utas, pesan, pesanan, pengaturan).
- `app/src/main/java/id/replyforge/agent/ReplyForgeAiEngine.java`: mesin balasan hibrida, HPP Guard, normalisasi slang, anomali.
- `app/src/main/java/id/replyforge/agent/SelfTestActivity.java`: self-test 8 kasus inti + `ERROR_STATE`.
- `app/src/main/java/id/replyforge/agent/QuickCommandParser.java`: parser perintah gudang offline.
- `app/src/main/java/id/replyforge/agent/XlsxImporter.java`: impor katalog `.xlsx` native.

---

## 4. Standar Desain & Pedoman Anti-Slop (LOGICODIX 2026)

- **Zero Developer UI Leakage:** Jangan tampilkan istilah teknis internal (ADB port, 9Router Gemini, RemoteInput) di layar chat pembeli. Tempatkan hanya di tab Sistem atau di Desktop Studio.
- **Header Ringkas:** Satukan avatar/nama toko, status kanal Shopee, dan toggle `WA Auto` ke dalam satu baris header.
- **Rasio Chat Sehat:** Tingkatkan area baca pesan hingga 75% tinggi layar.
- **Tabular Figures:** Terapkan `font-variant-numeric: tabular-nums` pada seluruh harga Rupiah dan jumlah stok.
- **Affordance Tegas:** Tombol Takeover Manual wajib beraksen amber tegas dengan ikon pause yang jelas.
