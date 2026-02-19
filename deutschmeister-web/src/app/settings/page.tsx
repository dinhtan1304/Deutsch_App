'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettingsStore, applyTheme } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { IconSettings, IconChevronLeft } from '@/components/ui/Icons';

// ─── Inline SVG Icons ───
function IconPalette({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" />
    </svg>
  );
}
function IconVolume2({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
function IconGraduationCap({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
function IconUser({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconSun({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}
function IconMoon({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
function IconMonitor({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}
function IconCheck({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconRefresh({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}
function IconLogOut({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
function IconAlertTriangle({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}

// ─── Tab config ───
const TABS = [
  { id: 'display' as const, label: 'Hiển thị', icon: IconPalette, color: '#8B5CF6' },
  { id: 'sound' as const, label: 'Âm thanh', icon: IconVolume2, color: '#3B82F6' },
  { id: 'learning' as const, label: 'Học tập', icon: IconGraduationCap, color: '#22C55E' },
  { id: 'account' as const, label: 'Tài khoản', icon: IconUser, color: '#F59E0B' },
];

// ─── Theme options ───
const THEME_OPTIONS = [
  { value: 'light' as const, icon: IconSun, label: 'Sáng', color: '#F59E0B' },
  { value: 'dark' as const, icon: IconMoon, label: 'Tối', color: '#6366F1' },
  { value: 'system' as const, icon: IconMonitor, label: 'Hệ thống', color: '#3B82F6' },
];

// ============================================
// Toggle Component
// ============================================
function SettingToggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0"
      style={{ borderColor: 'var(--theme-border)' }}>
      <div className="flex-1 mr-4">
        <div className="text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{label}</div>
        <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!checked)}
        className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0"
        style={{ backgroundColor: checked ? '#3B82F6' : 'var(--theme-bg-secondary)' }}>
        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300"
          style={{ left: checked ? '1.625rem' : '0.125rem' }} />
      </button>
    </div>
  );
}

// ============================================
// Slider Component
// ============================================
function SettingSlider({ label, value, min, max, step, unit, onChange, color = '#3B82F6' }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-4 border-b last:border-b-0" style={{ borderColor: 'var(--theme-border)' }}>
      <div className="flex justify-between mb-3">
        <span className="text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
        <span className="text-[14px] font-bold px-2 py-0.5 rounded-md"
          style={{ background: `${color}12`, color }}>{value} {unit}</span>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        {/* Track fill */}
        <div className="absolute h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        {/* Input */}
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="absolute w-full h-6 opacity-0 cursor-pointer z-10" />
        {/* Thumb */}
        <div className="absolute w-4 h-4 rounded-full border-2 bg-white shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)`, borderColor: color }} />
      </div>
    </div>
  );
}

// ============================================
// Section Card
// ============================================
function SectionCard({ title, icon: Icon, color, children }: {
  title: string; icon: React.FC<{ size?: number; style?: React.CSSProperties }>; color: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden mb-6"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      {/* Section header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          <Icon size={16} style={{ color: 'white' }} />
        </div>
        <h2 className="text-[16px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{title}</h2>
      </div>
      <div className="px-5 pb-5">
        {children}
      </div>
    </div>
  );
}

// ============================================
// Main Settings Page
// ============================================
export default function SettingsPage() {
  const router = useRouter();
  const { settings, isLoaded, updateSetting, resetSettings, loadSettings } = useSettingsStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'display' | 'sound' | 'learning' | 'account'>('display');

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const handleChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSetting(key, value);
    showToast('Đã lưu!');
  };

  const handleTheme = (theme: 'light' | 'dark' | 'system') => {
    updateSetting('theme', theme);
    showToast(`Theme: ${theme}`);
  };

  const handleReset = () => {
    if (confirm('Đặt lại tất cả cài đặt về mặc định?')) { resetSettings(); showToast('Đã đặt lại!'); }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      router.push('/');
    }
  };

  if (!isLoaded) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <IconSettings size={28} className="text-white" />
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-3xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <IconSettings size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Cài đặt</h1>
              <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>Tuỳ chỉnh trải nghiệm học tập</p>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white animate-pulse"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
              <IconCheck size={14} /> {toast}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const Ic = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5"
                style={isActive
                  ? { background: `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)`, color: 'white', boxShadow: `0 4px 12px ${tab.color}30` }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                <Ic size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── Display Tab ─── */}
        {activeTab === 'display' && (
          <SectionCard title="Cài đặt hiển thị" icon={IconPalette} color="#8B5CF6">
            {/* Theme picker */}
            <div className="mb-4">
              <label className="block text-[13px] font-medium mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                Giao diện (Theme)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {THEME_OPTIONS.map(opt => {
                  const Ic = opt.icon;
                  const isActive = settings.theme === opt.value;
                  return (
                    <button key={opt.value} onClick={() => handleTheme(opt.value)}
                      className="relative p-4 rounded-xl border-2 transition-all duration-200 hover:-translate-y-0.5 text-center"
                      style={{
                        borderColor: isActive ? opt.color : 'var(--theme-border)',
                        backgroundColor: isActive ? `${opt.color}08` : 'transparent',
                        boxShadow: isActive ? `0 4px 12px ${opt.color}18` : 'none',
                      }}>
                      <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2"
                        style={{ background: isActive ? `linear-gradient(135deg, ${opt.color}, ${opt.color}cc)` : 'var(--theme-bg-secondary)' }}>
                        <Ic size={20} style={{ color: isActive ? 'white' : 'var(--theme-text-muted)' }} />
                      </div>
                      <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                        {opt.label}
                      </div>
                      {isActive && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: opt.color }}>
                          <IconCheck size={11} style={{ color: 'white' }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <SettingToggle
              label="Hiển thị tiếng Việt"
              desc="Hiện bản dịch tiếng Việt cho mỗi từ"
              checked={settings.showVietnamese}
              onChange={v => handleChange('showVietnamese', v)}
            />
            <SettingToggle
              label="Hiển thị phiên âm"
              desc="Hiện phiên âm IPA cho mỗi từ"
              checked={settings.showPronunciation}
              onChange={v => handleChange('showPronunciation', v)}
            />
            <SettingToggle
              label="Hiển thị ví dụ"
              desc="Hiện câu ví dụ cho mỗi từ"
              checked={settings.showExamples}
              onChange={v => handleChange('showExamples', v)}
            />
          </SectionCard>
        )}

        {/* ─── Sound Tab ─── */}
        {activeTab === 'sound' && (
          <SectionCard title="Cài đặt âm thanh" icon={IconVolume2} color="#3B82F6">
            <SettingToggle
              label="Bật âm thanh"
              desc="Phát âm thanh khi trả lời đúng/sai"
              checked={settings.soundEnabled}
              onChange={v => handleChange('soundEnabled', v)}
            />
            <SettingToggle
              label="Tự động phát âm"
              desc="Tự động đọc từ khi hiển thị"
              checked={settings.autoPlaySound}
              onChange={v => handleChange('autoPlaySound', v)}
            />

            {/* Speech rate slider */}
            <div className="py-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex justify-between mb-3">
                <span className="text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  Tốc độ phát âm
                </span>
                <span className="text-[14px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(59,130,246,.1)', color: '#3B82F6' }}>
                  {settings.speechRate}x
                </span>
              </div>
              {(() => {
                const pct = ((settings.speechRate - 0.5) / 1) * 100;
                return (
                  <div className="relative h-6 flex items-center">
                    <div className="absolute w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
                    <div className="absolute h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#3B82F6' }} />
                    <input type="range" min="0.5" max="1.5" step="0.1"
                      value={settings.speechRate}
                      onChange={e => handleChange('speechRate', parseFloat(e.target.value))}
                      className="absolute w-full h-6 opacity-0 cursor-pointer z-10" />
                    <div className="absolute w-4 h-4 rounded-full border-2 bg-white shadow-md pointer-events-none"
                      style={{ left: `calc(${pct}% - 8px)`, borderColor: '#3B82F6' }} />
                  </div>
                );
              })()}
              <div className="flex justify-between text-[11px] mt-2" style={{ color: 'var(--theme-text-muted)' }}>
                <span>Chậm (0.5x)</span>
                <span>Bình thường</span>
                <span>Nhanh (1.5x)</span>
              </div>
            </div>

            {/* Test button */}
            <button
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  const u = new SpeechSynthesisUtterance('der Apfel');
                  u.lang = 'de-DE';
                  u.rate = settings.speechRate;
                  window.speechSynthesis.speak(u);
                }
              }}
              className="w-full mt-4 px-4 py-3 rounded-xl font-semibold text-[14px] transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center gap-2"
              style={{ background: 'rgba(59,130,246,.08)', color: '#3B82F6', border: '1px solid rgba(59,130,246,.15)' }}>
              <IconVolume2 size={18} /> Thử phát âm "der Apfel"
            </button>
          </SectionCard>
        )}

        {/* ─── Learning Tab ─── */}
        {activeTab === 'learning' && (
          <SectionCard title="Cài đặt học tập" icon={IconGraduationCap} color="#22C55E">
            <SettingSlider
              label="Mục tiêu hàng ngày"
              value={settings.dailyGoal} min={5} max={100} step={5} unit="từ"
              onChange={v => handleChange('dailyGoal', v)} color="#22C55E"
            />

            {/* Level select */}
            <div className="py-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <label className="block text-[14px] font-semibold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                Cấp độ ưu tiên
              </label>
              <div className="relative">
                <select value={settings.preferredLevel}
                  onChange={e => handleChange('preferredLevel', e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border text-[14px] font-medium appearance-none cursor-pointer
                    focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                    '--tw-ring-color': '#22C55E',
                  } as React.CSSProperties}>
                  <option value="all">Tất cả cấp độ</option>
                  <option value="A1">A1 - Sơ cấp</option>
                  <option value="A2">A2 - Sơ cấp cao</option>
                  <option value="B1">B1 - Trung cấp</option>
                  <option value="B2">B2 - Trung cấp cao</option>
                  <option value="C1">C1 - Cao cấp</option>
                  <option value="C2">C2 - Thành thạo</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--theme-text-muted)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            <SettingSlider
              label="Số câu hỏi mỗi game"
              value={settings.questionsPerGame} min={5} max={50} step={5} unit="câu"
              onChange={v => handleChange('questionsPerGame', v)} color="#3B82F6"
            />
            <SettingSlider
              label="Thời gian Timed Challenge"
              value={settings.timedChallengeSeconds} min={30} max={180} step={15} unit="giây"
              onChange={v => handleChange('timedChallengeSeconds', v)} color="#F59E0B"
            />
          </SectionCard>
        )}

        {/* ─── Account Tab ─── */}
        {activeTab === 'account' && (
          <SectionCard title="Tài khoản" icon={IconUser} color="#F59E0B">
            {isAuthenticated ? (
              <>
                {/* Profile card */}
                <div className="flex items-center gap-4 p-4 rounded-xl mb-6"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-[16px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                      {user?.name || 'Chưa đặt tên'}
                    </div>
                    <div className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>{user?.email}</div>
                  </div>
                </div>

                {/* Danger zone */}
                <div className="pt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <IconAlertTriangle size={16} style={{ color: '#EF4444' }} />
                    <span className="text-[14px] font-semibold" style={{ color: '#EF4444' }}>Vùng nguy hiểm</span>
                  </div>
                  <button onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-[14px]
                      text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                    <IconLogOut size={16} /> Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.12), rgba(99,102,241,.08))' }}>
                  <IconUser size={28} style={{ color: '#3B82F6' }} />
                </div>
                <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                  Chưa đăng nhập
                </h3>
                <p className="text-[13px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                  Đăng nhập để đồng bộ tiến độ học tập
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/auth/login"
                    className="px-6 py-2.5 rounded-xl font-semibold text-[14px] text-white
                      transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
                    Đăng nhập
                  </Link>
                  <Link href="/auth/register"
                    className="px-6 py-2.5 rounded-xl font-semibold text-[14px] border-2
                      transition-all duration-200 hover:-translate-y-0.5"
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                    Đăng ký
                  </Link>
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {/* Reset + Back */}
        <div className="flex items-center justify-between mt-2">
          <button onClick={handleReset}
            className="flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconRefresh size={14} /> Đặt lại về mặc định
          </button>
          <Link href="/"
            className="flex items-center gap-1 text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: '#3B82F6' }}>
            <IconChevronLeft size={14} /> Trang chủ
          </Link>
        </div>
      </div>
  );
}