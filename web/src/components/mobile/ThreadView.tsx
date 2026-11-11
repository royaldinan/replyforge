import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, Check, Hand, Package, Pause, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, CHANNELS, IconButton, IconTile, cn, type ChannelId } from '../ui';
import { Avatar } from './Avatar';
import type { EventMessage, TextMessage, Thread } from './data';

interface ThreadViewProps {
  thread: Thread;
  takeover: boolean;
  isAutoPilot: boolean;
  onBack: () => void;
  onSend: (text: string) => void;
  onSetTakeover: (next: boolean) => void;
}

const Bubble = ({ m, channel }: { m: TextMessage; channel: ChannelId }) => {
  const mine = m.from !== 'buyer';
  return (
    <div className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] select-text whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-5 text-ink-1 shadow-sm',
          m.from === 'buyer' && 'rounded-bl-md border border-line bg-surface',
          m.from === 'ai' && 'rounded-br-md border border-amber-300 bg-elevated',
          m.from === 'admin' && 'rounded-br-md border border-amber-400 bg-yellow-200/80',
        )}
      >
        {m.text}
      </div>
      <div className={cn('mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 px-1 text-2xs text-ink-3', mine && 'justify-end')}>
        {m.from === 'ai' && (
          <>
            <span className="inline-flex items-center gap-1 font-medium text-amber-800">
              <Bot className="h-3 w-3" aria-hidden="true" />
              Dibalas otomatis
            </span>
            {m.guard && (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                HPP terproteksi
              </span>
            )}
          </>
        )}
        {m.from === 'admin' && <span className="font-semibold text-amber-900">Anda</span>}
        <span className="tabular-nums">{m.time}</span>
        {m.from === 'buyer' && <span>{CHANNELS[channel].chat}</span>}
      </div>
    </div>
  );
};

const EventCard = ({ m }: { m: EventMessage }) => (
  <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-3.5">
    <div className="flex items-start gap-3">
      <IconTile icon={Check} tone="emerald" size="sm" />
      <div className="min-w-0 flex-1">
        <p className="select-text text-body font-semibold text-emerald-900">{m.title}</p>
        <p className="mt-0.5 text-xs leading-5 text-ink-2">{m.detail}</p>
        <div className="mt-2 flex items-center gap-2">
          {m.badge && <Badge tone="emerald">{m.badge}</Badge>}
          <span className="text-2xs tabular-nums text-ink-3">{m.time}</span>
        </div>
      </div>
    </div>
  </div>
);

export const ThreadView = ({ thread, takeover, isAutoPilot, onBack, onSend, onSetTakeover }: ThreadViewProps) => {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageCount = thread.messages.length;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messageCount, thread.id]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
    toast.success(`Pesan terkirim ke ${thread.name} via ${CHANNELS[thread.channel].short}`);
  };

  const toggleTakeover = () => {
    const next = !takeover;
    onSetTakeover(next);
    toast.info(next ? 'AI dijeda manual. Anda memegang kendali chat.' : 'AI kembali aktif untuk thread ini.');
  };

  const statusLine = takeover
    ? { icon: Hand, text: 'AI dijeda, Anda yang membalas', cls: 'text-amber-800' }
    : isAutoPilot
      ? { icon: Bot, text: 'AI membalas otomatis', cls: 'text-emerald-700' }
      : { icon: Sparkles, text: 'Copilot: AI menyusun balasan', cls: 'text-amber-800' };
  const StatusIcon = statusLine.icon;

  return (
    <div className="flex min-h-0 flex-1 animate-slide-in-right flex-col">
      <header className="shrink-0 border-b border-line bg-surface/95 px-2 pb-2.5 pt-safe backdrop-blur-xl">
        <div className="flex items-center gap-1">
          <IconButton icon={ArrowLeft} label="Kembali ke daftar chat" size="lg" onClick={onBack} />
          <Avatar name={thread.name} channel={thread.channel} size="sm" ringClassName="ring-surface" />
          <div className="ml-1 min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold leading-5 text-ink-1">{thread.name}</h1>
            <p className="truncate font-mono text-2xs text-ink-3">{thread.handle}</p>
          </div>
          <button
            type="button"
            aria-pressed={takeover}
            onClick={toggleTakeover}
            className={cn(
              'interactive-tap flex h-11 shrink-0 select-none items-center gap-1.5 rounded-xl px-3 text-xs font-semibold ring-1 ring-inset',
              takeover ? 'bg-amber-200 text-amber-950 ring-amber-400' : 'bg-nested text-ink-1 ring-line-strong hover:bg-nested-hover',
            )}
          >
            {takeover ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Hand className="h-3.5 w-3.5" aria-hidden="true" />}
            {takeover ? 'AI Dijeda' : 'Takeover Manual'}
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line bg-surface/60 px-4 py-2.5">
          <Badge tone="emerald" icon={Package}>
            {thread.status === 'checkout' ? thread.itemIntent : `Ingin beli: ${thread.itemIntent}`}
          </Badge>
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', statusLine.cls)}>
            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {statusLine.text}
          </span>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
          <p className="text-center text-2xs font-medium text-ink-3">Hari ini</p>
          {thread.messages.map((m) =>
            m.kind === 'event' ? <EventCard key={m.id} m={m} /> : <Bubble key={m.id} m={m} channel={thread.channel} />,
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-line bg-app px-3 pb-safe pt-2.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            aria-label="Tulis balasan"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={takeover ? 'Ketik balasan Anda...' : 'Ketik balasan atau biarkan AI...'}
            className="h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-nested px-4 text-[15px] text-ink-1 outline-none transition-colors duration-150 placeholder:text-ink-3 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
          />
          <IconButton
            icon={Send}
            label="Kirim balasan"
            size="lg"
            variant="primary"
            disabled={!draft.trim()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={submit}
          />
        </div>
      </footer>
    </div>
  );
};
