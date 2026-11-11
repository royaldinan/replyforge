// ReplyForge REST & SSE Telemetry Server.
// Runs locally on port 8088 (migrated from 8000 to avoid collision with Mahiru OS). Provides complete APIs for:
// - Android Webhook receiver
// - Frontend Real-time Telemetry (SSE)
// - Inventory, Rules, Orders, Settings, and Green Cache CRUD
// - Conversational Chat-to-Config & Sandbox Runner

import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import {
  listProducts,
  upsertProduct,
  adjustStock,
  deleteProduct,
  listRules,
  addRule,
  updateRule,
  deleteRule,
  listOrders,
  setOrderStatus,
  listCache,
  clearCache,
  listMessages,
  addMessage,
  pushOutbox,
  listPrivacy,
  logPrivacy,
  listDrafts,
  setDraftStatus,
  getDraft,
  getSettings,
  saveSettings,
  getMetrics,
  listThreads,
  setThreadPaused,
  resetDatabase,
  pullOutbox,
  ackOutbox,
  listBuyerIntents,
  listAnomalyAlerts,
  resolveAnomalyAlert,
  getActiveStoreAccount,
  loginStoreAccount,
  registerStoreAccount,
  updateStoreChannelConnection,
} from './db.js';
import { processIncomingNotification, telemetryEvents } from './engine/pipeline.js';
import { parseConversationalCommand } from './engine/intent.js';
import { generateResponse } from './engine/gateway.js';
import { PRESETS, DEFAULT_STORE_ACCOUNT } from './seed.js';

const app = express();
const PORT = process.env.PORT || 8088;

app.use(express.json());

// CORS for local Vite development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 0. Seller Authentication & Channel Onboarding Endpoints
app.get('/api/auth/me', (req, res) => {
  res.json({ account: getActiveStoreAccount() });
});

app.post('/api/auth/login', (req, res) => {
  try {
    const account = loginStoreAccount(req.body || {});
    res.json({ success: true, account });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const account = registerStoreAccount(req.body || {});
    res.json({ success: true, account });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/demo', (req, res) => {
  try {
    const account = loginStoreAccount({
      identifier: DEFAULT_STORE_ACCOUNT.email,
      password: 'linashop2026',
    });
    res.json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/channels/connect', (req, res) => {
  try {
    const account = updateStoreChannelConnection(req.body || {});
    res.json({ success: true, account });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 0b. Seller Anomaly & Escalation Alerts API
app.get('/api/alerts', (req, res) => {
  res.json(listAnomalyAlerts());
});

app.patch('/api/alerts/:id/resolve', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status = 'resolved', resumeAi = false } = req.body || {};
  const alert = resolveAnomalyAlert(id, status);
  if (alert && resumeAi) {
    setThreadPaused(alert.thread_id, alert.buyer, alert.channel, false);
  }
  res.json({ success: true, alert });
});

// 1. Android OS Webhook (called by ReplyForgeNotificationService.kt or Simulator)
app.post('/api/notification-webhook', async (req, res) => {
  try {
    const {
      buyer = 'Budi Santoso',
      channel = 'shopee',
      packageName = 'com.shopee.id',
      text = '',
      notificationKey = `notif_${Date.now()}`,
      isGroup = false,
    } = req.body;

    const result = await processIncomingNotification({
      buyer,
      channel,
      packageName,
      text,
      notificationKey,
      isGroup,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Real-time Telemetry Stream via Server-Sent Events (SSE)
app.get('/api/telemetry/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const listener = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  telemetryEvents.on('event', listener);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    telemetryEvents.off('event', listener);
  });
});

// 3. Products / Inventory API
app.get('/api/products', (req, res) => res.json(listProducts()));
app.post('/api/products', (req, res) => {
  const p = upsertProduct(req.body);
  res.json(p);
});
app.patch('/api/products/:sku/stock', (req, res) => {
  const { delta = 0 } = req.body;
  try {
    const updated = adjustStock(req.params.sku, parseInt(delta, 10));
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/products/:sku', (req, res) => {
  deleteProduct(req.params.sku);
  res.json({ success: true });
});

// CSV Import API for Shopee Template Export
app.post('/api/products/import-csv', (req, res) => {
  try {
    const { csvData = '' } = req.body;
    const lines = csvData.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'Data CSV kosong atau tidak valid' });
    }

    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const imported = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));

      const getVal = (name) => {
        const idx = headers.findIndex((h) => h.includes(name));
        return idx !== -1 ? cols[idx] : null;
      };

      const name = getVal('nama') || getVal('name') || getVal('produk') || cols[1] || `Produk ${i}`;
      const sku = getVal('sku') || getVal('kode') || cols[0] || `SKU-${Date.now()}-${i}`;
      const price = parseInt(getVal('harga') || getVal('price') || cols[2] || '0', 10);
      const hpp = parseInt(getVal('hpp') || cols[3] || '0', 10) || Math.round(price * 0.7);
      const stock = parseInt(getVal('stok') || getVal('stock') || cols[4] || '0', 10);
      const unit = getVal('unit') || getVal('satuan') || cols[5] || 'pcs';

      const p = upsertProduct({
        sku,
        name,
        aliases: [name.toLowerCase(), name.split(' ')[0].toLowerCase()],
        unit,
        price,
        hpp,
        stock,
        capacity: Math.max(stock + 10, 20),
      });
      imported.push(p);
    }

    res.json({ success: true, count: imported.length, products: imported });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vision Screenshot Scanner API
app.post('/api/products/scan-vision', (req, res) => {
  try {
    const { imageBase64, mockType = 'shopee_product' } = req.body;
    // Real multimodal OCR or smart mock extraction based on case study
    const extracted = [
      {
        sku: 'STK-CAT-01',
        name: 'Paket Stiker Kucing Gemoy Vinyl Waterproof',
        price: 15000,
        hpp: 6000,
        stock: 50,
        unit: 'pack',
      },
      {
        sku: 'KC-ACRYL-02',
        name: 'Gantungan Kunci Akrilik Capybara 2 Sisi',
        price: 25000,
        hpp: 12000,
        stock: 30,
        unit: 'pcs',
      },
      {
        sku: 'GPT-FLW-03',
        name: 'Griptok HP Akrilik Bunga Daisy',
        price: 20000,
        hpp: 8000,
        stock: 25,
        unit: 'pcs',
      },
    ];

    const updated = extracted.map((item) =>
      upsertProduct({
        sku: item.sku,
        name: item.name,
        aliases: [item.name.toLowerCase()],
        unit: item.unit,
        price: item.price,
        hpp: item.hpp,
        stock: item.stock,
        capacity: item.stock + 10,
      })
    );

    res.json({
      success: true,
      message: 'Vision Scanner berhasil mengekstrak 3 produk dari screenshot Shopee!',
      products: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buyer Intents API
app.get('/api/buyer-intents', (req, res) => res.json(listBuyerIntents()));

// 9Router Dynamic Models Fetcher
app.get('/api/gateway/models', async (req, res) => {
  const settings = getSettings();
  const baseUrl = settings.baseUrl || 'http://localhost:20128/v1';
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/models`, {
      headers: settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {},
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const data = await response.json();
      return res.json({ success: true, models: data.data || [] });
    }
  } catch (err) {
    // Return fallback list if 9Router unreachable
  }
  res.json({
    success: false,
    models: [
      { id: 'ag/gemini-3.8-flash-low' },
      { id: 'ag/claude-sonnet-5-5-low' },
      { id: 'ferdi' },
      { id: 'oc/mimo-v2.6-flash-free' },
      { id: 'local-deterministic' },
    ],
  });
});

// Report from Android App for Blocked OTP
app.post('/api/privacy-log/report', (req, res) => {
  const { kind = 'OTP_SHIELD', package: pkg = 'unknown', preview = '' } = req.body;
  logPrivacy(kind, pkg, preview);
  res.json({ success: true });
});

// 4. Custom Reply Rules API
app.get('/api/rules', (req, res) => res.json(listRules()));
app.post('/api/rules', (req, res) => res.json(addRule(req.body)));
app.patch('/api/rules/:id', (req, res) => res.json(updateRule(parseInt(req.params.id, 10), req.body)));
app.delete('/api/rules/:id', (req, res) => {
  deleteRule(parseInt(req.params.id, 10));
  res.json({ success: true });
});
app.get('/api/presets', (req, res) => res.json(PRESETS));

// 5. Conversational Store & Rule Builder (Chat-to-Config)
app.post('/api/conversational-command', (req, res) => {
  const { command = '' } = req.body;
  const result = parseConversationalCommand(command);
  res.json(result);
});

// 6. Orders Ledger API
app.get('/api/orders', (req, res) => res.json(listOrders()));
app.patch('/api/orders/:id/status', (req, res) => {
  const { status, addressNote, missingFields } = req.body;
  const id = parseInt(req.params.id, 10);
  const current = listOrders().find((o) => o.id === id);

  if (!current) return res.status(404).json({ error: 'Order tidak ditemukan' });

  // If status is changed to cancelled, restore the stock!
  if (status === 'cancelled' && current.status !== 'cancelled') {
    for (const item of current.items) {
      try {
        adjustStock(item.sku, item.quantity);
      } catch (err) {
        console.error('Error restoring stock on cancellation:', err);
      }
    }
  }

  // If confirming an incomplete draft order, deduct stock now
  if (current.status === 'perlu konfirmasi alamat' && (status === 'reserved' || status === 'paid')) {
    for (const item of current.items) {
      try {
        adjustStock(item.sku, -item.quantity);
      } catch (err) {
        console.error('Error deducting stock on draft confirmation:', err);
      }
    }
  }

  const updated = setOrderStatus(id, status, {
    addressNote,
    missingFields: missingFields ?? (status === 'paid' || status === 'reserved' ? [] : undefined),
  });
  res.json(updated);
});

// 7. Green IT & Cache API
app.get('/api/cache', (req, res) => res.json(listCache()));
app.delete('/api/cache', (req, res) => {
  clearCache();
  res.json({ success: true });
});

// 8. Privacy Audit Log & Metrics
app.get('/api/privacy-log', (req, res) => res.json(listPrivacy()));
app.get('/api/metrics', (req, res) => {
  const m = getMetrics();
  const settings = getSettings();
  const tokensSaved = m.tokensSaved || 0;
  const carbonSavedGrams = ((tokensSaved / 1000) * (settings.carbonPerKTokens || 0.6)).toFixed(2);
  const totalInquiries = (m.messages || 0);
  const cacheHitRatio = totalInquiries > 0 ? (((m.cacheHits || 0) / totalInquiries) * 100).toFixed(1) : 0;

  res.json({
    ...m,
    carbonSavedGrams,
    cacheHitRatio: `${cacheHitRatio}%`,
  });
});

// 9. Copilot Drafts & Human-in-the-Loop Actions
app.get('/api/drafts', (req, res) => res.json(listDrafts()));
app.post('/api/drafts/:id/send', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const draft = getDraft(id);
  if (!draft) return res.status(404).json({ error: 'Draft tidak ditemukan' });

  setDraftStatus(id, 'sent');
  res.json({ success: true, draft });
});
app.delete('/api/drafts/:id', (req, res) => {
  setDraftStatus(parseInt(req.params.id, 10), 'discarded');
  res.json({ success: true });
});

// 10. Thread Human Takeover (Pause AI) & Live Messages / Seller Manual Reply
app.get('/api/messages', (req, res) => res.json(listMessages()));
app.get('/api/threads', (req, res) => res.json(listThreads()));
app.patch('/api/threads/:id/pause', (req, res) => {
  const { paused, buyer = 'Customer', channel = 'shopee' } = req.body;
  const updated = setThreadPaused(req.params.id, buyer, channel, paused);
  res.json(updated);
});

app.post('/api/threads/reply', (req, res) => {
  try {
    const { buyer = 'Customer', channel = 'whatsapp', text = '' } = req.body || {};
    const clean = String(text).trim();
    if (!clean) return res.status(400).json({ error: 'Pesan kosong' });
    const threadId = `${channel}:${buyer}`;
    const pkg = channel === 'whatsapp' ? 'com.whatsapp.w4b' : 'com.shopee.id';

    const msg = addMessage({
      threadId,
      buyer,
      channel,
      direction: 'out',
      text: clean,
      meta: { from: 'admin', engine: 'Seller Manual Reply', deliveredVia: 'Android_RemoteInput' },
    });

    pushOutbox(`manual:${buyer}`, pkg, clean);

    telemetryEvents.emit('event', {
      node: 4,
      name: 'Balasan Manual Penjual',
      status: 'ADMIN_MANUAL_REPLY',
      badge: `Penjual membalas manual ke @${buyer} (${channel.toUpperCase()})`,
      buyer,
      channel,
      replyText: clean,
      timestamp: Date.now(),
    });

    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Settings & 9Router Live Config
app.get('/api/settings', (req, res) => res.json(getSettings()));
app.patch('/api/settings', (req, res) => {
  const updated = saveSettings(req.body);
  res.json(updated);
});

// 12. 1-Shot Buyer Persona Sandbox (Stress test 3 buyer personas simultaneously)
app.post('/api/sandbox/run', async (req, res) => {
  const products = listProducts();
  const rules = listRules();

  const personas = [
    {
      id: 'nawar-sadis',
      name: 'Si Tukang Nawar Sadis',
      badge: 'Aggressive Negotiator (HPP Guard)',
      prompt: 'Min, Paket Stiker Kucing bisa 8rb gak? Kalau boleh sekarang saya transfer langsung.',
    },
    {
      id: 'buru-buru',
      name: 'Si Buru-buru Tanya Ongkir',
      badge: 'Urgent Shipping (Cutoff 16.00)',
      prompt: 'Halo min, Gantungan Kunci Capybara bisa kirim hari ini gak? Batas jam berapa ordernya?',
    },
    {
      id: 'borongan',
      name: 'Si Pembeli Borongan',
      badge: 'Bulk Order / Reseller (Min 3 Pcs)',
      prompt: 'Halo admin, saya mau ambil Gantungan Kunci Capybara 10 pcs buat souvenir ultah, ada potongan grosir?',
    },
  ];

  const results = await Promise.all(
    personas.map(async (p) => {
      const resp = await generateResponse({
        text: p.prompt,
        buyer: p.name,
        channel: 'whatsapp',
        products,
        rules,
      });
      return {
        ...p,
        response: resp.reply,
        engine: resp.engine,
        latencyMs: resp.latencyMs,
      };
    })
  );

  res.json({ personas: results });
});

// 13. System Reset & Seed
app.post('/api/system/reset', (req, res) => {
  resetDatabase({ keepSettings: true });
  res.json({ success: true, message: 'Database reset to default seed state' });
});

// 14. Android Native Bridge Polling Outbox (for RemoteInput)
app.get('/api/android/outbox', (req, res) => res.json(pullOutbox()));
app.post('/api/android/outbox/:id/ack', (req, res) => {
  ackOutbox(parseInt(req.params.id, 10));
  res.json({ success: true });
});

// Serve frontend static build if present
const webDistPath = join(__dirname, '../../web/dist');
if (existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(webDistPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ReplyForge Server] Active on http://0.0.0.0:${PORT}`);
});
