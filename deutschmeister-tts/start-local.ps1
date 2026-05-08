# Local-dev launcher for the Coqui TTS service on Windows.
# Usage: .\start-local.ps1
#
# Loads .env, picks ffmpeg from winget if not on PATH, and starts uvicorn.

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
    & $venvPython -m pip install --upgrade pip
    & $venvPython -m pip install --index-url https://download.pytorch.org/whl/cpu torch==2.4.1 torchaudio==2.4.1
    & $venvPython -m pip install "coqui-tts==0.27.0" "fastapi==0.115.6" "uvicorn[standard]==0.32.1" "pydantic==2.10.3" "numpy<2.0" "transformers==4.52.4" "tokenizers>=0.21,<0.22"
    Write-Host "[start] venv ready" -ForegroundColor Green
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
