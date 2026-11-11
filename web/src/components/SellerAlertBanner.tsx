import React from 'react';
import { AlertTriangle, BellRing, Check, Hand, ShieldAlert } from 'lucide-react';
import { formatClock } from '../lib/format';
import type { AnomalyAlert } from '../types';
import { Badge, Button, ChannelBadge, cn, toChannel } from './ui';

interface SellerAlertBannerProps {
  alerts: AnomalyAlert[];
  onResolveAlert: (id: number, resumeAi: boolean) => void;
  onOpenChat?: (buyer: string, channel: string) => void;
  compact?: boolean;
}

export const SellerAlertBanner: React.FC<SellerAlertBannerProps> = ({
  alerts,
  onResolveAlert,
  onOpenChat,
  compact = false,
}) => {
  const openAlerts = alerts.filter((a) => a.status === 'open');
  if (openAlerts.length === 0) return null;

  return (
    <section
      aria-label="Peringatan eskalasi penjual"
      className={cn(
        'rounded-2xl border-2 border-red-400 bg-gradient-to-r from-red-50 via-amber-50 to-yellow-50 p-4 shadow-card animate-fade-in',
        compact ? 'mx-4 mt-3 p-3' : 'mb-5',
      )}
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-red-600 text-white shadow-sm">
            <BellRing className="h-4 w-4 animate-bounce" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-red-900">
              Perlu Tindakan Penjual ({openAlerts.length} Peringatan Prioritas)
            </h2>
            <p className="text-xs text-red-800">
              AI mendeteksi pesanan jumlah tidak wajar, pertanyaan mencurigakan, atau alamat belum jelas. Auto-Reply dijeda otomatis.
            </p>
          </div>
        </div>
        <Badge tone="red" icon={ShieldAlert}>
          Escalation Guard Aktif
        </Badge>
      </div>

      <ul className="space-y-2.5">
        {openAlerts.map((alert) => {
          const isUnusualQty = alert.kind === 'UNUSUAL_QUANTITY';
          const isWeird = alert.kind === 'WEIRD_QUERY';
          return (
            <li
              key={alert.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-red-300/90 bg-surface p-3 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={isUnusualQty || isWeird ? 'red' : 'amber'} icon={AlertTriangle}>
                    {isUnusualQty ? 'JUMLAH TIDAK WAJAR' : isWeird ? 'PERTANYAAN ANEH / MENCURIGAKAN' : 'DATA BELUM LENGKAP'}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-ink-1">@{alert.buyer.replace(/^@/, '')}</span>
                  <ChannelBadge channel={toChannel(alert.channel)} />
                  <span className="text-2xs tabular-nums text-ink-3">{formatClock(alert.created_at)}</span>
                </div>
                <p className="mt-1.5 text-xs font-bold text-ink-1">{alert.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-ink-2">{alert.reason}</p>
                <p className="mt-1 rounded-lg bg-nested px-2.5 py-1.5 font-mono text-2xs text-ink-2">
                  Chat Pembeli: &ldquo;{alert.message_text}&rdquo;
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {onOpenChat && (
                  <Button
                    variant="amber"
                    size="sm"
                    icon={Hand}
                    onClick={() => onOpenChat(alert.buyer, alert.channel)}
                  >
                    Ambil Alih Chat
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Check}
                  onClick={() => onResolveAlert(alert.id, true)}
                >
                  Tandai Selesai &amp; Aktifkan AI
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
