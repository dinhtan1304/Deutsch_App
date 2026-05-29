import { GridSkeleton, Skeleton } from '@/components/ui';

export default function GamesLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="w-64 h-8" />
      <GridSkeleton cols={3} count={6} height="h-40" bordered />
    </div>
  );
}
