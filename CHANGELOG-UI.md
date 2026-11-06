# Frontend UI Audit & Hardening Changelog (CHANGELOG-UI.md)

## Summary of Fixes

### 1. API Integration (`src/api/client.ts`)
- **Single API Module with Relative Paths**: Removed all hardcoded localhost fallback URLs from components; all requests now uniformly route through relative `/api` paths handled by the Vite proxy and FastAPI.
- **Unified Error Handling**: Parses both standard FastAPI `{"detail": "..."}` and hardened backend `{"error": {"code": "...", "message": "..."}}` payloads.
- **Specific HTTP Status Mapping**:
  - `503`: Mapped to `MODEL_UNAVAILABLE` ("Model is currently initializing or unavailable. Please wait a moment and try again.").
  - `413`: Mapped to `FILE_TOO_LARGE` ("Image file is too large. Maximum allowed size is 10 MB.").
  - `400`: Mapped to `INVALID_IMAGE` ("Unsupported or corrupted image file. Please use JPEG, PNG, or WebP.").
  - `422`: Mapped to `VALIDATION_ERROR` ("Invalid request parameters.").
  - Network Disconnect: Mapped to `NETWORK_ERROR` ("Cannot connect to backend server. Please verify the service is running.").
- **AbortController Integration**: Added `AbortSignal` support to all requests; starting a new detection automatically aborts stale in-flight requests so slower previous requests cannot overwrite newer results.

### 2. Upload and Camera Flow (`src/hooks/useDetector.ts`)
- **Strict Client-side Validation**: Validates MIME types (`image/jpeg`, `image/png`, `image/webp`) and strictly rejects files > 10 MB before transmitting.
- **File Input Reset**: Resets file input value after selection so choosing the same image consecutively triggers `onChange`.
- **Enhanced Camera Permissions & Errors**: Added dedicated checks for `NotAllowedError`, `NotFoundError`, and insecure contexts (`!window.isSecureContext`), presenting clear guidance.
- **Zero Memory Leaks**: Automatically revokes Object URLs with `URL.revokeObjectURL()` on file changes and component unmount.
- **State Hygiene**: Switching between camera feed and uploaded photo immediately clears stale detection bounding boxes and results.

### 3. Detection and Live Mode (`src/hooks/useDetector.ts`)
- **Ref Guard for Live Mode**: Uses `inFlightRef` guard inside the `~1.5s` detection loop so requests never overlap or pile up if inference takes longer than the interval.
- **Visibility-Aware Scanning**: Automatically pauses live detection when the tab becomes inactive (`document.visibilitychange`) to conserve CPU/battery.
- **Graceful Warmup**: Silently skips camera capture when `video.videoWidth === 0` during camera warmup without throwing alarming error toasts.

### 4. Bounding Box Overlay & Letterboxing (`src/utils/coordinateMapping.ts` & `src/components/OverlayLayer.tsx`)
- **Mathematical Letterbox Mapping**: Pure function `calculateLetterbox()` accurately accounts for `object-fit: contain` scaling, aspect ratio differences, and letterbox/pillarbox padding on any screen size.
- **Dynamic ResizeObserver**: Uses `ResizeObserver` on `StagePanel` to recompute dimensions on orientation changes, window resizes, and DPI scaling.
- **Adaptive Label Positioning**: Implemented `computeLabelPosition()`:
  - Positions chip labels above the bounding box by default.
  - Automatically flips the label below the box when near the top stage ceiling.
  - Clamps labels horizontally within stage margins.
- **High-Contrast Design Colors**: Applied `#E5674F` for bounding box outlines and `#C0392B` for chip badges with white bold typography.

### 5. Results Grid & Deduplication (`src/components/ResultsGrid.tsx`, `ResultCard.tsx`)
- **Deterministic Deduplication & Sorting**: Deduplicates detections by `vocab_id` keeping only the highest confidence score, sorted descending.
- **Clear State Segregation**:
  - `idle`: Friendly initial call-to-action before detection runs.
  - `loading`: Non-blocking spinner and status indicator.
  - `empty`: Helpful message when scanning finishes with 0 items above threshold.
  - `error`: Clear diagnostic feedback without breaking the view.
  - `ready`: List of cards with confidence pill and measure words.

### 6. Vocabulary Modal (`src/components/VocabList.tsx`)
- **Self-Contained Loader & Retry**: "Show all 25 words" modal includes its own loading skeleton, error message with "Retry Loading" button, and search filtering. Failure to fetch vocab does not crash or block camera detection.

### 7. Accessibility (WCAG 2.1 AA)
- **Semantic Controls**: Live-detect toggle button is built with `role="switch"` and `aria-checked`.
- **Screen Reader Pronunciation**: Chinese characters have `lang="zh-Hans"` attributes so screen readers apply proper Mandarin pronunciation.
- **Keyboard Navigation**: Real `<button>` elements with visible focus rings (`focus:ring-2 focus:ring-[#E5674F]`), Enter/Space selection on cards, and `Escape` key support to dismiss toasts and modals.
- **Aria Live Regions**: Status line uses `aria-live="polite"` and alert banner uses `aria-live="assertive"`.

### 8. Architectural Refactoring
- Split monolithic `App.tsx` (469 lines) into cohesive, single-responsibility modules:
  - `StagePanel` & `OverlayLayer`
  - `Controls`
  - `ResultsGrid` & `ResultCard`
  - `VocabList`
  - `ToastContainer`
  - `StatusBanner`
  - `useDetector` hook
  - `api/client.ts`

### 9. Test Suite Verification
- Added 18 comprehensive frontend Vitest tests:
  - `coordinateMapping.test.ts`: 6 pure-function tests for letterbox scaling, pillarboxing, and label flipping.
  - `ResultsGrid.test.tsx`: 4 tests for deduplication, sorting, empty states, and `lang="zh-Hans"`.
  - `apiClient.test.ts`: 6 tests covering 503, 413, 400, 422, network error mapping, and response parsing.
  - `Controls.test.tsx`: 2 tests for `role="switch"` `aria-checked` toggling and disabled states.
- All 18 frontend tests and 13 backend pytest tests pass with 100% success.

