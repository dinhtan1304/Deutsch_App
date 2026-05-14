"""FastAPI server exposing Coqui TTS for German."""

from __future__ import annotations

import hashlib
import logging
import os
import subprocess
import tempfile
import threading
import time
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .synthesizer import DEFAULT_MODEL, get_tts, synthesize_to_wav

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger("tts")

SHARED_SECRET = os.environ.get("TTS_SHARED_SECRET", "")
ENV = os.environ.get("ENV") or os.environ.get("NODE_ENV") or "development"
ALLOW_INSECURE_LOCAL = os.environ.get("TTS_ALLOW_INSECURE_LOCAL", "").lower() == "true"
if ENV.lower() == "production" and not SHARED_SECRET and not ALLOW_INSECURE_LOCAL:
    raise RuntimeError("TTS_SHARED_SECRET is required in production")

MAX_TEXT_LEN = int(os.environ.get("TTS_MAX_TEXT_LEN", "1200"))
FFMPEG_BIN = os.environ.get("FFMPEG_BIN", "ffmpeg")
TTS_CACHE_DIR = Path(os.environ.get("TTS_CACHE_DIR", "/tmp/deutschmeister-tts-cache"))
MAX_QUEUE = max(1, int(os.environ.get("TTS_MAX_QUEUE", "2")))
QUEUE_TIMEOUT_SEC = float(os.environ.get("TTS_QUEUE_TIMEOUT_SEC", "0.1"))
_queue_slots = threading.BoundedSemaphore(MAX_QUEUE)

app = FastAPI(title="DeutschMeister TTS", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("TTS_CORS_ORIGINS", "").split(",") if os.environ.get("TTS_CORS_ORIGINS") else [],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def require_secret(x_tts_token: str | None = Header(default=None)) -> None:
    if not SHARED_SECRET:
        return
    if x_tts_token != SHARED_SECRET:
        raise HTTPException(status_code=401, detail="Invalid TTS token")


class SynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_TEXT_LEN)


def normalize_text(text: str) -> str:
    return " ".join(text.strip().split()).lower()


def cache_path(text: str) -> Path:
    key = hashlib.sha256(
        f"{normalize_text(text)}|{DEFAULT_MODEL}|mp3-64k-mono".encode("utf-8")
    ).hexdigest()
    return TTS_CACHE_DIR / f"{key}.mp3"


@app.on_event("startup")
def warm_model_in_background():
    """Warm the model asynchronously so /health can return quickly."""

    def _warm():
        try:
            get_tts()
            logger.info("background model warm complete")
        except Exception:
            logger.exception("background model warm failed")

    threading.Thread(target=_warm, daemon=True).start()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def ready():
    try:
        get_tts()
        return {"status": "ok", "model_loaded": True}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model not ready: {e}") from e


@app.post("/synthesize", dependencies=[Depends(require_secret)])
def synthesize(req: SynthesizeRequest):
    started = time.perf_counter()
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")

    TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached = cache_path(text)
    if cached.exists():
        audio_bytes = cached.read_bytes()
        logger.info(
            "synthesize cache_hit chars=%s bytes=%s ms=%.1f",
            len(text),
            len(audio_bytes),
            (time.perf_counter() - started) * 1000,
        )
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=31536000, immutable", "X-TTS-Cache": "hit"},
        )

    if not _queue_slots.acquire(timeout=QUEUE_TIMEOUT_SEC):
        raise HTTPException(status_code=503, detail="TTS queue is full")

    try:
        with tempfile.TemporaryDirectory() as tmp:
            wav_path = str(Path(tmp) / "out.wav")
            mp3_path = str(Path(tmp) / "out.mp3")

            try:
                synthesize_to_wav(text, wav_path)
            except Exception as e:
                logger.exception("synthesis failed")
                raise HTTPException(status_code=500, detail=f"Synthesis failed: {e}") from e

            try:
                subprocess.run(
                    [
                        FFMPEG_BIN, "-y", "-loglevel", "error",
                        "-i", wav_path,
                        "-ac", "1", "-b:a", "64k",
                        mp3_path,
                    ],
                    check=True,
                )
            except (subprocess.CalledProcessError, FileNotFoundError) as e:
                logger.exception("ffmpeg failed")
                raise HTTPException(status_code=500, detail=f"Encoding failed: {e}") from e

            audio_bytes = Path(mp3_path).read_bytes()

        tmp_cache = cached.with_suffix(".tmp")
        tmp_cache.write_bytes(audio_bytes)
        tmp_cache.replace(cached)
        logger.info(
            "synthesize cache_miss chars=%s bytes=%s ms=%.1f",
            len(text),
            len(audio_bytes),
            (time.perf_counter() - started) * 1000,
        )
    finally:
        _queue_slots.release()

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=31536000, immutable", "X-TTS-Cache": "miss"},
    )
