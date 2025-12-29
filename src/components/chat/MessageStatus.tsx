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
 * - read: две галочки фиолетовые с glow
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
      color: 'text-white/50',
      glowColor: '',
      label: 'Отправка...',
      animate: true,
    },
    sent: {
      icon: Check,
      color: 'text-white/60',
      glowColor: '',
      label: 'Отправлено',
      animate: false,
    },
    delivered: {
      icon: CheckCheck,
      color: 'text-white/70',
      glowColor: '',
      label: 'Доставлено',
      animate: false,
    },
    read: {
      icon: CheckCheck,
      color: 'text-violet-400',
      glowColor: 'drop-shadow-[0_0_6px_rgba(167,139,250,0.8)]',
      label: 'Прочитано',
      animate: false,
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-400',
      glowColor: 'drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]',
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
      transition={{ duration: 0.15 }}
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
        className="relative"
      >
        <Icon
          className={cn(
            "w-4 h-4 transition-all duration-200",
            config.color,
            config.glowColor
          )}
        />
        {/* Extra glow effect for read status */}
        {status === 'read' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 blur-sm"
          >
            <CheckCheck className="w-4 h-4 text-violet-400" />
          </motion.div>
        )}
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
