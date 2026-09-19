#!/bin/sh
set -eu
cd /workspace
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
export PORT=8080
export HOST=0.0.0.0
export GRADIO_ANALYTICS_ENABLED=False
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
mkdir -p /tmp
cd /workspace/veil_offline
python3 app.py >>/tmp/app-startup.log 2>&1 &
