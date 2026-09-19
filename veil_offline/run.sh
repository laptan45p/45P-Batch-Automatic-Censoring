#!/bin/sh
cd "$(dirname "$0")"
export PORT="${PORT:-8080}"
export HOST="${HOST:-0.0.0.0}"
export GRADIO_ANALYTICS_ENABLED=False
export HF_HUB_OFFLINE=1
if ! python3 -c "import gradio,onnxruntime,PIL,numpy" >/dev/null 2>&1; then
  python3 -m pip install -r requirements.txt
fi
exec python3 app.py
