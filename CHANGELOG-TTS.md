# CHANGELOG: Chinese Text-to-Speech (Pronunciation Audio)

This release implements Microsoft Edge neural Chinese voices in the Chinese Object Vocabulary Detector project using `edge-tts` with automatic browser Web Speech API fallback.

## Summary of Changes

### 1. Backend

- **`backend/requirements.txt`**:
  - Pinned `edge-tts==7.3.1` (the newest stable 7.x release with updated Microsoft DRM token compatibility for macOS/Linux/Windows).

- **`backend/tts_config.py`** *(New file)*:
  - Configuration constants:
    - `DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"`
    - `ALLOWED_VOICES = {"zh-CN-XiaoxiaoNeural", "zh-CN-YunxiNeural", "zh-CN-XiaoyiNeural"}`
    - `DEFAULT_RATE = "+0%"`
    - `DEFAULT_PITCH = "+0Hz"`
  - `get_configured_voice()`: Reads `TTS_VOICE` env var, validates against `ALLOWED_VOICES`, logs warning and securely defaults to `DEFAULT_VOICE`.
  - `get_configured_rate()`: Reads `TTS_RATE` env var, validates via regex `^[+-]\d{1,3}%$`, falls back to `+0%` on invalid values.
  - `get_configured_pitch()`: Reads `TTS_PITCH` env var, validates via regex `^[+-]\d{1,3}Hz$`, falls back to `+0Hz` on invalid values.
  - `get_tts_settings()`: Returns `(voice, rate, pitch)`.

- **`backend/tts.py`**:
  - Constants: `MAX_TEXT_LENGTH = 20`, `TTS_TIMEOUT_SECONDS = 15`, `CACHE_MAX_ITEMS = 256`.
  - `validate_text(text: str) -> str`: Strips whitespace, rejects empty text and text > 20 characters, verifies presence of CJK Unified Ideographs (`U+4E00`–`U+9FFF`), and raises `TtsValidationError`.
  - `synthesize_mp3(text: str, voice: str, rate: str, pitch: str) -> bytes`: Streams chunks from `edge_tts.Communicate`, appends audio chunks to a `bytearray`, wraps in `asyncio.wait_for(timeout=15)`, and raises `TtsUnavailableError` without leaking internal stack traces.
  - LRU cache: In-memory `collections.OrderedDict` storing MP3 bytes keyed by `(voice, rate, pitch, text)` with capacity 256.

- **`backend/main.py`**:
  - Registered `/api/speak` endpoint supporting `GET` and `HEAD` methods.
  - Validates `text` query parameter (`min_length=1, max_length=20` and CJK ideographs check).
  - Returns HTTP 422 with `{"error": {"code": "invalid_text", "message": "..."}}` on validation failure.
  - Checks LRU cache and returns cached MP3 bytes on hit.
  - On cache miss, synthesizes via `synthesize_mp3`, stores in LRU cache, and returns `audio/mpeg` with `Cache-Control: public, max-age=86400` and `Content-Length`.
  - Returns HTTP 503 with `{"error": {"code": "tts_unavailable", "message": "Pronunciation audio is temporarily unavailable."}}` on provider error or timeout.
  - `GET /api/health` includes `"tts": "available"` when module is loaded and configured voice is valid (no network call from health).

- **`backend/tests/test_tts.py`**:
  - Comprehensive unit and integration tests using `pytest` monkeypatch:
    - Text validation (whitespace stripping, empty text, character limits, non-CJK characters).
    - Successful MP3 synthesis with mocked `edge_tts.Communicate`.
    - `HEAD` request handling (status 200, valid headers, empty response body).
    - LRU cache hit verification.
    - Error responses: 422 on invalid text, 503 on provider exceptions, empty streams, and timeouts.
    - Sanitized error responses that never leak internal exceptions or tracebacks.
    - `TTS_VOICE`, `TTS_RATE`, and `TTS_PITCH` fallback verification.
    - Health endpoint verification for `"tts": "available"`.

### 2. Frontend

- **`frontend/src/speech.ts`**:
  - `buildSpeakUrl(text: string): string`: Returns relative path `"/api/speak?text=" + encodeURIComponent(text)` without hardcoded host.
  - Module-level singleton `Audio` instance without module-level side effects on import.
  - `playHanzi(text: string): Promise<void>`:
    - Cancels prior requests using an `AbortController` and pauses current audio.
    - Issues `fetch(buildSpeakUrl(text))` with signal cancellation.
    - Creates object URL (`URL.createObjectURL`), revokes previous object URL to avoid memory leaks, and calls `audio.play()`.
    - On HTTP error (503), network failure, or `audio.play()` rejection (e.g. autoplay restriction), automatically triggers fallback to `window.speechSynthesis`.
    - Fallback initializes `SpeechSynthesisUtterance` with `lang="zh-CN"`, `rate=0.9`, and locates a Chinese voice whose lang starts with "zh".
    - Throws `SpeechUnavailableError` if Web Speech API is unsupported.
  - `stopSpeech()`: Aborts pending requests, pauses audio, revokes active blob URL, and cancels `window.speechSynthesis`.
  - Zero browser storage usage (`localStorage` not used).

- **`frontend/src/utils/speech.ts`**:
  - Delegates to `playHanzi` from `../speech` while maintaining backwards-compatible `speakChinese(text)` function.

- **`frontend/src/components/ResultCard.tsx`**:
  - Added speaker `<button>` with Lucide `Volume2` icon and visible label `"Listen"`.
  - Accessible `aria-label="Play pronunciation of {detection.en}"`.
  - Wrapped Chinese characters in `lang="zh-Hans"`.
  - Added loading spinner (`Loader2 animate-spin`) with `aria-busy="true"` and `disabled` state during playback.
  - On failure, triggers error toast ("Could not play pronunciation. Try again.").
  - Prevented click propagation (`e.stopPropagation()`) so clicking "Listen" does not trigger card selection.
  - Cleaned up active audio on unmount (`stopSpeech()`).
  - Touch target height $\ge 44\text{px}$ (`min-h-[44px]`).

- **`frontend/src/test/setup.ts`**:
  - Added JSDOM mocks for `window.speechSynthesis`, `window.SpeechSynthesisUtterance`, `URL.createObjectURL`, and `URL.revokeObjectURL`.

- **`frontend/src/test/speech.test.ts`**:
  - Tests `buildSpeakUrl` relative path and UTF-8 encoding.
  - Tests backend audio playback on 200 response with mocked `fetch` and `Audio`.
  - Tests fallback to `window.speechSynthesis` on HTTP 503 response.
  - Tests fallback on network failure.
  - Tests fallback on audio play rejection (autoplay policy).
  - Tests `stopSpeech` aborting pending requests and pausing audio.

- **`frontend/src/test/ResultCard.test.tsx`**:
  - Tests speaker button rendering, `aria-label`, and `lang="zh-Hans"`.
  - Tests button click calling `playHanzi` once with hanzi text without triggering card selection.
  - Tests loading spinner, `aria-busy="true"`, and disabled state.
  - Tests `onError` callback on playback failure.
  - Tests unmount calling `stopSpeech`.

### 3. Documentation

- **`README.md`**:
  - Added "Pronunciation Audio (Neural TTS & Web Speech Fallback)" section covering `TTS_VOICE`, `TTS_RATE`, `TTS_PITCH`, Microsoft Edge online voices, and browser fallback behavior.
