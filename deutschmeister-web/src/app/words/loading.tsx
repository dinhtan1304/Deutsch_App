import { GridSkeleton, Skeleton } from '@/components/ui';

export default function WordsLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="w-64 h-8" />
      <Skeleton className="w-full h-12" />
      <GridSkeleton cols={3} count={9} height="h-32" bordered />
    </div>
  );
}
