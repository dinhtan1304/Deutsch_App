# DeutschMeister TTS — Deployment Guide

Hướng dẫn chạy Piper TTS service ở local và deploy production.

---

## 1. Local Development (Windows)

### Lần đầu setup

```powershell
# 1. Cài tools (1 lần duy nhất) — chỉ cần ffmpeg; Piper tự kèm espeak-ng
winget install -e --id Gyan.FFmpeg

# 2. Vào thư mục TTS service
cd E:\Deutsch_App\deutschmeister-tts

# 3. Chạy script — tự tạo venv + cài deps + tải voice Piper + start uvicorn
.\start-local.ps1
```

Lần đầu: tạo venv + tải voice Piper (~60MB). Lần sau: `.\start-local.ps1` — instant.

### Local Development (macOS/Linux)

```bash
# Cài tools (Ubuntu/Debian) — espeak-ng đã bundle trong Piper, chỉ cần ffmpeg
sudo apt install ffmpeg python3.12 python3.12-venv

# macOS
brew install ffmpeg python@3.12

# Chạy
cd deutschmeister-tts
chmod +x start-local.sh
./start-local.sh
```

### Verify

```powershell
# Health check (warm up model, ~10-20s lần đầu)
curl http://127.0.0.1:8001/health

# Synthesize test
curl -X POST http://127.0.0.1:8001/synthesize `
     -H "Content-Type: application/json" `
     -H "X-TTS-Token: local-dev-tts-secret-change-in-prod" `
     -d '{\"text\":\"Hallo\"}' `
     --output test.mp3
```

### NestJS API config (local)

Trong `deutschmeister-api/.env`:

```env
TTS_SERVICE_URL=http://localhost:8001
TTS_SHARED_SECRET=local-dev-tts-secret-change-in-prod
TTS_TIMEOUT_MS=60000
```

---

## 2. Production: Docker

### Build và chạy với docker compose

```bash
cd deutschmeister-tts

# Tạo .env với secret strong
echo "TTS_SHARED_SECRET=$(openssl rand -hex 32)" > .env

# Build và start
docker compose up -d --build

# Health check
curl http://localhost:8001/health
```

Voice Piper được tải lúc build image vào volume `tts-models` — survive restart, không phải tải lại.

### Resource requirements

- **RAM**: ~512 MB đủ (Piper onnxruntime nhẹ, không có torch)
- **CPU**: 1 core đủ cho traffic thấp (Piper RTF ~10× = nhanh hơn realtime nhiều)
- **Disk**: image nhỏ hơn hẳn build cũ; voice ~60 MB
- **Network**: chỉ cần gọi internal từ NestJS (không expose public)

### Scale up khi cần

- **Throughput cao**: chạy nhiều container behind nginx/Traefik
- **Latency thấp hơn nữa**: cài `onnxruntime-gpu` để Piper chạy trên GPU
- **Cache lớn**: NestJS đã cache audio đến disk, nên TTS chỉ gọi 1 lần/text. Cache layer phía API quan trọng hơn scale TTS.

---

## 3. Production: Railway (cùng platform với API)

Dự án đã deploy NestJS API trên Railway. Deploy TTS service cùng platform để latency thấp.

### Deploy

```bash
# Cài Railway CLI nếu chưa có
npm i -g @railway/cli
railway login

# Link project hoặc tạo service mới
cd deutschmeister-tts
railway link  # chọn project deutschmeister
railway up    # build & deploy

# Set env vars trong dashboard hoặc CLI
railway variables --set TTS_SHARED_SECRET=$(openssl rand -hex 32)
railway variables --set TTS_MODEL=de_DE-thorsten-medium
railway variables --set TTS_MAX_TEXT_LEN=3000
```

### Resources cần đặt trên Railway

| Setting              | Value                              | Lý do                              |
|----------------------|------------------------------------|------------------------------------|
| Plan                 | Hobby ($5/mo) hoặc Pro             | RAM ≥ 1 GB                         |
| Volume mount         | `/models` size 1 GB                | Model cache giữ giữa restarts      |
| Healthcheck path     | `/health`                          | Đã set trong railway.toml          |
| Healthcheck timeout  | 120s                               | Lần đầu boot phải load model       |
| Region               | Cùng region với API                | Latency thấp giữa 2 service        |

### Update NestJS API env vars

Trong dashboard Railway của **deutschmeister-api**:

```env
TTS_SERVICE_URL=http://<tts-service-name>.railway.internal:8001
TTS_SHARED_SECRET=<same-secret-as-tts>
TTS_TIMEOUT_MS=30000
```

⚠️ **Quan trọng:** Dùng `railway.internal` URL (free, không tốn egress) thay vì public URL.

### Audio cache

Audio synthesized được cache **trong Postgres** (cột `tts_cache.audio_data`), KHÔNG còn ghi
ra disk → không cần persistent volume cho API, và cache survive mỗi lần redeploy. Cron dọn
entry không dùng > 90 ngày tự bound kích thước bảng.

---

## 4. Alternative: Replicate / Modal (serverless GPU)

Nếu muốn chất lượng cao hơn với XTTS v2 (cần GPU), dùng serverless:

- **Replicate**: $0.000725/s GPU (T4) — phù hợp pay-per-use, ~$0.01/synthesis
- **Modal**: $0.000164/s CPU GPU — tự host nhưng managed
- **HuggingFace Spaces**: free tier có CPU, đủ test demo

⚠️ XTTS license là **CPML (non-commercial only)** — không phù hợp app có doanh thu.

---

## 5. Monitoring & Debug

### Logs

```bash
# Local
# stdout của uvicorn

# Docker
docker compose logs -f tts

# Railway
railway logs --service tts
```

### Cache hit rate

Query Postgres để xem cache effectiveness:

```sql
SELECT 
  COUNT(*) AS unique_phrases,
  SUM(hits) AS total_plays,
  ROUND(AVG(hits)::numeric, 1) AS avg_hits_per_phrase,
  pg_size_pretty(SUM(bytes)::bigint) AS total_audio_size
FROM tts_cache;
```

### Metrics đáng theo dõi

| Metric                      | Healthy range          | Action nếu lệch                 |
|-----------------------------|------------------------|--------------------------------|
| `/synthesize` p95 latency   | 500ms – 5s             | Scale up CPU hoặc move to GPU  |
| Cache hit rate              | > 70%                  | Kiểm tra cron dọn cache 90 ngày |
| RAM usage TTS container     | < 1.5 GB               | Restart container nếu memory leak |
| `TtsCache` row count growth | Linear theo unique từ  | OK — phrases độc nhất tích lũy |

### Cleanup old cache

Cron job xóa audio không dùng > 90 ngày:

```sql
-- Xem trước
SELECT COUNT(*), pg_size_pretty(SUM(bytes)::bigint)
FROM tts_cache
WHERE last_used_at < NOW() - INTERVAL '90 days';

-- Xóa (rồi xóa file mp3 tương ứng)
DELETE FROM tts_cache WHERE last_used_at < NOW() - INTERVAL '90 days';
```

---

## 6. Security

- ✅ `TTS_SHARED_SECRET` bắt buộc trong production — chặn random internet hit
- ✅ NestJS chỉ expose `/api/tts/synthesize` (rate-limited 60/phút), không expose Python service
- ✅ Python service KHÔNG expose ra internet — chỉ accessible qua Railway internal network
- ✅ Audio cached là public (không chứa PII), dùng `Cache-Control: immutable` trên CDN OK

---

## 7. Rollback

Nếu TTS service hỏng, hook frontend tự động fallback Web Speech API. Nhưng nếu muốn disable hoàn toàn:

```env
# trong NestJS API .env
TTS_SERVICE_URL=disabled  # bất kỳ giá trị invalid nào
```

Service sẽ trả 503, hook fallback browser → app vẫn phát âm bằng giọng OS.

Để revert hẳn về Web Speech API only, revert commit thêm `usePronunciation.ts` thay đổi.
