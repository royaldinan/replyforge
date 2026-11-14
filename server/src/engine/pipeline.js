// Central Processing Pipeline & Real-Time Telemetry Hub.
// Handles:
// 1. Android OS Notification Interception & Whitelist Filter
// 2. Client-Side PII & OTP Shield (UU PDP Compliance)
// 3. Green IT Semantic Cache Check (0ms response)
// 4. 3-Second Humanized Debounce Queue (aggregates burst fragmented messages)
// 5. Anti-Self-Reply Loop Prevention
// 6. Real-time Inventory Mutation on Order Deal
// 7. SSE Broadcast to Frontend Animated Telemetry Pipeline
// 8. Auto-Pilot vs 1-Tap Smart Copilot routing

import EventEmitter from 'node:events';
import {
  getSettings,
  bumpMetric,
  logPrivacy,
  addMessage,
  recentOutgoing,
  getThread,
  setThreadPaused,
  listProducts,
  listRules,
  adjustStock,
  insertOrder,
  addDraft,
  pushOutbox,
  recordBuyerIntent,
  getLatestBuyerIntent,
  updateBuyerIntentStatus,
  addAnomalyAlert,
} from '../db.js';
import { inspectPrivacy } from './pii.js';
import { inspectBuyerAnomaly } from './anomaly.js';
import { matchSemanticCache, saveToSemanticCache } from './cache.js';
import { generateResponse } from './gateway.js';
import { parseOrderIntent } from './intent.js';

export const telemetryEvents = new EventEmitter();

// In-memory queue for 3-second debounce (merging split messages from the same buyer)
const debounceQueues = new Map();

export async function processIncomingNotification({
  buyer = 'Budi Santoso',
  channel = 'shopee',
  packageName = 'com.shopee.id',
  text = '',
  notificationKey = `notif_${Date.now()}`,
  isGroup = false,
}) {
  const settings = getSettings();
  const threadId = `${channel}:${buyer}`;
  bumpMetric('messages', 1);

  // Broadcast Node 1: Notification Intercepted
  broadcastTelemetry({
    node: 1,
    name: 'Notification Intercepted',
    status: 'ACTIVE',
    channel,
    buyer,
    preview: text,
    timestamp: Date.now(),
  });

  // Guard: Package Whitelist & Group Chat Filter
  if (settings.blockGroups && isGroup) {
    bumpMetric('blocked', 1);
    broadcastTelemetry({
      node: 1,
      name: 'Notification Intercepted',
      status: 'BLOCKED',
      reason: 'GROUP_CHAT_IGNORED',
      timestamp: Date.now(),
    });
    return { success: false, reason: 'Group conversation blocked by safety policy' };
  }

  const whitelist = settings.whitelist || {};
  if (whitelist[packageName] === false) {
    bumpMetric('blocked', 1);
    broadcastTelemetry({
      node: 1,
      name: 'Notification Intercepted',
      status: 'BLOCKED',
      reason: 'PACKAGE_NOT_WHITELISTED',
      timestamp: Date.now(),
    });
    return { success: false, reason: 'App package not whitelisted' };
  }

  // Guard 0: Ignore self-notifications or business owner name
  const normBuyer = String(buyer || '').trim().toLowerCase();
  if (normBuyer === 'anda' || normBuyer === 'you' || normBuyer === 'me' || normBuyer === 'whatsapp' ||
      normBuyer.includes('lina shop') || normBuyer.includes('mahiru') ||
      text.toLowerCase().includes('memeriksa pesan baru')) {
    bumpMetric('selfLoopsBlocked', 1);
    return { success: false, reason: 'Self/system notification dropped' };
  }

  // Guard: Anti-Self-Reply Loop
  const recent = recentOutgoing(threadId, 15000);
  if (recent.some((m) => m.trim().toLowerCase() === text.trim().toLowerCase())) {
    bumpMetric('selfLoopsBlocked', 1);
    return { success: false, reason: 'Self-reply echo loop prevented' };
  }

  // Guard: Human Takeover (Pause AI per buyer)
  const threadState = getThread(threadId);
  if (threadState && threadState.paused) {
    addMessage({
      threadId,
      buyer,
      channel,
      direction: 'in',
      text,
      meta: { paused: true },
    });
    return { success: true, status: 'PAUSED_BY_SELLER' };
  }

  // NODE 2: Client-Side PII Guard & Green Cache
  const privacy = inspectPrivacy(text, packageName);
  if (privacy.blocked) {
    bumpMetric('blocked', 1);
    logPrivacy(privacy.kind, packageName, privacy.preview);

    broadcastTelemetry({
      node: 2,
      name: 'PII Guard & Green Cache',
      status: 'CRITICAL_BLOCK',
      badge: 'BLOCKED LOCALLY: Sensitive OTP Detected — 0 Bytes Sent to AI',
      timestamp: Date.now(),
      color: 'red',
    });

    return {
      success: false,
      blocked: true,
      reason: 'SENSITIVE_OTP_BLOCKED_LOCALLY',
    };
  }

  if (privacy.redactions > 0) {
    bumpMetric('redactions', privacy.redactions);
    logPrivacy(privacy.kind, packageName, privacy.preview);
  }

  const cleanText = privacy.cleanText;

  // Record incoming message in DB
  addMessage({
    threadId,
    buyer,
    channel,
    direction: 'in',
    text: cleanText,
    meta: { rawText: text, redactions: privacy.redactions },
  });

  // Check: Is this a Shopee Seller Payment / System Order Notification?
  const paymentNotification = detectShopeePaymentNotification(cleanText, buyer, packageName);
  if (paymentNotification) {
    return handleShopeePaymentNotification(paymentNotification);
  }

  // Check Green Semantic Cache (0ms response)
  const products = listProducts();

  // Check: AI Anomaly & Escalation Guard (Unusual Quantity / Weird or Suspicious Query)
  const anomaly = inspectBuyerAnomaly(cleanText, buyer, channel, products);
  if (anomaly.isAnomaly) {
    bumpMetric('anomaliesDetected', 1);
    setThreadPaused(threadId, buyer, channel, true);

    const alert = addAnomalyAlert({
      threadId,
      buyer,
      channel,
      kind: anomaly.kind,
      severity: anomaly.severity,
      title: anomaly.title,
      reason: anomaly.reason,
      messageText: cleanText,
      requestedQty: anomaly.requestedQty,
      sku: anomaly.sku,
    });

    broadcastTelemetry({
      node: 2,
      name: 'PII Guard & Anomaly Filter',
      status: 'ANOMALY_ESCALATED',
      badge: `PERINGATAN PENJUAL: ${anomaly.title} (@${buyer}) — Auto-Reply Dijeda!`,
      alert,
      buyer,
      channel,
      timestamp: Date.now(),
      color: 'red',
    });

    return {
      success: true,
      escalatedToSeller: true,
      paused: true,
      anomaly: alert,
      reason: anomaly.reason,
    };
  }

  const allAliases = products.flatMap((p) => p.aliases || []);
  const cacheHit = matchSemanticCache(cleanText, allAliases, settings.cacheThreshold || 0.55);

  if (cacheHit && cacheHit.hit && !anomaly.isIncompleteOrder) {
    broadcastTelemetry({
      node: 2,
      name: 'PII Guard & Green Cache',
      status: 'CACHE_HIT',
      badge: 'Green Cache Hit (0ms) — Token & Compute Saved',
      timestamp: Date.now(),
      color: 'emerald',
    });

    return handleOutgoingReply({
      threadId,
      buyer,
      channel,
      notificationKey,
      packageName,
      replyText: cacheHit.template,
      engine: 'On-Device Green Cache (0ms)',
      latencyMs: 0,
      cleanText,
    });
  }

  broadcastTelemetry({
    node: 2,
    name: 'PII Guard & Green Cache',
    status: 'PASSED',
    badge: 'PII Cleaned · Cache Miss',
    timestamp: Date.now(),
  });

  // NODE 3 & 4: Debounce Queue -> AI / Fallback Engine -> Anti-ban Delay
  return enqueueDebounce({
    threadId,
    buyer,
    channel,
    notificationKey,
    packageName,
    text: cleanText,
    products,
    settings,
  });
}

function enqueueDebounce(item) {
  return new Promise((resolve) => {
    const key = item.threadId;
    if (debounceQueues.has(key)) {
      const q = debounceQueues.get(key);
      clearTimeout(q.timer);
      q.messages.push(item.text);
      bumpMetric('mergedFragments', 1);
      q.timer = setTimeout(() => executeMergedInquiry(key, resolve), item.settings.debounceMs || 2500);
    } else {
      debounceQueues.set(key, {
        item,
        messages: [item.text],
        timer: setTimeout(() => executeMergedInquiry(key, resolve), item.settings.debounceMs || 2500),
      });
    }
  });
}

async function executeMergedInquiry(key, resolve) {
  const queueData = debounceQueues.get(key);
  debounceQueues.delete(key);
  if (!queueData) return;

  const { item, messages } = queueData;
  const mergedText = messages.join(' ');
  const { threadId, buyer, channel, notificationKey, packageName, settings } = item;
  const products = listProducts();
  const rules = listRules();

  // NODE 3: AI Model Call / Smart Local Fallback
  broadcastTelemetry({
    node: 3,
    name: '9Router AI + SQLite Sync',
    status: 'PROCESSING',
    preview: mergedText,
    timestamp: Date.now(),
  });

  // Check for Order Intent (Auto Stock Depletion or Incomplete Order Draft)
  const anomaly = inspectBuyerAnomaly(mergedText, buyer, channel, products);
  const orderIntent = parseOrderIntent(mergedText, buyer);
  let orderCreated = null;

  if (orderIntent && orderIntent.isOrder && channel !== 'shopee') {
    try {
      const missingFields = anomaly.isIncompleteOrder ? anomaly.missingFields : [];
      const isIncomplete = missingFields.length > 0;

      let updatedProduct = orderIntent.product;
      if (!isIncomplete) {
        updatedProduct = adjustStock(orderIntent.sku, -orderIntent.quantity);
      } else {
        addAnomalyAlert({
          threadId,
          buyer,
          channel,
          kind: 'INCOMPLETE_ORDER',
          severity: 'medium',
          title: anomaly.warningTitle || 'Draf Pesanan Perlu Konfirmasi Alamat',
          reason: anomaly.warningReason || 'Alamat pengiriman belum jelas ("kayak biasa"). Tanyakan ke pembeli.',
          messageText: mergedText,
          requestedQty: orderIntent.quantity,
          sku: orderIntent.sku,
        });
      }

      // Record Order in Order Ledger
      orderCreated = insertOrder({
        buyer,
        channel,
        items: [
          {
            sku: orderIntent.sku,
            name: orderIntent.product.name,
            quantity: orderIntent.quantity,
            price: orderIntent.product.price,
            unit: orderIntent.product.unit,
          },
        ],
        total: orderIntent.totalPrice,
        status: isIncomplete ? 'perlu konfirmasi alamat' : 'reserved',
        source: 'chat',
        missingFields,
        addressNote: isIncomplete ? 'Belum jelas ("kayak biasa") — Tanyakan ke pembeli' : 'Lengkap via Chat',
      });

      bumpMetric('ordersFromChat', 1);

      // Record in Buyer Intent Sessions
      recordBuyerIntent({
        buyer,
        channel,
        sku: orderIntent.sku,
        productName: orderIntent.product.name,
        quantity: orderIntent.quantity,
        totalPrice: orderIntent.totalPrice,
        status: isIncomplete ? 'incomplete_draft' : 'ordered',
        lastMessage: mergedText,
      });

      broadcastTelemetry({
        node: 3,
        name: '9Router AI + SQLite Sync',
        status: isIncomplete ? 'DRAFT_NEEDS_CONFIRMATION' : 'STOCK_DEPLETED',
        badge: isIncomplete
          ? `Draf Pesanan Dibuat (${orderIntent.product.name}) — Alamat Belum Jelas Ditandai!`
          : `Stock Decremented: ${orderIntent.product.name} (-${orderIntent.quantity})`,
        product: updatedProduct,
        order: orderCreated,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[Order Error]', err.message);
    }
  }

  // Generate Reply (9Router Gateway with Gemini or Deterministic Smart Engine)
  let aiResult = await generateResponse({
    text: mergedText,
    buyer,
    channel,
    products,
    rules,
  });

  if (anomaly.isIncompleteOrder && orderIntent && orderIntent.isOrder) {
    aiResult = {
      ...aiResult,
      reply: `Siap kak ${buyer}! Draf pesanan ${orderIntent.quantity} ${orderIntent.product.unit} ${orderIntent.product.name} (Total Rp${orderIntent.totalPrice.toLocaleString('id-ID')}) sudah kami catat. Mohon konfirmasi alamat lengkap pengirimannya ya kak agar tidak salah kirim 🙏`,
    };
  }

  broadcastTelemetry({
    node: 3,
    name: '9Router AI + SQLite Sync',
    status: 'COMPLETE',
    engine: aiResult.engine,
    latencyMs: aiResult.latencyMs,
    timestamp: Date.now(),
  });

  // If this was a product inquiry (not an order), optionally save to Green Semantic Cache
  if (!orderCreated && aiResult.productSku) {
    saveToSemanticCache({
      intent: 'PRODUCT_INQUIRY',
      skus: [aiResult.productSku],
      question: mergedText,
      template: aiResult.reply,
      productAliases: products.flatMap((p) => p.aliases || []),
    });
  }

  const result = await handleOutgoingReply({
    threadId,
    buyer,
    channel,
    notificationKey,
    packageName,
    replyText: aiResult.reply,
    engine: aiResult.engine,
    latencyMs: aiResult.latencyMs,
    cleanText: mergedText,
    order: orderCreated,
  });

  resolve(result);
}

async function handleOutgoingReply({
  threadId,
  buyer,
  channel,
  notificationKey,
  packageName,
  replyText,
  engine,
  latencyMs,
  cleanText,
  order = null,
}) {
  const settings = getSettings();

  // If mode is Copilot (Human-in-the-Loop 1-Tap Mode)
  if (settings.mode === 'copilot' || channel === 'shopee') {
    const draft = addDraft({
      threadId,
      buyer,
      channel,
      question: cleanText,
      text: replyText,
      engine,
    });

    broadcastTelemetry({
      node: 4,
      name: 'Anti-Ban Delay & RemoteInput Sent',
      status: 'AWAITING_HUMAN_COPILOT',
      badge: '1-Tap Copilot Mode: Draft ready for seller tap',
      draft,
      timestamp: Date.now(),
    });

    return {
      success: true,
      mode: 'copilot',
      draft,
      order,
    };
  }

  // NODE 4: Anti-Ban Humanized Typing Delay & Dispatch
  const delayMs = settings.typingDelayMs || 2500;

  broadcastTelemetry({
    node: 4,
    name: 'Anti-Ban Delay & RemoteInput Sent',
    status: 'TYPING_SIMULATION',
    badge: `Simulating Human Typing (${delayMs / 1000}s Anti-Ban Delay)...`,
    delayMs,
    timestamp: Date.now(),
  });

  await new Promise((r) => setTimeout(r, delayMs));

  // Push to Android OS Outbox (for RemoteInput dispatch)
  pushOutbox(notificationKey, packageName, replyText);

  // Save to DB outgoing history
  const outMsg = addMessage({
    threadId,
    buyer,
    channel,
    direction: 'out',
    text: replyText,
    meta: { engine, latencyMs, deliveredVia: 'Android_RemoteInput' },
  });

  broadcastTelemetry({
    node: 4,
    name: 'Anti-Ban Delay & RemoteInput Sent',
    status: 'SENT',
    badge: 'Dispatched via Android RemoteInput (Zero-Ban Risk)',
    replyText,
    timestamp: Date.now(),
  });

  return {
    success: true,
    mode: 'autopilot',
    reply: replyText,
    engine,
    order,
    message: outMsg,
  };
}

function broadcastTelemetry(payload) {
  telemetryEvents.emit('event', payload);
}

function detectShopeePaymentNotification(text, title, packageName) {
  const norm = text.toLowerCase();
  const isPayment = (
    norm.includes('pembayaran dikonfirmasi') ||
    norm.includes('pembayaran untuk pesanan') ||
    norm.includes('telah dikonfirmasi') ||
    norm.includes('pesanan baru') ||
    norm.includes('telah dibayar') ||
    norm.includes('perlu dikirim')
  );
  if (!isPayment) return null;

  const orderMatch = text.match(/#([a-zA-Z0-9_-]+)/i) || text.match(/pesanan\s+([a-zA-Z0-9_-]{6,})/i);
  const orderId = orderMatch ? (orderMatch[0].startsWith('#') ? orderMatch[0] : `#${orderMatch[1]}`) : `#${Date.now()}LINA`;

  const buyerMatch = text.match(/dari\s+@?([a-zA-Z0-9_.-]+)/i) || text.match(/pembeli\s+@?([a-zA-Z0-9_.-]+)/i);
  let buyerUsername = buyerMatch ? buyerMatch[1].trim() : (title && !title.toLowerCase().includes('shopee') && !title.toLowerCase().includes('customer') ? title.replace(/^@/, '').trim() : 'silent_buyer');

  return {
    orderId,
    buyerUsername,
    rawText: text,
    packageName,
  };
}

async function handleShopeePaymentNotification({ orderId, buyerUsername, rawText, packageName }) {
  bumpMetric('ordersFromChat', 1);

  // Match buyer against buyer_intent_sessions
  const intent = getLatestBuyerIntent(buyerUsername);
  let orderCreated = null;
  let updatedProduct = null;

  if (intent && intent.sku) {
    try {
      // Auto-deduct stock in SQLite
      updatedProduct = adjustStock(intent.sku, -intent.quantity);
      updateBuyerIntentStatus(intent.id, 'paid');
    } catch (e) {
      console.warn('[Stock Depletion on Payment]', e.message);
    }

    orderCreated = insertOrder({
      code: orderId,
      buyer: buyerUsername,
      channel: 'shopee',
      items: [
        {
          sku: intent.sku,
          name: intent.product_name,
          quantity: intent.quantity,
          price: intent.quantity > 0 ? Math.round(intent.total_price / intent.quantity) : intent.total_price,
          unit: 'pcs',
        },
      ],
      total: intent.total_price,
      status: 'lunas / perlu dikirim',
      source: 'shopee_seller_payment',
    });

    broadcastTelemetry({
      node: 3,
      name: '9Router AI + SQLite Sync',
      status: 'PAYMENT_VERIFIED_STOCK_DEPLETED',
      badge: `Shopee Payment Verified: ${orderId} (@${buyerUsername}) -> LUNAS & Stok ${intent.product_name} (-${intent.quantity})!`,
      product: updatedProduct,
      order: orderCreated,
      timestamp: Date.now(),
      color: 'emerald',
    });
  } else {
    // Silent Buyer (Direct Checkout without prior chat)
    orderCreated = insertOrder({
      code: orderId,
      buyer: buyerUsername,
      channel: 'shopee',
      items: [],
      total: 0,
      status: 'perlu dikirim (silent buyer)',
      source: 'shopee_seller_direct',
    });

    broadcastTelemetry({
      node: 3,
      name: '9Router AI + SQLite Sync',
      status: 'SILENT_BUYER_CAPTURED',
      badge: `Pesanan Baru Shopee Silent Buyer: ${orderId} (@${buyerUsername}) — Siap Ditautkan 1-Tap!`,
      order: orderCreated,
      timestamp: Date.now(),
      color: 'blue',
    });
  }

  // Node 4 Complete
  broadcastTelemetry({
    node: 4,
    name: 'Anti-Ban Delay & Dispatched',
    status: 'TRANSACTION_RECORDED',
    badge: `Transaksi ${orderId} Tercatat di Menu Transaksi Masuk`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    isPaymentNotification: true,
    orderId,
    buyer: buyerUsername,
    order: orderCreated,
  };
}
