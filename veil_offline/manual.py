"""Apply brush layers to a processed image; optionally fill enclosed outlines."""
import cv2
import numpy as np
from PIL import Image
from engine import _mosaic_region


def manual_mask(editor_value, size, fill_enclosed=True, margin=0):
    mask = np.zeros((size[1], size[0]), np.uint8)
    for layer in (editor_value or {}).get("layers", []) or []:
        if not isinstance(layer, Image.Image):
            raise ValueError("手動編集のレイヤーを読み込めません。画像を選び直してください。")
        if layer.size != size or layer.mode != "RGBA":
            raise ValueError("編集画像のサイズが変わりました。切り抜きやサイズ変更はしないでください。")
        alpha = np.asarray(layer.getchannel("A"))
        mask = np.maximum(mask, (alpha > 0).astype(np.uint8))
    if not mask.any():
        raise ValueError("追加する場所をブラシで囲むか塗ってください。")
    if fill_enclosed:
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(mask, contours, -1, 1, cv2.FILLED)
    radius = max(0, min(64, int(margin)))
    if radius:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*radius+1,2*radius+1))
        mask = cv2.dilate(mask, kernel)
    return Image.fromarray(mask * 255)


def apply_manual(image, editor_value, style="pixel", block_size=18,
                 fill_enclosed=True, margin=0):
    mask = manual_mask(editor_value, image.size, fill_enclosed, margin)
    result = image.copy()
    result.paste(_mosaic_region(image,style,int(block_size)), (0,0), mask)
    return result


def redetect_manual(original, current, editor_value, settings, style="pixel",
                    block_size=18, fill_enclosed=True, margin=0):
    """Infer on original crops; paste only newly censored pixels inside the selection."""
    from engine import detect_and_censor, expand_box, _clip_box
    if original.size != current.size:
        raise ValueError("元画像と処理結果のサイズが一致しません。")
    selection = np.asarray(manual_mask(editor_value,current.size,fill_enclosed,margin)) > 0
    count, components, stats, _ = cv2.connectedComponentsWithStats(selection.astype(np.uint8),8)
    result = current.copy()
    target_count = 0
    changed_pixels = 0
    for component in range(1,count):
        x,y,w,h,_ = (int(v) for v in stats[component])
        # Add context while keeping the output strictly inside the painted selection.
        pad = max(8,round(max(w,h)*0.15))
        left,top = max(0,x-pad),max(0,y-pad)
        right,bottom = min(current.width,x+w+pad),min(current.height,y+h+pad)
        crop = original.crop((left,top,right,bottom)).convert("RGB")
        options = dict(settings,style=style,block_size=int(block_size),show_boxes=False,refine=False)
        processed, _, targets = detect_and_censor(crop,**options)
        component_mask = components[top:bottom,left:right] == component
        for target in targets:
            box = expand_box(target.box,float(options["expand"]),crop.width,crop.height)
            bx,by,bw,bh = _clip_box(box,crop.width,crop.height)
            if component_mask[by:by+bh,bx:bx+bw].any():
                target_count += 1
        changed = np.any(np.asarray(processed) != np.asarray(crop),axis=2) & component_mask
        # Do not replace pixels already changed by an earlier censoring pass.
        existing = result.crop((left,top,right,bottom)).convert("RGB")
        changed &= ~np.any(np.asarray(existing) != np.asarray(crop),axis=2)
        if not targets:
            changed[:] = False
        changed_pixels += int(changed.sum())
        if changed.any():
            result.paste(processed,(left,top),Image.fromarray(changed.astype(np.uint8)*255))
    return result,target_count,changed_pixels
