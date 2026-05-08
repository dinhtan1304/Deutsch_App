/**
 * TTS API client — fetches German speech audio from the backend.
 *
 * Returns a blob URL the caller can hand to <audio> or `new Audio()`.
 * The backend serves immutable, infinitely-cacheable MP3, so the browser's
 * HTTP cache covers repeat plays of the same word inside one session.
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
