import { Skeleton } from '@pkg/ui'

const WarehouseLoading = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-9 w-72" />
    </div>
    <Skeleton className="h-10 w-full" />
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
)

export default WarehouseLoading
