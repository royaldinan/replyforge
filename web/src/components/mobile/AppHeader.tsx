import { Zap } from 'lucide-react';
import { cn } from '../ui';

interface AppHeaderProps {
  isAutoPilot: boolean;
  onToggleMode: () => void;
  storeName?: string;
  onOpenConnectWizard?: () => void;
  onOpenTutorial?: () => void;
}

export const AppHeader = ({
  isAutoPilot,
  onToggleMode,
  storeName = 'Lina Shop',
  onOpenConnectWizard,
  onOpenTutorial,
}: AppHeaderProps) => (
  <header className="shrink-0 border-b border-line bg-gradient-to-b from-yellow-50/90 to-surface px-4 pb-3 pt-safe backdrop-blur-xl">
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-sm font-extrabold text-zinc-950 shadow-sm ring-1 ring-inset ring-amber-500/35"
        >
          {storeName.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold leading-5 text-ink-1">{storeName}</h1>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              WA Terhubung
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" aria-hidden="true" />
              Shopee Belum Konek
            </span>
            {onOpenConnectWizard && (
              <button
                type="button"
                onClick={onOpenConnectWizard}
                className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 ring-1 ring-inset ring-amber-400/50 hover:bg-amber-200"
              >
                Koneksi
              </button>
            )}
            {onOpenTutorial && (
              <button
                type="button"
                onClick={onOpenTutorial}
                className="rounded-md bg-nested px-1.5 py-0.5 text-[10px] font-bold text-ink-1 ring-1 ring-inset ring-line-strong hover:bg-nested-hover"
              >
                ? Panduan
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isAutoPilot}
        aria-label="Auto-Pilot"
        onClick={onToggleMode}
        className={cn(
          'interactive-tap flex h-9 shrink-0 items-center gap-1.5 rounded-full pl-2.5 pr-1 text-xs font-bold ring-1 ring-inset',
          isAutoPilot
            ? 'bg-gradient-to-r from-yellow-200 to-amber-300 text-zinc-950 ring-amber-500/40 shadow-sm'
            : 'bg-nested text-ink-2 ring-line-strong',
        )}
      >
        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
        Auto-Pilot
        <span
          aria-hidden="true"
          className={cn(
            'relative inline-block h-5 w-8 rounded-full transition-colors duration-200 ease-smooth',
            isAutoPilot ? 'bg-amber-600' : 'bg-stone-300',
          )}
        >
          <span
            className={cn(
              'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-smooth',
              isAutoPilot ? 'translate-x-3' : 'translate-x-0',
            )}
          />
        </span>
      </button>
    </div>
  </header>
);
