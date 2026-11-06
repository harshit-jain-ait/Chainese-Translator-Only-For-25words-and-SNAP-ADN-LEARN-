import React, { useState, useEffect } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { Detection } from '../types';
import { playHanzi, stopSpeech } from '../speech';

interface ResultCardProps {
  detection: Detection;
  isSelected: boolean;
  onSelect: () => void;
  onError?: (message: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  detection,
  isSelected,
  onSelect,
  onError,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const percentage = Math.round(detection.score * 100);

  // Stop any playing audio when the component unmounts
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handleSpeak = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (isPlaying) return;

    setIsPlaying(true);
    try {
      await playHanzi(detection.hanzi);
    } catch {
      onError?.('Could not play pronunciation. Try again.');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#E5674F] ${
        isSelected
          ? 'bg-red-50/80 border-[#E5674F] shadow-md dark:bg-red-950/30 dark:border-[#E5674F]'
          : 'bg-white hover:bg-gray-50/90 border-gray-200/90 shadow-sm dark:bg-[#1A1C20] dark:border-gray-800 dark:hover:bg-[#23262D]'
      }`}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Large Hanzi & Pinyin */}
        <div className="flex flex-col items-start min-w-[70px]">
          <span
            lang="zh-Hans"
            className="text-3xl font-extrabold text-gray-900 dark:text-white hanzi-text tracking-normal leading-none mb-1"
          >
            {detection.hanzi}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-[#C0392B] dark:text-[#E5674F]">
            {detection.pinyin}
          </span>
        </div>

        {/* Middle: English & Measure Word & Listen Button */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {detection.en}
            </h4>
            <button
              type="button"
              onClick={handleSpeak}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              disabled={isPlaying}
              aria-busy={isPlaying}
              aria-label={`Play pronunciation of ${detection.en}`}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-red-50 hover:text-[#C0392B] dark:bg-[#24272E] dark:hover:bg-red-950/50 dark:hover:text-[#F5B4A3] border border-gray-200/90 dark:border-gray-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E5674F] disabled:opacity-60 disabled:cursor-not-allowed select-none"
            >
              {isPlaying ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C0392B] dark:text-[#E5674F]" />
              ) : (
                <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-inherit" />
              )}
              <span>Listen</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-sans">
            <span className="text-gray-400 dark:text-gray-500">量词 (measure word): </span>
            <span lang="zh-Hans" className="font-medium text-gray-800 dark:text-gray-200">
              {detection.measure}
            </span>
          </p>
        </div>

        {/* Right: Confidence Pill Badge */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
              isSelected
                ? 'bg-[#C0392B] text-white'
                : 'bg-[#FCECE8] text-[#C0392B] dark:bg-[#4C1D15] dark:text-[#F5B4A3]'
            }`}
          >
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};
