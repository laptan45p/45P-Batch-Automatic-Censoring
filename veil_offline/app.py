from __future__ import annotations

import os
import string
import sys
import threading
import webbrowser
import zipfile
import uuid
from pathlib import Path
from tempfile import gettempdir

from PIL import Image
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
import uvicorn


os.environ.setdefault("GRADIO_ANALYTICS_ENABLED", "False")
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import gradio as gr

from engine import (
    PART_JA,
    collect_from_folder,
    detect_and_censor,
    is_image_path,
    load_image,
    warmup,
)

MAX_FILES = 200
OUT_DIR = Path(gettempdir()) / "veil_out"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OFFLINE_ZIP_CANDIDATES = [
    Path("/workspace/artifacts/veil-offline.zip"),
    ROOT.parent / "artifacts" / "veil-offline.zip",
]


def offline_zip_path() -> Path | None:
    for p in OFFLINE_ZIP_CANDIDATES:
        if p.is_file():
            return p
    return None

JA_TO_PART = {v: k for k, v in PART_JA.items()}
ILLUST_CHOICES = ["女性器", "男性器", "胸部"]
PHOTO_CHOICES = ["女性器", "男性器", "胸部", "肛門", "臀部"]

CSS = """
footer { display: none !important; }
.gradio-container { max-width: 1280px !important; }
#veil-gallery { min-height: 420px !important; }
#veil-mask-data { display: none !important; }
.veil-canvas-tools { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.veil-canvas-tools button { padding:8px 12px; border:1px solid #555; border-radius:6px; cursor:pointer; }
.veil-canvas-tools button[aria-pressed="true"] { background:#8c2040; color:#fff; }
.veil-canvas-tools label { display:flex; gap:6px; align-items:center; }
.veil-canvas-view { text-align:center; overflow:auto; max-height:650px; background:#202126; border-radius:6px; }
.veil-canvas-view canvas { display:block; margin:auto; max-width:100%; max-height:650px; width:auto; height:auto; touch-action:none; cursor:crosshair; }
#veil-slider .limit_height img,
#veil-slider img.small,
#veil-slider img.preview,
#veil-slider img {
  max-height: 630px !important;
  object-fit: contain !important;
  object-position: center center !important;
}
"""


def local_allowed_paths() -> list[str]:
    paths = [str(OUT_DIR), str(ROOT), str(Path.home())]
    if os.name == "nt":
        for letter in string.ascii_uppercase:
            drive = f"{letter}:\\"
            if os.path.isdir(drive):
                paths.append(drive)
    else:
        paths.append("/")
    return paths


def _as_paths(files) -> list[Path]:
    if not files:
        return []
    if not isinstance(files, (list, tuple)):
        files = [files]
    out: list[Path] = []
    for f in files:
        if f is None:
            continue
        name = getattr(f, "name", f)
        p = Path(str(name))
        if p.is_file() and is_image_path(p):
            out.append(p)
    return out


def collect_inputs(files, folder_upload, folder_path: str, recursive: bool) -> list[Path]:
    found: list[Path] = []
    seen: set[str] = set()

    def add(p: Path) -> None:
        key = str(p.resolve()) if p.exists() else str(p)
        if key in seen:
            return
        seen.add(key)
        found.append(p)

    for p in _as_paths(files):
        add(p)
    for p in _as_paths(folder_upload):
        add(p)
    path = (folder_path or "").strip().strip('"')
    if path:
        for p in collect_from_folder(path, recursive=recursive):
            add(p)
    return found[:MAX_FILES]


def mosaic_relpath(src: Path, root: Path | None) -> Path:
    if root and root in src.parents:
        rel = src.relative_to(root)
        return rel.with_name(rel.stem + "_mosaic.png")
    return Path(f"{src.stem}_mosaic.png")


def process(
    files,
    folder_upload,
    folder_path,
    output_path,
    recursive,
    save_local,
    mode_label,
    parts_ja,
    threshold,
    expand,
    block_size,
    style_ja,
    shape_ja,
    show_boxes,
    refine=False,
    contour_margin=6,
    contour_method_ja="簡易（追加モデル不要）",
    sam_type="vit_b",
    sam_device_ja="CPU",
    progress=gr.Progress(),
):
    mode = "photo" if mode_label == "実写" else "illust"
    parts = [JA_TO_PART[p] for p in (parts_ja or []) if p in JA_TO_PART]
    style = "blur" if style_ja == "ぼかし" else "pixel"
    shape = {"矩形": "rect", "楕円": "ellipse", "輪郭": "contour"}.get(shape_ja, "ellipse")
    contour_method = "sam" if contour_method_ja == "SAM（追加モデル）" else "grabcut"
    if shape == "contour" and contour_method == "sam":
        from contour import sam_model_path
        try:
            checkpoint = sam_model_path(str(sam_type))
        except ValueError as exc:
            raise gr.Error(str(exc)) from exc
        if not checkpoint.is_file():
            raise gr.Error(f"SAMモデルがありません: {checkpoint.name}。modelsフォルダに入れてください。vit_bはinstall_sam.batで導入できます。")
        try:
            import torch
            import segment_anything
        except ImportError as exc:
            raise gr.Error("SAMの追加ライブラリがありません。install_sam.bat を実行してください。") from exc
        if sam_device_ja == "GPU（CUDA）" and not torch.cuda.is_available():
            raise gr.Error("CUDA対応のPyTorchまたはGPUが見つかりません。CPUを選択してください。")

    if not parts:
        raise gr.Error("モザイク対象を1つ以上選んでください")

    try:
        paths = collect_inputs(files, folder_upload, folder_path, recursive)
    except FileNotFoundError as e:
        raise gr.Error(str(e)) from e

    if not paths:
        raise gr.Error("画像がありません。ファイルを選ぶか、フォルダの場所を指定してください")

    truncated = f"\n（上限 {MAX_FILES} 枚。超えた分はスキップ）" if len(paths) >= MAX_FILES else ""

    progress(0, desc="モデルを準備")
    warmup(mode)

    src_root = None
    raw_folder = (folder_path or "").strip().strip('"')
    if raw_folder:
        candidate = Path(raw_folder).expanduser()
        if candidate.is_dir():
            src_root = candidate

    dest_root = None
    if save_local:
        raw_out = (output_path or "").strip().strip('"')
        if raw_out:
            dest_root = Path(raw_out).expanduser()
        elif src_root is not None:
            dest_root = src_root / "_mosaic"
        if dest_root is not None:
            dest_root.mkdir(parents=True, exist_ok=True)

    gallery = []
    records = []
    run_dir = OUT_DIR / uuid.uuid4().hex
    run_dir.mkdir(parents=True, exist_ok=True)
    rows = []
    zip_entries: list[tuple[str, Path]] = []
    slider = None
    mosaic_total = 0
    saved_local = 0

    for i, src in enumerate(paths):
        progress((i + 0.05) / len(paths), desc=f"{i + 1} / {len(paths)}  {src.name}")
        try:
            original = load_image(src)
            result, detections, mosaicked = detect_and_censor(
                original,
                mode=mode,
                parts=parts,
                score_threshold=float(threshold),
                expand=float(expand),
                block_size=int(block_size),
                style=style,
                shape=shape,
                show_boxes=bool(show_boxes),
                refine=bool(refine),
                contour_margin=int(contour_margin),
                contour_method=contour_method,
                sam_type=str(sam_type),
                sam_device="cuda" if sam_device_ja == "GPU（CUDA）" else "cpu",
            )
        except Exception as e:
            rows.append([src.name, "失敗", str(e)])
            continue

        out_path = run_dir / f"{src.stem}_{i}_mosaic.png"
        result.save(out_path, "PNG")
        gallery.append((str(out_path), src.name))
        zip_entries.append((str(mosaic_relpath(src, src_root)).replace("\\", "/"), out_path))
        mosaic_total += len(mosaicked)
        hits = "、".join(
            f"{PART_JA.get(d.part, d.part)} {d.score * 100:.0f}% {d.mask_status}" for d in detections
        ) or "検出なし"
        rows.append([src.name, f"{len(mosaicked)} 箇所", hits])
        orig_path = run_dir / f"{src.stem}_{i}_orig.png"
        original.save(orig_path, "PNG")
        if slider is None:
            if original.mode != "RGB":
                original = original.convert("RGB")
            if result.mode != "RGB":
                result = result.convert("RGB")
            if result.size != original.size:
                result = result.resize(original.size, Image.Resampling.NEAREST)
            original.save(orig_path, "PNG")
            result.save(out_path, "PNG")
            slider = (str(orig_path), str(out_path))

        dest = None
        if dest_root is not None:
            rel = mosaic_relpath(src, src_root)
            dest = dest_root / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            result.save(dest, "PNG")
            saved_local += 1
        records.append({"output": str(out_path), "original": str(orig_path),
                        "caption": src.name, "archive": zip_entries[-1][0],
                        "local": str(dest) if dest is not None else None})

    if not zip_entries:
        raise gr.Error("処理できた画像がありません")

    zip_path = run_dir / "veil_mosaic.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_STORED) as zf:
        for name, path in zip_entries:
            zf.write(path, arcname=name)

    lines = ["| ファイル | モザイク | 検出 |", "| --- | --- | --- |"]
    for name, mosaic, hits in rows:
        lines.append(f"| {name} | {mosaic} | {hits.replace('|', '/')} |")

    extra = ""
    if saved_local:
        extra = f"\n保存先: `{dest_root}` （{saved_local} 枚）"
    status = (
        f"**{len(zip_entries)} / {len(paths)} 枚** 完了 · モザイク {mosaic_total} 箇所"
        f"{truncated}{extra}"
    )
    return (
        gr.update(value=slider, visible=True),
        gallery,
        str(zip_path),
        "\n".join(lines),
        status,
        {"records": records, "selected": None, "zip": str(zip_path),
         "detection_settings": {"mode": mode, "parts": parts,
             "score_threshold": float(threshold), "expand": float(expand),
             "shape": shape, "contour_margin": int(contour_margin),
             "contour_method": contour_method, "sam_type": str(sam_type),
             "sam_device": "cuda" if sam_device_ja == "GPU（CUDA）" else "cpu"}},
    )


def select_manual_image(batch, evt: gr.SelectData):
    # Closing a gallery preview can emit a deselection event; do not reload on it.
    if not getattr(evt, "selected", True):
        return gr.skip(), gr.skip(), gr.skip(), gr.skip()
    index = evt.index[0] if isinstance(evt.index, (list, tuple)) else evt.index
    return load_manual_image(batch, index)


def load_manual_image(batch, index):
    if not batch or not batch.get("records"):
        raise gr.Error("先に自動処理を実行してください。")
    if not isinstance(index, int) or not 0 <= index < len(batch["records"]):
        raise gr.Error("画像を選び直してください。")
    batch = dict(batch, selected=index, last_selected=index)
    record = batch["records"][index]
    with Image.open(record["output"]) as im:
        background = im.convert("RGB").copy()
    from canvas_editor import render_canvas
    return (render_canvas(background,Path(record["output"]).name),
            batch, f"**{record['caption']}** を手動修正します。",
            gr.update(value=(record["original"],record["output"]),visible=True))


def clear_manual_editor(batch):
    if batch:
        batch = dict(batch, last_selected=batch.get("selected")
                     if batch.get("selected") is not None else batch.get("last_selected"),
                     selected=None)
    return (batch, gr.update(selected_index=None), None,
            "編集画像をクリアしました。処理結果を選び直すか「編集画像を読み直す」を押してください。")


def reload_manual_image(batch):
    if not batch or not batch.get("records"):
        return (gr.skip(),gr.skip(),
                "処理結果がまだありません。先に「モザイクを実行」で画像を処理してください。",
                gr.skip())
    index = batch.get("last_selected")
    if not isinstance(index,int) or not 0 <= index < len(batch["records"]):
        index = batch.get("selected")
    if not isinstance(index,int) or not 0 <= index < len(batch["records"]):
        index = 0
    return load_manual_image(batch,index)


def save_manual_edit(editor_value, batch, style_ja, block_size, fill_enclosed, margin,
                     action="範囲内を再検出"):
    if not batch or batch.get("selected") is None:
        raise gr.Error("処理結果の画像をクリックして選んでください。")
    record = batch["records"][batch["selected"]]
    output = Path(record["output"])
    with Image.open(output) as im:
        current = im.convert("RGB").copy()
    if isinstance(editor_value,str):
        from canvas_editor import decode_canvas
        try:
            editor_value = decode_canvas(editor_value,current,output.name)
        except ValueError as exc:
            raise gr.Error(str(exc)) from exc
    background = (editor_value or {}).get("background")
    if not isinstance(background, Image.Image) or background.size != current.size:
        raise gr.Error("画像を選び直してください。サイズ変更はできません。")
    import numpy as np
    if not np.array_equal(np.asarray(background.convert("RGB")), np.asarray(current)):
        raise gr.Error("選択画像と編集画像が一致しません。処理結果から選び直してください。")
    from manual import apply_manual, redetect_manual
    detection_message = ""
    try:
        style = "blur" if style_ja == "ぼかし" else "pixel"
        if action == "範囲内を再検出":
            if not batch.get("detection_settings"):
                raise ValueError("再検出の設定がありません。自動処理からやり直してください。")
            with Image.open(record["original"]) as im:
                original = im.convert("RGB").copy()
            result,found,changed = redetect_manual(original,current,editor_value,
                batch["detection_settings"],style,block_size,fill_enclosed,margin)
            if not changed:
                message = ("範囲内で対象を検出できませんでした。" if not found else
                           f"対象候補は{found}箇所ありましたが、選択範囲内に追加の処理画素がありませんでした。")
                message += "画像は変更していません。必要なら「範囲全体にかける」を選んで保存してください。"
                return (gr.skip(),[(item["output"],item["caption"]) for item in batch["records"]],
                        batch["zip"],str(output),message,batch,
                        gr.update(value=(record["original"],str(output)),visible=True))
            detection_message = f"範囲内の再検出：対象 {found} 箇所。 "
        else:
            result = apply_manual(current,editor_value,style,block_size,fill_enclosed,margin)
    except (ValueError, RuntimeError, FileNotFoundError) as exc:
        raise gr.Error(str(exc)) from exc
    # Use new result paths to avoid the browser reusing an old image or ZIP.
    updated = output.with_name(output.stem + "_" + uuid.uuid4().hex[:8] + ".png")
    result.save(updated,"PNG")
    if record.get("local"):
        result.save(record["local"],"PNG")
    records = [dict(item) for item in batch["records"]]
    records[batch["selected"]]["output"] = str(updated)
    zip_path = updated.parent / ("veil_mosaic_" + uuid.uuid4().hex[:8] + ".zip")
    with zipfile.ZipFile(zip_path,"w",compression=zipfile.ZIP_STORED) as zf:
        for item in records:
            zf.write(item["output"],arcname=item["archive"])
    new_batch = dict(batch,records=records,zip=str(zip_path))
    message = detection_message + f"**{record['caption']}** の手動修正を保存しました。ZIPも更新済みです。"
    if record.get("local"):
        message += " 指定した保存先にも反映しました。"
    from canvas_editor import render_canvas
    return (render_canvas(result,updated.name),
            [(item["output"],item["caption"]) for item in records],str(zip_path),
            str(updated),message,new_batch,
            gr.update(value=(record["original"],str(updated)),visible=True))


def on_mode(mode_label: str):
    if mode_label == "実写":
        return gr.update(choices=PHOTO_CHOICES, value=["女性器", "男性器"]), 0.25, 1.35
    return gr.update(choices=ILLUST_CHOICES, value=["女性器", "男性器"]), 0.28, 1.45


def build() -> gr.Blocks:
    theme = gr.themes.Base().set(
        body_background_fill="#0b0c0e",
        body_background_fill_dark="#0b0c0e",
        body_text_color="#f0f0ec",
        body_text_color_dark="#f0f0ec",
        background_fill_primary="#141518",
        background_fill_primary_dark="#141518",
        background_fill_secondary="#1c1d22",
        background_fill_secondary_dark="#1c1d22",
        border_color_primary="#2a2b31",
        border_color_primary_dark="#2a2b31",
        block_background_fill="#141518",
        block_background_fill_dark="#141518",
        input_background_fill="#1c1d22",
        input_background_fill_dark="#1c1d22",
    )

    with gr.Blocks(title="ヴェール", theme=theme, css=CSS,
                   js=(ROOT / "canvas_editor.js").read_text(encoding="utf-8")) as demo:
        pack = offline_zip_path()
        if pack is not None:
            with gr.Row():
                gr.HTML(
                    "<p style='margin:0;font-size:14px;line-height:1.5'>"
                    "パソコンに入れてオフラインで使う一式です。"
                    "<a href='/veil-offline.zip' download='veil-offline.zip' "
                    "style='color:#60a5fa;font-weight:600'>veil-offline.zip をダウンロード（約21MB）</a>"
                    "</p>"
                )
                gr.DownloadButton(
                    "ZIPを保存",
                    value=str(pack),
                    variant="primary",
                    size="sm",
                    scale=0,
                    min_width=140,
                )
        gr.Markdown(
            "### ヴェール\n"
            "イラストと実写の局部を検出してモザイクをかけます。"
            "**このパソコンの中だけで処理します。**"
        )
        with gr.Row():
            with gr.Column(scale=4, min_width=280):
                mode = gr.Radio(["イラスト", "実写"], value="イラスト", label="検出モデル")
                files = gr.File(
                    label="画像（複数可）",
                    file_count="multiple",
                    file_types=["image"],
                )
                folder_upload = gr.File(label="フォルダを選ぶ", file_count="directory")
                folder_path = gr.Textbox(
                    label="フォルダの場所（このパソコンで使うとき）",
                    placeholder=r"C:\Pictures\batch",
                    info="エクスプローラのアドレスバーをコピーして貼り付けてください。",
                )
                output_path = gr.Textbox(
                    label="保存先（空なら、入力フォルダの _mosaic）",
                    placeholder=r"C:\Pictures\batch\_mosaic",
                )
                recursive = gr.Checkbox(label="サブフォルダも含める", value=True)
                save_local = gr.Checkbox(
                    label="指定したフォルダに保存する",
                    value=True,
                )
                parts = gr.CheckboxGroup(
                    ILLUST_CHOICES, value=["女性器", "男性器"], label="モザイク対象"
                )
                threshold = gr.Slider(0.15, 0.7, value=0.28, step=0.01, label="信頼度")
                expand = gr.Slider(1.0, 2.2, value=1.45, step=0.05, label="範囲の拡大")
                block_size = gr.Slider(8, 48, value=18, step=1, label="モザイク粗さ")
                with gr.Row():
                    style = gr.Radio(["ピクセル", "ぼかし"], value="ピクセル", label="種類")
                    shape = gr.Radio(["楕円", "矩形", "輪郭"], value="輪郭", label="形状")
                refine = gr.Checkbox(label="検出した周辺を拡大して再検出（時間が増えます）", value=True)
                with gr.Accordion("輪郭の設定", open=True):
                    contour_margin = gr.Slider(0, 64, value=6, step=1, label="輪郭の外側の余白（px）")
                    contour_method = gr.Radio(
                        ["簡易（追加モデル不要）", "SAM（追加モデル）"],
                        value="簡易（追加モデル不要）", label="輪郭抽出方法")
                    gr.Markdown("簡易方式は色の差を使います。塗りや重なりによって範囲がずれるため、比較画像で確認してください。輪郭が不確実な場合は矩形に切り替わります。")
                    sam_type = gr.Dropdown(["vit_b", "vit_l", "vit_h"], value="vit_b", label="SAMモデルの種類")
                    gr.Markdown("SAMモデルは `models` フォルダから自動で読み込みます。`vit_b` は `install_sam.bat` で導入できます。`vit_l`・`vit_h` は対応する公式モデルを同じフォルダに入れてください。")
                    sam_device = gr.Radio(["CPU", "GPU（CUDA）"], value="CPU", label="SAMの実行環境")
                show_boxes = gr.Checkbox(label="検出枠を重ねる", value=False)
                run = gr.Button("モザイクを実行", variant="primary")
            with gr.Column(scale=8, min_width=360):
                status = gr.Markdown(
                    "フォルダを選ぶか、場所を貼り付けてから実行してください。"
                )
                slider = gr.ImageSlider(
                    label="比較（左が元、右へドラッグすると処理後）",
                    type="filepath",
                    format="png",
                    max_height=630,
                    slider_position=50,
                    visible=False,
                    elem_id="veil-slider",
                    show_fullscreen_button=True,
                )
                gallery = gr.Gallery(
                    label="処理結果",
                    columns=3,
                    height=420,
                    object_fit="contain",
                    elem_id="veil-gallery",
                )
                table = gr.Markdown("")
                zip_out = gr.File(label="ZIPで保存")
                batch_state = gr.State(None)
                with gr.Accordion("検出漏れを手動で修正",open=True):
                    gr.Markdown("処理結果の画像をクリックして選び、漏れた場所をブラシで**閉じた線で囲んでください**。その部分を元画像から切り出して再検出します。消しゴムは選択範囲を消します。")
                    manual_status = gr.Markdown("処理結果から修正する画像を選んでください。")
                    manual_reload = gr.Button("編集画像を読み直す（未選択なら最初の画像）")
                    manual_editor = gr.HTML("処理結果から修正する画像を選んでください。",elem_id="veil-editor")
                    manual_mask_data = gr.Textbox(value="",elem_id="veil-mask-data",interactive=True)
                    manual_close = gr.Button("編集画像を閉じる")
                    fill_enclosed = gr.Checkbox(label="囲んだ線の内側も処理する（線を閉じてください）",value=True)
                    manual_margin = gr.Slider(0,64,value=0,step=1,label="手動範囲の外側の余白（px）")
                    manual_action = gr.Radio(["範囲内を再検出","範囲全体にかける"],value="範囲内を再検出",label="手動範囲の処理方法")
                    manual_save = gr.Button("選択した範囲を処理して保存",variant="primary")
                    manual_download = gr.File(label="手動修正した画像を保存")
                    gr.Markdown("再検出は自動処理時の検出モデル・対象・信頼度・形状・輪郭設定を使用します。種類・粗さは左側の現在の設定を使用します。検出なしなら選択範囲を残し、画像は変更しません。「範囲全体にかける」はAIを使わず指定範囲を処理します。")

        mode.change(on_mode, inputs=mode, outputs=[parts, threshold, expand])
        run.click(
            process,
            inputs=[
                files,
                folder_upload,
                folder_path,
                output_path,
                recursive,
                save_local,
                mode,
                parts,
                threshold,
                expand,
                block_size,
                style,
                shape,
                show_boxes,
                refine,
                contour_margin,
                contour_method,
                sam_type,
                sam_device,
            ],
            outputs=[slider, gallery, zip_out, table, status, batch_state],
            concurrency_id="veil_edit", concurrency_limit=1,
        ).then(lambda: ("処理結果から修正する画像を選んでください。",None,"処理結果から修正する画像を選んでください。"),
               outputs=[manual_editor,manual_download,manual_status])
        gallery.select(select_manual_image,inputs=[batch_state],
                       outputs=[manual_editor,batch_state,manual_status,slider],
                       concurrency_id="veil_edit",concurrency_limit=1)
        manual_close.click(clear_manual_editor,inputs=[batch_state],
                            outputs=[batch_state,gallery,manual_download,manual_status],
                            concurrency_id="veil_edit",concurrency_limit=1
                            ).then(lambda: ("処理結果から修正する画像を選んでください。",""),outputs=[manual_editor,manual_mask_data])
        manual_reload.click(reload_manual_image,inputs=[batch_state],
                            outputs=[manual_editor,batch_state,manual_status,slider],
                            concurrency_id="veil_edit",concurrency_limit=1)
        manual_save.click(save_manual_edit,
                          inputs=[manual_mask_data,batch_state,style,block_size,fill_enclosed,manual_margin,manual_action],
                          outputs=[manual_editor,gallery,zip_out,manual_download,manual_status,batch_state,slider],
                          concurrency_id="veil_edit",concurrency_limit=1)
    return demo


def main() -> None:
    threading.Thread(target=lambda: warmup("illust"), daemon=True).start()
    port = int(os.environ.get("PORT", "7863"))
    host = os.environ.get("HOST", "127.0.0.1")
    if host in ("127.0.0.1", "localhost"):
        threading.Timer(
            1.6,
            lambda: webbrowser.open(f"http://127.0.0.1:{port}/"),
        ).start()
    demo = build()
    demo.queue(max_size=16)

    api = FastAPI()
    pack = offline_zip_path()
    if pack is not None:

        @api.middleware("http")
        async def serve_offline_zip(request: Request, call_next):
            if request.url.path.rstrip("/") == "/veil-offline.zip":
                return FileResponse(
                    path=str(pack),
                    filename="veil-offline.zip",
                    media_type="application/zip",
                )
            return await call_next(request)

    gr.mount_gradio_app(
        api,
        demo,
        path="/",
        allowed_paths=local_allowed_paths(),
        ssr_mode=False,
        pwa=False,
        enable_monitoring=False,
        show_api=False,
    )
    uvicorn.run(api, host=host, port=port, log_level="warning")


if __name__ == "__main__":
    main()

