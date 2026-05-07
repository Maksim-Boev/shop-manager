'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { IBreadcrumbContextValue, IBreadcrumbItem } from './types'

const BreadcrumbContext = createContext<IBreadcrumbContextValue | null>(null)

interface IProviderProps {
  children: React.ReactNode
}

const BreadcrumbProvider = ({ children }: IProviderProps) => {
  const [items, setItems] = useState<IBreadcrumbItem[]>([])

  const value = useMemo(() => ({ items, setItems }), [items])

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}

const useBreadcrumbContext = () => {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) throw new Error('useBreadcrumb must be used within BreadcrumbProvider')
  return ctx
}

const useBreadcrumb = (items: IBreadcrumbItem[]) => {
  const { setItems } = useBreadcrumbContext()
  const serialized = JSON.stringify(items)

  const apply = useCallback(() => {
    setItems(JSON.parse(serialized) as IBreadcrumbItem[])
  }, [serialized, setItems])

  useEffect(() => {
    apply()
    return () => setItems([])
  }, [apply, setItems])
}

export { BreadcrumbProvider, useBreadcrumb, useBreadcrumbContext }
