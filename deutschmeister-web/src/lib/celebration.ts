/**
 * Triggers a celebration modal when a game session scores ≥ 80.
 * Fires at most once per game per calendar day (localStorage gate).
 */
export function triggerCelebration(score: number, gameId: string): boolean {
  if (score < 80) return false;
  if (typeof window === 'undefined') return false;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `celeb:${gameId}:${today}`;
  if (localStorage.getItem(key)) return false;

  localStorage.setItem(key, '1');
  return true;
}
