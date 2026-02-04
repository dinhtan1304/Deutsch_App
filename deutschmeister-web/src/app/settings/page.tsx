'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettingsStore, applyTheme } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsPage() {
  const router = useRouter();
  const { settings, isLoaded, updateSetting, resetSettings, loadSettings } = useSettingsStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'display' | 'sound' | 'learning' | 'account'>('display');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Watch theme changes
  useEffect(() => {
    const update = () => {
      const html = document.documentElement;
      setIsDark(html.getAttribute('data-theme') === 'dark');
    };
    update();
    
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSetting(key, value);
    showToast('✓ Đã lưu!');
  };

  const handleTheme = (theme: 'light' | 'dark' | 'system') => {
    updateSetting('theme', theme);
    showToast(`✓ Theme: ${theme}`);
  };

  const handleReset = () => {
    if (confirm('Đặt lại tất cả cài đặt về mặc định?')) {
      resetSettings();
      showToast('✓ Đã đặt lại!');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Theme-aware colors
  const colors = {
    bgBody: isDark ? '#111827' : '#f9fafb',
    bgCard: isDark ? '#1f2937' : '#ffffff',
    bgSecondary: isDark ? '#374151' : '#f3f4f6',
    bgTertiary: isDark ? '#4b5563' : '#e5e7eb',
    textPrimary: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bgBody }}>
        <div className="animate-spin text-4xl">⚙️</div>
      </div>
    );
  }

  const tabs = [
    { id: 'display' as const, label: '🎨 Hiển thị' },
    { id: 'sound' as const, label: '🔊 Âm thanh' },
    { id: 'learning' as const, label: '📚 Học tập' },
    { id: 'account' as const, label: '👤 Tài khoản' },
  ];

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: colors.bgBody, color: colors.textPrimary }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: colors.border, backgroundColor: colors.bgCard }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl">🇩🇪</Link>
            <h1 className="text-xl font-bold">⚙️ Cài đặt</h1>
          </div>
          {toast && (
            <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium animate-pulse">
              {toast}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? '#3b82f6' : colors.bgSecondary,
                color: activeTab === tab.id ? '#ffffff' : colors.textPrimary,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Display Settings */}
        {activeTab === 'display' && (
          <Card colors={colors}>
            <h2 className="text-xl font-bold mb-6">🎨 Cài đặt hiển thị</h2>
            
            {/* Theme */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                Giao diện (Theme)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'light' as const, icon: '☀️', label: 'Sáng' },
                  { value: 'dark' as const, icon: '🌙', label: 'Tối' },
                  { value: 'system' as const, icon: '💻', label: 'Hệ thống' },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleTheme(opt.value)}
                    className="p-4 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: settings.theme === opt.value ? '#3b82f6' : colors.border,
                      backgroundColor: settings.theme === opt.value 
                        ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                        : 'transparent'
                    }}
                  >
                    <div className="text-3xl mb-1">{opt.icon}</div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    {settings.theme === opt.value && (
                      <div className="text-xs text-blue-500 mt-1">✓ Đang dùng</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Toggle
              label="Hiển thị tiếng Việt"
              desc="Hiện bản dịch tiếng Việt cho mỗi từ"
              checked={settings.showVietnamese}
              onChange={(v) => handleChange('showVietnamese', v)}
              colors={colors}
            />
            <Toggle
              label="Hiển thị phiên âm"
              desc="Hiện phiên âm IPA cho mỗi từ"
              checked={settings.showPronunciation}
              onChange={(v) => handleChange('showPronunciation', v)}
              colors={colors}
            />
            <Toggle
              label="Hiển thị ví dụ"
              desc="Hiện câu ví dụ cho mỗi từ"
              checked={settings.showExamples}
              onChange={(v) => handleChange('showExamples', v)}
              colors={colors}
            />
          </Card>
        )}

        {/* Sound Settings */}
        {activeTab === 'sound' && (
          <Card colors={colors}>
            <h2 className="text-xl font-bold mb-6">🔊 Cài đặt âm thanh</h2>
            
            <Toggle
              label="Bật âm thanh"
              desc="Phát âm thanh khi trả lời đúng/sai"
              checked={settings.soundEnabled}
              onChange={(v) => handleChange('soundEnabled', v)}
              colors={colors}
            />
            <Toggle
              label="Tự động phát âm"
              desc="Tự động đọc từ khi hiển thị"
              checked={settings.autoPlaySound}
              onChange={(v) => handleChange('autoPlaySound', v)}
              colors={colors}
            />

            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Tốc độ phát âm</span>
                <span className="font-bold text-blue-500">{settings.speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.speechRate}
                onChange={(e) => handleChange('speechRate', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: colors.textSecondary }}>
                <span>Chậm (0.5x)</span>
                <span>Bình thường</span>
                <span>Nhanh (1.5x)</span>
              </div>
            </div>

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
              className="mt-6 w-full px-4 py-3 rounded-xl border-2 font-medium transition-all hover:bg-blue-50"
              style={{ borderColor: colors.border }}
            >
              🔊 Thử phát âm "der Apfel"
            </button>
          </Card>
        )}

        {/* Learning Settings */}
        {activeTab === 'learning' && (
          <Card colors={colors}>
            <h2 className="text-xl font-bold mb-6">📚 Cài đặt học tập</h2>
            
            <Slider
              label="Mục tiêu hàng ngày"
              value={settings.dailyGoal}
              min={5}
              max={100}
              step={5}
              unit="từ"
              onChange={(v) => handleChange('dailyGoal', v)}
              colors={colors}
            />

            <div className="my-6">
              <label className="block font-medium mb-2">Cấp độ ưu tiên</label>
              <select
                value={settings.preferredLevel}
                onChange={(e) => handleChange('preferredLevel', e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border"
                style={{ 
                  backgroundColor: colors.bgCard, 
                  borderColor: colors.border,
                  color: colors.textPrimary 
                }}
              >
                <option value="all">Tất cả cấp độ</option>
                <option value="A1">A1 - Sơ cấp</option>
                <option value="A2">A2 - Sơ cấp cao</option>
                <option value="B1">B1 - Trung cấp</option>
                <option value="B2">B2 - Trung cấp cao</option>
                <option value="C1">C1 - Cao cấp</option>
                <option value="C2">C2 - Thành thạo</option>
              </select>
            </div>

            <Slider
              label="Số câu hỏi mỗi game"
              value={settings.questionsPerGame}
              min={5}
              max={50}
              step={5}
              unit="câu"
              onChange={(v) => handleChange('questionsPerGame', v)}
              colors={colors}
            />

            <Slider
              label="Thời gian Timed Challenge"
              value={settings.timedChallengeSeconds}
              min={30}
              max={180}
              step={15}
              unit="giây"
              onChange={(v) => handleChange('timedChallengeSeconds', v)}
              colors={colors}
            />
          </Card>
        )}

        {/* Account Settings */}
        {activeTab === 'account' && (
          <Card colors={colors}>
            <h2 className="text-xl font-bold mb-6">👤 Tài khoản</h2>
            
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl mb-6" style={{ backgroundColor: colors.bgSecondary }}>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{user?.name || 'Chưa đặt tên'}</div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>{user?.email}</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                  <h3 className="font-medium text-red-500 mb-4">⚠️ Vùng nguy hiểm</h3>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-lg font-bold mb-2">Chưa đăng nhập</h3>
                <p className="mb-6" style={{ color: colors.textSecondary }}>
                  Đăng nhập để đồng bộ tiến độ học tập
                </p>
                <div className="flex gap-4 justify-center">
                  <Link 
                    href="/auth/login"
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
                  >
                    Đăng nhập
                  </Link>
                  <Link 
                    href="/auth/register"
                    className="px-6 py-3 border-2 rounded-xl font-medium hover:bg-gray-50"
                    style={{ borderColor: colors.border }}
                  >
                    Đăng ký
                  </Link>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Reset Button */}
        <div className="text-center mt-6">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium transition-colors hover:underline"
            style={{ color: colors.textSecondary }}
          >
            🔄 Đặt lại tất cả về mặc định
          </button>
        </div>

        {/* Back Link */}
        <div className="text-center mt-4">
          <Link 
            href="/"
            className="text-blue-500 hover:underline"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

// Card Component
function Card({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <div 
      className="rounded-2xl p-6 mb-6 shadow-sm"
      style={{ backgroundColor: colors.bgCard }}
    >
      {children}
    </div>
  );
}

// Toggle Component
function Toggle({ label, desc, checked, onChange, colors }: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  colors: any;
}) {
  return (
    <div 
      className="flex items-center justify-between py-4 border-b last:border-0"
      style={{ borderColor: colors.border }}
    >
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm" style={{ color: colors.textSecondary }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-14 h-7 rounded-full transition-colors"
        style={{ backgroundColor: checked ? '#3b82f6' : colors.bgTertiary }}
      >
        <div 
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? '1.75rem' : '0.125rem' }}
        />
      </button>
    </div>
  );
}

// Slider Component
function Slider({ label, value, min, max, step, unit, onChange, colors }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  colors: any;
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="font-medium">{label}</span>
        <span className="font-bold text-blue-500">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      />
    </div>
  );
}