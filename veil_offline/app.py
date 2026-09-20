from __future__ import annotations

import os
import string
import sys
import threading
import webbrowser
import zipfile
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
    progress=gr.Progress(),
):
    mode = "photo" if mode_label == "実写" else "illust"
    parts = [JA_TO_PART[p] for p in (parts_ja or []) if p in JA_TO_PART]
    style = "blur" if style_ja == "ぼかし" else "pixel"
    shape = "rect" if shape_ja == "矩形" else "ellipse"

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
            )
        except Exception as e:
            rows.append([src.name, "失敗", str(e)])
            continue

        out_path = OUT_DIR / f"{src.stem}_{i}_mosaic.png"
        result.save(out_path, "PNG")
        gallery.append((str(out_path), src.name))
        zip_entries.append((str(mosaic_relpath(src, src_root)).replace("\\", "/"), out_path))
        mosaic_total += len(mosaicked)
        hits = "、".join(
            f"{PART_JA.get(d.part, d.part)} {d.score * 100:.0f}%" for d in detections
        ) or "検出なし"
        rows.append([src.name, f"{len(mosaicked)} 箇所", hits])
        if slider is None:
            orig_path = OUT_DIR / f"{src.stem}_{i}_orig.png"
            if original.mode != "RGB":
                original = original.convert("RGB")
            if result.mode != "RGB":
                result = result.convert("RGB")
            if result.size != original.size:
                result = result.resize(original.size, Image.Resampling.NEAREST)
            original.save(orig_path, "PNG")
            result.save(out_path, "PNG")
            slider = (str(orig_path), str(out_path))

        if dest_root is not None:
            rel = mosaic_relpath(src, src_root)
            dest = dest_root / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            result.save(dest, "PNG")
            saved_local += 1

    if not zip_entries:
        raise gr.Error("処理できた画像がありません")

    zip_path = OUT_DIR / "veil_mosaic.zip"
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
    )


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

    with gr.Blocks(title="ヴェール", theme=theme, css=CSS) as demo:
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
                    shape = gr.Radio(["楕円", "矩形"], value="楕円", label="形状")
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
            ],
            outputs=[slider, gallery, zip_out, table, status],
        )
    return demo


def main() -> None:
    threading.Thread(target=lambda: warmup("illust"), daemon=True).start()
    port = int(os.environ.get("PORT", "8080"))
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
