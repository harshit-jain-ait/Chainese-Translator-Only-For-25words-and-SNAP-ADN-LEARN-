import React from 'react';

/**
 * 25 Hand-crafted flat, colorful vector icons matching each vocabulary item (64x64 viewBox).
 * If a custom PNG exists at /vocab-icons/{id}.png, the component renders that image,
 * otherwise it renders the clean SVG icon.
 */

// 1. Book (书) - Red hardcover open/closed book
export const BookIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="14" y="12" width="36" height="42" rx="4" fill="#DC2626" />
    <path d="M14 12 H22 V54 H14 Z" fill="#991B1B" />
    <path d="M22 14 H48 V52 H22 Z" fill="#F8FAFC" />
    <line x1="28" y1="22" x2="42" y2="22" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="28" y1="30" x2="42" y2="30" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="28" y1="38" x2="38" y2="38" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M14 50 Q 18 52, 22 50 L 22 54 Q 18 56, 14 54 Z" fill="#7F1D1D" />
  </svg>
);

// 2. Pen / Pencil (笔) - Diagonal red writing pencil with wooden tip & graphite lead
export const PenIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <g transform="rotate(-45 32 32)">
      <rect x="26" y="10" width="12" height="34" rx="2" fill="#EF4444" />
      <path d="M26 10 L32 2 L38 10 Z" fill="#FBBF24" />
      <path d="M30 4 L32 2 L34 4 Z" fill="#1E293B" />
      <rect x="26" y="40" width="12" height="6" fill="#94A3B8" />
      <path d="M26 46 Q 32 50, 38 46 L 38 50 Q 32 54, 26 50 Z" fill="#F43F5E" />
    </g>
  </svg>
);

// 3. Paper (纸) - Stack of 3 sheets slightly rotated with soft shadows
export const PaperIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="14" y="20" width="28" height="34" rx="2" transform="rotate(-8 28 37)" fill="#E2E8F0" />
    <rect x="18" y="16" width="28" height="34" rx="2" transform="rotate(4 32 33)" fill="#F1F5F9" />
    <rect x="19" y="14" width="28" height="34" rx="2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
    <line x1="24" y1="22" x2="41" y2="22" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
    <line x1="24" y1="28" x2="41" y2="28" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
    <line x1="24" y1="34" x2="35" y2="34" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 4. Notebook (本子) - Dark brown spiral notebook with red accent band
export const NotebookIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="18" y="10" width="34" height="44" rx="3" fill="#4B3832" />
    <rect x="28" y="10" width="6" height="44" fill="#DC2626" />
    <rect x="18" y="10" width="4" height="44" fill="#2E2320" />
    {/* Spiral wire rings */}
    {[16, 22, 28, 34, 40, 46].map((y) => (
      <ellipse key={y} cx="18" cy={y} rx="4" ry="2" stroke="#D1D5DB" strokeWidth="2" fill="none" />
    ))}
    <rect x="38" y="24" width="10" height="16" rx="1.5" fill="#F8FAFC" />
  </svg>
);

// 5. Backpack (书包) - Blue backpack with straps and zipper pocket
export const BackpackIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <path d="M26 14 C 26 10, 38 10, 38 14" stroke="#1E40AF" strokeWidth="3" fill="none" />
    <path d="M18 24 C 18 16, 46 16, 46 24 L 48 50 C 48 53, 45 55, 42 55 L 22 55 C 19 55, 16 53, 16 50 Z" fill="#2563EB" />
    <rect x="22" y="34" width="20" height="15" rx="3" fill="#3B82F6" />
    <line x1="26" y1="38" x2="38" y2="38" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 26 C 14 24, 18 24, 18 28 L 18 44 C 18 46, 14 46, 14 44 Z" fill="#1D4ED8" />
    <path d="M46 28 C 46 24, 50 24, 50 26 L 50 44 C 50 46, 46 46, 46 44 Z" fill="#1D4ED8" />
  </svg>
);

// 6. Mobile Phone (手机) - Sleek smartphone with screen glow
export const PhoneIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="20" y="8" width="24" height="48" rx="5" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
    <rect x="22" y="13" width="20" height="38" rx="2" fill="#334155" />
    <path d="M22 13 L 42 28 L 42 51 L 22 36 Z" fill="#475569" opacity="0.4" />
    <circle cx="32" cy="11" r="1" fill="#64748B" />
    <rect x="28" y="47" width="8" height="1.5" rx="0.75" fill="#94A3B8" />
  </svg>
);

// 7. Computer (电脑) - Open laptop with glowing blue display
export const ComputerIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="16" y="14" width="32" height="23" rx="2" fill="#334155" />
    <rect x="18" y="16" width="28" height="19" rx="1" fill="#38BDF8" />
    <path d="M10 41 L 54 41 L 51 47 C 51 48, 50 49, 48 49 L 16 49 C 14 49, 13 48, 13 47 Z" fill="#64748B" />
    <rect x="28" y="43" width="8" height="2" rx="0.5" fill="#94A3B8" />
  </svg>
);

// 8. Key (钥匙) - Golden house key with round bow
export const KeyIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <g transform="rotate(-40 32 32)">
      <circle cx="22" cy="32" r="10" fill="#F59E0B" />
      <circle cx="22" cy="32" r="4.5" fill="#FEF3C7" />
      <rect x="30" y="29.5" width="22" height="5" rx="1" fill="#D97706" />
      <rect x="44" y="34.5" width="3" height="4" rx="0.5" fill="#D97706" />
      <rect x="49" y="34.5" width="3" height="5" rx="0.5" fill="#D97706" />
    </g>
  </svg>
);

// 9. Wallet (钱包) - Leather bifold wallet
export const WalletIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="12" y="18" width="40" height="28" rx="4" fill="#854D0E" />
    <path d="M12 24 H52" stroke="#713F12" strokeWidth="2" />
    <path d="M38 27 H52 V37 H38 C 36 37, 36 27, 38 27 Z" fill="#A16207" />
    <circle cx="45" cy="32" r="1.5" fill="#FEF08A" />
  </svg>
);

// 10. Wristwatch (手表) - Modern round watch
export const WatchIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="27" y="8" width="10" height="48" rx="2" fill="#78716C" />
    <circle cx="32" cy="32" r="16" fill="#0F172A" stroke="#E2E8F0" strokeWidth="2.5" />
    <circle cx="32" cy="32" r="13" fill="#1E293B" />
    <line x1="32" y1="32" x2="32" y2="24" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="32" y1="32" x2="38" y2="32" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="32" r="1.5" fill="#EF4444" />
  </svg>
);

// 11. Glasses (眼镜) - Classic round spectacles
export const GlassesIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <circle cx="21" cy="34" r="11" stroke="#0F172A" strokeWidth="3" fill="#E0F2FE" />
    <circle cx="43" cy="34" r="11" stroke="#0F172A" strokeWidth="3" fill="#E0F2FE" />
    <path d="M32 32 Q 32 30, 32 32" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
    <line x1="32" y1="32" x2="32" y2="32" stroke="#0F172A" strokeWidth="3" />
    <path d="M30 32 Q 32 30, 34 32" stroke="#0F172A" strokeWidth="2.5" fill="none" />
    <path d="M10 32 L 6 28" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M54 32 L 58 28" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 12. Umbrella (雨伞) - Red canopy rain umbrella with curved hook handle
export const UmbrellaIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <path d="M32 10 L 32 14" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 34 C 12 20, 52 20, 52 34 Q 42 32, 32 34 Q 22 32, 12 34 Z" fill="#DC2626" />
    <line x1="32" y1="34" x2="32" y2="48" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M32 48 C 32 52, 27 52, 27 48" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

// 13. Table (桌子) - Wooden 4-legged table
export const TableIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <path d="M10 24 L 54 24 L 50 30 L 14 30 Z" fill="#B45309" />
    <rect x="8" y="22" width="48" height="5" rx="1.5" fill="#D97706" />
    <line x1="15" y1="27" x2="15" y2="48" stroke="#92400E" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="22" y1="27" x2="22" y2="44" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="49" y1="27" x2="49" y2="48" stroke="#92400E" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="42" y1="27" x2="42" y2="44" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 14. Chair (椅子) - Wooden dining chair
export const ChairIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="20" y="12" width="4" height="26" rx="1" fill="#78350F" />
    <rect x="40" y="12" width="4" height="26" rx="1" fill="#78350F" />
    <rect x="20" y="16" width="24" height="4" rx="1" fill="#B45309" />
    <rect x="20" y="24" width="24" height="4" rx="1" fill="#B45309" />
    <rect x="16" y="34" width="32" height="5" rx="1.5" fill="#D97706" />
    <line x1="20" y1="39" x2="20" y2="52" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="44" y1="39" x2="44" y2="52" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

// 15. Bed (床) - Cozy bed with pillow & blanket
export const BedIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="10" y="22" width="4" height="28" rx="1" fill="#78350F" />
    <rect x="50" y="30" width="4" height="20" rx="1" fill="#78350F" />
    <rect x="12" y="34" width="40" height="12" rx="2" fill="#E2E8F0" />
    <rect x="15" y="28" width="10" height="7" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
    <rect x="24" y="34" width="28" height="12" rx="2" fill="#3B82F6" />
  </svg>
);

// 16. Door (门) - Panel door with round knob
export const DoorIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="18" y="10" width="28" height="44" rx="2" fill="#92400E" stroke="#78350F" strokeWidth="2" />
    <rect x="22" y="15" width="9" height="16" rx="1" fill="#B45309" />
    <rect x="33" y="15" width="9" height="16" rx="1" fill="#B45309" />
    <rect x="22" y="34" width="9" height="16" rx="1" fill="#B45309" />
    <rect x="33" y="34" width="9" height="16" rx="1" fill="#B45309" />
    <circle cx="42" cy="34" r="2" fill="#FBBF24" />
  </svg>
);

// 17. Window (窗户) - 4-pane window with cross frame
export const WindowIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="16" y="14" width="32" height="36" rx="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="3" />
    <line x1="32" y1="14" x2="32" y2="50" stroke="#0284C7" strokeWidth="2.5" />
    <line x1="16" y1="32" x2="48" y2="32" stroke="#0284C7" strokeWidth="2.5" />
    <rect x="14" y="49" width="36" height="3" rx="1" fill="#0369A1" />
  </svg>
);

// 18. Mirror (镜子) - Oval reflective vanity mirror
export const MirrorIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <ellipse cx="32" cy="30" rx="16" ry="20" fill="#E0F2FE" stroke="#B45309" strokeWidth="3" />
    <path d="M26 18 Q 30 16, 36 20" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <rect x="28" y="50" width="8" height="4" fill="#B45309" />
    <rect x="22" y="54" width="20" height="3" rx="1" fill="#92400E" />
  </svg>
);

// 19. Television (电视) - Modern widescreen flat TV
export const TvIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="12" y="16" width="40" height="26" rx="2" fill="#0F172A" />
    <rect x="14" y="18" width="36" height="22" rx="1" fill="#1E293B" />
    <line x1="18" y1="46" x2="46" y2="46" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
    <line x1="28" y1="42" x2="24" y2="46" stroke="#475569" strokeWidth="2.5" />
    <line x1="36" y1="42" x2="40" y2="46" stroke="#475569" strokeWidth="2.5" />
    <circle cx="46" cy="40" r="0.8" fill="#10B981" />
  </svg>
);

// 20. Cup / Mug (杯子) - Ceramic coffee mug with handle
export const CupIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="18" y="20" width="24" height="26" rx="3" fill="#E5674F" />
    <path d="M42 24 C 48 24, 48 36, 42 36" stroke="#E5674F" strokeWidth="3" fill="none" strokeLinecap="round" />
    <ellipse cx="30" cy="20" rx="12" ry="3" fill="#D3533B" />
    <path d="M26 14 Q 28 10, 26 8" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M32 14 Q 34 10, 32 8" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

// 21. Bowl (碗) - Ceramic food bowl
export const BowlIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <path d="M14 26 C 14 42, 50 42, 50 26 Z" fill="#3B82F6" />
    <ellipse cx="32" cy="26" rx="18" ry="4" fill="#93C5FD" />
    <rect x="26" y="42" width="12" height="3" rx="1" fill="#1D4ED8" />
  </svg>
);

// 22. Plate (盘子) - Round dining plate
export const PlateIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <ellipse cx="32" cy="32" rx="22" ry="14" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
    <ellipse cx="32" cy="32" rx="15" ry="9" fill="#F8FAFC" />
  </svg>
);

// 23. Chopsticks (筷子) - Pair of tapered wooden chopsticks
export const ChopsticksIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <g transform="rotate(30 32 32)">
      <path d="M28 10 L 26 52 L 28 52 L 31 10 Z" fill="#B45309" />
      <path d="M34 10 L 32 52 L 34 52 L 37 10 Z" fill="#92400E" />
    </g>
  </svg>
);

// 24. Spoon (勺子) - Metal soup spoon
export const SpoonIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <g transform="rotate(35 32 32)">
      <ellipse cx="32" cy="18" rx="8" ry="11" fill="#94A3B8" />
      <ellipse cx="32" cy="18" rx="6" ry="9" fill="#CBD5E1" />
      <path d="M30 28 L 30 52 C 30 54, 34 54, 34 52 L 34 28 Z" fill="#94A3B8" />
    </g>
  </svg>
);

// 25. Bottle (瓶子) - Water / drink bottle
export const BottleIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="28" y="10" width="8" height="4" rx="1" fill="#2563EB" />
    <rect x="29" y="14" width="6" height="6" fill="#60A5FA" />
    <path d="M29 20 L 22 28 L 22 52 C 22 54, 24 55, 26 55 L 38 55 C 40 55, 42 54, 42 52 L 42 28 L 35 20 Z" fill="#93C5FD" />
    <rect x="22" y="32" width="20" height="12" fill="#2563EB" />
    <line x1="26" y1="38" x2="38" y2="38" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Fallback Generic Icon
export const GenericObjectIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 select-none pointer-events-none">
    <rect x="16" y="16" width="32" height="32" rx="6" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="2" />
    <circle cx="32" cy="32" r="8" fill="#E5674F" />
  </svg>
);

const iconMap: Record<number, React.FC> = {
  1: BookIcon,
  2: PenIcon,
  3: PaperIcon,
  4: NotebookIcon,
  5: BackpackIcon,
  6: PhoneIcon,
  7: ComputerIcon,
  8: KeyIcon,
  9: WalletIcon,
  10: WatchIcon,
  11: GlassesIcon,
  12: UmbrellaIcon,
  13: TableIcon,
  14: ChairIcon,
  15: BedIcon,
  16: DoorIcon,
  17: WindowIcon,
  18: MirrorIcon,
  19: TvIcon,
  20: CupIcon,
  21: BowlIcon,
  22: PlateIcon,
  23: ChopsticksIcon,
  24: SpoonIcon,
  25: BottleIcon,
};

/**
 * Returns the vector icon for a vocabulary id (1 to 25) with graceful fallback.
 */
export function getObjectIcon(id: number): React.ReactNode {
  const IconComponent = iconMap[id] || GenericObjectIcon;
  return <IconComponent />;
}

