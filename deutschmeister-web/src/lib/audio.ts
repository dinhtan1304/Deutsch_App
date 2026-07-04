/**
 * Audio helpers for pronunciation/shadowing recording.
 *
 * The browser's MediaRecorder produces `audio/webm` (Chrome) or `audio/ogg`
 * (Firefox). Gemini's audio input does NOT accept webm, so we decode the
 * recording and re-encode it as WAV (16-bit PCM, mono, 16 kHz) — a format
 * Gemini reliably accepts and that is small enough for speech.
 */

/** Encode an AudioBuffer to a 16-bit PCM WAV (mono, resampled to targetRate). */
export function audioBufferToWavMono(buffer: AudioBuffer, targetRate = 16000): ArrayBuffer {
  const srcRate = buffer.sampleRate;
  const numCh = buffer.numberOfChannels;
  const srcLen = buffer.length;

  // Downmix all channels to mono.
  const mono = new Float32Array(srcLen);
  for (let ch = 0; ch < numCh; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < srcLen; i++) mono[i] = (mono[i] ?? 0) + data[i]! / numCh;
  }

  // Linear resample to the target rate.
  const ratio = srcRate / targetRate;
  const outLen = Math.max(1, Math.floor(srcLen / ratio));
  const resampled = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const idx = i * ratio;
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, srcLen - 1);
    const frac = idx - i0;
    resampled[i] = mono[i0]! * (1 - frac) + mono[i1]! * frac;
  }

  // WAV (PCM 16-bit) container.
  const bytesPerSample = 2;
  const dataSize = outLen * bytesPerSample;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);            // fmt chunk size
  view.setUint16(20, 1, true);             // PCM
  view.setUint16(22, 1, true);             // mono
  view.setUint32(24, targetRate, true);    // sample rate
  view.setUint32(28, targetRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true);            // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  let off = 44;
  for (let i = 0; i < outLen; i++) {
    const s = Math.max(-1, Math.min(1, resampled[i]!));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return buf;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Decode a recorded audio Blob and re-encode it as base64 WAV (mono, 16 kHz).
 * Returns `null` if the browser can't decode the blob (caller should then fall
 * back to sending the raw recording).
 */
export async function blobToWavBase64(blob: Blob, targetRate = 16000): Promise<string | null> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    try {
      // slice(0) — decodeAudioData detaches the buffer; keep the original intact.
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      return arrayBufferToBase64(audioBufferToWavMono(audioBuffer, targetRate));
    } finally {
      void ctx.close();
    }
  } catch {
    return null;
  }
}
