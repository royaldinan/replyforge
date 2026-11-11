// Text utilities for Indonesian chat-commerce language.
export const rupiah = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/\bsticker(s)?\b/g, 'stiker')
    .replace(/\b(rdy|redi)\b/g, 'ready')
    .replace(/\b(brp|brapa|berapah)\b/g, 'berapa')
    .replace(/\b(kcg|kcing)\b/g, 'kucing')
    .replace(/(\d)\s*(rb|ribu|k)\b/g, (_, d, u) => `${d}${u === 'k' ? 'k' : 'rb'}`)
    .replace(/\s+/g, ' ')
    .trim();
}

// Collapse stretched slang ("kakkk", "yaaa") so keyword matching still works.
export function unstretch(text) {
  return text.replace(/([a-z])\1{2,}/g, '$1');
}

const NUMBER_WORDS = {
  satu: 1, se: 1, sebiji: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9,
  sepuluh: 10, sebelas: 11, selusin: 12, sekodi: 20, 'setengah lusin': 6, 'dua lusin': 24, 'dua puluh': 20,
  'tiga puluh': 30, 'lima belas': 15, 'dua belas': 12,
};

export const UNIT_WORDS = ['botol', 'btl', 'pcs', 'pc', 'biji', 'pack', 'pak', 'box', 'boks', 'bungkus', 'bks', 'cup', 'buah', 'item', 'liter', 'dus', 'lusin'];

// Parse "18000", "18.000", "Rp 18.000", "18rb", "18k", "1,5jt" into an integer rupiah amount.
export function parseMoney(raw) {
  if (raw == null) return null;
  const s = String(raw).toLowerCase().replace(/rp\.?\s*/g, '').trim();
  const m = s.match(/^(\d+(?:[.,]\d+)*)\s*(rb|ribu|k|jt|juta)?$/);
  if (!m) return null;
  let numStr = m[1];
  const unit = m[2];
  if (unit) {
    const n = parseFloat(numStr.replace(',', '.'));
    return Math.round(n * (unit === 'jt' || unit === 'juta' ? 1_000_000 : 1000));
  }
  numStr = numStr.replace(/[.,](?=\d{3}(\D|$))/g, '');
  return parseInt(numStr.replace(/[.,]/g, ''), 10);
}

export function wordToNumber(word) {
  if (/^\d+$/.test(word)) return parseInt(word, 10);
  return NUMBER_WORDS[word] ?? null;
}

const STOPWORDS = new Set(
  'kak ka kakak min admin gan sis bang mas mbak bu pak om tante halo hai hi hallo permisi pagi siang sore malam selamat ya yah dong deh sih nih tuh kah ga gak nggak engga enggak tidak yg yang ini itu aja saja mau tanya nanya apa apakah aku saya gue gw kami kita kamu anda di ke dari untuk buat dan atau sama juga lagi masih udah sudah bisa nya mohon tolong info terima kasih makasih thanks the a'
    .split(' '),
);

// Canonical concept tokens so "ready ga?" and "masih ada stok?" land on the same cache key.
const CONCEPTS = [
  ['C_STOCK', /\b(ready|redi|ada|stok|stock|sisa|tersedia|kosong|habis)\b/],
  ['C_PRICE', /\b(harga|berapa|brp|berapaan|price|hrg)\b/],
  ['C_SHIP', /\b(kirim|pengiriman|ongkir|kurir|dikirim|nyampe|sampe|sampai|resi|ekspedisi)\b/],
  ['C_HOURS', /\b(jam buka|buka|tutup|libur|operasional)\b/],
  ['C_NEGO', /\b(nego|diskon|potongan|kurang|murah|mahal|kurangin)\b/],
  ['C_PAY', /\b(bayar|transfer|rekening|cod|qris|pembayaran)\b/],
];

export function conceptTokens(text) {
  const t = unstretch(normalize(text));
  const out = new Set();
  for (const [name, re] of CONCEPTS) if (re.test(t)) out.add(name);
  return out;
}

export function contentTokens(text, productAliases = []) {
  let t = unstretch(normalize(text));
  for (const alias of productAliases) t = t.split(alias).join(' ');
  const words = t.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOPWORDS.has(w) && w.length > 1);
  return new Set(words);
}

export function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

export const firstName = (buyer) => {
  const clean = String(buyer || '').replace(/[._\d]+/g, ' ').trim();
  const word = clean.split(/\s+/)[0] || 'kak';
  if (/^(bu|pak|mas|mbak|kak|om|tante)$/i.test(word) && clean.split(/\s+/)[1]) {
    return word[0].toUpperCase() + word.slice(1).toLowerCase() + ' ' + capitalize(clean.split(/\s+/)[1]);
  }
  return capitalize(word);
};
export const capitalize = (w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w);

// Casual seller voice -> polite formal CS voice.
const FORMAL_MAP = [
  [/\baku\b/gi, 'kami'], [/\budah\b/gi, 'sudah'], [/\bga\b|\bgak\b|\bnggak\b/gi, 'tidak'], [/\baja\b/gi, 'saja'],
  [/\bbanget\b/gi, 'sekali'], [/\bkabarin\b/gi, 'kabari'], [/\bsiapin\b/gi, 'siapkan'], [/\bpilihin\b/gi, 'pilihkan'],
  [/\bbentar\b/gi, 'sebentar'], [/\bkamu\b/gi, 'Kakak'], [/\blumayan buat\b/gi, 'cocok untuk'], [/\bbuat\b/gi, 'untuk'],
  [/\bngecek\b|\bcekin\b/gi, 'mengecek'], [/\bkalo\b/gi, 'kalau'], [/\bmakasih\b/gi, 'terima kasih'], [/\bnyampe\b/gi, 'sampai'],
  [/\bhehe\s*/gi, ''], [/\bkak\b/g, 'Kak'], [/\bdong\b\s*/gi, ''], [/ ya\b/g, ' ya'],
];
export function formalize(text) {
  let out = text;
  for (const [re, rep] of FORMAL_MAP) out = out.replace(re, rep);
  return out.replace(/\s{2,}/g, ' ').replace(/^\s*(\w)/, (m) => m.toUpperCase());
}

export function fillTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, key) => (vars[key] != null ? String(vars[key]) : m));
}
