import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Send, ShieldAlert, ShoppingCart, Smartphone, Truck, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toSimulatorResponse } from '../lib/simulator';
import { Card, CardHeader, IconButton, IconTile, Segmented, Spinner, cn, type SegmentedOption, type Tone } from './ui';

interface Props {
  onSendMessage: (payload: { buyer: string; channel: string; text: string; packageName: string }) => Promise<unknown>;
  isLoading: boolean;
}

interface Scenario {
  id: number;
  title: string;
  desc: string;
  icon: LucideIcon;
  tone: Tone;
  text: string;
}

type ChannelKey = 'shopee' | 'whatsapp';

interface ChatEntry {
  sender: 'buyer' | 'agent';
  text: string;
  time: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: 'Tanya Stok & Harga',
    desc: 'Memicu pipeline penuh & human typing delay',
    icon: Zap,
    tone: 'indigo',
    text: 'Halo kak, Paket Stiker Kucing Gemoy masih ready? Harganya berapa ya?',
  },
  {
    id: 2,
    title: 'Pertanyaan Ulang (Green Cache)',
    desc: 'Dijawab 0ms dari on-device cache tanpa LLM',
    icon: RefreshCw,
    tone: 'emerald',
    text: 'Halo kak, Paket Stiker Kucing Gemoy masih ready? Harganya berapa ya?',
  },
  {
    id: 3,
    title: 'Tanya Pengiriman & Nego',
    desc: 'Menjawab batas jam kirim & kebijakan diskon',
    icon: Truck,
    tone: 'amber',
    text: 'Min bisa kirim hari ini ke Jakarta Selatan? Ada diskon kalau ambil banyak?',
  },
  {
    id: 4,
    title: 'Deal Order 2 Pack (Potong Stok)',
    desc: 'Ekstrak order intent, potong stok SQLite real-time',
    icon: ShoppingCart,
    tone: 'sky',
    text: 'Kak saya pesan Paket Stiker Kucing 2 pack ya, tolong diproses sekarang.',
  },
  {
    id: 5,
    title: 'SMS OTP Bank Masuk (Privacy Shield)',
    desc: 'Sistem memblokir seketika, 0 bytes ke cloud AI',
    icon: ShieldAlert,
    tone: 'red',
    text: 'Kode OTP BCA Anda 849201. JANGAN BERIKAN KEPADA SIAPA PUN termasuk pihak bank.',
  },
];

const CHANNEL_ACTIVE: Record<ChannelKey, string> = {
  shopee: 'bg-shopee-deep text-white shadow-sm',
  whatsapp: 'bg-wa text-slate-950 shadow-sm',
};

const clock = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export const BuyerSimulator: React.FC<Props> = ({ onSendMessage, isLoading }) => {
  const [channel, setChannel] = useState<ChannelKey>('shopee');
  const [customText, setCustomText] = useState('');
  const [chatLog, setChatLog] = useState<ChatEntry[]>([
    { sender: 'buyer', text: 'Halo kak, Paket Stiker Kucing Gemoy ready?', time: '10:00' },
    {
      sender: 'agent',
      text: 'Halo kak! Paket Stiker Kucing Gemoy Vinyl Waterproof masih ready ya, sisa 50 pack lagi. Harganya Rp15.000, mau aku siapin berapa pack kak?',
      time: '10:00',
    },
  ]);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatLog.length, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const time = clock();
    setChatLog((prev) => [...prev, { sender: 'buyer', text: textToSend, time }]);
    setCustomText('');

    const res = toSimulatorResponse(
      await onSendMessage({
        buyer: 'Budi Santoso',
        channel,
        text: textToSend,
        packageName: channel === 'shopee' ? 'com.shopee.id' : 'com.whatsapp.w4b',
      }),
    );

    const reply = res.reply;
    if (reply) {
      setChatLog((prev) => [...prev, { sender: 'agent', text: reply, time: clock() }]);
    }
  };

  const channelOptions: SegmentedOption<ChannelKey>[] = [
    { value: 'shopee', label: 'Shopee Chat', activeClassName: CHANNEL_ACTIVE.shopee },
    { value: 'whatsapp', label: 'WhatsApp Business', activeClassName: CHANNEL_ACTIVE.whatsapp },
  ];

  return (
    <Card padding="lg" className="flex h-full flex-col">
      <CardHeader
        icon={Smartphone}
        tone="emerald"
        title="Simulator pembeli interaktif"
        description="Uji alur balas otomatis dari sisi pembeli"
        action={<Segmented value={channel} onChange={setChannel} options={channelOptions} ariaLabel="Saluran simulasi" size="sm" />}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div className="shrink-0">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h4 className="text-xs font-semibold text-ink-2">5 skenario uji 1-klik</h4>
            <span className="text-2xs text-ink-3">LOGICODIX 2026 test suite</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(sc.text)}
                className="interactive-tap group flex items-center gap-3 rounded-xl border border-line bg-nested/40 p-2.5 text-left hover:border-white/15 hover:bg-nested/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IconTile icon={sc.icon} tone={sc.tone} size="sm" />
                <span className="min-w-0 flex-1" title={`Skenario ${sc.id}: ${sc.title}`}>
                  <span className="block truncate text-body font-semibold text-ink-1">
                    <span className="font-medium text-ink-3">Skenario {sc.id}: </span>
                    {sc.title}
                  </span>
                  <span className="block truncate text-xs text-ink-3">{sc.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[260px] flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-canvas">
          <div className="flex items-center gap-2.5 border-b border-line bg-surface px-3.5 py-2.5">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/12 text-2xs font-bold text-emerald-300 ring-1 ring-inset ring-emerald-400/25"
            >
              LS
            </span>
            <div className="min-w-0">
              <p className="text-body font-semibold leading-4 text-ink-1">Lina Shop</p>
              <p className="text-2xs text-ink-3">{channel === 'shopee' ? 'Shopee Chat' : 'WhatsApp Business'}</p>
            </div>
          </div>

          <div ref={feedRef} role="log" aria-live="polite" className="max-h-[300px] min-h-[140px] flex-1 space-y-3 overflow-y-auto p-3.5">
            {chatLog.map((chat, idx) => (
              <div key={idx} className={cn('flex flex-col', chat.sender === 'buyer' ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-body leading-5',
                    chat.sender === 'buyer'
                      ? cn('rounded-br-md text-white', channel === 'shopee' ? 'bg-shopee-deep' : 'bg-wa-deep')
                      : 'rounded-bl-md border border-line bg-nested text-ink-1',
                  )}
                >
                  {chat.text}
                </div>
                <span className="mt-1 px-1 text-2xs tabular-nums text-ink-3">{chat.time}</span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-ink-3">
                <Spinner className="h-3 w-3 text-emerald-400" />
                <span>ReplyForge agent sedang memproses...</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-line bg-surface p-2.5">
            <input
              type="text"
              aria-label="Pesan pembeli"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(customText)}
              placeholder={`Ketik pesan bebas ke ${channel === 'shopee' ? 'Shopee' : 'WA'}...`}
              className="h-10 min-w-0 flex-1 rounded-full border border-white/10 bg-nested px-4 text-body text-ink-1 outline-none transition-colors duration-150 placeholder:text-ink-3 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
            />
            <IconButton
              icon={Send}
              label="Kirim pesan"
              variant="primary"
              disabled={!customText.trim() || isLoading}
              onClick={() => handleSend(customText)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
