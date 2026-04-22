'use client';

import { useState } from 'react';
import { useAdminTokenStats } from '@/hooks/useAdmin';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconZap({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}
function IconTrendUp({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
}
function IconUsers({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── Feature color map ───────────────────────────────────────────────────────
const FEATURE_COLORS: Record<string, { color: string; gradient: string; label: string }> = {
  writing:       { color: '#6366F1', gradient: 'linear-gradient(90deg,#6366F1,#8B5CF6)', label: 'Luyện Viết' },
  reading:       { color: '#22C55E', gradient: 'linear-gradient(90deg,#22C55E,#14B8A6)', label: 'Luyện Đọc' },
  listening:     { color: '#EC4899', gradient: 'linear-gradient(90deg,#EC4899,#A855F7)', label: 'Luyện Nghe' },
  freeSpeaking:  { color: '#F59E0B', gradient: 'linear-gradient(90deg,#F59E0B,#EF4444)', label: 'Luyện Nói' },
  examReading:   { color: '#0EA5E9', gradient: 'linear-gradient(90deg,#22C55E,#0EA5E9)', label: 'Thi Đọc' },
  examListening: { color: '#A855F7', gradient: 'linear-gradient(90deg,#EC4899,#A855F7)', label: 'Thi Nghe' },
  examWriting:   { color: '#818CF8', gradient: 'linear-gradient(90deg,#A855F7,#6366F1)', label: 'Thi Viết' },
  examSpeaking:  { color: '#FB923C', gradient: 'linear-gradient(90deg,#F59E0B,#EF4444)', label: 'Thi Nói' },
  roleplay:      { color: '#14B8A6', gradient: 'linear-gradient(90deg,#14B8A6,#22C55E)', label: 'Roleplay' },
  pronunciation: { color: '#F472B6', gradient: 'linear-gradient(90deg,#F472B6,#EC4899)', label: 'Phát âm' },
  grammar:       { color: '#8B5CF6', gradient: 'linear-gradient(90deg,#8B5CF6,#6366F1)', label: 'Ngữ pháp' },
  words:         { color: '#3B82F6', gradient: 'linear-gradient(90deg,#3B82F6,#0EA5E9)', label: 'Từ vựng' },
};

function featureMeta(key: string) {
  return FEATURE_COLORS[key] ?? { color: '#64748B', gradient: 'linear-gradient(90deg,#64748B,#94A3B8)', label: key };
}

// ─── Section label ───────────────────────────────────────────────────────────
function SL({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: '#475569',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      marginBottom: 10, marginTop: 28,
    }}>
      {children}
    </p>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ size?: number }>; color: string; accent?: boolean;
}) {
  return (
    <div style={{
      backgroundColor: accent ? `${color}10` : '#1E293B',
      borderRadius: 12,
      border: `1px solid ${accent ? `${color}28` : '#334155'}`,
      padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ color }}><Icon size={18} /></span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Daily chart (simple bar) ────────────────────────────────────────────────
function DailyChart({ daily }: { daily: { day: string; tokens: number; calls: number }[] }) {
  if (!daily.length) return <p style={{ color: '#475569', fontSize: 12 }}>Chưa có dữ liệu</p>;

  const maxTokens = Math.max(...daily.map(d => d.tokens), 1);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140, minWidth: daily.length * 22 }}>
        {daily.map((d) => {
          const h = Math.max(Math.round((d.tokens / maxTokens) * 120), 2);
          const dateStr = new Date(d.day).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
          return (
            <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 18 }}
              title={`${dateStr}: ${d.tokens.toLocaleString()} tokens, ${d.calls} calls`}>
              <div style={{
                width: '100%', maxWidth: 16, height: h, borderRadius: 3,
                background: 'linear-gradient(180deg, #6366F1, #818CF8)',
              }} />
              <span style={{ fontSize: 8, color: '#475569', marginTop: 3, whiteSpace: 'nowrap' }}>{dateStr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminTokenUsagePage() {
  const { data, isLoading } = useAdminTokenStats();
  const [featureSort, setFeatureSort] = useState<'tokens' | 'calls'>('tokens');

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', marginBottom: 2 }}>Token Usage — Gemini AI</h1>
        <p style={{ fontSize: 12, color: '#64748B' }}>Theo dõi lượng token đã sử dụng cho các tính năng AI</p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <span style={{ color: '#6366F1' }}><IconLoader size={28} /></span>
        </div>
      ) : !data ? (
        <p style={{ color: '#64748B' }}>Không tải được dữ liệu.</p>
      ) : (
        <>
          {/* ── Grand totals ──────────────────────────────────── */}
          <SL>Tổng quan</SL>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            <StatCard
              label="Tổng tokens (all-time)"
              value={fmtNum(data.totals.allTime.totalTokens)}
              sub={`${data.totals.allTime.calls.toLocaleString()} lần gọi`}
              icon={IconZap} color="#6366F1" accent
            />
            <StatCard
              label="Hôm nay"
              value={fmtNum(data.totals.today.totalTokens)}
              sub={`${data.totals.today.calls.toLocaleString()} lần gọi`}
              icon={IconTrendUp} color="#22C55E"
            />
            <StatCard
              label="7 ngày gần nhất"
              value={fmtNum(data.totals.week.totalTokens)}
              sub={`${data.totals.week.calls.toLocaleString()} lần gọi`}
              icon={IconTrendUp} color="#3B82F6"
            />
            <StatCard
              label="30 ngày gần nhất"
              value={fmtNum(data.totals.month.totalTokens)}
              sub={`${data.totals.month.calls.toLocaleString()} lần gọi`}
              icon={IconTrendUp} color="#8B5CF6"
            />
          </div>

          {/* ── Prompt vs Candidates breakdown ────────────────── */}
          <div style={{
            marginTop: 12,
            backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155',
            padding: '14px 18px', display: 'flex', gap: 24, flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prompt Tokens</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>{fmtNum(data.totals.allTime.promptTokens)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output Tokens</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>{fmtNum(data.totals.allTime.candidatesTokens)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>{fmtNum(data.totals.allTime.totalTokens)}</p>
            </div>
          </div>

          {/* ── By Feature ────────────────────────────────────── */}
          <SL>Theo tính năng</SL>
          <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Sắp xếp theo</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {([['tokens', 'Tokens'], ['calls', 'Lần gọi']] as ['tokens' | 'calls', string][]).map(([k, l]) => (
                  <button key={k} onClick={() => setFeatureSort(k)}
                    style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      border: featureSort === k ? '1px solid #6366F1' : '1px solid #334155',
                      backgroundColor: featureSort === k ? 'rgba(99,102,241,.15)' : 'transparent',
                      color: featureSort === k ? '#818CF8' : '#64748B',
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const sorted = [...data.byFeature].sort((a, b) =>
                featureSort === 'tokens' ? b.totalTokens - a.totalTokens : b.calls - a.calls,
              );
              const maxVal = Math.max(...sorted.map(f => featureSort === 'tokens' ? f.totalTokens : f.calls), 1);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sorted.map((f) => {
                    const meta = featureMeta(f.feature);
                    const val = featureSort === 'tokens' ? f.totalTokens : f.calls;
                    return (
                      <div key={f.feature} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 80px', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{meta.label}</span>
                        <div style={{ height: 7, borderRadius: 4, backgroundColor: '#0F172A', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${val > 0 ? Math.max(Math.round((val / maxVal) * 100), 2) : 0}%`,
                            background: meta.gradient,
                            borderRadius: 4,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9', textAlign: 'right' }}>
                          {fmtNum(f.totalTokens)}
                        </p>
                        <p style={{ fontSize: 11, color: '#64748B', textAlign: 'right' }}>
                          {f.calls.toLocaleString()} calls
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* ── Daily chart ───────────────────────────────────── */}
          <SL>Biểu đồ 30 ngày gần nhất</SL>
          <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: '20px 22px' }}>
            <DailyChart daily={data.daily} />
          </div>

          {/* ── Top users ─────────────────────────────────────── */}
          <SL>Top người dùng sử dụng nhiều nhất</SL>
          <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left' }}>Người dùng</th>
                  <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'right' }}>Lần gọi</th>
                  <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'right' }}>Tokens</th>
                </tr>
              </thead>
              <tbody>
                {data.topUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px 16px', fontSize: 12, color: '#475569', textAlign: 'center' }}>
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.topUsers.map((u, i) => (
                    <tr key={u.userId} style={{ borderBottom: i < data.topUsers.length - 1 ? '1px solid #1E293B' : 'none' }}>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#475569', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <p style={{ fontSize: 13, color: '#F1F5F9', fontWeight: 500 }}>{u.name || '(no name)'}</p>
                        <p style={{ fontSize: 11, color: '#64748B' }}>{u.email || u.userId}</p>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#94A3B8', textAlign: 'right', fontWeight: 600 }}>
                        {u.calls.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#F1F5F9', textAlign: 'right', fontWeight: 700 }}>
                        {fmtNum(u.totalTokens)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
