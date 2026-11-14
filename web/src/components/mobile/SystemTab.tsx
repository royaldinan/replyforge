import { useState } from 'react';
import { BatteryCharging, ChevronDown, Cpu, Eye, EyeOff, Key, Leaf, MessageCircle, ShieldCheck, ShoppingBag, Smartphone, Usb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { formatClock } from '../../lib/format';
import type { Metrics, PrivacyLog, Settings } from '../../types';
import { Badge, Button, Card, CardHeader, IconTile, cn } from '../ui';
import type { GatewayModels } from './useGatewayModels';

interface SystemTabProps {
  settings: Settings;
  metrics: Metrics;
  privacyLogs: PrivacyLog[];
  gateway: GatewayModels;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onOpenConnectWizard?: () => void;
  onOpenAuthModal?: () => void;
}

const DEFAULT_MODEL = 'ag/gemini-3.8-flash-low';
const LOGS_COLLAPSED = 3;

/* Nilai cadangan ini dipertahankan dari versi lama (tampil jika backend belum mengirim metrik). */
const FALLBACK_RATIO = '68.4%';
const FALLBACK_CARBON = '14.2';

const formatNumber = (v: number | string | null | undefined): string =>
  typeof v === 'number' ? v.toLocaleString('id-ID') : String(v ?? 0);

const ConnectionRow = ({ icon, name, status }: { icon: LucideIcon; name: string; status: string }) => (
  <li className="flex items-center justify-between gap-3 px-4 py-3">
    <div className="flex min-w-0 items-center gap-3">
      <IconTile icon={icon} size="sm" />
      <span className="truncate text-body font-medium text-ink-1">{name}</span>
    </div>
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-emerald-700">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {status}
    </span>
  </li>
);

const Gauge = ({ percent }: { percent: number }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const p = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0;
  return (
    <svg viewBox="0 0 72 72" className="h-[88px] w-[88px] -rotate-90" aria-hidden="true">
      <circle cx="36" cy="36" r={radius} fill="none" strokeWidth="7" className="stroke-nested" />
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        className="stroke-amber-500 transition-[stroke-dashoffset] duration-700 ease-smooth"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - p / 100)}
      />
    </svg>
  );
};

const runtimeLabel = (): string => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const match = /ReplyForgeAndroid\/([\d.]+)/.exec(ua);
  return match ? `Aplikasi Android v${match[1] ?? ''}` : 'Mode browser';
};

export const SystemTab = ({
  settings,
  metrics,
  privacyLogs,
  gateway,
  onUpdateSettings,
  onOpenConnectWizard,
  onOpenAuthModal,
}: SystemTabProps) => {
  const [showAllLogs, setShowAllLogs] = useState(false);

  /* Green IT */
  const rawRatio = metrics.cacheHitRatio || FALLBACK_RATIO;
  const ratioText = typeof rawRatio === 'number' ? `${rawRatio}%` : String(rawRatio);
  const ratioPercent = parseFloat(String(rawRatio).replace('%', ''));
  const greenStats = [
    { label: 'Panggilan AI dihemat', value: formatNumber(metrics.cacheHits || 0), unit: 'panggilan' },
    { label: 'Token dihemat', value: formatNumber(metrics.tokensSaved || 0), unit: 'token' },
    { label: 'Emisi dihemat', value: formatNumber(metrics.carbonSavedGrams || FALLBACK_CARBON), unit: 'gCO2e' },
  ];

  /* Log privasi */
  const shownLogs = showAllLogs ? privacyLogs : privacyLogs.slice(0, LOGS_COLLAPSED);

  /* Model AI & API Key */
  const [localApiKey, setLocalApiKey] = useState(settings.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const modelIds = gateway.models.map((m) => m.id);
  const options = modelIds.length > 0 ? [...modelIds] : [DEFAULT_MODEL, 'gemini-3.8-flash', 'gemini-2.0-flash'];
  if (settings.model && !options.includes(settings.model)) options.unshift(settings.model);
  const selectedModel = settings.model || options[0] || DEFAULT_MODEL;
  const modelHelper =
    gateway.status === 'loading'
      ? 'Memuat daftar model dari gateway...'
      : gateway.status === 'ready'
        ? `${modelIds.length} model tersedia dari gateway`
        : 'Gateway belum terjangkau, memakai model bawaan.';

  const handleSaveApiKey = () => {
    onUpdateSettings({ apiKey: localApiKey.trim(), model: selectedModel });
    toast.success('Kunci API & model AI berhasil disimpan!');
  };

  const handleOpenBatteryOptimization = () => {
    const bridge = (window as any).ReplyForgeAndroid;
    if (bridge?.openBatteryOptimizationSettings) {
      bridge.openBatteryOptimizationSettings();
    } else {
      toast.info('Buka Setelan HP > Baterai > Penghemat Baterai > Pilih ReplyForge "Jangan Optimalkan".');
    }
  };

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <Card padding="none">
        <div className="px-4 pb-3 pt-4">
          <CardHeader
            level={2}
            icon={Smartphone}
            tone="amber"
            title="Koneksi kanal penjualan"
            description="WhatsApp Business dan Shopee Seller yang terhubung ke agen."
            flush
          />
        </div>
        <ul className="divide-y divide-line border-t border-line">
          <ConnectionRow icon={ShoppingBag} name="Shopee Seller App (@royaldinan)" status="Terhubung" />
          <ConnectionRow icon={MessageCircle} name="WhatsApp Business" status="Terhubung" />
        </ul>
        <div className="flex flex-wrap gap-2 border-t border-line bg-nested/40 px-4 py-3">
          {onOpenConnectWizard && (
            <Button variant="primary" size="sm" onClick={onOpenConnectWizard}>
              Atur WA &amp; Shopee
            </Button>
          )}
          {onOpenAuthModal && (
            <Button variant="secondary" size="sm" onClick={onOpenAuthModal}>
              Akun Toko
            </Button>
          )}
        </div>
      </Card>


      <Card>
        <CardHeader
          level={2}
          icon={ShieldCheck}
          tone="red"
          title="Perisai privasi & OTP"
          description="Kode OTP dan SMS bank diblokir di HP sebelum sampai ke AI."
          action={<Badge tone="emerald">0 byte ke cloud</Badge>}
        />
        {privacyLogs.length === 0 ? (
          <p className="rounded-xl bg-nested/60 px-3 py-4 text-center text-xs leading-5 text-ink-2">
            Nol kebocoran data. Kode OTP diblokir 100% lokal di HP.
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {shownLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-red-500/8 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Badge tone="red">{log.kind}</Badge>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-2">{log.preview}</p>
                  </div>
                  <span className="shrink-0 text-2xs tabular-nums text-ink-3">{formatClock(log.created_at)}</span>
                </li>
              ))}
            </ul>
            {privacyLogs.length > LOGS_COLLAPSED && (
              <Button variant="ghost" fullWidth className="mt-2" onClick={() => setShowAllLogs((v) => !v)}>
                {showAllLogs ? 'Tampilkan lebih sedikit' : `Lihat semua (${privacyLogs.length})`}
              </Button>
            )}
          </>
        )}
      </Card>

      <Card>
        <CardHeader
          level={2}
          icon={Cpu}
          tone="indigo"
          title="Kecerdasan AI (Cloud Gemini / Groq)"
          description={modelHelper}
        />
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-ink-3">
              Model AI
            </label>
            <div className="relative">
              <select
                aria-label="Model AI"
                value={selectedModel}
                onChange={(e) => onUpdateSettings({ model: e.target.value })}
                className={cn(
                  'h-11 w-full appearance-none rounded-xl border border-line bg-nested pl-3.5 pr-10 text-body text-ink-1 outline-none transition-colors duration-150',
                  'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20',
                )}
              >
                {options.map((id) => (
                  <option key={id} value={id}>
                    {modelIds.length === 0 && id === DEFAULT_MODEL ? `${id} (Default)` : id}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-ink-3">
              API Key AI (Google AI Studio / OpenRouter)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="AIzaSy... atau sk-or-v1-..."
                className={cn(
                  'h-11 w-full rounded-xl border border-line bg-nested pl-3.5 pr-11 font-mono text-xs text-ink-1 outline-none transition-colors duration-150',
                  'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20',
                )}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? 'Sembunyikan kunci' : 'Lihat kunci'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-1"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button variant="primary" fullWidth size="md" onClick={handleSaveApiKey}>
            Simpan Setelan AI
          </Button>
        </div>
      </Card>

      <p className="pt-1 text-center text-2xs text-ink-3">ReplyForge · {runtimeLabel()}</p>
    </div>
  );
};
