'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettingsStore, BACKEND_SETTINGS_KEYS } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateSettings } from '@/hooks/useUser';
import type { UpdateSettingsPayload } from '@/lib/api/users';
import { IconSettings } from '@/components/ui/Icons';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

// Inline Icons
function IconPalette({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" />
    </svg>
  );
}
function IconVolume2({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
function IconGraduationCap({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
function IconUser({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconSun({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}
function IconMoon({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
function IconMonitor({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}>
      <rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}
function IconCheck({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconLogOut({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
function IconBell({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

const TABS = [
  { id: 'display' as const, label: 'Hiển thị', icon: IconPalette, color: ACCENT.vocab },
  { id: 'sound' as const, label: 'Âm thanh', icon: IconVolume2, color: ACCENT.srs },
  { id: 'learning' as const, label: 'Học tập', icon: IconGraduationCap, color: STATUS.success },
  { id: 'notification' as const, label: 'Thông báo', icon: IconBell, color: ACCENT.xp },
  { id: 'account' as const, label: 'Tài khoản', icon: IconUser, color: 'var(--theme-text-muted)' },
];

const monoGradient = (color: string) => `linear-gradient(135deg, ${color}, ${color}cc)`;
const THEME_OPTIONS = [
  { value: 'light' as const, icon: IconSun, label: 'Sáng', color: ACCENT.xp },
  { value: 'dark' as const, icon: IconMoon, label: 'Tối', color: ACCENT.writing },
  { value: 'system' as const, icon: IconMonitor, label: 'Hệ thống', color: ACCENT.srs },
];

function SettingToggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b last:border-b-0"
      style={{ borderColor: 'var(--theme-border)' }}>
      <div className="flex-1 mr-4">
        <div className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{label}</div>
        <div className="text-[11px] mt-0.5 opacity-50 font-medium" style={{ color: 'var(--theme-text-muted)' }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${checked ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}`}
        style={{ backgroundColor: checked ? ACCENT.srs : 'var(--theme-bg-secondary)' }}>
        <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300"
          style={{ left: checked ? '1.625rem' : '0.25rem' }} />
      </button>
    </div>
  );
}

function SettingSlider({ label, value, min, max, step, unit, onChange, color = ACCENT.srs }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-4 border-b last:border-b-0" style={{ borderColor: 'var(--theme-border)' }}>
      <div className="flex justify-between mb-3">
        <span className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
        <span className="text-[11px] font-black px-2 py-0.5 rounded-lg"
          style={{ background: `${color}12`, color }}>{value} {unit}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1 rounded-full" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        <div className="absolute h-1 rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}44` }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="absolute w-full h-6 opacity-0 cursor-pointer z-10" />
        <div className="absolute w-4 h-4 rounded-full border-2 bg-white shadow-lg pointer-events-none transition-all duration-150"
          style={{ left: `calc(${pct}% - 8px)`, borderColor: color }} />
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, color, children }: {
  title: string; icon: React.FC<{ size?: number; style?: React.CSSProperties }>; color: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border overflow-hidden mb-6 shadow-sm"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, color }}>
          <Icon size={16} />
        </div>
        <h2 className="text-sm font-black uppercase tracking-widest opacity-60">{title}</h2>
      </div>
      <div className="px-5 pb-4">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { settings, isLoaded, updateSetting, resetSettings, loadSettings } = useSettingsStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const updateSettingsMutation = useUpdateSettings();

  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'display' | 'sound' | 'learning' | 'notification' | 'account'>('display');

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingBackendRef = useRef<UpdateSettingsPayload>({});
  const backendDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (backendDebounceRef.current) clearTimeout(backendDebounceRef.current);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => { toastTimerRef.current = null; setToast(''); }, 2000);
  }, []);

  const handleChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSetting(key, value);
    if (isAuthenticated && (BACKEND_SETTINGS_KEYS as readonly string[]).includes(key as string)) {
      pendingBackendRef.current = { ...pendingBackendRef.current, [key]: value } as UpdateSettingsPayload;
      if (backendDebounceRef.current) clearTimeout(backendDebounceRef.current);
      backendDebounceRef.current = setTimeout(() => {
        backendDebounceRef.current = null;
        updateSettingsMutation.mutate(pendingBackendRef.current);
        pendingBackendRef.current = {};
      }, 500);
    }
    showToast('Đã lưu!');
  };

  const handleTheme = (theme: 'light' | 'dark' | 'system') => {
    handleChange('theme', theme);
  };

  const handleReset = () => {
    if (confirm('Đặt lại toàn bộ cài đặt?')) { resetSettings(); showToast('Đã đặt lại!'); }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
    } finally {
      router.push('/');
    }
  };

  if (!isLoaded) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: GRADIENT.writing }}>
            <IconSettings size={24} className="text-white" />
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-primary)', backgroundImage: 'radial-gradient(circle at 50% -20%, var(--color-accent-brand)15, transparent 70%)' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden"
              style={{ background: GRADIENT.writing }}>
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <IconSettings size={28} className="text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-0.5">Cài đặt</h1>
              <p className="text-sm opacity-50 font-medium">Tùy chỉnh trải nghiệm của bạn</p>
            </div>
          </div>

          <div className="h-10 flex items-center">
            {toast && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white animate-bounce shadow-lg"
                style={{ background: GRADIENT.readingGreen }}>
                <IconCheck size={14} /> {toast}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 p-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl mb-10 overflow-x-auto"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
          {TABS.map(tab => {
            const Ic = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-theme-muted hover:text-theme-text'}`}>
                <Ic size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="animate-[slideUp_0.4s_ease-out_both]">
          {activeTab === 'display' && (
            <SectionCard title="Hiển thị" icon={IconPalette} color={ACCENT.vocab}>
              <div className="mb-6">
                <label className="block text-[11px] font-black uppercase tracking-widest opacity-40 mb-4 px-1">
                  Giao diện
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {THEME_OPTIONS.map(opt => {
                    const Ic = opt.icon;
                    const isActive = settings.theme === opt.value;
                    return (
                      <button key={opt.value} onClick={() => handleTheme(opt.value)}
                        className={`relative p-3.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] text-center ${isActive ? 'shadow-md' : 'bg-theme-bg-secondary/30'}`}
                        style={{
                          borderColor: isActive ? opt.color : 'var(--theme-border)',
                          backgroundColor: isActive ? `${opt.color}10` : 'transparent',
                        }}>
                        <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2.5 transition-colors"
                          style={{ background: isActive ? monoGradient(opt.color) : 'var(--theme-bg-secondary)', color: isActive ? 'white' : 'var(--theme-text-muted)' }}>
                          <Ic size={18} />
                        </div>
                        <div className="text-caption font-black tracking-tight" style={{ color: isActive ? opt.color : 'var(--theme-text-primary)' }}>
                          {opt.label}
                        </div>
                        {isActive && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
                            style={{ background: opt.color }}>
                            <IconCheck size={9} style={{ color: 'white' }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <SettingToggle
                label="Nghĩa tiếng Việt"
                desc="Hiển thị nghĩa tiếng Việt trong danh sách từ và ví dụ"
                checked={settings.showVietnamese}
                onChange={v => handleChange('showVietnamese', v)}
              />
              <SettingToggle
                label="Phiên âm IPA"
                desc="Hiển thị phiên âm IPA cho từ vựng"
                checked={settings.showPronunciation}
                onChange={v => handleChange('showPronunciation', v)}
              />
              <SettingToggle
                label="Câu ví dụ"
                desc="Hiển thị ví dụ sử dụng cho mỗi từ"
                checked={settings.showExamples}
                onChange={v => handleChange('showExamples', v)}
              />
            </SectionCard>
          )}

          {activeTab === 'sound' && (
            <SectionCard title="Âm thanh" icon={IconVolume2} color={ACCENT.srs}>
              <SettingToggle
                label="Hiệu ứng âm thanh"
                desc="Phát âm thanh khi trả lời đúng và hoàn thành bài"
                checked={settings.soundEnabled}
                onChange={v => handleChange('soundEnabled', v)}
              />
              <SettingToggle
                label="Tự động phát âm"
                desc="Tự động phát phiên âm khi hiển thị từ"
                checked={settings.autoPlaySound}
                onChange={v => handleChange('autoPlaySound', v)}
              />

              <div className="py-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="flex justify-between mb-3">
                  <span className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                    Tốc độ đọc
                  </span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-lg"
                    style={{ background: 'rgba(59,130,246,.1)', color: ACCENT.srs }}>
                    {settings.speechRate}x
                  </span>
                </div>
                {(() => {
                  const pct = ((settings.speechRate - 0.5) / 1) * 100;
                  return (
                    <div className="relative h-6 flex items-center px-1">
                      <div className="absolute left-1 right-1 h-1 rounded-full" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
                      <div className="absolute h-1 rounded-full transition-all duration-300" style={{ left: 4, width: `calc(${pct}% - 8px)`, backgroundColor: ACCENT.srs, boxShadow: '0 0 10px rgba(59,130,246,0.3)' }} />
                      <input type="range" min="0.5" max="1.5" step="0.1"
                        value={settings.speechRate}
                        onChange={e => handleChange('speechRate', parseFloat(e.target.value))}
                        className="absolute w-full h-6 opacity-0 cursor-pointer z-10" />
                      <div className="absolute w-4 h-4 rounded-full border-2 bg-white shadow-lg pointer-events-none transition-all duration-150"
                        style={{ left: `calc(${pct}% - 8px)`, borderColor: ACCENT.srs }} />
                    </div>
                  );
                })()}
                <div className="flex justify-between text-[10px] font-bold opacity-40 uppercase tracking-widest mt-3">
                  <span>Chậm</span>
                  <span>Bình thường</span>
                  <span>Nhanh</span>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'learning' && (
            <SectionCard title="Học tập" icon={IconGraduationCap} color={ACCENT.reading}>
              <SettingSlider
                label="Mục tiêu hàng ngày"
                value={settings.dailyGoal} min={5} max={100} step={5} unit="từ"
                onChange={v => handleChange('dailyGoal', v)} color={ACCENT.reading}
              />

              <div className="py-5 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                <label className="block text-[11px] font-black uppercase tracking-widest opacity-40 mb-3 px-1">
                  Trình độ ưu tiên
                </label>
                <div className="relative">
                  <select value={settings.preferredLevel}
                    onChange={e => handleChange('preferredLevel', e.target.value as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'all')}
                    className="w-full px-4 py-3 rounded-2xl border text-sm font-bold appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', '--tw-ring-color': STATUS.success } as React.CSSProperties}>
                    <option value="all">Tất cả trình độ</option>
                    <option value="A1">A1 - Sơ cấp</option>
                    <option value="A2">A2 - Cơ bản</option>
                    <option value="B1">B1 - Trung cấp</option>
                    <option value="B2">B2 - Trung cấp cao</option>
                    <option value="C1">C1 - Nâng cao</option>
                    <option value="C2">C2 - Thành thạo</option>
                  </select>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'notification' && (
            <SectionCard title="Thông báo" icon={IconBell} color={ACCENT.xp}>
              <SettingToggle
                label="Nhắc nhở hàng ngày"
                desc="Email nhắc nhở lúc 19:00 nếu chưa đạt mục tiêu trong ngày"
                checked={settings.dailyReminder}
                onChange={v => handleChange('dailyReminder', v)}
              />
              <SettingToggle
                label="Báo cáo hàng tuần"
                desc="Tổng kết tiến độ học tập vào tối Chủ Nhật hàng tuần"
                checked={settings.weeklyEmailEnabled}
                onChange={v => handleChange('weeklyEmailEnabled', v)}
              />
            </SectionCard>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <SectionCard title="Tài khoản" icon={IconUser} color={'var(--theme-text-muted)'}>
                {isAuthenticated ? (
                  <div className="space-y-6 py-2">
                    {/* User Profile Card */}
                    <div className="flex items-center gap-5 p-6 rounded-4xl border border-theme-border bg-theme-bg-secondary/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl relative z-10"
                        style={{ background: GRADIENT.writing }}>
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1 relative z-10">
                        <div className="text-xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{user?.name || 'Người dùng'}</div>
                        <div className="text-sm opacity-40 font-medium" style={{ color: 'var(--theme-text-muted)' }}>{user?.email}</div>
                      </div>
                    </div>

                    {/* Subscription Status Card */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-2">Gói dịch vụ hiện tại</div>
                      <div className="relative p-6 rounded-[2.5rem] border border-theme-border overflow-hidden transition-all hover:shadow-xl group"
                        style={{ backgroundColor: 'var(--theme-bg-secondary)/30' }}>
                        
                        {/* Dynamic Background for Premium */}
                        {user?.subscription?.plan !== 'free' && (
                          <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 blur-[80px] animate-pulse" />
                        )}

                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl shadow-inner border border-white/5"
                              style={{ 
                                backgroundColor: user?.subscription?.plan === 'free' ? 'var(--theme-bg-body)' : 'rgba(245,158,11,0.1)',
                                color: user?.subscription?.plan === 'free' ? 'var(--theme-text-muted)' : ACCENT.xp
                              }}>
                              {user?.subscription?.plan === 'free' ? '🌱' : '👑'}
                            </div>
                            <div className="space-y-1">
                              <div className="text-lg font-black tracking-tight flex items-center gap-2">
                                {user?.subscription?.plan === 'free' ? 'Gói Miễn phí' : user?.subscription?.plan === 'premium' ? 'Gói Premium' : 'Gói Vĩnh viễn'}
                                {user?.subscription?.plan !== 'free' && (
                                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-amber-500 text-white shadow-lg">PRO</span>
                                )}
                              </div>
                              <p className="text-[11px] opacity-40 font-bold uppercase tracking-wider">
                                {user?.subscription?.expiresAt 
                                  ? `Hết hạn: ${new Date(user.subscription.expiresAt).toLocaleDateString('vi-VN')}` 
                                  : user?.subscription?.plan === 'free' ? 'Tính năng cơ bản' : 'Quyền lợi trọn đời'}
                              </p>
                            </div>
                          </div>
                          
                          <Link href="/profile/subscription" 
                            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 text-white shadow-xl shadow-indigo-500/20 text-center"
                            style={{ background: user?.subscription?.plan === 'free' ? GRADIENT.brand : GRADIENT.xpGold }}>
                            {user?.subscription?.plan === 'free' ? 'Nâng cấp ngay' : 'Quản lý gói'}
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <div className="pt-4">
                      <button onClick={handleLogout} 
                        className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 font-black text-xs uppercase tracking-[0.2em] group">
                        <IconLogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Đăng xuất tài khoản
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 opacity-20 border border-white/10">
                        <IconUser size={32} />
                     </div>
                     <p className="text-sm font-black uppercase tracking-widest opacity-30">Vui lòng đăng nhập</p>
                     <Link href="/login" className="inline-block mt-6 px-8 py-3 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest">Đăng nhập</Link>
                  </div>
                )}
              </SectionCard>
              
              {isAuthenticated && (
                <div className="px-4">
                   <p className="text-[10px] leading-relaxed opacity-30 font-bold text-center uppercase tracking-widest">
                    Hỗ trợ kỹ thuật: <a href="mailto:support@deutschmeister.de" className="text-indigo-500 hover:underline">support@deutschmeister.de</a>
                   </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 px-2">
          <button onClick={handleReset} className="text-[11px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
            Đặt lại mặc định
          </button>
          <Link href="/" className="text-[11px] font-black uppercase tracking-widest text-blue-500">
            Về trang chủ
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}