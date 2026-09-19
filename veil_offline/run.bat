@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set PORT=8080
set HOST=127.0.0.1
set GRADIO_ANALYTICS_ENABLED=False
set HF_HUB_OFFLINE=1
set TRANSFORMERS_OFFLINE=1
set PY=

where py >nul 2>&1
if not errorlevel 1 (
  py -3 -c "import sys" >nul 2>&1
  if not errorlevel 1 set PY=py -3
)
if not defined PY (
  where python >nul 2>&1
  if not errorlevel 1 set PY=python
)
if not defined PY (
  where python3 >nul 2>&1
  if not errorlevel 1 set PY=python3
)
if not defined PY (
  for /d %%D in ("%LocalAppData%\Programs\Python\Python3*") do (
    if exist "%%D\python.exe" set PY="%%D\python.exe"
  )
)

if not defined PY (
  echo.
  echo Python was not found.
  echo Install Python 3.10+ from https://www.python.org/downloads/
  echo On the installer, CHECK: Add python.exe to PATH
  echo Then run run.bat again.
  echo.
  echo Python ga mitsukarimasen.
  echo python.org kara 3.10 ijou wo irete,
  echo "Add python.exe to PATH" ni check wo irete kudasai.
  echo.
  start "" "https://www.python.org/downloads/"
  pause
  exit /b 1
)

%PY% -c "import gradio,onnxruntime,PIL,numpy" >nul 2>&1
if errorlevel 1 (
  echo First run: installing libraries. Internet required.
  echo Shokai dake library wo iremasu.
  %PY% -m pip install -r requirements.txt
  if errorlevel 1 (
    echo pip install failed.
    pause
    exit /b 1
  )
)

echo Starting Veil. Close this window to stop.
%PY% app.py
if errorlevel 1 (
  echo app.py failed.
)
pause
