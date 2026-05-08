"""FastAPI server exposing Coqui TTS for German.

Endpoints:
  GET  /health                 — readiness probe (also warms the model)
  POST /synthesize             — { text } → MP3 audio bytes

Auth: shared secret via header `X-TTS-Token` matching env TTS_SHARED_SECRET.
The NestJS backend is the only intended caller; the secret keeps random
internet traffic from spending CPU on synthesis.
"""

from __future__ import annotations

import logging
import os
import subprocess
import tempfile
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .synthesizer import get_tts, synthesize_to_wav

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger("tts")

SHARED_SECRET = os.environ.get("TTS_SHARED_SECRET", "")
MAX_TEXT_LEN = int(os.environ.get("TTS_MAX_TEXT_LEN", "500"))
FFMPEG_BIN = os.environ.get("FFMPEG_BIN", "ffmpeg")

app = FastAPI(title="DeutschMeister TTS", version="0.1.0")

# CORS only matters if the browser hits this service directly; the production
# path is browser → NestJS → TTS, so this stays restrictive.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("TTS_CORS_ORIGINS", "").split(",") if os.environ.get("TTS_CORS_ORIGINS") else [],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def require_secret(x_tts_token: str | None = Header(default=None)) -> None:
    if not SHARED_SECRET:
        return  # disabled — only safe for local dev
    if x_tts_token != SHARED_SECRET:
        raise HTTPException(status_code=401, detail="Invalid TTS token")


class SynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_TEXT_LEN)


@app.on_event("startup")
def warm_model_in_background():
    """Kick off model download/load on a background thread so the HTTP server
    can start serving /health immediately. On Railway, the first deploy has
    no cached model in the /models volume — downloading from HuggingFace can
    take 30-60s, which blows the healthcheck window."""
    import threading

    def _warm():
        try:
            get_tts()
            logger.info("background model warm complete")
        except Exception:
            logger.exception("background model warm failed")

    threading.Thread(target=_warm, daemon=True).start()


@app.get("/health")
def health():
    """Lightweight readiness probe. Always 200 once the process is up — the
    model loads in the background and serves on first /synthesize call."""
    return {"status": "ok"}


@app.get("/ready")
def ready():
    """Deeper check: confirms model is fully loaded. Use for SLO monitoring,
    not for the deploy healthcheck."""
    try:
        get_tts()
        return {"status": "ok", "model_loaded": True}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model not ready: {e}")


@app.post("/synthesize", dependencies=[Depends(require_secret)])
def synthesize(req: SynthesizeRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")

    with tempfile.TemporaryDirectory() as tmp:
        wav_path = str(Path(tmp) / "out.wav")
        mp3_path = str(Path(tmp) / "out.mp3")

        try:
            synthesize_to_wav(text, wav_path)
        except Exception as e:
            logger.exception("synthesis failed")
            raise HTTPException(status_code=500, detail=f"Synthesis failed: {e}")

        # Convert WAV → MP3 (smaller, browser-friendly). 64 kbps mono is plenty
        # for speech and roughly halves bytes vs the raw 22 kHz WAV.
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
            raise HTTPException(status_code=500, detail=f"Encoding failed: {e}")

        audio_bytes = Path(mp3_path).read_bytes()

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
