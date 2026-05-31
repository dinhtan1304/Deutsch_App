'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  IconArrowRight, IconCheck, IconLayers, IconHeadphones, IconGamepad,
  IconBookOpen, IconBrain, IconRefresh, IconTarget, IconPenLine,
} from '@/components/ui/Icons';
import type { NextAction, DailyPath } from '@/types/dashboard';

interface Props {
  nextAction?: NextAction;
  dailyPath?: DailyPath;
}

// Map a daily-task type → session-part icon (v2 part cards).
const TASK_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  srs: IconLayers, review: IconLayers, flashcard: IconLayers,
  listening: IconHeadphones, listen: IconHeadphones,
  game: IconGamepad, quiz: IconGamepad,
  reading: IconBookOpen, read: IconBookOpen,
  writing: IconPenLine, write: IconPenLine,
  grammar: IconBrain,
};
function taskIcon(type: string) {
  return TASK_ICON[type] ?? IconRefresh ?? IconTarget;
}

/**
 * v2 primary session — the single hero CTA. Bundles today's path into one card:
 * section label + smart next-action headline + the first daily tasks as "parts".
 */
export function PrimarySessionV2({ nextAction, dailyPath }: Props) {
  const t = useTranslations('dashboard');

  const tasks = (dailyPath?.tasks ?? []).slice(0, 3);
  const completed = dailyPath?.completedCount ?? 0;
  const total = dailyPath?.totalCount ?? tasks.length;
  const href = nextAction?.href ?? '/review';
  const cta = nextAction?.ctaText ?? t('v2.sessionStart');

  return (
    <section
      className="relative overflow-hidden rounded-2xl p-6"
      style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', marginBottom: 4 }}
    >
      {/* accent rail */}
      <span className="v2-accent-rail absolute left-0 top-0 bottom-0 w-[3px]" aria-hidden />

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-caption font-semibold uppercase"
              style={{ color: 'var(--accent)', letterSpacing: '.08em' }}
            >
              {t('v2.sessionLabel')}
            </span>
            {nextAction?.badge && (
              <span
                className="text-caption font-bold px-1.5 py-0.5 rounded mono"
                style={{ background: 'var(--streak-soft)', color: 'var(--streak)' }}
              >
                {nextAction.badge}
              </span>
            )}
          </div>
          <h2 className="font-bold" style={{ fontSize: 22, letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>
            {nextAction?.title ?? t('todayHero.title')}
          </h2>
          {nextAction?.subtitle && (
            <p className="mt-1.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
              {nextAction.subtitle}
            </p>
          )}
        </div>

        {total > 0 && (
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-caption mono" style={{ color: 'var(--theme-text-muted)' }}>{completed}/{total}</span>
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 24, height: 4,
                    background: i < completed ? 'var(--accent)' : 'var(--theme-bg-secondary)',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Session parts */}
      {tasks.length > 0 && (
        <div className="grid gap-2.5 mb-4" style={{ gridTemplateColumns: `repeat(${tasks.length}, minmax(0,1fr))` }}>
          {tasks.map((task, i) => {
            const TaskIcon = taskIcon(task.type);
            return (
            <div
              key={task.missionKey ?? `${task.type}-${i}`}
              className="flex items-center gap-3 rounded-xl px-3.5 py-3"
              style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: task.completed ? 'color-mix(in srgb, var(--m-learned) 18%, transparent)' : 'var(--theme-bg-tertiary)',
                  color: task.completed ? 'var(--m-learned)' : 'var(--accent)',
                }}
              >
                {task.completed ? <IconCheck size={16} /> : <TaskIcon size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-body font-semibold truncate"
                  style={{ color: 'var(--theme-text-primary)', textDecoration: task.completed ? 'line-through' : undefined }}
                >
                  {task.title}
                </div>
                <div className="text-caption mono mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {task.progressLabel ?? task.description}
                  {task.xpReward ? ` · +${task.xpReward} XP` : ''}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <Link
        href={href}
        className="inline-flex items-center gap-2 h-11 px-5 rounded-xl font-bold transition-transform hover:-translate-y-0.5"
        style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)' }}
      >
        {cta}
        <IconArrowRight size={16} />
      </Link>
    </section>
  );
}
