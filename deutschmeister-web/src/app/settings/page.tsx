'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsPage() {
  const router = useRouter();
  const { settings, isLoaded, updateSetting, resetSettings, loadSettings } = useSettingsStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'display' | 'sound' | 'learning' | 'account'>('display');

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
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
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-2xl">🇩🇪</Link>
              <div>
                <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Cài đặt</p>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  Tùy chỉnh trải nghiệm học tập
                </h1>
              </div>
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              Đồng bộ giao diện với dashboard và tối ưu các tuỳ chọn học tập của bạn.
            </p>
          </div>
          {toast && (
            <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium shadow-sm animate-pulse">
              {toast}
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Tabs */}
          <div
            className="h-fit rounded-2xl border p-3 space-y-1"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-4 py-3 rounded-xl font-medium text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                style={{ color: activeTab === tab.id ? undefined : 'var(--theme-text-primary)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div>
            {/* Display Settings */}
            {activeTab === 'display' && (
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>🎨 Cài đặt hiển thị</h2>
                    <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                      Tinh chỉnh giao diện và thông tin hiển thị trên bài học.
                    </p>
                  </div>
                </div>
            
            {/* Theme */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
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
                    className="p-4 rounded-xl border-2 transition-all hover:shadow-sm"
                    style={{
                      borderColor: settings.theme === opt.value ? '#3b82f6' : 'var(--theme-border)',
                      backgroundColor: settings.theme === opt.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
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
            />
            <Toggle
              label="Hiển thị phiên âm"
              desc="Hiện phiên âm IPA cho mỗi từ"
              checked={settings.showPronunciation}
              onChange={(v) => handleChange('showPronunciation', v)}
            />
            <Toggle
              label="Hiển thị ví dụ"
              desc="Hiện câu ví dụ cho mỗi từ"
              checked={settings.showExamples}
              onChange={(v) => handleChange('showExamples', v)}
            />
              </Card>
            )}

            {/* Sound Settings */}
            {activeTab === 'sound' && (
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>🔊 Cài đặt âm thanh</h2>
                    <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                      Điều chỉnh âm thanh và tốc độ phát âm phù hợp với bạn.
                    </p>
                  </div>
                </div>
            
            <Toggle
              label="Bật âm thanh"
              desc="Phát âm thanh khi trả lời đúng/sai"
              checked={settings.soundEnabled}
              onChange={(v) => handleChange('soundEnabled', v)}
            />
            <Toggle
              label="Tự động phát âm"
              desc="Tự động đọc từ khi hiển thị"
              checked={settings.autoPlaySound}
              onChange={(v) => handleChange('autoPlaySound', v)}
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
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
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
              className="mt-6 w-full px-4 py-3 rounded-xl border-2 font-medium transition-all hover:bg-blue-50 dark:hover:bg-gray-800"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            >
              🔊 Thử phát âm "der Apfel"
            </button>
              </Card>
            )}

            {/* Learning Settings */}
            {activeTab === 'learning' && (
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>📚 Cài đặt học tập</h2>
                    <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                      Tối ưu mục tiêu và khối lượng bài luyện mỗi ngày.
                    </p>
                  </div>
                </div>
            
            <Slider
              label="Mục tiêu hàng ngày"
              value={settings.dailyGoal}
              min={5}
              max={100}
              step={5}
              unit="từ"
              onChange={(v) => handleChange('dailyGoal', v)}
            />

            <div className="my-6">
              <label className="block font-medium mb-2">Cấp độ ưu tiên</label>
              <select
                value={settings.preferredLevel}
                onChange={(e) => handleChange('preferredLevel', e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border"
                style={{ 
                  backgroundColor: 'var(--theme-bg-card)', 
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-primary)',
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
            />

            <Slider
              label="Thời gian Timed Challenge"
              value={settings.timedChallengeSeconds}
              min={30}
              max={180}
              step={15}
              unit="giây"
              onChange={(v) => handleChange('timedChallengeSeconds', v)}
            />
              </Card>
            )}

            {/* Account Settings */}
            {activeTab === 'account' && (
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>👤 Tài khoản</h2>
                    <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                      Quản lý thông tin người dùng và đồng bộ dữ liệu.
                    </p>
                  </div>
                </div>
            
            {isAuthenticated ? (
              <>
                <div
                  className="flex items-center gap-4 p-4 rounded-xl mb-6"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                >
                  <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: 'var(--theme-text-primary)' }}>
                      {user?.name || 'Chưa đặt tên'}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{user?.email}</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
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
                <p className="mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
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
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
                  >
                    Đăng ký
                  </Link>
                </div>
              </div>
            )}
              </Card>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium transition-colors hover:underline"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                🔄 Đặt lại tất cả về mặc định
              </button>
              <Link 
                href="/"
                className="text-blue-500 hover:underline text-sm"
              >
                ← Quay lại trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card Component
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="rounded-2xl p-6 mb-6 shadow-sm border"
      style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
    >
      {children}
    </div>
  );
}

// Toggle Component
function Toggle({ label, desc, checked, onChange }: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div 
      className="flex items-center justify-between py-4 border-b last:border-0"
      style={{ borderColor: 'var(--theme-border)' }}
    >
      <div>
        <div className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{label}</div>
        <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-14 h-7 rounded-full transition-colors"
        style={{ backgroundColor: checked ? '#3b82f6' : 'var(--theme-bg-secondary)' }}
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
function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
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
