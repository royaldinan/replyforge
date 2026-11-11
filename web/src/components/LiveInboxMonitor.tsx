import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FlaskConical,
  Hand,
  MapPin,
  MessageSquare,
  Pause,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { toErrorMessage } from '../lib/format';
import { toSimulatorResponse } from '../lib/simulator';
import { Avatar } from './mobile/Avatar';
import { THREAD_STATUS, type ChatMessage } from './mobile/data';
import { useChatThreads } from './mobile/useChatThreads';
import { Badge, Button, CHANNELS, Card, CardHeader, ChannelBadge, Segmented, cn, inputBase, type SegmentedOption } from './ui';

interface Props {
  onSendMessage: (payload: { buyer: string; channel: string; text: string; packageName: string }) => Promise<unknown>;
  isLoading: boolean;
  onRefreshData: () => void;
}

type Sender = 'buyer' | 'agent' | 'system' | 'alert';
type ChannelKey = 'shopee' | 'whatsapp';
type InboxFilter = 'all' | 'whatsapp' | 'shopee';

interface FeedEntry {
  sender: Sender;
  text: string;
  time: string;
  badge?: string;
}

const CHANNEL_ACTIVE: Record<ChannelKey, string> = {
  shopee: 'bg-[#FFF2EE] text-[#C23315] ring-1 ring-inset ring-[#EE4D2D]/35 shadow-sm',
  whatsapp: 'bg-[#ECFDF3] text-[#116932] ring-1 ring-inset ring-[#25D366]/40 shadow-sm',
};

const FEED_STYLE: Record<Sender, string> = {
  buyer: 'border-line bg-nested text-ink-1',
  agent: 'border-amber-300/90 bg-elevated text-ink-1',
  system: 'border-emerald-300/80 bg-emerald-50/80 text-emerald-950',
  alert: 'border-red-400 bg-red-50 text-red-950',
};

const NORMAL_FLOW_STEPS = [
  {
    step: 1,
    title: '1. Pembeli Tanya Stok & Nawar',
    buyer: 'rina_wati88',
    channel: 'shopee' as const,
    text: 'Halo kak, Paket Stiker Kucing Gemoy masih ready? Bisa kurang jadi 10rb gak kak?',
    desc: 'KODE memproteksi batas HPP (Modal Rp6.000, Harga Jual Rp15.000)',
  },
  {
    step: 2,
    title: '2. Pembeli Deal Pesan 2 Pack',
    buyer: 'rina_wati88',
    channel: 'shopee' as const,
    text: 'Oke kak deal, saya ambil Paket Stiker Kucing 2 pack ya. Kirim ke Jl. Melati No. 12 Bandung.',
    desc: 'Sistem membuat Draf Pesanan (Total Rp30.000 dihitung KODE)',
  },
  {
    step: 3,
    title: '3. Konfirmasi Pembayaran Masuk',
    buyer: 'rina_wati88',
    channel: 'shopee' as const,
    text: 'Pembayaran Dikonfirmasi: Pembayaran untuk pesanan #2610259988LINA dari rina_wati88 telah dikonfirmasi. Mohon kirim pesanan sebelum 15-11-2026.',
    desc: 'Pesanan otomatis berstatus LUNAS & stok berkurang -2 pack',
  },
];

const previewOf = (m: ChatMessage | undefined): string => {
  if (!m) return '';
  if (m.kind === 'event') return m.title;
  if (m.from === 'ai') return 'AI: ' + m.text;
  if (m.from === 'admin') return 'Anda: ' + m.text;
  return m.text;
};

export const LiveInboxMonitor: React.FC<Props> = ({ onSendMessage, isLoading, onRefreshData }) => {
  const chat = useChatThreads();
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [manualReply, setManualReply] = useState('');

  const [channel, setChannel] = useState<ChannelKey>('whatsapp');
  const [buyerInput, setBuyerInput] = useState('pelanggan_wa');
  const [customText, setCustomText] = useState('');
  const [flowStep, setFlowStep] = useState<number>(0);
  const [feed, setFeed] = useState<FeedEntry[]>([
    {
      sender: 'system',
      text: 'Jembatan WhatsApp Business & Shopee Seller aktif. Semua pesan masuk diproses melalui 3 lapis: Model AI (tafsir chat), Kode Deterministik (hitungan harga, HPP, & stok), dan Eskalasi Penjual (deteksi pesanan tidak wajar / pertanyaan aneh).',
      time: 'Siaga',
      badge: 'SISTEM AKTIF',
    },
  ]);
  const feedRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const visibleThreads = chat.threads.filter((t) => (inboxFilter === 'all' ? true : t.channel === inboxFilter));
  const activeThread =
    chat.threads.find((t) => t.id === selectedThreadId) || visibleThreads[0] || chat.threads[0] || null;

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed.length]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeThread?.id, activeThread?.messages.length]);

  const appendFeed = (sender: Sender, text: string, badge?: string) => {
    const time = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setFeed((prev) => [...prev, { sender, text, time, badge }]);
  };

  const handleSendManualReply = () => {
    if (!activeThread || !manualReply.trim()) return;
    const text = manualReply.trim();
    chat.sendAdminMessage(activeThread.id, text);
    setManualReply('');
    toast.success(`Balasan manual dikirim ke ${activeThread.name} (${CHANNELS[activeThread.channel].short})`);
  };

  const dispatchIncoming = async (payload: {
    buyer: string;
    channel: ChannelKey;
    text: string;
    stepAdvance?: number;
  }) => {
    const pkg = payload.channel === 'shopee' ? 'com.shopee.id' : 'com.whatsapp.w4b';
    appendFeed('buyer', payload.text, `@${payload.buyer} · ${payload.channel.toUpperCase()}`);

    try {
      const rawRes: any = await onSendMessage({
        buyer: payload.buyer,
        channel: payload.channel,
        text: payload.text,
        packageName: pkg,
      });
      const res = toSimulatorResponse(rawRes);

      if (rawRes?.escalatedToSeller) {
        appendFeed(
          'alert',
          `PERINGATAN PENJUAL: ${rawRes.anomaly?.title || 'Anomali Terdeteksi'} — ${rawRes.reason || 'Auto-Reply dijeda otomatis untuk pembeli ini.'}`,
          'AUTO-PILOT DIJEDA · NOTIFIKASI PENJUAL',
        );
        toast.error(`Peringatan Penjual: ${rawRes.anomaly?.title || 'Chat tidak wajar terdeteksi'}!`);
      } else if (res.blocked) {
        appendFeed(
          'alert',
          'DIBLOKIR DI PERANGKAT: Notifikasi berisi kode rahasia / OTP perbankan. 0 byte dikirim ke server AI.',
          'PERISAI OTP LOKAL',
        );
      } else if (res.isPaymentNotification) {
        appendFeed(
          'system',
          `Pembayaran pesanan #${res.orderId} (@${payload.buyer}) terverifikasi LUNAS. Stok produk otomatis dipotong di database.`,
          'REKONSILIASI OTOMATIS',
        );
        if (payload.stepAdvance !== undefined) setFlowStep(payload.stepAdvance);
      } else if (res.reply) {
        const isIncomplete = rawRes?.order?.status === 'perlu konfirmasi alamat';
        appendFeed(
          isIncomplete ? 'system' : 'agent',
          res.reply,
          isIncomplete ? 'DRAF DITANDAI: ALAMAT BELUM JELAS' : 'BALASAN OTOMATIS TOKO',
        );
        if (payload.stepAdvance !== undefined) setFlowStep(payload.stepAdvance);
      }

      onRefreshData();
      if (chat.refreshLiveThreads) {
        await chat.refreshLiveThreads();
      }
      setSelectedThreadId(payload.buyer.replace(/^@/, '').trim());
    } catch (e) {
      appendFeed('alert', 'Gagal memproses pesan: ' + toErrorMessage(e), 'ERROR');
    }
  };

  const handleCustomSend = async () => {
    if (!customText.trim() || isLoading) return;
    const text = customText.trim();
    setCustomText('');
    await dispatchIncoming({
      buyer: buyerInput.trim() || 'pembeli_umum',
      channel,
      text,
    });
  };

  const filterOptions: SegmentedOption<InboxFilter>[] = [
    { value: 'all', label: `Semua (${chat.threads.length})` },
    {
      value: 'whatsapp',
      label: `WhatsApp (${chat.threads.filter((t) => t.channel === 'whatsapp').length})`,
      activeClassName: CHANNEL_ACTIVE.whatsapp,
    },
    {
      value: 'shopee',
      label: `Shopee (${chat.threads.filter((t) => t.channel === 'shopee').length})`,
      activeClassName: CHANNEL_ACTIVE.shopee,
    },
  ];

  const channelOptions: SegmentedOption<ChannelKey>[] = [
    { value: 'whatsapp', label: 'WhatsApp Business', activeClassName: CHANNEL_ACTIVE.whatsapp },
    { value: 'shopee', label: 'Shopee Seller', activeClassName: CHANNEL_ACTIVE.shopee },
  ];

  const isActivePaused = activeThread ? chat.isTakeover(activeThread.id) : false;

  return (
    <div className="space-y-5">
      {/* 1. RUANG KERJA KOTAK MASUK PELANGGAN ASLI (LIVE SELLER INBOX) */}
      <Card padding="lg" className="flex flex-col">
        <CardHeader
          icon={MessageSquare}
          tone="amber"
          title={
            <span className="flex flex-wrap items-center gap-2">
              Kotak Masuk Pelanggan (WhatsApp Business &amp; Shopee)
              <Badge tone="emerald">Live Sync HP &amp; Web</Badge>
            </span>
          }
          description="Pilih nama pelanggan di kiri untuk membaca percakapan, melihat draf pesanan, atau mengambil alih balasan secara manual."
          action={
            <Segmented
              value={inboxFilter}
              onChange={setInboxFilter}
              options={filterOptions}
              ariaLabel="Filter saluran kotak masuk"
              size="sm"
            />
          }
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Kolom Kiri: Daftar Chat Pelanggan */}
          <div className="lg:col-span-5 flex flex-col rounded-xl border border-line bg-canvas overflow-hidden">
            <div className="border-b border-line bg-nested/60 px-3.5 py-2 text-2xs font-bold uppercase tracking-wider text-ink-2">
              Daftar Percakapan ({visibleThreads.length})
            </div>
            {visibleThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-3">
                Belum ada percakapan masuk. Pesan baru dari WhatsApp Business di HP Anda akan otomatis muncul di sini secara real-time.
              </div>
            ) : (
              <ul className="max-h-[380px] divide-y divide-line overflow-y-auto bg-surface">
                {visibleThreads.map((t) => {
                  const isSelected = activeThread?.id === t.id;
                  const last = t.messages[t.messages.length - 1];
                  const paused = chat.isTakeover(t.id);
                  const statusMeta = THREAD_STATUS[t.status];
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedThreadId(t.id)}
                        className={cn(
                          'interactive-tap flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors',
                          isSelected ? 'bg-elevated ring-1 ring-inset ring-amber-300' : 'hover:bg-nested/50',
                        )}
                      >
                        <Avatar name={t.name} channel={t.channel} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate text-xs font-bold text-ink-1">{t.name}</span>
                            <span className="shrink-0 text-2xs tabular-nums text-ink-3">{last?.time ?? ''}</span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-ink-2">{previewOf(last)}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            <ChannelBadge channel={t.channel} />
                            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                            {paused && (
                              <Badge tone="amber" icon={Hand}>
                                AI Dijeda
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Kolom Kanan: Ruang Chat Pelanggan yang Dipilih */}
          <div className="lg:col-span-7 flex flex-col rounded-xl border border-line bg-surface overflow-hidden">
            {activeThread ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-gradient-to-b from-yellow-50/70 to-surface px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={activeThread.name} channel={activeThread.channel} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-ink-1">{activeThread.name}</h3>
                        <ChannelBadge channel={activeThread.channel} />
                      </div>
                      <p className="truncate text-2xs text-ink-3">
                        Minat / Draf: <strong className="text-ink-2">{activeThread.itemIntent}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !isActivePaused;
                      chat.setTakeover(activeThread.id, next);
                      toast.info(next ? 'AI dijeda manual untuk pembeli ini.' : 'AI diaktifkan kembali untuk pembeli ini.');
                    }}
                    className={cn(
                      'interactive-tap inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ring-1 ring-inset',
                      isActivePaused
                        ? 'bg-amber-200 text-amber-950 ring-amber-400'
                        : 'bg-nested text-ink-1 ring-line-strong hover:bg-nested-hover',
                    )}
                  >
                    {isActivePaused ? <Pause className="h-3.5 w-3.5" /> : <Hand className="h-3.5 w-3.5" />}
                    {isActivePaused ? 'AI Dijeda (Klik Aktifkan)' : 'Ambil Alih Manual'}
                  </button>
                </div>

                <div
                  ref={chatScrollRef}
                  className="max-h-[290px] min-h-[240px] flex-1 space-y-2.5 overflow-y-auto bg-canvas px-4 py-3"
                >
                  {activeThread.messages.map((m) =>
                    m.kind === 'event' ? (
                      <div key={m.id} className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-3 text-xs">
                        <p className="font-bold text-emerald-900">{m.title}</p>
                        <p className="mt-0.5 text-ink-2">{m.detail}</p>
                      </div>
                    ) : (
                      <div
                        key={m.id}
                        className={cn('flex flex-col', m.from !== 'buyer' ? 'items-end' : 'items-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-5 text-ink-1 shadow-sm',
                            m.from === 'buyer' && 'rounded-bl-md border border-line bg-surface',
                            m.from === 'ai' && 'rounded-br-md border border-amber-300 bg-elevated',
                            m.from === 'admin' && 'rounded-br-md border border-amber-400 bg-yellow-200/80',
                          )}
                        >
                          {m.text}
                        </div>
                        <div className="mt-1 flex items-center gap-2 px-1 text-2xs text-ink-3">
                          {m.from === 'ai' && (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                              <Bot className="h-3 w-3" />
                              Dibalas Otomatis {m.guard ? '· HPP Terproteksi' : ''}
                            </span>
                          )}
                          {m.from === 'admin' && <span className="font-bold text-amber-900">Anda (Penjual)</span>}
                          <span>{m.time}</span>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="flex items-center gap-2 border-t border-line bg-surface p-2.5">
                  <input
                    type="text"
                    aria-label="Balas manual ke pembeli"
                    value={manualReply}
                    onChange={(e) => setManualReply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendManualReply()}
                    placeholder={`Ketik balasan manual ke ${activeThread.name}...`}
                    className={cn(inputBase, 'h-10 flex-1 rounded-xl px-3 text-xs')}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    disabled={!manualReply.trim()}
                    onClick={handleSendManualReply}
                  >
                    Kirim Balasan
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-ink-3">Pilih percakapan di sebelah kiri.</div>
            )}
          </div>
        </div>
      </Card>

      {/* 2. PANEL UJI COBA CEPAT (SIMULASI SKENARIO TANPA HP KEDUA) */}
      <Card padding="lg" className="flex flex-col">
        <CardHeader
          icon={FlaskConical}
          tone="indigo"
          title={
            <span className="flex flex-wrap items-center gap-2">
              Panel Uji Coba Cepat (Simulasi Pesan Masuk Tanpa HP Kedua)
              <Badge tone="amber">Alat Penguji Skenario</Badge>
            </span>
          }
          description="Gunakan tombol di bawah ini jika Anda ingin menguji respons AI, proteksi HPP, dan peringatan anomali secara langsung dari laptop."
          action={<Segmented value={channel} onChange={setChannel} options={channelOptions} ariaLabel="Saluran pesan" size="sm" />}
        />

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* Bagian 1: Alur Pesanan Normal (HPP Guard -> Draf -> Lunas) */}
        <div className="rounded-xl border border-amber-300/80 bg-elevated/70 p-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                A. Alur Transaksi Normal (Nego HPP &rarr; Draf Pesanan &rarr; Potong Stok)
              </h4>
              <p className="text-xs text-ink-2">
                Menguji bagaimana AI menolak tawar di bawah modal dan Kode menghitung total pesanan secara presisi.
              </p>
            </div>
            {flowStep > 0 && (
              <button
                type="button"
                onClick={() => setFlowStep(0)}
                title="Ulangi urutan"
                className="interactive-tap inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-2xs font-semibold text-ink-2 hover:bg-nested"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Alur
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {NORMAL_FLOW_STEPS.map((s, idx) => {
              const done = flowStep > idx;
              const current = flowStep === idx;
              return (
                <button
                  key={s.step}
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    dispatchIncoming({
                      buyer: s.buyer,
                      channel: s.channel,
                      text: s.text,
                      stepAdvance: idx + 1,
                    })
                  }
                  className={cn(
                    'interactive-tap rounded-xl border p-2.5 text-left transition-all disabled:opacity-50',
                    done && 'border-emerald-300 bg-emerald-50/70',
                    current && 'border-amber-400 bg-surface shadow-sm ring-2 ring-yellow-400/35',
                    !done && !current && 'border-line bg-surface hover:border-amber-300',
                  )}
                >
                  <div className="flex items-center justify-between text-2xs font-bold">
                    <span className={done ? 'text-emerald-800' : 'text-amber-900'}>Langkah {s.step}</span>
                    {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-ink-1">{s.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-2xs text-ink-3">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bagian 2: Kasus Sulit & Peringatan Anomali ke Penjual */}
        <div className="rounded-xl border border-line bg-nested/50 p-3.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-1">
            B. Kasus Sulit &amp; Eskalasi Penjual (Deteksi Jumlah Tidak Wajar, Pertanyaan Aneh, &amp; Alamat Kurang Jelas)
          </h4>
          <p className="mt-0.5 text-xs text-ink-3">
            Sesuai prinsip pembagian tugas Model-Kode-Manusia: sistem tidak menebak alamat yang kurang lengkap dan langsung menjeda AI + mengirim peringatan ke penjual saat ada pesanan tidak wajar.
          </p>

          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                dispatchIncoming({
                  buyer: 'bu_rina_langganan',
                  channel: 'whatsapp',
                  text: 'Kak pesan Gantungan Kunci Capybara 3 pcs kirim ke rumah kayak biasa ya.',
                })
              }
              className="interactive-tap flex flex-col justify-between rounded-xl border border-amber-300 bg-surface p-2.5 text-left hover:bg-elevated"
            >
              <span className="inline-flex items-center gap-1 text-2xs font-bold text-amber-800">
                <MapPin className="h-3.5 w-3.5" />
                Alamat Belum Jelas
              </span>
              <span className="mt-1 text-xs font-semibold text-ink-1">&ldquo;Kirim kayak biasa&rdquo;</span>
              <span className="mt-0.5 text-2xs text-ink-3">Draf ditandai kuning, tidak ditebak AI</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                dispatchIncoming({
                  buyer: 'hendrik_borong99',
                  channel: 'whatsapp',
                  text: 'Kak saya mau borong Griptok Bunga Daisy 250 pcs sekarang juga, bisa langsung kirim semua?',
                })
              }
              className="interactive-tap flex flex-col justify-between rounded-xl border border-red-300 bg-surface p-2.5 text-left hover:bg-red-50/60"
            >
              <span className="inline-flex items-center gap-1 text-2xs font-bold text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Jumlah Tidak Wajar
              </span>
              <span className="mt-1 text-xs font-semibold text-ink-1">Borong 250 pcs (&gt; Stok)</span>
              <span className="mt-0.5 text-2xs text-ink-3">Auto-pause AI &amp; bunyikan Alert Penjual</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                dispatchIncoming({
                  buyer: 'akun_mencurigakan',
                  channel: 'shopee',
                  text: 'Kak bisa pinjam uang atau ambil barang dulu bayar bulan depan? Cek file undangan.apk ini ya.',
                })
              }
              className="interactive-tap flex flex-col justify-between rounded-xl border border-red-300 bg-surface p-2.5 text-left hover:bg-red-50/60"
            >
              <span className="inline-flex items-center gap-1 text-2xs font-bold text-red-700">
                <ShieldAlert className="h-3.5 w-3.5" />
                Pertanyaan Aneh / APK
              </span>
              <span className="mt-1 text-xs font-semibold text-ink-1">Minta Hutang &amp; File .APK</span>
              <span className="mt-0.5 text-2xs text-ink-3">Auto-pause AI &amp; beri peringatan penjual</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                dispatchIncoming({
                  buyer: 'Bank BCA',
                  channel: 'whatsapp',
                  text: 'Kode OTP BCA Anda 849201. JANGAN BERIKAN KEPADA SIAPA PUN termasuk pihak bank.',
                })
              }
              className="interactive-tap flex flex-col justify-between rounded-xl border border-emerald-300 bg-surface p-2.5 text-left hover:bg-emerald-50/60"
            >
              <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                Perisai Privasi OTP
              </span>
              <span className="mt-1 text-xs font-semibold text-ink-1">Notifikasi Kode OTP Bank</span>
              <span className="mt-0.5 text-2xs text-ink-3">Diblokir lokal di HP (0 byte ke AI)</span>
            </button>
          </div>
        </div>

        {/* Bagian 3: Live Feed Percakapan */}
        <div
          ref={feedRef}
          aria-live="polite"
          className="min-h-[190px] flex-1 space-y-2.5 overflow-y-auto rounded-xl border border-line bg-canvas p-3.5"
        >
          {feed.map((item, i) => (
            <div key={i} className={cn('rounded-xl border p-3 text-xs transition-all', FEED_STYLE[item.sender])}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-mono text-2xs font-bold uppercase tracking-wide">{item.badge}</span>
                <span className="font-mono text-2xs tabular-nums text-ink-3">{item.time}</span>
              </div>
              <p className="leading-5">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Bagian 4: Input Uji Pesan Bebas */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            aria-label="Username pembeli"
            value={buyerInput}
            onChange={(e) => setBuyerInput(e.target.value)}
            placeholder="Username pembeli"
            className={cn(inputBase, 'h-11 rounded-xl px-3 text-xs sm:w-40')}
          />
          <input
            type="text"
            aria-label="Kirim pesan masuk ke toko"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSend()}
            placeholder="Ketik chat pembeli (misal: tanya harga, pesan 500 pcs, atau tanya aneh)..."
            className={cn(inputBase, 'h-11 flex-1 rounded-xl px-3.5 text-body')}
          />
          <Button variant="primary" icon={Send} loading={isLoading} disabled={!customText.trim()} onClick={handleCustomSend}>
            Kirim Chat Masuk
          </Button>
        </div>
      </div>
    </Card>
    </div>
  );
};
