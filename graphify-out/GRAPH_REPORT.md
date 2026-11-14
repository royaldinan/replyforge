# Graph Report - replyforge_work  (2026-11-14)

## Corpus Check
- 89 files · ~71,787 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 51 file(s) not represented in the graph (top: .xml 37, .properties 3, .example 2)

## Summary
- 948 nodes · 2581 edges · 59 communities (36 shown, 23 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 106 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8955777e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db.js
- MainActivity.java
- devDependencies
- App.tsx
- primitives.tsx
- ReplyForge v4.0 (Standalone Native)
- compilerOptions
- package.json
- server/package.json
- Badge
- PRODUCT.md — ReplyForge Product Specifications & PRD (v2.0)
- DESIGN.md — ReplyForge Visual Design Architecture & Tokens
- LiveInboxMonitor.tsx
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
- ReplyForgeNotificationService
- ReplyForgeDb
- cache.js
- 2. Phase-by-Phase Verified Execution Roadmap
- anomaly.js
- upsertProduct
- QuickCommandParser
- .processBuyerMessage
- ReplyForgeForegroundService.java
- MainActivity
- data.ts
- ViewHolder
- android.view.View
- MobileAppView.tsx
- ReplyForgeLocalServer
- SESSION HANDOFF & GRAND BLUEPRINT: REPLYFORGE v4.0 (STANDALONE NATIVE)
- org.json.JSONArray
- OrderAdapter
- ChatDetailActivity
- log

## God Nodes (most connected - your core abstractions)
1. `ReplyForgeDb` - 64 edges
2. `cn()` - 60 edges
3. `Badge()` - 38 edges
4. `ReplyForgeNotificationService` - 34 edges
5. `SelfTestActivity` - 28 edges
6. `Card()` - 28 edges
7. `Button()` - 27 edges
8. `QuickCommandParser` - 25 edges
9. `lucide-react` - 24 edges
10. `MainActivity` - 21 edges

## Surprising Connections (you probably didn't know these)
- `2. HASIL KERJA & VERIFIKASI OBJEKTIF SESI INI` --references--> `parseOrderIntent()`  [INFERRED]
  SESSION_HANDOFF_STANDALONE_V4.md → server/src/engine/intent.js
- `renderMobile()` --calls--> `MobileAppView()`  [EXTRACTED]
  web/tests/mobile.test.tsx → web/src/components/MobileAppView.tsx
- `OrdersTabProps` --references--> `Order`  [EXTRACTED]
  web/src/components/mobile/OrdersTab.tsx → web/src/types.ts
- `ChatDetailActivity` --references--> `ReplyForgeDb`  [EXTRACTED]
  android-native-agent/app/src/main/java/id/replyforge/agent/ChatDetailActivity.java → android-native-agent/app/src/main/java/id/replyforge/agent/ReplyForgeDb.java
- `OrderAdapter` --references--> `ViewHolder`  [EXTRACTED]
  android-native-agent/app/src/main/java/id/replyforge/agent/OrderAdapter.java → android-native-agent/app/src/main/java/id/replyforge/agent/ChatMessageAdapter.java

## Import Cycles
- None detected.

## Communities (59 total, 23 thin omitted)

### Community 0 - "db.js"
Cohesion: 0.08
Nodes (47): ackOutbox(), clearCache(), db, deleteProduct(), deleteRule(), ensureDefaultStoreAccount(), getActiveStoreAccount(), getDraft() (+39 more)

### Community 2 - "devDependencies"
Cohesion: 0.15
Nodes (13): autoprefixer, @tailwindcss/vite, @testing-library/dom, @types/react, @types/react-dom, typescript, devDependencies, autoprefixer@^10.6.1 (+5 more)

### Community 3 - "App.tsx"
Cohesion: 0.08
Nodes (45): fmt(), GatewayPreset, PRESET_CARDS, PresetCard, Props, Mode, MODE_OPTIONS, Props (+37 more)

### Community 4 - "primitives.tsx"
Cohesion: 0.11
Nodes (24): Scenario, OverviewItem, BadgeProps, ButtonProps, ButtonSize, buttonSizes, ButtonVariant, buttonVariants (+16 more)

### Community 5 - "ReplyForge v4.0 (Standalone Native)"
Cohesion: 0.13
Nodes (14): 1. Kalimat Masalah & Solusi (Problem-Solution Fit), 2. Akun Demonstrasi & Alur Koneksi Toko (Wajib Juri), 🏗️ 3. Diagram Arsitektur Standalone Native v4.0, 🎯 3. Pemetaan Bobot Penilaian LOGICODIX 2026, ⚡ 4. 3 Cara Input Database Produk Instan, 💬 5. 6 Preset Template Bahasa Admin Olshop Indonesia Asli (Anti-AI-Slop), 🚀 6. Panduan Menjalankan di Localhost & HP Android (< 30 Detik), 🧪 7. 3 Skenario Simulasi MiroFish (Grand Final Demo) (+6 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (23): dependencies, react@^18.3.1, react-dom@^18.3.1, description, devDependencies, concurrently@^9.1.2, engines, node (+15 more)

### Community 8 - "server/package.json"
Cohesion: 0.15
Nodes (13): express, dependencies, express@^4.21.2, main, name, private, scripts, dev (+5 more)

### Community 9 - "Badge"
Cohesion: 0.10
Nodes (46): App(), AuthModal(), BuyerSimulator(), CHANNEL_ACTIVE, ChannelKey, ChatEntry, clock(), Props (+38 more)

### Community 10 - "PRODUCT.md — ReplyForge Product Specifications & PRD (v2.0)"
Cohesion: 0.14
Nodes (13): 1. Executive Summary & Value Proposition, 2. Problem Statement & User Personas, 3. Product Architecture & 4 Core Modules, 4 Critical Pain Points Solved:, 4. Official Product Catalog (Stickeria Case Study), 5. Hackathon Guidebook Compliance Matrix, Core Architectural Model: Universal On-Device Agent, Module 1: Mobile App Ecosystem (4 Tabs in Android App & WebView) (+5 more)

### Community 11 - "DESIGN.md — ReplyForge Visual Design Architecture & Tokens"
Cohesion: 0.33
Nodes (5): 1. Design Philosophy & Craft Standards (getlayers.ai, Wise, & OpenDesign Inspired), 2. Color Palette & Surface Hierarchy, 3. Typography & Hierarchy, 4. Animation & Interaction Specifications, DESIGN.md — ReplyForge v3.0 Visual Design Architecture & Tokens (Sunlit Warm Commercial)

### Community 18 - "LiveInboxMonitor.tsx"
Cohesion: 0.10
Nodes (29): CHANNEL_ACTIVE, ChannelKey, FEED_STYLE, FeedEntry, InboxFilter, NORMAL_FLOW_STEPS, previewOf(), Props (+21 more)

### Community 19 - "OrdersTab.tsx"
Cohesion: 0.24
Nodes (21): Filter, matchesFilter(), OrderCard(), OrdersTab(), OrdersTabProps, getOrderState(), isShippable(), ORDER_STATE_META (+13 more)

### Community 20 - "KONTEKS PROJECT & REFERENSI DATA — REPLYFORGE (v2.0)"
Cohesion: 0.22
Nodes (8): 1. Tentang Aplikasi, 2. Katalog Resmi 4 Produk (Stickeria), 3. Struktur File & Lokasi Kode Tampilan, 4. Standar Desain & Pedoman Anti-Slop (LOGICODIX 2026), KONTEKS PROJECT & REFERENSI DATA — REPLYFORGE (v2.0), Masalah Utama yang Diselesaikan:, Mekanisme Teknis:, Studi Kasus Resmi: "Stickeria" (Aksesoris Lucu & Merchandise Kreatif)

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
Cohesion: 0.18
Nodes (26): addAnomalyAlert(), addDraft(), addMessage(), adjustStock(), bumpMetric(), getLatestBuyerIntent(), getThread(), insertOrder() (+18 more)

### Community 30 - "cn"
Cohesion: 0.30
Nodes (12): OverviewStrip(), Composer(), PresetRow(), ProductRow(), StockTab(), Bubble(), EventCard(), ThreadView() (+4 more)

### Community 31 - "intent.js"
Cohesion: 0.19
Nodes (24): addRule(), listProducts(), listRules(), parseRule(), generateResponse(), runLocalEngine(), matchCustomRules(), matchProductStock() (+16 more)

### Community 32 - "AuthModal.tsx"
Cohesion: 0.16
Nodes (11): sonner, AUTH_OPTIONS, AuthModalProps, AuthTab, ChannelOnboardingModalProps, Window, Switch(), inputBase (+3 more)

### Community 33 - "ReplyForgeNotificationService"
Cohesion: 0.12
Nodes (6): ReplyGenerator, ReplyForgeNotificationService, StyleMessage, CaseOutcome, SelfTestActivity, SettingsLaunchBinder

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

### Community 40 - "QuickCommandParser"
Cohesion: 0.18
Nodes (4): CmdCase, QuickCommandParser, Result, StockCommand

### Community 41 - ".processBuyerMessage"
Cohesion: 0.15
Nodes (8): AiResponse, AnomalyStatus, BLOCKED, NEEDS_REVIEW, NONE, InteractionGate, PowerManagerGate, ReplyForgeAiEngine

### Community 45 - "data.ts"
Cohesion: 0.14
Nodes (14): COMMAND_EXAMPLES, EventMessage, MOCK_CSV, Preset, PRESETS, TextMessage, ThreadStatus, VOICE_SAMPLE (+6 more)

### Community 46 - "ViewHolder"
Cohesion: 0.21
Nodes (4): ChatMessageAdapter, ViewHolder, OnStockAdjustListener, ProductAdapter

### Community 48 - "MobileAppView.tsx"
Cohesion: 0.22
Nodes (12): lucide-react, AppHeader(), AppHeaderProps, BottomNav(), BottomNavProps, NavItem, TabId, useChatThreads() (+4 more)

### Community 50 - "SESSION HANDOFF & GRAND BLUEPRINT: REPLYFORGE v4.0 (STANDALONE NATIVE)"
Cohesion: 0.13
Nodes (14): 1. RINGKASAN EKSEKUTIF & PERUBAHAN POLA PIKIR (PARADIGM SHIFT), 2. HASIL KERJA & VERIFIKASI OBJEKTIF SESI INI, 3. AUDIT TEKNIS & ROOT CAUSE MASALAH DI SESI INI, 4. GRAND PLAN SESI BERIKUTNYA: REPLYFORGE v4.0 STANDALONE, 5. CHECKLIST EKSEKUSI SESI BERIKUTNYA, Masalah 1: Mengapa chat Ferdinand jam 20:40 terdeteksi dan dijawab di localhost, tapi TIDAK DIBALAS di WhatsApp?, Masalah 2: Mengapa saat APK ditutup dan dibuka kembali muncul error `net::ERR_CONNECTION_REFUSED`?, PILAR 1: OFFLINE-FIRST BUNDLE DI DALAM APK (ZERO-CRASH WEBVIEW) (+6 more)

### Community 52 - "org.json.JSONArray"
Cohesion: 0.26
Nodes (3): OnThreadClickListener, ThreadAdapter, ViewHolder

### Community 53 - "OrderAdapter"
Cohesion: 0.26
Nodes (3): OnOrderActionListener, OrderAdapter, ViewHolder

## Knowledge Gaps
- **3 isolated node(s):** `NONE`, `NEEDS_REVIEW`, `BLOCKED`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 254 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ReplyForgeDb` connect `ReplyForgeDb` to `MainActivity.java`, `ReplyForgeNotificationService`, `QuickCommandParser`, `.processBuyerMessage`, `MainActivity`, `ReplyForgeLocalServer`, `android.content.Context`, `ChatDetailActivity`, `.onCreate`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `NONE`, `NEEDS_REVIEW`, `BLOCKED` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `db.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07811447811447811 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `MobileAppView.tsx` to `AuthModal.tsx`, `App.tsx`, `primitives.tsx`, `Badge`, `LiveInboxMonitor.tsx`, `OrdersTab.tsx`, `dependencies`, `web/package.json`, `cn`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `MainActivity.java` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._
- **Why does `ReplyForgeNotificationService` connect `ReplyForgeNotificationService` to `ReplyForgeDb`, `ReplyForgeLocalServer.java`, `ReplyForgeLocalServer`, `android.content.Context`, `ReplyForgeNotificationService.java`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07609427609427609 - nodes in this community are weakly interconnected._