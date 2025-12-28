/**
 * Export Dialog Component
 *
 * Диалог экспорта рисунка в разнрматах.
 */

'use client';

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Image, FileImage, Share2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ExportFormat = 'png' | 'jpeg' | 'webp';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, quality: number) => Promise<Blob | null>;
  onSendToChat?: () => void;
}

const EXPORT_FORMATS: { id: ExportFormat; label: string; description: string; icon: typeof Image }[] = [
  { id: 'png', label: 'PNG', description: 'Без потерь, прозрачность', icon: Image },
  { id: 'jpeg', label: 'JPEG', description: 'Меньший размер', icon: FileImage },
  { id: 'webp', label: 'WebP', description: 'Современный формат', icon: FileImage },
];

const QUALITY_PRESETS = [
  { value: 100, label: 'Максимум', description: 'Без сжатия' },
  { value: 90, label: 'Высокое', description: 'Рекомендуется' },
  { value: 75, label: 'Среднее', description: 'Баланс' },
  { value: 50, label: 'Низкое', description: 'Минимальный размер' },
];

export const ExportDialog = memo(function ExportDialog({
  isOpen,
  onClose,
  onExport,
  onSendToChat,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(90);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Генерация превью
  const generatePreview = useCallback(async () => {
    const blob = await onExport(selectedFormat, quality);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return url;
    }
    return null;
  }, [onExport, selectedFormat, quality]);

  // Скачивание файла
  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await onExport(selectedFormat, quality);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `drawing-${Date.now()}.${selectedFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  }, [onExport, selectedFormat, quality]);

  // Копирование в буфер обмена
  const handleCopyToClipboard = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await onExport('png', 100);
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    } finally {
      setIsExporting(false);
    }
  }, [onExport]);

  // Cleanup preview URL
  const handleClose = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onClose();
  }, [previewUrl, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-md"
          >
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Экспорт рисунка
                </h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Format selection */}
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                    Формат
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {EXPORT_FORMATS.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                        className={cn(
                          "p-3 rounded-xl border transition-all text-center",
                          selectedFormat === format.id
                            ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                            : "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50"
                        )}
                      >
                        <format.icon className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-sm font-medium">{format.label}</div>
                        <div className="text-[10px] opacity-70">{format.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality selection (not for PNG) */}
                {selectedFormat !== 'png' && (
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                      Качество: {quality}%
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {QUALITY_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setQuality(preset.value)}
                          className={cn(
                            "p-2 rounded-lg border transition-all text-center",
                            quality === preset.value
                              ? "bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)]"
                              : "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50"
                          )}
                        >
                          <div className="text-xs font-medium">{preset.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  {/* Download button */}
                  <button
                    onClick={handleDownload}
                    disabled={isExporting}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                      "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-hover)] text-white",
                      "hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    )}
                  >
                    {isExporting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    Скачать {selectedFormat.toUpperCase()}
                  </button>

                  {/* Secondary actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Copy to clipboard */}
                    <button
                      onClick={handleCopyToClipboard}
                      disabled={isExporting}
                      className={cn(
                        "py-2.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                        "bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)]",
                        "hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-[var(--success)]" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Копировать
                        </>
                      )}
                    </button>

                    {/* Send to chat */}
                    {onSendToChat && (
                      <button
                        onClick={() => {
                          onSendToChat();
                          handleClose();
                        }}
                        className={cn(
                          "py-2.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                          "bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)]",
                          "hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <Share2 className="w-4 h-4" />
                        В чат
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default ExportDialog;
