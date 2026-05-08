# DeutschMeister TTS Service

FastAPI wrapper around [Coqui TTS](https://github.com/idiap/coqui-ai-TTS)
serving German speech using the **Thorsten VITS** model
(`tts_models/de/thorsten/vits`, MPL-2.0 — usable in commercial products).

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
                                       Coqui TTS — Thorsten VITS
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

First boot downloads the Thorsten model (~150 MB) into a named volume so
restarts are instant. Service listens on `:8001`.

Set a strong `TTS_SHARED_SECRET` before exposing this beyond localhost:

```bash
export TTS_SHARED_SECRET="$(openssl rand -hex 32)"
docker compose up -d
```

The same secret must be set on the NestJS API container.

## Run locally without Docker

Requires Python 3.10–3.12 (Coqui TTS does not support 3.13+ as of late 2025)
and `ffmpeg` + `espeak-ng` on `PATH`.

```bash
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Environment variables

| Var                  | Default                            | Notes                                       |
|----------------------|------------------------------------|---------------------------------------------|
| `TTS_MODEL`          | `tts_models/de/thorsten/vits`      | Any Coqui model id; non-German won't sound right. |
| `TTS_SHARED_SECRET`  | _(empty)_                          | When set, requests must include `X-TTS-Token`. |
| `TTS_MAX_TEXT_LEN`   | `500`                              | Per-request character cap.                  |
| `TTS_MODEL_CACHE`    | `/models`                          | Where Coqui downloads model weights.        |
| `TTS_CORS_ORIGINS`   | _(empty)_                          | Comma-separated origins if calling directly from browser. |

## Performance

On a 4-core CPU, Thorsten VITS produces ~1× real-time (1 second of audio
per ~1 second of compute). The first request after boot is slower because
PyTorch warms up; the `/health` check warms it for you.

For higher throughput:
- Run multiple containers behind a reverse proxy.
- A GPU container (CUDA + `torch` GPU build) brings synthesis to ~10× real-time.

## License notes

- Code: MPL-2.0 (Coqui TTS) + MIT (this wrapper).
- Thorsten Müller's voice donation is under MPL-2.0 and explicitly permits
  commercial use. Credit Thorsten in the app's "About" page.
- Do **not** swap to XTTS v2 without reading its license — XTTS is CPML
  (non-commercial only).
