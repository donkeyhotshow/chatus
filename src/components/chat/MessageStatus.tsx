"use client";

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

interface MessageStatusProps {
  status: MessageStatusType;
  className?: string;
  showLabel?: boolean;
}

/**
 * Этап 9: Message Status Indicators
 * Индикаторы статуса сообщений как в WhatsApp/Telegram
 * - sending: часы (анимация)
 * - sent: одна галочка серая
 * - delivered: две галочки серые
 * - read: две галочки фиолетовые
 * - error: красный восклицательный знак
 */
const MessageStatus = memo(function MessageStatus({
  status,
  className,
  showLabel = false
}: MessageStatusProps) {
  const statusConfig = {
    sending: {
      icon: Clock,
      color: 'text-white/40',
      label: 'Отправка...',
      animate: true,
    },
    sent: {
      icon: Check,
      color: 'text-white/50',
      label: 'Отправлено',
      animate: false,
    },
    delivered: {
      icon: CheckCheck,
      color: 'text-white/50',
      label: 'Доставлено',
      animate: false,
    },
    read: {
      icon: CheckCheck,
      color: 'text-violet-400',
      label: 'Прочитано',
      animate: false,
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-400',
      label: 'Ошибка',
      animate: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1",
        className
      )}
      aria-label={config.label}
      role="status"
    >
      <motion.div
        animate={config.animate ? { rotate: 360 } : {}}
        transition={config.animate ? {
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        } : {}}
      >
        <Icon
          className={cn(
            "w-3.5 h-3.5 transition-colors duration-200",
            config.color,
            status === 'read' && "drop-shadow-[0_0_3px_rgba(139,92,246,0.5)]"
          )}
        />
      </motion.div>
      {showLabel && (
        <span className={cn(
          "text-[10px] font-medium",
          config.color
        )}>
          {config.label}
        </span>
      )}
    </motion.div>
  );
});

MessageStatus.displayName = 'MessageStatus';

export default MessageStatus;

/**
 * Хелпер для определения статуса сообщения
 */
export function getMessageStatus(message: {
  id: string;
  delivered?: boolean;
  seen?: boolean;
}): MessageStatusType {
  // Временные сообщения (еще отправляются)
  if (message.id.startsWith('temp_')) {
    return 'sending';
  }

  // Прочитано
  if (message.seen) {
    return 'read';
  }

  // Доставлено
  if (message.delivered) {
    return 'delivered';
  }

  // Отправлено (есть ID, но не доставлено)
  return 'sent';
}
