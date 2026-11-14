# PRODUCT.md — ReplyForge Product Specifications & PRD (v4.0)
*LOGICODIX 2026 Hackathon (Subtema 3: Local MSME & Creative Economy)*

---

## 1. Executive Summary & Value Proposition

**ReplyForge** is a zero-API autonomous commerce and inventory orchestration agent designed for micro, small, and medium enterprises (MSMEs / UMKM) in Indonesia. 

### Core Architectural Model: Universal On-Device Agent
ReplyForge is **NOT** a single-store hardcoded script, nor a fragile cloud-scraper. It is a **local-first, on-device autonomous agent** that any Indonesian online merchant can install directly on their Android phone, with an optional Local Web Seller Center for desk-based monitoring.
- **Why On-Device?** By operating natively on Android via `NotificationListenerService` and `RemoteInput`, ReplyForge intercepts incoming buyer chats from **WhatsApp Business** and **Shopee Seller**. WhatsApp replies are dispatched fully automatically through the OS; Shopee inquiries are turned into one-tap **Smart Copilot drafts** because Shopee notifications do not expose `RemoteInput`. Both paths avoid platform-API fees and third-party SaaS dependencies.
- **Active Case Study (Toko Stickeria):** For competition demonstration at LOGICODIX 2026, ReplyForge is showcased on a live creative economy merchant: **"Toko Stickeria"** (Bandung, Jawa Barat), selling waterproof die-cut vinyl stickers. The final seed catalog contains one active flagship SKU, `STK-CAT-01` (Paket Stiker Kucing Gemoy).

---

## 2. Problem Statement & User Personas

### Target Users
Indonesian MSME creative merchants and online shop owners managing multi-channel sales across WhatsApp Business and Shopee.

### 4 Critical Pain Points Solved:
1. **Chat Fatigue & Lost Sales:** Slow response times (>2 minutes) cause 60%+ of marketplace shoppers to buy from competitors.
2. **Margin Erosion (Bargaining Below Cost/HPP):** Buyers constantly haggle. Manual admins often cave in or make calculation errors. ReplyForge enforces a strict, mathematical **HPP Guard**.
3. **Cross-Platform Overselling:** Selling a piece on WhatsApp while inventory on Shopee is unchanged causes cancelled orders and seller penalty points. ReplyForge executes instant, atomic SQLite inventory deduction for WhatsApp orders and reconciles Shopee leads with a one-tap stock deduction after the seller confirms the marketplace order.
4. **Data Privacy & Bank SMS Leaks (UU PDP):** Merchants use their personal phones where m-banking and SMS OTPs arrive. ReplyForge runs a **Client-Side OTP Shield** dropping sensitive bank codes with 0 bytes transmitted to any AI model.

---

## 3. Product Architecture & 4 Core Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                ANDROID HARDWARE LAYER (Infinix Note 40)                │
│  - WhatsApp Business (com.whatsapp.w4b) -> RemoteInput autopilot       │
│  - Shopee Seller (com.shopee.shopeeseller) -> Smart Copilot draft      │
│  - Android OS NotificationListenerService + on-device SQLite           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ optional loopback sync (no ADB tether)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│        LOCAL COMPANION SERVER & WEB SELLER CENTER (Port 8088)          │
│  - Express REST + SSE telemetry, node:sqlite persistence              │
│  - React/Vite dashboard: :5173 dev, :8088 production (?view=studio)   │
│  - PII/OTP guard, green semantic cache, 9Router + local fallback      │
└────────────────────────────────────────────────────────────────────────┘
```

### Module 1: Mobile App Ecosystem (4 Tabs in Android App & Web Mirror)
1. **Tab 1 (`Chat`):**
   - Single compact header uniting shop identity, channel filter (Shopee vs WA), and master Auto-Pilot toggle.
   - Conversation stream with buyer intent memory pills (`@rina_wati88` -> `2x Stiker Kucing Gemoy`).
   - High-contrast emergency **"Takeover Manual"** amber action button.
   - Shopee threads are labelled **Shopee Lead · Smart Copilot (pra-jual)** and expose **`Buka & Balas di Shopee`** (copy draft + launch Shopee Seller).
   - Inline Shopee payment notification event cards with auto-reconciled stock deductions.
2. **Tab 2 (`Stok & AI`):**
   - Live product cards with animated capacity bars and tabular Rupiah pricing (final seed: one active SKU, `STK-CAT-01`).
   - Natural language conversational command input (voice simulation & chat-to-config: *"Update stok Griptok Daisy jadi 30 harga 20rb"*).
   - 1-Click Shopee CSV/XLSX catalog importer, `.xlsx` template download, and catalog scanner.
   - 6 Local Indonesian Olshop preset rules (Stok Ready, Stok Habis, Nego/HPP, Jadwal Kirim, Konfirmasi Pesanan, Auto-Lunas).
3. **Tab 3 (`Transaksi`):**
   - Real-time Order Ledger tracking payments and fulfillment statuses (LUNAS, PERLU DIKIRIM).
   - Shopee Leads filter with 1-tap product matcher for buyers who order directly on the marketplace without chat.
4. **Tab 4 (`Sistem`):**
   - Live on-device diagnostics (notification permission, channel connection, foreground service, battery optimization).
   - Green IT Dashboard (cache hit ratio, tokens saved, gCO2e reduction).
   - Client-Side OTP Privacy Shield live audit log.
   - Merchant store configuration (name, owner, city, bank account, AI base URL/key/model) and in-app Self-Test runner.

### Module 2: Grand Final Split-Screen Demo Harness (OBS Studio)
- **Left Window (Physical Android Phone via scrcpy):**
  Live USB screen mirror showing real Android system notifications, incoming Shopee/WA chats, and autonomous WhatsApp RemoteInput replies without human touch.
- **Right Window (Localhost Studio):**
  Split-screen laptop browser displaying the 4-node telemetry pipeline glowing in real time, instant SQLite inventory decrement, Shopee Lead drafts, and Green Cache hits.

### Module 3: 4-Node Live Telemetry Pipeline
- `Node 1: Notification Intercepted` (Android OS NotificationListener hook)
- `Node 2: PII Guard & Green Cache` (0ms on-device match, bank OTP dropped)
- `Node 3: 9Router AI + SQLite Sync` (Gemini Flash <500ms or deterministic rule with HPP guard)
- `Node 4: Anti-Ban Delay & RemoteInput Sent` (3s humanized typing simulation; Shopee path emits a Copilot draft instead)

### Module 4: Green IT & Ethics Standards (10% LOGICODIX Criteria)
- **On-Device Green Semantic Cache:** Eliminates redundant LLM API calls for identical product inquiries, cutting energy consumption and cloud compute.
- **Client-Side OTP Privacy Shield:** 100% on-device filtering of bank SMS and confidential credentials in compliance with Indonesia's Personal Data Protection Law (UU PDP).

---

## 4. Official Product Catalog (Toko Stickeria Case Study)

| SKU | Product Name | Price (Rp) | COGS / HPP (Rp) | Initial Stock | Capacity |
|---|---|---|---|---|---|
| `STK-CAT-01` | Paket Stiker Kucing Gemoy Vinyl Waterproof Lucu Anti Air Die Cut Isi 20 Pcs | 15.000 | 6.000 | 50 pack | 100 pack |

> The final seed database ships with this single active SKU. Additional products can be registered through the offline Quick Command (`tambah produk ...`) or imported from a CSV/XLSX catalog.

---

## 5. Hackathon Guidebook Compliance Matrix

| LOGICODIX 2026 Evaluation Criteria | Weight | How ReplyForge Secures the Top Score |
|---|---|---|
| **Problem-Solution Fit** | 25% | Direct resolution of cross-platform chat overload, margin bleeding, and inventory overselling for Indonesian creative economy MSMEs. |
| **Technology Innovation (AI)** | 25% | Integration of the 9Router AI Gateway (default `ag/gemini-3.8-flash-low`) with a deterministic on-device fallback, semantic caching, anomaly classification, and natural language chat-to-inventory configuration. |
| **Software Engineering** | 25% | Native Android OS `NotificationListenerService` & `RemoteInput` hooks for WhatsApp, a Smart Copilot draft path for Shopee, robust local SQLite database, SSE real-time telemetry, Vitest web suites, and Gradle APK builds. |
| **UI/UX Design** | 15% | High-craft Linear/getlayers.ai aesthetic, 0% developer jargon on merchant mobile view, 75% message screen space, tabular numerals, and Emil Kowalski motion physics. |
| **Green IT & Ethics** | 10% | Measurable 0ms cache hit ratio, token savings, gCO2e reduction tracker, and 100% client-side privacy guard for banking SMS/OTPs. |
