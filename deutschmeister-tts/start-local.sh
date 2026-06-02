#!/usr/bin/env bash
# Local-dev launcher for the Piper TTS service on macOS/Linux.
# Usage: ./start-local.sh
#
# Requires: python3 and ffmpeg on PATH. (Piper bundles its own espeak-ng.)

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
fi

# Ensure deps are installed. Re-installs if `piper` is missing, which also
# covers an old venv from before the Coqui -> Piper switch.
if ! .venv/bin/python -c "import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('piper') else 1)"; then
  echo "[start] installing dependencies (piper-tts)..."
  .venv/bin/pip install --upgrade pip
  .venv/bin/pip install -r requirements.txt
fi

# Ensure the Piper voice model is downloaded.
MODEL_CACHE="${TTS_MODEL_CACHE:-./models}"
VOICE_NAME="${TTS_MODEL:-de_DE-thorsten-medium}"
if [ ! -f "$MODEL_CACHE/$VOICE_NAME.onnx" ]; then
  echo "[start] downloading Piper voice $VOICE_NAME -> $MODEL_CACHE"
  mkdir -p "$MODEL_CACHE"
  .venv/bin/python -m piper.download_voices "$VOICE_NAME" --data-dir "$MODEL_CACHE"
fi

PORT="${TTS_PORT:-8001}"
echo "[start] launching TTS service on http://127.0.0.1:$PORT"
exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port "$PORT"
