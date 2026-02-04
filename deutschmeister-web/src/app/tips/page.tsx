'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { 
  derRules, 
  dieRules, 
  dasRules, 
  memoryTricks, 
  quickReference,
  GenderRule 
} from '@/lib/genderRules';

type TabType = 'all' | 'der' | 'die' | 'das' | 'tricks';

export default function TipsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const tabs: { id: TabType; label: string; color: string }[] = [
    { id: 'all', label: '📚 Tất cả', color: '#6b7280' },
    { id: 'der', label: '🔵 der', color: '#3b82f6' },
    { id: 'die', label: '🔴 die', color: '#ec4899' },
    { id: 'das', label: '🟢 das', color: '#22c55e' },
    { id: 'tricks', label: '🧠 Mẹo nhớ', color: '#f59e0b' },
  ];

  const renderRule = (rule: GenderRule) => {
    const colors = {
      masculine: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#3b82f6' },
      feminine: { bg: 'rgba(236, 72, 153, 0.1)', border: '#ec4899', text: '#ec4899' },
      neuter: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#22c55e' },
    };
    const c = colors[rule.gender];

    return (
      <div 
        key={rule.id}
        className="p-4 rounded-xl"
        style={{ backgroundColor: c.bg, borderLeft: `4px solid ${c.border}` }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold" style={{ color: c.text }}>
            {rule.type === 'ending' && `Đuôi ${rule.pattern.replace('$', '')}`}
            {rule.type === 'prefix' && `Tiền tố ${rule.pattern.replace('^', '')}`}
            {rule.type === 'category' && rule.description}
            {rule.type === 'special' && rule.description}
          </h3>
          <span 
            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: c.border }}
          >
            {rule.reliability}%
          </span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {rule.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {rule.examples.map((ex, i) => (
            <span 
              key={i}
              className="px-2 py-1 rounded text-sm font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: c.text }}
            >
              {ex}
            </span>
          ))}
        </div>
        
        {rule.exceptions && rule.exceptions.length > 0 && (
          <p className="text-xs text-gray-500">
            ⚠️ Ngoại lệ: {rule.exceptions.join(', ')}
          </p>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          💡 Mẹo nhớ Der / Die / Das
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Các quy tắc giúp bạn đoán đúng mạo từ tiếng Đức
        </p>

        {/* Quick Reference */}
        <Card className="mb-6 p-4">
          <h2 className="font-bold text-lg mb-4">⚡ Tra cứu nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-600 mb-2">🔵 DER</h3>
              <div className="flex flex-wrap gap-1">
                {quickReference.der.map((e, i) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm">
                    {e}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500">
              <h3 className="font-bold text-pink-600 mb-2">🔴 DIE</h3>
              <div className="flex flex-wrap gap-1">
                {quickReference.die.map((e, i) => (
                  <span key={i} className="px-2 py-0.5 bg-pink-100 dark:bg-pink-800 text-pink-700 dark:text-pink-300 rounded text-sm">
                    {e}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
              <h3 className="font-bold text-green-600 mb-2">🟢 DAS</h3>
              <div className="flex flex-wrap gap-1">
                {quickReference.das.map((e, i) => (
                  <span key={i} className="px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded text-sm">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? tab.color : 'var(--theme-bg-card, #ffffff)',
                color: activeTab === tab.id ? 'white' : 'var(--theme-text-primary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Memory Tricks */}
        {(activeTab === 'all' || activeTab === 'tricks') && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🧠 Câu vần dễ nhớ
            </h2>
            <div className="grid gap-4">
              {memoryTricks.map((trick, i) => {
                const colors = {
                  masculine: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' },
                  feminine: { bg: 'rgba(236, 72, 153, 0.1)', border: '#ec4899' },
                  neuter: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e' },
                };
                const c = colors[trick.gender];
                
                return (
                  <div 
                    key={i}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: c.bg, borderLeft: `4px solid ${c.border}` }}
                  >
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                      {trick.title}
                    </h3>
                    <p className="text-lg italic mb-2" style={{ color: c.border }}>
                      "{trick.rhyme}"
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      → {trick.translation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DER Rules */}
        {(activeTab === 'all' || activeTab === 'der') && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-blue-600 mb-4">
              🔵 Quy tắc DER (Maskulinum)
            </h2>
            <div className="grid gap-3">
              {derRules.map(renderRule)}
            </div>
          </div>
        )}

        {/* DIE Rules */}
        {(activeTab === 'all' || activeTab === 'die') && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-pink-600 mb-4">
              🔴 Quy tắc DIE (Femininum)
            </h2>
            <div className="grid gap-3">
              {dieRules.map(renderRule)}
            </div>
          </div>
        )}

        {/* DAS Rules */}
        {(activeTab === 'all' || activeTab === 'das') && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-green-600 mb-4">
              🟢 Quy tắc DAS (Neutrum)
            </h2>
            <div className="grid gap-3">
              {dasRules.map(renderRule)}
            </div>
          </div>
        )}

        {/* Tips */}
        <Card className="p-4 mt-8">
          <h2 className="font-bold text-lg mb-3">📝 Lời khuyên học tập</h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex gap-2">
              <span>1️⃣</span>
              <span><strong>Học cùng mạo từ:</strong> Luôn học "der Tisch" thay vì chỉ "Tisch"</span>
            </li>
            <li className="flex gap-2">
              <span>2️⃣</span>
              <span><strong>Dùng màu sắc:</strong> Viết der = xanh, die = hồng, das = xanh lá</span>
            </li>
            <li className="flex gap-2">
              <span>3️⃣</span>
              <span><strong>Hình ảnh hóa:</strong> Tưởng tượng der = đàn ông, die = phụ nữ, das = em bé cầm vật đó</span>
            </li>
            <li className="flex gap-2">
              <span>4️⃣</span>
              <span><strong>Học theo nhóm đuôi:</strong> Gom các từ cùng đuôi để nhớ quy tắc</span>
            </li>
            <li className="flex gap-2">
              <span>5️⃣</span>
              <span><strong>Ôn tập SRS:</strong> Dùng tính năng SRS Review để nhớ lâu hơn</span>
            </li>
          </ul>
        </Card>
      </div>
    </MainLayout>
  );
}