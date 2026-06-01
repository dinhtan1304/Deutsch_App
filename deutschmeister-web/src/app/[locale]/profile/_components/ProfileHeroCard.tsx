'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { IconMail, IconZap, IconStar, IconPencil, IconCheckCircle } from '@/components/ui/Icons';

interface ProfileUser {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  bio?: string | null;
  isPublic?: boolean;
  createdAt?: string | null;
  subscription?: { plan?: string | null } | null;
}

interface XpInfo {
  level: number;
  cefr: string;
  nameVi?: string;
  xp?: number;
  nextLevelXp?: number;
}

interface Props {
  user: ProfileUser | null;
  xpInfo: XpInfo | null | undefined;
  isLoading: boolean;
  points: number;
  onEdit?: () => void;
  readonly?: boolean;
}

const PLAN_META = {
  lifetime: { label: 'Lifetime', color: 'var(--warn)', star: true },
  premium: { label: 'Premium', color: 'var(--accent)', star: true },
  free: { label: 'Free', color: 'var(--theme-text-muted)', star: false },
} as const;

const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

function Pill({ color, label, dot, icon }: { color: string; label: string; dot?: boolean; icon?: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide"
      style={{ background: mix(color, 16), color }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />}
      {icon}
      {label}
    </span>
  );
}

export function ProfileHeroCard({ user, xpInfo, isLoading, points, onEdit, readonly = false }: Props) {
  const t = useTranslations('progress.profile.hero');
  const locale = useLocale();
  const planRaw = (user?.subscription?.plan ?? 'free') as keyof typeof PLAN_META;
  const plan = PLAN_META[planRaw] ?? PLAN_META.free;
  const isFree = planRaw === 'free';
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  const totalXp = xpInfo?.xp ?? points;
  const nextXp = xpInfo?.nextLevelXp ?? 0;
  const xpPct = nextXp > 0 ? Math.min(100, Math.round((totalXp / nextXp) * 100)) : 0;

  return (
    <div className="relative mb-5 overflow-hidden rounded-[18px] border p-5 sm:p-6"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="pointer-events-none absolute -left-10 -top-24 h-72 w-72 rounded-full" style={{ background: mix('var(--accent)', 8), filter: 'blur(60px)' }} />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
        {/* Avatar */}
        <div className="relative shrink-0 self-start md:self-center">
          <div className="rounded-full p-0.75" style={{ background: 'conic-gradient(from 0deg, var(--accent), var(--violet), var(--success), var(--accent))' }}>
            <div className="rounded-full p-0.75" style={{ background: 'var(--theme-bg-card)' }}>
              <div className={`flex items-center justify-center overflow-hidden rounded-full text-3xl font-extrabold text-white ${user?.avatar ? '' : 'v2-match-grad'}`}
                style={{ width: 96, height: 96 }}>
                {user?.avatar
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.avatar} alt={user.name ?? ''} className="h-full w-full object-cover" />
                  : (user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U')}
              </div>
            </div>
          </div>
          {plan.star && (
            <div className="v2-beta-badge absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full"
              style={{ border: '3px solid var(--theme-bg-card)' }}>
              <IconStar size={13} style={{ color: 'white' }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <h1 className="text-h1 font-extrabold leading-none tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              {user?.name || 'User'}
            </h1>
            <Pill color="var(--success)" label="Active" dot />
            <Pill color={plan.color} label={plan.label} icon={plan.star ? <IconStar size={11} /> : undefined} />
            <Pill color="var(--accent)" label="Verified" icon={<IconCheckCircle size={11} />} />
          </div>

          <div className="mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {user?.email && (
              <span className="flex items-center gap-1.5"><IconMail size={13} /> {user.email}</span>
            )}
            <span className="h-1 w-1 rounded-full" style={{ background: 'currentColor', opacity: 0.4 }} />
            <span>{t('joined', { date: joinedDate })}</span>
          </div>

          {user?.bio && (
            <p className="mb-3 max-w-2xl whitespace-pre-line text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{user.bio}</p>
          )}

          {/* XP bar */}
          {xpInfo && (
            <div className="max-w-105">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
                  <span className="mono">Lv.{xpInfo.level}</span> · {xpInfo.cefr}{xpInfo.nameVi ? ` — ${xpInfo.nameVi}` : ''}
                </span>
                <span className="mono text-[11px] whitespace-nowrap" style={{ color: 'var(--theme-text-muted)' }}>
                  {isLoading ? '—' : `${totalXp.toLocaleString(locale)} / ${nextXp.toLocaleString(locale)} XP`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-secondary)' }}>
                <div className="v2-match-grad h-full rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!readonly && (
          <div className="flex shrink-0 items-center gap-2 self-start md:self-center">
            <Link href="/profile/share"
              className="v2-match-grad flex items-center gap-2 rounded-[9px] px-4 py-2.5 text-caption font-bold text-white transition-transform active:scale-95"
              style={{ boxShadow: `0 4px 12px ${mix('var(--accent)', 40)}` }}>
              <IconZap size={14} /> {t('share')}
            </Link>
            <button type="button" onClick={onEdit}
              className="flex items-center gap-2 rounded-[9px] border px-4 py-2.5 text-caption font-medium transition-colors hover:opacity-80"
              style={{ background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              <IconPencil size={14} /> {t('edit')}
            </button>
            {isFree && (
              <Link href="/pricing"
                className="v2-match-grad hidden items-center rounded-[9px] px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white lg:flex">
                {t('upgrade')}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
