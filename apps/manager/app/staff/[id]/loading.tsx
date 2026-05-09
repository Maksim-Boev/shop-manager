import { Skeleton } from '@pkg/ui'

const StaffDetailLoading = () => (
  <div className="space-y-6 max-w-4xl">
    <div className="flex items-center gap-3">
      <Skeleton className="size-8 rounded-lg" />
      <Skeleton className="h-4 w-40" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
    <Skeleton className="h-48 rounded-xl" />
  </div>
)

export default StaffDetailLoading
