import { Skeleton } from '@pkg/ui'

const ProductsLoading = () => (
  <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>

    <div className="flex gap-3">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-44" />
    </div>

    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-border last:border-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  </div>
)

export default ProductsLoading
