"""Coqui TTS synthesizer wrapping Thorsten VITS for German.

Loads the model once at import time and exposes synthesize() which writes a
mono 22050 Hz WAV to a path. Conversion to MP3 happens in main.py (ffmpeg).
"""

from __future__ import annotations

import logging
import os
import threading
from pathlib import Path

from TTS.api import TTS

logger = logging.getLogger(__name__)

# Thorsten VITS — single-speaker German voice, MPL-2.0 license, runs on CPU
# with reasonable latency (~1-2s for short phrases). Override via env if needed.
DEFAULT_MODEL = os.environ.get(
    "TTS_MODEL",
    "tts_models/de/thorsten/vits",
)

# Local model cache directory (mounted as volume in Docker so models survive
# container restarts and we don't re-download ~150 MB on every boot).
MODEL_CACHE_DIR = os.environ.get("TTS_MODEL_CACHE", "/models")
os.environ.setdefault("COQUI_TOS_AGREED", "1")  # accept Coqui ToS for XTTS
os.environ.setdefault("TTS_HOME", MODEL_CACHE_DIR)

_lock = threading.Lock()
_tts: TTS | None = None


def get_tts() -> TTS:
    """Lazy-init the TTS model. Thread-safe via lock — synthesis itself is
    serialized too, since the underlying model is not thread-safe."""
    global _tts
    if _tts is None:
        with _lock:
            if _tts is None:
                logger.info("Loading TTS model: %s", DEFAULT_MODEL)
                Path(MODEL_CACHE_DIR).mkdir(parents=True, exist_ok=True)
                _tts = TTS(model_name=DEFAULT_MODEL, progress_bar=False)
                logger.info("TTS model loaded")
    return _tts


def synthesize_to_wav(text: str, out_path: str) -> None:
    """Synthesize `text` to a WAV file at `out_path`. Serialized — only one
    synthesis runs at a time to avoid model races on CPU."""
    tts = get_tts()
    with _lock:
        tts.tts_to_file(text=text, file_path=out_path)
