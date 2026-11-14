import { useEffect, useRef, useState } from 'react';
import { Link2, Receipt, RefreshCw, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { asHandle, formatClock, formatRupiah, formatRupiahCompact } from '../../lib/format';
import type { Order } from '../../types';
import type { Thread } from './data';
import { Badge, Button, ChannelBadge, EmptyState, IconButton, Segmented, cn, toChannel } from '../ui';
import { ORDER_STATE_META, getOrderState, isShippable, orderTotal, type OrderState } from './orderState';

interface OrdersTabProps {
  orders: Order[];
  onAdjustStock: (sku: string, delta: number) => void;
  onRefresh: () => void;
  onUpdateOrderStatus?: (id: number, status: 'reserved' | 'paid' | 'cancelled') => void;
  /** Percakapan Shopee yang belum jadi order = calon pembeli. */
  threads?: Thread[];
  onOpenThread?: (id: string) => void;
}

type Filter = 'all' | 'paid' | 'pending' | 'cancelled' | 'lead';

const matchesFilter = (state: OrderState, filter: Filter): boolean => {
  if (filter === 'all') return true;
  if (filter === 'paid') return isShippable(state);
  return state === filter;
};

const OrderCard = ({
  order,
  onAdjustStock,
  onUpdateOrderStatus,
}: {
  order: Order;
  onAdjustStock: (sku: string, delta: number) => void;
  onUpdateOrderStatus?: (id: number, status: 'reserved' | 'paid' | 'cancelled') => void;
}) => {
  const state = getOrderState(order.status);
  const meta = ORDER_STATE_META[state];
  const items = order.items ?? [];
  const qty = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <li className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="select-text font-mono text-xs font-semibold text-ink-1">{order.code}</span>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
            <span className="select-text">{asHandle(order.buyer)}</span>
            <ChannelBadge channel={toChannel(order.channel)} />
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold tabular-nums text-ink-1">{formatRupiah(orderTotal(order.total))}</p>
          <p className="text-2xs tabular-nums text-ink-3">{formatClock(order.created_at)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-nested/70 p-3">
        {items.length > 0 ? (
          <div className="flex items-start justify-between gap-3">
            <ul className="min-w-0 space-y-0.5 text-body text-ink-1">
              {items.map((it, idx) => (
                <li key={idx}>
                  <span className="text-ink-2">{it.quantity}×</span> {it.name}
                </li>
              ))}
            </ul>
            <Badge tone={state === 'cancelled' ? 'neutral' : 'emerald'}>
              {state === 'cancelled' ? 'Stok dikembalikan' : `-${qty} pcs stok`}
            </Badge>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium leading-5 text-sky-800">Pembeli langsung bayar tanpa chat</p>
            <Button
              variant="indigo"
              icon={Link2}
              onClick={() => {
                onAdjustStock('STK-CAT-01', -1);
                toast.success('Ditautkan ke Paket Stiker Kucing Gemoy (-1 pack stok)');
              }}
            >
              1-Tap Tautkan
            </Button>
          </div>
        )}
      </div>

      {order.missing_fields && order.missing_fields.length > 0 && (
        <div className="mt-2">
          <Badge tone="amber">Belum jelas: {order.missing_fields.join(', ')}</Badge>
        </div>
      )}

      {isShippable(state) && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <Truck className="h-3.5 w-3.5" aria-hidden="true" />
          {meta.hint}
        </p>
      )}

      {onUpdateOrderStatus && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-line/60 pt-2.5">
          {(order.status === 'reserved' || order.status === 'perlu konfirmasi alamat') && (
            <button
              type="button"
              onClick={() => onUpdateOrderStatus(order.id, 'paid')}
              className="interactive-tap rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
            >
              ✓ Konfirmasi Lunas
            </button>
          )}
          {order.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
              className="interactive-tap rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100"
            >
              ✕ Batalkan &amp; Kembalikan Stok
            </button>
          )}
        </div>
      )}
    </li>
  );
};

export const OrdersTab = ({ orders, onAdjustStock, onRefresh, onUpdateOrderStatus, threads = [], onOpenThread }: OrdersTabProps) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );

  const states = orders.map((o) => getOrderState(o.status));
  const shippable = states.filter(isShippable).length;
  const pending = states.filter((s) => s === 'pending').length;
  const revenue = orders.reduce((sum, o, i) => {
    const s = states[i];
    return s && isShippable(s) ? sum + orderTotal(o.total) : sum;
  }, 0);
  const visible = orders.filter((_, i) => {
    const s = states[i];
    return s ? matchesFilter(s, filter) : false;
  });

  const handleRefresh = () => {
    onRefresh();
    setRefreshing(true);
    refreshTimer.current = setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">

      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold text-ink-1">Transaksi masuk</h2>
        <div className="flex items-center gap-1">
          <span className="text-xs tabular-nums text-ink-3">{orders.length} pesanan</span>
          <IconButton
            icon={RefreshCw}
            label="Muat ulang data"
            size="lg"
            onClick={handleRefresh}
            className={cn(refreshing && '[&>svg]:animate-spin')}
          />
        </div>
      </div>

      <Segmented
        value={filter}
        onChange={setFilter}
        ariaLabel="Filter pesanan"
        size="sm"
        options={[
          { value: 'all', label: 'Semua' },
          { value: 'paid', label: 'Lunas' },
          { value: 'pending', label: 'Menunggu' },
          { value: 'cancelled', label: 'Batal' },
          { value: 'lead', label: 'Calon Pembeli' },
        ]}
      />

      {filter === 'lead' ? (
        <div className="space-y-2.5">
          {threads.filter((t) => t.channel === 'shopee').length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface">
              <EmptyState
                icon={Receipt}
                title="Belum ada calon pembeli"
                description="Chat Shopee baru akan muncul di sini sebelum checkout."
              />
            </div>
          ) : (
            threads
              .filter((t) => t.channel === 'shopee')
              .map((t) => (
                <div key={t.id} className="rounded-2xl border border-line bg-surface p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-1">{t.name}</p>
                      <p className="truncate text-xs text-ink-3">{t.handle} · Shopee</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenThread?.(t.id)}
                      className="inline-flex h-9 shrink-0 items-center rounded-xl bg-[#EE4D2D] px-3 text-xs font-bold text-white"
                    >
                      Buka chat
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface">
          <EmptyState
            icon={Receipt}
            title={orders.length === 0 ? 'Belum ada transaksi' : 'Tidak ada pesanan di filter ini'}
            description={
              orders.length === 0
                ? 'Pesanan dari chat WhatsApp dan Shopee akan muncul di sini.'
                : 'Coba pilih filter lain untuk melihat pesanan.'
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onAdjustStock={onAdjustStock}
              onUpdateOrderStatus={onUpdateOrderStatus}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
