'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@pkg/ui'
import type { IWarehouseSelectorProps } from './types'

const WarehouseSelector = ({ warehouses, activeId }: IWarehouseSelectorProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('warehouseId', next)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={activeId} onValueChange={handleChange}>
      <SelectTrigger className="w-72">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {warehouses.map(w => (
          <SelectItem key={w.id} value={w.id}>
            <span>{w.name}</span>
            {w.address && (
              <span className="text-xs text-slate-500 dark:text-muted-foreground ml-2">
                {w.address}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { WarehouseSelector }
