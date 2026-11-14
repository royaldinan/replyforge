// 9Router Gateway Client with Resilient Deterministic Fallback.
// Default model: Gemini (high speed < 500ms, saves Opus quota).
// Built-in intelligent local deterministic fallback guarantees 100% demo uptime!

import { getSettings, bumpMetric } from '../db.js';
import { matchCustomRules, matchProductStock, parseOrderIntent } from './intent.js';
import { rupiah, firstName } from './text.js';

export async function generateResponse({ text, buyer, channel, products, rules }) {
  const settings = getSettings();
  const startTime = Date.now();

  // If engine is set to purely local, jump straight to deterministic engine
  if (settings.engine === 'local') {
    return runLocalEngine(text, buyer, channel, settings, startTime);
  }

  // Attempt 9Router Call with configured model (default Gemini)
  if (settings.baseUrl) {
    try {
      const apiKey = settings.apiKey || process.env.REPLYFORGE_API_KEY || "";
      const authHeader = apiKey ? `Bearer ${apiKey}` : "";
      const response = await fetch(`${settings.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          model: settings.model || 'ag/gemini-3.8-flash-low',
          messages: [
            {
              role: 'system',
              content: `Anda adalah asisten admin toko online Indonesia ("${settings.storeName || 'Toko'}").
Tugas: Balas pesan pembeli secara ringkas, ramah, dan manusiawi (gaya admin olshop Indonesia asli).
Aturan:
- Gunakan bahasa ${settings.tone === 'formal' ? 'sopan dan formal' : 'santai dan akrab'}.
- Sapa nama pembeli jika ada (${firstName(buyer)}).
- Produk & Stok: ${JSON.stringify(products.map((p) => ({ nama: p.name, harga: rupiah(p.price), stok: `${p.stock} ${p.unit}` })))}.
- Batas kirim: jam ${settings.cutoff || '16.00'}.
- Jangan bertele-tele, maksimal 2-3 kalimat.`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
        signal: AbortSignal.timeout(settings.gatewayTimeoutMs || 5000),
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content?.trim();
        if (replyText) {
          bumpMetric('llmCalls', 1);
          return {
            reply: replyText,
            engine: `9Router (${settings.model})`,
            latencyMs: Date.now() - startTime,
            isFallback: false,
          };
        }
      }
    } catch (err) {
      // Graceful fallback to deterministic local engine
      console.warn(`[9Router Gateway] Error or Timeout (${err.message}). Activating Resilient Local Fallback.`);
    }
  }

  // Local Deterministic Engine (Anti-Gagal Demo)
  return runLocalEngine(text, buyer, channel, settings, startTime);
}

function runLocalEngine(text, buyer, channel, settings, startTime) {
  bumpMetric('localEngine', 1);

  // 1. Check for Order Intent
  const order = parseOrderIntent(text, buyer);
  if (order && order.isOrder) {
    const bName = firstName(buyer);
    if (channel === 'shopee') {
      // Shopee = Smart Copilot: no local order, no bank transfer instructions.
      return {
        reply: `Siap kak ${bName}! ${order.product.name} ready stok siap kirim hari ini dari ${settings.storeCity || 'Bandung'}. Silakan langsung checkout melalui keranjang Shopee ya kak! ✨`,
        engine: 'Built-in Local Smart Engine',
        latencyMs: Math.max(1, Date.now() - startTime),
        isFallback: true,
        productSku: order.sku,
      };
    }
    const reply = `Siap kak ${bName}! Order ${order.quantity} ${order.product.unit} ${order.product.name} totalnya ${rupiah(order.totalPrice)} sudah kami amankan ya. Silakan transfer ke ${settings.bankAccount || 'SeaBank 901483182051 a.n. Ferdinand Manurung'}. Kalau transfer sebelum jam ${settings.cutoff}, paket meluncur hari ini juga ya!`;
    return {
      reply,
      engine: 'Built-in Local Smart Engine',
      latencyMs: Math.max(1, Date.now() - startTime),
      isFallback: true,
      action: {
        type: 'AUTO_ORDER',
        order,
      },
    };
  }

  // 2. Check Custom Store Rules (e.g. shipping cutoff, nego)
  const ruleMatch = matchCustomRules(text, settings, buyer);
  if (ruleMatch.matched) {
    return {
      reply: ruleMatch.reply,
      engine: 'Built-in Local Smart Engine',
      latencyMs: Math.max(1, Date.now() - startTime),
      isFallback: true,
      matchedRule: ruleMatch.ruleName,
    };
  }

  // 3. Check Product Stock & Price
  const stockMatch = matchProductStock(text, buyer, settings);
  if (stockMatch) {
    return {
      reply: stockMatch.reply,
      engine: 'Built-in Local Smart Engine',
      latencyMs: Math.max(1, Date.now() - startTime),
      isFallback: true,
      productSku: stockMatch.sku,
    };
  }

  // 4. Default Humanized Friendly Response
  const bName = firstName(buyer);
  const defaultReply = `Halo kak ${bName}! Terima kasih sudah menghubungi ${settings.storeName || 'Stickeria'}. Ada yang bisa kami bantu kak? Paket Stiker Kucing Gemoy kami ready stok siap kirim hari ini ya!`;

  return {
    reply: defaultReply,
    engine: 'Built-in Local Smart Engine',
    latencyMs: Math.max(1, Date.now() - startTime),
    isFallback: true,
  };
}
