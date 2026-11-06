import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  // Listen for Escape key to close the most recent toast
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toasts.length > 0) {
        onDismiss(toasts[toasts.length - 1].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 duration-200 ${
            toast.type === 'error'
              ? 'bg-red-50/95 dark:bg-red-950/90 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800'
              : toast.type === 'success'
              ? 'bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800'
              : 'bg-white/95 dark:bg-[#1A1C20]/90 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800'
          }`}
        >
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          )}
          {toast.type === 'success' && (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs sm:text-sm">
            {toast.title && <div className="font-semibold mb-0.5">{toast.title}</div>}
            <div className="opacity-90">{toast.message}</div>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#E5674F]"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
