import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Cpu, Eye, EyeOff, Key, Leaf, RefreshCw, Server, ShieldAlert, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatClockSeconds } from '../lib/format';
import type { CacheEntry, Metrics, PrivacyLog, Settings } from '../types';
import { Badge, Button, Card, CardHeader, EmptyState, Stat, cn, inputBase, labelClass } from './ui';

interface Props {
  metrics: Metrics;
  cacheEntries: CacheEntry[];
  privacyLogs: PrivacyLog[];
  settings: Settings;
  onClearCache: () => void;
  onUpdateSettings: (patch: Partial<Settings>) => void;
}

type GatewayPreset = 'localhost' | 'huggingface' | 'local';

interface PresetCard {
  id: GatewayPreset;
  icon: LucideIcon;
  iconClass: string;
  title: string;
  desc: string;
}

const PRESET_CARDS: PresetCard[] = [
  {
    id: 'localhost',
    icon: Server,
    iconClass: 'text-amber-800',
    title: 'Preset 1: Localhost 9Router',
    desc: 'Gemini Flash, kecepatan tinggi',
  },
  {
    id: 'huggingface',
    icon: Server,
    iconClass: 'text-amber-700',
    title: 'Preset 2: HuggingFace Gateway',
    desc: 'Llama 3.1 8B via router cloud',
  },
  { id: 'local', icon: RefreshCw, iconClass: 'text-emerald-700', title: 'Preset 3: Smart Local Engine', desc: 'Bawaan, 100% offline' },
];

const fmt = (v: number | string | undefined): string | number => (typeof v === 'number' ? v.toLocaleString('id-ID') : (v ?? 0));

export const GreenPrivacyGateway: React.FC<Props> = ({ metrics, cacheEntries, privacyLogs, settings, onClearCache, onUpdateSettings }) => {
  const [gatewayUrl, setGatewayUrl] = useState(settings.baseUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [saveStatus, setSaveStatus] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const handleSaveGateway = () => {
    onUpdateSettings({
      baseUrl: gatewayUrl,
      apiKey,
      model,
    });
    setSaveStatus(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleApplyPresetGateway = (type: GatewayPreset) => {
    if (type === 'localhost') {
      setGatewayUrl('http://localhost:20128/v1');
      setModel('gemini-2.5-flash');
      onUpdateSettings({ baseUrl: 'http://localhost:20128/v1', model: 'gemini-2.5-flash', engine: 'auto' });
    } else if (type === 'huggingface') {
      setGatewayUrl('https://router.huggingface.co/v1');
      setModel('meta-llama/Llama-3.1-8B-Instruct');
      onUpdateSettings({ baseUrl: 'https://router.huggingface.co/v1', model: 'meta-llama/Llama-3.1-8B-Instruct', engine: 'gateway' });
    } else {
      onUpdateSettings({ engine: 'local' });
    }
  };

  const baseUrl = settings.baseUrl ?? '';
  const activePreset: GatewayPreset | null =
    settings.engine === 'local'
      ? 'local'
      : baseUrl.includes('huggingface')
        ? 'huggingface'
        : baseUrl.includes('localhost')
          ? 'localhost'
          : null;

  const whitelist = Object.entries(settings.whitelist || {});

  return (
    <div className="space-y-6">
      {/* 1. Green IT Dashboard & Efficiency Meter */}
      <Card padding="lg">
        <CardHeader
          icon={Leaf}
          tone="emerald"
          title="Green IT & semantic cache di perangkat"
          description="Pertanyaan berulang dijawab dari cache lokal tanpa memanggil AI cloud."
        />

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Cache hit ratio" value={metrics.cacheHitRatio || '0%'} hint="Respons 0ms di perangkat" tone="emerald" />
          <Stat label="Panggilan LLM dihemat" value={`${fmt(metrics.cacheHits || 0)} calls`} hint="Zero API calls" tone="emerald" />
          <Stat label="Token dihemat" value={fmt(metrics.tokensSaved || 0)} hint="Bandwidth API dihemat" tone="indigo" />
          <Stat
            label="Estimasi karbon dihemat"
            value={`${fmt(metrics.carbonSavedGrams || 0)} gCO2e`}
            hint="Standar Green IT"
            tone="emerald"
          />
        </div>

        <div className="border-t border-line pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-ink-1">
              Semantic cache on-device <span className="font-normal tabular-nums text-ink-3">({cacheEntries.length})</span>
            </h4>
            <Button variant="danger" size="sm" icon={Trash2} onClick={onClearCache} disabled={cacheEntries.length === 0}>
              Hapus semua cache
            </Button>
          </div>

          {cacheEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10">
              <EmptyState
                icon={Leaf}
                title="Belum ada cache tersimpan"
                description="Jalankan Skenario 1 di simulator untuk menghasilkan cache!"
                className="py-8"
              />
            </div>
          ) : (
            <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {cacheEntries.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-nested/40 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-semibold text-ink-1">"{c.question}"</p>
                    <p className="mt-0.5 truncate text-xs text-ink-3">{c.template}</p>
                  </div>
                  <Badge tone="emerald">{c.hits} hits</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* 2. Strict Package Whitelist & Privacy Audit Log */}
      <Card padding="lg">
        <CardHeader
          icon={ShieldAlert}
          tone="red"
          title="Whitelist aplikasi & log audit privasi (UU PDP)"
          description="Hanya mendengarkan aplikasi e-commerce UMKM. Chat grup diblokir, nomor telepon/alamat pembeli dan SMS OTP bank disensor otomatis."
        />

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {whitelist.map(([pkg, enabled]) => (
            <div key={pkg} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-nested/40 p-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-medium text-ink-1">{pkg}</p>
                <p className="text-2xs text-ink-3">{pkg.includes('whatsapp') ? 'WhatsApp Business' : 'Shopee Indonesia'}</p>
              </div>
              <Badge tone={enabled ? 'emerald' : 'neutral'}>{enabled ? 'Whitelisted' : 'Off'}</Badge>
            </div>
          ))}
        </div>

        <div className="border-t border-line pt-4">
          <h4 className="mb-3 text-sm font-semibold text-ink-1">
            Audit log pencegahan kebocoran data <span className="font-normal tabular-nums text-ink-3">({privacyLogs.length})</span>
          </h4>
          {privacyLogs.length === 0 ? (
            <p className="rounded-xl bg-nested/40 px-4 py-4 text-center text-xs text-ink-3">
              Belum ada event privasi. Jalankan Skenario 5 untuk menguji pemblokiran OTP!
            </p>
          ) : (
            <ul className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
              {privacyLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-red-400/20 bg-red-500/6 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Badge tone="red">{log.kind}</Badge>
                    <span className="truncate font-mono text-xs text-ink-2">{log.preview}</span>
                  </div>
                  <span className="shrink-0 font-mono text-2xs tabular-nums text-ink-3">{formatClockSeconds(log.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* 3. 9Router Gateway Live Config */}
      <Card padding="lg">
        <CardHeader
          icon={Cpu}
          tone="indigo"
          title="9Router AI gateway & konfigurasi fallback"
          description="Hubungkan ke 9Router lokal atau cloud provider. Default memakai model Gemini Flash berkecepatan tinggi (<500ms)."
          action={
            saveStatus ? (
              <span role="status" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Pengaturan tersimpan!
              </span>
            ) : undefined
          }
        />

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {PRESET_CARDS.map((p) => {
            const Icon = p.icon;
            const active = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleApplyPresetGateway(p.id)}
                className={cn(
                  'interactive-tap flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors duration-200',
                  active ? 'border-amber-400 bg-elevated shadow-sm' : 'border-line bg-nested/40 hover:border-amber-300',
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface ring-1 ring-line">
                  <Icon className={cn('h-4 w-4', p.iconClass)} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold text-ink-1">{p.title}</span>
                  <span className="block text-xs text-ink-3">{p.desc}</span>
                </span>
                {active && <Check className="h-4 w-4 shrink-0 text-amber-800" aria-label="Preset aktif" />}
              </button>
            );
          })}
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="rf-gw-url" className={labelClass}>
              9Router base URL
            </label>
            <input
              id="rf-gw-url"
              type="text"
              value={gatewayUrl}
              onChange={(e) => setGatewayUrl(e.target.value)}
              className={cn(inputBase, 'h-10 rounded-xl px-3.5 font-mono text-xs focus:border-indigo-400/60 focus:ring-indigo-400/20')}
            />
          </div>
          <div>
            <label htmlFor="rf-gw-model" className={labelClass}>
              Nama model aktif
            </label>
            <input
              id="rf-gw-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gemini-2.5-flash / gemini-3.8-flash"
              className={cn(inputBase, 'h-10 rounded-xl px-3.5 font-mono text-xs focus:border-indigo-400/60 focus:ring-indigo-400/20')}
            />
          </div>
          <div>
            <label htmlFor="rf-gw-key" className={labelClass}>
              API key (opsional jika lokal)
            </label>
            <div className="relative">
              <input
                id="rf-gw-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                className={cn(
                  inputBase,
                  'h-10 rounded-xl pl-3.5 pr-10 font-mono text-xs focus:border-indigo-400/60 focus:ring-indigo-400/20',
                )}
              />
              <button
                type="button"
                aria-label={showKey ? 'Sembunyikan API key' : 'Tampilkan API key'}
                aria-pressed={showKey}
                onClick={() => setShowKey((v) => !v)}
                className="interactive-tap absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:text-ink-1"
              >
                {showKey ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="indigo" icon={Key} onClick={handleSaveGateway}>
            Simpan konfigurasi gateway
          </Button>
        </div>
      </Card>
    </div>
  );
};
