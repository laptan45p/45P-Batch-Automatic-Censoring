"""Small Canvas-based selection editor; only its transparent mask is submitted."""
import base64
import html
import io
import json
from PIL import Image


def render_canvas(image, key):
    data=io.BytesIO(); image.save(data,"PNG")
    encoded=base64.b64encode(data.getvalue()).decode("ascii")
    return f'''<section data-veil-canvas data-key="{html.escape(key,quote=True)}">
      <div class="veil-canvas-tools">
        <button type="button" data-tool="draw" aria-pressed="true">ペン</button>
        <button type="button" data-tool="erase" aria-pressed="false">消しゴム</button>
        <label>太さ <input data-size type="range" min="1" max="64" value="12"> <span data-size-label>12</span>px</label>
        <button type="button" data-undo>ひとつ戻す</button>
        <button type="button" data-clear>選択範囲をクリア</button>
        <button type="button" data-zoom-out aria-label="縮小">−</button>
        <span data-zoom-label>100%</span>
        <button type="button" data-zoom-in aria-label="拡大">＋</button>
        <button type="button" data-zoom-fit>全体表示</button>
        <button type="button" data-zoom-original>原寸</button>
      </div>
      <p data-canvas-status>画像を読み込んでいます…</p>
      <div class="veil-canvas-view"><canvas aria-label="追加モザイクの範囲" tabindex="0"></canvas></div>
      <img data-background src="data:image/png;base64,{encoded}" alt="" style="display:none">
    </section>'''


def decode_canvas(payload, current, key):
    if not payload or len(payload)>100_000_000:
        raise ValueError("手動範囲を囲むか塗ってください。")
    try:
        data=json.loads(payload)
        if data.get("key")!=key:
            raise ValueError("選択画像が変わりました。画像を選び直してください。")
        uri=data.get("mask","")
        prefix="data:image/png;base64,"
        if not uri.startswith(prefix):
            raise ValueError("選択範囲を読み込めません。")
        raw=base64.b64decode(uri[len(prefix):],validate=True)
        with Image.open(io.BytesIO(raw)) as layer:
            if layer.size!=current.size or layer.format!="PNG":
                raise ValueError("選択範囲のサイズが画像と一致しません。")
            mask=layer.convert("RGBA").copy()
        return {"background":current,"layers":[mask],"composite":None}
    except (json.JSONDecodeError,TypeError,AttributeError,KeyError,OSError) as exc:
        raise ValueError("選択範囲を読み込めません。画像を選び直してください。") from exc
