'use client';

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AtCircle, Info } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackProps {
  type: FeedbackType;
  message: string;
  show: boolean;
  onClose?: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
}

const icons = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: '#10B981',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '#EF4444',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: '#F59E0B',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: '#3B82F6',
  },
};

export const Feedback = memo(function Feedback({
  type,
  message,
  show,
  onClose,
  duration = 3000,
  position = 'top',
}: FeedbackProps) {
  const prefersReducedMotion = useReducedMotion();
  const Icon = icons[type];
  const color = colors[type];

  useEffect(() => {
    if (show && duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{
            opacity: 0,
            y: prefersReducedMotion ? 0 : (position === 'top' ? -20 : 20),
            scale: prefersReducedMotion ? 1 : 0.95,
          }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0,
            y: prefersReducedMotion ? 0 : (position === 'top' ? -20 : 20),
            scale: prefersReducedMotion ? 1 : 0.95,
          }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
          style={{
            position: 'fixed',
            [position]: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            background: color.bg,
            border: `1px solid ${color.border}`,
            borderRadius: '12px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
          role="alert"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: prefersReducedMotion ? 0 : 0.1,
              type: 'spring',
              stiffness: 500
            }}
          >
            <Icon size={20} color={color.icon} />
          </motion.div>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>
            {message}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '4px',
                marginLeft: '8px',
              }}
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// Hook for easy usage
export function useFeedback() {
  const [feedback, setFeedback] = useState<{
    type: FeedbackType;
    message: string;
    show: boolean;
  }>({ type: 'success', message: '', show: false });

  const showFeedback = (type: FeedbackType, message: string) => {
    setFeedback({ type, message, show: true });
  };

  const hideFeedback = () => {
    setFeedback((prev) => ({ ...prev, show: false }));
  };

  return {
    feedback,
    showFeedback,
    hideFeedback,
    success: (message: string) => showFeedback('success', message),
    error: (message: string) => showFeedback('error', message),
    warning: (message: string) => showFeedback('warning', message),
    info: (message: string) => showFeedback('info', message),
  };
}
