import { apiGet } from './client';

export interface ExplainSection {
  titleVi: string;
  content: string;
  table: { headers: string[]; rows: string[][] } | null;
}

export interface GrammarExplain {
  found: boolean;
  slug?: string;
  titleVi?: string;
  section?: ExplainSection;
}

/**
 * Fetch the curated "rule card" for a concept (errorType or trainer skillTag).
 * Returns { found:false } when no lesson is mapped.
 */
export function explainConcept(concept: string): Promise<GrammarExplain> {
  return apiGet<GrammarExplain>(`/grammar/explain?concept=${encodeURIComponent(concept)}`);
}
