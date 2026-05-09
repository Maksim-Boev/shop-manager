import { Skeleton } from '@pkg/ui'

const ProductDetailLoading = () => (
  <div className="flex flex-col gap-6">
    <Skeleton className="h-5 w-48" />

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <div className="lg:col-span-2">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  </div>
)

export default ProductDetailLoading
