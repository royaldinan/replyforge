import type { Tone } from '../ui';

export type OrderState = 'paid' | 'silent' | 'cancelled' | 'pending';

/**
 * Pemetaan status pesanan → tampilan.
 * Aturan "lunas/paid" dan "silent" sama seperti versi lama; "cancelled" ditambahkan
 * karena sebelumnya pesanan batal salah tampil sebagai "Menunggu pembayaran".
 */
export const getOrderState = (status: string | null | undefined): OrderState => {
  const s = String(status ?? '').toLowerCase();
  if (s.includes('lunas') || s === 'paid') return 'paid';
  if (s.includes('silent')) return 'silent';
  if (s.includes('cancel') || s.includes('batal')) return 'cancelled';
  return 'pending';
};

export const ORDER_STATE_META: Record<OrderState, { label: string; hint: string; tone: Tone }> = {
  paid: { label: 'Lunas', hint: 'Perlu dikirim', tone: 'emerald' },
  silent: { label: 'Silent buyer', hint: 'Perlu dikirim', tone: 'sky' },
  cancelled: { label: 'Dibatalkan', hint: 'Stok dikembalikan', tone: 'red' },
  pending: { label: 'Menunggu bayar', hint: 'Belum dibayar', tone: 'amber' },
};

/** Fallback Rp125.000 dipertahankan dari versi lama untuk pesanan tanpa total. */
export const orderTotal = (total: number | null | undefined): number => total || 125000;

/** Pesanan yang sudah dibayar dan menunggu dikirim (lunas + silent buyer). */
export const isShippable = (state: OrderState): boolean => state === 'paid' || state === 'silent';
