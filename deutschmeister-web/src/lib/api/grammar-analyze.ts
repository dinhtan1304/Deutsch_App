import { apiPost } from './client';

// ── Response types matching BE ──

export interface GrammarComponent {
  text: string;
  role: string;
  roleVi: string;
  case?: string;
  caseVi?: string;
  noteVi: string;
}

export interface GrammarRule {
  rule: string;
  ruleVi: string;
}

export interface GrammarAnalysisResult {
  sentence: string;
  correctedSentence: string;
  hasErrors: boolean;
  tense: string;
  tenseVi: string;
  sentenceType: string;
  sentenceTypeVi: string;
  components: GrammarComponent[];
  explanationVi: string;
  grammarRules: GrammarRule[];
  tipVi: string;
}

export const grammarAnalyzeApi = {
  analyze: async (sentence: string, cefrLevel?: string): Promise<GrammarAnalysisResult> => {
    return apiPost<GrammarAnalysisResult>('/ai/grammar-analyze', {
      sentence,
      cefrLevel: cefrLevel || 'A1',
    });
  },
};
