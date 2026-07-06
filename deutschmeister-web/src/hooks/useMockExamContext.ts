'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Mock-exam integration for the 4 per-skill exam answering pages.
 *
 * When a page is opened with `?mock=<mockExamId>` it is one module of a full
 * mock sitting: after submit the user must return to the sitting cockpit
 * instead of the per-skill result page — a real exam never reveals answers
 * between modules. The result stays available from the final score report.
 */
export function useMockExamContext() {
  const searchParams = useSearchParams();
  const mockId = searchParams.get('mock');
  return {
    mockId,
    isMock: !!mockId,
    cockpitHref: mockId ? `/practice-test/mock-exam/${mockId}` : null,
  };
}
