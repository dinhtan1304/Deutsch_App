import { GridSkeleton, Skeleton } from '@/components/ui';

export default function ProfileLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="w-64 h-8" />
      <Skeleton className="w-full h-32" />
      <GridSkeleton cols={2} count={4} height="h-40" bordered />
    </div>
  );
}
