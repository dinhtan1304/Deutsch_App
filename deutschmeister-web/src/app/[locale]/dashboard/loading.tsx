import { StatsSkeleton, GridSkeleton, Skeleton } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="w-64 h-8" />
      <StatsSkeleton />
      <GridSkeleton cols={2} count={4} height="h-48" bordered />
      <GridSkeleton cols={3} count={6} height="h-32" bordered />
    </div>
  );
}
