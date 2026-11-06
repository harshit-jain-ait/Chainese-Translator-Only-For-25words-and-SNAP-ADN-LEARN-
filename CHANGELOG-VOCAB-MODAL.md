# Changelog: View All Vocabulary Modal

## Overview
Implemented the **"View All Vocabulary"** modal in the "Chinese Object Vocabulary Detector" frontend, closely matching the design and layout of the reference image. The modal features a rounded glass-style floating dialog, decorative Chinese landscape artwork with layered ink mountains and pagoda, full-text bilingual search, 25 vector object icons, and interactive audio pronunciation cards with active detection highlighting.

---

## 1. Components Created & Modified

### `frontend/src/components/icons/InkMountains.tsx` (New)
- Created an inline SVG component rendering misty ink-wash mountain ridges and a traditional multi-tier Chinese pagoda silhouette.
- Uses soft gray/blue-gray gradient washes (`url(#nearMountain)`, `url(#midMountain)`, `url(#farMountain)`) and rising sun orb.
- Non-blocking (`pointer-events: none`, `aria-hidden="true"`).
- Gracefully checks for `/assets/ink-mountains.png` and renders it if provided by the user.

### `frontend/src/components/icons/ObjectIcons.tsx` (New)
- Hand-crafted flat, colorful vector icons in a `0 0 64 64` viewBox for all 25 vocabulary items:
  - 1. Book (书), 2. Pen / Pencil (笔), 3. Paper (纸), 4. Notebook (本子), 5. Backpack (书包)
  - 6. Mobile Phone (手机), 7. Computer (电脑), 8. Key (钥匙), 9. Wallet (钱包), 10. Wristwatch (手表)
  - 11. Glasses (眼镜), 12. Umbrella (雨伞), 13. Table (桌子), 14. Chair (椅子), 15. Bed (床)
  - 16. Door (门), 17. Window (窗户), 18. Mirror (镜子), 19. Television (电视), 20. Cup / Mug (杯子)
  - 21. Bowl (碗), 22. Plate (盘子), 23. Chopsticks (筷子), 24. Spoon (勺子), 25. Bottle (瓶子)
  - Generic fallback for unmapped IDs.
- Exports `getObjectIcon(id: number): React.ReactNode`.

### `frontend/src/components/VocabCard.tsx` (New)
- Vocabulary card with:
  1. Top-left overlapping item number badge `#{id}` with `#FDE2DE` pale red background and `#C0392B` text.
  2. 72px square icon tile with soft tinted background (alternating pale red, pale blue, and pale neutral).
  3. Text details:
     - Row 1: Hanzi in large bold font (`2rem`, `Noto Sans SC`, `lang="zh-Hans"`) + Pinyin in accent red `#DC2626`.
     - Row 2: English name in medium dark gray `#1F2937`.
     - Row 3: Measure word pill chip ("量词: ...") with book icon and detection query chip (`query: "..."`).
  4. Speaker button (40px circular button) calling `playHanzi(item.hanzi)` with loading spinner and disabled state while playing.
  5. Active state: when `isActive` is true, highlights with red border `#F87171`, red background tint `#FEF2F2`, solid red speaker button `#DC2626`, and `aria-current="true"`.
  6. Dark mode styling: card `#24231F`, border `#3A3934`, text `#F2F1EC`.

### `frontend/src/components/VocabModal.tsx` (New)
- Glass-style dialog rendered via `createPortal` to `document.body`:
  - Backdrop: `fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[4px]`. Clicking backdrop closes dialog.
  - Shell: `max-w-[1100px]`, `max-h-[90vh]`, `rounded-[28px]`, `bg-white/95 dark:bg-[#1C1B19]/95 backdrop-blur-md`, 1px border, large soft shadow.
  - Header:
    - 56px logo tile with red gradient (`#E5674F` to `#C0392B`), soft red glow shadow, and white `词` in Noto Sans SC.
    - Title: "All 25 Vocabulary Words" (`id="vocab-modal-title"`).
    - Subtitle: "Learn Chinese, one word at a time" (`id="vocab-modal-subtitle"`).
    - Right: `InkMountains` illustration and 44px circular close button.
  - Search Input:
    - 52px high pill input with search icon and placeholder: `"Search by English, Hanzi, or Pinyin (e.g. 'cup', '手机', 'shū')..."`.
    - Live filtering across English, Hanzi, Pinyin, and `detect_as`.
    - Live region status line: `"Showing N of 25 words"` and clear-search button on empty matches.
  - Cards Grid: 2-column grid (`grid-cols-1 md:grid-cols-2 gap-4`) scrolling independently while header and footer stay fixed.
  - Footer: Bar-chart icon with `"Total Items: 25"` on the left and primary red gradient `"Close"` button on the right.
  - Accessibility & Focus: Escape key handler, focus trap within dialog, focus return to trigger button on close, and body scroll lock (`overflow: hidden`).
  - Motion: 200ms scale/fade transition respecting `prefers-reduced-motion`.

### `frontend/src/speech.ts` (Modified)
- Added `export const speakHanzi = playHanzi;` alias.

### `frontend/src/App.tsx` (Modified)
- Integrated `VocabModal` with `isVocabModalOpen`, `selectedVocabId` (as `activeId`), error toast callback, and retry handler.
- Wired up preloading and loading state for vocabulary data.

### `frontend/src/components/VocabList.tsx` (Modified)
- Retained as a backwards-compatible wrapper delegating to `VocabModal`.

### `frontend/src/test/VocabModal.test.tsx` (New)
- Comprehensive test suite covering:
  - Hidden when `open === false`.
  - Renders title and `"Total Items: 25"` when open.
  - Filtering by English ("cup"), Chinese ("手机"), and empty state.
  - Escape key, backdrop click, and close button actions.
  - Active card highlighting and `aria-current="true"`.
  - Speaker pronunciation click calling `playHanzi` without closing modal.
  - `getObjectIcon` resolution for all 25 items + fallback.

---

## 2. Test & Verification Results
- **Vitest Suite**: 8 test files passed, 43/43 tests passing (`npm test -- --run`).
- **Production Build**: `tsc && vite build` built clean bundle in 694ms with 0 type errors.
- **Backend Pytest**: 32/32 tests passing.

