#!/bin/sh
cd "$(dirname "$0")"
export PORT="${PORT:-8080}"
export HOST="${HOST:-127.0.0.1}"
export GRADIO_ANALYTICS_ENABLED=False
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1

PY=python3
command -v python3 >/dev/null 2>&1 || PY=python

if [ ! -x ".venv/bin/python" ]; then
  echo "Creating virtual environment in .venv"
  "$PY" -m venv .venv
fi
VPY=".venv/bin/python"

if ! "$VPY" -c "import gradio,onnxruntime,PIL,numpy" >/dev/null 2>&1; then
  echo "First run: installing libraries into .venv"
  "$VPY" -m pip install --upgrade pip
  "$VPY" -m pip install -r requirements.txt
fi

exec "$VPY" app.py
