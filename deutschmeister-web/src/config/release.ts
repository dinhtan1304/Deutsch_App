// Bump only when a release is ready to ship. Dismissal is scoped to this ID.
export const APP_RELEASE = {
  id: 'game-topics-update-2026-10',
  version: '2.2',
  date: '2026-10-10',
  highlights: [
    'newGames',
    'adaptiveGames',
    'dailySession',
    'errorNotebook',
    'offline',
    'practicePacks',
    'reliability',
  ] as const,
};

// Hub pages only: automatic announcements never cover an exercise, an OAuth
// callback, onboarding, or an administrator's workflow.
export const ANNOUNCEMENT_PAGES: readonly string[] = [
  '/',
  '/dashboard',
  '/smart-review',
  '/learning-session',
  '/error-notebook',
  '/resources',
  '/settings',
  '/topics',
  '/practice-test',
  '/games',
  '/pricing',
];

export function openReleaseNotes() {
  window.dispatchEvent(new Event('dm:release-notes'));
}
