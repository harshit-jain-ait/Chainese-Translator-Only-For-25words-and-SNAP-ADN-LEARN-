import React, { useState, useEffect, useCallback } from 'react';

export type ModelHealthStatus = 'loading' | 'ready' | 'unavailable';

interface NavbarProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: (e?: React.MouseEvent) => void;
  onOpenVocabModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme: controlledTheme,
  onToggleTheme,
  onOpenVocabModal,
}) => {
  // Theme state: supports controlled (via App.tsx) and uncontrolled (for standalone usage/tests)
  const [internalTheme, setInternalTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cov_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (document.documentElement.classList.contains('dark')) return 'dark';
      if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) return 'dark';
    }
    return 'light';
  });

  const activeTheme = controlledTheme ?? internalTheme;
  const isDark = activeTheme === 'dark';

  const handleToggleTheme = (e: React.MouseEvent) => {
    if (onToggleTheme) {
      onToggleTheme(e);
    } else {
      const next = isDark ? 'light' : 'dark';
      setInternalTheme(next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('cov_theme', next);
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  // Model health state
  const [healthStatus, setHealthStatus] = useState<ModelHealthStatus>('loading');

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        setHealthStatus('unavailable');
        return;
      }
      const data = await res.json();
      const isReady =
        (data.status === 'ok' || data.status === 'ready' || data.model_status === 'ready') &&
        data.model_loaded !== false &&
        data.status !== 'unavailable' &&
        data.model_status !== 'unavailable';

      if (isReady) {
        setHealthStatus('ready');
      } else {
        setHealthStatus('unavailable');
      }
    } catch {
      setHealthStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Scroll to vocabulary section smoothly or immediately based on user motion preference
  const handleShowAllWords = () => {
    if (onOpenVocabModal) {
      onOpenVocabModal();
    }
    const section =
      document.getElementById('vocab-section') ||
      document.getElementById('vocabulary') ||
      document.querySelector('[data-testid="vocab-section"]');
    if (section && typeof section.scrollIntoView === 'function') {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      section.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  // Status pill appearance mapping
  const statusConfig = {
    ready: {
      text: 'Model Ready',
      containerClass:
        'bg-[#D1FAE5] border-[#A7F3D0] text-[#047857] dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300',
      dotClass: 'bg-[#10B981]',
    },
    loading: {
      text: 'Loading model…',
      containerClass:
        'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309] dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300',
      dotClass: 'bg-[#F59E0B] animate-pulse',
    },
    unavailable: {
      text: 'Model unavailable',
      containerClass:
        'bg-[#FEE2E2] border-[#FECACA] text-[#B91C1C] dark:bg-red-950/60 dark:border-red-800 dark:text-red-300',
      dotClass: 'bg-[#EF4444]',
    },
  }[healthStatus];

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8 mt-4 flex justify-center">
      <nav aria-label="Main" className="w-full max-w-5xl mx-auto">
        <div className="w-full min-h-[64px] h-16 py-2 px-3 sm:px-4 flex items-center justify-between rounded-full bg-white dark:bg-[#24231F] border border-[#E5E7EB] dark:border-[#3A3934] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06),0_2px_6px_-1px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4)] transition-colors">
          {/* Left Group: Logo, Divider, Title */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* 1. Logo tile: 48px rounded square with gradient & viewfinder brackets */}
            <div
              className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-[#E5674F] to-[#C0392B] shadow-[0_4px_14px_rgba(229,103,79,0.35)] relative flex items-center justify-center shrink-0 select-none"
              aria-hidden="true"
            >
              {/* White viewfinder-style corner bracket frame */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none p-1.5"
                viewBox="0 0 48 48"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {/* Top-left */}
                <path d="M10 18V13a3 3 0 0 1 3-3h5" />
                {/* Top-right */}
                <path d="M30 10h5a3 3 0 0 1 3 3v5" />
                {/* Bottom-left */}
                <path d="M10 30v5a3 3 0 0 0 3 3h5" />
                {/* Bottom-right */}
                <path d="M30 38h5a3 3 0 0 0 3-3v-5" />
              </svg>
              {/* Centered character 词 */}
              <span
                lang="zh-Hans"
                className="text-white text-xl font-bold font-chinese select-none leading-none z-10"
              >
                词
              </span>
            </div>

            {/* 2. Vertical divider */}
            <div
              className="hidden sm:block h-6 w-px bg-[#D6D6D2] dark:bg-[#3A3934] shrink-0"
              aria-hidden="true"
            />

            {/* 3. Title: "Snap and learn" with spark SVG */}
            <div className="hidden sm:flex items-center text-lg sm:text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F2F1EC] select-none">
              <span>Snap and&nbsp;</span>
              <span className="relative inline-flex items-center text-[#E5674F]">
                <span>learn</span>
                {/* Red spark strokes */}
                <svg
                  className="absolute -top-1.5 -right-3.5 w-3.5 h-3.5 text-[#E5674F] overflow-visible"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="3" y1="11" x2="8" y2="3" />
                  <line x1="6" y1="11" x2="13" y2="7" />
                </svg>
              </span>
            </div>
          </div>

          {/* Right Group: Status Pill, Theme Toggle, Divider, Action Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* 4. Status pill */}
            <div
              role="status"
              aria-live="polite"
              aria-label={statusConfig.text}
              title={statusConfig.text}
              className={`inline-flex items-center gap-2 px-2.5 py-1.5 lg:px-3 lg:py-1 rounded-full border text-xs sm:text-sm font-medium transition-colors ${statusConfig.containerClass}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dotClass}`} />
              <span className="hidden lg:inline">{statusConfig.text}</span>
            </div>

            {/* 5. Theme toggle */}
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="Toggle dark mode"
              aria-pressed={isDark}
              className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2C2B26] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F] focus-visible:ring-offset-2"
            >
              {/* Crescent moon icon */}
              <svg
                className="w-5 h-5 text-[#0F172A] dark:text-[#F2F1EC] transition-transform duration-200"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </button>

            {/* 6. Vertical divider */}
            <div
              className="hidden sm:block h-6 w-px bg-[#D6D6D2] dark:bg-[#3A3934] shrink-0"
              aria-hidden="true"
            />

            {/* 7. Primary action button: Show all 25 words */}
            <button
              id="show-all-words-btn"
              type="button"
              onClick={handleShowAllWords}
              className="min-h-[44px] px-3.5 sm:px-5 py-2 rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white text-xs sm:text-sm font-medium shadow-sm transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F] focus-visible:ring-offset-2 inline-flex items-center gap-1.5 sm:gap-2 shrink-0 select-none"
            >
              <span className="hidden sm:inline">Show all 25 words</span>
              <span className="sm:hidden">All 25 words</span>
              {/* Right arrow icon */}
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
