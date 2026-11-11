import type { Tone } from './tones';

export type ChannelId = 'shopee' | 'whatsapp';

/** Normalisasi nilai channel dari backend (string bebas) ke dua channel yang dikenal app. */
export const toChannel = (value: string): ChannelId => (value === 'whatsapp' ? 'whatsapp' : 'shopee');

export const CHANNELS: Record<ChannelId, { label: string; short: string; chat: string; tone: Tone; dot: string }> = {
  shopee: { label: 'Shopee Seller', short: 'Shopee', chat: 'Shopee Chat', tone: 'shopee', dot: 'bg-shopee' },
  whatsapp: { label: 'WhatsApp Business', short: 'WhatsApp', chat: 'WhatsApp', tone: 'wa', dot: 'bg-wa' },
};
