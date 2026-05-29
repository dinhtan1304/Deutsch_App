'use client';
/* eslint-disable no-restricted-syntax */

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { usePublicProfile } from '@/hooks/useUser';
import { useAuthStore } from '@/stores/authStore';
import { ProfileHeroCard } from '../_components/ProfileHeroCard';
import { ProfileStatCard } from '../_components/ProfileStatCard';
import { ProfileAnswerStats } from '../_components/ProfileAnswerStats';
import { IconLock, IconArrowLeft, IconGamepad, IconTarget, IconStar, IconBrain } from '@/components/ui/Icons';
import { STATUS } from '@/lib/tokens';

export default function PublicProfilePage() {
  const t = useTranslations('progress.profile');
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: viewer } = useAuthStore();
  const id = params?.id;
  const { data, isLoading, error } = usePublicProfile(id);

  // Self-link → redirect to /profile (avoid duplicate views).
  if (viewer?.id && id === viewer.id) {
    if (typeof window !== 'undefined') {
      router.replace('/profile');
    }
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 animate-spin"
          style={{
            borderTopColor: ACCENT.srs,
            borderRightColor: 'var(--theme-border)',
            borderBottomColor: 'var(--theme-border)',
            borderLeftColor: 'var(--theme-border)',
          }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
          {t('public.notFoundTitle')}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          {t('public.notFoundBody')}
        </p>
        <Link href="/leaderboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white"
          style={{ background: GRADIENT.brand }}>
          <IconArrowLeft size={14} /> {t('public.leaderboard')}
        </Link>
      </div>
    );
  }

  if (data.isPrivate) {
    return (
      <div className="py-20 max-w-md mx-auto px-4">
        <div className="rounded-3xl border p-8 text-center"
          style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)' }}>
            <IconLock size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
            {t('public.privateTitle')}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
            {t('public.privateBody')}
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-transform hover:-translate-y-0.5"
            style={{ background: GRADIENT.brand }}
          >
            <IconArrowLeft size={14} /> {t('public.back')}
          </button>
        </div>
      </div>
    );
  }

  // Public profile rendered as readonly hero + a slim stats grid.
  const stats = data.stats;
  const statCards = stats
    ? [
        { label: t('statGames'), value: stats.gamesPlayed ?? 0, color: ACCENT.srs, icon: IconGamepad },
        { label: t('statAccuracy'), value: `${stats.accuracy ?? 0}%`, color: STATUS.success, icon: IconTarget },
        { label: t('statFavorites'), value: stats.favorites ?? 0, color: ACCENT.xp, icon: IconStar },
        { label: t('statLearned'), value: stats.wordsLearned ?? 0, color: ACCENT.vocab, icon: IconBrain },
      ]
    : [];

  const heroUser = {
    name: data.name,
    email: null,
    avatar: data.avatar,
    bio: data.bio,
    coverImage: data.coverImage,
    isPublic: data.isPublic,
    createdAt: data.createdAt ?? null,
    subscription: data.subscription ? { plan: data.subscription.plan } : null,
  };

  const xpInfo = data.xpInfo
    ? { level: data.xpInfo.level, cefr: data.xpInfo.cefr }
    : null;

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 min-h-screen"
      style={{ backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-primary)' }}>
      <ProfileHeroCard
        user={heroUser}
        xpInfo={xpInfo}
        isLoading={false}
        points={data.xpInfo?.xp ?? data.xp ?? 0}
        readonly
      />

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((card, i) => (
              <ProfileStatCard key={i} label={card.label} value={card.value} color={card.color} icon={card.icon} />
            ))}
          </div>

          <ProfileAnswerStats
            isLoading={false}
            accuracyPct={stats.accuracy ?? 0}
            correctAnswers={stats.correctAnswers ?? 0}
            wrongAnswers={stats.wrongAnswers ?? 0}
            totalAnswers={stats.totalAnswers ?? 0}
          />
        </>
      )}
    </div>
  );
}
