'use client';

import { memo, useCallback, useState, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, LogOut, X, Check } from 'lucide-react';
import { FocusTrap } from '@/components/accessibility/FocusTrap';

type DialogType = 'danger' | 'warning' | 'info';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  icon?: ReactNode;
}

const typeConfig = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    confirmBg: 'bg-red-500 hover:bg-red-600',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    confirmBg: 'bg-yellow-500 hover:bg-yellow-600 text-black',
  },
  info: {
    icon: Check,
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
    confirmBg: 'bg-violet-500 hover:bg-violet-600',
  },
};

export const ConfirmationDialog = memo(function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  type = 'warning',
  icon,
}: ConfirmationDialogProps) {
  const config = typeConfig[type];
  const IconComponent = config.icon;

  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100%-32px)] max-w-md"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
            onKeyDown={handleKeyDown}
          >
            <FocusTrap active={isOpen}>
              <div className="bg-[#1A1A1C] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center`}
                    >
                      {icon || <IconComponent className={`w-6 h-6 ${config.iconColor}`} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h2
                        id="dialog-title"
                        className="text-lg font-semibold text-white mb-1"
           >
                        {title}
                      </h2>
                      <p
                        id="dialog-description"
                        className="text-sm text-gray-400 leading-relaxed"
                      >
                        {message}
                      </p>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={onClose}
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                      aria-label="Закрыть"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 h-11 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`flex-1 h-11 px-4 rounded-xl ${config.confirmBg} text-white font-medium transition-colors`}
                    autoFocus
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </FocusTrap>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

// Context for global confirmation dialogs
interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  icon?: ReactNode;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within ConfirmationProvider');
  }
  return context;
}

interface ConfirmationProviderProps {
  children: ReactNode;
}

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ ...options, resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    dialog?.resolve(false);
    setDialog(null);
  }, [dialog]);

  const handleConfirm = useCallback(() => {
    dialog?.resolve(true);
    setDialog(null);
  }, [dialog]);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <ConfirmationDialog
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          type={dialog.type}
          icon={dialog.icon}
        />
      )}
    </ConfirmationContext.Provider>
  );
}

// Preset dialogs
export function useDeleteConfirmation() {
  const { confirm } = useConfirmation();

  return useCallback(
    (itemName: string) =>
      confirm({
        title: 'Удалить?',
        message: `Вы уверены, что хотите удалить "${itemName}"? Это действие нельзя отменить.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        type: 'danger',
        icon: <Trash2 className="w-6 h-6 text-red-400" />,
      }),
    [confirm]
  );
}

export function useExitConfirmation() {
  const { confirm } = useConfirmation();

  return useCallback(
    () =>
      confirm({
        title: 'Выйти?',
        message: 'У вас есть несохранённые изменения. Вы уверены, что хотите выйти?',
        confirmText: 'Выйти',
        cancelText: 'Остаться',
        type: 'warning',
        icon: <LogOut className="w-6 h-6 text-yellow-400" />,
      }),
    [confirm]
  );
}
