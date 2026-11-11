import React from 'react';
import { Bell, Bot, Check, ChevronRight, Send, ShieldCheck, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TelemetryNode } from '../types';
import { Badge, Card, cn } from './ui';

interface Props {
  activeNode: TelemetryNode | null;
  history: TelemetryNode[];
}

type NodeState = 'idle' | 'done' | 'active' | 'cache' | 'blocked';

interface PipelineNode {
  id: number;
  title: string;
  icon: LucideIcon;
  defaultDesc: string;
}

const NODES: PipelineNode[] = [
  { id: 1, title: 'Notifikasi dicegat', icon: Bell, defaultDesc: 'Android OS RemoteInput hook' },
  { id: 2, title: 'Filter privasi & cache', icon: ShieldCheck, defaultDesc: 'Perisai OTP, cache 0 ms' },
  { id: 3, title: 'AI router & stok', icon: Bot, defaultDesc: 'Gemini <500 ms, mutasi SQLite' },
  { id: 4, title: 'Balasan terkirim', icon: Send, defaultDesc: 'Jeda 3 detik, risiko banned 0' },
];

const STYLES: Record<NodeState, { card: string; icon: string; chip: string; bar: string }> = {
  idle: { card: 'border-line bg-surface', icon: 'bg-nested text-ink-3', chip: '', bar: '' },
  done: { card: 'border-emerald-300 bg-emerald-50/40', icon: 'bg-emerald-100 text-emerald-800', chip: '', bar: '' },
  active: {
    card: 'scale-[1.01] border-amber-400 bg-elevated shadow-sm',
    icon: 'bg-yellow-300 text-zinc-950',
    chip: 'bg-amber-200/80 text-amber-950',
    bar: 'bg-amber-500',
  },
  cache: {
    card: 'scale-[1.01] border-emerald-400 bg-emerald-50/80 shadow-sm',
    icon: 'bg-emerald-200 text-emerald-900',
    chip: 'bg-emerald-200/80 text-emerald-950',
    bar: 'bg-emerald-500',
  },
  blocked: {
    card: 'scale-[1.01] border-red-400 bg-red-50 shadow-sm',
    icon: 'bg-red-200 text-red-900',
    chip: 'bg-red-200/80 text-red-950',
    bar: 'bg-red-500',
  },
};

const stateOf = (id: number, active: TelemetryNode | null): NodeState => {
  if (!active) return 'idle';
  if (active.node === id) {
    if (active.status?.includes('BLOCK') || active.status?.includes('ANOMALY')) return 'blocked';
    if (active.status?.includes('CACHE')) return 'cache';
    return 'active';
  }
  return id < active.node ? 'done' : 'idle';
};

export const TelemetryPipeline: React.FC<Props> = ({ activeNode, history }) => {
  const total = history.length;
  const blocked = history.filter((h) => h.status?.includes('BLOCK') || h.status?.includes('ANOMALY')).length;
  const cached = history.filter((h) => h.status?.includes('CACHE')).length;
  const latencies = history.map((h) => h.latencyMs).filter((v): v is number => typeof v === 'number');
  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;

  const summary = [
    { label: 'Event tercatat', value: String(total) },
    { label: 'Cache hit', value: String(cached) },
    { label: 'Diblokir', value: String(blocked) },
    { label: 'Rata-rata latensi', value: avgLatency === null ? '-' : `${avgLatency} ms` },
  ];

  return (
    <Card padding="lg" className="mb-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-ink-1">Alur telemetri pesan</h2>
            <p className="text-xs text-ink-3">Notifikasi Android OS &rarr; Filter &amp; PII &rarr; AI &amp; Mutasi SQLite &rarr; RemoteInput</p>
          </div>
        </div>
        <Badge tone="emerald" icon={Zap}>
          Siaga: Zero-API OS Bridge
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-2">
        {NODES.map((node, index) => {
          const state = stateOf(node.id, activeNode);
          const s = STYLES[state];
          const isCurrent = state === 'active' || state === 'cache' || state === 'blocked';
          const Icon = node.icon;
          const lit = activeNode !== null && activeNode.node > node.id;

          return (
            <React.Fragment key={node.id}>
              <div
                aria-current={isCurrent ? 'step' : undefined}
                className={cn('relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ease-smooth', s.card)}
              >
                {state === 'blocked' && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 animate-pulse rounded-xl ring-2 ring-inset ring-red-400/60"
                  />
                )}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className={cn('grid h-9 w-9 place-items-center rounded-lg transition-colors duration-300', s.icon)}>
                    {state === 'done' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                  </span>
                  <span className="text-2xs font-semibold tabular-nums text-ink-3">Langkah {node.id}</span>
                </div>
                <h3 className="text-body font-semibold text-ink-1">{node.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-3">
                  {isCurrent && activeNode?.badge ? activeNode.badge : node.defaultDesc}
                </p>
                {isCurrent && (
                  <span className={cn('mt-3 inline-flex rounded-full px-2 py-0.5 font-mono text-2xs font-medium tabular-nums', s.chip)}>
                    {activeNode?.latencyMs !== undefined ? `${activeNode.latencyMs}ms` : 'AKTIF'}
                  </span>
                )}
                {isCurrent && (
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
                    <span className={cn('block h-full w-full animate-sweep', s.bar)} />
                  </span>
                )}
              </div>

              {index < NODES.length - 1 && (
                <div aria-hidden="true" className="hidden items-center md:flex">
                  <span className={cn('h-px w-4 transition-colors duration-300', lit ? 'bg-emerald-400/60' : 'bg-white/10')} />
                  <ChevronRight className={cn('-ml-1 h-4 w-4 transition-colors duration-300', lit ? 'text-emerald-400' : 'text-ink-4')} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 md:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="flex flex-col-reverse">
            <dt className="text-2xs text-ink-3">{item.label}</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums text-ink-1">{item.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
};
