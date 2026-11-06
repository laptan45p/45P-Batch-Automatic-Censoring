import io
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

import numpy as np
from PIL import Image, ImageDraw

import app


class ExportTests(unittest.TestCase):
    def test_transparent_jpeg_has_white_background(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "image.jpg"
            app.export_image(Image.new("RGBA", (16, 16), (255, 0, 0, 0)), path, "JPEG")
            with Image.open(path) as image:
                self.assertEqual(image.format, "JPEG")
                self.assertEqual(image.getpixel((8, 8)), (255, 255, 255))

    def test_batch_and_repeated_manual_edits_export_selected_format(self):
        for fmt, suffix in [("PNG", ".png"), ("JPEG", ".jpg")]:
            with self.subTest(format=fmt), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                src = root / "input" / "sub"
                src.mkdir(parents=True)
                pixels = np.random.default_rng(8).integers(0, 256, (64, 64, 3), dtype=np.uint8)
                for name in ["one", "two"]:
                    Image.fromarray(pixels).save(src / (name + ".png"))
                with patch.object(app, "OUT_DIR", root / "runs"), \
                     patch.object(app, "warmup"), \
                     patch.object(app, "detect_and_censor", side_effect=lambda image, **kw: (image.copy(), [], [])):
                    result = app.process(None, None, str(root / "input"), str(root / "saved"),
                                         True, True, "イラスト", ["女性器"], .28, 1.45,
                                         18, "ピクセル", "矩形", False,
                                         output_format=fmt, progress=lambda *a, **kw: None)
                batch = result[-1]
                for edit in range(2):
                    self.assert_exports(batch, fmt, suffix)
                    batch["selected"] = 0
                    record = batch["records"][0]
                    with Image.open(record["output"]) as image:
                        current = image.copy()
                    layer = Image.new("RGBA", current.size)
                    ImageDraw.Draw(layer).rectangle((10, 10, 30, 30), fill="white")
                    edited = app.save_manual_edit({"background": current, "layers": [layer]},
                                                 batch, "ピクセル", 12, True, 0, "範囲全体にかける")
                    self.assertTrue(edited[3].endswith(suffix))
                    batch = edited[-2]
                    # Working pixels outside the selection remain exact, including JPEG exports.
                    with Image.open(batch["records"][0]["output"]) as image:
                        self.assertEqual(image.getpixel((0, 0)), current.getpixel((0, 0)))
                self.assert_exports(batch, fmt, suffix)

    def assert_exports(self, batch, fmt, suffix):
        with zipfile.ZipFile(batch["zip"]) as archive:
            self.assertEqual(len(archive.namelist()), 2)
            for record in batch["records"]:
                self.assertTrue(record["archive"].startswith("sub/"))
                self.assertTrue(record["archive"].endswith(suffix))
                encoded = archive.read(record["archive"])
                self.assertEqual(encoded, Path(record["local"]).read_bytes())
                with Image.open(io.BytesIO(encoded)) as image:
                    self.assertEqual(image.format, fmt)
                    self.assertEqual(image.size, (64, 64))

    def test_default_format_and_invalid_format(self):
        self.assertEqual(app.mosaic_relpath(Path("photo.webp"), None), Path("photo_mosaic.png"))
        with self.assertRaises(app.gr.Error):
            app.process(*([None] * 14), output_format="GIF")


if __name__ == "__main__":
    unittest.main()
