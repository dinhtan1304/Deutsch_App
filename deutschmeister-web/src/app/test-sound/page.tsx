'use client';
/* eslint-disable no-restricted-syntax */

import { useState } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettingsStore } from '@/stores/settingsStore';
import Link from 'next/link';

export default function TestSoundsPage() {
  const { 
    playCorrect, 
    playWrong, 
    playCombo, 
    playLevelUp, 
    playGameOver, 
    playClick,
    playTick,
    playStreak,
    isEnabled 
  } = useSoundEffects();
  
  const { settings, updateSetting } = useSettingsStore();
  const [lastPlayed, setLastPlayed] = useState<string>('');

  const sounds = [
    { name: 'Correct ✓', fn: playCorrect, color: '#22c55e', desc: 'Trả lời đúng' },
    { name: 'Wrong ✗', fn: playWrong, color: '#ef4444', desc: 'Trả lời sai' },
    { name: 'Combo 🔥', fn: playCombo, color: '#f97316', desc: 'Streak combo' },
    { name: 'Level Up 🎉', fn: playLevelUp, color: '#8b5cf6', desc: 'Lên level' },
    { name: 'Game Over 💀', fn: playGameOver, color: '#6b7280', desc: 'Kết thúc game' },
    { name: 'Click 👆', fn: playClick, color: '#3b82f6', desc: 'Click button' },
    { name: 'Tick ⏱️', fn: playTick, color: '#eab308', desc: 'Timer tick' },
    { name: 'Streak 🌟', fn: playStreak, color: '#ec4899', desc: 'Achievement' },
  ];

  const handlePlay = (name: string, fn: () => void) => {
    fn();
    setLastPlayed(name);
  };

  return (
    <div 
      className="min-h-screen p-8"
      style={{ 
        backgroundColor: 'var(--theme-bg-body, #f9fafb)',
        color: 'var(--theme-text-primary, #111827)'
      }}
    >
      <div className="max-w-2xl mx-auto">
        <Link 
          href="/settings" 
          className="text-blue-500 hover:underline mb-4 inline-block"
        >
          ← Quay lại Settings
        </Link>

        <h1 className="text-3xl font-bold mb-2">🔊 Test Sound Effects</h1>
        <p className="text-gray-500 mb-6">
          Click vào các nút bên dưới để nghe thử âm thanh
        </p>

        {/* Sound Toggle */}
        <div 
          className="p-4 rounded-xl mb-6 flex items-center justify-between"
          style={{ backgroundColor: 'var(--theme-bg-card, #ffffff)' }}
        >
          <div>
            <h3 className="font-medium">Âm thanh</h3>
            <p className="text-sm text-gray-500">
              {isEnabled ? '✅ Đang bật' : '❌ Đang tắt'}
            </p>
          </div>
          <button
            onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
            className="px-4 py-2 rounded-xl font-medium transition-colors"
            style={{
              backgroundColor: isEnabled ? '#22c55e' : '#ef4444',
              color: 'white'
            }}
          >
            {isEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          </button>
        </div>

        {/* Sound Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {sounds.map(({ name, fn, color, desc }) => (
            <button
              key={name}
              onClick={() => handlePlay(name, fn)}
              disabled={!isEnabled}
              className="p-4 rounded-xl text-white font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: color }}
            >
              <div className="text-lg">{name}</div>
              <div className="text-sm opacity-80">{desc}</div>
            </button>
          ))}
        </div>

        {/* Last Played */}
        {lastPlayed && (
          <div 
            className="p-4 rounded-xl text-center mb-6"
            style={{ backgroundColor: 'var(--theme-bg-card, #ffffff)' }}
          >
            <p className="text-gray-500">Vừa phát:</p>
            <p className="text-xl font-bold">{lastPlayed}</p>
          </div>
        )}

        {/* Info */}
        <div 
          className="p-4 rounded-xl"
          style={{ 
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <h3 className="font-bold text-blue-600 mb-2">💡 Thông tin</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Âm thanh được tạo bằng Web Audio API</li>
            <li>• Không cần tải file mp3 - nhẹ và nhanh</li>
            <li>• Tự động tắt khi setting soundEnabled = false</li>
            <li>• Dùng hook <code className="bg-blue-100 px-1 rounded">useSoundEffects()</code> trong games</li>
          </ul>
        </div>

        {/* Usage Example */}
        <div 
          className="mt-6 p-4 rounded-xl"
          style={{ backgroundColor: 'var(--theme-bg-card, #ffffff)' }}
        >
          <h3 className="font-bold mb-2">📝 Cách sử dụng trong Game</h3>
          <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`import { useSoundEffects } from '@/hooks/useSoundEffects';

function MyGame() {
  const { playCorrect, playWrong, playCombo } = useSoundEffects();

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      playCorrect();
      if (combo >= 3) playCombo();
    } else {
      playWrong();
    }
  };
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}