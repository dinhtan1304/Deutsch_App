import { GridSkeleton, Skeleton } from '@/components/ui';

export default function WordBankLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="w-72 h-8" />
      <Skeleton className="w-full h-12" />
      <GridSkeleton cols={2} count={8} height="h-28" bordered />
    </div>
  );
}
