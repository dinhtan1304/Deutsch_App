'use client';

import Link from 'next/link';

const testTypes = [
  {
    title: 'Luyện Viết',
    titleDe: 'Schreibübung',
    description: 'AI tạo đề bài tiếng Đức, chấm và sửa lỗi chi tiết',
    icon: '✍️',
    href: '/practice-test/writing',
    color: 'from-blue-500 to-indigo-600',
    available: true,
  },
  {
    title: 'Luyện Nghe',
    titleDe: 'Hörübung',
    description: 'Nghe audio và trả lời câu hỏi',
    icon: '🎧',
    href: '/practice-test/listening',
    color: 'from-purple-500 to-pink-600',
    available: false,
  },
  {
    title: 'Luyện Đọc',
    titleDe: 'Leseübung',
    description: 'Đọc hiểu văn bản tiếng Đức',
    icon: '📖',
    href: '/practice-test/reading',
    color: 'from-emerald-500 to-teal-600',
    available: false,
  },
];

export default function PracticeTestPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Luyện Test
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Chọn dạng bài luyện tập phù hợp với trình độ của bạn
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testTypes.map((type) => (
          <div key={type.href} className="relative">
            {type.available ? (
              <Link
                href={type.href}
                className="block p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-linear-to-br ${type.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  {type.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {type.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {type.titleDe}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                  {type.description}
                </p>
              </Link>
            ) : (
              <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60">
                <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl mb-4">
                  {type.icon}
                </div>
                <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-lg">
                  {type.title}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {type.titleDe}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
                  {type.description}
                </p>
                <span className="mt-3 inline-block text-xs font-medium px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500">
                  Sắp ra mắt
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}