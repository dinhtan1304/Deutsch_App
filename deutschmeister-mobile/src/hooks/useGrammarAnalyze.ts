import { useCallback } from 'react';
import { useGrammarAnalyzerStore } from '@/stores/grammarAnalyzerStore';
import { grammarAnalyzeApi } from '@/lib/api/grammar-analyze';

/**
 * Hook để trigger phân tích ngữ pháp.
 * Gọi API Gemini → cập nhật store.
 */
export function useGrammarAnalyze() {
  const { selectedSentence, startAnalysis, setResult, setError } =
    useGrammarAnalyzerStore();

  const analyze = useCallback(async () => {
    if (!selectedSentence) return;

    startAnalysis();

    try {
      const result = await grammarAnalyzeApi.analyze(selectedSentence);
      setResult(result);
    } catch (err: any) {
      const msg = err?.message || 'Không thể phân tích. Vui lòng thử lại.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, [selectedSentence, startAnalysis, setResult, setError]);

  return { analyze };
}
