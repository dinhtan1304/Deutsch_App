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
let currentSequence: AudioSequenceHandle | null = null;

const TTS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deutschmeister-api-production.up.railway.app/api';

/** Logical TTS voice. `undefined` lets the backend pick its default (male). */
export type TtsVoice = 'male' | 'female';

function ttsCacheKey(text: string, voice?: TtsVoice) {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  // Different voices produce different audio, so they must not share a blob URL.
  return `${voice ?? 'default'}|${normalized}`;
}

async function fetchTtsBlobUrl(text: string, voice?: TtsVoice): Promise<string> {
  const key = ttsCacheKey(text, voice);
  const cached = ttsBlobUrlCache.get(key);
  if (cached) return cached;

  const inflight = ttsInflight.get(key);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const res = await fetch(`${TTS_API_URL}/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Omit `voice` when undefined so the request body is identical to the
        // historical single-voice call.
        body: JSON.stringify(voice ? { text, voice } : { text }),
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
 * Parse a transcript into per-speaker segments. Dialogue lines are marked
 * `[Name:] ...` (the format the AI generator produces); each distinct speaker
 * is assigned a voice in order of first appearance, alternating male/female, so
 * a two-person conversation is read in two distinct voices. The same name
 * always maps to the same voice across the whole script.
 *
 * Text with no speaker markers (monologue, radio, announcement) returns a
 * single segment with no voice — read in the backend's default voice, exactly
 * as before. The `[Name:]` labels themselves are stripped, so they are never
 * spoken aloud.
 */
export interface VoiceSegment {
  text: string;
  voice?: TtsVoice;
}

// Speaker label like "[Anna:]". Bounded name length avoids matching unrelated
// bracketed text; the required brackets avoid false positives on clock times.
const SPEAKER_LABEL_RE = /\[([^\]:\n]{1,40}):\]/g;

export function parseDialogue(text: string): VoiceSegment[] {
  const normalized = text.replace(/\r\n/g, '\n');
  const matches = [...normalized.matchAll(SPEAKER_LABEL_RE)];
  if (matches.length === 0) {
    const trimmed = normalized.trim();
    return trimmed ? [{ text: trimmed }] : [];
  }

  const palette: TtsVoice[] = ['male', 'female'];
  const nameToVoice = new Map<string, TtsVoice>();
  const segments: VoiceSegment[] = [];

  // Any text before the first label (uncommon) is read in the default voice.
  const preamble = normalized.slice(0, matches[0]!.index).trim();
  if (preamble) segments.push({ text: preamble });

  matches.forEach((m, i) => {
    const name = m[1]!.trim().toLowerCase();
    let voice = nameToVoice.get(name);
    if (!voice) {
      voice = palette[nameToVoice.size % palette.length]!;
      nameToVoice.set(name, voice);
    }
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : normalized.length;
    const line = normalized.slice(start, end).trim();
    if (line) segments.push({ text: line, voice });
  });

  return segments.length ? segments : [{ text: normalized.trim() }];
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
export function prefetchAudio(text: string, voice?: TtsVoice): void {
  if (typeof window === 'undefined') return;
  const trimmed = text.trim();
  if (!trimmed) return;
  // Already cached or fetching — nothing to do
  const key = ttsCacheKey(trimmed, voice);
  if (ttsBlobUrlCache.has(key) || ttsInflight.has(key)) return;
  fetchTtsBlobUrl(trimmed, voice).catch(() => undefined);
}

/** A controllable handle over a sequence of synthesized audio chunks. */
export interface AudioSequenceHandle {
  /** Start (or restart) playback from the current position. */
  play(): Promise<void>;
  /** Pause without resetting position. */
  pause(): void;
  /** Stop and reset to the first chunk. */
  stop(): void;
  /** Adjust playback speed for the current and subsequent chunks. */
  setPlaybackRate(rate: number): void;
  /** Whether the sequence is currently advancing. */
  readonly playing: boolean;
}

interface AudioSequenceOptions {
  playbackRate?: number;
  /** Fired when the whole sequence starts playing. */
  onStart?: () => void;
  /** Fired when the last chunk finishes. */
  onEnded?: () => void;
  /** Fired when the backend fails before any audio could play, so the caller
   *  can fall back (e.g. to the Web Speech API) for the whole passage. */
  onError?: (err: unknown) => void;
}

// Split a single over-long sentence at the last comma/semicolon (or space)
// before `maxLen` so we never exceed the TTS request limit.
function sliceToLimit(s: string, maxLen: number): { head: string; rest: string } {
  const slice = s.slice(0, maxLen);
  let cut = Math.max(slice.lastIndexOf(', '), slice.lastIndexOf('; '));
  if (cut < maxLen * 0.5) cut = slice.lastIndexOf(' ');
  if (cut <= 0) cut = maxLen;
  return { head: s.slice(0, cut).trim(), rest: s.slice(cut).trim() };
}

/**
 * Split long German text into chunks of at most `maxLen` characters at
 * sentence/line boundaries. Keeps each chunk well under the TTS service's
 * character cap so long passages synthesize cleanly instead of being rejected.
 */
export function splitIntoChunks(text: string, maxLen = 600): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  if (normalized.length <= maxLen) return [normalized];

  // Split after sentence enders or on line breaks (lookbehind keeps the punctuation).
  const units = normalized
    .split(/(?<=[.!?…])\s+|\n+/)
    .map(u => u.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = '';
  const flush = () => { if (buf) { chunks.push(buf); buf = ''; } };

  for (const unit of units) {
    let u = unit;
    while (u.length > maxLen) {
      flush();
      const { head, rest } = sliceToLimit(u, maxLen);
      if (head) chunks.push(head);
      u = rest;
    }
    if (!u) continue;
    if (buf && buf.length + 1 + u.length > maxLen) flush();
    buf = buf ? `${buf} ${u}` : u;
  }
  flush();
  return chunks.length ? chunks : [normalized.slice(0, maxLen)];
}

/**
 * Synthesize `text` as a sequence of chunks played back-to-back through the
 * backend TTS service, returning a handle to control playback.
 *
 * Chunking keeps every request well under the service's character limit, so
 * long passages (listening transcripts) never get rejected and fall back to
 * the robotic browser voice. The first chunk starts as soon as it's ready
 * while later chunks prefetch in the background.
 */
export function synthesizeAudioSequence(
  text: string,
  opts: AudioSequenceOptions = {},
): AudioSequenceHandle {
  // Split into per-speaker segments first (so dialogues use alternating
  // voices), then chunk each segment to stay under the TTS character limit.
  const chunks: VoiceSegment[] = [];
  for (const seg of parseDialogue(text)) {
    for (const piece of splitIntoChunks(seg.text)) {
      chunks.push({ text: piece, voice: seg.voice });
    }
  }
  let rate = opts.playbackRate ?? 1;
  let idx = 0;
  let current: HTMLAudioElement | null = null;
  let stopped = false;
  let playing = false;
  let playedAny = false;

  const teardown = () => {
    if (current) {
      current.onended = null;
      current.onerror = null;
      current.pause();
      current = null;
    }
  };

  const playFrom = async (i: number): Promise<void> => {
    if (stopped) return;
    if (i >= chunks.length) {
      playing = false;
      opts.onEnded?.();
      return;
    }
    idx = i;
    try {
      const url = await fetchTtsBlobUrl(chunks[i]!.text, chunks[i]!.voice);
      if (stopped) return;
      // Warm the next chunk so playback is gapless.
      if (i + 1 < chunks.length) prefetchAudio(chunks[i + 1]!.text, chunks[i + 1]!.voice);
      const audio = new Audio(url);
      audio.playbackRate = rate;
      current = audio;
      audio.onended = () => { void playFrom(i + 1); };
      audio.onerror = () => { void playFrom(i + 1); };
      await audio.play();
      playedAny = true;
    } catch (err) {
      if (!playedAny) {
        // Total failure before any audio played — let the caller fall back.
        playing = false;
        opts.onError?.(err);
      } else if (!stopped) {
        // A later chunk failed; skip it rather than killing the whole passage.
        void playFrom(i + 1);
      }
    }
  };

  return {
    get playing() { return playing; },
    async play() {
      if (playing) return;
      if (idx >= chunks.length) idx = 0;
      stopped = false;
      playing = true;
      opts.onStart?.();
      await playFrom(idx);
    },
    pause() {
      playing = false;
      if (current) current.pause();
    },
    stop() {
      stopped = true;
      playing = false;
      idx = 0;
      teardown();
    },
    setPlaybackRate(r: number) {
      rate = r;
      if (current) current.playbackRate = r;
    },
  };
}

// Stop whatever speakGerman started last — a chunk sequence, a single audio
// element, or a Web Speech utterance.
function stopCurrentPlayback(): void {
  if (currentSequence) { currentSequence.stop(); currentSequence = null; }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
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
 * Speak German text via the backend TTS service. Fire-and-forget; long
 * passages are chunked so they synthesize cleanly instead of being rejected
 * and falling back to the robotic browser voice. If the backend is fully
 * unreachable, falls back to the browser's Web Speech API so the feature
 * still works.
 */
export function speakGerman(text: string, slow = false): void {
  if (typeof window === 'undefined') return;
  const trimmed = text.trim();
  if (!trimmed) return;

  // Stop anything currently playing (sequence, single audio, or utterance).
  stopCurrentPlayback();

  const seq = synthesizeAudioSequence(trimmed, {
    playbackRate: slow ? 0.7 : 1,
    onError: err => {
      console.warn('[speakGerman] backend failed, falling back to Web Speech API:', err);
      speakViaBrowser(trimmed, slow);
    },
  });
  currentSequence = seq;
  void seq.play();
}