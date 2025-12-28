"use client";

import { memo } from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

interface MessageStatusIconProps {
  status: MessageStatus;
  className?: string;
  showLabel?: boolean;
}

const statusConfig = {
  sending: {
    icon: Clock,
    label: 'Отправка...',
    className: 'text-white/60 animate-pulse',  // Increased contrast
  },
  sent: {
    icon: Check,
    label: 'Отправлено',
    className: 'text-white/70',  // Increased contrast
  },
  delivered: {
    icon: CheckCheck,
    label: 'Доставлено',
    className: 'text-white/70',  // Increased contrast
  },
  read: {
    icon: CheckCheck,
    label: 'Прочитано',
    className: 'text-violet-300 drop-shadow-[0_0_4px_rgba(167,139,250,0.6)]', // Brighter violet with glow
  },
  error: {
    icon: AlertCircle,
    label: 'Ошибка отправки',
    className: 'text-red-400',
  },
};

export const MessageStatusIcon = memo(function MessageStatusIcon({
  status,
  className,
  showLabel = false,
}: MessageStatusIconProps) {
  const config = statusConfig[status] || statusConfig.sent;
  const Icon = config.icon;

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      title={config.label}
      role="status"
      aria-label={config.label}
    >
      <Icon className={cn('w-4 h-4', config.className)} />
      {showLabel && (
        <span className={cn('text-xs', config.className)}>{config.label}</span>
      )}
    </span>
  );
});

export default MessageStatusIcon;
