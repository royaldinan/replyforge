# KONTEKS PROJECT & REFERENSI DATA — REPLYFORGE (v2.0)

File ini adalah panduan konteks sistem dan referensi data aplikasi ReplyForge untuk developer atau AI agent eksternal. Silakan pelajari konteks ini dan gunakan kebebasan penuh untuk mendesain antarmuka dan pengalaman pengguna (UI/UX) sesuai standar anti-slop getlayers.ai dan Linear Mobile.

---

## 1. Tentang Aplikasi

ReplyForge adalah **Universal On-Device Agent** (Aplikasi Agen Otomasi Mandiri per Perangkat) untuk UMKM di Indonesia, yang dapat di-install pada ponsel Android pedagang online apa pun.

### Studi Kasus Resmi: "Lina Shop" (Aksesoris Lucu & Merchandise Kreatif)
Untuk keperluan kompetisi **LOGICODIX 2026 Hackathon (Subtema 3: Local MSME & Creative Economy)**, ReplyForge didemonstrasikan dengan studi kasus live: **"Lina Shop"**, toko aksesoris yang menjual paket stiker vinyl lucu, gantungan kunci akrilik capybara, griptok bunga daisy, dan photocard holder plushie.

### Masalah Utama yang Diselesaikan:
- Admin toko kewalahan membalas ratusan chat setiap hari di dua platform sekaligus: Shopee Seller dan WhatsApp Business.
- Pembeli sering menawar harga di bawah modal/HPP (Harga Pokok Penjualan).
- Stok barang sering tidak sinkron antara penjualan chat manual dan marketplace, memicu overselling.
- Pedagang menerima notifikasi sensitif (SMS perbankan, OTP) di perangkat yang sama, sehingga data sensitif harus dilindungi secara lokal (Client-Side OTP Shield).

### Mekanisme Teknis:
- **Zero-API Platform Integration:** Berjalan di ponsel Android menggunakan native Android OS NotificationListenerService & RemoteInput (menangkap notifikasi chat Shopee/WA dan membalas otomatis tanpa token API resmi pihak ketiga, 0 risiko banned).
- **Dual Viewport:** Satu codebase web (React + Vite) melayani 2 konteks tampilan:
  1. Desktop Studio: Dashboard lengkap saat dibuka di browser laptop/PC (localhost:8088).
  2. Mobile App: Tampilan khusus layar HP saat diakses via URL `?mobile=1` (dimuat di dalam WebView Android native app).
- **Side-by-Side Demo Verification:** Merekam layar OBS Studio berdampingan: Jendela Kiri (scrcpy HP fisik Infinix Note 40) dan Jendela Kanan (Dashboard Localhost Studio).

---

## 2. Katalog Resmi 4 Produk (Lina Shop)

1. `STK-CAT-01`: Paket Stiker Kucing Gemoy Vinyl Waterproof — Harga: Rp15.000, HPP: Rp6.000, Stok: 50 pcs (Kapasitas: 100)
2. `KC-ACRYL-02`: Gantungan Kunci Akrilik Capybara 2 Sisi — Harga: Rp25.000, HPP: Rp12.000, Stok: 30 pcs (Kapasitas: 60)
3. `GPT-FLW-03`: Griptok HP Akrilik Bunga Daisy — Harga: Rp20.000, HPP: Rp8.000, Stok: 25 pcs (Kapasitas: 50)
4. `PC-HLD-04`: Photocard Holder Plushie Kelinci Lucu — Harga: Rp35.000, HPP: Rp18.000, Stok: 15 pcs (Kapasitas: 30)

---

## 3. Struktur File & Lokasi Kode Tampilan

Path root web: `C:\Users\User\replyforge\web\`

| File | Fungsi |
|---|---|
| `src/App.tsx` | Komponen root. Mendeteksi parameter `?mobile=1` untuk menentukan mode Desktop Studio atau Mobile App. Mengelola state global. |
| `src/components/MobileAppView.tsx` | Seluruh shell tampilan aplikasi versi mobile (Chat, Stok & AI, Transaksi, Sistem). |
| `src/components/mobile/` | Komponen modular tab mobile (AppHeader, InboxView, ThreadView, StockTab, OrdersTab, SystemTab). |
| `src/components/StoreStudio.tsx` | Tampilan dashboard desktop untuk pengelolaan katalog dan aturan toko. |
| `src/components/OrderLedger.tsx` | Tampilan ledger transaksi pesanan dan mutasi stok. |
| `src/components/TelemetryPipeline.tsx` | Tampilan visualisasi alur eksekusi pesan (Notifikasi masuk -> Guard/Filter -> Eksekusi AI -> Reply terkirim). |
| `src/components/GreenPrivacyGateway.tsx` | Tampilan log privasi (OTP terblokir) dan metrik efisiensi cache lokal. |
| `src/components/BuyerSimulator.tsx` | Simulator interaktif untuk menguji alur tawar-menawar pembeli. |
| `src/components/MiroFishSimulator.tsx` | Panel pengujian skenario stres / demo split-screen. |
| `src/types.ts` | Definisi tipe data TypeScript. |

Path wrapper Android Native: `C:\Users\User\replyforge\android-native-agent\`
- `app/src/main/java/id/replyforge/agent/MainActivity.java`: Membuka WebView mengarah ke `http://127.0.0.1:8088/?mobile=1`.
- `app/src/main/java/id/replyforge/agent/ReplyForgeNotificationService.java`: OS-level NotificationListenerService & RemoteInput hook.

---

## 4. Standar Desain & Pedoman Anti-Slop (LOGICODIX 2026)

- **Zero Developer UI Leakage:** Jangan tampilkan istilah teknis internal (ADB port, 9Router Gemini, RemoteInput) di layar chat pembeli. Tempatkan hanya di tab Sistem atau di Desktop Studio.
- **Header Ringkas (56px):** Satukan avatar, nama toko, platform switcher, dan toggle Auto-Pilot ke dalam satu baris.
- **Rasio Chat Sehat:** Tingkatkan area baca pesan hingga 75% tinggi layar.
- **Tabular Figures:** Terapkan `font-variant-numeric: tabular-nums` pada seluruh harga Rupiah dan jumlah stok.
- **Affordance Tegas:** Tombol Takeover Manual wajib beraksen amber tegas dengan ikon pause yang jelas.
