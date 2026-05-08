import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

// Module-level cache so the same word played twice in a session avoids the
// network round-trip and the TTS cost on the backend cache miss.
const ttsBlobUrlCache = new Map<string, string>();
// In-flight request dedupe — without this, double-clicking the speaker or
// games that re-render rapidly fire concurrent fetches for the same text,
// burning the rate limit twice for one play.
const ttsInflight = new Map<string, Promise<string>>();
let currentAudio: HTMLAudioElement | null = null;

const TTS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deutschmeister-api-production.up.railway.app/api';

function ttsCacheKey(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function fetchTtsBlobUrl(text: string): Promise<string> {
  const key = ttsCacheKey(text);
  const cached = ttsBlobUrlCache.get(key);
  if (cached) return cached;

  const inflight = ttsInflight.get(key);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const res = await fetch(`${TTS_API_URL}/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      ttsBlobUrlCache.set(key, url);
      return url;
    } finally {
      ttsInflight.delete(key);
    }
  })();
  ttsInflight.set(key, promise);
  return promise;
}

/**
 * Fetch synthesized audio for `text` from the backend and return a ready-to-play
 * HTMLAudioElement. Caller is responsible for play/pause and binding `onended`/
 * `onerror` if needed. Throws on backend failure so callers can fall back to
 * Web Speech API for graceful degradation.
 *
 * Use for long passages (listening practice, reading practice) where you need
 * playback control. For short word/phrase pronunciation, use speakGerman().
 */
export async function synthesizeAudio(text: string): Promise<HTMLAudioElement> {
  if (typeof window === 'undefined') throw new Error('SSR not supported');
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty text');
  const url = await fetchTtsBlobUrl(trimmed);
  return new Audio(url);
}

/**
 * Warm the TTS cache for `text` so the next play is instant. Fire-and-forget;
 * silently swallows errors. Call when the user is likely to play the audio
 * soon (e.g. on hover of the speaker button, when the next flashcard mounts).
 */
export function prefetchAudio(text: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = text.trim();
  if (!trimmed) return;
  // Already cached or fetching — nothing to do
  const key = ttsCacheKey(trimmed);
  if (ttsBlobUrlCache.has(key) || ttsInflight.has(key)) return;
  fetchTtsBlobUrl(trimmed).catch(() => undefined);
}

function speakViaBrowser(text: string, slow: boolean): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = slow ? 0.5 : 0.8;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const germanVoice = voices.find(v => v.lang.startsWith('de'));
    if (germanVoice) utterance.voice = germanVoice;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* silent no-op */
  }
}

/**
 * Speak German text via the backend Coqui TTS service. Same sync API as
 * before — fire-and-forget; if the backend is down or slow, falls back to
 * the browser's Web Speech API so the feature still works.
 */
export function speakGerman(text: string, slow = false): void {
  if (typeof window === 'undefined') return;
  const trimmed = text.trim();
  if (!trimmed) return;

  // Stop anything currently playing
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  const playUrl = (url: string) => {
    const audio = new Audio(url);
    audio.playbackRate = slow ? 0.7 : 1;
    currentAudio = audio;
    audio.play().catch(() => speakViaBrowser(trimmed, slow));
  };

  fetchTtsBlobUrl(trimmed)
    .then(playUrl)
    .catch(err => {
      console.warn('[speakGerman] backend failed, falling back to Web Speech API:', err);
      speakViaBrowser(trimmed, slow);
    });
}