'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties, ElementType } from 'react';
import Link from 'next/link';
import {
  AUTHENTIC_RESOURCES,
  LEVEL_LABELS,
  SKILL_LABELS,
  TYPE_LABELS,
  type AuthenticResource,
  type ResourceLevel,
  type ResourceSkill,
  type ResourceType,
} from '@/data/authentic-resources';
import { AppPageShell, SurfaceCard } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';
import {
  IconBook,
  IconChevronLeft,
  IconExternalLink,
  IconFileText,
  IconFilter,
  IconGlobe,
  IconMicrophone,
  IconSearch,
  IconShieldCheck,
  IconVideo,
} from '@/components/ui/Icons';

const LEVEL_COLORS: Record<ResourceLevel, string> = {
  A1: ACCENT.reading,
  A2: ACCENT.srs,
  B1: ACCENT.vocab,
  B2: ACCENT.xp,
  C1: STATUS.danger,
};

const TYPE_ICONS: Record<ResourceType, ElementType> = {
  news: IconFileText,
  podcast: IconMicrophone,
  video: IconVideo,
  blog: IconBook,
  website: IconGlobe,
  youtube: IconVideo,
};

const LEVEL_OPTIONS = ['all', 'A1', 'A2', 'B1', 'B2', 'C1'] as const;
const SKILL_OPTIONS = ['all', 'reading', 'listening'] as const;

type LevelFilter = ResourceLevel | 'all';
type SkillFilter = Extract<ResourceSkill, 'all' | 'reading' | 'listening'>;

export default function ResourcesPage() {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi-VN');

    return AUTHENTIC_RESOURCES.filter((resource) => {
      const matchesLevel = levelFilter === 'all' || resource.level === levelFilter;
      const matchesSkill =
        skillFilter === 'all' || resource.skill === 'all' || resource.skill === skillFilter;
      const searchable = [
        resource.title,
        resource.titleVi,
        resource.source,
        TYPE_LABELS[resource.type],
        resource.descriptionVi,
      ].join(' ').toLocaleLowerCase('vi-VN');

      return matchesLevel && matchesSkill && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [levelFilter, skillFilter, query]);

  const activeFilterCount = Number(levelFilter !== 'all') + Number(skillFilter !== 'all') + Number(query.trim() !== '');

  return (
    <AppPageShell
      title="Tài nguyên bản xứ"
      subtitle="Nguồn đọc, nghe và xem bằng tiếng Đức thật, được chọn theo cấp độ để bạn luyện với ngôn ngữ đời sống."
      icon={<IconGlobe size={22} />}
      accent="reading"
      right={(
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-caption font-bold transition-colors hover:bg-theme-secondary"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
        >
          <IconChevronLeft size={14} />
          Dashboard
        </Link>
      )}
    >
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <SurfaceCard className="p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-caption font-black uppercase" style={{ color: ACCENT.reading }}>
                    <IconFilter size={14} />
                    Bộ lọc
                  </div>
                  <p className="mt-1 text-body" style={{ color: 'var(--theme-text-muted)' }}>
                    Lọc nhanh theo trình độ, kỹ năng hoặc tên nguồn.
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setLevelFilter('all');
                      setSkillFilter('all');
                      setQuery('');
                    }}
                    className="w-fit rounded-lg px-3 py-2 text-caption font-bold transition-colors hover:bg-theme-secondary"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              <label className="relative block">
                <span className="sr-only">Tìm tài nguyên</span>
                <IconSearch
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--theme-text-muted)' }}
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo tên, nguồn hoặc mô tả..."
                  className="h-11 w-full rounded-xl border bg-transparent pl-10 pr-3 text-body font-medium outline-none transition focus:ring-2"
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                    '--tw-ring-color': `${ACCENT.reading}33`,
                  } as CSSProperties}
                />
              </label>

              <FilterGroup
                label="Trình độ"
                options={LEVEL_OPTIONS}
                value={levelFilter}
                getLabel={(level) => LEVEL_LABELS[level]}
                getColor={(level) => (level === 'all' ? ACCENT.brand : LEVEL_COLORS[level])}
                onChange={setLevelFilter}
              />

              <FilterGroup
                label="Kỹ năng"
                options={SKILL_OPTIONS}
                value={skillFilter}
                getLabel={(skill) => SKILL_LABELS[skill]}
                getColor={(skill) => (skill === 'listening' ? ACCENT.listening : ACCENT.reading)}
                onChange={setSkillFilter}
              />
            </div>
          </SurfaceCard>

          <SurfaceCard variant="featured" accent="xp" className="p-4 sm:p-5">
            <div className="flex h-full flex-col justify-between gap-5">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.14)', color: ACCENT.xp }}
                  aria-hidden
                >
                  <IconShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-h3 font-extrabold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
                    Lưu ý bản quyền
                  </h2>
                  <p className="mt-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                    Đây là các liên kết đến nội dung bên thứ ba. Hãy xem điều khoản của từng nhà cung cấp trước khi tải,
                    trích dẫn hoặc chia sẻ lại.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Tài nguyên" value={AUTHENTIC_RESOURCES.length.toString()} />
                <Stat label="Miễn phí" value={AUTHENTIC_RESOURCES.filter((resource) => resource.free).length.toString()} />
                <Stat label="Nguồn" value={new Set(AUTHENTIC_RESOURCES.map((resource) => resource.source)).size.toString()} />
              </div>
            </div>
          </SurfaceCard>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-h2 font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
              {filtered.length} tài nguyên phù hợp
            </h2>
            <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
              Mở nguồn bên ngoài trong tab mới để học trực tiếp từ nhà xuất bản.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {levelFilter !== 'all' && <ActiveChip label={LEVEL_LABELS[levelFilter]} color={LEVEL_COLORS[levelFilter]} />}
            {skillFilter !== 'all' && <ActiveChip label={SKILL_LABELS[skillFilter]} color={skillFilter === 'listening' ? ACCENT.listening : ACCENT.reading} />}
          </div>
        </div>

        {filtered.length === 0 ? (
          <SurfaceCard className="py-12 text-center">
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
            >
              <IconSearch size={24} />
            </div>
            <h3 className="text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Không có tài nguyên phù hợp
            </h3>
            <p className="mt-1 text-body" style={{ color: 'var(--theme-text-muted)' }}>
              Thử bỏ bớt bộ lọc hoặc tìm bằng tên nguồn như DW, Easy German, ARD.
            </p>
          </SurfaceCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </AppPageShell>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  getLabel,
  getColor,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  getLabel: (option: T) => string;
  getColor: (option: T) => string;
  onChange: (option: T) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-caption font-black uppercase" style={{ color: 'var(--theme-text-muted)' }}>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;
          const color = getColor(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className="rounded-lg border px-3 py-2 text-caption font-extrabold transition-all"
              style={{
                backgroundColor: active ? color : 'transparent',
                borderColor: active ? color : 'var(--theme-border)',
                color: active ? 'white' : 'var(--theme-text-secondary)',
                boxShadow: active ? `0 8px 20px ${color}26` : 'none',
              }}
            >
              {getLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResourceCard({ resource }: { resource: AuthenticResource }) {
  const color = LEVEL_COLORS[resource.level];
  const TypeIcon = TYPE_ICONS[resource.type] || IconGlobe;

  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="group block h-full">
      <SurfaceCard
        variant="interactive"
        className="flex h-full flex-col gap-4 p-5"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
              aria-hidden
            >
              <TypeIcon size={19} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md px-2 py-0.5 text-caption font-black text-white" style={{ backgroundColor: color }}>
                  {resource.level}
                </span>
                <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>
                  {TYPE_LABELS[resource.type]}
                </span>
              </div>
              <p className="mt-1 truncate text-caption font-bold" style={{ color }}>
                {resource.source}
              </p>
            </div>
          </div>
          <IconExternalLink
            size={17}
            className="mt-1 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: 'var(--theme-text-muted)' }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-h3 font-extrabold leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
            {resource.titleVi}
          </h3>
          <p className="mt-1 text-caption font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
            {resource.title}
          </p>
          <p className="mt-3 line-clamp-3 text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            {resource.descriptionVi}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--theme-border)' }}>
          <span
            className="rounded-md px-2.5 py-1 text-caption font-bold"
            style={{
              backgroundColor: resource.free ? `${ACCENT.reading}14` : `${ACCENT.xp}16`,
              color: resource.free ? ACCENT.reading : ACCENT.xp,
            }}
          >
            {resource.free ? 'Miễn phí' : 'Có trả phí'}
          </span>
          <span className="text-caption font-bold" style={{ color: 'var(--theme-text-muted)' }}>
            {SKILL_LABELS[resource.skill]}
          </span>
        </div>
      </SurfaceCard>
    </a>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="text-h3 font-black leading-none" style={{ color: 'var(--theme-text-primary)' }}>
        {value}
      </div>
      <div className="mt-1 text-caption font-bold" style={{ color: 'var(--theme-text-muted)' }}>
        {label}
      </div>
    </div>
  );
}

function ActiveChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-lg px-2.5 py-1 text-caption font-bold"
      style={{ backgroundColor: `${color}16`, color }}
    >
      {label}
    </span>
  );
}
