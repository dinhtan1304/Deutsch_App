import { useCallback, useRef } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { synthesizeSpeech } from '@/lib/api/tts';

// Per-tab cache of decoded audio URLs. Same word played twice in one session
// hits memory only — no extra network round-trip and no extra TTS spend.
const audioUrlCache = new Map<string, string>();

function cacheKey(text: string, voice: string) {
  return `${voice}|${text.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

/**
 * Pronounce German text via the backend Coqui TTS service. Falls back to the
 * browser Web Speech API if the backend is unreachable so the feature still
 * works offline / before the TTS container is up.
 */
export function usePronunciation() {
    const { settings } = useSettingsStore();
    const currentAudio = useRef<HTMLAudioElement | null>(null);
    const currentAbort = useRef<AbortController | null>(null);

    const stop = useCallback(() => {
        currentAbort.current?.abort();
        currentAbort.current = null;
        if (currentAudio.current) {
            currentAudio.current.pause();
            currentAudio.current.currentTime = 0;
            currentAudio.current = null;
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    const speakBrowser = useCallback((text: string, lang: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = settings.speechRate || 0.9;
        const voices = window.speechSynthesis.getVoices();
        const germanVoice =
            voices.find(v => v.lang.includes('de') && !v.name.includes('Google') && !v.name.includes('Microsoft'))
            || voices.find(v => v.lang.includes('de'));
        if (germanVoice) utterance.voice = germanVoice;
        window.speechSynthesis.speak(utterance);
    }, [settings.speechRate]);

    /**
     * Pronounce a German phrase.
     *
     * Default path: backend Coqui Thorsten (better German accent, ~300-800ms
     * cold round-trip, instant on cache hit). Used by word/topic/listening
     * features where voice quality matters.
     *
     * Fast path: pass `{ fast: true }` to skip the backend entirely and use
     * the browser's Web Speech API directly. Latency drops to ~0ms — the
     * trade-off is OS-dependent accent quality. Use for time-critical UI
     * (Vocabulary Arena round reveals, where the next word may flip before
     * a backend fetch returns).
     */
    const speak = useCallback(async (
        text: string,
        lang = 'de-DE',
        opts?: { fast?: boolean },
    ) => {
        if (typeof window === 'undefined') return;
        if (!settings.soundEnabled) return;
        const trimmed = text.trim();
        if (!trimmed) return;

        stop();

        if (opts?.fast) {
            speakBrowser(trimmed, lang);
            return;
        }

        const key = cacheKey(trimmed, 'thorsten-vits');

        const playUrl = (url: string) => {
            const audio = new Audio(url);
            audio.playbackRate = settings.speechRate || 1;
            currentAudio.current = audio;
            audio.play().catch(() => {
                // Autoplay blocked or decode error — fall back to Web Speech API
                speakBrowser(trimmed, lang);
            });
        };

        const cached = audioUrlCache.get(key);
        if (cached) {
            playUrl(cached);
            return;
        }

        const abort = new AbortController();
        currentAbort.current = abort;

        try {
            const blob = await synthesizeSpeech({ text: trimmed, signal: abort.signal });
            if (abort.signal.aborted) return;
            const url = URL.createObjectURL(blob);
            audioUrlCache.set(key, url);
            playUrl(url);
        } catch (err) {
            if ((err as Error).name === 'AbortError') return;
            console.warn('[TTS] backend failed, falling back to Web Speech API:', err);
            speakBrowser(trimmed, lang);
        }
    }, [settings.soundEnabled, settings.speechRate, stop, speakBrowser]);

    return { speak, stop };
}
