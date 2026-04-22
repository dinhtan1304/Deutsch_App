'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/useNotifications';
import type { Notification } from '@/lib/api/notifications';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  achievement: '🏆',
  streak: '🔥',
  challenge: '⚡',
  system: '📢',
  xp: '✨',
  level_up: '🎉',
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
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-4 top-16 z-50 w-96 max-h-[70vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          animation: 'drawerIn .2s ease-out',
        }}
      >
        <style>{`
          @keyframes drawerIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--theme-border)' }}
        >
          <h3
            className="font-bold text-[15px]"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            Thông báo
          </h3>
          <div className="flex items-center gap-2">
            {(data?.unreadCount ?? 0) > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                style={{ color: '#3B82F6' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(59,130,246,.08)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
              >
                Đọc tất cả
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {isLoading ? (
            <div className="p-8 text-center">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto"
                style={{ borderColor: 'var(--theme-border)', borderTopColor: '#3B82F6' }}
              />
            </div>
          ) : isError ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--theme-text-muted)', opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="text-body font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                Không tải được thông báo
              </div>
              <button
                onClick={() => refetch()}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                style={{ color: '#3B82F6', borderColor: 'rgba(59,130,246,.3)' }}
              >
                Thử lại
              </button>
            </div>
          ) : !data?.items.length ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--theme-text-muted)', opacity: 0.5 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div className="text-body font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                Chưa có thông báo nào
              </div>
            </div>
          ) : (
            data.items.map(notif => {
              const icon = notif.icon || TYPE_ICONS[notif.type] || '📌';
              const content = (
                <div
                  className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: notif.read
                      ? undefined
                      : 'rgba(59,130,246,.04)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = notif.read ? '' : 'rgba(59,130,246,.04)')}
                  onClick={() => handleClick(notif)}
                >
                  <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold text-body truncate"
                        style={{ color: 'var(--theme-text-primary)' }}
                      >
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: '#3B82F6' }}
                        />
                      )}
                    </div>
                    <div
                      className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {notif.body}
                    </div>
                    <div
                      className="text-caption mt-1"
                      style={{ color: 'var(--theme-text-muted)', opacity: 0.7 }}
                    >
                      {timeAgo(notif.createdAt)}
                    </div>
                  </div>
                </div>
              );

              return notif.href ? (
                <Link key={notif.id} href={notif.href} onClick={onClose}>
                  {content}
                </Link>
              ) : (
                <div key={notif.id}>{content}</div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {data && data.total > 20 && (
          <div
            className="px-4 py-2.5 text-center shrink-0"
            style={{ borderTop: '1px solid var(--theme-border)' }}
          >
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {data.total} thông báo
            </span>
          </div>
        )}
      </div>
    </>
  );
}
