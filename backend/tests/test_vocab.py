import json
from pathlib import Path


def test_vocab_file_exists():
    vocab_path = Path(__file__).parent.parent / "vocab.json"
    assert vocab_path.exists(), "vocab.json must exist in backend directory"


def test_vocab_integrity():
    vocab_path = Path(__file__).parent.parent / "vocab.json"
    with open(vocab_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Exact count: 25 items
    assert len(data) == 25, f"Expected exactly 25 vocabulary items, got {len(data)}"

    # 2. Required fields
    required_fields = {"id", "en", "hanzi", "pinyin", "measure", "detect_as"}
    seen_ids = set()
    seen_hanzi = set()
    seen_detect_as = set()

    for item in data:
        assert isinstance(item, dict), "Each vocabulary item must be a JSON object"
        missing = required_fields - set(item.keys())
        assert not missing, f"Item {item} is missing required fields: {missing}"

        # ID uniqueness and range
        item_id = item["id"]
        assert isinstance(item_id, int), f"ID must be an integer, got {type(item_id)}"
        assert 1 <= item_id <= 25, f"ID {item_id} out of range 1..25"
        assert item_id not in seen_ids, f"Duplicate ID found: {item_id}"
        seen_ids.add(item_id)

        # Chinese characters
        hanzi = item["hanzi"]
        assert isinstance(hanzi, str) and len(hanzi) > 0, "hanzi must be non-empty"
        assert hanzi not in seen_hanzi, f"Duplicate hanzi found: {hanzi}"
        seen_hanzi.add(hanzi)

        # Detection text query
        detect_as = item["detect_as"]
        assert isinstance(detect_as, str) and len(detect_as) > 0, "detect_as must be non-empty"
        assert detect_as not in seen_detect_as, f"Duplicate detect_as query: {detect_as}"
        seen_detect_as.add(detect_as)

        # English, Pinyin, Measure word
        assert isinstance(item["en"], str) and len(item["en"]) > 0
        assert isinstance(item["pinyin"], str) and len(item["pinyin"]) > 0
        assert isinstance(item["measure"], str) and len(item["measure"]) > 0

    assert seen_ids == set(range(1, 26)), "IDs must sequentially cover 1 through 25"

