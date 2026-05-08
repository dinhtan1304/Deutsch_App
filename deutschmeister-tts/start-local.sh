#!/usr/bin/env bash
# Local-dev launcher for the Coqui TTS service on macOS/Linux.
# Usage: ./start-local.sh
#
# Requires: python3.10–3.12, ffmpeg, espeak-ng on PATH.

set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  echo "[start] loaded .env"
fi

if [ ! -f .venv/bin/python ]; then
  echo "[start] creating Python venv..."
  python3 -m venv .venv
  .venv/bin/pip install --upgrade pip
  .venv/bin/pip install --index-url https://download.pytorch.org/whl/cpu torch==2.4.1 torchaudio==2.4.1
  .venv/bin/pip install "coqui-tts==0.27.0" "fastapi==0.115.6" "uvicorn[standard]==0.32.1" "pydantic==2.10.3" "numpy<2.0" "transformers==4.52.4" "tokenizers>=0.21,<0.22"
  echo "[start] venv ready"
fi

PORT="${TTS_PORT:-8001}"
echo "[start] launching TTS service on http://127.0.0.1:$PORT"
exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port "$PORT"
