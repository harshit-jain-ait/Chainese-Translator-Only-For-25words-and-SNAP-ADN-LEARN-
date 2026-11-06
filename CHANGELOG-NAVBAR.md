# Changelog: Top Navigation Bar Implementation

## Overview
Added a floating, pill-shaped top navigation bar matching the design specification and visual reference image. The navbar floats with top margin and a soft shadow, providing branding, real-time backend status, theme toggling, and quick navigation to the vocabulary list.

---

## 1. Components Created & Modified

### `frontend/src/components/Navbar.tsx` (New)
Implemented the floating pill navbar with the exact elements specified from left to right:
1. **Logo Tile**:
   - 48px square tile (`w-12 h-12`) with rounded corners (`rounded-[12px]`).
   - Red gradient from `#E5674F` to `#C0392B` with a soft glow shadow (`shadow-[0_4px_14px_rgba(229,103,79,0.35)]`).
   - Centered white character `词` formatted in Noto Sans SC (`font-chinese`).
   - White viewfinder corner brackets rendered via an inline SVG frame (`aria-hidden="true"`).
2. **Vertical Divider**:
   - 1px line in light gray (`#D6D6D2`, dark mode `#3A3934`), 24px tall (`h-6 w-px`).
3. **Title**:
   - "Snap and learn" in bold sans-serif, dark navy (`#0F172A`, dark mode `#F2F1EC`).
   - "learn" styled in red accent (`#E5674F`).
   - Inline SVG spark strokes (two diagonal strokes) positioned at top-right of "learn".
4. **Status Pill**:
   - Live region (`role="status"`, `aria-live="polite"`).
   - Real backend status tracking via `GET /api/health` on mount:
     - **Ready**: Mint background (`#D1FAE5`), mint border (`#A7F3D0`), green dot (`#10B981`), dark green text (`#047857`) "Model Ready".
     - **Loading**: Amber background (`#FEF3C7`), amber border (`#FDE68A`), amber dot (`#F59E0B animate-pulse`), text "Loading model…".
     - **Unavailable**: Red background (`#FEE2E2`), red border (`#FECACA`), red dot (`#EF4444`), text "Model unavailable".
   - Supports dark mode background adjustments (`dark:bg-emerald-950/60`, etc.).
5. **Theme Toggle**:
   - Circular button (`w-10 h-10 min-h-[44px] min-w-[44px] rounded-full`).
   - Crescent moon inline SVG with stroke dark navy (`#0F172A`, dark mode `#F2F1EC`).
   - Accessible attributes: `aria-label="Toggle dark mode"`, `aria-pressed={isDark}`.
   - Synchronizes with project theme system (`cov_theme` in `localStorage` and `document.documentElement.classList`).
6. **Vertical Divider**:
   - 1px line matching divider style.
7. **Primary Action Button**:
   - Red gradient pill (`#EF4444` to `#DC2626`).
   - White text: "Show all 25 words" (collapses to "All 25 words" on mobile <640px).
   - Right arrow inline SVG.
   - Scrolls smoothly to `#vocab-section` using `scrollIntoView({ behavior: 'smooth' })`, respecting `prefers-reduced-motion: reduce`.
   - Opens vocabulary modal (`onOpenVocabModal`).

### `frontend/src/App.tsx` (Modified)
- Replaced `<Header ... />` with `<Navbar ... />`.
- Wrapped vocabulary modal in `<section id="vocab-section" aria-label="Vocabulary section">` to support smooth scrolling.

### `frontend/src/components/Header.tsx` (Modified)
- Maintained as a backwards-compatible wrapper forwarding props to `Navbar`.

### `frontend/src/test/setup.ts` (Modified)
- Added mock for `window.matchMedia` in JSDOM test environment.

### `frontend/src/test/Navbar.test.tsx` (New)
- Unit test suite verifying:
  - Renders title "Snap and learn" and `词` logo tile.
  - Health check transitions: "Model Ready" on 200 ready, "Model unavailable" on unavailable status or network rejection.
  - Theme toggle interaction and `aria-pressed` state change.
  - Action button triggers smooth `scrollIntoView` and modal callback.

---

## 2. Layout, Responsive Behavior & Styling
- **Sticky Pill**: Floating pill container with `position: sticky; top: 16px; z-index: 50`, `mt-4`, horizontal padding `px-4 sm:px-6 lg:px-8`.
- **Dimensions**: Inner pill height ~64px (`h-16`), `rounded-full`, white background (`dark:bg-[#24231F]`), border `#E5E7EB` (`dark:border-[#3A3934]`).
- **Breakpoints**:
  - `> 1024px`: Full layout with all text labels visible.
  - `640px - 1023px`: Status pill collapses text and shows only the status dot (retaining full status `aria-label`).
  - `< 640px`: Title and left divider hide; logo tile, status dot, theme toggle, and shortened button "All 25 words" fit comfortably without horizontal overflow at 360px viewport width.
- **Accessibility**:
  - Semantic `<header>` wrapping `<nav aria-label="Main">`.
  - Minimum touch targets of 44px (`min-h-[44px]`).
  - Visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#E5674F] focus-visible:ring-offset-2`).
  - Respects `prefers-reduced-motion: reduce` for smooth scrolling.

---

## 3. Verification & Test Results
- **Vitest**: 7 test suites passed, 36 tests passed (100% pass rate).
- **TypeScript**: `tsc && vite build` built production bundle in 758ms with 0 type errors.
- **Backend Tests**: 32 Pytest tests passed in 0.51s.

