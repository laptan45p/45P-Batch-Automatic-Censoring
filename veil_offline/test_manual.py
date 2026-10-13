import unittest
from unittest.mock import patch
import numpy as np
from PIL import Image, ImageDraw
from manual import manual_mask, apply_manual, redetect_manual
from engine import Detection, Box


class ManualTests(unittest.TestCase):
    def test_redetection_uses_original_and_preserves_existing(self):
        original=Image.new("RGB",(100,80),(80,100,120))
        current=original.copy()
        ImageDraw.Draw(current).rectangle((35,35,40,40),fill="black")
        layer=Image.new("RGBA",original.size)
        ImageDraw.Draw(layer).rectangle((20,20,60,60),outline="white",width=2)
        calls=[]
        def detect(crop,**kwargs):
            calls.append(crop.copy())
            result=Image.new("RGB",crop.size,"red")
            return result,[],[Detection("male","penis",.9,Box(5,5,40,40))]
        settings={"expand":1.0}
        with patch("engine.detect_and_censor",side_effect=detect):
            result,found,changed=redetect_manual(original,current,{"layers":[layer]},settings)
        self.assertEqual(found,1)
        self.assertGreater(changed,0)
        self.assertEqual(calls[0].getpixel((0,0)),(80,100,120))
        self.assertTrue(np.all(np.asarray(calls[0])==[80,100,120]))
        self.assertEqual(result.getpixel((38,38)),(0,0,0))
        self.assertEqual(result.getpixel((5,5)),original.getpixel((5,5)))
        self.assertEqual(result.getpixel((25,25)),(255,0,0))

    def test_no_detection_does_not_fill_selection(self):
        original=Image.new("RGB",(100,80),(80,100,120))
        layer=Image.new("RGBA",original.size)
        ImageDraw.Draw(layer).rectangle((20,20,60,60),fill="white")
        with patch("engine.detect_and_censor",side_effect=lambda crop,**k:(crop.copy(),[],[])):
            result,found,changed=redetect_manual(original,original,{"layers":[layer]},{"expand":1.0})
        np.testing.assert_array_equal(result,original)
        self.assertEqual((found,changed),(0,0))

    def test_only_detected_pixels_inside_selection_are_changed(self):
        original=Image.new("RGB",(100,80),(80,100,120))
        layer=Image.new("RGBA",original.size)
        ImageDraw.Draw(layer).rectangle((20,20,60,60),fill="white")
        def detect(crop,**kwargs):
            processed=crop.copy()
            ImageDraw.Draw(processed).rectangle((15,15,22,22),fill="red")
            return processed,[],[Detection("male","penis",.9,Box(15,15,8,8))]
        with patch("engine.detect_and_censor",side_effect=detect):
            result,found,changed=redetect_manual(original,original,{"layers":[layer]},{"expand":1.0})
        self.assertEqual(changed,64)
        self.assertEqual(result.getpixel((28,28)),(255,0,0))
        self.assertEqual(result.getpixel((50,50)),original.getpixel((50,50)))

    def test_separate_regions_are_detected_separately(self):
        original=Image.new("RGB",(100,80),(80,100,120))
        layer=Image.new("RGBA",original.size)
        draw=ImageDraw.Draw(layer)
        draw.rectangle((10,10,20,20),fill="white")
        draw.rectangle((70,50,80,60),fill="white")
        with patch("engine.detect_and_censor",side_effect=lambda crop,**k:(crop.copy(),[],[])) as detect:
            redetect_manual(original,original,{"layers":[layer]},{"expand":1.0})
        self.assertEqual(detect.call_count,2)

    def test_closed_outline_is_filled(self):
        layer=Image.new("RGBA",(100,80))
        ImageDraw.Draw(layer).rectangle((20,20,60,60),outline="white",width=3)
        mask=manual_mask({"layers":[layer]},layer.size)
        self.assertEqual(mask.getpixel((40,40)),255)
        self.assertEqual(mask.getpixel((5,5)),0)
        brush_only=manual_mask({"layers":[layer]},layer.size,False)
        self.assertEqual(brush_only.getpixel((40,40)),0)

    def test_margin_and_multiple_layers(self):
        layers=[Image.new("RGBA",(100,80)) for _ in range(2)]
        ImageDraw.Draw(layers[0]).rectangle((20,20,30,30),fill="white")
        ImageDraw.Draw(layers[1]).rectangle((60,20,70,30),fill="white")
        mask=manual_mask({"layers":layers},(100,80),False,4)
        self.assertEqual(mask.getpixel((17,25)),255)
        self.assertEqual(mask.getpixel((65,25)),255)
        self.assertEqual(mask.getpixel((45,25)),0)

    def test_empty_and_resized_layers_rejected(self):
        with self.assertRaises(ValueError):
            manual_mask({"layers":[]},(100,80))
        with self.assertRaises(ValueError):
            manual_mask({"layers":[Image.new("RGBA",(10,10))]},(100,80))

    def test_pixels_outside_selection_unchanged(self):
        pixels=np.random.default_rng(5).integers(0,256,(80,100,3),dtype=np.uint8)
        original=Image.fromarray(pixels)
        layer=Image.new("RGBA",original.size)
        ImageDraw.Draw(layer).rectangle((20,20,40,40),fill="white")
        mask=np.asarray(manual_mask({"layers":[layer]},original.size))>0
        result=np.asarray(apply_manual(original,{"layers":[layer]}))
        np.testing.assert_array_equal(result[~mask],pixels[~mask])
        self.assertTrue(np.any(result[mask]!=pixels[mask]))
        # Further corrections preserve the previous mosaic exactly outside the new mask.
        second=Image.new("RGBA",original.size)
        ImageDraw.Draw(second).rectangle((60,20,80,40),fill="white")
        final=np.asarray(apply_manual(Image.fromarray(result),{"layers":[second]}))
        np.testing.assert_array_equal(final[mask],result[mask])


if __name__ == "__main__":
    unittest.main()
