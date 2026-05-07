'use client'

import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'
import { Fragment } from 'react'
import { useBreadcrumbContext } from './BreadcrumbContext'

const Breadcrumb = () => {
  const { items } = useBreadcrumbContext()

  if (items.length === 0) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <Fragment key={`${item.label}-${idx}`}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-foreground font-medium' : undefined}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRightIcon className="size-3.5 shrink-0" />}
          </Fragment>
        )
      })}
    </nav>
  )
}

export { Breadcrumb }
