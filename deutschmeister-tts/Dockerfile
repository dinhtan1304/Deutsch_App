# Piper TTS service for German (Thorsten medium voice).
#
# Two-stage: install deps + download the voice in stage 1, slim runtime in
# stage 2. Piper runs on onnxruntime (no torch), so the image is far smaller
# and lighter on RAM than the old Coqui/torch build.
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# ffmpeg encodes WAV → MP3 at request time. libgomp1 is the GNU OpenMP runtime
# that onnxruntime (Piper's inference engine) links against — python:slim does
# NOT ship it, and without it `import onnxruntime` fails. Piper bundles its own
# espeak-ng phonemizer in the wheel, so no system espeak-ng is needed.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Pre-download the Thorsten medium voice (.onnx + .onnx.json) so the first
# request — and container startup — doesn't need network. /models is also the
# volume mount target (TTS_MODEL_CACHE).
RUN mkdir -p /models && \
    python -m piper.download_voices de_DE-thorsten-medium --data-dir /models

# ── Runtime stage ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TTS_MODEL=de_DE-thorsten-medium \
    TTS_MODEL_CACHE=/models

WORKDIR /app

# ffmpeg for MP3 encoding; libgomp1 is required by onnxruntime (Piper's engine)
# and is not present in python:slim. (espeak-ng is bundled in the piper wheel.)
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages and the pre-downloaded voice from builder.
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /models /models

COPY app ./app

EXPOSE 8001

# 1 worker — synthesis is serialized via a lock in synthesizer.py, so extra
# workers would only multiply RAM. Scale by running multiple containers.
#
# $PORT is set by Railway/Fly/Render at runtime; falls back to 8001 for local
# `docker run` without -e PORT. Shell form is required so the env var expands.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1
