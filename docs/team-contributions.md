# ReplyForge Team Contributions & Responsibility Matrix

**Project:** ReplyForge (Standalone Native Android Agent & Web Seller Center)  
**Competition:** LOGICODIX 2026, Subtheme 3 (Local MSME & Creative Economy)  
**Package ID:** `id.replyforge.agent`  
**Code Freeze Target:** November 14, 2026  

This document defines the engineering roles, module ownership, RACI matrix, git commit traceability, and workload distribution for the four contributors building ReplyForge.

---

## 1. Core Team Roster & Technical Ownership (4 Members)

Our team splits ReplyForge into four clear engineering domains. Each contributor owns a distinct vertical slice of the codebase while collaborating on cross-cutting integration points.

### Member 1: Lead Mobile Architect
- **Contributor:** Ferdinand Manurung (`@royaldinan`)
- **Primary Domain:** Android Native Core, OS Lifecycle Services, On-Device Persistence, and Local Loopback Architecture
- **Owned Source Modules:**
  - `android-native-agent/app/src/main/java/id/replyforge/agent/ReplyForgeForegroundService.java`
  - `android-native-agent/app/src/main/java/id/replyforge/agent/ReplyForgeNotificationService.java`
  - `android-native-agent/app/src/main/java/id/replyforge/agent/BootCompletedReceiver.java`
  - `android-native-agent/app/src/main/java/id/replyforge/agent/ReplyForgeDb.java`
  - `android-native-agent/app/src/main/java/id/replyforge/agent/ReplyForgeLocalServer.java`
  - `android-native-agent/app/src/main/AndroidManifest.xml`
- **Key Engineering Deliverables:**
  - Built the 24/7 persistent `ReplyForgeForegroundService` with wake-lock management so the agent runs on physical Android hardware without an ADB cable or external server.
  - Implemented `ReplyForgeNotificationService` using Android's `NotificationListenerService` and `RemoteInput` APIs to intercept incoming WhatsApp Business (`com.whatsapp.w4b`) and Shopee (`com.shopee.id`) notifications and dispatch sub-second automated replies.
  - Designed the schema and atomic transaction methods in `ReplyForgeDb` (`replyforge.db`) to store products, stock counts, buyer chat threads, and order records locally on the phone.
  - Created the embedded HTTP loopback bridge (`ReplyForgeLocalServer` on `127.0.0.1:8088`) and boot recovery receiver (`BootCompletedReceiver`) to keep the agent alive across device restarts.

### Member 2: AI & Security Engineer
- **Contributor:** Abyan Nur Zaky (`@anzuky1`)
- **Primary Domain:** On-Device AI Decision Engine, Anomaly Classification, Privacy Shield, and In-Process Self-Test Engine
- **Owned Source Modules:**
  - `android-native-agent/app/src/main/java/id/replyforge/agent/ReplyForgeAiEngine.java`
  - `android-native-agent/app/src/main/java/id/replyforge/agent/SelfTestActivity.java`
  - `android-native-agent/app/src/main/java/id/replyforge/agent/QuickCommandParser.java`
  - `server/src/ai/` and hybrid gateway safety filters
- **Key Engineering Deliverables:**
  - Authored `ReplyForgeAiEngine` to handle Indonesian online-shop slang normalization, buyer intent classification, and deterministic HPP (cost of goods sold) floor validation before any price quote leaves the device.
  - Engineered the Anomaly Classifier to detect malicious `.apk` file attachments, fake bank transfer claims, suspicious social engineering prompts, and abnormal order quantities exceeding `max_order_normal`. When an anomaly triggers, the engine pauses autonomous replies for that thread and flags it with the manual review badge (`Perlu Ditinjau Manual`).
  - Built the Client-Side OTP Shield and Privacy Gate, which block banking OTP notifications and personal WhatsApp (`com.whatsapp`) messages on the device so zero bytes of sensitive personal data ever reach cloud endpoints.
  - Developed `SelfTestActivity` to run 8 core deterministic verification cases plus the `ERROR_STATE` resilience check directly inside the APK (`SELF-TEST: 8/8 PASS` and `ERROR_STATE: PASS`).

### Member 3: Frontend & Dashboard Engineer
- **Contributor:** Farrel Basayev (`@FarrelBasayev`)
- **Primary Domain:** Web Seller Center (React/Vite/TypeScript), Design System Tokens, and Android Material3 UI Styling
- **Owned Source Modules:**
  - `web/src/App.tsx`, `web/src/main.tsx`, `web/src/index.css`, `web/vite.config.ts`
  - `web/src/components/MobileAppView.tsx`, `web/src/components/StoreStudio.tsx`, `web/src/components/OrderLedger.tsx`, `web/src/components/LiveInboxMonitor.tsx`, `web/src/components/MiroFishSimulator.tsx`, `web/src/components/BuyerSimulator.tsx`
  - `web/src/components/mobile/*` (`InboxView.tsx`, `ThreadView.tsx`, `StockTab.tsx`, `OrdersTab.tsx`, `SystemTab.tsx`, `BottomNav.tsx`)
  - `web/src/components/ui/*` (`primitives.tsx`, `styles.ts`, `tones.ts`, `channels.ts`)
  - `android-native-agent/app/src/main/res/layout/*.xml` and `res/values/*.xml`
  - `MainActivity.java`, `OnboardingActivity.java`, `ChatDetailActivity.java`, and RecyclerView adapters (`ThreadAdapter.java`, `ChatMessageAdapter.java`, `ProductAdapter.java`, `OrderAdapter.java`)
- **Key Engineering Deliverables:**
  - Built the React + Vite Web Seller Center running on `http://localhost:5173`, featuring live inbox monitoring, stock management, order ledger tracking, and the MiroFish multi-buyer simulation studio.
  - Applied the Sunlit Warm and Material3 color system (Amber `#D97706` primary, Slate `#475569` secondary, clean high-contrast surfaces) across both web views and Android XML layouts.
  - Hardened all 7 native Android screens (`activity_onboarding.xml`, `fragment_chat.xml`, `activity_chat_detail.xml`, `fragment_stock.xml`, `fragment_orders.xml`, `fragment_settings.xml`, `activity_self_test.xml`) to meet WCAG AA contrast ratios, 48x48dp minimum touch targets, and zero text truncation at Android font scale 1.3.
  - Wired the offline Quick Command bar in the Stock tab and ChipGroup status filters in the Orders tab for rapid warehouse operations.

### Member 4: QA & System Documentation Engineer
- **Contributor:** Alex (`@Alex1a67`)
- **Primary Domain:** On-Device Visual Audit, Manual & Automated Test Suites, CSV/Catalog Parsers, and Submission Dossiers
- **Owned Source Modules:**
  - `.omo/VISUAL_AUDIT.md` and `.omo/evidence/shots/*.png` (14 hardware captures)
  - `docs/manual-test-stickeria.xlsx`, `docs/template-katalog-toko.xlsx`, `docs/template-katalog-toko.csv`, `docs/import-produk-demo.csv`, `docs/import-produk-template.csv`
  - `README.md`
  - `docs/team-contributions.md`, `docs/localhost-grand-final-guide.md`, `docs/submission-checklist.md`
  - `docs/hermes-commit-schedule.md`, `docs/hermes-orchestration-prompt.md`
  - `docs/video-demo-script.md`, `docs/video-recording-guide.md`
- **Key Engineering Deliverables:**
  - Executed the 70-point hardware visual audit on a physical Infinix X6853 smartphone (`1080x2436`) across 7 screens at font scales 1.0 and 1.3, verifying 70/70 PASS rows in `.omo/VISUAL_AUDIT.md`.
  - Authored the Stickeria manual test workbook (`docs/manual-test-stickeria.xlsx`) covering end-to-end chat auto-reply, stock deduction, scam APK blocking, personal WhatsApp privacy filtering, and offline quick commands.
  - Built and validated the CSV catalog import datasets (`import-produk-demo.csv`, `template-katalog-toko.csv`) and tested parser edge cases for malformed SKUs, negative stock inputs, and offline command syntax (`tambah 10 STK-CAT-01`).
  - Compiled the complete Logicodix 2026 submission dossier, including the guidebook-compliant `README.md`, 1-minute localhost verification SOP, and shot-by-shot real-device video demo script.

---

## 2. Responsibility Matrix (RACI)

The table below maps our five project pillars across all four members using standard RACI definitions:
- **R (Responsible):** Writes the implementation or executes the task directly.
- **A (Accountable):** Owns final quality sign-off and architectural integrity for the deliverable.
- **C (Consulted):** Provides domain input, schema contracts, or code review before merge.
- **I (Informed):** Keeps track of interface changes and milestone completion.

| Workstream / Deliverable | Member 1: Lead Mobile Architect (`@royaldinan`) | Member 2: AI & Security Engineer (`@anzuky1`) | Member 3: Frontend & Dashboard Engineer (`@FarrelBasayev`) | Member 4: QA & System Documentation Engineer (`@Alex1a67`) |
| :--- | :---: | :---: | :---: | :---: |
| **Android Native Core** (`ForegroundService`, `NotificationListenerService`, `RemoteInput`, `BootCompletedReceiver`) | **A / R** | C | I | C |
| **On-Device SQLite & Local Loopback** (`ReplyForgeDb`, `replyforge.db` schema, atomic stock deduction, `ReplyForgeLocalServer`) | **A / R** | C | C | I |
| **AI Decision Engine & HPP Guard** (`ReplyForgeAiEngine`, slang normalizer, intent parser, semantic cache) | C | **A / R** | I | C |
| **Security, Anomaly Classifier & OTP Shield** (`.apk` scam blocker, `max_order_normal` check, WA Personal privacy filter, UU PDP OTP guard) | C | **A / R** | I | C |
| **In-App Self-Test & Quick Command Engine** (`SelfTestActivity` 8/8 + `ERROR_STATE`, `QuickCommandParser`) | C | **A / R** | C | R |
| **Web Seller Center Dashboard** (React/Vite `localhost:5173`, `MobileAppView`, `MiroFishSimulator`, `OrderLedger`) | I | C | **A / R** | C |
| **Android Material3 UI & Accessibility** (7 XML screen layouts, Amber/Slate theme tokens, 48dp touch targets, 1.3x font scaling) | C | I | **A / R** | C |
| **QA Verification & 70-Point Visual Audit** (Infinix X6853 ADB screencaps, `.omo/VISUAL_AUDIT.md`, `manual-test-stickeria.xlsx`, CSV parser tests) | C | C | C | **A / R** |
| **System Documentation & Submission Dossier** (`README.md`, `localhost-grand-final-guide.md`, `video-demo-script.md`, `submission-checklist.md`) | C | C | C | **A / R** |

---

## 3. Traceability to Git Commits & Scopes

Every contributor's work maps to standardized Conventional Commit scopes in the repository history and the real-time release schedule leading up to the November 14, 2026 code freeze.

### Commit Scope Mapping by Role

| Member & Role | Git Author / Handle | Primary Commit Scopes | Tracked Repository Paths |
| :--- | :--- | :--- | :--- |
| **Member 1: Lead Mobile Architect** | Ferdinand Manurung (`royaldinan`) | `feat(android)`, `fix(service)`, `perf(sqlite)`, `docs(architecture)`, `chore(release)` | `android-native-agent/.../ReplyForgeForegroundService.java`, `ReplyForgeNotificationService.java`, `ReplyForgeDb.java`, `ReplyForgeLocalServer.java`, `BootCompletedReceiver.java`, `AndroidManifest.xml` |
| **Member 2: AI & Security Engineer** | Abyan Nur Zaky (`anzuky1`) | `feat(ai)`, `feat(core)`, `feat(security)`, `fix(guardrail)`, `test(selftest)` | `android-native-agent/.../ReplyForgeAiEngine.java`, `SelfTestActivity.java`, `QuickCommandParser.java`, `server/src/` |
| **Member 3: Frontend & Dashboard Engineer** | Farrel Basayev (`FarrelBasayev`) | `feat(web)`, `feat(ui)`, `fix(layout)`, `style(material3)`, `chore(vite)` | `web/src/**`, `web/package.json`, `web/vite.config.ts`, `android-native-agent/app/src/main/res/**`, `MainActivity.java`, `OnboardingActivity.java`, `ChatDetailActivity.java` |
| **Member 4: QA & System Documentation Engineer** | Alex (`Alex1a67`) | `docs(qa)`, `docs(repo)`, `docs(pitch)`, `docs(media)`, `test(csv)` | `.omo/VISUAL_AUDIT.md`, `.omo/evidence/shots/**`, `docs/manual-test-stickeria.xlsx`, `docs/*.csv`, `docs/*.md`, `README.md` |

### Verified Baseline & Scheduled Commit Ledger

1. **Architecture & Foundation (`docs(architecture)`)**
   - Baseline commit `56f2a8d`: *docs(architecture): establish PRD, system design, and security specifications for Logicodix 2026* (`royaldinan`).
   - Establishes system boundaries, UU PDP zero-byte OTP rules, and standalone execution requirements.
2. **AI Engine, Anomaly Guard & Multi-Channel Core (`feat(core)`, `feat(ai)`, `feat(security)`)**
   - Baseline commit `7190be0` (merged via PR `#1` `0f6b910`): *feat(core): implement AI anomaly detector, SQLite store schema, and multi-channel pipeline* (`Abyan Nur Zaky` / `anzuky1`).
   - Hardening commits (`feat(ai)`, `test(selftest)`): cover `ReplyForgeAiEngine.java`, `.apk` scam interception, personal WhatsApp auto-blocking, offline `QuickCommandParser.java`, and `SelfTestActivity.java` (`8/8 PASS` + `ERROR_STATE: PASS`).
3. **Web Seller Center & Material3 Interface (`feat(web)`, `feat(ui)`, `fix(layout)`)**
   - Baseline commit `6586595` (merged via PR `#2` `99fa546`): *feat(web): implement Sunlit Warm Seller Center UI, anomaly alert modals, and production tests* (`Farrel Basayev` / `FarrelBasayev`).
   - Hardening commits (`feat(web)`, `style(material3)`): cover `localhost:5173` Vite configuration, `.env.example`, Material3 XML button and ChipGroup layout refinements, and 1.3x font scale wrapping across all 7 Android screens.
4. **Standalone Android Native Agent & QA Dossier (`feat(android)`, `docs(qa)`, `docs(repo)`)**
   - Baseline commit `03e3671` (merged via PR `#3` `fa0c068`): *feat(android): 100% standalone native agent, on-device SQLite, and zero-tethered server* (`Alex` / `Alex1a67` & `royaldinan`).
   - Hardening & QA commits (`docs(qa)`, `docs(repo)`, `docs(pitch)`, `docs(media)`): cover the 14 on-device Infinix X6853 screenshots, 70-row `.omo/VISUAL_AUDIT.md`, `docs/manual-test-stickeria.xlsx`, CSV import validation, guidebook-compliant `README.md`, `docs/team-contributions.md`, and Grand Final verification guides.

---

## 4. Declaration of Fair Contribution

We hereby declare that the engineering, design, testing, and documentation effort for **ReplyForge** was distributed equally (25% per member) across all four registered team members for **LOGICODIX 2026**:

| Team Member | Role Title | GitHub Account | Share of Effort | Core Delivery Summary |
| :--- | :--- | :--- | :---: | :--- |
| **Ferdinand Manurung** | Lead Mobile Architect | `@royaldinan` | **25%** | Native Android service lifecycle (`ForegroundService`, `NotificationListenerService`), `ReplyForgeDb` SQLite architecture, and embedded local loopback server. |
| **Abyan Nur Zaky** | AI & Security Engineer | `@anzuky1` | **25%** | `ReplyForgeAiEngine`, HPP margin guard, `.apk` scam & anomaly classifier, Client-Side OTP Shield, WA Personal privacy filter, and `SelfTestActivity`. |
| **Farrel Basayev** | Frontend & Dashboard Engineer | `@FarrelBasayev` | **25%** | React/Vite Web Seller Center (`localhost:5173`), Sunlit Warm UI components, MiroFish simulator, and Android Material3 XML layouts across 1.0x/1.3x font scales. |
| **Alex** | QA & System Documentation Engineer | `@Alex1a67` | **25%** | 70-point hardware visual audit on Infinix X6853, `manual-test-stickeria.xlsx`, CSV catalog parser tests, and complete Logicodix 2026 submission dossiers. |
| **Total** | **4 Active Contributors** | **4 Verified Accounts** | **100%** | **Full-stack standalone native Android & Web Seller Center solution** |

All four contributors actively wrote, reviewed, tested, and verified their respective subsystems in compliance with the Logicodix 2026 Guidebook collaboration and commit history standards.
