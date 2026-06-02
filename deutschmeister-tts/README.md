# DeutschMeister TTS Service

FastAPI wrapper around [Piper TTS](https://github.com/OHF-Voice/piper1-gpl)
serving German speech using the **Thorsten medium** voice
(`de_DE-thorsten-medium`). Piper runs on onnxruntime (no torch) — ~6× real-time
on CPU and a fraction of the RAM of the old Coqui/torch setup.

## Why this exists

The web app previously used `window.speechSynthesis`, which gives users
whatever German voice their OS happens to ship. Quality varies wildly
(macOS Anna ≫ Windows Stefan ≫ headless Linux). This service produces
the same neural German voice everywhere, and the audio is cached on the
NestJS side so repeat plays of the same word are free.

## Architecture

```
[Browser] ── POST /tts/synthesize {text} ──▶ [NestJS API]
                                                │
                            cache hit? serve from disk
                                                │ miss
                                                ▼
                                    POST /synthesize {text}
                                                │
                                                ▼
                                       [Python TTS service]
                                       Piper TTS — Thorsten medium
                                            ↓ WAV → ffmpeg → MP3
                                                │
                                            audio bytes
```

## Endpoints

| Method | Path           | Auth                    | Body            | Returns           |
|--------|----------------|-------------------------|-----------------|-------------------|
| GET    | `/health`      | none                    | —               | `{status:"ok"}`   |
| POST   | `/synthesize`  | `X-TTS-Token` (if set)  | `{text}` (≤500) | `audio/mpeg` MP3  |

## Quick start

- **Local Windows:** `.\start-local.ps1` — tự tạo venv, cài deps, start uvicorn.
- **Local macOS/Linux:** `./start-local.sh`
- **Docker:** `docker compose up --build`
- **Production deploy:** xem [DEPLOY.md](DEPLOY.md)

## Run with Docker (recommended)

```bash
cd deutschmeister-tts
docker compose up --build
```

The Thorsten medium voice (~60 MB `.onnx` + config) is downloaded at image
build time into a named volume, so first request and restarts are instant.
Service listens on `:8001`.

Set a strong `TTS_SHARED_SECRET` before exposing this beyond localhost:

```bash
export TTS_SHARED_SECRET="$(openssl rand -hex 32)"
docker compose up -d
```

The same secret must be set on the NestJS API container.

## Run locally without Docker

Requires Python 3.10–3.12 and `ffmpeg` on `PATH`. (Piper bundles its own
espeak-ng phonemizer, so no system espeak-ng is needed.)

```bash
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
# one-time: download the voice into TTS_MODEL_CACHE
python -m piper.download_voices de_DE-thorsten-medium --data-dir ./models
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Environment variables

| Var                  | Default                            | Notes                                       |
|----------------------|------------------------------------|---------------------------------------------|
| `TTS_MODEL`          | `de_DE-thorsten-medium`              | Piper voice key (resolved under `TTS_MODEL_CACHE`) or a path to an `.onnx`. |
| `TTS_SHARED_SECRET`  | _(empty)_                          | When set, requests must include `X-TTS-Token`. |
| `TTS_MAX_TEXT_LEN`   | `3000`                             | Per-request character cap.                  |
| `TTS_MODEL_CACHE`    | `/models`                          | Where the Piper `.onnx` voice files live.   |
| `TTS_CORS_ORIGINS`   | _(empty)_                          | Comma-separated origins if calling directly from browser. |

## Performance

On a modern CPU, Piper runs ~10× real-time (≈1 second of compute per 10
seconds of audio), so even full B1 listening transcripts synthesize in a
second or two. The model is warmed by the `/health` check on boot.

For higher throughput:
- Run multiple containers behind a reverse proxy.
- For GPU, install `onnxruntime-gpu` (Piper picks it up automatically).

## License notes

- Engine: `OHF-Voice/piper1-gpl` is **GPL** (it statically links the espeak-ng
  phonemizer). We run it as an internal backend service and do not distribute
  the binary to end users, so the copyleft terms are not triggered. This
  wrapper is MIT.
- The Thorsten voice models are released by Thorsten Müller into the public
  domain (CC0). Credit Thorsten in the app's "About" page.
