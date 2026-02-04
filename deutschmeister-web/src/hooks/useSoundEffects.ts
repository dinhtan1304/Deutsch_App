'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { playSound } from '@/lib/sound/sound';

type SoundType = 'correct' | 'wrong' | 'combo' | 'levelUp' | 'gameOver' | 'click' | 'tick' | 'streak';

interface UseSoundEffectsReturn {
  play: (type: SoundType) => void;
  playCorrect: () => void;
  playWrong: () => void;
  playCombo: () => void;
  playLevelUp: () => void;
  playGameOver: () => void;
  playClick: () => void;
  playTick: () => void;
  playStreak: () => void;
  isEnabled: boolean;
}

/**
 * Hook for playing sound effects in games
 * Respects user's sound settings
 */
export function useSoundEffects(): UseSoundEffectsReturn {
  const { settings } = useSettingsStore();
  const isEnabled = settings.soundEnabled;
  
  // Track if audio context has been unlocked (requires user interaction)
  const audioUnlocked = useRef(false);

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlock = () => {
      if (!audioUnlocked.current) {
        // Play a silent sound to unlock audio context
        playSound('click', 0);
        audioUnlocked.current = true;
      }
    };

    // Listen for any user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => document.addEventListener(event, unlock, { once: true }));

    return () => {
      events.forEach(event => document.removeEventListener(event, unlock));
    };
  }, []);

  const play = useCallback((type: SoundType) => {
    if (!isEnabled) return;
    playSound(type, 0.5);
  }, [isEnabled]);

  const playCorrect = useCallback(() => play('correct'), [play]);
  const playWrong = useCallback(() => play('wrong'), [play]);
  const playCombo = useCallback(() => play('combo'), [play]);
  const playLevelUp = useCallback(() => play('levelUp'), [play]);
  const playGameOver = useCallback(() => play('gameOver'), [play]);
  const playClick = useCallback(() => play('click'), [play]);
  const playTick = useCallback(() => play('tick'), [play]);
  const playStreak = useCallback(() => play('streak'), [play]);

  return {
    play,
    playCorrect,
    playWrong,
    playCombo,
    playLevelUp,
    playGameOver,
    playClick,
    playTick,
    playStreak,
    isEnabled,
  };
}