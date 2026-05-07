import { Skeleton } from '@pkg/ui'

const TransfersLoading = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-9 w-44" />
    </div>
    <Skeleton className="h-10 w-full" />
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
)

export default TransfersLoading
