# Jadwal Commit Real-Time — Final Hardening Window (14 Nov 2026)

**Proyek:** ReplyForge (`id.replyforge.agent` + Web Seller Center localhost)
**Kompetisi:** LOGICODIX 2026 — Subtema 3: Local MSME & Creative Economy
**Tanggal:** Sabtu, 14 November 2026
**Jendela commit malam ini:** 21:35 – 22:56 WIB (batas keras submission 23:59 WIB)
**Baseline publik:** `origin/main` = `79ee26b`
**Eksekutor:** `scripts/auto_scheduler.py` (lokal, tidak di-commit)

---

## 1. Kenapa jadwal ini berubah

Jadwal lama (10:35–17:20 WIB) **tidak dipakai** karena pekerjaan final baru selesai malam ini.
Yang berlaku sekarang adalah jadwal nyata di bawah: 10 batch atomic, jeda 9 menit,
berakhir 22:56 WIB supaya masih ada ±1 jam untuk merge, tag, video, dan portal submission.

**Tidak ada manipulasi waktu.** Commit dijalankan dengan jam sistem asli (`+07:00 WIB`).
`GIT_AUTHOR_DATE`, `GIT_COMMITTER_DATE`, `--date`, `--force`, `rebase`, dan `squash` dilarang.

---

## 2. Aturan eksekusi

1. Satu batch = satu unit kerja yang kohesif (fitur/fix/dokumen), bukan `git add .`.
2. Pesan commit wajib Conventional Commits: `feat|fix|docs|style|chore(scope): ...`.
3. Commit dibuat setelah pekerjaan nyata di file tersebut selesai — bukan commit kosong.
4. Identitas author mengikuti modul: Android core (Ferdinand), AI/service (Abyan),
   UI/Web (Farrel), dokumentasi/QA (Alex).
5. Berkas rahasia (`.env`, API key, nomor pribadi `nomor pribadi pemilik (disembunyikan)`) tidak boleh masuk staging.
6. Merge ke `main` dilakukan setelah batch terakhir, dengan `--no-ff`, tanpa menulis ulang riwayat.
7. Tag rilis `v6.0.0-logicodix-final` dibuat setelah merge dan verifikasi build bersih.

---

## 3. Tabel batch malam ini

| Jam (WIB) | Author | Pesan commit | Cakupan berkas | Alasan nyata |
|---|---|---|---|---|
| 21:35 | `royaldinan` | `feat(db): bind orders to chat threads and stop seeding api credentials` | `ReplyForgeDb.java` | Orders butuh `thread_id` (DB v3) agar potong stok bisa dicek per percakapan; seed API key dihapus. |
| 21:44 | `Abyan Nur Zaky` | `fix(ai): use whole-word intent matching and drop the single-product guess` | `ReplyForgeAiEngine.java` | Kata "pesanan" tidak lagi dianggap perintah "pesan"; chat umum tidak lagi ditebak sebagai stiker kucing. |
| 21:53 | `royaldinan` | `feat(chat): product-picker checkout, one-shot stock deduction, and real shopee launch` | `ChatDetailActivity.java`, `ChatMessageAdapter.java` | Dialog Shopee pakai dropdown katalog; tombol terkunci setelah tercatat; label draf vs auto-reply. |
| 22:02 | `Abyan Nur Zaky` | `fix(android): keep shopee replies as drafts and never send them in background` | `ReplyForgeNotificationService.java` | Shopee tidak lagi mengirim RemoteInput otomatis; manual reply Shopee hanya menyalin draf. |
| 22:11 | `royaldinan` | `fix(orders): give shopee leads stable ids and hide threads that are already resolved` | `MainActivity.java` | ID lead tidak lagi bertabrakan dengan ID order; lead yang sudah lunas/batal hilang dari daftar. |
| 22:20 | `Farrel Basayev` | `style(ui): separate whatsapp autopilot from shopee smart copilot labels and polish resources` | `AndroidManifest.xml`, `res/**`, adapter & service lain | Label kanal benar (Autopilot vs Smart Copilot), resource & layout final. |
| 22:29 | `Farrel Basayev` | `feat(web): make localhost a phone-frame mirror of the apk with shopee draft actions` | `web/src/**`, `web/.env.example` | Localhost hanya 4 tab dalam frame HP, tanpa panel simulator; aksi draf Shopee nyata. |
| 22:38 | `Abyan Nur Zaky` | `fix(server): align store seed with stickeria and enforce shopee draft-only pipeline` | `server/src/seed.js`, `engine/gateway.js`, `engine/pipeline.js` | Seed web = Stickeria/SeaBank/1 SKU; pipeline Shopee tidak membuat order & tidak menyebut rekening. |
| 22:47 | `Alex` | `docs(repo): synchronize readme, localhost sop, video script, and commit schedule` | `README.md`, `docs/**`, `HANDOVER_LOGICODIX_2026.md` | Dokumentasi submission disamakan dengan implementasi final. |
| 22:56 | `Alex` | `chore(repo): remove legacy webview bundle and refresh analysis artifacts` | `assets/dist`, `graphify-out`, artefak desain | APK native murni; tidak ada bundle WebView lama yang menyesatkan. |

---

## 4. Setelah batch terakhir (22:56 – 23:30)

1. `git checkout main && git merge --no-ff backup-v4-complete` (selesaikan konflik dengan konten final).
2. Verifikasi: `git diff backup-v4-complete --stat` harus kosong.
3. `git tag -a v6.0.0-logicodix-final -m "LOGICODIX 2026 final submission"`.
4. Push `main` + tag ke `origin` (fast-forward, tanpa force).
5. Rebuild APK dari commit final, lalu rekam video demo dari APK tersebut.
6. Isi portal submission sebelum 23:59 WIB dengan commit hash final.

---

## 5. Verifikasi kepatuhan

```bash
git log --format='%h %ad %an %s' --date=iso -12
git status --short          # harus bersih setelah batch 10
git tag -l 'v6.0.0-logicodix-final'
git diff --cached --name-only | grep -Ei '\.env$|api[_-]?key|nomorpribadi'   # harus kosong
```

Kriteria lulus:
- 10 commit baru dengan pesan Conventional Commits dan timestamp 21:35–22:56 WIB asli.
- Working tree bersih; tidak ada file build/APK/database yang ikut ter-commit.
- Tidak ada kredensial atau nomor pribadi di seluruh diff.
