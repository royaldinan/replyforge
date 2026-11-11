import { cn, toneText, type Tone } from '../ui';

interface OverviewItem {
  label: string;
  value: string | number;
  tone?: Tone;
}

/** Ringkasan 3 angka dalam satu baris (menggantikan kartu-dalam-kartu). */
export const OverviewStrip = ({ items }: { items: OverviewItem[] }) => (
  <dl
    className="grid divide-x divide-line rounded-2xl border border-line bg-surface py-3"
    style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
  >
    {items.map((item) => (
      <div key={item.label} className="flex flex-col-reverse px-3 text-center">
        <dt className="mt-0.5 text-2xs leading-4 text-ink-3">{item.label}</dt>
        <dd className={cn('truncate text-lg font-bold leading-6 tabular-nums', toneText[item.tone ?? 'neutral'])}>{item.value}</dd>
      </div>
    ))}
  </dl>
);
