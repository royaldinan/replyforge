# Graph Report - replyforge  (2026-11-09)

## Corpus Check
- 74 files · ~49,897 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 24 file(s) not represented in the graph (top: .xml 11, .properties 3, .example 2)

## Summary
- 647 nodes · 1643 edges · 40 communities (30 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47d6ec24`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db.js
- MainActivity.java
- devDependencies
- App.tsx
- primitives.tsx
- ReplyForgeNotificationService.java
- compilerOptions
- package.json
- server/package.json
- LiveInboxMonitor.tsx
- PRODUCT.md — ReplyForge Product Specifications & PRD (v2.0)
- DESIGN.md — ReplyForge Visual Design Architecture & Tokens
- index.ts
- OrdersTab.tsx
- KONTEKS PROJECT & REFERENSI DATA — REPLYFORGE (v2.0)
- dependencies
- web/package.json
- @vitejs/plugin-react
- vitest
- scripts
- jsdom
- tailwindcss
- @testing-library/user-event
- pipeline.js
- cn
- intent.js
- AuthModal.tsx
- StoreStudio.tsx
- desktop.test.tsx
- cache.js
- 2. Phase-by-Phase Verified Execution Roadmap
- anomaly.js
- upsertProduct

## God Nodes (most connected - your core abstractions)
1. `cn()` - 60 edges
2. `Badge()` - 36 edges
3. `Button()` - 26 edges
4. `Card()` - 26 edges
5. `lucide-react` - 23 edges
6. `CardHeader()` - 21 edges
7. `processIncomingNotification()` - 19 edges
8. `now()` - 18 edges
9. `MobileAppView()` - 18 edges
10. `Segmented()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Cara Penjual Menghubungkan Akun Shopee Seller & WhatsApp Business (3 Langkah di APK):` --references--> `ReplyForgeNotificationService`  [INFERRED]
  README.md → android-native-agent/app/src/main/java/id/replyforge/agent/ReplyForgeNotificationService.java
- `generateResponse()` --calls--> `getSettings()`  [EXTRACTED]
  server/src/engine/gateway.js → server/src/db.js
- `handleOutgoingReply()` --calls--> `getSettings()`  [EXTRACTED]
  server/src/engine/pipeline.js → server/src/db.js
- `processIncomingNotification()` --calls--> `getSettings()`  [EXTRACTED]
  server/src/engine/pipeline.js → server/src/db.js
- `matchSemanticCache()` --calls--> `bumpMetric()`  [EXTRACTED]
  server/src/engine/cache.js → server/src/db.js

## Import Cycles
- None detected.

## Communities (40 total, 10 thin omitted)

### Community 0 - "db.js"
Cohesion: 0.08
Nodes (49): ackOutbox(), addRule(), clearCache(), db, deleteProduct(), deleteRule(), ensureDefaultStoreAccount(), getActiveStoreAccount() (+41 more)

### Community 1 - "MainActivity.java"
Cohesion: 0.07
Nodes (5): MainActivity, OnBackPressedCallback, WebChromeClient, WebViewClient, ReplyForgeJsBridge

### Community 2 - "devDependencies"
Cohesion: 0.15
Nodes (13): autoprefixer, @tailwindcss/vite, @testing-library/dom, @types/react, @types/react-dom, typescript, devDependencies, autoprefixer@^10.6.1 (+5 more)

### Community 3 - "App.tsx"
Cohesion: 0.11
Nodes (31): fmt(), GatewayPreset, PRESET_CARDS, PresetCard, Props, Props, OrdersTabProps, StockTabProps (+23 more)

### Community 4 - "primitives.tsx"
Cohesion: 0.11
Nodes (24): Scenario, OverviewItem, BadgeProps, ButtonProps, ButtonSize, buttonSizes, ButtonVariant, buttonVariants (+16 more)

### Community 5 - "ReplyForgeNotificationService.java"
Cohesion: 0.05
Nodes (15): ReplyForgeNotificationService, 1. Kalimat Masalah & Solusi (Problem-Solution Fit), 2. Akun Demonstrasi & Alur Koneksi Toko (Wajib Juri), 🏗️ 2. Diagram Arsitektur Cross-Device Sync, 🎯 3. Pemetaan Bobot Penilaian LOGICODIX 2026, ⚡ 4. 3 Cara Input Database Produk Instan, 💬 5. 6 Preset Template Bahasa Admin Olshop Indonesia Asli (Anti-AI-Slop), 🚀 6. Panduan Menjalankan di Localhost & HP Android (< 30 Detik) (+7 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (23): dependencies, react@^18.3.1, react-dom@^18.3.1, description, devDependencies, concurrently@^9.1.2, engines, node (+15 more)

### Community 8 - "server/package.json"
Cohesion: 0.15
Nodes (13): express, dependencies, express@^4.21.2, main, name, private, scripts, dev (+5 more)

### Community 9 - "LiveInboxMonitor.tsx"
Cohesion: 0.07
Nodes (25): CHANNEL_ACTIVE, ChannelKey, ChatEntry, clock(), Props, SCENARIOS, Mode, MODE_OPTIONS (+17 more)

### Community 10 - "PRODUCT.md — ReplyForge Product Specifications & PRD (v2.0)"
Cohesion: 0.14
Nodes (13): 1. Executive Summary & Value Proposition, 2. Problem Statement & User Personas, 3. Product Architecture & 4 Core Modules, 4 Critical Pain Points Solved:, 4. Official Product Catalog (Lina Shop Case Study), 5. Hackathon Guidebook Compliance Matrix, Core Architectural Model: Universal On-Device Agent, Module 1: Mobile App Ecosystem (4 Tabs in Android App & WebView) (+5 more)

### Community 11 - "DESIGN.md — ReplyForge Visual Design Architecture & Tokens"
Cohesion: 0.33
Nodes (5): 1. Design Philosophy & Craft Standards (getlayers.ai, Wise, & OpenDesign Inspired), 2. Color Palette & Surface Hierarchy, 3. Typography & Hierarchy, 4. Animation & Interaction Specifications, DESIGN.md — ReplyForge v3.0 Visual Design Architecture & Tokens (Sunlit Warm Commercial)

### Community 18 - "index.ts"
Cohesion: 0.07
Nodes (49): lucide-react, sonner, AppHeader(), AppHeaderProps, Avatar(), AvatarProps, BottomNav(), BottomNavProps (+41 more)

### Community 19 - "OrdersTab.tsx"
Cohesion: 0.25
Nodes (20): Filter, matchesFilter(), OrderCard(), OrdersTab(), getOrderState(), isShippable(), ORDER_STATE_META, OrderState (+12 more)

### Community 20 - "KONTEKS PROJECT & REFERENSI DATA — REPLYFORGE (v2.0)"
Cohesion: 0.22
Nodes (8): 1. Tentang Aplikasi, 2. Katalog Resmi 4 Produk (Lina Shop), 3. Struktur File & Lokasi Kode Tampilan, 4. Standar Desain & Pedoman Anti-Slop (LOGICODIX 2026), KONTEKS PROJECT & REFERENSI DATA — REPLYFORGE (v2.0), Masalah Utama yang Diselesaikan:, Mekanisme Teknis:, Studi Kasus Resmi: "Lina Shop" (Aksesoris Lucu & Merchandise Kreatif)

### Community 21 - "dependencies"
Cohesion: 0.18
Nodes (11): clsx, tailwind-merge, dependencies, clsx@^2.1.1, lucide-react@^1.61.0, react@^18.3.1, react-dom@^18.3.1, sonner@^2.0.8 (+3 more)

### Community 22 - "web/package.json"
Cohesion: 0.18
Nodes (10): postcss, @testing-library/react, @types/node, postcss@^8.5.31, @testing-library/react@^15.0.7, @types/node@^24.11.0, name, private (+2 more)

### Community 23 - "@vitejs/plugin-react"
Cohesion: 0.33
Nodes (4): vite, @vitejs/plugin-react, vite@^5.4.11, @vitejs/plugin-react@^4.3.4

### Community 24 - "vitest"
Cohesion: 0.40
Nodes (4): @testing-library/jest-dom, vitest, @testing-library/jest-dom@^7.0.1, vitest@^2.1.9

### Community 25 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

### Community 29 - "pipeline.js"
Cohesion: 0.17
Nodes (27): addAnomalyAlert(), addDraft(), addMessage(), adjustStock(), bumpMetric(), getLatestBuyerIntent(), getThread(), insertOrder() (+19 more)

### Community 30 - "cn"
Cohesion: 0.29
Nodes (25): App(), AuthModal(), BuyerSimulator(), GreenPrivacyGateway(), InventoryBarometer(), LiveInboxMonitor(), MiroFishSimulator(), OverviewStrip() (+17 more)

### Community 31 - "intent.js"
Cohesion: 0.22
Nodes (21): listProducts(), generateResponse(), runLocalEngine(), matchCustomRules(), matchProductStock(), parseConversationalCommand(), parseOrderIntent(), capitalize() (+13 more)

### Community 32 - "AuthModal.tsx"
Cohesion: 0.21
Nodes (12): AUTH_OPTIONS, AuthModalProps, AuthTab, ChannelOnboardingModal(), ChannelOnboardingModalProps, Window, Switch(), inputBase (+4 more)

### Community 33 - "StoreStudio.tsx"
Cohesion: 0.22
Nodes (11): ConnectionRow(), formatNumber(), Gauge(), runtimeLabel(), SystemTab(), EXAMPLES, Preset, PRESETS (+3 more)

### Community 34 - "desktop.test.tsx"
Cohesion: 0.24
Nodes (9): NODES, NodeState, PipelineNode, Props, stateOf(), STYLES, TelemetryPipeline(), TelemetryNode (+1 more)

### Community 35 - "cache.js"
Cohesion: 0.36
Nodes (9): hitCache(), insertCache(), listCache(), parseCache(), matchSemanticCache(), saveToSemanticCache(), conceptTokens(), contentTokens() (+1 more)

### Community 36 - "2. Phase-by-Phase Verified Execution Roadmap"
Cohesion: 0.25
Nodes (7): 1. Verified System Pre-requisites & Environment Checks, 2. Phase-by-Phase Verified Execution Roadmap, EXECUTION_PLAN.md — Verified Grand Execution Plan (ReplyForge v2.0), Phase 1: Total Data Sanitization & Single Source of Truth, Phase 2: Mobile App UI/UX Overhaul (Linear / getlayers.ai Anti-Slop Standard), Phase 3: Desktop Studio & MiroFish Telemetry Synchronization, Phase 4: Production Verification & Side-by-Side Recording Protocol

### Community 37 - "anomaly.js"
Cohesion: 0.33
Nodes (5): OUT_OF_SCOPE_WEIRD_PATTERNS, PROMPT_INJECTION_PATTERNS, SUSPICIOUS_CREDIT_PATTERNS, SUSPICIOUS_LINK_PATTERNS, VAGUE_ADDRESS_PATTERNS

### Community 38 - "upsertProduct"
Cohesion: 0.67
Nodes (3): getProductBySku(), parseProduct(), upsertProduct()

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `index.ts` to `AuthModal.tsx`, `StoreStudio.tsx`, `desktop.test.tsx`, `App.tsx`, `primitives.tsx`, `LiveInboxMonitor.tsx`, `OrdersTab.tsx`, `dependencies`, `web/package.json`, `cn`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `db.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07769423558897243 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `AuthModal.tsx`, `StoreStudio.tsx`, `desktop.test.tsx`, `App.tsx`, `primitives.tsx`, `LiveInboxMonitor.tsx`, `index.ts`, `OrdersTab.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `MainActivity.java` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Why does `sonner` connect `index.ts` to `AuthModal.tsx`, `StoreStudio.tsx`, `desktop.test.tsx`, `App.tsx`, `LiveInboxMonitor.tsx`, `OrdersTab.tsx`, `dependencies`, `web/package.json`, `cn`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11411411411411411 - nodes in this community are weakly interconnected._
- **Should `primitives.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10826210826210826 - nodes in this community are weakly interconnected._