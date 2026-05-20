import { Skeleton } from '@pkg/ui'

const OrdersLoading = () => (
  <div className="flex flex-col gap-6">
    <div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-48 mt-1.5" />
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-9 w-36" />
    </div>
    <div className="rounded-xl border border-border overflow-hidden">
      <Skeleton className="h-11 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full mt-px" />
      ))}
    </div>
  </div>
)

export default OrdersLoading
