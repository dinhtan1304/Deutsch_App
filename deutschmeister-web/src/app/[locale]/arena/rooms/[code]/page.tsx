'use client';

import dynamic from 'next/dynamic';
import { use } from 'react';
import { Loading } from '@/components/ui';

const RoomLanding = dynamic(() => import('./RoomLanding'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loading />
    </div>
  ),
});

export default function ArenaRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  return <RoomLanding code={code.toUpperCase()} />;
}
