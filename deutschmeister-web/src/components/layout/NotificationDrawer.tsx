'use client';

import { useState } from 'react';
import type { ComponentType } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import Link from 'next/link';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/useNotifications';
import { useModalA11y } from '@/hooks/useModalA11y';
import type { Notification } from '@/lib/api/notifications';
import { IconCheck, IconX, IconBell, IconSettings, IconInfo, IconZap, IconStar, IconTrophy, IconFlame } from '@/components/ui/Icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_CONFIG: Record<string, { icon: ComponentType<{ size?: number }>; color: string; bg: string }> = {
  achievement: { icon: IconTrophy, color: ACCENT.xp,      bg: `${ACCENT.xp}1a` },
  streak:      { icon: IconFlame,  color: STATUS.danger,  bg: `${STATUS.danger}1a` },
  challenge:   { icon: IconZap,    color: ACCENT.vocab,   bg: `${ACCENT.vocab}1a` },
  system:      { icon: IconInfo,   color: ACCENT.emerald, bg: `${ACCENT.emerald}1a` },
  xp:          { icon: IconZap,    color: ACCENT.srs,     bg: `${ACCENT.srs}1a` },
  level_up:    { icon: IconStar,   color: ACCENT.xp,      bg: `${ACCENT.xp}1a` },
};

// Resolve a relative-time label using next-intl's ICU-backed translator
// + the active locale's date format for older items. Kept inline (not a
// utility) because it needs the t/formatter hooks from this component.
function useTimeAgo() {
  const t = useTranslations('common');
  const formatter = useFormatter();
  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('time.justNow');
    if (mins < 60) return t('time.minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('time.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t('time.daysAgo', { count: days });
    return formatter.dateTime(new Date(dateStr));
  };
}

export function NotificationDrawer({ open, onClose }: Props) {
  const t = useTranslations('header.notifications');
  const drawerRef = useModalA11y(open, onClose);
  const timeAgo = useTimeAgo();
  const [page] = useState(1);
  const { data, isLoading, isError, refetch } = useNotifications(page);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const handleClick = (notif: Notification) => {
    if (!notif.read) markRead.mutate(notif.id);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-drawer-title"
        className="fixed right-4 top-16 z-50 w-100 max-h-[85vh] rounded-2xl border shadow-xl flex flex-col overflow-hidden backdrop-blur-2xl"
        style={{
          background: 'color-mix(in srgb, var(--theme-bg-card) 96%, transparent)',
          borderColor: 'var(--theme-border)',
          animation: 'drawerIn .3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
        }}
      >
        {/* UI REFRESH TRIGGER: 1.0.1 */}
        <style>{`
          @keyframes drawerIn {
            from { opacity: 0; transform: translateY(-12px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .notif-scroll::-webkit-scrollbar { width: 4px; }
          .notif-scroll::-webkit-scrollbar-track { background: transparent; }
          .notif-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
          .notif-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); }
          .dark .notif-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
          .dark .notif-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        `}</style>

        {/* Header */}
        <div className="px-6 py-5 shrink-0 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center justify-between mb-1">
            <h3 id="notif-drawer-title" className="text-lead font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {t('title')}
            </h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-(--theme-bg-secondary)" style={{ color: 'var(--theme-text-muted)', background: 'var(--theme-bg-secondary)' }}>
              <IconX size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-caption font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
              {data?.unreadCount ? t('unreadCount', { count: data.unreadCount }) : t('noUnread')}
            </p>
            {(data?.unreadCount ?? 0) > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide py-1 px-2.5 rounded-md transition-colors"
                style={{ color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
              >
                <IconCheck size={12} />
                {t('markAll')}
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="notif-scroll flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="p-20 text-center">
              <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin mx-auto"
                style={{ borderColor: 'var(--theme-border)', borderTopColor: 'var(--accent)' }} />
            </div>
          ) : isError ? (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${STATUS.danger} 12%, transparent)`, color: STATUS.danger }}>
                <IconInfo size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{t('errorTitle')}</p>
                <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('errorBody')}</p>
              </div>
              <button onClick={() => refetch()} className="px-5 py-2 rounded-md text-body font-semibold transition-colors"
                style={{ color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                {t('retry')}
              </button>
            </div>
          ) : !data?.items.length ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                <IconBell size={32} />
              </div>
              <p className="text-body font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{t('empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-(--theme-border)">
              {data.items.map(notif => {
                const config = TYPE_CONFIG[notif.type] ?? { icon: IconBell, color: ACCENT.writing, bg: `${ACCENT.writing}1a` };
                const Icon = config.icon;

                const content = (
                  <div
                    className="relative flex items-start gap-3.5 px-6 py-4 transition-colors cursor-pointer hover:bg-(--theme-bg-secondary)"
                    onClick={() => handleClick(notif)}
                  >
                    {/* Unread Indicator */}
                    {!notif.read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-md" style={{ background: 'var(--accent)' }} />
                    )}

                    {/* Icon Container */}
                    <div className="relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: config.bg, color: config.color }}>
                      <Icon size={20} />
                      {!notif.read && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                          style={{ background: 'var(--accent)', border: '2px solid var(--theme-bg-card)' }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-semibold text-body truncate ${notif.read ? 'opacity-70' : ''}`} style={{ color: 'var(--theme-text-primary)' }}>
                          {notif.title}
                        </span>
                        <span className="text-caption whitespace-nowrap" style={{ color: 'var(--theme-text-muted)' }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className={`text-caption leading-relaxed line-clamp-2 ${notif.read ? 'opacity-50' : ''}`} style={{ color: 'var(--theme-text-secondary)' }}>
                        {notif.body}
                      </p>
                    </div>
                  </div>
                );

                return notif.href ? (
                  <Link key={notif.id} href={notif.href} onClick={onClose} className="block no-underline">
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id}>{content}</div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 shrink-0 border-t flex items-center justify-between"
          style={{ background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
           <Link href="/settings" onClick={onClose} className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide transition-colors hover:text-(--accent)" style={{ color: 'var(--theme-text-muted)' }}>
              <IconSettings size={14} />
              {t('settings')}
           </Link>
           {data && data.total > 0 && (
              <span className="text-caption font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
                {t('totalCount', { count: data.total })}
              </span>
           )}
        </div>
      </div>
    </>
  );
}
