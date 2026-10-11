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

export function openReleaseNotes() {
  window.dispatchEvent(new Event('dm:release-notes'));
}
