import React, { useState, useCallback } from 'react';

interface PandaMascotProps {
  onClick?: () => void;
  className?: string;
}

export const PandaMascot: React.FC<PandaMascotProps> = ({
  onClick,
  className = '',
}) => {
  const [isWaving, setIsWaving] = useState(false);

  const handleClick = useCallback(() => {
    setIsWaving(true);
    onClick?.();
    setTimeout(() => {
      setIsWaving(false);
    }, 850);
  }, [onClick]);

  return (
    <aside
      className={`fixed bottom-4 left-4 z-40 pointer-events-none hidden min-[480px]:block select-none ${className}`}
      aria-label="Interactive panda mascot"
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Panda mascot, click to wave"
        title="Hi! Click me to wave"
        className="pointer-events-auto cursor-pointer p-1 rounded-2xl bg-transparent border-0 outline-none focus-visible:ring-2 focus-visible:ring-[#E5674F] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121316] transition-transform duration-200 hover:scale-105 active:scale-95 group"
      >
        <div className="panda-bob filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_0_14px_rgba(255,255,255,0.3)]">
          <svg
            viewBox="0 0 200 220"
            className="w-[72px] h-[79px] sm:w-[96px] sm:h-[106px] lg:w-[120px] lg:h-[132px] overflow-visible"
            aria-hidden="true"
            role="presentation"
          >
            {/* 1. Body & Base Group */}
            <g id="panda-body" className="panda-body">
              {/* Feet at bottom */}
              <ellipse
                cx="74"
                cy="192"
                rx="20"
                ry="12"
                transform="rotate(-6 74 192)"
                fill="#2B2A28"
              />
              <ellipse
                cx="126"
                cy="192"
                rx="20"
                ry="12"
                transform="rotate(6 126 192)"
                fill="#2B2A28"
              />

              {/* White rounded body tummy */}
              <path
                d="M 64 116 C 50 136 48 168 68 188 C 80 196 120 196 132 188 C 152 168 150 136 136 116 Z"
                fill="#FFFFFF"
                stroke="#2B2A28"
                strokeWidth="6"
                strokeLinejoin="round"
              />

              {/* Left Arm resting against body */}
              <g id="panda-left-arm" className="panda-left-arm">
                <ellipse
                  cx="50"
                  cy="148"
                  rx="17"
                  ry="28"
                  transform="rotate(22 50 148)"
                  fill="#2B2A28"
                />
              </g>
            </g>

            {/* 2. Head Group (Tilts subtly) */}
            <g id="panda-head" className="panda-head">
              {/* Ears */}
              <ellipse
                cx="52"
                cy="46"
                rx="22"
                ry="22"
                fill="#2B2A28"
              />
              <ellipse
                cx="50"
                cy="44"
                rx="12"
                ry="12"
                fill="#3D3B38"
                opacity="0.4"
              />

              <ellipse
                cx="148"
                cy="46"
                rx="22"
                ry="22"
                fill="#2B2A28"
              />
              <ellipse
                cx="150"
                cy="44"
                rx="12"
                ry="12"
                fill="#3D3B38"
                opacity="0.4"
              />

              {/* Face circle */}
              <circle
                cx="100"
                cy="82"
                r="54"
                fill="#FFFFFF"
                stroke="#2B2A28"
                strokeWidth="6"
              />

              {/* Eye patches */}
              <ellipse
                cx="75"
                cy="80"
                rx="19"
                ry="16"
                transform="rotate(-20 75 80)"
                fill="#2B2A28"
              />
              <ellipse
                cx="125"
                cy="80"
                rx="19"
                ry="16"
                transform="rotate(20 125 80)"
                fill="#2B2A28"
              />

              {/* Eyes with glossy highlights (Blinks periodically) */}
              <g id="panda-eyes" className="panda-eyes">
                {/* Left eye */}
                <circle cx="74" cy="77" r="7.5" fill="#FFFFFF" />
                <circle cx="74" cy="78" r="4.5" fill="#2B2A28" />
                <circle cx="76.5" cy="75" r="1.8" fill="#FFFFFF" />

                {/* Right eye */}
                <circle cx="126" cy="77" r="7.5" fill="#FFFFFF" />
                <circle cx="126" cy="78" r="4.5" fill="#2B2A28" />
                <circle cx="128.5" cy="75" r="1.8" fill="#FFFFFF" />
              </g>

              {/* Nose */}
              <ellipse cx="100" cy="89" rx="7.5" ry="5.5" fill="#2B2A28" />

              {/* Smile */}
              <path
                d="M 91 97 Q 100 106 109 97"
                fill="none"
                stroke="#2B2A28"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </g>

            {/* 3. Right Arm with Teal Smartphone (Waves on click & hover) */}
            <g
              id="panda-right-arm"
              className={`panda-right-arm ${isWaving ? 'panda-waving' : ''}`}
            >
              {/* Smartphone */}
              <rect
                x="114"
                y="112"
                width="46"
                height="74"
                rx="10"
                fill="#3E8E8A"
                stroke="#2B2A28"
                strokeWidth="5.5"
                strokeLinejoin="round"
              />
              {/* Phone screen highlight line */}
              <rect
                x="122"
                y="142"
                width="30"
                height="7.5"
                rx="2"
                fill="#8BE2DC"
              />

              {/* Paw holding the phone */}
              <ellipse
                cx="150"
                cy="148"
                rx="18"
                ry="30"
                transform="rotate(-20 150 148)"
                fill="#2B2A28"
              />
            </g>
          </svg>
        </div>
      </button>
    </aside>
  );
};
