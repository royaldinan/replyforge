// Deterministic NLP & Intent Parser for Indonesian Online Commerce.
// Extracts stock queries, custom rules, order commitments, and conversational stock updates.

import { listProducts, listRules, upsertProduct, addRule, adjustStock } from '../db.js';
import { normalize, unstretch, parseMoney, wordToNumber, UNIT_WORDS, rupiah, firstName, fillTemplate, formalize } from './text.js';

// Matches user inquiry against custom rules defined by the seller
export function matchCustomRules(text, settings, buyer = 'kak') {
  const norm = normalize(unstretch(text));
  const rules = listRules().filter((r) => r.enabled);
  const products = listProducts();

  let matchedProduct = null;
  for (const p of products) {
    const names = [p.name.toLowerCase(), p.sku.toLowerCase(), ...(p.aliases || []).map((a) => a.toLowerCase())];
    if (names.some((n) => norm.includes(n))) {
      matchedProduct = p;
      break;
    }
  }

  const buyerName = firstName(buyer);

  for (const rule of rules) {
    const triggers = rule.triggers;
    const hit = triggers.some((t) => norm.includes(t.toLowerCase()));
    if (hit) {
      const vars = {
        nama_pembeli: buyerName,
        produk: matchedProduct ? matchedProduct.name : 'produk ini',
        harga: matchedProduct ? Math.round(matchedProduct.price).toLocaleString('id-ID') : '125.000',
        stok: matchedProduct ? matchedProduct.stock : 10,
        min_grosir: settings.minGrosir || 3,
        jam_cutoff: settings.cutoff || '16.00',
        toko: settings.storeName || 'Lina Shop',
      };
      let reply = fillTemplate(rule.response, vars);
      if (settings.tone === 'formal') reply = formalize(reply);
      return {
        matched: true,
        ruleId: rule.id,
        ruleName: rule.name,
        reply,
      };
    }
  }

  return { matched: false };
}

// Matches inquiry against store products (stock & price check)
export function matchProductStock(text, buyer = 'kak', settings) {
  const norm = normalize(unstretch(text));
  const products = listProducts();

  let matchedProduct = null;
  for (const p of products) {
    const names = [p.name.toLowerCase(), p.sku.toLowerCase(), ...(p.aliases || []).map((a) => a.toLowerCase())];
    if (names.some((n) => norm.includes(n))) {
      matchedProduct = p;
      break;
    }
  }

  if (!matchedProduct) return null;

  const buyerName = firstName(buyer);
  const vars = {
    nama_pembeli: buyerName,
    produk: matchedProduct.name,
    stok: matchedProduct.stock,
    harga: rupiah(matchedProduct.price),
    jam_cutoff: settings.cutoff || '16.00',
    unit: matchedProduct.unit || 'pcs',
  };

  let template = '';
  if (matchedProduct.stock > 0) {
    template = `Halo kak ${buyerName}! ${matchedProduct.name} masih ready ya, sisa ${matchedProduct.stock} ${matchedProduct.unit}. Harganya ${rupiah(matchedProduct.price)}, mau aku siapin berapa ${matchedProduct.unit} kak?`;
  } else {
    template = `Yah maaf banget kak ${buyerName}, ${matchedProduct.name} lagi kosong kak. Restock sekitar 2-3 hari lagi, mau aku kabarin kalau sudah ready?`;
  }

  if (settings.tone === 'formal') template = formalize(template);

  return {
    product: matchedProduct,
    sku: matchedProduct.sku,
    reply: template,
    template,
  };
}

// Detects buyer's order intent (e.g. "Kak saya pesan Stiker Kucing 2 pack ya")
export function parseOrderIntent(text, buyer = 'kak') {
  const norm = normalize(unstretch(text));
  const products = listProducts();

  // If text is purely an inquiry or informational statement, NOT an order
  const isQuestion = /\?|ready|masih ada|ada ga|ada gak|apakah ada|kosong|tanya|nanya|info|siap kirim|bisa kirim\?/.test(norm);
  const isDirectCommitment = /\b(pesan|order|beli|ambil|bungkus|checkout|pesen)\b/.test(norm) ||
    /\bmau\s+(?:pesan|order|beli|ambil|bungkus|checkout)\b/.test(norm) ||
    /\bdeal\s*(?:kak|ya)?\b/.test(norm);

  if (!isDirectCommitment) return null;
  if (isQuestion && !isDirectCommitment) return null;

  let foundProduct = null;
  for (const p of products) {
    const candidates = [p.name.toLowerCase(), p.sku.toLowerCase(), ...(p.aliases || []).map((a) => a.toLowerCase())];
    if (candidates.some((c) => norm.includes(c))) {
      foundProduct = p;
      break;
    }
  }

  if (!foundProduct) return null;

  // Extract quantity (number or word: 3, tiga, etc.)
  let qty = 1;
  const qtyMatch = norm.match(/\b(\d+)\s*(?:botol|pack|pcs|box|buah|biji|btl|cup|liter|dus)?\b/);
  if (qtyMatch) {
    qty = parseInt(qtyMatch[1], 10);
  } else {
    for (const [w, n] of Object.entries({ satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, sepuluh: 10 })) {
      if (new RegExp(`\\b${w}\\b`).test(norm)) {
        qty = n;
        break;
      }
    }
  }

  if (qty <= 0) qty = 1;
  const totalPrice = foundProduct.price * qty;

  return {
    isOrder: true,
    product: foundProduct,
    sku: foundProduct.sku,
    quantity: qty,
    totalPrice,
  };
}

// Conversational Store & Rule Builder (Chat-to-Config)
// Example: "Masukin data Lina Shop: Paket Stiker Kucing stok 50 harga 15 ribu HPP 6 ribu, Gantungan Kunci Capybara stok 30 harga 25 ribu HPP 12 ribu. Kalau ada yang tanya pengiriman bilang dikirim hari yang sama maksimal jam 4 sore."
export function parseConversationalCommand(text) {
  const norm = normalize(text);
  const result = {
    products: [],
    rules: [],
  };

  // 1. Extract Rule if present: "Kalau ada yang tanya [pengiriman] bilang/jawab [dikirim hari yang sama...]"
  const ruleRegex = /(?:kalau|kalo|jika)\s+(?:ada\s+)?(?:yang\s+)?(?:nanya|tanya)\s+([^,.]+?)\s*(?:,|\s+maka|\s+langsung)?\s+(?:bilang|jawab|sampaikan)\s+(.+)$/i;
  const ruleMatch = text.match(ruleRegex);
  if (ruleMatch) {
    const rawTriggers = ruleMatch[1].trim();
    const rawResponse = ruleMatch[2].trim();
    const triggerWords = rawTriggers.split(/\s+atau\s+|\s*,\s*|\s+dan\s+/).map((w) => w.trim().toLowerCase());
    if (triggerWords.length && rawResponse) {
      const newRule = addRule({
        name: `Aturan: ${triggerWords.join(', ')}`,
        triggers: triggerWords,
        response: rawResponse,
        source: 'chat-builder',
      });
      result.rules.push(newRule);
    }
  }

  // 2. Extract Products: matches "Name stok X harga Y (HPP Z)?"
  // Clean off the rule part if any
  const productText = ruleMatch ? text.substring(0, ruleMatch.index) : text;
  // Match each product entry separated by comma, newline, or "dan"
  const itemSnippets = productText.replace(/masukin\s+data\s+[a-zA-Z0-9\s]+:/i, '').split(/(?:,|\n|\bdan\b)/);

  for (const snippet of itemSnippets) {
    const cleanSnippet = snippet.trim();
    if (!cleanSnippet) continue;

    // Pattern: [Product Name] stok [X] harga [Y] (hpp [Z])?
    const prodMatch = cleanSnippet.match(/(.+?)\s+stok\s*[:=]?\s*(\d+)\s+harga\s*[:=]?\s*(\d+(?:[.,]\d+)*(?:\s*(?:rb|k|ribu))?)(?:\s*hpp\s*[:=]?\s*(\d+(?:[.,]\d+)*(?:\s*(?:rb|k|ribu))?))?/i);
    if (prodMatch) {
      let pName = prodMatch[1].replace(/^(?:dan|tambah|update|stok|produk)\s+/i, '').trim();
      const stockVal = parseInt(prodMatch[2], 10);
      const priceVal = parseMoney(prodMatch[3]);
      const hppVal = prodMatch[4] ? parseMoney(prodMatch[4]) : Math.round(priceVal * 0.7);

      if (pName && priceVal > 0) {
        // Derive SKU e.g. Gamis Linen Hitam -> GM-LINEN-BLK or GLH-125
        const words = pName.split(/\s+/);
        let skuCode = words.map((w) => w.substring(0, 3).toUpperCase()).join('-');
        if (skuCode.length > 12) skuCode = skuCode.substring(0, 12);

        // Check if existing product matches
        const existingList = listProducts();
        const existing = existingList.find((p) => p.name.toLowerCase() === pName.toLowerCase() || p.sku === skuCode);
        const finalSku = existing ? existing.sku : skuCode;

        const aliases = [
          pName.toLowerCase(),
          words.slice(0, 2).join(' ').toLowerCase(),
          words[0].toLowerCase(),
        ];

        const saved = upsertProduct({
          sku: finalSku,
          name: pName,
          aliases,
          unit: 'pcs',
          price: priceVal,
          hpp: hppVal,
          stock: stockVal,
          capacity: Math.max(stockVal + 10, 30),
        });
        result.products.push(saved);
      }
    }
  }

  if (result.products.length > 0 || result.rules.length > 0) {
    let msg = 'Berhasil memproses perintah natural language ke SQLite:';
    if (result.products.length > 0) {
      msg += `\n📦 ${result.products.length} Produk diperbarui (${result.products.map((p) => `${p.name} stok ${p.stock}`).join(', ')})`;
    }
    if (result.rules.length > 0) {
      msg += `\n📜 ${result.rules.length} Aturan baru ditambahkan`;
    }
    return {
      type: 'SETUP_PROCESSED',
      products: result.products,
      rules: result.rules,
      message: msg,
    };
  }

  return { type: 'UNKNOWN', message: 'Perintah tidak dikenali. Gunakan format contoh di petunjuk.' };
}
