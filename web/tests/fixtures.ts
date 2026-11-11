import type { CacheEntry, Metrics, Order, PrivacyLog, Product, Rule, Settings, TelemetryNode } from '../src/types';

const today = new Date();
const at = (h: number, m: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m).toISOString();

export const products: Product[] = [
  { sku: 'STK-CAT-01', name: 'Paket Stiker Kucing Gemoy', price: 15000, hpp: 6000, stock: 50, capacity: 100, unit: 'pack' },
  { sku: 'KC-ACRYL-02', name: 'Gantungan Kunci Akrilik Capybara', price: 25000, hpp: 12000, stock: 30, capacity: 60, unit: 'pcs' },
  { sku: 'GPT-FLW-03', name: 'Griptok HP Akrilik Bunga Daisy', price: 20000, hpp: 8000, stock: 4, capacity: 25, unit: 'pcs' },
  { sku: 'PC-HLD-04', name: 'Photocard Holder Plushie Kelinci', price: 35000, stock: 15, capacity: 30, unit: 'pcs' },
];

export const rules: Rule[] = [
  { id: 1, name: 'Stok Ready', triggers: ['ready'], response: 'Halo kak! Stok masih ready ya 😊', enabled: true, source: 'preset' },
  { id: 2, name: 'Jam kirim', triggers: ['pengiriman', 'jam buka'], response: 'Toko buka tiap hari, batas kirim jam 4 sore ya kak.', enabled: true, source: 'chat' },
];

export const orders: Order[] = [
  { id: 1, code: '#2610259988LINA', buyer: 'rina_wati88', channel: 'shopee', items: [{ name: 'Paket Stiker Kucing Gemoy', quantity: 2 }], total: 30000, status: 'paid', created_at: at(10, 16) },
  { id: 2, code: '#2610258120KHAD', buyer: 'siti_khadijah', channel: 'whatsapp', items: [{ name: 'Gantungan Kunci Akrilik Capybara', quantity: 1 }], total: 25000, status: 'reserved', created_at: at(9, 18) },
  { id: 3, code: '#2610257766SILENT', buyer: 'budi_01', channel: 'shopee', items: [], total: 0, status: 'silent_paid', created_at: at(9, 42) },
  { id: 4, code: '#2610256001MKNA', buyer: 'Nadia Putri', channel: 'shopee', items: [{ name: 'Photocard Holder Plushie Kelinci', quantity: 1 }, { name: 'Griptok HP Akrilik Bunga Daisy', quantity: 1 }], total: 55000, status: 'cancelled', created_at: at(8, 5) },
];

export const settings: Settings = {
  mode: 'autopilot',
  engine: 'auto',
  baseUrl: 'http://localhost:20128/v1',
  apiKey: '',
  model: 'ag/gemini-3.8-flash-low',
  whitelist: { 'com.shopee.id': true, 'com.whatsapp.w4b': true },
};

export const metrics: Metrics = { cacheHitRatio: '72.5%', cacheHits: 29, tokensSaved: 18450, carbonSavedGrams: 21.4 };

export const privacyLogs: PrivacyLog[] = [
  { id: 1, kind: 'OTP_BANK', preview: 'Kode OTP BCA Anda ****** JANGAN BERIKAN KEPADA SIAPA PUN', created_at: at(10, 20) },
  { id: 2, kind: 'SMS_BANK', preview: 'Mutasi rekening 08xx-xxxx-xx12 telah disensor', created_at: at(10, 5) },
  { id: 3, kind: 'PII_PHONE', preview: 'Nomor telepon pembeli disensor sebelum dikirim ke AI', created_at: at(9, 51) },
  { id: 4, kind: 'OTP_SHOPEE', preview: 'Kode verifikasi Shopee ****** berlaku 5 menit', created_at: at(9, 12) },
];

export const cacheEntries: CacheEntry[] = [
  { id: 1, question: 'Halo kak, Paket Stiker Kucing Gemoy masih ready? Harganya berapa ya?', template: 'Halo kak {nama_pembeli}! {produk} masih ready ya, sisa {stok} lagi. Harganya {harga}.', hits: 7 },
  { id: 2, question: 'Min bisa kirim hari ini ke Jakarta Selatan?', template: 'Order sebelum jam {jam_cutoff} dikirim hari ini kak {nama_pembeli}.', hits: 3 },
];

export const telemetryHistory: TelemetryNode[] = [
  { node: 1, status: 'INTERCEPTED', latencyMs: 4, badge: 'Notifikasi Shopee ditangkap' },
  { node: 2, status: 'CACHE HIT', latencyMs: 0, badge: 'Cache hit: 0ms tanpa cloud' },
  { node: 3, status: 'AI', latencyMs: 412, badge: 'Gemini 412ms · stok -3' },
  { node: 2, status: 'BLOCKED OTP', latencyMs: 1, badge: 'OTP BCA diblokir lokal' },
];
