# PRODUCT.md — ReplyForge Product Specifications & PRD (v2.0)
*LOGICODIX 2026 Hackathon (Subtema 3: Local MSME & Creative Economy)*

---

## 1. Executive Summary & Value Proposition

**ReplyForge** is a zero-API autonomous commerce and inventory orchestration agent designed for micro, small, and medium enterprises (MSMEs / UMKM) in Indonesia. 

### Core Architectural Model: Universal On-Device Agent
ReplyForge is **NOT** a single-store hardcoded script, nor a fragile cloud-scraper. It is an **On-Device Autonomous Agent** that any Indonesian online merchant can install directly on their Android phone.
- **Why On-Device?** By operating natively on Android via `NotificationListenerService` and `RemoteInput`, ReplyForge intercepts incoming buyer chats from **Shopee** and **WhatsApp Business** and dispatches replies automatically through the operating system—with **zero risk of platform bans** and **zero expensive third-party SaaS/API fees**.
- **Active Case Study (Lina Shop):** For competition demonstration at LOGICODIX 2026, ReplyForge is showcased on a live creative economy merchant: **"Lina Shop"** (Cute accessories, waterproof vinyl stickers, acrylic keychains, griptoks, and plushie photocard holders).

---

## 2. Problem Statement & User Personas

### Target Users
Indonesian MSME creative merchants and online shop owners managing multi-channel sales across WhatsApp Business and Shopee.

### 4 Critical Pain Points Solved:
1. **Chat Fatigue & Lost Sales:** Slow response times (>2 minutes) cause 60%+ of marketplace shoppers to buy from competitors.
2. **Margin Erosion (Bargaining Below Cost/HPP):** Buyers constantly haggle. Manual admins often cave in or make calculation errors. ReplyForge enforces a strict, mathematical **HPP Guard**.
3. **Cross-Platform Overselling:** Selling a piece on WhatsApp while inventory on Shopee is unchanged causes cancelled orders and seller penalty points. ReplyForge executes instant, cross-platform SQLite inventory deduction.
4. **Data Privacy & Bank SMS Leaks (UU PDP):** Merchants use their personal phones where m-banking and SMS OTPs arrive. ReplyForge runs a **Client-Side OTP Shield** dropping sensitive bank codes with 0 bytes transmitted to any AI model.

---

## 3. Product Architecture & 4 Core Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ANDROID HARDWARE LAYER (Infinix Note 40)             │
│  - WhatsApp Business (com.whatsapp.w4b)                                │
│  - Shopee Indonesia (com.shopee.id)                                    │
│  - Android OS NotificationListenerService & RemoteInput Quick-Reply    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ adb reverse tcp:8088 tcp:8088
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              LOCAL REASONING & INVENTORY ENGINE (Port 8088)            │
│  - Client-Side OTP Shield (Instant Regex Drop: 0 Bytes to Cloud)       │
│  - Green Semantic Cache (0ms On-Device Exact & Fuzzy Match)            │
│  - 9Router AI Gateway (Gemini 2.5/Flash low-latency reasoning)         │
│  - Deterministic Fallback Engine & Real-time SQLite Mutator            │
│  - Anti-Ban Humanized Dispatch Delay (3s typing cadence)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SSE & REST APIs
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             DUAL VIEWPORT INTERFACE (Linear/Layers Craft Standard)     │
│  1. Mobile App View (?mobile=1 in Android Native WebView)              │
│  2. Merchant Studio Dashboard (Browser Side-by-Side Screen Record)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Module 1: Mobile App Ecosystem (4 Tabs in Android App & WebView)
1. **Tab 1 (`Chat`):**
   - Single compact 56px header uniting shop identity, channel filter (Shopee vs WA), and master Auto-Pilot toggle.
   - Conversation stream with buyer intent memory pills (`@rina_wati88` -> `2x Stiker Kucing Gemoy`).
   - High-contrast emergency **"Takeover Manual"** amber action button.
   - Inline Shopee Payment notification event cards with auto-reconciled stock deductions.
2. **Tab 2 (`Stok & AI`):**
   - 4 Live Product Cards with animated capacity bars and tabular Rupiah pricing.
   - Natural language conversational command input (voice simulation & chat-to-config: *"Update stok Griptok Daisy jadi 30 harga 20rb"*).
   - 1-Click Shopee Excel importer and physical catalog scanner.
   - 6 Local Indonesian Olshop preset rules (Stok Ready, Nego/HPP, Jadwal Kirim, Konfirmasi Pesanan, Auto-Lunas).
3. **Tab 3 (`Transaksi`):**
   - Real-time Order Ledger tracking payments and fulfillment statuses (LUNAS, PERLU DIKIRIM).
   - Silent buyer reconciliation (1-Tap item matcher for customers who buy directly on marketplace without chat).
4. **Tab 4 (`Sistem`):**
   - Live hardware mesh diagnostic (USB adb bridge, Shopee service, WhatsApp service).
   - Green IT Dashboard (0ms Cache Hit Ratio, Tokens Saved, gCO2e Reduction).
   - Client-Side OTP Privacy Shield live audit log.
   - Merchant store configuration (name, category, bank account, AI model selector).

### Module 2: Grand Final Split-Screen Demo Harness (OBS Studio)
- **Left Window (Physical Android Phone via scrcpy):**
  Live USB screen mirror showing real Android system notifications, incoming Shopee/WA chats, and autonomous RemoteInput replies without human touch.
- **Right Window (Localhost Studio & MiroFish Simulator):**
  Split-screen laptop browser displaying 4-node telemetry pipeline glowing in real time, instant SQLite inventory decrement, and Green Cache hits.

### Module 3: 4-Node Live Telemetry Pipeline
- `Node 1: Android Notification Intercepted` (Android OS RemoteInput Hook)
- `Node 2: Client PII Shield & Green Cache` (0ms on-device match, bank OTP dropped)
- `Node 3: 9Router AI & SQLite Inventory Mutator` (Gemini Flash <500ms or deterministic rule with HPP guard)
- `Node 4: Anti-Ban Delay & Dispatched` (3s humanized typing simulation)

### Module 4: Green IT & Ethics Standards (10% LOGICODIX Criteria)
- **On-Device Green Semantic Cache:** Eliminates redundant LLM API calls for identical product inquiries, cutting energy consumption and cloud compute.
- **Client-Side OTP Privacy Shield:** 100% on-device filtering of bank SMS and confidential credentials in compliance with Indonesia's Personal Data Protection Law (UU PDP).

---

## 4. Official Product Catalog (Lina Shop Case Study)

| SKU | Product Name | Price (Rp) | COGS / HPP (Rp) | Initial Stock | Capacity |
|---|---|---|---|---|---|
| `STK-CAT-01` | Paket Stiker Kucing Gemoy Vinyl Waterproof | 15.000 | 6.000 | 50 pcs | 100 pcs |
| `KC-ACRYL-02` | Gantungan Kunci Akrilik Capybara 2 Sisi | 25.000 | 12.000 | 30 pcs | 60 pcs |
| `GPT-FLW-03` | Griptok HP Akrilik Bunga Daisy | 20.000 | 8.000 | 25 pcs | 50 pcs |
| `PC-HLD-04` | Photocard Holder Plushie Kelinci Lucu | 35.000 | 18.000 | 15 pcs | 30 pcs |

---

## 5. Hackathon Guidebook Compliance Matrix

| LOGICODIX 2026 Evaluation Criteria | Weight | How ReplyForge Secures the Top Score |
|---|---|---|
| **Problem-Solution Fit** | 25% | Direct resolution of cross-platform chat overload, margin bleeding, and inventory overselling for Indonesian creative economy MSMEs. |
| **Technology Innovation (AI)** | 25% | Integration of 9Router AI Gateway (Gemini 2.5 Flash), semantic on-device caching, and natural language chat-to-inventory configuration. |
| **Software Engineering** | 25% | Native Android OS `NotificationListenerService` & `RemoteInput` hooks, robust local SQLite database, SSE real-time telemetry, full test suite, and Gradle APK builds. |
| **UI/UX Design** | 15% | High-craft Linear/getlayers.ai aesthetic, 0% developer jargon on merchant mobile view, 75% message screen space, tabular numerals, and Emil Kowalski motion physics. |
| **Green IT & Ethics** | 10% | Measurable 0ms cache hit ratio, token savings, gCO2e reduction tracker, and 100% client-side privacy guard for banking SMS/OTPs. |
