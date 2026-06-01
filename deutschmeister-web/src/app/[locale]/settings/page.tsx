'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useFormatter } from 'next-intl';
import Link from 'next/link';
import { useSettingsStore, BACKEND_SETTINGS_KEYS, defaultSettings } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateSettings } from '@/hooks/useUser';
import type { UpdateSettingsPayload } from '@/lib/api/users';
import { IconSettings } from '@/components/ui/Icons';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

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

// Tab + theme metadata is structural only (id, icon). Labels are resolved
// per-locale at render. The v2 design uses one unified accent for every panel.
const TABS = [
  { id: 'display' as const, icon: IconPalette },
  { id: 'sound' as const, icon: IconVolume2 },
  { id: 'learning' as const, icon: IconGraduationCap },
  { id: 'notification' as const, icon: IconBell },
  { id: 'account' as const, icon: IconUser },
];

const THEME_OPTIONS = [
  { value: 'light' as const, icon: IconSun },
  { value: 'dark' as const, icon: IconMoon },
  { value: 'system' as const, icon: IconMonitor },
];
const LEVELS = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const BACKEND_SETTINGS_KEY_SET = new Set<string>(BACKEND_SETTINGS_KEYS as readonly string[]);

function isBackendSettingsKey(key: PropertyKey) {
  return typeof key === 'string' && BACKEND_SETTINGS_KEY_SET.has(key);
}

function pickBackendSettings(source: typeof defaultSettings): UpdateSettingsPayload {
  return BACKEND_SETTINGS_KEYS.reduce((payload, key) => {
    (payload as Record<string, unknown>)[key] = source[key];
    return payload;
  }, {} as UpdateSettingsPayload);
}

function SettingToggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-4 border-b last:border-b-0"
      style={{ borderColor: 'var(--theme-border)' }}>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{label}</div>
        <div className="mt-0.5 text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!checked)}
        className="relative h-6.5 w-11 shrink-0 rounded-full transition-colors duration-200"
        style={{ background: checked ? 'var(--accent)' : 'var(--theme-bg-tertiary)', boxShadow: checked ? '0 2px 8px color-mix(in srgb, var(--accent) 45%, transparent)' : 'none' }}>
        <span className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-md transition-[left] duration-200"
          style={{ left: checked ? 21 : 3 }} />
      </button>
    </div>
  );
}

function SettingSlider({ label, value, min, max, step, unit, onChange, labels }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void; labels?: string[];
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-4 border-b last:border-b-0" style={{ borderColor: 'var(--theme-border)' }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
        <span className="mono rounded-sm px-2.5 py-0.5 text-[12px] font-bold"
          style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>{value} {unit}</span>
      </div>
      <div className="relative flex h-4.5 items-center">
        <div className="absolute h-1.5 w-full rounded-full" style={{ background: 'var(--theme-bg-tertiary)' }} />
        <div className="absolute h-1.5 rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute z-10 h-4.5 w-full cursor-pointer opacity-0" />
        <div className="pointer-events-none absolute h-4.5 w-4.5 -translate-x-1/2 rounded-full bg-white"
          style={{ left: `${pct}%`, boxShadow: '0 2px 6px color-mix(in srgb, var(--accent) 66%, transparent), 0 0 0 3px var(--accent)' }} />
      </div>
      {labels && (
        <div className="mt-2 flex justify-between text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

function Panel({ title, icon: Icon, children }: {
  title: string; icon: React.FC<{ size?: number; style?: React.CSSProperties }>; children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-6" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px]"
          style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>
          <Icon size={16} />
        </span>
        <h2 className="text-h3 font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings');
  const formatter = useFormatter();
  const { settings, isLoaded, updateSetting, resetSettings, loadSettings } = useSettingsStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { mutate: updateSettings } = useUpdateSettings();

  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'display' | 'sound' | 'learning' | 'notification' | 'account'>('display');

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingBackendRef = useRef<UpdateSettingsPayload>({});
  const backendDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const flushBackendSettingsRef = useRef<(showResult?: boolean) => void>(() => {});

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => { toastTimerRef.current = null; setToast(''); }, 2000);
  }, []);

  const sendBackendSettings = useCallback((payload: UpdateSettingsPayload, successMessage?: string, showFailure = true) => {
    if (Object.keys(payload).length === 0) return;

    updateSettings(payload, {
      onSuccess: () => {
        if (successMessage) showToast(successMessage);
      },
      onError: () => {
        if (showFailure) showToast(t('toasts.saveFailed'));
      },
    });
  }, [showToast, updateSettings, t]);

  const flushBackendSettings = useCallback((showResult = true) => {
    if (backendDebounceRef.current) {
      clearTimeout(backendDebounceRef.current);
      backendDebounceRef.current = null;
    }

    const payload = pendingBackendRef.current;
    pendingBackendRef.current = {};
    sendBackendSettings(payload, showResult ? t('toasts.saved') : undefined, showResult);
  }, [sendBackendSettings, t]);

  const queueBackendSetting = useCallback((key: PropertyKey, value: unknown) => {
    if (!isBackendSettingsKey(key)) return false;

    pendingBackendRef.current = { ...pendingBackendRef.current, [key]: value } as UpdateSettingsPayload;
    if (backendDebounceRef.current) clearTimeout(backendDebounceRef.current);
    backendDebounceRef.current = setTimeout(() => {
      flushBackendSettings(true);
    }, 500);

    return true;
  }, [flushBackendSettings]);

  useEffect(() => {
    flushBackendSettingsRef.current = flushBackendSettings;
  }, [flushBackendSettings]);

  useEffect(() => () => {
    flushBackendSettingsRef.current(false);
  }, []);

  const handleChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSetting(key, value);
    if (isAuthenticated && queueBackendSetting(key, value)) {
      return;
    }
    showToast(t('toasts.saved'));
  };
  const handleTheme = (theme: 'light' | 'dark' | 'system') => {
    handleChange('theme', theme);
  };

  const handleReset = () => {
    if (!confirm(t('toasts.resetConfirm'))) return;

    if (backendDebounceRef.current) {
      clearTimeout(backendDebounceRef.current);
      backendDebounceRef.current = null;
    }
    pendingBackendRef.current = {};

    resetSettings();
    if (isAuthenticated) {
      sendBackendSettings(pickBackendSettings(defaultSettings), t('toasts.reset'));
    } else {
      showToast(t('toasts.reset'));
    }
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="v2-match-grad flex h-12 w-12 animate-pulse items-center justify-center rounded-[14px]">
          <IconSettings size={24} className="text-white" />
        </div>
      </div>
    );
  }

  const plan = user?.subscription?.plan;
  const isFreePlan = !plan || plan === 'free';

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="v2-match-grad flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] text-white"
          style={{ boxShadow: '0 8px 20px color-mix(in srgb, var(--accent) 27%, transparent)' }}>
          <IconSettings size={24} />
        </div>
        <div className="flex-1">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{t('header.title')}</h1>
          <p className="mt-0.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('header.subtitle')}</p>
        </div>
        {toast && (
          <div className="v2-toast flex items-center gap-2 rounded-[9px] px-3.5 py-2 text-caption font-bold text-white"
            style={{ background: 'var(--success)' }}>
            <IconCheck size={14} /> {toast}
          </div>
        )}
      </header>

      {/* ── Vertical tab nav + content ── */}
      <div className="grid gap-5 md:grid-cols-[232px_1fr] md:items-start">
        {/* Tab nav */}
        <nav className="flex gap-1.5 overflow-x-auto rounded-[13px] border p-2 md:sticky md:top-20 md:flex-col md:gap-1 md:overflow-visible"
          style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          {TABS.map(tab => {
            const Ic = tab.icon;
            const on = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[9px] px-3 py-2.5 text-left text-[13.5px] transition-colors"
                style={{
                  background: on ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent',
                  color: on ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)',
                  fontWeight: on ? 600 : 500,
                }}>
                <Ic size={17} style={{ color: on ? 'var(--accent)' : 'var(--theme-text-muted)' }} />
                {t(`tabs.${tab.id}` as 'tabs.display')}
              </button>
            );
          })}
          <div className="mx-1 my-1.5 hidden h-px md:block" style={{ background: 'var(--theme-border)' }} />
          <button onClick={handleReset}
            className="hidden items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-left text-[12.5px] font-medium transition-colors hover:opacity-80 md:flex"
            style={{ color: 'var(--theme-text-muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
            {t('footer.reset')}
          </button>
        </nav>

        {/* Content */}
        <div className="animate-[slideUp_0.3s_ease-out_both]">
          {activeTab === 'display' && (
            <Panel title={t('tabs.display')} icon={IconPalette}>
              <div className="mb-2">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>
                  {t('display.themeLabel')}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {THEME_OPTIONS.map(opt => {
                    const Ic = opt.icon;
                    const on = settings.theme === opt.value;
                    return (
                      <button key={opt.value} onClick={() => handleTheme(opt.value)}
                        className="relative flex flex-col items-center gap-2.5 rounded-md px-3 py-5 transition-colors"
                        style={{
                          background: on ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'var(--theme-bg-secondary)',
                          border: `1.5px solid ${on ? 'var(--accent)' : 'var(--theme-border)'}`,
                        }}>
                        {on && (
                          <span className="absolute right-2 top-2 flex h-4.5 w-4.5 items-center justify-center rounded-full text-white" style={{ background: 'var(--accent)' }}>
                            <IconCheck size={10} />
                          </span>
                        )}
                        <span className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{ background: on ? 'var(--accent)' : 'var(--theme-bg-tertiary)', color: on ? 'white' : 'var(--theme-text-muted)' }}>
                          <Ic size={18} />
                        </span>
                        <span className="text-[13px] font-semibold" style={{ color: on ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)' }}>
                          {t(`display.themes.${opt.value}` as 'display.themes.light')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="my-5">
                <LanguageSwitcher />
              </div>

              <SettingToggle label={t('display.showVietnamese.label')} desc={t('display.showVietnamese.desc')} checked={settings.showVietnamese} onChange={v => handleChange('showVietnamese', v)} />
              <SettingToggle label={t('display.showPronunciation.label')} desc={t('display.showPronunciation.desc')} checked={settings.showPronunciation} onChange={v => handleChange('showPronunciation', v)} />
              <SettingToggle label={t('display.showExamples.label')} desc={t('display.showExamples.desc')} checked={settings.showExamples} onChange={v => handleChange('showExamples', v)} />
            </Panel>
          )}

          {activeTab === 'sound' && (
            <Panel title={t('tabs.sound')} icon={IconVolume2}>
              <SettingToggle label={t('sound.soundEnabled.label')} desc={t('sound.soundEnabled.desc')} checked={settings.soundEnabled} onChange={v => handleChange('soundEnabled', v)} />
              <SettingToggle label={t('sound.autoPlaySound.label')} desc={t('sound.autoPlaySound.desc')} checked={settings.autoPlaySound} onChange={v => handleChange('autoPlaySound', v)} />
              <SettingSlider
                label={t('sound.speechRate.label')}
                value={settings.speechRate} min={0.5} max={1.5} step={0.1} unit="x"
                onChange={v => handleChange('speechRate', v)}
                labels={[t('sound.speechRate.slow'), t('sound.speechRate.normal'), t('sound.speechRate.fast')]}
              />
            </Panel>
          )}

          {activeTab === 'learning' && (
            <Panel title={t('tabs.learning')} icon={IconGraduationCap}>
              <SettingSlider label={t('learning.dailyGoal')} value={settings.dailyGoal} min={5} max={100} step={5} unit={t('learning.dailyGoalUnit')} onChange={v => handleChange('dailyGoal', v)} labels={['5', '50', '100']} />
              <SettingSlider label={t('learning.questionsPerGame')} value={settings.questionsPerGame} min={5} max={50} step={5} unit={t('learning.questionsPerGameUnit')} onChange={v => handleChange('questionsPerGame', v)} labels={['5', '25', '50']} />
              <SettingSlider label={t('learning.timedChallenge')} value={settings.timedChallengeSeconds} min={30} max={180} step={30} unit={t('learning.timedChallengeUnit')} onChange={v => handleChange('timedChallengeSeconds', v)} labels={['30s', '90s', '180s']} />

              <div className="pt-4">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>
                  {t('learning.preferredLevel.label')}
                </div>
                <p className="mb-3 text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                  {t('learning.preferredLevel.desc')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {LEVELS.map(l => {
                    const on = settings.preferredLevel === l;
                    return (
                      <button key={l} onClick={() => handleChange('preferredLevel', l)}
                        className="mono flex-1 rounded-[9px] px-2 py-2.5 text-[13px] font-bold transition-colors"
                        style={{
                          background: on ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'var(--theme-bg-secondary)',
                          border: `1.5px solid ${on ? 'var(--accent)' : 'var(--theme-border)'}`,
                          color: on ? 'var(--accent)' : 'var(--theme-text-secondary)',
                        }}>
                        {l === 'all' ? t('learning.preferredLevel.options.all') : l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Panel>
          )}

          {activeTab === 'notification' && (
            <Panel title={t('tabs.notification')} icon={IconBell}>
              <SettingToggle label={t('notification.dailyReminder.label')} desc={t('notification.dailyReminder.desc')} checked={settings.dailyReminder} onChange={v => handleChange('dailyReminder', v)} />
              <SettingToggle label={t('notification.weeklyEmail.label')} desc={t('notification.weeklyEmail.desc')} checked={settings.weeklyEmailEnabled} onChange={v => handleChange('weeklyEmailEnabled', v)} />
            </Panel>
          )}

          {activeTab === 'account' && (
            <Panel title={t('tabs.account')} icon={IconUser}>
              {isAuthenticated ? (
                <div className="space-y-4">
                  {/* User block */}
                  <div className="flex items-center gap-3.5 rounded-md border p-4" style={{ background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
                    <div className="v2-match-grad flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] text-xl font-bold text-white">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[16px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{user?.name || t('account.fallbackName')}</div>
                      <div className="truncate text-caption" style={{ color: 'var(--theme-text-muted)' }}>{user?.email}</div>
                    </div>
                    <Link href="/profile" className="flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] border px-3.5 text-caption font-medium transition-colors hover:opacity-80"
                      style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                      {t('account.editProfile')}
                    </Link>
                  </div>

                  {/* Plan card */}
                  <div>
                    <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{t('account.currentPlanLabel')}</div>
                    <div className="flex items-center gap-3.5 rounded-md border p-4"
                      style={isFreePlan
                        ? { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }
                        : { background: 'color-mix(in srgb, var(--warn) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--warn) 30%, transparent)' }}>
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] text-xl ${isFreePlan ? '' : 'v2-beta-badge'}`}
                        style={isFreePlan ? { background: 'var(--theme-bg-tertiary)' } : undefined}>
                        {isFreePlan ? '🌱' : '👑'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                            {isFreePlan ? t('account.planNames.free') : plan === 'premium' ? t('account.planNames.premium') : t('account.planNames.lifetime')}
                          </span>
                          {!isFreePlan && <span className="v2-beta-badge rounded-[4px] px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide">PRO</span>}
                        </div>
                        <p className="mt-0.5 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                          {user?.subscription?.expiresAt
                            ? t('account.expiresOn', { date: formatter.dateTime(new Date(user.subscription.expiresAt), { dateStyle: 'medium' }) })
                            : isFreePlan ? t('account.basicFeatures') : t('account.lifetimeBenefits')}
                        </p>
                      </div>
                      <Link href={isFreePlan ? '/pricing' : '/profile/subscription'}
                        className={`flex h-9 shrink-0 items-center rounded-[9px] px-4 text-caption font-bold ${isFreePlan ? 'v2-match-grad text-white' : 'v2-beta-badge'}`}>
                        {isFreePlan ? t('account.upgrade') : t('account.managePlan')}
                      </Link>
                    </div>
                  </div>

                  {/* Logout */}
                  <button onClick={handleLogout}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border text-[13.5px] font-semibold transition-colors"
                    style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)', color: 'var(--danger)' }}>
                    <IconLogOut size={16} />
                    {t('account.logout')}
                  </button>

                  <p className="text-center text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                    {t('account.supportText')} <a href="mailto:support@deutschmeister.de" className="hover:underline" style={{ color: 'var(--accent)' }}>support@deutschmeister.de</a>
                  </p>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                    <IconUser size={32} />
                  </div>
                  <p className="text-caption font-bold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{t('account.guestPrompt')}</p>
                  <Link href="/auth/login" className="v2-match-grad mt-6 inline-block rounded-[10px] px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-white">{t('account.guestLogin')}</Link>
                </div>
              )}
            </Panel>
          )}

          {/* Mobile reset (nav reset is desktop-only) */}
          <button onClick={handleReset} className="mt-4 text-[11px] font-bold uppercase tracking-widest md:hidden" style={{ color: 'var(--theme-text-muted)' }}>
            {t('footer.reset')}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
