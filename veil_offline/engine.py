from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

MAX_SIDE = 4096
SCORE_FLOOR = 0.12
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}

PART_JA = {
    "female": "女性器",
    "male": "男性器",
    "breast": "胸部",
    "anus": "肛門",
    "buttocks": "臀部",
}

PHOTO_LABELS = [
    "FEMALE_GENITALIA_COVERED",
    "FACE_FEMALE",
    "BUTTOCKS_EXPOSED",
    "FEMALE_BREAST_EXPOSED",
    "FEMALE_GENITALIA_EXPOSED",
    "MALE_BREAST_EXPOSED",
    "ANUS_EXPOSED",
    "FEET_EXPOSED",
    "BELLY_COVERED",
    "FEET_COVERED",
    "ARMPITS_COVERED",
    "ARMPITS_EXPOSED",
    "FACE_MALE",
    "BELLY_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
    "ANUS_COVERED",
    "FEMALE_BREAST_COVERED",
    "BUTTOCKS_COVERED",
]

ILLUST_LABELS = ["nipple_f", "penis", "pussy"]

PHOTO_MAP = {
    "FEMALE_GENITALIA_COVERED": "female",
    "FEMALE_GENITALIA_EXPOSED": "female",
    "MALE_GENITALIA_EXPOSED": "male",
    "FEMALE_BREAST_EXPOSED": "breast",
    "ANUS_EXPOSED": "anus",
    "BUTTOCKS_EXPOSED": "buttocks",
}

ILLUST_MAP = {
    "pussy": "female",
    "penis": "male",
    "nipple_f": "breast",
}

ROOT = Path(__file__).resolve().parent
MODELS = {
    "illust": {
        "path": ROOT / "models" / "anime-censor-n.onnx",
        "input_size": 640,
        "nms_iou": 0.7,
        "labels": ILLUST_LABELS,
        "map": ILLUST_MAP,
    },
    "photo": {
        "path": ROOT / "models" / "nudenet-320n.onnx",
        "input_size": 320,
        "nms_iou": 0.45,
        "labels": PHOTO_LABELS,
        "map": PHOTO_MAP,
    },
}

_sessions: dict[str, ort.InferenceSession] = {}


@dataclass
class Box:
    x: float
    y: float
    w: float
    h: float


@dataclass
class Detection:
    part: str
    raw: str
    score: float
    box: Box


def get_session(mode: str) -> ort.InferenceSession:
    sess = _sessions.get(mode)
    if sess is None:
        spec = MODELS[mode]
        path = spec["path"]
        if not path.is_file():
            raise FileNotFoundError(f"モデルが見つかりません: {path}")
        so = ort.SessionOptions()
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        so.intra_op_num_threads = 0
        sess = ort.InferenceSession(str(path), so, providers=["CPUExecutionProvider"])
        _sessions[mode] = sess
    return sess


def warmup(mode: str = "illust") -> None:
    get_session(mode)


def is_image_path(path: Path) -> bool:
    if path.name.startswith(".") or path.name.startswith("._"):
        return False
    return path.suffix.lower() in IMAGE_EXT


def collect_from_folder(folder: str | Path, recursive: bool = True) -> list[Path]:
    root = Path(folder).expanduser()
    if not root.is_dir():
        raise FileNotFoundError(f"フォルダがありません: {root}")
    it = root.rglob("*") if recursive else root.glob("*")
    files: list[Path] = []
    for p in it:
        if not p.is_file() or not is_image_path(p):
            continue
        if "_mosaic" in p.parts or p.stem.endswith("_mosaic"):
            continue
        files.append(p)
    files.sort()
    return files


def load_image(path: Path) -> Image.Image:
    im = Image.open(path)
    im = ImageOps.exif_transpose(im) or im
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (0, 0, 0))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    elif im.mode != "RGB":
        im = im.convert("RGB")
    long = max(im.size)
    if long > MAX_SIDE:
        scale = MAX_SIDE / long
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.Resampling.BILINEAR)
    return im


def _to_nchw(im: Image.Image) -> np.ndarray:
    arr = np.asarray(im, dtype=np.float32) / 255.0
    return arr.transpose(2, 0, 1)[None, ...]


def _letterbox(im: Image.Image, size: int) -> tuple[np.ndarray, int, int]:
    src_w, src_h = im.size
    max_size = max(src_w, src_h)
    square = Image.new("RGB", (max_size, max_size), (0, 0, 0))
    square.paste(im, (0, 0))
    inp = square.resize((size, size), Image.Resampling.BILINEAR)
    return _to_nchw(inp), max_size - src_w, max_size - src_h


def _stretch(im: Image.Image, size: int) -> tuple[np.ndarray, int, int]:
    inp = im.resize((size, size), Image.Resampling.BILINEAR)
    return _to_nchw(inp), 0, 0


def _iou(a: Box, b: Box) -> float:
    x1 = max(a.x, b.x)
    y1 = max(a.y, b.y)
    x2 = min(a.x + a.w, b.x + b.w)
    y2 = min(a.y + a.h, b.y + b.h)
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    union = a.w * a.h + b.w * b.h - inter
    return 0.0 if union <= 0 else inter / union


def nms_boxes(boxes: list[Box], scores: list[float], score_thr: float, iou_thr: float) -> list[int]:
    order = [i for i, s in sorted(enumerate(scores), key=lambda t: t[1], reverse=True) if s >= score_thr]
    keep: list[int] = []
    dead: set[int] = set()
    for i in order:
        if i in dead:
            continue
        keep.append(i)
        box = boxes[i]
        for j in order:
            if j == i or j in dead:
                continue
            if _iou(box, boxes[j]) > iou_thr:
                dead.add(j)
    return keep


def expand_box(box: Box, scale: float, img_w: int, img_h: int) -> Box:
    cx = box.x + box.w / 2
    cy = box.y + box.h / 2
    nw = box.w * scale
    nh = box.h * scale
    x = cx - nw / 2
    y = cy - nh / 2
    w, h = nw, nh
    if x < 0:
        w += x
        x = 0
    if y < 0:
        h += y
        y = 0
    if x + w > img_w:
        w = img_w - x
    if y + h > img_h:
        h = img_h - y
    return Box(x, y, max(1.0, w), max(1.0, h))


def _postprocess(
    out: np.ndarray,
    mode: str,
    x_pad: int,
    y_pad: int,
    width: int,
    height: int,
    model_size: int,
    score_threshold: float,
) -> list[Detection]:
    spec = MODELS[mode]
    labels: list[str] = spec["labels"]  # type: ignore[assignment]
    class_count = len(labels)
    arr = out[0] if out.ndim == 3 else out
    if arr.shape[0] == 4 + class_count:
        layout = "cn"
        num_boxes = arr.shape[1]
    elif arr.shape[1] == 4 + class_count:
        layout = "nc"
        num_boxes = arr.shape[0]
    else:
        raise RuntimeError(f"想定外の出力形状: {tuple(out.shape)}")

    floor = min(SCORE_FLOOR, score_threshold)
    scale_x = (width + x_pad) / model_size
    scale_y = (height + y_pad) / model_size
    boxes: list[Box] = []
    scores: list[float] = []
    class_ids: list[int] = []

    for i in range(num_boxes):
        if layout == "cn":
            cx, cy, bw, bh = (float(arr[k, i]) for k in range(4))
            cls = arr[4:, i]
        else:
            cx, cy, bw, bh = (float(arr[i, k]) for k in range(4))
            cls = arr[i, 4:]
        class_id = int(np.argmax(cls))
        best = float(cls[class_id])
        if best < floor:
            continue
        x = (cx - bw / 2) * scale_x
        y = (cy - bh / 2) * scale_y
        w = bw * scale_x
        h = bh * scale_y
        x = min(max(0.0, x), float(width))
        y = min(max(0.0, y), float(height))
        w = min(w, width - x)
        h = min(h, height - y)
        if w < 1 or h < 1:
            continue
        boxes.append(Box(x, y, w, h))
        scores.append(best)
        class_ids.append(class_id)

    keep = nms_boxes(boxes, scores, score_threshold, float(spec["nms_iou"]))
    mapping: dict[str, str] = spec["map"]  # type: ignore[assignment]
    detections: list[Detection] = []
    for i in keep:
        raw = labels[class_ids[i]]
        part = mapping.get(raw)
        if not part:
            continue
        detections.append(Detection(part=part, raw=raw, score=scores[i], box=boxes[i]))
    detections.sort(key=lambda d: d.score, reverse=True)
    return detections


def _clip_box(box: Box, w: int, h: int) -> tuple[int, int, int, int]:
    x = max(0, int(box.x))
    y = max(0, int(box.y))
    bw = max(1, min(w - x, int(np.ceil(box.w))))
    bh = max(1, min(h - y, int(np.ceil(box.h))))
    return x, y, bw, bh


def _mosaic_region(region: Image.Image, style: str, block_size: int) -> Image.Image:
    if style == "blur":
        radius = max(2.0, block_size * 0.9)
        return region.filter(ImageFilter.GaussianBlur(radius=radius))
    w, h = region.size
    bx = max(1, round(w / block_size))
    by = max(1, round(h / block_size))
    small = region.resize((bx, by), Image.Resampling.BILINEAR)
    return small.resize((w, h), Image.Resampling.NEAREST)


def apply_mosaic(
    im: Image.Image,
    box: Box,
    style: str,
    shape: str,
    block_size: int,
) -> None:
    w, h = im.size
    x, y, bw, bh = _clip_box(box, w, h)
    if bw < 2 or bh < 2:
        return
    region = im.crop((x, y, x + bw, y + bh))
    mosaicked = _mosaic_region(region, style, block_size)
    if shape == "ellipse":
        mask = Image.new("L", (bw, bh), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, bw - 1, bh - 1), fill=255)
        im.paste(mosaicked, (x, y), mask)
    else:
        im.paste(mosaicked, (x, y))


def draw_debug(im: Image.Image, box: Box, label: str, score: float) -> None:
    x, y, bw, bh = _clip_box(box, im.width, im.height)
    draw = ImageDraw.Draw(im)
    draw.rectangle((x, y, x + bw, y + bh), outline=(110, 231, 197), width=max(2, round(min(bw, bh) * 0.015)))
    text = f"{label}  {score * 100:.0f}%"
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None
    ty = y if y < 18 else y - 16
    draw.rectangle((x, ty, x + 8 * len(text), ty + 16), fill=(11, 12, 14))
    draw.text((x + 4, ty + 2), text, fill=(110, 231, 197), font=font)


def detect_and_censor(
    im: Image.Image,
    mode: str,
    parts: list[str],
    score_threshold: float,
    expand: float,
    block_size: int,
    style: str,
    shape: str,
    show_boxes: bool,
) -> tuple[Image.Image, list[Detection], list[Detection]]:
    spec = MODELS[mode]
    session = get_session(mode)
    size = int(spec["input_size"])
    if mode == "photo":
        tensor, x_pad, y_pad = _letterbox(im, size)
    else:
        tensor, x_pad, y_pad = _stretch(im, size)
    inp_name = session.get_inputs()[0].name
    out = session.run(None, {inp_name: tensor})[0]
    detections = _postprocess(
        out, mode, x_pad, y_pad, im.width, im.height, size, score_threshold
    )
    result = im.copy()
    selected = set(parts)
    mosaicked = [d for d in detections if d.part in selected]
    for det in mosaicked:
        box = expand_box(det.box, expand, result.width, result.height)
        apply_mosaic(result, box, style, shape, block_size)
    if show_boxes:
        for det in detections:
            box = expand_box(det.box, expand, result.width, result.height)
            draw_debug(result, box, det.raw, det.score)
    return result, detections, mosaicked
