import asyncio
import logging
from collections import OrderedDict
from typing import Optional
import edge_tts

try:
    from backend.tts_config import (
        DEFAULT_VOICE,
        ALLOWED_VOICES,
        DEFAULT_RATE,
        DEFAULT_PITCH,
        get_configured_voice,
        get_configured_rate,
        get_configured_pitch,
        get_tts_settings,
    )
except ImportError:
    from tts_config import (
        DEFAULT_VOICE,
        ALLOWED_VOICES,
        DEFAULT_RATE,
        DEFAULT_PITCH,
        get_configured_voice,
        get_configured_rate,
        get_configured_pitch,
        get_tts_settings,
    )

logger = logging.getLogger("chinese_tts")

MAX_TEXT_LENGTH = 20
TTS_TIMEOUT_SECONDS = 15
CACHE_MAX_ITEMS = 256

# In-memory LRU cache keyed by (voice, rate, pitch, text) storing MP3 bytes.
# Touched only from the asyncio event loop thread.
tts_cache: OrderedDict[tuple[str, str, str, str], bytes] = OrderedDict()


class TtsValidationError(ValueError):
    """Raised when text parameter fails length or CJK validation."""
    pass


class TtsUnavailableError(RuntimeError):
    """Raised when TTS service fails, times out, or returns no audio."""
    pass


def validate_text(text: str) -> str:
    """
    Strips whitespace and verifies that text:
    - is non-empty,
    - does not exceed MAX_TEXT_LENGTH (20 characters),
    - contains at least one CJK Unified Ideograph (range U+4E00 to U+9FFF).
    Returns the stripped text or raises TtsValidationError.
    """
    clean_text = text.strip() if text else ""
    if not clean_text:
        raise TtsValidationError("Text cannot be empty.")

    if len(clean_text) > MAX_TEXT_LENGTH:
        raise TtsValidationError(
            f"Text length ({len(clean_text)}) exceeds maximum allowed limit of {MAX_TEXT_LENGTH} characters."
        )

    # Check for CJK Unified Ideographs (U+4E00 - U+9FFF)
    has_cjk = any('\u4e00' <= char <= '\u9fff' for char in clean_text)
    if not has_cjk:
        raise TtsValidationError("Text must contain Chinese characters (CJK Unified Ideographs).")

    return clean_text


async def synthesize_mp3(
    text: str,
    voice: str,
    rate: str = DEFAULT_RATE,
    pitch: str = DEFAULT_PITCH,
) -> bytes:
    """
    Synthesize speech audio for the given text using edge-tts.
    Iterates communicate.stream() and appends audio chunks to a bytearray.
    Returns the MP3 bytes or raises TtsUnavailableError.
    """
    async def _stream_audio() -> bytes:
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        audio_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk.get("type") == "audio":
                data = chunk.get("data")
                if data:
                    audio_buffer.extend(data)

        if not audio_buffer:
            raise TtsUnavailableError("Received empty audio stream from TTS provider.")
        return bytes(audio_buffer)

    try:
        return await asyncio.wait_for(_stream_audio(), timeout=TTS_TIMEOUT_SECONDS)
    except Exception as exc:
        logger.exception(
            "TTS synthesis failed for voice '%s' (rate=%s, pitch=%s): %s",
            voice,
            rate,
            pitch,
            exc,
        )
        raise TtsUnavailableError("Pronunciation audio is temporarily unavailable.") from None


def get_cached_audio(
    voice: str,
    rate_or_text: str,
    pitch: Optional[str] = None,
    text: Optional[str] = None,
) -> Optional[bytes]:
    """
    Retrieve audio from LRU cache if available.
    Supports either (voice, rate, pitch, text) or (voice, text).
    """
    if pitch is not None and text is not None:
        key = (voice, rate_or_text, pitch, text)
    else:
        # Backward compatibility for (voice, text)
        key = (voice, DEFAULT_RATE, DEFAULT_PITCH, rate_or_text)

    if key in tts_cache:
        tts_cache.move_to_end(key)
        return tts_cache[key]
    return None


def store_cached_audio(
    voice: str,
    rate_or_text: str,
    pitch_or_data: str | bytes,
    text: Optional[str] = None,
    data: Optional[bytes] = None,
) -> None:
    """
    Store audio in LRU cache, evicting oldest item when capacity reached.
    Supports either (voice, rate, pitch, text, data) or (voice, text, data).
    """
    if text is not None and data is not None and isinstance(pitch_or_data, str):
        key = (voice, rate_or_text, pitch_or_data, text)
        payload = data
    else:
        # Backward compatibility for (voice, text, data)
        key = (voice, DEFAULT_RATE, DEFAULT_PITCH, rate_or_text)
        payload = pitch_or_data if isinstance(pitch_or_data, bytes) else b""

    tts_cache[key] = payload
    tts_cache.move_to_end(key)
    if len(tts_cache) > CACHE_MAX_ITEMS:
        tts_cache.popitem(last=False)
