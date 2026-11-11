/** Helper format tampilan yang dipakai bersama oleh semua komponen. */

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 125000 -> "Rp125.000". Nilai tidak valid dianggap 0 supaya UI tidak pernah menampilkan NaN. */
export const formatRupiah = (val: number | null | undefined): string => {
  const n = typeof val === 'number' && Number.isFinite(val) ? val : 0;
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
};

/** 1_250_000 -> "Rp1,3 jt", 85_000 -> "Rp85 rb". Untuk angka ringkas di kartu statistik. */
export const formatRupiahCompact = (val: number): string => {
  const n = Number.isFinite(val) ? val : 0;
  if (n >= 1_000_000) {
    return 'Rp' + (n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  }
  if (n >= 1_000) return 'Rp' + Math.round(n / 1_000).toLocaleString('id-ID') + ' rb';
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
};

const toDate = (value: Date | string | number | null | undefined): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Jam "HH:mm" (pakai titik dua, konsisten di seluruh app). "—" jika tanggal tidak valid. */
export const formatClock = (value: Date | string | number | null | undefined): string => {
  const d = toDate(value);
  return d ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : '—';
};

/** Jam "HH:mm:ss" untuk log audit. */
export const formatClockSeconds = (value: Date | string | number | null | undefined): string => {
  const d = toDate(value);
  return d ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}` : '—';
};

/** Ambil pesan dari error apa pun (bukan hanya instance Error). */
export const toErrorMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Terjadi kesalahan tak terduga';
};

/** "Rina Wati" -> "RW" */
export const initials = (name: string): string => {
  const parts = name
    .replace(/^@/, '')
    .split(/[\s_.-]+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  const second = parts.length > 1 ? (parts[1] ?? '') : '';
  return (first.charAt(0) + second.charAt(0) || first.charAt(0)).toUpperCase();
};

/** Tambahkan "@" hanya untuk handle (tanpa spasi). "Budi Santoso" tetap apa adanya. */
export const asHandle = (buyer: string): string => (/\s/.test(buyer) || buyer.startsWith('@') ? buyer : '@' + buyer);
