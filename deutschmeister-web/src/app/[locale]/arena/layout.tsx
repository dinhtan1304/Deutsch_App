'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { AuthGate } from '@/components/ui';
import { IconFlame } from '@/components/ui/Icons';
import { GRADIENT } from '@/lib/tokens';
import { useArenaStore } from '@/stores/arenaStore';
import { useArenaSocket } from '@/hooks/useArenaSocket';

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('arena');
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
        title={t('authTitle')}
        description={t('authDesc')}
      />
    );
  }

  return <div className="py-6">{children}</div>;
}
