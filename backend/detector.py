import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import numpy as np
import cv2

logger = logging.getLogger("chinese_detector")

DEFAULT_THRESHOLD = 0.15
MAX_ALLOWED_THRESHOLD = 0.30


def calculate_iou(box1: List[float], box2: List[float]) -> float:
    """
    Calculate Intersection over Union (IoU) between two bounding boxes.
    Boxes are in format [x1, y1, x2, y2].
    """
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter_width = max(0.0, x2 - x1)
    inter_height = max(0.0, y2 - y1)
    inter_area = inter_width * inter_height

    if inter_area == 0.0:
        return 0.0

    area1 = max(0.0, box1[2] - box1[0]) * max(0.0, box1[3] - box1[1])
    area2 = max(0.0, box2[2] - box2[0]) * max(0.0, box2[3] - box2[1])
    union_area = area1 + area2 - inter_area

    if union_area <= 0.0:
        return 0.0

    return inter_area / union_area


def apply_nms(
    detections: List[Dict[str, Any]],
    per_class_iou_threshold: float = 0.50,
    cross_class_iou_threshold: float = 0.85,
) -> List[Dict[str, Any]]:
    """
    Apply Non-Maximum Suppression (NMS) to eliminate duplicate overlapping bounding boxes.
    Prefers higher-confidence detections and original-pass detections when IoU overlaps.
    """
    # Sort detections: primary by score descending, secondary by original source
    sorted_candidates = sorted(
        detections,
        key=lambda d: (d.get("score", 0.0), 1 if d.get("is_original", True) else 0),
        reverse=True,
    )

    keep: List[Dict[str, Any]] = []

    for cand in sorted_candidates:
        cand_box = cand["box"]
        cand_label = cand["vocab_id"]
        suppress = False

        for kept in keep:
            iou = calculate_iou(cand_box, kept["box"])
            # Suppress duplicate detection of the same vocabulary class with high IoU
            if cand_label == kept["vocab_id"] and iou > per_class_iou_threshold:
                suppress = True
                break
            # Suppress if virtually identical box regardless of class
            if iou > cross_class_iou_threshold:
                suppress = True
                break

        if not suppress:
            keep.append(cand)

    return keep


def pad_to_square(image: Image.Image) -> Tuple[Image.Image, int, int, int]:
    """
    Pads an image to a square by adding neutral gray (128, 128, 128) padding
    to the bottom and/or right edges.
    Returns (padded_image, orig_width, orig_height, side_length).
    """
    orig_w, orig_h = image.size
    side = max(orig_w, orig_h)
    if orig_w == orig_h:
        return image, orig_w, orig_h, side

    padded_image = Image.new("RGB", (side, side), (128, 128, 128))
    padded_image.paste(image, (0, 0))
    return padded_image, orig_w, orig_h, side


def unpad_and_clip_box(box: List[float], orig_w: int, orig_h: int) -> Optional[List[float]]:
    """
    Clips bounding box coordinates to the original image bounds [0, 0, orig_w, orig_h]
    and discards zero-area or negative boxes.
    """
    x1 = max(0.0, min(float(box[0]), float(orig_w)))
    y1 = max(0.0, min(float(box[1]), float(orig_h)))
    x2 = max(0.0, min(float(box[2]), float(orig_w)))
    y2 = max(0.0, min(float(box[3]), float(orig_h)))

    if x2 <= x1 or y2 <= y1:
        return None

    return [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)]


def detect_glare_and_inpaint(image: Image.Image) -> Optional[Image.Image]:
    """
    Detects specular highlight / glare pixels (high V and low S in HSV space).
    If glare is present and covers <= 25% of the image, runs inpainting (cv2.INPAINT_TELEA)
    with CLAHE contrast enhancement on the L channel.
    Returns the enhanced PIL image, or None if no glare or glare > 25%.
    """
    img_rgb = np.array(image.convert("RGB"))
    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)

    # High Value (V >= 220) and Low Saturation (S <= 40)
    mask = cv2.inRange(hsv, np.array([0, 0, 220]), np.array([180, 40, 255]))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.dilate(mask, kernel, iterations=1)

    total_pixels = img_rgb.shape[0] * img_rgb.shape[1]
    highlight_pixels = int(np.count_nonzero(mask))
    if highlight_pixels == 0:
        return None

    ratio = highlight_pixels / total_pixels
    if ratio > 0.25:
        logger.info(
            "Highlight mask covers %.1f%% of image (>25%%); skipping glare inpainting pass.",
            ratio * 100,
        )
        return None

    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    inpainted = cv2.inpaint(img_bgr, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

    # Contrast enhancement (CLAHE on L channel in LAB color space)
    lab = cv2.cvtColor(inpainted, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l_channel)
    enhanced_lab = cv2.merge((l_enhanced, a_channel, b_channel))
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)

    return Image.fromarray(enhanced_rgb)


def get_image_tiles(width: int, height: int) -> List[Tuple[int, int, int, int]]:
    """
    Generates 4 overlapping tiles covering 60% of width and height with 20% overlap.
    Returns list of (x0, y0, x1, y1) bounding boxes.
    """
    tile_w = int(width * 0.60)
    tile_h = int(height * 0.60)

    return [
        (0, 0, tile_w, tile_h),                              # Top-Left
        (width - tile_w, 0, width, tile_h),                  # Top-Right
        (0, height - tile_h, tile_w, height),                # Bottom-Left
        (width - tile_w, height - tile_h, width, height),    # Bottom-Right
    ]


class ChineseObjectDetector:
    def __init__(
        self,
        vocab_path: Optional[Path] = None,
        thresholds_path: Optional[Path] = None,
    ):
        base_dir = Path(__file__).parent
        self.vocab_path = Path(vocab_path) if vocab_path else base_dir / "vocab.json"
        self.thresholds_path = Path(thresholds_path) if thresholds_path else base_dir / "thresholds.json"

        self.vocab: List[Dict[str, Any]] = []
        self.vocab_by_id: Dict[int, Dict[str, Any]] = {}
        self.all_queries: List[str] = []
        self.query_to_vocab_id: List[int] = []
        self.thresholds: Dict[int, float] = {}

        self.load_vocab()
        self.load_thresholds()

        self.model = None
        self.processor = None
        self.device = "cpu"
        self.dtype = None
        self.is_loaded = False
        self.model_name = "google/owlv2-base-patch16-ensemble"

        # Cached text embeddings
        self.cached_text_embeds = None
        self.cached_input_ids = None
        self.cached_attention_mask = None

    def load_vocab(self):
        """Loads vocab.json and constructs flattened query list with mapping."""
        with open(self.vocab_path, "r", encoding="utf-8") as f:
            self.vocab = json.load(f)

        self.vocab_by_id = {item["id"]: item for item in self.vocab}
        self.all_queries = []
        self.query_to_vocab_id = []

        for item in self.vocab:
            item_queries = item.get("queries")
            if not item_queries or not isinstance(item_queries, list):
                item_queries = [item["detect_as"]]

            for q in item_queries:
                q_clean = q.strip()
                if q_clean:
                    self.all_queries.append(q_clean)
                    self.query_to_vocab_id.append(item["id"])

        logger.info(
            "Loaded %d vocabulary items with %d total text queries.",
            len(self.vocab),
            len(self.all_queries),
        )

    def load_thresholds(self, path: Optional[Path] = None):
        """
        Loads per-object confidence thresholds from thresholds.json.
        Validates values between 0.0 and 1.0 (clamped to max 0.30 per requirements).
        Falls back to DEFAULT_THRESHOLD (0.15) on invalid or missing values.
        """
        target_path = Path(path) if path else self.thresholds_path
        self.thresholds = {}

        data = {}
        if target_path.exists():
            try:
                with open(target_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as e:
                logger.warning("Could not read thresholds file '%s': %s", target_path, e)

        for item in self.vocab:
            vocab_id = item["id"]
            raw_val = data.get(str(vocab_id), data.get(vocab_id, DEFAULT_THRESHOLD))
            try:
                val = float(raw_val)
                if 0.0 <= val <= 1.0:
                    val = min(val, MAX_ALLOWED_THRESHOLD)
                else:
                    val = DEFAULT_THRESHOLD
            except (ValueError, TypeError):
                val = DEFAULT_THRESHOLD

            self.thresholds[vocab_id] = val

    def get_object_threshold(self, vocab_id: int, user_threshold: Optional[float] = None) -> float:
        """
        Determines the threshold for a given object.
        If user specified a custom threshold that differs from default, respects user override.
        """
        base_thresh = self.thresholds.get(vocab_id, DEFAULT_THRESHOLD)
        if user_threshold is not None and user_threshold != DEFAULT_THRESHOLD:
            return max(user_threshold, base_thresh)
        return base_thresh

    def load_model(self):
        """Load Hugging Face OWLv2 model, processor, and precompute text embeddings."""
        if self.is_loaded:
            return

        import torch
        from transformers import Owlv2Processor, Owlv2ForObjectDetection

        if torch.cuda.is_available():
            self.device = "cuda"
            self.dtype = torch.float16
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            try:
                torch.zeros(1, device="mps")
                self.device = "mps"
                self.dtype = torch.float32
            except Exception:
                self.device = "cpu"
                self.dtype = torch.float32
        else:
            self.device = "cpu"
            self.dtype = torch.float32

        logger.info("Loading %s on device: %s (dtype: %s)...", self.model_name, self.device, self.dtype)
        try:
            self.processor = Owlv2Processor.from_pretrained(self.model_name, local_files_only=True)
            self.model = Owlv2ForObjectDetection.from_pretrained(
                self.model_name,
                torch_dtype=self.dtype,
                local_files_only=True,
            )
        except Exception as load_err:
            logger.info("Local cache lookup note (%s), attempting standard load...", load_err)
            self.processor = Owlv2Processor.from_pretrained(self.model_name)
            self.model = Owlv2ForObjectDetection.from_pretrained(
                self.model_name,
                torch_dtype=self.dtype,
            )

        self.model.to(self.device)
        self.model.eval()

        # Precompute and cache text embeddings for all vocabulary queries
        self._cache_text_embeddings()
        self.is_loaded = True
        logger.info("OWLv2 model loaded successfully with %d cached queries.", len(self.all_queries))

    def _cache_text_embeddings(self):
        """Encodes all text queries once at startup and stores them in memory."""
        if self.model is None or self.processor is None:
            return

        import torch

        try:
            text_inputs = self.processor(text=[self.all_queries], return_tensors="pt")
            self.cached_input_ids = text_inputs["input_ids"].to(self.device)
            if "attention_mask" in text_inputs:
                self.cached_attention_mask = text_inputs["attention_mask"].to(self.device)
            else:
                self.cached_attention_mask = None

            if hasattr(self.model, "owlv2") and hasattr(self.model.owlv2, "text_model"):
                with torch.inference_mode():
                    text_outputs = self.model.owlv2.text_model(
                        input_ids=self.cached_input_ids,
                        attention_mask=self.cached_attention_mask,
                    )
                    text_embeds = text_outputs.pooler_output
                    text_embeds = self.model.owlv2.text_projection(text_embeds)
                    self.cached_text_embeds = text_embeds / torch.linalg.norm(text_embeds, ord=2, dim=-1, keepdim=True)
                logger.info("Successfully cached text embeddings of shape %s.", self.cached_text_embeds.shape)
        except Exception as e:
            logger.warning("Could not precompute cached text embeddings: %s. Will fallback to dynamic text forward.", e)
            self.cached_text_embeds = None

    def _run_single_image_inference(
        self,
        image: Image.Image,
        min_threshold: float = 0.10,
    ) -> List[Dict[str, Any]]:
        """
        Runs single-pass detection on a PIL image padded to a square.
        Maps returned boxes back to the original image dimensions.
        """
        import torch
        from transformers.models.owlv2.modeling_owlv2 import Owlv2ObjectDetectionOutput

        # 1. Pad to square
        padded_img, orig_w, orig_h, side = pad_to_square(image.convert("RGB"))

        try:
            inputs = self.processor(
                images=padded_img,
                return_tensors="pt",
            ).to(self.device)

            pixel_values = inputs["pixel_values"]
            if self.dtype == torch.float16 and pixel_values.dtype != torch.float16:
                pixel_values = pixel_values.to(torch.float16)

            with torch.inference_mode():
                # Fast path: use cached text embeddings when available
                if (
                    self.cached_text_embeds is not None
                    and hasattr(self.model, "owlv2")
                    and hasattr(self.model.owlv2, "vision_model")
                ):
                    vision_outputs = self.model.owlv2.vision_model(pixel_values=pixel_values)
                    last_hidden_state = vision_outputs[0]
                    image_embeds = self.model.owlv2.vision_model.post_layernorm(last_hidden_state)
                    class_token_out = torch.broadcast_to(image_embeds[:, :1, :], image_embeds[:, :-1].shape)
                    image_embeds = image_embeds[:, 1:, :] * class_token_out
                    image_embeds = self.model.layer_norm(image_embeds)

                    batch_size = pixel_values.shape[0]
                    new_size = (
                        batch_size,
                        self.model.num_patches_height,
                        self.model.num_patches_width,
                        image_embeds.shape[-1],
                    )
                    feature_map = image_embeds.reshape(new_size)
                    image_feats = torch.reshape(
                        feature_map,
                        (batch_size, self.model.num_patches_height * self.model.num_patches_width, image_embeds.shape[-1]),
                    )

                    max_text_queries = self.cached_input_ids.shape[0] // batch_size
                    reshaped_query_embeds = self.cached_text_embeds.reshape(
                        batch_size, max_text_queries, self.cached_text_embeds.shape[-1]
                    )
                    reshaped_input_ids = self.cached_input_ids.reshape(
                        batch_size, max_text_queries, self.cached_input_ids.shape[-1]
                    )
                    query_mask = reshaped_input_ids[..., 0] > 0

                    (pred_logits, class_embeds) = self.model.class_predictor(
                        image_feats, reshaped_query_embeds, query_mask
                    )
                    objectness_logits = self.model.objectness_predictor(image_feats)
                    pred_boxes = self.model.box_predictor(image_feats, feature_map)

                    outputs = Owlv2ObjectDetectionOutput(
                        image_embeds=feature_map,
                        text_embeds=reshaped_query_embeds,
                        pred_boxes=pred_boxes,
                        logits=pred_logits,
                        objectness_logits=objectness_logits,
                        class_embeds=class_embeds,
                    )
                else:
                    # Standard dynamic forward fallback
                    if self.cached_input_ids is not None:
                        outputs = self.model(
                            pixel_values=pixel_values,
                            input_ids=self.cached_input_ids,
                            attention_mask=self.cached_attention_mask,
                        )
                    else:
                        full_inputs = self.processor(
                            text=[self.all_queries],
                            images=padded_img,
                            return_tensors="pt",
                        ).to(self.device)
                        outputs = self.model(**full_inputs)

                target_sizes = torch.tensor([[side, side]], device=self.device)

                # Post-process boxes scaled to square dimensions
                if hasattr(self.processor, "post_process_grounded_object_detection"):
                    results = self.processor.post_process_grounded_object_detection(
                        outputs=outputs,
                        threshold=min_threshold,
                        target_sizes=target_sizes,
                        text_labels=[self.all_queries],
                    )[0]
                elif hasattr(self.processor, "image_processor") and hasattr(
                    self.processor.image_processor, "post_process_object_detection"
                ):
                    results = self.processor.image_processor.post_process_object_detection(
                        outputs=outputs,
                        threshold=min_threshold,
                        target_sizes=target_sizes,
                    )[0]
                elif hasattr(self.processor, "post_process_object_detection"):
                    results = self.processor.post_process_object_detection(
                        outputs=outputs,
                        threshold=min_threshold,
                        target_sizes=target_sizes,
                    )[0]
                else:
                    raise AttributeError("No compatible post_process_object_detection found on processor")

            boxes = results["boxes"].to("cpu").tolist()
            scores = results["scores"].to("cpu").tolist()
            labels = results["labels"].to("cpu").tolist()

        except Exception as e:
            logger.error("Detection failed on device %s: %s", self.device, e)
            if self.device != "cpu":
                logger.info("Retrying on CPU...")
                self.device = "cpu"
                self.dtype = torch.float32
                self.model.to("cpu")
                self._cache_text_embeddings()
                return self._run_single_image_inference(image, min_threshold=min_threshold)
            raise e

        detections: List[Dict[str, Any]] = []
        for raw_box, score, label_idx in zip(boxes, scores, labels):
            # Ignore out-of-range label indexes
            if label_idx < 0 or label_idx >= len(self.query_to_vocab_id):
                continue

            vocab_id = self.query_to_vocab_id[label_idx]
            vocab_entry = self.vocab_by_id.get(vocab_id)
            if not vocab_entry:
                continue

            # Unpad and clip box to original image bounds
            clipped_box = unpad_and_clip_box(raw_box, orig_w, orig_h)
            if clipped_box is None:
                continue

            detections.append({
                "vocab_id": vocab_entry["id"],
                "en": vocab_entry["en"],
                "hanzi": vocab_entry["hanzi"],
                "pinyin": vocab_entry["pinyin"],
                "measure": vocab_entry["measure"],
                "score": round(float(score), 4),
                "box": clipped_box,
            })

        return detections

    def detect(
        self,
        image: Image.Image,
        threshold: float = DEFAULT_THRESHOLD,
        per_class_iou_threshold: float = 0.50,
        cross_class_iou_threshold: float = 0.85,
    ) -> Dict[str, Any]:
        """
        Runs optimized OWLv2 detection including:
        - Image square-padding
        - Multi-query matching and cached text embeddings
        - Tiling for images with long side > 1024px
        - Glare detection & inpainting enhancement pass
        - Per-object thresholds filtering
        - Per-class Non-Maximum Suppression (IoU 0.5)
        """
        if not self.is_loaded:
            self.load_model()

        # Ensure image is in RGB format
        image_rgb = image.convert("RGB")
        width, height = image_rgb.size
        candidates: List[Dict[str, Any]] = []

        # 1. Base Full-Image Detection Pass
        base_dets = self._run_single_image_inference(image_rgb, min_threshold=0.08)
        for d in base_dets:
            d["is_original"] = True
            candidates.append(d)

        # 2. Tiling Pass for Large / Distant Objects (long side > 1024px)
        long_side = max(width, height)
        if long_side > 1024:
            # CPU latency protection for extreme resolution images
            if self.device == "cpu" and long_side >= 3000:
                logger.warning(
                    "Image dimensions %dx%d on CPU may exceed latency budget; skipping tile detection.",
                    width,
                    height,
                )
            else:
                tiles = get_image_tiles(width, height)
                for x0, y0, x1, y1 in tiles:
                    tile_crop = image_rgb.crop((x0, y0, x1, y1))
                    tile_dets = self._run_single_image_inference(tile_crop, min_threshold=0.10)
                    for td in tile_dets:
                        tbox = td["box"]
                        # Translate tile coordinates to full-image coordinates
                        translated_box = [
                            max(0.0, min(float(tbox[0] + x0), float(width))),
                            max(0.0, min(float(tbox[1] + y0), float(height))),
                            max(0.0, min(float(tbox[2] + x0), float(width))),
                            max(0.0, min(float(tbox[3] + y0), float(height))),
                        ]
                        if translated_box[2] > translated_box[0] and translated_box[3] > translated_box[1]:
                            td["box"] = [
                                round(translated_box[0], 1),
                                round(translated_box[1], 1),
                                round(translated_box[2], 1),
                                round(translated_box[3], 1),
                            ]
                            td["is_original"] = False
                            candidates.append(td)

        # 3. Glare Detection & Inpainting Pass
        glare_enhanced_img = detect_glare_and_inpaint(image_rgb)
        if glare_enhanced_img is not None:
            glare_dets = self._run_single_image_inference(glare_enhanced_img, min_threshold=0.10)
            for gd in glare_dets:
                gd["is_original"] = False
                candidates.append(gd)

        # 4. Filter by Per-Object Confidence Thresholds
        filtered_candidates: List[Dict[str, Any]] = []
        for cand in candidates:
            vocab_id = cand["vocab_id"]
            effective_threshold = self.get_object_threshold(vocab_id, user_threshold=threshold)
            if cand["score"] >= effective_threshold:
                filtered_candidates.append(cand)

        # 5. Per-Class Non-Maximum Suppression (IoU 0.50)
        final_detections = apply_nms(
            filtered_candidates,
            per_class_iou_threshold=per_class_iou_threshold,
            cross_class_iou_threshold=cross_class_iou_threshold,
        )

        # Clean internal metadata flags
        for det in final_detections:
            det.pop("is_original", None)

        return {
            "image_width": width,
            "image_height": height,
            "detections": final_detections,
        }
