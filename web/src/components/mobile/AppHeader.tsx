import { BookOpen } from 'lucide-react';

interface AppHeaderProps {
  isAutoPilot: boolean;
  onToggleMode: () => void;
  storeName?: string;
  onOpenConnectWizard?: () => void;
  onOpenTutorial?: () => void;
}

/**
 * Header setipis APK: nama toko + satu baris kontrak kanal.
 * Toggle mode, pil status ganda, dan tombol koneksi dipindah ke tab Sistem.
 */
export const AppHeader = ({
  storeName = 'Stickeria',
  onOpenTutorial,
}: AppHeaderProps) => (
  <header className="shrink-0 border-b border-line bg-surface/95 px-4 pb-2.5 pt-safe backdrop-blur-xl">
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
          <p className="truncate text-[11px] font-medium text-ink-3">
            WhatsApp Autopilot · Shopee Smart Copilot
          </p>
        </div>
      </div>
      {onOpenTutorial && (
        <button
          type="button"
          onClick={onOpenTutorial}
          aria-label="Buka panduan"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-nested px-2.5 text-xs font-semibold text-ink-2 ring-1 ring-inset ring-line-strong hover:bg-nested-hover"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          Panduan
        </button>
      )}
    </div>
  </header>
);
