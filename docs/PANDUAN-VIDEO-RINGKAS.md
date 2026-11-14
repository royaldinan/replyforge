# PANDUAN REKAM VIDEO — 1 HALAMAN (baca ini saja)

**Durasi target:** 4:25 (wajib 3:00–5:00). **Alat:** HP Infinix X6853 + perekam layar bawaan (1080p, 60fps).
**Nyalakan:** Opsi Pengembang → *Show Touches / Tampilkan Ketukan*.
**Jangan:** slide, Figma, mockup, atau hasil rekayasa. Semua harus dari APK yang benar-benar jalan.

---

## Persiapan 10 menit sebelum rekam

1. HP: buka ReplyForge → pastikan onboarding selesai, katalog `STK-CAT-01` stok **50 pack**.
2. HP kedua: siap kirim WhatsApp ke nomor toko **0851-8325-0750** (WA Business sudah login).
3. HP toko: buka Shopee Seller dan login. Buka WhatsApp Business dan login.
4. Laptop: buka `http://localhost:5173` (pakai `START-LOCALHOST.bat` kalau belum jalan).
5. Kabel USB: **jangan dicabut dulu**; nanti dicabut di menit 05:40.
6. Rekam dalam satu take. Kalau salah, ulangi dari awal segmen itu (boleh potong waktu tunggu saat edit).

---

## Urutan rekaman + kalimat yang dibacakan

### 0:00–0:30 — Pembuka (di layar, bukan slide)
**Aksi:** buka aplikasi ReplyForge, tunjukkan beranda `Stickeria` dan badge `● WhatsApp Autopilot · Shopee Copilot`.
**Baca:**
> "Halo Dewan Juri LOGICODIX 2026. Kami tim ReplyForge: Ferdinand, Abyan, Farrel, dan Alex. Ini aplikasi native yang berjalan langsung di HP Infinix ini, tanpa slide dan tanpa mockup. Mitra kami, Stickeria, setiap hari kewalahan membalas chat WhatsApp dan Shopee serta sering salah catat stok."

### 0:30–1:15 — WhatsApp Autopilot (kirim dari HP kedua)
**Aksi:** dari HP kedua kirim: *"Kak, Paket Stiker Kucing Gemoy masih ready? Harganya berapa?"* → tunjukkan notifikasi masuk → buka chat → balasan otomatis muncul < 1 detik.
**Baca:**
> "Pelanggan mengirim chat ke WhatsApp Business. ReplyForge menangkap notifikasi itu lewat Notification Listener, membaca katalog di SQLite lokal, dan membalas otomatis dalam waktu kurang dari satu detik. Tidak ada API berbayar, tidak ada server cloud. Harga dan stok selalu dibaca dari database, bukan dikarang oleh AI."

### 1:15–1:55 — Pesanan WhatsApp + stok turun
**Aksi:** HP kedua kirim *"Oke kak, saya pesan 2 pack ya"* → buka tab **Transaksi** (pesanan baru `reserved`) → buka tab **Stok** (50 → 48).
**Baca:**
> "Saat pembeli menyatakan pesanan, AI mengenali niat beli, menghitung total tiga puluh ribu rupiah, lalu mencatat pesanan di SQLite. Stok langsung berkurang otomatis dari lima puluh menjadi empat puluh delapan pack, tanpa admin mengetik apa pun."

### 1:55–2:35 — Shopee Smart Copilot (INI YANG PALING DITUNGGU JURI)
**Aksi:** buka chat Shopee Rina → tunjukkan label **`● Smart Copilot`** dan bubble **`Draf Copilot (belum terkirim)`** → tap **`🚀 Buka & Balas di Shopee`** → aplikasi Shopee Seller terbuka → kembali ke ReplyForge.
**Baca:**
> "Kanal kedua, Shopee, kami tangani dengan Smart Copilot yang jujur. Notifikasi Shopee tidak memberi tombol balas cepat, jadi kami tidak mengklaim autopilot. AI menyiapkan draf, penjual mengetuk Buka dan Balas di Shopee: draf tersalin dan aplikasi Shopee langsung terbuka."

### 2:35–3:20 — Potong stok sekali + tombol terkunci
**Aksi:** tap **`✓ Potong Stok`** → pilih produk dari dropdown → qty 1 → konfirmasi (48 → 47) → tunjukkan tombol berubah **`✓ Checkout Tercatat`** → tap sekali lagi (stok tetap 47).
**Baca:**
> "Setelah pembeli checkout, penjual menekan Potong Stok satu kali. Produk dipilih dari katalog, jumlah diisi sesuai pembayaran, stok turun tepat satu. Sistem mengikat pesanan ke percakapan ini, jadi tombol terkunci dan stok tidak mungkin terpotong dua kali walau ditekan berulang."

### 3:20–3:55 — Stok offline & impor Excel
**Aksi:** tab Stok → ketik `tambah 10 stiker kucing` → Eksekusi (47 → 57) → tap **Unduh Template** lalu **Impor CSV/Excel**.
**Baca:**
> "Untuk operasional gudang, penjual bisa mengetik perintah biasa seperti tambah sepuluh stiker kucing. Parser lokal menjalankannya tanpa internet. Katalog juga bisa diimpor massal dari Excel atau CSV."

### 3:55–4:15 — Keamanan & Self-Test
**Aksi:** kirim pesan berisi `tagihan.apk` → tunjukkan label **Perlu Ditinjau** dan AI tidak membalas → buka Pengaturan → Jalankan Self-Test → tunjukkan **8/8 PASS**.
**Baca:**
> "Pesan berisi file APK atau kata pinjaman tidak dibalas otomatis; langsung ditandai untuk ditinjau penjual. WhatsApp pribadi dan kode OTP diblokir di perangkat. Semua modul diuji lewat Self-Test delapan per delapan lulus."

### 4:15–4:25 — Zero-tethering + penutup
**Aksi:** **CABUT KABEL USB**, kunci layar, minta HP kedua kirim WA lagi → balasan tetap masuk. Buka kunci, tunjukkan layar.
**Baca:**
> "Kabel sudah dicabut. Aplikasi tetap membalas di latar belakang, cukup dari satu HP. ReplyForge memberi UMKM asisten penjualan yang aman, hemat biaya, dan bekerja dua puluh empat jam. Terima kasih."

---

## Setelah rekam

1. Cek durasi 3:00–5:00 dan suara jelas.
2. Upload YouTube → **Unlisted** → judul: `ReplyForge — Agen AI On-Device untuk UMKM (LOGICODIX 2026)`.
3. Salin link → isi **Langkah 2** di portal submission (video), baru **Langkah 3** terbuka (repo GitHub).
4. Repo: `https://github.com/royaldinan/replyforge` (pastikan Public).
5. Kalau ada yang gagal saat rekam: tampilkan apa adanya, jangan direkayasa. Juri menghargai batasan yang jujur.
