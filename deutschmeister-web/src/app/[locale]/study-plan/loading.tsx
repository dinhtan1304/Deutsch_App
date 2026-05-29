import { GridSkeleton, Skeleton } from '@/components/ui';

export default function StudyPlanLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="w-56 h-8" />
      <Skeleton className="w-full max-w-xl h-24" />
      <GridSkeleton cols={1} count={4} height="h-24" bordered />
    </div>
  );
}
