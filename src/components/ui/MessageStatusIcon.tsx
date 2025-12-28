"use client

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
    className: 'text-white/40 animate-pulse',
  },
  sent: {
    icon: Check,
    label: 'Отправлено',
    className: 'text-white/60',
  },
  delivered: {
    icon: CheckCheck,
    label: 'Доставлено',
    className: 'text-white/60',
  },
  read: {
    icon: CheckCheck,
    label: 'Прочитано',
    className: 'text-[#60A5FA]', // Blue color for read status
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
      <Icon className={cn('w-3.5 h-3.5', config.className)} />
      {showLabel && (
        <span className={cn('text-xs', config.className)}>{config.label}</span>
      )}
    </span>
  );
});

export default MessageStatusIcon;
