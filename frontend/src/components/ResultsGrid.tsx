import React from 'react';
import { Sparkles, Loader2, SearchX, AlertTriangle } from 'lucide-react';
import { Detection, AppStatus } from '../types';
import { ResultCard } from './ResultCard';

interface ResultsGridProps {
  detections: Detection[];
  selectedVocabId: number | null;
  onSelectDetection: (id: number | null) => void;
  status: AppStatus;
  threshold: number;
  onError?: (message: string) => void;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({
  detections,
  selectedVocabId,
  onSelectDetection,
  status,
  threshold,
  onError,
}) => {
  return (
    <div className="w-full flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Results
          </h2>
          {status === 'loading' && (
            <Loader2 className="w-4 h-4 text-[#E5674F] animate-spin" />
          )}
          {detections.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {detections.length}
            </span>
          )}
        </div>
        {detections.length > 0 && (
          <span className="text-xs text-gray-400">
            Tap card to highlight box
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {/* Initial Idle State */}
        {status === 'idle' && (
          <div className="h-64 sm:h-80 flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 bg-white/40 dark:bg-[#1A1C20]/40">
            <div className="w-12 h-12 mb-3 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              <Sparkles className="w-6 h-6 text-[#E5674F]" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              No results yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
              Start your device camera or upload a photo to detect Chinese vocabulary in real time.
            </p>
          </div>
        )}

        {/* Loading State */}
        {status === 'loading' && detections.length === 0 && (
          <div className="h-64 sm:h-80 flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-[#1A1C20]/40">
            <Loader2 className="w-8 h-8 text-[#E5674F] animate-spin mb-3" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Analyzing image...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Zero-shot matching against 25 vocabulary targets with OWLv2
            </p>
          </div>
        )}

        {/* Empty State: Scanned but found nothing */}
        {status === 'empty' && (
          <div className="h-64 sm:h-80 flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-dashed border-amber-300/60 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10">
            <div className="w-12 h-12 mb-3 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <SearchX className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              No objects detected
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-3">
              No objects matched above the current {Math.round(threshold * 100)}% confidence threshold.
            </p>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              Try adjusting the confidence slider or framing objects closer to the camera.
            </span>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && detections.length === 0 && (
          <div className="h-64 sm:h-80 flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/10">
            <div className="w-12 h-12 mb-3 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Detection failed
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
              Unable to complete object detection. Please verify server connectivity and retry.
            </p>
          </div>
        )}

        {/* Results List */}
        {detections.length > 0 &&
          detections.map((det) => (
            <ResultCard
              key={det.vocab_id}
              detection={det}
              isSelected={selectedVocabId === det.vocab_id}
              onSelect={() =>
                onSelectDetection(selectedVocabId === det.vocab_id ? null : det.vocab_id)
              }
              onError={onError}
            />
          ))}
      </div>
    </div>
  );
};

