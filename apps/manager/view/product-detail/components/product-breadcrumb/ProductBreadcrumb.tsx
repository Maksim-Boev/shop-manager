import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'
import type { IProductBreadcrumbProps } from './types'

const ProductBreadcrumb = ({ productName }: IProductBreadcrumbProps) => (
  <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
    <Link href="/products" className="hover:text-foreground transition-colors">
      Каталог
    </Link>
    <ChevronRightIcon className="size-3.5 shrink-0" />
    <span className="text-foreground font-medium truncate max-w-xs">{productName}</span>
  </nav>
)

export { ProductBreadcrumb }
