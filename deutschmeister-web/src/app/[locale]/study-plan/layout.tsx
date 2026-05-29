import { RequireAuth } from '@/components/ui';

export default function StudyPlanLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
