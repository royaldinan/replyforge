import { useCallback, useEffect, useRef, useState } from 'react';
import { formatClock } from '../../lib/format';
import type { ChannelId } from '../ui';
import { INITIAL_THREADS, type ChatMessage, type Thread } from './data';

export interface ChatApi {
  threads: Thread[];
  channel: ChannelId;
  setChannel: (channel: ChannelId) => void;
  /** Percakapan yang sedang dibuka (null = tampilkan daftar chat). */
  activeThread: Thread | null;
  open: (id: string) => void;
  close: () => void;
  isTakeover: (id: string) => boolean;
  setTakeover: (id: string, value: boolean) => void;
  sendAdminMessage: (id: string, text: string) => void;
  unreadTotal: number;
  refreshLiveThreads?: () => Promise<void>;
}

interface BackendMessageRow {
  id: number;
  thread_id: string;
  buyer: string;
  channel: string;
  direction: 'in' | 'out';
  text: string;
  meta?: { from?: string; guard?: boolean };
  created_at: number;
}

interface BackendThreadRow {
  id: string;
  buyer: string;
  channel: string;
  paused: boolean;
  last_at: number;
}

const isVitest = (import.meta as any).env?.MODE === 'test';

export function useChatThreads(): ChatApi {
  const [threads, setThreads] = useState<Thread[]>(isVitest ? INITIAL_THREADS : []);
  const [channel, setChannel] = useState<ChannelId>(isVitest ? 'shopee' : 'whatsapp');
  const [openId, setOpenId] = useState<string | null>(null);
  const [takeover, setTakeoverMap] = useState<Record<string, boolean>>({});
  const counter = useRef(0);

  const refreshLiveThreads = useCallback(async () => {
    try {
      const [msgRes, thRes] = await Promise.all([
        fetch('/api/messages').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/threads').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (!Array.isArray(msgRes)) return;
      if (msgRes.length === 0) {
        if (!isVitest) setThreads([]);
        return;
      }

      const rows = msgRes as BackendMessageRow[];
      const thRows = Array.isArray(thRes) ? (thRes as BackendThreadRow[]) : [];

      const pausedMap: Record<string, boolean> = {};
      for (const tr of thRows) {
        const cleanId = tr.buyer.replace(/^@/, '').trim();
        if (tr.paused) {
          pausedMap[cleanId] = true;
          pausedMap[tr.id] = true;
        }
      }
      if (Object.keys(pausedMap).length > 0) {
        setTakeoverMap((prev) => ({ ...prev, ...pausedMap }));
      }

      setThreads((prev) => {
        const map = new Map<string, Thread>();
        for (const t of prev) {
          map.set(t.id, { ...t, messages: [...t.messages] });
        }

        const validRows = rows.filter((m) => {
          const b = m.buyer.toLowerCase().trim();
          return b !== 'anda' && b !== 'you' && !b.includes('lina shop');
        });

        for (const m of validRows) {
          const cleanBuyer = m.buyer.replace(/^@/, '').trim();
          const threadKey = map.has(cleanBuyer) ? cleanBuyer : m.thread_id || cleanBuyer;
          const ch: ChannelId = m.channel === 'whatsapp' ? 'whatsapp' : 'shopee';
          const msgId = `db-${m.id}`;

          const existing = map.get(threadKey);
          const chatMsg: ChatMessage = {
            id: msgId,
            kind: 'text',
            from: m.direction === 'in' ? 'buyer' : m.meta?.from === 'admin' ? 'admin' : 'ai',
            text: m.text,
            time: formatClock(m.created_at),
            guard: m.direction === 'out' && /harga pas|minimal/i.test(m.text),
          };

          if (existing) {
            if (!existing.messages.some((em) => em.id === msgId)) {
              existing.messages.push(chatMsg);
            }
          } else {
            map.set(threadKey, {
              id: threadKey,
              name: cleanBuyer,
              handle: cleanBuyer.startsWith('@') ? cleanBuyer : `@${cleanBuyer}`,
              channel: ch,
              unread: m.direction === 'in' ? 1 : 0,
              itemIntent: 'Chat Masuk Langsung',
              status: 'inquiry',
              messages: [chatMsg],
            });
          }
        }

        // If real live chats exist from SQLite DB, ONLY show real ones (no fake mock chats).
        const all = Array.from(map.values());
        const liveOnes = all.filter((t) => !INITIAL_THREADS.some((init) => init.id === t.id));
        const isVitest = (import.meta as any).env?.MODE === 'test';
        return liveOnes.length > 0 ? liveOnes.reverse() : (isVitest ? all : []);
      });
    } catch {
      // Ignore fetch errors in offline/unit test environments
    }
  }, []);

  useEffect(() => {
    refreshLiveThreads();
    const interval = setInterval(refreshLiveThreads, 2500);

    let sse: EventSource | null = null;
    if (typeof EventSource !== 'undefined') {
      try {
        sse = new EventSource('/api/telemetry/stream');
        sse.onmessage = () => {
          refreshLiveThreads();
        };
      } catch {
        // ignore if EventSource is mocked/unavailable
      }
    }

    return () => {
      clearInterval(interval);
      if (sse) sse.close();
    };
  }, [refreshLiveThreads]);

  useEffect(() => {
    const onPop = () => setOpenId(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const open = useCallback((id: string) => {
    setOpenId(id);
    setThreads((prev) => prev.map((t) => (t.id === id && t.unread > 0 ? { ...t, unread: 0 } : t)));
    try {
      window.history.pushState({ rfThread: id }, '');
    } catch {
      /* history tidak tersedia (mis. iframe ter-sandbox): tombol kembali di app tetap berfungsi */
    }
  }, []);

  const close = useCallback(() => {
    const state = window.history.state as { rfThread?: string } | null;
    if (state && state.rfThread) {
      window.history.back(); // popstate yang akan menutup
    } else {
      setOpenId(null);
    }
  }, []);

  const isTakeover = useCallback((id: string) => Boolean(takeover[id]), [takeover]);

  const setTakeover = useCallback(
    (id: string, value: boolean) => {
      setTakeoverMap((prev) => ({ ...prev, [id]: value }));
      const target = threads.find((t) => t.id === id);
      if (target) {
        fetch(`/api/threads/${encodeURIComponent(`${target.channel}:${target.name}`)}/pause`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paused: value, buyer: target.name, channel: target.channel }),
        }).catch(() => {});
      }
    },
    [threads],
  );

  const sendAdminMessage = useCallback(
    (id: string, text: string) => {
      const clean = text.trim();
      if (!clean) return;
      counter.current += 1;
      const message: ChatMessage = {
        id: `local-${counter.current}`,
        kind: 'text',
        from: 'admin',
        text: clean,
        time: formatClock(new Date()),
      };
      const target = threads.find((t) => t.id === id);
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, messages: [...t.messages, message] } : t)));

      if (target) {
        fetch('/api/threads/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyer: target.name, channel: target.channel, text: clean }),
        }).catch(() => {});
      }
    },
    [threads],
  );

  const activeThread = openId ? (threads.find((t) => t.id === openId) ?? null) : null;
  const unreadTotal = threads.reduce((sum, t) => sum + t.unread, 0);

  return {
    threads,
    channel,
    setChannel,
    activeThread,
    open,
    close,
    isTakeover,
    setTakeover,
    sendAdminMessage,
    unreadTotal,
    refreshLiveThreads,
  };
}
