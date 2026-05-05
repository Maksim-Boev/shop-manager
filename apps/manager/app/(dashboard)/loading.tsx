import { Skeleton } from '@pkg/ui'

const DashboardLoading = () => (
  <div className="space-y-6 max-w-400">
    <Skeleton className="h-8 w-64" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  </div>
)

export default DashboardLoading
