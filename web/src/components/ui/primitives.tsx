import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';
import { toneFill, toneRing, toneSoft, toneText, type Tone } from './tones';

/* ------------------------------------------------------------------ */
/* Spinner                                                             */
/* ------------------------------------------------------------------ */

/** Dekoratif: status "sedang memproses" disampaikan lewat aria-busy / teks di sekitarnya, bukan lewat spinner. */
export const Spinner = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className ?? 'h-4 w-4')}
  />
);

/* ------------------------------------------------------------------ */
/* Button & IconButton                                                 */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'indigo' | 'amber';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-zinc-950 shadow-gold ring-1 ring-inset ring-amber-500/35 hover:from-yellow-200 hover:via-yellow-300 hover:to-amber-400 disabled:from-stone-200 disabled:via-stone-200 disabled:to-stone-200 disabled:text-ink-4 disabled:shadow-none',
  secondary:
    'bg-surface text-ink-1 ring-1 ring-inset ring-line-strong hover:bg-nested disabled:opacity-50 disabled:hover:bg-surface',
  ghost: 'text-ink-2 hover:bg-nested hover:text-ink-1 disabled:opacity-50 disabled:hover:bg-transparent',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-300/80 hover:bg-red-100 disabled:opacity-50',
  indigo:
    'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-zinc-950 shadow-sm ring-1 ring-inset ring-amber-500/35 hover:from-yellow-200 hover:to-amber-400 disabled:opacity-50',
  amber: 'bg-amber-400 text-zinc-950 ring-1 ring-inset ring-amber-500/40 hover:bg-amber-300 disabled:opacity-50',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-11 gap-2 rounded-xl px-4 text-body', // 44px: target sentuh minimum di HP
  lg: 'h-12 gap-2 rounded-xl px-5 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled}
    aria-busy={loading || undefined}
    aria-disabled={loading || undefined}
    onClick={(e) => {
      // Saat loading, klik diabaikan tetapi warna tombol tetap (tidak berubah jadi "disabled").
      if (loading) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    }}
    className={cn(
      'interactive-tap inline-flex select-none items-center justify-center whitespace-nowrap font-semibold disabled:cursor-not-allowed',
      buttonVariants[variant],
      buttonSizes[size],
      loading && 'cursor-progress',
      fullWidth && 'w-full',
      className,
    )}
    {...rest}
  >
    {loading ? <Spinner className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
    {children}
  </button>
);

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** Wajib: nama aksesibel untuk tombol yang hanya berisi ikon. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'secondary' | 'primary';
}

const iconButtonSizes = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-11 w-11 rounded-xl', // 44px: target sentuh minimum di HP
} as const;

const iconButtonVariants = {
  ghost: 'text-ink-2 hover:bg-nested hover:text-ink-1 disabled:opacity-40 disabled:hover:bg-transparent',
  secondary: 'bg-surface text-ink-1 ring-1 ring-inset ring-line-strong hover:bg-nested disabled:opacity-40',
  primary: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-zinc-950 hover:from-yellow-200 hover:to-amber-400 disabled:bg-stone-200 disabled:text-ink-4',
} as const;

export const IconButton = ({ icon: Icon, label, size = 'md', variant = 'ghost', className, type = 'button', ...rest }: IconButtonProps) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={cn(
      'interactive-tap inline-flex shrink-0 select-none items-center justify-center disabled:cursor-not-allowed',
      iconButtonSizes[size],
      iconButtonVariants[variant],
      className,
    )}
    {...rest}
  >
    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
  </button>
);

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

interface BadgeProps {
  tone?: Tone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  title?: string;
}

export const Badge = ({ tone = 'neutral', icon: Icon, children, className, title }: BadgeProps) => (
  <span
    title={title}
    className={cn(
      'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold ring-1 ring-inset',
      toneSoft[tone],
      toneRing[tone],
      className,
    )}
  >
    {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/* Card, IconTile, CardHeader                                          */
/* ------------------------------------------------------------------ */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'md' | 'lg';
}

export const Card = ({ padding = 'md', className, ...rest }: CardProps) => (
  <div
    className={cn('rounded-2xl border border-line bg-surface shadow-card', padding === 'md' && 'p-4', padding === 'lg' && 'p-5', className)}
    {...rest}
  />
);

interface IconTileProps {
  icon: LucideIcon;
  tone?: Tone;
  size?: 'sm' | 'md';
  className?: string;
}

export const IconTile = ({ icon: Icon, tone = 'neutral', size = 'md', className }: IconTileProps) => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-grid shrink-0 place-items-center ring-1 ring-inset',
      toneSoft[tone],
      toneRing[tone],
      size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl',
      className,
    )}
  >
    <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
  </span>
);

interface CardHeaderProps {
  icon?: LucideIcon;
  tone?: Tone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Tanpa margin bawah (jarak diatur oleh pemanggil). */
  flush?: boolean;
  /** Level heading judul (default h3). Di layar yang judulnya h1, pakai 2 agar urutan heading tidak melompat. */
  level?: 2 | 3;
  className?: string;
}

/** Aksi di kanan otomatis turun ke baris baru jika kartunya terlalu sempit (judul tidak ikut terperas). */
export const CardHeader = ({
  icon,
  tone = 'neutral',
  title,
  description,
  action,
  flush = false,
  level = 3,
  className,
}: CardHeaderProps) => {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', !flush && 'mb-4', className)}>
      <div className="flex min-w-[13rem] flex-1 items-start gap-3">
        {icon && <IconTile icon={icon} tone={tone} />}
        <div className="min-w-0 flex-1">
          <Heading className="text-sm font-semibold leading-5 text-ink-1">{title}</Heading>
          {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export const Switch = ({ checked, onChange, label, disabled, className }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full ring-1 ring-inset transition-colors duration-200 ease-smooth disabled:opacity-50',
      checked ? 'bg-amber-400 ring-amber-500/40' : 'bg-stone-200 ring-stone-300',
      className,
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-smooth',
        checked ? 'translate-x-5' : 'translate-x-0',
      )}
    />
  </button>
);

/* ------------------------------------------------------------------ */
/* Segmented control (radio group)                                     */
/* ------------------------------------------------------------------ */

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: ReactNode;
  /** Ganti gaya saat aktif (mis. warna brand channel). */
  activeClassName?: string;
  ariaLabel?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: NoInfer<T>) => void;
  options: readonly SegmentedOption<NoInfer<T>>[] | SegmentedOption<NoInfer<T>>[];
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Segmented<T extends string>({ value, onChange, options, ariaLabel, size = 'md', className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('grid gap-1 rounded-xl bg-nested p-1 ring-1 ring-inset ring-line', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={cn(
              'interactive-tap flex items-center justify-center gap-1.5 rounded-lg font-semibold',
              size === 'sm' ? 'h-9 px-2.5 text-xs' : 'h-11 px-3 text-body',
              active
                ? (o.activeClassName ?? 'bg-surface text-ink-1 shadow-sm ring-1 ring-inset ring-amber-400/60')
                : 'text-ink-3 hover:text-ink-1',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressBar                                                         */
/* ------------------------------------------------------------------ */

interface ProgressBarProps {
  /** 0-100 */
  value: number;
  tone?: Tone;
  label: string;
  className?: string;
}

export const ProgressBar = ({ value, tone = 'emerald', label, className }: ProgressBarProps) => {
  const v = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-nested', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-smooth', toneFill[tone])} style={{ width: `${v}%` }} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Stat & EmptyState                                                   */
/* ------------------------------------------------------------------ */

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
}

export const Stat = ({ label, value, hint, tone = 'neutral', icon: Icon, className }: StatProps) => (
  <div className={cn('min-w-0 rounded-xl border border-line bg-nested/60 p-3', className)}>
    <div className="flex items-center gap-1.5 text-xs text-ink-3">
      {Icon && <Icon className={cn('h-3.5 w-3.5 shrink-0', toneText[tone])} aria-hidden="true" />}
      <span className="truncate">{label}</span>
    </div>
    <div className={cn('mt-1.5 truncate text-xl font-bold leading-7 tabular-nums', toneText[tone])}>{value}</div>
    {hint && <div className="mt-0.5 text-2xs text-ink-3">{hint}</div>}
  </div>
);

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
    <IconTile icon={icon} className="mb-3" />
    <p className="text-sm font-semibold text-ink-1">{title}</p>
    {description && <p className="mt-1 max-w-xs text-xs leading-5 text-ink-3">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
