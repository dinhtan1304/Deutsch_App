# Local-dev launcher for the Piper TTS service on Windows.
# Usage: .\start-local.ps1
#
# Loads .env, picks ffmpeg from winget if not on PATH, downloads the Piper
# voice on first run, and starts uvicorn.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# --- Load .env into the process environment ---
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)\s*$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim().Trim('"')
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
    Write-Host "[start] loaded .env" -ForegroundColor DarkGray
} else {
    Write-Warning "[start] .env not found - using defaults"
}

# --- Resolve ffmpeg path (winget install puts it under a versioned dir) ---
if (-not $env:FFMPEG_BIN) {
    $candidate = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-*\bin\ffmpeg.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($candidate) {
        $env:FFMPEG_BIN = $candidate.FullName
        Write-Host "[start] FFMPEG_BIN = $env:FFMPEG_BIN" -ForegroundColor DarkGray
    } else {
        Write-Warning "[start] ffmpeg not found via winget - falling back to PATH lookup"
    }
}

# --- Ensure venv exists ---
$venvPython = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "[start] creating Python 3.12 venv..." -ForegroundColor Cyan
    & py -3.12 -m venv .venv
}

# --- Ensure dependencies are installed. Re-installs if `piper` is missing,
#     which also covers an old venv from before the Coqui -> Piper switch. ---
& $venvPython -c "import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('piper') else 1)"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[start] installing dependencies (piper-tts)..." -ForegroundColor Cyan
    & $venvPython -m pip install --upgrade pip
    & $venvPython -m pip install -r requirements.txt
    Write-Host "[start] deps ready" -ForegroundColor Green
}

# --- Ensure the Piper voice model is downloaded ---
$modelCache = if ($env:TTS_MODEL_CACHE) { $env:TTS_MODEL_CACHE } else { Join-Path $PSScriptRoot "models" }
$voiceName = if ($env:TTS_MODEL) { $env:TTS_MODEL } else { "de_DE-thorsten-medium" }
if (-not (Test-Path (Join-Path $modelCache "$voiceName.onnx"))) {
    Write-Host "[start] downloading Piper voice $voiceName -> $modelCache" -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $modelCache | Out-Null
    & $venvPython -m piper.download_voices $voiceName --data-dir $modelCache
}

# --- Run ---
$port = if ($env:TTS_PORT) { $env:TTS_PORT } else { "8001" }

# Kill any stale process holding the port (previous run that did not exit cleanly)
$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[start] port $port held by PID $($existing.OwningProcess), terminating..." -ForegroundColor Yellow
    Stop-Process -Id $existing.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}

Write-Host "[start] launching TTS service on http://127.0.0.1:$port" -ForegroundColor Green
& $venvPython -m uvicorn app.main:app --host 127.0.0.1 --port $port
