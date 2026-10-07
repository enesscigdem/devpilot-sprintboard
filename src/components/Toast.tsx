import { useEffect, useState, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, X, RotateCcw } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: ToastAction;
  duration?: number;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 3500;
  const remainingTimeRef = useRef(duration);
  const lastStartTimeRef = useRef(Date.now());

  useEffect(() => {
    if (duration <= 0) return;

    if (isPaused) {
      return;
    }

    lastStartTimeRef.current = Date.now();
    const intervalTime = 50;

    const timer = setInterval(() => {
      const elapsed = Date.now() - lastStartTimeRef.current;
      const newRemaining = Math.max(0, remainingTimeRef.current - elapsed);

      setProgress((newRemaining / duration) * 100);

      if (newRemaining <= 0) {
        clearInterval(timer);
        onDismiss(toast.id);
      }
    }, intervalTime);

    return () => {
      const elapsed = Date.now() - lastStartTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      clearInterval(timer);
    };
  }, [isPaused, duration, toast.id, onDismiss]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          container: "border-emerald-500/30 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-emerald-500/10",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
          progress: "bg-emerald-500",
          badge: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
        };
      case "error":
        return {
          container: "border-rose-500/30 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-rose-500/10",
          icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
          progress: "bg-rose-500",
          badge: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50",
        };
      case "info":
      default:
        return {
          container: "border-blue-500/30 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-blue-500/10",
          icon: <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />,
          progress: "bg-blue-500",
          badge: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
        };
    }
  };

  const styles = getToastStyles();
  const isAlert = toast.type === "error";

  return (
    <div
      role={isAlert ? "alert" : "status"}
      aria-live={isAlert ? "assertive" : "polite"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl border p-4 shadow-xl transition-all duration-300 ease-out transform translate-y-0 w-80 sm:w-96 animate-in fade-in slide-in-from-right-5 duration-300 ${styles.container}`}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold leading-tight break-words">
              {toast.title}
            </h4>
          </div>
          {toast.message && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
              {toast.message}
            </p>
          )}
          {toast.action && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {toast.action.label || "Geri al"}
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${styles.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-label="Bildirimler"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-h-[calc(100vh-2rem)] overflow-y-auto p-1 pointer-events-auto"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
