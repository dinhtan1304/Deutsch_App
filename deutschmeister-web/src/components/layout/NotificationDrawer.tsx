'use client';

import { useState } from 'react';
import type { ComponentType } from 'react';
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function NotificationDrawer({ open, onClose }: Props) {
  const drawerRef = useModalA11y(open, onClose);
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
        className="fixed right-4 top-16 z-50 w-100 max-h-[85vh] rounded-[2.5rem] border shadow-2xl flex flex-col overflow-hidden backdrop-blur-3xl"
        style={{
          background: 'color-mix(in srgb, var(--theme-bg-card) 96%, transparent)',
          borderColor: 'var(--theme-border)',
          animation: 'drawerIn .3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
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
        <div className="px-6 py-5 shrink-0 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between mb-1">
            <h3 id="notif-drawer-title" className="text-xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              Thông báo
            </h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:scale-110 transition-transform active:scale-90" style={{ color: 'var(--theme-text-muted)' }}>
              <IconX size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold opacity-40 uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>
              {data?.unreadCount ? `${data.unreadCount} tin nhắn mới` : 'Không có tin mới'}
            </p>
            {(data?.unreadCount ?? 0) > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest py-1 px-2.5 rounded-lg transition-all hover:bg-indigo-500/10"
                style={{ color: ACCENT.srs }}
              >
                <IconCheck size={12} />
                Đọc tất cả
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="notif-scroll flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="p-20 text-center">
              <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin mx-auto"
                style={{ borderColor: 'var(--theme-border)', borderTopColor: ACCENT.srs }} />
            </div>
          ) : isError ? (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <IconInfo size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black" style={{ color: 'var(--theme-text-primary)' }}>Ối! Đã có lỗi xảy ra</p>
                <p className="text-xs opacity-50 font-medium" style={{ color: 'var(--theme-text-muted)' }}>Không thể tải thông báo lúc này</p>
              </div>
              <button onClick={() => refetch()} className="px-5 py-2 rounded-xl text-xs font-black border border-indigo-500/30 transition-all hover:bg-indigo-500 hover:text-white" style={{ color: ACCENT.srs }}>
                Thử lại
              </button>
            </div>
          ) : !data?.items.length ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-4xl bg-black/3 dark:bg-white/5 flex items-center justify-center text-muted opacity-30">
                <IconBell size={40} />
              </div>
              <p className="text-sm font-black opacity-30 uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>Trống rỗng</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {data.items.map(notif => {
                const config = TYPE_CONFIG[notif.type] ?? { icon: IconBell, color: ACCENT.writing, bg: `${ACCENT.writing}1a` };
                const Icon = config.icon;
                
                const content = (
                  <div
                    className="relative flex items-start gap-4 px-6 py-4 transition-all duration-300 cursor-pointer group hover:bg-black/3 dark:hover:bg-white/5"
                    onClick={() => handleClick(notif)}
                  >
                    {/* Unread Glow Indicator */}
                    {!notif.read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full" style={{ background: ACCENT.srs }} />
                    )}
                    
                    {/* Icon Container */}
                    <div className="relative shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" 
                      style={{ backgroundColor: config.bg, color: config.color }}>
                      <Icon size={22} />
                      {!notif.read && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" 
                          style={{ background: ACCENT.srs }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-black text-body truncate transition-colors ${notif.read ? 'opacity-70' : ''}`} style={{ color: 'var(--theme-text-primary)' }}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] font-bold opacity-40 whitespace-nowrap" style={{ color: 'var(--theme-text-muted)' }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className={`text-[12.5px] leading-relaxed line-clamp-2 ${notif.read ? 'opacity-40' : 'opacity-70'}`} style={{ color: 'var(--theme-text-primary)' }}>
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
        <div className="px-6 py-4 shrink-0 bg-black/2 dark:bg-white/3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
           <Link href="/settings" onClick={onClose} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-primary)' }}>
              <IconSettings size={14} />
              Cài đặt
           </Link>
           {data && data.total > 0 && (
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30" style={{ color: 'var(--theme-text-primary)' }}>
                {data.total} thông báo
              </span>
           )}
        </div>
      </div>
    </>
  );
}
