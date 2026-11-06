import os
import re
import logging

logger = logging.getLogger("chinese_tts_config")

DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"
ALLOWED_VOICES = {
    "zh-CN-XiaoxiaoNeural",
    "zh-CN-YunxiNeural",
    "zh-CN-XiaoyiNeural",
}

DEFAULT_RATE = "+0%"
DEFAULT_PITCH = "+0Hz"

RATE_PATTERN = re.compile(r"^[+-]\d{1,3}%$")
PITCH_PATTERN = re.compile(r"^[+-]\d{1,3}Hz$")


def get_configured_voice() -> str:
    """
    Read TTS_VOICE from environment. If missing or not in ALLOWED_VOICES,
    log a warning and return DEFAULT_VOICE.
    """
    env_voice = os.getenv("TTS_VOICE", "").strip()
    if not env_voice:
        return DEFAULT_VOICE
    if env_voice not in ALLOWED_VOICES:
        logger.warning(
            "Configured TTS_VOICE '%s' is not in ALLOWED_VOICES %s. Falling back to default '%s'.",
            env_voice,
            ALLOWED_VOICES,
            DEFAULT_VOICE,
        )
        return DEFAULT_VOICE
    return env_voice


def get_configured_rate() -> str:
    """
    Read TTS_RATE from environment (e.g. '+0%', '-10%', '+20%').
    If invalid or missing, fall back to DEFAULT_RATE ('+0%').
    """
    env_rate = os.getenv("TTS_RATE", "").strip()
    if not env_rate:
        return DEFAULT_RATE
    if not RATE_PATTERN.match(env_rate):
        logger.warning(
            "Configured TTS_RATE '%s' is invalid (must match ^[+-]\\d{1,3}%%$). Falling back to default '%s'.",
            env_rate,
            DEFAULT_RATE,
        )
        return DEFAULT_RATE
    return env_rate


def get_configured_pitch() -> str:
    """
    Read TTS_PITCH from environment (e.g. '+0Hz', '-5Hz', '+10Hz').
    If invalid or missing, fall back to DEFAULT_PITCH ('+0Hz').
    """
    env_pitch = os.getenv("TTS_PITCH", "").strip()
    if not env_pitch:
        return DEFAULT_PITCH
    if not PITCH_PATTERN.match(env_pitch):
        logger.warning(
            "Configured TTS_PITCH '%s' is invalid (must match ^[+-]\\d{1,3}Hz$). Falling back to default '%s'.",
            env_pitch,
            DEFAULT_PITCH,
        )
        return DEFAULT_PITCH
    return env_pitch


def get_tts_settings() -> tuple[str, str, str]:
    """
    Returns (voice, rate, pitch) configured from environment variables.
    """
    return get_configured_voice(), get_configured_rate(), get_configured_pitch()

