'use client';

import { memo, useCallback, useState, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, LogOut, X } from 'lucide-react';
import { FocusTrap } from '@/components/accessibility/FocusTrap';

type ConfirmType = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  icon?: 'delete' | 'logout' | 'warning';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context.confirm;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, options, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState({ isOpen: false, options: null, resolve: null });
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState({ isOpen: false, options: null, resolve: null });
  }, [state.resolve]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {state.isOpen && state.options && (
          <ConfirmDialogContent
            {...state.options}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

interface ConfirmDialogContentProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

const icons = {
  delete: Trash2,
  logout: LogOut,
  warning: AlertTriangle,
};

const typeStyles = {
  danger: {
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    confirmBg: 'bg-red-500 hover:bg-red-600',
  },
  warning: {
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    confirmBg: 'bg-yellow-500 hover:bg-yellow-600 text-black',
  },
  info: {
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    confirmBg: 'bg-blue-500 hover:bg-blue-600',
  },
};

const ConfirmDialogContent = memo(function ConfirmDialogContent({
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  type = 'danger',
  icon = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogContentProps) {
  const Icon = icons[icon];
  const styles = typeStyles[type];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <FocusTrap active>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
        >
          <div className="bg-[#1A1A1C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="p-6 pt-8 text-center">
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                <Icon className={`w-8 h-8 ${styles.iconColor}`} />
              </div>

              {/* Title */}
              <h2 id="confirm-title" className="text-xl font-bold text-white mb-2">
                {title}
              </h2>

              {/* Message */}
              <p id="confirm-message" className="text-sm text-white/60 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 pt-0">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors min-h-[48px]"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-3 rounded-xl text-white font-medium transition-colors min-h-[48px] ${styles.confirmBg}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </FocusTrap>
    </>
  );
});

// Standalone component for simple usage
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  icon?: 'delete' | 'logout' | 'warning';
}

export const ConfirmDialog = memo(function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  ...props
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <ConfirmDialogContent
          {...props}
          onConfirm={() => {
            onConfirm();
            onClose();
          }}
          onCancel={onClose}
        />
      )}
    </AnimatePresence>
  );
});
