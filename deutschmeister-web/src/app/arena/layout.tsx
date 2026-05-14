'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AuthGate } from '@/components/ui';
import { IconFlame } from '@/components/ui/Icons';
import { GRADIENT } from '@/lib/tokens';
import { useArenaStore } from '@/stores/arenaStore';
import { useArenaSocket } from '@/hooks/useArenaSocket';

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const reset = useArenaStore((s) => s.reset);
  const { leaveQueue, disconnect } = useArenaSocket();

  useEffect(() => {
    return () => {
      if (useArenaStore.getState().phase === 'matchmaking') {
        leaveQueue();
      }
      disconnect();
      reset();
    };
  }, [disconnect, leaveQueue, reset]);

  if (!isAuthenticated) {
    return (
      <AuthGate
        icon={<IconFlame size={28} />}
        gradient={GRADIENT.vocab}
        title="Đăng nhập để vào Đấu trường"
        description="Đấu với người chơi khác để thi đua từ vựng. Mỗi trận 10 từ, 30 giây mỗi từ."
      />
    );
  }

  return <div className="py-6">{children}</div>;
}
