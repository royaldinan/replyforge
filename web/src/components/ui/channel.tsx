import { cn } from './cn';
import { CHANNELS, type ChannelId } from './channels';
import { Badge } from './primitives';

export const ChannelDot = ({ channel, className }: { channel: ChannelId; className?: string }) => (
  <span aria-hidden="true" className={cn('inline-block h-2 w-2 shrink-0 rounded-full', CHANNELS[channel].dot, className)} />
);

export const ChannelBadge = ({ channel, long = false }: { channel: ChannelId; long?: boolean }) => (
  <Badge tone={CHANNELS[channel].tone}>
    <ChannelDot channel={channel} />
    {long ? CHANNELS[channel].label : CHANNELS[channel].short}
  </Badge>
);
