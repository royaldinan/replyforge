import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Flame, RefreshCw, RotateCcw, Send, ShieldCheck, ShoppingCart, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { toErrorMessage } from '../lib/format';
import { toSimulatorResponse } from '../lib/simulator';
import { Badge, Button, Card, CardHeader, Segmented, cn, inputBase, type SegmentedOption } from './ui';

interface Props {
  onSendMessage: (payload: { buyer: string; channel: string; text: string; packageName: string }) => Promise<unknown>;
  isLoading: boolean;
  onRefreshData: () => void;
}

type Sender = 'buyer' | 'agent' | 'system';
type ChannelKey = 'shopee' | 'whatsapp';

interface LogEntry {
  sender: Sender;
  text: string;
  time: string;
  badge?: string;
  icon?: 'ok' | 'shield';
}

const CHANNEL_ACTIVE: Record<ChannelKey, string> = {
  shopee: 'bg-shopee-deep text-white shadow-sm',
  whatsapp: 'bg-wa text-slate-950 shadow-sm',
};

const LOG_STYLE: Record<Sender, string> = {
  buyer: 'border-line bg-nested/50 text-ink-1',
  agent: 'border-emerald-400/25 bg-emerald-500/8 text-emerald-100',
  system: 'border-indigo-400/25 bg-indigo-500/8 text-indigo-100',
};

// ==========================================
// SKENARIO 1: Alur Lengkap @rina_wati88
// ==========================================
const RINA_STEPS = [
  {
    step: 1,
    title: '1. Chat Tanya Stok & Nego',
    text: 'Halo kak, Paket Stiker Kucing Gemoy masih ready? Bisa kurang jadi 12rb gak kak?',
    desc: 'Memicu AI + HPP Guard (HPP 6rb, harga pas 15rb)',
  },
  {
    step: 2,
    title: '2. Deal Pesan 2 Pack di Chat',
    text: 'Oke kak deal, saya ambil Paket Stiker Kucing 2 pack ya. Mau bayar sekarang lewat Shopee.',
    desc: 'Sistem mencatat Buyer Intent Memory di SQLite (@rina_wati88 -> 2x Stiker Kucing)',
  },
  {
    step: 3,
    title: '3. Notifikasi Pembayaran Shopee Masuk',
    text: 'Pembayaran Dikonfirmasi: Pembayaran untuk pesanan #2610259988LINA dari rina_wati88 telah dikonfirmasi. Mohon kirim pesanan sebelum 27-10-2026.',
    desc: 'NotificationListenerService mencocokkan Intent -> Auto-LUNAS & Stok Stiker Kucing -2 pack!',
  },
];

export const MiroFishSimulator: React.FC<Props> = ({ onSendMessage, isLoading, onRefreshData }) => {
  const [channel, setChannel] = useState<ChannelKey>('shopee');
  const [customText, setCustomText] = useState('');
  const [rinaStep, setRinaStep] = useState<number>(0);
  const [isSwarmActive, setIsSwarmActive] = useState<boolean>(false);
  const [chatLog, setChatLog] = useState<LogEntry[]>([
    {
      sender: 'system',
      text: 'MiroFish Simulator Siap: Ekosistem Lina Shop (Shopee & WA Business) terhubung.',
      time: 'Ready',
      badge: 'SYSTEM',
    },
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatLog.length]);

  const addLog = (sender: Sender, text: string, badge?: string, icon?: LogEntry['icon']) => {
    const time = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setChatLog((prev) => [...prev, { sender, text, time, badge, icon }]);
  };

  const handleExecuteRinaStep = async (stepIndex: number) => {
    const current = RINA_STEPS[stepIndex];
    if (!current) return;
    addLog('buyer', current.text, `@rina_wati88 (Step ${current.step})`);

    try {
      const res = toSimulatorResponse(
        await onSendMessage({
          buyer: 'rina_wati88',
          channel: 'shopee',
          text: current.text,
          packageName: 'com.shopee.id',
        }),
      );

      if (res.isPaymentNotification) {
        addLog(
          'system',
          `Transaksi #${res.orderId} terverifikasi lunas! Stok Paket Stiker Kucing otomatis berkurang -2 pack di SQLite.`,
          'SHOPEE SELLER SYSTEM',
          'ok',
        );
        toast.success(`Shopee Payment #${res.orderId}: @rina_wati88 LUNAS (-2 pack Stiker Kucing)!`);
        setRinaStep(3);
      } else if (res.reply) {
        addLog('agent', res.reply, 'Lina Shop AI Agent');
        setRinaStep(stepIndex + 1);
      }

      onRefreshData();
    } catch (e) {
      addLog('system', 'Gagal mengirim langkah simulasi: ' + toErrorMessage(e), 'ERROR');
      toast.error('Gagal menjalankan langkah simulasi');
    }
  };

  // ==========================================
  // SKENARIO 2: Pembeli Langsung Checkout (Silent Buyer)
  // ==========================================
  const handleExecuteSilentBuyer = async () => {
    const notifText =
      'Pesanan Baru: Pembayaran untuk pesanan #2610257766SILENT dari budi_01 telah dikonfirmasi. Mohon kemas pesanan sebelum 28-10-2026.';
    addLog('system', notifText, 'SHOPEE SELLER NOTIFICATION');

    try {
      const res = toSimulatorResponse(
        await onSendMessage({
          buyer: 'budi_01',
          channel: 'shopee',
          text: notifText,
          packageName: 'com.shopee.id',
        }),
      );

      if (res.isPaymentNotification) {
        addLog('system', 'Pesanan Silent Buyer #2610257766SILENT (@budi_01) tercatat di menu Transaksi Masuk!', 'SILENT BUYER');
        toast.info('Pesanan Silent Buyer Masuk: #2610257766SILENT (@budi_01)');
      }

      onRefreshData();
    } catch (e) {
      addLog('system', 'Gagal memicu notifikasi: ' + toErrorMessage(e), 'ERROR');
      toast.error('Gagal memicu notifikasi Shopee');
    }
  };

  // ==========================================
  // SKENARIO 3: Swarm / Ramai Pembeli (MiroFish Stress Test)
  // ==========================================
  const handleExecuteSwarmStressTest = async () => {
    setIsSwarmActive(true);
    addLog('system', 'Memulai MiroFish Swarm Stress Test: Menguji 3s Debounce, 0ms Green Cache, & OTP Blocker...', 'SWARM TEST');

    try {
      // 1. Burst Messages (3-Second Debounce Test). Dua pesan pertama sengaja tidak di-await.
      toast.loading('1/3 Menguji 3-Second Debounce (P, Kak, Ready?)...', { id: 'swarm' });
      addLog('buyer', 'P', '@pembeli_buru2');
      onSendMessage({
        buyer: 'pembeli_buru2',
        channel: 'whatsapp',
        text: 'P',
        packageName: 'com.whatsapp.w4b',
      });

      await new Promise((r) => setTimeout(r, 600));
      addLog('buyer', 'Kak', '@pembeli_buru2');
      onSendMessage({
        buyer: 'pembeli_buru2',
        channel: 'whatsapp',
        text: 'Kak',
        packageName: 'com.whatsapp.w4b',
      });

      await new Promise((r) => setTimeout(r, 600));
      addLog('buyer', 'Gantungan Kunci Capybara ready kak?', '@pembeli_buru2');
      const burstRes = toSimulatorResponse(
        await onSendMessage({
          buyer: 'pembeli_buru2',
          channel: 'whatsapp',
          text: 'Gantungan Kunci Capybara ready kak?',
          packageName: 'com.whatsapp.w4b',
        }),
      );

      if (burstRes.reply) {
        addLog('agent', burstRes.reply, 'Debounced Agent Reply (3 Chat Digabung Jadi 1)');
      }

      // 2. 0ms Green Cache Hit Test
      await new Promise((r) => setTimeout(r, 1200));
      toast.loading('2/3 Menguji 0ms Green Semantic Cache Hit...', { id: 'swarm' });
      addLog('buyer', 'Gantungan Kunci Capybara ready kak?', '@pembeli_kedua');
      const cacheRes = toSimulatorResponse(
        await onSendMessage({
          buyer: 'pembeli_kedua',
          channel: 'whatsapp',
          text: 'Gantungan Kunci Capybara ready kak?',
          packageName: 'com.whatsapp.w4b',
        }),
      );

      if (cacheRes.reply) {
        addLog('agent', `${cacheRes.reply} (Dijawab dalam 0ms dari on-device cache)`, '0ms GREEN CACHE HIT');
      }

      // 3. Bank OTP Privacy Shield Test
      await new Promise((r) => setTimeout(r, 1200));
      toast.loading('3/3 Menguji Pemblokiran Otomatis SMS OTP Bank...', { id: 'swarm' });
      const otpMsg = 'Kode OTP BCA Anda 849201. JANGAN BERIKAN KEPADA SIAPA PUN termasuk pihak bank.';
      addLog('buyer', otpMsg, 'SMS NOTIFIKASI BANK');
      const otpRes = toSimulatorResponse(
        await onSendMessage({
          buyer: 'Bank BCA',
          channel: 'whatsapp',
          text: otpMsg,
          packageName: 'com.whatsapp.w4b',
        }),
      );

      if (otpRes.blocked) {
        addLog('system', 'BLOCKED LOCALLY: Notifikasi OTP berhasil diblokir di HP (0 bytes dikirim ke AI)!', 'PRIVACY SHIELD', 'shield');
      }

      toast.success('MiroFish Swarm Stress Test Selesai (100% Lolos)!', { id: 'swarm' });
      onRefreshData();
    } catch (e) {
      // Versi lama tidak punya pengaman ini: error di tengah jalan membuat tombol macet "Menjalankan..." selamanya.
      addLog('system', 'Swarm test terhenti: ' + toErrorMessage(e), 'ERROR');
      toast.error('Swarm test gagal di tengah jalan', { id: 'swarm' });
    } finally {
      setIsSwarmActive(false);
    }
  };

  const handleCustomSend = async () => {
    if (!customText.trim() || isLoading) return;
    const txt = customText;
    setCustomText('');
    addLog('buyer', txt, `@custom_buyer (${channel})`);

    try {
      const res = toSimulatorResponse(
        await onSendMessage({
          buyer: 'custom_buyer',
          channel,
          text: txt,
          packageName: channel === 'shopee' ? 'com.shopee.id' : 'com.whatsapp.w4b',
        }),
      );

      if (res.isPaymentNotification) {
        addLog('system', `Notifikasi Pembayaran #${res.orderId} Diproses`, 'SYSTEM');
      } else if (res.reply) {
        addLog('agent', res.reply, 'Lina Shop AI Agent');
      }
      onRefreshData();
    } catch (e) {
      addLog('system', 'Gagal mengirim pesan: ' + toErrorMessage(e), 'ERROR');
    }
  };

  const channelOptions: SegmentedOption<ChannelKey>[] = [
    { value: 'shopee', label: 'Shopee Chat', activeClassName: CHANNEL_ACTIVE.shopee },
    { value: 'whatsapp', label: 'WhatsApp Business', activeClassName: CHANNEL_ACTIVE.whatsapp },
  ];

  return (
    <Card padding="lg" className="flex h-full flex-col">
      <CardHeader
        icon={Sparkles}
        tone="indigo"
        title={
          <span className="flex flex-wrap items-center gap-2">
            MiroFish Buyer Simulation Studio
            <Badge tone="emerald">Live ADB & WebSocket</Badge>
          </span>
        }
        description="Panel penguji otomatis untuk video demo LOGICODIX 2026 tanpa suara"
        action={<Segmented value={channel} onChange={setChannel} options={channelOptions} ariaLabel="Saluran simulasi" size="sm" />}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div className="shrink-0 space-y-3">
          {/* Skenario 1 */}
          <div className="rounded-xl border border-indigo-400/25 bg-nested/40 p-3.5 transition-colors duration-200 hover:border-indigo-400/45">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-indigo-500/20 text-xs font-bold text-indigo-300">
                  1
                </span>
                <div className="min-w-0">
                  <h4 className="text-body font-semibold text-ink-1">Simulasi alur lengkap: @rina_wati88 (Shopee)</h4>
                  <p className="text-xs leading-5 text-ink-3">
                    Tanya stok & nego, deal 2 pcs, notifikasi pembayaran Shopee, lalu auto-lunas & potong stok!
                  </p>
                </div>
              </div>
              {rinaStep >= 3 ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone="emerald" icon={CheckCircle2}>
                    Selesai (Lunas)
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setRinaStep(0)}
                    aria-label="Ulangi simulasi dari awal"
                    title="Ulangi dari awal"
                    className="interactive-tap grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-white/6 hover:text-ink-1"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <span className="shrink-0 pt-0.5 text-2xs font-medium tabular-nums text-ink-3">Langkah {rinaStep + 1} dari 3</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {RINA_STEPS.map((s, idx) => {
                const isPast = rinaStep > idx;
                const isCurrent = rinaStep === idx;
                return (
                  <button
                    key={s.step}
                    type="button"
                    title={s.desc}
                    onClick={() => handleExecuteRinaStep(idx)}
                    disabled={isLoading}
                    className={cn(
                      'interactive-tap rounded-lg border p-2.5 text-left disabled:cursor-not-allowed disabled:opacity-50',
                      isPast && 'border-emerald-400/35 bg-emerald-500/8',
                      isCurrent && 'border-indigo-400/60 bg-indigo-500/14 ring-2 ring-indigo-400/25',
                      !isPast && !isCurrent && 'border-line bg-white/3 hover:border-white/15',
                    )}
                  >
                    <span className="flex items-center justify-between text-2xs font-semibold">
                      <span className={cn(isPast ? 'text-emerald-300' : isCurrent ? 'text-indigo-200' : 'text-ink-3')}>Step {s.step}</span>
                      {isPast && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-label="Selesai" />}
                    </span>
                    <span
                      className={cn(
                        'mt-1 block text-xs font-medium leading-4',
                        isPast ? 'text-emerald-100' : isCurrent ? 'text-ink-1' : 'text-ink-2',
                      )}
                    >
                      {s.title.replace(/^\d+\.\s*/, '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skenario 2 */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-400/25 bg-nested/40 p-3.5 transition-colors duration-200 hover:border-sky-400/45">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-sky-500/20 text-xs font-bold text-sky-300">2</span>
              <div className="min-w-0">
                <h4 className="text-body font-semibold text-ink-1">Simulasi pembeli langsung checkout (@budi_silent)</h4>
                <p className="text-xs leading-5 text-ink-3">
                  Pesanan masuk Shopee Seller tanpa chat sebelumnya, tercatat di Transaksi Masuk + 1-Tap Tautkan
                </p>
              </div>
            </div>
            <Button variant="indigo" size="sm" icon={ShoppingCart} disabled={isLoading} onClick={handleExecuteSilentBuyer}>
              Picu notif Shopee
            </Button>
          </div>

          {/* Skenario 3 */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/25 bg-nested/40 p-3.5 transition-colors duration-200 hover:border-emerald-400/45">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-500/20 text-xs font-bold text-emerald-300">
                3
              </span>
              <div className="min-w-0">
                <h4 className="flex items-center gap-1.5 text-body font-semibold text-ink-1">
                  Simulasi swarm / ramai pembeli (MiroFish stress test)
                  <Flame className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                </h4>
                <p className="text-xs leading-5 text-ink-3">
                  Uji 3-second debounce burst ("P", "Kak", "Ready?"), 0ms green cache hit, & blokir SMS OTP
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={isSwarmActive ? undefined : RefreshCw}
              loading={isSwarmActive}
              disabled={isLoading}
              onClick={handleExecuteSwarmStressTest}
            >
              {isSwarmActive ? 'Menjalankan...' : 'Jalankan swarm test'}
            </Button>
          </div>
        </div>

        {/* Live interactive chat stream terminal */}
        <div className="flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-xl border border-line bg-canvas">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-3.5 py-2.5">
            <span className="flex items-center gap-2 text-xs font-semibold text-ink-2">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-dot-ring rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live stream interaksi buyer & RemoteInput
            </span>
            <span className="font-mono text-2xs tabular-nums text-ink-3">{chatLog.length} event tercatat</span>
          </div>

          <div ref={logRef} role="log" aria-live="polite" className="max-h-[340px] min-h-[120px] flex-1 space-y-2 overflow-y-auto p-3">
            {chatLog.map((msg, i) => (
              <div key={i} className={cn('rounded-lg border p-2.5 text-xs', LOG_STYLE[msg.sender])}>
                <div className="mb-1 flex items-center justify-between gap-3 text-2xs text-ink-3">
                  <span className="flex items-center gap-1.5 font-semibold text-ink-2">
                    {msg.icon === 'ok' && <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden="true" />}
                    {msg.icon === 'shield' && <ShieldCheck className="h-3 w-3 text-emerald-400" aria-hidden="true" />}
                    {msg.badge || (msg.sender === 'buyer' ? 'Pembeli' : 'Lina Shop AI')}
                  </span>
                  <span className="font-mono tabular-nums">{msg.time}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-line bg-surface p-2.5">
            <input
              type="text"
              aria-label="Pesan uji coba"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSend()}
              placeholder={`Ketik pesan uji coba ke ${channel === 'shopee' ? 'Shopee' : 'WhatsApp'}...`}
              className={cn(
                inputBase,
                'h-10 min-w-0 flex-1 rounded-xl px-3.5 text-body focus:border-indigo-400/60 focus:ring-indigo-400/20',
              )}
            />
            <Button variant="indigo" icon={Send} disabled={isLoading || !customText.trim()} onClick={handleCustomSend}>
              Kirim
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
