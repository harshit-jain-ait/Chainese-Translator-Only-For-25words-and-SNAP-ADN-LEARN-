# Changelog: Animated Panda Mascot Implementation

## Overview
Added an animated flat-style panda mascot matching the provided reference image (`public/assets/panda-reference.png`) to the bottom-left corner of the "Chinese Object Vocabulary Detector" frontend.

---

## Changes by Component & File

### 1. `frontend/src/components/PandaMascot.tsx` (New Component)
- **Vector Artwork (SVG)**:
  - Responsive `viewBox="0 0 200 220"` inline SVG.
  - White circular head with thick dark charcoal outline (`#2B2A28`, stroke width 6).
  - Two dark rounded ears with subtle inner highlights.
  - Large tilted teardrop eye patches enclosing glossy white eyes and dark pupils.
  - Centered dark oval snout with a sweet curved smile.
  - Rounded white body with dark left arm and bottom feet.
  - Dark teal smartphone (`#3E8E8A`) with rounded corners, dark outline, and light cyan/teal screen highlight (`#8BE2DC`), held snug by the panda's right arm and paw.
- **Interactivity & State**:
  - Clicking the mascot triggers a two-cycle wave animation over 850ms via local `isWaving` state and optional `onClick` callback.
  - Wrapped in a `<button>` with `type="button"`, accessible label `aria-label="Panda mascot, click to wave"`, and visible focus ring (`focus-visible:ring-2 focus-visible:ring-[#E5674F]`).
  - SVG element marked with `aria-hidden="true"` and `role="presentation"`.

### 2. `frontend/src/index.css` (Animations & Transitions)
- **CSS Keyframes**:
  - `panda-bob`: 4px vertical floating bob on a 3-second `ease-in-out` infinite loop.
  - `panda-blink`: Natural vertical eye scale compression to `0.1` for ~140ms on a 4.8-second loop.
  - `panda-tilt`: Subtle ±3° head tilt on a 5-second `ease-in-out` loop (`transform-origin: 100px 105px`).
  - `panda-wave`: 15° rotation oscillation on the right arm and smartphone (`transform-origin: 138px 145px`). Triggered on `:hover` and click `.panda-waving`.
- **Accessibility & Reduced Motion**:
  - Embedded inside `@media (prefers-reduced-motion: reduce)` to freeze all animations and transforms.
- **Hardware Acceleration**:
  - Utilizes `transform` and `opacity` only (`will-change: transform`).

### 3. Responsive Positioning & Dark Mode
- **Positioning**:
  - `position: fixed; bottom: 16px; left: 16px; z-index: 40;`
  - Wrapper styled with `pointer-events: none` and mascot button with `pointer-events: auto` to prevent interfering with surrounding page controls.
  - Hidden on ultra-narrow viewports below 480px (`hidden min-[480px]:block`).
- **Responsive Dimensions**:
  - Desktop ($\ge$ 1024px): 120px wide
  - Tablet (640px to 1023px): 96px wide
  - Mobile (480px to 639px): 72px wide
- **Dark Mode**:
  - Light mode: Soft drop shadow `drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]`.
  - Dark mode: Ambient white glow `dark:drop-shadow-[0_0_14px_rgba(255,255,255,0.3)]` for high contrast against dark glass backgrounds.

### 4. `frontend/src/App.tsx`
- Mounted `<PandaMascot />` at the root layout level.

### 5. `frontend/src/test/PandaMascot.test.tsx` (Test Suite)
- Validated `aria-hidden="true"` and `role="presentation"` on SVG.
- Validated `pointer-events: none` on outer wrapper and `pointer-events: auto` on interactive button.
- Validated click wave animation dispatch.

### 6. Reference Asset
- Copied uploaded reference image to `frontend/public/assets/panda-reference.png`.
