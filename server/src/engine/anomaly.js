// Deterministic + Heuristic Anomaly & Escalation Guard (MODEL + KODE + MANUSIA).
// Evaluates incoming buyer messages for:
// 1. UNUSUAL_QUANTITY: Order quantity exceeding available stock or normal per-order threshold (max_order_normal).
// 2. WEIRD_QUERY: Suspicious requests (credit/pay next month, phishing links/APK, prompt injection, out-of-scope bizarre requests).
// 3. INCOMPLETE_ORDER: Vague order instructions ("kirim ke rumah kayak biasa") that require seller confirmation instead of guessing.

import { normalize, unstretch } from './text.js';

const SUSPICIOUS_CREDIT_PATTERNS = [
  /bayar\s+(?:bulan|minggu|tahun)\s+depan/i,
  /\b(?:hutang|ngutang|kasbon|nyicil\s+pribadi|pinjam\s+uang|pinjam\s+duit)\b/i,
  /kirim\s+dulu\s+bayar\s+belakangan/i,
];

const SUSPICIOUS_LINK_PATTERNS = [
  /https?:\/\/[^\s]+/i,
  /\b(?:bit\.ly|tinyurl\.com|s\.id)\/[^\s]+/i,
  /\b\w+\.apk\b/i,
  /klik\s+link\s+ini/i,
];

const PROMPT_INJECTION_PATTERNS = [
  /abaikan\s+(?:semua\s+)?instruksi/i,
  /ignore\s+(?:all\s+)?(?:previous\s+)?instructions/i,
  /system\s+prompt/i,
  /anggap\s+harga(?:nya)?\s+(?:jadi\s+)?(?:rp\s*)?[01]\b/i,
];

const OUT_OF_SCOPE_WEIRD_PATTERNS = [
  /\b(?:pinjol|judi\s*online|slot\s*gacor|jual\s+motor|jual\s+mobil|joki\s+tugas|hack\s+akun)\b/i,
  /\b(?:lapor\s+polisi|penipu\s+lu|toko\s+penipu|barang\s+sampah)\b/i,
];

const VAGUE_ADDRESS_PATTERNS = [
  /kirim\s+(?:ke\s+)?(?:rumah\s+|alamat\s+)?(?:kayak|kaya|seperti)\s+biasa/i,
  /alamat(?:nya)?\s+(?:masih\s+)?(?:kayak|kaya|seperti)\s+biasa/i,
  /pesan\s+(?:kayak|kaya|seperti)\s+biasa/i,
];

export function inspectBuyerAnomaly(text, buyer = 'Pembeli', channel = 'whatsapp', products = []) {
  const raw = String(text || '').trim();
  const norm = normalize(unstretch(raw));

  // Match product if mentioned
  let matchedProduct = null;
  for (const p of products) {
    const names = [p.name.toLowerCase(), p.sku.toLowerCase(), ...(p.aliases || []).map((a) => a.toLowerCase())];
    if (names.some((n) => norm.includes(n))) {
      matchedProduct = p;
      break;
    }
  }

  // Extract quantity if present
  let requestedQty = 0;
  const qtyUnitMatch = norm.match(/\b(\d+)\s*(?:pack|pcs|box|buah|biji|lusin|karton|dus)\b/i);
  const borongMatch = norm.match(/\b(?:borong|ambil|pesan|beli|order|minta)\b[^0-9]{0,25}\b(\d{2,6})\b/i);
  if (qtyUnitMatch) {
    requestedQty = parseInt(qtyUnitMatch[1], 10);
    if (/\b(?:lusin)\b/i.test(qtyUnitMatch[0])) requestedQty *= 12;
  } else if (borongMatch) {
    requestedQty = parseInt(borongMatch[1], 10);
  }

  // Check suspicious credit / weird query reasons
  const hasSuspiciousCredit = SUSPICIOUS_CREDIT_PATTERNS.some((rx) => rx.test(raw) || rx.test(norm));
  const hasSuspiciousLink = SUSPICIOUS_LINK_PATTERNS.some((rx) => rx.test(raw));
  const hasPromptInjection = PROMPT_INJECTION_PATTERNS.some((rx) => rx.test(raw) || rx.test(norm));
  const hasOutOfScopeWeird = OUT_OF_SCOPE_WEIRD_PATTERNS.some((rx) => rx.test(raw) || rx.test(norm));

  // 1. Check Unusual Quantity (KODE Deterministic Check)
  const maxNormal = matchedProduct ? (matchedProduct.max_order_normal || 15) : 20;
  const currentStock = matchedProduct ? matchedProduct.stock : 50;
  const isUnusualQty =
    requestedQty > 0 &&
    (requestedQty > currentStock || requestedQty > maxNormal || requestedQty >= 30);

  if (isUnusualQty) {
    const prodLabel = matchedProduct ? matchedProduct.name : 'produk toko';
    const extraReason = hasSuspiciousCredit
      ? ' disertai permintaan pembayaran tempo/tidak wajar'
      : hasSuspiciousLink
        ? ' disertai tautan mencurigakan'
        : '';

    const stockComparison = matchedProduct
      ? `Stok tersedia: ${currentStock} ${matchedProduct.unit || 'pcs'}, Batas wajar: ${maxNormal} ${matchedProduct.unit || 'pcs'}`
      : `Melebihi batas transaksi wajar (${maxNormal} pcs)`;

    return {
      isAnomaly: true,
      kind: 'UNUSUAL_QUANTITY',
      severity: 'high',
      title: `Pesanan Jumlah Tidak Wajar (${requestedQty} pcs)`,
      reason: `Pembeli ${buyer} meminta ${requestedQty} pcs ${prodLabel} (${stockComparison})${extraReason}. Auto-Reply dijeda otomatis agar penjual dapat memverifikasi langsung.`,
      requestedQty,
      sku: matchedProduct ? matchedProduct.sku : null,
      productName: prodLabel,
    };
  }

  // 2. Check Weird / Suspicious / Out-of-Scope Query
  if (hasSuspiciousLink || hasPromptInjection || hasSuspiciousCredit || hasOutOfScopeWeird) {
    let detail = 'Pertanyaan di luar konteks katalog atau berisiko tinggi';
    if (hasSuspiciousLink) detail = 'Pesan memuat tautan eksternal / file APK mencurigakan';
    else if (hasPromptInjection) detail = 'Terdeteksi percobaan manipulasi instruksi AI / harga';
    else if (hasSuspiciousCredit) detail = 'Permintaan hutang / bayar tempo di luar aturan pembayaran toko';
    else if (hasOutOfScopeWeird) detail = 'Pertanyaan tidak wajar di luar produk toko atau komplain sensitif';

    return {
      isAnomaly: true,
      kind: 'WEIRD_QUERY',
      severity: 'high',
      title: 'Pertanyaan Aneh / Permintaan Mencurigakan',
      reason: `${detail} dari ${buyer} di ${channel.toUpperCase()}. Auto-Reply dijeda otomatis untuk dicek penjual.`,
      requestedQty: requestedQty || 0,
      sku: matchedProduct ? matchedProduct.sku : null,
      productName: matchedProduct ? matchedProduct.name : null,
    };
  }

  // 3. Check Incomplete Order Data (Mentoring PPT Slide 23: "Bagian yang belum jelas ditandai, bukan ditebak")
  const hasVagueAddress = VAGUE_ADDRESS_PATTERNS.some((rx) => rx.test(raw) || rx.test(norm));
  if (hasVagueAddress) {
    return {
      isAnomaly: false,
      isIncompleteOrder: true,
      missingFields: ['alamat pengiriman'],
      warningTitle: 'Data Pesanan Belum Lengkap',
      warningReason: 'Pembeli menyebutkan pengiriman "kayak biasa" tanpa alamat lengkap. Sistem menandai draf agar dikonfirmasi penjual.',
    };
  }

  return {
    isAnomaly: false,
    isIncompleteOrder: false,
    missingFields: [],
  };
}
