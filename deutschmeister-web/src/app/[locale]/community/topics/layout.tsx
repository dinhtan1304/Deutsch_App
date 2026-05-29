import { RequireAuth } from '@/components/ui';

export default function CommunityTopicsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
