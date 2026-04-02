'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dictionaryLookupApi } from '@/lib/api/dictionary-lookup';

interface QuickAddParams {
  word: string;
  translationVi?: string | null;
  translationEn?: string | null;
  wordType?: string | null;
  gender?: string | null;
  plural?: string | null;
  example?: string | null;
  level?: string | null;
}

export function useQuickAddWithCollection() {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [pendingWordId, setPendingWordId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const quickAdd = useCallback(async (data: QuickAddParams) => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      const result = await dictionaryLookupApi.quickAdd(data);
      setIsAdded(true);
      setPendingWordId(result.id);
      queryClient.invalidateQueries({ queryKey: ['personal-words'] });
      queryClient.invalidateQueries({ queryKey: ['word-bank-check', data.word] });
    } catch {
      // Word might already exist (409) — try to get existing ID for picker
      try {
        const check = await dictionaryLookupApi.checkInWordBank(data.word);
        if (check.exists && check.personalWordId) {
          setIsAdded(true);
          setPendingWordId(check.personalWordId);
          return;
        }
      } catch { /* ignore */ }
      // Fallback: mark as added but no picker
      setIsAdded(true);
    } finally {
      setIsAdding(false);
    }
  }, [isAdding, queryClient]);

  const closePicker = useCallback(() => setPendingWordId(null), []);

  const reset = useCallback(() => {
    setPendingWordId(null);
    setIsAdded(false);
    setIsAdding(false);
  }, []);

  return { isAdding, isAdded, pendingWordId, quickAdd, closePicker, reset };
}
