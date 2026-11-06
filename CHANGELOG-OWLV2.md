# CHANGELOG: OWLv2 Object Detection Optimization

This release optimizes the OWLv2 zero-shot detection pipeline in the Chinese Object Vocabulary Detector backend.

## Summary of Changes

### 1. Correct OWLv2 Input Handling (`backend/detector.py`)
- **Square Neutral Padding (`pad_to_square`)**: Images are padded to square dimensions with neutral gray `(128, 128, 128)` added to the bottom and right edges before feeding into the OWLv2 processor. This matches OWLv2's square training aspect ratio and prevents bounding box distortion.
- **Coordinate Unpadding & Clipping (`unpad_and_clip_box`)**: Bounding boxes are mapped back to original image dimensions by clipping coordinates to `[0, 0, orig_w, orig_h]`. Boxes outside the original image area or with non-positive dimensions are discarded.
- **RGB Conversion**: Every image is explicitly converted to RGB before processing to eliminate alpha channel and palette mode issues.
- **Inference Mode & Device/Dtype Precision**: All forward inference uses `torch.inference_mode()`. Device selection uses `float16` on CUDA and `float32` on CPU and Apple Silicon MPS.

### 2. Startup Text Embedding Caching (`backend/detector.py`)
- **Cached Text Embeddings (`_cache_text_embeddings`)**: All 75 expanded vocabulary queries are tokenized and pre-encoded through the OWLv2 text encoder once at application startup.
- **Zero-Redundancy Forward Pass**: Subsequent image detection calls reuse the precomputed `cached_text_embeds`, avoiding redundant text tokenization and text model forward passes on every request.

### 3. Expanded Descriptive Text Queries (`backend/vocab.json`)
- Added a `queries` array to all 25 vocabulary items in `backend/vocab.json`.
- Each vocabulary item now features 2 to 4 visually descriptive queries detailing material, color, and typical context (with `detect_as` maintained as the primary entry for backwards compatibility).
- Preserved existing `en`, `hanzi`, `pinyin`, and `measure` values without modification.
- Single-pass multi-query evaluation: All 75 queries run in a single model call, mapped to their corresponding `vocab_id`, with out-of-range label indexes ignored.
- Per-class Non-Maximum Suppression (IoU 0.50) merges multiple query hits for the same object, preserving the highest confidence score.

### 4. Per-Object Thresholds (`backend/thresholds.json`)
- Created `backend/thresholds.json` storing per-object confidence thresholds for all 25 vocabulary IDs initialized to the global default `0.15`.
- `load_thresholds` validates values between `0.0` and `1.0`, clamps to `0.30`, and falls back to `0.15` for missing or invalid IDs.

### 5. Multi-Scale Tiling for Small & Far Objects (`backend/detector.py`)
- For images with long side $> 1024\text{px}$, 4 overlapping tiles (60% width and height, 20% overlap) are extracted and evaluated.
- Tile bounding boxes are translated back to full-image coordinates, clipped to image boundaries, and merged with full-frame detections via per-class NMS.
- Built-in latency guard: skips tiling on CPU when image dimensions exceed $3000\text{px}$ to prevent CPU execution timeouts.

### 6. Specular Glare & Reflection Enhancement (`backend/detector.py`)
- Highlight detection: Identifies specular reflections in HSV space ($V \ge 220, S \le 40$) with morphological dilation.
- Dual-pass enhancement: When glare is detected and covers $\le 25\%$ of the image, runs Telea inpainting (`cv2.inpaint`) and CLAHE contrast enhancement on the LAB L-channel.
- Glare detections are merged with the original pass using per-class NMS (IoU 0.50), prioritizing original-pass detections when both exist.

### 7. Automated Test Suite (`backend/tests/test_detector.py`)
- Added unit tests covering:
  - Non-empty descriptive queries for all 25 vocabulary items.
  - Query-to-vocab ID mapping and out-of-range index filtering.
  - Duplicate box merging from multiple queries with highest score retention.
  - Neutral padding and unpadding coordinate accuracy.
  - Tile box translation to full-image coordinates.
  - Threshold loading, validation, and fallback mechanisms.
  - Specular highlight detection on synthetic images vs. normal colored scenes.

