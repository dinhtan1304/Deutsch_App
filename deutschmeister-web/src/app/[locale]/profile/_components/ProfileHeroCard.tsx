'use client';
/* eslint-disable no-restricted-syntax */

import Link from 'next/link';
import { GRADIENT, ACCENT } from '@/lib/tokens';
import { IconMail, IconZap, IconStar, IconPencil, IconTrophy, IconCheckCircle, IconLock } from '@/components/ui/Icons';
import { resolveCoverBackground } from '@/lib/coverPresets';

interface ProfileUser {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  bio?: string | null;
  coverImage?: string | null;
  isPublic?: boolean;
  createdAt?: string | null;
  subscription?: { plan?: string | null } | null;
}

interface XpInfo {
  level: number;
  cefr: string;
}

interface Props {
  user: ProfileUser | null;
  xpInfo: XpInfo | null | undefined;
  isLoading: boolean;
  points: number;
  onEdit?: () => void;
  readonly?: boolean;
}

const PLAN_BADGES = {
  lifetime: {
    label: 'Lifetime',
    style: { background: 'linear-gradient(135deg, #F59E0B, #D97706)' as string, color: '#fff' },
    showStar: true,
  },
  premium: {
    label: 'Premium',
    style: { backgroundColor: '#6366F1', color: '#fff' },
    showStar: true,
  },
  free: {
    label: 'Free',
    style: { backgroundColor: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' },
    showStar: false,
  },
} as const;

export function ProfileHeroCard({ user, xpInfo, isLoading, points, onEdit, readonly = false }: Props) {
  const planRaw = (user?.subscription?.plan ?? 'free') as keyof typeof PLAN_BADGES;
  const plan = PLAN_BADGES[planRaw] ?? PLAN_BADGES.free;
  const isFree = planRaw === 'free';
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  const cover = resolveCoverBackground(user?.coverImage);

  return (
    <div className="rounded-[2.5rem] border mb-8 overflow-hidden shadow-2xl relative"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

      {/* Banner */}
      <div className="h-40 relative overflow-hidden"
        style={cover.kind === 'gradient' ? { background: cover.css } : { backgroundImage: `url(${cover.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {cover.kind === 'gradient' && (
          <>
            <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[200%] rotate-12 opacity-30"
              style={{ background: `radial-gradient(ellipse at center, ${ACCENT.writing} 0%, transparent 70%)` }} />
            <div className="absolute bottom-[-50%] right-[-10%] w-[60%] h-[150%] -rotate-12 opacity-20"
              style={{ background: `radial-gradient(ellipse at center, #22C55E 0%, transparent 70%)` }} />
            <div className="absolute top-[20%] right-[10%] w-32 h-32 blur-[80px]"
              style={{ backgroundColor: ACCENT.xp, opacity: 0.2 }} />
          </>
        )}
        {/* Privacy lock indicator (own profile only) */}
        {!readonly && user?.isPublic === false && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}>
            <IconLock size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Riêng tư</span>
          </div>
        )}
      </div>

      {/* Avatar + info */}
      <div className="px-8 pb-8 relative">
        <div className="-mt-16 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* Avatar */}
          <div className="relative shrink-0 group w-fit self-start">
            <div className="rounded-full p-1 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] w-fit"
              style={{ background: 'linear-gradient(135deg, #6366F1, #10B981, #F59E0B)' }}>
              <div className="rounded-full p-1 w-fit" style={{ backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="rounded-full flex items-center justify-center text-white text-4xl font-black overflow-hidden relative"
                  style={{
                    width: 120, height: 120,
                    background: user?.avatar ? undefined : 'linear-gradient(135deg, #4F46E5, #3730A3)',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)',
                  }}>
                  {user?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt={user.name ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
            {/* Plan badge marker on avatar (only for paid plans) */}
            {plan.showStar && (
              <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-theme-bg-card shadow-2xl"
                style={planRaw === 'lifetime'
                  ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)' }
                  : { background: 'linear-gradient(135deg, #6366F1, #4338CA)' }}>
                <IconStar size={16} className="text-white" />
              </div>
            )}
          </div>

          {/* Edit + Share buttons (hidden in readonly mode) */}
          {!readonly && (
            <div className="flex items-center gap-3 pb-2">
              <Link href="/profile/share"
                className="group flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(99,102,241,0.4)]"
                style={{ background: GRADIENT.brand }}>
                <IconZap size={14} className="group-hover:animate-pulse" />
                Share
              </Link>
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:-translate-y-1 hover:bg-theme-bg-tertiary"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
                <IconPencil size={14} />
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Name + Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
            {user?.name || 'User'}
          </h1>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
              <IconZap size={11} className="animate-pulse" />
              Active
            </div>
            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
              style={plan.style}>
              {plan.showStar && <IconStar size={11} />}
              {plan.label}
            </div>
            {!readonly && isFree && (
              <Link
                href="/pricing"
                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ background: GRADIENT.brand }}
              >
                Nâng cấp
              </Link>
            )}
          </div>
        </div>

        {/* Bio */}
        {user?.bio ? (
          <p className="text-sm mb-4 max-w-2xl whitespace-pre-line"
            style={{ color: 'var(--theme-text-secondary)' }}>
            {user.bio}
          </p>
        ) : (
          !readonly && (
            <button
              type="button"
              onClick={onEdit}
              className="text-sm mb-4 italic underline-offset-2 hover:underline transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              + Thêm mô tả về bạn...
            </button>
          )
        )}

        {/* Stats pills */}
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium opacity-60 mb-8"
          style={{ color: 'var(--theme-text-muted)' }}>
          {user?.email && (
            <>
              <span className="flex items-center gap-2"><IconMail size={14} /> {user.email}</span>
              <span className="w-1 h-1 rounded-full bg-current opacity-30" />
            </>
          )}
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Joined {joinedDate}
          </span>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          {xpInfo && (
            <div className="px-4 py-2 rounded-2xl border flex items-center gap-2 transition-colors hover:bg-theme-bg-secondary"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)44' }}>
              <IconTrophy size={14} className="text-indigo-500" />
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
                Lv.{xpInfo.level} · {xpInfo.cefr}
              </span>
            </div>
          )}
          <div className="px-4 py-2 rounded-2xl border flex items-center gap-2 transition-colors hover:bg-theme-bg-secondary"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)44' }}>
            <IconZap size={14} className="text-amber-500" />
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-500">
              {isLoading ? '—' : points.toLocaleString('vi-VN')} XP
            </span>
          </div>
          <div className="px-4 py-2 rounded-2xl border flex items-center gap-2 transition-colors hover:bg-theme-bg-secondary"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)44' }}>
            <IconCheckCircle size={14} className="text-emerald-500" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
