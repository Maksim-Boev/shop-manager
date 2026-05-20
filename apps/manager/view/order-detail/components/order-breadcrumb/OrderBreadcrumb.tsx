import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'
import type { IOrderBreadcrumbProps } from './types'

const OrderBreadcrumb = ({ orderNumber }: IOrderBreadcrumbProps) => (
  <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
    <Link href="/orders" className="hover:text-foreground transition-colors">Продажі</Link>
    <ChevronRightIcon className="size-3.5 shrink-0" />
    <span className="text-foreground font-medium">#{orderNumber}</span>
  </nav>
)

export { OrderBreadcrumb }
