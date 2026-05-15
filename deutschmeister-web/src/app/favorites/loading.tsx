import { GridSkeleton, Skeleton } from '@/components/ui';

export default function FavoritesLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="w-56 h-8" />
      <GridSkeleton cols={2} count={6} height="h-28" bordered />
    </div>
  );
}
