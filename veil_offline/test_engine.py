import unittest
from unittest.mock import patch
import numpy as np
from PIL import Image, ImageDraw
import engine
from engine import Box
from contour import ContourSegmenter, sam_model_path, SAM_MODELS


def scene():
    im = Image.new("RGB", (200,160), (20,35,50))
    ImageDraw.Draw(im).polygon([(80,35),(145,90),(115,130),(55,90)], fill=(230,160,120))
    return im


class EngineTests(unittest.TestCase):
    def test_contour_tracks_polygon_and_margin(self):
        im = scene()
        seg = ContourSegmenter(im)
        box = Box(55,35,90,95)
        expanded = engine.expand_box(box,1.5,*im.size)
        mask, status = seg.mask(box,expanded,0)
        self.assertIsNotNone(mask,status)
        a = np.asarray(mask)>0
        self.assertTrue(a[90,100])
        self.assertFalse(a[35,55])
        grown, _ = seg.mask(box,expanded,8)
        b = np.asarray(grown)>0
        self.assertTrue(np.all(b[a]))
        self.assertGreater(b.sum(),a.sum())

    def test_empty_mask_falls_back(self):
        seg = ContourSegmenter(scene())
        with patch("cv2.grabCut", side_effect=lambda im, labels, *args: labels.fill(0)):
            mask,status = seg.mask(Box(55,35,90,95),Box(30,10,140,140),6)
        self.assertIsNone(mask)
        self.assertIn("矩形",status)

    def test_small_mask_falls_back(self):
        mask,status = ContourSegmenter(scene()).mask(Box(1,1,3,3),Box(0,0,5,5),6)
        self.assertIsNone(mask)

    def test_holes_are_filled(self):
        seg = ContourSegmenter(scene())
        class Predictor:
            def predict(self,**kwargs):
                mask = np.zeros((160,200),bool)
                mask[40:125,60:140] = True
                mask[55:65,75:85] = False
                return np.array([mask]), np.array([.99]), None
        seg.predictor = Predictor()
        mask,_ = seg.mask(Box(55,35,90,95),Box(30,10,140,140),0)
        self.assertEqual(np.asarray(mask)[60,80],255)

    def test_sam_low_quality_falls_back(self):
        seg = ContourSegmenter(scene())
        class Predictor:
            def predict(self,**kwargs):
                return np.ones((1,160,200),bool),np.array([.1]),None
        seg.predictor = Predictor()
        mask,_ = seg.mask(Box(30,10,140,140),Box(30,10,140,140),0)
        self.assertIsNone(mask)

    def test_class_aware_nms_and_clipping(self):
        out = np.zeros((1,7,3),np.float32)
        out[0,:4,:] = np.array([[20,20,20],[30,30,30],[80,80,80],[40,40,40]])
        out[0,4,0] = .9
        out[0,5,1] = .8
        out[0,4,2] = .7
        detections = engine._postprocess(out,"illust",0,0,640,640,640,.25)
        self.assertEqual(len(detections),2)
        self.assertEqual(detections[0].box.x,0)
        self.assertEqual(detections[0].box.w,60)

    def test_refinement_matches_same_target(self):
        class Session:
            calls = 0
            def get_inputs(self):
                return [type("Input",(),{"name":"images"})()]
            def run(self,*args):
                self.calls += 1
                return [np.zeros((1,7,1))]
        sess = Session()
        first = engine.Detection("male","penis",.9,Box(55,35,90,95))
        # Crop fills the image; local coordinates are original coordinates here.
        second = engine.Detection("male","penis",.85,Box(60,40,80,85))
        with patch.object(engine,"get_session",return_value=sess), patch.object(
                engine,"_postprocess",side_effect=[[first],[second]]):
            _,detections,_ = engine.detect_and_censor(scene(),"illust",["male"],.25,
                1.5,18,"pixel","rect",False,refine=True)
        self.assertEqual(sess.calls,2)
        self.assertEqual(detections[0].box.w,80)

    def test_contour_fallback_is_full_rectangle(self):
        im = scene()
        det = engine.Detection("male","penis",.9,Box(55,35,90,95))
        class Session:
            def get_inputs(self):
                return [type("Input",(),{"name":"images"})()]
            def run(self,*args):
                return [np.zeros((1,7,1))]
        with patch.object(engine,"get_session",return_value=Session()), patch.object(
                engine,"_postprocess",return_value=[det]), patch.object(
                ContourSegmenter,"mask",return_value=(None,"矩形に切替")):
            result,_,_ = engine.detect_and_censor(im,"illust",["male"],.25,
                1.3,18,"pixel","contour",False)
        expected = im.copy()
        engine.apply_mosaic(expected,engine.expand_box(det.box,1.3,*im.size),"pixel","rect",18)
        np.testing.assert_array_equal(result,expected)
        self.assertIn("矩形",det.mask_status)

    def test_sam_missing_file_reports_setup_error(self):
        with patch("pathlib.Path.is_file",return_value=False):
            with self.assertRaisesRegex(ValueError,"sam_vit_b_01ec64.pth"):
                ContourSegmenter(scene(),"sam")

    def test_sam_model_paths_are_fixed(self):
        for kind, filename in SAM_MODELS.items():
            path = sam_model_path(kind)
            self.assertEqual(path.parent, engine.ROOT / "models")
            self.assertEqual(path.name,filename)
        with self.assertRaises(ValueError):
            sam_model_path("../other")


if __name__ == "__main__":
    unittest.main()
