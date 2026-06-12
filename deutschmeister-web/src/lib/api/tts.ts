/**
 * TTS API client — fetches German speech audio from the backend.
 *
 * Returns a Blob the caller can hand to `new Audio()` via a blob URL.
 * Note: this is a POST, so the browser's HTTP cache does NOT cover repeat
 * plays — `usePronunciation` keeps an in-memory blob-URL cache per tab, and
 * the backend caches synthesized audio in Postgres to avoid re-hitting the
 * Python TTS service across sessions/users.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deutschmeister-api-production.up.railway.app/api';

export interface SynthesizeOptions {
  text: string;
  voice?: string;
  signal?: AbortSignal;
}

export async function synthesizeSpeech({ text, voice, signal }: SynthesizeOptions): Promise<Blob> {
  const res = await fetch(`${API_URL}/tts/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`TTS synthesize failed: ${res.status}`);
  }
  return res.blob();
}
