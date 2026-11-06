import io
from unittest.mock import patch
from fastapi.testclient import TestClient
from PIL import Image

import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app, detector


def create_test_image_bytes(format="PNG", size=(320, 240), color=(255, 0, 0)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data
    assert "device" in data
    assert data["vocab_count"] == 25


def test_vocab_endpoint():
    response = client.get("/api/vocab")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 25
    assert data[0]["hanzi"] == "书"
    assert data[0]["en"] == "Book"
    assert data[24]["hanzi"] == "瓶子"
    assert data[24]["detect_as"] == "bottle"


def test_detect_endpoint_success_with_mocked_model():
    mock_return = {
        "image_width": 320,
        "image_height": 240,
        "detections": [
            {
                "vocab_id": 25,
                "en": "Bottle",
                "hanzi": "瓶子",
                "pinyin": "píngzi",
                "measure": "个 (gè)",
                "score": 0.942,
                "box": [40.0, 30.0, 100.0, 180.0],
            },
            {
                "vocab_id": 20,
                "en": "Cup / Mug",
                "hanzi": "杯子",
                "pinyin": "bēizi",
                "measure": "个 (gè)",
                "score": 0.885,
                "box": [120.0, 50.0, 190.0, 140.0],
            },
        ],
    }

    image_bytes = create_test_image_bytes("PNG")

    with patch.object(detector, "detect", return_value=mock_return) as mock_detect:
        response = client.post(
            "/api/detect",
            files={"file": ("test.png", image_bytes, "image/png")},
            data={"threshold": "0.15"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["image_width"] == 320
        assert data["image_height"] == 240
        assert len(data["detections"]) == 2

        det = data["detections"][0]
        assert det["vocab_id"] == 25
        assert det["hanzi"] == "瓶子"
        assert det["pinyin"] == "píngzi"
        assert det["en"] == "Bottle"
        assert det["measure"] == "个 (gè)"
        assert det["score"] == 0.942
        assert det["box"] == [40.0, 30.0, 100.0, 180.0]

        mock_detect.assert_called_once()


def test_detect_endpoint_defaults_to_50_percent_threshold():
    image_bytes = create_test_image_bytes("PNG")
    mock_return = {"image_width": 100, "image_height": 100, "detections": []}

    with patch.object(detector, "detect", return_value=mock_return) as mock_detect:
        # Omitting threshold param should default to 0.50
        response = client.post(
            "/api/detect",
            files={"file": ("test.png", image_bytes, "image/png")},
        )
        assert response.status_code == 200
        mock_detect.assert_called_once()
        _, kwargs = mock_detect.call_args
        assert kwargs.get("threshold") == 0.50


def test_detect_rejects_invalid_mime_type():
    response = client.post(
        "/api/detect",
        files={"file": ("notes.txt", b"Hello world", "text/plain")},
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Unsupported file format" in data["detail"]


def test_detect_rejects_corrupted_image():
    # Sending fake bytes with image/jpeg mime type
    response = client.post(
        "/api/detect",
        files={"file": ("broken.jpg", b"NOT_A_REAL_IMAGE_DATA_12345", "image/jpeg")},
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Corrupted or invalid image" in data["detail"]


def test_detect_rejects_oversized_file():
    # 10MB + 100 bytes
    large_payload = b"0" * (10 * 1024 * 1024 + 100)
    response = client.post(
        "/api/detect",
        files={"file": ("large.png", large_payload, "image/png")},
    )
    assert response.status_code == 413
    data = response.json()
    assert "detail" in data
    assert "10 MB" in data["detail"]

