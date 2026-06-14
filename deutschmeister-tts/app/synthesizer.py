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

from piper import PiperVoice, SynthesisConfig

logger = logging.getLogger(__name__)

# Piper voice key (lang_REGION-name-quality) or an explicit path to an .onnx
# file. A bare key is resolved to "<MODEL_CACHE_DIR>/<key>.onnx". Override via
# env if needed. We default to the "medium" Thorsten voice: on CPU it runs
# ~6x real-time (vs the "high" model at ~0.6x, which is too slow and risks
# request timeouts) while still sounding clear and natural at 22.05 kHz.
DEFAULT_MODEL = os.environ.get("TTS_MODEL", "de_DE-thorsten-medium")

# Logical voice keys → Piper model. A dialogue between two people is read with
# two distinct voices so listeners can tell speakers apart. "male" is the
# default Thorsten voice (kept as DEFAULT_MODEL so single-voice audio — words,
# monologues — never re-synthesizes). "female" adds a second German voice; the
# medium-quality female German Piper voices are limited, so we default to
# kerstin (low) and leave it env-tunable.
DEFAULT_VOICE_KEY = "male"
VOICES = {
    "male": DEFAULT_MODEL,
    "female": os.environ.get("TTS_VOICE_FEMALE", "de_DE-kerstin-low"),
}


def resolve_voice_key(voice: str | None) -> str:
    """Map a requested voice to a known key, falling back to the default."""
    if voice and voice in VOICES:
        return voice
    return DEFAULT_VOICE_KEY


def model_for_voice(voice_key: str) -> str:
    return VOICES.get(voice_key, DEFAULT_MODEL)

# Local model cache directory (mounted as volume in Docker so models survive
# container restarts and we don't re-download on every boot).
MODEL_CACHE_DIR = os.environ.get("TTS_MODEL_CACHE", "/models")

# ── Prosody (env-tunable; no code change needed to adjust on Railway) ─────────
# length_scale > 1 slows speech for a more deliberate, clearer delivery.
# noise_w_scale adds variation in phoneme durations → more natural rhythm and
# emphasis ("nhấn nhá"). sentence_silence inserts a pause between sentences so
# the audio has clear phrasing ("ngắt câu") instead of running sentences
# together (Piper concatenates per-sentence audio with no gap by default).
LENGTH_SCALE = float(os.environ.get("TTS_LENGTH_SCALE", "1.05"))
NOISE_W_SCALE = float(os.environ.get("TTS_NOISE_W_SCALE", "0.9"))
SENTENCE_SILENCE_SEC = float(os.environ.get("TTS_SENTENCE_SILENCE_SEC", "0.3"))

_lock = threading.Lock()
_voices: dict[str, PiperVoice] = {}


def _model_path(model: str) -> str:
    """Resolve a Piper model key to an .onnx path. Accepts either a bare voice
    key (looked up under MODEL_CACHE_DIR) or a direct path to an .onnx file."""
    if model.endswith(".onnx"):
        return model
    return str(Path(MODEL_CACHE_DIR) / f"{model}.onnx")


def _ensure_voice(model: str, onnx_path: str) -> None:
    """Download the voice if it's missing. This covers the case where a runtime
    volume is mounted over MODEL_CACHE_DIR and shadows the copy that was baked
    into the image at build time (a common Railway/Docker gotcha)."""
    if os.path.exists(onnx_path):
        return
    if model.endswith(".onnx"):
        raise FileNotFoundError(f"Voice file not found: {onnx_path}")
    logger.warning("Voice %s missing at %s — downloading...", model, onnx_path)
    Path(MODEL_CACHE_DIR).mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [sys.executable, "-m", "piper.download_voices", model, "--data-dir", MODEL_CACHE_DIR],
        check=True,
    )
    logger.info("Voice %s downloaded", model)


def get_tts(voice_key: str = DEFAULT_VOICE_KEY) -> PiperVoice:
    """Lazy-init the Piper voice for `voice_key`. Thread-safe via lock —
    synthesis itself is serialized too, since the onnxruntime session is reused
    across calls. Each voice is loaded once and cached in `_voices`."""
    voice_key = resolve_voice_key(voice_key)
    cached = _voices.get(voice_key)
    if cached is not None:
        return cached
    with _lock:
        cached = _voices.get(voice_key)
        if cached is not None:
            return cached
        model = model_for_voice(voice_key)
        path = _model_path(model)
        _ensure_voice(model, path)
        logger.info("Loading Piper voice %s: %s", voice_key, path)
        # config_path defaults to "<path>.json" — matches the
        # <model>.onnx.json produced by download_voices.
        voice = PiperVoice.load(path)
        _voices[voice_key] = voice
        logger.info("Piper voice %s loaded", voice_key)
        return voice


def synthesize_to_wav(text: str, out_path: str, voice_key: str = DEFAULT_VOICE_KEY) -> None:
    """Synthesize `text` to a WAV file at `out_path` using `voice_key`.
    Serialized — only one synthesis runs at a time to avoid races on the shared
    onnxruntime session.

    Piper yields one audio chunk per sentence; we write a short silence between
    them for natural phrasing, and apply prosody (length/noise) via syn_config.
    """
    voice = get_tts(voice_key)
    cfg = SynthesisConfig(length_scale=LENGTH_SCALE, noise_w_scale=NOISE_W_SCALE)
    with _lock:
        with wave.open(out_path, "wb") as wav_file:
            silence = b""
            first = True
            for chunk in voice.synthesize(text, syn_config=cfg):
                if first:
                    wav_file.setframerate(chunk.sample_rate)
                    wav_file.setsampwidth(chunk.sample_width)
                    wav_file.setnchannels(chunk.sample_channels)
                    n = int(chunk.sample_rate * SENTENCE_SILENCE_SEC)
                    silence = b"\x00" * (n * chunk.sample_width * chunk.sample_channels)
                    first = False
                elif silence:
                    wav_file.writeframes(silence)  # gap before each new sentence
                wav_file.writeframes(chunk.audio_int16_bytes)
