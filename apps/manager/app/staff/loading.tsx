import { Skeleton } from '@pkg/ui'

const StaffLoading = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-10 w-full" />
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  </div>
)

export default StaffLoading
