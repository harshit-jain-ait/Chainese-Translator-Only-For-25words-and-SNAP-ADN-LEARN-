import asyncio
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app
import tts
from tts import validate_text, TtsValidationError, tts_cache
from tts_config import get_configured_voice, DEFAULT_VOICE, get_configured_rate, get_configured_pitch

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_cache():
    tts_cache.clear()
    yield
    tts_cache.clear()


class FakeCommunicate:
    call_count = 0

    def __init__(self, text, voice, rate="+0%", pitch="+0Hz", *args, **kwargs):
        FakeCommunicate.call_count += 1
        self.text = text
        self.voice = voice
        self.rate = rate
        self.pitch = pitch

    async def stream(self):
        yield {"type": "audio", "data": b"ID3fake"}
        yield {"type": "WordBoundary", "offset": 0, "duration": 0, "text": "瓶"}


class ErrorCommunicate:
    def __init__(self, *args, **kwargs):
        pass

    async def stream(self):
        raise ConnectionResetError("SECRET_INTERNAL_NETWORK_STACK_FAILURE")
        yield {"type": "audio", "data": b""}


class EmptyAudioCommunicate:
    def __init__(self, *args, **kwargs):
        pass

    async def stream(self):
        yield {"type": "WordBoundary", "offset": 0}
        yield {"type": "audio", "data": b""}


class TimeoutCommunicate:
    def __init__(self, *args, **kwargs):
        pass

    async def stream(self):
        await asyncio.sleep(0.5)
        yield {"type": "audio", "data": b"ID3late"}


def test_validate_text_unit():
    # Whitespace trimming
    assert validate_text("   书   ") == "书"
    assert validate_text("\n\t手机\t ") == "手机"

    # Empty text
    with pytest.raises(TtsValidationError, match="Text cannot be empty"):
        validate_text("")
    with pytest.raises(TtsValidationError, match="Text cannot be empty"):
        validate_text("    ")

    # Exceeding MAX_TEXT_LENGTH (20 characters)
    with pytest.raises(TtsValidationError, match="exceeds maximum allowed limit"):
        validate_text("书" * 21)

    # Missing CJK Unified Ideographs
    with pytest.raises(TtsValidationError, match="must contain Chinese characters"):
        validate_text("hello world")
    with pytest.raises(TtsValidationError, match="must contain Chinese characters"):
        validate_text("1234567890")
    with pytest.raises(TtsValidationError, match="must contain Chinese characters"):
        validate_text("!@#$%^&*()")


def test_speak_valid_chinese(monkeypatch):
    FakeCommunicate.call_count = 0
    monkeypatch.setattr(tts.edge_tts, "Communicate", FakeCommunicate)

    response = client.get("/api/speak", params={"text": "瓶子"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/mpeg")
    assert response.headers["cache-control"] == "public, max-age=86400"
    assert int(response.headers["content-length"]) > 0
    assert response.content == b"ID3fake"
    assert FakeCommunicate.call_count == 1


def test_speak_head_request(monkeypatch):
    FakeCommunicate.call_count = 0
    monkeypatch.setattr(tts.edge_tts, "Communicate", FakeCommunicate)

    response = client.head("/api/speak", params={"text": "瓶子"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/mpeg")
    assert response.headers["cache-control"] == "public, max-age=86400"
    assert int(response.headers["content-length"]) > 0
    assert response.content == b""


def test_speak_caching(monkeypatch):
    FakeCommunicate.call_count = 0
    monkeypatch.setattr(tts.edge_tts, "Communicate", FakeCommunicate)

    # First request
    res1 = client.get("/api/speak", params={"text": "电脑"})
    assert res1.status_code == 200
    assert FakeCommunicate.call_count == 1

    # Second identical request should hit cache
    res2 = client.get("/api/speak", params={"text": "电脑"})
    assert res2.status_code == 200
    assert res2.content == res1.content
    assert FakeCommunicate.call_count == 1  # Not called again


def test_speak_empty_text():
    response = client.get("/api/speak", params={"text": ""})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "invalid_text"


def test_speak_text_too_long():
    response = client.get("/api/speak", params={"text": "书" * 21})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "invalid_text"


def test_speak_non_cjk_text():
    response = client.get("/api/speak", params={"text": "hello"})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "invalid_text"
    assert "Chinese characters" in data["error"]["message"]


def test_speak_provider_exception_returns_503_without_leaking_details(monkeypatch):
    monkeypatch.setattr(tts.edge_tts, "Communicate", ErrorCommunicate)

    response = client.get("/api/speak", params={"text": "杯子"})
    assert response.status_code == 503
    data = response.json()
    assert data["error"]["code"] == "tts_unavailable"
    assert data["error"]["message"] == "Pronunciation audio is temporarily unavailable."
    # Ensure sensitive internal traceback/exception text is never exposed
    assert "SECRET_INTERNAL_NETWORK_STACK_FAILURE" not in response.text


def test_speak_empty_audio_stream_returns_503(monkeypatch):
    monkeypatch.setattr(tts.edge_tts, "Communicate", EmptyAudioCommunicate)

    response = client.get("/api/speak", params={"text": "杯子"})
    assert response.status_code == 503
    data = response.json()
    assert data["error"]["code"] == "tts_unavailable"


def test_speak_timeout_returns_503(monkeypatch):
    monkeypatch.setattr(tts, "TTS_TIMEOUT_SECONDS", 0.05)
    monkeypatch.setattr(tts.edge_tts, "Communicate", TimeoutCommunicate)

    response = client.get("/api/speak", params={"text": "杯子"})
    assert response.status_code == 503
    data = response.json()
    assert data["error"]["code"] == "tts_unavailable"


def test_invalid_tts_voice_falls_back_to_default(monkeypatch):
    monkeypatch.setenv("TTS_VOICE", "invalid-arbitrary-voice")
    assert get_configured_voice() == DEFAULT_VOICE

    # Test allowed voice works
    monkeypatch.setenv("TTS_VOICE", "zh-CN-YunxiNeural")
    assert get_configured_voice() == "zh-CN-YunxiNeural"

    # Test rate and pitch fallback
    monkeypatch.setenv("TTS_RATE", "invalid-rate")
    assert get_configured_rate() == "+0%"
    monkeypatch.setenv("TTS_PITCH", "invalid-pitch")
    assert get_configured_pitch() == "+0Hz"


def test_health_includes_tts_status():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["tts"] == "available"
