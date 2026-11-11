import React, { useEffect, useRef, useState } from 'react';
import { Check, FileText, Image as ImageIcon, Receipt, Scan, X } from 'lucide-react';
import { formatClock, formatRupiah, formatRupiahCompact } from '../lib/format';
import type { Order, Product } from '../types';
import { Badge, Button, Card, CardHeader, ChannelBadge, EmptyState, toChannel } from './ui';
import { ORDER_STATE_META, getOrderState, isShippable } from './mobile/orderState';

interface Props {
  orders: Order[];
  products: Product[];
  onUpdateOrderStatus: (id: number, status: 'reserved' | 'paid' | 'cancelled') => void;
  onScanReceipt?: (extractedText: string) => void;
}

export const OrderLedger: React.FC<Props> = ({ orders, onUpdateOrderStatus }) => {
  const states = orders.map((o) => getOrderState(o.status));
  const paid = states.filter(isShippable).length;
  const pending = states.filter((s) => s === 'pending').length;
  const cancelled = states.filter((s) => s === 'cancelled').length;
  const revenue = orders.reduce((sum, o, i) => {
    const s = states[i];
    return s && isShippable(s) ? sum + (o.total || 0) : sum;
  }, 0);

  const summary = [
    { label: 'Total pesanan', value: String(orders.length) },
    { label: 'Lunas', value: String(paid) },
    { label: 'Menunggu bayar', value: String(pending) },
    { label: 'Dibatalkan', value: String(cancelled) },
    { label: 'Omzet lunas', value: formatRupiahCompact(revenue) },
  ];

  return (
    <div className="space-y-6">
      {/* Orders table */}
      <Card padding="lg">
        <CardHeader
          icon={Receipt}
          tone="indigo"
          title={`Buku pesanan percakapan (${orders.length} pesanan)`}
          description="Ditangkap otomatis dari percakapan langsung pembeli (WhatsApp Business &amp; Shopee)."
          flush
        />

        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10">
            <EmptyState icon={Receipt} title="Belum ada pesanan yang masuk" description="Coba jalankan Skenario 4 di simulator!" />
          </div>
        ) : (
          <>
            <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {summary.map((s) => (
                <div key={s.label} className="flex flex-col-reverse rounded-xl border border-line bg-nested/40 px-3.5 py-2.5">
                  <dt className="text-2xs text-ink-3">{s.label}</dt>
                  <dd className="text-base font-bold tabular-nums text-ink-1">{s.value}</dd>
                </div>
              ))}
            </dl>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-body">
                <thead>
                  <tr className="border-b border-line text-2xs font-semibold text-ink-3">
                    <th scope="col" className="pb-3 pr-4 font-semibold">
                      Kode order
                    </th>
                    <th scope="col" className="pb-3 pr-4 font-semibold">
                      Pembeli
                    </th>
                    <th scope="col" className="pb-3 pr-4 font-semibold">
                      Channel
                    </th>
                    <th scope="col" className="pb-3 pr-4 font-semibold">
                      Item & qty
                    </th>
                    <th scope="col" className="pb-3 pr-4 text-right font-semibold">
                      Total
                    </th>
                    <th scope="col" className="pb-3 pr-4 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="pb-3 text-right font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((o, i) => {
                    const meta = ORDER_STATE_META[states[i] ?? 'pending'];
                    return (
                      <tr key={o.id} className="transition-colors duration-150 hover:bg-white/3">
                        <td className="py-3.5 pr-4 align-top">
                          <div className="font-mono text-xs font-semibold text-ink-1">{o.code}</div>
                          <div className="mt-0.5 text-2xs tabular-nums text-ink-3">{formatClock(o.created_at)}</div>
                        </td>
                        <td className="py-3.5 pr-4 align-top font-medium text-ink-1">{o.buyer}</td>
                        <td className="py-3.5 pr-4 align-top">
                          <ChannelBadge channel={toChannel(o.channel)} />
                        </td>
                        <td className="py-3.5 pr-4 align-top">
                          {(o.items ?? []).map((item, idx) => (
                            <div key={idx} className="text-ink-2">
                              {item.name} <span className="font-mono text-xs font-semibold text-amber-800">({item.quantity}x)</span>
                            </div>
                          ))}
                          {o.missing_fields && o.missing_fields.length > 0 && (
                            <div className="mt-1">
                              <Badge tone="amber">Belum jelas: {o.missing_fields.join(', ')}</Badge>
                            </div>
                          )}
                          {o.address_note && (
                            <div className="mt-0.5 text-2xs text-ink-3">{o.address_note}</div>
                          )}
                        </td>
                        <td className="py-3.5 pr-4 text-right align-top font-semibold tabular-nums text-ink-1">{formatRupiah(o.total)}</td>
                        <td className="py-3.5 pr-4 align-top">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </td>
                        <td className="py-3.5 align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            {(o.status === 'reserved' || o.status === 'perlu konfirmasi alamat') && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(o.id, 'paid')}
                                title="Tandai sudah bayar / konfirmasi"
                                aria-label={`Tandai ${o.code} sudah bayar`}
                                className="interactive-tap grid h-8 w-8 place-items-center rounded-lg text-emerald-700 hover:bg-emerald-100"
                              >
                                <Check className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                            {o.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(o.id, 'cancelled')}
                                title="Batalkan & kembalikan stok"
                                aria-label={`Batalkan ${o.code} dan kembalikan stok`}
                                className="interactive-tap grid h-8 w-8 place-items-center rounded-lg text-red-700 hover:bg-red-100"
                              >
                                <X className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
