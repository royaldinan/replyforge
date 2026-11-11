import { initials } from '../../lib/format';
import { CHANNELS, cn, type ChannelId } from '../ui';

interface AvatarProps {
  name: string;
  channel: ChannelId;
  size?: 'sm' | 'md';
  /** Warna cincin titik channel harus sama dengan latar di belakang avatar. */
  ringClassName?: string;
}

export const Avatar = ({ name, channel, size = 'md', ringClassName = 'ring-surface' }: AvatarProps) => (
  <span
    aria-hidden="true"
    className={cn(
      'relative inline-grid shrink-0 place-items-center rounded-full bg-nested font-bold text-ink-2 ring-1 ring-inset ring-white/10',
      size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm',
    )}
  >
    {initials(name)}
    <span className={cn('absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2', CHANNELS[channel].dot, ringClassName)} />
  </span>
);
