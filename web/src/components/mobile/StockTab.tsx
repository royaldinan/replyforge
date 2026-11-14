import { useRef } from 'react';
import { Download, Plus, RefreshCw, Upload } from 'lucide-react';
import { formatRupiah } from '../../lib/format';
import type { Product, Rule } from '../../types';
import type { StockComposer } from './useStockComposer';

interface StockTabProps {
  products: Product[];
  rules: Rule[];
  composer: StockComposer;
  onAdjustStock: (sku: string, delta: number) => void;
  onAddRule: (rule: Omit<Rule, 'id' | 'source'>) => void;
  onRefresh: () => void;
}

/**
 * Tab Stok disamakan dengan APK: tanpa voice/mic, tanpa kartu AI, tanpa tab ganda.
 * Isi: Tambah Produk, Unduh Template, Impor Excel/CSV, perintah cepat, daftar produk -1/+1/+10.
 */
export const StockTab = ({ products, composer, onAdjustStock, onRefresh }: StockTabProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const addProduct = () => {
    const name = window.prompt('Nama produk baru:');
    if (!name || !name.trim()) return;
    const price = window.prompt('Harga jual (angka):', '15000') ?? '15000';
    const hpp = window.prompt('Harga modal / HPP (angka):', '6000') ?? '6000';
    const stock = window.prompt('Stok awal:', '10') ?? '10';
    void composer.submit(`tambah produk ${name.trim()} harga ${price} hpp ${hpp} stok ${stock} satuan pack`);
  };

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ink-1">Katalog &amp; Stok Toko</h2>
        <button
          type="button"
          onClick={addProduct}
          className="inline-flex h-9 items-center gap-1 rounded-xl bg-brand-deep px-3 text-xs font-bold text-white"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Tambah Produk
        </button>
      </div>

      <div className="space-y-2">
        <a
          href="/api/products/template"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface text-xs font-semibold text-ink-1"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Unduh Template Katalog Excel (.xlsx)
        </a>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface text-xs font-semibold text-ink-1"
        >
          <Upload className="h-4 w-4" aria-hidden="true" /> Impor Katalog (File Excel .xlsx / .csv)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void composer.importCsv(file);
            e.target.value = '';
          }}
        />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          aria-label="Perintah stok dan aturan"
          value={composer.inputText}
          onChange={(e) => composer.setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (composer.inputText.trim()) void composer.submit(composer.inputText);
            }
          }}
          placeholder="contoh: tambah 10 STK-CAT-01"
          className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink-1 outline-none placeholder:text-ink-3 focus:border-amber-500"
        />
        <button
          type="button"
          disabled={!composer.inputText.trim() || composer.isSubmitting}
          onClick={() => void composer.submit(composer.inputText)}
          className="inline-flex h-11 items-center rounded-xl bg-brand-deep px-4 text-xs font-bold text-white disabled:opacity-50"
        >
          Kirim
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-ink-1">Inventori Stickeria</h3>
        <button
          type="button"
          aria-label="Muat ulang data"
          onClick={onRefresh}
          className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-nested"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <ul className="space-y-3">
        {products.map((p) => (
          <li key={p.sku} className="rounded-2xl border border-line bg-surface p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-sm font-semibold leading-5 text-ink-1">{p.name}</p>
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-bold text-amber-900">
                {p.stock} {p.unit}
              </span>
            </div>
            <p className="mt-1 text-2xs text-ink-3">SKU: {p.sku}</p>
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-nested/60 px-2.5 py-2">
              <span className="text-xs font-semibold text-ink-1">Harga: {formatRupiah(p.price)}</span>
              <span className="text-2xs text-amber-800">
                HPP: {formatRupiah(p.hpp)} (Margin{' '}
                {p.price > 0 ? Math.round(((p.price - p.hpp) / p.price) * 100) : 0}%)
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                aria-label={`Kurangi stok ${p.name}`}
                disabled={p.stock <= 0}
                onClick={() => onAdjustStock(p.sku, -1)}
                className="h-9 flex-1 rounded-lg border border-line-strong bg-surface text-xs font-bold text-ink-1 disabled:opacity-40"
              >
                -1
              </button>
              <button
                type="button"
                aria-label={`Tambah stok ${p.name}`}
                onClick={() => onAdjustStock(p.sku, 1)}
                className="h-9 flex-1 rounded-lg border border-line-strong bg-surface text-xs font-bold text-ink-1"
              >
                +1
              </button>
              <button
                type="button"
                aria-label={`Tambah 10 stok ${p.name}`}
                onClick={() => onAdjustStock(p.sku, 10)}
                className="h-9 flex-1 rounded-lg border border-line-strong bg-surface text-xs font-bold text-ink-1"
              >
                +10
              </button>
            </div>
          </li>
        ))}
        {products.length === 0 && (
          <li className="rounded-2xl border border-line bg-surface p-6 text-center text-xs text-ink-3">
            Belum ada produk. Tambah produk atau impor Excel.
          </li>
        )}
      </ul>
    </div>
  );
};
