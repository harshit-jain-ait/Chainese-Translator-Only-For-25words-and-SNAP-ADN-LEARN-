import React, { useState } from 'react';
import { VocabItem } from '../types';
import { getObjectIcon } from './icons/ObjectIcons';
import { playHanzi } from '../speech';

interface VocabCardProps {
  item: VocabItem;
  isActive?: boolean;
  onSelect?: (id: number) => void;
  onError?: (message: string) => void;
}

export const VocabCard: React.FC<VocabCardProps> = ({
  item,
  isActive = false,
  onSelect,
  onError,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;

    setIsPlaying(true);
    try {
      await playHanzi(item.hanzi);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not play pronunciation. Try again.';
      onError?.(msg);
    } finally {
      setIsPlaying(false);
    }
  };

  // Alternating tile tints matching reference (pale red, pale blue, pale neutral)
  const tileBackground =
    item.id % 3 === 1
      ? 'bg-[#FDF2F0] dark:bg-red-950/30'
      : item.id % 3 === 2
      ? 'bg-[#F0F7FF] dark:bg-sky-950/30'
      : 'bg-[#F7F7F8] dark:bg-[#2C2B26]';

  return (
    <div
      role="article"
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onSelect?.(item.id)}
      className={`relative p-4 sm:p-5 rounded-[20px] border transition-all duration-200 select-none flex items-start gap-3.5 sm:gap-4 ${
        isActive
          ? 'bg-[#FEF2F2] dark:bg-red-950/20 border-[#F87171] ring-1 ring-[#F87171]/50 shadow-md'
          : 'bg-white dark:bg-[#24231F] border-[#EEF0F2] dark:border-[#3A3934] shadow-sm hover:shadow-md'
      }`}
    >
      {/* 1. Number Badge overlapping top-left corner */}
      <span
        className="absolute -top-2.5 left-4 z-10 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FDE2DE] text-[#C0392B] border border-red-200/50 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900/50 shadow-xs"
        aria-label={`Item number ${item.id}`}
      >
        #{item.id}
      </span>

      {/* 2. 72px Icon Tile with soft tinted background */}
      <div
        className={`w-[72px] h-[72px] shrink-0 rounded-[16px] flex items-center justify-center p-2 mt-1 ${tileBackground}`}
        aria-hidden="true"
      >
        {getObjectIcon(item.id)}
      </div>

      {/* 3. Text & Details Block */}
      <div className="flex-1 min-w-0 pr-1">
        {/* Row 1: Hanzi & Pinyin */}
        <div className="flex items-baseline flex-wrap gap-x-2">
          <span
            lang="zh-Hans"
            className="text-2xl sm:text-3xl font-bold font-chinese text-[#111827] dark:text-[#F2F1EC] leading-tight"
          >
            {item.hanzi}
          </span>
          <span className="text-base sm:text-lg font-bold text-[#DC2626] leading-tight">
            {item.pinyin}
          </span>
        </div>

        {/* Row 2: English Translation */}
        <p className="text-sm sm:text-base font-medium text-[#1F2937] dark:text-[#D1D0CA] mt-1 truncate">
          {item.en}
        </p>

        {/* Row 3: Measure Word & Query Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {/* Measure word chip */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3F4F6] dark:bg-[#302F2B] text-xs text-[#4B5563] dark:text-[#A8A7A1]">
            {/* Book icon */}
            <svg
              className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">量词:</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">{item.measure}</span>
          </div>

          <span className="hidden sm:inline text-gray-300 dark:text-gray-700" aria-hidden="true">
            |
          </span>

          {/* Detection query chip */}
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F3F4F6] dark:bg-[#302F2B] text-[11px] font-mono text-[#4B5563] dark:text-[#A8A7A1]">
            <span>query: &quot;{item.detect_as}&quot;</span>
          </div>
        </div>
      </div>

      {/* 4. Speaker Button at top-right */}
      <button
        type="button"
        onClick={handleSpeak}
        disabled={isPlaying}
        aria-label={`Play pronunciation of ${item.en}`}
        className={`w-10 h-10 min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center shrink-0 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F] focus-visible:ring-offset-2 ${
          isActive
            ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#302F2B] dark:hover:bg-[#3D3C36] text-gray-700 dark:text-gray-200'
        } ${isPlaying ? 'opacity-70 cursor-not-allowed' : 'active:scale-90 cursor-pointer'}`}
      >
        {isPlaying ? (
          <svg
            className="w-4 h-4 animate-spin text-current"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-current"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>
    </div>
  );
};

