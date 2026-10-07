import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  onConfirm,
  onClose,
  variant = 'danger',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform transition-all animate-scale-up"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  variant === 'danger'
                    ? 'bg-red-100 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60'
                    : variant === 'warning'
                    ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                    : 'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3
                id="confirm-dialog-title"
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {message}
          </p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`min-h-[36px] inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-500/30'
                  : variant === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:ring-indigo-500/30'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
