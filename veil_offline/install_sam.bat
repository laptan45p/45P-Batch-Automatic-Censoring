@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Run run.bat once before installing SAM.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" -m pip install torch torchvision "git+https://github.com/facebookresearch/segment-anything.git"
if errorlevel 1 (
  echo Installation failed. Git and internet access are required.
  pause
  exit /b 1
)
echo Downloading the recommended SAM vit_b model (about 375 MB).
".venv\Scripts\python.exe" download_sam.py
if errorlevel 1 (
  echo Model download failed. Check your connection and run this file again.
  pause
  exit /b 1
)
echo SAM setup complete. Restart Veil and select SAM with model type vit_b.
pause
