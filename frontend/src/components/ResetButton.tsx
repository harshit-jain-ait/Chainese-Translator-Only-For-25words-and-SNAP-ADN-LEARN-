import React from 'react';

interface ResetButtonProps {
  onReset: () => void;
  disabled?: boolean;
  className?: string;
}

export const ResetButton: React.FC<ResetButtonProps> = ({
  onReset,
  disabled = false,
  className = '',
}) => {
  return (
    <div className="relative inline-block group">
      {/* 3 Playful Hover Accent Rays (Top-Right) matching Chinese aesthetic mockup */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        className="absolute -top-3 -right-2.5 w-6 h-6 text-[#B91C1C] dark:text-[#F87171] opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 group-active:opacity-0 transition-all duration-200 pointer-events-none z-20"
        aria-hidden="true"
      >
        {/* Left ray */}
        <line x1="10" y1="24" x2="6" y2="15" />
        {/* Center ray */}
        <line x1="18" y1="22" x2="19" y2="10" />
        {/* Right ray */}
        <line x1="25" y1="23" x2="30" y2="16" />
      </svg>

      {/* Main Pill Button */}
      <button
        type="button"
        onClick={onReset}
        disabled={disabled}
        aria-label="Reset detection and camera"
        title="Reset detection stage and camera"
        className={`relative overflow-hidden inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-2 rounded-full font-medium text-xs sm:text-sm tracking-wide transition-all duration-200 ease-out select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E1B22] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1C1B19] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
          /* Default state */
          'border-[1.5px] border-[#9E1B22] dark:border-[#E54D2E] text-[#8E161C] dark:text-[#FCA5A5] bg-gradient-to-b from-[#FFFFFF] via-[#FFFDFB] to-[#FBF5EE] dark:from-[#26221E] dark:to-[#1C1917] shadow-[0_2px_8px_rgba(158,26,34,0.1),0_1px_2px_rgba(0,0,0,0.04)]'
        } ${
          /* Hover state with vivid red aura */
          'hover:border-[#B91C1C] hover:text-[#9E1B22] dark:hover:text-white hover:bg-gradient-to-b hover:from-[#FFFFFF] hover:via-[#FFF8F3] hover:to-[#FAF0E6] dark:hover:from-[#2F2924] dark:hover:to-[#221D19] hover:shadow-[0_0_22px_rgba(220,38,38,0.45),0_4px_12px_rgba(158,26,34,0.18)] dark:hover:shadow-[0_0_26px_rgba(239,68,68,0.5)]'
        } ${
          /* Active state (solid ruby/crimson fill with white text) */
          'active:border-[#730D12] active:bg-gradient-to-b active:from-[#BD1E26] active:via-[#A3161E] active:to-[#881016] active:text-white active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.35)]'
        } ${className}`}
      >
        {/* Subtle Pagoda & Chinese Cloud Watermark on the Right */}
        <div
          className="absolute right-0 bottom-0 top-0 w-24 pointer-events-none overflow-hidden rounded-r-full opacity-20 dark:opacity-25 group-hover:opacity-30 group-active:opacity-20 transition-opacity z-0"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 100 60"
            fill="currentColor"
            className="w-full h-full object-cover text-[#9E1B22] dark:text-[#F87171] group-active:text-white transition-colors"
          >
            {/* Distant mist / hill silhouette */}
            <path
              d="M10 60 C30 45, 55 52, 75 42 C88 36, 95 38, 100 40 L100 60 Z"
              opacity="0.35"
            />
            {/* Traditional Pagoda Silhouette */}
            <g transform="translate(56, 12) scale(0.65)">
              {/* Spire */}
              <line x1="20" y1="0" x2="20" y2="8" stroke="currentColor" strokeWidth="2" />
              <circle cx="20" cy="2" r="1.5" />
              {/* Top roof */}
              <path d="M20 8 C23 12, 28 13, 34 14 C30 14, 25 14, 20 14 C15 14, 10 14, 6 14 C12 13, 17 12, 20 8 Z" />
              <rect x="16" y="14" width="8" height="5" />
              {/* Middle roof */}
              <path d="M20 19 C24 23, 31 24, 38 25 C33 25, 27 25, 20 25 C13 25, 7 25, 2 25 C9 24, 16 23, 20 19 Z" />
              <rect x="14" y="25" width="12" height="6" />
              {/* Bottom roof */}
              <path d="M20 31 C25 35, 34 36, 42 38 C35 38, 28 38, 20 38 C12 38, 5 38, -2 38 C6 36, 15 35, 20 31 Z" />
              {/* Base platform */}
              <rect x="11" y="38" width="18" height="8" />
              <rect x="8" y="46" width="24" height="4" />
            </g>
          </svg>
        </div>

        {/* 1. Curved Circular Refresh Arrows Icon (Left) */}
        <span className="relative z-10 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 transition-transform duration-500 ease-out group-hover:rotate-180"
            aria-hidden="true"
          >
            {/* Top clockwise arc */}
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            {/* Bottom clockwise arc */}
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M21 21v-5h-5" />
          </svg>
        </span>

        {/* 2. Vertical Divider Line */}
        <span
          className="relative z-10 w-[1.5px] h-4 sm:h-4.5 bg-[#9E1B22]/45 dark:bg-[#F87171]/45 group-hover:bg-[#9E1B22]/70 dark:group-hover:bg-[#F87171]/70 group-active:bg-white/80 transition-colors"
          aria-hidden="true"
        />

        {/* 3. Text Label */}
        <span className="relative z-10 font-semibold tracking-normal pr-1">
          Reset
        </span>
      </button>
    </div>
  );
};
