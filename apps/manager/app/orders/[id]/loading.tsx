import { Skeleton } from '@pkg/ui'

const OrderDetailLoading = () => (
  <div className="flex flex-col gap-6">
    <Skeleton className="h-5 w-64" />
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <div className="lg:col-span-2">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  </div>
)

export default OrderDetailLoading
