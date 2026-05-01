'use client';
/* eslint-disable no-restricted-syntax */

import Link from 'next/link';
import { GRADIENT, ACCENT } from '@/lib/tokens';
import { IconMail, IconZap, IconStar, IconPencil, IconTrophy, IconCheckCircle } from '@/components/ui/Icons';

interface ProfileUser {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
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
}

export function ProfileHeroCard({ user, xpInfo, isLoading, points }: Props) {
  const isPremium = user?.subscription?.plan === 'premium';
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  return (
    <div className="rounded-[2.5rem] border mb-8 overflow-hidden shadow-2xl relative"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

      {/* Banner */}
      <div className="h-40 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)' }}>
        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[200%] rotate-12 opacity-30"
          style={{ background: `radial-gradient(ellipse at center, ${ACCENT.writing} 0%, transparent 70%)` }} />
        <div className="absolute bottom-[-50%] right-[-10%] w-[60%] h-[150%] -rotate-12 opacity-20"
          style={{ background: `radial-gradient(ellipse at center, #22C55E 0%, transparent 70%)` }} />
        <div className="absolute top-[20%] right-[10%] w-32 h-32 blur-[80px]"
          style={{ backgroundColor: ACCENT.xp, opacity: 0.2 }} />
      </div>

      {/* Avatar + info */}
      <div className="px-8 pb-8 relative">
        <div className="-mt-16 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* Avatar */}
          <div className="relative shrink-0 group">
            <div className="rounded-full p-1 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
              style={{ background: 'linear-gradient(135deg, #6366F1, #10B981, #F59E0B)' }}>
              <div className="rounded-full p-1" style={{ backgroundColor: 'var(--theme-bg-card)' }}>
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
            {/* Premium badge */}
            <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-theme-bg-card shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              <IconStar size={16} className="text-white" />
            </div>
          </div>

          {/* Edit + Share buttons */}
          <div className="flex items-center gap-3 pb-2">
            <Link href="/profile/share"
              className="group flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(99,102,241,0.4)]"
              style={{ background: GRADIENT.brand }}>
              <IconZap size={14} className="group-hover:animate-pulse" />
              Share
            </Link>
            <Link href="/settings"
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:-translate-y-1 hover:bg-theme-bg-tertiary"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
              <IconPencil size={14} />
              Edit
            </Link>
          </div>
        </div>

        {/* Name + Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
            {user?.name || 'User'}
          </h1>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
              <IconZap size={11} className="animate-pulse" />
              Active
            </div>
            {isPremium && (
              <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 flex items-center gap-1.5">
                <IconStar size={11} />
                Premium
              </div>
            )}
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium opacity-60 mb-8"
          style={{ color: 'var(--theme-text-muted)' }}>
          <span className="flex items-center gap-2"><IconMail size={14} /> {user?.email}</span>
          <span className="w-1 h-1 rounded-full bg-current opacity-30" />
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
              {isLoading ? '—' : points} Points
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
