# Coqui TTS service for German (Thorsten VITS).
#
# Two-stage: model download in stage 1, slim runtime in stage 2.
# Python 3.11 — Coqui TTS does not yet support 3.13/3.14 (PyTorch wheels lag).
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    COQUI_TOS_AGREED=1 \
    TTS_HOME=/models

WORKDIR /app

# Build deps for some Python packages (numpy, scipy, etc). espeak-ng is the
# phonemizer backend used by VITS — without it Coqui falls back to a worse
# grapheme-only path. ffmpeg encodes WAV → MP3 at request time.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        espeak-ng \
        ffmpeg \
        git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
# Install torch from the CPU-only index first (smaller — ~200 MB vs ~2 GB
# CUDA build), then the rest. requirements.txt pins transformers<5 because
# the 5.x release broke on torch 2.4 (needs torch >= 2.6).
RUN pip install --upgrade pip && \
    pip install --index-url https://download.pytorch.org/whl/cpu torch==2.4.1 torchaudio==2.4.1 && \
    pip install -r requirements.txt

# Pre-download the Thorsten model so the first request doesn't pay the
# ~150 MB download. Models go to /models, which is also a volume mount target.
RUN mkdir -p /models && python -c "from TTS.api import TTS; TTS(model_name='tts_models/de/thorsten/vits', progress_bar=False)"

# ── Runtime stage ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    COQUI_TOS_AGREED=1 \
    TTS_HOME=/models \
    TTS_MODEL_CACHE=/models

WORKDIR /app

# espeak-ng + ffmpeg also needed at runtime (phonemizer + MP3 encoding).
RUN apt-get update && apt-get install -y --no-install-recommends \
        espeak-ng \
        ffmpeg \
        libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages and pre-downloaded model from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /models /models

COPY app ./app

EXPOSE 8001

# 1 worker — the model holds ~500 MB of weights and serializes synthesis
# internally, so multiple workers would just multiply RAM without speedup.
# Scale by running multiple containers behind a load balancer.
#
# $PORT is set by Railway/Fly/Render at runtime; falls back to 8001 for local
# `docker run` without -e PORT. Shell form is required so the env var expands.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1
