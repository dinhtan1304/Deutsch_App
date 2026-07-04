import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useGrammarAnalyzerStore } from '@/stores/grammarAnalyzerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { grammarAnalyzeApi, GrammarAnalysisResult } from '@/lib/api/grammar-analyze';

/**
 * Session cache: chọn lại cùng câu (cùng level + locale) trả kết quả tức thì,
 * không gọi lại API. Map giữ tối đa MAX_CACHE entries, evict entry cũ nhất.
 */
const MAX_CACHE = 50;
const resultCache = new Map<string, GrammarAnalysisResult>();

function cacheKey(locale: string, level: string, sentence: string): string {
  return `${locale}|${level}|${sentence.trim().replace(/\s+/g, ' ')}`;
}

/**
 * Hook để trigger phân tích ngữ pháp.
 * Gọi API Gemini → cập nhật store.
 */
export function useGrammarAnalyze() {
  const locale = useLocale();
  const preferredLevel = useSettingsStore((s) => s.settings.preferredLevel);
  const { selectedSentence, startAnalysis, setResult, setError } =
    useGrammarAnalyzerStore();

  const analyze = useCallback(async () => {
    if (!selectedSentence) return;

    // 'all' là filter cho games/từ vựng, không phải trình độ — fallback A1
    const level = preferredLevel === 'all' ? 'A1' : preferredLevel;
    const key = cacheKey(locale, level, selectedSentence);

    startAnalysis();

    const cached = resultCache.get(key);
    if (cached) {
      setResult(cached);
      return;
    }

    try {
      const result = await grammarAnalyzeApi.analyze(selectedSentence, level);
      if (resultCache.size >= MAX_CACHE) {
        const oldest = resultCache.keys().next().value;
        if (oldest !== undefined) resultCache.delete(oldest);
      }
      resultCache.set(key, result);
      setResult(result);
    } catch (err) {
      const msg = (err as Error | undefined)?.message || 'Không thể phân tích. Vui lòng thử lại.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, [selectedSentence, locale, preferredLevel, startAnalysis, setResult, setError]);

  return { analyze };
}
