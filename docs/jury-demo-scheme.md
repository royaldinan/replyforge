# Skema Demo di Depan Juri — LOGICODIX 2026 Grand Final

**Tim:** ReplyForge · **Kategori:** Mobile · **Subtema 3:** Local MSME & Creative Economy
**Total sesi:** 15 menit = 1 menit persiapan + 7 menit demo + 3 menit Q&A + 4 menit penilaian/transisi
**Prinsip:** tunjukkan produk yang benar-benar jalan, sebutkan batasannya, jangan mengklaim yang tidak ada.

---

## 1. Peta 7 Menit (pembagian per orang)

| Menit | Layar / Alat | Aksi | Yang dibuktikan | Pembicara |
|---|---|---|---|---|
| 0:00–0:40 | Laptop: `localhost:5173` | Buka mirror APK dalam frame HP, tunjukkan 4 tab dan katalog Stickeria | Web companion = kembaran aplikasi, bukan mockup | Farrel |
| 0:40–2:00 | HP Infinix | Kirim chat WA Business dari HP kedua → balasan otomatis muncul < 1 detik, pesanan tercatat, stok 50 → 48 | Autopilot WhatsApp end-to-end (notifikasi → AI lokal → RemoteInput → SQLite) | Abyan |
| 2:00–3:20 | HP Infinix | Buka chat Shopee → tunjukkan `● Smart Copilot` dan draf → tap **Buka & Balas di Shopee** → aplikasi Shopee terbuka | Kejujuran kanal: Shopee tidak dipaksa autopilot | Ferdinand |
| 3:20–4:10 | HP Infinix | Kembali, tap **Potong Stok** → pilih produk dari dropdown, qty 1 → stok 48 → 47 → tombol jadi **✓ Checkout Tercatat**; tap lagi, stok tidak berubah | Anti-duplikasi & integritas stok | Ferdinand |
| 4:10–5:00 | HP Infinix | Tab Stok: ketik `tambah 10 stiker kucing` → stok naik; impor CSV/Excel | Operasional gudang offline | Farrel |
| 5:00–5:40 | HP Infinix | Kirim pesan `.apk` scam + kata "pinjam" → label **Perlu Ditinjau**, AI tidak membalas; tunjukkan WhatsApp pribadi & OTP tidak masuk | Keamanan, privasi UU PDP, etika AI | Abyan |
| 5:40–6:30 | HP Infinix | **Cabut kabel USB**, kunci layar, kirim WA lagi → balasan tetap masuk | Zero-tethering: benar-benar mandiri di HP | Ferdinand |
| 6:30–7:00 | Laptop | Tunjukkan `git log` commit hash final + `Self-Test 8/8 PASS` | Orisinalitas & kualitas rekayasa | Alex |

**Aturan panggung:** satu orang memegang HP, satu orang memegang laptop, dua orang menjawab.
Jangan berebut kabel. Jangan buka aplikasi lain selain yang disebut.

---

## 2. Pemetaan ke Rubrik Penilaian

| Rubrik | Bobot | Bukti yang ditunjukkan | Kalimat kunci |
|---|---:|---|---|
| Kesesuaian Masalah & Solusi | 25% | Stickeria: satu admin, dua kanal, stok sering selisih. Demo WA + Shopee + stok | "Kami tidak membuat marketplace baru; kami membuat asisten yang bekerja di aplikasi yang sudah dipakai UMKM." |
| Inovasi & Implementasi Teknologi | 25% | NotificationListener + RemoteInput + AI lokal on-device + SQLite + fallback awan opsional | "Tanpa API berbayar, tanpa server yang harus menyala 24 jam." |
| Rekayasa Perangkat Lunak | 25% | APK native, DB v3 ber-`thread_id`, idempotensi stok, Self-Test 8/8, 60 test web | "Setiap potong stok terikat ke percakapan; tidak mungkin dobel." |
| Desain & Pengalaman Pengguna | 15% | 4 tab, label kanal jelas, dialog produk, bahasa Indonesia natural | "Penjual tidak perlu belajar dashboard baru." |
| Etika, Keamanan & Privasi | 10% | Blokir WA pribadi, OTP shield, tolak rekening di Shopee, API key tidak di repo | "Data sensitif tidak pernah meninggalkan perangkat." |

---

## 3. Bukti yang dibawa (folder `bukti-juri/`)

1. `app-debug.apk` dari commit final + `commit-hash.txt`.
2. Video demo YouTube (Unlisted) sesuai `docs/video-demo-script.md`.
3. `README.md` tercetak 1 halaman (arsitektur + cara jalan).
4. `docs/team-contributions.md` (pembagian 4 orang).
5. Log Self-Test `8/8 PASS` (screenshot).
6. `.env.example` (bukti tidak ada kredensial hardcoded).

---

## 4. Rencana Cadangan (wajib disiapkan)

| Risiko | Cadangan |
|---|---|
| Wi-Fi venue mati | Semua fitur inti berjalan offline (AI lokal + SQLite). Tunjukkan `localhost` dari build `dist` tanpa internet. |
| HP tidak terdeteksi laptop | APK sudah terpasang sebelum naik panggung; demo tidak butuh ADB. |
| Shopee memblokir / logout | Sudah login sebelum tampil; kalau gagal, tunjukkan rekaman 15 detik sebagai bukti, lalu lanjut ke kanal WA. |
| Pesan WA tidak masuk | Siapkan HP kedua dengan WA Business yang sudah terhubung; kirim manual. |
| Juri minta bukti kode | Buka `ReplyForgeDb.java` (thread_id + insertOrder) dan `ReplyForgeNotificationService.java` (shopee draft-only). |

---

## 5. Tanya-Jawab yang Paling Mungkin (jawab singkat, jujur)

**"Ini pakai API WhatsApp resmi?"**
Tidak. Kami membaca notifikasi WhatsApp Business lewat `NotificationListenerService` dan membalas lewat `RemoteInput`. Tidak ada token API, tidak ada biaya per pesan. Konsekuensinya: aplikasi harus terpasang di HP yang menerima notifikasi.

**"Kenapa Shopee tidak dibalas otomatis?"**
Notifikasi Shopee tidak menyediakan `RemoteInput`. Kami memilih jujur: AI menyiapkan draf, penjual yang mengirim. Memaksa balas otomatis berarti melanggar aturan marketplace dan berisiko banned.

**"Bagaimana mencegah stok dobel?"**
Setiap order Shopee disimpan dengan `thread_id`. Kalau percakapan itu sudah punya order `paid`/`cancelled`, tombol dikunci dan `insertOrder` menolak. Sudah diuji: tap kedua tidak mengubah stok.

**"Apakah AI-nya halusinasi harga?"**
Harga dan stok selalu dibaca dari SQLite, bukan dari model. Model hanya menyusun bahasa. Kalau kunci API kosong, seluruh jawaban dihasilkan mesin lokal deterministik.

**"Data pembeli aman?"**
Pesan WhatsApp pribadi dan OTP diblokir sebelum diproses. Tidak ada kredensial di repo. Server lokal hanya mendengarkan `127.0.0.1`.

**"Bisa dipakai toko lain?"**
Ya. Katalog diimpor dari CSV/Excel, nama toko, kota, cutoff, dan rekening diisi di Pengaturan. Stickeria hanya studi kasus.

---

## 6. Kalimat Penutup (30 detik)

"ReplyForge bukan chatbot yang menambah aplikasi baru. Ia bekerja di WhatsApp dan Shopee yang sudah dipakai jutaan UMKM, di HP yang sudah mereka punya, tanpa biaya API bulanan. Kami membuktikan bukan hanya balasan otomatis, tetapi juga stok yang tidak pernah dobel, data pribadi yang tidak bocor, dan sistem yang tetap hidup saat kabel dicabut. Terima kasih."
