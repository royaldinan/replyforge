export type ClassValue = string | number | false | null | undefined;

/** Gabungkan class secara kondisional (pengganti ringan clsx, tanpa dependency baru). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
