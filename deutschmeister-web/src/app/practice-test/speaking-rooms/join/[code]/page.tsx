'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJoinByCode } from '@/hooks/useSpeakingRooms';
import { PageHeader } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api/client';
import { parseSpeakingRoomInviteCode } from '@/lib/api/speakingRooms';

export default function JoinByCodePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const joinMut = useJoinByCode();
  const [errorMsg, setErrorMsg] = useState('');
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    if (!params.code) return;
    (async () => {
      try {
        const room = await joinMut.mutateAsync({ code: parseSpeakingRoomInviteCode(params.code) });
        router.replace(`/practice-test/speaking-rooms/${room.id}`);
      } catch (err) {
        setErrorMsg(getApiErrorMessage(err, 'Mã mời không hợp lệ.'));
        setJoining(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader title="Vào phòng riêng" accent="speaking" backHref="/practice-test/speaking-rooms" />
      {joining && <p style={{ color: 'var(--theme-text-muted)' }}>Đang vào phòng...</p>}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid #EF4444' }}>
          <p className="font-bold" style={{ color: '#EF4444' }}>{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
