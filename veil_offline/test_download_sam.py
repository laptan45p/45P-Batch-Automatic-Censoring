import io
from pathlib import Path
import tempfile
import unittest
from download_sam import download_model, MODEL_NAME


class Response(io.BytesIO):
    def __init__(self, data, length=None):
        super().__init__(data)
        self.headers = {"Content-Length": str(len(data) if length is None else length)}


def validate(path):
    if path.read_bytes() != b"valid checkpoint":
        raise ValueError("invalid checkpoint")


class DownloadTests(unittest.TestCase):
    def test_download_then_reuse(self):
        with tempfile.TemporaryDirectory() as folder:
            path = download_model(folder, opener=lambda *a,**k: Response(b"valid checkpoint"),
                                  validator=validate, report=lambda s:None)
            self.assertEqual(path.read_bytes(), b"valid checkpoint")
            def no_network(*args,**kwargs):
                self.fail("An existing valid model must not be downloaded again")
            self.assertEqual(download_model(folder, opener=no_network, validator=validate,
                                           report=lambda s:None),path)

    def test_incomplete_download_preserves_existing_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/MODEL_NAME
            path.write_bytes(b"old invalid file")
            with self.assertRaises(IOError):
                download_model(folder, opener=lambda *a,**k: Response(b"truncated",100),
                               validator=validate, report=lambda s:None)
            self.assertEqual(path.read_bytes(),b"old invalid file")
            self.assertEqual(list(Path(folder).glob("*.part")),[])

    def test_invalid_response_not_installed(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaises(ValueError):
                download_model(folder, opener=lambda *a,**k: Response(b"HTML error page"),
                               validator=validate, report=lambda s:None)
            self.assertEqual(list(Path(folder).iterdir()),[])

    def test_invalid_existing_file_replaced(self):
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder)/MODEL_NAME).write_bytes(b"invalid")
            path=download_model(folder, opener=lambda *a,**k: Response(b"valid checkpoint"),
                                validator=validate, report=lambda s:None)
            self.assertEqual(path.read_bytes(),b"valid checkpoint")


if __name__ == "__main__":
    unittest.main()
