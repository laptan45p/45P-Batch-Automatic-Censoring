"""Install the official SAM vit_b checkpoint without leaving incomplete models."""
from pathlib import Path
import tempfile
import urllib.request

MODEL_NAME = "sam_vit_b_01ec64.pth"
MODEL_URL = "https://dl.fbaipublicfiles.com/segment_anything/" + MODEL_NAME
ROOT = Path(__file__).resolve().parent


def validate_checkpoint(path):
    import torch
    state = torch.load(str(path), map_location="cpu", weights_only=True)
    weight = state.get("image_encoder.patch_embed.proj.weight") if isinstance(state, dict) else None
    if weight is None or tuple(weight.shape) != (768, 3, 16, 16):
        raise ValueError("Not a SAM vit_b checkpoint")
    if not any(k.startswith("mask_decoder.") for k in state):
        raise ValueError("Incomplete SAM checkpoint")


def download_model(directory=None, *, opener=urllib.request.urlopen,
                   validator=validate_checkpoint, report=print):
    directory = Path(directory) if directory is not None else ROOT / "models"
    directory.mkdir(parents=True, exist_ok=True)
    destination = directory / MODEL_NAME
    if destination.is_file():
        try:
            validator(destination)
            report("Existing SAM vit_b model verified: " + str(destination.resolve()))
            return destination
        except Exception:
            report("Existing model is invalid; downloading a replacement.")
    temporary = None
    try:
        request = urllib.request.Request(MODEL_URL, headers={"User-Agent": "Veil-SAM-Installer"})
        with opener(request, timeout=60) as response, tempfile.NamedTemporaryFile(
                dir=directory, prefix=MODEL_NAME + ".", suffix=".part", delete=False) as output:
            temporary = Path(output.name)
            expected = int(response.headers.get("Content-Length", 0))
            received = 0
            last_report = -1
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                output.write(chunk)
                received += len(chunk)
                progress = received // (25 * 1024 * 1024)
                if progress != last_report:
                    total = f" / {expected / 1024**2:.0f} MB" if expected else " MB"
                    report(f"Downloaded {received / 1024**2:.0f}" + total)
                    last_report = progress
            if expected and received != expected:
                raise IOError(f"Incomplete download: {received} / {expected} bytes")
        report("Checking downloaded checkpoint...")
        validator(temporary)
        temporary.replace(destination)
        report("SAM model ready: " + str(destination.resolve()))
        return destination
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        download_model()
    except Exception as exc:
        print("SAM download failed: " + str(exc))
        raise SystemExit(1)
