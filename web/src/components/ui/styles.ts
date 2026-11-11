import { cn } from './cn';

/** Dasar gaya input (tanpa radius/padding/ukuran) supaya bisa dipakai varian lain tanpa class yang bentrok. */
export const inputBase =
  'w-full border border-line-strong bg-surface text-ink-1 placeholder:text-ink-4 outline-none transition-colors duration-150 focus:border-amber-500 focus:ring-2 focus:ring-yellow-400/35 disabled:opacity-60';

export const inputClass = cn(inputBase, 'rounded-xl px-3.5 py-2.5 text-body');

export const labelClass = 'mb-1.5 block text-xs font-medium text-ink-2';
