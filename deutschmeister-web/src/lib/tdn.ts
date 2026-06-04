/**
 * TestDaF reports a TDN level (TestDaF-Niveaustufe) 3/4/5 per section; below
 * TDN 3 the result is "unter TDN 3". These cut-offs are an approximation used
 * for practice feedback — the real exam uses its own scaling.
 *
 * Rough CEFR alignment: TDN 5 ≈ C1, TDN 4 ≈ B2.2/C1.1, TDN 3 ≈ B2.1.
 */
export interface TdnResult {
  band: 3 | 4 | 5 | null; // null = unter TDN 3
  label: string;          // "TDN 5" | "TDN 4" | "TDN 3" | "unter TDN 3"
  cefr: string;           // approximate CEFR span
}

export function scoreToTdn(percent: number): TdnResult {
  if (percent >= 85) return { band: 5, label: 'TDN 5', cefr: 'C1' };
  if (percent >= 70) return { band: 4, label: 'TDN 4', cefr: 'B2.2 – C1.1' };
  if (percent >= 55) return { band: 3, label: 'TDN 3', cefr: 'B2.1' };
  return { band: null, label: 'unter TDN 3', cefr: '< B2.1' };
}
