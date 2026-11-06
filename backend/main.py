import io
import logging
import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, status, Response, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

from detector import ChineseObjectDetector
from tts import (
    MAX_TEXT_LENGTH,
    validate_text,
    synthesize_mp3,
    get_cached_audio,
    store_cached_audio,
    TtsValidationError,
    TtsUnavailableError,
)
from tts_config import (
    ALLOWED_VOICES,
    get_configured_voice,
    get_tts_settings,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("chinese_api")

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/bmp",
}

detector = ChineseObjectDetector()


def get_cors_origins(cors_env: Optional[str] = None) -> list[str]:
    """Parse comma-separated allowed CORS origins from env or fallback to defaults."""
    raw = cors_env if cors_env is not None else os.getenv("CORS_ORIGINS", "")
    if not raw or not raw.strip():
        return ["http://localhost:5173", "http://127.0.0.1:5173"]
    origins = [orig.strip() for orig in raw.split(",") if orig.strip()]
    return origins if origins else ["http://localhost:5173", "http://127.0.0.1:5173"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Chinese Object Vocabulary Detector API...")
    try:
        detector.load_model()
    except Exception as e:
        logger.warning(
            f"Model not immediately preloaded at startup (will lazy-load on first detect request): {e}"
        )
    yield
    logger.info("Shutting down Chinese Object Vocabulary Detector API...")


app = FastAPI(
    title="Chinese Object Vocabulary Detector API",
    version="1.0.0",
    description="Zero-shot object detection and Chinese vocabulary learning assistant powered by OWLv2.",
    lifespan=lifespan,
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", summary="Health and Model Status")
async def health_check():
    """Return API health status, loaded device, vocabulary count, and TTS status."""
    voice = get_configured_voice()
    tts_status = "available" if voice in ALLOWED_VOICES else "unavailable"
    model_status = "ready" if detector.is_loaded else "loading"
    return {
        "status": "ok",
        "model_loaded": detector.is_loaded,
        "model_status": model_status,
        "device": detector.device,
        "vocab_count": len(detector.vocab),
        "tts": tts_status,
    }


@app.get("/api/vocab", summary="Full 25 Vocabulary Items")
async def get_vocabulary():
    """Return the complete 25-item Chinese vocabulary list with measure words."""
    return detector.vocab


@app.api_route("/api/speak", methods=["GET", "HEAD"], summary="Chinese Pronunciation Audio")
async def speak_text(
    request: Request,
    text: str = Query(
        ...,
        min_length=1,
        max_length=MAX_TEXT_LENGTH,
        description="Chinese text to pronounce (max 20 characters)",
    )
):
    """
    Synthesize neural Chinese audio for vocabulary characters.
    Caches audio by (voice, text) and serves with audio/mpeg headers.
    """
    try:
        clean_text = validate_text(text)
    except TtsValidationError as val_err:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "invalid_text",
                    "message": str(val_err),
                },
                "detail": str(val_err),
            },
        )

    voice, rate, pitch = get_tts_settings()
    logger.debug(
        "TTS request for voice '%s', rate: '%s', pitch: '%s', text length: %d",
        voice,
        rate,
        pitch,
        len(clean_text),
    )

    # 1. Check LRU cache first
    cached_audio = get_cached_audio(voice, rate, pitch, clean_text)
    if cached_audio is not None:
        body = b"" if request.method == "HEAD" else cached_audio
        return Response(
            content=body,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "public, max-age=86400",
                "Content-Length": str(len(cached_audio)),
            },
        )

    # 2. Synthesize MP3 on cache miss
    try:
        audio_bytes = await synthesize_mp3(clean_text, voice, rate=rate, pitch=pitch)
        store_cached_audio(voice, rate, pitch, clean_text, audio_bytes)
        body = b"" if request.method == "HEAD" else audio_bytes
        return Response(
            content=body,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "public, max-age=86400",
                "Content-Length": str(len(audio_bytes)),
            },
        )
    except TtsUnavailableError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": {
                    "code": "tts_unavailable",
                    "message": "Pronunciation audio is temporarily unavailable.",
                },
                "detail": "Pronunciation audio is temporarily unavailable.",
            },
        )


@app.post("/api/detect", summary="Detect Objects in Image")
async def detect_objects(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WebP, max 10MB)"),
    threshold: Optional[float] = Form(
        0.50,
        description="Confidence score threshold between 0.01 and 0.99 (default: 0.50 - objects under 50% are discarded)",
    ),
):
    """
    Accepts an uploaded image, runs zero-shot object detection with OWLv2
    against the Chinese vocabulary list, and returns bounding boxes,
    Simplified Chinese characters, pinyin, English meaning, and measure words.
    """
    # 1. Validate MIME type
    content_type = file.content_type or ""
    if content_type.lower() not in ALLOWED_MIME_TYPES:
        # Also check common file extensions if content_type is generic
        filename = (file.filename or "").lower()
        valid_extensions = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
        if not any(filename.endswith(ext) for ext in valid_extensions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{content_type}'. Please upload JPEG, PNG, or WebP image.",
            )

    # 2. Validate file size (max 10MB)
    try:
        # Read up to MAX_FILE_SIZE_BYTES + 1 to detect over-size streaming without loading arbitrary large files into memory
        file_bytes = await file.read(MAX_FILE_SIZE_BYTES + 1)
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE if hasattr(status, "HTTP_413_CONTENT_TOO_LARGE") else 413,
                detail="File size exceeds maximum allowed limit of 10 MB.",
            )
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    # 3. Open image using Pillow
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()  # Verify integrity
        # Reopen since verify closes/invalidates the stream
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupted or invalid image data: {str(e)}",
        )

    # 4. Validate threshold (default: 0.50 -> min 50% confidence required)
    conf_threshold = 0.50
    if threshold is not None:
        try:
            conf_threshold = max(0.01, min(0.99, float(threshold)))
        except (ValueError, TypeError):
            conf_threshold = 0.50

    # 5. Run detection
    try:
        results = detector.detect(image, threshold=conf_threshold)
        return results
    except Exception as e:
        logger.exception("Error during detection execution")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Detection engine error: {str(e)}",
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_msg = exc.errors()[0].get("msg", "Invalid request parameters") if exc.errors() else "Validation error"
    code = "invalid_text" if request.url.path.endswith("/speak") else "validation_error"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": code,
                "message": error_msg,
            },
            "detail": exc.errors(),
        },
    )


from fastapi.staticfiles import StaticFiles

# Mount static frontend build if it exists (allows http://localhost:8000 to serve the entire app)
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

