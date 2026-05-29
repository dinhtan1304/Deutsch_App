import { GridSkeleton, Skeleton } from '@/components/ui';

export default function PracticeTestLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="w-72 h-8" />
      <Skeleton className="w-full max-w-2xl h-5" />
      <GridSkeleton cols={2} count={6} height="h-40" bordered />
    </div>
  );
}
