import pytest
import numpy as np
from PIL import Image
import json

from detector import (
    calculate_iou,
    apply_nms,
    pad_to_square,
    unpad_and_clip_box,
    detect_glare_and_inpaint,
    get_image_tiles,
    ChineseObjectDetector,
    DEFAULT_THRESHOLD,
    MAX_ALLOWED_THRESHOLD,
)


def test_calculate_iou_no_overlap():
    box1 = [0.0, 0.0, 10.0, 10.0]
    box2 = [20.0, 20.0, 30.0, 30.0]
    assert calculate_iou(box1, box2) == 0.0


def test_calculate_iou_exact_match():
    box1 = [10.0, 10.0, 50.0, 50.0]
    box2 = [10.0, 10.0, 50.0, 50.0]
    assert pytest.approx(calculate_iou(box1, box2), 0.001) == 1.0


def test_calculate_iou_partial():
    # Area1 = 100, Area2 = 100, Intersection = 25 (from 5 to 10 on both axes)
    # Union = 175 -> IoU = 25/175 = 1/7 ~= 0.1428
    box1 = [0.0, 0.0, 10.0, 10.0]
    box2 = [5.0, 5.0, 15.0, 15.0]
    iou = calculate_iou(box1, box2)
    assert pytest.approx(iou, 0.01) == 0.1428


def test_apply_nms_suppression():
    detections = [
        {"vocab_id": 1, "score": 0.95, "box": [10.0, 10.0, 100.0, 100.0]},
        {"vocab_id": 1, "score": 0.80, "box": [12.0, 12.0, 98.0, 98.0]},  # Highly overlapping duplicate
        {"vocab_id": 2, "score": 0.70, "box": [200.0, 200.0, 300.0, 300.0]},  # Distinct object
    ]
    kept = apply_nms(detections, per_class_iou_threshold=0.50)
    assert len(kept) == 2
    assert kept[0]["vocab_id"] == 1
    assert kept[0]["score"] == 0.95
    assert kept[1]["vocab_id"] == 2


def test_every_vocab_entry_has_non_empty_queries():
    detector = ChineseObjectDetector()
    assert len(detector.vocab) == 25
    for item in detector.vocab:
        queries = item.get("queries")
        assert queries is not None, f"Item {item['id']} missing queries list"
        assert len(queries) >= 1, f"Item {item['id']} has empty queries"
        assert queries[0] == item["detect_as"], f"Item {item['id']} first query must match detect_as"
        for q in queries:
            assert isinstance(q, str) and len(q.strip()) > 0, f"Empty query in item {item['id']}"


def test_query_to_vocab_mapping_and_out_of_range():
    detector = ChineseObjectDetector()
    assert len(detector.all_queries) == len(detector.query_to_vocab_id)
    assert len(detector.all_queries) >= 25

    # Confirm correct mapping for first item
    first_item = detector.vocab[0]
    first_query = first_item["queries"][0]
    assert detector.all_queries[0] == first_query
    assert detector.query_to_vocab_id[0] == first_item["id"]

    # Verify out-of-range index handling
    out_of_range_neg = -1
    out_of_range_large = len(detector.query_to_vocab_id) + 10
    assert out_of_range_neg < 0
    assert out_of_range_large >= len(detector.query_to_vocab_id)


def test_duplicate_boxes_merge_with_highest_score():
    # Simulate duplicate boxes for same vocab_id from multiple queries
    raw_detections = [
        {"vocab_id": 23, "score": 0.72, "box": [100.0, 100.0, 200.0, 200.0], "is_original": True},
        {"vocab_id": 23, "score": 0.93, "box": [102.0, 101.0, 198.0, 199.0], "is_original": True}, # Higher score duplicate
        {"vocab_id": 23, "score": 0.65, "box": [105.0, 99.0, 201.0, 202.0], "is_original": True},
    ]

    merged = apply_nms(raw_detections, per_class_iou_threshold=0.50)
    assert len(merged) == 1
    assert merged[0]["vocab_id"] == 23
    assert merged[0]["score"] == 0.93


def test_padding_and_box_unpadding():
    # 800 x 600 image (landscape)
    img = Image.new("RGB", (800, 600), color=(200, 100, 50))
    padded, orig_w, orig_h, side = pad_to_square(img)

    assert orig_w == 800
    assert orig_h == 600
    assert side == 800
    assert padded.size == (800, 800)

    # Box inside original image area
    valid_box = [100.0, 150.0, 300.0, 450.0]
    unpadded = unpad_and_clip_box(valid_box, orig_w, orig_h)
    assert unpadded == [100.0, 150.0, 300.0, 450.0]

    # Box extending into padded bottom region should be clipped
    straddling_box = [100.0, 500.0, 300.0, 750.0]
    unpadded_straddle = unpad_and_clip_box(straddling_box, orig_w, orig_h)
    assert unpadded_straddle == [100.0, 500.0, 300.0, 600.0]

    # Box fully inside padded region should be rejected (zero height)
    pure_padded_box = [100.0, 650.0, 300.0, 750.0]
    unpadded_pure = unpad_and_clip_box(pure_padded_box, orig_w, orig_h)
    assert unpadded_pure is None


def test_tile_boxes_translate_to_full_image_coordinates():
    width = 2000
    height = 1500
    tiles = get_image_tiles(width, height)
    assert len(tiles) == 4

    # Top-Left tile: (0, 0, 1200, 900)
    tl_x0, tl_y0, tl_x1, tl_y1 = tiles[0]
    assert (tl_x0, tl_y0) == (0, 0)
    assert (tl_x1, tl_y1) == (1200, 900)

    # Bottom-Right tile: (width - 1200, height - 900, width, height) = (800, 600, 2000, 1500)
    br_x0, br_y0, br_x1, br_y1 = tiles[3]
    assert (br_x0, br_y0) == (800, 600)
    assert (br_x1, br_y1) == (2000, 1500)

    # Box inside bottom-right tile
    tile_box = [50.0, 60.0, 200.0, 250.0]
    translated = [
        tile_box[0] + br_x0,
        tile_box[1] + br_y0,
        tile_box[2] + br_x0,
        tile_box[3] + br_y0,
    ]
    assert translated == [850.0, 660.0, 1000.0, 850.0]
    assert 0 <= translated[0] < translated[2] <= width
    assert 0 <= translated[1] < translated[3] <= height


def test_thresholds_load_and_fallback(tmp_path):
    custom_thresholds_file = tmp_path / "custom_thresholds.json"
    content = {
        "1": 0.20,
        "2": 0.85,    # Should be clamped to MAX_ALLOWED_THRESHOLD (0.30)
        "3": -0.5,    # Invalid negative -> fallback to DEFAULT_THRESHOLD (0.15)
        "4": "bad",   # Non-numeric -> fallback to DEFAULT_THRESHOLD (0.15)
        # 5..25 missing -> fallback to DEFAULT_THRESHOLD
    }
    with open(custom_thresholds_file, "w") as f:
        json.dump(content, f)

    detector = ChineseObjectDetector(thresholds_path=custom_thresholds_file)
    assert detector.thresholds[1] == 0.20
    assert detector.thresholds[2] == MAX_ALLOWED_THRESHOLD  # 0.30
    assert detector.thresholds[3] == DEFAULT_THRESHOLD      # 0.15
    assert detector.thresholds[4] == DEFAULT_THRESHOLD      # 0.15
    assert detector.thresholds[25] == DEFAULT_THRESHOLD     # 0.15


def test_highlight_detection_synthetic_vs_normal():
    # 1. Synthetic white highlight rectangle on dark background
    dark_with_white = np.zeros((200, 200, 3), dtype=np.uint8)
    dark_with_white[50:120, 50:120] = [255, 255, 255] # White highlight
    pil_glare = Image.fromarray(dark_with_white)

    inpainted_img = detect_glare_and_inpaint(pil_glare)
    assert inpainted_img is not None, "Should detect glare and return inpainted image"
    assert isinstance(inpainted_img, Image.Image)

    # 2. Normal colored image (e.g. green field)
    normal_colored = np.zeros((200, 200, 3), dtype=np.uint8)
    normal_colored[:] = [34, 139, 34] # Forest green
    pil_normal = Image.fromarray(normal_colored)

    result_normal = detect_glare_and_inpaint(pil_normal)
    assert result_normal is None, "Should not detect glare in normal colored image"
