'use client';

import { ACCENT } from '@/lib/tokens';
import { IconSearch, IconStar, IconFilter, IconRefresh } from '@/components/ui/Icons';
import {
  WordType, Level, Gender,
  WordTypeInfo, GenderInfo, WordBankFilters,
} from '@/types/personalWord';
import type { PersonalWordStats } from '@/lib/api/personal-words';

const WORD_TYPES: WordType[] = ['nomen', 'verb', 'adjektiv', 'adverb', 'praposition', 'konjunktion', 'pronomen', 'partikel', 'andere'];
const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const GENDERS: Gender[] = ['masculine', 'feminine', 'neuter'];

interface WordBankFiltersBarProps {
  filters: WordBankFilters;
  setFilters: (f: Partial<WordBankFilters>) => void;
  resetFilters: () => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  selectedView: string;
  stats?: PersonalWordStats;
  categories: string[];
  total: number;
  shown: number;
  page: number;
  totalPages: number;
}

export function WordBankFiltersBar({
  filters, setFilters, resetFilters,
  showFilters, setShowFilters,
  selectedView, stats, categories,
  total, shown, page, totalPages,
}: WordBankFiltersBarProps) {
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-50 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }}>
            <IconSearch size={16} />
          </span>
          <input
            value={filters.search}
            onChange={e => setFilters({ search: e.target.value })}
            placeholder="Tìm từ, nghĩa, ghi chú..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-body focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-text-primary)',
            }}
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-body font-medium transition-all"
          style={{
            borderColor: showFilters ? ACCENT.srs : 'var(--theme-border)',
            backgroundColor: showFilters ? `${ACCENT.srs}14` : 'var(--theme-bg-card)',
            color: showFilters ? ACCENT.srs : 'var(--theme-text-secondary)',
          }}
        >
          <IconFilter size={14} /> Lọc
        </button>

        {selectedView !== 'favorites' && (
          <button
            onClick={() => setFilters({ favoritesOnly: !filters.favoritesOnly })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-body font-medium transition-all"
            style={{
              borderColor: filters.favoritesOnly ? ACCENT.xp : 'var(--theme-border)',
              backgroundColor: filters.favoritesOnly ? `${ACCENT.xp}14` : 'var(--theme-bg-card)',
              color: filters.favoritesOnly ? ACCENT.xp : 'var(--theme-text-secondary)',
            }}
          >
            <IconStar size={14} style={filters.favoritesOnly ? { fill: ACCENT.xp } : {}} /> Yêu thích
          </button>
        )}

        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={e => {
            const [sortBy, sortOrder] = e.target.value.split('-') as [WordBankFilters['sortBy'], 'asc' | 'desc'];
            setFilters({ sortBy, sortOrder });
          }}
          className="px-3 py-2.5 rounded-xl border text-body focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
            color: 'var(--theme-text-primary)',
          }}
        >
          <option value="createdAt-desc">Mới nhất</option>
          <option value="createdAt-asc">Cũ nhất</option>
          <option value="word-asc">A → Z</option>
          <option value="word-desc">Z → A</option>
          <option value="level-asc">Level ↑</option>
          <option value="wordType-asc">Từ loại</option>
        </select>
      </div>

      {showFilters && (
        <div
          className="p-4 rounded-2xl border mb-4 space-y-4 shadow-sm"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
        >
          {stats && (
            <div>
              <label className="block text-caption font-semibold mb-2" style={{ color: 'var(--theme-text-muted)' }}>Từ loại</label>
              <div className="flex flex-wrap gap-2">
                {WORD_TYPES.map(t => {
                  const info = WordTypeInfo[t];
                  const count = stats.byType[t] || 0;
                  const active = filters.wordType === t;
                  if (count === 0 && !active) return null;
                  return (
                    <button
                      key={t}
                      onClick={() => setFilters({ wordType: active ? 'all' : t })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border"
                      style={{
                        backgroundColor: active ? info.color : 'var(--theme-bg-secondary)',
                        color: active ? 'white' : 'var(--theme-text-secondary)',
                        borderColor: active ? info.color : 'transparent',
                      }}
                    >
                      <span>{info.icon} {info.labelDe}</span>
                      <span className="opacity-70 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-5">
            <div>
              <label className="block text-caption font-semibold mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>Cấp độ</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilters({ level: 'all' })}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: filters.level === 'all' ? ACCENT.srs : 'var(--theme-bg-secondary)',
                    color: filters.level === 'all' ? 'white' : 'var(--theme-text-secondary)',
                  }}
                >
                  Tất cả
                </button>
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setFilters({ level: filters.level === l ? 'all' : l })}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: filters.level === l ? ACCENT.srs : 'var(--theme-bg-secondary)',
                      color: filters.level === l ? 'white' : 'var(--theme-text-secondary)',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-caption font-semibold mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>Giống (Nomen)</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilters({ gender: 'all' })}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: filters.gender === 'all' ? 'var(--theme-text-muted)' : 'var(--theme-bg-secondary)',
                    color: filters.gender === 'all' ? 'white' : 'var(--theme-text-secondary)',
                  }}
                >
                  Tất cả
                </button>
                {GENDERS.map(g => {
                  const info = GenderInfo[g];
                  return (
                    <button
                      key={g}
                      onClick={() => setFilters({ gender: filters.gender === g ? 'all' : g })}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: filters.gender === g ? info.color : 'var(--theme-bg-secondary)',
                        color: filters.gender === g ? 'white' : 'var(--theme-text-secondary)',
                      }}
                    >
                      {info.article}
                    </button>
                  );
                })}
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <label className="block text-caption font-semibold mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>Chủ đề</label>
                <select
                  value={filters.category}
                  onChange={e => setFilters({ category: e.target.value })}
                  className="px-2.5 py-1 rounded-lg text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-bg-secondary)',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  <option value="">Tất cả</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs font-medium transition-all hover:opacity-70"
            style={{ color: ACCENT.srs }}
          >
            <IconRefresh size={13} /> Reset bộ lọc
          </button>
        </div>
      )}

      <p className="text-xs mb-3" style={{ color: 'var(--theme-text-muted)' }}>
        Hiển thị {shown} / {total} từ
        {totalPages > 1 && ` • Trang ${page} / ${totalPages}`}
      </p>
    </>
  );
}
