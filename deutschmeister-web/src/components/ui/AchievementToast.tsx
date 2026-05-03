'use client';

import { useEffect, useState } from 'react';
import { IconTrophy, IconX } from '@/components/ui/Icons';
import { GRADIENT } from '@/lib/tokens';

export interface AchievementUnlocked {
  key: string;
  name: string;
  nameVi: string;
  icon: string;
}

interface Props {
  achievement: AchievementUnlocked;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 50);
    // Dismiss after 4s
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDismiss]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: GRADIENT.speaking,
      color: 'white',
      borderRadius: 16,
      padding: '12px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      minWidth: 260,
      transform: visible ? 'translateX(0) scale(1)' : 'translateX(120%) scale(0.9)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <IconTrophy size={20} style={{ color: 'white' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
          Thành tích mở khóa
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{achievement.nameVi}</div>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
        style={{ flexShrink: 0, background: 'none', border: 'none', color: 'white', opacity: 0.7, cursor: 'pointer', padding: 2, display: 'flex' }}
      >
        <IconX size={16} />
      </button>
    </div>
  );
}

// Global achievement toast queue hook
import { create } from 'zustand';

interface ToastStore {
  queue: AchievementUnlocked[];
  add: (a: AchievementUnlocked) => void;
  remove: () => void;
}

export const useAchievementToastStore = create<ToastStore>((set) => ({
  queue: [],
  add: (a) => set((s) => ({ queue: [...s.queue, a] })),
  remove: () => set((s) => ({ queue: s.queue.slice(1) })),
}));

export function AchievementToastProvider() {
  const { queue, remove } = useAchievementToastStore();
  if (queue.length === 0) return null;
  return <AchievementToast achievement={queue[0]!} onDismiss={remove} />;
}
