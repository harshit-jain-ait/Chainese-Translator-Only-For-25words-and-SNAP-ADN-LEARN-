# Changelog: Cherry Blossom Landscape Background & Glassmorphic Layout

## Overview
This update introduces a full-page Japanese/Chinese cherry-blossom landscape background (`/assets/cherry-blossom-bg.jpg`) and restructures the "Chinese Object Vocabulary Detector" layout to match the provided reference design. The layout now features a unified floating pill navbar, a main centered white glass panel enclosing the 4:3 camera stage and the results list, and an aligned glass controls bar.

---

## Changes by Component & File

### 1. `frontend/src/index.css`
- **Full-Page Background**:
  - Attached `background-image: url("/assets/cherry-blossom-bg.jpg")` to `body` with `background-size: cover; background-position: center; background-attachment: fixed; background-color: #FBF3F1;`.
  - Added responsive fallback: `@media (max-width: 768px) { body { background-attachment: scroll; } }` for mobile iOS scroll compatibility.
- **Glass Readability Overlays**:
  - `body::before` pseudo-element: fixed, full-viewport, pointer-events none (`z-index: 0`).
  - Light mode: `linear-gradient(rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15))`.
  - Dark mode (`.dark body::before`): `linear-gradient(rgba(15, 15, 18, 0.78), rgba(15, 15, 18, 0.88))` so the landscape remains subtly visible while providing high contrast.
- **Motion & Accessibility**:
  - Respects `@media (prefers-reduced-motion: reduce)` by disabling transitions and animations.
  - Root container placed at `relative z-1` above overlays.

### 2. `frontend/tailwind.config.js`
- Added design tokens:
  - `accent.light`: `#E5674F`
  - `accent.deep`: `#C0392B`
  - `apptext`: `#1D1D1B`
  - `appmuted`: `#6B6B66`
- Configured Chinese font stack: `Noto Sans SC`, `PingFang SC`, `Microsoft YaHei`, `sans-serif`.

### 3. `frontend/src/App.tsx`
- **Restructured Layout**:
  - Max width constrained to `1100px` across the navbar, main panel, and controls.
  - **Main Glass Card**: `bg-white/85 dark:bg-[#1C1B19]/85 backdrop-blur-[12px] rounded-[24px] border border-white/60 dark:border-[#3A3934]/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] p-5 sm:p-6`.
  - **Two-Column Grid**: Camera stage takes ~60% width (`lg:col-span-7`), and results column takes ~40% width (`lg:col-span-5`) on 1024px+ screens; stacked on smaller screens.
  - **Aligned Controls Bar**: Positioned directly underneath the main card, aligned to the stage column on desktop (`lg:w-[calc((100%-20px)*7/12)]`).
  - Page bottom padding (`pb-8 sm:pb-12`) ensures the scenic landscape wallpaper is visible below the interface.

### 4. `frontend/src/components/StagePanel.tsx`
- Maintained 4:3 aspect ratio (`aspect-[4/3]`) in a dark rounded container (`bg-[#1C1B19] rounded-[16px]`).
- Added 4 corner viewfinder brackets: top-left, top-right, bottom-left, bottom-right (`border-white/40`).
- Configured clean inactive placeholder: Camera outline icon, bold "Camera Feed" heading, and "Point your camera at Chinese objects" subtitle in muted text.
- Retained horizontal camera mirror inversion (`scaleX(-1)`) and OWLv2 SVG detection overlays.

### 5. `frontend/src/components/Controls.tsx`
- **Glass Bar Styling**: `bg-white/85 dark:bg-[#1C1B19]/85 backdrop-blur-[12px] rounded-[20px] p-3 border border-white/60 dark:border-[#3A3934]/80 shadow-md`.
- **Button Controls**:
  - "Stop camera" / "Start camera": Outlined pill button with light gray styling and camera icons.
  - "Switch camera": 44px circular button (`aria-label="Switch camera"`), dynamically hidden when only a single camera is available.
  - "Capture & detect": Solid red gradient pill (`#E5674F` to `#C0392B`) with crosshair icon.
  - "Upload photo": Solid red gradient pill with upload icon; opens native file dialog.
  - "Live detect": Accessible switch toggle (`role="switch"`, `aria-checked`), pushed to the right.
- **Responsiveness**: Formats as a 2-column grid below 640px and wraps cleanly on all screen widths without horizontal overflow. All buttons have touch targets $\ge 44$px and visible focus rings.

### 6. `frontend/src/components/ResultsGrid.tsx` & `ResultCard.tsx`
- Header contains bold "Results" label, a pale-red pill count badge (`bg-[#FDE2DE] text-[#C0392B]`), and the right-aligned muted hint "Tap card to highlight box" (hidden below 640px).
- Result cards styled with semi-transparent glass background, Chinese characters in `Noto Sans SC`, pinyin in `#C0392B`, measure words, $\ge 44$px touch-target "Listen" button with TTS integration, and pale-red confidence pill badges.

### 7. `frontend/src/test/App.test.tsx`
- Added comprehensive integration test verifying that `<App />` mounts and simultaneously renders both the camera controls bar (`role="toolbar"`) and the results column (`h2 "Results"`).

---

## Verification & Test Results
- **Unit & Integration Tests**: 9 test suites, 44 tests passed (`vitest run --run`).
- **Production Build**: `tsc && vite build` completed in 677ms with 0 type errors.
- **Dev Servers**:
  - Backend: Uvicorn running on `http://127.0.0.1:8000` with active OWLv2 model on Apple Silicon (`mps`).
  - Frontend: Vite dev server running on `http://127.0.0.1:5173`.
