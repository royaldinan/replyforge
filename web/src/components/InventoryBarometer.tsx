import React from 'react';
import { AlertTriangle, Minus, Package, Plus, ShieldCheck } from 'lucide-react';
import { formatRupiah } from '../lib/format';
import type { Product, Settings } from '../types';
import { Badge, Card, CardHeader, ProgressBar, Segmented, cn, type SegmentedOption } from './ui';

interface Props {
  products: Product[];
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onAdjustStock: (sku: string, delta: number) => void;
}

type Mode = 'autopilot' | 'copilot';

const MODE_OPTIONS: SegmentedOption<Mode>[] = [
  {
    value: 'autopilot',
    label: 'Auto-Pilot',
    activeClassName: 'bg-amber-400 text-zinc-950 shadow-sm ring-1 ring-inset ring-amber-500/40',
  },
  {
    value: 'copilot',
    label: '1-Tap Copilot',
    activeClassName: 'bg-surface text-amber-900 shadow-sm ring-1 ring-inset ring-amber-400',
  },
];

const LOW_STOCK_AT = 5;

export const InventoryBarometer: React.FC<Props> = ({ products, settings, onUpdateSettings, onAdjustStock }) => {
  const isAutoPilot = settings.mode === 'autopilot';

  return (
    <Card padding="lg" className="flex h-full flex-col">
      <CardHeader
        icon={Package}
        tone="indigo"
        title="Barometer stok langsung"
        description="Sinkronisasi SQLite real-time"
        action={
          <Segmented
            value={isAutoPilot ? 'autopilot' : 'copilot'}
            onChange={(mode) => {
              if (mode !== (isAutoPilot ? 'autopilot' : 'copilot')) onUpdateSettings({ mode });
            }}
            options={MODE_OPTIONS}
            ariaLabel="Mode balasan toko"
            size="sm"
          />
        }
      />

      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-ink-2">Produk toko</span>
        <span className="tabular-nums text-ink-3">{products.length} produk</span>
      </div>

      <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {products.map((p) => {
          const percentage = p.capacity > 0 ? Math.min(100, Math.max(0, (p.stock / p.capacity) * 100)) : 0;
          const isLowStock = p.stock <= LOW_STOCK_AT;

          return (
            <li
              key={p.sku}
              className="rounded-xl border border-line bg-surface p-3.5 transition-colors duration-200 hover:border-amber-300"
            >
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-body font-semibold text-ink-1">{p.name}</h4>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                    <span className="text-xs font-bold tabular-nums text-amber-800">{formatRupiah(p.price)}</span>
                    <span className="font-mono text-2xs text-ink-3">SKU: {p.sku}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={cn('text-lg font-bold tabular-nums', isLowStock ? 'text-amber-700' : 'text-ink-1')}>{p.stock}</span>
                  <span className="ml-1 text-xs text-ink-3">{p.unit}</span>
                </div>
              </div>

              <ProgressBar
                value={percentage}
                tone={isLowStock ? 'amber' : percentage > 50 ? 'emerald' : 'indigo'}
                label={`Level stok ${p.name}`}
              />

              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                <div className="flex items-center gap-2 text-xs text-ink-3">
                  <span>
                    Kapasitas: <span className="font-mono text-ink-2">{p.capacity}</span>
                  </span>
                  {isLowStock && (
                    <Badge tone="amber" icon={AlertTriangle}>
                      Hampir habis
                    </Badge>
                  )}
                </div>
                <div role="group" aria-label={`Stok ${p.name}`} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Kurangi stok ${p.name}`}
                    onClick={() => onAdjustStock(p.sku, -1)}
                    disabled={p.stock <= 0}
                    className="interactive-tap grid h-8 w-8 place-items-center rounded-lg bg-nested text-ink-2 ring-1 ring-inset ring-white/10 hover:bg-nested-hover hover:text-ink-1 disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Tambah stok ${p.name}`}
                    onClick={() => onAdjustStock(p.sku, 1)}
                    className="interactive-tap grid h-8 w-8 place-items-center rounded-lg bg-nested text-ink-2 ring-1 ring-inset ring-white/10 hover:bg-nested-hover hover:text-ink-1"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-3">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span>Anti-Ban Human Delay (3 detik) aktif</span>
        </div>
        <span className="font-mono tabular-nums text-ink-2">0% ban risk</span>
      </div>
    </Card>
  );
};
