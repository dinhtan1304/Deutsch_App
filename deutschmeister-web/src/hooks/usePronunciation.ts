import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export function usePronunciation() {
    const { settings } = useSettingsStore();

    const speak = useCallback((text: string, lang = 'de-DE') => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        if (!settings.soundEnabled) return;

        window.speechSynthesis.cancel(); // Stop previous

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = settings.speechRate || 0.9; // Default slightly slower for clarity

        // Try to find a good German voice
        const voices = window.speechSynthesis.getVoices();
        const germanVoice = voices.find(v => v.lang.includes('de') && !v.name.includes('Google') && !v.name.includes('Microsoft'))
            || voices.find(v => v.lang.includes('de'));

        if (germanVoice) {
            utterance.voice = germanVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, [settings.soundEnabled, settings.speechRate]);

    return { speak };
}
