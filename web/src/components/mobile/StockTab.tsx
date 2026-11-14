import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, Check, Mic, Minus, Plus, RefreshCw, Send, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '../../lib/format';
import type { Product, Rule } from '../../types';
import { Badge, Button, Card, CardHeader, IconButton, ProgressBar, Segmented, cn, inputBase } from '../ui';
import { COMMAND_EXAMPLES, PRESETS, type Preset } from './data';
import { OverviewStrip } from './OverviewStrip';
import type { StockComposer } from './useStockComposer';

interface StockTabProps {
  products: Product[];
  rules: Rule[];
  composer: StockComposer;
  onAdjustStock: (sku: string, delta: number) => void;
  onAddRule: (rule: Omit<Rule, 'id' | 'source'>) => void;
  onRefresh: () => void;
}

const LOW_STOCK_AT = 5;

/* ---------------------------- Perintah cepat ---------------------------- */

const Composer = ({ composer }: { composer: StockComposer }) => {
  const canSubmit = composer.inputText.trim().length > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      composer.importCsv(file);
      e.target.value = '';
    }
  };
  return (
    <Card>
      <CardHeader
        level={2}
        icon={Sparkles}
        tone="emerald"
        title="Perintah cepat"
        description="Ketik atau ucapkan, AI yang mengisi stok dan aturan balasan."
      />

      <div className="relative">
        <textarea
          rows={3}
          aria-label="Perintah stok dan aturan"
          value={composer.inputText}
          onChange={(e) => composer.setInputText(e.target.value)}
          placeholder="Ketik perintah suara, misal: Paket Stiker Kucing stok 50 harga 15 ribu HPP 6 ribu..."
          className={cn(inputBase, 'resize-none rounded-xl py-3 pl-3.5 pr-14 text-[15px] leading-6')}
        />
        <button
          type="button"
          onClick={composer.simulateVoice}
          aria-pressed={composer.isListening}
          aria-label={composer.isListening ? 'Sedang mendengarkan' : 'Ucapkan perintah'}
          className={cn(
            'interactive-tap absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-xl ring-1 ring-inset',
            composer.isListening
              ? 'animate-pulse bg-red-500/20 text-red-300 ring-red-400/40'
              : 'bg-white/6 text-ink-2 ring-white/10 hover:text-ink-1',
          )}
        >
          <Mic className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-2.5 flex min-h-[2.25rem] flex-wrap items-center gap-2">
        {composer.isListening ? (
          <p role="status" className="text-xs font-medium text-red-300">
            Mendengarkan suara admin toko...
          </p>
        ) : (
          COMMAND_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => composer.setInputText(ex.text)}
              className="interactive-tap h-10 rounded-full bg-white/6 px-3.5 text-xs font-medium text-ink-2 ring-1 ring-inset ring-white/10 hover:text-ink-1"
            >
              {ex.label}
            </button>
          ))
        )}
      </div>

      <div className="mt-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.xlsx"
          className="hidden"
          onChange={handleFileSelected}
        />
        <Button
          fullWidth
          icon={Upload}
          loading={composer.isImportingCsv}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          Pilih File CSV / Excel Katalog Shopee
        </Button>
      </div>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        icon={Send}
        className="mt-2"
        loading={composer.isSubmitting}
        disabled={!canSubmit}
        onClick={() => composer.submit(composer.inputText)}
      >
        Simpan
      </Button>
    </Card>
  );
};

/* ------------------------------ Produk ---------------------------------- */

const ProductRow = ({ p, onAdjustStock }: { p: Product; onAdjustStock: (sku: string, delta: number) => void }) => {
  const percentage = p.capacity > 0 ? Math.min(100, Math.max(0, (p.stock / p.capacity) * 100)) : 0;
  const isLow = p.stock <= LOW_STOCK_AT;
  const hpp = p.hpp || Math.round(p.price * 0.7); // fallback estimasi seperti versi lama
  const hppEstimated = !p.hpp;
  const margin = p.price > 0 ? Math.round(((p.price - hpp) / p.price) * 100) : 0;

  return (
    <li className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pt-0.5">
          <h3 className="truncate text-sm font-semibold text-ink-1">{p.name}</h3>
          <p className="mt-0.5 truncate font-mono text-2xs text-ink-3">{p.sku}</p>
        </div>
        <div
          role="group"
          aria-label={`Stok ${p.name}`}
          className="flex shrink-0 items-center rounded-xl bg-nested ring-1 ring-inset ring-white/10"
        >
          <button
            type="button"
            aria-label={`Kurangi stok ${p.name}`}
            disabled={p.stock <= 0}
            onClick={() => onAdjustStock(p.sku, -1)}
            className="interactive-tap grid h-11 w-11 place-items-center rounded-xl text-ink-2 hover:text-ink-1 disabled:opacity-30"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span
            aria-live="polite"
            className={cn('w-10 text-center text-base font-bold tabular-nums', isLow ? 'text-amber-300' : 'text-ink-1')}
          >
            {p.stock}
          </span>
          <button
            type="button"
            aria-label={`Tambah stok ${p.name}`}
            onClick={() => onAdjustStock(p.sku, 1)}
            className="interactive-tap grid h-11 w-11 place-items-center rounded-xl text-ink-2 hover:text-ink-1"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-sm font-bold tabular-nums text-amber-800">{formatRupiah(p.price)}</span>
        <span className="text-xs tabular-nums text-ink-3">
          {hppEstimated ? 'HPP ≈ ' : 'HPP '}
          {formatRupiah(hpp)}
        </span>
        <Badge>Margin {margin}%</Badge>
      </div>

      <div className="mt-2.5">
        <ProgressBar value={percentage} tone={isLow ? 'amber' : 'emerald'} label={`Level stok ${p.name}`} />
        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
          <span className="tabular-nums text-ink-3">
            Sisa {p.stock} {p.unit} dari kapasitas {p.capacity}
          </span>
          {isLow && (
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-amber-700">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              Hampir habis
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

/* ------------------------------ Template -------------------------------- */

const PresetRow = ({ preset, active, onUse }: { preset: Preset; active: boolean; onUse: (p: Preset) => void }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pt-0.5">
          <h3 className="text-body font-semibold text-ink-1">{preset.label}</h3>
          <p className="text-xs text-ink-3">{preset.desc}</p>
        </div>
        {active ? (
          <Badge tone="emerald" icon={Check} className="mt-1">
            Aktif
          </Badge>
        ) : (
          <Button icon={Plus} onClick={() => onUse(preset)}>
            Gunakan
          </Button>
        )}
      </div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="interactive-tap mt-2.5 w-full rounded-xl bg-nested/70 px-3 py-2.5 text-left text-xs leading-5 text-ink-2"
      >
        <span className={cn(!expanded && 'line-clamp-2')}>{preset.text}</span>
      </button>
    </li>
  );
};

/* ------------------------------- Tab ------------------------------------ */

export const StockTab = ({ products = [], rules = [], composer, onAdjustStock, onAddRule, onRefresh }: StockTabProps) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeRules = Array.isArray(rules) ? rules : [];
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );

  const lowCount = safeProducts.filter((p) => p.stock <= LOW_STOCK_AT).length;
  const activeRules = safeRules.filter((r) => r.enabled !== false).length;
  const visible = filter === 'low' ? safeProducts.filter((p) => p.stock <= LOW_STOCK_AT) : safeProducts;

  const handleRefresh = () => {
    onRefresh();
    setRefreshing(true);
    refreshTimer.current = setTimeout(() => setRefreshing(false), 700);
  };

  const usePreset = (pr: Preset) => {
    onAddRule({ name: pr.label, triggers: [pr.id], response: pr.text, enabled: true });
    toast.success(`Template "${pr.label}" aktif!`);
  };

  return (
    <div className="space-y-5 px-4 pb-6 pt-4">
      <OverviewStrip
        items={[
          { label: 'Produk', value: safeProducts.length },
          { label: 'Hampir habis', value: lowCount, tone: lowCount > 0 ? 'amber' : 'neutral' },
          { label: 'Aturan aktif', value: activeRules, tone: 'emerald' },
        ]}
      />

      <Composer composer={composer} />

      <section aria-labelledby="rf-stock-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 id="rf-stock-heading" className="text-sm font-semibold text-ink-1">
            Inventori Stickeria
          </h2>
          <IconButton
            icon={RefreshCw}
            label="Muat ulang data"
            size="lg"
            onClick={handleRefresh}
            className={cn(refreshing && '[&>svg]:animate-spin')}
          />
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          ariaLabel="Filter produk"
          size="sm"
          options={[
            { value: 'all', label: `Semua (${safeProducts.length})` },
            { value: 'low', label: `Hampir habis (${lowCount})` },
          ]}
        />
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface px-4 py-8 text-center text-xs text-ink-3">
            {safeProducts.length === 0
              ? 'Belum ada produk. Tambahkan lewat perintah cepat di atas.'
              : 'Semua stok aman, tidak ada yang hampir habis.'}
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {visible.map((p) => (
              <ProductRow key={p.sku} p={p} onAdjustStock={onAdjustStock} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="rf-preset-heading" className="space-y-3">
        <div className="px-1">
          <h2 id="rf-preset-heading" className="text-sm font-semibold text-ink-1">
            Template balasan
          </h2>
          <p className="mt-0.5 text-xs text-ink-3">Pasang sekali, AI memakainya saat pembeli menanyakan hal serupa.</p>
        </div>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {PRESETS.map((pr) => (
            <PresetRow key={pr.id} preset={pr} active={safeRules.some((r) => r.name === pr.label)} onUse={usePreset} />
          ))}
        </ul>
      </section>
    </div>
  );
};
