'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAdminStats } from '@/hooks/useAdmin';
import type { FeatureStat } from '@/lib/api/admin';
import { useIsMobile } from '@/hooks/useIsMobile';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconUsers({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function IconBook({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
}
function IconActivity({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}
function IconZap({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}
function IconStar({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
function IconTrendUp({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
}
function IconCrown({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M5 20h14" /></svg>;
}
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color, href, accent,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ size?: number }>; color: string;
  href?: string; accent?: boolean;
}) {
  const inner = (
    <div style={{
      backgroundColor: accent ? `${color}10` : 'var(--theme-bg-card)',
      borderRadius: 12,
      border: `1px solid ${accent ? `${color}28` : 'var(--theme-border)'}`,
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      height: '100%',
      boxSizing: 'border-box' as const,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ color }}><Icon size={18} /></span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginTop: 3 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: 'var(--theme-text-muted)', marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
  );
  if (href) {
    return <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>{inner}</Link>;
  }
  return inner;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SL({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      marginBottom: 10, marginTop: 24,
    }}>
      {children}
    </p>
  );
}

// ─── Feature Usage ────────────────────────────────────────────────────────────
const FEATURE_META: Record<string, { label: string; color: string; gradient: string }> = {
  writing:       { label: 'Luyện Viết',     color: '#6366F1', gradient: 'linear-gradient(90deg,#6366F1,#8B5CF6)' },
  reading:       { label: 'Luyện Đọc',      color: '#22C55E', gradient: 'linear-gradient(90deg,#22C55E,#14B8A6)' },
  listening:     { label: 'Luyện Nghe',     color: '#EC4899', gradient: 'linear-gradient(90deg,#EC4899,#A855F7)' },
  freeSpeaking:  { label: 'Luyện Nói',      color: '#F59E0B', gradient: 'linear-gradient(90deg,#F59E0B,#EF4444)' },
  examReading:   { label: 'Thi Đọc',        color: '#0EA5E9', gradient: 'linear-gradient(90deg,#22C55E,#0EA5E9)' },
  examListening: { label: 'Thi Nghe',       color: '#A855F7', gradient: 'linear-gradient(90deg,#EC4899,#A855F7)' },
  examWriting:   { label: 'Thi Viết',       color: '#818CF8', gradient: 'linear-gradient(90deg,#A855F7,#6366F1)' },
  examSpeaking:  { label: 'Thi Nói',        color: '#FB923C', gradient: 'linear-gradient(90deg,#F59E0B,#EF4444)' },
};

type Period = 'today' | 'week' | 'total';

function FeatureChart({ features, period }: { features: Record<string, FeatureStat>; period: Period }) {
  const rows = Object.entries(features).map(([key, stat]) => ({
    key,
    meta: FEATURE_META[key] ?? { label: key, color: 'var(--theme-text-muted)', gradient: 'linear-gradient(90deg,#64748B,#94A3B8)' },
    value: period === 'total' ? stat.total : period === 'week' ? stat.week : stat.today,
    isAi: stat.isAi,
  })).sort((a, b) => b.value - a.value);

  const max = Math.max(...rows.map(r => r.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map(({ key, meta, value, isAi }) => (
        <div key={key} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 52px', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--theme-text-secondary)', fontWeight: 500 }}>{meta.label}</span>
            {isAi && <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 4, backgroundColor: 'rgba(99,102,241,.2)', color: '#818CF8', flexShrink: 0 }}>AI</span>}
          </div>
          <div style={{ height: 7, borderRadius: 4, backgroundColor: 'var(--theme-bg-body)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${value > 0 ? Math.max(Math.round((value / max) * 100), 2) : 0}%`,
              background: meta.gradient,
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-primary)', textAlign: 'right' }}>{value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const isMobile = useIsMobile();
  const { data: stats, isLoading, isError, error, refetch } = useAdminStats();
  const [period, setPeriod] = useState<Period>('week');
  const grid4 = isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))';
  const grid3 = isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))';

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', marginBottom: 2 }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Tổng quan nền tảng DeutschMeister</p>
        </div>
        <Link href="/admin/subscriptions"
          style={{ padding: '7px 14px', borderRadius: 8, backgroundColor: 'rgba(99,102,241,.12)', color: '#818CF8', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(99,102,241,.25)', whiteSpace: 'nowrap' }}>
          ⭐ Quản lý đăng ký
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <span style={{ color: '#6366F1' }}><IconLoader size={28} /></span>
        </div>
      ) : isError || !stats ? (
        <div style={{ textAlign: 'center', padding: '60px 16px', backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)' }}>
          <div style={{ color: '#F87171', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Không tải được số liệu dashboard.</div>
          <div style={{ color: 'var(--theme-text-muted)', fontSize: 12, marginBottom: 16 }}>{(error as any)?.message ?? 'Lỗi không xác định.'}</div>
          <button onClick={() => refetch()}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* ── Users ────────────────────────────────────────── */}
          <SL>Người dùng</SL>
          <div style={{ display: 'grid', gridTemplateColumns: grid4, gap: 10 }}>
            <StatCard label="Tổng người dùng" value={stats.totalUsers.toLocaleString()}
              sub={`${stats.activeUsers} đang hoạt động`}
              icon={IconUsers} color="#6366F1" href="/admin/users" />
            <StatCard label="Mới trong tuần" value={stats.newUsersThisWeek}
              sub={`${stats.newUsersThisMonth} trong 30 ngày`}
              icon={IconTrendUp} color="#22C55E" />
            <StatCard label="Gói Premium" value={stats.premiumUsers}
              sub={`${stats.totalUsers > 0 ? Math.round(stats.premiumUsers / stats.totalUsers * 100) : 0}% tổng users`}
              icon={IconCrown} color="#F59E0B" accent href="/admin/subscriptions" />
            <StatCard label="Điểm TB" value={stats.avgScore > 0 ? `${stats.avgScore}%` : '—'}
              sub="Tất cả bài đã chấm"
              icon={IconStar} color="#EC4899" />
          </div>

          {/* ── Traffic ──────────────────────────────────────── */}
          <SL>Traffic — phiên sử dụng</SL>
          <div style={{ display: 'grid', gridTemplateColumns: grid3, gap: 10 }}>
            <StatCard label="Hôm nay" value={stats.sessionsToday.toLocaleString()}
              sub="Tất cả loại"
              icon={IconActivity} color="#22C55E" />
            <StatCard label="7 ngày gần nhất" value={stats.sessionsThisWeek.toLocaleString()}
              sub="Tất cả loại"
              icon={IconActivity} color="#3B82F6" />
            <StatCard label="Tổng tất cả thời gian" value={stats.sessionsAllTime.toLocaleString()}
              sub="Tất cả loại"
              icon={IconActivity} color="#8B5CF6" />
          </div>

          {/* ── AI Usage ─────────────────────────────────────── */}
          <SL>Tính năng AI (Gemini)</SL>
          <div style={{ display: 'grid', gridTemplateColumns: grid3, gap: 10 }}>
            <StatCard label="AI calls hôm nay" value={stats.aiSessionsToday.toLocaleString()}
              sub="Viết · Nói · Thi Viết · Thi Nói"
              icon={IconZap} color="#6366F1" accent />
            <StatCard label="AI calls tuần này" value={stats.aiSessionsWeek.toLocaleString()}
              sub="7 ngày gần nhất"
              icon={IconZap} color="#6366F1" accent />
            <StatCard label="Tổng AI calls" value={stats.aiSessionsAllTime.toLocaleString()}
              sub="Tất cả thời gian"
              icon={IconZap} color="#6366F1" accent />
          </div>

          {/* ── Feature breakdown ─────────────────────────────── */}
          <SL>Lượt dùng theo tính năng</SL>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: 'var(--theme-text-secondary)', fontWeight: 600 }}>Số lượt theo kỳ</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {([['today', 'Hôm nay'], ['week', 'Tuần'], ['total', 'Tổng']] as [Period, string][]).map(([k, l]) => (
                  <button key={k} onClick={() => setPeriod(k)}
                    style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      border: period === k ? '1px solid #6366F1' : '1px solid var(--theme-border)',
                      backgroundColor: period === k ? 'rgba(99,102,241,.15)' : 'transparent',
                      color: period === k ? '#818CF8' : 'var(--theme-text-muted)',
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <FeatureChart features={stats.features} period={period} />
            <p style={{ fontSize: 10, color: 'var(--theme-border)', marginTop: 14, textAlign: 'right' }}>
              Nhãn AI = có Gemini grading · Luyện tự do: Viết, Đọc, Nghe, Nói · Thi chuẩn: 4 exam modes
            </p>
          </div>

          {/* ── Content ──────────────────────────────────────── */}
          <SL>Nội dung</SL>
          <div style={{ display: 'grid', gridTemplateColumns: grid3, gap: 10 }}>
            <StatCard label="Từ vựng" value={stats.totalWords.toLocaleString()} icon={IconBook} color="#3B82F6" href="/admin/words" />
            <StatCard label="Topics" value={stats.totalTopics.toLocaleString()} icon={IconBook} color="#EC4899" href="/admin/topics" />
            <StatCard label="Bài ngữ pháp" value={stats.totalGrammarLessons.toLocaleString()} icon={IconBook} color="#8B5CF6" href="/admin/grammar" />
          </div>

          {/* ── Quick links ───────────────────────────────────── */}
          <SL>Truy cập nhanh</SL>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { href: '/admin/users', label: '👥 Người dùng' },
              { href: '/admin/subscriptions', label: '⭐ Đăng ký' },
              { href: '/admin/words/new', label: '➕ Thêm từ' },
              { href: '/admin/topics', label: '🗂️ Topics' },
              { href: '/admin/grammar', label: '📖 Ngữ pháp' },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text-secondary)', textDecoration: 'none',
                }}>
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
