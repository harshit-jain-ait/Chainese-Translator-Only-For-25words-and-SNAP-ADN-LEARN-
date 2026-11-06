import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { VocabItem } from '../types';
import { VocabCard } from './VocabCard';
import { InkMountains } from './icons/InkMountains';

interface VocabModalProps {
  open: boolean;
  onClose: () => void;
  vocab: VocabItem[];
  activeId?: number | null;
  onError?: (message: string) => void;
  onRetry?: () => void;
  isLoading?: boolean;
  loadError?: string | null;
}

export const VocabModal: React.FC<VocabModalProps> = ({
  open,
  onClose,
  vocab,
  activeId,
  onError,
  onRetry,
  isLoading = false,
  loadError = null,
}) => {
  const [search, setSearch] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store previous active element to restore focus when closed
  useEffect(() => {
    if (open) {
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        previousActiveElementRef.current = document.activeElement;
      }
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus?.();
    }
  }, [open]);

  // Lock body scroll while open & handle Escape key
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap inside the dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Filter vocabulary by search query
  const filteredVocab = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vocab;
    return vocab.filter(
      (item) =>
        item.en.toLowerCase().includes(q) ||
        item.hanzi.toLowerCase().includes(q) ||
        item.pinyin.toLowerCase().includes(q) ||
        item.detect_as.toLowerCase().includes(q)
    );
  }, [vocab, search]);

  if (!open) return null;

  const content = (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-900/45 backdrop-blur-[4px] animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vocab-modal-title"
        aria-describedby="vocab-modal-subtitle"
        className="relative w-full max-w-[1100px] h-full sm:h-auto sm:max-h-[90vh] flex flex-col rounded-none sm:rounded-[28px] bg-white/95 dark:bg-[#1C1B19]/95 backdrop-blur-md border border-white/60 dark:border-[#3A3934] shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200"
      >
        {/* HEADER: fixed at top of modal */}
        <header className="relative p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800/80 bg-white/60 dark:bg-[#1C1B19]/60 shrink-0">
          {/* Decorative Ink Mountains in top-right background */}
          <InkMountains className="absolute right-0 top-0 h-full w-[420px] max-w-[70%] opacity-70 dark:opacity-30 pointer-events-none" />

          {/* Top row: Logo, Titles, and Close Button */}
          <div className="relative z-10 flex items-start justify-between gap-4">
            {/* Left branding group */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Cloud pattern behind tile */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg
                  className="absolute -inset-2.5 w-[76px] h-[76px] text-[#E5674F] opacity-25 pointer-events-none select-none"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20 60 A16 16 0 0 1 36 44 A24 24 0 0 1 76 44 A18 18 0 0 1 88 62 A14 14 0 0 1 74 76 L26 76 A16 16 0 0 1 20 60 Z" />
                </svg>

                {/* 56px Logo Tile */}
                <div
                  className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#E5674F] to-[#C0392B] shadow-[0_6px_16px_rgba(229,103,79,0.35)] relative flex items-center justify-center select-none"
                  aria-hidden="true"
                >
                  <span
                    lang="zh-Hans"
                    className="text-white text-2xl font-bold font-chinese select-none leading-none z-10"
                  >
                    词
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2
                  id="vocab-modal-title"
                  className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F2F1EC] tracking-tight leading-tight"
                >
                  All 25 Vocabulary Words
                </h2>
                <p
                  id="vocab-modal-subtitle"
                  className="text-xs sm:text-sm text-[#6B6B66] dark:text-[#A8A7A1] mt-0.5"
                >
                  Learn Chinese, one word at a time
                </p>
              </div>
            </div>

            {/* Close Button at top-right */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close vocabulary"
              className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-white dark:bg-[#2C2B26] border border-gray-200/80 dark:border-[#3A3934] shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#383731] transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F] focus-visible:ring-offset-2 shrink-0 cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-current"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* SEARCH FIELD */}
          <div className="relative z-10 mt-5">
            <label htmlFor="vocab-search-input" className="sr-only">
              Search by English, Hanzi, or Pinyin
            </label>
            <div className="relative flex items-center">
              {/* Magnifying glass search icon */}
              <svg
                className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="vocab-search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by English, Hanzi, or Pinyin (e.g. 'cup', '手机', 'shū')..."
                className="w-full h-[52px] pl-12 pr-10 rounded-full bg-white dark:bg-[#24231F] border border-[#E5E7EB] dark:border-[#3A3934] text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F] focus-visible:border-transparent transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search input"
                  className="absolute right-3.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Status Line */}
            <div
              className="mt-2 px-2 text-xs text-gray-500 dark:text-gray-400 font-medium"
              aria-live="polite"
            >
              <span>
                Showing {filteredVocab.length} of {vocab.length} words
              </span>
            </div>
          </div>
        </header>

        {/* DIALOG BODY: Scrollable cards grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 bg-gray-50/40 dark:bg-[#181715]/40">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
              <svg
                className="w-8 h-8 text-[#E5674F] animate-spin mb-3"
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
              <p className="text-sm">Loading vocabulary list…</p>
            </div>
          ) : loadError ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{loadError}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-4 py-2 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Retry Loading
                </button>
              )}
            </div>
          ) : filteredVocab.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                No words match your search.
              </p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-3 px-4 py-1.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVocab.map((item) => (
                <VocabCard
                  key={item.id}
                  item={item}
                  isActive={activeId === item.id}
                  onError={onError}
                />
              ))}
            </div>
          )}
        </div>

        {/* FOOTER: Fixed bar at bottom */}
        <footer className="p-4 sm:px-6 border-t border-[#E5E7EB] dark:border-[#3A3934] bg-white/90 dark:bg-[#1C1B19]/90 backdrop-blur-md flex items-center justify-between shrink-0">
          {/* Left: Total Items count with bar chart icon */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
            {/* Bar chart icon */}
            <svg
              className="w-4 h-4 text-[#E5674F]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Total Items: {vocab.length}</span>
          </div>

          {/* Right: Primary Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2 rounded-full bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs sm:text-sm font-medium shadow-sm transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F] focus-visible:ring-offset-2 cursor-pointer select-none"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};
