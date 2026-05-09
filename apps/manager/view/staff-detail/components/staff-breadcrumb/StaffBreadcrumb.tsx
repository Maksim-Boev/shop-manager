'use client'

import { useMemo } from 'react'
import { useBreadcrumb } from '@/components/layout/breadcrumb'
import type { IStaffBreadcrumbProps } from './types'

const StaffBreadcrumb = ({ firstName, lastName }: IStaffBreadcrumbProps) => {
  const crumbs = useMemo(
    () => [
      { label: 'Персонал', href: '/staff' },
      { label: `${firstName} ${lastName}` },
    ],
    [firstName, lastName],
  )
  useBreadcrumb(crumbs)
  return null
}

export { StaffBreadcrumb }
