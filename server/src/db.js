// SQLite persistence via Node's built-in node:sqlite (Node >= 22.5).
// No native compilation, no external DB server: `npm run dev` just works.
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

for (const envCandidate of [join(here, '..', '.env'), join(here, '..', '..', '.env')]) {
  if (existsSync(envCandidate)) {
    try {
      const lines = readFileSync(envCandidate, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) process.env[key] = val;
        }
      }
    } catch {
      // ignore .env read errors
    }
  }
}

import { SEED_PRODUCTS, SEED_RULES, DEFAULT_SETTINGS, DEFAULT_STORE_ACCOUNT } from './seed.js';

const DB_PATH = process.env.REPLYFORGE_DB || join(here, '..', 'data', 'replyforge.db');
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',
  unit TEXT NOT NULL DEFAULT 'pcs',
  price INTEGER NOT NULL,
  hpp INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS buyer_intent_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer TEXT NOT NULL,
  channel TEXT NOT NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'inquiry',
  last_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS custom_reply_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  triggers TEXT NOT NULL,
  response TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  buyer TEXT NOT NULL,
  channel TEXT NOT NULL,
  items TEXT NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved',
  source TEXT NOT NULL DEFAULT 'chat',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS semantic_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intent TEXT NOT NULL,
  skus TEXT NOT NULL,
  tokens TEXT NOT NULL,
  question TEXT NOT NULL,
  template TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_hit INTEGER
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  buyer TEXT NOT NULL,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL,
  text TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS privacy_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  package TEXT NOT NULL,
  preview TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  buyer TEXT NOT NULL,
  channel TEXT NOT NULL,
  question TEXT NOT NULL,
  text TEXT NOT NULL,
  engine TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'null',
  meta TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  buyer TEXT NOT NULL,
  channel TEXT NOT NULL,
  paused INTEGER NOT NULL DEFAULT 0,
  last_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notif_key TEXT NOT NULL,
  package TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  buyer TEXT NOT NULL,
  channel TEXT NOT NULL,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'high',
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  message_text TEXT NOT NULL,
  requested_qty INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS store_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  store_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'UMKM & Ekonomi Kreatif',
  shopee_handle TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  bank_account TEXT NOT NULL DEFAULT '',
  shopee_connected INTEGER NOT NULL DEFAULT 1,
  whatsapp_connected INTEGER NOT NULL DEFAULT 1,
  os_notification_granted INTEGER NOT NULL DEFAULT 1,
  onboarding_completed INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
`);

for (const migration of [
  'ALTER TABLE products ADD COLUMN max_order_normal INTEGER NOT NULL DEFAULT 15',
  "ALTER TABLE orders ADD COLUMN missing_fields TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE orders ADD COLUMN address_note TEXT NOT NULL DEFAULT ''",
]) {
  try {
    db.exec(migration);
  } catch {
    // Column already exists
  }
}

const now = () => Date.now();

export function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ---------- key/value: settings + metrics ----------
export function kvGet(key, fallback = null) {
  const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : fallback;
}
export function kvSet(key, value) {
  db.prepare('INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, JSON.stringify(value));
}

export function getSettings() {
  const saved = kvGet('settings', {});
  const merged = { ...DEFAULT_SETTINGS, ...saved };
  if (!merged.apiKey && process.env.REPLYFORGE_API_KEY) merged.apiKey = process.env.REPLYFORGE_API_KEY;
  return merged;
}
export function saveSettings(patch) {
  const current = kvGet('settings', {});
  const next = { ...current, ...patch };
  kvSet('settings', next);
  return getSettings();
}

const METRIC_KEYS = ['messages', 'llmCalls', 'localEngine', 'cacheHits', 'tokensSaved', 'blocked', 'redactions', 'ordersFromChat', 'mergedFragments', 'selfLoopsBlocked', 'anomaliesDetected'];
export function getMetrics() {
  const m = kvGet('metrics', {});
  for (const k of METRIC_KEYS) m[k] ??= 0;
  return m;
}
export function bumpMetric(key, by = 1) {
  const m = getMetrics();
  m[key] = (m[key] || 0) + by;
  kvSet('metrics', m);
  return m;
}

// ---------- store accounts & onboarding ----------
function ensureDefaultStoreAccount() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM store_accounts').get().n;
  if (count === 0) {
    db.prepare(`
      INSERT INTO store_accounts(
        email, phone, password, owner_name, store_name, category,
        shopee_handle, whatsapp_number, bank_account,
        shopee_connected, whatsapp_connected, os_notification_granted, onboarding_completed, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      DEFAULT_STORE_ACCOUNT.email,
      DEFAULT_STORE_ACCOUNT.phone,
      'linashop2026',
      DEFAULT_STORE_ACCOUNT.ownerName,
      DEFAULT_STORE_ACCOUNT.storeName,
      DEFAULT_STORE_ACCOUNT.category,
      DEFAULT_STORE_ACCOUNT.shopeeHandle,
      DEFAULT_STORE_ACCOUNT.whatsappNumber,
      DEFAULT_STORE_ACCOUNT.bankAccount,
      1,
      1,
      1,
      1,
      now(),
    );
  }
}
ensureDefaultStoreAccount();

const parseStoreAccount = (r) =>
  r && {
    id: r.id,
    email: r.email,
    phone: r.phone,
    ownerName: r.owner_name,
    storeName: r.store_name,
    category: r.category,
    shopeeHandle: r.shopee_handle,
    whatsappNumber: r.whatsapp_number,
    bankAccount: r.bank_account,
    shopeeConnected: !!r.shopee_connected,
    whatsappConnected: !!r.whatsapp_connected,
    osNotificationGranted: !!r.os_notification_granted,
    onboardingCompleted: !!r.onboarding_completed,
    created_at: r.created_at,
  };

export function getActiveStoreAccount() {
  ensureDefaultStoreAccount();
  const activeEmail = kvGet('active_store_email', DEFAULT_STORE_ACCOUNT.email);
  const row =
    db.prepare('SELECT * FROM store_accounts WHERE LOWER(email) = LOWER(?)').get(activeEmail) ||
    db.prepare('SELECT * FROM store_accounts ORDER BY id LIMIT 1').get();
  return parseStoreAccount(row);
}

export function loginStoreAccount({ identifier = '', password = '' }) {
  ensureDefaultStoreAccount();
  const clean = String(identifier).trim().toLowerCase();
  const row = db
    .prepare('SELECT * FROM store_accounts WHERE LOWER(email) = ? OR phone = ? OR LOWER(store_name) = ?')
    .get(clean, clean, clean);
  if (!row) throw new Error('Akun toko tidak ditemukan. Silakan daftar toko baru atau gunakan Akun Demo.');
  if (password && row.password !== password) {
    throw new Error('Password tidak sesuai.');
  }
  kvSet('active_store_email', row.email);
  const acc = parseStoreAccount(row);
  saveSettings({
    storeName: acc.storeName,
    ownerName: acc.ownerName,
    email: acc.email,
    shopeeHandle: acc.shopeeHandle,
    whatsappNumber: acc.whatsappNumber,
    bankAccount: acc.bankAccount,
    shopeeConnected: acc.shopeeConnected,
    whatsappConnected: acc.whatsappConnected,
    osNotificationGranted: acc.osNotificationGranted,
    onboardingCompleted: acc.onboardingCompleted,
  });
  return acc;
}

export function registerStoreAccount({
  email,
  phone = '',
  password = 'password123',
  ownerName = 'Pemilik Toko',
  storeName = 'Toko UMKM Baru',
  category = 'UMKM & Ekonomi Kreatif',
  shopeeHandle = '',
  whatsappNumber = '',
  bankAccount = '',
}) {
  if (!email || !storeName) throw new Error('Email dan Nama Toko wajib diisi.');
  const cleanEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT * FROM store_accounts WHERE LOWER(email) = ?').get(cleanEmail);
  if (existing) {
    throw new Error('Email sudah terdaftar. Silakan masuk dengan akun tersebut.');
  }
  const info = db
    .prepare(`
      INSERT INTO store_accounts(
        email, phone, password, owner_name, store_name, category,
        shopee_handle, whatsapp_number, bank_account,
        shopee_connected, whatsapp_connected, os_notification_granted, onboarding_completed, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `)
    .run(
      cleanEmail,
      phone || whatsappNumber || '081200000000',
      password || 'password123',
      ownerName,
      storeName,
      category,
      shopeeHandle,
      whatsappNumber || phone,
      bankAccount,
      shopeeHandle ? 1 : 0,
      whatsappNumber || phone ? 1 : 0,
      0,
      0,
      now(),
    );
  kvSet('active_store_email', cleanEmail);
  const acc = parseStoreAccount(db.prepare('SELECT * FROM store_accounts WHERE id = ?').get(info.lastInsertRowid));
  saveSettings({
    storeName: acc.storeName,
    ownerName: acc.ownerName,
    email: acc.email,
    shopeeHandle: acc.shopeeHandle,
    whatsappNumber: acc.whatsappNumber,
    bankAccount: acc.bankAccount,
    shopeeConnected: acc.shopeeConnected,
    whatsappConnected: acc.whatsappConnected,
    osNotificationGranted: acc.osNotificationGranted,
    onboardingCompleted: acc.onboardingCompleted,
  });
  return acc;
}

export function updateStoreChannelConnection(patch = {}) {
  const current = getActiveStoreAccount();
  const next = {
    storeName: patch.storeName ?? current.storeName,
    ownerName: patch.ownerName ?? current.ownerName,
    shopeeHandle: patch.shopeeHandle ?? current.shopeeHandle,
    whatsappNumber: patch.whatsappNumber ?? current.whatsappNumber,
    bankAccount: patch.bankAccount ?? current.bankAccount,
    shopeeConnected: patch.shopeeConnected !== undefined ? (patch.shopeeConnected ? 1 : 0) : (current.shopeeConnected ? 1 : 0),
    whatsappConnected: patch.whatsappConnected !== undefined ? (patch.whatsappConnected ? 1 : 0) : (current.whatsappConnected ? 1 : 0),
    osNotificationGranted:
      patch.osNotificationGranted !== undefined ? (patch.osNotificationGranted ? 1 : 0) : (current.osNotificationGranted ? 1 : 0),
    onboardingCompleted:
      patch.onboardingCompleted !== undefined ? (patch.onboardingCompleted ? 1 : 0) : (current.onboardingCompleted ? 1 : 0),
  };

  db.prepare(`
    UPDATE store_accounts
    SET store_name = ?, owner_name = ?, shopee_handle = ?, whatsapp_number = ?, bank_account = ?,
        shopee_connected = ?, whatsapp_connected = ?, os_notification_granted = ?, onboarding_completed = ?
    WHERE id = ?
  `).run(
    next.storeName,
    next.ownerName,
    next.shopeeHandle,
    next.whatsappNumber,
    next.bankAccount,
    next.shopeeConnected,
    next.whatsappConnected,
    next.osNotificationGranted,
    next.onboardingCompleted,
    current.id,
  );

  const updated = getActiveStoreAccount();
  saveSettings({
    storeName: updated.storeName,
    ownerName: updated.ownerName,
    shopeeHandle: updated.shopeeHandle,
    whatsappNumber: updated.whatsappNumber,
    bankAccount: updated.bankAccount,
    shopeeConnected: updated.shopeeConnected,
    whatsappConnected: updated.whatsappConnected,
    osNotificationGranted: updated.osNotificationGranted,
    onboardingCompleted: updated.onboardingCompleted,
  });
  return updated;
}

// ---------- products ----------
const parseProduct = (r) => r && ({ ...r, aliases: JSON.parse(r.aliases), max_order_normal: r.max_order_normal || 15 });
export const listProducts = () => db.prepare('SELECT * FROM products ORDER BY id').all().map(parseProduct);
export const getProductBySku = (sku) => parseProduct(db.prepare('SELECT * FROM products WHERE sku = ?').get(sku));

export function upsertProduct({ sku, name, aliases = [], unit = 'pcs', price, hpp, stock, capacity, max_order_normal }) {
  const existing = getProductBySku(sku);
  if (existing) {
    const nextStock = stock ?? existing.stock;
    const nextHpp = hpp ?? existing.hpp ?? 0;
    const nextMaxOrder = max_order_normal ?? existing.max_order_normal ?? 15;
    db.prepare('UPDATE products SET name = ?, aliases = ?, unit = ?, price = ?, hpp = ?, stock = ?, capacity = ?, max_order_normal = ?, updated_at = ? WHERE sku = ?')
      .run(name ?? existing.name, JSON.stringify(aliases.length ? aliases : existing.aliases), unit ?? existing.unit,
        price ?? existing.price, nextHpp, nextStock, Math.max(capacity ?? existing.capacity, nextStock), nextMaxOrder, now(), sku);
  } else {
    db.prepare('INSERT INTO products(sku, name, aliases, unit, price, hpp, stock, capacity, max_order_normal, updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .run(sku, name, JSON.stringify(aliases), unit, price ?? 0, hpp ?? 0, stock ?? 0, Math.max(capacity ?? 0, stock ?? 0, 1), max_order_normal ?? 15, now());
  }
  return getProductBySku(sku);
}

export function adjustStock(sku, delta) {
  const p = getProductBySku(sku);
  if (!p) throw new Error(`Produk ${sku} tidak ditemukan`);
  const next = p.stock + delta;
  if (next < 0) throw new Error(`Stok ${p.name} tinggal ${p.stock}`);
  db.prepare('UPDATE products SET stock = ?, capacity = MAX(capacity, ?), updated_at = ? WHERE sku = ?').run(next, next, now(), sku);
  return getProductBySku(sku);
}

export function deleteProduct(sku) {
  db.prepare('DELETE FROM products WHERE sku = ?').run(sku);
}

// ---------- rules ----------
const parseRule = (r) => r && ({ ...r, triggers: JSON.parse(r.triggers), enabled: !!r.enabled });
export const listRules = () => db.prepare('SELECT * FROM custom_reply_rules ORDER BY id').all().map(parseRule);
export function addRule({ name, triggers, response, enabled = true, source = 'manual' }) {
  const info = db.prepare('INSERT INTO custom_reply_rules(name, triggers, response, enabled, source, created_at) VALUES(?,?,?,?,?,?)')
    .run(name, JSON.stringify(triggers), response, enabled ? 1 : 0, source, now());
  return parseRule(db.prepare('SELECT * FROM custom_reply_rules WHERE id = ?').get(info.lastInsertRowid));
}
export function updateRule(id, patch) {
  const r = parseRule(db.prepare('SELECT * FROM custom_reply_rules WHERE id = ?').get(id));
  if (!r) throw new Error('Aturan tidak ditemukan');
  const next = { ...r, ...patch };
  db.prepare('UPDATE custom_reply_rules SET name = ?, triggers = ?, response = ?, enabled = ? WHERE id = ?')
    .run(next.name, JSON.stringify(next.triggers), next.response, next.enabled ? 1 : 0, id);
  return parseRule(db.prepare('SELECT * FROM custom_reply_rules WHERE id = ?').get(id));
}
export const deleteRule = (id) => db.prepare('DELETE FROM custom_reply_rules WHERE id = ?').run(id);

// ---------- orders ----------
const parseOrder = (r) =>
  r && {
    ...r,
    items: JSON.parse(r.items || '[]'),
    missing_fields: JSON.parse(r.missing_fields || '[]'),
    address_note: r.address_note || '',
  };
export const listOrders = () => db.prepare('SELECT * FROM orders ORDER BY id DESC').all().map(parseOrder);
export const getOrder = (id) => parseOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
export function insertOrder({ code, buyer, channel, items, total, status = 'reserved', source = 'chat', missingFields = [], addressNote = '' }) {
  const seq = (db.prepare('SELECT COUNT(*) AS n FROM orders').get().n + 1).toString().padStart(4, '0');
  const finalCode = code || `RF-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${seq}`;
  const info = db.prepare('INSERT INTO orders(code, buyer, channel, items, total, status, source, missing_fields, address_note, created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .run(finalCode, buyer, channel, JSON.stringify(items), total, status, source, JSON.stringify(missingFields), addressNote, now());
  return getOrder(info.lastInsertRowid);
}
export function setOrderStatus(id, status, patch = {}) {
  const current = getOrder(id);
  if (!current) return null;
  const nextMissing = patch.missingFields !== undefined ? patch.missingFields : current.missing_fields;
  const nextAddress = patch.addressNote !== undefined ? patch.addressNote : current.address_note;
  db.prepare('UPDATE orders SET status = ?, missing_fields = ?, address_note = ? WHERE id = ?')
    .run(status, JSON.stringify(nextMissing || []), nextAddress || '', id);
  return getOrder(id);
}

// ---------- anomaly alerts ----------
export const listAnomalyAlerts = (limit = 50) =>
  db.prepare('SELECT * FROM anomaly_alerts ORDER BY id DESC LIMIT ?').all(limit);

export function addAnomalyAlert({
  threadId,
  buyer,
  channel,
  kind,
  severity = 'high',
  title,
  reason,
  messageText,
  requestedQty = 0,
  sku = null,
}) {
  const info = db
    .prepare(`
      INSERT INTO anomaly_alerts(
        thread_id, buyer, channel, kind, severity, title, reason, message_text, requested_qty, sku, status, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?, 'open', ?)
    `)
    .run(threadId, buyer, channel, kind, severity, title, reason, messageText, requestedQty, sku, now());
  return db.prepare('SELECT * FROM anomaly_alerts WHERE id = ?').get(info.lastInsertRowid);
}

export function resolveAnomalyAlert(id, status = 'resolved') {
  db.prepare('UPDATE anomaly_alerts SET status = ? WHERE id = ?').run(status, id);
  return db.prepare('SELECT * FROM anomaly_alerts WHERE id = ?').get(id);
}

// ---------- cache ----------
const parseCache = (r) => r && ({ ...r, skus: JSON.parse(r.skus), tokens: JSON.parse(r.tokens) });
export const listCache = () => db.prepare('SELECT * FROM semantic_cache ORDER BY hits DESC, id DESC').all().map(parseCache);
export function insertCache({ intent, skus, tokens, question, template }) {
  db.prepare('INSERT INTO semantic_cache(intent, skus, tokens, question, template, created_at) VALUES(?,?,?,?,?,?)')
    .run(intent, JSON.stringify(skus), JSON.stringify(tokens), question, template, now());
}
export const hitCache = (id) => db.prepare('UPDATE semantic_cache SET hits = hits + 1, last_hit = ? WHERE id = ?').run(now(), id);
export const clearCache = () => db.prepare('DELETE FROM semantic_cache').run();

// ---------- messages / threads ----------
export function addMessage({ threadId, buyer, channel, direction, text, meta = {} }) {
  const info = db.prepare('INSERT INTO messages(thread_id, buyer, channel, direction, text, meta, created_at) VALUES(?,?,?,?,?,?,?)')
    .run(threadId, buyer, channel, direction, text, JSON.stringify(meta), now());
  db.prepare('INSERT INTO threads(id, buyer, channel, paused, last_at) VALUES(?,?,?,0,?) ON CONFLICT(id) DO UPDATE SET last_at = excluded.last_at')
    .run(threadId, buyer, channel, now());
  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
  return { ...row, meta: JSON.parse(row.meta) };
}
export const listMessages = (limit = 200) => db.prepare('SELECT * FROM (SELECT * FROM messages ORDER BY id DESC LIMIT ?) ORDER BY id')
  .all(limit).map((r) => ({ ...r, meta: JSON.parse(r.meta) }));
export const recentOutgoing = (threadId, sinceMs) => db.prepare("SELECT text FROM messages WHERE thread_id = ? AND direction = 'out' AND created_at > ?")
  .all(threadId, now() - sinceMs).map((r) => r.text);
export const listThreads = () => db.prepare('SELECT * FROM threads ORDER BY last_at DESC').all().map((t) => ({ ...t, paused: !!t.paused }));
export const getThread = (id) => {
  const t = db.prepare('SELECT * FROM threads WHERE id = ?').get(id);
  return t ? { ...t, paused: !!t.paused } : null;
};
export function setThreadPaused(id, buyer, channel, paused) {
  db.prepare('INSERT INTO threads(id, buyer, channel, paused, last_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET paused = excluded.paused')
    .run(id, buyer, channel, paused ? 1 : 0, now());
  return getThread(id);
}

// ---------- drafts ----------
const parseDraft = (r) => r && ({ ...r, action: JSON.parse(r.action), meta: JSON.parse(r.meta) });
export function addDraft({ threadId, buyer, channel, question, text, engine, action = null, meta = {} }) {
  const info = db.prepare('INSERT INTO drafts(thread_id, buyer, channel, question, text, engine, action, meta, created_at) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(threadId, buyer, channel, question, text, engine, JSON.stringify(action), JSON.stringify(meta), now());
  return parseDraft(db.prepare('SELECT * FROM drafts WHERE id = ?').get(info.lastInsertRowid));
}
export const listDrafts = () => db.prepare("SELECT * FROM drafts WHERE status = 'pending' ORDER BY id DESC").all().map(parseDraft);
export const getDraft = (id) => parseDraft(db.prepare('SELECT * FROM drafts WHERE id = ?').get(id));
export const setDraftStatus = (id, status) => db.prepare('UPDATE drafts SET status = ? WHERE id = ?').run(status, id);

// ---------- outbox (Android RemoteInput delivery) ----------
export function pushOutbox(notifKey, pkg, text) {
  db.prepare('INSERT INTO outbox(notif_key, package, text, created_at) VALUES(?,?,?,?)').run(notifKey, pkg, text, now());
}
export const pullOutbox = () => db.prepare("SELECT * FROM outbox WHERE status = 'pending' ORDER BY id LIMIT 20").all();
export const ackOutbox = (id, status = 'sent') => db.prepare('UPDATE outbox SET status = ? WHERE id = ?').run(status, id);

// ---------- buyer intent sessions ----------
export function recordBuyerIntent({ buyer, channel, sku, productName, quantity = 1, totalPrice = 0, status = 'inquiry', lastMessage = '' }) {
  const cleanBuyer = buyer.replace(/^@/, '').trim();
  const existing = db.prepare("SELECT * FROM buyer_intent_sessions WHERE LOWER(REPLACE(buyer, '@', '')) = ? AND status != ? ORDER BY id DESC LIMIT 1")
    .get(cleanBuyer.toLowerCase(), 'paid');
  if (existing) {
    db.prepare('UPDATE buyer_intent_sessions SET sku = ?, product_name = ?, quantity = ?, total_price = ?, status = ?, last_message = ?, updated_at = ? WHERE id = ?')
      .run(sku, productName, quantity, totalPrice, status, lastMessage, now(), existing.id);
    return db.prepare('SELECT * FROM buyer_intent_sessions WHERE id = ?').get(existing.id);
  }
  const info = db.prepare('INSERT INTO buyer_intent_sessions(buyer, channel, sku, product_name, quantity, total_price, status, last_message, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .run(cleanBuyer, channel, sku, productName, quantity, totalPrice, status, lastMessage, now(), now());
  return db.prepare('SELECT * FROM buyer_intent_sessions WHERE id = ?').get(info.lastInsertRowid);
}

export function getLatestBuyerIntent(buyer) {
  const clean = buyer.replace(/^@/, '').trim().toLowerCase();
  return db.prepare("SELECT * FROM buyer_intent_sessions WHERE LOWER(REPLACE(buyer, '@', '')) = ? ORDER BY id DESC LIMIT 1").get(clean);
}

export function updateBuyerIntentStatus(id, status) {
  db.prepare('UPDATE buyer_intent_sessions SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), id);
  return db.prepare('SELECT * FROM buyer_intent_sessions WHERE id = ?').get(id);
}

export function listBuyerIntents(limit = 50) {
  return db.prepare('SELECT * FROM buyer_intent_sessions ORDER BY id DESC LIMIT ?').all(limit);
}

// ---------- privacy ----------
export function logPrivacy(kind, pkg, preview) {
  db.prepare('INSERT INTO privacy_log(kind, package, preview, created_at) VALUES(?,?,?,?)').run(kind, pkg, preview, now());
}
export const listPrivacy = () => db.prepare('SELECT * FROM privacy_log ORDER BY id DESC LIMIT 100').all();

// ---------- seed / reset ----------
export function resetDatabase({ keepSettings = true } = {}) {
  const settings = keepSettings ? kvGet('settings', {}) : {};
  tx(() => {
    for (const t of ['products', 'custom_reply_rules', 'orders', 'anomaly_alerts', 'buyer_intent_sessions', 'semantic_cache', 'messages', 'privacy_log', 'drafts', 'threads', 'outbox', 'kv']) {
      db.exec(`DELETE FROM ${t}`);
    }
    db.exec("DELETE FROM sqlite_sequence");
    for (const p of SEED_PRODUCTS) upsertProduct(p);
    for (const r of SEED_RULES) addRule(r);
    kvSet('settings', settings);
    kvSet('metrics', {});
  });
  ensureDefaultStoreAccount();
}

if (db.prepare('SELECT COUNT(*) AS n FROM products').get().n === 0) resetDatabase();
