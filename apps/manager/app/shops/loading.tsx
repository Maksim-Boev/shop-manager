import { Skeleton } from '@pkg/ui'

const ShopsLoading = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-9 w-36" />
    </div>
    <Skeleton className="h-10 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-52 rounded-2xl" />
      ))}
    </div>
  </div>
)

export default ShopsLoading
