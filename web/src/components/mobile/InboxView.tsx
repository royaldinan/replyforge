import { Bot, Hand, MessageSquare, Package, Sparkles } from 'lucide-react';
import { Badge, CHANNELS, ChannelDot, EmptyState, IconTile, Segmented, cn, type ChannelId, type SegmentedOption } from '../ui';
import { Avatar } from './Avatar';
import { THREAD_STATUS, type ChatMessage } from './data';
import type { ChatApi } from './useChatThreads';

interface InboxViewProps {
  chat: ChatApi;
  isAutoPilot: boolean;
}

const lastMessageOf = (messages: ChatMessage[]): ChatMessage | undefined => messages[messages.length - 1];

const previewOf = (m: ChatMessage | undefined): string => {
  if (!m) return '';
  if (m.kind === 'event') return m.title;
  if (m.from === 'ai') return 'AI: ' + m.text;
  if (m.from === 'admin') return 'Anda: ' + m.text;
  return m.text;
};

const ModeBanner = ({ isAutoPilot }: { isAutoPilot: boolean }) => (
  <div
    className={cn(
      'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs',
      isAutoPilot ? 'border-amber-300 bg-elevated text-amber-950' : 'border-line-strong bg-nested text-ink-1',
    )}
  >
    <span className="relative flex h-2 w-2 shrink-0">
      <span className={cn('h-2 w-2 rounded-full', isAutoPilot ? 'bg-amber-500' : 'bg-ink-3')} />
    </span>
    <p className="min-w-0 flex-1 leading-snug text-ink-2">
      <strong className="font-semibold text-ink-1">{isAutoPilot ? 'Auto-Pilot aktif' : '1-Tap Copilot'}</strong>:{' '}
      {isAutoPilot ? 'AI balas otomatis & jaga HPP.' : 'Tinjau draf balasan sebelum kirim.'}
    </p>
  </div>
);

const ACTIVE_CLASS: Record<ChannelId, string> = {
  shopee: 'bg-[#FFF2EE] text-[#C23315] ring-1 ring-inset ring-[#EE4D2D]/35 shadow-sm',
  whatsapp: 'bg-[#ECFDF3] text-[#116932] ring-1 ring-inset ring-[#25D366]/40 shadow-sm',
};

export const InboxView = ({ chat, isAutoPilot }: InboxViewProps) => {
  const { threads, channel, setChannel } = chat;
  const inChannel = (id: ChannelId) => threads.filter((t) => t.channel === id);
  const unreadIn = (id: ChannelId) => inChannel(id).reduce((sum, t) => sum + t.unread, 0);
  const visible = inChannel(channel);

  const options: SegmentedOption<ChannelId>[] = (['shopee', 'whatsapp'] as const).map((id) => ({
    value: id,
    activeClassName: ACTIVE_CLASS[id],
    label: (
      <>
        <ChannelDot channel={id} />
        {CHANNELS[id].short}
        <span className="text-2xs font-medium tabular-nums opacity-80">{inChannel(id).length}</span>
        {id !== channel && unreadIn(id) > 0 && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      </>
    ),
  }));

  return (
    <div className="space-y-3 px-4 pb-6 pt-4">
      <Segmented value={channel} onChange={setChannel} options={options} ariaLabel="Pilih saluran chat" />
      <ModeBanner isAutoPilot={isAutoPilot} />

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface">
          <EmptyState
            icon={MessageSquare}
            title="Belum ada chat"
            description={`Chat pembeli dari ${CHANNELS[channel].short} akan muncul di sini.`}
          />
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {visible.map((t) => {
            const last = lastMessageOf(t.messages);
            const status = THREAD_STATUS[t.status];
            const paused = chat.isTakeover(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => chat.open(t.id)}
                  className="interactive-tap flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-white/4 active:bg-white/6"
                >
                  <Avatar name={t.name} channel={t.channel} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink-1">{t.name}</span>
                      <span className="shrink-0 text-2xs tabular-nums text-ink-3">{last?.time ?? ''}</span>
                    </div>
                    <p className="mt-0.5 truncate text-body text-ink-3">{previewOf(last)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <Badge icon={Package}>{t.itemIntent}</Badge>
                      {paused && (
                        <Badge tone="amber" icon={Hand}>
                          AI dijeda
                        </Badge>
                      )}
                    </div>
                  </div>
                  {t.unread > 0 && (
                    <span className="mt-0.5 grid h-5 min-w-[1.25rem] shrink-0 place-items-center rounded-full bg-amber-400 px-1.5 text-2xs font-bold tabular-nums text-zinc-950">
                      {t.unread} <span className="sr-only">pesan belum dibaca</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
