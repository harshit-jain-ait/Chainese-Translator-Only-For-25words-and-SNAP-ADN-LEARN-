import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface StatusBannerProps {
  isModelReady: boolean;
  backendError: string | null;
  onRetry: () => void;
  isRetrying: boolean;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  isModelReady,
  backendError,
  onRetry,
  isRetrying,
}) => {
  if (isModelReady && !backendError) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/80 px-4 py-2.5 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            {backendError ||
              'Detection model is currently unavailable or initializing. Detection features are temporarily paused.'}
          </span>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 font-medium text-xs transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>Retry connection</span>
        </button>
      </div>
    </div>
  );
};

