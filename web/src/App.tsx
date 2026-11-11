import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import {
  Sparkles,
  LayoutDashboard,
  Store,
  ShoppingBag,
  Leaf,
  RotateCcw,
  Smartphone,
  Monitor,
  CheckCircle2,
  Zap,
  Link2,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import { TelemetryPipeline } from './components/TelemetryPipeline';
import { LiveInboxMonitor } from './components/LiveInboxMonitor';
import { InventoryBarometer } from './components/InventoryBarometer';
import { MobileAppView } from './components/MobileAppView';
import { StoreStudio } from './components/StoreStudio';
import { OrderLedger } from './components/OrderLedger';
import { GreenPrivacyGateway } from './components/GreenPrivacyGateway';
import { AuthModal } from './components/AuthModal';
import { ChannelOnboardingModal } from './components/ChannelOnboardingModal';
import { SellerAlertBanner } from './components/SellerAlertBanner';
import { TutorialModal } from './components/TutorialModal';
import {
  Product,
  Rule,
  Order,
  TelemetryNode,
  Metrics,
  Settings,
  CacheEntry,
  PrivacyLog,
  AnomalyAlert,
  StoreAccount,
} from './types';

export default function App() {
  const isMobileQuery = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mobile') === '1';
  const [viewMode, setViewMode] = useState<'studio' | 'mobile'>(isMobileQuery ? 'mobile' : 'studio');
  const [desktopTab, setDesktopTab] = useState<'studio' | 'rules' | 'ledger' | 'green'>('studio');
  const [isLoading, setIsLoading] = useState(false);

  // Modals: Auth, Channel Onboarding Wizard, & Beginner Tutorial Guide
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [connectWizardOpen, setConnectWizardOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [storeAccount, setStoreAccount] = useState<StoreAccount | null>(null);

  // Core Data
  const [products, setProducts] = useState<Product[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [privacyLogs, setPrivacyLogs] = useState<PrivacyLog[]>([]);
  const [settings, setSettings] = useState<Settings>({
    storeName: 'Lina Shop',
    baseUrl: 'http://localhost:20128/v1',
    apiKey: '',
    model: 'ag/gemini-3.8-flash-low',
    engine: 'auto',
    mode: 'autopilot',
    tone: 'santai',
    cutoff: '16.00',
    typingDelayMs: 3000,
    debounceMs: 3000,
    carbonPerKTokens: 0.6,
    blockGroups: true,
    whitelist: {
      'com.whatsapp.w4b': true,
      'com.shopee.id': true,
    },
    bankAccount: 'BCA 5271 8890 21 a.n. Lina Shop',
  });
  const [metrics, setMetrics] = useState<Metrics>({
    messages: 0,
    llmCalls: 0,
    localEngine: 0,
    cacheHits: 0,
    tokensSaved: 0,
    blocked: 0,
    redactions: 0,
    ordersFromChat: 0,
    mergedFragments: 0,
    selfLoopsBlocked: 0,
    carbonSavedGrams: '0',
    cacheHitRatio: '0%',
  });

  // Telemetry Pipeline State
  const [activeTelemetryNode, setActiveTelemetryNode] = useState<TelemetryNode | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryNode[]>([]);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [prodRes, rulesRes, ordersRes, cacheRes, privRes, setRes, metRes, alertsRes, authRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/rules').then((r) => r.json()),
        fetch('/api/orders').then((r) => r.json()),
        fetch('/api/cache').then((r) => r.json()),
        fetch('/api/privacy-log').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/metrics').then((r) => r.json()),
        fetch('/api/alerts').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
      ]);
      setProducts(prodRes || []);
      setRules(rulesRes || []);
      setOrders(ordersRes || []);
      setCacheEntries(cacheRes || []);
      setPrivacyLogs(privRes || []);
      setSettings(setRes || {});
      setMetrics(metRes || {});
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      if (authRes?.account) {
        setStoreAccount(authRes.account);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const handleResolveAlert = async (id: number, resumeAi: boolean) => {
    try {
      await fetch(`/api/alerts/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', resumeAi }),
      });
      await fetchData();
      toast.success('Peringatan ditandai selesai & status chat diperbarui.');
    } catch {
      toast.error('Gagal memperbarui status peringatan');
    }
  };

  useEffect(() => {
    fetchData();

    // Connect to Server-Sent Events (SSE) for Real-Time Animated Telemetry Pipeline
    const sse = new EventSource('/api/telemetry/stream');
    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.node) {
          setActiveTelemetryNode(payload);
          setTelemetryHistory((prev) => [payload, ...prev].slice(0, 20));

          // If stock was modified via SSE, refresh products & orders immediately
          if (payload.status === 'STOCK_DEPLETED' || payload.status === 'DRAFT_NEEDS_CONFIRMATION') {
            fetchData();
            toast.success(payload.badge || 'Stok & pesanan berhasil diperbarui otomatis!');
          } else if (payload.status === 'CRITICAL_BLOCK') {
            fetchData();
            toast.error('Privasi Terlindungi: SMS OTP Ditolak Secara Lokal!');
          } else if (payload.status === 'ANOMALY_ESCALATED') {
            fetchData();
            const title = payload.alert?.title || 'Peringatan Pesanan Tidak Wajar';
            const reason = payload.alert?.reason || payload.badge || 'Auto-Reply dijeda untuk pembeli ini.';
            toast.error(`${title}: ${reason}`);
            if (typeof window !== 'undefined' && window.ReplyForgeAndroid?.triggerAnomalyAlert) {
              try {
                window.ReplyForgeAndroid.triggerAnomalyAlert(title, reason);
              } catch {
                // ignore bridge error
              }
            }
          }
        }
      } catch (e) {
        // Ping message
      }
    };

    return () => sse.close();
  }, []);

  // Simulator Message Sender (Sends webhook to backend)
  const handleSimulatorMessage = async (payload: {
    buyer: string;
    channel: string;
    text: string;
    packageName: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notification-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      await fetchData();
      if (data.mode === 'copilot') {
        toast.info('1-Tap Copilot: Draf jawaban AI siap dikirim!');
      }
      return data;
    } catch (err: any) {
      toast.error('Gagal mengirim ke webhook: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Stock Adjustment
  const handleAdjustStock = async (sku: string, delta: number) => {
    try {
      await fetch(`/api/products/${sku}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      fetchData();
    } catch (e) {
      toast.error('Gagal memperbarui stok');
    }
  };

  // Rule Handlers
  const handleAddRule = async (rule: Omit<Rule, 'id' | 'source'>) => {
    try {
      await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      fetchData();
      toast.success('Aturan berhasil disimpan!');
    } catch (e) {
      toast.error('Gagal menambah aturan');
    }
  };

  const handleDeleteRule = async (id: number) => {
    try {
      await fetch(`/api/rules/${id}`, { method: 'DELETE' });
      fetchData();
      toast.success('Aturan dihapus');
    } catch (e) {
      toast.error('Gagal menghapus aturan');
    }
  };

  // Conversational Command (Chat-to-Config)
  const handleRunConversationalCommand = async (command: string) => {
    const res = await fetch('/api/conversational-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    const data = await res.json();
    fetchData();
    return data.message || 'Perintah dijalankan';
  };

  // Order Status Handler
  const handleUpdateOrderStatus = async (id: number, status: 'reserved' | 'paid' | 'cancelled') => {
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchData();
      toast.success(`Status order diubah ke: ${status}`);
    } catch (e) {
      toast.error('Gagal mengubah status pesanan');
    }
  };

  // Vision Screenshot Mock Handler
  const handleScanReceipt = async (extractedText: string) => {
    try {
      // Simulate order extraction
      const res = await fetch('/api/notification-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer: 'Siti Rahmawati',
          channel: 'shopee',
          packageName: 'com.shopee.id',
          text: 'Kak saya pesan Paket Stiker Kucing 2 pack ya, sudah saya bayar.',
        }),
      });
      await res.json();
      fetchData();
      toast.success('Screenshot Shopee berhasil dipindai & stok terpotong!');
    } catch (e) {
      toast.error('Gagal memproses screenshot');
    }
  };

  // Settings Handlers
  const handleUpdateSettings = async (patch: Partial<Settings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      setSettings(data);
      toast.success('Pengaturan disimpan!');
    } catch (e) {
      toast.error('Gagal memperbarui pengaturan');
    }
  };

  const handleClearCache = async () => {
    try {
      await fetch('/api/cache', { method: 'DELETE' });
      fetchData();
      toast.success('Cache berhasil dibersihkan');
    } catch (e) {
      toast.error('Gagal membersihkan cache');
    }
  };

  const handleResetSystem = async () => {
    if (!confirm('Reset semua data kembali ke kondisi awal (fresh seed)?')) return;
    try {
      await fetch('/api/system/reset', { method: 'POST' });
      fetchData();
      toast.success('Sistem berhasil di-reset!');
    } catch (e) {
      toast.error('Gagal mereset sistem');
    }
  };

  // IF IN PURE MOBILE VIEW (Physical Phone Screen or Mobile toggle)
  if (viewMode === 'mobile') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-start">
        <Toaster
          theme="light"
          position="top-center"
          richColors
          style={{
            '--normal-bg': '#FFFFFF',
            '--normal-text': '#18181B',
            '--normal-border': '#E5E2DA',
            '--border-radius': '14px',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          } as React.CSSProperties}
        />
        <AuthModal
          open={authModalOpen}
          currentAccount={storeAccount}
          onClose={() => setAuthModalOpen(false)}
          onAuthenticated={(acc, isNew) => {
            setStoreAccount(acc);
            fetchData();
            if (isNew) setConnectWizardOpen(true);
          }}
        />
        <ChannelOnboardingModal
          open={connectWizardOpen}
          account={storeAccount}
          onClose={() => setConnectWizardOpen(false)}
          onSaved={(acc) => {
            setStoreAccount(acc);
            fetchData();
          }}
        />
        <TutorialModal
          open={tutorialOpen}
          onClose={() => setTutorialOpen(false)}
          onOpenConnectWizard={() => setConnectWizardOpen(true)}
        />
        <MobileAppView
          products={products}
          rules={rules}
          orders={orders}
          settings={settings}
          metrics={metrics}
          privacyLogs={privacyLogs}
          alerts={alerts}
          onResolveAlert={handleResolveAlert}
          onOpenConnectWizard={() => setConnectWizardOpen(true)}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          onOpenTutorial={() => setTutorialOpen(true)}
          onUpdateSettings={handleUpdateSettings}
          onAdjustStock={handleAdjustStock}
          onUpdateOrderStatus={handleUpdateOrderStatus as any}
          onAddRule={handleAddRule}
          onRunConversationalCommand={handleRunConversationalCommand}
          onRefreshData={fetchData}
        />
      </div>
    );
  }

  // DESKTOP SELLER CENTER VIEW (Sunlit Warm Commercial — Dominan Putih & Kuning Cerah)
  const openAlertsCount = alerts.filter((a) => a.status === 'open').length;

  return (
    <div className="min-h-screen bg-canvas text-ink-1 flex flex-col font-sans">
      <Toaster
        theme="light"
        position="top-right"
        richColors
        style={{
          '--normal-bg': '#FFFFFF',
          '--normal-text': '#18181B',
          '--normal-border': '#E5E2DA',
          '--border-radius': '14px',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        } as React.CSSProperties}
      />

      <AuthModal
        open={authModalOpen}
        currentAccount={storeAccount}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={(acc, isNew) => {
          setStoreAccount(acc);
          fetchData();
          if (isNew) setConnectWizardOpen(true);
        }}
      />

      <ChannelOnboardingModal
        open={connectWizardOpen}
        account={storeAccount}
        onClose={() => setConnectWizardOpen(false)}
        onSaved={(acc) => {
          setStoreAccount(acc);
          fetchData();
        }}
      />

      <TutorialModal
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        onOpenConnectWizard={() => setConnectWizardOpen(true)}
      />

      {/* Top Header */}
      <header className="border-b border-line bg-gradient-to-b from-yellow-50/90 to-surface/95 backdrop-blur-xl sticky top-0 z-40 px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-xs font-extrabold text-zinc-950 shadow-gold ring-1 ring-inset ring-amber-500/40"
            >
              RF
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-ink-1">ReplyForge</h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-400/60">
                  {settings.storeName || 'Lina Shop'}
                </span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-300 hidden sm:inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  WA Business Terhubung
                </span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-300 hidden sm:inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  Shopee Belum Terhubung
                </span>
              </div>
              <p className="text-[11px] text-ink-3 mt-0.5">
                Asisten Otomasi Chat, Proteksi HPP, &amp; Sinkronisasi Stok UMKM ({storeAccount?.whatsappNumber || '0851-8325-0750'} · {storeAccount?.shopeeHandle || '@linashop.id'})
              </p>
            </div>
          </div>

          {/* Center: View Switcher */}
          <div className="flex rounded-xl border border-line bg-nested p-1">
            <button
              onClick={() => setDesktopTab('studio')}
              className={`interactive-tap flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                desktopTab === 'studio'
                  ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-zinc-950 shadow-sm ring-1 ring-inset ring-amber-500/35'
                  : 'text-ink-2 hover:text-ink-1 hover:bg-surface/60'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Monitor Chat &amp; Stok</span>
              {openAlertsCount > 0 && (
                <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {openAlertsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setDesktopTab('rules')}
              className={`interactive-tap flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                desktopTab === 'rules'
                  ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-zinc-950 shadow-sm ring-1 ring-inset ring-amber-500/35'
                  : 'text-ink-2 hover:text-ink-1 hover:bg-surface/60'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Katalog &amp; Aturan</span>
            </button>
            <button
              onClick={() => setDesktopTab('ledger')}
              className={`interactive-tap flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                desktopTab === 'ledger'
                  ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-zinc-950 shadow-sm ring-1 ring-inset ring-amber-500/35'
                  : 'text-ink-2 hover:text-ink-1 hover:bg-surface/60'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Buku Pesanan</span>
            </button>
            <button
              onClick={() => setDesktopTab('green')}
              className={`interactive-tap flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                desktopTab === 'green'
                  ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-zinc-950 shadow-sm ring-1 ring-inset ring-amber-500/35'
                  : 'text-ink-2 hover:text-ink-1 hover:bg-surface/60'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Keamanan &amp; Efisiensi</span>
            </button>
          </div>

          {/* Right Action: Tutorial, Channel Wizard, Account Login, Mobile View Toggle & Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTutorialOpen(true)}
              className="interactive-tap flex items-center gap-1.5 rounded-xl border border-amber-400 bg-gradient-to-br from-yellow-200 via-yellow-300 to-amber-400 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:from-yellow-100 hover:to-amber-300 shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-950" />
              <span>Panduan Cara Pakai</span>
            </button>

            <button
              onClick={() => setConnectWizardOpen(true)}
              className="interactive-tap flex items-center gap-1.5 rounded-xl border border-amber-400 bg-elevated px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 shadow-sm"
            >
              <Link2 className="w-3.5 h-3.5 text-amber-800" />
              <span>Koneksi WA &amp; Shopee</span>
            </button>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="interactive-tap flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink-1 hover:bg-nested shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Akun Toko</span>
            </button>

            <button
              onClick={() => setViewMode('mobile')}
              className="interactive-tap flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-nested hover:text-ink-1 shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-ink-2" />
              <span>Tampilan APK HP</span>
            </button>

            <button
              onClick={handleResetSystem}
              title="Reset Database ke Seed Awal"
              className="interactive-tap grid h-8 w-8 place-items-center rounded-xl border border-line-strong bg-surface text-ink-3 hover:bg-nested hover:text-amber-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-5 space-y-5">
        {/* Quick 3-Step Flow Guide Bar for First-Time Users */}
        <section
          aria-label="Alur penggunaan 3 langkah"
          className="grid grid-cols-1 gap-2.5 rounded-2xl border border-amber-300/90 bg-gradient-to-r from-yellow-50 via-amber-50/70 to-surface p-3.5 shadow-sm md:grid-cols-4"
        >
          <button
            type="button"
            onClick={() => setConnectWizardOpen(true)}
            className="interactive-tap flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5 text-left hover:border-amber-400"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-400 text-xs font-extrabold text-zinc-950">
              1
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink-1">Hubungkan WA &amp; Shopee</p>
              <p className="truncate text-2xs text-ink-3">Aktifkan izin notifikasi di HP</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDesktopTab('rules')}
            className="interactive-tap flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5 text-left hover:border-amber-400"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-400 text-xs font-extrabold text-zinc-950">
              2
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink-1">Cek Stok &amp; Harga Modal (HPP)</p>
              <p className="truncate text-2xs text-ink-3">Kunci harga pas anti-rugi</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDesktopTab('studio')}
            className="interactive-tap flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5 text-left hover:border-amber-400"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-400 text-xs font-extrabold text-zinc-950">
              3
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink-1">Pantau Chat &amp; Peringatan AI</p>
              <p className="truncate text-2xs text-ink-3">AI balas otomatis &amp; jaga anomali</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="interactive-tap flex items-center justify-between gap-2 rounded-xl border border-amber-400 bg-elevated p-2.5 text-left hover:bg-amber-100"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-amber-950">Bingung Cara Pakainya?</p>
              <p className="truncate text-2xs text-amber-800">Klik untuk buka tutorial lengkap &rarr;</p>
            </div>
            <BookOpen className="h-4 w-4 shrink-0 text-amber-800" />
          </button>
        </section>

        {/* Priority Seller Escalation Alert Banner (Unusual Quantity / Weird Query / Incomplete Address) */}
        <SellerAlertBanner alerts={alerts} onResolveAlert={handleResolveAlert} />

        {/* Animated 4-Node Telemetry Pipeline */}
        <TelemetryPipeline activeNode={activeTelemetryNode} history={telemetryHistory} />

        {/* Tab 1: Live Conversation Monitor + Real-time Inventory Barometer */}
        {desktopTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7">
              <LiveInboxMonitor
                onSendMessage={handleSimulatorMessage}
                isLoading={isLoading}
                onRefreshData={fetchData}
              />
            </div>

            <div className="lg:col-span-5">
              <InventoryBarometer
                products={products}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onAdjustStock={handleAdjustStock}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Rule Studio & Presets */}
        {desktopTab === 'rules' && (
          <StoreStudio
            rules={rules}
            products={products}
            settings={settings}
            onAddRule={handleAddRule}
            onDeleteRule={handleDeleteRule}
            onRunConversationalCommand={handleRunConversationalCommand}
          />
        )}

        {/* Tab 3: Order Ledger */}
        {desktopTab === 'ledger' && (
          <OrderLedger
            orders={orders}
            products={products}
            onUpdateOrderStatus={handleUpdateOrderStatus as any}
            onScanReceipt={handleScanReceipt}
          />
        )}

        {/* Tab 4: Green IT & Privacy */}
        {desktopTab === 'green' && (
          <GreenPrivacyGateway
            metrics={metrics}
            settings={settings}
            privacyLogs={privacyLogs}
            cacheEntries={cacheEntries}
            onUpdateSettings={handleUpdateSettings}
            onClearCache={handleClearCache}
          />
        )}
      </main>
    </div>
  );
}
