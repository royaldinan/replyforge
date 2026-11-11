import type { ChannelId, Tone } from '../ui';

/* ------------------------------------------------------------------ */
/* Percakapan (data contoh — sama seperti versi lama, belum ada API)   */
/* ------------------------------------------------------------------ */

export type ThreadStatus = 'deal' | 'checkout' | 'inquiry';

export interface TextMessage {
  id: string;
  kind: 'text';
  from: 'buyer' | 'ai' | 'admin';
  text: string;
  time: string;
  /** Balasan ini dijaga AI agar harga tidak turun di bawah HPP. */
  guard?: boolean;
}

export interface EventMessage {
  id: string;
  kind: 'event';
  title: string;
  detail: string;
  badge?: string;
  time: string;
}

export type ChatMessage = TextMessage | EventMessage;

export interface Thread {
  id: string;
  name: string;
  handle: string;
  channel: ChannelId;
  unread: number;
  itemIntent: string;
  status: ThreadStatus;
  messages: ChatMessage[];
}

export const THREAD_STATUS: Record<ThreadStatus, { label: string; tone: Tone }> = {
  deal: { label: 'Deal', tone: 'emerald' },
  checkout: { label: 'Checkout langsung', tone: 'sky' },
  inquiry: { label: 'Bertanya', tone: 'neutral' },
};

export const INITIAL_THREADS: Thread[] = [
  {
    id: 'rina_wati88',
    name: 'Rina Wati',
    handle: '@rina_wati88',
    channel: 'shopee',
    unread: 1,
    itemIntent: 'Paket Stiker Kucing Gemoy (2 pack)',
    status: 'deal',
    messages: [
      {
        id: 'rina-1',
        kind: 'text',
        from: 'buyer',
        time: '10:14',
        text: 'Halo kak, Paket Stiker Kucing Gemoy masih ready? Bisa kurang jadi 12rb gak kak?',
      },
      {
        id: 'rina-2',
        kind: 'text',
        from: 'ai',
        time: '10:14',
        guard: true,
        text: 'Wah maaf banget kak Rina, untuk Paket Stiker Kucing Gemoy udah harga pas terbaik di Rp15.000 ya kak 🙏 Ambil minimal 3 pack baru bisa dapat potongan grosir kak!',
      },
      {
        id: 'rina-3',
        kind: 'text',
        from: 'buyer',
        time: '10:16',
        text: 'Oke kak deal, saya ambil Paket Stiker Kucing Gemoy 2 pack ya. Mau bayar sekarang lewat Shopee.',
      },
      {
        id: 'rina-4',
        kind: 'event',
        time: '10:16',
        title: 'Pembayaran dikonfirmasi (#2610259988LINA)',
        detail: 'Stok Paket Stiker Kucing Gemoy otomatis berkurang di database toko.',
        badge: '-2 pack',
      },
    ],
  },
  {
    id: 'budi_01',
    name: 'Budi Santoso',
    handle: '@budi_01',
    channel: 'shopee',
    unread: 0,
    itemIntent: 'Direct Checkout',
    status: 'checkout',
    messages: [
      {
        id: 'budi-1',
        kind: 'event',
        time: '09:42',
        title: 'Pesanan #2610257766SILENT terkonfirmasi',
        detail: 'Pembeli checkout langsung tanpa chat. Tautkan ke produk lewat tab Transaksi.',
      },
    ],
  },
  {
    id: 'siti_khadijah',
    name: 'Siti Khadijah',
    handle: '@siti_khadijah',
    channel: 'whatsapp',
    unread: 0,
    itemIntent: 'Gantungan Kunci Capybara',
    status: 'inquiry',
    messages: [
      {
        id: 'siti-1',
        kind: 'text',
        from: 'buyer',
        time: '09:12',
        text: 'Halo kak, Gantungan Kunci Akrilik Capybara masih ready?',
      },
      {
        id: 'siti-2',
        kind: 'text',
        from: 'ai',
        time: '09:12',
        text: 'Halo kak Siti! Gantungan Kunci Akrilik Capybara 2 Sisi masih ready ya, harganya Rp25.000. Mau diambil berapa pcs kak?',
      },
      {
        id: 'siti-3',
        kind: 'text',
        from: 'buyer',
        time: '09:15',
        text: 'Bisa kirim hari ini kak?',
      },
      {
        id: 'siti-4',
        kind: 'text',
        from: 'ai',
        time: '09:15',
        text: 'Siap kak! Kalau pesanan masuk sebelum jam 4 sore ini, langsung kita ikutkan pengiriman hari ini juga ya 🚚',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Template balasan (teks persis seperti versi lama)                   */
/* ------------------------------------------------------------------ */

export interface Preset {
  id: string;
  label: string;
  desc: string;
  text: string;
}

export const PRESETS: Preset[] = [
  {
    id: 'ready',
    label: 'Stok Ready',
    desc: 'Info sisa stok & ajak beli',
    text: 'Halo kak {nama_pembeli}! Untuk {produk} saat ini masih ready {stok} pcs ya kak, harganya Rp{harga}. Mau diamankan berapa pcs nih kak? 😊',
  },
  {
    id: 'habis',
    label: 'Stok Kosong',
    desc: 'Tolak sopan & tawarkan alternatif',
    text: 'Halo kak, maaf banget untuk {produk} kebetulan baru aja habis 😭 Kalau kakak mau, ada {produk_alternatif} yang masih ready stok. Mau dicek dulu kak?',
  },
  {
    id: 'nego',
    label: 'Tawar Harga (HPP Guard)',
    desc: 'Jaga batas harga pas modal',
    text: 'Wah maaf banget kak {nama_pembeli}, untuk {produk} udah harga pas terbaik di Rp{harga} ya kak 🙏 Ambil minimal 3 pcs baru bisa dapat potongan grosir kak!',
  },
  {
    id: 'cutoff',
    label: 'Jadwal Pengiriman',
    desc: 'Batas order kirim hari yang sama',
    text: 'Siap kak! Kalau pesanan masuk sebelum jam {jam_cutoff} sore ini, langsung kita ikutkan pengiriman hari ini juga ya 🚚',
  },
  {
    id: 'konfirmasi',
    label: 'Konfirmasi Pesanan',
    desc: 'Ringkasan item, Qty, dan total',
    text: 'Siap kak {nama_pembeli}! Pesanan {produk} sebanyak {qty} pcs (Total: Rp{total_harga}) udah kami catat ya ✅ Silakan lanjut checkout/pembayaran kak!',
  },
  {
    id: 'lunas',
    label: 'Pembayaran Lunas',
    desc: 'Ucapan terima kasih & proses packing',
    text: 'Terima kasih kak {nama_pembeli}! Pembayaran untuk pesanan {order_id} udah terkonfirmasi lunas ya ✅ Paket kakak segera kami proses kirim!',
  },
];

/* ------------------------------------------------------------------ */
/* Input stok cepat                                                    */
/* ------------------------------------------------------------------ */

export const MOCK_CSV = [
  'sku,nama,harga,hpp,stok,unit',
  'STK-CAT-01,Paket Stiker Kucing Gemoy Vinyl Waterproof,15000,6000,50,pack',
  'KC-ACRYL-02,Gantungan Kunci Akrilik Capybara 2 Sisi,25000,12000,30,pcs',
  'GPT-FLW-03,Griptok HP Akrilik Bunga Daisy,20000,8000,25,pcs',
  'PC-HLD-04,Photocard Holder Plushie Kelinci Lucu,35000,18000,15,pcs',
].join('\n');

export const VOICE_SAMPLE =
  'Masukin data Lina Shop: Paket Stiker Kucing Gemoy stok 50 harga 15 ribu HPP 6 ribu, Gantungan Kunci Capybara stok 30 harga 25 ribu HPP 12 ribu. Kalau ada yang tanya pengiriman bilang dikirim hari yang sama maksimal jam 4 sore.';

export const COMMAND_EXAMPLES: Array<{ label: string; text: string }> = [
  { label: 'Update stok & harga', text: 'Paket Stiker Kucing stok 50 harga 15 ribu HPP 6 ribu' },
  { label: 'Aturan jam kirim', text: 'Kalau ada yang tanya pengiriman, bilang dikirim hari yang sama maksimal jam 4 sore' },
];
