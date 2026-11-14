# Panduan Standar Operasional (SOP): Verifikasi Localhost 1 Menit Grand Final
**Kompetisi:** Logicodix 2026 (Subtema 3: Local MSME & Creative Economy)  
**Sistem:** ReplyForge (Web Seller Center + Android Native Agent `id.replyforge.agent`)  
**Referensi Regulasi:** Guidebook Logicodix 2026 Halaman 23 (Babak Final Offline) & Halaman 27 (Alokasi Waktu Final Pitching)

---

## 1. Latar Belakang & Regulasi Guidebook (Hal. 23 & Hal. 27)

Berdasarkan ketentuan resmi **Guidebook Logicodix 2026 Halaman 23 dan Halaman 27**, setiap tim finalis yang berlaga pada Babak Grand Final Offline wajib mematuhi protokol verifikasi teknis langsung di hadapan Dewan Juri Industri sebelum sesi presentasi dimulai:

1. **Alokasi Waktu Sesi Final (Total 15 Menit per Tim, Guidebook Hal. 27):**
   - **1 Menit Persiapan & Verifikasi Localhost:** Menyalakan server lokal (`localhost`) dan menyiapkan perangkat fisik.
   - **7 Menit Pitching & Live Demo:** Presentasi masalah, arsitektur solusi, dan demonstrasi produk nyata tanpa mockup.
   - **3 Menit Tanya Jawab (Q&A):** Pengujian interaktif oleh Dewan Juri.
   - **4 Menit Penilaian Juri & Transisi:** Juri mengisi rubrik; tim membereskan meja.
2. **Kewajiban Eksekusi Localhost (Anti-Mockup & Orisinalitas):**
   - Seluruh komponen aplikasi wajib terbukti dapat dikompilasi dan dijalankan langsung dari kode sumber pada mesin lokal (`http://localhost:5173` untuk Web Seller Center dan build lokal APK untuk agen Android).
   - Penggunaan prototipe Figma, video rekaman yang disamarkan sebagai demo langsung, atau halaman statis berujung pada pembatalan nilai demonstrasi.

Dokumen ini menjadi panduan taktis detik demi detik agar tim menyelesaikan verifikasi dalam waktu kurang dari 60 detik dengan tingkat keberhasilan 100%.

---

## 2. Timeline Eksekusi 60 Detik (1-Minute Prep Window)

| Rentang Detik | Penanggung Jawab | Aksi Taktis di Meja Final | Target Output Visual |
| :--- | :--- | :--- | :--- |
| **Detik 00 - 15** | Operator Laptop | Buka Terminal 1 pada root repositori, jalankan perintah start Web Seller Center (`cd web && npm run dev`). | Terminal menampilkan `Local: http://localhost:5173/`. |
| **Detik 15 - 30** | Operator Laptop | Buka browser ke `http://localhost:5173`. Halaman default adalah **kembaran APK dalam frame HP**: 4 tab (Chat, Stok & AI, Transaksi, Sistem) dengan katalog Stickeria. Tidak ada panel simulator di tampilan ini. | Mirror HP terbuka bersih, tanpa error konsol. |
| **Detik 30 - 45** | Operator Mobile | Buka APK ReplyForge di HP Infinix (`id.replyforge.agent`), tunjukkan tab Chat dengan label `WhatsApp Autopilot · Shopee Copilot`. | MainActivity tampil; dua kanal terlihat jelas. |
| **Detik 45 - 60** | Presenter & Operator | **Cabut kabel USB dari laptop** di hadapan juri, angkat kabel, kunci layar HP. Kirim satu chat WhatsApp Business dari HP kedua; tunjukkan balasan otomatis masuk. | Juri melihat bukti kemandirian native (zero-tethering) sebelum menit pertama berakhir. |

---

## 3. Urutan Perintah Terminal (Step-by-Step Commands)

Seluruh perintah dijalankan dari direktori kerja utama `C:\Users\User\replyforge_work`.

### 3.1 Menjalankan Web Seller Center (`http://localhost:5173`)

Gunakan **Terminal 1** untuk menyalakan server pengembangan Vite:

**Bash / Command Prompt / Git Bash:**
```bash
cd web && npm run dev
```

**Windows PowerShell (5.1):**
```powershell
Set-Location -LiteralPath "C:\Users\User\replyforge_work\web"; if ($?) { npm run dev }
```

**Indikator Keberhasilan:**
- Vite mengikat alamat `http://localhost:5173` (serta host jaringan `0.0.0.0:5173` sesuai `web/vite.config.ts`).
- Buka `http://localhost:5173` di browser. Pastikan katalog toko **Stickeria** (`STK-CAT-01` seharga Rp15.000, rekening SeaBank `901483182051`) tampil seketika.

*(Catatan Pra-Panggung: Jalankan `npm run build` di ruang tunggu sebelum dipanggil ke panggung untuk memastikan kompilasi TypeScript dan bundel produksi keluar dengan kode `exit 0`.)*

### 3.2 Kompilasi & Instalasi Android Native Agent (`id.replyforge.agent`)

Gunakan **Terminal 2** untuk memvalidasi build Gradle dan memasang APK ke perangkat fisik (Infinix X6853):

**Bash / Command Prompt:**
```cmd
cd android-native-agent && .\gradlew.bat assembleDebug
```

**Windows PowerShell (5.1):**
```powershell
Set-Location -LiteralPath "C:\Users\User\replyforge_work\android-native-agent"; if ($?) { .\gradlew.bat assembleDebug }
```

**Lokasi Output APK:**
```text
C:\Users\User\replyforge_work\android-native-agent\app\build\outputs\apk\debug\app-debug.apk
```

**Instalasi & Peluncuran Cepat via ADB:**
```powershell
# 1. Pastikan perangkat fisik terdeteksi dan berstatus 'device'
adb devices

# 2. Pasang ulang APK debug dengan mempertahankan data lokal (-r)
adb install -r "C:\Users\User\replyforge_work\android-native-agent\app\build\outputs\apk\debug\app-debug.apk"

# 3. Aktifkan izin Notification Listener Service (opsional jika belum aktif)
adb shell cmd notification allow_listener id.replyforge.agent/id.replyforge.agent.ReplyForgeNotificationService

# 4. Buka layar utama ReplyForge di perangkat fisik
adb shell am start -n id.replyforge.agent/.MainActivity
```

---

## 4. Pembuktian Kemandirian Native (Zero-Tethering Demonstration)

Salah satu poin pembeda utama ReplyForge di hadapan Dewan Juri adalah arsitektur **100% Standalone On-Device Native Agent**. Agen tidak bergantung pada jembatan ADB, script Python di laptop, maupun server cloud eksternal saat memproses transaksi UMKM.

Ikuti prosedur pembuktian ini tepat setelah instalasi selesai (Detik ke-45 hingga masuk sesi Pitching):

1. **Cabut Fisik Kabel USB:**
   - Lepaskan kabel USB-C dari HP Infinix X6853 secara terbuka di depan mata Dewan Juri.
   - Letakkan kabel di atas meja untuk membuktikan tidak ada koneksi data kabel antara laptop dan ponsel.
2. **Tunjukkan Status Layanan Latar Belakang:**
   - Tarik panel notifikasi HP ke bawah dan perlihatkan notifikasi persisten dari `ReplyForgeForegroundService` (`foregroundServiceType="dataSync"`).
   - Hal ini membuktikan agen tetap hidup di level sistem operasi Android meskipun aplikasi tidak sedang dibuka di layar depan.
3. **Demonstrasi Pemrosesan Pesanan & Auto-Reply Offline:**
   - Kirim pesan uji atau jalankan skenario transaksi pelanggan untuk produk **Stickeria (`STK-CAT-01`, Rp15.000)**.
   - Tunjukkan bahwa `ReplyForgeNotificationService` menangkap notifikasi masuk, memvalidasi pesan melewati *Privacy Gate* (memblokir pesan pribadi non-order) serta *Anomaly Classifier* (mendeteksi ancaman file `.apk` berbahaya dan bukti transfer palsu), lalu membalas otomatis dan memotong stok di database SQLite lokal (`/data/data/id.replyforge.agent/databases/replyforge.db`).
4. **Eksekusi Quick Command & In-App Self-Test Tanpa Komputer:**
   - Buka tab **Stok**, ketik perintah cepat offline seperti `/stok STK-CAT-01 +10` atau `/harga STK-CAT-01 15000`, dan tunjukkan perubahan angka stok terjadi instan di SQLite lokal.
   - Buka tab **Pengaturan -> Jalankan Self-Test** (`SelfTestActivity`). Tekan tombol uji di layar ponsel dan perlihatkan hasil **8/8 Core Cases PASS + ERROR_STATE PASS** yang dieksekusi murni di dalam proses Android (*in-process*).

---

## 5. Checklist Troubleshooting Darurat (Emergency Mitigation)

Jika terjadi kendala teknis selama 60 detik persiapan di panggung, jalankan langkah pemulihan instan berikut (waktu eksekusi < 10 detik per kasus):

### Kasus A: Port `5173` Sibuk / Collision (`EADDRINUSE`)
Jika proses Vite sebelumnya masih menggantung di latar belakang sehingga port `5173` terkunci:

**Opsi 1 (One-Liner via NPX):**
```powershell
npx kill-port 5173; npm run dev
```

**Opsi 2 (Native Windows PowerShell Tanpa Internet):**
```powershell
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
npm run dev
```

**Opsi 3 (Netstat + Taskkill Klasik):**
```cmd
netstat -ano | findstr :5173
taskkill /PID <NOMOR_PID> /F
npm run dev
```

**Opsi 4 (Fallback Port Darurat):**
Jika port 5173 dikunci oleh layanan sistem Windows, jalankan pada port alternatif dan informasikan kepada juri:
```powershell
npx vite --port 5174
```

### Kasus B: Status ADB `offline` atau `unauthorized`
Jika perintah `adb devices` menampilkan `offline`, `unauthorized`, atau daftar kosong saat kabel dicolokkan:

1. **Reset Server ADB Lokal (3 Detik):**
   ```powershell
   adb kill-server; if ($?) { adb start-server }; if ($?) { adb devices }
   ```
2. **Re-Otorisasi Kunci RSA di Ponsel:**
   - Cabut dan pasang kembali kabel USB pada port USB laptop yang berbeda (gunakan port USB 3.0 langsung di motherboard, hindari USB hub).
   - Buka kunci layar HP Infinix X6853, masuk ke **Pengaturan -> Opsi Pengembang (Developer Options)**.
   - Ketuk **Cabut otorisasi USB debugging (Revoke USB debugging authorizations)**, matikan lalu nyalakan kembali sakelar **USB Debugging**.
   - Centang **"Selalu izinkan dari komputer ini"** pada dialog pop-up yang muncul di layar HP, lalu tekan **Izinkan**.
3. **Beralih ke Mode Zero-Tethering Lebih Awal:**
   - Karena APK debug terbaru sudah terpasang di HP sebelum naik panggung, kegagalan kabel USB di meja juri tidak menghambat demo. Segera buka aplikasi ReplyForge langsung di layar HP dan lanjutkan demonstrasi mandiri.

### Kasus C: Notification Listener Tidak Merespons (Cache Binder OS Android)
Kadang sistem operasi Android menahan ikatan `NotificationListenerService` setelah instalasi ulang APK (`adb install -r`):

**Pemulihan via Terminal ADB (Saat Kabel Masih Terhubung):**
```powershell
adb shell cmd notification disallow_listener id.replyforge.agent/id.replyforge.agent.ReplyForgeNotificationService
adb shell cmd notification allow_listener id.replyforge.agent/id.replyforge.agent.ReplyForgeNotificationService
adb shell am startservice -n id.replyforge.agent/.ReplyForgeForegroundService
```

**Pemulihan Manual Tanpa Kabel (Langsung di Layar HP):**
1. Buka aplikasi **ReplyForge**, masuk ke tab **Pengaturan**.
2. Ketuk tombol **Pengaturan Akses Notifikasi** untuk membuka menu *Device & App Notifications* Android.
3. Pilih **ReplyForge**, matikan sakelar izin (**OFF**), tunggu 2 detik, lalu nyalakan kembali (**ON**) dan tekan **Izinkan (Allow)**.
4. Kembali ke aplikasi ReplyForge; indikator status layanan akan langsung berubah menjadi **Aktif**.
