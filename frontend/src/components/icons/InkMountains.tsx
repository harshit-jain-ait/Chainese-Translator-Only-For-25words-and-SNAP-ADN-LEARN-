import React, { useState } from 'react';

/**
 * InkMountains: Decorative Chinese ink-wash landscape illustration
 * featuring soft layered mountain ridges and a traditional multi-tier pagoda.
 * Designed to sit in the header background without blocking clicks (pointer-events: none).
 * If a custom PNG is placed at /assets/ink-mountains.png, it displays that instead.
 */
export const InkMountains: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [hasImageError, setHasImageError] = useState(false);

  // If a user supplies a PNG at /assets/ink-mountains.png, prefer that image
  if (!hasImageError && typeof window !== 'undefined') {
    return (
      <div className={`pointer-events-none select-none overflow-hidden ${className}`} aria-hidden="true">
        <img
          src="/assets/ink-mountains.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-right opacity-65 dark:opacity-30"
          onError={() => setHasImageError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 520 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="xMaxYMid meet"
      >
        <defs>
          {/* Soft ink washes with linear gradients */}
          <linearGradient id="mistGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="farMountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8A9CA8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="midMountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#556977" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="nearMountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#64748B" stopOpacity="0.1" />
          </linearGradient>

          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E5674F" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#E5674F" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Faint rising morning sun / seal orb */}
        <circle cx="340" cy="65" r="38" fill="url(#sunGlow)" />

        {/* Distant mountain ridges */}
        <path
          d="M160 140 C 210 70, 270 60, 330 110 C 370 75, 420 80, 500 140 L 520 180 L 120 180 Z"
          fill="url(#farMountain)"
        />

        {/* Mid-range peaks */}
        <path
          d="M240 160 C 280 90, 340 85, 390 135 C 430 100, 470 110, 520 155 L 520 180 L 220 180 Z"
          fill="url(#midMountain)"
        />

        {/* Near jagged ridge on the right side under pagoda */}
        <path
          d="M360 170 C 400 120, 440 115, 480 135 C 500 125, 515 130, 520 140 L 520 180 L 340 180 Z"
          fill="url(#nearMountain)"
        />

        {/* Traditional Multi-tier Pagoda silhouette on the right cliff */}
        <g transform="translate(425, 68)" fill="#2F3E46" opacity="0.75">
          {/* Spire / finial */}
          <line x1="16" y1="0" x2="16" y2="8" stroke="#2F3E46" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="16" cy="2" r="1.5" />

          {/* Top roof tier */}
          <path d="M16 6 L 8 13 C 12 12, 20 12, 24 13 Z" />
          {/* Top level body */}
          <rect x="11.5" y="13" width="9" height="6.5" rx="0.5" />

          {/* Middle roof tier */}
          <path d="M16 18 L 5 26 C 11 24.5, 21 24.5, 27 26 Z" />
          {/* Middle level body */}
          <rect x="9.5" y="26" width="13" height="8" rx="0.5" />

          {/* Base roof tier with sweeping eaves */}
          <path d="M16 32 L 2 41 C 10 39, 22 39, 30 41 Z" />
          {/* Base level columns / foundation */}
          <rect x="7" y="41" width="18" height="11" rx="0.5" />
          <rect x="5" y="52" width="22" height="4" rx="1" fill="#202A30" />
        </g>

        {/* Gentle pine trees on the pagoda ridge */}
        <g stroke="#2F3E46" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
          <line x1="412" y1="126" x2="412" y2="136" />
          <path d="M407 130 Q 412 127 417 130" fill="none" />
          <path d="M408 133 Q 412 130 416 133" fill="none" />

          <line x1="465" y1="122" x2="465" y2="132" />
          <path d="M461 126 Q 465 123 469 126" fill="none" />
          <path d="M462 129 Q 465 126 468 129" fill="none" />
        </g>

        {/* Faint mist wash band at bottom to blend with white dialog card */}
        <rect x="0" y="140" width="520" height="40" fill="url(#mistGrad)" />
      </svg>
    </div>
  );
};

