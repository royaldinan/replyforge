# DESIGN.md — ReplyForge v3.0 Visual Design Architecture & Tokens (Sunlit Warm Commercial)

## 1. Design Philosophy & Craft Standards (getlayers.ai, Wise, & OpenDesign Inspired)
ReplyForge v3.0 strictly follows the **Impeccable Craft Standard**, **Emil Kowalski Motion Physics**, and **Anti-Slop Design Principles**:
- **Sunlit Warm Commercial Palette (Dominan Putih & Kuning Cerah):**
  - Replaces generic dark-blue AI slop with a warm, sunlit commercial aesthetic tailored for Indonesian MSME merchants.
  - Primary canvas in Warm Alabaster (`#FAF8F5`) paired with Pure Crisp White (`#FFFFFF`) elevated surfaces and Vibrant Sun Yellow / Amber Gold (`#FACC15` -> `#F59E0B`) primary actions.
  - Deep Charcoal typography (`#18181B`) achieving >14:1 contrast ratio on white and sunlit gold surfaces.
- **Strict Tabular Numerics:** Enforcement of `font-variant-numeric: tabular-nums` across all Rupiah prices, HPP margins, inventory stock counts, execution timers (`ms`), and metric percentages.
- **Emil Kowalski Motion Physics:**
  - Transition curve: `cubic-bezier(0.22, 1, 0.36, 1)` across all tab switches, modal transitions, and stock progress bars.
  - Interactive button press feedback: `:active { transform: scale(0.97); }` (160ms ease-out).

---

## 2. Color Palette & Surface Hierarchy

| Token | Hex Value | Semantic Purpose |
|---|---|---|
| `bg-canvas` | `#FAF8F5` | Warm Alabaster background for desktop & mobile app |
| `bg-surface` | `#FFFFFF` | Pure Crisp White card & table surfaces |
| `bg-nested` | `#F4F2EC` | Warm Stone input containers and secondary controls |
| `bg-elevated` | `#FFFBEB` | Sunlit Ivory (Amber-50) highlight for active rows & banners |
| `line` | `#E5E2DA` | Crisp 1px hairline border |
| `brand-yellow` | `#FACC15` | Vibrant Sun Yellow primary brand accent |
| `brand-amber` | `#F59E0B` | Rich Amber Gold for primary CTAs & stock progress |
| `ink-1` | `#18181B` | Deep Zinc Charcoal primary typography |
| `ink-2` | `#3F3F46` | Secondary Slate body text |
| `ink-3` | `#686873` | Muted meta text, SKUs, and timestamps |
| `status-emerald` | `#15803D` on `#F0FDF4` | Connected status, paid orders, safe stock |
| `status-red` | `#B91C1C` on `#FEF2F2` | Seller Escalation Alert (Unusual Qty / Weird Query) & OTP Block |
| `brand-shopee` | `#C23315` on `#FFF2EE` | Shopee Seller channel indicator |
| `brand-wa` | `#116932` on `#ECFDF3` | WhatsApp Business channel indicator |

---

## 3. Typography & Hierarchy
- **Primary Typeface:** `Plus Jakarta Sans` (Geometric humanist sans with high legibility on mobile screens).
- **Monospace Typeface:** `JetBrains Mono` (Applied strictly to SKUs, code identifiers, latency metrics, and API payloads).
- **Type Scale:**
  - Micro Badges: `10px` / tracking +0.02em / uppercase
  - Helper & Meta Text: `11px` / text-zinc-400
  - Body Text & Inputs: `12px` (text-xs) to `13px` / line-height 1.5
  - Section Headings: `14px` (text-sm) / font-semibold / text-zinc-100
  - Hero Dashboard Metrics: `20px` to `24px` / font-bold / tabular-nums

---

## 4. Animation & Interaction Specifications
- **Pipeline Pulse:** Active telemetry nodes expand by `scale-[1.02]` with an animated bottom accent bar indicating active execution status.
- **Stock Depletion Transition:** Depletion progress bars animate over `500ms cubic-bezier(0.22, 1, 0.36, 1)` smoothly decrementing without stepping artifacts.
- **Button Press Feedback:** All pressable controls scale to `0.97` on active tap with an asymmetric release curve (fast release 160ms ease-out).
- **Toast Notifications:** Sonner-powered dark toasts positioned at `top-right` (desktop) and `top-center` (mobile) with high-contrast status icons.
