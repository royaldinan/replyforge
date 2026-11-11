// Case Study: "Lina Shop", Cute Accessories & Creative Merchandise Store selling on WhatsApp Business & Shopee.
export const SEED_PRODUCTS = [
  {
    sku: 'STK-CAT-01',
    name: 'Paket Stiker Kucing Gemoy Vinyl Waterproof',
    aliases: ['paket stiker kucing gemoy', 'stiker kucing gemoy', 'stiker kucing', 'sticker kucing', 'stiker vinyl', 'stiker gemoy', 'stiker', 'sticker', 'sticker cat', 'stiker cat'],
    unit: 'pack',
    price: 15000,
    hpp: 6000,
    stock: 50,
    capacity: 100,
    max_order_normal: 15,
  },
  {
    sku: 'KC-ACRYL-02',
    name: 'Gantungan Kunci Akrilik Capybara 2 Sisi',
    aliases: ['gantungan kunci akrilik capybara', 'gantungan kunci capybara', 'keychain capybara', 'gantungan kunci', 'keychain', 'capybara'],
    unit: 'pcs',
    price: 25000,
    hpp: 12000,
    stock: 30,
    capacity: 60,
    max_order_normal: 10,
  },
  {
    sku: 'GPT-FLW-03',
    name: 'Griptok HP Akrilik Bunga Daisy',
    aliases: ['griptok hp akrilik bunga daisy', 'griptok daisy', 'griptok bunga', 'griptok hp', 'griptok', 'popsocket daisy'],
    unit: 'pcs',
    price: 20000,
    hpp: 8000,
    stock: 25,
    capacity: 50,
    max_order_normal: 10,
  },
  {
    sku: 'PC-HLD-04',
    name: 'Photocard Holder Plushie Kelinci Lucu',
    aliases: ['photocard holder plushie kelinci', 'photocard holder kelinci', 'pc holder kelinci', 'pc holder plushie', 'photocard holder', 'pc holder'],
    unit: 'pcs',
    price: 35000,
    hpp: 18000,
    stock: 15,
    capacity: 30,
    max_order_normal: 5,
  },
];

export const SEED_RULES = [
  {
    name: 'Jadwal Kirim & Cutoff Hari Ini',
    triggers: ['kirim', 'pengiriman', 'dikirim', 'ongkir', 'kurir', 'jam cutoff', 'hari ini', 'kapan dikirim', 'jam berapa kirim', 'nyampe', 'sampe'],
    response:
      'Siap kak! Kalau pesanan masuk sebelum jam {jam_cutoff} sore ini, langsung kita ikutkan pengiriman hari ini juga ya 🚚 (JNE, J&T, SiCepat, Shopee Xpress)',
    source: 'seed',
  },
  {
    name: 'Nego Harga & Grosir (HPP Guard)',
    triggers: ['nego', 'kurang', 'diskon', 'potongan', 'murah', 'harga pas', 'kurangin', 'tawar', 'boleh kurang'],
    response:
      'Wah maaf banget kak {nama_pembeli}, untuk {produk} udah harga pas terbaik di Rp{harga} ya kak 🙏 Ambil minimal {min_grosir} pcs baru bisa dapat potongan grosir kak!',
    source: 'seed',
  },
  {
    name: 'Info Pembayaran & Rekening',
    triggers: ['bayar', 'transfer', 'rekening', 'cod', 'qris', 'pembayaran', 'bca'],
    response:
      'Untuk pembayaran Shopee bisa langsung lewat aplikasi kak (ShopeePay, SPayLater, COD). Untuk WhatsApp bisa transfer BCA 5271 8890 21 a.n. Lina Shop atau QRIS ya kak ✅',
    source: 'seed',
  },
];

// 6 Preset Template Bahasa Admin Olshop Indonesia Asli (no-ai-slop)
export const PRESETS = [
  {
    id: 'ready',
    name: 'Stok Ready',
    triggers: ['ready', 'ada stok', 'masih ada', 'tersedia', 'stok ready'],
    response: 'Halo kak {nama_pembeli}! Untuk {produk} saat ini masih ready {stok} pcs ya kak, harganya Rp{harga}. Mau diamankan berapa pcs nih kak? 😊',
  },
  {
    id: 'habis',
    name: 'Stok Habis (Tawarkan Alternatif)',
    triggers: ['restock', 'kapan ready', 'habis', 'kosong'],
    response: 'Halo kak, maaf banget untuk {produk} kebetulan baru aja habis 😭 Kalau kakak mau, ada {produk_alternatif} yang masih ready stok. Mau dicek dulu kak?',
  },
  {
    id: 'nego',
    name: 'Tawar Harga (Nego / HPP Guard)',
    triggers: ['nego', 'kurang dikit', 'boleh kurang', 'tawar', 'diskon'],
    response: 'Wah maaf banget kak {nama_pembeli}, untuk {produk} udah harga pas terbaik di Rp{harga} ya kak 🙏 Ambil minimal {min_grosir} pcs baru bisa dapat potongan grosir kak!',
  },
  {
    id: 'cutoff',
    name: 'Jadwal Kirim (Cutoff)',
    triggers: ['dikirim kapan', 'hari ini', 'besok sampai', 'resi', 'jadwal kirim'],
    response: 'Siap kak! Kalau pesanan masuk sebelum jam {jam_cutoff} sore ini, langsung kita ikutkan pengiriman hari ini juga ya 🚚',
  },
  {
    id: 'konfirmasi',
    name: 'Konfirmasi Pesanan Chat',
    triggers: ['jadi pesan', 'fix order', 'checkout', 'jadi ambil', 'saya ambil', 'pesan'],
    response: 'Siap kak {nama_pembeli}! Pesanan {produk} sebanyak {qty} pcs (Total: Rp{total_harga}) udah kami catat ya ✅ Silakan lanjut checkout/pembayaran kak!',
  },
  {
    id: 'lunas',
    name: 'Pembayaran Diterima (Auto-Lunas)',
    triggers: ['udah transfer', 'sudah bayar', 'bukti transfer', 'pembayaran dikonfirmasi', 'lunas'],
    response: 'Terima kasih kak {nama_pembeli}! Pembayaran untuk pesanan {order_id} udah terkonfirmasi lunas ya ✅ Paket kakak segera kami proses kirim!',
  },
];

export const DEFAULT_STORE_ACCOUNT = {
  email: 'owner@linashop.id',
  phone: '085183250750',
  ownerName: 'Lina Permata',
  storeName: 'Lina Shop',
  category: 'Aksesoris & Merchandise Kreatif',
  shopeeHandle: '@linashop.id',
  whatsappNumber: '0851-8325-0750',
  bankAccount: 'BCA 5271 8890 21 a.n. Lina Shop',
  shopeeConnected: false,
  whatsappConnected: true,
  osNotificationGranted: true,
  onboardingCompleted: true,
};

export const DEFAULT_SETTINGS = {
  storeName: 'Lina Shop',
  ownerName: 'Lina Permata',
  email: 'owner@linashop.id',
  shopeeHandle: '@linashop.id',
  whatsappNumber: '0851-8325-0750',
  shopeeConnected: false,
  whatsappConnected: true,
  osNotificationGranted: true,
  onboardingCompleted: true,
  baseUrl: process.env.REPLYFORGE_BASE_URL || 'http://localhost:20128/v1',
  apiKey: '',
  model: process.env.REPLYFORGE_MODEL || 'ag/gemini-3.8-flash-low',
  engine: 'auto', // auto = 9Router first, local engine on failure | gateway | local
  gatewayTimeoutMs: 6000,
  mode: 'autopilot', // autopilot | copilot
  tone: 'santai', // santai | formal
  negotiation: 'bulk3', // firm | bulk3 | flex
  minGrosir: 3,
  cutoff: '16.00',
  typingDelayMs: 3000,
  debounceMs: 3000,
  cacheThreshold: 0.6,
  carbonPerKTokens: 0.6, // gCO2e per 1K tokens
  blockGroups: true,
  whitelist: {
    'com.whatsapp.w4b': true,
    'com.whatsapp': true,
    'com.shopee.id': true,
    'com.shopee.shopeeseller': true,
    'id.replyforge.agent': true,
    'com.android.shell': true,
  },
  bankAccount: 'BCA 5271 8890 21 a.n. Lina Shop',
};

export const CHANNEL_PACKAGES = {
  shopee: 'com.shopee.id',
  whatsapp: 'com.whatsapp.w4b',
};

