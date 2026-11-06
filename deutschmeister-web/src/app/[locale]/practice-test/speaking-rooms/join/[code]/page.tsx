'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useJoinByCode } from '@/hooks/useSpeakingRooms';
import { PageHeader } from '@/components/ui';
import { STATUS } from '@/lib/tokens';
import { getApiErrorMessage } from '@/lib/api/client';
import { parseSpeakingRoomInviteCode } from '@/lib/api/speakingRooms';

export default function JoinByCodePage() {
  const t = useTranslations('speakingRooms');
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
        setErrorMsg(getApiErrorMessage(err, t('join.invalidCode')));
        setJoining(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader title={t('join.title')} accent="speaking" backHref="/practice-test/speaking-rooms" />
      {joining && <p style={{ color: 'var(--theme-text-muted)' }}>{t('join.joining')}</p>}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: `${STATUS.danger}14`, border: `1px solid ${STATUS.danger}` }}>
          <p className="font-bold" style={{ color: STATUS.danger }}>{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
