import base64
import io
import json
import unittest
from PIL import Image, ImageDraw
from canvas_editor import render_canvas,decode_canvas
from manual import manual_mask


class CanvasTests(unittest.TestCase):
    def test_mask_roundtrip_and_no_background_leak(self):
        image=Image.new("RGB",(80,60),"white")
        mask=Image.new("RGBA",image.size)
        ImageDraw.Draw(mask).rectangle((10,10,40,40),outline="#ff3366",width=3)
        data=io.BytesIO();mask.save(data,"PNG")
        payload=json.dumps({"key":"test.png","mask":"data:image/png;base64,"+base64.b64encode(data.getvalue()).decode()})
        value=decode_canvas(payload,image,"test.png")
        selection=manual_mask(value,image.size)
        self.assertEqual(selection.getpixel((20,20)),255)
        self.assertEqual(selection.getpixel((5,5)),0)
        with self.assertRaises(ValueError):decode_canvas(payload,image,"other.png")
        with self.assertRaises(ValueError):decode_canvas(payload,Image.new("RGB",(5,5)),"test.png")

    def test_invalid_payload_rejected(self):
        image=Image.new("RGB",(80,60))
        for payload in ["", "{", "null",json.dumps({"key":"test.png","mask":"not PNG"})]:
            with self.assertRaises(ValueError):decode_canvas(payload,image,"test.png")

    def test_key_escaped_in_html(self):
        markup=render_canvas(Image.new("RGB",(10,10)), 'test"<.png')
        self.assertIn('data-key="test&quot;&lt;.png"',markup)
        self.assertIn('data:image/png;base64,',markup)


if __name__ == "__main__":unittest.main()
