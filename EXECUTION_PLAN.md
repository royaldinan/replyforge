# EXECUTION_PLAN.md — Verified Grand Execution Plan (ReplyForge v2.0)
*Author: Lead Systems Architect & Hackathon Auditor*
*Target: LOGICODIX 2026 Hackathon (Grand Champion Delivery)*

---

## 1. Verified System Pre-requisites & Environment Checks

The following components have been directly verified on this host machine (`Windows 11`, `C:\Users\User`):
- [x] **Java / JDK:** OpenJDK 25.0.3 installed at `C:\Program Files\Android\Android Studio\jbr\bin\java.exe`.
- [x] **Android Build System:** Gradle 9.6.0 verified (`./gradlew assembleDebug` builds `app-debug.apk` in 21s).
- [x] **Hardware Mirror Tool:** scrcpy v3.3.4 verified at `C:\Users\User\Desktop\scrcpy-win64-v3.3.4\scrcpy.exe`.
- [x] **Android Debug Bridge:** adb v1.0.41 installed at `C:\Users\User\bin\adb.exe`.
- [x] **Web Build:** Vite 5.4.11 + React 18 (`npm run build` generates production bundle in 5.35s).
- [x] **Automated Test Suite:** Vitest (`53 passed across desktop and mobile suites`).

---

## 2. Phase-by-Phase Verified Execution Roadmap

### Phase 1: Total Data Sanitization & Single Source of Truth
**Objective:** Eliminate 100% of legacy "Kopi Senja" and "Gamis" remnants; establish "Lina Shop - Cute Accessories & Merchandise" as the official case study.

1. **`server/src/seed.js`:**
   - Replace seed products with official accessories catalog:
     - `STK-CAT-01`: Paket Stiker Kucing Gemoy Vinyl Waterproof (Rp15.000, HPP: Rp6.000, Stok: 50)
     - `KC-ACRYL-02`: Gantungan Kunci Akrilik Capybara 2 Sisi (Rp25.000, HPP: Rp12.000, Stok: 30)
     - `GPT-FLW-03`: Griptok HP Akrilik Bunga Daisy (Rp20.000, HPP: Rp8.000, Stok: 25)
     - `PC-HLD-04`: Photocard Holder Plushie Kelinci Lucu (Rp35.000, HPP: Rp18.000, Stok: 15)
   - Update preset responses to match cute merchandise olshop tone (cheerful, friendly, polite).
2. **`server/src/engine/gateway.js`:**
   - Remove hardcoded "Kopi Susu Aren" fallback on line 122. Replace with dynamic catalog resolver.
3. **`server/src/engine/intent.js`:**
   - Update intent extraction dictionary with accessory keywords (stiker, keychain, gantungan kunci, griptok, photocard holder, capybara, daisy).
4. **`web/src/App.tsx`:**
   - Set default `storeName` to `'Lina Shop'` and bank account to `'BCA 5271 8890 21 a.n. Lina Shop'`.
   - Update receipt scanning mock text to `STK-CAT-01`.
5. **`web/src/components/StoreStudio.tsx`:**
   - Update quick command examples: *"Tambah stok Gantungan Kunci Capybara jadi 40 pcs harga 25rb"*.
6. **`web/src/components/BuyerSimulator.tsx` & `MiroFishSimulator.tsx`:**
   - Update simulator scenarios to @rina_wati88 asking for Stiker Kucing Gemoy and Gantungan Kunci Capybara.
7. **`web/src/components/OrderLedger.tsx`:**
   - Update sample screenshot receipt text to Shopee order for Paket Stiker Kucing Gemoy.
8. **`web/tests/desktop.test.tsx` & `fixtures.ts`:**
   - Align test fixtures with the new accessories catalog. Ensure `npm test` runs with 100% green pass.

---

### Phase 2: Mobile App UI/UX Overhaul (Linear / getlayers.ai Anti-Slop Standard)
**Objective:** Eliminate 4-layer header stack and "box-in-a-box" containment, expanding message reading height from 40% to 75%.

1. **`src/components/mobile/AppHeader.tsx`:**
   - Design a compact 56px unified top bar:
     - Left: Store monogram avatar "LS", "Lina Shop", online pulse dot.
     - Center: Segmented channel chip (Shopee Seller with orange dot vs WA Business with green dot + unread pill).
     - Right: Master "⚡ Auto-Pilot" toggle with smooth transition.
2. **`src/components/mobile/ThreadView.tsx`:**
   - Remove heavy outer wrapper card. Allow chat feed to stretch cleanly across mobile viewport.
   - Streamline header: Back button, buyer handle (@rina_wati88), intent memory pill ([2x Stiker Kucing]), and prominent amber "Takeover Manual" action button.
   - Style message bubbles: Slate-navy dark theme with high contrast text; AI badge showing "⚡ Terkirim via RemoteInput · HPP Terproteksi".
   - Event cards for Shopee Payment notifications (#2610259988LINA) clearly marking "LUNAS & Stok -2 pcs".
3. **`src/components/mobile/StockTab.tsx`:**
   - Enforce `font-variant-numeric: tabular-nums` on prices, stock, and HPP margins.
   - Fluid progress bars for stock capacity with smooth ease-out transitions.
   - Interactive voice simulation button and 1-Click Shopee Excel importer.
4. **`src/components/mobile/OrdersTab.tsx`:**
   - Clean order listing with real-time intent reconciliation indicator.
   - "1-Tap Tautkan" button for silent marketplace buyers.
5. **`src/components/mobile/SystemTab.tsx`:**
   - Keep low-level hardware diagnostics here (USB adb reverse, WhatsApp service, Shopee service).
   - Display Green IT metrics (0ms Cache Hit Ratio, Carbon Saved) and Client-Side OTP Privacy Shield logs.

---

### Phase 3: Desktop Studio & MiroFish Telemetry Synchronization
**Objective:** Provide an eye-catching, responsive command center on the right side of the screen recording.

1. **`src/components/TelemetryPipeline.tsx`:**
   - Polish 4-node pipeline visualization (Intercept -> Guard -> AI/HPP -> Reply).
   - Add micro-animations and status pings whenever an SSE event fires from incoming Android notifications.
2. **`src/components/MiroFishSimulator.tsx`:**
   - 3 One-Click Demonstration Scenarios specifically designed for a 3-5 minute video:
     - **Skenario 1:** Full negotiation and checkout flow for `@rina_wati88` (Stiker Kucing Gemoy).
     - **Skenario 2:** Silent buyer checkout for `@budi_silent` (Gantungan Kunci Capybara).
     - **Skenario 3:** Swarm stress test + 0ms Green Cache hit + SMS OTP Privacy Shield drop.
3. **`src/components/OrderLedger.tsx`:**
   - Real-time reactivity: orders list updates automatically via SSE when a simulated or real notification arrives.

---

### Phase 4: Production Verification & Side-by-Side Recording Protocol
**Objective:** Execute actual end-to-end rehearsal using real tools.

1. **Build Web Assets:**
   ```bash
   cd /c/Users/User/replyforge/web
   npm run build
   ```
2. **Start Backend Server:**
   ```bash
   cd /c/Users/User/replyforge/server
   node src/index.js # Runs on port 8088
   ```
3. **Connect Android Device via ADB & Reverse Port:**
   ```bash
   adb devices
   adb reverse tcp:8088 tcp:8088
   ```
4. **Compile & Install Android APK:**
   ```bash
   export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
   export PATH="$JAVA_HOME/bin:$PATH"
   cd /c/Users/User/replyforge/android-native-agent
   ./gradlew assembleDebug
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
5. **Launch scrcpy Mirror Window:**
   ```bash
   /c/Users/User/Desktop/scrcpy-win64-v3.3.4/scrcpy.exe --window-title "ReplyForge Physical Device (Infinix Note 40)" --window-x 0 --window-y 0 --window-width 960 --window-height 1080
   ```
6. **Launch Chrome Localhost Window:**
   - Open Chrome on `http://localhost:8088` snapped to the right half of the screen (`x: 960`, `width: 960`).
7. **Trigger Live Test Webhook:**
   - Verify that when a notification arrives on the phone or simulator, the left window (HP) and right window (Laptop) synchronize in sub-second latency.
