import { useQuery } from '@tanstack/react-query';
import { explainConcept } from '@/lib/api/grammarExplain';

/**
 * Fetch the curated rule card for a concept. Grammar theory is static, so the
 * result is cached forever and shared across every wrong-answer surface.
 */
export function useGrammarExplain(concept: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['grammar-explain', concept],
    queryFn: () => explainConcept(concept as string),
    enabled: enabled && !!concept,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });
}
