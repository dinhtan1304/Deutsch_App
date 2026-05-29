'use client';

import dynamic from 'next/dynamic';
import { Loading } from '@/components/ui';

// Lazy-load lobby so socket.io-client doesn't ship in the main bundle.
const ArenaLobby = dynamic(() => import('./ArenaLobby'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loading />
    </div>
  ),
});

export default function ArenaPage() {
  return <ArenaLobby />;
}
