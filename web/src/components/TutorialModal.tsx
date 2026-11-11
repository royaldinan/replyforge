import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  CheckCircle2,
  HelpCircle,
  Layers,
  MessageSquare,
  Package,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { Badge, Button, Card, Segmented, type SegmentedOption } from './ui';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  onOpenConnectWizard?: () => void;
}

type GuideTab = 'langkah' | 'menu' | 'aturan_ai' | 'cara_uji';

const GUIDE_TABS: SegmentedOption<GuideTab>[] = [
  { value: 'langkah', label: '1. Alur 3 Langkah' },
  { value: 'menu', label: '2. Fungsi Tiap Menu' },
  { value: 'aturan_ai', label: '3. Kapan AI Panggil Anda?' },
  { value: 'cara_uji', label: '4. Cara Pakai di HP' },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ open, onClose, onOpenConnectWizard }) => {
  const [tab, setTab] = useState<GuideTab>('langkah');

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Cara Pakai ReplyForge"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm animate-fade-in"
    >
      <Card padding="lg" className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border-amber-300 bg-surface shadow-pop">
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-line pb-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-zinc-950 shadow-gold">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-ink-1">Panduan Cara Pakai ReplyForge</h2>
                <Badge tone="amber">Ramah Pemula</Badge>
              </div>
              <p className="text-xs text-ink-3">
                Penjelasan langkah demi langkah agar Anda langsung paham alur kerja aplikasi di HP (APK) maupun di Laptop (Web).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan"
            className="interactive-tap grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-3 hover:bg-nested hover:text-ink-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Segmented
          value={tab}
          onChange={setTab}
          options={GUIDE_TABS}
          ariaLabel="Kategori panduan"
          size="sm"
          className="mb-4"
        />

        {tab === 'langkah' && (
          <div className="space-y-3.5">
            <div className="rounded-xl border border-amber-300 bg-elevated p-3.5">
              <p className="text-xs font-semibold leading-5 text-ink-1">
                Inti Kerja ReplyForge: Anda <strong>tidak perlu lagi menyalin chat pesanan satu-satu ke buku stok</strong> atau takut rugi karena pembeli menawar di bawah modal. Ikuti 3 langkah ini:
              </p>
            </div>

            <ol className="space-y-3">
              <li className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-400 text-xs font-extrabold text-zinc-950">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-ink-1">Hubungkan WhatsApp Business &amp; Shopee Seller</h3>
                  <p className="mt-0.5 text-xs leading-5 text-ink-2">
                    Klik tombol <strong>&ldquo;Koneksi WA &amp; Shopee&rdquo;</strong> di bagian atas. Pastikan aplikasi WhatsApp Business sudah login di HP Anda, lalu aktifkan <strong>Izin Akses Notifikasi Android</strong> untuk ReplyForge. Tidak perlu bayar sewa API dan tidak perlu menyerahkan password toko.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-400 text-xs font-extrabold text-zinc-950">
                  2
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-ink-1">Cek Stok &amp; Harga Modal (HPP) di Menu &ldquo;Stok &amp; Aturan&rdquo;</h3>
                  <p className="mt-0.5 text-xs leading-5 text-ink-2">
                    Masukkan daftar barang, <strong>Harga Jual</strong>, dan <strong>Harga Modal (HPP)</strong>. Anda bisa mengetik kalimat biasa (contoh: <em>&ldquo;Stiker Kucing stok 50 harga 15rb HPP 6rb&rdquo;</em>) atau impor Excel Shopee. Sistem mengunci harga modal agar AI tidak pernah setuju ditawar rugi.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-400 text-xs font-extrabold text-zinc-950">
                  3
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-ink-1">Biarkan Auto-Pilot Bekerja &amp; Cek Peringatan Penting Saja</h3>
                  <p className="mt-0.5 text-xs leading-5 text-ink-2">
                    Saat <strong>Auto-Pilot</strong> menyala, pertanyaan stok, ongkir, dan tawar-menawar wajar langsung dijawab otomatis lewat HP Anda. Anda cukup turun tangan jika muncul <strong>Banner Peringatan Merah/Kuning</strong> (ketika ada pembeli pesan jumlah tidak wajar, tanya aneh-aneh, atau alamat belum jelas).
                  </p>
                </div>
              </li>
            </ol>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              {onOpenConnectWizard ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Smartphone}
                  onClick={() => {
                    onClose();
                    onOpenConnectWizard();
                  }}
                >
                  Buka Pengaturan Koneksi WA &amp; Shopee
                </Button>
              ) : (
                <span />
              )}
              <Button variant="secondary" size="sm" onClick={() => setTab('menu')}>
                Lanjut: Lihat Fungsi Tiap Menu &rarr;
              </Button>
            </div>
          </div>
        )}

        {tab === 'menu' && (
          <div className="space-y-3">
            <p className="text-xs text-ink-2">
              Baik di tampilan <strong>Web Laptop</strong> maupun <strong>APK HP</strong>, aplikasi dibagi menjadi 4 menu utama yang rapi:
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-nested/40 p-3.5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-700" />
                  <h3 className="text-sm font-bold text-ink-1">1. Kotak Masuk &amp; Chat</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-ink-2">
                  Tempat melihat semua chat pelanggan dari WhatsApp Business &amp; Shopee. Jika Anda ingin membalas sendiri, klik tombol <strong>&ldquo;Ambil Alih Manual / Jeda AI&rdquo;</strong> lalu ketik balasan di bawah ruang chat.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-nested/40 p-3.5">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-700" />
                  <h3 className="text-sm font-bold text-ink-1">2. Stok &amp; Aturan (Stok &amp; AI)</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-ink-2">
                  Tempat menambah/mengurangi jumlah stok barang (`+` / `-`), mengatur harga modal HPP, mengimpor file Excel Shopee, dan memilih template gaya bahasa balasan admin toko.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-nested/40 p-3.5">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-amber-700" />
                  <h3 className="text-sm font-bold text-ink-1">3. Buku Pesanan (Transaksi)</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-ink-2">
                  Daftar pesanan yang otomatis tercatat dari chat pembeli atau notifikasi pembayaran Shopee. Jika pesanan dibatalkan, stok otomatis dikembalikan ke gudang.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-nested/40 p-3.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  <h3 className="text-sm font-bold text-ink-1">4. Keamanan &amp; Sistem</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-ink-2">
                  Melihat bukti bahwa SMS/WA kode OTP Bank Anda diblokir lokal di HP (tidak pernah bocor ke AI), statistik penghematan kuota AI (Green Cache), dan pengaturan mesin AI.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setTab('aturan_ai')}>
                Lanjut: Kapan AI Memanggil Penjual? &rarr;
              </Button>
            </div>
          </div>
        )}

        {tab === 'aturan_ai' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-300 bg-elevated p-3">
              <p className="text-xs leading-5 text-ink-1">
                <strong>Pembagian Tugas Pintar (Model AI + Kode + Manusia):</strong> AI hanya bertugas membaca chat yang tidak rapi. Urusan hitung uang dan stok dikunci oleh Kode program, sedangkan keputusan berisiko diserahkan ke Anda (Penjual).
              </p>
            </div>

            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50/70 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <div>
                  <strong className="font-bold text-emerald-950">Kondisi Normal (Ditangani Otomatis):</strong>
                  <p className="mt-0.5 text-ink-2">
                    Pembeli tanya stok, tanya jam kirim, atau menawar harga. Sistem mengecek batas HPP dan membalas otomatis tanpa mengganggu Anda.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50/80 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div>
                  <strong className="font-bold text-amber-950">Kondisi Alamat Kurang Jelas (Ditandai Kuning, Tidak Ditebak):</strong>
                  <p className="mt-0.5 text-ink-2">
                    Jika pembeli bilang <em>&ldquo;Pesan 3 pcs kirim ke rumah kayak biasa ya&rdquo;</em>, sistem membuat Draf Pesanan dengan label kuning <strong>&ldquo;Belum jelas: alamat pengiriman&rdquo;</strong> dan meminta pembeli mengonfirmasi alamat lengkapnya.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50/80 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                <div>
                  <strong className="font-bold text-red-950">Kondisi Anomali: Jumlah Tidak Wajar / Pertanyaan Aneh (AI Berhenti &amp; Panggil Penjual):</strong>
                  <p className="mt-0.5 text-ink-2">
                    Jika ada calon pembeli memesan jumlah tidak masuk akal (misal borong 250 pcs melebihi stok) ATAU bertanya aneh (minta hutang/bayar bulan depan, kirim file `.apk`/link mencurigakan), <strong>Auto-Reply langsung dijeda otomatis</strong> untuk pembeli tersebut dan muncul Banner Peringatan Merah di layar Anda.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        )}

        {tab === 'cara_uji' && (
          <div className="space-y-3 text-xs leading-5 text-ink-2">
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <h3 className="text-sm font-bold text-ink-1">Cara 1: Pakai Langsung dengan WhatsApp Business di HP Anda</h3>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                <li>Pastikan APK ReplyForge sudah terpasang di HP Android dan izin Akses Notifikasi sudah aktif.</li>
                <li>Gunakan HP kedua (atau minta teman) mengirim pesan WhatsApp ke nomor <strong>WhatsApp Business</strong> di HP Anda (contoh: <em>&ldquo;Halo kak, Paket Stiker Kucing Gemoy masih ready?&rdquo;</em>).</li>
                <li>Saat notifikasi WA Business muncul di bagian atas layar HP Anda, ReplyForge otomatis menangkapnya, memunculkan chat tersebut di <strong>Kotak Masuk</strong>, dan membalasnya otomatis!</li>
              </ol>
            </div>

            <div className="rounded-xl border border-line bg-nested/50 p-3.5">
              <h3 className="text-sm font-bold text-ink-1">Cara 2: Uji Coba Cepat Tanpa HP Kedua (Panel Simulasi di Bawah Kotak Masuk)</h3>
              <p className="mt-1">
                Jika Anda sedang di laptop dan ingin mencoba semua skenario (Nego HPP, Alamat Belum Jelas, Borong 250 pcs Tidak Wajar, Pertanyaan Aneh, atau Blokir OTP Bank) tanpa harus mengirim WA dari HP lain, klik bar <strong>&ldquo;Panel Uji Coba &amp; Simulasi Pesan Masuk&rdquo;</strong> di bagian bawah halaman Kotak Masuk.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="primary" size="sm" onClick={onClose}>
                Mengerti, Mulai Gunakan Aplikasi
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
