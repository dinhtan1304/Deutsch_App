'use client';

import dynamic from 'next/dynamic';
import { use } from 'react';
import { Loading } from '@/components/ui';

const MatchScreen = dynamic(() => import('./MatchScreen'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Loading />
    </div>
  ),
});

export default function ArenaMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <MatchScreen matchId={id} />;
}
