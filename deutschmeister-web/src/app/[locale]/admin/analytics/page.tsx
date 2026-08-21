'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAdminAnalytics } from '@/hooks/useAdmin';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ACCENT, STATUS, RADIUS } from '@/lib/tokens';
import type { CohortRow, FeatureUsage, DailyActivity } from '@/lib/api/admin';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconPulse({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
}
function IconUsers({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function IconCalendar({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function IconBell({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}
function IconMoon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
}
function IconArrowLeft({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}

// Vietnamese labels for the ACTIVITY_SOURCES keys the API returns.
const FEATURE_LABELS: Record<string, string> = {
  srs: 'Flashcard / SRS',
  games: 'Game từ vựng',
  topics: 'Học chủ đề',
  grammar: 'Bài ngữ pháp',
  grammarSrs: 'Ngữ pháp SRS',
  grammarTrainer: 'Grammar Trainer',
  arena: 'Vocabulary Arena',
  dictation: 'Chép chính tả',
  typing: 'Luyện gõ',
  shadowing: 'Shadowing',
  pronunciation: 'Phát âm',
  writing: 'Luyện Viết',
  reading: 'Luyện Đọc',
  listening: 'Luyện Nghe',
  freeSpeaking: 'Luyện Nói',
  roleplay: 'Roleplay',
  examReading: 'Thi Đọc',
  examWriting: 'Thi Viết',
  examListening: 'Thi Nghe',
  examSpeaking: 'Thi Nói',
  mockExam: 'Thi thử tổng hợp',
};

// The eight tables the old dashboard counted as "sessions". Flagged in the
// table so it is obvious at a glance how much of real usage they missed.
const OLD_SESSION_KEYS = new Set([
  'writing', 'reading', 'listening',
  'examReading', 'examWriting', 'examListening', 'examSpeaking', 'freeSpeaking',
]);

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

// ─── Small building blocks ────────────────────────────────────────────────────
function SL({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
      color: 'var(--theme-text-muted)', margin: '26px 0 10px',
    }}>{children}</p>
  );
}

function Panel({ children, padding = '20px 22px' }: { children: React.ReactNode; padding?: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--theme-bg-card)',
      borderRadius: RADIUS.md,
      border: '1px solid var(--theme-border)',
      padding,
    }}>{children}</div>
  );
}

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ size?: number }>; color: string;
}) {
  return (
    <div style={{
      backgroundColor: 'var(--theme-bg-card)',
      borderRadius: RADIUS.md,
      border: '1px solid var(--theme-border)',
      padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 12, height: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, backgroundColor: `${color}18`,
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
}

// ─── Daily activity ───────────────────────────────────────────────────────────
/**
 * Bars rather than a line: with a handful of active users a day, a line implies
 * a continuity the data does not have. Days with no activity are drawn as empty
 * slots so a gap reads as a real zero rather than as missing data.
 */
function ActivityChart({ daily, days }: { daily: DailyActivity[]; days: number }) {
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const today = new Date();
  const slots: { date: string; activeUsers: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    slots.push({ date: key, activeUsers: byDate.get(key)?.activeUsers ?? 0 });
  }
  const peak = Math.max(1, ...slots.map((s) => s.activeUsers));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
        {slots.map((s) => (
          <div
            key={s.date}
            title={`${s.date}: ${s.activeUsers} người`}
            style={{
              flex: 1,
              height: `${Math.max(2, (s.activeUsers / peak) * 100)}%`,
              backgroundColor: s.activeUsers > 0 ? ACCENT.brand : 'var(--theme-border)',
              borderRadius: '3px 3px 0 0',
              minWidth: 3,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--theme-text-muted)' }}>{slots[0]?.date}</span>
        <span style={{ fontSize: 10, color: 'var(--theme-text-muted)' }}>Đỉnh: {peak} người/ngày</span>
        <span style={{ fontSize: 10, color: 'var(--theme-text-muted)' }}>{slots[slots.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ─── Cohort table ─────────────────────────────────────────────────────────────
const COHORT_COLUMNS: { key: keyof CohortRow; label: string; minAge: number }[] = [
  { key: 'activated', label: 'Đã học', minAge: 0 },
  { key: 'd1', label: 'D1', minAge: 1 },
  { key: 'd3', label: 'D3', minAge: 3 },
  { key: 'd7', label: 'D7', minAge: 7 },
  { key: 'd14', label: 'D14', minAge: 14 },
  { key: 'd30', label: 'D30', minAge: 30 },
  { key: 'habitFormed', label: '3+ ngày/tuần 1', minAge: 7 },
];

/** Green at 40%+, amber in the middle, red below 15% — the thresholds that decide whether ads are worth running. */
function retentionColor(percent: number): string {
  if (percent >= 40) return STATUS.success;
  if (percent >= 15) return STATUS.warning;
  return STATUS.danger;
}

function CohortTable({ cohorts }: { cohorts: CohortRow[] }) {
  if (cohorts.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Chưa có user nào đăng ký trong khoảng thời gian này.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
        <thead>
          <tr>
            <th style={thStyle}>Tuần đăng ký</th>
            <th style={thStyle}>Số user</th>
            {COHORT_COLUMNS.map((c) => (
              <th key={c.key} style={thStyle}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((row) => (
            <tr key={row.weekStart}>
              <td style={tdStyle}>{row.weekStart}</td>
              <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--theme-text-primary)' }}>{row.size}</td>
              {COHORT_COLUMNS.map((c) => {
                // A cohort three days old cannot have a D30 number; showing 0%
                // there would read as catastrophic churn instead of "too early".
                if (row.ageDays < c.minAge) {
                  return <td key={c.key} style={{ ...tdStyle, color: 'var(--theme-border)' }}>—</td>;
                }
                const value = row[c.key] as number;
                const percent = pct(value, row.size);
                return (
                  <td key={c.key} style={{ ...tdStyle, color: retentionColor(percent), fontWeight: 600 }}>
                    {percent}%
                    <span style={{ color: 'var(--theme-text-muted)', fontWeight: 400 }}> ({value})</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600,
  color: 'var(--theme-text-muted)', borderBottom: '1px solid var(--theme-border)',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  textAlign: 'left', padding: '9px 10px', fontSize: 12,
  color: 'var(--theme-text-secondary)', borderBottom: '1px solid var(--theme-border)',
  whiteSpace: 'nowrap',
};

// ─── Funnel ───────────────────────────────────────────────────────────────────
function FunnelBar({ label, value, of, note }: { label: string; value: number; of: number; note?: string }) {
  const percent = pct(value, of);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--theme-text-primary)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>
          {value} · {percent}%
        </span>
      </div>
      <div style={{ height: 8, borderRadius: RADIUS.sm, backgroundColor: 'var(--theme-border)', overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', backgroundColor: retentionColor(percent) }} />
      </div>
      {note && <p style={{ fontSize: 10, color: 'var(--theme-text-muted)', marginTop: 4 }}>{note}</p>}
    </div>
  );
}

// ─── Feature usage ────────────────────────────────────────────────────────────
function FeatureTable({ features, isMobile }: { features: FeatureUsage[]; isMobile: boolean }) {
  if (features.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Chưa có hoạt động nào được ghi nhận.</p>;
  }
  const peak = Math.max(1, ...features.map((f) => f.week));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {features.map((f) => (
        <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: isMobile ? 108 : 150, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--theme-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {FEATURE_LABELS[f.key] ?? f.key}
            </span>
            {!OLD_SESSION_KEYS.has(f.key) && (
              <span
                title="Tính năng này không được đếm trong card 'Traffic' ở dashboard cũ"
                style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: RADIUS.sm,
                  backgroundColor: `${ACCENT.xp}22`, color: ACCENT.xp, flexShrink: 0,
                }}
              >MỚI ĐẾM</span>
            )}
          </div>
          <div style={{ flex: 1, height: 10, borderRadius: RADIUS.sm, backgroundColor: 'var(--theme-border)', overflow: 'hidden', minWidth: 40 }}>
            <div style={{ width: `${(f.week / peak) * 100}%`, height: '100%', backgroundColor: ACCENT.brand }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--theme-text-secondary)', width: 92, textAlign: 'right', flexShrink: 0 }}>
            {f.week} lượt · {f.users30d} user
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const isMobile = useIsMobile();
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useAdminAnalytics(days);

  const grid3 = isMobile ? '1fr' : 'repeat(3, 1fr)';
  const grid4 = isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)';

  return (
    <div style={{ padding: isMobile ? '16px 14px 40px' : '24px 28px 48px', maxWidth: 1180 }}>
      <Link
        href="/admin"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12,
          color: 'var(--theme-text-muted)', textDecoration: 'none', marginBottom: 12,
        }}
      >
        <IconArrowLeft /> Dashboard
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--theme-text-primary)', margin: 0 }}>
        Giữ chân &amp; kích hoạt
      </h1>
      <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginTop: 6, maxWidth: 720 }}>
        Card &quot;Traffic&quot; ở dashboard chỉ đếm 8 bảng luyện kỹ năng nặng — không tính flashcard, game, arena,
        chép chính tả hay ngữ pháp. Trang này đếm cả 22 nguồn hoạt động, theo giờ Việt Nam, đã loại tài khoản admin.
      </p>

      {isLoading && (
        <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginTop: 24 }}>Đang tính…</p>
      )}
      {error && (
        <p style={{ fontSize: 13, color: STATUS.danger, marginTop: 24 }}>
          Không tải được dữ liệu. Kiểm tra API đã chạy migration `last_active_at` chưa.
        </p>
      )}

      {data && (
        <>
          {/* ── Live activity ───────────────────────────────────── */}
          <SL>Người dùng hoạt động</SL>
          <div style={{ display: 'grid', gridTemplateColumns: grid3, gap: 10 }}>
            <StatCard label="DAU — hôm nay" value={data.activity.dau} icon={IconPulse} color={ACCENT.brand} />
            <StatCard label="WAU — 7 ngày" value={data.activity.wau} icon={IconUsers} color={ACCENT.srs} />
            <StatCard label={`MAU — ${data.windowDays} ngày`} value={data.activity.mau} icon={IconCalendar} color={ACCENT.vocab} />
          </div>

          <div style={{ marginTop: 10 }}>
            <Panel>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--theme-text-secondary)', fontWeight: 600 }}>Người hoạt động mỗi ngày</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[7, 30, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      style={{
                        padding: '3px 10px', borderRadius: RADIUS.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${days === d ? ACCENT.brand : 'var(--theme-border)'}`,
                        backgroundColor: days === d ? `${ACCENT.brand}26` : 'transparent',
                        color: days === d ? ACCENT.brand : 'var(--theme-text-muted)',
                      }}
                    >{d} ngày</button>
                  ))}
                </div>
              </div>
              <ActivityChart daily={data.activity.daily} days={data.windowDays} />
            </Panel>
          </div>

          {/* ── Cohorts ─────────────────────────────────────────── */}
          <SL>Giữ chân theo tuần đăng ký</SL>
          <Panel>
            <p style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
              Rolling retention: DN = tỉ lệ user có hoạt động cuối cùng cách ngày đăng ký ít nhất N ngày —
              &quot;còn quay lại ở ngày N&quot;, chứ không phải &quot;đúng ngày N có mở app&quot;. Ô &quot;—&quot; là cohort chưa đủ tuổi để biết.
              <br />
              Ngưỡng quyết định: <span style={{ color: STATUS.success, fontWeight: 600 }}>D7 ≥ 40%</span> là khoẻ,
              {' '}<span style={{ color: STATUS.warning, fontWeight: 600 }}>15–40%</span> là tạm,
              {' '}<span style={{ color: STATUS.danger, fontWeight: 600 }}>&lt; 15%</span> thì chạy ads là đổ tiền vào xô thủng.
            </p>
            <CohortTable cohorts={data.cohorts} />
          </Panel>

          {/* ── Activation funnel ───────────────────────────────── */}
          <SL>Phễu kích hoạt (user đăng ký trong 12 tuần gần nhất)</SL>
          <Panel>
            <FunnelBar label="Đăng ký" value={data.funnel.registered} of={data.funnel.registered} />
            <FunnelBar
              label="Đã xác thực email"
              value={data.funnel.emailVerified}
              of={data.funnel.registered}
              note="Chưa xác thực = không nhận được bất kỳ email/push nhắc học nào (scheduler lọc emailVerified)."
            />
            <FunnelBar label="Hoàn tất onboarding" value={data.funnel.onboardingCompleted} of={data.funnel.registered} />
            <FunnelBar
              label="Đã học ít nhất 1 lần"
              value={data.funnel.activated}
              of={data.funnel.registered}
              note="Bước quan trọng nhất: chênh lệch giữa dòng này và dòng Đăng ký là số user không bao giờ chạm tới sản phẩm."
            />
            <FunnelBar label="Quay lại ngày hôm sau trở đi" value={data.funnel.returnedNextDay} of={data.funnel.registered} />
            <FunnelBar
              label="Học 3+ ngày trong tuần đầu"
              value={data.funnel.habitFormed}
              of={data.funnel.registered}
              note="Tín hiệu hình thành thói quen — nhóm này mới là nhóm có khả năng trả phí."
            />
          </Panel>

          {/* ── Feature usage ───────────────────────────────────── */}
          <SL>Tính năng nào thật sự được dùng (7 ngày gần nhất)</SL>
          <Panel>
            <FeatureTable features={data.features} isMobile={isMobile} />
            <p style={{ fontSize: 10, color: 'var(--theme-text-muted)', marginTop: 14 }}>
              Nhãn <strong>MỚI ĐẾM</strong> = tính năng bị bỏ sót hoàn toàn trong card Traffic ở dashboard.
              Cột phải: số lượt trong 7 ngày · số user riêng biệt trong {data.windowDays} ngày.
            </p>
          </Panel>

          {/* ── Reminder reach ──────────────────────────────────── */}
          <SL>Nhắc học có tới được ai không</SL>
          <div style={{ display: 'grid', gridTemplateColumns: grid4, gap: 10 }}>
            <StatCard
              label="Thật sự nhận được nhắc"
              value={data.reminders.reachable}
              sub={`trên ${data.reminders.totalUsers} user`}
              icon={IconBell}
              color={ACCENT.brand}
            />
            <StatCard
              label="Bị chặn vì chưa verify email"
              value={data.reminders.blockedByEmailGate}
              sub="đã bật nhắc nhưng vẫn không nhận"
              icon={IconBell}
              color={STATUS.danger}
            />
            <StatCard
              label="Bật web push"
              value={data.reminders.webPushOn}
              sub={`${data.reminders.livePushSubscriptions} subscription còn sống`}
              icon={IconBell}
              color={ACCENT.vocab}
            />
            <StatCard
              label="Bật email nhắc hằng ngày"
              value={data.reminders.dailyReminderOn}
              sub="mặc định bật"
              icon={IconBell}
              color={ACCENT.srs}
            />
          </div>

          {/* ── Dormancy ────────────────────────────────────────── */}
          <SL>Phân khúc để win-back</SL>
          <div style={{ display: 'grid', gridTemplateColumns: grid4, gap: 10 }}>
            <StatCard label="Chưa từng học" value={data.dormancy.neverActive} sub="đăng ký rồi biến mất" icon={IconMoon} color={STATUS.danger} />
            <StatCard label="Còn hoạt động (7 ngày)" value={data.dormancy.active7d} icon={IconPulse} color={STATUS.success} />
            <StatCard label="Ngủ 7–30 ngày" value={data.dormancy.dormant7to30d} sub="cứu được" icon={IconMoon} color={STATUS.warning} />
            <StatCard label="Ngủ trên 30 ngày" value={data.dormancy.dormant30dPlus} icon={IconMoon} color={ACCENT.premium} />
          </div>

          <p style={{ fontSize: 10, color: 'var(--theme-text-muted)', marginTop: 24, textAlign: 'right' }}>
            Tính lúc {new Date(data.generatedAt).toLocaleString('vi-VN')} · cache 5 phút
          </p>
        </>
      )}
    </div>
  );
}
