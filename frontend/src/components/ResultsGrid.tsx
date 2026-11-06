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
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1B] dark:text-[#F2F1EC]">
            Results
          </h2>
          {status === 'loading' && (
            <Loader2 className="w-4 h-4 text-[#E5674F] animate-spin" aria-label="Loading results" />
          )}
          {detections.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FDE2DE] text-[#C0392B] dark:bg-[#4C1D15] dark:text-[#F5B4A3]">
              {detections.length}
            </span>
          )}
        </div>
        {detections.length > 0 && (
          <span className="text-xs text-[#6B6B66] dark:text-[#A0A09B] hidden sm:inline ml-auto">
            Tap card to highlight box
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {/* Initial Idle State */}
        {status === 'idle' && (
          <div className="h-64 sm:h-80 flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/40 dark:bg-[#1A1C20]/40">
            <div className="w-12 h-12 mb-3 rounded-2xl bg-white/60 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              <Sparkles className="w-6 h-6 text-[#E5674F]" />
            </div>
            <p className="text-sm font-semibold text-[#1D1D1B] dark:text-[#F2F1EC] mb-1">
              No results yet
            </p>
            <p className="text-xs text-[#6B6B66] dark:text-[#A0A09B] max-w-xs">
              Start your device camera or upload a photo to detect Chinese vocabulary in real time.
            </p>
          </div>
        )}

        {/* Loading State */}
        {status === 'loading' && detections.length === 0 && (
          <div className="h-64 sm:h-80 flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-[#1A1C20]/40">
            <Loader2 className="w-8 h-8 text-[#E5674F] animate-spin mb-3" />
            <p className="text-sm font-semibold text-[#1D1D1B] dark:text-[#F2F1EC] mb-1">
              Analyzing image...
            </p>
            <p className="text-xs text-[#6B6B66] dark:text-[#A0A09B]">
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
            <p className="text-sm font-semibold text-[#1D1D1B] dark:text-[#F2F1EC] mb-1">
              No objects detected
            </p>
            <p className="text-xs text-[#6B6B66] dark:text-[#A0A09B] max-w-xs mb-3">
              No objects matched above the current {Math.round(threshold * 100)}% confidence threshold.
            </p>
            <span className="text-[11px] text-[#6B6B66] dark:text-[#A0A09B]">
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
            <p className="text-sm font-semibold text-[#1D1D1B] dark:text-[#F2F1EC] mb-1">
              Detection failed
            </p>
            <p className="text-xs text-[#6B6B66] dark:text-[#A0A09B] max-w-xs mb-3">
              Unable to analyze frame. Please verify the backend model status above and try again.
            </p>
          </div>
        )}

        {/* Detected Objects List */}
        {detections.map((detection) => (
          <ResultCard
            key={`${detection.vocab_id}-${detection.box.join(',')}`}
            detection={detection}
            isSelected={selectedVocabId === detection.vocab_id}
            onSelect={() => {
              if (selectedVocabId === detection.vocab_id) {
                onSelectDetection(null);
              } else {
                onSelectDetection(detection.vocab_id);
              }
            }}
            onError={onError}
          />
        ))}
      </div>
    </div>
  );
};
