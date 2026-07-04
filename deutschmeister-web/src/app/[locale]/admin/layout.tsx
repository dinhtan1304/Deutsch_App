'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/useIsMobile';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconGrid({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
}
function IconUsers({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function IconBook({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
}
function IconLayers({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>;
}
function IconPenTool({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>;
}
function IconCreditCard({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
}
function IconMessageSquare({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
}
function IconDatabase({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>;
}
function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function IconVideo({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>;
}
function IconZap({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}
function IconShield({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
function IconDumbbell({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m6.5 6.5 11 11" /><path d="m21 21-1-1" /><path d="m3 3 1 1" /><path d="m18 22 4-4" /><path d="m2 6 4-4" /><path d="m3 10 7-7" /><path d="m14 21 7-7" /></svg>;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: IconGrid, exact: true },
  { href: '/admin/users', label: 'Người dùng', icon: IconUsers, exact: false },
  { href: '/admin/words', label: 'Từ vựng', icon: IconBook, exact: false },
  { href: '/admin/topics', label: 'Topics', icon: IconLayers, exact: false },
  { href: '/admin/grammar', label: 'Ngữ pháp', icon: IconPenTool, exact: false },
  { href: '/admin/trainer', label: 'Grammar Trainer', icon: IconDumbbell, exact: false },
  { href: '/admin/subscriptions', label: 'Đăng ký', icon: IconCreditCard, exact: false },
  { href: '/admin/token-usage', label: 'Token AI', icon: IconZap, exact: false },
  { href: '/admin/feedback', label: 'Phản hồi', icon: IconMessageSquare, exact: false },
  { href: '/admin/dictation-requests', label: 'Dictation Queue', icon: IconVideo, exact: false },
  { href: '/admin/exam-rag', label: 'Đề mẫu RAG', icon: IconDatabase, exact: false },
  { href: '/admin/videos', label: 'Thư viện Video', icon: IconVideo, exact: false },
];

// Quick-access tabs for the mobile bottom bar — the four focus areas.
const BOTTOM_TABS = [
  { href: '/admin/users', label: 'User', icon: IconUsers },
  { href: '/admin/subscriptions', label: 'Đăng ký', icon: IconCreditCard },
  { href: '/admin/feedback', label: 'Phản hồi', icon: IconMessageSquare },
  { href: '/admin/token-usage', label: 'Token AI', icon: IconZap },
];

/** Title for the mobile top bar, derived from the current route. */
function currentTitle(pathname: string): string {
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find(item => (item.exact ? pathname === item.href : pathname.startsWith(item.href)));
  return match?.label ?? 'Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) {
      router.replace(`/auth/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user.role !== 'admin') { router.replace('/'); }
  }, [user, _hasHydrated, router, pathname]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  if (!_hasHydrated || !user || user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--theme-bg-body)' }}>
        <div style={{ color: 'var(--theme-text-muted)', fontSize: 14 }}>Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  // ─── Shared nav list (used by sidebar + drawer) ───────────────────────────
  const navList = (compact: boolean) => (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8,
              backgroundColor: active ? 'rgba(99,102,241,.15)' : 'transparent',
              color: active ? '#818CF8' : 'var(--theme-text-muted)',
              fontWeight: active ? 600 : 400,
              fontSize: 13, textDecoration: 'none',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
            <span style={{ flexShrink: 0 }}><Icon size={17} /></span>
            {!compact && label}
          </Link>
        );
      })}
    </>
  );

  const logo = (compact: boolean) => (
    <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--theme-border)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-32.png" width={32} height={32} alt="Deutschmeister" style={{ borderRadius: 8, flexShrink: 0 }} />
      {!compact && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-primary)', lineHeight: 1 }}>Admin</p>
          <p style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginTop: 2 }}>DeutschMeister</p>
        </div>
      )}
    </div>
  );

  const homeLink = (compact: boolean) => (
    <Link href="/"
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, color: 'var(--theme-text-muted)', fontSize: 12, textDecoration: 'none' }}>
      <span style={{ flexShrink: 0 }}><IconArrowLeft size={15} /></span>
      {!compact && 'Về trang chính'}
    </Link>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--theme-bg-body)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{
          width: sidebarOpen ? 220 : 64,
          flexShrink: 0,
          backgroundColor: 'var(--theme-bg-body)',
          borderRight: '1px solid var(--theme-border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s',
          overflow: 'hidden',
        }}>
          {logo(!sidebarOpen)}
          <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navList(!sidebarOpen)}
          </nav>
          <div style={{ padding: '12px 8px', borderTop: '1px solid var(--theme-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {homeLink(!sidebarOpen)}
          </div>
        </aside>
      )}

      {/* Mobile drawer */}
      {isMobile && drawerOpen && (
        <div onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,.6)', display: 'flex' }}>
          <aside onClick={e => e.stopPropagation()}
            style={{ width: 260, maxWidth: '82vw', height: '100%', backgroundColor: 'var(--theme-bg-body)', borderRight: '1px solid var(--theme-border)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            {logo(false)}
            <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navList(false)}
            </nav>
            <div style={{ padding: '12px 8px', borderTop: '1px solid var(--theme-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {homeLink(false)}
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ height: 52, backgroundColor: 'var(--theme-bg-body)', borderBottom: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', padding: isMobile ? '0 14px' : '0 20px', gap: 12, flexShrink: 0, position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => (isMobile ? setDrawerOpen(true) : setSidebarOpen(v => !v))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-text-muted)', padding: 4, display: 'flex' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          {isMobile ? (
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--theme-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTitle(pathname)}
            </span>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--theme-text-muted)', fontFamily: 'monospace' }}>
              {pathname}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, backgroundColor: 'rgba(99,102,241,.15)', color: '#818CF8' }}>
              ADMIN
            </span>
            {!isMobile && <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{user.name || user.email}</span>}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: isMobile ? '12px' : '24px', paddingBottom: isMobile ? 80 : 24, overflow: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar — quick access to the four focus areas */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          height: 64, paddingBottom: 'env(safe-area-inset-bottom)',
          backgroundColor: 'var(--theme-bg-body)', borderTop: '1px solid var(--theme-border)',
          display: 'flex',
        }}>
          {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  textDecoration: 'none', paddingTop: 4,
                  color: active ? '#818CF8' : 'var(--theme-text-muted)',
                }}>
                <Icon size={20} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
