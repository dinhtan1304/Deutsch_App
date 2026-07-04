/**
 * Small text/string utilities shared across features.
 */

/**
 * Levenshtein edit distance between two strings.
 * Used for fuzzy matching (near-miss dictation answers, fuzzy pronunciation).
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i]![j] = a[i - 1] === b[j - 1]
      ? dp[i - 1]![j - 1]!
      : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
  return dp[m]![n]!;
}

/**
 * A "near miss" is a non-empty answer that is wrong but within `maxDistance`
 * edits of the expected word (case-insensitive, trimmed) — i.e. a likely typo.
 * Returns false for empty answers or an exact (case-insensitive) match.
 */
export function isNearMiss(answer: string, expected: string, maxDistance = 1): boolean {
  const a = answer.trim().toLowerCase();
  const b = expected.trim().toLowerCase();
  if (!a || !b || a === b) return false;
  return levenshtein(a, b) <= maxDistance;
}
