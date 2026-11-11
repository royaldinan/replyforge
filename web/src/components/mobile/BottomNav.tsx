import type { LucideIcon } from 'lucide-react';
import { cn } from '../ui';

export type TabId = 'chat' | 'stock' | 'orders' | 'system';

export interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface BottomNavProps {
  items: NavItem[];
  active: TabId;
  onChange: (id: TabId) => void;
}

export const BottomNav = ({ items, active, onChange }: BottomNavProps) => (
  <nav aria-label="Navigasi utama" className="shrink-0 border-t border-line bg-surface/95 px-2 pt-1.5 pb-safe backdrop-blur-xl">
    <ul className="grid grid-cols-4 gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;
        const badge = item.badge ?? 0;
        return (
          <li key={item.id}>
            <button
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(item.id)}
              className="interactive-tap group relative flex min-h-[3.5rem] w-full select-none flex-col items-center justify-center gap-1 rounded-xl"
            >
              <span
                className={cn(
                  'grid h-8 w-14 place-items-center rounded-full transition-colors duration-200 ease-smooth',
                  isActive ? 'bg-amber-300/80 text-zinc-950 shadow-sm ring-1 ring-amber-400/60' : 'text-ink-3 group-hover:text-ink-1',
                )}
              >
                <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
              </span>
              <span className={cn('text-2xs font-semibold leading-none', isActive ? 'text-ink-1' : 'text-ink-3')}>{item.label}</span>{' '}
              {badge > 0 && (
                <>
                  <span className="absolute left-1/2 top-[3px] ml-[3px] min-w-[1rem] rounded-full bg-amber-400 px-1 text-center text-3xs font-bold leading-4 tabular-nums text-zinc-950 ring-1 ring-surface">
                    {badge > 99 ? '99+' : badge}
                  </span>{' '}
                  <span className="sr-only">perlu perhatian</span>
                </>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);
