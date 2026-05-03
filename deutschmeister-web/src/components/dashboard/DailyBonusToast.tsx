'use client';
/* eslint-disable no-restricted-syntax */

import { useEffect, useState } from 'react';
import type { DailyBonusResult } from '@/lib/api/users';

interface Props {
  bonus: DailyBonusResult | null;
  onDismiss: () => void;
}

/**
 * Celebratory toast shown after the daily login bonus is auto-claimed.
 * Auto-dismisses after 4s; user can also click to dismiss early.
 */
export function DailyBonusToast({ bonus, onDismiss }: Props) {
  if (!bonus?.claimed) return null;
  return <DailyBonusToastInner bonus={bonus} onDismiss={onDismiss} />;
}

function DailyBonusToastInner({ bonus, onDismiss }: { bonus: DailyBonusResult; onDismiss: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), 3700);
    const t2 = setTimeout(() => onDismiss(), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDismiss]);

  return (
    <div
      className="fixed top-20 left-1/2 z-50 transition-all duration-300"
      style={{
        transform: `translateX(-50%) translateY(${visible ? '0' : '-20px'})`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }}
        className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #F59E0B, #F97316)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 20px 40px -10px rgba(249, 115, 22, 0.5)',
        }}
      >
        <span className="animate-bounce flex items-center justify-center w-9 h-9">
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
        </span>
        <div className="text-left">
          <div className="text-white font-extrabold text-[15px] leading-tight">
            +{bonus.xp} XP Daily Bonus!
          </div>
          <div className="text-white/90 text-xs leading-tight mt-0.5">
            {bonus.streak > 0
              ? `Streak ${bonus.streak} ngày — tiếp tục nhé!`
              : 'Chào mừng quay lại!'}
          </div>
        </div>
      </button>
    </div>
  );
}
