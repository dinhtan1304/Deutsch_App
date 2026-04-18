import { useQuery } from '@tanstack/react-query';
import { translateText, detectLang, type TranslateLang } from '@/lib/api/translation';

export function useAutoTranslate(text: string, langOverride?: TranslateLang) {
  const trimmed = text.trim();
  const isPhrase = trimmed.split(/\s+/).length > 1 && trimmed.length >= 3;
  const from = langOverride ?? detectLang(trimmed);
  const to: TranslateLang = from === 'vi' ? 'de' : 'vi';

  const query = useQuery({
    queryKey: ['translate', trimmed, from, to],
    queryFn: () => translateText(trimmed, from, to),
    enabled: isPhrase,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { ...query, isLoading: query.isFetching, isPhrase, from, to };
}
