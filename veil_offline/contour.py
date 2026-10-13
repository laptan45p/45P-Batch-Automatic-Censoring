"""Local contour extraction. Invalid masks fall back to a full detector box."""
from pathlib import Path
import numpy as np
from PIL import Image
import cv2

SAM_MODELS = {
    "vit_b": "sam_vit_b_01ec64.pth",
    "vit_l": "sam_vit_l_0b3195.pth",
    "vit_h": "sam_vit_h_4b8939.pth",
}


def sam_model_path(model_type="vit_b"):
    if model_type not in SAM_MODELS:
        raise ValueError("SAMモデルの種類が不正です。")
    return Path(__file__).resolve().parent / "models" / SAM_MODELS[model_type]


class ContourSegmenter:
    def __init__(self, image, method="grabcut", model_type="vit_b", device="cpu"):
        self.image = image
        self.rgb = np.asarray(image.convert("RGB"))
        self.method = method
        self.predictor = None
        if method == "sam":
            path = sam_model_path(model_type)
            if not path.is_file():
                raise ValueError(f"SAMモデルがありません: {path.name}。modelsフォルダに入れてください。vit_bはinstall_sam.batで導入できます。")
            try:
                import torch
                from segment_anything import sam_model_registry, SamPredictor
            except ImportError as exc:
                raise RuntimeError("SAMの追加ライブラリがありません。install_sam.bat を実行してください。") from exc
            if device == "cuda" and not torch.cuda.is_available():
                raise RuntimeError("CUDA対応のPyTorchまたはGPUが見つかりません。CPUを選択してください。")
            model = sam_model_registry[model_type](checkpoint=str(path))
            model.to(device=device)
            self.predictor = SamPredictor(model)
            self.predictor.set_image(self.rgb)

    def mask(self, box, expanded, margin):
        from engine import _clip_box
        x, y, w, h = _clip_box(expanded, self.image.width, self.image.height)
        if min(w, h) < 8:
            return None, "矩形に切替（対象が小さい）"
        try:
            if self.predictor is not None:
                masks, scores, _ = self.predictor.predict(
                    box=np.array([box.x, box.y, box.x + box.w, box.y + box.h]),
                    multimask_output=True)
                valid = [(float(score), candidate[y:y+h, x:x+w].astype(np.uint8))
                         for candidate, score in zip(masks, scores)
                         if self._valid(candidate[y:y+h, x:x+w], box, x, y)]
                if not valid:
                    return None, "矩形に切替（SAM輪郭が不確実）"
                score, binary = max(valid, key=lambda t: t[0])
                if score < 0.8:
                    return None, "矩形に切替（SAM信頼度不足）"
            else:
                # Bound CPU work on large crops; map back before adding pixel margin.
                scale = min(1.0, 512 / max(w, h))
                rw, rh = max(8, round(w * scale)), max(8, round(h * scale))
                crop = cv2.resize(self.rgb[y:y+h, x:x+w], (rw, rh))
                labels = np.full((rh, rw), cv2.GC_BGD, np.uint8)
                left = max(1, min(rw-3, round((box.x-x)*rw/w)))
                top = max(1, min(rh-3, round((box.y-y)*rh/h)))
                right = min(rw-1, max(left+2, round((box.x+box.w-x)*rw/w)))
                bottom = min(rh-1, max(top+2, round((box.y+box.h-y)*rh/h)))
                labels[top:bottom, left:right] = cv2.GC_PR_FGD
                # A small centre seed is only a heuristic, not a semantic detector.
                cx, cy = (left+right)//2, (top+bottom)//2
                sx, sy = max(1,(right-left)//12), max(1,(bottom-top)//12)
                labels[max(top,cy-sy):min(bottom,cy+sy+1),
                       max(left,cx-sx):min(right,cx+sx+1)] = cv2.GC_FGD
                cv2.grabCut(crop, labels, None, np.zeros((1,65)), np.zeros((1,65)),
                            3, cv2.GC_INIT_WITH_MASK)
                binary = np.isin(labels, [cv2.GC_FGD, cv2.GC_PR_FGD]).astype(np.uint8)
                binary = cv2.resize(binary, (w,h), interpolation=cv2.INTER_NEAREST)
                if not self._valid(binary, box, x, y):
                    return None, "矩形に切替（簡易輪郭が不確実）"
            # Fill holes to avoid uncensored islands inside the selected contour.
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            filled = np.zeros_like(binary)
            cv2.drawContours(filled, contours, -1, 1, cv2.FILLED)
            full = np.zeros((self.image.height, self.image.width), np.uint8)
            full[y:y+h,x:x+w] = filled
            radius = max(0, min(64, int(margin)))
            if radius:
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*radius+1,2*radius+1))
                full = cv2.dilate(full, kernel)
            return Image.fromarray(full * 255), "輪郭（SAM）" if self.predictor else "輪郭（簡易）"
        except cv2.error:
            return None, "矩形に切替（輪郭抽出失敗）"

    @staticmethod
    def _valid(mask, box, x, y):
        area = np.count_nonzero(mask)
        if area < max(8, box.w * box.h * 0.12) or area > box.w * box.h * 1.6:
            return False
        cx = min(mask.shape[1]-1, max(0, int(box.x+box.w/2-x)))
        cy = min(mask.shape[0]-1, max(0, int(box.y+box.h/2-y)))
        return bool(mask[cy,cx])
