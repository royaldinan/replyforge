/** Warna semantik ReplyForge (Sunlit Warm Commercial — Dominan Putih & Kuning Cerah). */
export type Tone = 'neutral' | 'emerald' | 'indigo' | 'amber' | 'red' | 'sky' | 'shopee' | 'wa';

/** Latar lembut + teks kontras tajam di atas putih: badge & ikon tile. */
export const toneSoft: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-zinc-700',
  emerald: 'bg-emerald-50 text-emerald-800',
  indigo: 'bg-yellow-100/90 text-amber-950',
  amber: 'bg-amber-100/90 text-amber-900',
  red: 'bg-red-50 text-red-800',
  sky: 'bg-sky-50 text-sky-800',
  shopee: 'bg-[#FFF2EE] text-[#C23315]',
  wa: 'bg-[#ECFDF3] text-[#116932]',
};

export const toneRing: Record<Tone, string> = {
  neutral: 'ring-stone-300/80',
  emerald: 'ring-emerald-300/80',
  indigo: 'ring-yellow-400/70',
  amber: 'ring-amber-400/70',
  red: 'ring-red-300/80',
  sky: 'ring-sky-300/80',
  shopee: 'ring-[#EE4D2D]/30',
  wa: 'ring-[#25D366]/40',
};

export const toneText: Record<Tone, string> = {
  neutral: 'text-ink-1',
  emerald: 'text-emerald-700',
  indigo: 'text-amber-800',
  amber: 'text-amber-700',
  red: 'text-red-700',
  sky: 'text-sky-700',
  shopee: 'text-shopee-ink',
  wa: 'text-wa',
};

export const toneFill: Record<Tone, string> = {
  neutral: 'bg-ink-3',
  emerald: 'bg-emerald-500',
  indigo: 'bg-yellow-400',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  sky: 'bg-sky-500',
  shopee: 'bg-shopee',
  wa: 'bg-wa',
};
