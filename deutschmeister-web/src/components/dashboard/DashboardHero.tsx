'use client';

import { useNextAction, useDailyPath } from '@/hooks/useDashboard';
import { ActionCard, type ActionCardTask } from '@/components/ui/ActionCard';
import type { NextAction } from '@/lib/api/dashboard';
import type { AccentKey } from '@/lib/tokens';

/**
 * Dashboard hero — merges HeroActionCard (single recommendation) with
 * TodayFocusCard (task checklist + progress) into one ActionCard.
 *
 * Data:
 *  - useNextAction() — headline recommendation (priority, title, subtitle, CTA)
 *  - useDailyPath()  — task chips + progress bar
 */

function priorityAccent(priority: NextAction['priority']): AccentKey {
  switch (priority) {
    case 'srs_urgent':  return 'speaking';   // rose — urgent tone
    case 'srs_normal':  return 'writing';    // indigo
    case 'study_plan':  return 'vocab';      // violet
    case 'streak_risk': return 'games';      // orange
    case 'weak_skill':  return 'reading';    // green
    default:            return 'brand';
  }
}

function priorityIcon(name: string) {
  const props = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'flame':
      return <svg {...props} fill="currentColor" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
    case 'pencil':
      return <svg {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>;
    case 'book':
      return <svg {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
    case 'zap':
      return <svg {...props} fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case 'target':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
    case 'check-circle':
      return <svg {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
  }
}

function taskIcon(type: string) {
  const props = { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'learn_words':
      return <svg {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
    case 'review':
      return <svg {...props}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
    case 'quiz':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
    case 'reading':
      return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10" /></svg>;
  }
}

function HeroSkeleton() {
  return (
    <div
      className="rounded-lg p-6 animate-pulse"
      style={{ backgroundColor: 'var(--theme-bg-secondary)', minHeight: 140 }}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-md shrink-0" style={{ backgroundColor: 'var(--theme-border)' }} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-48 rounded" style={{ backgroundColor: 'var(--theme-border)' }} />
          <div className="h-3 w-64 rounded" style={{ backgroundColor: 'var(--theme-border)' }} />
        </div>
      </div>
    </div>
  );
}

export function DashboardHero() {
  const { data: next, isLoading: nextLoading } = useNextAction();
  const { data: daily } = useDailyPath();

  if (nextLoading || !next) return <HeroSkeleton />;

  const accent = priorityAccent(next.priority);
  const isUrgent = next.priority === 'srs_urgent';

  const tasks: ActionCardTask[] | undefined = daily?.tasks.map(t => ({
    icon: taskIcon(t.type),
    label: t.title,
    done: t.completed,
    href: t.href,
  }));

  const progress = daily && daily.totalCount > 0
    ? { current: daily.completedCount, total: daily.totalCount, label: 'Mục tiêu hôm nay' }
    : undefined;

  return (
    <ActionCard
      icon={priorityIcon(next.icon)}
      title={next.title}
      subtitle={next.subtitle}
      accent={accent}
      badge={next.badge ? { label: next.badge, tone: isUrgent ? 'urgent' : 'default' } : undefined}
      progress={progress}
      tasks={tasks}
      cta={{ label: next.ctaText, href: next.href }}
    />
  );
}
