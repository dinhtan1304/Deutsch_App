"""Piper TTS synthesizer wrapping the Thorsten medium German voice.

Loads the ONNX voice once at first use and exposes synthesize_to_wav() which
writes a mono 22050 Hz WAV to a path. Conversion to MP3 happens in main.py
(ffmpeg).

Why Piper over Coqui: Piper runs on onnxruntime (CPU), ~10x faster than
real-time and with no torch dependency (~1-2 GB lighter), is actively
maintained, and the Thorsten voice author recommends it. The .onnx model and
its .onnx.json config are pre-downloaded into MODEL_CACHE_DIR at build time
(see Dockerfile: `python -m piper.download_voices`).
"""

from __future__ import annotations

import logging
import os
import subprocess
import sys
import threading
import wave
from pathlib import Path

from piper import PiperVoice

logger = logging.getLogger(__name__)

# Piper voice key (lang_REGION-name-quality) or an explicit path to an .onnx
# file. A bare key is resolved to "<MODEL_CACHE_DIR>/<key>.onnx". Override via
# env if needed. We default to the "medium" Thorsten voice: on CPU it runs
# ~6x real-time (vs the "high" model at ~0.6x, which is too slow and risks
# request timeouts) while still sounding clear and natural at 22.05 kHz.
DEFAULT_MODEL = os.environ.get("TTS_MODEL", "de_DE-thorsten-medium")

# Local model cache directory (mounted as volume in Docker so models survive
# container restarts and we don't re-download on every boot).
MODEL_CACHE_DIR = os.environ.get("TTS_MODEL_CACHE", "/models")

_lock = threading.Lock()
_voice: PiperVoice | None = None


def _voice_path() -> str:
    """Resolve DEFAULT_MODEL to an .onnx path. Accepts either a bare voice key
    (looked up under MODEL_CACHE_DIR) or a direct path to an .onnx file."""
    model = DEFAULT_MODEL
    if model.endswith(".onnx"):
        return model
    return str(Path(MODEL_CACHE_DIR) / f"{model}.onnx")


def _ensure_voice(onnx_path: str) -> None:
    """Download the voice if it's missing. This covers the case where a runtime
    volume is mounted over MODEL_CACHE_DIR and shadows the copy that was baked
    into the image at build time (a common Railway/Docker gotcha)."""
    if os.path.exists(onnx_path):
        return
    if DEFAULT_MODEL.endswith(".onnx"):
        raise FileNotFoundError(f"Voice file not found: {onnx_path}")
    logger.warning("Voice %s missing at %s — downloading...", DEFAULT_MODEL, onnx_path)
    Path(MODEL_CACHE_DIR).mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [sys.executable, "-m", "piper.download_voices", DEFAULT_MODEL, "--data-dir", MODEL_CACHE_DIR],
        check=True,
    )
    logger.info("Voice %s downloaded", DEFAULT_MODEL)


def get_tts() -> PiperVoice:
    """Lazy-init the Piper voice. Thread-safe via lock — synthesis itself is
    serialized too, since the onnxruntime session is reused across calls."""
    global _voice
    if _voice is None:
        with _lock:
            if _voice is None:
                path = _voice_path()
                _ensure_voice(path)
                logger.info("Loading Piper voice: %s", path)
                # config_path defaults to "<path>.json" — matches the
                # de_DE-thorsten-medium.onnx.json produced by download_voices.
                _voice = PiperVoice.load(path)
                logger.info("Piper voice loaded")
    return _voice


def synthesize_to_wav(text: str, out_path: str) -> None:
    """Synthesize `text` to a WAV file at `out_path`. Serialized — only one
    synthesis runs at a time to avoid races on the shared onnxruntime session.
    Piper handles multi-sentence text internally, so long passages are fine."""
    voice = get_tts()
    with _lock:
        with wave.open(out_path, "wb") as wav_file:
            voice.synthesize_wav(text, wav_file)
