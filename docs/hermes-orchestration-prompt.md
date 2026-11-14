# Prompt Orkestrasi Commit — ReplyForge Final Window

Dokumen ini adalah naskah copy-paste untuk operator/agen yang menjalankan commit akhir.
Jadwal acuan: `docs/hermes-commit-schedule.md` (21:35–22:56 WIB, 14 November 2026).

> **Catatan:** pada mesin pengembangan, eksekusi dijalankan otomatis oleh
> `scripts/auto_scheduler.py` + `scripts/commit_plan.json` (lokal, tidak di-commit).
> Naskah di bawah adalah prosedur manual yang setara jika scheduler tidak tersedia.

---

## 1. Aturan keras (jangan dilanggar)

1. Jangan pernah memakai `GIT_AUTHOR_DATE`, `GIT_COMMITTER_DATE`, atau `git commit --date`.
   Guidebook Hal. 14 melarang manipulasi tanggal commit. Waktu commit = jam sistem asli.
2. Jangan `git push --force`, `git rebase`, `git commit --amend` pada commit yang sudah di-push,
   atau `git reset --hard` pada riwayat publik.
3. Jangan `git add .`. Stage hanya berkas yang tercantum pada batch.
4. Jangan commit: `.env`, `*.apk`, `*.db`, `node_modules/`, `web/dist/`, `android-native-agent/app/build/`,
   screenshot scratch, atau nomor pribadi `nomor pribadi pemilik (disembunyikan)`.
5. Satu batch = satu pesan Conventional Commits yang menjelaskan perubahan nyata.
6. Kalau build/test gagal, perbaiki dulu; jangan commit kode yang tidak dikompilasi.

---

## 2. Urutan eksekusi manual

```bash
# 0. Pastikan berada di working tree final
cd C:/Users/User/replyforge_work
git status --short
git log --oneline -3

# 1. Per batch: cek jam, stage, commit dengan identitas modul
date "+%Y-%m-%d %H:%M:%S %z"          # harus menunjukkan slot yang benar
git add -A -- <path-batch>
git diff --cached --stat              # review
git -c user.name="royaldinan" -c user.email="ferdinandmanroe12@gmail.com" \
    commit -m "feat(db): bind orders to chat threads and stop seeding api credentials"

# 2. Ulangi untuk 10 batch sesuai tabel di docs/hermes-commit-schedule.md

# 3. Setelah batch terakhir
git status --short                    # harus bersih
git log --format='%h %ad %an %s' --date=iso -12
```

Pembagian identitas:

| Modul | Author | Email |
|---|---|---|
| Android core / release | `royaldinan` | `ferdinandmanroe12@gmail.com` |
| AI, service, server | `Abyan Nur Zaky` | `abyanurzaky@gmail.com` |
| UI Android & Web | `Farrel Basayev` | `deluxebirth@gmail.com` |
| Dokumentasi & QA | `Alex` | `alex1a67@users.noreply.github.com` |

---

## 3. Merge, tag, dan push

```bash
# Simpan pekerjaan malam ini di branch kerja
git branch -f final-hardening HEAD

# Gabungkan ke main tanpa menulis ulang riwayat
git checkout main
git merge --no-ff final-hardening -m "chore(release): merge final hardening for logicodix submission"
# Jika ada konflik: selesaikan dengan konten final dari branch final-hardening, lalu
#   git add <file> && git commit --no-edit

# Verifikasi isi main == isi branch final
git diff final-hardening --stat        # harus kosong

git tag -a v6.0.0-logicodix-final -m "LOGICODIX 2026 final submission"
git push origin main
git push origin v6.0.0-logicodix-final
```

Kalau push ditolak karena divergen: **jangan** force push. Buat branch baru
(`git push origin final-hardening`) dan gunakan branch itu sebagai tautan submission,
lalu beri tahu ketua tim.

---

## 4. Gerbang verifikasi sebelum submission

```bash
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
cd android-native-agent && ./gradlew.bat assembleDebug --console=plain
adb install -r app/build/outputs/apk/debug/app-debug.apk

cd ../web && npm run build
cd ../server && npm test
cd .. && git status --short
```

Lulus jika:
- `BUILD SUCCESSFUL` dan APK terpasang di Infinix.
- `npm run build` sukses, `npm test` hijau.
- `git status` bersih dan `git log` menunjukkan 10 commit baru + merge + tag.
- Tidak ada kredensial di `git grep -nE 'AQ\.|sk-|apiKey.*=.*[A-Za-z0-9]{16}'`.
