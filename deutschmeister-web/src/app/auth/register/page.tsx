'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';

// Password validation rules
const PASSWORD_RULES = [
  { id: 'length', label: 'Ít nhất 8 ký tự', test: (p: string) => p.length >= 8 },
  { id: 'lowercase', label: 'Có chữ thường (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'Có chữ hoa (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Có số (0-9)', test: (p: string) => /\d/.test(p) },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = useMemo(() => {
    const passed = PASSWORD_RULES.filter(rule => rule.test(password)).length;
    return {
      score: passed,
      percent: (passed / PASSWORD_RULES.length) * 100,
      label: passed === 0 ? '' : passed <= 1 ? 'Yếu' : passed <= 2 ? 'Trung bình' : passed <= 3 ? 'Khá' : 'Mạnh',
      color: passed <= 1 ? 'bg-red-500' : passed <= 2 ? 'bg-orange-500' : passed <= 3 ? 'bg-yellow-500' : 'bg-green-500',
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${strength.percent}%` }}
          />
        </div>
        {strength.label && (
          <span className={`text-xs font-medium ${
            strength.score <= 1 ? 'text-red-500' :
            strength.score <= 2 ? 'text-orange-500' :
            strength.score <= 3 ? 'text-yellow-600' : 'text-green-500'
          }`}>
            {strength.label}
          </span>
        )}
      </div>

      {/* Rules Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {PASSWORD_RULES.map(rule => {
          const passed = rule.test(password);
          return (
            <div
              key={rule.id}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                passed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <span className="text-sm">{passed ? '✓' : '○'}</span>
              <span>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Check if password is valid
  const isPasswordValid = useMemo(() => {
    return PASSWORD_RULES.every(rule => rule.test(password));
  }, [password]);

  const displayError = error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate name
    if (name.trim().length < 2) {
      setError('Tên phải có ít nhất 2 ký tự');
      return;
    }

    // Validate password rules
    if (!isPasswordValid) {
      setError('Mật khẩu chưa đủ mạnh. Vui lòng kiểm tra các yêu cầu bên dưới.');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await register({name: name.trim(), email, password});
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  const isFormValid = isPasswordValid && password === confirmPassword && name.trim().length >= 2;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🇩🇪</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tạo tài khoản</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Bắt đầu hành trình học tiếng Đức!</p>
        </div>

        {displayError && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Họ tên</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
              minLength={2}
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                maxLength={50}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <PasswordStrengthIndicator password={password} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Xác nhận mật khẩu</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              className={`w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                confirmPassword && confirmPassword !== password
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="mt-1 text-xs text-red-500">Mật khẩu không khớp</p>
            )}
          </div>

          <Button 
            type="submit" 
            isLoading={isLoading} 
            disabled={!isFormValid || isLoading}
            className="w-full"
          >
            Đăng ký
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Đã có tài khoản?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}